const Student = require('../models/Student');
const Admin = require('../models/Admin');
const asyncHandler = require('../utils/asyncHandler');
const { generateToken } = require('../utils/authMiddleware');
const { calculateReadinessScore } = require('../utils/readinessScore');
const { generateMentorSuggestions } = require('../utils/aiMentor');
const { fetchLeetCodeActivity, fetchHackerRankActivity } = require('../utils/codingIntegrations');
const { fetchLeetCodeStats } = require('../utils/leetcode');
const { parseLinkedInPdf } = require('../utils/linkedinParser');
const { fetchGitHubData, extractGitHubUsername, calculateGitHubActivityScore } = require('../utils/githubIntegration');
const { updateValidatedSkills } = require('../utils/skillValidation');
const { syncGitHubData } = require('../jobs/githubSyncJob');
const { parsePdfBuffer } = require('../utils/pdfParserUtil');

let cachedPdfParse = null;

const loadPdfParse = async () => {
  if (cachedPdfParse) {
    return cachedPdfParse;
  }
  try {
    // pdf-parse exports a function that takes a buffer
    const pdfParse = require('pdf-parse');

    // pdf-parse.default is the actual parser function
    if (typeof pdfParse === 'function') {
      cachedPdfParse = pdfParse;
    } else if (typeof pdfParse.default === 'function') {
      cachedPdfParse = pdfParse.default;
    } else {
      throw new Error('pdf-parse module exported invalid type');
    }

    return cachedPdfParse;
  } catch (err) {
    console.error('Failed to load pdf-parse:', err.message);
    throw new Error(`Cannot load PDF parser: ${err.message}`);
  }
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
  const { email, githubUsername } = req.body;

  const existing = await Student.findOne({ email });
  if (existing) {
    return res.status(409).json({ message: 'Student already registered with this email' });
  }

  const student = new Student(req.body);

  // Check if GitHub OAuth data exists in cookies (from OAuth flow)
  const githubOAuthData = req.cookies?.github_oauth_data;
  if (githubOAuthData) {
    try {
      const oauthData = JSON.parse(githubOAuthData);

      // Link GitHub via OAuth
      student.githubAuth = {
        githubId: oauthData.githubId,
        username: oauthData.username,
        avatarUrl: oauthData.avatarUrl,
        encryptedAccessToken: oauthData.encryptedToken,
        connectedAt: new Date(),
        authType: 'oauth',
        lastVerifiedAt: new Date(),
      };

      student.githubUrl = `https://github.com/${oauthData.username}`;

      // Use GitHub avatar if no avatar provided
      if (!student.avatarUrl && oauthData.avatarUrl) {
        student.avatarUrl = oauthData.avatarUrl;
      }

      // Clear the OAuth cookie
      res.clearCookie('github_oauth_data');

      // Attempt to sync GitHub data immediately
      try {
        const githubStats = await fetchGitHubData(oauthData.username);
        student.githubStats = githubStats;
      } catch (syncError) {
        console.error('GitHub sync during signup failed:', syncError);
        // Continue with signup even if sync fails
      }

    } catch (error) {
      console.error('Error processing GitHub OAuth data during signup:', error);
      // Continue with signup without GitHub
    }
  } else if (githubUsername) {
    // Manual GitHub username provided (fallback)
    const sanitizedUsername = githubUsername.trim().replace(/[^a-zA-Z0-9-]/g, '');
    if (sanitizedUsername) {
      student.githubAuth = {
        username: sanitizedUsername,
        authType: 'manual',
        connectedAt: new Date(),
      };
      student.githubUrl = `https://github.com/${sanitizedUsername}`;

      // Try to fetch GitHub stats (non-blocking)
      try {
        const githubStats = await fetchGitHubData(sanitizedUsername);
        student.githubStats = githubStats;
        student.githubAuth.avatarUrl = githubStats.avatarUrl;
      } catch (error) {
        console.error('GitHub fetch during manual signup failed:', error);
        // Continue without stats
      }
    }
  }

  await student.save();

  // Update validated skills if GitHub was connected
  if (student.githubAuth?.username) {
    try {
      await updateValidatedSkills(student);
    } catch (error) {
      console.error('Skill validation during signup failed:', error);
    }
  }

  const { total, breakdown } = calculateReadinessScore(student);
  student.readinessScore = total;
  student.readinessHistory.push({ score: total });

  // Add growth timeline entry if GitHub was connected
  if (student.githubAuth?.authType === 'oauth') {
    student.growthTimeline.push({
      date: new Date(),
      readinessScore: total,
      reason: 'GitHub account connected via OAuth during signup',
    });
  } else if (student.githubAuth?.username) {
    student.growthTimeline.push({
      date: new Date(),
      readinessScore: total,
      reason: `GitHub username linked during signup: ${student.githubAuth.username}`,
    });
  }

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
    student.codingLogs.map((l) => `${new Date(l.date).toISOString().slice(0,10)}|${l.platform}|${l.activity}`)
  );
  const uniqueLogs = newLogs.filter((l) => {
    const key = `${new Date(l.date).toISOString().slice(0,10)}|${l.platform}|${l.activity}`;
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

  // Add growth timeline entry if new logs were synced
  if (uniqueLogs.length > 0) {
    student.growthTimeline.push({
      date: new Date(),
      readinessScore: total,
      reason: `Coding activity synced: ${uniqueLogs.length} new log(s) from LeetCode and HackerRank`,
    });
  }

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
    console.error('Groq AI Error:', error.message);

    // For any error, provide fallback analysis instead of throwing 500
    const analysis = buildLocalResumeAnalysis(resumeText, targetRole || 'Software Engineer');

    let message = 'Using offline analysis';
    let warning = '';

    if (error.status === 429) {
      message = 'Groq API rate limited. Using offline analysis.';
      warning = 'Please try again in a few minutes.';
    } else if (error.status === 500 || error.message.includes('Internal Server Error')) {
      message = 'Groq API temporarily unavailable. Using offline analysis.';
      warning = 'Try again shortly when service is back.';
    } else if (error.message.includes('Network')) {
      message = 'Network error. Using offline analysis.';
      warning = 'Check your internet connection and try again.';
    }

    return res.json({
      message,
      analysis,
      warning: warning || 'AI analysis temporarily unavailable. Results based on local analysis.',
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
    if (!req.file.buffer || req.file.buffer.length === 0) {
      return res.status(400).json({
        message: 'File buffer is empty. Please try uploading again.'
      });
    }

    const data = await parsePdfBuffer(req.file.buffer);

    console.log('PDF parsed successfully, pages:', data.numpages);
    console.log('Text length:', data.text ? data.text.length : 0);

    const text = data.text;

    if (!text || text.trim().length === 0) {
      console.log('No text extracted from PDF');
      return res.status(400).json({
        message: 'No text could be extracted from the PDF. This might be an image-based PDF or a corrupted file. Try using Paste Text instead.'
      });
    }

    console.log('Text extracted successfully, length:', text.trim().length);

    res.json({
      message: 'Text extracted successfully',
      text: text.trim(),
      pages: data.numpages,
    });
  } catch (error) {
    console.error('PDF extraction error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    let errorMessage = 'Failed to parse PDF file';
    let userFriendlyMessage = 'The PDF file could not be processed. ';

    if (error.message.includes('Cannot load PDF parser')) {
      userFriendlyMessage = 'PDF parser initialization failed. Please try uploading again.';
    } else if (error.message.includes('Invalid PDF') || error.message.includes('startxref') || error.message.includes('EOF')) {
      userFriendlyMessage += 'The uploaded file is not a valid PDF or is corrupted. Please try a different file or use "Paste Text".';
    } else if (error.message.includes('password')) {
      userFriendlyMessage += 'This PDF is password-protected. Please remove the password protection or use "Paste Text".';
    } else if (error.message.includes('image') || error.message.includes('scanned')) {
      userFriendlyMessage += 'This appears to be a scanned/image-based PDF. Please use "Paste Text" instead.';
    } else if (error.message.includes('buffer') || error.message.includes('empty')) {
      userFriendlyMessage += 'File upload failed. Please try uploading again.';
    } else {
      userFriendlyMessage += error.message || 'Please try a different PDF file or use "Paste Text".';
    }

    return res.status(500).json({
      message: errorMessage,
      details: userFriendlyMessage,
      error: error.message,
    });
  }
});

// Parse resume and auto-fill profile using AI
const parseAndAutofillResume = asyncHandler(async (req, res) => {
  console.log('Parse and autofill resume called');
  console.log('File received:', req.file ? 'Yes' : 'No');

  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    // Extract text from PDF
    const data = await parsePdfBuffer(req.file.buffer);

    const resumeText = data.text?.trim();

    if (!resumeText || resumeText.length === 0) {
      return res.status(400).json({
        message: 'No text could be extracted from the PDF. This might be an image-based PDF.'
      });
    }

    console.log('Resume text extracted, length:', resumeText.length);

    // Parse resume using AI
    const Groq = await loadGroqSDK();
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const parsePrompt = `You are an intelligent resume parser.

Extract the following details from the resume text below and return ONLY valid JSON.

Fields to extract:
- fullName (string)
- email (string)
- phone (string)
- location (string)
- headline (string - professional title or summary)
- summary (string - about/profile section)
- skills (array of strings - technical and soft skills)
- college (string - most recent educational institution)
- branch (string - field of study/major)
- graduationYear (number - year of graduation)
- cgpa (number - GPA or percentage, normalize to 10-point scale if needed)
- linkedinUrl (string - if present)
- githubUrl (string - if present)
- portfolioUrl (string - personal website if present)
- projects (array of objects with: title, description, githubLink, tags[])
- certifications (array of objects with: name, provider, issuedDate)

Rules:
1. Extract only what is clearly present in the resume
2. Use null for missing fields
3. Normalize URLs to full format
4. For CGPA: if percentage is given, convert to 10-point scale (e.g., 85% = 8.5/10)
5. Extract relevant skills including programming languages, frameworks, tools
6. Return ONLY the JSON object, no additional text

Resume Text:
"""
${resumeText}
"""`;

    console.log('Sending resume to AI for parsing...');

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: parsePrompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 2000,
    });

    const aiResponse = completion.choices?.[0]?.message?.content?.trim();
    console.log('AI Response received, length:', aiResponse?.length);

    if (!aiResponse) {
      return res.status(500).json({ message: 'Failed to parse resume with AI' });
    }

    // Extract JSON from response (in case AI adds markdown formatting)
    let parsedData;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : aiResponse;
      parsedData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.log('AI Response:', aiResponse);
      return res.status(500).json({
        message: 'Failed to parse AI response',
        error: parseError.message
      });
    }

    console.log('Parsed data:', JSON.stringify(parsedData, null, 2));

    // Prepare update payload
    const updatePayload = {};

    if (parsedData.fullName) {
      const nameParts = parsedData.fullName.trim().split(' ');
      if (nameParts.length > 0) {
        updatePayload.firstName = nameParts[0];
        updatePayload.lastName = nameParts.slice(1).join(' ') || nameParts[0];
        updatePayload.name = parsedData.fullName;
      }
    }

    if (parsedData.phone) updatePayload.phone = parsedData.phone;
    if (parsedData.location) updatePayload.location = parsedData.location;
    if (parsedData.headline) updatePayload.headline = parsedData.headline;
    if (parsedData.summary) updatePayload.summary = parsedData.summary;
    if (parsedData.college) updatePayload.college = parsedData.college;
    if (parsedData.branch) updatePayload.branch = parsedData.branch;
    if (parsedData.graduationYear) updatePayload.graduationYear = parsedData.graduationYear;
    if (parsedData.cgpa) updatePayload.cgpa = parsedData.cgpa;
    if (parsedData.linkedinUrl) updatePayload.linkedinUrl = parsedData.linkedinUrl;
    if (parsedData.githubUrl) updatePayload.githubUrl = parsedData.githubUrl;
    if (parsedData.portfolioUrl) updatePayload.portfolioUrl = parsedData.portfolioUrl;

    if (parsedData.skills && Array.isArray(parsedData.skills)) {
      updatePayload.skills = parsedData.skills;
    }

    // Update student profile
    const student = await Student.findById(req.user.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    Object.assign(student, updatePayload);

    // Add projects if extracted
    if (parsedData.projects && Array.isArray(parsedData.projects)) {
      parsedData.projects.forEach(project => {
        if (project.title) {
          student.projects.push({
            title: project.title,
            description: project.description || '',
            githubLink: project.githubLink || '',
            tags: project.tags || [],
            status: 'pending',
          });
        }
      });
    }

    // Add certifications if extracted
    if (parsedData.certifications && Array.isArray(parsedData.certifications)) {
      parsedData.certifications.forEach(cert => {
        if (cert.name) {
          student.certifications.push({
            name: cert.name,
            provider: cert.provider || '',
            issuedDate: cert.issuedDate || null,
            status: 'pending',
          });
        }
      });
    }

    await student.save();

    console.log('Profile updated successfully with parsed data');

    res.json({
      message: 'Resume parsed and profile updated successfully',
      parsedData: parsedData,
      updatedFields: Object.keys(updatePayload),
      projectsAdded: parsedData.projects?.length || 0,
      certificationsAdded: parsedData.certifications?.length || 0,
    });

  } catch (error) {
    console.error('Resume parsing error:', error);
    return res.status(500).json({
      message: 'Failed to parse resume',
      error: error.message
    });
  } finally {
    // Clear buffer
    if (req.file) {
      req.file.buffer = null;
      req.file = null;
    }
  }
});

