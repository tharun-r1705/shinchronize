const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Student = require('../models/Student');
const {
  extractBasicProfile,
  extractGithubAuth,
  extractGithubStats,
  fetchUserEmails,
  generateRandomPassword,
} = require('../utils/githubDataExtractor');
const { syncGitHubData } = require('../jobs/githubSyncJob');

/**
 * GitHub OAuth Login - Initiates OAuth flow
 * GET /api/github/login
 * 
 * CRITICAL: This route MUST redirect to GitHub, NOT to the frontend.
 * It constructs the GitHub authorization URL using ONLY backend environment
 * variables and performs a server-side redirect to GitHub's OAuth page.
 */
router.get('/login', (req, res) => {
  console.log('🔵 [GitHub OAuth] /login endpoint hit');
  console.log('🔵 [GitHub OAuth] Request URL:', req.originalUrl);
  console.log('🔵 [GitHub OAuth] Request method:', req.method);
  
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = process.env.GITHUB_REDIRECT_URI;

  console.log('🔵 [GitHub OAuth] Client ID exists:', !!clientId);
  console.log('🔵 [GitHub OAuth] Redirect URI:', redirectUri);

  if (!clientId || !redirectUri) {
    console.error('❌ [GitHub OAuth] Configuration missing!');
    console.error('❌ [GitHub OAuth] GITHUB_CLIENT_ID:', !!clientId);
    console.error('❌ [GitHub OAuth] GITHUB_REDIRECT_URI:', !!redirectUri);
    return res.status(500).json({ 
      error: 'GitHub OAuth not configured. Please set GITHUB_CLIENT_ID and GITHUB_REDIRECT_URI in .env' 
    });
  }

  // Generate random state for CSRF protection
  const state = Math.random().toString(36).substring(7);
  
  // Store state in session cookie for validation in callback
  res.cookie('github_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 10 * 60 * 1000, // 10 minutes
    sameSite: 'lax'
  });

  // Construct GitHub OAuth authorization URL
  // This is the ACTUAL GitHub authorization page, not our frontend
  const authUrl = new URL('https://github.com/login/oauth/authorize');
  authUrl.searchParams.append('client_id', clientId);
  authUrl.searchParams.append('redirect_uri', redirectUri);
  authUrl.searchParams.append('scope', 'read:user user:email');
  authUrl.searchParams.append('state', state);

  const finalUrl = authUrl.toString();
  console.log('🔵 [GitHub OAuth] Constructed GitHub URL:', finalUrl);
  console.log('✅ [GitHub OAuth] REDIRECTING TO GITHUB (NOT FRONTEND)');
  
  // This redirect sends the user to GitHub's authorization page
  // The browser will navigate to https://github.com/login/oauth/authorize
  res.redirect(finalUrl);
});

/**
 * GitHub OAuth Callback - Handles OAuth response from GitHub
 * GET /api/github/callback
 * 
 * This route receives the authorization code from GitHub after the user
 * authorizes the app. It exchanges the code for an access token, fetches
 * the user's GitHub profile, and then redirects back to the FRONTEND.
 */
