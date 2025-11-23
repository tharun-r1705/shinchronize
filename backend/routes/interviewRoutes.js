const express = require('express');
const router = express.Router();

const {
  startSession,
  requestNextQuestion,
  submitAnswer,
  getSessionSummary,
  listStudentSessions,
  getActiveSessionForStudent,
  listRecruiterSessions,
} = require('../controllers/interviewController');
const { authenticate } = require('../utils/authMiddleware');

router.post('/session', authenticate(['student', 'recruiter']), startSession);

router.get('/student/me/active', authenticate(['student']), getActiveSessionForStudent);
router.get(
  '/student/:studentId/history',
  authenticate(['student', 'recruiter', 'admin']),
  listStudentSessions
);

router.get(
  '/recruiter/:recruiterId/candidates',
  authenticate(['recruiter', 'admin']),
  listRecruiterSessions
);

router.post(
  '/:sessionId/question',
  authenticate(['student', 'recruiter']),
  requestNextQuestion
);

router.post(
  '/:sessionId/turns/:turnId/answer',
  authenticate(['student', 'recruiter']),
  submitAnswer
);

router.post('/:sessionId/answer', authenticate(['student', 'recruiter']), submitAnswer);
router.get('/:sessionId', authenticate(['student', 'recruiter', 'admin']), getSessionSummary);

module.exports = router;