const importLinkedInProfile = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No LinkedIn PDF uploaded' });
  }

  try {
    const data = await parsePdfBuffer(req.file.buffer);
    const text = data.text ? data.text.trim() : '';
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

/**
 * Sync GitHub profile and update student data
 * POST /api/students/github-sync
 */
const syncGitHubProfile = asyncHandler(async (req, res) => {
  const { githubUsername, githubUrl } = req.body;

  if (!githubUsername && !githubUrl) {
    return res.status(400).json({
      message: 'Either githubUsername or githubUrl is required'
    });
  }

  // Rate limiting: Check last sync time
  const student = await Student.findById(req.user.id);
  if (!student) {
    return res.status(404).json({ message: 'Student not found' });
  }

  const lastSyncedAt = student.githubStats?.lastSyncedAt;
  if (lastSyncedAt) {
    const hoursSinceLastSync = (Date.now() - lastSyncedAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastSync < 1) {
      return res.status(429).json({
        message: 'GitHub sync rate limit exceeded. Please wait at least 1 hour between syncs.',
        nextSyncAvailable: new Date(lastSyncedAt.getTime() + 60 * 60 * 1000),
      });
    }
  }

  try {
    // Extract username from URL if provided
    const username = githubUrl ? extractGitHubUsername(githubUrl) : githubUsername;

    if (!username) {
      return res.status(400).json({
        message: 'Invalid GitHub username or URL format'
      });
    }

    // Fetch GitHub data
    const githubData = await fetchGitHubData(username);

    // Update GitHub stats in student profile
    student.githubStats = {
      username: githubData.username,
      avatarUrl: githubData.avatarUrl,
      bio: githubData.bio,
      totalRepos: githubData.totalRepos,
      topLanguages: githubData.topLanguages,
      topRepos: githubData.topRepos,
      activityScore: githubData.activityScore,
      lastSyncedAt: new Date(),
    };

    // Update validated skills with GitHub data
    student.validatedSkills = updateValidatedSkills(student);

    // Add growth timeline entry for GitHub sync
    student.growthTimeline.push({
      date: new Date(),
      readinessScore: student.readinessScore,
      reason: `GitHub profile synced: ${githubData.totalRepos} repositories, ${githubData.topLanguages.length} languages`,
    });

    // Recalculate readiness score (optionally incorporate GitHub activity)
    const { total, breakdown } = calculateReadinessScore(student);

    // Add GitHub activity bonus (max 5 points)
    const githubBonus = Math.min(5, githubData.activityScore / 20);
    student.readinessScore = Math.min(100, total + githubBonus);

    await student.save();

    res.json({
      success: true,
      message: 'GitHub profile synced successfully',
      githubStats: student.githubStats,
      validatedSkills: student.validatedSkills,
      readinessScore: student.readinessScore,
      readinessBreakdown: {
        ...breakdown,
        githubActivity: githubBonus,
      },
      trustBadges: student.trustBadges,
    });
  } catch (error) {
    console.error('GitHub sync error:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        message: 'GitHub user not found. Please check the username.',
      });
    }

    if (error.message.includes('rate limit')) {
      return res.status(429).json({
        message: 'GitHub API rate limit exceeded. Please try again later.',
      });
    }

    if (error.message.includes('Forbidden')) {
      return res.status(403).json({
        message: 'GitHub API access denied. The repository may be private or restricted.',
      });
    }

    res.status(500).json({
      message: 'Failed to sync GitHub profile',
      error: error.message,
    });
  }
});

