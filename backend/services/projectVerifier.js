const Groq = require('groq-sdk');
const { fetchRepositoryData } = require('../utils/githubFetcher');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

/**
 * Extract requirements from problem statement
 * Used to create a checklist for verification
 */
function extractRequirements(problemStatement) {
  // Simple extraction - look for bullet points, numbered lists, or "must"/"should" statements
  const lines = problemStatement.split('\n');
  const requirements = [];

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Match numbered lists (1., 2., etc.), bullet points (-, *, •), or requirement keywords
    if (
      /^\d+\./.test(trimmed) ||
      /^[-*•]/.test(trimmed) ||
      /\b(must|should|need to|required to|has to)\b/i.test(trimmed)
    ) {
      // Clean up the requirement text
      let requirement = trimmed
        .replace(/^\d+\./, '')
        .replace(/^[-*•]/, '')
        .trim();
      
      if (requirement.length > 10 && requirement.length < 200) {
        requirements.push(requirement);
      }
    }
  }

  // If no structured requirements found, create a general one
  if (requirements.length === 0) {
    requirements.push('Implement the solution as described in the problem statement');
  }

  return requirements;
}

/**
 * Verify a student's project submission using AI
 * @param {string} githubUrl - GitHub repository URL
 * @param {string} problemStatement - The original project requirements
 * @returns {Object} Verification result with status, score, feedback, and checklist
 */
async function verifyProject(githubUrl, problemStatement) {
  try {
    // Step 1: Fetch repository data
    console.log(`[ProjectVerifier] Fetching repository data for: ${githubUrl}`);
    const repoData = await fetchRepositoryData(githubUrl);

    // Step 2: Extract requirements for checklist
    const requirements = extractRequirements(problemStatement);

    // Step 3: Prepare context for AI
    const filesContext = repoData.files.map(file => {
      return `FILE: ${file.path}\n${'='.repeat(50)}\n${file.content}\n\n`;
    }).join('\n');

    const metadata = repoData.metadata;
    const metadataContext = `
Repository: ${metadata.fullName}
Description: ${metadata.description}
Languages: ${metadata.languages.join(', ')}
Last Updated: ${metadata.lastCommit}
    `.trim();

    // Step 4: Create AI prompt for verification
    const prompt = `You are an expert code reviewer verifying a student's project submission.

PROBLEM STATEMENT:
${problemStatement}

REPOSITORY METADATA:
${metadataContext}

REPOSITORY CODE:
${filesContext}

TASK:
Analyze the submitted repository and verify if it meets the project requirements. Provide:
1. An overall assessment score (0-100)
2. Whether each requirement is met (yes/no/partial)
3. Constructive feedback for improvement
4. Specific comments for each requirement

REQUIREMENTS TO CHECK:
${requirements.map((req, idx) => `${idx + 1}. ${req}`).join('\n')}

Respond in the following JSON format ONLY (no additional text):
{
  "overallScore": <number 0-100>,
  "summary": "<brief 1-2 sentence summary of the project quality>",
  "strengths": ["<strength 1>", "<strength 2>", ...],
  "improvements": ["<improvement 1>", "<improvement 2>", ...],
  "checklist": [
    {
      "requirement": "<requirement text>",
      "met": <true/false>,
      "comment": "<specific comment about this requirement>"
    },
    ...
  ]
}

Be fair but thorough. Consider:
- Code quality and organization
- Completeness of implementation
- Whether the core functionality works
- Documentation (README)
- Best practices

If key files are missing or the repository seems incomplete, reflect this in the score.`;

    // Step 5: Call Groq API for verification
    console.log('[ProjectVerifier] Calling Groq API for verification...');
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert code reviewer. Respond ONLY with valid JSON, no additional text or markdown formatting.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.1-8b-instant', // Fast and cost-effective
      temperature: 0.3, // Lower temperature for more consistent evaluation
      max_tokens: 2000
    });

    const responseText = completion.choices[0]?.message?.content;
    
    if (!responseText) {
      throw new Error('Empty response from AI');
    }

    // Step 6: Parse AI response
    let aiResult;
    try {
      // Try to extract JSON if there's any markdown formatting
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : responseText;
      aiResult = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('[ProjectVerifier] Failed to parse AI response:', responseText);
      throw new Error('Failed to parse AI verification response');
    }

    // Step 7: Determine status based on score thresholds
    let status;
    const score = aiResult.overallScore;
    
    if (score >= 70) {
      status = 'verified';
    } else if (score >= 40) {
      status = 'needs_improvement';
    } else {
      status = 'rejected';
    }

    // Step 8: Format feedback
    const feedback = `
**Summary:** ${aiResult.summary}

**Strengths:**
${aiResult.strengths.map(s => `- ${s}`).join('\n')}

**Areas for Improvement:**
${aiResult.improvements.map(i => `- ${i}`).join('\n')}
    `.trim();

    // Step 9: Return verification result
    const result = {
      status,
      score,
      feedback,
      checklist: aiResult.checklist.map(item => ({
        requirement: item.requirement,
        met: item.met,
        comment: item.comment
      })),
      repositoryAnalyzed: {
        name: metadata.name,
        languages: metadata.languages,
        lastCommit: metadata.lastCommit,
        filesAnalyzed: repoData.files.map(f => f.name)
      },
      verifiedAt: new Date()
    };

    console.log(`[ProjectVerifier] Verification complete. Status: ${status}, Score: ${score}`);
    return result;

  } catch (error) {
    console.error('[ProjectVerifier] Verification failed:', error.message);
    
    // Return error result
    return {
      status: 'error',
      score: 0,
      feedback: `Verification failed: ${error.message}. Please ensure your repository is public and accessible.`,
      checklist: [],
      error: error.message,
      verifiedAt: new Date()
    };
  }
}

/**
 * Quick validation to check if a GitHub URL is valid and accessible
 * Used before full verification to fail fast
 */
async function validateGitHubUrl(githubUrl) {
  try {
    const { fetchRepositoryData } = require('../utils/githubFetcher');
    await fetchRepositoryData(githubUrl);
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
}

module.exports = {
  verifyProject,
  validateGitHubUrl,
  extractRequirements
};
