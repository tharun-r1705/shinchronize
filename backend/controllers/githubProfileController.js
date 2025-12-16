/**
 * GitHub Profile Integration Controller
 * 
 * Handles all GitHub profile connection and data fetching operations.
 * Each category (Profile, Repos, Consistency, Open Source) can be refreshed independently.
 */

const Student = require('../models/Student');
const {
  fetchGitHubProfile,
  fetchGitHubRepositories,
  fetchGitHubConsistency,
  fetchGitHubOpenSource,
  fetchAllGitHubData,
  checkRateLimit,
  clearCache,
} = require('../utils/githubApi');
const {
  calculateGitHubReadinessScore,
  detectScoreChange,
} = require('../utils/githubReadinessScore');

/**
 * CONNECT GITHUB ACCOUNT
 * POST /api/students/github/connect
 * 
 * Connects a student's GitHub account using username
 * Fetches all initial data and calculates readiness score
 */
exports.connectGitHub = async (req, res) => {
  try {
    const { username } = req.body;
    const studentId = req.user.id;
    
    if (!username || !username.trim()) {
      return res.status(400).json({
        success: false,
        message: 'GitHub username is required',
      });
    }
    
    console.log(`🔗 Connecting GitHub account for student ${studentId}: ${username}`);
    
    // Check rate limit before proceeding
    try {
      await checkRateLimit();
    } catch (error) {
      return res.status(429).json({
        success: false,
        message: error.message,
      });
    }
    
    // Fetch all GitHub data
    const githubData = await fetchAllGitHubData(username);
    
    // Get student's current readiness score for comparison
    const student = await Student.findById(studentId);
    const oldReadinessScore = student.readinessScore || 0;
    
    // Update student with GitHub data
    student.connectedGithubUsername = username.trim();
    student.githubProfile = githubData.profile;
    student.githubRepos = githubData.repos;
    student.githubConsistency = githubData.consistency;
    student.githubOpenSource = githubData.openSource;
    
    // Calculate new readiness score
    const scoreData = calculateGitHubReadinessScore(student);
    student.readinessScore = scoreData.score;
    
    // Add to readiness history
    if (!student.readinessHistory) {
      student.readinessHistory = [];
    }
    student.readinessHistory.push({
      score: scoreData.score,
      calculatedAt: new Date(),
    });
    
    // Add to growth timeline
    if (!student.growthTimeline) {
      student.growthTimeline = [];
    }
    
    const scoreChange = detectScoreChange(oldReadinessScore, scoreData.score);
    if (scoreChange) {
      student.growthTimeline.push({
        date: new Date(),
        readinessScore: scoreData.score,
        reason: `GitHub connected: ${scoreChange.reason}`,
      });
    } else {
      student.growthTimeline.push({
        date: new Date(),
        readinessScore: scoreData.score,
        reason: 'GitHub account connected',
      });
    }
    
    await student.save();
    
    console.log(`✅ GitHub connected for ${username}. Readiness score: ${scoreData.score}`);
    
    res.json({
      success: true,
      message: 'GitHub account connected successfully',
      data: {
        username,
        profile: githubData.profile,
        repos: {
          totalCount: githubData.repos.totalCount,
          originalRepos: githubData.repos.originalRepos,
          totalStars: githubData.repos.totalStars,
        },
        consistency: {
          activeWeeks: githubData.consistency.activeWeeks,
          totalCommits: githubData.consistency.totalCommits,
        },
        openSource: {
          pullRequests: githubData.openSource.pullRequests.total,
          issues: githubData.openSource.issues.total,
        },
        readinessScore: scoreData.score,
        scoreBreakdown: scoreData.breakdown,
        recommendations: scoreData.recommendations,
      },
    });
    
  } catch (error) {
    console.error('❌ Error connecting GitHub:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    
    if (error.message.includes('rate limit')) {
      return res.status(429).json({
        success: false,
        message: error.message,
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to connect GitHub account',
      error: error.message,
    });
  }
};

/**
 * DISCONNECT GITHUB ACCOUNT
 * DELETE /api/students/github/disconnect
 */
exports.disconnectGitHub = async (req, res) => {
  try {
    const studentId = req.user.id;
    const student = await Student.findById(studentId);
    
    if (!student.connectedGithubUsername) {
      return res.status(400).json({
        success: false,
        message: 'No GitHub account connected',
      });
    }
    
    const username = student.connectedGithubUsername;
    
    // Clear cached data
    clearCache(username);
    
    // Clear GitHub data from student profile
    student.connectedGithubUsername = null;
    student.githubProfile = null;
    student.githubRepos = null;
    student.githubConsistency = null;
    student.githubOpenSource = null;
    
    // Recalculate readiness score without GitHub data
    const oldScore = student.readinessScore;
    const scoreData = calculateGitHubReadinessScore(student);
    student.readinessScore = scoreData.score;
    
    // Add to growth timeline
    student.growthTimeline.push({
      date: new Date(),
      readinessScore: scoreData.score,
      reason: 'GitHub account disconnected',
    });
    
    await student.save();
    
    console.log(`🔌 GitHub disconnected for student ${studentId}`);
    
    res.json({
      success: true,
      message: 'GitHub account disconnected successfully',
      newReadinessScore: scoreData.score,
    });
    
  } catch (error) {
    console.error('❌ Error disconnecting GitHub:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disconnect GitHub account',
      error: error.message,
    });
  }
};

/**
 * REFRESH PROFILE CATEGORY
 * POST /api/students/github/refresh/profile
 */
exports.refreshProfile = async (req, res) => {
  try {
    const studentId = req.user.id;
    const student = await Student.findById(studentId);
    
    if (!student.connectedGithubUsername) {
      return res.status(400).json({
        success: false,
        message: 'No GitHub account connected. Please connect first.',
      });
    }
    
    console.log(`🔄 Refreshing profile for: ${student.connectedGithubUsername}`);
    
    // Fetch latest profile data
    const profileData = await fetchGitHubProfile(student.connectedGithubUsername);
    
    // Update student
    const oldScore = student.readinessScore;
    student.githubProfile = profileData;
    
    // Recalculate readiness score
    const scoreData = calculateGitHubReadinessScore(student);
    student.readinessScore = scoreData.score;
    
    // Track score change
    const scoreChange = detectScoreChange(oldScore, scoreData.score);
    if (scoreChange) {
      student.growthTimeline.push({
        date: new Date(),
        readinessScore: scoreData.score,
        reason: `Profile updated: ${scoreChange.reason}`,
      });
    }
    
    await student.save();
    
    console.log(`✅ Profile refreshed. Score: ${oldScore} → ${scoreData.score}`);
    
    res.json({
      success: true,
      message: 'Profile refreshed successfully',
      data: profileData,
      readinessScore: scoreData.score,
      scoreChange: scoreData.score - oldScore,
    });
    
  } catch (error) {
    console.error('❌ Error refreshing profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh profile',
      error: error.message,
    });
  }
};