/**
 * Sync GitHub Data - Manually trigger GitHub data sync
 * POST /api/students/sync-github
 */
const syncGitHubDataManually = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.user._id);

  if (!student.githubAuth || !student.githubAuth.encryptedAccessToken) {
    return res.status(400).json({
      message: 'No GitHub account connected. Please connect your GitHub account first.'
    });
  }

  console.log(`🔄 Manual GitHub sync requested by: ${student.email}`);

  // Trigger sync job
  const result = await syncGitHubData(student._id, true);

  if (result.success) {
    // Fetch updated student data
    const updatedStudent = await Student.findById(req.user._id);

    res.json({
      message: 'GitHub data synced successfully',
      stats: result.stats,
      githubStats: updatedStudent.githubStats,
      projects: updatedStudent.projects,
      skills: updatedStudent.skills,
    });
  } else {
    res.status(500).json({
      message: 'GitHub sync failed',
      error: result.error,
    });
  }
});

/**
 * Toggle Project Favorite
 * PATCH /api/students/projects/:projectId/favorite
 */
const toggleProjectFavorite = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.user._id);
  const { projectId } = req.params;

  const project = student.projects.id(projectId);

  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  // Toggle favorite status
  project.isFavorite = !project.isFavorite;

  await student.save();

  res.json({
    message: project.isFavorite ? 'Project added to favorites' : 'Project removed from favorites',
    project,
  });
});

