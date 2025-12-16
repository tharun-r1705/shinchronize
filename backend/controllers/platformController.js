/**
 * Platform Stats Controller
 *
 * Handles fetching and managing coding platform statistics
 * for the Progress page. Supports LeetCode and GitHub with
 * extensible architecture for future platforms.
 */

const Student = require('../models/Student');
const asyncHandler = require('../utils/asyncHandler');
const { fetchLeetCodeStats } = require('../utils/leetcode');
const {
  fetchGitHubProfile,
  fetchGitHubRepositories,
  fetchGitHubConsistency,
  fetchGitHubOpenSource
} = require('../utils/githubApi');

const getStudentFromRequest = (req) => {
  if (!req.user || req.userRole !== 'student') {
    return null;
  }
  return req.user;
};

/**
 * Extract username from URL or return as-is
 */
const extractUsername = (input, platform) => {
  if (!input) return null;
  const trimmed = input.trim();

  const patterns = {
    leetcode: /(?:leetcode\.com\/(?:u\/)?)?([a-zA-Z0-9_-]+)\/?$/,
    github: /(?:github\.com\/)?([a-zA-Z0-9_-]+)\/?$/,
    hackerrank: /(?:hackerrank\.com\/)?([a-zA-Z0-9_-]+)\/?$/,
    codeforces: /(?:codeforces\.com\/profile\/)?([a-zA-Z0-9_-]+)\/?$/,
  };

  const pattern = patterns[platform] || /([a-zA-Z0-9_-]+)\/?$/;
  const match = trimmed.match(pattern);
  return match ? match[1] : trimmed.replace(/[^a-zA-Z0-9_-]/g, '');
};

/**
 * GET /api/platforms/leetcode/stats
 * Fetch LeetCode statistics for a given username
 */
const getLeetCodeStats = asyncHandler(async (req, res) => {
  const { username } = req.query;
  const student = getStudentFromRequest(req);

  if (!student) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required as a student',
    });
  }

  if (!username) {
    return res.status(400).json({
      success: false,
      message: 'Username is required'
    });
  }

  const cleanUsername = extractUsername(username, 'leetcode');

  if (!cleanUsername || cleanUsername.length < 1) {
    return res.status(400).json({
      success: false,
      message: 'Invalid LeetCode username format'
    });
  }

  try {
    // Fetch fresh stats from LeetCode (without saving to profile)
    const stats = await fetchLeetCodeStats(cleanUsername);

    return res.json({
      success: true,
      platform: 'leetcode',
      username: cleanUsername,
      profileUrl: `https://leetcode.com/${cleanUsername}`,
      stats: {
        // Profile Overview
        profile: {
          username: stats.username,
          totalSolved: stats.totalSolved,
          ranking: stats.profile?.ranking ?? stats.ranking ?? null,
          realName: stats.profile?.realName || null,
          countryName: stats.profile?.countryName || null,
          reputation: stats.profile?.reputation ?? null,
          starRating: stats.profile?.starRating ?? null,
          badges: stats.profile?.badges || [],
        },
        // Problem Solving Stats
        problemStats: {
          easy: stats.easy || 0,
          medium: stats.medium || 0,
          hard: stats.hard || 0,
          totalSolved: stats.totalSolved || 0,
        },
        // Consistency Stats
        consistency: {
          streak: stats.streak || 0,
          activeDays: stats.activeDays || 0,
          last7Days: stats.recentActivity?.last7Days || 0,
          last30Days: stats.recentActivity?.last30Days || 0,
          bestDay: stats.bestDay || null,
          calendar: stats.calendar || {},
        },
        // Domains/Topics
        domains: stats.topDomains || [],
        // Calendar range
        calendarRange: stats.calendarRange || null,
        // Recent accepted submissions
        recentSubmissions: stats.recentSubmissions || [],
      },
      fetchedAt: new Date().toISOString(),
      autoLinked: false,
    });
  } catch (error) {
    console.error('LeetCode stats fetch error:', error.message);
    return res.status(404).json({
      success: false,
      message: error.message || 'Failed to fetch LeetCode stats. Please check the username.',
    });
  }
});

/**
 * GET /api/platforms/github/stats
 * Fetch GitHub statistics for a given username
 */
