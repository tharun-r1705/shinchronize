const Student = require('../models/Student');
const Admin = require('../models/Admin');
const asyncHandler = require('../utils/asyncHandler');
const { generateToken } = require('../utils/authMiddleware');
const { calculateReadinessScore } = require('../utils/readinessScore');
const { generateMentorSuggestions } = require('../utils/aiMentor');
const { fetchLeetCodeActivity, fetchHackerRankActivity } = require('../utils/codingIntegrations');
const { fetchLeetCodeStats } = require('../utils/leetcode');
const { parseLinkedInPdf } = require('../utils/linkedinParser');

let cachedPdfParse = null;
const loadPdfParse = async () => {
  if (cachedPdfParse) {
    return cachedPdfParse;
  }

  const mod = await import('pdf-parse');
  const parser = mod?.default || mod?.pdf;

  if (typeof parser !== 'function') {
    throw new Error('Failed to initialise PDF parser module');
  }

  cachedPdfParse = parser;
  return cachedPdfParse;
};

const buildAuthResponse = (student, breakdown = {}) => ({
  token: generateToken(student._id, 'student'),
  student,
  readiness: {
    score: student.readinessScore,
    breakdown,
  },
});

const signup = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const existing = await Student.findOne({ email });
  if (existing) {
    return res.status(409).json({ message: 'Student already registered with this email' });
  }

  const student = new Student(req.body);
  await student.save();

  const { total, breakdown } = calculateReadinessScore(student);
  student.readinessScore = total;
  student.readinessHistory.push({ score: total });
  await student.save();

  const safeStudent = await Student.findById(student._id);

  res.status(201).json(buildAuthResponse(safeStudent, breakdown));
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const student = await Student.findOne({ email }).select('+password');
  if (!student) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const isMatch = await student.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const studentSafe = await Student.findById(student._id);
  res.json(buildAuthResponse(studentSafe));
});

const getProfile = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.user._id);

  // Calculate and attach base readiness score
  const { total, breakdown } = calculateReadinessScore(student);

  // Convert to plain object and add readiness score
  const studentObj = student.toObject();
  studentObj.baseReadinessScore = total;
  studentObj.readinessBreakdown = breakdown;

  res.json(studentObj);
});

const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = [
    'name',
    'firstName',
    'lastName',
    'dateOfBirth',
    'gender',
    'college',
    'branch',
    'year',
    'graduationYear',
    'phone',
    'location',
    'portfolioUrl',
    'linkedinUrl',
    'githubUrl',
    'resumeUrl',
    'leetcodeUrl',
    'hackerrankUrl',
    'headline',
    'summary',
    'skillRadar',
    'skills',
    'badges',
    'avatarUrl',
    'codingProfiles',
    'cgpa',
  ];

  const updates = {};
  allowedFields.forEach((field) => {
    if (typeof req.body[field] !== 'undefined') {
      updates[field] = req.body[field];
    }
  });

  if (typeof updates.dateOfBirth !== 'undefined') {
    updates.dateOfBirth = updates.dateOfBirth ? new Date(updates.dateOfBirth) : null;
  }

  if (typeof updates.skills !== 'undefined') {
    if (Array.isArray(updates.skills)) {
      updates.skills = updates.skills.map((skill) => String(skill).trim()).filter(Boolean);
    } else if (typeof updates.skills === 'string') {
      updates.skills = updates.skills
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean);
    } else {
      updates.skills = [];
    }
  }

  if (updates.skillRadar && typeof updates.skillRadar === 'object') {
    updates.skillRadar = Object.entries(updates.skillRadar).reduce((acc, [key, value]) => {
      acc[key] = Number(value);
      return acc;
    }, {});
  }

  const student = await Student.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  if (student) {
    if (!updates.name && (typeof req.body.firstName !== 'undefined' || typeof req.body.lastName !== 'undefined')) {
      const fullName = [student.firstName, student.lastName].filter(Boolean).join(' ').trim();
      if (fullName) {
        student.name = fullName;
      }
    }

    const requiredFields = ['avatarUrl', 'firstName', 'lastName', 'dateOfBirth', 'gender', 'college', 'phone', 'portfolioUrl', 'linkedinUrl'];
    const hasFilledRequired = requiredFields.every((field) => {
      const value = student[field];
      if (field === 'dateOfBirth') {
        return value instanceof Date && !Number.isNaN(value.getTime());
      }
      if (typeof value === 'string') {
        return value.trim().length > 0;
      }
      return Boolean(value);
    });

    const hasCodingLinks = Boolean((student.leetcodeUrl && student.leetcodeUrl.trim()) || (student.codingProfiles?.leetcode && student.codingProfiles.leetcode.trim())) &&
      Boolean((student.hackerrankUrl && student.hackerrankUrl.trim()) || (student.codingProfiles?.hackerrank && student.codingProfiles.hackerrank.trim()));

    const hasSkills = Array.isArray(student.skills) && student.skills.length > 0;

    student.isProfileComplete = hasFilledRequired && hasCodingLinks && hasSkills;
  }

  const { total, breakdown } = calculateReadinessScore(student);
  student.readinessScore = total;
  student.readinessHistory.push({ score: total });
  await student.save();

  res.json({
    student,
    readiness: {
      score: total,
      breakdown,
    },
  });
});

