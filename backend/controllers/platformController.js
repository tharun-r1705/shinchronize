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
  const studentId = req.student._id;
  
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
    // Fetch fresh stats from LeetCode
    const stats = await fetchLeetCodeStats(cleanUsername);
    
    // Update student's leetcode profile and stats
    const student = await Student.findById(studentId);
    
    if (student) {
      // Update coding profiles with the username
      if (!student.codingProfiles) {
        student.codingProfiles = {};
      }
      student.codingProfiles.leetcode = cleanUsername;
      student.codingProfiles.lastSyncedAt = new Date();
      
      // Store the full stats
      student.leetcodeStats = {
        ...stats,
        fetchedAt: new Date(),
      };
      
      // Update leetcodeUrl for profile display
      student.leetcodeUrl = `https://leetcode.com/${cleanUsername}`;
      
      await student.save();
    }
    
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
          ranking: stats.ranking || null,
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
      },
      fetchedAt: new Date().toISOString(),
      autoLinked: true,
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
  const studentId = req.student._id;
  
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
    // Fetch all GitHub data in parallel
    const [profile, reposData, consistency, openSource] = await Promise.all([
      fetchGitHubProfile(cleanUsername),
      fetchGitHubRepositories(cleanUsername),
      fetchGitHubConsistency(cleanUsername),
      fetchGitHubOpenSource(cleanUsername),
    ]);
    
    // Update student's github profile data
    const student = await Student.findById(studentId);
    
    if (student) {
      // Update connected username
      student.connectedGithubUsername = cleanUsername;
      
      // Store GitHub profile data
      student.githubProfile = {
        ...profile,
        lastRefreshed: new Date(),
      };
      
      // Store repos data
      student.githubRepos = {
        repos: reposData.repos,
        summary: reposData.summary,
        languages: reposData.languages,
        lastRefreshed: new Date(),
      };
      
      // Store consistency data
      student.githubConsistency = {
        ...consistency,
        lastRefreshed: new Date(),
      };
      
      // Store open source data
      student.githubOpenSource = {
        ...openSource,
        lastRefreshed: new Date(),
      };
      
      // Update githubUrl for profile display
      student.githubUrl = `https://github.com/${cleanUsername}`;
      
      await student.save();
    }
    
    // Calculate language breakdown from repos
    const languageBreakdown = reposData.languages || [];
    
    // Get top repos
    const topRepos = (reposData.repos || [])
      .filter(repo => !repo.isFork)
      .sort((a, b) => (b.stars || 0) - (a.stars || 0))
      .slice(0, 6);
    
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
          total: reposData.summary?.total || 0,
          original: reposData.summary?.original || 0,
          forked: reposData.summary?.forked || 0,
          totalStars: reposData.summary?.totalStars || 0,
          totalForks: reposData.summary?.totalForks || 0,
          topRepos: topRepos,
        },
        // Language Breakdown
        languages: languageBreakdown,
        // Consistency Stats
        consistency: {
          totalCommits: consistency.totalCommits || 0,
          currentStreak: consistency.currentStreak || 0,
          longestStreak: consistency.longestStreak || 0,
          activeWeeks: consistency.activeWeeks || 0,
          averageCommitsPerWeek: consistency.averageCommitsPerWeek || 0,
          weeklyActivity: consistency.weeklyActivity || [],
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
      autoLinked: true,
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
  const studentId = req.student._id;
  
  const student = await Student.findById(studentId);
  
  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Student not found',
    });
  }
  
  if (platform === 'leetcode') {
    const username = student.codingProfiles?.leetcode || 
                     extractUsername(student.leetcodeUrl, 'leetcode');
    
    if (!username || !student.leetcodeStats) {
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
          username: student.leetcodeStats.username,
          totalSolved: student.leetcodeStats.totalSolved,
        },
        problemStats: {
          easy: student.leetcodeStats.easy || 0,
          medium: student.leetcodeStats.medium || 0,
          hard: student.leetcodeStats.hard || 0,
          totalSolved: student.leetcodeStats.totalSolved || 0,
        },
        consistency: {
          streak: student.leetcodeStats.streak || 0,
          activeDays: student.leetcodeStats.activeDays || 0,
          last7Days: student.leetcodeStats.recentActivity?.last7Days || 0,
          last30Days: student.leetcodeStats.recentActivity?.last30Days || 0,
          bestDay: student.leetcodeStats.bestDay || null,
          calendar: student.leetcodeStats.calendar 
            ? Object.fromEntries(student.leetcodeStats.calendar)
            : {},
        },
        domains: student.leetcodeStats.topDomains || [],
      },
      fetchedAt: student.leetcodeStats.fetchedAt,
    });
  }
  
  if (platform === 'github') {
    const username = student.connectedGithubUsername;
    
    if (!username || !student.githubProfile) {
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
        profile: student.githubProfile,
        repos: {
          total: student.githubRepos?.summary?.total || 0,
          original: student.githubRepos?.summary?.original || 0,
          forked: student.githubRepos?.summary?.forked || 0,
          totalStars: student.githubRepos?.summary?.totalStars || 0,
          topRepos: (student.githubRepos?.repos || [])
            .filter(r => !r.isFork)
            .sort((a, b) => (b.stars || 0) - (a.stars || 0))
            .slice(0, 6),
        },
        languages: student.githubRepos?.languages || [],
        consistency: student.githubConsistency || {},
        openSource: student.githubOpenSource || {},
      },
      fetchedAt: student.githubProfile?.lastRefreshed,
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
  const studentId = req.student._id;
  
  const student = await Student.findById(studentId);
  
  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Student not found',
    });
  }
  
  if (platform === 'leetcode') {
    if (student.codingProfiles) {
      student.codingProfiles.leetcode = '';
    }
    student.leetcodeStats = undefined;
    student.leetcodeUrl = '';
    await student.save();
    
    return res.json({
      success: true,
      message: 'LeetCode profile disconnected',
    });
  }
  
  if (platform === 'github') {
    student.connectedGithubUsername = '';
    student.githubProfile = undefined;
    student.githubRepos = undefined;
    student.githubConsistency = undefined;
    student.githubOpenSource = undefined;
    // Don't clear githubUrl as it may be set manually
    await student.save();
    
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
