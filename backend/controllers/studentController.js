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
const groqClient = require('../utils/groqClient');
const { parseLinkedInPdf } = require('../utils/linkedinParser');
const { syncAutoGoals } = require('../utils/goalSync');
const { generateDomainInsight } = require('../utils/domainInsights');
const { updateStreak } = require('../utils/streakCalculator');
const { extractTextFromPDF } = require('../utils/pdfExtractor');
const { validateCompleteProfile } = require('../utils/profileValidation');

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

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const student = await Student.findOne({ email }).select('+password');
  if (!student) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  if (!student.password) {
    console.error('Password not found for student:', student._id);
    return res.status(500).json({ message: 'User account is corrupted. Please contact support.' });
  }

  let isMatch;
  try {
    isMatch = await student.comparePassword(password);
  } catch (err) {
    console.error('Error comparing passwords:', err);
    return res.status(500).json({ message: 'Authentication error occurred' });
  }

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
  // Only validate if the essential fields are being updated
  // This allows partial updates without triggering full validation
  const hasEssentialFields = req.body.firstName || req.body.lastName || 
                             req.body.dateOfBirth || req.body.gender || 
                             req.body.college || req.body.phone || 
                             req.body.linkedinUrl || req.body.skills;
  
  let validatedData = {};
  
  if (hasEssentialFields) {
    const validationResult = validateCompleteProfile(req.body);
    
    if (!validationResult.valid) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: validationResult.errors 
      });
    }
    
    validatedData = validationResult.validated;
  }

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
    // Use validated data if available, otherwise fall back to req.body
    if (typeof validatedData[field] !== 'undefined') {
      updates[field] = validatedData[field];
    } else if (typeof req.body[field] !== 'undefined') {
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

    const requiredFields = ['firstName', 'lastName', 'dateOfBirth', 'gender', 'college', 'phone', 'linkedinUrl'];
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

    const hasCodingLinks = Boolean((student.leetcodeUrl && student.leetcodeUrl.trim()) || (student.codingProfiles?.leetcode && student.codingProfiles.leetcode.trim())) ||
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
  
  // Update streak after syncing coding activity
  await updateStreak(student);

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
  
  // Update streak after adding project
  await updateStreak(student);

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
  
  // Update streak after adding coding log
  await updateStreak(student);

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
  
  // Update streak after adding certification
  await updateStreak(student);

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
  
  // Update streak after adding event
  await updateStreak(student);

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
    .select('name college readinessScore streakDays projects badges avatarUrl githubStats leetcodeStats hackerrankStats codingLogs')
    .lean();

  const withDerived = students
    .map((s) => {
      const leetcLogs = (s.codingLogs || []).filter(l => (l.platform || '').toLowerCase().includes('leetcode'));
      const hrLogs = (s.codingLogs || []).filter(l => (l.platform || '').toLowerCase().includes('hackerrank'));

      const leetSolved = (s.leetcodeStats?.totalSolved || 0) + leetcLogs.reduce((acc, log) => acc + (log.problemsSolved || 0), 0);
      const hrSolved = (s.hackerrankStats?.totalSolved || 0) + hrLogs.reduce((acc, log) => acc + (log.problemsSolved || 0), 0);
      const totalSolved = leetSolved + hrSolved;

      // Debug log for students with activity to ensure stats are calculated correctly
      if (totalSolved > 0) {
        console.log(`[getLeaderboard] Student: ${s.name}, Total: ${totalSolved}, LC: ${leetSolved}, HR: ${hrSolved}`);
      }

      return {
        _id: s._id,
        name: s.name,
        college: s.college || '',
        readinessScore: Number(s.readinessScore) || 0,
        streakDays: Number(s.streakDays) || 0,
        projectsCount: Array.isArray(s.projects) ? s.projects.length : 0,
        badges: Array.isArray(s.badges) ? s.badges : [],
        avatarUrl: s.avatarUrl || '',
        totalSolved,
        platformStats: {
          leetcode: {
            totalSolved: leetSolved,
            recent30: s.leetcodeStats?.recentActivity?.last30Days || 0,
          },
          hackerrank: {
            totalSolved: hrSolved,
            recent30: s.hackerrankStats?.recentActivity?.last30Days || 0,
          },
          github: {
            totalCommits: s.githubStats?.totalCommits || 0,
            recent30: s.githubStats?.recentActivity?.last30Days || 0,
          },
        },
      };
    })
    .sort((a, b) => {
      if (b.readinessScore !== a.readinessScore) return b.readinessScore - a.readinessScore;
      if (b.totalSolved !== a.totalSolved) return b.totalSolved - a.totalSolved;
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
      totalSolved: s.totalSolved,
      achievements: `${s.totalSolved} Solved • ${s.projectsCount} Project${s.projectsCount !== 1 ? 's' : ''} • ${s.streakDays}d Streak`,
      platformStats: s.platformStats,
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
  const insight = await generateDomainInsight(student.skills || [], student.skillRadar || {});
  res.json(insight);
});

const importLinkedInProfile = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No PDF file uploaded' });

  try {
    const text = await extractTextFromPDF(req.file.buffer);
    const profile = await parseLinkedInPdf(text);
    
    res.json({ profile, meta: { textLength: text.length } });
  } catch (error) {
    return res.status(400).json({ message: `Failed to process PDF: ${error.message}` });
  }
});

