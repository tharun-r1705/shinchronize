/**
 * Agent Controller
 * HTTP request handlers for the AI agent endpoints
 */

const agentService = require('../services/agentService');
const proactiveService = require('../services/proactiveService');
const asyncHandler = require('../utils/asyncHandler');

/**
 * POST /api/agent/chat
 * Send a message to the AI agent
 */
const sendMessage = asyncHandler(async (req, res) => {
    const studentId = req.user._id;
    const { message } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({
            message: 'Message is required and must be a non-empty string'
        });
    }

    if (message.length > 2000) {
        return res.status(400).json({
            message: 'Message must be less than 2000 characters'
        });
    }

    const result = await agentService.processMessage(studentId, message.trim());

    res.json({
        success: true,
        response: result.message,
        toolsUsed: result.toolsUsed,
        conversationId: result.conversationId,
        timestamp: result.timestamp
    });
});

/**
 * GET /api/agent/history
 * Get conversation history for the current student
 */
const getHistory = asyncHandler(async (req, res) => {
    const studentId = req.user._id;
    const limit = parseInt(req.query.limit) || 50;

    const history = await agentService.getConversationHistory(studentId, limit);

    res.json({
        success: true,
        ...history
    });
});

/**
 * DELETE /api/agent/conversation
 * Clear conversation history
 */
const clearConversation = asyncHandler(async (req, res) => {
    const studentId = req.user._id;

    const result = await agentService.clearConversation(studentId);

    res.json({
        success: true,
        ...result
    });
});

/**
 * GET /api/agent/nudges
 * Get proactive nudges for the current student
 */
const getNudges = asyncHandler(async (req, res) => {
    const studentId = req.user._id;

    // Trigger a quick audit when they check for nudges
    // This could be moved to a cron job later
    await proactiveService.runStudentAudit(studentId);

    const nudges = await proactiveService.getActiveNudges(studentId);

    res.json({
        success: true,
        nudges
    });
});

module.exports = {
    sendMessage,
    getHistory,
    clearConversation,
    getNudges
};
