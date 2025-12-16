/**
 * GitHub-Based Readiness Score Calculator
 * 
 * Calculates a dynamic "Placement Readiness Score" based on GitHub activity.
 * Score automatically updates when GitHub data changes.
 * 
 * Total Score: 100 points
 * Breakdown:
 * - Repository Quality: 30 points
 * - Coding Consistency: 25 points
 * - Open Source Contributions: 25 points
 * - Profile Strength: 20 points
 */

/**
 * Main function to calculate readiness score from GitHub data
 * @param {Object} student - Student document with GitHub data
 * @returns {Object} - { score, breakdown, recommendations }
 */
function calculateGitHubReadinessScore(student) {
  const breakdown = {
    repositoryQuality: 0,
    codingConsistency: 0,
    openSourceContributions: 0,
    profileStrength: 0,
  };
  
  const recommendations = [];
  
  // 1. Repository Quality Score (30 points)
  breakdown.repositoryQuality = calculateRepositoryQualityScore(
    student.githubRepos,
    recommendations
  );
  
  // 2. Coding Consistency Score (25 points)
  breakdown.codingConsistency = calculateCodingConsistencyScore(
    student.githubConsistency,
    recommendations
  );
  
  // 3. Open Source Contributions Score (25 points)
  breakdown.openSourceContributions = calculateOpenSourceScore(
    student.githubOpenSource,
    recommendations
  );
  
  // 4. Profile Strength Score (20 points)
  breakdown.profileStrength = calculateProfileStrengthScore(
    student.githubProfile,
    student.githubRepos,
    recommendations
  );
  
  // Calculate total score
  const totalScore = Math.round(
    breakdown.repositoryQuality +
    breakdown.codingConsistency +
    breakdown.openSourceContributions +
    breakdown.profileStrength
  );
  
  // Generate overall assessment
  const assessment = generateAssessment(totalScore);
  
  return {
    score: totalScore,
    breakdown,
    recommendations,
    assessment,
    calculatedAt: new Date(),
  };
}

/**
 * 1. Repository Quality Score (30 points)
 * 
 * Factors:
 * - Number of original (non-forked) repositories
 * - Repository activity (stars, forks)
 * - Code quality indicators (documentation, issues management)
 * - Language diversity
 */
