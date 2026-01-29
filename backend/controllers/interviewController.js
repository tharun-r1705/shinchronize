const asyncHandler = require('../utils/asyncHandler');
const Student = require('../models/Student');
const InterviewSession = require('../models/InterviewSession');
const {
  generateNextQuestion,
  evaluateAnswer,
  groqTranscribeAudio,
  computeFillerWordsMetrics,
  estimateWordCount,
} = require('../utils/interviewEngine');
const { extractTextFromPDF } = require('../utils/pdfExtractor');

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function inferQuestionsTarget(sessionType) {
  return sessionType === 'full' ? 12 : 5;
}

function normalizeInterviewTypes(types) {
  if (!Array.isArray(types) || types.length === 0) return ['technical-domain', 'behavioral', 'project'];
  return types.filter((t) => typeof t === 'string' && t.trim()).map((t) => t.trim());
}

// POST /api/students/interview/start
const startInterviewSession = asyncHandler(async (req, res) => {
  const studentId = req.user?._id;
  const {
    sessionType = 'quick',
    interviewTypes = ['technical-domain', 'behavioral', 'project'],
    difficulty = 'intermediate',
    interviewerPersona = 'neutral',
    targetRole = 'Software Engineer',
  } = req.body || {};

  const student = await Student.findById(studentId);
  if (!student) return res.status(404).json({ message: 'Student not found' });

  const types = normalizeInterviewTypes(interviewTypes);
  const questionsTarget = inferQuestionsTarget(sessionType);

  let resumeContext = '';
  
  // Extract text from PDF if uploaded
  if (req.file && req.file.buffer) {
    try {
      resumeContext = await extractTextFromPDF(req.file.buffer);
      // Limit resume context to 15000 characters
      resumeContext = resumeContext.slice(0, 15000);
    } catch (error) {
      return res.status(400).json({ message: `Failed to process resume: ${error.message}` });
    }
  }

  const firstQ = await generateNextQuestion({
    resumeContext,
    targetRole,
    interviewTypes: types,
    difficulty,
    interviewerPersona,
    askedQuestions: [],
    lastAnswer: '',
  });

  const session = await InterviewSession.create({
    studentId,
    sessionType,
    interviewTypes: types,
    difficulty,
    interviewerPersona,
    targetRole,
    resumeContext,
    questionsTarget,
    status: 'in-progress',
    currentQuestionIndex: 0,
    questions: [firstQ],
  });

  // Stats update (session started)
  student.interviewStats = student.interviewStats || {};
  student.interviewStats.totalSessions = (student.interviewStats.totalSessions || 0) + 1;
  await student.save();

  res.json({
    sessionId: session._id,
    question: session.questions[0],
    progress: { current: 1, total: session.questionsTarget },
    sessionConfig: {
      sessionType: session.sessionType,
      difficulty: session.difficulty,
      interviewerPersona: session.interviewerPersona,
      interviewTypes: session.interviewTypes,
      targetRole: session.targetRole,
    },
  });
});

// POST /api/students/interview/:sessionId/answer
const submitInterviewAnswer = asyncHandler(async (req, res) => {
  const studentId = req.user?._id;
  const { sessionId } = req.params;

  const session = await InterviewSession.findOne({ _id: sessionId, studentId });
  if (!session) return res.status(404).json({ message: 'Interview session not found' });
  if (session.status !== 'in-progress') {
    return res.status(400).json({ message: `Session is not active (status: ${session.status})` });
  }

  const questionId = (req.body?.questionId || '').toString();
  const answerMethod = (req.body?.answerMethod || 'text').toString();
  const answerTextRaw = (req.body?.answer || '').toString();
  const language = (req.body?.language || 'en').toString();

  const idx = session.questions.findIndex((q) => q.id === questionId);
  if (idx < 0) return res.status(400).json({ message: 'Invalid questionId' });

  let transcript = answerTextRaw;
  let voiceMetrics = null;

  if (answerMethod === 'voice') {
    if (!req.file) {
      return res.status(400).json({ message: 'Audio file is required for voice answers' });
    }

    transcript = await groqTranscribeAudio(req.file.buffer, req.file.originalname, req.file.mimetype, language);
    const fillerWords = computeFillerWordsMetrics(transcript);
    const wordCount = estimateWordCount(transcript);
    voiceMetrics = {
      durationSeconds: Number(req.body?.durationSeconds) || 0,
      wordCount,
      fillerWords,
    };
  }

  if (!transcript.trim()) {
    return res.status(400).json({ message: 'Answer is required' });
  }

  const q = session.questions[idx];
  const feedback = await evaluateAnswer({
    question: q.question,
    answer: transcript,
    type: q.type,
    targetRole: session.targetRole,
    voiceMetrics,
  });

  // Save answer + feedback
  q.answer = transcript;
  q.answerMethod = answerMethod === 'voice' ? 'voice' : 'text';
  if (voiceMetrics) {
    q.voiceMetrics = voiceMetrics;
  }
  q.answeredAt = new Date();
  q.feedback = feedback;

  // Stats update
  const student = await Student.findById(studentId);
  if (student) {
    student.interviewStats = student.interviewStats || {};
    student.interviewStats.totalQuestionsAnswered = (student.interviewStats.totalQuestionsAnswered || 0) + 1;
    student.interviewStats.lastSessionAt = new Date();
    await student.save();
  }

  // Determine whether to generate next question
  const answeredCount = session.questions.filter((qq) => (qq.answer || '').trim()).length;
  const shouldContinue = answeredCount < session.questionsTarget;

  let nextQuestion = null;
  if (shouldContinue) {
    const asked = session.questions.map((qq) => qq.question);
    nextQuestion = await generateNextQuestion({
      resumeContext: session.resumeContext,
      targetRole: session.targetRole,
      interviewTypes: session.interviewTypes,
      difficulty: session.difficulty,
      interviewerPersona: session.interviewerPersona,
      askedQuestions: asked,
      lastAnswer: transcript,
    });
    session.questions.push(nextQuestion);
    session.currentQuestionIndex = session.questions.length - 1;
  }

  await session.save();

  if (shouldContinue) {
    nextQuestion = session.questions[session.questions.length - 1];
  }

  res.json({
    transcription: answerMethod === 'voice' ? transcript : undefined,
    voiceMetrics,
    feedback,
    nextQuestion,
    progress: { current: Math.min(answeredCount, session.questionsTarget), total: session.questionsTarget },
    done: !shouldContinue,
  });
});