// Save/update coding profile usernames (LeetCode, HackerRank)
const updateCodingProfiles = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.user._id);
  if (!student) return res.status(404).json({ message: 'Student not found' });

  const { leetcode, hackerrank } = req.body || {};
  student.codingProfiles = {
    ...(student.codingProfiles || {}),
    leetcode: typeof leetcode === 'string' ? leetcode.trim() : (student.codingProfiles?.leetcode || ''),
    hackerrank: typeof hackerrank === 'string' ? hackerrank.trim() : (student.codingProfiles?.hackerrank || ''),
  };
  await student.save();

  res.json({ codingProfiles: student.codingProfiles });
});

// Sync coding activity from external platforms and add to codingLogs
const syncCodingActivity = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.user._id);
  if (!student) return res.status(404).json({ message: 'Student not found' });

  const leet = await fetchLeetCodeActivity(student.codingProfiles?.leetcode);
  const hr = await fetchHackerRankActivity(student.codingProfiles?.hackerrank);

  const newLogs = [];
  const toCodingLog = (source) => (act) => ({
    platform: source,
    activity: act.activity || 'Practice',
    minutesSpent: act.minutes || 0,
    problemsSolved: act.problemsSolved || 0,
    notes: act.notes || '',
    date: act.date ? new Date(act.date) : new Date(),
  });

  (leet.activities || []).map(toCodingLog('LeetCode')).forEach((l) => newLogs.push(l));
  (hr.activities || []).map(toCodingLog('HackerRank')).forEach((l) => newLogs.push(l));

  // Simple duplicate guard by date+platform+activity
  const existingKey = new Set(
    student.codingLogs.map((l) => `${new Date(l.date).toISOString().slice(0, 10)}|${l.platform}|${l.activity}`)
  );
  const uniqueLogs = newLogs.filter((l) => {
    const key = `${new Date(l.date).toISOString().slice(0, 10)}|${l.platform}|${l.activity}`;
    if (existingKey.has(key)) return false;
    existingKey.add(key);
    return true;
  });

  if (uniqueLogs.length > 0) {
    student.codingLogs.push(...uniqueLogs);
    student.lastActiveAt = new Date();
  }

  // Update streak and readiness score based on added logs
  const { total, breakdown } = calculateReadinessScore(student);
  student.readinessScore = total;
  student.readinessHistory.push({ score: total });
  student.codingProfiles = { ...(student.codingProfiles || {}), lastSyncedAt: new Date() };
  await student.save();

  res.json({
    added: uniqueLogs.length,
    leetcode: leet.summary,
    hackerrank: hr.summary,
    readiness: { score: total, breakdown },
    codingProfiles: student.codingProfiles,
  });
});

// Update LeetCode stats by username and recompute readiness
const updateLeetCodeStats = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { username } = req.body || {};

  const student = await Student.findById(id);
  if (!student) return res.status(404).json({ message: 'Student not found' });

  try {
    const stats = await fetchLeetCodeStats(username);
    student.leetcodeStats = stats;
    // Optionally persist username into codingProfiles
    student.codingProfiles = { ...(student.codingProfiles || {}), leetcode: username };

    const { total, breakdown } = calculateReadinessScore(student);
    student.readinessScore = total;
    student.readinessHistory.push({ score: total });
    await student.save();

    const safeStudent = await Student.findById(student._id);
    res.json({ student: safeStudent, readiness: { score: total, breakdown } });
  } catch (e) {
    res.status(400).json({ message: e?.message || 'Failed to update LeetCode stats' });
  }
});