const getGitHubStats = asyncHandler(async (req, res) => {
  const { username } = req.query;
  const student = getStudentFromRequest(req);

  if (!student) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required as a student',
    });
  }

  if (!username) {
    return res.status(400).json({
      success: false,
      message: 'Username is required'
    });
  }

  const cleanUsername = extractUsername(username, 'github');

  if (!cleanUsername || cleanUsername.length < 1) {
    return res.status(400).json({
      success: false,
      message: 'Invalid GitHub username format'
    });
  }

  try {
    // Fetch all GitHub data in parallel (without saving to profile)
    const [profile, reposData, consistency, openSource] = await Promise.all([
      fetchGitHubProfile(cleanUsername),
      fetchGitHubRepositories(cleanUsername),
      fetchGitHubConsistency(cleanUsername),
      fetchGitHubOpenSource(cleanUsername),
    ]);

    // Get all repo names (just names, sorted by stars)
    const allRepos = (reposData.repos || [])
      .filter(repo => !repo.isFork)
      .sort((a, b) => (b.stars || 0) - (a.stars || 0))
      .map(repo => ({
        name: repo.name,
        url: repo.url,
        description: repo.description,
        stars: repo.stars,
      }));

    return res.json({
      success: true,
      platform: 'github',
      username: cleanUsername,
      profileUrl: `https://github.com/${cleanUsername}`,
      stats: {
        // Profile Overview
        profile: {
          avatar: profile.avatar,
          username: profile.username,
          name: profile.name,
          bio: profile.bio,
          location: profile.location,
          blog: profile.blog,
          company: profile.company,
          accountAge: profile.accountAge,
          createdAt: profile.createdAt,
          followers: profile.followers,
          following: profile.following,
          publicRepos: profile.publicRepos,
        },
        // Repository Stats
        repos: {
          total: reposData.totalCount || 0,
          original: reposData.originalRepos || 0,
          forked: reposData.forkedRepos || 0,
          totalStars: reposData.totalStars || 0,
          totalForks: reposData.totalForks || 0,
          topRepos: allRepos,
        },
        // Language Breakdown
        languages: [],
        // Consistency Stats - simplified
        consistency: {
          totalCommits: Number(consistency.totalCommits) || 0,
          currentStreak: 0,
          longestStreak: 0,
          activeWeeks: Number(consistency.activeWeeks) || 0,
          averageCommitsPerWeek: Number(consistency.commitsPerWeek) || 0,
          weeklyActivity: consistency.weeklyBreakdown || [],
        },
        // Open Source Stats
        openSource: {
          pullRequestsOpened: openSource.pullRequestsOpened || 0,
          pullRequestsMerged: openSource.pullRequestsMerged || 0,
          issuesOpened: openSource.issuesOpened || 0,
          issuesClosed: openSource.issuesClosed || 0,
          contributedRepos: openSource.contributedRepos || [],
        },
      },
      fetchedAt: new Date().toISOString(),
      autoLinked: false,
    });
  } catch (error) {
    console.error('GitHub stats fetch error:', error.message);
    return res.status(404).json({
      success: false,
      message: error.message || 'Failed to fetch GitHub stats. Please check the username.',
    });
  }
});

/**
 * GET /api/platforms/:platform/saved
 * Get saved platform data for the current user (from database)
 */
