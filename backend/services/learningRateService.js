const Student = require('../models/Student');
const Roadmap = require('../models/Roadmap');
const ActivityLog = require('../models/ActivityLog');

// Constants for calculation
const WEIGHTS = {
  READINESS_VELOCITY: 0.25,
  MILESTONE_SPEED: 0.25,
  QUIZ_PERFORMANCE: 0.15,
  CODING_GROWTH: 0.15,
  SKILL_ACQUISITION: 0.10,
  PROJECT_VELOCITY: 0.10
};

const CATEGORIES = {
  FAST_LEARNER: { min: 70, max: 100, value: 'fast' },
  STEADY_LEARNER: { min: 40, max: 69, value: 'steady' },
  DEVELOPING: { min: 0, max: 39, value: 'developing' }
};

const MIN_DAYS_ON_PLATFORM = 14; // 2 weeks
const MIN_DATA_POINTS = 2;

/**
 * Calculate learning rate for a student
 * @param {String} studentId - Student ID
 * @returns {Object} Learning metrics with score, category, components
 */
async function calculateLearningRate(studentId) {
  try {
    const student = await Student.findById(studentId);
    if (!student) {
      throw new Error('Student not found');
    }

    // Check if student has enough data
    const hasEnough = hasEnoughData(student);
    if (!hasEnough.result) {
      return {
        learningRate: null,
        learningCategory: 'not_determined',
        components: {
          readinessVelocity: 0,
          milestoneSpeed: 0,
          quizPerformance: 0,
          codingGrowth: 0,
          skillAcquisition: 0,
          projectVelocity: 0
        },
        dataPointsUsed: hasEnough.dataPoints,
        trend: 'steady',
        message: 'Insufficient data. Keep learning to unlock your learning rate!'
      };
    }

    // Calculate each component
    const readinessVelocity = await calculateReadinessVelocity(student);
    const milestoneSpeed = await calculateMilestoneSpeed(studentId);
    const quizPerformance = await calculateQuizPerformance(studentId);
    const codingGrowth = calculateCodingGrowth(student);
    const skillAcquisition = calculateSkillAcquisition(student);
    const projectVelocity = calculateProjectVelocity(student);

    // Calculate weighted learning rate
    const learningRate = Math.round(
      (readinessVelocity * WEIGHTS.READINESS_VELOCITY) +
      (milestoneSpeed * WEIGHTS.MILESTONE_SPEED) +
      (quizPerformance * WEIGHTS.QUIZ_PERFORMANCE) +
      (codingGrowth * WEIGHTS.CODING_GROWTH) +
      (skillAcquisition * WEIGHTS.SKILL_ACQUISITION) +
      (projectVelocity * WEIGHTS.PROJECT_VELOCITY)
    );

    // Determine category
    const category = getLearningCategory(learningRate);

    // Determine trend (compare to last learning rate if exists)
    let trend = 'steady';
    if (student.learningMetrics?.history?.length > 0) {
      const lastRate = student.learningMetrics.history[student.learningMetrics.history.length - 1].learningRate;
      if (learningRate > lastRate + 5) trend = 'accelerating';
      else if (learningRate < lastRate - 5) trend = 'slowing';
    }

    return {
      learningRate: Math.min(100, Math.max(0, learningRate)), // Clamp between 0-100
      learningCategory: category,
      components: {
        readinessVelocity: Math.round(readinessVelocity),
        milestoneSpeed: Math.round(milestoneSpeed),
        quizPerformance: Math.round(quizPerformance),
        codingGrowth: Math.round(codingGrowth),
        skillAcquisition: Math.round(skillAcquisition),
        projectVelocity: Math.round(projectVelocity)
      },
      dataPointsUsed: hasEnough.dataPoints,
      trend,
      calculatedAt: new Date()
    };
  } catch (error) {
    console.error('Error calculating learning rate:', error);
    throw error;
  }
}

/**
 * Calculate readiness score velocity (points gained per week)
 * @param {Object} student - Student document
 * @returns {Number} Score 0-100
 */
