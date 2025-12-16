/**
 * GitHub Profile Integration Routes
 * 
 * All routes require authentication (JWT)
 * Students can connect, disconnect, and refresh their GitHub data
 * Recruiters can view student GitHub data (read-only)
 */

const express = require('express');
const router = express.Router();
const {
  connectGitHub,
  disconnectGitHub,
  refreshProfile,
  refreshRepositories,
  refreshConsistency,
  refreshOpenSource,
  getGitHubData,
  getStudentGitHubData,
  refreshAllData,
} = require('../controllers/githubProfileController');
const { authenticate } = require('../utils/authMiddleware');

// Middleware for student authentication
const authenticateStudent = authenticate(['student']);
// Middleware for recruiter authentication (read-only access)
const authenticateRecruiter = authenticate(['recruiter', 'student']);

// ========== STUDENT ROUTES (Own Profile) ==========

/**
 * POST /api/students/github/connect
 * Connect GitHub account using username
 * Body: { username: string }
 */
router.post('/connect', authenticateStudent, connectGitHub);

/**
 * DELETE /api/students/github/disconnect
 * Disconnect GitHub account
 */
router.delete('/disconnect', authenticateStudent, disconnectGitHub);

/**
 * GET /api/students/github/data
 * Get all GitHub data for authenticated student
 */
router.get('/data', authenticateStudent, getGitHubData);

/**
 * POST /api/students/github/refresh/all
 * Refresh all GitHub categories at once
 */
router.post('/refresh/all', authenticateStudent, refreshAllData);

/**
 * POST /api/students/github/refresh/profile
 * Refresh only Profile Overview category
 */
router.post('/refresh/profile', authenticateStudent, refreshProfile);

/**
 * POST /api/students/github/refresh/repos
 * Refresh only Repositories category
 */
router.post('/refresh/repos', authenticateStudent, refreshRepositories);

/**
 * POST /api/students/github/refresh/consistency
 * Refresh only Coding Consistency category
 */
router.post('/refresh/consistency', authenticateStudent, refreshConsistency);

/**
 * POST /api/students/github/refresh/open-source
 * Refresh only Open Source Contributions category
 */
router.post('/refresh/open-source', authenticateStudent, refreshOpenSource);

// ========== RECRUITER ROUTES (View Student Profile) ==========

/**
 * GET /api/students/:studentId/github
 * Get GitHub data for specific student (recruiter view)
 */
router.get('/:studentId', authenticateRecruiter, getStudentGitHubData);

module.exports = router;