const addProject = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.user._id);
  const project = {
    title: req.body.title,
    githubLink: req.body.githubLink,
    description: req.body.description,
    tags: req.body.tags || [],
    status: 'pending',
    verified: false,
  };

  student.projects.push(project);
  await student.save();

  const addedProject = student.projects[student.projects.length - 1];

  await Admin.updateMany(
    {},
    {
      $push: {
        pendingVerifications: {
          student: student._id,
          itemType: 'project',
          itemId: addedProject._id,
          title: addedProject.title,
        },
      },
    }
  );

  const { total, breakdown } = calculateReadinessScore(student);
  student.readinessScore = total;
  student.readinessHistory.push({ score: total });
  await student.save();

  res.status(201).json({
    message: 'Project submitted for review',
    project: addedProject,
    readiness: {
      score: total,
      breakdown,
    },
  });
});

const addCodingLog = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.user._id);
  const codingLog = {
    platform: req.body.platform,
    activity: req.body.activity,
    minutesSpent: req.body.minutesSpent,
    problemsSolved: req.body.problemsSolved,
    notes: req.body.notes,
    date: req.body.date || new Date(),
  };

  student.codingLogs.push(codingLog);
  student.lastActiveAt = new Date();
  await student.save();

  const { total, breakdown } = calculateReadinessScore(student);
  student.readinessScore = total;
  student.readinessHistory.push({ score: total });
  await student.save();

  res.status(201).json({
    message: 'Coding log added',
    codingLog: student.codingLogs[student.codingLogs.length - 1],
    readiness: {
      score: total,
      breakdown,
    },
  });
});

const addCertification = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.user._id);
  const certification = {
    name: req.body.name,
    provider: req.body.provider,
    fileLink: req.body.fileLink,
    issuedDate: req.body.issuedDate,
    status: 'pending',
  };

  student.certifications.push(certification);
  await student.save();

  const addedCertification = student.certifications[student.certifications.length - 1];

  await Admin.updateMany(
    {},
    {
      $push: {
        pendingVerifications: {
          student: student._id,
          itemType: 'certification',
          itemId: addedCertification._id,
          title: addedCertification.name,
        },
      },
    }
  );

  const { total, breakdown } = calculateReadinessScore(student);
  student.readinessScore = total;
  student.readinessHistory.push({ score: total });
  await student.save();

  res.status(201).json({
    message: 'Certification submitted for verification',
    certification: addedCertification,
    readiness: {
      score: total,
      breakdown,
    },
  });
});

const addEvent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.user._id);
  const event = {
    name: req.body.name,
    description: req.body.description,
    date: req.body.date,
    location: req.body.location,
    certificateLink: req.body.certificateLink,
    outcome: req.body.outcome,
    pointsAwarded: req.body.pointsAwarded,
    status: 'pending',
  };

  student.events.push(event);
  await student.save();

  const addedEvent = student.events[student.events.length - 1];

  await Admin.updateMany(
    {},
    {
      $push: {
        pendingVerifications: {
          student: student._id,
          itemType: 'event',
          itemId: addedEvent._id,
          title: addedEvent.name,
        },
      },
    }
  );

  const { total, breakdown } = calculateReadinessScore(student);
  student.readinessScore = total;
  student.readinessHistory.push({ score: total });
  await student.save();

  res.status(201).json({
    message: 'Event added successfully',
    event: addedEvent,
    readiness: {
      score: total,
      breakdown,
    },
  });
});

const getMentorSuggestions = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.user._id);
  if (!student) {
    return res.status(404).json({ message: 'Student not found' });
  }

  const { total, breakdown } = calculateReadinessScore(student);
  const studentData = student.toObject({ virtuals: true });

  try {
    const suggestions = await generateMentorSuggestions(studentData, {
      total,
      breakdown,
    });

    res.json({
      suggestions,
      readiness: {
        score: total,
        breakdown,
      },
    });
  } catch (error) {
    console.error('AI mentor suggestion error:', error);
    res.status(503).json({
      message: error.message || 'Unable to generate mentor suggestions at the moment.',
    });
  }
});