function calculateReadinessVelocity(student) {
  const history = student.readinessHistory || [];
  
  if (history.length < 2) return 0;

  // Get first and last readiness scores
  const first = history[0];
  const last = history[history.length - 1];
  
  const scoreDiff = last.score - first.score;
  const timeDiff = (last.calculatedAt - first.calculatedAt) / (1000 * 60 * 60 * 24); // Days
  
  if (timeDiff === 0) return 0;
  
  const pointsPerWeek = (scoreDiff / timeDiff) * 7;
  
  // Normalize: 5 points/week = 100 score, 0 or negative = 0 score
  const normalized = Math.min(100, Math.max(0, (pointsPerWeek / 5) * 100));
  
  return normalized;
}

/**
 * Calculate milestone completion speed (vs expected duration)
 * @param {String} studentId - Student ID
 * @returns {Number} Score 0-100
 */
async function calculateMilestoneSpeed(studentId) {
  try {
    const roadmaps = await Roadmap.find({ student: studentId });
    
    let totalScore = 0;
    let count = 0;

    for (const roadmap of roadmaps) {
      const completedMilestones = roadmap.milestones.filter(m => m.status === 'completed' && m.completedAt && m.startedAt);
      
      for (const milestone of completedMilestones) {
        const actualDays = (milestone.completedAt - milestone.startedAt) / (1000 * 60 * 60 * 24);
        const expectedDays = milestone.expectedDurationDays || parseDuration(milestone.duration);
        
        if (expectedDays > 0) {
          // If completed faster = higher score
          // If completed slower = lower score
          const ratio = expectedDays / actualDays;
          const score = Math.min(100, Math.max(0, ratio * 100));
          totalScore += score;
          count++;
        }
      }
    }

    return count > 0 ? totalScore / count : 50; // Default to 50 if no data
  } catch (error) {
    console.error('Error calculating milestone speed:', error);
    return 50;
  }
}

/**
 * Calculate quiz performance (first-attempt pass rate & avg score)
 * @param {String} studentId - Student ID
 * @returns {Number} Score 0-100
 */
async function calculateQuizPerformance(studentId) {
  try {
    const roadmaps = await Roadmap.find({ student: studentId });
    
    let totalScore = 0;
    let count = 0;
    let passCount = 0;
    let totalAttempts = 0;

    for (const roadmap of roadmaps) {
      for (const milestone of roadmap.milestones) {
        if (milestone.quizAttempts && milestone.quizAttempts.length > 0) {
          // First attempt score
          const firstAttempt = milestone.quizAttempts[0];
          totalScore += firstAttempt.score;
          count++;
          
          // Check if passed on first attempt
          if (firstAttempt.score >= 70) passCount++;
          totalAttempts++;
        }
      }
    }

    if (count === 0) return 50; // Default to 50 if no data

    const avgFirstAttemptScore = totalScore / count;
    const firstAttemptPassRate = totalAttempts > 0 ? (passCount / totalAttempts) * 100 : 0;

    // Weighted: 70% avg score, 30% pass rate
    return (avgFirstAttemptScore * 0.7) + (firstAttemptPassRate * 0.3);
  } catch (error) {
    console.error('Error calculating quiz performance:', error);
    return 50;
  }
}

/**
 * Calculate coding platform growth rate
 * @param {Object} student - Student document
 * @returns {Number} Score 0-100
 */
function calculateCodingGrowth(student) {
  let totalActivity = 0;
  let platforms = 0;

  // LeetCode activity
  if (student.leetcodeStats?.recentActivity?.last30Days > 0) {
    totalActivity += student.leetcodeStats.recentActivity.last30Days;
    platforms++;
  }

  // HackerRank activity
  if (student.hackerrankStats?.recentActivity?.last30Days > 0) {
    totalActivity += student.hackerrankStats.recentActivity.last30Days;
    platforms++;
  }

  // GitHub activity (commits)
  if (student.githubStats?.recentActivity?.last30Days > 0) {
    totalActivity += student.githubStats.recentActivity.last30Days;
    platforms++;
  }

  if (platforms === 0) return 0;

  // Normalize: 60 problems/commits per month = 100 score
  const avgActivity = totalActivity / platforms;
  const normalized = Math.min(100, (avgActivity / 60) * 100);

  return normalized;
}

