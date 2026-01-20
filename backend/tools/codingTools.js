/**
 * Coding Activity Tools
 * Tools for accessing coding platform data (LeetCode, HackerRank)
 */

const Student = require('../models/Student');
const dayjs = require('dayjs');

/**
 * Get coding activity and statistics
 */
async function getCodingActivity(studentId, args = {}) {
    const { timeframe = 'all' } = args;

    const student = await Student.findById(studentId);
    if (!student) {
        throw new Error('Student not found');
    }

    const leetcodeStats = student.leetcodeStats || {};
    const codingProfiles = student.codingProfiles || {};
    const codingLogs = student.codingLogs || [];

    // Filter logs by timeframe
    let filteredLogs = codingLogs;
    if (timeframe === 'week') {
        const weekAgo = dayjs().subtract(7, 'day');
        filteredLogs = codingLogs.filter(log => dayjs(log.date).isAfter(weekAgo));
    } else if (timeframe === 'month') {
        const monthAgo = dayjs().subtract(30, 'day');
        filteredLogs = codingLogs.filter(log => dayjs(log.date).isAfter(monthAgo));
    }

    // Calculate summary
    const totalMinutes = filteredLogs.reduce((sum, log) => sum + (log.minutesSpent || 0), 0);
    const totalProblems = filteredLogs.reduce((sum, log) => sum + (log.problemsSolved || 0), 0);

    return {
        leetcode: {
            username: leetcodeStats.username || codingProfiles.leetcode,
            totalSolved: leetcodeStats.totalSolved || 0,
            easy: leetcodeStats.easy || 0,
            medium: leetcodeStats.medium || 0,
            hard: leetcodeStats.hard || 0,
            streak: leetcodeStats.streak || 0,
            activeDays: leetcodeStats.activeDays || 0,
            recentActivity: leetcodeStats.recentActivity || { last7Days: 0, last30Days: 0 },
            topDomains: (leetcodeStats.topDomains || []).slice(0, 5),
            bestDay: leetcodeStats.bestDay,
            lastFetched: leetcodeStats.fetchedAt
        },
        hackerrank: {
            username: codingProfiles.hackerrank
        },
        summary: {
            timeframe,
            totalMinutesLogged: totalMinutes,
            totalProblemsLogged: totalProblems,
            sessionsCount: filteredLogs.length,
            averageSessionMinutes: filteredLogs.length > 0 ? Math.round(totalMinutes / filteredLogs.length) : 0
        },
        recentLogs: filteredLogs.slice(-5).map(log => ({
            date: log.date,
            platform: log.platform,
            activity: log.activity,
            minutesSpent: log.minutesSpent,
            problemsSolved: log.problemsSolved
        }))
    };
}

const { fetchLeetCodeActivity, fetchHackerRankActivity } = require('../utils/codingIntegrations');
const { calculateReadinessScore } = require('../utils/readinessScore');

/**
 * Sync coding activity from external platforms
 */
async function syncCodingPlatforms(studentId, args = {}) {
    const student = await Student.findById(studentId);
    if (!student) throw new Error('Student not found');

    const leet = await fetchLeetCodeActivity(student.codingProfiles?.leetcode);
    const hr = await fetchHackerRankActivity(student.codingProfiles?.hackerrank);

    const newLogs = [];
    const toCodingLog = (source) => (act) => ({
        platform: source,
        activity: act.activity || 'Practice',
        minutesSpent: act.minutes || 0,
        problemsSolved: act.problemsSolved || 0,
        notes: act.notes || '',
        date: act.date ? new Date(act.date) : new Date(),
    });

    (leet.activities || []).map(toCodingLog('LeetCode')).forEach((l) => newLogs.push(l));
    (hr.activities || []).map(toCodingLog('HackerRank')).forEach((l) => newLogs.push(l));

    // Simple duplicate guard
    const existingKey = new Set(
        student.codingLogs.map((l) => `${new Date(l.date).toISOString().slice(0, 10)}|${l.platform}|${l.activity}`)
    );

    const uniqueLogs = newLogs.filter((l) => {
        const key = `${new Date(l.date).toISOString().slice(0, 10)}|${l.platform}|${l.activity}`;
        if (existingKey.has(key)) return false;
        existingKey.add(key);
        return true;
    });

    if (uniqueLogs.length > 0) {
        student.codingLogs.push(...uniqueLogs);
        student.lastActiveAt = new Date();
    }

    const { total, breakdown } = calculateReadinessScore(student);
    student.readinessScore = total;
    student.readinessHistory.push({ score: total });
    student.codingProfiles = { ...(student.codingProfiles || {}), lastSyncedAt: new Date() };
    await student.save();

    return {
        addedLogs: uniqueLogs.length,
        leetcodeSummary: leet.summary,
        hackerRankSummary: hr.summary,
        newReadinessScore: total
    };
}

module.exports = {
    getCodingActivity,
    syncCodingPlatforms
};