const getReadinessReport = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.user._id);

  const { total, breakdown } = calculateReadinessScore(student);
  student.readinessScore = total;
  student.readinessHistory.push({ score: total });
  await student.save();

  res.json({
    student,
    readiness: {
      score: total,
      breakdown,
    },
  });
});

const listStudents = asyncHandler(async (req, res) => {
  const { skills, minScore, college } = req.query;

  const filter = {};
  if (minScore) {
    filter.readinessScore = { $gte: Number(minScore) };
  }
  if (college) {
    filter.college = new RegExp(college, 'i');
  }
  if (skills) {
    const skillArray = skills.split(',').map((skill) => skill.trim().toLowerCase());
    filter['projects.tags'] = { $all: skillArray };
  }

  const students = await Student.find(filter).select('-codingLogs');
  res.json(students);
});

// Public leaderboard: top students by readinessScore (with sensible tiebreakers)
const getLeaderboard = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 100);

  const students = await Student.find({})
    .select('name college readinessScore streakDays projects badges avatarUrl')
    .lean();

  const withDerived = students
    .map((s) => ({
      _id: s._id,
      name: s.name,
      college: s.college || '',
      readinessScore: Number(s.readinessScore) || 0,
      streakDays: Number(s.streakDays) || 0,
      projects: Array.isArray(s.projects) ? s.projects : [],
      badges: Array.isArray(s.badges) ? s.badges : [],
      avatarUrl: s.avatarUrl || '',
      verifiedProjectsCount: Array.isArray(s.projects)
        ? s.projects.filter((p) => p.status === 'verified' || p.verified).length
        : 0,
    }))
    .sort((a, b) => {
      if (b.readinessScore !== a.readinessScore) return b.readinessScore - a.readinessScore;
      if (b.streakDays !== a.streakDays) return b.streakDays - a.streakDays;
      return b.verifiedProjectsCount - a.verifiedProjectsCount;
    })
    .slice(0, limit)
    .map((s, idx) => ({
      id: String(s._id),
      rank: idx + 1,
      name: s.name,
      college: s.college,
      score: s.readinessScore,
      streak: s.streakDays,
      projects: s.verifiedProjectsCount,
      badges: s.badges, // array of strings
      avatarUrl: s.avatarUrl,
      achievements: `${s.verifiedProjectsCount} Verified Projects • ${s.streakDays} Day Streak`,
    }));

  res.json({ leaderboard: withDerived });
});

const getStudentById = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) {
    return res.status(404).json({ message: 'Student not found' });
  }
  res.json(student);
});

const deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) {
    return res.status(404).json({ message: 'Student not found' });
  }

  await student.deleteOne();
  res.json({ message: 'Student removed successfully' });
});

// Update Project
const updateProject = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.user._id);
  const projectId = req.params.projectId;

  const project = student.projects.id(projectId);
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  // Update fields
  if (req.body.title) project.title = req.body.title;
  if (req.body.githubLink !== undefined) project.githubLink = req.body.githubLink;
  if (req.body.description !== undefined) project.description = req.body.description;
  if (req.body.tags) project.tags = req.body.tags;

  await student.save();

  // Recalculate readiness score
  const { total, breakdown } = calculateReadinessScore(student);
  student.readinessScore = total;
  await student.save();

  res.json({
    message: 'Project updated successfully',
    project,
    readiness: { score: total, breakdown },
  });
});

// Delete Project
const deleteProject = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.user._id);
  const projectId = req.params.projectId;

  const project = student.projects.id(projectId);
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  project.deleteOne();
  await student.save();

  // Recalculate readiness score
  const { total, breakdown } = calculateReadinessScore(student);
  student.readinessScore = total;
  await student.save();

  res.json({
    message: 'Project deleted successfully',
    readiness: { score: total, breakdown },
  });
});

// Update Certification
const updateCertification = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.user._id);
  const certId = req.params.certId;

  const cert = student.certifications.id(certId);
  if (!cert) {
    return res.status(404).json({ message: 'Certification not found' });
  }

  // Update fields
  if (req.body.name) cert.name = req.body.name;
  if (req.body.provider !== undefined) cert.provider = req.body.provider;
  if (req.body.certificateId !== undefined) cert.certificateId = req.body.certificateId;
  if (req.body.issuedDate !== undefined) cert.issuedDate = req.body.issuedDate;
  if (req.body.fileLink !== undefined) cert.fileLink = req.body.fileLink;

  await student.save();

  // Recalculate readiness score
  const { total, breakdown } = calculateReadinessScore(student);
  student.readinessScore = total;
  await student.save();

  res.json({
    message: 'Certification updated successfully',
    certification: cert,
    readiness: { score: total, breakdown },
  });
});

