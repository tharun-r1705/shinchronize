const fetch = require('node-fetch');

// NOTE: Public scraping/APIs vary; this is a stub you can replace with
// official APIs or proxy services. We normalize to a common activity format.

async function fetchLeetCodeActivity(username) {
  if (!username) return { activities: [], summary: { problemsSolved: 0, minutes: 0 } };
  try {
    // Minimal approach: use LeetCode graphql endpoint if accessible
    // For now, return an empty normalized structure.
    return { activities: [], summary: { problemsSolved: 0, minutes: 0 } };
  } catch (e) {
    return { activities: [], summary: { problemsSolved: 0, minutes: 0 }, error: e?.message };
  }
}

async function fetchHackerRankActivity(username) {
  if (!username) return { activities: [], summary: { problemsSolved: 0, minutes: 0 } };
  try {
    return { activities: [], summary: { problemsSolved: 0, minutes: 0 } };
  } catch (e) {
    return { activities: [], summary: { problemsSolved: 0, minutes: 0 }, error: e?.message };
  }
}

module.exports = { fetchLeetCodeActivity, fetchHackerRankActivity };


