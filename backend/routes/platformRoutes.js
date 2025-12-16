/**
 * Platform Routes
 * 
 * API routes for fetching platform-specific statistics
 * Used by the Progress page for multi-platform tracking
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../utils/authMiddleware');
const {
  getLeetCodeStats,
  getGitHubStats,
  getSavedPlatformStats,
  disconnectPlatform,
} = require('../controllers/platformController');

// All routes require authentication
router.use(authenticate());

// GET /api/platforms/leetcode/stats?username=xxx
// Fetch fresh LeetCode stats by username
router.get('/leetcode/stats', getLeetCodeStats);

// GET /api/platforms/github/stats?username=xxx
// Fetch fresh GitHub stats by username
router.get('/github/stats', getGitHubStats);

// GET /api/platforms/:platform/saved
// Get saved platform data for the current user
router.get('/:platform/saved', getSavedPlatformStats);

// DELETE /api/platforms/:platform/disconnect
// Disconnect a platform (clear stored data)
router.delete('/:platform/disconnect', disconnectPlatform);

module.exports = router;
