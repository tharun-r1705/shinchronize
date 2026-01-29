const Groq = require('groq-sdk');

const MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

function getGroqClient() {
  if (!process.env.GROQ_API_KEY) {
    return null;
  }
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

function coerceStringArray(value, fallback = []) {
  if (Array.isArray(value)) return value.filter((v) => typeof v === 'string' && v.trim()).map((v) => v.trim());
  return fallback;
}

function safeJsonParse(text) {
  if (!text || typeof text !== 'string') return null;
  const match = text.match(/\{[\s\S]*\}/);
  const jsonText = match ? match[0] : text;
  try {
    return JSON.parse(jsonText);
  } catch {
    return null;
  }
}

function computeFillerWordsMetrics(transcript) {
  const text = (transcript || '').toLowerCase();
  const fillers = ['um', 'uh', 'like', 'you know', 'actually', 'basically'];
  const examples = [];
  let count = 0;

  for (const f of fillers) {
    const re = new RegExp(`\\b${f.replace(/\s+/g, '\\s+')}\\b`, 'g');
    const m = text.match(re);
    if (m && m.length) {
      count += m.length;
      examples.push(f);
    }
  }

  return { count, examples: Array.from(new Set(examples)) };
}

function estimateWordCount(text) {
  const t = (text || '').trim();
  if (!t) return 0;
  return t.split(/\s+/).filter(Boolean).length;
}

async function groqTranscribeAudio(fileBuffer, originalName, mimetype, language = 'en') {
  const client = getGroqClient();
  if (!client) {
    throw new Error('AI service is not configured. Please set GROQ_API_KEY.');
  }
  if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) {
    throw new Error('Audio file buffer is required');
  }

  // groq-sdk follows OpenAI-style multipart upload; requires a File object with name property.
  // Node 18+ provides File globally; if unavailable, this will throw.
  if (typeof File === 'undefined') {
    throw new Error('Voice transcription requires File support in the Node runtime (Node 18+).');
  }

  const file = new File(
    [fileBuffer],
    originalName || 'audio.webm',
    { type: mimetype || 'audio/webm' }
  );

  const transcription = await client.audio.transcriptions.create({
    file: file,
    model: 'whisper-large-v3-turbo',
    response_format: 'json',
    language,
    temperature: 0.0,
  });

  return transcription?.text || '';
}

async function groqTextToSpeech({ text, voice = 'troy', model = 'canopylabs/orpheus-v1-english', responseFormat = 'wav' }) {
  const client = getGroqClient();
  if (!client) {
    throw new Error('AI service is not configured. Please set GROQ_API_KEY.');
  }
  const input = (text || '').toString();
  if (!input.trim()) {
    throw new Error('Text is required for speech synthesis');
  }

  const fmt = (responseFormat || 'wav').toString();
  const allowed = new Set(['wav', 'mp3', 'flac', 'opus']);
  const normalized = allowed.has(fmt) ? fmt : 'wav';

  try {
    const res = await client.audio.speech.create({
      model,
      voice,
      input,
      response_format: normalized,
    });

    // groq-sdk returns a binary response object with arrayBuffer()
    const arrayBuf = await res.arrayBuffer();
    return Buffer.from(arrayBuf);
  } catch (error) {
    // If TTS model requires terms acceptance or is unavailable, throw a clear error
    if (error.message?.includes('model_terms_required')) {
      throw new Error('TTS model requires terms acceptance. Please accept terms at https://console.groq.com/playground?model=canopylabs%2Forpheus-v1-english or disable TTS feature.');
    }
    throw error;
  }
}

async function generateNextQuestion({
  resumeContext,
  targetRole,
  interviewTypes,
  difficulty,
  interviewerPersona,
  askedQuestions,
  lastAnswer,
}) {
  const client = getGroqClient();
  if (!client) {
    // Fallback to deterministic question if AI key missing
    return {
      type: 'behavioral',
      category: 'Communication',
      question: 'Tell me about yourself and what you are currently working on to improve your placement readiness.',
      context: 'Fallback question (AI not configured)',
    };
  }

  const schemaHint = `Return ONLY valid JSON in this shape:
{
  "type": "technical" | "behavioral" | "project" | "tricky",
  "category": "string",
  "question": "string",
  "context": "string"
}`;

  const prompt = `You are an interviewer conducting a ${difficulty} ${targetRole || 'Software Engineer'} interview.

Interviewer persona: ${interviewerPersona}.
Question types allowed (mix over time): ${(interviewTypes || []).join(', ') || 'mixed'}.

Resume context:
${resumeContext || '(none)'}

Already asked questions (avoid repeats):
${(askedQuestions || []).slice(-10).map((q) => `- ${q}`).join('\n') || '(none)'}

Last answer (use it to adapt follow-up difficulty and probe depth):
${lastAnswer ? lastAnswer : '(none)'}

Rules:
- Ask ONE question.
- Make it specific to the resume when possible.
- Include 1 tricky question every ~5 questions (but not two in a row).
- Keep it interview-realistic.

${schemaHint}`;

  const completion = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.6,
    max_tokens: 350,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = completion.choices[0]?.message?.content || '';
  const json = safeJsonParse(text) || {};

  const type = typeof json.type === 'string' ? json.type : 'behavioral';
  const category = typeof json.category === 'string' ? json.category : '';
  const question = typeof json.question === 'string' ? json.question : '';
  const context = typeof json.context === 'string' ? json.context : '';

  if (!question.trim()) {
    return {
      type: 'behavioral',
      category: 'Communication',
      question: 'Walk me through one project you are most proud of and the hardest challenge you faced in it.',
      context: 'Fallback (invalid AI JSON)',
    };
  }

  return { type, category, question, context };
}

