const Groq = require('groq-sdk');
const dayjs = require('dayjs');

const MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

const truncate = (value, max = 280) => {
  if (!value) return '';
  const text = String(value).trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
};

const ensureArray = (value) => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

const formatDate = (value) => {
  if (!value) return null;
  const date = dayjs(value);
  if (!date.isValid()) return null;
  return date.format('YYYY-MM-DD');
};

const groqClient = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

const mapProject = (project) => ({
  title: truncate(project.title, 80),
  githubLink: project.githubLink || '',
  tags: ensureArray(project.tags || []).slice(0, 8),
  status: project.status || (project.verified ? 'verified' : 'pending'),
  verified: Boolean(project.verified || project.status === 'verified'),
  submittedAt: formatDate(project.submittedAt || project.createdAt),
  description: truncate(project.description || '', 220),
});

const mapCertification = (cert) => ({
  name: truncate(cert.name, 80),
  provider: truncate(cert.provider || '', 60),
  issuedDate: formatDate(cert.issuedDate),
  status: cert.status || 'pending',
  certificateId: cert.certificateId || '',
});

const mapEvent = (event) => ({
  name: truncate(event.name, 80),
  date: formatDate(event.date),
  location: truncate(event.location || '', 60),
  outcome: truncate(event.outcome || event.description || '', 200),
  status: event.status || 'pending',
});

const mapCodingLog = (log) => ({
  date: formatDate(log.date),
  platform: log.platform || 'Unknown',
  activity: truncate(log.activity || 'Practice', 120),
  minutesSpent: Number(log.minutesSpent) || 0,
  problemsSolved: Number(log.problemsSolved) || 0,
});

const mapReadinessHistory = (history) =>
  ensureArray(history)
    .slice(-6)
    .map((entry) => ({
      score: Number(entry.score) || 0,
      calculatedAt: formatDate(entry.calculatedAt),
    }));

const buildSkillInsights = (skillRadar = {}) => {
  const entries = Object.entries(skillRadar || {})
    .map(([skill, score]) => ({ skill, score: Number(score) || 0 }))
    .filter((item) => item.skill);

  if (!entries.length) {
    return { strongest: [], opportunities: [] };
  }

  const sorted = [...entries].sort((a, b) => b.score - a.score);
  return {
    strongest: sorted.slice(0, 3),
    opportunities: sorted.slice(-3).sort((a, b) => a.score - b.score),
  };
};

const buildStudentContext = (student, readiness = {}) => {
  const skillRadar = student.skillRadar || {};
  const skillInsights = buildSkillInsights(skillRadar);

  return {
    profile: {
      id: String(student._id || student.id || ''),
      name: truncate(student.name || `${student.firstName || ''} ${student.lastName || ''}`, 80),
      firstName: truncate(student.firstName || '', 40),
      lastName: truncate(student.lastName || '', 40),
      headline: truncate(student.headline || '', 160),
      summary: truncate(student.summary || '', 600),
      email: student.email || '',
      branch: student.branch || '',
      year: student.year || '',
      college: truncate(student.college || '', 120),
      graduationYear: student.graduationYear || null,
      cgpa: typeof student.cgpa === 'number' ? student.cgpa : null,
      location: truncate(student.location || '', 80),
    },
    readiness: {
      score: Number(readiness.total ?? student.readinessScore ?? 0) || 0,
      breakdown: readiness.breakdown || {},
      streakDays: Number(student.streakDays) || 0,
      lastActiveAt: formatDate(student.lastActiveAt),
      history: mapReadinessHistory(student.readinessHistory),
    },
    skills: {
      list: ensureArray(student.skills || []),
      radar: skillRadar,
      strongest: skillInsights.strongest,
      improvementAreas: skillInsights.opportunities,
      badges: ensureArray(student.badges || []),
    },
    academics: {
      certificationsCount: ensureArray(student.certifications).length,
      eventsCount: ensureArray(student.events).length,
      projectsCount: ensureArray(student.projects).length,
      verifiedProjects: ensureArray(student.projects).filter(
        (project) => project?.status === 'verified' || project?.verified
      ).length,
    },
    projects: {
      total: ensureArray(student.projects).length,
      items: ensureArray(student.projects)
        .slice(-5)
        .map(mapProject),
    },
    certifications: {
      total: ensureArray(student.certifications).length,
      items: ensureArray(student.certifications)
        .slice(-5)
        .map(mapCertification),
    },
    events: {
      total: ensureArray(student.events).length,
      items: ensureArray(student.events)
        .slice(-4)
        .map(mapEvent),
    },
    codingActivity: {
      profiles: student.codingProfiles || {},
      leetcodeStats: student.leetcodeStats || {},
      logsRecent: ensureArray(student.codingLogs)
        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
        .slice(0, 7)
        .map(mapCodingLog),
    },
    meta: {
      savedByRecruiters: ensureArray(student.savedForLater).length,
      generatedAt: new Date().toISOString(),
    },
  };
};

