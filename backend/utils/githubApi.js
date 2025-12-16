/**
 * GitHub REST API Integration Module
 * 
 * This utility provides clean API calls to GitHub REST API
 * with built-in rate limit handling, caching, and error management.
 * 
 * NO SCRAPING - Uses only official GitHub REST API
 */

const axios = require('axios');

// Cache configuration
const cache = new Map();
const CACHE_DURATION = {
  profile: 5 * 60 * 1000,      // 5 minutes
  repos: 10 * 60 * 1000,       // 10 minutes
  consistency: 15 * 60 * 1000, // 15 minutes
  openSource: 15 * 60 * 1000   // 15 minutes
};

/**
 * Base GitHub API client with authentication and rate limit handling
 */
const githubClient = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'EvolvEd-Platform'
  }
});

// Add GitHub token if available (increases rate limit from 60 to 5000/hour)
if (process.env.GITHUB_TOKEN) {
  githubClient.defaults.headers.common['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
}

/**
 * Check rate limit status
 */
async function checkRateLimit() {
  try {
    const response = await githubClient.get('/rate_limit');
    const { remaining, limit, reset } = response.data.rate;
    
    console.log(`📊 GitHub API Rate Limit: ${remaining}/${limit}`);
    
    if (remaining < 10) {
      const resetDate = new Date(reset * 1000);
      throw new Error(`GitHub API rate limit almost exhausted. Resets at ${resetDate.toISOString()}`);
    }
    
    return { remaining, limit, reset };
  } catch (error) {
    console.error('❌ Rate limit check failed:', error.message);
    throw error;
  }
}

/**
 * Get cached data if available and fresh
 */
function getCachedData(key, category) {
  const cacheKey = `${key}_${category}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION[category]) {
    console.log(`✅ Cache HIT for ${cacheKey}`);
    return cached.data;
  }
  
  console.log(`❌ Cache MISS for ${cacheKey}`);
  return null;
}

/**
 * Set cache data
 */
function setCachedData(key, category, data) {
  const cacheKey = `${key}_${category}`;
  cache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
  console.log(`💾 Cached data for ${cacheKey}`);
}

/**
 * Clear cache for specific user and category
 */
function clearCache(username, category = null) {
  if (category) {
    const cacheKey = `${username}_${category}`;
    cache.delete(cacheKey);
    console.log(`🗑️ Cleared cache for ${cacheKey}`);
  } else {
    // Clear all categories for user
    ['profile', 'repos', 'consistency', 'openSource'].forEach(cat => {
      cache.delete(`${username}_${cat}`);
    });
    console.log(`🗑️ Cleared all cache for ${username}`);
  }
}

/**
 * CATEGORY 1: FETCH PROFILE OVERVIEW
 * Returns: avatar, username, account age, repos count, followers
 */
async function fetchGitHubProfile(username) {
  try {
    // Check cache first
    const cached = getCachedData(username, 'profile');
    if (cached) return cached;
    
    console.log(`🔍 Fetching GitHub profile for: ${username}`);
    
    const response = await githubClient.get(`/users/${username}`);
    const user = response.data;
    
    const profileData = {
      avatar: user.avatar_url,
      username: user.login,
      name: user.name || user.login,
      bio: user.bio,
      location: user.location,
      blog: user.blog,
      company: user.company,
      accountAge: calculateAccountAge(user.created_at),
      createdAt: user.created_at,
      publicRepos: user.public_repos,
      followers: user.followers,
      following: user.following,
      lastRefreshed: new Date()
    };
    
    // Cache the result
    setCachedData(username, 'profile', profileData);
    
    console.log(`✅ Profile fetched for ${username}: ${profileData.publicRepos} repos, ${profileData.followers} followers`);
    return profileData;
    
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error(`GitHub user '${username}' not found`);
    }
    if (error.response?.status === 403) {
      throw new Error('GitHub API rate limit exceeded. Please try again later.');
    }
    console.error(`❌ Error fetching profile for ${username}:`, error.message);
    throw error;
  }
}

/**
 * CATEGORY 2: FETCH REPOSITORIES
 * Returns: repo details with name, description, language, stars, forks, etc.
 */
async function fetchGitHubRepositories(username) {
  try {
    // Check cache first
    const cached = getCachedData(username, 'repos');
    if (cached) return cached;
    
    console.log(`🔍 Fetching repositories for: ${username}`);
    
    // Fetch all repositories (paginated)
    let allRepos = [];
    let page = 1;
    let hasMore = true;
    
    while (hasMore && page <= 10) { // Limit to 10 pages (1000 repos max)
      const response = await githubClient.get(`/users/${username}/repos`, {
        params: {
          per_page: 100,
          page: page,
          sort: 'updated',
          direction: 'desc'
        }
      });
      
      allRepos = allRepos.concat(response.data);
      hasMore = response.data.length === 100;
      page++;
    }
    
    const reposData = allRepos.map(repo => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      language: repo.language,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      watchers: repo.watchers_count,
      openIssues: repo.open_issues_count,
      isFork: repo.fork,
      isPrivate: repo.private,
      url: repo.html_url,
      homepage: repo.homepage,
      topics: repo.topics || [],
      createdAt: repo.created_at,
      updatedAt: repo.updated_at,
      pushedAt: repo.pushed_at,
      size: repo.size,
      defaultBranch: repo.default_branch,
      hasIssues: repo.has_issues,
      hasProjects: repo.has_projects,
      hasWiki: repo.has_wiki
    }));
    
    const result = {
      repos: reposData,
      totalCount: reposData.length,
      originalRepos: reposData.filter(r => !r.isFork).length,
      forkedRepos: reposData.filter(r => r.isFork).length,
      topLanguages: getTopLanguages(reposData),
      totalStars: reposData.reduce((sum, r) => sum + r.stars, 0),
      totalForks: reposData.reduce((sum, r) => sum + r.forks, 0),
      lastRefreshed: new Date()
    };
    
    // Cache the result
    setCachedData(username, 'repos', result);
    
    console.log(`✅ Fetched ${result.totalCount} repositories for ${username}`);
    return result;
    
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error(`GitHub user '${username}' not found`);
    }
    if (error.response?.status === 403) {
      throw new Error('GitHub API rate limit exceeded. Please try again later.');
    }
    console.error(`❌ Error fetching repositories for ${username}:`, error.message);
    throw error;
  }
}

/**
 * CATEGORY 3: FETCH CODING CONSISTENCY
 * Returns: commits per week (last 90 days), active weeks, last commit date
 */
async function fetchGitHubConsistency(username) {
  try {
    // Check cache first
    const cached = getCachedData(username, 'consistency');
    if (cached) return cached;
    
    console.log(`🔍 Fetching coding consistency for: ${username}`);
    
    // Fetch user events (includes push events with commits)
    const eventsResponse = await githubClient.get(`/users/${username}/events/public`, {
      params: { per_page: 100 }
    });
    
    const events = eventsResponse.data;
    
    // Filter push events (commits)
    const pushEvents = events.filter(e => e.type === 'PushEvent');
    
    // Calculate metrics for last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const recentPushEvents = pushEvents.filter(e => 
      new Date(e.created_at) > ninetyDaysAgo
    );
    
    // Count commits
    const totalCommits = recentPushEvents.reduce((sum, event) => {
      return sum + (event.payload.commits?.length || 0);
    }, 0);
    
    // Calculate weekly breakdown
    const weeklyCommits = calculateWeeklyCommits(recentPushEvents);
    const activeWeeks = weeklyCommits.filter(w => w.commits > 0).length;
    
    // Get last commit date
    const lastCommitDate = pushEvents.length > 0 
      ? new Date(pushEvents[0].created_at)
      : null;
    
    // Calculate consistency score (0-100)
    const consistencyScore = calculateConsistencyScore(weeklyCommits, activeWeeks);
    
    const consistencyData = {
      totalCommits,
      commitsPerWeek: (totalCommits / 13).toFixed(1), // 90 days ≈ 13 weeks
      activeWeeks,
      totalWeeks: 13,
      consistencyPercentage: ((activeWeeks / 13) * 100).toFixed(1),
      lastCommitDate,
      daysSinceLastCommit: lastCommitDate 
        ? Math.floor((Date.now() - lastCommitDate) / (1000 * 60 * 60 * 24))
        : null,
      weeklyBreakdown: weeklyCommits,
      consistencyScore,
      lastRefreshed: new Date()
    };
    
    // Cache the result
    setCachedData(username, 'consistency', consistencyData);
    
    console.log(`✅ Consistency data fetched: ${totalCommits} commits, ${activeWeeks} active weeks`);
    return consistencyData;
    
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error(`GitHub user '${username}' not found`);
    }
    if (error.response?.status === 403) {
      throw new Error('GitHub API rate limit exceeded. Please try again later.');
    }
    console.error(`❌ Error fetching consistency for ${username}:`, error.message);
    throw error;
  }
}

/**
 * CATEGORY 4: FETCH OPEN SOURCE CONTRIBUTIONS
 * Returns: pull requests, issues opened/closed
 */
async function fetchGitHubOpenSource(username) {
  try {
    // Check cache first
    const cached = getCachedData(username, 'openSource');
    if (cached) return cached;
    
    console.log(`🔍 Fetching open source contributions for: ${username}`);
    
    // Fetch user events for contribution data
    const eventsResponse = await githubClient.get(`/users/${username}/events/public`, {
      params: { per_page: 100 }
    });
    
    const events = eventsResponse.data;
    
    // Count different contribution types
    const pullRequestEvents = events.filter(e => e.type === 'PullRequestEvent');
    const issueEvents = events.filter(e => e.type === 'IssuesEvent');
    const pullRequestReviewEvents = events.filter(e => e.type === 'PullRequestReviewEvent');
    
    // Calculate PR stats
    const prsOpened = pullRequestEvents.filter(e => e.payload.action === 'opened').length;
    const prsMerged = pullRequestEvents.filter(e => 
      e.payload.pull_request?.merged === true
    ).length;
    const prsClosed = pullRequestEvents.filter(e => e.payload.action === 'closed').length;
    
    // Calculate issue stats
    const issuesOpened = issueEvents.filter(e => e.payload.action === 'opened').length;
    const issuesClosed = issueEvents.filter(e => e.payload.action === 'closed').length;
    
    // Reviews given
    const reviewsGiven = pullRequestReviewEvents.length;
    
    // Get repositories contributed to (excluding own repos)
    const contributedRepos = new Set();
    events.forEach(event => {
      if (event.repo && !event.repo.name.startsWith(`${username}/`)) {
        contributedRepos.add(event.repo.name);
      }
    });
    
    const openSourceData = {
      pullRequests: {
        opened: prsOpened,
        merged: prsMerged,
        closed: prsClosed,
        total: pullRequestEvents.length
      },
      issues: {
        opened: issuesOpened,
        closed: issuesClosed,
        total: issueEvents.length
      },
      reviews: {
        given: reviewsGiven
      },
      contributions: {
        reposContributedTo: contributedRepos.size,
        reposList: Array.from(contributedRepos).slice(0, 10) // Top 10
      },
      openSourceScore: calculateOpenSourceScore({
        prsOpened,
        prsMerged,
        issuesOpened,
        issuesClosed,
        reviewsGiven,
        reposContributedTo: contributedRepos.size
      }),
      lastRefreshed: new Date()
    };
    
    // Cache the result
    setCachedData(username, 'openSource', openSourceData);
    
    console.log(`✅ Open source data fetched: ${prsOpened} PRs, ${issuesOpened} issues`);
    return openSourceData;
    
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error(`GitHub user '${username}' not found`);
    }
    if (error.response?.status === 403) {
      throw new Error('GitHub API rate limit exceeded. Please try again later.');
    }
    console.error(`❌ Error fetching open source data for ${username}:`, error.message);
    throw error;
  }
}

/**
 * FETCH ALL CATEGORIES AT ONCE (for initial connection)
 */
async function fetchAllGitHubData(username) {
  try {
    console.log(`🔄 Fetching all GitHub data for: ${username}`);
    
    // Fetch all categories in parallel
    const [profile, repos, consistency, openSource] = await Promise.all([
      fetchGitHubProfile(username),
      fetchGitHubRepositories(username),
      fetchGitHubConsistency(username),
      fetchGitHubOpenSource(username)
    ]);
    
    console.log(`✅ All GitHub data fetched for ${username}`);
    
    return {
      profile,
      repos,
      consistency,
      openSource
    };
    
  } catch (error) {
    console.error(`❌ Error fetching all data for ${username}:`, error.message);
    throw error;
  }
}

/**
 * HELPER: Calculate account age in years and months
 */
function calculateAccountAge(createdAt) {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now - created;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const years = Math.floor(diffDays / 365);
  const months = Math.floor((diffDays % 365) / 30);
  
  if (years > 0) {
    return `${years} year${years > 1 ? 's' : ''} ${months} month${months > 1 ? 's' : ''}`;
  }
  return `${months} month${months > 1 ? 's' : ''}`;
}

/**
 * HELPER: Get top programming languages from repositories
 */
function getTopLanguages(repos) {
  const languageCount = {};
  
  repos.forEach(repo => {
    if (repo.language) {
      languageCount[repo.language] = (languageCount[repo.language] || 0) + 1;
    }
  });
  
  return Object.entries(languageCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([language, count]) => ({ language, count }));
}

/**
 * HELPER: Calculate weekly commits breakdown
 */
function calculateWeeklyCommits(pushEvents) {
  const weeks = [];
  const now = new Date();
  
  for (let i = 0; i < 13; i++) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - (i * 7));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    const commitsInWeek = pushEvents.filter(event => {
      const eventDate = new Date(event.created_at);
      return eventDate >= weekStart && eventDate < weekEnd;
    }).reduce((sum, event) => sum + (event.payload.commits?.length || 0), 0);
    
    weeks.unshift({
      weekNumber: 13 - i,
      commits: commitsInWeek,
      weekStart: weekStart.toISOString().split('T')[0]
    });
  }
  
  return weeks;
}

/**
 * HELPER: Calculate consistency score (0-100)
 */
function calculateConsistencyScore(weeklyCommits, activeWeeks) {
  // Factors:
  // 1. Active weeks percentage (50 points)
  // 2. Commit distribution evenness (30 points)
  // 3. Recent activity bonus (20 points)
  
  const activeWeeksScore = (activeWeeks / 13) * 50;
  
  // Check if commits are evenly distributed (not all in one week)
  const totalCommits = weeklyCommits.reduce((sum, w) => sum + w.commits, 0);
  
  // Handle case where there are no commits
  if (totalCommits === 0) {
    return 0;
  }
  
  const avgCommitsPerWeek = totalCommits / 13;
  const variance = weeklyCommits.reduce((sum, w) => {
    return sum + Math.pow(w.commits - avgCommitsPerWeek, 2);
  }, 0) / 13;
  
  // Safely calculate distribution score - avoid division by zero
  const distributionScore = avgCommitsPerWeek > 0 
    ? Math.max(0, 30 - (variance / avgCommitsPerWeek))
    : 0;
  
  // Recent activity bonus (last 2 weeks)
  const recentCommits = weeklyCommits.slice(-2).reduce((sum, w) => sum + w.commits, 0);
  const recentActivityScore = Math.min(20, (recentCommits / 10) * 20);
  
  const score = Math.round(activeWeeksScore + distributionScore + recentActivityScore);
  
  // Ensure we return a valid number between 0-100
  return Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 0;
}

/**
 * HELPER: Calculate open source contribution score (0-100)
 */
function calculateOpenSourceScore(data) {
  // Factors:
  // 1. PRs merged (40 points)
  // 2. Issues resolved (20 points)
  // 3. Reviews given (20 points)
  // 4. Repos contributed to (20 points)
  
  const prScore = Math.min(40, (data.prsMerged / 10) * 40);
  const issueScore = Math.min(20, (data.issuesClosed / 10) * 20);
  const reviewScore = Math.min(20, (data.reviewsGiven / 10) * 20);
  const repoScore = Math.min(20, (data.reposContributedTo / 5) * 20);
  
  return Math.round(prScore + issueScore + reviewScore + repoScore);
}

module.exports = {
  fetchGitHubProfile,
  fetchGitHubRepositories,
  fetchGitHubConsistency,
  fetchGitHubOpenSource,
  fetchAllGitHubData,
  checkRateLimit,
  clearCache
};
