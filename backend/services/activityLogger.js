const ActivityLog = require('../models/ActivityLog');

/**
 * Log an activity event for a student
 * @param {Object} params - Activity parameters
 * @param {String} params.studentId - Student ID
 * @param {String} params.eventType - Type of event (from enum)
 * @param {String} params.roadmapId - Roadmap ID (optional)
 * @param {String} params.milestoneId - Milestone ID (optional)
 * @param {Object} params.metadata - Additional event data (optional)
 */
async function logActivity({ studentId, eventType, roadmapId = null, milestoneId = null, metadata = {} }) {
    try {
        const log = new ActivityLog({
            student: studentId,
            roadmap: roadmapId,
            milestoneId,
            eventType,
            metadata
        });

        await log.save();
        console.log(`Activity logged: ${eventType} for student ${studentId}`);
        return log;
    } catch (error) {
        console.error('Failed to log activity:', error);
        // Don't throw error - logging failures shouldn't break main functionality
        return null;
    }
}

/**
 * Get recent activities for a student
 * @param {String} studentId - Student ID
 * @param {Number} limit - Maximum number of activities to return (default: 50)
 * @param {String} roadmapId - Filter by specific roadmap (optional)
 */
async function getStudentActivities(studentId, limit = 50, roadmapId = null) {
    try {
        const query = { student: studentId };
        if (roadmapId) {
            query.roadmap = roadmapId;
        }

        const activities = await ActivityLog.find(query)
            .sort({ timestamp: -1 })
            .limit(limit)
            .populate('roadmap', 'title targetRole')
            .lean();

        return activities;
    } catch (error) {
        console.error('Failed to fetch activities:', error);
        return [];
    }
}

/**
 * Get activity statistics for a student
 * @param {String} studentId - Student ID
 * @param {Number} days - Number of days to look back (default: 30)
 */
async function getActivityStats(studentId, days = 30) {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const activities = await ActivityLog.find({
            student: studentId,
            timestamp: { $gte: startDate }
        }).lean();

        const stats = {
            totalActivities: activities.length,
            byType: {},
            byDay: {}
        };

        // Count by event type
        activities.forEach(activity => {
            stats.byType[activity.eventType] = (stats.byType[activity.eventType] || 0) + 1;
            
            // Count by day
            const day = activity.timestamp.toISOString().split('T')[0];
            stats.byDay[day] = (stats.byDay[day] || 0) + 1;
        });

        return stats;
    } catch (error) {
        console.error('Failed to get activity stats:', error);
        return { totalActivities: 0, byType: {}, byDay: {} };
    }
}

module.exports = {
    logActivity,
    getStudentActivities,
    getActivityStats
};
