const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const pendingVerificationSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    itemType: {
      type: String,
      enum: ['project', 'certification', 'event'],
      required: true,
    },
    itemId: { type: mongoose.Schema.Types.ObjectId },
    title: { type: String, trim: true },
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
    submittedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date },
    reviewerNotes: { type: String, trim: true },
  },
  { _id: true }
);

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, default: 'admin' },
    pendingVerifications: { type: [pendingVerificationSchema], default: [] },
    lastLoginAt: { type: Date },
    permissions: {
      type: [String],
      default: ['verify_submissions', 'manage_users', 'view_reports'],
    },
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

adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

adminSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) {
    const doc = await this.constructor.findById(this._id).select('+password');
    return bcrypt.compare(candidatePassword, doc.password);
  }
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Admin', adminSchema);
