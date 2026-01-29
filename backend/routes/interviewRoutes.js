const express = require('express');
const multer = require('multer');
const { authenticate } = require('../utils/authMiddleware');
const {
  startInterviewSession,
  submitInterviewAnswer,
  completeInterviewSession,
  getInterviewHistory,
  getInterviewSession,
  getInterviewStats,
} = require('../controllers/interviewController');

const router = express.Router();

const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed for resume upload'));
    }
  },
});

router.post('/start', authenticate(['student']), resumeUpload.single('resume'), startInterviewSession);
router.post('/:sessionId/answer', authenticate(['student']), audioUpload.single('audio'), submitInterviewAnswer);
router.post('/:sessionId/complete', authenticate(['student']), completeInterviewSession);

router.get('/history', authenticate(['student']), getInterviewHistory);
router.get('/stats', authenticate(['student']), getInterviewStats);
router.get('/:sessionId', authenticate(['student']), getInterviewSession);

module.exports = router;