// Delete Certification
const deleteCertification = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.user._id);
  const certId = req.params.certId;

  const cert = student.certifications.id(certId);
  if (!cert) {
    return res.status(404).json({ message: 'Certification not found' });
  }

  cert.deleteOne();
  await student.save();

  // Recalculate readiness score
  const { total, breakdown } = calculateReadinessScore(student);
  student.readinessScore = total;
  await student.save();

  res.json({
    message: 'Certification deleted successfully',
    readiness: { score: total, breakdown },
  });
});

// Update Event
const updateEvent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.user._id);
  const eventId = req.params.eventId;

  const event = student.events.id(eventId);
  if (!event) {
    return res.status(404).json({ message: 'Event not found' });
  }

  // Update fields
  if (req.body.name) event.name = req.body.name;
  if (req.body.description !== undefined) event.description = req.body.description;
  if (req.body.date !== undefined) event.date = req.body.date;
  if (req.body.location !== undefined) event.location = req.body.location;
  if (req.body.certificateLink !== undefined) event.certificateLink = req.body.certificateLink;
  if (req.body.outcome !== undefined) event.outcome = req.body.outcome;

  await student.save();

  // Recalculate readiness score
  const { total, breakdown } = calculateReadinessScore(student);
  student.readinessScore = total;
  await student.save();

  res.json({
    message: 'Event updated successfully',
    event,
    readiness: { score: total, breakdown },
  });
});

// Delete Event
const deleteEvent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.user._id);
  const eventId = req.params.eventId;

  const event = student.events.id(eventId);
  if (!event) {
    return res.status(404).json({ message: 'Event not found' });
  }

  event.deleteOne();
  await student.save();

  // Recalculate readiness score
  const { total, breakdown } = calculateReadinessScore(student);
  student.readinessScore = total;
  await student.save();

  res.json({
    message: 'Event deleted successfully',
    readiness: { score: total, breakdown },
  });
});

