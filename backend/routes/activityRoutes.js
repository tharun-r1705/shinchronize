/**
 * Activity Routes
 * API endpoints for student activity logs
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../utils/authMiddleware');
const { getStudentActivities, getActivityStats } = require('../services/activityLogger');

// Get student's recent activities
router.get('/', authenticate(['student']), async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const roadmapId = req.query.roadmapId || null;

        const activities = await getStudentActivities(req.user.id, limit, roadmapId);

        res.json({
            success: true,
            activities,
            count: activities.length
        });
    } catch (error) {
        console.error('Error fetching activities:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch activities'
        });
    }
});

// Get activity statistics
router.get('/stats', authenticate(['student']), async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const stats = await getActivityStats(req.user.id, days);

        res.json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('Error fetching activity stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch activity statistics'
        });
    }
});

module.exports = router;
