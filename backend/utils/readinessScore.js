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
  const githubStats = studentDoc.githubStats || {};
  const leetcodeStats = studentDoc.leetcodeStats || {};
  const hackerrankStats = studentDoc.hackerrankStats || {};
  const interviewStats = studentDoc.interviewStats || {};

  // Count ALL projects, not just verified ones
  // Since we removed verification status, all projects should count
  const allProjects = safeProjects;

  const consistencyWindow = 30;
  const recentLogs = safeCodingLogs.filter((log) =>
    dayjs(log.date || log.createdAt).isAfter(dayjs().subtract(consistencyWindow, 'day'))
  );

  const leetcodeRecent30 = Number(leetcodeStats.recentActivity?.last30Days) || 0;
  const hackerrankRecent30 = Number(hackerrankStats.recentActivity?.last30Days) || 0;
  const githubRecent30 = Number(githubStats.recentActivity?.last30Days) || 0;

  const uniquePlatforms = new Set(
    recentLogs.map((log) => log.platform?.toLowerCase()).filter(Boolean)
  );

  // If the student has synced stats but no logs, still credit the platform(s)
  if (leetcodeRecent30 > 0) uniquePlatforms.add('leetcode');
  if (hackerrankRecent30 > 0) uniquePlatforms.add('hackerrank');
  if (githubRecent30 > 0) uniquePlatforms.add('github');

  // Updated scoring with GitHub activity and Interview Performance
  // Projects: max 20 (reduced from 25 to make room for interview prep)
  const projectScore = Math.min(allProjects.length * 10, 20);

  // Coding consistency (LeetCode/HackerRank logs): max 10 (reduced from 15)
  const codingFromLogs = recentLogs.length * 1.5;
  const codingFromLeetCode = leetcodeRecent30 * 0.15;
  const codingFromHackerRank = hackerrankRecent30 * 0.15;
  const codingConsistencyScore = Math.min(Math.max(codingFromLogs, codingFromLeetCode, codingFromHackerRank), 10);

  // Total Problems Solved: max 10 (NEW)
  // Sum up synced stats + manual logs for comprehensive credit
  const leetcodeLogs = safeCodingLogs.filter(l => (l.platform || '').toLowerCase().includes('leetcode'));
  const hackerrankLogs = safeCodingLogs.filter(l => (l.platform || '').toLowerCase().includes('hackerrank'));

  const totalSolvedLeet = (leetcodeStats.totalSolved || 0) + leetcodeLogs.reduce((acc, log) => acc + (log.problemsSolved || 0), 0);
  const totalSolvedHR = (hackerrankStats.totalSolved || 0) + hackerrankLogs.reduce((acc, log) => acc + (log.problemsSolved || 0), 0);
  const totalSolvedScore = Math.min((totalSolvedLeet + totalSolvedHR) * 0.05, 10);

  // GitHub activity: max 15 (NEW)
  let githubActivityScore = 0;
  if (githubStats.username) {
    // Recent commits (last 30 days): up to 6 points
    const recentCommitsScore = Math.min((githubStats.recentActivity?.last30Days || 0) * 0.2, 6);

    // Repository count & quality: up to 5 points
    const repoCount = githubStats.totalRepos || 0;
    const repoStars = githubStats.totalStars || 0;
    const repoQualityScore = Math.min((repoCount * 0.2) + (repoStars * 0.1), 5);

    // Contribution streak: up to 4 points
    const streakScore = Math.min((githubStats.streak || 0) * 0.2, 4);

    githubActivityScore = Math.min(recentCommitsScore + repoQualityScore + streakScore, 15);
  }

  // Certifications: max 15 (reduced from 20)
  // Include HackerRank certifications if available
  const hrCertsCount = Array.isArray(hackerrankStats.certifications) ? hackerrankStats.certifications.length : 0;
  const certificationScore = Math.min((safeCertifications.length + hrCertsCount) * 4, 15);

  // Events: max 10
  const eventScore = Math.min(safeEvents.length * 3, 10);

  // Skill diversity: max 10
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

  // Interview Performance: max 10 points (NEW)
  let interviewScore = 0;
  if (interviewStats.completedSessions > 0) {
    // Base score from average performance (0-5 points)
    // avgScore is 0-100, normalize to 0-5
    const performanceScore = Math.min((interviewStats.avgScore || 0) / 20, 5);

    // Consistency bonus for completing multiple sessions (0-3 points)
    const sessionsBonus = Math.min(interviewStats.completedSessions * 0.5, 3);

    // Improvement trend bonus (0-2 points)
    const trendBonus = interviewStats.recentTrend === 'improving' ? 2 :
      interviewStats.recentTrend === 'stable' ? 1 : 0;

    interviewScore = Math.min(performanceScore + sessionsBonus + trendBonus, 10);
  }

  const streakBonus = Math.min((studentDoc.streakDays || 0) * 0.2, 5);

  const breakdown = {
    projects: projectScore,
    codingConsistency: codingConsistencyScore,
    totalSolved: totalSolvedScore,
    githubActivity: githubActivityScore,
    certifications: certificationScore,
    events: eventScore,
    skillDiversity: skillDiversityScore,
    skillRadar: skillRadarScore,
    skills: skillsScore,
    interviewPrep: interviewScore,
    streakBonus,
  };

  const total = Math.min(
    100,
    Math.round(
      projectScore +
      codingConsistencyScore +
      totalSolvedScore +
      githubActivityScore +
      certificationScore +
      eventScore +
      skillDiversityScore +
      skillRadarScore +
      skillsScore +
      interviewScore +
      streakBonus
    )
  );

  return { total, breakdown };
};

module.exports = {
  calculateReadinessScore,
};
