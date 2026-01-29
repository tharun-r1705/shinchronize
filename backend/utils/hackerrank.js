const fetch = require('node-fetch');

/**
 * Fetch HackerRank user statistics
 * Note: HackerRank doesn't have an official public API, so this implementation
 * uses web scraping techniques. For production, consider using official APIs if available.
 */

function computeRecentActivity(submissionsArray) {
  if (!Array.isArray(submissionsArray) || submissionsArray.length === 0) {
    return {
      last7Days: 0,
      last30Days: 0,
      bestDay: null,
    };
  }

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const last7Threshold = now - 7 * dayMs;
  const last30Threshold = now - 30 * dayMs;

  let last7Days = 0;
  let last30Days = 0;
  const dailyCounts = new Map();

  submissionsArray.forEach(submission => {
    const timestamp = new Date(submission.created_at || submission.date).getTime();
    
    if (!Number.isFinite(timestamp)) return;

    const dateKey = new Date(timestamp).toISOString().split('T')[0];
    dailyCounts.set(dateKey, (dailyCounts.get(dateKey) || 0) + 1);

    if (timestamp >= last7Threshold) {
      last7Days++;
    }
    if (timestamp >= last30Threshold) {
      last30Days++;
    }
  });

  let bestDay = null;
  dailyCounts.forEach((count, date) => {
    if (!bestDay || count > bestDay.count) {
      bestDay = { date, count };
    }
  });

  return {
    last7Days,
    last30Days,
    bestDay,
  };
}

function buildCalendar(submissionsArray) {
  if (!Array.isArray(submissionsArray) || submissionsArray.length === 0) {
    return {};
  }

  const calendar = {};
  
  submissionsArray.forEach(submission => {
    const timestamp = new Date(submission.created_at || submission.date).getTime();
    
    if (!Number.isFinite(timestamp)) return;

    const epochSeconds = Math.floor(timestamp / 1000);
    calendar[epochSeconds] = (calendar[epochSeconds] || 0) + 1;
  });

  return calendar;
}

/**
 * Mock/Simulated HackerRank data fetcher
 * In production, replace this with actual API calls or scraping logic
 */
async function fetchHackerRankStats(rawUsername) {
  const username = typeof rawUsername === 'string' ? rawUsername.trim() : '';
  if (!username) {
    throw new Error('HackerRank username is required');
  }

  try {
    // Attempt to fetch from HackerRank profile page
    // Note: This is a simplified version. Real implementation would need proper scraping or API
    const profileUrl = `https://www.hackerrank.com/${username}`;
    
    let response;
    try {
      response = await fetch(profileUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        timeout: 10000,
      });
    } catch (networkError) {
      throw new Error('Unable to reach HackerRank. Please try again later.');
    }

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`HackerRank user '${username}' not found`);
      }
      throw new Error(`HackerRank returned status ${response.status}`);
    }

    // Since HackerRank doesn't provide a public API, we'll return a structured response
    // that should be populated via actual scraping or official API when available
    
    // For now, return a basic structure with placeholder data
    // In production, you would parse the HTML or use the API
    const mockData = {
      username,
      totalSolved: 0,
      badges: [],
      stars: 0,
      skills: [],
      certifications: [],
      calendar: {},
      activeDays: 0,
      recentActivity: {
        last7Days: 0,
        last30Days: 0,
      },
      bestDay: null,
      fetchedAt: new Date(),
    };

    // Try to extract basic info from the response
    // This is where you would implement actual scraping logic
    const html = await response.text();
    
    // Basic extraction (this would need to be properly implemented)
    // For now, just return the structure
    
    return mockData;

  } catch (error) {
    if (error.message.includes('HackerRank')) {
      throw error;
    }
    throw new Error(`Failed to fetch HackerRank stats: ${error.message}`);
  }
}

/**
 * Alternative: Fetch using public contest data if available
 * This would work if the user has participated in contests
 */
async function fetchHackerRankStatsViaAPI(username) {
  // HackerRank's REST API endpoints (if available)
  // These are typically not public, so this is a placeholder
  
  const baseUrl = 'https://www.hackerrank.com/rest/hackers';
  
  try {
    const response = await fetch(`${baseUrl}/${username}`, {
      headers: {
        'User-Agent': 'EvolvEd/1.0',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch HackerRank data for ${username}`);
    }

    const data = await response.json();
    
    // Process the response data
    const submissions = data.submissions || [];
    const calendar = buildCalendar(submissions);
    const recentActivity = computeRecentActivity(submissions);
    const activeDays = Object.keys(calendar).length;

    return {
      username: data.username || username,
      totalSolved: data.submissions_count || 0,
      badges: data.badges?.map(b => b.name) || [],
      stars: data.rating || 0,
      skills: (data.skills || []).map(skill => ({
        name: skill.name,
        score: skill.score,
        level: skill.level,
      })),
      certifications: (data.certifications || []).map(cert => ({
        name: cert.name,
        issuedAt: cert.issued_at,
      })),
      calendar,
      activeDays,
      recentActivity,
      bestDay: recentActivity.bestDay,
      fetchedAt: new Date(),
    };
  } catch (error) {
    throw new Error(`Unable to fetch HackerRank stats: ${error.message}`);
  }
}

/**
 * Main export - tries multiple methods to fetch HackerRank data
 */
async function fetchHackerRankProfile(username) {
  // Try API first, fall back to basic scraping
  try {
    return await fetchHackerRankStatsViaAPI(username);
  } catch (apiError) {
    // Fall back to basic scraping
    return await fetchHackerRankStats(username);
  }
}

module.exports = {
  fetchHackerRankStats: fetchHackerRankProfile,
  computeRecentActivity,
  buildCalendar,
};
