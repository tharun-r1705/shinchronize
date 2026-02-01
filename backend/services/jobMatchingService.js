const Groq = require('groq-sdk');
const Student = require('../models/Student');
const Job = require('../models/Job');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const COMMON_SKILLS = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C', 'C++', 'C#', 'Go', 'Rust', 'PHP',
  'React', 'Angular', 'Vue', 'Next.js', 'Node.js', 'Express', 'Django', 'Flask', 'Spring',
  'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'SQL', 'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes',
  'HTML', 'CSS', 'Tailwind', 'GraphQL', 'REST', 'Microservices', 'Machine Learning', 'AI', 'NLP'
];

const STOPWORDS = new Set([
  'the', 'and', 'or', 'to', 'of', 'in', 'for', 'with', 'a', 'an', 'on', 'at', 'by', 'is', 'are',
  'as', 'from', 'this', 'that', 'will', 'be', 'we', 'you', 'your', 'our', 'their', 'they', 'it',
  'role', 'job', 'position', 'candidate', 'experience', 'skills', 'required', 'preferred'
]);

const uniqueList = (items = []) => Array.from(new Set(items.map(s => s.trim()).filter(Boolean)));

/**
 * Parse job description into required/preferred skills
 * @param {string} description
 * @returns {Promise<{requiredSkills: string[], preferredSkills: string[]}>}
 */
async function parseJobDescriptionToSkills(description = '') {
  if (!description || !description.trim()) {
    return { requiredSkills: [], preferredSkills: [] };
  }

  try {
    const prompt = `Extract skills from the job description and return a JSON object with keys "requiredSkills" and "preferredSkills".
Only include concrete technical skills, tools, frameworks, languages, or platforms.
Job Description:\n${description}`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a strict information extraction system. Respond only in JSON.',
        },
        { role: 'user', content: prompt },
      ],
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      temperature: 0.2,
      max_tokens: 512,
      response_format: { type: 'json_object' },
    });

    const response = chatCompletion.choices[0]?.message?.content;
    const parsed = JSON.parse(response || '{}');

    return {
      requiredSkills: uniqueList(parsed.requiredSkills || []),
      preferredSkills: uniqueList(parsed.preferredSkills || []),
    };
  } catch (error) {
    console.error('Error parsing job description:', error);
  }

  // Fallback: keyword match from common skills
  const lower = description.toLowerCase();
  const matched = COMMON_SKILLS.filter(skill => lower.includes(skill.toLowerCase()));
  if (matched.length > 0) {
    return { requiredSkills: uniqueList(matched), preferredSkills: [] };
  }

  // Fallback: simple keyword extraction
  const keywords = description
    .replace(/[^a-zA-Z0-9+\s]/g, ' ')
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOPWORDS.has(word));
  const frequency = keywords.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {});
  const topWords = Object.keys(frequency)
    .sort((a, b) => frequency[b] - frequency[a])
    .slice(0, 8)
    .map(word => word[0].toUpperCase() + word.slice(1));

  return { requiredSkills: uniqueList(topWords), preferredSkills: [] };
}

/**
 * Generate detailed job description using AI
 * @param {Object} basicJobInfo - Basic job information
 * @returns {Promise<Object>} - Generated job details
 */
async function generateJobDescription(basicJobInfo) {
  const { title, location, requiredSkills, preferredSkills, experience, company } = basicJobInfo;

  const prompt = `You are an expert HR professional. Generate a professional and engaging job description.

Job Details:
- Title: ${title}
- Company: ${company || 'A leading technology company'}
- Location: ${location}
- Experience Required: ${experience || '0-2 years'}
- Required Skills: ${requiredSkills.join(', ')}
${preferredSkills?.length > 0 ? `- Preferred Skills: ${preferredSkills.join(', ')}` : ''}

Generate the following in JSON format:
{
  "description": "2-3 paragraph engaging job description highlighting the role, team, and impact",
  "responsibilities": ["5-7 clear, specific responsibilities"],
  "qualifications": ["5-7 qualifications including technical skills, soft skills, and experience"]
}

Make it professional, specific to the role, and exciting for candidates. Focus on growth opportunities and impact.`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert HR professional who writes compelling job descriptions. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 2048,
      response_format: { type: 'json_object' },
    });

    const response = chatCompletion.choices[0]?.message?.content;
    const parsed = JSON.parse(response);

    return {
      description: parsed.description || '',
      responsibilities: parsed.responsibilities || [],
      qualifications: parsed.qualifications || [],
    };
  } catch (error) {
    console.error('Error generating job description:', error);

    // Fallback to basic template
    return {
      description: `We are looking for a talented ${title} to join our team in ${location}. This role requires expertise in ${requiredSkills.join(', ')} and offers excellent growth opportunities.`,
      responsibilities: [
        `Work on ${requiredSkills[0]} development`,
        'Collaborate with cross-functional teams',
        'Write clean, maintainable code',
        'Participate in code reviews',
        'Contribute to technical documentation',
      ],
      qualifications: [
        `Strong knowledge of ${requiredSkills.join(', ')}`,
        experience || '0-2 years of relevant experience',
        'Good problem-solving skills',
        'Team player with strong communication',
        'Bachelor\'s degree in Computer Science or related field',
      ],
    };
  }
}

