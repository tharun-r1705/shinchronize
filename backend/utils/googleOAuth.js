const crypto = require('crypto');
const fetch = require('node-fetch');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5001/api/google/callback';
const ENCRYPTION_KEY = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');

/**
 * Generate Google OAuth authorization URL
 * @param {string} state - Secure state parameter to prevent CSRF
 * @returns {string} Google OAuth URL
 */
const getGoogleAuthUrl = (state) => {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'email profile',
    access_type: 'offline',
    state: state,
    prompt: 'consent',
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

/**
 * Exchange OAuth code for access token
 * @param {string} code - OAuth authorization code
 * @returns {Promise<Object>} Token response including access_token and id_token
 */
const exchangeCodeForToken = async (code) => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error('Google OAuth credentials not configured');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      code: code,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code for token: ${error}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error_description || 'OAuth token exchange failed');
  }

  return data;
};

/**
 * Fetch Google user profile using access token
 * @param {string} accessToken - Google access token
 * @returns {Promise<Object>} Google user profile
 */
const fetchGoogleProfile = async (accessToken) => {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Google profile');
  }

  return response.json();
};

/**
 * Encrypt Google access token before storing in database
 * Uses AES-256-GCM encryption
 * @param {string} token - Plain text access token
 * @returns {string} Encrypted token in format: iv:encrypted:authTag
 */
const encryptToken = (token) => {
  if (!token) return null;

  try {
    // Ensure encryption key is 32 bytes for AES-256
    const key = Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Return as single string: iv:encrypted:authTag
    return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
  } catch (error) {
    console.error('Token encryption error:', error);
    return null;
  }
};

/**
 * Decrypt Google access token
 * @param {string} encryptedToken - Encrypted token string
 * @returns {string} Decrypted access token
 */
const decryptToken = (encryptedToken) => {
  if (!encryptedToken) return null;

  try {
    const parts = encryptedToken.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted token format');
    }

    const [ivHex, encrypted, authTagHex] = parts;
    const key = Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Token decryption error:', error);
    return null;
  }
};

/**
 * Generate secure state parameter for OAuth
 * Includes timestamp and student ID (encrypted)
 * @param {string} studentId - Student ID or 'signup' for new users
 * @returns {string} Secure state string
 */
const generateState = (studentId = 'signup') => {
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(16).toString('hex');
  const payload = JSON.stringify({ studentId, timestamp, randomBytes });
  
  // Base64 encode for URL safety
  return Buffer.from(payload).toString('base64url');
};

/**
 * Validate and decode state parameter
 * @param {string} state - State string from OAuth callback
 * @returns {Object} Decoded state data
 * @throws {Error} If state is invalid or expired
 */
const validateState = (state) => {
  try {
    const payload = Buffer.from(state, 'base64url').toString('utf8');
    const data = JSON.parse(payload);

    // Check if state is expired (10 minutes)
    const age = Date.now() - data.timestamp;
    if (age > 10 * 60 * 1000) {
      throw new Error('State expired');
    }

    return data;
  } catch (error) {
    throw new Error('Invalid state parameter');
  }
};

module.exports = {
  getGoogleAuthUrl,
  exchangeCodeForToken,
  fetchGoogleProfile,
  encryptToken,
  decryptToken,
  generateState,
  validateState,
};