async function evaluateCommunication({ answer, voiceMetrics }) {
  const client = getGroqClient();
  if (!client) {
    return {
      clarity: 60,
      structure: 60,
      conciseness: 60,
      feedback: [],
    };
  }

  const hasVoice = voiceMetrics && voiceMetrics.durationSeconds > 0;
  
  const voiceContext = hasVoice 
    ? `Voice metrics:
- Duration: ${voiceMetrics.durationSeconds}s
- Word count: ${voiceMetrics.wordCount}
- Filler words: ${voiceMetrics.fillerWords?.count || 0} (${(voiceMetrics.fillerWords?.examples || []).join(', ') || 'none'})`
    : 'Text answer (no voice data)';

  const schemaHint = `Return ONLY valid JSON:
{
  "clarity": number (0-100),
  "structure": number (0-100),
  "conciseness": number (0-100),
  "feedback": string[]
}`;

  const prompt = `Evaluate the communication quality of this interview answer.

${voiceContext}

Answer text:
${answer}

Rate on these dimensions (0-100):
- Clarity: How clear and understandable is the answer?
- Structure: Is it well-organized (intro, body, conclusion)?
- Conciseness: Is it appropriately brief without rambling?

Provide 2-3 specific feedback points about communication (not content).
${hasVoice ? 'Include feedback on pacing and filler word usage if applicable.' : ''}

${schemaHint}`;

  const completion = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.4,
    max_tokens: 400,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = completion.choices[0]?.message?.content || '';
  const json = safeJsonParse(text) || {};

  const clarity = Math.max(0, Math.min(100, Number(json.clarity) || 0));
  const structure = Math.max(0, Math.min(100, Number(json.structure) || 0));
  const conciseness = Math.max(0, Math.min(100, Number(json.conciseness) || 0));
  const feedback = coerceStringArray(json.feedback, []);

  return {
    clarity,
    structure,
    conciseness,
    feedback,
  };
}

async function evaluateAnswer({ question, answer, type, targetRole, voiceMetrics }) {
  const client = getGroqClient();
  if (!client) {
    return {
      score: 60,
      strengths: ['Answer recorded.'],
      improvements: ['Configure GROQ_API_KEY to enable detailed feedback.'],
      sampleAnswer: '',
      communication: {
        clarity: 60,
        structure: 60,
        conciseness: 60,
        feedback: [],
      },
    };
  }

  const schemaHint = `Return ONLY valid JSON:
{
  "score": number,
  "strengths": string[],
  "improvements": string[],
  "sampleAnswer": string
}`;

  const prompt = `You are a strict interview evaluator for ${targetRole || 'Software Engineer'}.

Question type: ${type}
Question: ${question}

Candidate answer:
${answer}

Provide concise, actionable feedback (no fluff). Score 0-100.
Focus on technical accuracy, depth, and completeness (NOT communication style).
${schemaHint}`;

  const [contentCompletion, commResult] = await Promise.all([
    client.chat.completions.create({
      model: MODEL,
      temperature: 0.4,
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    }),
    evaluateCommunication({ answer, voiceMetrics }),
  ]);

  const text = contentCompletion.choices[0]?.message?.content || '';
  const json = safeJsonParse(text) || {};

  const score = Math.max(0, Math.min(100, Number(json.score) || 0));
  const strengths = coerceStringArray(json.strengths, []);
  const improvements = coerceStringArray(json.improvements, []);
  const sampleAnswer = typeof json.sampleAnswer === 'string' ? json.sampleAnswer : '';

  return {
    score,
    strengths,
    improvements,
    sampleAnswer,
    communication: commResult,
  };
}

module.exports = {
  groqTranscribeAudio,
  groqTextToSpeech,
  generateNextQuestion,
  evaluateAnswer,
  computeFillerWordsMetrics,
  estimateWordCount,
};
