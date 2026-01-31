const axios = require('axios');

/**
 * Parse GitHub URL to extract owner and repo name
 * Supports formats:
 * - https://github.com/owner/repo
 * - https://github.com/owner/repo.git
 * - https://github.com/owner/repo/tree/branch
 */
function parseGitHubUrl(url) {
  try {
    const urlObj = new URL(url);
    
    // Ensure it's a GitHub URL
    if (!urlObj.hostname.includes('github.com')) {
      throw new Error('Not a GitHub URL');
    }

    // Extract path parts
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    
    if (pathParts.length < 2) {
      throw new Error('Invalid GitHub URL format');
    }

    const owner = pathParts[0];
    let repo = pathParts[1];

    // Remove .git extension if present
    repo = repo.replace(/\.git$/, '');

    return { owner, repo };
  } catch (error) {
    throw new Error(`Failed to parse GitHub URL: ${error.message}`);
  }
}

/**
 * Fetch repository metadata from GitHub API
 * Returns: name, description, languages, file count, last commit date
 */
async function getRepoMetadata(githubUrl) {
  try {
    const { owner, repo } = parseGitHubUrl(githubUrl);
    
    // GitHub API endpoint for repository info
    const repoUrl = `https://api.github.com/repos/${owner}/${repo}`;
    
    // Make request to GitHub API (no auth needed for public repos)
    const response = await axios.get(repoUrl, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'EvolvEd-Platform'
      },
      timeout: 5000
    });

    const data = response.data;

    // Fetch languages separately
    const languagesResponse = await axios.get(data.languages_url, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'EvolvEd-Platform'
      },
      timeout: 5000
    });

    const languages = Object.keys(languagesResponse.data);

    return {
      name: data.name,
      fullName: data.full_name,
      description: data.description || 'No description provided',
      languages: languages,
      size: data.size, // in KB
      stars: data.stargazers_count,
      forks: data.forks_count,
      lastCommit: data.pushed_at,
      defaultBranch: data.default_branch,
      isPrivate: data.private,
      url: data.html_url
    };
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error('Repository not found. Make sure the repository is public.');
    } else if (error.response?.status === 403) {
      throw new Error('GitHub API rate limit exceeded. Please try again later.');
    }
    throw new Error(`Failed to fetch repository metadata: ${error.message}`);
  }
}

/**
 * Determine main entry file based on languages
 */
function getMainFileName(languages) {
  const languageToFile = {
    'JavaScript': ['index.js', 'app.js', 'server.js', 'main.js'],
    'TypeScript': ['index.ts', 'app.ts', 'server.ts', 'main.ts'],
    'Python': ['main.py', 'app.py', '__init__.py', 'run.py'],
    'Java': ['Main.java', 'App.java', 'Application.java'],
    'C++': ['main.cpp', 'app.cpp'],
    'C': ['main.c', 'app.c'],
    'Go': ['main.go', 'app.go'],
    'Ruby': ['main.rb', 'app.rb'],
    'PHP': ['index.php', 'app.php'],
    'Rust': ['main.rs', 'lib.rs'],
    'Swift': ['main.swift', 'app.swift'],
    'Kotlin': ['Main.kt', 'App.kt']
  };

  for (const lang of languages) {
    if (languageToFile[lang]) {
      return languageToFile[lang];
    }
  }

  return ['index.js', 'main.py', 'app.js']; // fallback
}

/**
 * Fetch key files from repository (README and main entry file)
 * Limited to ~2000 tokens to avoid excessive data
 */
async function fetchKeyFiles(githubUrl, languages) {
  try {
    const { owner, repo } = parseGitHubUrl(githubUrl);
    
    const files = [];
    const maxContentLength = 50000; // Approx 2000 tokens (~25 chars per token)

    // Try to fetch README
    const readmeFiles = ['README.md', 'README.txt', 'README', 'readme.md'];
    let readmeContent = null;

    for (const readmeFile of readmeFiles) {
      try {
        const readmeUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${readmeFile}`;
        const response = await axios.get(readmeUrl, {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'EvolvEd-Platform'
          },
          timeout: 5000
        });

        if (response.data.content) {
          // Content is base64 encoded
          readmeContent = Buffer.from(response.data.content, 'base64').toString('utf-8');
          
          // Truncate if too long
          if (readmeContent.length > maxContentLength) {
            readmeContent = readmeContent.substring(0, maxContentLength) + '\n\n[Content truncated...]';
          }

          files.push({
            name: readmeFile,
            path: readmeFile,
            content: readmeContent
          });
          break;
        }
      } catch (err) {
        // File doesn't exist, try next
        continue;
      }
    }

    // Try to fetch main entry file
    const possibleMainFiles = getMainFileName(languages);
    
    for (const mainFile of possibleMainFiles) {
      try {
        const mainFileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${mainFile}`;
        const response = await axios.get(mainFileUrl, {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'EvolvEd-Platform'
          },
          timeout: 5000
        });

        if (response.data.content) {
          // Content is base64 encoded
          let mainContent = Buffer.from(response.data.content, 'base64').toString('utf-8');
          
          // Truncate if too long
          if (mainContent.length > maxContentLength) {
            mainContent = mainContent.substring(0, maxContentLength) + '\n\n[Content truncated...]';
          }

          files.push({
            name: mainFile,
            path: mainFile,
            content: mainContent
          });
          break;
        }
      } catch (err) {
        // File doesn't exist, try next
        continue;
      }
    }

    return files;
  } catch (error) {
    throw new Error(`Failed to fetch key files: ${error.message}`);
  }
}

/**
 * Fetch complete repository analysis (metadata + key files)
 */
async function fetchRepositoryData(githubUrl) {
  try {
    const metadata = await getRepoMetadata(githubUrl);
    const files = await fetchKeyFiles(githubUrl, metadata.languages);

    return {
      metadata,
      files,
      fetchedAt: new Date()
    };
  } catch (error) {
    throw error;
  }
}

module.exports = {
  parseGitHubUrl,
  getRepoMetadata,
  fetchKeyFiles,
  fetchRepositoryData
};
