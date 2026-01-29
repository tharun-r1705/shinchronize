const Student = require('../models/Student');
const Admin = require('../models/Admin');
const asyncHandler = require('../utils/asyncHandler');
const { generateToken } = require('../utils/authMiddleware');
const { calculateReadinessScore } = require('../utils/readinessScore');
const { generateMentorSuggestions } = require('../utils/aiMentor');
const { fetchLeetCodeActivity, fetchHackerRankActivity } = require('../utils/codingIntegrations');
const { fetchLeetCodeStats } = require('../utils/leetcode');
const { fetchHackerRankStats } = require('../utils/hackerrank');
const { fetchGitHubStats } = require('../utils/github');
const { parseLinkedInPdf } = require('../utils/linkedinParser');
const { syncAutoGoals } = require('../utils/goalSync');
const { generateDomainInsight } = require('../utils/domainInsights');

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

  const goalsUpdated = syncAutoGoals(student);
  if (goalsUpdated) {
    await student.save();
  }

  // Calculate and attach base readiness score
  const { total, breakdown } = calculateReadinessScore(student);

  // Convert to plain object and add readiness score
  const studentObj = student.toObject();
  studentObj.baseReadinessScore = total;
  studentObj.readinessBreakdown = breakdown;

  // Convert skillRadar Map to plain object for frontend
  if (studentObj.skillRadar instanceof Map) {
    studentObj.skillRadar = Object.fromEntries(studentObj.skillRadar);
  } else if (studentObj.skillRadar && typeof studentObj.skillRadar === 'object' && !Array.isArray(studentObj.skillRadar)) {
    // Already an object, keep it
    studentObj.skillRadar = studentObj.skillRadar;
  }

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
    'githubToken',
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

  // Log if githubToken is being updated
  if (typeof updates.githubToken !== 'undefined') {
    console.log(`[updateProfile] GitHub token ${updates.githubToken ? 'SET' : 'CLEARED'} for user ${req.user?.email}`);
  }

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

// Save/update coding profile usernames (LeetCode, HackerRank, GitHub)
const updateCodingProfiles = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.user._id);
  if (!student) return res.status(404).json({ message: 'Student not found' });

  const { leetcode, hackerrank, github } = req.body || {};
  student.codingProfiles = {
    ...(student.codingProfiles || {}),
    leetcode: typeof leetcode === 'string' ? leetcode.trim() : (student.codingProfiles?.leetcode || ''),
    hackerrank: typeof hackerrank === 'string' ? hackerrank.trim() : (student.codingProfiles?.hackerrank || ''),
    github: typeof github === 'string' ? github.trim() : (student.codingProfiles?.github || ''),
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

    const goalsUpdated = syncAutoGoals(student);
    if (goalsUpdated) {
      await student.save();
    }

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

// Update HackerRank stats by username and recompute readiness
const updateHackerRankStats = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { username } = req.body || {};

  const student = await Student.findById(id);
  if (!student) return res.status(404).json({ message: 'Student not found' });

  try {
    const stats = await fetchHackerRankStats(username);
    student.hackerrankStats = stats;
    student.codingProfiles = { ...(student.codingProfiles || {}), hackerrank: username };

    const goalsUpdated = syncAutoGoals(student);
    if (goalsUpdated) {
      await student.save();
    }

    const { total, breakdown } = calculateReadinessScore(student);
    student.readinessScore = total;
    student.readinessHistory.push({ score: total });
    await student.save();

    const safeStudent = await Student.findById(student._id);
    res.json({ student: safeStudent, readiness: { score: total, breakdown } });
  } catch (e) {
    res.status(400).json({ message: e?.message || 'Failed to update HackerRank stats' });
  }
});

