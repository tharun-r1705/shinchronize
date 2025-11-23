const asyncHandler = require('../utils/asyncHandler');
const InterviewSession = require('../models/InterviewSession');
const Student = require('../models/Student');
const {
  generateInterviewQuestion,
  scoreInterviewAnswer,
  rubricKeys,
  generateTestSummary,
} = require('../utils/mockInterview');

const ensureStudentAccess = (req, targetStudentId) => {
  if (req.userRole === 'student' && String(req.user._id) !== String(targetStudentId)) {
    return false;
  }
  return true;
};

const ensureSessionAccess = (session, req) => {
  if (!session) return false;
  if (req.userRole === 'admin') return true;
  if (req.userRole === 'student' && String(session.student) === String(req.user._id)) return true;
  if (req.userRole === 'recruiter') {
    if (session.recruiter && String(session.recruiter) === String(req.user._id)) return true;
    // recruiters can also access if they created the session
    if (session.startedBy && String(session.startedBy) === String(req.user._id)) return true;
  }
  return false;
};

const toPercent = (score) => Math.round(Math.max(0, Math.min(100, Number(score) * 10)));

const clampQuestionCount = (value) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return 10;
  return Math.max(4, Math.min(25, Math.round(parsed)));
};

const deriveDifficultyForIndex = (answeredCount = 0, maxQuestions = 10) => {
  if (!maxQuestions) return 'medium';
  const ratio = answeredCount / maxQuestions;
  if (ratio < 0.33) return 'easy';
  if (ratio < 0.66) return 'medium';
  return 'hard';
};

const getMaxQuestions = (session) => session?.maxQuestions || session?.meta?.maxQuestions || 10;

const ensureSessionCounters = (session) => {
  session.meta = session.meta || { totalQuestions: 0, totalAnswers: 0, maxQuestions: getMaxQuestions(session) };
  if (typeof session.meta.totalQuestions !== 'number') session.meta.totalQuestions = 0;
  if (typeof session.meta.totalAnswers !== 'number') session.meta.totalAnswers = 0;
  if (typeof session.meta.maxQuestions !== 'number') session.meta.maxQuestions = getMaxQuestions(session);
  session.maxQuestions = getMaxQuestions(session);
  session.testStats = session.testStats || { correctAnswers: 0, incorrectAnswers: 0 };
};

const aggregateProficiency = (turns = []) => {
  const answered = turns.filter((turn) => !!turn.answer);
  if (!answered.length) {
    return {
      technicalDepth: 0,
      problemSolving: 0,
      communication: 0,
    };
  }

  const totals = answered.reduce(
    (acc, turn) => {
      acc.technicalDepth += Number(turn.rubric?.technicalAccuracy || 0);
      acc.problemSolving += Number(turn.rubric?.relevance || 0);
      acc.communication += (Number(turn.rubric?.communication || 0) + Number(turn.rubric?.clarity || 0)) / 2;
      return acc;
    },
    { technicalDepth: 0, problemSolving: 0, communication: 0 }
  );

  return {
    technicalDepth: toPercent(totals.technicalDepth / answered.length / 1),
    problemSolving: toPercent(totals.problemSolving / answered.length / 1),
    communication: toPercent(totals.communication / answered.length / 1),
  };
};

const computeOverallScore = (turns = []) => {
  const answered = turns.filter((turn) => !!turn.answer);
  if (!answered.length) {
    return 0;
  }

  const sum = answered.reduce((acc, turn) => {
    const total = rubricKeys.reduce((inner, key) => inner + (Number(turn.rubric?.[key]) || 0), 0);
    return acc + total / rubricKeys.length;
  }, 0);

  return Math.round((sum / answered.length) * 10);
};

const sanitiseFocusAreas = (focusAreas) => {
  if (!focusAreas) return [];
  if (!Array.isArray(focusAreas)) return [String(focusAreas)].filter(Boolean);
  return focusAreas
    .map((area) => (typeof area === 'string' ? area.trim() : String(area)))
    .filter(Boolean)
    .slice(0, 5);
};

const startSession = asyncHandler(async (req, res) => {
  const {
    role,
    roleLevel = 'basic',
    focusAreas,
    baselineSkillNotes,
    studentId,
    mode,
    questionCount,
  } = req.body || {};

  if (!role || !role.trim()) {
    return res.status(400).json({ message: 'Role is required to start an interview session' });
  }

  let targetStudentId = req.userRole === 'student' ? req.user._id : studentId;
  if (!targetStudentId) {
    return res.status(400).json({ message: 'studentId is required when recruiters start a session' });
  }

  if (req.userRole !== 'student') {
    const studentExists = await Student.exists({ _id: targetStudentId });
    if (!studentExists) {
      return res.status(404).json({ message: 'Student not found' });
    }
  }
  const recruiterId = req.userRole === 'recruiter' ? req.user._id : undefined;
  const maxQuestions = clampQuestionCount(questionCount);
  const resolvedMode = mode === 'practice' ? 'practice' : 'test';
  const session = await InterviewSession.create({
    student: targetStudentId,
    recruiter: recruiterId,
    startedBy: req.user._id,
    startedByModel: req.user.constructor?.modelName,
    role: role.trim(),
    roleLevel,
    focusAreas: sanitiseFocusAreas(focusAreas),
    baselineSkillNotes,
    mode: resolvedMode,
    status: 'active',
    currentDifficulty: resolvedMode === 'test' ? 'easy' : roleLevel === 'advanced' ? 'hard' : 'medium',
    maxQuestions,
    meta: {
      totalQuestions: 0,
      totalAnswers: 0,
      maxQuestions,
    },
  });

  res.status(201).json({ session });
});