function calculateRepositoryQualityScore(githubRepos, recommendations) {
  if (!githubRepos || !githubRepos.repos) {
    recommendations.push({
      category: 'Repository Quality',
      message: 'Connect your GitHub account to showcase your projects',
      priority: 'high',
    });
    return 0;
  }
  
  let score = 0;
  const repos = githubRepos.repos;
  const originalRepos = githubRepos.originalRepos || 0;
  const totalStars = githubRepos.totalStars || 0;
  const totalForks = githubRepos.totalForks || 0;
  
  // Sub-factor 1: Original repository count (10 points)
  // 0-1 repos = 0-2 points, 2-4 repos = 2-5 points, 5-9 repos = 5-8 points, 10+ = 8-10 points
  if (originalRepos === 0) {
    score += 0;
    recommendations.push({
      category: 'Repository Quality',
      message: 'Create at least 3-5 original repositories to demonstrate your coding skills',
      priority: 'high',
    });
  } else if (originalRepos <= 2) {
    score += Math.min(originalRepos * 1, 2);
    recommendations.push({
      category: 'Repository Quality',
      message: 'Build more original projects. Aim for at least 5 diverse repositories',
      priority: 'medium',
    });
  } else if (originalRepos <= 5) {
    score += 2 + Math.min((originalRepos - 2) * 1, 3);
  } else if (originalRepos <= 10) {
    score += 5 + Math.min((originalRepos - 5) * 0.6, 3);
  } else {
    score += 10;
  }
  
  // Sub-factor 2: Stars received (8 points)
  // 0 stars = 0, 1-10 stars = 2, 11-50 stars = 4, 51-100 stars = 6, 100+ = 8
  if (totalStars === 0) {
    score += 0;
    recommendations.push({
      category: 'Repository Quality',
      message: 'Add proper README files and documentation to make your projects more attractive',
      priority: 'medium',
    });
  } else if (totalStars <= 10) {
    score += Math.min(totalStars * 0.2, 2);
  } else if (totalStars <= 50) {
    score += 2 + Math.min((totalStars - 10) * 0.05, 2);
  } else if (totalStars <= 100) {
    score += 4 + Math.min((totalStars - 50) * 0.04, 2);
  } else {
    score += 8;
  }
  
  // Sub-factor 3: Forks received (4 points)
  // 0 forks = 0, 1-5 forks = 1, 6-15 forks = 2, 16-30 forks = 3, 30+ = 4
  if (totalForks === 0) {
    score += 0;
  } else if (totalForks <= 5) {
    score += Math.min(totalForks * 0.2, 1);
  } else if (totalForks <= 15) {
    score += 1 + Math.min((totalForks - 5) * 0.1, 1);
  } else if (totalForks <= 30) {
    score += 2 + Math.min((totalForks - 15) * 0.067, 1);
  } else {
    score += 4;
  }
  
  // Sub-factor 4: Language diversity (4 points)
  const languageCount = githubRepos.topLanguages?.length || 0;
  if (languageCount === 0) {
    score += 0;
  } else if (languageCount === 1) {
    score += 1;
    recommendations.push({
      category: 'Repository Quality',
      message: 'Learn and use multiple programming languages to show versatility',
      priority: 'low',
    });
  } else if (languageCount <= 3) {
    score += 2;
  } else if (languageCount <= 5) {
    score += 3;
  } else {
    score += 4;
  }
  
  // Sub-factor 5: Recent activity (4 points)
  const recentRepos = repos.filter(repo => {
    const daysSinceUpdate = Math.floor((Date.now() - new Date(repo.updatedAt)) / (1000 * 60 * 60 * 24));
    return daysSinceUpdate <= 90; // Updated in last 90 days
  }).length;
  
  if (recentRepos === 0) {
    score += 0;
    recommendations.push({
      category: 'Repository Quality',
      message: 'Update your repositories regularly. Add new features or fix issues.',
      priority: 'medium',
    });
  } else if (recentRepos <= 2) {
    score += 1;
  } else if (recentRepos <= 5) {
    score += 2;
  } else if (recentRepos <= 8) {
    score += 3;
  } else {
    score += 4;
  }
  
  return Math.min(score, 30);
}

/**
 * 2. Coding Consistency Score (25 points)
 * 
 * Measures regular coding habits over the last 90 days
 */
function calculateCodingConsistencyScore(githubConsistency, recommendations) {
  if (!githubConsistency) {
    recommendations.push({
      category: 'Coding Consistency',
      message: 'Start coding regularly on GitHub to build a consistent habit',
      priority: 'high',
    });
    return 0;
  }
  
  let score = 0;
  const activeWeeks = githubConsistency.activeWeeks || 0;
  const totalCommits = githubConsistency.totalCommits || 0;
  const daysSinceLastCommit = githubConsistency.daysSinceLastCommit;
  const consistencyPercentage = parseFloat(githubConsistency.consistencyPercentage) || 0;
  
  // Sub-factor 1: Active weeks percentage (10 points)
  score += (consistencyPercentage / 100) * 10;
  
  if (consistencyPercentage < 30) {
    recommendations.push({
      category: 'Coding Consistency',
      message: 'Code at least 3-4 days per week to build consistency',
      priority: 'high',
    });
  } else if (consistencyPercentage < 60) {
    recommendations.push({
      category: 'Coding Consistency',
      message: 'Great start! Try to code more frequently to improve consistency',
      priority: 'medium',
    });
  }
  
  // Sub-factor 2: Total commits (8 points)
  if (totalCommits === 0) {
    score += 0;
  } else if (totalCommits <= 10) {
    score += Math.min(totalCommits * 0.4, 4);
  } else if (totalCommits <= 50) {
    score += 4 + Math.min((totalCommits - 10) * 0.05, 2);
  } else if (totalCommits <= 100) {
    score += 6 + Math.min((totalCommits - 50) * 0.02, 1);
  } else {
    score += 8;
  }
  
  // Sub-factor 3: Recency of last commit (7 points)
  if (daysSinceLastCommit === null || daysSinceLastCommit === undefined) {
    score += 0;
  } else if (daysSinceLastCommit <= 3) {
    score += 7;
  } else if (daysSinceLastCommit <= 7) {
    score += 5;
  } else if (daysSinceLastCommit <= 14) {
    score += 3;
    recommendations.push({
      category: 'Coding Consistency',
      message: 'Your last commit was over a week ago. Resume coding to maintain momentum',
      priority: 'medium',
    });
  } else if (daysSinceLastCommit <= 30) {
    score += 1;
    recommendations.push({
      category: 'Coding Consistency',
      message: 'Long gap since last commit. Restart your coding habit today!',
      priority: 'high',
    });
  } else {
    score += 0;
    recommendations.push({
      category: 'Coding Consistency',
      message: 'Critical: No recent coding activity. Start committing code regularly',
      priority: 'high',
    });
  }
  
  return Math.min(score, 25);
}

