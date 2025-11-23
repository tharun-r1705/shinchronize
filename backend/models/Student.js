const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    githubLink: { type: String, trim: true },
    description: { type: String, trim: true },
    tags: { type: [String], default: [] },
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
    verified: { type: Boolean, default: false },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    feedback: { type: String, trim: true },
    submittedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const codingLogSchema = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now },
    platform: { type: String, trim: true },
    activity: { type: String, trim: true },
    minutesSpent: { type: Number, default: 0 },
    problemsSolved: { type: Number, default: 0 },
    notes: { type: String, trim: true },
  },
  { _id: true }
);

const certificationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    provider: { type: String, trim: true },
    fileLink: { type: String, trim: true },
    issuedDate: { type: Date },
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
    certificateId: { type: String, trim: true },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    submittedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const eventSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    date: { type: Date },
    location: { type: String, trim: true },
    certificateLink: { type: String, trim: true },
    outcome: { type: String, trim: true },
    pointsAwarded: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  },
  { _id: true }
);

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  avatarUrl: { type: String, trim: true },
  dateOfBirth: { type: Date },
  gender: { type: String, trim: true },
  college: { type: String, trim: true },
  branch: { type: String, trim: true },
  year: { type: String, trim: true },
  graduationYear: { type: Number },
  cgpa: { type: Number, min: 0, max: 10 },
  phone: { type: String, trim: true },
  location: { type: String, trim: true },
  portfolioUrl: { type: String, trim: true },
  linkedinUrl: { type: String, trim: true },
  githubUrl: { type: String, trim: true },
  resumeUrl: { type: String, trim: true },
  leetcodeUrl: { type: String, trim: true },
  hackerrankUrl: { type: String, trim: true },
  headline: { type: String, trim: true },
  summary: { type: String, trim: true },
  skills: { type: [String], default: [] },
    projects: { type: [projectSchema], default: [] },
    codingLogs: { type: [codingLogSchema], default: [] },
    certifications: { type: [certificationSchema], default: [] },
    events: { type: [eventSchema], default: [] },
  badges: { type: [String], default: [] },
    skillRadar: {
      type: Map,
      of: Number,
      default: {},
    },
    readinessScore: { type: Number, default: 0 },
    readinessHistory: {
      type: [
        {
          score: { type: Number },
          calculatedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    streakDays: { type: Number, default: 0 },
    lastActiveAt: { type: Date },
    savedForLater: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recruiter' }],
      default: [],
    },
    codingProfiles: {
      type: new mongoose.Schema(
        {
          leetcode: { type: String, trim: true, default: '' },
          hackerrank: { type: String, trim: true, default: '' },
          lastSyncedAt: { type: Date },
        },
        { _id: false }
      ),
      default: {},
    },
    leetcodeStats: {
      type: new mongoose.Schema(
        {
          username: { type: String },
          totalSolved: { type: Number, default: 0 },
          easy: { type: Number, default: 0 },
          medium: { type: Number, default: 0 },
          hard: { type: Number, default: 0 },
          streak: { type: Number, default: 0 },
          calendar: { type: Map, of: Number, default: new Map() },
          topDomains: [
            {
              tag: String,
              count: Number,
            },
          ],
          activeDays: { type: Number, default: 0 },
          recentActivity: {
            last7Days: { type: Number, default: 0 },
            last30Days: { type: Number, default: 0 },
          },
          bestDay: {
            date: String,
            count: Number,
          },
          calendarRange: {
            start: String,
            end: String,
          },
          fetchedAt: { type: Date },
        },
        { _id: false }
      ),
      default: {},
    },
    role: { type: String, default: 'student' },
    isProfileComplete: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        delete ret.password;
        delete ret.__v;
        // Convert Map to plain object for skillRadar
        if (ret.skillRadar instanceof Map) {
          ret.skillRadar = Object.fromEntries(ret.skillRadar);
        }
        // Convert Map to plain object for leetcodeStats.calendar
        if (ret.leetcodeStats?.calendar instanceof Map) {
          ret.leetcodeStats.calendar = Object.fromEntries(ret.leetcodeStats.calendar);
        }
        return ret;
      },
    },
    toObject: { 
      virtuals: true,
      transform: (_, ret) => {
        // Convert Map to plain object for skillRadar
        if (ret.skillRadar instanceof Map) {
          ret.skillRadar = Object.fromEntries(ret.skillRadar);
        }
        // Convert Map to plain object for leetcodeStats.calendar
        if (ret.leetcodeStats?.calendar instanceof Map) {
          ret.leetcodeStats.calendar = Object.fromEntries(ret.leetcodeStats.calendar);
        }
        return ret;
      },
    },
  }
);

studentSchema.virtual('verifiedProjectsCount').get(function () {
  return this.projects.filter((project) => project.status === 'verified' || project.verified).length;
});

studentSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

studentSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) {
    const doc = await this.constructor.findById(this._id).select('+password');
    return bcrypt.compare(candidatePassword, doc.password);
  }
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Student', studentSchema);