const extractResumeText = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  try {
    const text = await extractTextFromPDF(req.file.buffer);
    
    res.json({
      message: 'Resume text extracted successfully',
      text: text,
      textLength: text.length,
    });
  } catch (error) {
    return res.status(400).json({ message: `Failed to extract text: ${error.message}` });
  }
});

// Helper function to validate if content is resume-related
const isResumeContent = (text) => {
  const lowerText = text.toLowerCase();
  
  // Common resume section headers
  const resumeSections = [
    'experience', 'education', 'skills', 'work history', 'employment',
    'professional experience', 'work experience', 'projects', 'summary',
    'objective', 'profile', 'qualifications', 'certifications', 'achievements',
    'awards', 'training', 'languages', 'technical skills', 'career',
    'professional summary', 'about me', 'responsibilities', 'accomplishments'
  ];
  
  // Professional/career-related terms
  const careerTerms = [
    'developed', 'managed', 'led', 'created', 'implemented', 'designed',
    'achieved', 'responsible for', 'collaborated', 'coordinated', 'analyzed',
    'improved', 'increased', 'reduced', 'built', 'established', 'delivered',
    'years of experience', 'bachelor', 'master', 'degree', 'university',
    'college', 'institute', 'graduated', 'gpa', 'intern', 'employee',
    'position', 'role', 'company', 'organization', 'corporation'
  ];
  
  // Count matches
  let sectionMatches = 0;
  let careerTermMatches = 0;
  
  resumeSections.forEach(section => {
    if (lowerText.includes(section)) sectionMatches++;
  });
  
  careerTerms.forEach(term => {
    if (lowerText.includes(term)) careerTermMatches++;
  });
  
  // Check for email pattern (common in resumes)
  const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text);
  
  // Check for phone number pattern
  const hasPhone = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(text);
  
  // Check minimum length (resumes are typically substantial)
  const hasMinimumLength = text.trim().length > 200;
  
  // Scoring system: need at least 2 section matches OR 3 career term matches
  // AND (email OR phone) AND minimum length
  const isResume = (sectionMatches >= 2 || careerTermMatches >= 3) && 
                   (hasEmail || hasPhone) && 
                   hasMinimumLength;
  
  return {
    isResume,
    confidence: {
      sectionMatches,
      careerTermMatches,
      hasContactInfo: hasEmail || hasPhone,
      hasMinimumLength
    }
  };
};

