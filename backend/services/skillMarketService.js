const SkillMarketData = require('../models/SkillMarketData');
const CompanySkillProfile = require('../models/CompanySkillProfile');
const Student = require('../models/Student');

/**
 * Get all skill market data sorted by demand score
 */
const getSkillDemandData = async () => {
    return await SkillMarketData.find().sort({ demandScore: -1 });
};

/**
 * Get trend predictions (high growth skills)
 */
const getTrendPredictions = async () => {
    const rising = await SkillMarketData.find({ trend: 'rising' }).sort({ predictedGrowth6m: -1 }).limit(5);
    const stable = await SkillMarketData.find({ trend: 'stable' }).sort({ demandScore: -1 }).limit(5);
    const declining = await SkillMarketData.find({ trend: 'declining' }).sort({ predictedGrowth6m: 1 }).limit(5);

    return { rising, stable, declining };
};

/**
 * Calculate personalized ROI for a student
 * ROI = (Market Demand * Growth) / (Current Student Gap)
 */
const calculatePersonalizedROI = async (studentId) => {
    const student = await Student.findById(studentId);
    if (!student) throw new Error('Student not found');

    const marketSkills = await SkillMarketData.find();
    const studentSkills = student.skillRadar || {};

    const recommendations = marketSkills.map(skill => {
        const studentScore = studentSkills[skill.skillName] || 0;
        const gap = 100 - studentScore;

        // ROI formula: Demand density weighted by gap
        // Higher ROI means: High demand, high growth, and student has room to improve
        const roiScore = (skill.demandScore * (1 + (skill.predictedGrowth6m / 100)) * (gap / 100)).toFixed(2);

        return {
            skillName: skill.skillName,
            category: skill.category,
            currentScore: studentScore,
            marketDemand: skill.demandScore,
            predictedGrowth: skill.predictedGrowth6m,
            roiScore: parseFloat(roiScore),
            avgSalary: skill.avgSalary,
            timeInvestment: '40-60 hours', // Estimated
            impact: studentScore < 30 ? 'High' : (studentScore < 70 ? 'Medium' : 'Low')
        };
    });

    return recommendations
        .filter(r => r.roiScore > 0)
        .sort((a, b) => b.roiScore - a.roiScore)
        .slice(0, 5); // Return top 5 recommendations
};

/**
 * Get company specific requirements
 */
const getCompanyRequirements = async (query = '', type = '') => {
    const filter = {};
    if (query) {
        filter.companyName = { $regex: query, $options: 'i' };
    }
    if (type && type !== 'all') {
        filter.type = type;
    }
    return await CompanySkillProfile.find(filter).sort({ companyName: 1 });
};

module.exports = {
    getSkillDemandData,
    getTrendPredictions,
    calculatePersonalizedROI,
    getCompanyRequirements
};