/**
 * REFRESH REPOSITORIES CATEGORY
 * POST /api/students/github/refresh/repos
 */
exports.refreshRepositories = async (req, res) => {
  try {
    const studentId = req.user.id;
    const student = await Student.findById(studentId);
    
    if (!student.connectedGithubUsername) {
      return res.status(400).json({
        success: false,
        message: 'No GitHub account connected. Please connect first.',
      });
    }
    
    console.log(`🔄 Refreshing repositories for: ${student.connectedGithubUsername}`);
    
    // Fetch latest repository data
    const reposData = await fetchGitHubRepositories(student.connectedGithubUsername);
    
    // Update student
    const oldScore = student.readinessScore;
    student.githubRepos = reposData;
    
    // Recalculate readiness score
    const scoreData = calculateGitHubReadinessScore(student);
    student.readinessScore = scoreData.score;
    
    // Track score change
    const scoreChange = detectScoreChange(oldScore, scoreData.score);
    if (scoreChange) {
      student.growthTimeline.push({
        date: new Date(),
        readinessScore: scoreData.score,
        reason: `Repositories updated: ${scoreChange.reason}`,
      });
    }
    
    await student.save();
    
    console.log(`✅ Repositories refreshed. Score: ${oldScore} → ${scoreData.score}`);
    
    res.json({
      success: true,
      message: 'Repositories refreshed successfully',
      data: {
        totalCount: reposData.totalCount,
        originalRepos: reposData.originalRepos,
        forkedRepos: reposData.forkedRepos,
        totalStars: reposData.totalStars,
        totalForks: reposData.totalForks,
        topLanguages: reposData.topLanguages,
        lastRefreshed: reposData.lastRefreshed,
      },
      readinessScore: scoreData.score,
      scoreChange: scoreData.score - oldScore,
    });
    
  } catch (error) {
    console.error('❌ Error refreshing repositories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh repositories',
      error: error.message,
    });
  }
};

