const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema({
    id: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    category: {
        type: String,
        enum: ['skill', 'project', 'certification', 'interview', 'networking', 'other'],
        default: 'skill'
    },
    status: {
        type: String,
        enum: ['not-started', 'in-progress', 'completed'],
        default: 'not-started'
    },
    duration: { type: String, trim: true }, // e.g., "2 weeks", "1 month"
    resources: [{
        title: { type: String, trim: true },
        url: { type: String, trim: true },
        type: { type: String, enum: ['video', 'article', 'course', 'book', 'tool', 'tutorial', 'documentation', 'other'], default: 'other' }
    }],
    skills: [{ type: String, trim: true }], // Skills to learn/improve
    order: { type: Number, default: 0 },
    completedAt: { type: Date },
    requiresQuiz: { type: Boolean, default: true },
    quizStatus: {
        type: String,
        enum: ['none', 'pending', 'passed', 'failed'],
        default: 'none'
    },
    lastQuizScore: { type: Number, default: 0 },
    quizAttempts: [{
        score: Number,
        calculatedAt: { type: Date, default: Date.now }
    }]
}, { _id: false });

const roadmapSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    targetRole: { type: String, trim: true }, // e.g., "Full Stack Developer", "Data Scientist"
    targetCompany: { type: String, trim: true }, // Optional target company
    timeline: { type: String, trim: true }, // e.g., "3 months", "6 months"
    milestones: [milestoneSchema],
    progress: { type: Number, default: 0, min: 0, max: 100 },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    generatedBy: { type: String, default: 'zenith' } // AI generated
}, { timestamps: true });

// Index for efficient queries
roadmapSchema.index({ student: 1, isActive: 1 });

// Update progress when milestones change
roadmapSchema.methods.calculateProgress = function () {
    if (this.milestones.length === 0) return 0;
    const completed = this.milestones.filter(m => m.status === 'completed').length;
    return Math.round((completed / this.milestones.length) * 100);
};

// Pre-save hook to update progress
roadmapSchema.pre('save', function (next) {
    this.progress = this.calculateProgress();
    this.updatedAt = new Date();
    next();
});

const Roadmap = mongoose.model('Roadmap', roadmapSchema);

module.exports = Roadmap;
