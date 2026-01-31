const Job = require('../models/Job');
const Student = require('../models/Student');
const asyncHandler = require('../utils/asyncHandler');
const {
  generateJobDescription,
  matchStudentsToJob,
  generateMatchReason,
  calculateJobMatchScore,
} = require('../services/jobMatchingService');

/**
 * Create a new job posting with AI-generated description
 * POST /api/jobs
 */
const createJob = asyncHandler(async (req, res) => {
  const {
    title,
    location,
    jobType,
    experience,
    salaryRange,
    requiredSkills,
    preferredSkills,
    minReadinessScore,
    minCGPA,
    minProjects,
  } = req.body;

  // Validate required fields
  if (!title || !location || !requiredSkills || requiredSkills.length === 0) {
    return res.status(400).json({
      message: 'Title, location, and at least one required skill are mandatory',
    });
  }

  // Get company from recruiter profile
  const company = req.user.company || 'Our Company';

  // Generate AI description
  console.log('Generating AI job description...');
  const aiGenerated = await generateJobDescription({
    title,
    location,
    requiredSkills,
    preferredSkills,
    experience,
    company,
  });

  // Create job
  const job = new Job({
    recruiterId: req.user._id,
    title,
    company,
    location,
    jobType: jobType || 'Full-time',
    experience: experience || '0-2 years',
    salaryRange,
    description: aiGenerated.description,
    responsibilities: aiGenerated.responsibilities,
    qualifications: aiGenerated.qualifications,
    requiredSkills,
    preferredSkills: preferredSkills || [],
    minReadinessScore: minReadinessScore || 0,
    minCGPA: minCGPA || 0,
    minProjects: minProjects || 0,
    status: 'draft',
  });

  await job.save();

  res.status(201).json({
    message: 'Job created successfully',
    job,
  });
});

/**
 * Get all jobs for the authenticated recruiter
 * GET /api/jobs
 */
const getAllJobs = asyncHandler(async (req, res) => {
  const { status } = req.query;

  const filter = { recruiterId: req.user._id };
  if (status) {
    filter.status = status;
  }

  const jobs = await Job.find(filter)
    .sort({ createdAt: -1 })
    .lean();

  res.json({
    count: jobs.length,
    jobs,
  });
});

/**
 * Get a single job by ID
 * GET /api/jobs/:jobId
 */
const getJobById = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  const job = await Job.findById(jobId).lean();

  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }

  // Verify ownership
  if (job.recruiterId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized to view this job' });
  }

  // Increment view count
  await Job.findByIdAndUpdate(jobId, { $inc: { viewCount: 1 } });

  res.json(job);
});

/**
 * Update a job posting
 * PUT /api/jobs/:jobId
 */
const updateJob = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const updates = req.body;

  const job = await Job.findById(jobId);

  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }

  // Verify ownership
  if (job.recruiterId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized to update this job' });
  }

  // Update allowed fields
  const allowedUpdates = [
    'title',
    'location',
    'jobType',
    'experience',
    'salaryRange',
    'description',
    'responsibilities',
    'qualifications',
    'requiredSkills',
    'preferredSkills',
    'minReadinessScore',
    'minCGPA',
    'minProjects',
    'status',
    'expiresAt',
  ];

  allowedUpdates.forEach(field => {
    if (updates[field] !== undefined) {
      job[field] = updates[field];
    }
  });

  // If status changed to active, set postedAt
  if (updates.status === 'active' && job.status !== 'active') {
    job.postedAt = new Date();
  }

  await job.save();

  // If critical matching criteria changed, clear matches
  const criticalFields = ['requiredSkills', 'preferredSkills', 'minReadinessScore', 'minCGPA', 'minProjects'];
  const criticalChanged = criticalFields.some(field => updates[field] !== undefined);
  
  if (criticalChanged) {
    job.matchedStudents = [];
    job.matchCount = 0;
    job.lastMatchedAt = null;
    await job.save();
  }

  res.json({
    message: 'Job updated successfully',
    job,
    matchesCleared: criticalChanged,
  });
});

/**
 * Delete a job posting
 * DELETE /api/jobs/:jobId
 */
const deleteJob = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  const job = await Job.findById(jobId);

  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }

  // Verify ownership
  if (job.recruiterId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized to delete this job' });
  }

  await Job.findByIdAndDelete(jobId);

  res.json({
    message: 'Job deleted successfully',
    deletedJobId: jobId,
  });
});

/**
 * Match students to a job (AI-powered)
 * POST /api/jobs/:jobId/match
 */
const matchStudents = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  const job = await Job.findById(jobId);

  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }

  // Verify ownership
  if (job.recruiterId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized to match students for this job' });
  }

  console.log(`Starting matching process for job: ${job.title}`);

  // Run matching service
  const matchResults = await matchStudentsToJob(jobId);

  res.json({
    message: 'Student matching completed successfully',
    ...matchResults,
  });
});

/**
 * Get matched students for a job
 * GET /api/jobs/:jobId/matches
 */
const getMatchedStudents = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const { limit = 50, minScore = 0 } = req.query;

  const job = await Job.findById(jobId)
    .populate({
      path: 'matchedStudents.studentId',
      select: 'name email college branch readinessScore skills projects certifications cgpa leetcodeStats githubStats avatarUrl',
    })
    .lean();

  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }

  // Verify ownership
  if (job.recruiterId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized to view matches for this job' });
  }

  // Filter and limit matches
  let matches = job.matchedStudents
    .filter(m => m.matchScore >= parseInt(minScore))
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, parseInt(limit));

  res.json({
    jobId: job._id,
    jobTitle: job.title,
    totalMatches: matches.length,
    matches,
  });
});

