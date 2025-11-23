const Recruiter = require('../models/Recruiter');
const Student = require('../models/Student');
const asyncHandler = require('../utils/asyncHandler');
const { generateToken } = require('../utils/authMiddleware');

const buildAuthResponse = (recruiter) => ({
  token: generateToken(recruiter._id, 'recruiter'),
  recruiter,
});

const signup = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const existing = await Recruiter.findOne({ email });

  if (existing) {
    return res.status(409).json({ message: 'Recruiter already exists with this email' });
  }

  const recruiter = new Recruiter(req.body);
  await recruiter.save();

  res.status(201).json(buildAuthResponse(recruiter));
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const recruiter = await Recruiter.findOne({ email }).select('+password');

  if (!recruiter) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const isMatch = await recruiter.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  recruiter.lastLoginAt = new Date();
  await recruiter.save();

  const recruiterSafe = await Recruiter.findById(recruiter._id);
  res.json(buildAuthResponse(recruiterSafe));
});

const getProfile = asyncHandler(async (req, res) => {
  res.json(req.user);
});

const updatePreferences = asyncHandler(async (req, res) => {
  const updates = {
    name: req.body.name,
    company: req.body.company,
    role: req.body.role,
    phone: req.body.phone,
    preferences: {
      roles: req.body.preferences?.roles || req.body.roles,
      minScore: req.body.preferences?.minScore || req.body.minScore,
      skills: req.body.preferences?.skills || req.body.skills,
    },
  };

  const recruiter = await Recruiter.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  res.json(recruiter);
});

const calculateDynamicScore = (student, filters) => {
  let score = 0;
  const weights = {
    baseReadiness: 0.20,        // 20% - Base readiness score
    skillMatch: 0.30,           // 30% - Skill match with filter
    projectRelevance: 0.25,     // 25% - Projects in relevant domain
    certifications: 0.10,       // 10% - Relevant certifications
    consistency: 0.10,          // 10% - Streak and activity
    cgpa: 0.05,                 // 5% - Academic performance
  };

  // 1. Base Readiness Score (20 points max)
  const baseReadinessScore = (student.readinessScore || 0) * weights.baseReadiness;
  score += baseReadinessScore;

  // 2. Skill Match Score (30 points max)
  let skillMatchScore = 0;
  let hasSkillFilter = filters.skills && filters.skills.length > 0;
  
  if (hasSkillFilter) {
    const studentSkills = [
      ...(student.skills || []),
      ...(student.projects?.flatMap(p => p.tags || []) || [])
    ].map(s => s.toLowerCase());

    const matchedSkills = filters.skills.filter(filterSkill =>
      studentSkills.some(studentSkill =>
        studentSkill.includes(filterSkill.toLowerCase())
      )
    );

    const matchPercentage = matchedSkills.length / filters.skills.length;
    skillMatchScore = matchPercentage * 30;

    // Bonus: Multiple projects with the same skill (+5 points max)
    const skillFrequency = {};
    filters.skills.forEach(skill => {
      const count = student.projects?.filter(p =>
        p.tags?.some(tag => tag.toLowerCase().includes(skill.toLowerCase()))
      ).length || 0;
      skillFrequency[skill] = count;
    });
    const avgFrequency = Object.values(skillFrequency).reduce((a, b) => a + b, 0) / filters.skills.length;
    const frequencyBonus = Math.min(avgFrequency * 2, 5);
    
    skillMatchScore += frequencyBonus;
    score += skillMatchScore;
  } else {
    // No skill filter, give base score
    skillMatchScore = 15;
    score += skillMatchScore;
  }

  // 3. Project Relevance Score (25 points max)
  const verifiedProjects = student.projects?.filter(p => p.status === 'verified' || p.verified) || [];
  const totalProjects = student.projects?.length || 0;
  let projectScore = 0;

  if (hasSkillFilter) {
    // Score based on relevant projects
    const relevantProjects = student.projects?.filter(p =>
      p.tags?.some(tag =>
        filters.skills.some(skill =>
          tag.toLowerCase().includes(skill.toLowerCase())
        )
      )
    ) || [];

    projectScore += Math.min(relevantProjects.length * 5, 20);
    // Bonus for verified relevant projects
    const verifiedRelevant = relevantProjects.filter(p => p.status === 'verified' || p.verified);
    projectScore += Math.min(verifiedRelevant.length * 2.5, 5);
    
    // If student has matching skills but no relevant projects, give partial credit
    // This ensures students with the right skills but building their portfolio aren't penalized too harshly
    if (skillMatchScore > 0 && relevantProjects.length === 0) {
      projectScore = 5; // Give minimum 5 points for having the skills
    }
  } else {
    // No skill filter, score all projects
    projectScore += Math.min(totalProjects * 3, 15);
    projectScore += Math.min(verifiedProjects.length * 2, 10);
  }
  
  score += projectScore;

  // 4. Certifications Score (10 points max)
  const verifiedCerts = student.certifications?.filter(c => c.status === 'verified') || [];
  let certScore = 0;
  
  if (hasSkillFilter) {
    // Score based on relevant certifications
    const relevantCerts = verifiedCerts.filter(cert =>
      filters.skills.some(skill =>
        cert.name?.toLowerCase().includes(skill.toLowerCase()) ||
        cert.provider?.toLowerCase().includes(skill.toLowerCase())
      )
    );
    certScore = Math.min(relevantCerts.length * 5, 10);
  } else {
    certScore = Math.min(verifiedCerts.length * 2, 10);
  }
  
  score += certScore;

  // 5. Consistency Score (10 points max)
  const streakScore = Math.min((student.streakDays || 0) / 10, 5); // Max 5 points for 50+ day streak
  const activityScore = Math.min(totalProjects / 2, 5); // Max 5 points for 10+ projects
  score += streakScore + activityScore;

  // 6. CGPA Score (5 points max)
  if (student.cgpa) {
    score += (student.cgpa / 10) * 5;
  } else {
    // If no CGPA, give 2.5 points as neutral value (equivalent to 5.0 CGPA)
    score += 2.5;
  }

  // Ensure minimum score for students with matching skills
  // Even with no projects, they should get credit for having the right skills
  if (hasSkillFilter && skillMatchScore > 0) {
    const minimumScore = Math.max(baseReadinessScore + skillMatchScore, 25);
    score = Math.max(score, minimumScore);
  }

  // Normalize to 100
  return Math.min(Math.round(score), 100);
};

