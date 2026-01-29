const express = require('express');
const { authenticate } = require('../utils/authMiddleware');
const { synthesizeSpeech } = require('../controllers/ttsController');

const router = express.Router();

router.post('/', authenticate(['student', 'recruiter', 'admin']), synthesizeSpeech);

module.exports = router;