/**
 * 3. Open Source Contributions Score (25 points)
 * 
 * Measures collaboration and community involvement
 */
function calculateOpenSourceScore(githubOpenSource, recommendations) {
  if (!githubOpenSource) {
    recommendations.push({
      category: 'Open Source',
      message: 'Start contributing to open source projects to gain real-world experience',
      priority: 'medium',
    });
    return 0;
  }
  
  let score = 0;
  const prsOpened = githubOpenSource.pullRequests?.opened || 0;
  const prsMerged = githubOpenSource.pullRequests?.merged || 0;
  const issuesOpened = githubOpenSource.issues?.opened || 0;
  const issuesClosed = githubOpenSource.issues?.closed || 0;
  const reviewsGiven = githubOpenSource.reviews?.given || 0;
  const reposContributed = githubOpenSource.contributions?.reposContributedTo || 0;
  
  // Sub-factor 1: Pull requests (10 points)
  if (prsOpened === 0) {
    score += 0;
    recommendations.push({
      category: 'Open Source',
      message: 'Open your first pull request! Find good first issues on GitHub',
      priority: 'medium',
    });
  } else if (prsOpened <= 3) {
    score += Math.min(prsOpened * 1.5, 4.5);
    // Bonus for merged PRs
    score += Math.min(prsMerged * 0.5, 1.5);
  } else if (prsOpened <= 10) {
    score += 4.5 + Math.min((prsOpened - 3) * 0.5, 3.5);
    score += Math.min(prsMerged * 0.2, 2);
  } else {
    score += 10;
  }
  
  // Sub-factor 2: Issues (6 points)
  const totalIssues = issuesOpened + issuesClosed;
  if (totalIssues === 0) {
    score += 0;
  } else if (totalIssues <= 5) {
    score += Math.min(totalIssues * 0.6, 3);
  } else if (totalIssues <= 15) {
    score += 3 + Math.min((totalIssues - 5) * 0.2, 2);
  } else {
    score += 6;
  }
  
  // Sub-factor 3: Code reviews (5 points)
  if (reviewsGiven === 0) {
    score += 0;
  } else if (reviewsGiven <= 3) {
    score += Math.min(reviewsGiven * 1, 3);
  } else if (reviewsGiven <= 10) {
    score += 3 + Math.min((reviewsGiven - 3) * 0.2, 1);
  } else {
    score += 5;
  }
  
  // Sub-factor 4: Repositories contributed to (4 points)
  if (reposContributed === 0) {
    score += 0;
  } else if (reposContributed <= 2) {
    score += Math.min(reposContributed * 1, 2);
  } else if (reposContributed <= 5) {
    score += 2 + Math.min((reposContributed - 2) * 0.5, 1.5);
  } else {
    score += 4;
  }
  
  if (prsOpened === 0 && issuesOpened === 0) {
    recommendations.push({
      category: 'Open Source',
      message: 'Participate in Hacktoberfest or similar events to start contributing',
      priority: 'low',
    });
  }
  
  return Math.min(score, 25);
}

/**
 * 4. Profile Strength Score (20 points)
 * 
 * Measures profile completeness and social presence
 */
