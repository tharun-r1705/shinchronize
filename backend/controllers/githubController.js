const Student = require('../models/Student');
const asyncHandler = require('../utils/asyncHandler');
const { calculateReadinessScore } = require('../utils/readinessScore');
const { fetchGitHubData } = require('../utils/githubIntegration');
const { updateValidatedSkills } = require('../utils/skillValidation');
const {
  getGitHubAuthUrl,
  exchangeCodeForToken,
  fetchGitHubProfile,
  encryptToken,
  generateState,
  validateState,
} = require('../utils/githubOAuth');

/**
 * Initiate GitHub OAuth flow
 * GET /api/github/connect
 * 
 * Redirects user to GitHub authorization page.
 * State parameter includes student ID for linking after callback.
 */
const initiateGitHubOAuth = asyncHandler(async (req, res) => {
  // Student ID can be passed from authenticated session or signup flow
  const studentId = req.user?._id || req.query.studentId || 'signup';
  
  // Generate secure state parameter to prevent CSRF
  const state = generateState(studentId);
  
  // Store state in session/cookie for validation (optional - we validate timestamp in state)
  res.cookie('github_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 10 * 60 * 1000, // 10 minutes
    sameSite: 'lax',
  });

  // Redirect to GitHub OAuth
  const authUrl = getGitHubAuthUrl(state);
  res.redirect(authUrl);
});

/**
 * Handle GitHub OAuth callback
 * GET /api/github/callback
 * 
 * Exchanges code for access token, fetches user profile,
 * and links GitHub account to student profile.
 */
const handleGitHubCallback = asyncHandler(async (req, res) => {
  const { code, state } = req.query;

  // Validate required parameters
  if (!code || !state) {
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/student/login?error=oauth_failed`);
  }

  try {
    // Validate state parameter (CSRF protection)
    const stateData = validateState(state);
    
    // Optional: Verify state matches cookie
    const cookieState = req.cookies?.github_oauth_state;
    if (cookieState && cookieState !== state) {
      throw new Error('State mismatch');
    }

    // Exchange authorization code for access token
    const accessToken = await exchangeCodeForToken(code);
    
    // Fetch GitHub user profile
    const githubProfile = await fetchGitHubProfile(accessToken);

    // Determine if this is signup flow or profile linking
    const isSignupFlow = stateData.studentId === 'signup';
    
    if (isSignupFlow) {
      // Store OAuth data temporarily in session for signup completion
      res.cookie('github_oauth_data', JSON.stringify({
        githubId: githubProfile.id,
        username: githubProfile.login,
        avatarUrl: githubProfile.avatar_url,
        encryptedToken: encryptToken(accessToken),
      }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 15 * 60 * 1000, // 15 minutes
        sameSite: 'lax',
      });

      // Redirect back to signup page with success indicator
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/student/login?tab=signup&github=connected&username=${githubProfile.login}`);
    }

    // Profile linking flow - find existing student
    const student = await Student.findById(stateData.studentId);
    if (!student) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/student/login?error=student_not_found`);
    }

    // Check if GitHub account is already linked to another student
    const existingLink = await Student.findOne({ 'githubAuth.githubId': githubProfile.id });
    if (existingLink && existingLink._id.toString() !== student._id.toString()) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/student/profile?error=github_already_linked`);
    }

    // Link GitHub account via OAuth
    student.githubAuth = {
      githubId: githubProfile.id,
      username: githubProfile.login,
      avatarUrl: githubProfile.avatar_url,
      encryptedAccessToken: encryptToken(accessToken),
      connectedAt: new Date(),
      authType: 'oauth',
      lastVerifiedAt: new Date(),
    };

    // Update githubUrl if not set
    if (!student.githubUrl) {
      student.githubUrl = githubProfile.html_url;
    }

    // Auto-sync GitHub data
    try {
      const githubStats = await fetchGitHubData(githubProfile.login);
      student.githubStats = githubStats;

      // Update validated skills
      await updateValidatedSkills(student);

      // Add growth timeline entry
      const { total } = calculateReadinessScore(student);
      student.readinessScore = total;
      student.growthTimeline.push({
        date: new Date(),
        readinessScore: total,
        reason: 'GitHub account connected via OAuth',
      });
    } catch (syncError) {
      console.error('GitHub sync error during OAuth:', syncError);
      // Continue even if sync fails - OAuth connection is still valid
    }

    await student.save();

    // Clear OAuth state cookie
    res.clearCookie('github_oauth_state');

    // Redirect to profile with success message
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/student/profile?github=connected`);

  } catch (error) {
    console.error('GitHub OAuth callback error:', error);
    
    // Clear cookies
    res.clearCookie('github_oauth_state');
    res.clearCookie('github_oauth_data');

    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/student/login?error=oauth_failed&message=${encodeURIComponent(error.message)}`);
  }
});

