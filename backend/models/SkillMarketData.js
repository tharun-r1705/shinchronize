const mongoose = require('mongoose');

const skillMarketDataSchema = new mongoose.Schema(
    {
        skillName: { type: String, required: true, unique: true, trim: true },
        category: {
            type: String,
            enum: ['Frontend', 'Backend', 'Data', 'Cloud', 'DevOps', 'Mobile', 'AI/ML', 'Security', 'Other'],
            default: 'Other'
        },
        demandScore: { type: Number, min: 0, max: 100, default: 50 },
        jobCount: { type: Number, default: 0 },
        avgSalary: { type: Number, default: 0 },
        yoyGrowth: { type: Number, default: 0 }, // Year-over-year growth percentage
        trend: {
            type: String,
            enum: ['rising', 'stable', 'declining'],
            default: 'stable'
        },
        predictedGrowth6m: { type: Number, default: 0 }, // 6-month prediction
        relatedSkills: [{ type: String }],
        lastUpdated: { type: Date, default: Date.now }
    },
    {
        timestamps: true
    }
);

// Index for faster queries
skillMarketDataSchema.index({ category: 1, demandScore: -1 });
skillMarketDataSchema.index({ trend: 1 });

module.exports = mongoose.model('SkillMarketData', skillMarketDataSchema);
