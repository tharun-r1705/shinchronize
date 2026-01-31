const express = require('express');
const router = express.Router();
const marketController = require('../controllers/marketController');
const skillChatController = require('../controllers/skillChatController');
const { authenticate } = require('../utils/authMiddleware');

// Public routes
router.get('/skills', marketController.getSkillMarket);
router.get('/trends', marketController.getTrends);
router.get('/companies', marketController.getCompanies);
router.post('/chat', skillChatController.chatAboutSkills);

// Protected routes (Student only)
router.get('/roi', authenticate(['student']), marketController.getPersonalizedROI);

module.exports = router;
