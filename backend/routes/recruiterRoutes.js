const express = require('express');
const router = express.Router();

const {
  signup,
  login,
  getProfile,
  updatePreferences,
  listStudents,
  compareStudents,
  saveCandidate,
  removeSavedCandidate,
  getSavedCandidates,
  getStudentProfile,
  aiAssistant,
} = require('../controllers/recruiterController');
const { authenticate } = require('../utils/authMiddleware');
const {
  handleValidation,
  recruiterSignupValidation,
  recruiterLoginValidation,
  studentFilterValidation,
  compareStudentsValidation,
  idParamValidation,
  studentIdParamValidation,
} = require('../utils/validation');

router.post('/signup', recruiterSignupValidation, handleValidation, signup);
router.post('/login', recruiterLoginValidation, handleValidation, login);

router.get('/profile', authenticate(['recruiter']), getProfile);
router.put('/profile', authenticate(['recruiter']), updatePreferences);

router.get('/students', authenticate(['recruiter']), studentFilterValidation, handleValidation, listStudents);
router.get('/students/:studentId', authenticate(['recruiter']), studentIdParamValidation, handleValidation, getStudentProfile);
router.post(
  '/students/compare',
  authenticate(['recruiter']),
  compareStudentsValidation,
  handleValidation,
  compareStudents
);

router.get('/saved', authenticate(['recruiter']), getSavedCandidates);
router.post(
  '/saved/:id',
  authenticate(['recruiter']),
  idParamValidation,
  handleValidation,
  saveCandidate
);
router.delete(
  '/saved/:id',
  authenticate(['recruiter']),
  idParamValidation,
  handleValidation,
  removeSavedCandidate
);

router.post('/ai-assistant', authenticate(['recruiter']), aiAssistant);

module.exports = router;