/**
 * Calculate multi-factor job match score
 * @param {Object} student - Student profile
 * @param {Object} job - Job posting
 * @returns {Object} - Match score and details
 */
function calculateJobMatchScore(student, job) {
  let score = 0;
  const breakdown = {};
  const skillsMatched = [];
  const skillsMissing = [];

  // Get all student skills (from profile + projects)
  const studentSkills = [
    ...(student.skills || []),
    ...(student.projects?.flatMap(p => p.tags || []) || [])
  ].map(s => String(s).trim().toLowerCase());

  // 1. Required Skills Match (30 points) - CRITICAL
  const requiredMatched = job.requiredSkills.filter(skill => {
    const skillLower = String(skill).trim().toLowerCase();
    // Check both: if student skill includes job skill OR job skill includes student skill
    const matched = studentSkills.some(s =>
      s.includes(skillLower) || skillLower.includes(s) || s === skillLower
    );
    if (matched) {
      skillsMatched.push(skill);
    } else {
      skillsMissing.push(skill);
    }
    return matched;
  });

  const requiredScore = job.requiredSkills.length > 0
    ? (requiredMatched.length / job.requiredSkills.length) * 30
    : 15;

  score += requiredScore;
  breakdown.requiredSkills = Math.round(requiredScore);

  // 2. Preferred Skills Match (10 points) - BONUS
  const preferredMatched = (job.preferredSkills || []).filter(skill => {
    const skillLower = String(skill).trim().toLowerCase();
    return studentSkills.some(s =>
      s.includes(skillLower) || skillLower.includes(s) || s === skillLower
    );
  });

  const preferredScore = job.preferredSkills?.length > 0
    ? Math.min((preferredMatched.length / job.preferredSkills.length) * 10, 10)
    : 5;

  score += preferredScore;
  breakdown.preferredSkills = Math.round(preferredScore);

  // 3. Project Relevance (25 points)
  let projectScore = 0;
  const relevantProjects = student.projects?.filter(p =>
    p.tags?.some(tag =>
      job.requiredSkills.some(skill =>
        tag.toLowerCase().includes(skill.toLowerCase())
      )
    )
  ) || [];

  const verifiedRelevantProjects = relevantProjects.filter(p => p.status === 'verified' || p.verified);

  // Base project score
  projectScore += Math.min(relevantProjects.length * 4, 15);

  // Bonus for verified projects
  projectScore += Math.min(verifiedRelevantProjects.length * 2, 5);

  // Bonus for diversity of skills in projects
  const uniqueSkillsInProjects = new Set(
    relevantProjects.flatMap(p => p.tags || [])
  ).size;
  projectScore += Math.min(uniqueSkillsInProjects * 1, 5);

  score += projectScore;
  breakdown.projects = Math.round(projectScore);

  // 4. Readiness Score (20 points)
  const readinessScore = ((student.readinessScore || 0) / 100) * 20;
  score += readinessScore;
  breakdown.readiness = Math.round(readinessScore);

  // 5. Growth Trajectory (10 points)
  let growthScore = 0;
  if (student.readinessHistory && student.readinessHistory.length >= 3) {
    const recent = student.readinessHistory.slice(-3);
    const growth = recent[recent.length - 1].score - recent[0].score;
    growthScore = Math.min(Math.max(growth / 2, 0), 10);
  } else if (student.readinessScore >= 70) {
    // Give credit to high performers without history
    growthScore = 5;
  }
  score += growthScore;
  breakdown.growth = Math.round(growthScore);

  // 6. CGPA (3 points)
  const cgpaScore = student.cgpa ? (student.cgpa / 10) * 3 : 1.5;
  score += cgpaScore;
  breakdown.cgpa = Math.round(cgpaScore * 10) / 10;

  // 7. Certifications (2 points)
  const verifiedCerts = student.certifications?.filter(c => c.status === 'verified') || [];
  const certScore = Math.min(verifiedCerts.length * 0.5, 2);
  score += certScore;
  breakdown.certifications = Math.round(certScore * 10) / 10;

  // 8. Coding Consistency Bonus (5 points)
  let consistencyScore = 0;
  const leetcodeStreak = student.leetcodeStats?.streak || 0;
  const githubStreak = student.githubStats?.streak || 0;
  const maxStreak = Math.max(leetcodeStreak, githubStreak);

  consistencyScore = Math.min(maxStreak / 20, 5); // 100-day streak = 5 points
  score += consistencyScore;
  breakdown.consistency = Math.round(consistencyScore * 10) / 10;

  // Apply minimum score logic
  // If student matches required skills but has few projects, ensure reasonable baseline
  if (requiredMatched.length > 0 && requiredMatched.length >= job.requiredSkills.length * 0.5) {
    const minimumScore = 25 + (requiredScore / 30) * 25; // 25-50 points minimum
    score = Math.max(score, minimumScore);
  }

  return {
    totalScore: Math.min(Math.round(score), 100),
    breakdown,
    skillsMatched: [...new Set(skillsMatched)], // Remove duplicates
    skillsMissing: [...new Set(skillsMissing)],
    relevantProjectsCount: relevantProjects.length,
  };
}