const listStudents = asyncHandler(async (req, res) => {
  const { skills, minScore, college, minProjects, minCGPA } = req.query;

  const filter = {};
  if (college) filter.college = new RegExp(college, 'i');
  
  // Don't filter by skills in DB query - we'll score all and filter after
  let students = await Student.find(filter)
    .select('name college branch readinessScore badges projects skillRadar streakDays skills certifications cgpa email phone location')
    .lean();

  // Parse filter criteria
  const filterCriteria = {
    skills: skills ? skills.split(',').map(s => s.trim()) : [],
    minScore: minScore ? Number(minScore) : 0,
    minProjects: minProjects ? Number(minProjects) : 0,
    minCGPA: minCGPA ? Number(minCGPA) : 0,
  };

  // Calculate dynamic score for each student
  students = students.map(student => {
    const dynamicScore = calculateDynamicScore(student, filterCriteria);
    return {
      ...student,
      dynamicScore,
      originalReadinessScore: student.readinessScore,
    };
  });

  // Apply filters
  if (filterCriteria.skills.length > 0) {
    students = students.filter(student => {
      const studentSkills = [
        ...(student.skills || []),
        ...(student.projects?.flatMap(p => p.tags || []) || [])
      ].map(s => s.toLowerCase());

      return filterCriteria.skills.some(skill =>
        studentSkills.some(studentSkill =>
          studentSkill.includes(skill.toLowerCase())
        )
      );
    });
  }

  if (filterCriteria.minProjects > 0) {
    students = students.filter(s => (s.projects?.length || 0) >= filterCriteria.minProjects);
  }

  if (filterCriteria.minCGPA > 0) {
    students = students.filter(s => (s.cgpa || 0) >= filterCriteria.minCGPA);
  }

  if (filterCriteria.minScore > 0) {
    students = students.filter(s => s.dynamicScore >= filterCriteria.minScore);
  }

  // Sort by dynamic score (highest first)
  students.sort((a, b) => b.dynamicScore - a.dynamicScore);

  res.json(students);
});

const compareStudents = asyncHandler(async (req, res) => {
  const { studentIds } = req.body;
  const students = await Student.find({ _id: { $in: studentIds } })
    .select('name college branch readinessScore readinessHistory skillRadar badges projects certifications streakDays')
    .lean();

  if (!students || students.length === 0) {
    return res.status(404).json({ message: 'Students not found for comparison' });
  }

  res.json({
    count: students.length,
    students,
  });
});

const saveCandidate = asyncHandler(async (req, res) => {
  const studentId = req.params.studentId || req.params.id;
  if (!studentId) {
    return res.status(400).json({ message: 'studentId path parameter is required' });
  }

  const student = await Student.findById(studentId);
  if (!student) {
    return res.status(404).json({ message: 'Student not found' });
  }

  const recruiter = await Recruiter.findById(req.user._id);
  if (!recruiter.savedCandidates.includes(studentId)) {
    recruiter.savedCandidates.push(studentId);
    await recruiter.save();
  }

  res.json({ message: 'Candidate saved', savedCandidates: recruiter.savedCandidates });
});