const normaliseMentorPayload = (data) => {
  if (!data || typeof data !== 'object') {
    throw new Error('Groq response missing structured payload');
  }

  const strengths = ensureArray(data.strengths || data.keyStrengths).map((item) => ({
    title: truncate(item.title || item.name || 'Strength', 80),
    detail: truncate(item.detail || item.description || item.reason || '', 220),
  }));

  const opportunitiesSource =
    data.opportunities || data.growthAreas || data.improvementAreas || [];

  const opportunities = ensureArray(opportunitiesSource).map((item) => ({
    title: truncate(item.title || item.area || 'Focus Area', 80),
    detail: truncate(item.detail || item.description || item.reason || '', 220),
    impact: truncate(item.impact || item.priority || 'Medium', 40),
    actions: ensureArray(item.actions || item.recommendations || item.suggestion).map((action) =>
      truncate(action, 180)
    ),
  }));

  const actionSource = data.actionPlan || data.action_plan || data.nextSteps || [];

  const actionPlan = ensureArray(actionSource).map((item) => ({
    title: truncate(item.title || item.focus || 'Action Item', 80),
    timeframe: truncate(item.timeframe || item.timeline || 'Next 2 weeks', 60),
    steps: ensureArray(item.steps || item.actions || item.tasks).map((step) =>
      truncate(step, 180)
    ),
    metrics: ensureArray(item.metrics || item.successMetrics || item.signals).map((metric) =>
      truncate(metric, 140)
    ),
    resources: ensureArray(item.resources || []).map((resource) => truncate(resource, 140)),
  }));

  const quickWins = ensureArray(data.quickWins || data.suggestedProjects || data.projects).map(
    (item) => truncate(item, 160)
  );

  return {
    overview:
      truncate(
        data.overview ||
          data.summary ||
          data.profileSummary ||
          'Personalised suggestions generated from current student profile.',
        420
      ),
    strengths,
    opportunities,
    actionPlan,
    quickWins,
    mindset: truncate(
      data.mindsetReminder ||
        data.encouragement ||
        data.finalNote ||
        'Stay consistent and iterate on your learning plan every week.',
      240
    ),
  };
};

const extractJson = (content) => {
  if (!content) return null;

  try {
    return JSON.parse(content);
  } catch (error) {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch (err) {
      return null;
    }
  }
};

async function generateMentorSuggestions(student, readiness) {
  if (!groqClient) {
    throw new Error('Groq AI is not configured. Please set GROQ_API_KEY.');
  }

  const context = buildStudentContext(student, readiness);

  const prompt = `You are EvolvEd's AI mentor. Analyse the student's profile, academic history, coding activity, skills, projects, certifications, events, readiness score trend, and badges. Build feedback that references specific evidence from the data. Provide actionable, empathetic guidance suitable for a university engineering student preparing for internships or placements.

Return a valid JSON object using this schema:
{
  "overview": string, // Two sentence summary grounded in their data
  "strengths": [{ "title": string, "detail": string }],
  "opportunities": [
    {
      "title": string,
      "detail": string,
      "impact": "High" | "Medium" | "Low",
      "actions": string[]
    }
  ],
  "actionPlan": [
    {
      "title": string,
      "timeframe": string,
      "steps": string[],
      "metrics": string[],
      "resources": string[]
    }
  ],
  "quickWins": string[],
  "mindsetReminder": string
}

Rules:
- Use the student data verbatim when citing achievements or gaps.
- Keep each string under 200 characters where possible.
- Prefer concise bullet-style phrasing for steps.
- Do not include markdown, code fences, or additional commentary.`;

  const completion = await groqClient.chat.completions.create({
    model: MODEL,
    temperature: 0.35,
    max_tokens: 1024,
    top_p: 0.9,
    messages: [
      {
        role: 'system',
        content:
          'You are an analytical-yet-encouraging AI mentor helping engineering students improve their placement readiness. Always ground your guidance in the provided data.',
      },
      {
        role: 'user',
        content: `${prompt}\n\nSTUDENT_CONTEXT_JSON:\n${JSON.stringify(context)}`,
      },
    ],
  });

  const content = completion?.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error('Groq AI returned an empty response');
  }

  const json = extractJson(content);
  if (!json) {
    throw new Error('Groq AI response was not valid JSON');
  }

  const payload = normaliseMentorPayload(json);

  return {
    ...payload,
    generatedAt: new Date().toISOString(),
    model: completion.model || MODEL,
    usage: completion.usage || null,
    context,
    raw: content,
  };
}

module.exports = {
  generateMentorSuggestions,
};