/**
 * Generate AI justification for why a student matches a job
 * @param {Object} student - Student profile
 * @param {Object} job - Job posting
 * @param {Object} matchData - Match score and breakdown
 * @returns {Promise<String>} - AI-generated match reason
 */
async function generateMatchReason(student, job, matchData) {
  const { totalScore, skillsMatched, skillsMissing, relevantProjectsCount } = matchData;

  const prompt = `Explain why this student is a ${totalScore >= 80 ? 'strong' : totalScore >= 60 ? 'good' : 'potential'} match for this job in 2-3 concise sentences.

Student Profile:
- Name: ${student.name}
- Skills: ${student.skills?.join(', ') || 'Not specified'}
- Relevant Projects: ${relevantProjectsCount} (Total: ${student.projects?.length || 0})
- Readiness Score: ${student.readinessScore || 0}%
- CGPA: ${student.cgpa || 'N/A'}
- LeetCode Streak: ${student.leetcodeStats?.streak || 0} days
- GitHub Contributions: ${student.githubStats?.totalCommits || 0} commits
- Certifications: ${student.certifications?.length || 0}

Job Requirements:
- Title: ${job.title}
- Required Skills: ${job.requiredSkills.join(', ')}
- Preferred Skills: ${job.preferredSkills?.join(', ') || 'None'}
- Min Readiness: ${job.minReadinessScore}%

Match Details:
- Match Score: ${totalScore}%
- Skills Matched: ${skillsMatched.join(', ') || 'None'}
- Skills Missing: ${skillsMissing.join(', ') || 'None'}

Write a professional justification focusing on:
1. Why this student fits the role (highlight matched skills and relevant projects)
2. Key strengths that make them stand out
3. Any gaps they may need to address (if score < 90)

Keep it positive, specific, and actionable. Maximum 3 sentences.`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a recruitment expert who writes concise, data-driven candidate assessments. Be specific and professional.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      temperature: 0.6,
      max_tokens: 256,
    });

    const response = chatCompletion.choices[0]?.message?.content || '';
    return response.trim();
  } catch (error) {
    console.error('Error generating match reason:', error);

    // Fallback template
    if (totalScore >= 80) {
      return `Strong match with ${skillsMatched.length}/${job.requiredSkills.length} required skills and ${relevantProjectsCount} relevant projects. Demonstrates consistent growth with ${student.readinessScore}% readiness score. ${skillsMissing.length > 0 ? `May benefit from developing: ${skillsMissing.slice(0, 2).join(', ')}.` : 'Excellent skill coverage.'}`;
    } else if (totalScore >= 60) {
      return `Good match with solid foundation in ${skillsMatched.slice(0, 3).join(', ')}. Has ${relevantProjectsCount} relevant projects and ${student.readinessScore}% readiness. Could strengthen: ${skillsMissing.slice(0, 2).join(', ')}.`;
    } else {
      return `Potential match with ${skillsMatched.length} matching skills and growth potential. Would benefit from gaining experience in ${skillsMissing.slice(0, 2).join(', ')} to better align with role requirements.`;
    }
  }
}

/**
 * Match all students to a specific job
 * @param {String} jobId - Job ID
 * @returns {Promise<Object>} - Matching results
 */
