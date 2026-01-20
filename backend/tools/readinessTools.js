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

    // Generate insights for each category
    const insights = [];

    if (breakdown.projects < 30) {
        insights.push({
            category: 'projects',
            current: breakdown.projects,
            max: 30,
            suggestion: `Add ${Math.ceil((30 - breakdown.projects) / 12)} more project(s) to maximize this category`
        });
    }

    if (breakdown.codingConsistency < 20) {
        insights.push({
            category: 'codingConsistency',
            current: breakdown.codingConsistency,
            max: 20,
            suggestion: 'Log more coding sessions in the last 30 days to improve consistency score'
        });
    }

    if (breakdown.certifications < 20) {
        insights.push({
            category: 'certifications',
            current: breakdown.certifications,
            max: 20,
            suggestion: `Add ${Math.ceil((20 - breakdown.certifications) / 5)} more certification(s) to boost this score`
        });
    }

    if (breakdown.skills < 10) {
        insights.push({
            category: 'skills',
            current: breakdown.skills,
            max: 10,
            suggestion: 'Add more skills to your profile to improve this score'
        });
    }

    // Get historical trend
    const history = (student.readinessHistory || []).slice(-5).map(h => ({
        score: h.score,
        date: h.calculatedAt
    }));

    return {
        score: total,
        breakdown,
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
