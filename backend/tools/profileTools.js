/**
 * Profile Tools
 * Tools for accessing student profile information
 */

const Student = require('../models/Student');

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
    getProjects,
    getCertifications
};
