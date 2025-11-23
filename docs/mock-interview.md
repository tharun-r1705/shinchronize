# Adaptive Groq Mock Interview System

This document explains how the adaptive mock interview feature works end-to-end. The latest release switches every session to a timed, multiple-choice test so students can run comparable attempts and recruiters can review consistent scorecards.

## Environment Variables

| Name | Required | Description |
| --- | --- | --- |
| `GROQ_API_KEY` | ✅ | Server-side API key used for question generation and scoring. |
| `GROQ_INTERVIEW_MODEL` | ⛔ optional | Overrides the default `llama-3.1-70b-versatile` model if you want to experiment with another Groq chat completion model. |

> **Tip:** Set the variables in both `.env` (backend) and your Vercel project settings before deploying.

## Quick Start

```bash
# 1. Backend (Groq + Mongo)
cd backend
cp .env.example .env   # add GROQ_API_KEY + MONGODB_URI
npm install
npm run dev

# 2. Frontend (student + recruiter portals)
cd ..
npm install
npm run dev
```

Once both servers are running:

1. Sign in as a student → `/student/mock-interview` to start a session.
2. Submit a few answers so the learning curve is populated.
3. Sign in as a recruiter → `/recruiter/dashboard` to review the shared curve and candidate list.

## Backend Architecture

- **Models**: `backend/models/InterviewSession.js` now tracks the test `mode`, `maxQuestions`, multiple-choice options per turn, selected/correct choices, and a `testStats` block (correct vs incorrect). Each completed test also stores `summary.scorePercent` plus recruiter-facing highlights/improvements.
- **Groq helper**: `backend/utils/mockInterview.js` centrally defines three prompts: (1) MCQ question generation with four options, (2) strict evaluation that returns correctness, rubric, rationale, and next difficulty, and (3) a test-level summariser for the final feedback card.
- **Controller**: `backend/controllers/interviewController.js` enforces fixed-length tests. `requestQuestion` refuses to issue more than `maxQuestions`, `submitAnswer` only accepts the selected option key, increments correctness stats, and, once all answers are captured, composes the Groq summary before closing the session.
- **Routes**: Wired up via `backend/routes/interviewRoutes.js` and mounted in `server.js`.

### Test Flow

1. `POST /api/interviews/session` accepts `questionCount` (4–25) and defaults to the new `test` mode.
2. `POST /api/interviews/:sessionId/question` injects the upcoming difficulty band (easy → medium → hard) and returns a single MCQ with four labelled options.
3. `POST /api/interviews/:sessionId/turns/:turnId/answer` requires `selectedOptionKey`, validates the choice, scores it with Groq, updates learning curves, and marks the question correct/incorrect.
4. When `maxQuestions` answers are recorded the controller freezes the session, stamps `summary.scorePercent`, and requests an aggregated Groq summary (overall feedback, highlights, improvements, recommendation).

## Frontend Experience

- **Student dashboard widget**: `src/pages/StudentDashboard.tsx` still embeds the chatbot entry point so learners can resume an active test without leaving the dashboard.
- **Practice workspace**: `src/pages/MockInterview.tsx` now skips the hard-coded stacks. Students choose any role, level, focus areas, and question count before launching a test. The right rail explains the MCQ flow and lists recent attempts (with accuracy %, answered/total, and summary text).
- **Chatbot component**: `src/components/MockInterviewChatbot.tsx` was rewritten to present four options per question, enforce “single best answer” submissions, display real-time test stats, and reveal the final Groq summary once the question cap is reached. It still renders the learning curve chart using `components/ui/chart.tsx`.
- **Recruiter analytics**: `src/pages/RecruiterDashboard.tsx` (and the recruiter APIs) automatically inherit the new schema, so each candidate card exposes `scorePercent`, highlights, and improvement areas per test.
- **API client**: `src/lib/api.ts` now exposes option-aware DTOs and handles the additional payload fields (`questionCount`, `selectedOptionKey`, `meta`, `summary`, etc.).

## Data Flow

1. The student configures role, level, focus areas, and question count (defaults to 10) which creates an `InterviewSession` in `test` mode.
2. For every `/question` request the backend injects the current difficulty tier and asks Groq for a single MCQ with four labelled options plus an optional coaching tip.
3. The student picks one option. `/answer` validates the key, passes the question/options/selection to Groq, receives rubric scores + correctness, and records test stats plus learning-curve points.
4. After the final question, the backend auto-summarises the test (accuracy %, highlights, improvement themes, recommendation) and exposes it to both the student workspace and recruiter dashboards.

## Testing Checklist

1. **Backend**: `cd backend && npm run dev` – start a session, fetch 3–4 questions, and verify submissions respect the question cap.
2. **Frontend**: `npm run dev` (root) – walk through a 10-question test on `/student/mock-interview`, confirm options disable after submission, and ensure the summary card appears at the end.
3. **Recruiter**: Sign in as a recruiter and confirm recent sessions display `scorePercent`, highlights, and learning-curve snapshots.

Feel free to extend the scoring heuristics in `mockInterview.js` or plug in additional focus areas per role.