const buildLocalResumeAnalysis = (resumeText = '', targetRole = 'Software Engineer') => {
  const normalized = resumeText.replace(/\s+/g, ' ').trim();
  const wordCount = normalized ? normalized.split(' ').length : 0;
  const bulletCount = (resumeText.match(/(?:\n|^)\s*(?:[-•*])/g) || []).length;
  const uppercaseHeadings = (resumeText.match(/\n[A-Z ]{4,}\n/g) || []).length;

  const keywordBank = {
    generic: ['leadership', 'communication', 'teamwork', 'problem solving', 'agile'],
    software: ['javascript', 'typescript', 'react', 'node', 'python', 'api', 'cloud', 'docker'],
    data: ['sql', 'data analysis', 'machine learning', 'pandas'],
  };

  const roleKey = targetRole?.toLowerCase().includes('data') ? 'data' : 'software';
  const targetKeywords = [...keywordBank.generic, ...keywordBank[roleKey]];
  const presentKeywords = targetKeywords.filter((kw) =>
    resumeText.toLowerCase().includes(kw.toLowerCase())
  );
  const missingKeywords = targetKeywords.filter((kw) =>
    !presentKeywords.includes(kw)
  ).slice(0, 8);

  const coverage = (presentKeywords.length / targetKeywords.length) * 100;
  const lengthScore = Math.min(40, Math.max(10, Math.round(wordCount / 20)));
  const bulletScore = Math.min(20, bulletCount * 3);
  const headingScore = Math.min(10, uppercaseHeadings * 2);
  const overallScore = Math.min(100, Math.round(lengthScore + bulletScore + headingScore + coverage * 0.3));
  const atsScore = Math.min(100, Math.round((coverage * 0.6) + bulletScore + headingScore));

  const strengths = [];
  if (bulletCount > 5) strengths.push('Uses bullet points to keep achievements scannable.');
  if (presentKeywords.length > targetKeywords.length * 0.4) strengths.push('Includes several role-specific keywords.');
  if (wordCount >= 250) strengths.push('Resume contains sufficient content for ATS parsing.');

  const weaknesses = [];
  if (bulletCount < 3) weaknesses.push('Add more bullet points to highlight quantifiable impact.');
  if (presentKeywords.length < targetKeywords.length * 0.4) weaknesses.push('Include additional keywords for ' + targetRole + '.');
  if (wordCount < 200) weaknesses.push('Expand on experience details to reach at least one full page.');

  const suggestions = [
    'Mirror exact keywords from the job description to boost ATS alignment.',
    'Start each bullet with an action verb and quantify results.',
    'Group skills into categories (Languages, Frameworks, Tools) for easy parsing.',
    'Ensure consistent fonts and avoid tables/columns which confuse ATS.',
    'Keep file format as PDF with simple layout and standard section headers.',
  ];

  const sections = [
    {
      name: 'Summary',
      score: Math.min(100, Math.max(40, overallScore - 10)),
      feedback: 'Keep a 2-3 line summary focusing on impact and role-specific keywords.',
    },
    {
      name: 'Experience',
      score: Math.min(100, Math.round((bulletScore + lengthScore) * 0.8)),
      feedback: 'Highlight achievements using STAR format and measurable outcomes.',
    },
    {
      name: 'Skills',
      score: Math.min(100, Math.round(presentKeywords.length / targetKeywords.length * 100)),
      feedback: 'Split skills into categories and align terminology with job postings.',
    },
  ];

  return {
    overallScore,
    atsScore,
    atsInsights: [
      `Keyword coverage: ${presentKeywords.length}/${targetKeywords.length} targeted terms detected.`,
      bulletCount >= 5
        ? 'Good bullet usage helps ATS keep entries structured.'
        : 'Add more bullet points per role to improve parser readability.',
      uppercaseHeadings >= 2
        ? 'Standard headings detected—keep them consistent.'
        : 'Use clear headings like EXPERIENCE, EDUCATION, SKILLS so ATS can map sections.',
    ],
    strengths: strengths.length ? strengths : ['Resume content analyzed successfully.'],
    weaknesses,
    suggestions,
    sections,
    keywords: {
      present: presentKeywords.slice(0, 12),
      missing,
    },
    formatting: {
      score: Math.min(100, atsScore),
      issues: bulletCount < 3
        ? ['Increase bullet usage to help ATS line-by-line parsing.']
        : ['Ensure fonts remain consistent and avoid text boxes.'],
    },
  };
};

