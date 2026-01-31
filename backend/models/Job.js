const mongoose = require('mongoose');

const matchedStudentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  matchScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  matchReason: {
    type: String,
    default: '',
  },
  skillsMatched: {
    type: [String],
    default: [],
  },
  skillsMissing: {
    type: [String],
    default: [],
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

const jobSchema = new mongoose.Schema(
  {
    // Recruiter Reference
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recruiter',
      required: true,
      index: true,
    },

    // Basic Job Info
    title: {
      type: String,
      required: true,
      trim: true,
    },
    company: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    jobType: {
      type: String,
      enum: ['Full-time', 'Internship', 'Contract', 'Part-time'],
      default: 'Full-time',
    },
    experience: {
      type: String,
      default: '0-2 years',
      trim: true,
    },
    salaryRange: {
      type: String,
      trim: true,
    },

    // AI-Generated Details
    description: {
      type: String,
      default: '',
    },
    responsibilities: {
      type: [String],
      default: [],
    },
    qualifications: {
      type: [String],
      default: [],
    },

    // Matching Criteria
    requiredSkills: {
      type: [String],
      default: [],
    },
    preferredSkills: {
      type: [String],
      default: [],
    },
    minReadinessScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    minCGPA: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },
    minProjects: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Matching Results (Cached)
    matchedStudents: {
      type: [matchedStudentSchema],
      default: [],
    },
    matchCount: {
      type: Number,
      default: 0,
    },
    lastMatchedAt: {
      type: Date,
    },

    // Metadata
    status: {
      type: String,
      enum: ['draft', 'active', 'closed', 'expired'],
      default: 'draft',
    },
    postedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    applicationCount: {
      type: Number,
      default: 0,
    },

    // Contact tracking
    contactedCandidates: [{
      studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
      },
      contactedAt: {
        type: Date,
        default: Date.now,
      },
    }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
jobSchema.index({ recruiterId: 1, status: 1 });
jobSchema.index({ postedAt: -1 });
jobSchema.index({ 'matchedStudents.matchScore': -1 });
jobSchema.index({ status: 1, expiresAt: 1 });

// Virtual for days since posted
jobSchema.virtual('daysPosted').get(function() {
  if (!this.postedAt) return 0;
  const diffTime = Math.abs(new Date() - this.postedAt);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Method to check if job is expired
jobSchema.methods.isExpired = function() {
  return this.expiresAt && new Date() > this.expiresAt;
};

// Method to get top matches
jobSchema.methods.getTopMatches = function(limit = 10) {
  return this.matchedStudents
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
};

// Pre-save middleware to auto-expire jobs
jobSchema.pre('save', function(next) {
  if (this.isExpired() && this.status === 'active') {
    this.status = 'expired';
  }
  next();
});

module.exports = mongoose.model('Job', jobSchema);
