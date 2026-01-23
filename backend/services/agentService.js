/**
 * Agent Service
 * Core orchestrator for the AI Mentor Agent
 * Handles conversation flow, tool execution, and LLM interaction
 */

const Groq = require('groq-sdk');
const Student = require('../models/Student');
const AgentConversation = require('../models/AgentConversation');
const { toolDefinitions, executeTool, requiresConfirmation } = require('../tools');

const MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

const groqClient = process.env.GROQ_API_KEY
    ? new Groq({ apiKey: process.env.GROQ_API_KEY })
    : null;

/**
 * Build personalized system prompt for the agent
 */
function buildSystemPrompt(student) {
    const firstName = student.firstName || student.name?.split(' ')[0] || 'there';
    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return `You are Zenith, an AI career mentor for EvolvEd - a campus placement intelligence platform. You're helping ${firstName}, a ${student.branch || 'engineering'} student at ${student.college || 'their college'}.

Today is ${today}.

Your personality:
- Warm, encouraging, but also direct and actionable
- Think like a senior engineer mentoring a junior
- Use data from tools to back up your advice
- Be concise but thorough when explaining concepts
- Celebrate wins, no matter how small

Guidance:
1. Always check the student's current status using tools before giving specific advice.
2. If the student has not provided their LeetCode/HackerRank username, ask for it so you can sync their data.
3. You can perform multiple actions (like adding several goals) in a single turn.
4. Provide summaries of data and clear next steps.
5. When setting goals, include numeric targets and enable auto-tracking whenever possible (projects, certifications, coding problems, skills).

Readiness Score Formula Knowledge:
You know the placement readiness score (0-100) is calculated as:
- Projects (30 pts): 12 pts per project.
- Coding Consistency (20 pts): 2 pts per log in last 30 days.
- Certifications (20 pts): 5 pts each.
- Skills (10 pts): 2 pts per skill listed.
- Skill Radar/Average (10 pts): Based on skill proficiency.
- Skill Diversity (10 pts): 5 pts per unique platform used.
- Events (10 pts): 3 pts each.
- Streak Bonus (5 pts): 0.2 pts per day of streak.
Use this formula to explain to students exactly how they can increase their score!

Remember: You're not just answering questions - you're actively helping ${firstName} improve their placement readiness and achieve their career goals.`;
}

/**
 * Process a message from the user
 */
async function processMessage(studentId, userMessage, conversationId = null) {
    if (!groqClient) {
        throw new Error('AI service is not configured. Please set GROQ_API_KEY.');
    }

    // Get student data
    const student = await Student.findById(studentId);
    if (!student) {
        throw new Error('Student not found');
    }

    // Get or create conversation
    const conversation = await AgentConversation.getOrCreate(studentId);

    // Add user message to conversation
    conversation.addMessage('user', userMessage);

    // Build messages array for LLM
    const systemPrompt = buildSystemPrompt(student);
    const recentContext = conversation.getRecentContext(10);

    const messages = [
        { role: 'system', content: systemPrompt },
        ...recentContext
    ];

    // First LLM call with tools
    let response;
    try {
        response = await groqClient.chat.completions.create({
            model: MODEL,
            temperature: 0.1, // Lower for more reliable tool calls
            max_tokens: 1024,
            messages,
            tools: toolDefinitions,
            tool_choice: 'auto'
        });
    } catch (error) {
        console.error('Groq API error:', error);
        throw new Error('AI service is currently unavailable. Please try again in a moment.');
    }

    const assistantMessage = response.choices[0]?.message;

    if (!assistantMessage) {
        throw new Error('Empty response from AI service');
    }

    // Check if the model wants to call tools
    const toolCalls = assistantMessage.tool_calls || [];
    let finalContent = assistantMessage.content || '';
    const executedTools = [];

    if (toolCalls.length > 0) {
        // Execute each tool call
        const toolResults = [];

        for (const toolCall of toolCalls) {
            const toolName = toolCall.function.name;
            let toolArgs = {};

            try {
                toolArgs = JSON.parse(toolCall.function.arguments || '{}');
            } catch (e) {
                console.error('Failed to parse tool arguments:', e);
            }

            // Check if this tool requires confirmation
            if (requiresConfirmation(toolName)) {
                // For now, we'll execute anyway but log it
                // In production, this would trigger a confirmation flow
                console.log(`Executing write operation: ${toolName}`, toolArgs);
            }

            try {
                const result = await executeTool(toolName, toolArgs, studentId);
                toolResults.push({
                    tool_call_id: toolCall.id,
                    role: 'tool',
                    content: JSON.stringify(result)
                });
                executedTools.push({
                    name: toolName,
                    arguments: toolArgs,
                    result
                });
            } catch (error) {
                console.error(`Tool execution error (${toolName}):`, error);
                toolResults.push({
                    tool_call_id: toolCall.id,
                    role: 'tool',
                    content: JSON.stringify({ error: error.message })
                });
                executedTools.push({
                    name: toolName,
                    arguments: toolArgs,
                    result: { error: error.message }
                });
            }
        }

        // Second LLM call with tool results
        const followUpMessages = [
            ...messages,
            assistantMessage,
            ...toolResults
        ];

        try {
            const followUp = await groqClient.chat.completions.create({
                model: MODEL,
                temperature: 0.7,
                max_tokens: 1024,
                messages: followUpMessages
            });

            finalContent = followUp.choices[0]?.message?.content || '';
        } catch (error) {
            console.error('Groq follow-up error:', error);
            // Fall back to a generic response
            finalContent = 'I retrieved the information, but had trouble formatting my response. Please try again.';
        }
    }

    // Save assistant response to conversation
    conversation.addMessage('assistant', finalContent, executedTools);
    await conversation.save();

    return {
        message: finalContent,
        toolsUsed: executedTools.map(t => t.name),
        conversationId: conversation._id.toString(),
        timestamp: new Date().toISOString()
    };
}

/**
 * Get conversation history for a student
 */
async function getConversationHistory(studentId, limit = 50) {
    const conversation = await AgentConversation.findOne({ studentId })
        .sort({ 'metadata.lastActiveAt': -1 });

    if (!conversation) {
        return { messages: [], conversationId: null };
    }

    const messages = conversation.messages.slice(-limit).map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
        toolCalls: m.toolCalls || []
    }));

    return {
        messages,
        conversationId: conversation._id.toString(),
        metadata: conversation.metadata
    };
}

/**
 * Clear conversation history for a student
 */
async function clearConversation(studentId) {
    await AgentConversation.deleteMany({ studentId });
    return { success: true, message: 'Conversation history cleared' };
}

module.exports = {
    processMessage,
    getConversationHistory,
    clearConversation,
    buildSystemPrompt
};
