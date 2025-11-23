const fetch = require('node-fetch');

const LEETCODE_GRAPHQL_ENDPOINT = 'https://leetcode.com/graphql';

const USER_PROFILE_QUERY = `
  query userProfile($username: String!, $year: Int!) {
    matchedUser(username: $username) {
      username
      submitStats: submitStatsGlobal {
        acSubmissionNum {
          difficulty
          count
        }
      }
      tagProblemCounts {
        advanced {
          tagName
          tagSlug
          problemsSolved
        }
        intermediate {
          tagName
          tagSlug
          problemsSolved
        }
        fundamental {
          tagName
          tagSlug
          problemsSolved
        }
      }
      userCalendar(year: $year) {
        streak
        totalActiveDays
        submissionCalendar
        activeYears
      }
    }
  }
`;

function normaliseDifficultyCounts(acSubmissionNum = []) {
  const base = { totalSolved: 0, easy: 0, medium: 0, hard: 0 };

  acSubmissionNum.forEach(({ difficulty, count }) => {
    const safeCount = Number(count) || 0;
    if (!difficulty) return;

    if (difficulty === 'All') {
      base.totalSolved = safeCount;
    } else {
      const key = difficulty.toLowerCase();
      if (key in base) {
        base[key] = safeCount;
      }
    }
  });

  if (!base.totalSolved) {
    base.totalSolved = base.easy + base.medium + base.hard;
  }

  return base;
}

function flattenTagProblemCounts(rawCounts) {
  if (!rawCounts) return [];

  const buckets = Array.isArray(rawCounts)
    ? [{ items: rawCounts }]
    : [
        { items: rawCounts.advanced || [] },
        { items: rawCounts.intermediate || [] },
        { items: rawCounts.fundamental || [] },
      ];

  const aggregated = new Map();

  buckets.forEach(({ items }) => {
    (items || []).forEach((entry) => {
      const label = entry.tagName || entry.tagSlug;
      if (!label) return;
      const count = Number(entry.problemsSolved || entry.count || 0);
      if (!count) return;
      aggregated.set(label, (aggregated.get(label) || 0) + count);
    });
  });

  return Array.from(aggregated.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

function parseCalendar(calendarPayload) {
  if (!calendarPayload) {
    return { calendar: {}, meta: {} };
  }

  let calendarObj = {};
  if (typeof calendarPayload.submissionCalendar === 'string') {
    try {
      calendarObj = JSON.parse(calendarPayload.submissionCalendar) || {};
    } catch (error) {
      calendarObj = {};
    }
  } else if (
    calendarPayload.submissionCalendar &&
    typeof calendarPayload.submissionCalendar === 'object'
  ) {
    calendarObj = calendarPayload.submissionCalendar;
  }

  const cleanedCalendar = Object.entries(calendarObj).reduce((acc, [epoch, rawCount]) => {
    const count = Number(rawCount) || 0;
    if (!Number.isFinite(count) || count <= 0) {
      return acc;
    }
    const seconds = Number(epoch);
    // Ensure we only keep valid epoch keys
    if (Number.isFinite(seconds)) {
      acc[String(Math.floor(seconds))] = count;
    }
    return acc;
  }, {});

  const meta = {
    streak: Number(calendarPayload.streak) || 0,
    totalActiveDays: Number(calendarPayload.totalActiveDays) || 0,
    startDate: calendarPayload.startDate
      ? new Date(Number(calendarPayload.startDate) * 1000).toISOString()
      : undefined,
  };

  return { calendar: cleanedCalendar, meta };
}

function computeRecentActivity(calendarMap) {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const last7Threshold = now - 7 * dayMs;
  const last30Threshold = now - 30 * dayMs;

  let last7Days = 0;
  let last30Days = 0;
  let bestDay = { date: null, count: 0 };

  Object.entries(calendarMap).forEach(([epochSeconds, rawCount]) => {
    const count = Number(rawCount) || 0;
    if (!count) return;

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

async function fetchLeetCodeStats(rawUsername) {
  const username = typeof rawUsername === 'string' ? rawUsername.trim() : '';
  if (!username) {
    throw new Error('LeetCode username is required');
  }

  const year = new Date().getUTCFullYear();

  let response;
  try {
    response = await fetch(LEETCODE_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Referer: 'https://leetcode.com',
        'User-Agent': 'EvolvEd/1.0 (https://github.com)'
      },
      body: JSON.stringify({
        query: USER_PROFILE_QUERY,
        variables: { username, year },
      }),
    });
  } catch (networkError) {
    throw new Error('Unable to reach LeetCode. Please try again later.');
  }

  let payload;
  if (!response.ok) {
    let errorText;
    try {
      const raw = await response.text();
      errorText = raw;
      payload = JSON.parse(raw);
    } catch (_) {
      // swallow
    }
    const message =
      payload?.errors?.[0]?.message ||
      payload?.message ||
      (errorText ? `LeetCode request failed (${response.status}): ${errorText}` : `LeetCode request failed with status ${response.status}`);
    throw new Error(message);
  }

  payload = payload || (await response.json());

  if (payload.errors?.length) {
    const primaryError = payload.errors[0];
    throw new Error(primaryError?.message || 'Failed to fetch LeetCode stats');
  }

  const matchedUser = payload.data?.matchedUser;
  const calendarRaw = matchedUser?.userCalendar;

  if (!matchedUser) {
    throw new Error('LeetCode user not found');
  }

  const difficultyCounts = normaliseDifficultyCounts(
    matchedUser.submitStats?.acSubmissionNum ||
      matchedUser.submitStatsGlobal?.acSubmissionNum ||
      []
  );

  const topDomainsAll = flattenTagProblemCounts(matchedUser.tagProblemCounts);
  const topDomains = topDomainsAll.slice(0, 10);

  const { calendar, meta } = parseCalendar(calendarRaw);
  const activity = computeRecentActivity(calendar);

  const firstCalendarKey = Object.keys(calendar)
    .map((key) => Number(key))
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b)[0];

  return {
    username,
    ...difficultyCounts,
    streak: meta.streak || difficultyCounts.streak || 0,
    calendar,
    topDomains,
    activeDays: meta.totalActiveDays || Object.keys(calendar).length,
    recentActivity: {
      last7Days: activity.last7Days,
      last30Days: activity.last30Days,
    },
    bestDay: activity.bestDay,
    calendarRange: {
      start: meta.startDate || (firstCalendarKey ? new Date(firstCalendarKey * 1000).toISOString() : null),
      end: new Date().toISOString(),
    },
    fetchedAt: new Date().toISOString(),
  };
}

module.exports = {
  fetchLeetCodeStats,
};
// Model schema updated with calendar support


