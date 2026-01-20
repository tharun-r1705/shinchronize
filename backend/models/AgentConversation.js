const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['user', 'assistant', 'system', 'tool'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    toolCalls: [{
        name: String,
        arguments: mongoose.Schema.Types.Mixed,
        result: mongoose.Schema.Types.Mixed
    }],
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

const agentConversationSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
        index: true
    },
    messages: [messageSchema],
    metadata: {
        startedAt: { type: Date, default: Date.now },
        lastActiveAt: { type: Date, default: Date.now },
        messageCount: { type: Number, default: 0 },
        toolsUsed: [String]
    }
}, {
    timestamps: true
});

// Index for efficient queries
agentConversationSchema.index({ studentId: 1, 'metadata.lastActiveAt': -1 });

// Method to add a message
agentConversationSchema.methods.addMessage = function (role, content, toolCalls = []) {
    this.messages.push({ role, content, toolCalls, timestamp: new Date() });
    this.metadata.messageCount = this.messages.length;
    this.metadata.lastActiveAt = new Date();

    // Track tools used
    if (toolCalls && toolCalls.length > 0) {
        toolCalls.forEach(tc => {
            if (tc.name && !this.metadata.toolsUsed.includes(tc.name)) {
                this.metadata.toolsUsed.push(tc.name);
            }
        });
    }

    return this;
};

// Static method to get or create conversation for a student
agentConversationSchema.statics.getOrCreate = async function (studentId) {
    // Find most recent active conversation (within last 24 hours)
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    let conversation = await this.findOne({
        studentId,
        'metadata.lastActiveAt': { $gte: dayAgo }
    }).sort({ 'metadata.lastActiveAt': -1 });

    if (!conversation) {
        conversation = new this({
            studentId,
            messages: [],
            metadata: {
                startedAt: new Date(),
                lastActiveAt: new Date(),
                messageCount: 0,
                toolsUsed: []
            }
        });
        await conversation.save();
    }

    return conversation;
};

// Get recent context (last N messages for LLM context window)
agentConversationSchema.methods.getRecentContext = function (limit = 10) {
    const messages = this.messages.slice(-limit);
    return messages.map(m => ({
        role: m.role === 'tool' ? 'assistant' : m.role,
        content: m.content
    }));
};

module.exports = mongoose.model('AgentConversation', agentConversationSchema);
