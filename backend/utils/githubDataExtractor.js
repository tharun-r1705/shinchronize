const crypto = require('crypto');

/**
 * GitHub Data Extractor Utility
 * Extracts and processes GitHub user data from OAuth
 */

/**
 * Encrypt GitHub access token for secure storage
 * @param {string} token - GitHub access token
 * @returns {string} Encrypted token
 */
function encryptToken(token) {
  const encryptionKey = process.env.GITHUB_TOKEN_ENCRYPTION_KEY;
  
  if (!encryptionKey || encryptionKey.length !== 64) {
    throw new Error('Invalid GITHUB_TOKEN_ENCRYPTION_KEY. Must be 64 hex characters (32 bytes)');
  }

  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(encryptionKey, 'hex');
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Return: iv:authTag:encryptedData
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt GitHub access token
 * @param {string} encryptedToken - Encrypted token string
 * @returns {string} Decrypted token
 */
function decryptToken(encryptedToken) {
  const encryptionKey = process.env.GITHUB_TOKEN_ENCRYPTION_KEY;
  
  if (!encryptionKey) {
    throw new Error('GITHUB_TOKEN_ENCRYPTION_KEY not configured');
  }

  const [ivHex, authTagHex, encrypted] = encryptedToken.split(':');
  
  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(encryptionKey, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Extract basic profile data from GitHub user object
 * @param {Object} userData - GitHub user data from /user endpoint
 * @param {Array} emails - GitHub emails from /user/emails endpoint
 * @returns {Object} Extracted profile data
 */
function extractBasicProfile(userData, emails = []) {
  // Find primary verified email
  const primaryEmail = emails.find(e => e.primary && e.verified);
  const anyVerifiedEmail = emails.find(e => e.verified);
  const email = primaryEmail || anyVerifiedEmail || emails[0];

  // Split name into first and last
  const fullName = userData.name || userData.login;
  const nameParts = fullName.trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  return {
    name: fullName,
    firstName,
    lastName,
    email: email?.email || null,
    emailVerified: email?.verified || false,
    avatarUrl: userData.avatar_url,
    githubUrl: userData.html_url,
    portfolioUrl: userData.blog || null,
    location: userData.location || null,
    summary: userData.bio || null,
    company: userData.company || null,
  };
}

/**
 * Extract GitHub authentication data
 * @param {Object} userData - GitHub user data
 * @param {string} accessToken - OAuth access token
 * @returns {Object} GitHub auth object
 */
function extractGithubAuth(userData, accessToken) {
  return {
    githubId: userData.id.toString(),
    username: userData.login,
    avatarUrl: userData.avatar_url,
    encryptedAccessToken: encryptToken(accessToken),
    connectedAt: new Date(),
    authType: 'oauth',
    lastVerifiedAt: new Date(),
  };
}

/**
 * Extract GitHub statistics
 * @param {Object} userData - GitHub user data
 * @returns {Object} GitHub stats object
 */
function extractGithubStats(userData) {
  return {
    username: userData.login,
    avatarUrl: userData.avatar_url,
    bio: userData.bio || null,
    totalRepos: userData.public_repos || 0,
    followers: userData.followers || 0,
    following: userData.following || 0,
    publicGists: userData.public_gists || 0,
    createdAt: userData.created_at,
    topLanguages: [], // Will be populated by background job
    topRepos: [], // Will be populated by background job
    activityScore: 0, // Will be calculated by background job
    lastSyncedAt: new Date(),
  };
}

/**
 * Fetch user's email addresses from GitHub
 * @param {string} accessToken - OAuth access token
 * @returns {Promise<Array>} Array of email objects
 */
async function fetchUserEmails(accessToken) {
  try {
    const response = await fetch('https://api.github.com/user/emails', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch GitHub emails:', response.status);
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching GitHub emails:', error);
    return [];
  }
}

/**
 * Generate a random password for OAuth users
 * (They won't use it since they login via OAuth)
 * @returns {string} Random password
 */
function generateRandomPassword() {
  return crypto.randomBytes(32).toString('hex');
}

module.exports = {
  encryptToken,
  decryptToken,
  extractBasicProfile,
  extractGithubAuth,
  extractGithubStats,
  fetchUserEmails,
  generateRandomPassword,
};
