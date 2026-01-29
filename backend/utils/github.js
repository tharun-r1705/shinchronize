const fetch = require('node-fetch');

const GITHUB_REST_API = 'https://api.github.com';
const GITHUB_GRAPHQL_API = 'https://api.github.com/graphql';

/**
 * GraphQL query to fetch contribution calendar data
 */
const CONTRIBUTION_CALENDAR_QUERY = `
  query($username: String!) {
    user(login: $username) {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              contributionCount
              date
            }
          }
        }
      }
    }
  }
`;

/**
 * Normalize language statistics from repositories
 * @param {Array} repos - Array of repository objects
 * @returns {Array} Top languages with counts and percentages
 */
function computeLanguageStats(repos) {
  if (!Array.isArray(repos) || repos.length === 0) {
    return [];
  }

  const languageCounts = {};
  let totalCount = 0;

  repos.forEach((repo) => {
    if (repo.language) {
      languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
      totalCount++;
    }
  });

  if (totalCount === 0) {
    return [];
  }

  return Object.entries(languageCounts)
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / totalCount) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

/**
 * Parse contribution calendar data from GitHub GraphQL response
 * @param {Object} calendarData - Raw calendar data from GraphQL
 * @returns {Object} Parsed calendar with metadata
 */
function parseContributionCalendar(calendarData) {
  if (!calendarData || !calendarData.weeks) {
    return { calendar: {}, meta: {} };
  }

  const calendar = {};
  let totalContributions = 0;
  let activeDays = 0;
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let lastDate = null;

  // Flatten weeks into daily contributions
  const allDays = [];
  calendarData.weeks.forEach((week) => {
    if (week.contributionDays) {
      week.contributionDays.forEach((day) => {
        allDays.push(day);
      });
    }
  });

  // Sort by date (oldest first)
  allDays.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Process each day
  allDays.forEach((day) => {
    const date = new Date(day.date);
    const epochSeconds = Math.floor(date.getTime() / 1000);
    const count = Number(day.contributionCount) || 0;

    if (count > 0) {
      calendar[String(epochSeconds)] = count;
      totalContributions += count;
      activeDays++;
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }

    lastDate = date;
  });

  // Calculate current streak (working backwards from today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let checkDate = new Date(today);
  currentStreak = 0;

  for (let i = allDays.length - 1; i >= 0; i--) {
    const day = allDays[i];
    const dayDate = new Date(day.date);
    dayDate.setHours(0, 0, 0, 0);

    if (dayDate.getTime() === checkDate.getTime()) {
      if (day.contributionCount > 0) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    } else if (dayDate.getTime() < checkDate.getTime()) {
      break;
    }
  }

  const meta = {
    totalContributions,
    activeDays,
    streak: currentStreak,
    longestStreak,
  };

  return { calendar, meta };
}

/**
 * Compute recent activity metrics from calendar
 * @param {Object} calendar - Calendar map of epoch -> count
 * @returns {Object} Recent activity stats
 */
function computeRecentActivity(calendar) {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const last7Threshold = now - 7 * dayMs;
  const last30Threshold = now - 30 * dayMs;

  let last7Days = 0;
  let last30Days = 0;
  let bestDay = { date: null, count: 0 };

  Object.entries(calendar).forEach(([epochSeconds, count]) => {
    const timestampMs = Number(epochSeconds) * 1000;
    if (!Number.isFinite(timestampMs)) return;

    if (timestampMs >= last7Threshold) {
      last7Days += count;
    }
    if (timestampMs >= last30Threshold) {
      last30Days += count;
    }
    if (count > bestDay.count) {
      bestDay = {
        date: new Date(timestampMs).toISOString(),
        count,
      };
    }
  });

  return {
    last7Days,
    last30Days,
    bestDay: bestDay.date ? bestDay : null,
  };
}

/**
 * Fetch user profile from GitHub REST API
 * @param {string} username - GitHub username
 * @returns {Promise<Object>} User profile data
 */
async function fetchUserProfile(username) {
  const url = `${GITHUB_REST_API}/users/${username}`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'EvolvEd/1.0',
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('GitHub user not found');
    }
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Fetch user repositories from GitHub REST API
 * @param {string} username - GitHub username
 * @returns {Promise<Array>} Array of repository objects
 */
