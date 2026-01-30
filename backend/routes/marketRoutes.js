const express = require('express');
const router = express.Router();
const marketController = require('../controllers/marketController');
const { authenticate } = require('../utils/authMiddleware');

// Public routes
router.get('/skills', marketController.getSkillMarket);
router.get('/trends', marketController.getTrends);
router.get('/companies', marketController.getCompanies);
router.get('/insights', marketController.getMarketInsights);

// Protected routes (Student only)
router.get('/roi', authenticate(['student']), marketController.getPersonalizedROI);

module.exports = router;
