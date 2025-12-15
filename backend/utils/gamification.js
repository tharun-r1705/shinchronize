const Achievement = require('../models/Achievement');
const Student = require('../models/Student');
const { createNotification } = require('../controllers/notificationController');

// Achievement definitions
const ACHIEVEMENTS = {
  // Skill Achievements (10-25 points)
  first_skill: { name: 'First Steps', description: 'Added your first skill', icon: '🌱', rarity: 'common', points: 10 },
  skill_master: { name: 'Skill Master', description: 'Mastered 10+ skills', icon: '🎯', rarity: 'rare', points: 50 },
  polyglot: { name: 'Polyglot', description: 'Know 5+ programming languages', icon: '💬', rarity: 'epic', points: 75 },
  framework_expert: { name: 'Framework Expert', description: 'Proficient in 3+ frameworks', icon: '⚡', rarity: 'rare', points: 60 },
  
  // Coding Platform (25-100 points)
  leetcode_warrior: { name: 'LeetCode Warrior', description: 'Solved 100+ LeetCode problems', icon: '⚔️', rarity: 'epic', points: 100 },
  hackerrank_champion: { name: 'HackerRank Champion', description: 'Earned 1000+ HackerRank points', icon: '🏆', rarity: 'epic', points: 100 },
  problem_solver: { name: 'Problem Solver', description: 'Solved 50+ coding problems', icon: '🧩', rarity: 'rare', points: 50 },
  
  // GitHub (15-75 points)
  first_commit: { name: 'First Commit', description: 'Made your first GitHub commit', icon: '🎉', rarity: 'common', points: 15 },
  contributor: { name: 'Contributor', description: 'Contributed to 5+ repositories', icon: '👥', rarity: 'rare', points: 60 },
  open_source_hero: { name: 'Open Source Hero', description: 'Contributed to open source projects', icon: '🦸', rarity: 'epic', points: 100 },
  streak_keeper: { name: 'Streak Keeper', description: 'Maintained 30-day GitHub streak', icon: '🔥', rarity: 'legendary', points: 150 },
  
  // Profile (10-50 points)
  profile_complete: { name: 'Profile Complete', description: 'Completed 100% of profile', icon: '✅', rarity: 'common', points: 20 },
  resume_uploaded: { name: 'Resume Ready', description: 'Uploaded your resume', icon: '📄', rarity: 'common', points: 15 },
  github_connected: { name: 'Connected', description: 'Linked GitHub account', icon: '🔗', rarity: 'common', points: 25 },
  
  // Interview (30-100 points)
  interview_ready: { name: 'Interview Ready', description: 'Completed mock interview', icon: '🎤', rarity: 'rare', points: 50 },
  mock_master: { name: 'Mock Master', description: 'Completed 5+ mock interviews', icon: '🎭', rarity: 'epic', points: 100 },
  interview_ace: { name: 'Interview Ace', description: 'Scored 90+ in mock interview', icon: '⭐', rarity: 'legendary', points: 150 },
  
  // Engagement (20-75 points)
  early_bird: { name: 'Early Bird', description: 'Active before 8 AM', icon: '🌅', rarity: 'rare', points: 30 },
  night_owl: { name: 'Night Owl', description: 'Active after midnight', icon: '🦉', rarity: 'rare', points: 30 },
  daily_grind: { name: 'Daily Grind', description: '7-day activity streak', icon: '💪', rarity: 'rare', points: 40 },
  week_warrior: { name: 'Week Warrior', description: '30-day activity streak', icon: '⚡', rarity: 'epic', points: 75 },
  monthly_champion: { name: 'Monthly Champion', description: '90-day activity streak', icon: '👑', rarity: 'legendary', points: 150 },
  
  // Milestones (25-200 points)
  top_10: { name: 'Top 10', description: 'Ranked in top 10 on leaderboard', icon: '🥇', rarity: 'legendary', points: 200 },
  top_50: { name: 'Top 50', description: 'Ranked in top 50 on leaderboard', icon: '🥈', rarity: 'epic', points: 100 },
  top_100: { name: 'Top 100', description: 'Ranked in top 100 on leaderboard', icon: '🥉', rarity: 'rare', points: 50 },
  score_milestone_50: { name: 'Half Century', description: 'Reached 50 readiness score', icon: '5️⃣', rarity: 'common', points: 25 },
  score_milestone_75: { name: 'Three Quarters', description: 'Reached 75 readiness score', icon: '7️⃣', rarity: 'rare', points: 50 },
  score_milestone_90: { name: 'Excellence', description: 'Reached 90 readiness score', icon: '9️⃣', rarity: 'legendary', points: 150 },
  
  // Social (15-60 points)
  endorsement_received: { name: 'Endorsed', description: 'Received first endorsement', icon: '👍', rarity: 'common', points: 15 },
  endorsement_given: { name: 'Supporter', description: 'Endorsed 5+ students', icon: '🤝', rarity: 'rare', points: 40 },
  mentor: { name: 'Mentor', description: 'Helped 10+ students', icon: '🧑‍🏫', rarity: 'epic', points: 80 },
  
  // Special (50-250 points)
  verified_student: { name: 'Verified', description: 'Admin verified profile', icon: '✓', rarity: 'rare', points: 50 },
  trendsetter: { name: 'Trendsetter', description: 'Among first 100 users', icon: '🌟', rarity: 'legendary', points: 200 },
  fast_learner: { name: 'Fast Learner', description: 'Gained 50 points in 7 days', icon: '⚡', rarity: 'epic', points: 100 }
};