// Update GitHub stats by username and recompute readiness
const updateGitHubStats = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { username } = req.body || {};

  const student = await Student.findById(id).select('+githubToken');
  if (!student) return res.status(404).json({ message: 'Student not found' });

  try {
    const userToken = student.githubToken || null;
    const stats = await fetchGitHubStats(username, userToken);
    student.githubStats = stats;
    student.codingProfiles = { ...(student.codingProfiles || {}), github: username };

    const goalsUpdated = syncAutoGoals(student);
    if (goalsUpdated) {
      await student.save();
    }

    const { total, breakdown } = calculateReadinessScore(student);
    student.readinessScore = total;
    student.readinessHistory.push({ score: total });
    await student.save();

    const safeStudent = await Student.findById(student._id);
    res.json({ student: safeStudent, readiness: { score: total, breakdown } });
  } catch (e) {
    res.status(400).json({ message: e?.message || 'Failed to update GitHub stats' });
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
  syncAutoGoals(student);
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
  syncAutoGoals(student);
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
  syncAutoGoals(student);
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

// Public leaderboard: top students by readinessScore
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
      projectsCount: Array.isArray(s.projects) ? s.projects.length : 0,
    }))
    .sort((a, b) => {
      if (b.readinessScore !== a.readinessScore) return b.readinessScore - a.readinessScore;
      if (b.streakDays !== a.streakDays) return b.streakDays - a.streakDays;
      return b.projectsCount - a.projectsCount;
    })
    .slice(0, limit)
    .map((s, idx) => ({
      id: String(s._id),
      rank: idx + 1,
      name: s.name,
      college: s.college,
      score: s.readinessScore,
      streak: s.streakDays,
      projects: s.projectsCount,
      badges: s.badges,
      avatarUrl: s.avatarUrl,
      achievements: `${s.projectsCount} Project${s.projectsCount !== 1 ? 's' : ''} • ${s.streakDays} Day Streak`,
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

  if (req.body.title) project.title = req.body.title;
  if (req.body.githubLink !== undefined) project.githubLink = req.body.githubLink;
  if (req.body.description !== undefined) project.description = req.body.description;
  if (req.body.tags) project.tags = req.body.tags;
  syncAutoGoals(student);
  await student.save();

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
  syncAutoGoals(student);
  await student.save();

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

  if (req.body.name) cert.name = req.body.name;
  if (req.body.provider !== undefined) cert.provider = req.body.provider;
  if (req.body.certificateId !== undefined) cert.certificateId = req.body.certificateId;
  if (req.body.issuedDate !== undefined) cert.issuedDate = req.body.issuedDate;
  if (req.body.fileLink !== undefined) cert.fileLink = req.body.fileLink;
  syncAutoGoals(student);
  await student.save();

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
  syncAutoGoals(student);
  await student.save();

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

  if (req.body.name) event.name = req.body.name;
  if (req.body.description !== undefined) event.description = req.body.description;
  if (req.body.date !== undefined) event.date = req.body.date;
  if (req.body.location !== undefined) event.location = req.body.location;
  if (req.body.certificateLink !== undefined) event.certificateLink = req.body.certificateLink;
  if (req.body.outcome !== undefined) event.outcome = req.body.outcome;
  await student.save();

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

  const { total, breakdown } = calculateReadinessScore(student);
  student.readinessScore = total;
  await student.save();

  res.json({
    message: 'Event deleted successfully',
    readiness: { score: total, breakdown },
  });
});

const getDomainInsights = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.user._id);
  const insight = await generateDomainInsight(student);
  res.json(insight);
});

const importLinkedInProfile = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No PDF file uploaded' });

  const parser = await loadPdfParse();
  const data = await parser(req.file.buffer);
  const profile = await parseLinkedInPdf(data.text);

  res.json({ profile, meta: { pages: data.numpages } });
});

const extractResumeText = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const parser = await loadPdfParse();
  const data = await parser(req.file.buffer);

  res.json({
    message: 'Resume text extracted successfully',
    text: data.text,
    pages: data.numpages,
  });
});

const analyzeResume = asyncHandler(async (req, res) => {
  const { resumeText, targetRole } = req.body;
  if (!resumeText) return res.status(400).json({ message: 'Resume text is required' });

  // This would typically involve an AI call to analyze the resume
  res.json({
    score: 85,
    recommendations: ['Add more keywords related to ' + (targetRole || 'Software Engineering'), 'Include quantified achievements'],
  });
});

module.exports = {
  signup,
  login,
  getProfile,
  updateProfile,
  updateCodingProfiles,
  syncCodingActivity,
  updateLeetCodeStats,
  updateHackerRankStats,
  updateGitHubStats,
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
  getReadinessReport,
  listStudents,
  getLeaderboard,
  getStudentById,
  deleteStudent,
  getDomainInsights,
  importLinkedInProfile,
  extractResumeText,
  analyzeResume,
};
