const express = require('express');
const router = express.Router();

const {
  signup,
  login,
  getProfile,
  listPendingVerifications,
  verifyItem,
  getDashboardStats,
  listStudents,
} = require('../controllers/adminController');
const { authenticate } = require('../utils/authMiddleware');
const {
  handleValidation,
  adminSignupValidation,
  adminLoginValidation,
  adminVerifyValidation,
} = require('../utils/validation');

router.post('/signup', adminSignupValidation, handleValidation, signup);
router.post('/login', adminLoginValidation, handleValidation, login);

router.get('/profile', authenticate(['admin']), getProfile);
router.get('/pending', authenticate(['admin']), listPendingVerifications);
router.post('/verify', authenticate(['admin']), adminVerifyValidation, handleValidation, verifyItem);
router.get('/stats', authenticate(['admin']), getDashboardStats);
router.get('/students', authenticate(['admin']), listStudents);

module.exports = router;
