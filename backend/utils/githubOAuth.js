const crypto = require('crypto');
const fetch = require('node-fetch');

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const GITHUB_REDIRECT_URI = process.env.GITHUB_REDIRECT_URI || 'http://localhost:5001/api/github/callback';
const ENCRYPTION_KEY = process.env.GITHUB_TOKEN_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');

/**
 * Generate GitHub OAuth authorization URL
 * @param {string} state - Secure state parameter to prevent CSRF
 * @returns {string} GitHub OAuth URL
 */
const getGitHubAuthUrl = (state) => {
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: GITHUB_REDIRECT_URI,
    scope: 'read:user public_repo',
    state: state,
  });

  return `https://github.com/login/oauth/authorize?${params.toString()}`;
};

/**
 * Exchange OAuth code for access token
 * @param {string} code - OAuth authorization code
 * @returns {Promise<string>} GitHub access token
 */
const exchangeCodeForToken = async (code) => {
  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
    throw new Error('GitHub OAuth credentials not configured');
  }

  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code: code,
      redirect_uri: GITHUB_REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to exchange code for token');
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error_description || 'OAuth token exchange failed');
  }

  return data.access_token;
};

/**
 * Fetch GitHub user profile using access token
 * @param {string} accessToken - GitHub access token
 * @returns {Promise<Object>} GitHub user profile
 */
const fetchGitHubProfile = async (accessToken) => {
  const response = await fetch('https://api.github.com/user', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'EvolvEd-Platform',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch GitHub profile');
  }

  return response.json();
};

/**
 * Encrypt GitHub access token before storing in database
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

    // Return format: iv:encrypted:authTag (all in hex)
    return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
  } catch (error) {
    console.error('Token encryption error:', error);
    throw new Error('Failed to encrypt token');
  }
};

/**
 * Decrypt GitHub access token
 * @param {string} encryptedToken - Encrypted token in format: iv:encrypted:authTag
 * @returns {string} Plain text access token
 */
const decryptToken = (encryptedToken) => {
  if (!encryptedToken) return null;

  try {
    const parts = encryptedToken.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted token format');
    }

    const [ivHex, encryptedHex, authTagHex] = parts;
    const key = Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Token decryption error:', error);
    throw new Error('Failed to decrypt token');
  }
};

/**
 * Generate secure state parameter for CSRF protection
 * @param {string} studentId - Student ID to include in state
 * @returns {string} Base64-encoded state with timestamp
 */
const generateState = (studentId) => {
  const stateObj = {
    studentId: studentId || 'signup',
    timestamp: Date.now(),
    random: crypto.randomBytes(16).toString('hex'),
  };

  return Buffer.from(JSON.stringify(stateObj)).toString('base64');
};

/**
 * Validate and parse state parameter
 * @param {string} state - Base64-encoded state
 * @returns {Object} Parsed state object
 */
const validateState = (state) => {
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
    
    // Check if state is not older than 10 minutes
    const age = Date.now() - decoded.timestamp;
    if (age > 10 * 60 * 1000) {
      throw new Error('State expired');
    }

    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired state parameter');
  }
};

/**
 * Fetch repositories using OAuth token (for enhanced data access)
 * @param {string} accessToken - GitHub access token
 * @param {string} username - GitHub username
 * @returns {Promise<Array>} User repositories
 */
const fetchAuthenticatedRepos = async (accessToken, username) => {
  const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=30&type=owner`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'EvolvEd-Platform',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch repositories');
  }

  return response.json();
};

module.exports = {
  getGitHubAuthUrl,
  exchangeCodeForToken,
  fetchGitHubProfile,
  encryptToken,
  decryptToken,
  generateState,
  validateState,
  fetchAuthenticatedRepos,
};