/**
 * Get detailed match explanation for a specific student
 * GET /api/jobs/:jobId/matches/:studentId/explain
 */
const getMatchExplanation = asyncHandler(async (req, res) => {
  const { jobId, studentId } = req.params;

  const job = await Job.findById(jobId).lean();

  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }

  // Verify ownership
  if (job.recruiterId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized to view this match' });
  }

  const student = await Student.findById(studentId)
    .select('name email college branch readinessScore readinessHistory skills projects certifications cgpa leetcodeStats githubStats')
    .lean();

  if (!student) {
    return res.status(404).json({ message: 'Student not found' });
  }

  // Find existing match data
  const existingMatch = job.matchedStudents.find(
    m => m.studentId.toString() === studentId
  );

  let matchData, matchReason;

  if (existingMatch) {
    // Use cached data, but recalculate breakdown if missing
    if (existingMatch.scoreBreakdown) {
      // Already have breakdown
      matchData = {
        totalScore: existingMatch.matchScore,
        breakdown: existingMatch.scoreBreakdown,
        skillsMatched: existingMatch.skillsMatched,
        skillsMissing: existingMatch.skillsMissing,
      };
    } else {
      // Recalculate to get breakdown
      matchData = calculateJobMatchScore(student, job);
    }
    matchReason = existingMatch.matchReason;
  } else {
    // Calculate fresh match data
    matchData = calculateJobMatchScore(student, job);
    matchReason = await generateMatchReason(student, job, matchData);
  }

  // Transform breakdown to match frontend expectations
  const scoreBreakdown = matchData.breakdown ? {
    requiredSkills: matchData.breakdown.requiredSkills || 0,
    preferredSkills: matchData.breakdown.preferredSkills || 0,
    projects: matchData.breakdown.projects || 0,
    readiness: matchData.breakdown.readiness || 0,
    growth: matchData.breakdown.growth || 0,
    cgpa: matchData.breakdown.cgpa || 0,
    certifications: matchData.breakdown.certifications || 0,
    codingConsistency: matchData.breakdown.consistency || 0, // Rename consistency to codingConsistency
  } : {
    requiredSkills: 0,
    preferredSkills: 0,
    projects: 0,
    readiness: 0,
    growth: 0,
    cgpa: 0,
    certifications: 0,
    codingConsistency: 0,
  };

  res.json({
    student: {
      id: student._id,
      name: student.name,
      email: student.email,
      college: student.college,
      branch: student.branch,
      readinessScore: student.readinessScore,
      cgpa: student.cgpa,
      skills: student.skills,
      projects: student.projects,
      certifications: student.certifications,
    },
    job: {
      id: job._id,
      title: job.title,
      requiredSkills: job.requiredSkills,
      preferredSkills: job.preferredSkills,
      minReadinessScore: job.minReadinessScore,
      minCGPA: job.minCGPA,
      minProjects: job.minProjects,
    },
    matchScore: matchData.totalScore,
    matchReason,
    scoreBreakdown, // Changed from 'breakdown' to 'scoreBreakdown'
    skillsMatched: matchData.skillsMatched,
    skillsMissing: matchData.skillsMissing,
    detailedAnalysis: {
      strengths: [],
      gaps: [],
      recommendations: [],
    },
  });
});

/**
 * Publish a job (change status from draft to active and trigger matching)
 * POST /api/jobs/:jobId/publish
 */
const publishJob = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  const job = await Job.findById(jobId);

  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }

  // Verify ownership
  if (job.recruiterId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized to publish this job' });
  }

  if (job.status === 'active') {
    return res.status(400).json({ message: 'Job is already active' });
  }

  // Update status and post date
  job.status = 'active';
  job.postedAt = new Date();
  
  // Set expiry to 30 days from now if not set
  if (!job.expiresAt) {
    job.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }

  await job.save();

  // Trigger matching in background
  matchStudentsToJob(jobId).catch(err => {
    console.error('Error matching students after publish:', err);
  });

  res.json({
    message: 'Job published successfully. Student matching in progress...',
    job,
  });
});

/**
 * Get job statistics
 * GET /api/jobs/:jobId/stats
 */
const getJobStats = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  const job = await Job.findById(jobId).lean();

  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }

  // Verify ownership
  if (job.recruiterId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized to view stats for this job' });
  }

  const stats = {
    jobId: job._id,
    title: job.title,
    status: job.status,
    totalMatches: job.matchCount || 0,
    viewCount: job.viewCount || 0,
    applicationCount: job.applicationCount || 0,
    contactedCount: job.contactedCandidates?.length || 0,
    daysActive: job.daysPosted || 0,
    topMatchScore: job.matchedStudents[0]?.matchScore || 0,
    avgMatchScore: job.matchedStudents.length > 0
      ? Math.round(job.matchedStudents.reduce((sum, m) => sum + m.matchScore, 0) / job.matchedStudents.length)
      : 0,
    skillsCoverage: {
      requiredSkills: job.requiredSkills,
      preferredSkills: job.preferredSkills || [],
    },
    lastMatchedAt: job.lastMatchedAt,
  };

  res.json(stats);
});

module.exports = {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
  matchStudents,
  getMatchedStudents,
  getMatchExplanation,
  publishJob,
  getJobStats,
};
