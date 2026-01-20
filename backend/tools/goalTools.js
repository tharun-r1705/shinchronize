/**
 * Goal Tools
 * Tools for managing student goals (read/write operations)
 */

const Student = require('../models/Student');

/**
 * Get all goals for a student
 */
async function getGoals(studentId, args = {}) {
    const student = await Student.findById(studentId);
    if (!student) {
        throw new Error('Student not found');
    }

    const goals = (student.goals || []).map(g => ({
        id: g._id.toString(),
        title: g.title,
        description: g.description,
        category: g.category,
        status: g.status,
        progress: g.progress,
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
    const { title, description, category, targetDate } = args;

    if (!title) {
        throw new Error('Goal title is required');
    }

    const student = await Student.findById(studentId);
    if (!student) {
        throw new Error('Student not found');
    }

    const newGoal = {
        title,
        description: description || '',
        category: category || 'other',
        targetDate: targetDate ? new Date(targetDate) : null,
        status: 'pending',
        progress: 0,
        createdAt: new Date()
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

    if (typeof progress === 'number') {
        goal.progress = Math.min(100, Math.max(0, progress));
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

module.exports = {
    getGoals,
    addGoal,
    updateGoalProgress
};