async function matchStudentsToJob(jobId) {
  try {
    const job = await Job.findById(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    // Fetch all students
    const students = await Student.find({})
      .select('name email college branch readinessScore readinessHistory skills projects certifications cgpa leetcodeStats githubStats learningMetrics')
      .lean();

    console.log(`Matching ${students.length} students to job: ${job.title}`);
    console.log(`Job required skills: [${job.requiredSkills.join(', ')}]`);

    // STEP 1: Check if combined skills of all students cover all required skills
    const allStudentSkills = new Set();
    console.log('\n=== Analyzing All Student Skills ===');
    for (const student of students) {
      const studentSkills = [
        ...(student.skills || []),
        ...(student.projects?.flatMap(p => p.tags || []) || []),
        ...(student.certifications?.map(c => c.name) || [])
      ];
      console.log(`${student.name || student.email}: [${studentSkills.slice(0, 5).join(', ')}${studentSkills.length > 5 ? '...' : ''}] (${studentSkills.length} total)`);
      studentSkills.forEach(skill => allStudentSkills.add(skill.toLowerCase().trim()));
    }

    const requiredSkills = job.requiredSkills.map(s => s.toLowerCase().trim());
    const coveredSkills = requiredSkills.filter(reqSkill =>
      Array.from(allStudentSkills).some(studentSkill =>
        studentSkill.includes(reqSkill) || reqSkill.includes(studentSkill)
      )
    );

    const allSkillsCovered = coveredSkills.length === requiredSkills.length;
    const coveragePercentage = requiredSkills.length > 0
      ? (coveredSkills.length / requiredSkills.length * 100).toFixed(1)
      : 0;

    console.log(`Combined Skills Coverage: ${coveredSkills.length}/${requiredSkills.length} skills (${coveragePercentage}%)`);
    if (allSkillsCovered) {
      console.log('✓ ALL required skills are covered by the student pool - Using team-based matching');
    } else {
      console.log(`✗ Missing ${requiredSkills.length - coveredSkills.length} skills from pool - Using individual 10% threshold`);
    }

    // Calculate match scores for all students
    const matches = [];
    const allCandidates = []; // Track all candidates for potential fallback
    let filteredBySkills = 0;

    console.log('NOTE: Readiness Score, CGPA, and Projects filters are DISABLED for maximum candidate pool');

    for (const student of students) {
      // REMOVED: Basic filters (minReadinessScore, minCGPA, minProjects)
      // These filters were too restrictive and excluded good candidates with matching skills
      // The match score already factors in these attributes, so they still affect ranking

      const matchData = calculateJobMatchScore(student, job);

      // TEAM-BASED MATCHING LOGIC:
      // If ALL required skills are covered by the combined student pool,
      // include ANY student who has at least ONE matching skill
      // Otherwise, use the 10% individual threshold

      const requiredSkillsCount = job.requiredSkills.length;
      const matchedSkillsCount = matchData.skillsMatched.length;
      const skillMatchPercentage = requiredSkillsCount > 0
        ? (matchedSkillsCount / requiredSkillsCount) * 100
        : 100;

      // Keep all candidates for potential fallback
      allCandidates.push({
        student,
        matchData,
      });

      let shouldIncludeStudent = false;
      let matchingReason = '';

      if (allSkillsCovered) {
        // Team-based matching: Include if student has at least 1 matching skill
        if (matchedSkillsCount > 0) {
          shouldIncludeStudent = true;
          matchingReason = 'TEAM MATCH';
          console.log(`✓ ${matchingReason}: ${student.name || student.email}`);
          console.log(`  Matched: [${matchData.skillsMatched.join(', ')}] (${matchedSkillsCount}/${requiredSkillsCount})`);
        } else {
          console.log(`✗ FILTERED (no matching skills): ${student.name || student.email}`);
          console.log(`  Student has: [${(student.skills || []).join(', ')}]`);
          console.log(`  Job needs: [${job.requiredSkills.join(', ')}]`);
        }
      } else {
        // Individual matching: Require 10% threshold
        const MINIMUM_SKILL_MATCH_PERCENTAGE = parseInt(process.env.MIN_SKILL_MATCH_PERCENTAGE) || 10;

        if (skillMatchPercentage >= MINIMUM_SKILL_MATCH_PERCENTAGE) {
          shouldIncludeStudent = true;
          matchingReason = 'INDIVIDUAL MATCH';
          console.log(`✓ ${matchingReason}: ${student.name || student.email}`);
          console.log(`  Matched: [${matchData.skillsMatched.join(', ')}] (${matchedSkillsCount}/${requiredSkillsCount})`);
        } else if (matchedSkillsCount > 0) {
          filteredBySkills++;
          console.log(`✗ FILTERED (Skills < 10%): ${student.name || student.email}`);
          console.log(`  Matched: [${matchData.skillsMatched.join(', ')}] (${matchedSkillsCount}/${requiredSkillsCount})`);
          console.log(`  Missing: [${matchData.skillsMissing.join(', ')}]`);
          console.log(`  Match %: ${skillMatchPercentage.toFixed(1)}% < ${MINIMUM_SKILL_MATCH_PERCENTAGE}%`);
        } else {
          filteredBySkills++;
          console.log(`✗ FILTERED (no skills match): ${student.name || student.email}`);
        }
      }

      if (shouldIncludeStudent) {
        matches.push({
          student,
          matchData,
          matchingType: matchingReason,
        });
      }
    }

    console.log('\n=== FILTERING SUMMARY ===');
    console.log(`Total students in database: ${students.length}`);
    console.log(`Filtered by Skills (no match or < threshold): ${filteredBySkills}`);
    console.log(`Final matches: ${matches.length}`);
    console.log('========================\n');

    // Sort by match score (highest first)
    matches.sort((a, b) => b.matchData.totalScore - a.matchData.totalScore);

    // Generate AI justifications for top 50 matches
    const topMatches = matches.slice(0, 50);
    const matchedStudentsData = [];

    console.log(`Generating AI justifications for top ${topMatches.length} matches...`);

    for (const match of topMatches) {
      try {
        const matchReason = await generateMatchReason(match.student, job, match.matchData);

        matchedStudentsData.push({
          studentId: match.student._id,
          matchScore: match.matchData.totalScore,
          matchReason,
          skillsMatched: match.matchData.skillsMatched,
          skillsMissing: match.matchData.skillsMissing,
          lastUpdated: new Date(),
        });
      } catch (error) {
        console.error(`Error generating reason for student ${match.student._id}:`, error);
        // Add without AI reason
        matchedStudentsData.push({
          studentId: match.student._id,
          matchScore: match.matchData.totalScore,
          matchReason: 'Match based on skills and profile analysis.',
          skillsMatched: match.matchData.skillsMatched,
          skillsMissing: match.matchData.skillsMissing,
          lastUpdated: new Date(),
        });
      }
    }

    // Update job with matched students
    job.matchedStudents = matchedStudentsData;
    job.matchCount = matchedStudentsData.length;
    job.lastMatchedAt = new Date();
    await job.save();

    const MINIMUM_SKILL_MATCH_PERCENTAGE = parseInt(process.env.MIN_SKILL_MATCH_PERCENTAGE) || 10;
    console.log(`Successfully matched ${matchedStudentsData.length} students to job ${job.title}`);
    console.log(`Matching criteria: ${MINIMUM_SKILL_MATCH_PERCENTAGE}% of ${job.requiredSkills.length} required skills (${Math.ceil(job.requiredSkills.length * MINIMUM_SKILL_MATCH_PERCENTAGE / 100)} skills minimum)`);
    console.log(`Required skills: ${job.requiredSkills.join(', ')}`);

    return {
      jobId: job._id,
      jobTitle: job.title,
      totalStudents: students.length,
      matchCount: matchedStudentsData.length,
      topMatches: matchedStudentsData.slice(0, 10).map(m => ({
        studentId: m.studentId,
        matchScore: m.matchScore,
        matchReason: m.matchReason,
        skillsMatched: m.skillsMatched,
        skillsMissing: m.skillsMissing,
      })),
    };
  } catch (error) {
    console.error('Error in matchStudentsToJob:', error);
    throw error;
  }
}

/**
 * Refresh matches for all active jobs (can be called when student profile updates)
 * @param {String} studentId - Optional: specific student ID to refresh matches for
 */
async function refreshJobMatches(studentId = null) {
  try {
    const activeJobs = await Job.find({ status: 'active' });

    console.log(`Refreshing matches for ${activeJobs.length} active jobs...`);

    for (const job of activeJobs) {
      await matchStudentsToJob(job._id);
    }

    console.log('Job matches refreshed successfully');
  } catch (error) {
    console.error('Error refreshing job matches:', error);
    throw error;
  }
}

module.exports = {
  generateJobDescription,
  parseJobDescriptionToSkills,
  calculateJobMatchScore,
  generateMatchReason,
  matchStudentsToJob,
  refreshJobMatches,
};