// AI-powered resume content analysis using Groq
const analyzeResumeContent = async (resumeText, targetRole) => {
  const MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  
  if (!groqClient.isAvailable()) {
    throw new Error('AI service is not configured. Please set GROQ_API_KEY or GROQ_API_KEY_BACKUP.');
  }

  const prompt = `You are an expert resume analyst and ATS (Applicant Tracking System) specialist. Analyze the following resume for a ${targetRole} position and provide detailed, actionable feedback.

Resume Content:
${resumeText}

Target Role: ${targetRole}

Provide a comprehensive analysis in valid JSON format with the following structure:
{
  "overallScore": <number 0-100>,
  "atsScore": <number 0-100>,
  "strengths": [<array of 3-5 specific strengths found in the resume>],
  "weaknesses": [<array of 3-5 specific areas needing improvement>],
  "suggestions": [<array of 4-6 actionable suggestions to improve the resume>],
  "sections": [
    {
      "name": "<section name like Work Experience, Education, Skills>",
      "score": <number 0-100>,
      "feedback": "<specific feedback for this section>"
    }
  ],
  "keywords": {
    "present": [<array of relevant technical skills and keywords found in the resume>],
    "missing": [<array of important keywords missing for the target role>]
  },
  "formatting": {
    "score": <number 0-100>,
    "issues": [<array of formatting issues that could affect ATS parsing>]
  },
  "atsInsights": [<array of 4-6 specific insights about ATS optimization>]
}

Analysis Guidelines:
1. Overall Score: Base this on content quality, relevance to ${targetRole}, quantifiable achievements, and professional presentation
2. ATS Score: Focus on keyword optimization, section structure, formatting compatibility, and parsability
3. Strengths: Identify specific strong points (e.g., "Strong use of metrics with 8 quantifiable achievements", "Excellent technical skills alignment with ${targetRole}")
4. Weaknesses: Point out gaps (e.g., "Missing leadership keywords", "Limited quantifiable impact metrics")
5. Suggestions: Provide actionable improvements (e.g., "Add specific technologies like Docker and Kubernetes", "Quantify team size and project scope")
6. Section Analysis: Evaluate each major section found (Experience, Education, Skills, Summary, etc.)
7. Keywords: Extract actual technologies/skills found vs. what's missing for ${targetRole}
8. Formatting: Check for ATS compatibility issues (tables, graphics, unusual fonts, parsing problems)
9. ATS Insights: Provide specific tips for improving ATS score

Be specific, reference actual content from the resume, and ensure all feedback is actionable and relevant to ${targetRole} positions.

Return ONLY valid JSON, no additional text.`;

  try {
    const completion = await groqClient.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an expert resume analyst specializing in ATS optimization and career coaching. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4096,
      response_format: { type: 'json_object' }
    });

    const aiResponse = completion.choices[0]?.message?.content;
    
    if (!aiResponse) {
      throw new Error('No response from AI service');
    }

    const analysis = JSON.parse(aiResponse);
    
    // Validate and ensure all required fields are present
    return {
      overallScore: Math.min(100, Math.max(0, analysis.overallScore || 50)),
      atsScore: Math.min(100, Math.max(0, analysis.atsScore || 50)),
      strengths: Array.isArray(analysis.strengths) && analysis.strengths.length > 0 
        ? analysis.strengths 
        : ['Resume structure is present'],
      weaknesses: Array.isArray(analysis.weaknesses) && analysis.weaknesses.length > 0 
        ? analysis.weaknesses 
        : ['Consider adding more specific details'],
      suggestions: Array.isArray(analysis.suggestions) && analysis.suggestions.length > 0 
        ? analysis.suggestions 
        : ['Tailor your resume to the target role'],
      sections: Array.isArray(analysis.sections) && analysis.sections.length > 0 
        ? analysis.sections 
        : [{
            name: 'Overall',
            score: 50,
            feedback: 'Add clear sections for better organization'
          }],
      keywords: {
        present: Array.isArray(analysis.keywords?.present) ? analysis.keywords.present : [],
        missing: Array.isArray(analysis.keywords?.missing) ? analysis.keywords.missing : []
      },
      formatting: {
        score: Math.min(100, Math.max(0, analysis.formatting?.score || 70)),
        issues: Array.isArray(analysis.formatting?.issues) 
          ? analysis.formatting.issues 
          : ['Ensure consistent formatting throughout']
      },
      atsInsights: Array.isArray(analysis.atsInsights) && analysis.atsInsights.length > 0 
        ? analysis.atsInsights 
        : [
            'Use standard section headers for better ATS parsing',
            'Include relevant keywords from job postings',
            'Avoid complex formatting that ATS systems cannot parse'
          ]
    };
    
  } catch (error) {
    console.error('Error in AI resume analysis:', error);
    
    // Fallback to basic analysis if AI fails
    return {
      overallScore: 50,
      atsScore: 50,
      strengths: ['Resume submitted successfully'],
      weaknesses: ['AI analysis temporarily unavailable - please try again'],
      suggestions: [
        'Ensure your resume includes clear sections for Experience, Education, and Skills',
        `Highlight specific achievements relevant to ${targetRole}`,
        'Use action verbs to describe your accomplishments',
        'Include quantifiable metrics where possible'
      ],
      sections: [{
        name: 'General',
        score: 50,
        feedback: 'AI analysis temporarily unavailable. Please try again or contact support.'
      }],
      keywords: {
        present: [],
        missing: []
      },
      formatting: {
        score: 70,
        issues: ['Unable to analyze formatting - AI service temporarily unavailable']
      },
      atsInsights: [
        'Use standard section headers like "Work Experience", "Education", and "Skills"',
        'Include contact information at the top',
        'Save as PDF or DOCX for best ATS compatibility',
        'Avoid tables, graphics, and unusual formatting'
      ]
    };
  }
};

