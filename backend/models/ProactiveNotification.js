const mongoose = require('mongoose');

const proactiveNotificationSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['streak_warning', 'readiness_milestone', 'skill_gap_alert', 'goal_deadline', 'peer_comparison'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    data: {
        type: mongoose.Schema.Types.Mixed
    },
    isRead: {
        type: Boolean,
        default: false
    },
    isResolved: {
        type: Boolean,
        default: false
    },
    expiresAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Index for finding unread notifications
proactiveNotificationSchema.index({ studentId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('ProactiveNotification', proactiveNotificationSchema);