router.get('/callback', async (req, res) => {
  console.log('🔵 [GitHub OAuth] /callback endpoint hit');
  console.log('🔵 [GitHub OAuth] Query params:', req.query);
  
  const { code, state } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';

  console.log('🔵 [GitHub OAuth] Authorization code received:', !!code);
  console.log('🔵 [GitHub OAuth] State received:', !!state);
  console.log('🔵 [GitHub OAuth] Frontend URL:', frontendUrl);

  // Validate state parameter (CSRF protection)
  const storedState = req.cookies.github_oauth_state;
  if (!state || !storedState || state !== storedState) {
    console.error('❌ [GitHub OAuth] Invalid state! CSRF check failed.');
    console.error('❌ [GitHub OAuth] Received state:', state);
    console.error('❌ [GitHub OAuth] Stored state:', storedState);
    res.clearCookie('github_oauth_state');
    return res.redirect(`${frontendUrl}/student/login?error=invalid_state`);
  }

  console.log('✅ [GitHub OAuth] State validation passed');
  
  // Clear state cookie
  res.clearCookie('github_oauth_state');

  // Validate code
  if (!code) {
    console.error('❌ [GitHub OAuth] No authorization code received from GitHub');
    return res.redirect(`${frontendUrl}/student/login?error=no_code`);
  }

  console.log('🔵 [GitHub OAuth] Authorization code (first 10 chars):', code.substring(0, 10) + '...');

  try {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('GitHub OAuth credentials not configured');
    }

    console.log('🔵 [GitHub OAuth] Exchanging authorization code for access token...');

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: process.env.GITHUB_REDIRECT_URI
      })
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('❌ [GitHub OAuth] Token exchange failed:', tokenData.error_description);
      throw new Error(tokenData.error_description || 'Token exchange failed');
    }

    const accessToken = tokenData.access_token;
    console.log('✅ [GitHub OAuth] Access token received');

    // Fetch user profile from GitHub
    console.log('🔵 [GitHub OAuth] Fetching user profile from GitHub API...');
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    const userData = await userResponse.json();

    if (!userResponse.ok) {
      console.error('❌ [GitHub OAuth] Failed to fetch user profile:', userData);
      throw new Error('Failed to fetch user profile');
    }

    console.log('✅ [GitHub OAuth] GitHub profile fetched successfully');
    console.log('✅ [GitHub OAuth] Username:', userData.login);
    console.log('✅ [GitHub OAuth] User ID:', userData.id);

    // Fetch user's email addresses
    console.log('🔵 [GitHub OAuth] Fetching user emails...');
    const emails = await fetchUserEmails(accessToken);
    console.log('✅ [GitHub OAuth] Emails fetched:', emails.length);

    // Extract profile data
    const profileData = extractBasicProfile(userData, emails);
    const githubAuthData = extractGithubAuth(userData, accessToken);
    const githubStatsData = extractGithubStats(userData);

    console.log('🔵 [GitHub OAuth] Extracted email:', profileData.email);

    // Check if user already exists (by GitHub ID or email)
    let student = await Student.findOne({
      $or: [
        { 'githubAuth.githubId': userData.id.toString() },
        { email: profileData.email },
      ],
    });

    if (student) {
      console.log('✅ [GitHub OAuth] Existing user found:', student.email);
      
      // Update existing user's GitHub connection
      student.githubAuth = githubAuthData;
      student.githubStats = githubStatsData;
      
      // Update profile fields if not already set
      if (!student.avatarUrl && profileData.avatarUrl) {
        student.avatarUrl = profileData.avatarUrl;
      }
      if (!student.githubUrl) {
        student.githubUrl = profileData.githubUrl;
      }
      if (!student.location && profileData.location) {
        student.location = profileData.location;
      }
      if (!student.portfolioUrl && profileData.portfolioUrl) {
        student.portfolioUrl = profileData.portfolioUrl;
      }
      if (!student.summary && profileData.summary) {
        student.summary = profileData.summary;
      }
      
      // Mark OAuth provider if not set
      if (!student.oauthProvider) {
        student.oauthProvider = 'github';
      }
      
      // Update email verification if GitHub email is verified
      if (profileData.emailVerified) {
        student.emailVerified = true;
      }
      
      await student.save();
      console.log('✅ [GitHub OAuth] User updated successfully');
    } else {
      console.log('🔵 [GitHub OAuth] Creating new user...');
      
      // Create new user
      if (!profileData.email) {
        console.error('❌ [GitHub OAuth] No email available from GitHub');
        return res.redirect(`${frontendUrl}/student/login?error=no_email&message=${encodeURIComponent('No email found in your GitHub account. Please add a verified email to your GitHub profile.')}`);
      }

      // Generate random password (OAuth users won't use it)
      const randomPassword = generateRandomPassword();
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      student = new Student({
        name: profileData.name,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.email,
        password: hashedPassword,
        avatarUrl: profileData.avatarUrl,
        githubUrl: profileData.githubUrl,
        portfolioUrl: profileData.portfolioUrl,
        location: profileData.location,
        summary: profileData.summary,
        githubAuth: githubAuthData,
        githubStats: githubStatsData,
        oauthProvider: 'github',
        emailVerified: profileData.emailVerified,
      });

      await student.save();
      console.log('✅ [GitHub OAuth] New user created:', student.email);
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: student._id,
        email: student.email,
        role: 'student',
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ [GitHub OAuth] JWT token generated');

    // Trigger background sync job (don't wait for it)
    console.log('🔄 [GitHub OAuth] Triggering background GitHub data sync...');
    syncGitHubData(student._id, true).then(result => {
      if (result.success) {
        console.log(`✅ [GitHub OAuth] Background sync completed for ${student.email}`);
      } else {
        console.error(`❌ [GitHub OAuth] Background sync failed: ${result.error}`);
      }
    }).catch(err => {
      console.error('❌ [GitHub OAuth] Background sync error:', err);
    });

    // Redirect to frontend with token (don't wait for sync)
    const redirectUrl = `${frontendUrl}/student/login?githubconnected=true&token=${token}&username=${userData.login}`;
    console.log('🔵 [GitHub OAuth] Redirecting to frontend:', redirectUrl);
    console.log('✅ [GitHub OAuth] OAuth flow complete - redirecting to FRONTEND');
    
    res.redirect(redirectUrl);

  } catch (error) {
    console.error('❌ [GitHub OAuth] Error during OAuth flow:', error.message);
    console.error('❌ [GitHub OAuth] Stack:', error.stack);
    res.redirect(`${frontendUrl}/student/login?error=oauth_failed&message=${encodeURIComponent(error.message)}`);
  }
});

module.exports = router;
