const express = require('express');
const router = express.Router();
const multer = require('multer');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

// Separate multer instance for resume extraction to prevent buffer reuse
const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

const {
  signup,
  login,
  getProfile,
  updateProfile,
  addProject,
  updateProject,
  deleteProject,
  addCodingLog,
  addCertification,
  updateCertification,
  deleteCertification,
  addEvent,
  updateEvent,
  deleteEvent,
  getMentorSuggestions,
  analyzeResume,
  extractResumeText,
  parseAndAutofillResume,
  getReadinessReport,
  listStudents,
  getStudentById,
  deleteStudent,
  getLeaderboard,
  updateCodingProfiles,
  syncCodingActivity,
  updateLeetCodeStats,
  importLinkedInProfile,
  syncGitHubProfile,
  syncGitHubDataManually,
  toggleProjectFavorite,
  getFavoriteProjects,
  getGitHubProjects,
} = require('../controllers/studentController');
const { authenticate } = require('../utils/authMiddleware');
const {
  handleValidation,
  studentSignupValidation,
  studentLoginValidation,
  projectValidation,
  codingLogValidation,
  certificationValidation,
  eventValidation,
  idParamValidation,
} = require('../utils/validation');

router.post('/signup', studentSignupValidation, handleValidation, signup);
router.post('/login', studentLoginValidation, handleValidation, login);

router.get('/profile', authenticate(['student']), getProfile);
router.put('/profile', authenticate(['student']), updateProfile);

const pdfUploadMiddleware = (fieldName) => (req, res, next) => {
  upload.single(fieldName)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File size exceeds 5MB limit' });
      }
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

router.post(
  '/profile/linkedin-import',
  authenticate(['student']),
  pdfUploadMiddleware('linkedinPdf'),
  importLinkedInProfile
);

router.post(
  '/projects',
  authenticate(['student']),
  projectValidation,
  handleValidation,
  addProject
);

router.put(
  '/projects/:projectId',
  authenticate(['student']),
  updateProject
);

router.delete(
  '/projects/:projectId',
  authenticate(['student']),
  deleteProject
);

router.post(
  '/coding-logs',
  authenticate(['student']),
  codingLogValidation,
  handleValidation,
  addCodingLog
);

router.post(
  '/certifications',
  authenticate(['student']),
  certificationValidation,
  handleValidation,
  addCertification
);

router.put(
  '/certifications/:certId',
  authenticate(['student']),
  updateCertification
);

router.delete(
  '/certifications/:certId',
  authenticate(['student']),
  deleteCertification
);

router.post(
  '/events',
  authenticate(['student']),
  eventValidation,
  handleValidation,
  addEvent
);

router.put(
  '/events/:eventId',
  authenticate(['student']),
  updateEvent
);

router.delete(
  '/events/:eventId',
  authenticate(['student']),
  deleteEvent
);

router.get('/mentor-suggestions', authenticate(['student']), getMentorSuggestions);

router.post('/analyze-resume', authenticate(['student']), analyzeResume);

router.post(
  '/extract-resume-text',
  authenticate(['student']),
  (req, res, next) => {
    resumeUpload.single('resume')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File size exceeds 5MB limit' });
        }
        return res.status(400).json({ message: `Upload error: ${err.message}` });
      } else if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  },
  extractResumeText
);

router.post(
  '/parse-resume',
  authenticate(['student']),
  (req, res, next) => {
    resumeUpload.single('resume')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File size exceeds 5MB limit' });
        }
        return res.status(400).json({ message: `Upload error: ${err.message}` });
      } else if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  },
  parseAndAutofillResume
);

router.get('/readiness', authenticate(['student']), getReadinessReport);

// Public leaderboard endpoint
router.get('/leaderboard', getLeaderboard);

// Coding profiles and sync
router.put('/coding-profiles', authenticate(['student']), updateCodingProfiles);
router.post('/coding-sync', authenticate(['student']), syncCodingActivity);

// GitHub profile sync with rate limiting
router.post('/github-sync', authenticate(['student']), syncGitHubProfile);

// GitHub data sync - Manual trigger for full sync including projects
router.post('/sync-github', authenticate(['student']), syncGitHubDataManually);

// Project favorites and filters
router.patch('/projects/:projectId/favorite', authenticate(['student']), toggleProjectFavorite);
router.get('/projects/favorites', authenticate(['student']), getFavoriteProjects);
router.get('/projects/github', authenticate(['student']), getGitHubProjects);

// Update LeetCode stats (admin or self with student auth)
router.post('/:id/update-leetcode', authenticate(['student','admin']), updateLeetCodeStats);

router.get('/', authenticate(['admin']), listStudents);
router.get('/:id', authenticate(['admin']), idParamValidation, handleValidation, getStudentById);
router.delete('/:id', authenticate(['admin']), idParamValidation, handleValidation, deleteStudent);

module.exports = router;
