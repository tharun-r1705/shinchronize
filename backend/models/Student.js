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
    isFavorite: { type: Boolean, default: false },
    _githubData: {
      stars: { type: Number, default: 0 },
      forks: { type: Number, default: 0 },
      watchers: { type: Number, default: 0 },
      openIssues: { type: Number, default: 0 },
      isFork: { type: Boolean, default: false },
      lastUpdated: { type: Date },
      createdAt: { type: Date },
      homepage: { type: String, trim: true },
      size: { type: Number, default: 0 },
    },
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
    githubStats: {
      type: new mongoose.Schema(
        {
          username: { type: String },
          avatarUrl: { type: String },
          bio: { type: String },
          totalRepos: { type: Number, default: 0 },
          topLanguages: [
            {
              name: String,
              count: Number,
              percentage: Number,
            },
          ],
          topRepos: [
            {
              name: String,
              description: String,
              language: String,
              stars: Number,
              forks: Number,
              lastUpdated: Date,
            },
          ],
          activityScore: { type: Number, default: 0, min: 0, max: 100 },
          lastSyncedAt: { type: Date },
        },
        { _id: false }
      ),
      default: {},
    },
    // GitHub OAuth connection data (separate from public stats)
    githubAuth: {
      type: new mongoose.Schema(
        {
          githubId: { type: String }, // GitHub user ID
          username: { type: String }, // GitHub username
          avatarUrl: { type: String }, // GitHub avatar
          encryptedAccessToken: { type: String }, // Encrypted OAuth token
          connectedAt: { type: Date }, // When OAuth was completed
          authType: { type: String, enum: ['oauth', 'manual'], default: 'manual' }, // Connection method
          lastVerifiedAt: { type: Date }, // Last time OAuth token was validated
        },
        { _id: false }
      ),
      default: {},
    },
    // Google OAuth connection data
    googleAuth: {
      type: new mongoose.Schema(
        {
          googleId: { type: String }, // Google user ID
          email: { type: String }, // Google email
          name: { type: String }, // Google display name
          picture: { type: String }, // Google profile picture
          encryptedAccessToken: { type: String }, // Encrypted OAuth token
          connectedAt: { type: Date }, // When OAuth was completed
          lastLoginAt: { type: Date }, // Last time user logged in with Google
        },
        { _id: false }
      ),
      default: {},
    },
    // Primary OAuth provider used for signup (if any)
    oauthProvider: { type: String, enum: ['google', 'github', null], default: null },
    // Email verification status
    emailVerified: { type: Boolean, default: false },
    
    // ========== GITHUB PROFILE INTEGRATION (Manual Connection) ==========
    // Connected GitHub username (for manual profile integration)
    connectedGithubUsername: { type: String, trim: true },
    
    // Category 1: GitHub Profile Overview
    githubProfile: {
      type: new mongoose.Schema(
        {
          avatar: { type: String },
          username: { type: String },
          name: { type: String },
          bio: { type: String },
          location: { type: String },
          blog: { type: String },
          company: { type: String },
          accountAge: { type: String },
          createdAt: { type: Date },
          publicRepos: { type: Number, default: 0 },
          followers: { type: Number, default: 0 },
          following: { type: Number, default: 0 },
          lastRefreshed: { type: Date },
        },
        { _id: false }
      ),
      default: null,
    },
    
    // Category 2: GitHub Repositories
    githubRepos: {
      type: new mongoose.Schema(
        {
          repos: {
            type: [new mongoose.Schema(
              {
                id: { type: Number },
                name: { type: String },
                fullName: { type: String },
                description: { type: String },
                language: { type: String },
                stars: { type: Number, default: 0 },
                forks: { type: Number, default: 0 },
                watchers: { type: Number, default: 0 },
                openIssues: { type: Number, default: 0 },
                isFork: { type: Boolean, default: false },
                isPrivate: { type: Boolean, default: false },
                url: { type: String },
                homepage: { type: String },
                topics: { type: [String], default: [] },
                createdAt: { type: Date },
                updatedAt: { type: Date },
                pushedAt: { type: Date },
                size: { type: Number },
                defaultBranch: { type: String },
              },
              { _id: false }
            )],
            default: [],
          },
          totalCount: { type: Number, default: 0 },
          originalRepos: { type: Number, default: 0 },
          forkedRepos: { type: Number, default: 0 },
          topLanguages: {
            type: [new mongoose.Schema(
              {
                language: { type: String },
                count: { type: Number },
              },
              { _id: false }
            )],
            default: [],
          },
          totalStars: { type: Number, default: 0 },
          totalForks: { type: Number, default: 0 },
          lastRefreshed: { type: Date },
        },
        { _id: false }
      ),
      default: null,
    },
    
    // Category 3: GitHub Coding Consistency
    githubConsistency: {
      type: new mongoose.Schema(
        {
          totalCommits: { type: Number, default: 0 },
          commitsPerWeek: { type: Number, default: 0 },
          activeWeeks: { type: Number, default: 0 },
          totalWeeks: { type: Number, default: 13 },
          consistencyPercentage: { type: Number, default: 0 },
          lastCommitDate: { type: Date },
          daysSinceLastCommit: { type: Number },
          weeklyBreakdown: {
            type: [new mongoose.Schema(
              {
                weekNumber: { type: Number },
                commits: { type: Number },
                weekStart: { type: String },
              },
              { _id: false }
            )],
            default: [],
          },
          consistencyScore: { type: Number, default: 0, min: 0, max: 100 },
          lastRefreshed: { type: Date },
        },
        { _id: false }
      ),
      default: null,
    },
    
    // Category 4: GitHub Open Source Contributions
    githubOpenSource: {
      type: new mongoose.Schema(
        {
          pullRequests: {
            opened: { type: Number, default: 0 },
            merged: { type: Number, default: 0 },
            closed: { type: Number, default: 0 },
            total: { type: Number, default: 0 },
          },
          issues: {
            opened: { type: Number, default: 0 },
            closed: { type: Number, default: 0 },
            total: { type: Number, default: 0 },
          },
          reviews: {
            given: { type: Number, default: 0 },
          },
          contributions: {
            reposContributedTo: { type: Number, default: 0 },
            reposList: { type: [String], default: [] },
          },
          openSourceScore: { type: Number, default: 0, min: 0, max: 100 },
          lastRefreshed: { type: Date },
        },
        { _id: false }
      ),
      default: null,
    },
    // ========== END GITHUB PROFILE INTEGRATION ==========
    
    validatedSkills: {
      type: [
        new mongoose.Schema(
          {
            name: { type: String, required: true },
            source: { type: String, enum: ['github', 'project', 'certificate', 'resume'], required: true },
            confidence: { type: Number, min: 0, max: 1, required: true },
            evidence: { type: [String], default: [] },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
    growthTimeline: {
      type: [
        new mongoose.Schema(
          {
            date: { type: Date, required: true, default: Date.now },
            readinessScore: { type: Number },
            reason: { type: String, required: true },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
    role: { type: String, default: 'student' },
    isProfileComplete: { type: Boolean, default: false },
    gamificationPoints: { type: Number, default: 0 },
    activityStreak: { type: Number, default: 0 },
    lastActivityDate: { type: Date },
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

// Derive trust badges dynamically for recruiter-facing responses
studentSchema.virtual('trustBadges').get(function () {
  const badges = [];
  
  // Verified Projects badge
  if (this.verifiedProjectsCount > 0) {
    badges.push('Verified Projects');
  }
  
  // Active Coder badge - GitHub or LeetCode activity in last 14 days
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  
  const hasRecentGitHubActivity = this.githubStats?.lastSyncedAt && 
    new Date(this.githubStats.lastSyncedAt) > fourteenDaysAgo;
  const hasRecentLeetCodeActivity = this.leetcodeStats?.fetchedAt && 
    new Date(this.leetcodeStats.fetchedAt) > fourteenDaysAgo;
  
  if (hasRecentGitHubActivity || hasRecentLeetCodeActivity) {
    badges.push('Active Coder');
  }
  
  // GitHub Contributor badge - OAuth verified or has repos
  if (this.githubAuth?.authType === 'oauth') {
    badges.push('GitHub Verified');
  } else if (this.githubStats?.totalRepos > 0) {
    badges.push('GitHub Contributor');
  }
  
  // Interview Ready badge - mock interview score > 70%
  // This would require checking InterviewSession collection, handled in controller
  
  // Certified Skills badge - at least 1 verified certification
  const verifiedCerts = this.certifications.filter(cert => cert.status === 'verified').length;
  if (verifiedCerts > 0) {
    badges.push('Certified Skills');
  }
  
  return badges;
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