const requestNextQuestion = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const session = await InterviewSession.findById(sessionId);

  if (!session) {
    return res.status(404).json({ message: 'Session not found' });
  }

  if (!ensureSessionAccess(session, req)) {
    return res.status(403).json({ message: 'Not authorised to access this session' });
  }

  ensureSessionCounters(session);

  if (session.status === 'completed') {
    return res.status(400).json({ message: 'Session already completed' });
  }

  if (session.meta.totalQuestions >= session.maxQuestions) {
    return res.status(400).json({ message: 'Question limit reached for this session' });
  }

  const progressiveDifficulty = deriveDifficultyForIndex(session.meta.totalAnswers || 0, session.maxQuestions);
  session.currentDifficulty = progressiveDifficulty;

  const question = await generateInterviewQuestion(session);
  session.turns.push({
    question: question.question,
    focusAreas: question.focusAreas,
    difficulty: question.difficulty,
    groqModel: question.model,
    options: question.options,
    askedAt: new Date(),
  });
  session.meta.totalQuestions += 1;
  session.currentDifficulty = question.difficulty;
  session.lastQuestionAt = new Date();

  await session.save();

  const turn = session.turns[session.turns.length - 1];

  res.status(201).json({
    turn,
    coachingTip: question.coachingTip,
    session: {
      _id: session._id,
      currentDifficulty: session.currentDifficulty,
      meta: session.meta,
      maxQuestions: session.maxQuestions,
    },
  });
});

const submitAnswer = asyncHandler(async (req, res) => {
  const { sessionId, turnId } = req.params;
  const { answer, selectedOptionKey } = req.body || {};

  const session = await InterviewSession.findById(sessionId);
  if (!session) {
    return res.status(404).json({ message: 'Session not found' });
  }

  if (!ensureSessionAccess(session, req)) {
    return res.status(403).json({ message: 'Not authorised to access this session' });
  }

  ensureSessionCounters(session);

  const targetTurn = turnId ? session.turns.id(turnId) : session.turns[session.turns.length - 1];
  if (!targetTurn) {
    return res.status(404).json({ message: 'Turn not found' });
  }

  if (targetTurn.answer) {
    return res.status(400).json({ message: 'This question has already been answered' });
  }

  if (!selectedOptionKey) {
    return res.status(400).json({ message: 'selectedOptionKey is required for test questions' });
  }

  const selectedOption = (targetTurn.options || []).find((option) => option.key === selectedOptionKey);
  if (!selectedOption) {
    return res.status(400).json({ message: 'Selected option is not valid for this question' });
  }

  const evaluation = await scoreInterviewAnswer({
    session,
    question: targetTurn.question,
    answer: selectedOption.text,
    options: targetTurn.options,
    selectedOptionKey,
  });

  targetTurn.answer = selectedOption.text;
  targetTurn.selectedOptionKey = selectedOptionKey;
  targetTurn.correctOptionKey = evaluation.correctOptionKey;
  targetTurn.isCorrect = Boolean(evaluation.isCorrect);
  targetTurn.answeredAt = new Date();
  targetTurn.rubric = evaluation.rubric;
  targetTurn.feedback = evaluation.feedback;
  targetTurn.coachTips = evaluation.coaching;
  targetTurn.difficulty = evaluation.nextDifficulty;
  targetTurn.groqModel = evaluation.model;
  targetTurn.tokens = {
    prompt: evaluation.usage?.prompt_tokens || 0,
    completion: evaluation.usage?.completion_tokens || 0,
    total: evaluation.usage?.total_tokens || 0,
  };

  session.meta.totalAnswers += 1;
  session.currentDifficulty = evaluation.nextDifficulty;

  if (!session.testStats) {
    session.testStats = { correctAnswers: 0, incorrectAnswers: 0 };
  }
  if (targetTurn.isCorrect) {
    session.testStats.correctAnswers += 1;
  } else {
    session.testStats.incorrectAnswers += 1;
  }

  const turnIndex = session.turns.findIndex((turn) => String(turn._id) === String(targetTurn._id));
  session.learningCurve.push({
    turnId: targetTurn._id,
    turnIndex,
    clarity: targetTurn.rubric.clarity,
    technicalAccuracy: targetTurn.rubric.technicalAccuracy,
    communication: targetTurn.rubric.communication,
    relevance: targetTurn.rubric.relevance,
    confidence: targetTurn.rubric.confidence,
    overall: Math.round(evaluation.overall * 10),
    difficulty: evaluation.nextDifficulty,
  });

  session.overallScore = computeOverallScore(session.turns);
  session.proficiencyVector = aggregateProficiency(session.turns);

  const hasCompletedTest = session.meta.totalAnswers >= session.maxQuestions;
  if (hasCompletedTest) {
    session.status = 'completed';
    session.completedAt = new Date();
    const scorePercent = session.maxQuestions
      ? Math.round((session.testStats.correctAnswers / session.maxQuestions) * 100)
      : Math.round((session.testStats.correctAnswers / Math.max(1, session.meta.totalAnswers)) * 100);
    session.summary.scorePercent = scorePercent;
    try {
      const finalSummary = await generateTestSummary(session);
      session.summary.overallFeedback = finalSummary.overallFeedback;
      session.summary.highlights = finalSummary.highlights;
      session.summary.improvements = finalSummary.improvements;
      session.summary.recommendation = finalSummary.recommendation;
    } catch (error) {
      console.error('Failed to generate test summary', error);
    }
  }

  await session.save();

  res.json({
    turn: targetTurn,
    evaluation: {
      feedback: evaluation.feedback,
      rubric: evaluation.rubric,
      overall: Math.round(evaluation.overall * 10),
      improvements: evaluation.improvements,
      nextDifficulty: evaluation.nextDifficulty,
      coaching: evaluation.coaching,
      isCorrect: targetTurn.isCorrect,
      correctOptionKey: targetTurn.correctOptionKey,
      rationale: evaluation.rationale,
    },
    session: {
      _id: session._id,
      overallScore: session.overallScore,
      proficiencyVector: session.proficiencyVector,
      learningCurve: session.learningCurve.slice(-12),
      status: session.status,
      meta: session.meta,
      summary: session.summary,
      testStats: session.testStats,
    },
  });
});

