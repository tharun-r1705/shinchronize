const Student = require('../models/Student');
const { decryptToken } = require('../utils/githubDataExtractor');

/**
 * GitHub Sync Job - Fetches and syncs GitHub data for a student
 * This runs in background after OAuth or can be triggered manually
 */

/**
 * Fetch user's repositories from GitHub
 * @param {string} accessToken - GitHub OAuth access token
 * @param {string} username - GitHub username
 * @returns {Promise<Array>} Array of repository objects
 */
async function fetchGitHubRepositories(accessToken, username) {
  try {
    const repos = [];
    let page = 1;
    const perPage = 100;

    while (page <= 3) { // Fetch max 300 repos (3 pages)
      const response = await fetch(
        `https://api.github.com/users/${username}/repos?sort=updated&per_page=${perPage}&page=${page}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );

      if (!response.ok) {
        console.error(`Failed to fetch repos page ${page}:`, response.status);
        break;
      }

      const pageRepos = await response.json();
      
      if (pageRepos.length === 0) {
        break; // No more repos
      }

      repos.push(...pageRepos);
      
      if (pageRepos.length < perPage) {
        break; // Last page
      }

      page++;
    }

    console.log(`✅ Fetched ${repos.length} repositories for ${username}`);
    return repos;
  } catch (error) {
    console.error('Error fetching GitHub repositories:', error);
    return [];
  }
}

/**
 * Fetch languages for a specific repository
 * @param {string} accessToken - GitHub OAuth access token
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Promise<Object>} Languages object with byte counts
 */
async function fetchRepositoryLanguages(accessToken, owner, repo) {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/languages`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );

    if (!response.ok) {
      return {};
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching languages for ${owner}/${repo}:`, error);
    return {};
  }
}

/**
 * Analyze languages across all repositories
 * @param {Array} repos - Array of repository objects with languages
 * @returns {Array} Top languages with counts and percentages
 */
function analyzeLanguages(repos) {
  const languageTotals = {};
  let totalBytes = 0;

  // Aggregate language bytes
  repos.forEach(repo => {
    if (repo.languages) {
      Object.entries(repo.languages).forEach(([lang, bytes]) => {
        languageTotals[lang] = (languageTotals[lang] || 0) + bytes;
        totalBytes += bytes;
      });
    }
  });

  // Convert to array with percentages
  const languages = Object.entries(languageTotals)
    .map(([name, count]) => ({
      name,
      count,
      percentage: totalBytes > 0 ? Math.round((count / totalBytes) * 100 * 10) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10 languages

  return languages;
}

/**
 * Get top repositories by stars
 * @param {Array} repos - Array of repository objects
 * @returns {Array} Top repositories
 */
function getTopRepositories(repos) {
  return repos
    .filter(repo => !repo.fork) // Exclude forks
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 10)
    .map(repo => ({
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      language: repo.language,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      url: repo.html_url,
      lastUpdated: repo.updated_at,
      topics: repo.topics || [],
    }));
}

/**
 * Calculate GitHub activity score (0-100)
 * @param {Object} userData - GitHub user data
 * @param {Array} repos - Repository array
 * @returns {number} Activity score
 */
function calculateActivityScore(userData, repos) {
  let score = 0;

  // Repository count (max 20 points)
  const repoScore = Math.min((repos.length / 20) * 20, 20);
  score += repoScore;

  // Stars received (max 20 points)
  const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
  const starsScore = Math.min((totalStars / 50) * 20, 20);
  score += starsScore;

  // Recent activity - repos updated in last 30 days (max 20 points)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentRepos = repos.filter(repo => new Date(repo.updated_at) > thirtyDaysAgo);
  const activityScore = Math.min((recentRepos.length / 5) * 20, 20);
  score += activityScore;

  // Followers (max 20 points)
  const followersScore = Math.min((userData.followers / 50) * 20, 20);
  score += followersScore;

  // Public repos quality - non-fork ratio (max 20 points)
  const nonForkRepos = repos.filter(repo => !repo.fork);
  const qualityScore = repos.length > 0 
    ? (nonForkRepos.length / repos.length) * 20 
    : 0;
  score += qualityScore;

  return Math.round(score);
}

/**
 * Extract skills from repositories
 * @param {Array} repos - Repository array
 * @returns {Array} Validated skills array
 */
function extractSkillsFromRepos(repos) {
  const skillCounts = {};
  const skillEvidence = {};

  repos.forEach(repo => {
    // Add primary language as skill
    if (repo.language) {
      skillCounts[repo.language] = (skillCounts[repo.language] || 0) + 1;
      skillEvidence[repo.language] = skillEvidence[repo.language] || [];
      skillEvidence[repo.language].push(repo.html_url);
    }

    // Add topics as skills
    if (repo.topics && repo.topics.length > 0) {
      repo.topics.forEach(topic => {
        const skillName = topic.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        skillCounts[skillName] = (skillCounts[skillName] || 0) + 1;
        skillEvidence[skillName] = skillEvidence[skillName] || [];
        skillEvidence[skillName].push(repo.html_url);
      });
    }

    // Add languages from detailed analysis
    if (repo.languages) {
      Object.keys(repo.languages).forEach(lang => {
        skillCounts[lang] = (skillCounts[lang] || 0) + 1;
        skillEvidence[lang] = skillEvidence[lang] || [];
        if (!skillEvidence[lang].includes(repo.html_url)) {
          skillEvidence[lang].push(repo.html_url);
        }
      });
    }
  });

  // Convert to validated skills format
  return Object.entries(skillCounts)
    .map(([name, count]) => ({
      name,
      source: 'github',
      confidence: Math.min(0.7 + (count / repos.length) * 0.25, 0.95),
      evidence: skillEvidence[name].slice(0, 5), // Max 5 evidence URLs
    }))
    .sort((a, b) => b.confidence - a.confidence);
}

/**
 * Convert GitHub repositories to project entries
 * @param {Array} repos - Repository array
 * @returns {Array} Project objects for Student.projects
 */
function convertReposToProjects(repos) {
  return repos
    .filter(repo => !repo.private) // Only public repos
    .map(repo => ({
      title: repo.name,
      githubLink: repo.html_url,
      description: repo.description || `GitHub repository: ${repo.name}`,
      tags: [
        ...(repo.language ? [repo.language] : []),
        ...(repo.topics || []),
      ].slice(0, 10), // Max 10 tags
      status: 'pending', // Admin needs to verify
      verified: false,
      submittedAt: new Date(repo.created_at),
      // Store GitHub-specific metadata
      _githubData: {
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        watchers: repo.watchers_count,
        openIssues: repo.open_issues_count,
        isFork: repo.fork,
        lastUpdated: repo.updated_at,
        createdAt: repo.created_at,
        homepage: repo.homepage,
        size: repo.size,
      },
    }))
    .sort((a, b) => 
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
}

/**
 * Main sync function - Syncs all GitHub data for a student
 * @param {string} studentId - MongoDB Student ID
 * @param {boolean} syncProjects - Whether to sync projects (default: true)
 * @returns {Promise<Object>} Sync results
 */
async function syncGitHubData(studentId, syncProjects = true) {
  try {
    console.log(`🔄 Starting GitHub sync for student: ${studentId}`);

    const student = await Student.findById(studentId);
    if (!student) {
      throw new Error('Student not found');
    }

    if (!student.githubAuth || !student.githubAuth.encryptedAccessToken) {
      throw new Error('No GitHub OAuth connection found');
    }

    // Decrypt access token
    const accessToken = decryptToken(student.githubAuth.encryptedAccessToken);
    const username = student.githubAuth.username;

    // Fetch fresh user data
    console.log(`🔄 Fetching GitHub user data for ${username}...`);
    const userResponse = await fetch(`https://api.github.com/users/${username}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!userResponse.ok) {
      throw new Error(`Failed to fetch user data: ${userResponse.status}`);
    }

    const userData = await userResponse.json();
    console.log(`✅ User data fetched: ${userData.public_repos} repos`);

    // Fetch repositories
    console.log(`🔄 Fetching repositories for ${username}...`);
    const repos = await fetchGitHubRepositories(accessToken, username);

    // Fetch languages for each repository (limit to top 20 to avoid rate limits)
    console.log(`🔄 Fetching languages for repositories...`);
    const reposWithLanguages = await Promise.all(
      repos.slice(0, 20).map(async (repo) => {
        const languages = await fetchRepositoryLanguages(accessToken, repo.owner.login, repo.name);
        return { ...repo, languages };
      })
    );

    // Add empty languages for remaining repos
    const allRepos = [
      ...reposWithLanguages,
      ...repos.slice(20).map(repo => ({ ...repo, languages: {} })),
    ];

    // Analyze data
    const topLanguages = analyzeLanguages(allRepos);
    const topRepos = getTopRepositories(allRepos);
    const activityScore = calculateActivityScore(userData, allRepos);
    const skills = extractSkillsFromRepos(allRepos);

    // Update student record
    student.githubStats = {
      username: userData.login,
      avatarUrl: userData.avatar_url,
      bio: userData.bio,
      totalRepos: userData.public_repos,
      followers: userData.followers,
      following: userData.following,
      publicGists: userData.public_gists,
      createdAt: userData.created_at,
      topLanguages,
      topRepos,
      activityScore,
      lastSyncedAt: new Date(),
    };

    // Update profile fields if not manually set
    if (!student.avatarUrl || student.avatarUrl === student.githubAuth.avatarUrl) {
      student.avatarUrl = userData.avatar_url;
    }
    if (!student.summary && userData.bio) {
      student.summary = userData.bio;
    }
    if (!student.location && userData.location) {
      student.location = userData.location;
    }
    if (!student.portfolioUrl && userData.blog) {
      student.portfolioUrl = userData.blog;
    }

    // Update GitHub auth last verified
    student.githubAuth.lastVerifiedAt = new Date();
    student.githubAuth.avatarUrl = userData.avatar_url; // Keep in sync

    // Merge skills (keep existing + add new from GitHub)
    const existingSkillNames = new Set(
      student.validatedSkills?.map(s => s.name.toLowerCase()) || []
    );
    const newSkills = skills.filter(
      skill => !existingSkillNames.has(skill.name.toLowerCase())
    );
    student.validatedSkills = [
      ...(student.validatedSkills || []),
      ...newSkills,
    ];

    // Update simple skills array
    const allSkillNames = new Set([
      ...(student.skills || []),
      ...topLanguages.map(l => l.name),
      ...skills.slice(0, 20).map(s => s.name), // Top 20 skills
    ]);
    student.skills = Array.from(allSkillNames);

    // Sync projects if requested
    if (syncProjects) {
      console.log(`🔄 Converting repositories to projects...`);
      const githubProjects = convertReposToProjects(allRepos);
      
      // Merge with existing projects (avoid duplicates by githubLink)
      const existingGithubLinks = new Set(
        student.projects?.map(p => p.githubLink?.toLowerCase()) || []
      );
      
      const newProjects = githubProjects.filter(
        proj => proj.githubLink && !existingGithubLinks.has(proj.githubLink.toLowerCase())
      );

      // Add new projects while preserving existing ones
      student.projects = [
        ...(student.projects || []),
        ...newProjects,
      ];

      console.log(`✅ Added ${newProjects.length} new projects from GitHub`);
    }

    await student.save();

    console.log(`✅ GitHub sync completed for ${username}`);
    console.log(`   - Repositories: ${allRepos.length}`);
    console.log(`   - Top Languages: ${topLanguages.length}`);
    console.log(`   - Top Repos: ${topRepos.length}`);
    console.log(`   - Skills: ${skills.length}`);
    console.log(`   - Activity Score: ${activityScore}/100`);
    if (syncProjects) {
      console.log(`   - Projects: ${student.projects.length} total`);
    }

    return {
      success: true,
      username,
      stats: {
        repositories: allRepos.length,
        languages: topLanguages.length,
        topRepos: topRepos.length,
        skills: skills.length,
        activityScore,
        projects: student.projects?.length || 0,
      },
    };
  } catch (error) {
    console.error('❌ GitHub sync failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = {
  syncGitHubData,
  fetchGitHubRepositories,
  analyzeLanguages,
  calculateActivityScore,
  extractSkillsFromRepos,
  convertReposToProjects,
};
