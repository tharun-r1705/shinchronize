const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      // Skill Achievements
      'first_skill', 'skill_master', 'polyglot', 'framework_expert',
      // Coding Platform
      'leetcode_warrior', 'hackerrank_champion', 'problem_solver',
      // GitHub
      'first_commit', 'contributor', 'open_source_hero', 'streak_keeper',
      // Profile
      'profile_complete', 'resume_uploaded', 'github_connected',
      // Interview
      'interview_ready', 'mock_master', 'interview_ace',
      // Engagement
      'early_bird', 'night_owl', 'daily_grind', 'week_warrior', 'monthly_champion',
      // Milestones
      'top_10', 'top_50', 'top_100', 'score_milestone_50', 'score_milestone_75', 'score_milestone_90',
      // Social
      'endorsement_received', 'endorsement_given', 'mentor',
      // Special
      'verified_student', 'trendsetter', 'fast_learner'
    ]
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  rarity: {
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  points: {
    type: Number,
    default: 0
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  unlockedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
achievementSchema.index({ student: 1, type: 1 }, { unique: true });
achievementSchema.index({ student: 1, unlockedAt: -1 });

module.exports = mongoose.model('Achievement', achievementSchema);
