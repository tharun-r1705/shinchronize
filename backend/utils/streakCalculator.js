const dayjs = require('dayjs');
const isSameOrBefore = require('dayjs/plugin/isSameOrBefore');
const isSameOrAfter = require('dayjs/plugin/isSameOrAfter');

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

/**
 * Calculate consecutive days streak from student's activity data
 * 
 * What counts as "activity":
 * - Coding logs
 * - Projects added/submitted
 * - External platform syncs (LeetCode, GitHub, HackerRank)
 * - Certifications added
 * - Events participated
 * - Interview sessions completed
 * - Quiz attempts
 * 
 * @param {Object} student - Student document
 * @returns {Object} - { streakDays: number, lastActiveAt: Date }
 */
function calculateStreak(student) {
    if (!student) {
        return { streakDays: 0, lastActiveAt: null };
    }

    // Collect all activity dates
    const activityDates = new Set();

    // 1. Coding logs
    if (Array.isArray(student.codingLogs)) {
        student.codingLogs.forEach(log => {
            if (log.date) {
                const dateStr = dayjs(log.date).format('YYYY-MM-DD');
                activityDates.add(dateStr);
            }
        });
    }

    // 2. Projects (submittedAt or createdAt)
    if (Array.isArray(student.projects)) {
        student.projects.forEach(project => {
            const date = project.submittedAt || project.createdAt;
            if (date) {
                const dateStr = dayjs(date).format('YYYY-MM-DD');
                activityDates.add(dateStr);
            }
        });
    }

    // 3. Certifications (issuedDate or createdAt)
    if (Array.isArray(student.certifications)) {
        student.certifications.forEach(cert => {
            const date = cert.issuedDate || cert.createdAt;
            if (date) {
                const dateStr = dayjs(date).format('YYYY-MM-DD');
                activityDates.add(dateStr);
            }
        });
    }

    // 4. Events (date or createdAt)
    if (Array.isArray(student.events)) {
        student.events.forEach(event => {
            const date = event.date || event.createdAt;
            if (date) {
                const dateStr = dayjs(date).format('YYYY-MM-DD');
                activityDates.add(dateStr);
            }
        });
    }

    // 5. External sync dates (LeetCode, GitHub, HackerRank)
    if (student.leetcodeStats?.fetchedAt) {
        const dateStr = dayjs(student.leetcodeStats.fetchedAt).format('YYYY-MM-DD');
        activityDates.add(dateStr);
    }

    if (student.githubStats?.fetchedAt) {
        const dateStr = dayjs(student.githubStats.fetchedAt).format('YYYY-MM-DD');
        activityDates.add(dateStr);
    }

    if (student.hackerrankStats?.fetchedAt) {
        const dateStr = dayjs(student.hackerrankStats.fetchedAt).format('YYYY-MM-DD');
        activityDates.add(dateStr);
    }

    // 6. Coding profiles last synced
    if (student.codingProfiles?.lastSyncedAt) {
        const dateStr = dayjs(student.codingProfiles.lastSyncedAt).format('YYYY-MM-DD');
        activityDates.add(dateStr);
    }

    // 7. Last active timestamp (general activity indicator)
    if (student.lastActiveAt) {
        const dateStr = dayjs(student.lastActiveAt).format('YYYY-MM-DD');
        activityDates.add(dateStr);
    }

    // Convert Set to sorted array (most recent first)
    const sortedDates = Array.from(activityDates)
        .map(dateStr => dayjs(dateStr))
        .sort((a, b) => b.diff(a)); // Descending order

    if (sortedDates.length === 0) {
        return { streakDays: 0, lastActiveAt: null };
    }

    const mostRecentActivity = sortedDates[0];
    const today = dayjs().startOf('day');
    const yesterday = today.subtract(1, 'day');

    // Check if most recent activity is today or yesterday
    // If it's older than yesterday, streak is broken (reset to 0)
    if (mostRecentActivity.isBefore(yesterday, 'day')) {
        return {
            streakDays: 0,
            lastActiveAt: mostRecentActivity.toDate()
        };
    }

    // Count consecutive days backwards from most recent activity
    let streakDays = 0;
    let currentCheckDate = mostRecentActivity;

    for (const activityDate of sortedDates) {
        // Check if this activity date is within the current consecutive sequence
        if (activityDate.isSame(currentCheckDate, 'day')) {
            // Same day as we're checking - counts as streak
            streakDays++;
            // Move to previous day for next check
            currentCheckDate = currentCheckDate.subtract(1, 'day');
        } else if (activityDate.isBefore(currentCheckDate, 'day')) {
            // This activity is before our current check date
            // Check if there's a gap
            const daysDiff = currentCheckDate.diff(activityDate, 'day');
            
            if (daysDiff === 1) {
                // No gap - consecutive day
                streakDays++;
                currentCheckDate = activityDate;
            } else {
                // Gap found - streak is broken
                break;
            }
        }
        // If activityDate is after currentCheckDate, skip it (shouldn't happen with sorted data)
    }

    return {
        streakDays,
        lastActiveAt: mostRecentActivity.toDate()
    };
}

/**
 * Update streak for a student and save to database
 * 
 * @param {Object} student - Student mongoose document
 * @returns {Promise<Object>} - Updated student document
 */
async function updateStreak(student) {
    if (!student) {
        throw new Error('Student document is required');
    }

    const { streakDays, lastActiveAt } = calculateStreak(student);

    // Update student document
    student.streakDays = streakDays;
    if (lastActiveAt) {
        student.lastActiveAt = lastActiveAt;
    }

    // Save to database
    await student.save();

    console.log(`[StreakCalculator] Updated streak for ${student.name || student.email}: ${streakDays} days`);

    return student;
}

/**
 * Batch update streaks for multiple students (useful for cron jobs)
 * 
 * @param {Array} students - Array of student documents
 * @returns {Promise<Object>} - Statistics about the update
 */
async function batchUpdateStreaks(students) {
    if (!Array.isArray(students) || students.length === 0) {
        return { updated: 0, errors: 0, totalProcessed: 0 };
    }

    let updated = 0;
    let errors = 0;

    for (const student of students) {
        try {
            await updateStreak(student);
            updated++;
        } catch (error) {
            console.error(`[StreakCalculator] Error updating streak for ${student._id}:`, error.message);
            errors++;
        }
    }

    console.log(`[StreakCalculator] Batch update complete: ${updated} updated, ${errors} errors, ${students.length} total`);

    return {
        updated,
        errors,
        totalProcessed: students.length
    };
}

module.exports = {
    calculateStreak,
    updateStreak,
    batchUpdateStreaks
};
