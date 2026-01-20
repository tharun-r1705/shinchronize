/**
 * Proactive Service
 * Background logic for generating proactive nudges and notifications
 */

const Student = require('../models/Student');
const ProactiveNotification = require('../models/ProactiveNotification');
const { calculateReadinessScore } = require('../utils/readinessScore');
const dayjs = require('dayjs');

/**
 * Check for streak violations
 */
async function checkStreakGaps(studentId) {
    const student = await Student.findById(studentId);
    if (!student || !student.lastActiveAt) return null;

    const lastActive = dayjs(student.lastActiveAt);
    const now = dayjs();

    // If last active was yesterday and haven't active today, send a nudge
    if (now.diff(lastActive, 'hour') > 24 && now.diff(lastActive, 'hour') < 36) {
        const exists = await ProactiveNotification.findOne({
            studentId,
            type: 'streak_warning',
            createdAt: { $gte: dayjs().startOf('day').toDate() }
        });

        if (!exists) {
            return await ProactiveNotification.create({
                studentId,
                type: 'streak_warning',
                title: 'Maintaining your streak',
                message: `Hey ${student.firstName || 'there'}! You haven't logged any activity today. Log a session now to maintain your ${student.streakDays}-day streak!`
            });
        }
    }
    return null;
}

/**
 * Check for readiness milestones
 */
async function checkReadinessMilestones(studentId) {
    const student = await Student.findById(studentId);
    if (!student) return null;

    const { total } = calculateReadinessScore(student);

    // Example: Milestone at 50, 75, 90
    const milestones = [50, 75, 90];
    const lastHistory = student.readinessHistory.slice(-2);

    if (lastHistory.length < 2) return null;

    const prevScore = lastHistory[0].score;
    const currentScore = total;

    for (const milestone of milestones) {
        if (prevScore < milestone && currentScore >= milestone) {
            return await ProactiveNotification.create({
                studentId,
                type: 'readiness_milestone',
                title: 'New Milestone Reached!',
                message: `Incredible! Your readiness score just crossed ${milestone}. You're now in the top tier of candidates!`,
                data: { score: currentScore, milestone }
            });
        }
    }
    return null;
}

/**
 * Run all checks for a student
 */
async function runStudentAudit(studentId) {
    try {
        await Promise.all([
            checkStreakGaps(studentId),
            checkReadinessMilestones(studentId)
        ]);
    } catch (error) {
        console.error(`Proactive audit failed for student ${studentId}:`, error);
    }
}

/**
 * Get active (unread) notifications for a student
 */
async function getActiveNudges(studentId) {
    return await ProactiveNotification.find({
        studentId,
        isRead: false
    }).sort({ createdAt: -1 });
}

module.exports = {
    runStudentAudit,
    getActiveNudges,
    checkStreakGaps,
    checkReadinessMilestones
};