// Get role-specific keywords
const getRoleSpecificKeywords = (role) => {
  const roleLower = role.toLowerCase();
  
  const keywords = {
    'software engineer': ['algorithms', 'data structures', 'system design', 'rest api', 'microservices', 'agile', 'git', 'ci/cd', 'testing', 'code review'],
    'data scientist': ['machine learning', 'python', 'r', 'statistics', 'sql', 'tensorflow', 'pytorch', 'data visualization', 'big data', 'predictive modeling'],
    'product manager': ['product strategy', 'roadmap', 'stakeholder management', 'user research', 'agile', 'analytics', 'prioritization', 'market analysis', 'kpis', 'cross-functional'],
    'devops': ['kubernetes', 'docker', 'ci/cd', 'jenkins', 'terraform', 'aws', 'monitoring', 'automation', 'linux', 'scripting'],
    'frontend': ['react', 'javascript', 'typescript', 'html', 'css', 'responsive design', 'webpack', 'redux', 'ui/ux', 'accessibility'],
    'backend': ['api design', 'databases', 'scalability', 'microservices', 'node.js', 'python', 'java', 'sql', 'nosql', 'security'],
    'full stack': ['frontend', 'backend', 'databases', 'rest api', 'react', 'node.js', 'mongodb', 'responsive design', 'deployment', 'version control'],
    'ui/ux': ['figma', 'sketch', 'prototyping', 'wireframing', 'user research', 'usability testing', 'design systems', 'accessibility', 'responsive design', 'adobe xd'],
    'marketing': ['digital marketing', 'seo', 'sem', 'content marketing', 'analytics', 'social media', 'campaign management', 'email marketing', 'conversion optimization', 'brand strategy']
  };
  
  // Find matching role keywords
  for (const [key, values] of Object.entries(keywords)) {
    if (roleLower.includes(key)) {
      return values;
    }
  }
  
  // Default technical keywords
  return ['leadership', 'communication', 'problem solving', 'analytical skills', 'project management', 'teamwork', 'innovation', 'strategic thinking', 'adaptability', 'time management'];
};

const analyzeResume = asyncHandler(async (req, res) => {
  const { resumeText, targetRole } = req.body;
  if (!resumeText) return res.status(400).json({ message: 'Resume text is required' });
  if (!targetRole) return res.status(400).json({ message: 'Target role is required' });

  // Validate if the content is actually a resume
  const validation = isResumeContent(resumeText);
  
  if (!validation.isResume) {
    return res.status(400).json({ 
      message: 'The uploaded content does not appear to be a resume. Please upload a valid resume or CV that includes sections like experience, education, and skills.',
      validationDetails: {
        reason: 'Content validation failed',
        suggestion: 'Make sure your document contains typical resume sections such as work experience, education, skills, and contact information.'
      }
    });
  }

  // Perform AI-powered resume analysis
  const analysis = await analyzeResumeContent(resumeText, targetRole);

  res.json({ analysis });
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