// POST /api/students/interview/:sessionId/complete
const completeInterviewSession = asyncHandler(async (req, res) => {
  const studentId = req.user?._id;
  const { sessionId } = req.params;

  const session = await InterviewSession.findOne({ _id: sessionId, studentId });
  if (!session) return res.status(404).json({ message: 'Interview session not found' });
  if (session.status !== 'in-progress') {
    return res.status(400).json({ message: `Session is not active (status: ${session.status})` });
  }

  const answered = session.questions.filter((q) => (q.answer || '').trim());
  const scores = answered.map((q) => Number(q.feedback?.score) || 0);
  const overall = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  // Calculate communication score
  const commScores = answered
    .map((q) => {
      const comm = q.feedback?.communication;
      if (!comm) return 0;
      return (Number(comm.clarity) + Number(comm.structure) + Number(comm.conciseness)) / 3;
    })
    .filter((s) => s > 0);
  const commScore = commScores.length ? Math.round(commScores.reduce((a, b) => a + b, 0) / commScores.length) : 0;

  // Calculate category scores (technical, behavioral)
  const techQuestions = answered.filter((q) => q.type === 'technical');
  const behavioralQuestions = answered.filter((q) => q.type === 'behavioral');
  
  const techScore = techQuestions.length 
    ? Math.round(techQuestions.reduce((sum, q) => sum + (Number(q.feedback?.score) || 0), 0) / techQuestions.length)
    : 0;
  
  const behavioralScore = behavioralQuestions.length
    ? Math.round(behavioralQuestions.reduce((sum, q) => sum + (Number(q.feedback?.score) || 0), 0) / behavioralQuestions.length)
    : 0;

  session.summary.overallScore = overall;
  session.summary.categoryScores.technical = techScore;
  session.summary.categoryScores.behavioral = behavioralScore;
  session.summary.categoryScores.communication = commScore;
  session.status = 'completed';
  session.completedAt = new Date();
  session.durationMinutes = clamp(Number(req.body?.durationMinutes) || 0, 0, 600);

  await session.save();

  const student = await Student.findById(studentId);
  if (student) {
    student.interviewStats = student.interviewStats || {};
    student.interviewStats.completedSessions = (student.interviewStats.completedSessions || 0) + 1;
    student.interviewStats.lastSessionAt = new Date();
    student.interviewStats.bestScore = Math.max(student.interviewStats.bestScore || 0, overall);

    // Update avgScore incrementally
    const prevCompleted = (student.interviewStats.completedSessions || 1) - 1;
    const prevAvg = Number(student.interviewStats.avgScore) || 0;
    const newAvg = prevCompleted > 0 ? ((prevAvg * prevCompleted) + overall) / (prevCompleted + 1) : overall;
    student.interviewStats.avgScore = Math.round(newAvg);

    await student.save();
  }

  res.json({
    success: true,
    sessionId: session._id,
    summary: session.summary,
    overallScore: overall,
    answeredCount: answered.length,
    questionsTarget: session.questionsTarget,
  });
});

// GET /api/students/interview/history
const getInterviewHistory = asyncHandler(async (req, res) => {
  const studentId = req.user?._id;
  const page = clamp(Number(req.query?.page) || 1, 1, 100000);
  const limit = clamp(Number(req.query?.limit) || 10, 1, 50);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    InterviewSession.find({ studentId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('sessionType difficulty interviewerPersona targetRole status summary.overallScore createdAt completedAt questionsTarget'),
    InterviewSession.countDocuments({ studentId }),
  ]);

  res.json({
    page,
    limit,
    total,
    items,
  });
});

// GET /api/students/interview/:sessionId
const getInterviewSession = asyncHandler(async (req, res) => {
  const studentId = req.user?._id;
  const { sessionId } = req.params;
  const session = await InterviewSession.findOne({ _id: sessionId, studentId });
  if (!session) return res.status(404).json({ message: 'Interview session not found' });
  res.json({ session });
});

// GET /api/students/interview/stats
const getInterviewStats = asyncHandler(async (req, res) => {
  const studentId = req.user?._id;
  const student = await Student.findById(studentId).select('interviewStats');
  if (!student) return res.status(404).json({ message: 'Student not found' });
  res.json({ interviewStats: student.interviewStats || {} });
});

module.exports = {
  startInterviewSession,
  submitInterviewAnswer,
  completeInterviewSession,
  getInterviewHistory,
  getInterviewSession,
  getInterviewStats,
};