// Analyze Resume with Groq AI
const analyzeResume = asyncHandler(async (req, res) => {
  const { resumeText, targetRole } = req.body;

  if (!resumeText || !resumeText.trim()) {
    return res.status(400).json({ message: 'Resume text is required' });
  }

  const buildAndReturnLocal = (message) => {
    const analysis = buildLocalResumeAnalysis(resumeText, targetRole || 'Software Engineer');
    return res.json({
      message: message || 'Generated analysis using heuristic ATS scoring.',
      analysis,
      warning: 'GROQ_API_KEY is missing, so a local heuristic score was used. Add the key for richer AI insights.',
    });
  };

  if (!process.env.GROQ_API_KEY) {
    return buildAndReturnLocal('AI key missing. Returned heuristic analysis.');
  }

  try {
    const Groq = require('groq-sdk');
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const prompt = `You are an expert resume reviewer and career coach. Analyze the following resume for a ${targetRole || 'Software Engineer'} position.

RESUME:
${resumeText}

Please provide a comprehensive analysis in the following JSON format:
{
  "overallScore": <number 0-100>,
  "atsScore": <number 0-100>,
  "atsInsights": [<list of 3 concise bullets explaining ATS compatibility status>],
  "strengths": [<list of 3-5 strengths>],
  "weaknesses": [<list of 3-5 weaknesses>],
  "suggestions": [<list of 5-7 actionable suggestions to improve the resume>],
  "sections": [
    {
      "name": "<section name like Summary, Experience, Education, Skills>",
      "score": <number 0-100>,
      "feedback": "<brief feedback>"
    }
  ],
  "keywords": {
    "present": [<list of important keywords found>],
    "missing": [<list of important keywords that should be added>]
  },
  "formatting": {
    "score": <number 0-100>,
    "issues": [<list of formatting issues if any>]
  }
}

Focus on:
1. ATS (Applicant Tracking System) compatibility
2. Relevant keywords for ${targetRole || 'Software Engineer'}
3. Quantifiable achievements
4. Clear structure and formatting
5. Action verbs and impact statements
6. Education and certifications relevance
7. Technical skills presentation

Provide ONLY the JSON response, no additional text.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 2500,
    });

    const responseText = chatCompletion.choices[0]?.message?.content || '{}';

    // Extract JSON from response (in case there's extra text)
    let analysis;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseText);
      // Provide fallback structure
      analysis = {
        overallScore: 70,
        atsScore: 65,
        atsInsights: [
          'ATS compatibility could not be fully assessed due to formatting issues',
          'Ensure your resume uses standard section headings so parsers can extract data',
          'Convert the document to plain text or a simple PDF before re-running the check'
        ],
        strengths: ['Resume submitted for analysis'],
        weaknesses: ['Unable to fully analyze - please check formatting'],
        suggestions: ['Ensure resume is in plain text format', 'Include clear section headers', 'Add quantifiable achievements'],
        sections: [],
        keywords: { present: [], missing: [] },
        formatting: { score: 50, issues: ['Analysis incomplete'] }
      };
    }

    if (typeof analysis.atsScore !== 'number') {
      const fallbackScore = typeof analysis.formatting?.score === 'number'
        ? analysis.formatting.score
        : analysis.overallScore ?? 70;
      analysis.atsScore = Math.max(0, Math.min(100, Math.round(fallbackScore)));
    }

    if (!Array.isArray(analysis.atsInsights)) {
      analysis.atsInsights = [
        'ATS summary unavailable from AI response. Ensure standard headings (Summary, Experience, Education, Skills).',
        'Use simple fonts and avoid tables/columns so applicant tracking systems can parse your resume.',
        'Include relevant keywords for the ' + (targetRole || 'Software Engineer') + ' role inside bullet points.'
      ];
    }

    res.json({
      message: 'Resume analyzed successfully',
      analysis,
    });
  } catch (error) {
    console.error('Groq AI Error:', error);

    // Check if it's a Groq internal server error
    if (error.status === 500 || error.message.includes('Internal Server Error')) {
      console.log('Groq API is experiencing issues. Providing fallback response.');

      // Provide a basic analysis based on resume length and structure
      const basicAnalysis = {
        overallScore: 75,
        atsScore: 72,
        atsInsights: [
          'Resume structure appears mostly ATS-friendly with standard headings',
          'Re-run analysis later to confirm keyword coverage once AI service is available',
          'Use bullet lists and consistent fonts to keep parser accuracy high'
        ],
        strengths: [
          'Resume has been submitted for review',
          'Document contains sufficient content',
          'Basic structure appears present'
        ],
        weaknesses: [
          'AI analysis temporarily unavailable',
          'Please try again in a few moments'
        ],
        suggestions: [
          'Use action verbs to describe your accomplishments (e.g., "Developed", "Led", "Implemented")',
          'Quantify achievements with numbers and metrics where possible',
          'Include relevant keywords for the ' + (targetRole || 'Software Engineer') + ' role',
          'Keep bullet points concise and impactful',
          'Ensure consistent formatting throughout the document',
          'Try analyzing again in a few minutes when AI service is available'
        ],
        sections: [
          { name: 'Content', score: 75, feedback: 'Resume contains adequate content. AI detailed analysis temporarily unavailable.' },
          { name: 'Structure', score: 70, feedback: 'Document structure appears reasonable. Detailed feedback pending AI availability.' }
        ],
        keywords: {
          present: ['Resume keywords will be analyzed when AI service is available'],
          missing: ['Keyword analysis pending']
        },
        formatting: {
          score: 70,
          issues: ['AI analysis temporarily unavailable - please try again shortly']
        }
      };

      return res.json({
        message: 'AI service temporarily unavailable. Providing basic analysis.',
        analysis: basicAnalysis,
        warning: 'Groq AI is experiencing high demand. Please try again in a few minutes for detailed analysis.'
      });
    }

    if (!process.env.GROQ_API_KEY) {
      return buildAndReturnLocal('AI key missing. Returned heuristic analysis.');
    }

    if (!error.status || error.status >= 500) {
      const analysis = buildLocalResumeAnalysis(resumeText, targetRole || 'Software Engineer');
      return res.json({
        message: 'AI service unavailable. Provided heuristic analysis instead.',
        analysis,
        warning: error.message,
      });
    }

    const analysis = buildLocalResumeAnalysis(resumeText, targetRole || 'Software Engineer');
    return res.json({
      message: 'Failed to reach Groq AI. Provided heuristic analysis instead.',
      analysis,
      warning: error.message,
      suggestion: 'Retry once network or AI service is stable for richer guidance.'
    });
  }
});

// Extract text from PDF resume
const extractResumeText = asyncHandler(async (req, res) => {
  console.log('Extract resume text called');
  console.log('File received:', req.file ? 'Yes' : 'No');

  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  console.log('File details:', {
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    bufferLength: req.file.buffer ? req.file.buffer.length : 0
  });

  try {
    const pdfParse = await loadPdfParse();
    const bufferCopy = Buffer.from(req.file.buffer);
    const data = await pdfParse(bufferCopy);

    console.log('PDF parsed successfully, pages:', data.numpages);
    console.log('Text length:', data.text ? data.text.length : 0);

    const text = data.text;

    // IMPORTANT: Fix for memory leak/shared state in pdf-parse library
    // The library uses a shared result object that appends pages across requests.
    // We must manually clear it after each use.
    if (data && data.pages && Array.isArray(data.pages)) {
      data.pages.length = 0;
    }

    if (!text || text.trim().length === 0) {
      console.log('No text extracted from PDF');
      return res.status(400).json({ message: 'No text could be extracted from the PDF. This might be an image-based PDF.' });
    }

    console.log('Text extracted successfully, length:', text.trim().length);

    // Clear the buffer immediately after use
    req.file.buffer = null;
    req.file = null;

    res.json({
      message: 'Text extracted successfully',
      text: text.trim(),
      pages: data.numpages,
    });
  } catch (error) {
    console.error('PDF parsing error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    // Provide more specific error message
    let errorMessage = 'Failed to parse PDF file';
    if (error.message.includes('Invalid PDF')) {
      errorMessage = 'The uploaded file is not a valid PDF or is corrupted';
    } else if (error.message.includes('password')) {
      errorMessage = 'This PDF is password-protected and cannot be processed';
    }

    return res.status(500).json({
      message: errorMessage,
      error: error.message,
      details: 'Please try a different PDF file or use the "Paste Text" option'
    });
  }
});

const importLinkedInProfile = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No LinkedIn PDF uploaded' });
  }

  try {
    const pdfParse = await loadPdfParse();
    const data = await pdfParse(req.file.buffer);
    const text = data.text ? data.text.trim() : '';

    // IMPORTANT: Fix for shared state in pdf-parse library
    if (data && data.pages && Array.isArray(data.pages)) {
      data.pages.length = 0;
    }

    if (!text) {
      return res.status(400).json({ message: 'Unable to extract text from the uploaded PDF' });
    }

    const profile = parseLinkedInPdf(text);
    const filledFields = Object.entries(profile)
      .filter(([key, value]) => [
        'name',
        'firstName',
        'lastName',
        'headline',
        'summary',
        'location',
        'city',
        'state',
        'country',
        'phone',
        'linkedinUrl',
        'skills',
      ].includes(key) && value && (Array.isArray(value) ? value.length : true))
      .map(([key]) => key);

    res.json({
      profile,
      meta: {
        pages: data.numpages,
        fieldsDetected: filledFields,
      },
    });
  } catch (error) {
    console.error('LinkedIn PDF parsing error:', error);
    return res.status(500).json({
      message: 'Failed to parse LinkedIn PDF. Please ensure it is exported from LinkedIn and try again.',
      error: error.message,
    });
  }
});

module.exports = {
  signup,
  login,
  getProfile,
  updateProfile,
  addProject,
  updateProject,
  deleteProject,
  addCodingLog,
  addCertification,
  updateCertification,
  deleteCertification,
  addEvent,
  updateEvent,
  deleteEvent,
  getMentorSuggestions,
  analyzeResume,
  extractResumeText,
  getReadinessReport,
  listStudents,
  getStudentById,
  deleteStudent,
  getLeaderboard,
  updateCodingProfiles,
  syncCodingActivity,
  updateLeetCodeStats,
  importLinkedInProfile,
};