async function fetchUserRepos(username) {
  const repos = [];
  let page = 1;
  const perPage = 100;

  while (page <= 10) {
    // Limit to 10 pages (1000 repos max)
    const url = `${GITHUB_REST_API}/users/${username}/repos?per_page=${perPage}&page=${page}&sort=updated`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'EvolvEd/1.0',
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch repositories: ${response.status}`);
    }

    const pageRepos = await response.json();
    if (!Array.isArray(pageRepos) || pageRepos.length === 0) {
      break;
    }

    repos.push(...pageRepos);

    if (pageRepos.length < perPage) {
      break;
    }

    page++;
  }

  return repos;
}

/**
 * Fetch contribution calendar using GitHub GraphQL API
 * @param {string} username - GitHub username
 * @param {string} userToken - User's personal GitHub token (optional)
 * @returns {Promise<Object>} Contribution calendar data
 */
async function fetchContributionCalendar(username, userToken = null) {
  // Try user's token first, fall back to server token
  const githubToken = userToken || process.env.GITHUB_TOKEN || process.env.GITHUB_PAT;
  
  console.log(`[GitHub] Fetching calendar for ${username}. Token source: ${userToken ? 'USER' : process.env.GITHUB_TOKEN ? 'SERVER' : 'NONE'}`);
  
  if (!githubToken) {
    console.warn('⚠️  No GitHub token available (user or server). Contribution calendar will be empty.');
    return null;
  }
  
  try {
    const response = await fetch(GITHUB_GRAPHQL_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'EvolvEd/1.0',
        'Authorization': `Bearer ${githubToken}`,
      },
      body: JSON.stringify({
        query: CONTRIBUTION_CALENDAR_QUERY,
        variables: { username },
      }),
    });

    if (!response.ok) {
      console.error(`GitHub GraphQL API error: ${response.status} ${response.statusText}`);
      const errorBody = await response.text();
      console.error(`Response body: ${errorBody.substring(0, 200)}`);
      return null;
    }

    const data = await response.json();

    if (data.errors) {
      console.error('GitHub GraphQL errors:', JSON.stringify(data.errors, null, 2));
      return null;
    }

    console.log(`[GitHub] Calendar data fetched successfully for ${username}`);
    return data.data?.user?.contributionsCollection?.contributionCalendar;
  } catch (error) {
    console.error('Failed to fetch contribution calendar:', error.message);
    return null;
  }
}

/**
 * Main function to fetch comprehensive GitHub statistics
 * @param {string} rawUsername - GitHub username or URL
 * @param {string} userToken - User's personal GitHub token (optional)
 * @returns {Promise<Object>} Complete GitHub statistics
 */
async function fetchGitHubStats(rawUsername, userToken = null) {
  const username = typeof rawUsername === 'string' ? rawUsername.trim() : '';
  if (!username) {
    throw new Error('GitHub username is required');
  }

  // Extract username from URL if needed
  let cleanUsername = username;
  if (username.includes('github.com')) {
    try {
      const url = new URL(username.startsWith('http') ? username : `https://${username}`);
      const pathParts = url.pathname.split('/').filter(Boolean);
      if (pathParts.length > 0) {
        cleanUsername = pathParts[0];
      }
    } catch (e) {
      // If URL parsing fails, try to extract username manually
      cleanUsername = username.replace(/.*github\.com\//i, '').split('/')[0];
    }
  }

  try {
    // Fetch user profile
    const profile = await fetchUserProfile(cleanUsername);

    // Fetch user repositories
    const repos = await fetchUserRepos(cleanUsername);

    // Calculate repository statistics
    const publicRepos = repos.filter((r) => !r.private);
    const totalStars = publicRepos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
    const totalForks = publicRepos.reduce((sum, repo) => sum + (repo.forks_count || 0), 0);

    // Compute language statistics
    const topLanguages = computeLanguageStats(publicRepos);

    // Try to fetch contribution calendar
    const calendarData = await fetchContributionCalendar(cleanUsername, userToken);

    let calendar = {};
    let meta = {
      totalContributions: 0,
      activeDays: 0,
      streak: 0,
      longestStreak: 0,
    };
    let calendarWarning = null;

    if (calendarData) {
      const parsed = parseContributionCalendar(calendarData);
      calendar = parsed.calendar;
      meta = parsed.meta;
    } else {
      calendarWarning = userToken 
        ? 'Unable to fetch contribution calendar. Check your GitHub token permissions.'
        : 'Contribution calendar unavailable. Add your GitHub Personal Access Token in Profile settings for full stats.';
    }

    // Compute recent activity
    const activity = computeRecentActivity(calendar);

    // Determine calendar range
    const calendarKeys = Object.keys(calendar).map(Number).filter(Number.isFinite).sort();
    const firstKey = calendarKeys[0];
    const lastKey = calendarKeys[calendarKeys.length - 1];

    return {
      username: cleanUsername,
      totalRepos: profile.public_repos || publicRepos.length,
      totalStars,
      totalForks,
      followers: profile.followers || 0,
      following: profile.following || 0,
      totalCommits: meta.totalContributions,
      calendar,
      topLanguages,
      activeDays: meta.activeDays,
      streak: meta.streak,
      longestStreak: meta.longestStreak,
      recentActivity: {
        last7Days: activity.last7Days,
        last30Days: activity.last30Days,
      },
      bestDay: activity.bestDay,
      calendarRange: {
        start: firstKey ? new Date(firstKey * 1000).toISOString() : null,
        end: lastKey ? new Date(lastKey * 1000).toISOString() : new Date().toISOString(),
      },
      calendarWarning,
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch GitHub stats');
  }
}

module.exports = {
  fetchGitHubStats,
};
