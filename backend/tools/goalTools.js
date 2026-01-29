/**
 * Goal Tools
 * Tools for managing student goals (read/write operations)
 */

const Student = require('../models/Student');
const {
    inferTargetValueFromText,
    inferAutoTrack,
    inferUnit,
    getAutoTrackValue,
    computeProgress,
    syncAutoGoals
} = require('../utils/goalSync');

/**
 * Get all goals for a student
 */
async function getGoals(studentId, args = {}) {
    const student = await Student.findById(studentId);
    if (!student) {
        throw new Error('Student not found');
    }

    const updated = syncAutoGoals(student);
    if (updated) {
        await student.save();
    }

    const goals = (student.goals || []).map(g => ({
        id: g._id.toString(),
        title: g.title,
        description: g.description,
        category: g.category,
        status: g.status,
        progress: g.progress,
        targetValue: g.targetValue,
        currentValue: g.currentValue,
        unit: g.unit,
        autoTrack: g.autoTrack,
        targetDate: g.targetDate,
        createdAt: g.createdAt,
        completedAt: g.completedAt
    }));

    // Organize by status
    const pending = goals.filter(g => g.status === 'pending');
    const inProgress = goals.filter(g => g.status === 'in_progress');
    const completed = goals.filter(g => g.status === 'completed');

    return {
        total: goals.length,
        pending: pending.length,
        inProgress: inProgress.length,
        completed: completed.length,
        goals,
        summary: {
            activeGoals: [...pending, ...inProgress],
            recentlyCompleted: completed.slice(-3)
        }
    };
}

/**
 * Add a new goal
 * This is a WRITE operation that modifies the database
 */
async function addGoal(studentId, args = {}) {
    const { title, description, category, targetDate, targetValue, unit, autoTrack } = args;

    if (!title) {
        throw new Error('Goal title is required');
    }

    const student = await Student.findById(studentId);
    if (!student) {
        throw new Error('Student not found');
    }

    const resolvedCategory = category || 'other';
    const resolvedAutoTrack = autoTrack || inferAutoTrack(resolvedCategory, title, description || '');
    const resolvedUnit = unit || inferUnit(resolvedAutoTrack, resolvedCategory);

    const currentValue = resolvedAutoTrack !== 'none'
        ? getAutoTrackValue(student, resolvedAutoTrack)
        : 0;

    const parsedTarget = typeof targetValue === 'number'
        ? targetValue
        : inferTargetValueFromText(`${title} ${description || ''}`);

    const resolvedTarget = Number.isFinite(parsedTarget) && parsedTarget > 0
        ? parsedTarget
        : (resolvedAutoTrack === 'projects' ? Math.max(1, currentValue + 1) : null);

    const progress = resolvedTarget ? computeProgress(currentValue, resolvedTarget) : 0;
    const status = progress >= 100 ? 'completed' : progress > 0 ? 'in_progress' : 'pending';

    const newGoal = {
        title,
        description: description || '',
        category: resolvedCategory,
        targetDate: targetDate ? new Date(targetDate) : null,
        targetValue: resolvedTarget,
        currentValue,
        unit: resolvedUnit,
        autoTrack: resolvedAutoTrack,
        status,
        progress,
        createdAt: new Date(),
        completedAt: status === 'completed' ? new Date() : null
    };

    student.goals.push(newGoal);
    await student.save();

    const addedGoal = student.goals[student.goals.length - 1];

    return {
        success: true,
        message: `Goal "${title}" has been added successfully`,
        goal: {
            id: addedGoal._id.toString(),
            title: addedGoal.title,
            description: addedGoal.description,
            category: addedGoal.category,
            status: addedGoal.status,
            progress: addedGoal.progress,
            targetValue: addedGoal.targetValue,
            currentValue: addedGoal.currentValue,
            unit: addedGoal.unit,
            autoTrack: addedGoal.autoTrack,
            targetDate: addedGoal.targetDate,
            createdAt: addedGoal.createdAt
        }
    };
}

/**
 * Update goal progress or status
 * This is a WRITE operation that modifies the database
 */
async function updateGoalProgress(studentId, args = {}) {
    const { goalId, progress, status } = args;

    if (!goalId) {
        throw new Error('Goal ID is required');
    }

    const student = await Student.findById(studentId);
    if (!student) {
        throw new Error('Student not found');
    }

    const goal = student.goals.id(goalId);
    if (!goal) {
        throw new Error('Goal not found');
    }

    if (typeof progress === 'number' && (goal.autoTrack === 'none' || !goal.autoTrack)) {
        goal.progress = Math.min(100, Math.max(0, progress));

        if (!status) {
            if (goal.progress >= 100) {
                goal.status = 'completed';
                goal.completedAt = new Date();
            } else if (goal.progress > 0) {
                goal.status = 'in_progress';
                goal.completedAt = null;
            } else {
                goal.status = 'pending';
                goal.completedAt = null;
            }
        }
    }

    if (status) {
        goal.status = status;
        if (status === 'completed') {
            goal.completedAt = new Date();
            goal.progress = 100;
        }
    }

    await student.save();

    return {
        success: true,
        message: `Goal "${goal.title}" has been updated`,
        goal: {
            id: goal._id.toString(),
            title: goal.title,
            status: goal.status,
            progress: goal.progress,
            completedAt: goal.completedAt
        }
    };
}

/**
 * Remove a specific goal
 */
async function removeGoal(studentId, args = {}) {
    const { goalId } = args;

    if (!goalId) {
        throw new Error('Goal ID is required');
    }

    const student = await Student.findById(studentId);
    if (!student) {
        throw new Error('Student not found');
    }

    const goal = student.goals.id(goalId);
    if (!goal) {
        throw new Error('Goal not found');
    }

    const goalTitle = goal.title;
    student.goals.pull(goalId);
    await student.save();

    return {
        success: true,
        message: `Goal "${goalTitle}" has been removed`,
    };
}

/**
 * Clear all goals for a student
 */
async function clearGoals(studentId) {
    const student = await Student.findById(studentId);
    if (!student) {
        throw new Error('Student not found');
    }

    const count = student.goals.length;
    student.goals = [];
    await student.save();

    return {
        success: true,
        message: `All ${count} goals have been removed successfully`,
    };
}

module.exports = {
    getGoals,
    addGoal,
    updateGoalProgress,
    removeGoal,
    clearGoals
};
