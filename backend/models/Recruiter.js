const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const recruiterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    company: { type: String, trim: true },
    role: { type: String, trim: true },
    phone: { type: String, trim: true },
    profilePicture: { type: String, default: null }, // URL to profile picture
    savedCandidates: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
    activeJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
    contactedCandidates: [
      {
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
        lastContactedAt: { type: Date },
        contactCount: { type: Number, default: 1 },
      }
    ],
    preferences: {
      roles: { type: [String], default: [] },
      minScore: { type: Number, default: 0 },
      skills: { type: [String], default: [] },
    },
    emailSettings: {
      smtpHost: { type: String, default: null },
      smtpPort: { type: Number, default: null },
      smtpUser: { type: String, default: null },
      smtpPass: { type: String, default: null, select: false }, // Keep password secure
      fromEmail: { type: String, default: null },
      isConfigured: { type: Boolean, default: false },
    },
    lastLoginAt: { type: Date },
    isVerified: { type: Boolean, default: false },
    accountStatus: {
      type: String,
      enum: ['active', 'suspended', 'invited'],
      default: 'active',
    },
    profileCompleted: { type: Boolean, default: false },
    userType: { type: String, default: 'recruiter' },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

recruiterSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

recruiterSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) {
    const doc = await this.constructor.findById(this._id).select('+password');
    return bcrypt.compare(candidatePassword, doc.password);
  }
  return bcrypt.compare(candidatePassword, this.password);
};

// Virtual field to check if recruiter profile is complete
recruiterSchema.virtual('isProfileComplete').get(function() {
  // Recruiter profile is optional (no mandatory completeness gate)
  return true;
});

module.exports = mongoose.model('Recruiter', recruiterSchema);
