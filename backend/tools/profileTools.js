/**
 * Profile Tools
 * Tools for accessing student profile information
 */

const Student = require('../models/Student');
const { syncAutoGoals } = require('../utils/goalSync');

/**
 * Get student profile information
 */
async function getStudentProfile(studentId, args = {}) {
    const student = await Student.findById(studentId);
    if (!student) {
        throw new Error('Student not found');
    }

    return {
        name: student.name,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        college: student.college,
        branch: student.branch,
        year: student.year,
        graduationYear: student.graduationYear,
        cgpa: student.cgpa,
        dateOfBirth: student.dateOfBirth,
        location: student.location,
        headline: student.headline,
        summary: student.summary,
        skills: student.skills || [],
        linkedinUrl: student.linkedinUrl,
        githubUrl: student.githubUrl,
        portfolioUrl: student.portfolioUrl,
        leetcodeUrl: student.leetcodeUrl,
        hackerrankUrl: student.hackerrankUrl,
        streakDays: student.streakDays || 0,
        badges: student.badges || [],
        projectCount: (student.projects || []).length,
        certificationCount: (student.certifications || []).length,
        eventCount: (student.events || []).length,
        isProfileComplete: student.isProfileComplete
    };
}

/**
 * Update student profile information
 */
async function updateProfile(studentId, args = {}) {
    const student = await Student.findById(studentId);
    if (!student) {
        throw new Error('Student not found');
    }

    const allowedUpdates = [
        'firstName', 'lastName', 'dateOfBirth', 'gender', 'college',
        'branch', 'year', 'graduationYear', 'cgpa', 'phone',
        'location', 'portfolioUrl', 'linkedinUrl', 'githubUrl',
        'resumeUrl', 'headline', 'summary', 'leetcodeUrl', 'hackerrankUrl'
    ];

    Object.keys(args).forEach(key => {
        if (allowedUpdates.includes(key)) {
            student[key] = args[key];
        }
    });

    // Handle special mappings for coding profiles
    if (args.leetcodeUsername) {
        if (!student.codingProfiles) student.codingProfiles = {};
        student.codingProfiles.leetcode = args.leetcodeUsername;
    }
    if (args.hackerrankUsername) {
        if (!student.codingProfiles) student.codingProfiles = {};
        student.codingProfiles.hackerrank = args.hackerrankUsername;
    }

    await student.save();

    return {
        success: true,
        message: 'Profile updated successfully',
        updatedFields: Object.keys(args).filter(key => allowedUpdates.includes(key))
    };
}

/**
 * Add a new project to the student profile
 */
async function addProject(studentId, args = {}) {
    const student = await Student.findById(studentId);
    if (!student) {
        throw new Error('Student not found');
    }

    if (!args.title) {
        throw new Error('Project title is required');
    }

    const newProject = {
        title: args.title,
        description: args.description || '',
        githubLink: args.githubLink || '',
        tags: args.tags || [],
        status: 'pending',
        submittedAt: new Date()
    };

    student.projects.push(newProject);
    syncAutoGoals(student);
    await student.save();

    const addedProject = student.projects[student.projects.length - 1];

    return {
        success: true,
        message: 'Project added successfully',
        project: {
            id: addedProject._id.toString(),
            title: addedProject.title,
            status: addedProject.status
        }
    };
}

/**
 * Get student projects
 */
async function getProjects(studentId, args = {}) {
    const student = await Student.findById(studentId);
    if (!student) {
        throw new Error('Student not found');
    }

    const projects = (student.projects || []).map(p => ({
        id: p._id.toString(),
        title: p.title,
        description: p.description,
        githubLink: p.githubLink,
        tags: p.tags || [],
        status: p.status,
        submittedAt: p.submittedAt
    }));

    return {
        total: projects.length,
        verified: projects.filter(p => p.status === 'verified').length,
        projects
    };
}

/**
 * Get student certifications
 */
async function getCertifications(studentId, args = {}) {
    const student = await Student.findById(studentId);
    if (!student) {
        throw new Error('Student not found');
    }

    const certifications = (student.certifications || []).map(c => ({
        id: c._id.toString(),
        name: c.name,
        provider: c.provider,
        issuedDate: c.issuedDate,
        status: c.status,
        certificateId: c.certificateId
    }));

    return {
        total: certifications.length,
        verified: certifications.filter(c => c.status === 'verified').length,
        certifications
    };
}

module.exports = {
    getStudentProfile,
    updateProfile,
    addProject,
    getProjects,
    getCertifications
};