/**
 * Calculate skill acquisition rate
 * @param {Object} student - Student document
 * @returns {Number} Score 0-100
 */
function calculateSkillAcquisition(student) {
  const skills = student.skills || [];
  const accountAge = (Date.now() - student.createdAt) / (1000 * 60 * 60 * 24); // Days
  
  if (accountAge < 7) return 0; // Too new
  
  const skillsPerMonth = (skills.length / accountAge) * 30;
  
  // Normalize: 4 skills/month = 100 score
  const normalized = Math.min(100, (skillsPerMonth / 4) * 100);
  
  return normalized;
}

/**
 * Calculate project completion velocity
 * @param {Object} student - Student document
 * @returns {Number} Score 0-100
 */
function calculateProjectVelocity(student) {
  const projects = student.projects || [];
  const verifiedProjects = projects.filter(p => p.status === 'verified' || p.verified);
  
  if (verifiedProjects.length === 0) return 0;

  const accountAge = (Date.now() - student.createdAt) / (1000 * 60 * 60 * 24); // Days
  
  if (accountAge < 7) return 0;
  
  const projectsPerMonth = (verifiedProjects.length / accountAge) * 30;
  
  // Normalize: 2 projects/month = 100 score
  const normalized = Math.min(100, (projectsPerMonth / 2) * 100);
  
  return normalized;
}

/**
 * Determine learning category from score
 * @param {Number} score - Learning rate score (0-100)
 * @returns {String} Category: fast, steady, developing
 */
function getLearningCategory(score) {
  if (score >= CATEGORIES.FAST_LEARNER.min) return CATEGORIES.FAST_LEARNER.value;
  if (score >= CATEGORIES.STEADY_LEARNER.min) return CATEGORIES.STEADY_LEARNER.value;
  return CATEGORIES.DEVELOPING.value;
}

/**
 * Check if student has enough data for learning rate calculation
 * @param {Object} student - Student document
 * @returns {Object} { result: boolean, dataPoints: number }
 */
function hasEnoughData(student) {
  const accountAge = (Date.now() - student.createdAt) / (1000 * 60 * 60 * 24); // Days
  
  if (accountAge < MIN_DAYS_ON_PLATFORM) {
    return { result: false, dataPoints: 0 };
  }

  let dataPoints = 0;

  // Check readiness history
  if (student.readinessHistory?.length >= 2) dataPoints++;

  // Check coding activity
  const hasCodeActivity = 
    (student.leetcodeStats?.activeDays > 5) ||
    (student.hackerrankStats?.activeDays > 5) ||
    (student.githubStats?.activeDays > 5);
  if (hasCodeActivity) dataPoints++;

  // Check projects
  if (student.projects?.length > 0) dataPoints++;

  // Check skills
  if (student.skills?.length > 0) dataPoints++;

  return { result: dataPoints >= MIN_DATA_POINTS, dataPoints };
}

/**
 * Save learning rate to student document
 * @param {String} studentId - Student ID
 * @param {Object} metrics - Learning metrics object
 */
async function saveLearningRate(studentId, metrics) {
  try {
    const student = await Student.findById(studentId);
    if (!student) throw new Error('Student not found');

    // Update current metrics
    student.learningMetrics = {
      learningRate: metrics.learningRate,
      learningCategory: metrics.learningCategory,
      components: metrics.components,
      calculatedAt: metrics.calculatedAt || new Date(),
      dataPointsUsed: metrics.dataPointsUsed,
      trend: metrics.trend,
      history: student.learningMetrics?.history || []
    };

    // Add to history (keep last 10 entries)
    if (metrics.learningRate !== null) {
      student.learningMetrics.history.push({
        learningRate: metrics.learningRate,
        category: metrics.learningCategory,
        calculatedAt: metrics.calculatedAt || new Date()
      });

      // Keep only last 10 history entries
      if (student.learningMetrics.history.length > 10) {
        student.learningMetrics.history = student.learningMetrics.history.slice(-10);
      }
    }

    await student.save();
    return student.learningMetrics;
  } catch (error) {
    console.error('Error saving learning rate:', error);
    throw error;
  }
}

