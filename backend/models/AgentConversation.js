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
        toolsUsed: [String],
        roadmapIntake: {
            status: { type: String, enum: ['none', 'pending'], default: 'none' },
            step: { type: Number, default: 0 },
            initialRequest: { type: String, default: '' },
            answers: {
                q1: { type: String, default: '' },
                q2: { type: String, default: '' },
                q3: { type: String, default: '' }
            },
            startedAt: { type: Date, default: null }
        }
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
    const expandedMessages = [];

    messages.forEach(m => {
        // Create standard message object
        const msg = {
            role: m.role,
            content: m.content || ''
        };

        // If this assistant message had tool calls, we need to represent the sequence correctly
        if (m.role === 'assistant' && m.toolCalls && m.toolCalls.length > 0) {
            // 1. First, show the assistant message with the tool_calls field
            const toolCallsForLLM = m.toolCalls.map((tc, index) => ({
                id: `call_${m._id || Date.now()}_${index}`,
                type: 'function',
                function: {
                    name: tc.name,
                    arguments: typeof tc.arguments === 'string' ? tc.arguments : JSON.stringify(tc.arguments)
                }
            }));

            // If there's content, keep it, otherwise content must be null for tool calls in some APIs
            const assistantCallMsg = {
                role: 'assistant',
                content: m.content ? 'I will check that for you.' : null,
                tool_calls: toolCallsForLLM
            };
            expandedMessages.push(assistantCallMsg);

            // 2. Then, show each tool result as a separate message
            m.toolCalls.forEach((tc, index) => {
                expandedMessages.push({
                    role: 'tool',
                    tool_call_id: toolCallsForLLM[index].id,
                    name: tc.name,
                    content: JSON.stringify(tc.result || { success: true })
                });
            });

            // 3. Finally, show the final response assistant generated
            // In our current save logic, m.content IS the final response.
            // So we add it as a separate follow-up assistant message.
            if (m.content) {
                expandedMessages.push({
                    role: 'assistant',
                    content: m.content
                });
            }
        } else if (m.role === 'user' || m.role === 'system') {
            expandedMessages.push(msg);
        }
    });

    return expandedMessages.slice(-limit);
};

module.exports = mongoose.model('AgentConversation', agentConversationSchema);