const getSavedPlatformStats = asyncHandler(async (req, res) => {
  const { platform } = req.params;
  const student = getStudentFromRequest(req);

  if (!student) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required as a student',
    });
  }

  const studentDoc = await Student.findById(student._id);

  if (!studentDoc) {
    return res.status(404).json({
      success: false,
      message: 'Student not found',
    });
  }

  if (platform === 'leetcode') {
    const username = studentDoc.codingProfiles?.leetcode ||
                     extractUsername(studentDoc.leetcodeUrl, 'leetcode');

    if (!username || !studentDoc.leetcodeStats) {
      return res.json({
        success: true,
        platform: 'leetcode',
        connected: false,
        username: null,
        stats: null,
      });
    }

    return res.json({
      success: true,
      platform: 'leetcode',
      connected: true,
      username,
      profileUrl: `https://leetcode.com/${username}`,
      stats: {
        profile: {
          username: studentDoc.leetcodeStats.username,
          totalSolved: studentDoc.leetcodeStats.totalSolved,
          ranking: studentDoc.leetcodeStats.profile?.ranking ?? studentDoc.leetcodeStats.ranking ?? null,
          realName: studentDoc.leetcodeStats.profile?.realName || null,
          countryName: studentDoc.leetcodeStats.profile?.countryName || null,
          reputation: studentDoc.leetcodeStats.profile?.reputation ?? null,
          starRating: studentDoc.leetcodeStats.profile?.starRating ?? null,
          badges: studentDoc.leetcodeStats.profile?.badges || [],
        },
        problemStats: {
          easy: studentDoc.leetcodeStats.easy || 0,
          medium: studentDoc.leetcodeStats.medium || 0,
          hard: studentDoc.leetcodeStats.hard || 0,
          totalSolved: studentDoc.leetcodeStats.totalSolved || 0,
        },
        consistency: {
          streak: studentDoc.leetcodeStats.streak || 0,
          activeDays: studentDoc.leetcodeStats.activeDays || 0,
          last7Days: studentDoc.leetcodeStats.recentActivity?.last7Days || 0,
          last30Days: studentDoc.leetcodeStats.recentActivity?.last30Days || 0,
          bestDay: studentDoc.leetcodeStats.bestDay || null,
          calendar: studentDoc.leetcodeStats.calendar instanceof Map
            ? Object.fromEntries(studentDoc.leetcodeStats.calendar)
            : (studentDoc.leetcodeStats.calendar && typeof studentDoc.leetcodeStats.calendar === 'object'
                ? studentDoc.leetcodeStats.calendar
                : {}),
        },
        domains: studentDoc.leetcodeStats.topDomains || [],
        recentSubmissions: studentDoc.leetcodeStats.recentSubmissions || [],
      },
      fetchedAt: studentDoc.leetcodeStats.fetchedAt,
    });
  }

  if (platform === 'github') {
    const username = studentDoc.connectedGithubUsername;

    if (!username || !studentDoc.githubProfile) {
      return res.json({
        success: true,
        platform: 'github',
        connected: false,
        username: null,
        stats: null,
      });
    }

    return res.json({
      success: true,
      platform: 'github',
      connected: true,
      username,
      profileUrl: `https://github.com/${username}`,
      stats: {
        profile: studentDoc.githubProfile,
        repos: {
          total: studentDoc.githubRepos?.summary?.total || 0,
          original: studentDoc.githubRepos?.summary?.original || 0,
          forked: studentDoc.githubRepos?.summary?.forked || 0,
          totalStars: studentDoc.githubRepos?.summary?.totalStars || 0,
          topRepos: (studentDoc.githubRepos?.repos || [])
            .filter(r => !r.isFork)
            .sort((a, b) => (b.stars || 0) - (a.stars || 0))
            .slice(0, 6),
        },
        languages: studentDoc.githubRepos?.languages || [],
        consistency: studentDoc.githubConsistency || {},
        openSource: studentDoc.githubOpenSource || {},
      },
      fetchedAt: studentDoc.githubProfile?.lastRefreshed,
    });
  }

  return res.status(400).json({
    success: false,
    message: `Unsupported platform: ${platform}`,
  });
});

/**
 * DELETE /api/platforms/:platform/disconnect
 * Disconnect a platform (clear stored data)
 */
const disconnectPlatform = asyncHandler(async (req, res) => {
  const { platform } = req.params;
  const student = getStudentFromRequest(req);

  if (!student) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required as a student',
    });
  }

  const studentDoc = await Student.findById(student._id);

  if (!studentDoc) {
    return res.status(404).json({
      success: false,
      message: 'Student not found',
    });
  }

  if (platform === 'leetcode') {
    if (studentDoc.codingProfiles) {
      studentDoc.codingProfiles.leetcode = '';
    }
    studentDoc.leetcodeStats = undefined;
    studentDoc.leetcodeUrl = '';
    await studentDoc.save();

    return res.json({
      success: true,
      message: 'LeetCode profile disconnected',
    });
  }

  if (platform === 'github') {
    studentDoc.connectedGithubUsername = '';
    studentDoc.githubProfile = undefined;
    studentDoc.githubRepos = undefined;
    studentDoc.githubConsistency = undefined;
    studentDoc.githubOpenSource = undefined;
    // Don't clear githubUrl as it may be set manually
    await studentDoc.save();

    return res.json({
      success: true,
      message: 'GitHub profile disconnected',
    });
  }

  return res.status(400).json({
    success: false,
    message: `Unsupported platform: ${platform}`,
  });
});

module.exports = {
  getLeetCodeStats,
  getGitHubStats,
  getSavedPlatformStats,
  disconnectPlatform,
};
