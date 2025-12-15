const fetch = require('node-fetch');
const dayjs = require('dayjs');

const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || null; // Optional PAT for higher rate limits

/**
 * Fetch GitHub user profile and repository data
 * @param {string} username - GitHub username
 * @returns {Promise<Object>} Processed GitHub stats
 */
const fetchGitHubData = async (username) => {
  if (!username || typeof username !== 'string') {
    throw new Error('Valid GitHub username is required');
  }

  // Sanitize username - only allow alphanumeric and hyphens
  const sanitizedUsername = username.trim().replace(/[^a-zA-Z0-9-]/g, '');
  if (!sanitizedUsername) {
    throw new Error('Invalid GitHub username format');
  }

  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'EvolvEd-Platform',
  };

  if (GITHUB_TOKEN) {
    headers['Authorization'] = `token ${GITHUB_TOKEN}`;
  }

  try {
    // Fetch user profile
    const userResponse = await fetch(`${GITHUB_API_BASE}/users/${sanitizedUsername}`, { headers });
    
    if (userResponse.status === 404) {
      throw new Error('GitHub user not found');
    }
    
    if (userResponse.status === 403) {
      throw new Error('GitHub API rate limit exceeded. Please try again later.');
    }
    
    if (!userResponse.ok) {
      throw new Error(`GitHub API error: ${userResponse.statusText}`);
    }

    const userData = await userResponse.json();

    // Fetch repositories (latest 30)
    const reposResponse = await fetch(
      `${GITHUB_API_BASE}/users/${sanitizedUsername}/repos?sort=updated&per_page=30&type=owner`,
      { headers }
    );

    if (!reposResponse.ok) {
      throw new Error('Failed to fetch repositories');
    }

    const reposData = await reposResponse.json();

    // Process data
    return processGitHubData(userData, reposData);

  } catch (error) {
    console.error('GitHub integration error:', error.message);
    throw error;
  }
};

/**
 * Process raw GitHub data into structured stats
 * @param {Object} userData - GitHub user profile data
 * @param {Array} reposData - GitHub repositories data
 * @returns {Object} Processed stats object
 */
const processGitHubData = (userData, reposData) => {
  // Aggregate programming languages across repositories
  const languageFrequency = {};
  const validRepos = reposData.filter(repo => !repo.fork); // Exclude forked repos

  validRepos.forEach(repo => {
    if (repo.language) {
      languageFrequency[repo.language] = (languageFrequency[repo.language] || 0) + 1;
    }
  });

  // Get top 3 languages by frequency
  const topLanguages = Object.entries(languageFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / validRepos.length) * 100),
    }));

  // Identify top 3 repositories by stars + recent activity
  const scoredRepos = validRepos.map(repo => {
    const daysSinceUpdate = dayjs().diff(dayjs(repo.updated_at), 'day');
    const recencyScore = Math.max(0, 100 - daysSinceUpdate); // Higher score for recent activity
    const popularityScore = (repo.stargazers_count || 0) * 10; // Stars weighted heavily
    const totalScore = popularityScore + recencyScore;

    return {
      ...repo,
      totalScore,
    };
  });

  const topRepos = scoredRepos
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 3)
    .map(repo => ({
      name: repo.name,
      description: repo.description || '',
      language: repo.language || 'Unknown',
      stars: repo.stargazers_count || 0,
      forks: repo.forks_count || 0,
      lastUpdated: repo.updated_at,
    }));

  // Calculate GitHub Activity Score (0-100)
  const activityScore = calculateGitHubActivityScore(userData, validRepos);

  return {
    username: userData.login,
    avatarUrl: userData.avatar_url || '',
    bio: userData.bio || '',
    totalRepos: userData.public_repos || 0,
    topLanguages,
    topRepos,
    activityScore,
    lastSyncedAt: new Date(),
  };
};

/**
 * Calculate GitHub activity score based on multiple factors
 * @param {Object} userData - User profile data
 * @param {Array} repos - Repository data
 * @returns {number} Activity score from 0 to 100
 */
const calculateGitHubActivityScore = (userData, repos) => {
  let score = 0;

  // Factor 1: Repository count (max 30 points)
  const repoCount = userData.public_repos || 0;
  const repoScore = Math.min(repoCount * 2, 30);
  score += repoScore;

  // Factor 2: Recent activity in last 90 days (max 40 points)
  const ninetyDaysAgo = dayjs().subtract(90, 'day');
  const recentRepos = repos.filter(repo =>
    dayjs(repo.updated_at).isAfter(ninetyDaysAgo)
  );
  const recentActivityScore = Math.min(recentRepos.length * 4, 40);
  score += recentActivityScore;

  // Factor 3: Language diversity (max 30 points)
  const uniqueLanguages = new Set(
    repos.map(repo => repo.language).filter(Boolean)
  );
  const diversityScore = Math.min(uniqueLanguages.size * 5, 30);
  score += diversityScore;

  return Math.min(Math.round(score), 100);
};

/**
 * Extract GitHub username from various URL formats
 * @param {string} input - GitHub URL or username
 * @returns {string|null} Extracted username or null
 */
const extractGitHubUsername = (input) => {
  if (!input) return null;

  const trimmed = input.trim();

  // If it's already just a username (no slashes or dots)
  if (!/[\/\.]/.test(trimmed)) {
    return trimmed;
  }

  // Try to extract from URL
  const patterns = [
    /github\.com\/([a-zA-Z0-9-]+)/i,
    /^([a-zA-Z0-9-]+)$/,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
};

module.exports = {
  fetchGitHubData,
  extractGitHubUsername,
  calculateGitHubActivityScore,
};
