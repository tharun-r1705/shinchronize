/**
 * Agent Tool Registry
 * Central registry of all tools available to the AI agent
 */

const profileTools = require('./profileTools');
const codingTools = require('./codingTools');
const readinessTools = require('./readinessTools');
const goalTools = require('./goalTools');
const suggestionTools = require('./suggestionTools');
const roadmapTools = require('./roadmapTools');

// Tool definitions for Groq function calling
const toolDefinitions = [
    {
        type: 'function',
        function: {
            name: 'getStudentProfile',
            description: 'Get the current student\'s profile information including name, college, branch, CGPA, skills, and online presence links',
            parameters: {
                type: 'object',
                properties: {},
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'getCodingActivity',
            description: 'Get the student\'s coding activity including LeetCode/GitHub stats, streaks, and recent logs',
            parameters: {
                type: 'object',
                properties: {
                    timeframe: {
                        type: 'string',
                        description: 'Timeframe for activity: "week", "month", or "all"',
                        enum: ['week', 'month', 'all']
                    }
                },
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'syncCodingPlatforms',
            description: 'Sync the latest activity from LeetCode profile',
            parameters: {
                type: 'object',
                properties: {},
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'syncGitHubStats',
            description: 'Sync the latest GitHub stats (repos, stars, contribution calendar when token is set)',
            parameters: {
                type: 'object',
                properties: {
                    username: {
                        type: 'string',
                        description: 'GitHub username (optional). If omitted, uses the username saved in profile.'
                    }
                },
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'getReadinessScore',
            description: 'Calculate and return the student\'s placement readiness score with detailed breakdown by category',
            parameters: {
                type: 'object',
                properties: {},
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'getGoals',
            description: 'Get the student\'s current goals including their status, progress, and target dates',
            parameters: {
                type: 'object',
                properties: {},
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'addGoal',
            description: 'Add a new goal for the student. Use this when the student wants to set a new learning or career goal.',
            parameters: {
                type: 'object',
                properties: {
                    title: {
                        type: 'string',
                        description: 'The title of the goal'
                    },
                    description: {
                        type: 'string',
                        description: 'Detailed description of the goal'
                    },
                    category: {
                        type: 'string',
                        description: 'Category of the goal',
                        enum: ['skill', 'project', 'certification', 'placement', 'coding', 'other']
                    },
                    targetDate: {
                        type: 'string',
                        description: 'Target completion date in ISO format (YYYY-MM-DD)'
                    },
                    targetValue: {
                        type: 'number',
                        description: 'Numeric target for the goal (e.g., 5 projects, 50 problems)'
                    },
                    unit: {
                        type: 'string',
                        description: 'Unit label for the target (e.g., projects, problems, skills)'
                    },
                    autoTrack: {
                        type: 'string',
                        description: 'Auto-tracking source for progress updates',
                        enum: ['none', 'projects', 'certifications', 'coding_problems', 'coding_logs', 'skills']
                    }
                },
                required: ['title']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'updateGoalProgress',
            description: 'Update the progress of an existing goal',
            parameters: {
                type: 'object',
                properties: {
                    goalId: {
                        type: 'string',
                        description: 'The ID of the goal to update'
                    },
                    progress: {
                        type: 'number',
                        description: 'Progress percentage (0-100)'
                    },
                    status: {
                        type: 'string',
                        description: 'New status of the goal',
                        enum: ['pending', 'in_progress', 'completed', 'abandoned']
                    }
                },
                required: ['goalId']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'getQuickSuggestions',
            description: 'Get AI-generated quick improvement suggestions based on the student\'s current profile and gaps',
            parameters: {
                type: 'object',
                properties: {},
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'getProjects',
            description: 'Get the student\'s projects with their status and details',
            parameters: {
                type: 'object',
                properties: {},
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'getCertifications',
            description: 'Get the student\'s certifications and their verification status',
            parameters: {
                type: 'object',
                properties: {},
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'compareWithPeers',
            description: 'Compare the student\'s readiness and coding stats with their peers in the same branch and year',
            parameters: {
                type: 'object',
                properties: {},
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'getSkillGaps',
            description: 'Identify technical skills the student is missing for a specific target role',
            parameters: {
                type: 'object',
                properties: {
                    targetRole: {
                        type: 'string',
                        description: 'The job role to benchmark against',
                        enum: ['frontend', 'backend', 'fullstack', 'data-science', 'devops']
                    }
                },
                required: ['targetRole']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'getProjectRecommendations',
            description: 'Suggest specific projects to fill skill gaps for a target career path',
            parameters: {
                type: 'object',
                properties: {
                    targetRole: {
                        type: 'string',
                        description: 'The career path the student is interested in',
                        enum: ['frontend', 'backend', 'fullstack', 'data-science', 'devops']
                    }
                },
                required: ['targetRole']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'updateProfile',
            description: 'Update the student\'s profile information. Use this when the student provides new information like date of birth, location, or social links.',
            parameters: {
                type: 'object',
                properties: {
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    dateOfBirth: { type: 'string', description: 'Date of birth in ISO format (YYYY-MM-DD)' },
                    location: { type: 'string' },
                    headline: { type: 'string' },
                    summary: { type: 'string' },
                    githubUrl: { type: 'string' },
                    linkedinUrl: { type: 'string' },
                    portfolioUrl: { type: 'string' },
                    leetcodeUrl: { type: 'string' },
                    leetcodeUsername: { type: 'string', description: 'The student\'s LeetCode username (not the full URL)' },
                    githubUsername: { type: 'string', description: 'The student\'s GitHub username (not the full URL)' }
                },
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'addProject',
            description: 'Add a new project to the student\'s profile.',
            parameters: {
                type: 'object',
                properties: {
                    title: { type: 'string', description: 'The title of the project' },
                    description: { type: 'string', description: 'Detailed description of the project' },
                    githubLink: { type: 'string', description: 'URL to the GitHub repository' },
                    tags: { type: 'array', items: { type: 'string' }, description: 'Technologies used (e.g., ["React", "Node.js"])' }
                },
                required: ['title']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'removeGoal',
            description: 'Remove a specific goal. Use this when the student wants to delete a goal.',
            parameters: {
                type: 'object',
                properties: {
                    goalId: {
                        type: 'string',
                        description: 'The ID of the goal to remove'
                    }
                },
                required: ['goalId']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'clearGoals',
            description: 'Remove all goals for the student. Use this when the student wants to start fresh and remove all existing goals.',
            parameters: {
                type: 'object',
                properties: {},
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'createRoadmap',
            description: 'Create a personalized career roadmap for the student based on their goals, skills, and target role. Use this when the student wants to create a learning path or career plan.',
            parameters: {
                type: 'object',
                properties: {
                    title: {
                        type: 'string',
                        description: 'The title of the roadmap (e.g., "Full Stack Developer Journey")'
                    },
                    targetRole: {
                        type: 'string',
                        description: 'The target career role for this roadmap'
                    },
                    milestones: {
                        type: 'array',
                        description: 'Array of milestone objects for the roadmap',
                        items: {
                            type: 'object',
                            properties: {
                                title: { type: 'string', description: 'Milestone title' },
                                description: { type: 'string', description: 'What to accomplish' },
                                category: {
                                    type: 'string',
                                    enum: ['skill', 'project', 'certification', 'interview', 'networking', 'other']
                                },
                                duration: { type: 'string', description: 'Estimated time (e.g., "2 weeks")' },
                                skills: { type: 'array', items: { type: 'string' }, description: 'Skills to gain' },
                                resources: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            title: { type: 'string', description: 'Resource name' },
                                            url: { type: 'string', description: 'Resource URL' },
                                            type: { type: 'string', description: 'Resource type (e.g., video, article, course, tutorial, documentation)' }
                                        }
                                    },
                                    description: 'Helpful resources with title, url, and type'
                                }
                            },
                            required: ['title', 'description', 'category']
                        }
                    },
                    problemStatements: {
                        type: 'array',
                        description: 'For project milestones only - 3 problem statements with requirements and hints',
                        items: {
                            type: 'object',
                            properties: {
                                statement: { type: 'string' },
                                requirements: { type: 'array', items: { type: 'string' } },
                                difficulty: { type: 'string' },
                                hints: { type: 'array', items: { type: 'string' } }
                            }
                        }
                    },
                    projectOptions: {
                        type: 'array',
                        description: 'Three distinct project options for project milestones',
                        items: {
                            type: 'object',
                            properties: {
                                title: { type: 'string' },
                                description: { type: 'string' },
                                difficulty: { type: 'string', enum: ['Beginner', 'Intermediate'] },
                                tags: { type: 'array', items: { type: 'string' } }
                            }
                        }
                    }
                },
                required: ['title', 'targetRole', 'milestones']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'getRoadmap',
            description: 'Get the student\'s current active roadmap with all milestones and progress',
            parameters: {
                type: 'object',
                properties: {},
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'updateMilestoneStatus',
            description: 'Update the status of a specific milestone in the roadmap',
            parameters: {
                type: 'object',
                properties: {
                    milestoneId: {
                        type: 'string',
                        description: 'The ID of the milestone to update'
                    },
                    status: {
                        type: 'string',
                        description: 'New status of the milestone',
                        enum: ['not-started', 'in-progress', 'completed']
                    }
                },
                required: ['milestoneId', 'status']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'addMilestone',
            description: 'Add a new milestone to the existing roadmap',
            parameters: {
                type: 'object',
                properties: {
                    title: { type: 'string', description: 'Milestone title' },
                    description: { type: 'string', description: 'What to accomplish' },
                    category: {
                        type: 'string',
                        enum: ['skill', 'project', 'certification', 'interview', 'networking', 'other']
                    },
                    duration: { type: 'string', description: 'Estimated time' },
                    skills: { type: 'array', items: { type: 'string' }, description: 'Skills to gain' },
                    resources: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                title: { type: 'string' },
                                url: { type: 'string' },
                                type: { type: 'string', description: 'Resource type (video, article, course, etc.)' }
                            }
                        },
                        description: 'Helpful resources'
                    },
                    insertAfter: { type: 'string', description: 'ID of milestone to insert after (optional)' }
                },
                required: ['title', 'description', 'category']
            }
        }
    }
];

// Tool handler mapping
const toolHandlers = {
    getStudentProfile: profileTools.getStudentProfile,
    getCodingActivity: codingTools.getCodingActivity,
    syncCodingPlatforms: codingTools.syncCodingPlatforms,
    syncGitHubStats: codingTools.syncGitHubStats,
    getReadinessScore: readinessTools.getReadinessScore,
    getGoals: goalTools.getGoals,
    addGoal: goalTools.addGoal,
    updateGoalProgress: goalTools.updateGoalProgress,
    getQuickSuggestions: suggestionTools.getQuickSuggestions,
    getProjects: profileTools.getProjects,
    getCertifications: profileTools.getCertifications,
    updateProfile: profileTools.updateProfile,
    addProject: profileTools.addProject,
    compareWithPeers: readinessTools.compareWithPeers,
    getSkillGaps: suggestionTools.getSkillGaps,
    getProjectRecommendations: suggestionTools.getProjectRecommendations,
    removeGoal: goalTools.removeGoal,
    clearGoals: goalTools.clearGoals,
    createRoadmap: roadmapTools.createRoadmap,
    getRoadmap: roadmapTools.getRoadmap,
    updateMilestoneStatus: roadmapTools.updateMilestoneStatus,
    addMilestone: roadmapTools.addMilestone,
    deleteRoadmap: roadmapTools.deleteRoadmap
};

// Execute a tool by name
async function executeTool(toolName, args, studentId) {
    const handler = toolHandlers[toolName];
    if (!handler) {
        throw new Error(`Unknown tool: ${toolName}`);
    }

    return await handler(studentId, args);
}

// Check if a tool requires confirmation (write operations)
function requiresConfirmation(toolName) {
    const writeTools = ['addGoal', 'updateGoalProgress', 'addProject', 'updateProfile', 'syncCodingPlatforms', 'syncGitHubStats', 'removeGoal', 'clearGoals', 'createRoadmap', 'updateMilestoneStatus', 'addMilestone', 'deleteRoadmap'];
    return writeTools.includes(toolName);
}

module.exports = {
    toolDefinitions,
    toolHandlers,
    executeTool,
    requiresConfirmation
};
