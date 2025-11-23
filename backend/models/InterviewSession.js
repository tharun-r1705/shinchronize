const mongoose = require('mongoose');

const rubricSchema = new mongoose.Schema(
  {
    clarity: { type: Number, min: 0, max: 10, default: 0 },
    technicalAccuracy: { type: Number, min: 0, max: 10, default: 0 },
    communication: { type: Number, min: 0, max: 10, default: 0 },
    relevance: { type: Number, min: 0, max: 10, default: 0 },
    confidence: { type: Number, min: 0, max: 10, default: 0 },
  },
  { _id: false }
);

const proficiencySchema = new mongoose.Schema(
  {
    technicalDepth: { type: Number, min: 0, max: 100, default: 0 },
    problemSolving: { type: Number, min: 0, max: 100, default: 0 },
    communication: { type: Number, min: 0, max: 100, default: 0 },
  },
  { _id: false }
);

const optionSchema = new mongoose.Schema(
  {
    key: { type: String, trim: true },
    text: { type: String, trim: true },
  },
  { _id: false }
);

const graphPointSchema = new mongoose.Schema(
  {
    turnId: { type: mongoose.Schema.Types.ObjectId },
    turnIndex: { type: Number, default: 0 },
    clarity: { type: Number, default: 0 },
    technicalAccuracy: { type: Number, default: 0 },
    communication: { type: Number, default: 0 },
    relevance: { type: Number, default: 0 },
    confidence: { type: Number, default: 0 },
    overall: { type: Number, default: 0 },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard', 'expert'],
      default: 'medium',
    },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const turnSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    focusAreas: { type: [String], default: [] },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard', 'expert'],
      default: 'medium',
    },
    answer: { type: String, trim: true },
    options: { type: [optionSchema], default: [] },
    selectedOptionKey: { type: String, trim: true },
    correctOptionKey: { type: String, trim: true },
    isCorrect: { type: Boolean, default: false },
    rubric: { type: rubricSchema, default: () => ({}) },
    feedback: { type: String, trim: true },
    coachTips: { type: [String], default: [] },
    askedAt: { type: Date, default: Date.now },
    answeredAt: { type: Date },
    groqModel: { type: String, trim: true },
    latencyMs: { type: Number },
    tokens: {
      prompt: { type: Number, default: 0 },
      completion: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
  },
  { _id: true }
);

const interviewSessionSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    recruiter: { type: mongoose.Schema.Types.ObjectId, ref: 'Recruiter' },
    startedBy: { type: mongoose.Schema.Types.ObjectId, refPath: 'startedByModel' },
    startedByModel: { type: String, enum: ['Student', 'Recruiter', 'Admin'] },
    role: { type: String, required: true, trim: true },
    roleLevel: {
      type: String,
      enum: ['basic', 'intermediate', 'advanced'],
      default: 'basic',
    },
    focusAreas: { type: [String], default: [] },
    baselineSkillNotes: { type: String, trim: true },
    mode: {
      type: String,
      enum: ['practice', 'test'],
      default: 'test',
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'completed'],
      default: 'active',
    },
    turns: { type: [turnSchema], default: [] },
    proficiencyVector: { type: proficiencySchema, default: () => ({}) },
    learningCurve: { type: [graphPointSchema], default: [] },
    currentDifficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard', 'expert'],
      default: 'medium',
    },
    groqModel: {
      type: String,
      default: () => process.env.GROQ_INTERVIEW_MODEL || 'llama-3.1-8b-instant',
    },
    maxQuestions: { type: Number, min: 1, max: 25, default: 10 },
    summary: {
      highlights: { type: [String], default: [] },
      improvements: { type: [String], default: [] },
      recommendation: { type: String, trim: true },
      overallFeedback: { type: String, trim: true },
      scorePercent: { type: Number, min: 0, max: 100, default: 0 },
    },
    overallScore: { type: Number, min: 0, max: 100, default: 0 },
    lastQuestionAt: { type: Date },
    completedAt: { type: Date },
    meta: {
      totalQuestions: { type: Number, default: 0 },
      totalAnswers: { type: Number, default: 0 },
      maxQuestions: { type: Number, default: 10 },
    },
    testStats: {
      correctAnswers: { type: Number, default: 0 },
      incorrectAnswers: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

interviewSessionSchema.index({ student: 1, createdAt: -1 });
interviewSessionSchema.index({ recruiter: 1, createdAt: -1 });
interviewSessionSchema.index({ role: 1, status: 1 });

module.exports = mongoose.model('InterviewSession', interviewSessionSchema);