/**
 * Parse duration string to days
 * @param {String} duration - e.g., "2 weeks", "1 month"
 * @returns {Number} Duration in days
 */
function parseDuration(duration) {
  if (!duration) return 14; // Default 2 weeks

  const lower = duration.toLowerCase();
  
  // Extract number
  const match = lower.match(/(\d+)\s*(day|week|month|year)/);
  if (!match) return 14;

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case 'day':
      return value;
    case 'week':
      return value * 7;
    case 'month':
      return value * 30;
    case 'year':
      return value * 365;
    default:
      return 14;
  }
}

/**
 * Get detailed learning rate breakdown for a student
 * @param {String} studentId - Student ID
 * @returns {Object} Detailed breakdown with tips
 */
async function getLearningRateBreakdown(studentId) {
  try {
    const student = await Student.findById(studentId);
    if (!student) throw new Error('Student not found');

    const metrics = student.learningMetrics;
    if (!metrics || metrics.learningCategory === 'not_determined') {
      return {
        category: 'not_determined',
        message: 'Keep learning! Complete more activities to unlock your learning rate.',
        tips: [
          'Complete roadmap milestones',
          'Sync your LeetCode/GitHub accounts',
          'Take quizzes and pass them',
          'Build and submit projects',
          'Add new skills to your profile'
        ]
      };
    }

    // Find weakest components
    const components = metrics.components;
    const sortedComponents = Object.entries(components)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 2); // Get 2 weakest

    const tips = [];
    for (const [component, score] of sortedComponents) {
      tips.push(getTipForComponent(component, score));
    }

    return {
      learningRate: metrics.learningRate,
      category: metrics.learningCategory,
      components: metrics.components,
      trend: metrics.trend,
      calculatedAt: metrics.calculatedAt,
      tips,
      history: metrics.history
    };
  } catch (error) {
    console.error('Error getting learning rate breakdown:', error);
    throw error;
  }
}

/**
 * Get improvement tip for a component
 * @param {String} component - Component name
 * @param {Number} score - Current score
 * @returns {String} Tip
 */
function getTipForComponent(component, score) {
  const tips = {
    readinessVelocity: 'Improve your overall readiness by completing more projects, certifications, and coding challenges.',
    milestoneSpeed: 'Try to complete roadmap milestones faster. Set focused time blocks for learning.',
    quizPerformance: 'Review concepts before taking quizzes. Aim to pass on your first attempt.',
    codingGrowth: 'Solve more LeetCode/HackerRank problems. Aim for at least 2 problems per day.',
    skillAcquisition: 'Learn new skills regularly. Add them to your profile as you go.',
    projectVelocity: 'Build and complete projects faster. Start with smaller projects and scale up.'
  };

  return tips[component] || 'Keep practicing and improving!';
}

/**
 * Trigger learning rate recalculation (called from various triggers)
 * @param {String} studentId - Student ID
 * @returns {Promise} Resolves when calculation is complete
 */
async function triggerLearningRateUpdate(studentId) {
  try {
    // Don't wait for completion, run asynchronously
    setImmediate(async () => {
      try {
        const metrics = await calculateLearningRate(studentId);
        await saveLearningRate(studentId, metrics);
        console.log(`Learning rate updated for student ${studentId}: ${metrics.learningRate}`);
      } catch (error) {
        console.error(`Error updating learning rate for student ${studentId}:`, error.message);
      }
    });
  } catch (error) {
    console.error('Error triggering learning rate update:', error);
  }
}

module.exports = {
  calculateLearningRate,
  saveLearningRate,
  getLearningCategory,
  hasEnoughData,
  getLearningRateBreakdown,
  parseDuration,
  triggerLearningRateUpdate,
};
