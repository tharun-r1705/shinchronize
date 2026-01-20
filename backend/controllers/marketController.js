const skillMarketService = require('../services/skillMarketService');

const getSkillMarket = async (req, res) => {
    try {
        const skills = await skillMarketService.getSkillDemandData();
        res.json(skills);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getTrends = async (req, res) => {
    try {
        const trends = await skillMarketService.getTrendPredictions();
        res.json(trends);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getPersonalizedROI = async (req, res) => {
    try {
        const studentId = req.user.id || req.student?.id; // Support both auth styles if applicable
        if (!studentId) return res.status(401).json({ message: 'Unauthorized' });

        const roi = await skillMarketService.calculatePersonalizedROI(studentId);
        res.json(roi);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getCompanies = async (req, res) => {
    try {
        const { q, type } = req.query;
        const companies = await skillMarketService.getCompanyRequirements(q, type);
        res.json(companies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getSkillMarket,
    getTrends,
    getPersonalizedROI,
    getCompanies
};
