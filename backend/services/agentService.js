/**
 * Agent Service
 * Core orchestrator for the AI Mentor Agent
 * Handles conversation flow, tool execution, and LLM interaction
 */

const Groq = require('groq-sdk');
const dayjs = require('dayjs');
const Student = require('../models/Student');
const AgentConversation = require('../models/AgentConversation');
const { toolDefinitions, executeTool, requiresConfirmation } = require('../tools');
const { calculateReadinessScore } = require('../utils/readinessScore');

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
 1. Use STUDENT_SNAPSHOT_JSON as the source of truth for the student's current stats (readiness breakdown, coding activity, profiles).
 2. Only call tools when you need to (a) sync/refresh data, (b) update data (profile/goals/roadmap), or (c) fetch details missing from the snapshot.
 3. If LeetCode/GitHub username is missing in the snapshot, ask for it so you can sync their data.
 4. You can perform multiple actions (like adding several goals) in a single turn.
4. Provide summaries of data and clear next steps.
5. When setting goals, include numeric targets and enable auto-tracking whenever possible (projects, certifications, coding problems, skills).
6. IMPORTANT: If the student asks for a roadmap/learning path/career plan (or says they want to become a role), you MUST ask exactly three short questions first (target role, current level, timeline/weekly time). Do NOT create a roadmap or call tools until all three are answered.

 Data labels:
 - Platform Diversity is the readiness category for number of active platforms (LeetCode/GitHub/logs).
 - GitHub repos are NOT the same as EvolvEd projects unless the student adds them as projects.

 Readiness Score Formula Knowledge:
 You know the placement readiness score (0-100) is calculated as:
 - Projects (max 20)
 - Coding Consistency from recent logs (max 15)
 - GitHub Activity (max 15)
 - Certifications (max 15)
 - Events (max 10)
 - Platform Diversity (max 10)
 - Skill Radar/Average (max 10)
 - Profile Skills listed (max 10)
 - Interview Preparation (max 10) - NEW: Based on mock interview performance (avgScore, completedSessions, improvement trend)
 - Streak Bonus (max 5)
 The final total is capped at 100.
 Important: "Coding Consistency" and "Platform Diversity" are based on recent activity (coding logs and/or synced LeetCode/GitHub stats), not just profile links.
 Interview Prep score rewards students who practice mock interviews and improve over time. Encourage students to complete mock interview sessions!
 Use this formula to explain exactly how the student can increase their score.

 Communication Skills Tracking:
 The snapshot includes detailed communication metrics from mock interviews:
 - Clarity: How well the student articulates thoughts (0-100 scale)
 - Structure: Logical organization and flow of answers (0-100 scale)
 - Conciseness: Ability to be brief without losing meaning (0-100 scale)
 - Overall Communication Average: Combined score across all three dimensions
 - Trend: Whether communication skills are improving, stable, or declining
 - Top Feedback: Most common communication feedback points from recent sessions
 
 Use these insights to provide targeted advice on improving interview communication skills. 
 For example, if clarity is lower than structure, suggest speaking more slowly and using simpler language.
 If conciseness is low, recommend practicing STAR method for behavioral questions.
 Celebrate improvements in communication scores and encourage consistent practice.

