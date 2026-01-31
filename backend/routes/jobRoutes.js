const express = require('express');
const router = express.Router();

const {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
  matchStudents,
  getMatchedStudents,
  getMatchExplanation,
  publishJob,
  getJobStats,
} = require('../controllers/jobController');

const { authenticate } = require('../utils/authMiddleware');
const { body, param, query, validationResult } = require('express-validator');

// Validation middleware
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Validation rules
const createJobValidation = [
  body('title').trim().notEmpty().withMessage('Job title is required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('description').trim().notEmpty().withMessage('Job description is required'),
  body('requiredSkills').optional().isArray().withMessage('Required skills must be an array'),
  body('jobType').optional().isIn(['Full-time', 'Internship', 'Contract', 'Part-time']).withMessage('Invalid job type'),
  body('minReadinessScore').optional().isInt({ min: 0, max: 100 }).withMessage('Min readiness score must be between 0-100'),
  body('minCGPA').optional().isFloat({ min: 0, max: 10 }).withMessage('Min CGPA must be between 0-10'),
  body('minProjects').optional().isInt({ min: 0 }).withMessage('Min projects must be a positive number'),
];

const updateJobValidation = [
  body('title').optional().trim().notEmpty().withMessage('Job title cannot be empty'),
  body('location').optional().trim().notEmpty().withMessage('Location cannot be empty'),
  body('description').optional().trim().notEmpty().withMessage('Job description cannot be empty'),
  body('requiredSkills').optional().isArray().withMessage('Required skills must be an array'),
  body('status').optional().isIn(['draft', 'active', 'closed', 'expired']).withMessage('Invalid status'),
  body('minReadinessScore').optional().isInt({ min: 0, max: 100 }).withMessage('Min readiness score must be between 0-100'),
  body('minCGPA').optional().isFloat({ min: 0, max: 10 }).withMessage('Min CGPA must be between 0-10'),
];

const jobIdValidation = [
  param('jobId').isMongoId().withMessage('Invalid job ID'),
];

const matchQueryValidation = [
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1-100'),
  query('minScore').optional().isInt({ min: 0, max: 100 }).withMessage('Min score must be between 0-100'),
];

// Routes

// Create new job
router.post(
  '/',
  authenticate(['recruiter']),
  createJobValidation,
  handleValidation,
  createJob
);

// Get all jobs for authenticated recruiter
router.get(
  '/',
  authenticate(['recruiter']),
  getAllJobs
);

// Get specific job by ID
router.get(
  '/:jobId',
  authenticate(['recruiter']),
  jobIdValidation,
  handleValidation,
  getJobById
);

// Update job
router.put(
  '/:jobId',
  authenticate(['recruiter']),
  jobIdValidation,
  updateJobValidation,
  handleValidation,
  updateJob
);

// Delete job
router.delete(
  '/:jobId',
  authenticate(['recruiter']),
  jobIdValidation,
  handleValidation,
  deleteJob
);

// Publish job (activate and trigger matching)
router.post(
  '/:jobId/publish',
  authenticate(['recruiter']),
  jobIdValidation,
  handleValidation,
  publishJob
);

// Match students to job
router.post(
  '/:jobId/match',
  authenticate(['recruiter']),
  jobIdValidation,
  handleValidation,
  matchStudents
);

// Get matched students for job
router.get(
  '/:jobId/matches',
  authenticate(['recruiter']),
  jobIdValidation,
  matchQueryValidation,
  handleValidation,
  getMatchedStudents
);

// Get match explanation for specific student
router.get(
  '/:jobId/matches/:studentId/explain',
  authenticate(['recruiter']),
  [
    param('jobId').isMongoId().withMessage('Invalid job ID'),
    param('studentId').isMongoId().withMessage('Invalid student ID'),
  ],
  handleValidation,
  getMatchExplanation
);

// Get job statistics
router.get(
  '/:jobId/stats',
  authenticate(['recruiter']),
  jobIdValidation,
  handleValidation,
  getJobStats
);

module.exports = router;
