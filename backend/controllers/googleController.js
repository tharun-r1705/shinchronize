const Student = require('../models/Student');
const asyncHandler = require('../utils/asyncHandler');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { calculateReadinessScore } = require('../utils/readinessScore');
const {
  getGoogleAuthUrl,
  exchangeCodeForToken,
  fetchGoogleProfile,
  encryptToken,
  generateState,
  validateState,
} = require('../utils/googleOAuth');

/**
 * Initiate Google OAuth flow
 * GET /api/google/connect
 * 
 * Redirects user to Google authorization page.
 * State parameter includes student ID for linking after callback.
 */
const initiateGoogleOAuth = asyncHandler(async (req, res) => {
  // Student ID can be passed from authenticated session or signup flow
  const studentId = req.user?._id || req.query.studentId || 'signup';
  const type = req.query.type || 'signup'; // 'signup' or 'login'
  
  // Generate secure state parameter to prevent CSRF
  const state = generateState(`${studentId}:${type}`);
  
  // Store state in session/cookie for validation
  res.cookie('google_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 10 * 60 * 1000, // 10 minutes
    sameSite: 'lax',
  });

  // Redirect to Google OAuth
  const authUrl = getGoogleAuthUrl(state);
  res.redirect(authUrl);
});

/**
 * Handle Google OAuth callback
 * GET /api/google/callback
 * 
 * Exchanges code for access token, fetches user profile,
 * and either creates new account or logs in existing user.
 */
const handleGoogleCallback = asyncHandler(async (req, res) => {
  const { code, state } = req.query;

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  // Validate required parameters
  if (!code || !state) {
    return res.redirect(`${frontendUrl}/student/login?error=oauth_failed&message=Missing parameters`);
  }

  try {
    // Validate state parameter (CSRF protection)
    const stateData = validateState(state);
    
    // Optional: Verify state matches cookie
    const cookieState = req.cookies?.google_oauth_state;
    if (cookieState && cookieState !== state) {
      throw new Error('State mismatch');
    }

    // Parse state to get studentId and type
    const [studentId, type] = stateData.studentId.split(':');

    // Exchange authorization code for access token
    const tokenData = await exchangeCodeForToken(code);
    
    // Fetch Google user profile
    const googleProfile = await fetchGoogleProfile(tokenData.access_token);

    // Check if user already exists
    let student = await Student.findOne({ email: googleProfile.email });

    if (type === 'login') {
      // Login flow
      if (!student) {
        return res.redirect(`${frontendUrl}/student/login?error=account_not_found&message=No account found with this Google email. Please sign up first.`);
      }

      // Update Google auth info
      student.googleAuth = {
        googleId: googleProfile.id,
        email: googleProfile.email,
        name: googleProfile.name,
        picture: googleProfile.picture,
        encryptedAccessToken: encryptToken(tokenData.access_token),
        connectedAt: student.googleAuth?.connectedAt || new Date(),
        lastLoginAt: new Date(),
      };

      student.oauthProvider = 'google';
      await student.save();

      // Generate JWT token
      const token = jwt.sign(
        { id: student._id, email: student.email, userType: 'student' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Clear OAuth state cookie
      res.clearCookie('google_oauth_state');

      // Redirect to dashboard with token
      return res.redirect(`${frontendUrl}/student/login?oauth_login=success&token=${token}`);

    } else {
      // Signup flow
      if (student) {
        // Account already exists - redirect to login
        return res.redirect(`${frontendUrl}/student/login?error=account_exists&message=An account with this email already exists. Please login instead.`);
      }

      // Create new student account
      student = new Student({
        name: googleProfile.name,
        email: googleProfile.email,
        password: crypto.randomBytes(32).toString('hex'), // Random password since OAuth user
        oauthProvider: 'google',
        googleAuth: {
          googleId: googleProfile.id,
          email: googleProfile.email,
          name: googleProfile.name,
          picture: googleProfile.picture,
          encryptedAccessToken: encryptToken(tokenData.access_token),
          connectedAt: new Date(),
          lastLoginAt: new Date(),
        },
        emailVerified: true, // Google emails are pre-verified
      });

      // Calculate initial readiness score
      const { total } = calculateReadinessScore(student);
      student.readinessScore = total;
      student.growthTimeline.push({
        date: new Date(),
        readinessScore: total,
        reason: 'Account created via Google OAuth',
      });

      await student.save();

      // Generate JWT token
      const token = jwt.sign(
        { id: student._id, email: student.email, userType: 'student' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Clear OAuth state cookie
      res.clearCookie('google_oauth_state');

      // Redirect to complete profile (collect GitHub handle, college, etc.)
      return res.redirect(`${frontendUrl}/student/login?oauth_signup=success&token=${token}&needs_profile=true`);
    }

  } catch (error) {
    console.error('Google OAuth callback error:', error);
    res.clearCookie('google_oauth_state');
    return res.redirect(`${frontendUrl}/student/login?error=oauth_failed&message=${encodeURIComponent(error.message)}`);
  }
});

/**
 * Disconnect Google account
 * POST /api/google/disconnect
 * Protected route - requires authentication
 */
const disconnectGoogle = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.user.id);

  if (!student) {
    return res.status(404).json({ message: 'Student not found' });
  }

  // Check if user has password set (can't disconnect if OAuth is only login method)
  if (student.oauthProvider === 'google' && !student.password) {
    return res.status(400).json({ 
      message: 'Cannot disconnect Google account as it is your only login method. Please set a password first.' 
    });
  }

  // Remove Google auth data
  student.googleAuth = undefined;
  if (student.oauthProvider === 'google') {
    student.oauthProvider = undefined;
  }

  await student.save();

  res.json({ message: 'Google account disconnected successfully' });
});

/**
 * Get Google connection status
 * GET /api/google/status
 * Protected route - requires authentication
 */
const getGoogleStatus = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.user.id).select('googleAuth oauthProvider');

  if (!student) {
    return res.status(404).json({ message: 'Student not found' });
  }

  const isConnected = !!(student.googleAuth && student.googleAuth.googleId);

  res.json({
    connected: isConnected,
    provider: student.oauthProvider,
    profile: isConnected ? {
      email: student.googleAuth.email,
      name: student.googleAuth.name,
      picture: student.googleAuth.picture,
      connectedAt: student.googleAuth.connectedAt,
      lastLoginAt: student.googleAuth.lastLoginAt,
    } : null,
  });
});

module.exports = {
  initiateGoogleOAuth,
  handleGoogleCallback,
  disconnectGoogle,
  getGoogleStatus,
};