/**
 * REFRESH CONSISTENCY CATEGORY
 * POST /api/students/github/refresh/consistency
 */
exports.refreshConsistency = async (req, res) => {
  try {
    const studentId = req.user.id;
    const student = await Student.findById(studentId);
    
    if (!student.connectedGithubUsername) {
      return res.status(400).json({
        success: false,
        message: 'No GitHub account connected. Please connect first.',
      });
    }
    
    console.log(`🔄 Refreshing consistency for: ${student.connectedGithubUsername}`);
    
    // Fetch latest consistency data
    const consistencyData = await fetchGitHubConsistency(student.connectedGithubUsername);
    
    // Update student
    const oldScore = student.readinessScore;
    student.githubConsistency = consistencyData;
    
    // Recalculate readiness score
    const scoreData = calculateGitHubReadinessScore(student);
    student.readinessScore = scoreData.score;
    
    // Track score change
    const scoreChange = detectScoreChange(oldScore, scoreData.score);
    if (scoreChange) {
      student.growthTimeline.push({
        date: new Date(),
        readinessScore: scoreData.score,
        reason: `Consistency updated: ${scoreChange.reason}`,
      });
    }
    
    await student.save();
    
    console.log(`✅ Consistency refreshed. Score: ${oldScore} → ${scoreData.score}`);
    
    res.json({
      success: true,
      message: 'Consistency data refreshed successfully',
      data: consistencyData,
      readinessScore: scoreData.score,
      scoreChange: scoreData.score - oldScore,
    });
    
  } catch (error) {
    console.error('❌ Error refreshing consistency:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh consistency data',
      error: error.message,
    });
  }
};

/**
 * REFRESH OPEN SOURCE CATEGORY
 * POST /api/students/github/refresh/open-source
 */
exports.refreshOpenSource = async (req, res) => {
  try {
    const studentId = req.user.id;
    const student = await Student.findById(studentId);
    
    if (!student.connectedGithubUsername) {
      return res.status(400).json({
        success: false,
        message: 'No GitHub account connected. Please connect first.',
      });
    }
    
    console.log(`🔄 Refreshing open source contributions for: ${student.connectedGithubUsername}`);
    
    // Fetch latest open source data
    const openSourceData = await fetchGitHubOpenSource(student.connectedGithubUsername);
    
    // Update student
    const oldScore = student.readinessScore;
    student.githubOpenSource = openSourceData;
    
    // Recalculate readiness score
    const scoreData = calculateGitHubReadinessScore(student);
    student.readinessScore = scoreData.score;
    
    // Track score change
    const scoreChange = detectScoreChange(oldScore, scoreData.score);
    if (scoreChange) {
      student.growthTimeline.push({
        date: new Date(),
        readinessScore: scoreData.score,
        reason: `Open source contributions updated: ${scoreChange.reason}`,
      });
    }
    
    await student.save();
    
    console.log(`✅ Open source refreshed. Score: ${oldScore} → ${scoreData.score}`);
    
    res.json({
      success: true,
      message: 'Open source data refreshed successfully',
      data: openSourceData,
      readinessScore: scoreData.score,
      scoreChange: scoreData.score - oldScore,
    });
    
  } catch (error) {
    console.error('❌ Error refreshing open source data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh open source data',
      error: error.message,
    });
  }
};

/**
 * GET ALL GITHUB DATA
 * GET /api/students/github/data
 * 
 * Returns all GitHub data for the authenticated student
 */
