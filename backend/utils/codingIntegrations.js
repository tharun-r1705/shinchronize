const fetch = require('node-fetch');

async function fetchLeetCodeActivity(username) {
  if (!username) return { activities: [], summary: { problemsSolved: 0, minutes: 0 } };

  try {
    const query = `
      query getUserProfile($username: String!) {
        matchedUser(username: $username) {
          username
          submitStats {
            acSubmissionNum {
              difficulty
              count
            }
          }
          userCalendar {
            activeYears
            streak
            totalActiveDays
            submissionCalendar
          }
          tagProblemCounts {
            advanced { tagName tagSlug problemsSolved }
            intermediate { tagName tagSlug problemsSolved }
            fundamental { tagName tagSlug problemsSolved }
          }
        }
        recentSubmissionList(username: $username, limit: 10) {
          title
          timestamp
          statusDisplay
          lang
        }
      }
    `;

    const response = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Referer': 'https://leetcode.com'
      },
      body: JSON.stringify({
        query,
        variables: { username }
      })
    });

    const data = await response.json();

    if (data.errors) {
      throw new Error(data.errors[0].message);
    }

    const user = data.data.matchedUser;
    const submissions = data.data.recentSubmissionList || [];

    if (!user) {
      throw new Error('User not found on LeetCode');
    }

    // Process stats
    const statsBreakdown = user.submitStats.acSubmissionNum;
    const totalSolved = statsBreakdown.find(s => s.difficulty === 'All')?.count || 0;
    const easy = statsBreakdown.find(s => s.difficulty === 'Easy')?.count || 0;
    const medium = statsBreakdown.find(s => s.difficulty === 'Medium')?.count || 0;
    const hard = statsBreakdown.find(s => s.difficulty === 'Hard')?.count || 0;

    // Process calendar
    const calendar = JSON.parse(user.userCalendar.submissionCalendar || '{}');

    // Process top domains/tags
    const topDomains = [
      ...(user.tagProblemCounts.advanced || []),
      ...(user.tagProblemCounts.intermediate || []),
      ...(user.tagProblemCounts.fundamental || [])
    ].sort((a, b) => b.problemsSolved - a.problemsSolved)
      .slice(0, 10)
      .map(t => ({ tag: t.tagName, count: t.problemsSolved }));

    // Convert recent submissions to activities
    const activities = submissions
      .filter(s => s.statusDisplay === 'Accepted')
      .map(s => ({
        activity: `Solved: ${s.title}`,
        problemsSolved: 1,
        minutes: 30, // Estimated
        date: new Date(s.timestamp * 1000).toISOString()
      }));

    return {
      success: true,
      stats: {
        totalSolved,
        easy,
        medium,
        hard,
        streak: user.userCalendar.streak,
        activeDays: user.userCalendar.totalActiveDays,
        calendar,
        topDomains
      },
      activities,
      summary: {
        problemsSolved: totalSolved,
        minutes: totalSolved * 30 // Rough estimate for total
      }
    };
  } catch (e) {
    console.error('LeetCode fetch error:', e);
    return { activities: [], summary: { problemsSolved: 0, minutes: 0 }, error: e?.message };
  }
}

async function fetchHackerRankActivity(username) {
  if (!username) return { activities: [], summary: { problemsSolved: 0, minutes: 0 } };
  try {
    // HackerRank doesn't have a clean public GraphQL/REST API for stats without auth
    // We'll return empty for now, but in a real scenario we'd use a scraper or official partner API
    return { activities: [], summary: { problemsSolved: 0, minutes: 0 } };
  } catch (e) {
    return { activities: [], summary: { problemsSolved: 0, minutes: 0 }, error: e?.message };
  }
}

module.exports = { fetchLeetCodeActivity, fetchHackerRankActivity };