/**
 * Link GitHub manually via username (fallback method)
 * POST /api/github/link-manual
 * 
 * Allows students to link GitHub via username without OAuth.
 * Lower trust level than OAuth.
 */
const linkGitHubManually = asyncHandler(async (req, res) => {
  const { githubUsername } = req.body;

  if (!githubUsername || typeof githubUsername !== 'string') {
    return res.status(400).json({ message: 'GitHub username is required' });
  }

  const student = await Student.findById(req.user._id);
  if (!student) {
    return res.status(404).json({ message: 'Student not found' });
  }

  // Validate GitHub username format
  const sanitizedUsername = githubUsername.trim().replace(/[^a-zA-Z0-9-]/g, '');
  if (!sanitizedUsername) {
    return res.status(400).json({ message: 'Invalid GitHub username format' });
  }

  try {
    // Verify username exists by fetching public data
    const githubStats = await fetchGitHubData(sanitizedUsername);

    // Store manual link
    student.githubAuth = {
      username: sanitizedUsername,
      authType: 'manual',
      connectedAt: new Date(),
      avatarUrl: githubStats.avatarUrl,
    };

    student.githubStats = githubStats;
    student.githubUrl = `https://github.com/${sanitizedUsername}`;

    // Update validated skills
    await updateValidatedSkills(student);

    // Update readiness score
    const { total, breakdown } = calculateReadinessScore(student);
    student.readinessScore = total;
    student.growthTimeline.push({
      date: new Date(),
      readinessScore: total,
      reason: `GitHub username linked: ${sanitizedUsername}`,
    });

    await student.save();

    res.json({
      success: true,
      message: 'GitHub username linked successfully',
      authType: 'manual',
      githubStats: student.githubStats,
      readinessScore: total,
      readinessBreakdown: breakdown,
    });

  } catch (error) {
    console.error('Manual GitHub link error:', error);
    res.status(400).json({
      message: error.message || 'Failed to link GitHub username',
    });
  }
});

/**
 * Disconnect GitHub account
 * POST /api/github/disconnect
 * 
 * Removes GitHub OAuth connection (keeps public stats if desired).
 */
const disconnectGitHub = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.user._id);
  if (!student) {
    return res.status(404).json({ message: 'Student not found' });
  }

  // Clear OAuth data but optionally keep public stats
  const keepStats = req.body.keepStats !== false; // Default true

  if (!keepStats) {
    student.githubStats = {};
  }

  student.githubAuth = {};
  student.githubUrl = '';

  await student.save();

  res.json({
    success: true,
    message: 'GitHub account disconnected',
  });
});

/**
 * Get GitHub connection status
 * GET /api/github/status
 * 
 * Returns current GitHub connection info for authenticated student.
 */
const getGitHubStatus = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.user._id);
  if (!student) {
    return res.status(404).json({ message: 'Student not found' });
  }

  const status = {
    connected: Boolean(student.githubAuth?.username),
    authType: student.githubAuth?.authType || null,
    username: student.githubAuth?.username || null,
    avatarUrl: student.githubAuth?.avatarUrl || null,
    connectedAt: student.githubAuth?.connectedAt || null,
    lastSynced: student.githubStats?.lastSyncedAt || null,
    activityScore: student.githubStats?.activityScore || 0,
    totalRepos: student.githubStats?.totalRepos || 0,
  };

  res.json(status);
});

module.exports = {
  initiateGitHubOAuth,
  handleGitHubCallback,
  linkGitHubManually,
  disconnectGitHub,
  getGitHubStatus,
};
