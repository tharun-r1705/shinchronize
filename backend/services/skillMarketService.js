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

const { generateCompanyProfile } = require('../utils/companyGenerator');

/**
 * Get company specific requirements
 * If query is specific and no results found, try generating with AI
 */
const getCompanyRequirements = async (query = '', type = '') => {
    const filter = {};
    if (query) {
        filter.$or = [
            { companyName: { $regex: query, $options: 'i' } },
            { location: { $regex: query, $options: 'i' } },
            { 'requiredSkills.skillName': { $regex: query, $options: 'i' } },
            { industry: { $regex: query, $options: 'i' } }
        ];
    }
    if (type && type !== 'all') {
        filter.type = type;
    }

    let results = await CompanySkillProfile.find(filter).sort({ companyName: 1 });

    // If query is likely a company name and no results found, or only 1-2 results, 
    // try to dynamically generate the requested company if it doesn't exist
    if (query && query.length > 2 && results.length === 0 && (!type || type === 'all')) {
        try {
            // Check if we should try generating (only if it doesn't look like a generic skill search)
            // If the query exactly matches nothing, let AI try to find the company
            const aiProfile = await generateCompanyProfile(query);
            if (aiProfile && aiProfile.companyName) {
                // Save the newly discovered company to our database
                const newCompany = await CompanySkillProfile.findOneAndUpdate(
                    { companyName: aiProfile.companyName },
                    aiProfile,
                    { upsert: true, new: true }
                );
                results = [newCompany];
            }
        } catch (error) {
            console.error('Dynamic company generation failed:', error.message);
        }
    }

    return results;
};

module.exports = {
    getSkillDemandData,
    getTrendPredictions,
    calculatePersonalizedROI,
    getCompanyRequirements
};