function calculateProfileStrengthScore(githubProfile, githubRepos, recommendations) {
  if (!githubProfile) {
    recommendations.push({
      category: 'Profile Strength',
      message: 'Connect GitHub and complete your profile for better visibility',
      priority: 'high',
    });
    return 0;
  }
  
  let score = 0;
  
  // Sub-factor 1: Profile completeness (8 points)
  const hasAvatar = !!githubProfile.avatar;
  const hasBio = !!githubProfile.bio;
  const hasLocation = !!githubProfile.location;
  const hasBlog = !!githubProfile.blog;
  const hasCompany = !!githubProfile.company;
  
  const completionItems = [hasAvatar, hasBio, hasLocation, hasBlog, hasCompany];
  const completionScore = completionItems.filter(Boolean).length;
  score += completionScore * 1.6; // 5 items * 1.6 = 8 points max
  
  if (!hasBio) {
    recommendations.push({
      category: 'Profile Strength',
      message: 'Add a compelling bio to your GitHub profile',
      priority: 'medium',
    });
  }
  
  if (!hasBlog) {
    recommendations.push({
      category: 'Profile Strength',
      message: 'Add your portfolio or blog link to your GitHub profile',
      priority: 'low',
    });
  }
  
  // Sub-factor 2: Followers (6 points)
  const followers = githubProfile.followers || 0;
  if (followers === 0) {
    score += 0;
  } else if (followers <= 10) {
    score += Math.min(followers * 0.3, 3);
  } else if (followers <= 50) {
    score += 3 + Math.min((followers - 10) * 0.05, 2);
  } else {
    score += 6;
  }
  
  // Sub-factor 3: Account age (3 points)
  if (githubProfile.createdAt) {
    const accountAgeYears = (Date.now() - new Date(githubProfile.createdAt)) / (1000 * 60 * 60 * 24 * 365);
    if (accountAgeYears < 0.5) {
      score += 0.5;
    } else if (accountAgeYears < 1) {
      score += 1;
    } else if (accountAgeYears < 2) {
      score += 2;
    } else {
      score += 3;
    }
  }
  
  // Sub-factor 4: Repository README quality (3 points)
  // Estimate based on repos with descriptions and topics
  if (githubRepos && githubRepos.repos) {
    const reposWithDescriptions = githubRepos.repos.filter(r => r.description && r.description.length > 20).length;
    const reposWithTopics = githubRepos.repos.filter(r => r.topics && r.topics.length > 0).length;
    const totalRepos = githubRepos.repos.length || 1;
    
    const documentationScore = ((reposWithDescriptions + reposWithTopics) / (totalRepos * 2)) * 3;
    score += Math.min(documentationScore, 3);
    
    if (reposWithDescriptions < totalRepos * 0.5) {
      recommendations.push({
        category: 'Profile Strength',
        message: 'Add detailed descriptions to your repositories',
        priority: 'medium',
      });
    }
  }
  
  return Math.min(score, 20);
}

/**
 * Generate overall assessment based on score
 */
function generateAssessment(score) {
  if (score >= 80) {
    return {
      level: 'Excellent',
      message: 'Outstanding GitHub presence! You are highly placement-ready.',
      color: 'green',
    };
  } else if (score >= 60) {
    return {
      level: 'Good',
      message: 'Strong GitHub activity. Keep building and contributing.',
      color: 'blue',
    };
  } else if (score >= 40) {
    return {
      level: 'Fair',
      message: 'Decent start. Focus on consistency and quality.',
      color: 'yellow',
    };
  } else if (score >= 20) {
    return {
      level: 'Needs Improvement',
      message: 'Work on building a stronger GitHub portfolio.',
      color: 'orange',
    };
  } else {
    return {
      level: 'Getting Started',
      message: 'Connect GitHub and start building projects.',
      color: 'red',
    };
  }
}

/**
 * Detect score changes and generate reason
 */
function detectScoreChange(oldScore, newScore) {
  const diff = newScore - oldScore;
  
  if (Math.abs(diff) < 2) {
    return null; // No significant change
  }
  
  if (diff > 0) {
    if (diff >= 10) {
      return { type: 'increase', reason: 'Major improvement in GitHub activity' };
    } else if (diff >= 5) {
      return { type: 'increase', reason: 'Significant progress in coding consistency' };
    } else {
      return { type: 'increase', reason: 'Steady improvement in GitHub metrics' };
    }
  } else {
    if (diff <= -10) {
      return { type: 'decrease', reason: 'Long period of inactivity detected' };
    } else if (diff <= -5) {
      return { type: 'decrease', reason: 'Reduced coding activity recently' };
    } else {
      return { type: 'decrease', reason: 'Slight decrease in GitHub engagement' };
    }
  }
}

module.exports = {
  calculateGitHubReadinessScore,
  detectScoreChange,
};