/**
 * Get Favorite Projects
 * GET /api/students/projects/favorites
 */
const getFavoriteProjects = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.user._id);

  const favorites = student.projects.filter(project => project.isFavorite);

  res.json({
    count: favorites.length,
    favorites,
  });
});

/**
 * Get GitHub Projects (filtered by source)
 * GET /api/students/projects/github
 */
const getGitHubProjects = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.user._id);

  // Filter projects that have GitHub links
  const githubProjects = student.projects.filter(project =>
    project.githubLink && project.githubLink.includes('github.com')
  );

  // Sort by stars if available, otherwise by submission date
  githubProjects.sort((a, b) => {
    const starsA = a._githubData?.stars || 0;
    const starsB = b._githubData?.stars || 0;
    if (starsA !== starsB) {
      return starsB - starsA;
    }
    return new Date(b.submittedAt) - new Date(a.submittedAt);
  });

  res.json({
    count: githubProjects.length,
    projects: githubProjects,
  });
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
  parseAndAutofillResume,
  getReadinessReport,
  listStudents,
  getStudentById,
  deleteStudent,
  getLeaderboard,
  updateCodingProfiles,
  syncCodingActivity,
  updateLeetCodeStats,
  importLinkedInProfile,
  syncGitHubProfile,
  syncGitHubDataManually,
  toggleProjectFavorite,
  getFavoriteProjects,
  getGitHubProjects,
};
