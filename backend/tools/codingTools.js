/**
 * Coding Activity Tools
 * Tools for accessing coding platform data (LeetCode, HackerRank)
 */

const Student = require('../models/Student');
const dayjs = require('dayjs');
const { fetchGitHubStats } = require('../utils/github');

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
    const githubStats = student.githubStats || {};
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
        github: {
            username: githubStats.username || codingProfiles.github,
            totalRepos: githubStats.totalRepos || 0,
            totalStars: githubStats.totalStars || 0,
            streak: githubStats.streak || 0,
            activeDays: githubStats.activeDays || 0,
            recentActivity: githubStats.recentActivity || { last7Days: 0, last30Days: 0 },
            calendarWarning: githubStats.calendarWarning,
            lastFetched: githubStats.fetchedAt
        },
        summary: {
            timeframe,
            totalMinutesLogged: totalMinutes,
            totalProblemsLogged: totalProblems,
            sessionsCount: filteredLogs.length,
            averageSessionMinutes: filteredLogs.length > 0 ? Math.round(totalMinutes / filteredLogs.length) : 0,
            leetcodeSubmissionsLast30Days: leetcodeStats.recentActivity?.last30Days || 0,
            githubContributionsLast30Days: githubStats.recentActivity?.last30Days || 0
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

/**
 * Sync GitHub stats for the student
 */
async function syncGitHubStats(studentId, args = {}) {
    const requestedUsername = typeof args.username === 'string' ? args.username.trim() : '';

    const student = await Student.findById(studentId).select('+githubToken');
    if (!student) throw new Error('Student not found');

    const username = requestedUsername || student.codingProfiles?.github || '';
    if (!username) {
        throw new Error('GitHub username is required. Add it in your profile first.');
    }

    const userToken = student.githubToken || null;
    const stats = await fetchGitHubStats(username, userToken);
    student.githubStats = stats;
    student.codingProfiles = { ...(student.codingProfiles || {}), github: username, lastSyncedAt: new Date() };

    const { total } = calculateReadinessScore(student);
    student.readinessScore = total;
    student.readinessHistory.push({ score: total });
    await student.save();

    return {
        success: true,
        github: student.githubStats,
        newReadinessScore: total
    };
}

const { fetchLeetCodeActivity } = require('../utils/codingIntegrations');
const { calculateReadinessScore } = require('../utils/readinessScore');

/**
 * Sync coding activity from external platforms
 */
async function syncCodingPlatforms(studentId, args = {}) {
    const student = await Student.findById(studentId);
    if (!student) throw new Error('Student not found');

    const leet = await fetchLeetCodeActivity(student.codingProfiles?.leetcode);

    // Update LeetCode Stats if successful
    if (leet.success && leet.stats) {
        student.leetcodeStats = {
            ...leet.stats,
            username: student.codingProfiles?.leetcode,
            fetchedAt: new Date()
        };
    }

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
        success: true,
        addedLogs: uniqueLogs.length,
        leetcode: student.leetcodeStats,
        newReadinessScore: total
    };
}

module.exports = {
    getCodingActivity,
    syncCodingPlatforms,
    syncGitHubStats
};