const getSessionSummary = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const session = await InterviewSession.findById(sessionId)
    .populate('student', 'name email college readinessScore avatarUrl')
    .populate('recruiter', 'name company email');

  if (!session) {
    return res.status(404).json({ message: 'Session not found' });
  }

  if (!ensureSessionAccess(session, req)) {
    return res.status(403).json({ message: 'Not authorised to access this session' });
  }

  res.json({ session });
});

const listStudentSessions = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const resolvedId = studentId === 'me' ? req.user._id : studentId;

  if (!ensureStudentAccess(req, resolvedId)) {
    return res.status(403).json({ message: 'You can only view your own interview sessions' });
  }

  const filter = { student: resolvedId };
  if (req.query.status) {
    filter.status = req.query.status;
  }

  const sessions = await InterviewSession.find(filter)
    .sort({ createdAt: -1 })
    .limit(Number(req.query.limit) || 10)
    .select('role roleLevel status overallScore learningCurve meta createdAt updatedAt summary testStats maxQuestions');

  res.json({ sessions });
});

const getActiveSessionForStudent = asyncHandler(async (req, res) => {
  const session = await InterviewSession.findOne({
    student: req.user._id,
    status: 'active',
  })
    .sort({ updatedAt: -1 })
    .select('-__v');

  res.json({ session });
});

const listRecruiterSessions = asyncHandler(async (req, res) => {
  const recruiterId = req.params.recruiterId === 'me' ? req.user._id : req.params.recruiterId;
  if (req.userRole !== 'recruiter' && req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Only recruiters can view this resource' });
  }

  if (req.userRole === 'recruiter' && String(recruiterId) !== String(req.user._id)) {
    return res.status(403).json({ message: 'You can only view your own sessions' });
  }

  const sessions = await InterviewSession.find({ recruiter: recruiterId })
    .sort({ updatedAt: -1 })
    .limit(Number(req.query.limit) || 15)
    .populate('student', 'name college readinessScore avatarUrl')
    .select('role roleLevel status overallScore learningCurve createdAt student');

  const mapped = sessions.map((session) => ({
    _id: session._id,
    student: session.student,
    role: session.role,
    roleLevel: session.roleLevel,
    status: session.status,
    overallScore: session.overallScore,
    turnsCompleted: session.meta?.totalAnswers || 0,
    learningCurve: session.learningCurve.slice(-5),
    createdAt: session.createdAt,
  }));

  res.json({ sessions: mapped });
});

module.exports = {
  startSession,
  requestNextQuestion,
  submitAnswer,
  getSessionSummary,
  listStudentSessions,
  getActiveSessionForStudent,
  listRecruiterSessions,
};
