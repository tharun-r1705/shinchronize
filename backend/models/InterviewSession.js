const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    type: { type: String, enum: ['technical', 'behavioral', 'project', 'tricky'], required: true },
    category: { type: String, default: '' },
    question: { type: String, required: true },
    context: { type: String, default: '' },

    answer: { type: String, default: '' },
    answerMethod: { type: String, enum: ['text', 'voice'], default: 'text' },
    voiceMetrics: {
      durationSeconds: { type: Number, default: 0 },
      wordCount: { type: Number, default: 0 },
      fillerWords: {
        count: { type: Number, default: 0 },
        examples: { type: [String], default: [] },
      },
    },
    answeredAt: { type: Date },

    feedback: {
      score: { type: Number, default: 0 },
      strengths: { type: [String], default: [] },
      improvements: { type: [String], default: [] },
      sampleAnswer: { type: String, default: '' },
      communication: {
        clarity: { type: Number, default: 0 },
        structure: { type: Number, default: 0 },
        conciseness: { type: Number, default: 0 },
        feedback: { type: [String], default: [] },
      },
    },
  },
  { _id: false }
);

const interviewSessionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },

    sessionType: { type: String, enum: ['quick', 'full'], default: 'quick' },
    interviewTypes: {
      type: [String],
      default: ['technical-domain', 'behavioral', 'project'],
    },
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'intermediate' },
    interviewerPersona: { type: String, enum: ['friendly', 'neutral', 'tough'], default: 'neutral' },
    targetRole: { type: String, default: '' },
    resumeContext: { type: String, default: '' },

    currentQuestionIndex: { type: Number, default: 0 },
    questionsTarget: { type: Number, default: 5 },
    questions: { type: [questionSchema], default: [] },

    summary: {
      overallScore: { type: Number, default: 0 },
      categoryScores: {
        technical: { type: Number, default: 0 },
        behavioral: { type: Number, default: 0 },
        communication: { type: Number, default: 0 },
        confidence: { type: Number, default: 0 },
      },
      topStrengths: { type: [String], default: [] },
      areasToImprove: { type: [String], default: [] },
      recommendations: { type: [String], default: [] },
      comparedToPrevious: { type: String, enum: ['better', 'same', 'worse', 'unknown'], default: 'unknown' },
    },

    status: { type: String, enum: ['in-progress', 'completed', 'abandoned'], default: 'in-progress', index: true },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    durationMinutes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

interviewSessionSchema.index({ studentId: 1, createdAt: -1 });

module.exports = mongoose.model('InterviewSession', interviewSessionSchema);
