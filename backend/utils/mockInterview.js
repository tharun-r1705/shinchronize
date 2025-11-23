const Groq = require('groq-sdk');
const dayjs = require('dayjs');

const DEFAULT_MODEL = process.env.GROQ_INTERVIEW_MODEL || 'llama-3.1-8b-instant';

let groqClient;

const rubricKeys = ['clarity', 'technicalAccuracy', 'communication', 'relevance', 'confidence'];
const DEFAULT_OPTION_KEYS = ['A', 'B', 'C', 'D'];

const ensureGroqClient = () => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured. Please add it to your environment.');
  }

  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }

  return groqClient;
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
    } catch (parseError) {
      return null;
    }
  }
};

const formatTurnsForPrompt = (turns = []) =>
  turns
    .filter((turn) => turn.answer)
    .slice(-3)
    .map((turn) => ({
      question: turn.question,
      answer: (turn.answer || '').slice(0, 600),
      difficulty: turn.difficulty,
      rubric: turn.rubric || {},
      askedAt: turn.askedAt ? dayjs(turn.askedAt).format('YYYY-MM-DD HH:mm') : null,
    }));

const normaliseDifficulty = (value, fallback = 'medium') => {
  const map = {
    easy: 'easy',
    beginner: 'easy',
    foundation: 'easy',
    medium: 'medium',
    intermediate: 'medium',
    hard: 'hard',
    advanced: 'hard',
    expert: 'expert',
    extreme: 'expert',
  };

  if (!value) return fallback;
  const key = String(value).toLowerCase();
  return map[key] || fallback;
};

const clampScore = (value) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return 0;
  return Math.min(10, Math.max(0, parsed));
};

const computeOverall = (rubric = {}) => {
  const total = rubricKeys.reduce((acc, key) => acc + (Number(rubric[key]) || 0), 0);
  return rubricKeys.length ? total / rubricKeys.length : 0;
};

const buildQuestionPrompt = (session) => {
  const history = formatTurnsForPrompt(session.turns || []);
  const answered = session.meta?.totalAnswers || history.length;
  const totalTarget = session.maxQuestions || session.meta?.maxQuestions || 10;
  const questionNumber = Math.min(answered + 1, totalTarget);

  return `ROLE: ${session.role}\nLEVEL: ${session.roleLevel}\nMODE: ${session.mode || 'test'}\nQUESTION_NUMBER: ${questionNumber} of ${totalTarget}\nFOCUS_AREAS: ${(session.focusAreas || []).join(', ') || 'core fundamentals'}\nCURRENT_DIFFICULTY: ${session.currentDifficulty}\nRECENT_HISTORY: ${history.length ? JSON.stringify(history) : '[]'}\nNEXT_OBJECTIVE: Ask one multiple-choice technical question aligned with the candidate level. Make it concise and require choosing the single best answer.`;
};

const buildEvaluationPrompt = ({ session, question, answer, options, selectedOptionKey }) => {
  const history = formatTurnsForPrompt(session.turns || []);

  return `ROLE: ${session.role}\nLEVEL: ${session.roleLevel}\nQUESTION: ${question}\nOPTIONS: ${JSON.stringify(options || [])}\nSELECTED_OPTION_KEY: ${selectedOptionKey || 'N/A'}\nSELECTED_OPTION_TEXT: ${answer}\nRECENT_HISTORY: ${history.length ? JSON.stringify(history) : '[]'}\n
Evaluate the chosen option strictly on the rubric provided and determine if it is correct.`;
};

const ensurePayload = (payload, fallbackMessage) => {
  if (!payload) {
    throw new Error(fallbackMessage || 'Groq response was empty');
  }
  return payload;
};

const normaliseArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : String(item)))
      .filter(Boolean)
      .slice(0, 5);
  }
  return [String(value).trim()].filter(Boolean);
};

const normaliseOptions = (options) => {
  if (!options) return [];
  if (!Array.isArray(options)) {
    return [];
  }

  return options
    .map((option, index) => {
      if (!option) return null;
      if (typeof option === 'string') {
        return {
          key: DEFAULT_OPTION_KEYS[index] || `Option${index + 1}`,
          text: option.trim(),
        };
      }

      const key = option.key || option.label || DEFAULT_OPTION_KEYS[index] || `Option${index + 1}`;
      const text = option.text || option.value || option.description || '';
      if (!text) return null;

      return {
        key: String(key).trim(),
        text: String(text).trim(),
      };
    })
    .filter(Boolean)
    .slice(0, DEFAULT_OPTION_KEYS.length);
};