exports.getGitHubData = async (req, res) => {
  try {
    const studentId = req.user.id;
    const student = await Student.findById(studentId);
    
    if (!student.connectedGithubUsername) {
      return res.json({
        success: true,
        connected: false,
        message: 'No GitHub account connected',
      });
    }
    
    res.json({
      success: true,
      connected: true,
      username: student.connectedGithubUsername,
      profile: student.githubProfile,
      repos: student.githubRepos,
      consistency: student.githubConsistency,
      openSource: student.githubOpenSource,
      readinessScore: student.readinessScore,
    });
    
  } catch (error) {
    console.error('❌ Error getting GitHub data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch GitHub data',
      error: error.message,
    });
  }
};

/**
 * GET GITHUB DATA FOR SPECIFIC STUDENT (RECRUITER VIEW)
 * GET /api/students/:studentId/github
 * 
 * Allows recruiters to view a student's GitHub data (read-only)
 */
exports.getStudentGitHubData = async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findById(studentId);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }
    
    if (!student.connectedGithubUsername) {
      return res.json({
        success: true,
        connected: false,
        message: 'Student has not connected GitHub',
      });
    }
    
    res.json({
      success: true,
      connected: true,
      username: student.connectedGithubUsername,
      profile: student.githubProfile,
      repos: student.githubRepos,
      consistency: student.githubConsistency,
      openSource: student.githubOpenSource,
      readinessScore: student.readinessScore,
    });
    
  } catch (error) {
    console.error('❌ Error getting student GitHub data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student GitHub data',
      error: error.message,
    });
  }
};

/**
 * REFRESH ALL CATEGORIES
 * POST /api/students/github/refresh/all
 * 
 * Refreshes all GitHub data at once
 */
exports.refreshAllData = async (req, res) => {
  try {
    const studentId = req.user.id;
    const student = await Student.findById(studentId);
    
    if (!student.connectedGithubUsername) {
      return res.status(400).json({
        success: false,
        message: 'No GitHub account connected. Please connect first.',
      });
    }
    
    console.log(`🔄 Refreshing ALL GitHub data for: ${student.connectedGithubUsername}`);
    
    // Clear cache to force fresh fetch
    clearCache(student.connectedGithubUsername);
    
    // Fetch all GitHub data
    const githubData = await fetchAllGitHubData(student.connectedGithubUsername);
    
    // Update student
    const oldScore = student.readinessScore;
    student.githubProfile = githubData.profile;
    student.githubRepos = githubData.repos;
    student.githubConsistency = githubData.consistency;
    student.githubOpenSource = githubData.openSource;
    
    // Recalculate readiness score
    const scoreData = calculateGitHubReadinessScore(student);
    student.readinessScore = scoreData.score;
    
    // Track score change
    const scoreChange = detectScoreChange(oldScore, scoreData.score);
    if (scoreChange) {
      student.growthTimeline.push({
        date: new Date(),
        readinessScore: scoreData.score,
        reason: `All data refreshed: ${scoreChange.reason}`,
      });
    }
    
    await student.save();
    
    console.log(`✅ All data refreshed. Score: ${oldScore} → ${scoreData.score}`);
    
    res.json({
      success: true,
      message: 'All GitHub data refreshed successfully',
      data: {
        profile: githubData.profile,
        repos: {
          totalCount: githubData.repos.totalCount,
          originalRepos: githubData.repos.originalRepos,
          totalStars: githubData.repos.totalStars,
        },
        consistency: {
          activeWeeks: githubData.consistency.activeWeeks,
          totalCommits: githubData.consistency.totalCommits,
        },
        openSource: {
          pullRequests: githubData.openSource.pullRequests.total,
          issues: githubData.openSource.issues.total,
        },
      },
      readinessScore: scoreData.score,
      scoreChange: scoreData.score - oldScore,
      scoreBreakdown: scoreData.breakdown,
      recommendations: scoreData.recommendations,
    });
    
  } catch (error) {
    console.error('❌ Error refreshing all data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh GitHub data',
      error: error.message,
    });
  }
};

module.exports = exports;