const removeSavedCandidate = asyncHandler(async (req, res) => {
  const studentId = req.params.studentId || req.params.id;

  const recruiter = await Recruiter.findById(req.user._id);
  recruiter.savedCandidates = recruiter.savedCandidates.filter(
    (candidateId) => candidateId.toString() !== studentId
  );
  await recruiter.save();

  res.json({ message: 'Candidate removed', savedCandidates: recruiter.savedCandidates });
});

const getSavedCandidates = asyncHandler(async (req, res) => {
  const recruiter = await Recruiter.findById(req.user._id).populate(
    'savedCandidates',
    'name college branch readinessScore badges skillRadar'
  );

  res.json(recruiter.savedCandidates || []);
});

const getStudentProfile = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  
  if (!studentId) {
    return res.status(400).json({ message: 'Student ID is required' });
  }

  const student = await Student.findById(studentId)
    .select('-password -__v') // Exclude sensitive fields
    .lean();

  if (!student) {
    return res.status(404).json({ message: 'Student not found' });
  }

  res.json(student);
});

const aiAssistant = asyncHandler(async (req, res) => {
  const { message, context, conversationHistory } = req.body;

  if (!message) {
    return res.status(400).json({ message: 'Message is required' });
  }

  try {
    // Use Groq API for AI responses
    const Groq = require('groq-sdk');
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    // Build system prompt with context
    const systemPrompt = `You are an expert AI recruitment assistant for EvolvEd, a platform that tracks student growth and readiness for campus placements.

Context about the current recruitment session:
- Total students in database: ${context.totalStudents || 0}
- Currently selected students for comparison: ${context.selectedCount || 0}
${context.selectedStudents?.length > 0 ? `
Selected Students:
${context.selectedStudents.map((s, i) => `${i + 1}. ${s.name} (${s.college}, ${s.branch})
   - Readiness Score: ${s.readinessScore || 0}%
   - Streak: ${s.streakDays || 0} days
   - Projects: ${s.projects || 0}
   - Certifications: ${s.certifications || 0}
   - Skills: ${s.skills?.join(', ') || 'N/A'}`).join('\n')}
` : ''}
${context.topCandidates?.length > 0 ? `
Top 5 Candidates by Readiness Score:
${context.topCandidates.map((s, i) => `${i + 1}. ${s.name} - ${s.readinessScore || 0}% (Skills: ${s.skills?.join(', ') || 'N/A'})`).join('\n')}
` : ''}

Your role is to:
1. Help recruiters analyze and compare candidates
2. Suggest best fits based on requirements
3. Explain growth patterns and readiness metrics
4. Answer questions about student profiles
5. Provide insights on skill development and consistency

Be helpful, professional, and data-driven in your responses. Focus on growth patterns, consistency (streak days), and overall readiness rather than just one-time achievements.`;

    // Prepare messages for Groq
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []),
      { role: 'user', content: message },
    ];

    // Call Groq API
    const chatCompletion = await groq.chat.completions.create({
      messages: messages,
      model: 'llama-3.3-70b-versatile', // Using Llama 3.3 70B for better reasoning
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 1,
      stream: false,
    });

    const response = chatCompletion.choices[0]?.message?.content || 'I apologize, but I could not generate a response. Please try again.';

    res.json({
      response: response,
      model: 'llama-3.3-70b-versatile',
      timestamp: new Date(),
    });

  } catch (error) {
    console.error('Groq AI Error:', error);
    
    // Fallback response if Groq fails
    let fallbackResponse = `Based on the available data:\n\n`;
    
    if (context.selectedStudents?.length > 0) {
      fallbackResponse += `You have selected ${context.selectedStudents.length} student(s):\n`;
      context.selectedStudents.forEach((s, i) => {
        fallbackResponse += `${i + 1}. ${s.name} - Readiness: ${s.readinessScore}%, Streak: ${s.streakDays} days\n`;
      });
    } else {
      fallbackResponse += `Total students available: ${context.totalStudents}\n`;
      if (context.topCandidates?.length > 0) {
        fallbackResponse += `\nTop candidates:\n`;
        context.topCandidates.slice(0, 3).forEach((s, i) => {
          fallbackResponse += `${i + 1}. ${s.name} (${s.readinessScore}%)\n`;
        });
      }
    }
    
    fallbackResponse += `\nNote: AI service is temporarily unavailable. Please try again or rephrase your question.`;

    res.json({
      response: fallbackResponse,
      model: 'fallback',
      error: 'AI service unavailable',
      timestamp: new Date(),
    });
  }
});

module.exports = {
  signup,
  login,
  getProfile,
  updatePreferences,
  listStudents,
  compareStudents,
  saveCandidate,
  removeSavedCandidate,
  getSavedCandidates,
  getStudentProfile,
  aiAssistant,
};
