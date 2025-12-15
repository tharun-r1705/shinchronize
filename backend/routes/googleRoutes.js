const express = require('express');
const router = express.Router();

/**
 * Google OAuth Login - Initiates OAuth flow
 * GET /api/google/login
 * 
 * Constructs Google authorization URL and redirects user to Google
 */
router.get('/login', (req, res) => {
  console.log('🟢 Google OAuth /login endpoint hit');
  
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    console.error('❌ Google OAuth not configured');
    return res.status(500).json({ 
      error: 'Google OAuth not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_REDIRECT_URI in .env' 
    });
  }

  // Generate random state for CSRF protection
  const state = Math.random().toString(36).substring(7);
  
  // Store state in session cookie for validation in callback
  res.cookie('google_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 10 * 60 * 1000, // 10 minutes
    sameSite: 'lax'
  });

  // Construct Google OAuth authorization URL
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.append('client_id', clientId);
  authUrl.searchParams.append('redirect_uri', redirectUri);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('scope', 'email profile');
  authUrl.searchParams.append('access_type', 'offline');
  authUrl.searchParams.append('state', state);
  authUrl.searchParams.append('prompt', 'consent');

  console.log('🟢 Redirecting to Google:', authUrl.toString());
  
  // Redirect user to Google
  res.redirect(authUrl.toString());
});

/**
 * Google OAuth Callback - Handles OAuth response
 * GET /api/google/callback
 * 
 * Receives authorization code from Google and redirects back to frontend
 */
router.get('/callback', async (req, res) => {
  console.log('🟢 Google OAuth /callback endpoint hit');
  
  const { code, state } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';

  console.log('🟢 Callback params:', { code: !!code, state: !!state, frontendUrl });

  // Validate state parameter (CSRF protection)
  const storedState = req.cookies.google_oauth_state;
  if (!state || !storedState || state !== storedState) {
    console.error('❌ Invalid OAuth state');
    res.clearCookie('google_oauth_state');
    return res.redirect(`${frontendUrl}/student/login?error=invalid_state`);
  }

  // Clear state cookie
  res.clearCookie('google_oauth_state');

  // Validate code
  if (!code) {
    console.error('❌ No authorization code received');
    return res.redirect(`${frontendUrl}/student/login?error=no_code`);
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials not configured');
    }

    console.log('🟢 Exchanging code for access token...');

    // Exchange code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      throw new Error(tokenData.error_description || 'Token exchange failed');
    }

    const accessToken = tokenData.access_token;
    console.log('✅ Access token received');

    // Fetch user profile from Google
    console.log('🟢 Fetching Google user profile...');
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const userData = await userResponse.json();

    if (!userResponse.ok) {
      throw new Error('Failed to fetch user profile');
    }

    console.log('✅ Google profile fetched:', userData.email);

    // TODO: Here you would:
    // 1. Check if user exists in database by Google ID or email
    // 2. Create new user or update existing user's Google connection
    // 3. Generate JWT token
    // 4. Set the JWT in an httpOnly cookie or return it for localStorage

    // For now, redirect back to frontend with googleconnected flag
    // The frontend will detect this and handle the login flow
    console.log('🟢 Redirecting to frontend with success flag');
    res.redirect(`${frontendUrl}/student/login?googleconnected=true&email=${userData.email}`);

  } catch (error) {
    console.error('❌ Google OAuth error:', error);
    res.redirect(`${frontendUrl}/student/login?error=oauth_failed&message=${encodeURIComponent(error.message)}`);
  }
});

module.exports = router;
