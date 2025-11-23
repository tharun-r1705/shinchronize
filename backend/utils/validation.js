const { body, query, param, validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  next();
};

const studentSignupValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('college').optional().trim(),
  body('branch').optional().trim(),
  body('year').optional().trim(),
];

const studentLoginValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const recruiterSignupValidation = [
  body('name').trim().notEmpty(),
  body('email').isEmail().withMessage('Work email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('company').optional().trim(),
  body('role').optional().trim(),
];

const recruiterLoginValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const adminSignupValidation = [
  body('name').trim().notEmpty(),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
];

const adminLoginValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const projectValidation = [
  body('title').trim().notEmpty().withMessage('Project title is required'),
  body('githubLink').optional().isURL().withMessage('Provide a valid GitHub link'),
  body('description').optional().trim(),
  body('tags').optional().isArray().withMessage('Tags must be an array of strings'),
];

const codingLogValidation = [
  body('platform').optional().trim(),
  body('activity').optional().trim(),
  body('minutesSpent').optional().isNumeric(),
  body('problemsSolved').optional().isNumeric(),
  body('date').optional().isISO8601().toDate(),
];

const certificationValidation = [
  body('name').trim().notEmpty().withMessage('Certification name is required'),
  body('fileLink').optional().isURL().withMessage('Provide a valid link'),
  body('issuedDate').optional().isISO8601().toDate(),
  body('provider').optional().trim(),
];

const eventValidation = [
  body('name').trim().notEmpty().withMessage('Event name is required'),
  body('date').optional().isISO8601().toDate(),
  body('location').optional().trim(),
  body('certificateLink').optional().isURL().withMessage('Provide a valid link'),
];

const studentFilterValidation = [
  query('skills').optional().isString(),
  query('minScore').optional().isFloat({ min: 0, max: 100 }),
  query('college').optional().isString(),
];

const compareStudentsValidation = [
  body('studentIds')
    .isArray({ min: 2, max: 5 })
    .withMessage('Provide between 2 and 5 student IDs for comparison'),
  body('studentIds.*').isMongoId().withMessage('Each student ID must be valid'),
];

const adminVerifyValidation = [
  body('studentId').isMongoId().withMessage('Valid studentId is required'),
  body('itemId').isMongoId().withMessage('Valid itemId is required'),
  body('itemType').isIn(['project', 'certification', 'event']).withMessage('Invalid item type'),
  body('action').isIn(['verify', 'reject']).withMessage('Action must be verify or reject'),
  body('notes').optional().trim(),
];

const idParamValidation = [param('id').isMongoId().withMessage('Valid ID is required')];
const studentIdParamValidation = [param('studentId').isMongoId().withMessage('Valid student ID is required')];

module.exports = {
  handleValidation,
  studentSignupValidation,
  studentLoginValidation,
  recruiterSignupValidation,
  recruiterLoginValidation,
  adminSignupValidation,
  adminLoginValidation,
  projectValidation,
  codingLogValidation,
  certificationValidation,
  eventValidation,
  studentFilterValidation,
  compareStudentsValidation,
  adminVerifyValidation,
  idParamValidation,
  studentIdParamValidation,
};
