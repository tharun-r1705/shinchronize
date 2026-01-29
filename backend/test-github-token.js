/**
 * Quick script to test if a GitHub token works
 * Usage: node test-github-token.js YOUR_GITHUB_USERNAME YOUR_TOKEN
 */

const fetch = require('node-fetch');

const username = process.argv[2];
const token = process.argv[3];

if (!username || !token) {
  console.error('Usage: node test-github-token.js YOUR_GITHUB_USERNAME YOUR_TOKEN');
  process.exit(1);
}

const GITHUB_GRAPHQL_API = 'https://api.github.com/graphql';

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

async function testToken() {
  console.log(`Testing GitHub token for user: ${username}`);
  console.log(`Token starts with: ${token.substring(0, 10)}...`);
  console.log(`Token length: ${token.length}`);
  console.log('');

  try {
    const response = await fetch(GITHUB_GRAPHQL_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'EvolvEd/1.0',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        query: CONTRIBUTION_CALENDAR_QUERY,
        variables: { username },
      }),
    });

    console.log(`Response status: ${response.status} ${response.statusText}`);

    const data = await response.json();

    if (data.errors) {
      console.error('\n❌ GitHub API returned errors:');
      console.error(JSON.stringify(data.errors, null, 2));
      
      if (data.errors[0]?.type === 'FORBIDDEN' || data.errors[0]?.message?.includes('API rate limit')) {
        console.error('\n💡 Your token might be expired or invalid.');
      }
      process.exit(1);
    }

    if (data.data?.user?.contributionsCollection?.contributionCalendar) {
      const calendar = data.data.user.contributionsCollection.contributionCalendar;
      console.log('\n✅ Token works! Here\'s your contribution data:');
      console.log(`   Total Contributions: ${calendar.totalContributions}`);
      console.log(`   Data available for ${calendar.weeks.length} weeks`);
      
      // Count active days
      let activeDays = 0;
      calendar.weeks.forEach(week => {
        week.contributionDays.forEach(day => {
          if (day.contributionCount > 0) activeDays++;
        });
      });
      console.log(`   Active Days: ${activeDays}`);
      console.log('\n✨ Your token has the correct permissions!');
    } else {
      console.error('\n❌ No contribution data returned. The token might not have the required scopes.');
      console.error('Required scopes: public_repo, read:user');
    }

  } catch (error) {
    console.error('\n❌ Error testing token:', error.message);
    process.exit(1);
  }
}

testToken();
