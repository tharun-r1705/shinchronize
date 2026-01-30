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
  // Required fields for complete profile
  const requiredFields = [
    this.name,
    this.email,
    this.phone,
    this.company,
    this.role
  ];
  
  // Check if all required fields are filled
  const hasAllFields = requiredFields.every(field => field && field.toString().trim() !== '');
  
  // Must have at least one target role
  const hasTargetRoles = this.preferences?.roles?.length > 0;
  
  // Must have at least one preferred skill
  const hasPreferredSkills = this.preferences?.skills?.length > 0;
  
  // Update the actual field
  const isComplete = hasAllFields && hasTargetRoles && hasPreferredSkills;
  
  // Return the computed value
  return isComplete;
});

module.exports = mongoose.model('Recruiter', recruiterSchema);
