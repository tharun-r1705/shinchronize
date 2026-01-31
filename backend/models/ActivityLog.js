const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
        index: true
    },
    roadmap: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Roadmap',
        required: false
    },
    milestoneId: {
        type: String,
        required: false
    },
    eventType: {
        type: String,
        required: true,
        enum: [
            // Roadmap events
            'roadmap_created',
            'roadmap_deleted',
            'roadmap_activated',
            // Milestone events
            'milestone_started',
            'milestone_completed',
            'milestone_reset',
            // Quiz events
            'quiz_attempted',
            'quiz_passed',
            'quiz_failed',
            // Project events
            'project_submitted',
            'project_verified',
            'project_needs_improvement',
            'project_rejected',
            'project_resubmitted',
            // Resource events
            'resource_accessed',
            'resource_link_validated',
            'resource_link_replaced'
        ]
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
}, { timestamps: true });

// Compound index for efficient queries
activityLogSchema.index({ student: 1, timestamp: -1 });
activityLogSchema.index({ student: 1, roadmap: 1, timestamp: -1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = ActivityLog;