Remember: You're not just answering questions - you're actively helping ${firstName} improve their placement readiness and achieve their career goals.

 Internal Learning Hub:
 EvolvEd now has internal learning pages for specific skills. When generating a roadmap, you should prioritize linking to these internal resources for supported skills.
 Format: /student/learning/{skill-id} (e.g., /student/learning/python, /student/learning/javascript).
 Current supported internal skills: python, javascript, react, nodejs, mongodb, cybersecurity.
 Example resource entry in createRoadmap: { title: "Learn Python on EvolvEd", url: "/student/learning/python", type: "course" }
 
 Resource Guidelines:
 - ALWAYS prioritize linking to the **Original Documentation** of the tech/tool.
 - Official Documentation Sources:
   * Python: https://docs.python.org/3/
   * C: https://en.cppreference.com/w/c
   * C++: https://en.cppreference.com/w/cpp
   * Java: https://docs.oracle.com/en/java/
   * JavaScript: https://developer.mozilla.org/en-US/docs/Web/JavaScript
   * React: https://react.dev
   * Node.js: https://nodejs.org/docs/
 - For resources, use titles like "Official Documentation" or "Main Reference".
 - **CRITICAL**: DO NOT suggest or link to Codecademy. Instead, use alternatives like FreeCodeCamp, Coursera, EdX, or the tech's official documentation.
 - Ensure internal learning links (/student/learning/...) are the first resource in any skill-based milestone.

 Project Guidelines:
 - For milestones with category="project", you MUST provide exactly 1 problem statement in the \`problemStatements\` array. It must include: statement, requirements (array of strings), difficulty, and hints (array of strings). Projects do NOT require quizzes - set requiresQuiz to false for project milestones.
 - The options should vary slightly in focus (e.g., E-commerce vs. Social Media vs. Utility) but cover the same core skills.
 - Mark them as 'project' category.
 - Do not set \`requiresQuiz\` for projects.`;
}

function isRoadmapRequest(message = '') {
    const text = message.toLowerCase();
    return /\b(roadmap|learning path|learning journey|career path|career roadmap|study plan|plan my path|plan for|learning plan)\b/.test(text)
        || /\b(become|becoming|want to be|aim to be|targeting)\b.*\b(developer|engineer|analyst|scientist|designer)\b/.test(text)
        || /\b(full stack|full-stack|backend|frontend|data science|ai engineer|ml engineer)\b/.test(text);
}

function getRoadmapQuestions(student) {
    const firstName = student.firstName || student.name?.split(' ')[0] || 'there';
    return [
        `Great, ${firstName}. Before I build your roadmap, what exact role or goal are you targeting ? (e.g., AI Engineer, Full Stack Developer, Data Analyst)`,
        'What’s your current level and background? List the skills/tools you already know and any projects or internships you’ve done.',
        'What timeline and weekly time commitment can you realistically follow? (e.g., 8 weeks, 6 months; 5–8 hrs/week)'
    ];
}

function extractTargetRole(message = '') {
    const text = message.toLowerCase();
    if (/\bfull\s*stack\b/.test(text)) return 'Full Stack Developer';
    if (/\bfrontend\b/.test(text)) return 'Frontend Developer';
    if (/\bbackend\b/.test(text)) return 'Backend Developer';
    if (/\bdata\s*science\b/.test(text)) return 'Data Scientist';
    if (/\bai\s*engineer\b/.test(text)) return 'AI Engineer';
    if (/\bml\s*engineer\b/.test(text)) return 'ML Engineer';
    if (/\bdevops\b/.test(text)) return 'DevOps Engineer';
    return '';
}

function buildProfileSummary(student) {
    const skills = Array.isArray(student.skills) && student.skills.length > 0
        ? `Skills: ${student.skills.join(', ')} `
        : '';
    const projects = Array.isArray(student.projects) && student.projects.length > 0
        ? `Projects: ${student.projects.map(p => p.title).filter(Boolean).join(', ')} `
        : '';
    const experience = Array.isArray(student.experience) && student.experience.length > 0
        ? `Experience: ${student.experience.map(e => e.role || e.title).filter(Boolean).join(', ')} `
        : '';
    const certifications = Array.isArray(student.certifications) && student.certifications.length > 0
        ? `Certifications: ${student.certifications.map(c => c.name).filter(Boolean).join(', ')} `
        : '';

    const parts = [skills, projects, experience, certifications].filter(Boolean);
    return parts.length > 0 ? parts.join(' | ') : '';
}