// Unlock achievement for a student
async function unlockAchievement(studentId, achievementType) {
  try {
    // Check if already unlocked
    const existing = await Achievement.findOne({
      student: studentId,
      type: achievementType
    });
    
    if (existing) {
      return { success: false, message: 'Achievement already unlocked' };
    }
    
    const achievementDef = ACHIEVEMENTS[achievementType];
    if (!achievementDef) {
      return { success: false, message: 'Invalid achievement type' };
    }
    
    // Create achievement
    const achievement = await Achievement.create({
      student: studentId,
      type: achievementType,
      ...achievementDef
    });
    
    // Update student points
    await Student.findByIdAndUpdate(studentId, {
      $inc: { gamificationPoints: achievementDef.points }
    });
    
    // Send notification
    await createNotification(studentId, 'Student', {
      type: 'achievement_unlocked',
      title: `Achievement Unlocked: ${achievementDef.name}!`,
      message: `You earned ${achievementDef.points} points! ${achievementDef.description}`,
      metadata: { achievement: achievementType, points: achievementDef.points },
      priority: achievementDef.rarity === 'legendary' ? 'high' : 'medium',
      actionUrl: '/profile?tab=achievements'
    });
    
    return { success: true, achievement, points: achievementDef.points };
  } catch (error) {
    console.error('Error unlocking achievement:', error);
    return { success: false, message: error.message };
  }
}

// Check and award achievements based on student data
async function checkAchievements(studentId) {
  try {
    const student = await Student.findById(studentId);
    if (!student) return;
    
    const achievements = [];
    
    // Skill achievements
    if (student.skills?.length >= 1) {
      achievements.push(await unlockAchievement(studentId, 'first_skill'));
    }
    if (student.skills?.length >= 10) {
      achievements.push(await unlockAchievement(studentId, 'skill_master'));
    }
    
    // Coding platform
    if (student.platforms?.leetcode?.problemsSolved >= 100) {
      achievements.push(await unlockAchievement(studentId, 'leetcode_warrior'));
    }
    if (student.platforms?.hackerrank?.score >= 1000) {
      achievements.push(await unlockAchievement(studentId, 'hackerrank_champion'));
    }
    
    // GitHub
    if (student.githubAuth?.username) {
      achievements.push(await unlockAchievement(studentId, 'github_connected'));
    }
    
    // Profile completion
    const completionPercentage = calculateProfileCompletion(student);
    if (completionPercentage === 100) {
      achievements.push(await unlockAchievement(studentId, 'profile_complete'));
    }
    
    // Score milestones
    const readinessScore = student.readinessScore || 0;
    if (readinessScore >= 50) {
      achievements.push(await unlockAchievement(studentId, 'score_milestone_50'));
    }
    if (readinessScore >= 75) {
      achievements.push(await unlockAchievement(studentId, 'score_milestone_75'));
    }
    if (readinessScore >= 90) {
      achievements.push(await unlockAchievement(studentId, 'score_milestone_90'));
    }
    
    // Verification
    if (student.isVerified) {
      achievements.push(await unlockAchievement(studentId, 'verified_student'));
    }
    
    return achievements.filter(a => a && a.success);
  } catch (error) {
    console.error('Error checking achievements:', error);
    return [];
  }
}

function calculateProfileCompletion(student) {
  let completed = 0;
  let total = 10;
  
  if (student.name) completed++;
  if (student.email) completed++;
  if (student.college) completed++;
  if (student.branch) completed++;
  if (student.yearOfGraduation) completed++;
  if (student.cgpa) completed++;
  if (student.skills?.length > 0) completed++;
  if (student.projects?.length > 0) completed++;
  if (student.resumeUrl) completed++;
  if (student.githubAuth?.username || student.githubUrl) completed++;
  
  return Math.round((completed / total) * 100);
}

// Get student achievements
async function getStudentAchievements(studentId) {
  try {
    const achievements = await Achievement.find({ student: studentId })
      .sort({ unlockedAt: -1 });
    
    const totalPoints = achievements.reduce((sum, a) => sum + a.points, 0);
    const byRarity = achievements.reduce((acc, a) => {
      acc[a.rarity] = (acc[a.rarity] || 0) + 1;
      return acc;
    }, {});
    
    return {
      achievements,
      totalPoints,
      count: achievements.length,
      byRarity
    };
  } catch (error) {
    console.error('Error getting achievements:', error);
    return { achievements: [], totalPoints: 0, count: 0, byRarity: {} };
  }
}

// Get leaderboard
async function getLeaderboard(limit = 100) {
  try {
    const students = await Student.find({ gamificationPoints: { $gt: 0 } })
      .sort({ gamificationPoints: -1 })
      .limit(limit)
      .select('name email college readinessScore gamificationPoints');
    
    return students.map((student, index) => ({
      rank: index + 1,
      student,
      points: student.gamificationPoints || 0
    }));
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return [];
  }
}

module.exports = {
  unlockAchievement,
  checkAchievements,
  getStudentAchievements,
  getLeaderboard,
  ACHIEVEMENTS
};
