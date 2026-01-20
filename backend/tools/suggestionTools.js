/**
 * Suggestion Tools
 * Tools for generating AI-powered suggestions and recommendations
 */

const Student = require('../models/Student');
const { calculateReadinessScore } = require('../utils/readinessScore');

/**
 * Get quick improvement suggestions based on profile gaps
 */
async function getQuickSuggestions(studentId, args = {}) {
    const student = await Student.findById(studentId);
    if (!student) {
        throw new Error('Student not found');
    }

    const { total, breakdown } = calculateReadinessScore(student);
    const suggestions = [];

    // Profile completeness suggestions
    if (!student.headline) {
        suggestions.push({
            type: 'profile',
            priority: 'high',
            title: 'Add a professional headline',
            description: 'A compelling headline helps recruiters understand your focus at a glance'
        });
    }

    if (!student.summary || student.summary.length < 50) {
        suggestions.push({
            type: 'profile',
            priority: 'high',
            title: 'Write a detailed summary',
            description: 'A 100-200 word summary showcasing your skills and aspirations improves visibility'
        });
    }

    if ((student.skills || []).length < 5) {
        suggestions.push({
            type: 'skills',
            priority: 'medium',
            title: 'Add more skills',
            description: `You have ${(student.skills || []).length} skills listed. Adding 5-10 relevant skills improves matching with job requirements`
        });
    }

    // Project suggestions
    const projectCount = (student.projects || []).length;
    if (projectCount < 3) {
        suggestions.push({
            type: 'projects',
            priority: 'high',
            title: 'Add more projects',
            description: `You have ${projectCount} project(s). Having 3-5 quality projects significantly boosts your profile`
        });
    }

    // Coding activity suggestions
    const leetcodeStats = student.leetcodeStats || {};
    if (!leetcodeStats.username) {
        suggestions.push({
            type: 'coding',
            priority: 'high',
            title: 'Connect your LeetCode profile',
            description: 'Syncing your LeetCode data showcases your problem-solving skills to recruiters'
        });
    } else if ((leetcodeStats.totalSolved || 0) < 100) {
        suggestions.push({
            type: 'coding',
            priority: 'medium',
            title: 'Increase LeetCode problems solved',
            description: `You've solved ${leetcodeStats.totalSolved || 0} problems. Aim for 100+ to demonstrate consistency`
        });
    }

    // Certification suggestions
    const certCount = (student.certifications || []).length;
    if (certCount === 0) {
        suggestions.push({
            type: 'certifications',
            priority: 'medium',
            title: 'Add certifications',
            description: 'Industry certifications from platforms like Coursera, AWS, or Google add credibility'
        });
    }

    // Goal suggestions
    const activeGoals = (student.goals || []).filter(g =>
        g.status === 'pending' || g.status === 'in_progress'
    );
    if (activeGoals.length === 0) {
        suggestions.push({
            type: 'goals',
            priority: 'medium',
            title: 'Set some learning goals',
            description: 'Having clear goals helps track progress and demonstrates ambition to recruiters'
        });
    }

    // Streak suggestions
    if ((student.streakDays || 0) < 7) {
        suggestions.push({
            type: 'consistency',
            priority: 'low',
            title: 'Build your activity streak',
            description: 'Daily coding practice builds a streak that showcases your dedication'
        });
    }

    return {
        currentScore: total,
        suggestionsCount: suggestions.length,
        suggestions: suggestions.sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        }),
        quickWins: suggestions.filter(s => s.priority === 'high').slice(0, 3)
    };
}

const TARGET_ROLES = {
    'frontend': ['HTML', 'CSS', 'JavaScript', 'React', 'TypeScript', 'Tailwind', 'Next.js', 'Redux'],
    'backend': ['Node.js', 'Express', 'MongoDB', 'PostgreSQL', 'Redis', 'Docker', 'AWS', 'Python'],
    'fullstack': ['React', 'Node.js', 'Express', 'MongoDB', 'TypeScript', 'AWS', 'Next.js'],
    'data-science': ['Python', 'Pandas', 'NumPy', 'Scikit-learn', 'SQL', 'TensorFlow', 'Tableau'],
    'devops': ['Linux', 'Docker', 'Kubernetes', 'Jenkins', 'Terraform', 'AWS', 'CI/CD']
};

/**
 * Identify missing skills for specific carrier paths
 */
async function getSkillGaps(studentId, args = {}) {
    const { targetRole = 'fullstack' } = args;
    const student = await Student.findById(studentId);
    if (!student) throw new Error('Student not found');

    const mySkills = (student.skills || []).map(s => s.toLowerCase());
    const roleSkills = TARGET_ROLES[targetRole.toLowerCase()] || TARGET_ROLES['fullstack'];

    const missing = roleSkills.filter(s => !mySkills.includes(s.toLowerCase()));

    return {
        targetRole,
        matchedSkills: roleSkills.filter(s => mySkills.includes(s.toLowerCase())),
        missingSkills: missing,
        matchPercentage: Math.round(((roleSkills.length - missing.length) / roleSkills.length) * 100)
    };
}

/**
 * Suggest projects based on skill gaps
 */
async function getProjectRecommendations(studentId, args = {}) {
    const { targetRole = 'fullstack' } = args;
    const { missingSkills } = await getSkillGaps(studentId, { targetRole });

    const recommendations = [];

    if (missingSkills.includes('React') || missingSkills.includes('Next.js')) {
        recommendations.push({
            title: 'Personal Portfolio with Next.js',
            description: 'Build a high-performance portfolio using Next.js, Tailwind, and Framer Motion.',
            skillsToGain: ['Next.js', 'Tailwind', 'Animations']
        });
    }

    if (missingSkills.includes('Node.js') || missingSkills.includes('MongoDB')) {
        recommendations.push({
            title: 'E-commerce Backend API',
            description: 'Design a RESTful API with Node.js, Express, and MongoDB for a store.',
            skillsToGain: ['Node.js', 'Express', 'MongoDB', 'Authentication']
        });
    }

    if (missingSkills.includes('Docker') || missingSkills.includes('AWS')) {
        recommendations.push({
            title: 'Containerized Deployment Pipeline',
            description: 'Set up a CI/CD pipeline using Docker and deploy to AWS EC2 or S3.',
            skillsToGain: ['Docker', 'AWS', 'CI/CD']
        });
    }

    if (recommendations.length === 0) {
        recommendations.push({
            title: 'Open Source Contribution',
            description: 'Since you have core skills, start contributing to popular repositories in your field.',
            skillsToGain: ['Git', 'Code Review', 'Teamwork']
        });
    }

    return {
        targetRole,
        recommendations: recommendations.slice(0, 3)
    };
}

module.exports = {
    getQuickSuggestions,
    getSkillGaps,
    getProjectRecommendations
};