const generateInterviewQuestion = async (session) => {
  const client = ensureGroqClient();
  const prompt = buildQuestionPrompt(session);

  const completion = await client.chat.completions.create({
    model: DEFAULT_MODEL,
    temperature: 0.35,
    max_tokens: 512,
    top_p: 0.9,
    messages: [
      {
        role: 'system',
        content:
          'You are a professional technical interviewer. Ask ONE question at a time. Respond with valid JSON: {"question": string, "difficulty": "easy|medium|hard|expert", "focus": string[], "coachingTip": string, "options": [{"key":"A","text":"..."}, ...]}. Make the question multiple-choice with exactly four distinct options labelled A/B/C/D and only one best answer.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const content = completion?.choices?.[0]?.message?.content;
  const payload = ensurePayload(extractJson(content), 'Unable to parse interviewer response');

  if (!payload.question) {
    throw new Error('Groq did not return a question');
  }

  const options = normaliseOptions(payload.options);
  if (!options.length) {
    throw new Error('Groq did not return multiple-choice options');
  }

  return {
    question: String(payload.question).trim(),
    difficulty: normaliseDifficulty(payload.difficulty, session.currentDifficulty || 'medium'),
    focusAreas: normaliseArray(payload.focus),
    coachingTip: payload.coachingTip ? String(payload.coachingTip).trim() : '',
    options,
    raw: content,
    model: completion.model || DEFAULT_MODEL,
    usage: completion.usage || null,
  };
};

const scoreInterviewAnswer = async ({ session, question, answer, options, selectedOptionKey }) => {
  const client = ensureGroqClient();
  const prompt = buildEvaluationPrompt({ session, question, answer, options, selectedOptionKey });

  const completion = await client.chat.completions.create({
    model: DEFAULT_MODEL,
    temperature: 0.2,
    max_tokens: 768,
    top_p: 0.9,
    messages: [
      {
        role: 'system',
        content:
          'You are a strict but encouraging technical interviewer. Evaluate multiple-choice answers using JSON: {"scores":{"clarity":0-10,"technicalAccuracy":0-10,"communication":0-10,"relevance":0-10,"confidence":0-10},"feedback":string,"improvements":string[],"nextDifficulty":"easy|medium|hard|expert","summary":string,"confidenceLevel":"low|medium|high","coaching":string[],"isCorrect":boolean,"correctOptionKey":"A|B|C|D","rationale":string}. Do not include markdown or extra commentary.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const content = completion?.choices?.[0]?.message?.content;
  const payload = ensurePayload(extractJson(content), 'Unable to parse evaluation response');

  const scoresRaw = payload.scores || {};
  const rubric = rubricKeys.reduce((acc, key) => {
    acc[key] = clampScore(scoresRaw[key]);
    return acc;
  }, {});

  const overall = computeOverall(rubric);

  return {
    rubric,
    overall,
    feedback: payload.feedback ? String(payload.feedback).trim() : '',
    improvements: normaliseArray(payload.improvements),
    nextDifficulty: normaliseDifficulty(payload.nextDifficulty, 'medium'),
    summary: payload.summary ? String(payload.summary).trim() : '',
    confidenceLabel: payload.confidenceLevel ? String(payload.confidenceLevel).toLowerCase() : 'medium',
    coaching: normaliseArray(payload.coaching || payload.suggestions),
    isCorrect: Boolean(payload.isCorrect),
    correctOptionKey: payload.correctOptionKey ? String(payload.correctOptionKey).trim() : '',
    rationale: payload.rationale ? String(payload.rationale).trim() : '',
    raw: content,
    model: completion.model || DEFAULT_MODEL,
    usage: completion.usage || null,
  };
};

const buildTestSummaryPrompt = (session) => {
  const answeredTurns = (session.turns || []).filter((turn) => turn.answer);
  const dataset = answeredTurns.map((turn, idx) => ({
    index: idx + 1,
    question: turn.question,
    selectedOptionKey: turn.selectedOptionKey,
    isCorrect: turn.isCorrect,
    feedback: turn.feedback,
  }));

  return `ROLE: ${session.role}\nLEVEL: ${session.roleLevel}\nTOTAL_QUESTIONS: ${session.maxQuestions}\nANSWERS: ${JSON.stringify(dataset)}\nPROFICIENCY: ${JSON.stringify(session.proficiencyVector || {})}\nOVERALL_SCORE: ${session.overallScore}\nProvide a concise test summary.`;
};

const generateTestSummary = async (session) => {
  const client = ensureGroqClient();
  const prompt = buildTestSummaryPrompt(session);

  const completion = await client.chat.completions.create({
    model: DEFAULT_MODEL,
    temperature: 0.3,
    max_tokens: 512,
    top_p: 0.9,
    messages: [
      {
        role: 'system',
        content:
          'You are a senior recruiter producing concise test reports. Respond with JSON: {"overallFeedback":string,"highlights":string[],"improvements":string[],"recommendation":string}.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const content = completion?.choices?.[0]?.message?.content;
  const payload = ensurePayload(extractJson(content), 'Unable to parse test summary');

  return {
    overallFeedback: payload.overallFeedback ? String(payload.overallFeedback).trim() : '',
    highlights: normaliseArray(payload.highlights),
    improvements: normaliseArray(payload.improvements),
    recommendation: payload.recommendation ? String(payload.recommendation).trim() : '',
  };
};

module.exports = {
  generateInterviewQuestion,
  scoreInterviewAnswer,
  rubricKeys,
  generateTestSummary,
};
