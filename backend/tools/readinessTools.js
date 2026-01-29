/**
 * Readiness Tools
 * Tools for calculating and explaining placement readiness score
 */

const Student = require('../models/Student');
const { calculateReadinessScore } = require('../utils/readinessScore');

/**
 * Get readiness score with detailed breakdown
 */
async function getReadinessScore(studentId, args = {}) {
    const student = await Student.findById(studentId);
    if (!student) {
        throw new Error('Student not found');
    }

    const { total, breakdown } = calculateReadinessScore(student);

    if (process.env.AGENT_DEBUG === 'true') {
        console.log('[readiness] score breakdown:', JSON.stringify({ total, breakdown }));
    }

    // Generate insights for all categories
    const insights = [];

    const categories = [
        { key: 'projects', label: 'Projects', max: 20, unit: 10, item: 'project' },
        { key: 'codingConsistency', label: 'Coding Consistency', max: 15, unit: 1.5, item: 'recent log' },
        { key: 'githubActivity', label: 'GitHub Activity', max: 15 },
        { key: 'certifications', label: 'Certifications', max: 15, unit: 4, item: 'certification' },
        { key: 'events', label: 'Event Participation', max: 10, unit: 3, item: 'event' },
        { key: 'skillDiversity', label: 'Platform Diversity', max: 10, unit: 5, item: 'platform' },
        { key: 'skillRadar', label: 'Skill Proficiency', max: 10 },
        { key: 'skills', label: 'Profile Skills', max: 10, unit: 2, item: 'skill' },
        { key: 'interviewPrep', label: 'Interview Preparation', max: 10 },
        { key: 'streakBonus', label: 'Consistency Streak', max: 5 }
    ];

    categories.forEach(cat => {
        const current = breakdown[cat.key] || 0;
        if (current < cat.max) {
            let suggestion = '';
            if (cat.unit) {
                const needed = Math.ceil((cat.max - current) / cat.unit);
                suggestion = `Add ${needed} more ${cat.item}(s) to maximize this category.`;
            } else if (cat.key === 'skillRadar') {
                suggestion = `Improve your proficiency levels in the skill radar to earn more points.`;
            } else if (cat.key === 'interviewPrep') {
                suggestion = `Complete mock interview sessions to improve this score. Your performance, consistency, and improvement trend all contribute to this category.`;
            } else if (cat.key === 'streakBonus') {
                suggestion = `Maintain your daily activity streak to increase this bonus.`;
            }

            insights.push({
                category: cat.key,
                label: cat.label,
                current,
                max: cat.max,
                suggestion
            });
        }
    });

    // Provide the full breakdown with metadata to the AI
    const enrichedBreakdown = {};
    categories.forEach(cat => {
        enrichedBreakdown[cat.key] = {
            current: breakdown[cat.key] || 0,
            max: cat.max
        };
    });

    // Get historical trend
    const history = (student.readinessHistory || []).slice(-5).map(h => ({
        score: h.score,
        date: h.calculatedAt
    }));

    return {
        score: total,
        breakdown: enrichedBreakdown,
        insights,
        history,
        streakDays: student.streakDays || 0,
        lastActiveAt: student.lastActiveAt
    };
}

/**
 * Compare student with peers (benchmark)
 */
async function compareWithPeers(studentId, args = {}) {
    const student = await Student.findById(studentId);
    if (!student) throw new Error('Student not found');

    const { branch, year } = student;

    // Find similar students
    const peers = await Student.find({
        branch,
        year,
        _id: { $ne: studentId }
    });

    if (peers.length === 0) {
        return {
            message: "Not enough peers in your branch/year to provide a meaningful comparison yet.",
            stats: null
        };
    }

    // Calculate peer averages
    const peerScores = peers.map(p => {
        const { total } = calculateReadinessScore(p);
        return total;
    });

    const avgReadiness = peerScores.reduce((a, b) => a + b, 0) / peerScores.length;
    const topReadiness = Math.max(...peerScores);
    const myScore = calculateReadinessScore(student).total;

    // LeetCode comparison
    const peerLeetCode = peers.map(p => p.leetcodeStats?.totalSolved || 0).filter(s => s > 0);
    const avgLeetCode = peerLeetCode.length > 0 ? peerLeetCode.reduce((a, b) => a + b, 0) / peerLeetCode.length : 0;
    const topLeetCode = peerLeetCode.length > 0 ? Math.max(...peerLeetCode) : 0;
    const myLeetCode = student.leetcodeStats?.totalSolved || 0;

    return {
        context: { branch, year, peerCount: peers.length },
        readiness: {
            you: myScore,
            peerAverage: Math.round(avgReadiness),
            peerTop: topReadiness,
            percentile: Math.round((peerScores.filter(s => myScore >= s).length / peerScores.length) * 100)
        },
        leetcode: {
            you: myLeetCode,
            peerAverage: Math.round(avgLeetCode),
            peerTop: topLeetCode
        },
        insights: [
            myScore > avgReadiness ? "You are performing above your branch average." : "You are currently below the branch average readiness.",
            myLeetCode < avgLeetCode ? "Peers in your branch have solved more problems on average. Try to catch up!" : "Your coding activity is competitive within your branch."
        ]
    };
}

module.exports = {
    getReadinessScore,
    compareWithPeers
};
