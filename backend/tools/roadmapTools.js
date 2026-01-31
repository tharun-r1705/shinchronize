/**
 * Roadmap Tools
 * Tools for creating and managing personalized career roadmaps
 */

const Roadmap = require('../models/Roadmap');
const Student = require('../models/Student');
const { logActivity } = require('../services/activityLogger');
let uuidv4;

async function getUuidV4() {
    if (!uuidv4) {
        const { v4 } = await import('uuid');
        uuidv4 = v4;
    }
    return uuidv4;
}

/**
 * Create a new personalized roadmap
 */
async function createRoadmap(studentId, args) {
    const { title, description, targetRole, targetCompany, timeline, milestones } = args;

    // Deactivate existing roadmaps (keep only one active at a time)
    await Roadmap.updateMany(
        { student: studentId, isActive: true },
        { isActive: false }
    );

    // Create milestones with proper structure
    const allowedResourceTypes = ['video', 'article', 'course', 'book', 'tool', 'tutorial', 'documentation', 'other'];

    const uuid = await getUuidV4();

    const formattedMilestones = (milestones || []).map((m, index) => ({
        id: uuid(),
        title: m.title,
        description: m.description || '',
        category: m.category || 'skill',
        status: 'not-started',
        duration: m.duration || '',
        resources: (m.resources || []).map(r => ({
            title: r.title || r.name || 'Resource',
            url: r.url || '',
            type: allowedResourceTypes.includes(r.type) ? r.type : 'other'
        })),
        skills: m.skills || [],
        order: index,
        // Consolidated requiresQuiz logic: projects don't need quizzes, skills default to requiring quiz unless specified
        requiresQuiz: m.category === 'project' ? false : (m.requiresQuiz !== undefined ? m.requiresQuiz : true),
        quizStatus: 'none',
        // Project specific
        problemStatements: m.category === 'project' ? (m.problemStatements || []) : [],
        projectSubmission: null
    }));

    const roadmap = new Roadmap({
        student: studentId,
        title,
        description: description || '',
        targetRole: targetRole || '',
        targetCompany: targetCompany || '',
        timeline: timeline || '',
        milestones: formattedMilestones,
        isActive: true,
        generatedBy: 'zenith'
    });

    await roadmap.save();

    // Log roadmap creation
    await logActivity({
        studentId,
        roadmapId: roadmap._id,
        eventType: 'roadmap_created',
        metadata: {
            title,
            targetRole,
            milestoneCount: formattedMilestones.length
        }
    });

    return {
        success: true,
        roadmap: {
            id: roadmap._id,
            title: roadmap.title,
            description: roadmap.description,
            targetRole: roadmap.targetRole,
            timeline: roadmap.timeline,
            milestoneCount: roadmap.milestones.length,
            progress: roadmap.progress
        },
        message: `Created roadmap "${title}" with ${formattedMilestones.length} milestones. The student can now view it in the Roadmap tab!`
    };
}

/**
 * Get the current active roadmap
 */
async function getRoadmap(studentId, args) {
    const roadmap = await Roadmap.findOne({ student: studentId, isActive: true });

    if (!roadmap) {
        return {
            success: false,
            roadmap: null,
            message: 'No active roadmap found. Would you like me to create a personalized roadmap based on your goals and current skills?'
        };
    }

    const completedCount = roadmap.milestones.filter(m => m.status === 'completed').length;
    const inProgressCount = roadmap.milestones.filter(m => m.status === 'in-progress').length;

    return {
        success: true,
        roadmap: {
            id: roadmap._id,
            title: roadmap.title,
            description: roadmap.description,
            targetRole: roadmap.targetRole,
            targetCompany: roadmap.targetCompany,
            timeline: roadmap.timeline,
            progress: roadmap.progress,
            milestones: roadmap.milestones.map(m => ({
                id: m.id,
                title: m.title,
                description: m.description,
                category: m.category,
                status: m.status,
                duration: m.duration,
                skills: m.skills,
                resourceCount: m.resources?.length || 0
            })),
            stats: {
                total: roadmap.milestones.length,
                completed: completedCount,
                inProgress: inProgressCount,
                notStarted: roadmap.milestones.length - completedCount - inProgressCount
            }
        },
        message: `Roadmap: "${roadmap.title}" - ${roadmap.progress}% complete (${completedCount}/${roadmap.milestones.length} milestones done)`
    };
}

/**
 * Update milestone status
 */
async function updateMilestoneStatus(studentId, args) {
    const { milestoneId, status } = args;

    const roadmap = await Roadmap.findOne({ student: studentId, isActive: true });
    if (!roadmap) {
        return { success: false, message: 'No active roadmap found' };
    }

    const milestone = roadmap.milestones.find(m => m.id === milestoneId);
    if (!milestone) {
        return { success: false, message: 'Milestone not found' };
    }

    milestone.status = status;
    if (status === 'completed') {
        milestone.completedAt = new Date();
    }

    await roadmap.save();

    return {
        success: true,
        milestone: {
            id: milestone.id,
            title: milestone.title,
            status: milestone.status
        },
        roadmapProgress: roadmap.progress,
        message: `Updated "${milestone.title}" to ${status}. Roadmap is now ${roadmap.progress}% complete!`
    };
}

/**
 * Add a milestone to existing roadmap
 */
async function addMilestone(studentId, args) {
    const { title, description, category, duration, skills, resources, insertAfter } = args;

    const roadmap = await Roadmap.findOne({ student: studentId, isActive: true });
    if (!roadmap) {
        return { success: false, message: 'No active roadmap found. Create a roadmap first.' };
    }

    const allowedResourceTypes = ['video', 'article', 'course', 'book', 'tool', 'tutorial', 'documentation', 'other'];

    const uuid = await getUuidV4();

    const newMilestone = {
        id: uuid(),
        title,
        description: description || '',
        category: category || 'skill',
        status: 'not-started',
        duration: duration || '',
        resources: (resources || []).map(r => ({
            title: r.title || r.name || 'Resource',
            url: r.url || '',
            type: allowedResourceTypes.includes(r.type) ? r.type : 'other'
        })),
        skills: skills || [],
        order: roadmap.milestones.length,
        // Projects don't need quizzes, skills default to requiring quiz
        requiresQuiz: category === 'project' ? false : true,
        quizStatus: 'none',
        problemStatements: category === 'project' ? [] : undefined,
        projectSubmission: null
    };

    // Insert after specific milestone if specified
    if (insertAfter) {
        const index = roadmap.milestones.findIndex(m => m.id === insertAfter);
        if (index !== -1) {
            roadmap.milestones.splice(index + 1, 0, newMilestone);
            // Reorder
            roadmap.milestones.forEach((m, i) => { m.order = i; });
        } else {
            roadmap.milestones.push(newMilestone);
        }
    } else {
        roadmap.milestones.push(newMilestone);
    }

    await roadmap.save();

    return {
        success: true,
        milestone: {
            id: newMilestone.id,
            title: newMilestone.title,
            order: newMilestone.order
        },
        message: `Added milestone "${title}" to your roadmap!`
    };
}

/**
 * Delete a roadmap
 */
async function deleteRoadmap(studentId, args) {
    const { roadmapId } = args;

    const result = await Roadmap.findOneAndDelete({
        _id: roadmapId,
        student: studentId
    });

    if (!result) {
        return { success: false, message: 'Roadmap not found or already deleted' };
    }

    return {
        success: true,
        message: `Roadmap "${result.title}" has been deleted.`
    };
}

module.exports = {
    createRoadmap,
    getRoadmap,
    updateMilestoneStatus,
    addMilestone,
    deleteRoadmap
};