function buildStudentSnapshot(student) {
    const codingProfiles = student.codingProfiles || {};
    const leetcode = student.leetcodeStats || {};
    const github = student.githubStats || {};
    const logs = Array.isArray(student.codingLogs) ? student.codingLogs : [];
    const last30Days = dayjs().subtract(30, 'day');
    const recentLogsCount = logs.filter(l => dayjs(l.date || l.createdAt).isAfter(last30Days)).length;

    const { total: readinessTotal, breakdown: readinessBreakdown } = calculateReadinessScore(student);

    const interviewStats = student.interviewStats || {};

    // Debug logging
    if (interviewStats.communication) {
        console.log('[Agent Snapshot] Communication data found:', {
            avgClarity: interviewStats.communication.avgClarity,
            avgStructure: interviewStats.communication.avgStructure,
            avgConciseness: interviewStats.communication.avgConciseness,
            overallAvg: interviewStats.communication.overallAvg
        });
    } else {
        console.log('[Agent Snapshot] No communication data available yet');
    }

    return {
        readinessScore: {
            total: readinessTotal,
            breakdown: {
                projects: { score: Number(readinessBreakdown.projects) || 0, max: 20 },
                codingConsistency: { score: Number(readinessBreakdown.codingConsistency) || 0, max: 15 },
                githubActivity: { score: Number(readinessBreakdown.githubActivity) || 0, max: 15 },
                certifications: { score: Number(readinessBreakdown.certifications) || 0, max: 15 },
                events: { score: Number(readinessBreakdown.events) || 0, max: 10 },
                platformDiversity: { score: Number(readinessBreakdown.skillDiversity) || 0, max: 10 },
                skillProficiency: { score: Number(readinessBreakdown.skillRadar) || 0, max: 10 },
                profileSkills: { score: Number(readinessBreakdown.skills) || 0, max: 10 },
                interviewPrep: { score: Number(readinessBreakdown.interviewPrep) || 0, max: 10 },
                streakBonus: { score: Number(readinessBreakdown.streakBonus) || 0, max: 5 }
            }
        },
        interviewPerformance: {
            totalSessions: interviewStats.totalSessions || 0,
            completedSessions: interviewStats.completedSessions || 0,
            avgScore: Number(interviewStats.avgScore) || 0,
            bestScore: Number(interviewStats.bestScore) || 0,
            lastSessionAt: interviewStats.lastSessionAt || null,
            recentTrend: interviewStats.recentTrend || 'stable',
            weakAreas: interviewStats.weakAreas || [],
            strongAreas: interviewStats.strongAreas || [],
            communication: {
                avgClarity: Number(interviewStats.communication?.avgClarity) || 0,
                avgStructure: Number(interviewStats.communication?.avgStructure) || 0,
                avgConciseness: Number(interviewStats.communication?.avgConciseness) || 0,
                overallAvg: Number(interviewStats.communication?.overallAvg) || 0,
                trend: interviewStats.communication?.trend || 'stable',
                topFeedback: interviewStats.communication?.topFeedback || []
            }
        },
        lastActiveAt: student.lastActiveAt || null,
        codingProfiles: {
            leetcode: codingProfiles.leetcode || '',
            github: codingProfiles.github || '',
            lastSyncedAt: codingProfiles.lastSyncedAt || null
        },
        leetcodeStats: {
            username: leetcode.username || codingProfiles.leetcode || '',
            totalSolved: leetcode.totalSolved || 0,
            streak: leetcode.streak || 0,
            recentActivity: leetcode.recentActivity || { last7Days: 0, last30Days: 0 },
            fetchedAt: leetcode.fetchedAt || null
        },
        githubStats: {
            username: github.username || codingProfiles.github || '',
            totalRepos: github.totalRepos || 0,
            totalStars: github.totalStars || 0,
            streak: github.streak || 0,
            recentActivity: github.recentActivity || { last7Days: 0, last30Days: 0 },
            calendarWarning: github.calendarWarning || null,
            fetchedAt: github.fetchedAt || null
        },
        codingLogs: {
            recent30DaysCount: recentLogsCount,
            latest: logs
                .slice()
                .sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0))
                .slice(0, 5)
                .map(l => ({
                    date: l.date || l.createdAt || null,
                    platform: l.platform || 'Unknown',
                    activity: l.activity || 'Practice',
                    problemsSolved: Number(l.problemsSolved) || 0,
                    minutesSpent: Number(l.minutesSpent) || 0
                }))
        }
    };
}

function isProfileReference(message = '') {
    const text = message.toLowerCase();
    return /\b(profile|already in profile|in my profile|from profile|use my profile|check my profile)\b/.test(text);
}

