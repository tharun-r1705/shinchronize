/**
 * Agent Routes
 * API endpoints for the AI Mentor Agent
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../utils/authMiddleware');
const {
    sendMessage,
    getHistory,
    clearConversation,
    getNudges
} = require('../controllers/agentController');

// All agent routes require student authentication
router.use(authenticate(['student']));

// POST /api/agent/chat - Send a message to the AI agent
router.post('/chat', sendMessage);

// GET /api/agent/history - Get conversation history
router.get('/history', getHistory);

// GET /api/agent/nudges - Get proactive nudges
router.get('/nudges', getNudges);

// DELETE /api/agent/conversation - Clear conversation
router.delete('/conversation', clearConversation);

module.exports = router;
