const dayjs = require('dayjs');

/**
 * Calculate a placement readiness score for a student based on activity and achievements.
 * The calculation is intentionally opinionated but documented so it can be tuned easily.
 * @param {import('../models/Student')} studentDoc - A hydrated Student mongoose document
 * @returns {{ total: number, breakdown: Record<string, number> }}
 */
const calculateReadinessScore = (studentDoc) => {
  if (!studentDoc) {
    return { total: 0, breakdown: {} };
  }

  const safeProjects = studentDoc.projects || [];
  const safeCodingLogs = studentDoc.codingLogs || [];
  const safeCertifications = studentDoc.certifications || [];
  const safeEvents = studentDoc.events || [];
  const skillRadar = studentDoc.skillRadar || new Map();
  const skills = studentDoc.skills || [];

  // Count ALL projects, not just verified ones
  // Since we removed verification status, all projects should count
  const allProjects = safeProjects;

  const consistencyWindow = 30;
  const recentLogs = safeCodingLogs.filter((log) =>
    dayjs(log.date || log.createdAt).isAfter(dayjs().subtract(consistencyWindow, 'day'))
  );

  const uniquePlatforms = new Set(recentLogs.map((log) => log.platform?.toLowerCase()).filter(Boolean));

  // Updated scoring to count all projects
  const projectScore = Math.min(allProjects.length * 12, 30);
  const codingConsistencyScore = Math.min(recentLogs.length * 2, 20);
  const certificationScore = Math.min(safeCertifications.length * 5, 20);
  const eventScore = Math.min(safeEvents.length * 3, 10);
  const skillDiversityScore = Math.min(uniquePlatforms.size * 5, 10);

  let skillRadarScore = 0;
  if (skillRadar instanceof Map || typeof skillRadar === 'object') {
    const skillValues = Array.from(skillRadar.values ? skillRadar.values() : Object.values(skillRadar));
    if (skillValues.length > 0) {
      const average = skillValues.reduce((sum, value) => sum + value, 0) / skillValues.length;
      skillRadarScore = Math.min(Math.round((average / 100) * 10), 10);
    }
  }

  // Add score for skills listed in profile (up to 10 points)
  const skillsScore = Math.min(skills.length * 2, 10);

  const streakBonus = Math.min((studentDoc.streakDays || 0) * 0.2, 5);

  const breakdown = {
    projects: projectScore,
    codingConsistency: codingConsistencyScore,
    certifications: certificationScore,
    events: eventScore,
    skillDiversity: skillDiversityScore,
    skillRadar: skillRadarScore,
    skills: skillsScore,
    streakBonus,
  };

  const total = Math.min(
    100,
    Math.round(
      projectScore +
        codingConsistencyScore +
        certificationScore +
        eventScore +
        skillDiversityScore +
        skillRadarScore +
        skillsScore +
        streakBonus
    )
  );

  return { total, breakdown };
};

module.exports = {
  calculateReadinessScore,
};