function buildRoadmapIntakePrompt(intake) {
    return `Create a personalized roadmap now using the answers below.Do NOT ask more questions.Use the createRoadmap tool.

        Roadmap intake summary:
- Target role / goal: ${intake.answers.q1 || 'Not specified'}
    - Current level / skills / projects: ${intake.answers.q2 || 'Not specified'}
    - Timeline & weekly commitment: ${intake.answers.q3 || 'Not specified'}

If details are missing, make reasonable assumptions and state them briefly in your response.`;
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

    const roadmapQuestions = getRoadmapQuestions(student);
    const intake = conversation.metadata.roadmapIntake || { status: 'none', step: 0, answers: {} };

    // Roadmap intake flow (3 questions)
    if (intake.status === 'pending') {
        if (intake.step === 1) {
            intake.answers.q1 = extractTargetRole(userMessage) || userMessage;
            intake.step = 2;
            conversation.metadata.roadmapIntake = intake;
            const question = roadmapQuestions[1];
            conversation.addMessage('assistant', question);
            await conversation.save();
            return {
                message: question,
                toolsUsed: [],
                conversationId: conversation._id.toString(),
                timestamp: new Date().toISOString()
            };
        }

        if (intake.step === 2) {
            if (isProfileReference(userMessage)) {
                const profileSummary = buildProfileSummary(student);
                if (profileSummary) {
                    intake.answers.q2 = profileSummary;
                } else {
                    intake.answers.q2 = 'Profile details not available; assume beginner with basic programming knowledge.';
                }
            } else {
                intake.answers.q2 = userMessage;
            }
            intake.step = 3;
            conversation.metadata.roadmapIntake = intake;
            const question = roadmapQuestions[2];
            conversation.addMessage('assistant', question);
            await conversation.save();
            return {
                message: question,
                toolsUsed: [],
                conversationId: conversation._id.toString(),
                timestamp: new Date().toISOString()
            };
        }

        if (intake.step === 3) {
            intake.answers.q3 = userMessage;
            conversation.metadata.roadmapIntake = intake;
        }
    }

    if (intake.status !== 'pending' && isRoadmapRequest(userMessage)) {
        const inferredRole = extractTargetRole(userMessage);
        const profileSummary = buildProfileSummary(student);
        const hasProfileSummary = Boolean(profileSummary);
        conversation.metadata.roadmapIntake = {
            status: 'pending',
            step: inferredRole ? (hasProfileSummary ? 3 : 2) : 1,
            initialRequest: userMessage,
            answers: { q1: inferredRole || '', q2: hasProfileSummary ? profileSummary : '', q3: '' },
            startedAt: new Date()
        };
        const question = inferredRole
            ? (hasProfileSummary ? roadmapQuestions[2] : roadmapQuestions[1])
            : roadmapQuestions[0];
        conversation.addMessage('assistant', question);
        await conversation.save();
        return {
            message: question,
            toolsUsed: [],
            conversationId: conversation._id.toString(),
            timestamp: new Date().toISOString()
        };
    }

    // Build messages array for LLM
    const systemPrompt = buildSystemPrompt(student);
    const recentContext = conversation.getRecentContext(10);

    const snapshot = buildStudentSnapshot(student);

    if (process.env.AGENT_DEBUG === 'true') {
        console.log('[agent] snapshot:', JSON.stringify(snapshot));
    }

    const messages = [
        { role: 'system', content: systemPrompt },
        {
            role: 'system',
            content: `STUDENT_SNAPSHOT_JSON: \n${JSON.stringify(snapshot)} `
        },
        ...recentContext
    ];

    if (intake.status === 'pending' && intake.step === 3 && intake.answers.q3) {
        messages.push({
            role: 'system',
            content: buildRoadmapIntakePrompt(intake)
        });
    }

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
                console.log(`Executing write operation: ${toolName} `, toolArgs);
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
                console.error(`Tool execution error(${toolName}): `, error);
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

    if (intake.status === 'pending' && intake.step === 3 && intake.answers.q3) {
        conversation.metadata.roadmapIntake = {
            status: 'none',
            step: 0,
            initialRequest: '',
            answers: { q1: '', q2: '', q3: '' },
            startedAt: null
        };
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
