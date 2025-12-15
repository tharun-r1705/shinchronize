const express = require('express');
const router = express.Router();
const { authenticate } = require('../utils/authMiddleware');
const { getStudentAchievements, getLeaderboard } = require('../utils/gamification');
const asyncHandler = require('../utils/asyncHandler');

// Get student achievements
router.get('/:id/achievements', authenticate(), asyncHandler(async (req, res) => {
  const studentId = req.params.id === 'me' ? req.user._id : req.params.id;
  
  const data = await getStudentAchievements(studentId);
  
  res.json({
    success: true,
    data
  });
}));

// Get leaderboard
router.get('/leaderboard', asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  
  const leaderboard = await getLeaderboard(limit);
  
  res.json({
    success: true,
    data: { leaderboard }
  });
}));

// Get student analytics
router.get('/:id/analytics', authenticate(), asyncHandler(async (req, res) => {
  const Student = require('../models/Student');
  const studentId = req.params.id === 'me' ? req.user._id : req.params.id;
  
  const student = await Student.findById(studentId);
  
  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Student not found'
    });
  }
  
  // Calculate analytics data
  const analytics = {
    readinessHistory: student.readinessHistory || [],
    growthTimeline: student.growthTimeline || [],
    skillDistribution: student.validatedSkills || [],
    activityStreak: student.activityStreak || 0,
    totalPoints: student.gamificationPoints || 0,
    platformStats: {
      leetcode: student.leetcodeStats || {},
      hackerrank: student.hackerrankStats || {},
      github: student.githubAuth || {}
    }
  };
  
  res.json({
    success: true,
    data: analytics
  });
}));

module.exports = router;
