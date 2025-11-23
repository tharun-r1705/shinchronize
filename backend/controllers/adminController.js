const Admin = require('../models/Admin');
const Student = require('../models/Student');
const asyncHandler = require('../utils/asyncHandler');
const { generateToken } = require('../utils/authMiddleware');
const { calculateReadinessScore } = require('../utils/readinessScore');

const buildAuthResponse = (admin) => ({
  token: generateToken(admin._id, 'admin'),
  admin,
});

const signup = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const existing = await Admin.findOne({ email });

  if (existing) {
    return res.status(409).json({ message: 'Admin already exists with this email' });
  }

  const admin = new Admin(req.body);
  await admin.save();

  res.status(201).json(buildAuthResponse(admin));
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const admin = await Admin.findOne({ email }).select('+password');

  if (!admin) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const isMatch = await admin.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  admin.lastLoginAt = new Date();
  await admin.save();

  const adminSafe = await Admin.findById(admin._id);
  res.json(buildAuthResponse(adminSafe));
});

const getProfile = asyncHandler(async (req, res) => {
  res.json(req.user);
});

const listPendingVerifications = asyncHandler(async (req, res) => {
  const students = await Student.find({
    $or: [
      { 'projects.status': 'pending' },
      { 'certifications.status': 'pending' },
      { 'events.status': 'pending' },
    ],
  })
    .select('name email projects certifications events')
    .lean();

  const pending = [];

  students.forEach((student) => {
    (student.projects || [])
      .filter((project) => project.status === 'pending')
      .forEach((project) =>
        pending.push({
          studentId: student._id,
          studentName: student.name,
          studentEmail: student.email,
          itemId: project._id,
          itemType: 'project',
          title: project.title,
          submittedAt: project.submittedAt,
        })
      );

    (student.certifications || [])
      .filter((cert) => cert.status === 'pending')
      .forEach((cert) =>
        pending.push({
          studentId: student._id,
          studentName: student.name,
          studentEmail: student.email,
          itemId: cert._id,
          itemType: 'certification',
          title: cert.name,
          submittedAt: cert.submittedAt,
        })
      );

    (student.events || [])
      .filter((event) => event.status === 'pending')
      .forEach((event) =>
        pending.push({
          studentId: student._id,
          studentName: student.name,
          studentEmail: student.email,
          itemId: event._id,
          itemType: 'event',
          title: event.name,
          submittedAt: event.date,
        })
      );
  });

  res.json({ count: pending.length, items: pending });
});

const verifyItem = asyncHandler(async (req, res) => {
  const { studentId, itemId, itemType, action, notes } = req.body;

  const student = await Student.findById(studentId);
  if (!student) {
    return res.status(404).json({ message: 'Student not found' });
  }

  const collectionMap = {
    project: 'projects',
    certification: 'certifications',
    event: 'events',
  };

  const collectionName = collectionMap[itemType];
  if (!collectionName) {
    return res.status(400).json({ message: 'Unsupported item type' });
  }

  const collection = student[collectionName] || [];
  const targetItem = collection.id(itemId);

  if (!targetItem) {
    return res.status(404).json({ message: `${itemType} not found on student` });
  }

  targetItem.status = action === 'verify' ? 'verified' : 'rejected';
  if (collectionName === 'projects') {
    targetItem.verified = action === 'verify';
  }

  const now = new Date();
  await Admin.updateMany(
    { 'pendingVerifications.itemId': itemId },
    {
      $set: {
        'pendingVerifications.$.status': targetItem.status,
        'pendingVerifications.$.reviewedAt': now,
        'pendingVerifications.$.reviewerNotes': notes,
      },
    }
  );

  if (action === 'verify') {
    targetItem.verifiedBy = req.user._id;
  }

  await student.save();

  const { total, breakdown } = calculateReadinessScore(student);
  student.readinessScore = total;
  student.readinessHistory.push({ score: total, calculatedAt: now });
  await student.save();

  res.json({
    message: `Submission ${action === 'verify' ? 'verified' : 'rejected'}`,
    studentId: student._id,
    item: targetItem,
    readiness: {
      score: total,
      breakdown,
    },
  });
});

const getDashboardStats = asyncHandler(async (req, res) => {
  const [totalStudents, verifiedProjects, pendingItems] = await Promise.all([
    Student.countDocuments(),
    Student.aggregate([
      { $unwind: '$projects' },
      { $match: { 'projects.status': 'verified' } },
      { $count: 'count' },
    ]),
    Student.aggregate([
      { $project: { pendingTotal: {
        $add: [
          {
            $size: {
              $filter: {
                input: '$projects',
                as: 'project',
                cond: { $eq: ['$$project.status', 'pending'] },
              },
            },
          },
          {
            $size: {
              $filter: {
                input: '$certifications',
                as: 'cert',
                cond: { $eq: ['$$cert.status', 'pending'] },
              },
            },
          },
        ],
      } } },
      { $group: { _id: null, total: { $sum: '$pendingTotal' } } },
    ]),
  ]);

  res.json({
    totalStudents,
    verifiedProjects: verifiedProjects[0]?.count || 0,
    pendingItems: pendingItems[0]?.total || 0,
  });
});

const listStudents = asyncHandler(async (req, res) => {
  const students = await Student.find()
    .select('name email college branch readinessScore projects certifications events badges')
    .lean();

  res.json(students);
});

module.exports = {
  signup,
  login,
  getProfile,
  listPendingVerifications,
  verifyItem,
  getDashboardStats,
  listStudents,
};
