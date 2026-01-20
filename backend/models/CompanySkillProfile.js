const mongoose = require('mongoose');

const companySkillProfileSchema = new mongoose.Schema(
    {
        companyName: { type: String, required: true, unique: true, trim: true },
        logoUrl: { type: String, trim: true },
        industry: { type: String, trim: true },
        type: {
            type: String,
            enum: ['faang', 'startup', 'enterprise', 'other'],
            default: 'other'
        },
        requiredSkills: [{
            skillName: { type: String, required: true },
            importance: {
                type: String,
                enum: ['must-have', 'preferred', 'nice-to-have'],
                default: 'must-have'
            },
            proficiencyLevel: { type: Number, min: 1, max: 5, default: 3 }
        }],
        avgSalaryRange: {
            min: { type: Number },
            max: { type: Number },
            currency: { type: String, default: 'INR' }
        },
        hiringActive: { type: Boolean, default: true },
        location: { type: String, trim: true },
        lastUpdated: { type: Date, default: Date.now }
    },
    {
        timestamps: true
    }
);

companySkillProfileSchema.index({ companyName: 1 });
companySkillProfileSchema.index({ type: 1 });

module.exports = mongoose.model('CompanySkillProfile', companySkillProfileSchema);
