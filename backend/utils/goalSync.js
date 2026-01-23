const inferTargetValueFromText = (text) => {
  if (!text) return null;
  const match = String(text).match(/(\d{1,4})/);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
};

const inferAutoTrack = (category = 'other', title = '', description = '') => {
  const text = `${title} ${description}`.toLowerCase();

  if (category === 'project' || text.includes('project')) return 'projects';
  if (category === 'certification' || text.includes('certif')) return 'certifications';
  if (category === 'coding' || text.includes('leetcode') || text.includes('hackerrank') || text.includes('problem')) {
    return 'coding_problems';
  }
  if (category === 'skill' || text.includes('skill')) return 'skills';

  return 'none';
};

const inferUnit = (autoTrack, category = 'other') => {
  switch (autoTrack) {
    case 'projects':
      return 'projects';
    case 'certifications':
      return 'certifications';
    case 'coding_problems':
      return 'problems';
    case 'coding_logs':
      return 'logs';
    case 'skills':
      return 'skills';
    default:
      break;
  }

  if (category === 'project') return 'projects';
  if (category === 'certification') return 'certifications';
  if (category === 'coding') return 'problems';
  if (category === 'skill') return 'skills';

  return 'steps';
};

const getAutoTrackValue = (student, autoTrack) => {
  if (!student) return 0;

  switch (autoTrack) {
    case 'projects':
      return (student.projects || []).length;
    case 'certifications':
      return (student.certifications || []).length;
    case 'coding_problems': {
      const fromStats = Number(student.leetcodeStats?.totalSolved || 0);
      if (fromStats > 0) return fromStats;
      return (student.codingLogs || []).reduce((sum, log) => sum + (Number(log.problemsSolved) || 0), 0);
    }
    case 'coding_logs':
      return (student.codingLogs || []).length;
    case 'skills':
      return Math.max((student.skills || []).length, Object.keys(student.skillRadar || {}).length);
    default:
      return 0;
  }
};

const computeProgress = (currentValue, targetValue) => {
  if (!Number.isFinite(targetValue) || targetValue <= 0) return 0;
  if (!Number.isFinite(currentValue)) return 0;
  return Math.min(100, Math.round((currentValue / targetValue) * 100));
};

const syncAutoGoals = (student) => {
  if (!student || !Array.isArray(student.goals)) return false;

  let modified = false;

  student.goals.forEach((goal) => {
    const autoTrack = goal.autoTrack || 'none';
    if (autoTrack === 'none' || goal.status === 'abandoned') return;

    const currentValue = getAutoTrackValue(student, autoTrack);
    if (goal.currentValue !== currentValue) {
      goal.currentValue = currentValue;
      modified = true;
    }

    if (Number.isFinite(goal.targetValue) && goal.targetValue > 0) {
      const progress = computeProgress(currentValue, goal.targetValue);
      if (goal.progress !== progress) {
        goal.progress = progress;
        modified = true;
      }

      const nextStatus = progress >= 100 ? 'completed' : progress > 0 ? 'in_progress' : 'pending';
      if (goal.status !== nextStatus) {
        goal.status = nextStatus;
        modified = true;
      }

      if (nextStatus === 'completed' && !goal.completedAt) {
        goal.completedAt = new Date();
        modified = true;
      } else if (nextStatus !== 'completed' && goal.completedAt) {
        goal.completedAt = null;
        modified = true;
      }
    }
  });

  return modified;
};

module.exports = {
  inferTargetValueFromText,
  inferAutoTrack,
  inferUnit,
  getAutoTrackValue,
  computeProgress,
  syncAutoGoals,
};
