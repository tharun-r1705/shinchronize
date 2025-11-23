// API Configuration and HTTP Client
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface CodingProfilesPayload {
  leetcode?: string;
  hackerrank?: string;
  lastSyncedAt?: string;
}

export interface UpdateStudentProfilePayload {
  name?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string | null;
  gender?: string;
  college?: string;
  branch?: string;
  year?: string;
  graduationYear?: number;
  cgpa?: number;
  phone?: string;
  location?: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  resumeUrl?: string;
  leetcodeUrl?: string;
  hackerrankUrl?: string;
  headline?: string;
  summary?: string;
  skills?: string[];
  avatarUrl?: string;
  codingProfiles?: CodingProfilesPayload;
  skillRadar?: Record<string, number>;
}

export interface StudentProfileDTO {
  _id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  gender?: string;
  college?: string;
  branch?: string;
  year?: string;
  graduationYear?: number;
  cgpa?: number;
  phone?: string;
  location?: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  resumeUrl?: string;
  leetcodeUrl?: string;
  hackerrankUrl?: string;
  headline?: string;
  summary?: string;
  skills?: string[];
  skillRadar?: Record<string, number>;
  codingProfiles?: CodingProfilesPayload;
  isProfileComplete?: boolean;
  readinessScore?: number;
  baseReadinessScore?: number;
  readinessHistory?: Array<{ score: number; calculatedAt: string }>;
  leetcodeStats?: {
    totalSolved?: number;
    easy?: number;
    medium?: number;
    hard?: number;
    streak?: number;
  };
}

export interface LinkedInExperienceEntry {
  role?: string;
  organization?: string;
  duration?: string;
  summary?: string;
}

export interface LinkedInEducationEntry {
  institution?: string;
  degree?: string;
  duration?: string;
  summary?: string;
}

export interface LinkedInProfileAutofill {
  name?: string;
  firstName?: string;
  lastName?: string;
  headline?: string;
  location?: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  websites?: string[];
  summary?: string;
  skills?: string[];
  experience?: LinkedInExperienceEntry[];
  education?: LinkedInEducationEntry[];
  confidence?: number;
}

export interface UpdateStudentProfileResponse {
  student: StudentProfileDTO;
  readiness: {
    score: number;
    breakdown: Record<string, number>;
  };
}

export interface SyncCodingActivityResponse {
  added: number;
  leetcode?: Record<string, unknown>;
  hackerrank?: Record<string, unknown>;
  readiness: {
    score: number;
    breakdown: Record<string, number>;
  };
  codingProfiles: CodingProfilesPayload;
}

export interface InterviewRubric {
  clarity: number;
  technicalAccuracy: number;
  communication: number;
  relevance: number;
  confidence: number;
}

export interface InterviewTurnOption {
  key: string;
  text: string;
}

export interface InterviewTurnDTO {
  _id: string;
  question: string;
  focusAreas: string[];
  difficulty: "easy" | "medium" | "hard" | "expert";
  answer?: string;
  feedback?: string;
  coachTips?: string[];
  askedAt?: string;
  answeredAt?: string;
  rubric?: InterviewRubric;
  options?: InterviewTurnOption[];
  selectedOptionKey?: string;
  correctOptionKey?: string;
  isCorrect?: boolean;
}

export interface InterviewLearningPoint {
  turnId?: string;
  turnIndex: number;
  clarity: number;
  technicalAccuracy: number;
  communication: number;
  relevance: number;
  confidence: number;
  overall: number;
  difficulty: "easy" | "medium" | "hard" | "expert";
  createdAt?: string;
}

export interface InterviewSessionDTO {
  _id: string;
  role: string;
  roleLevel: string;
  status: "active" | "paused" | "completed";
  overallScore: number;
  currentDifficulty: "easy" | "medium" | "hard" | "expert";
  turns?: InterviewTurnDTO[];
  learningCurve: InterviewLearningPoint[];
  proficiencyVector?: {
    technicalDepth?: number;
    problemSolving?: number;
    communication?: number;
  };
  meta?: {
    totalQuestions: number;
    totalAnswers: number;
    maxQuestions: number;
  };
  maxQuestions?: number;
  mode?: "practice" | "test";
  summary?: {
    highlights?: string[];
    improvements?: string[];
    recommendation?: string;
    overallFeedback?: string;
    scorePercent?: number;
  };
  testStats?: {
    correctAnswers: number;
    incorrectAnswers: number;
  };
  createdAt?: string;
  updatedAt?: string;
  student?: Pick<StudentProfileDTO, "_id" | "name" | "college" | "readinessScore" | "avatarUrl">;
}

interface RequestOptions extends RequestInit {
  token?: string;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { token, ...fetchOptions } = options;

    const headers: HeadersInit = {
      ...fetchOptions.headers,
    };

    const isFormData = typeof FormData !== 'undefined' && fetchOptions.body instanceof FormData;

    if (!isFormData && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...fetchOptions,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: `HTTP error! status: ${response.status}`,
      }));
      throw new Error(error.message || 'An error occurred');
    }

    return response.json();
  }

  async get<T>(endpoint: string, token?: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', token });
  }

  async post<T>(endpoint: string, data?: unknown, token?: string): Promise<T> {
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    return this.request<T>(endpoint, {
      method: 'POST',
      body: isFormData ? data : data ? JSON.stringify(data) : undefined,
      token,
    });
  }

  async put<T>(endpoint: string, data?: unknown, token?: string): Promise<T> {
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: isFormData ? data : data ? JSON.stringify(data) : undefined,
      token,
    });
  }

  async delete<T>(endpoint: string, token?: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', token });
  }
}

const api = new ApiClient(API_BASE_URL);

// Authentication APIs
export const studentApi = {
  signup: (data: {
    name: string;
    email: string;
    password: string;
    college: string;
    branch?: string;
    year?: number;
    graduationYear?: number;
  }) => api.post('/students/signup', data),

  login: (data: { email: string; password: string }) =>
    api.post('/students/login', data),

  getProfile: (token: string) => api.get<StudentProfileDTO>('/students/profile', token),

  updateProfile: (data: UpdateStudentProfilePayload, token: string) =>
    api.put<UpdateStudentProfileResponse>('/students/profile', data, token),

  addProject: (data: Record<string, unknown>, token: string) =>
    api.post('/students/projects', data, token),

  addCodingLog: (data: Record<string, unknown>, token: string) =>
    api.post('/students/coding-logs', data, token),

  addCertification: (data: Record<string, unknown>, token: string) =>
    api.post('/students/certifications', data, token),

  addEvent: (data: Record<string, unknown>, token: string) =>
    api.post('/students/events', data, token),

  getReadinessReport: (token: string) =>
    api.get('/students/readiness', token),

  getMentorSuggestions: (token: string) =>
    api.get('/students/mentor-suggestions', token),

  analyzeResume: (data: { resumeText: string; targetRole?: string }, token: string) =>
    api.post('/students/analyze-resume', data, token),

  importLinkedInProfile: (formData: FormData, token: string) =>
    api.post<{ profile: LinkedInProfileAutofill; meta?: { pages: number; fieldsDetected?: string[] } }>(
      '/students/profile/linkedin-import',
      formData,
      token
    ),

  extractResumeText: (file: File, token: string) => {
    const formData = new FormData();
    formData.append('resume', file);
    return api.post<{ message: string; text: string; pages?: number }>(
      '/students/extract-resume-text',
      formData,
      token
    );
  },

  // Public leaderboard
  getLeaderboard: (limit?: number) =>
    api.get(`/students/leaderboard${typeof limit === 'number' ? `?limit=${limit}` : ''}`),

  // Coding profiles and sync
  updateCodingProfiles: (data: { leetcode?: string; hackerrank?: string }, token: string) =>
    api.put('/students/coding-profiles', data, token),

  syncCodingActivity: (token: string) =>
    api.post<SyncCodingActivityResponse>('/students/coding-sync', {}, token),

  // LeetCode verification
  verifyLeetCode: (username: string, token: string) => {
    const studentData = localStorage.getItem('studentData');
    const studentId = studentData ? JSON.parse(studentData)._id : 'me';
    return api.post(`/students/${studentId}/update-leetcode`, { username }, token);
  },

  // Update/Delete Projects
  updateProject: (projectId: string, data: Partial<{
    title: string;
    githubLink: string;
    description: string;
    tags: string[];
  }>, token: string) =>
    api.put(`/students/projects/${projectId}`, data, token),

  deleteProject: (projectId: string, token: string) =>
    api.delete(`/students/projects/${projectId}`, token),

  // Update/Delete Certifications
  updateCertification: (certId: string, data: Partial<{
    name: string;
    provider: string;
    certificateId: string;
    issuedDate: string;
    fileLink: string;
  }>, token: string) =>
    api.put(`/students/certifications/${certId}`, data, token),

  deleteCertification: (certId: string, token: string) =>
    api.delete(`/students/certifications/${certId}`, token),

  // Update/Delete Events
  updateEvent: (eventId: string, data: Partial<{
    name: string;
    description: string;
    date: string;
    location: string;
    certificateLink: string;
    outcome: string;
  }>, token: string) =>
    api.put(`/students/events/${eventId}`, data, token),

  deleteEvent: (eventId: string, token: string) =>
    api.delete(`/students/events/${eventId}`, token),
};

export const recruiterApi = {
  signup: (data: {
    name: string;
    email: string;
    password: string;
    company: string;
    role?: string;
  }) => api.post('/recruiters/signup', data),

  login: (data: { email: string; password: string }) =>
    api.post('/recruiters/login', data),

  getProfile: (token: string) => api.get('/recruiters/profile', token),

  updatePreferences: (data: Record<string, unknown>, token: string) =>
    api.put('/recruiters/profile', data, token),

  listStudents: (
    params: Record<string, string | number | boolean | undefined>,
    token: string
  ) => {
    const queryString = new URLSearchParams(
      Object.entries(params).reduce<Record<string, string>>((acc, [key, value]) => {
        if (value === undefined) return acc;
        acc[key] = String(value);
        return acc;
      }, {})
    ).toString();
    return api.get(`/recruiters/students?${queryString}`, token);
  },

  compareStudents: (studentIds: string[], token: string) =>
    api.post('/recruiters/students/compare', { studentIds }, token),

  getSavedCandidates: (token: string) =>
    api.get('/recruiters/saved', token),

  saveCandidate: (studentId: string, token: string) =>
    api.post(`/recruiters/saved/${studentId}`, {}, token),

  removeSavedCandidate: (studentId: string, token: string) =>
    api.delete(`/recruiters/saved/${studentId}`, token),

  getStudentProfile: (studentId: string, token: string) =>
    api.get(`/recruiters/students/${studentId}`, token),
};

export const adminApi = {
  login: (data: { email: string; password: string }) =>
    api.post('/admin/login', data),

  getProfile: (token: string) => api.get('/admin/profile', token),

  getPendingVerifications: (token: string) =>
    api.get('/admin/verifications', token),

  verifyItem: (
    data: { studentId: string; itemType: string; itemId: string; status: string },
    token: string
  ) => api.post('/admin/verify', data, token),

  getAllStudents: (token: string) => api.get('/admin/students', token),

  getAllRecruiters: (token: string) => api.get('/admin/recruiters', token),
};

export const interviewApi = {
  startSession: (
    data: {
      role: string;
      roleLevel?: "basic" | "intermediate" | "advanced";
      focusAreas?: string[];
      baselineSkillNotes?: string;
      studentId?: string;
      mode?: "practice" | "test";
      questionCount?: number;
    },
    token: string
  ) => api.post<{ session: InterviewSessionDTO }>('/interviews/session', data, token),

  requestQuestion: (sessionId: string, token: string) =>
    api.post<{ turn: InterviewTurnDTO; coachingTip?: string; session: Partial<InterviewSessionDTO> }>(
      `/interviews/${sessionId}/question`,
      {},
      token
    ),

  submitAnswer: (
    params: { sessionId: string; turnId?: string; answer: string; selectedOptionKey: string },
    token: string
  ) => {
    const endpoint = params.turnId
      ? `/interviews/${params.sessionId}/turns/${params.turnId}/answer`
      : `/interviews/${params.sessionId}/answer`;

    return api.post<{
      turn: InterviewTurnDTO;
      evaluation: {
        feedback: string;
        rubric: InterviewRubric;
        overall: number;
        improvements: string[];
        nextDifficulty: string;
        coaching: string[];
        isCorrect?: boolean;
        correctOptionKey?: string;
        rationale?: string;
      };
      session: Partial<InterviewSessionDTO> & {
        learningCurve: InterviewLearningPoint[];
      };
    }>(endpoint, { answer: params.answer, selectedOptionKey: params.selectedOptionKey }, token);
  },

  getSessionSummary: (sessionId: string, token: string) =>
    api.get<{ session: InterviewSessionDTO }>(`/interviews/${sessionId}`, token),

  getStudentHistory: (
    studentId: string,
    params: { limit?: number; status?: string } = {},
    token: string
  ) => {
    const searchParams = new URLSearchParams();
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.status) searchParams.set('status', params.status);
    return api.get<{ sessions: InterviewSessionDTO[] }>(
      `/interviews/student/${studentId}/history${searchParams.toString() ? `?${searchParams.toString()}` : ''}`,
      token
    );
  },

  getActiveSession: (token: string) =>
    api.get<{ session: InterviewSessionDTO | null }>('/interviews/student/me/active', token),

  getRecruiterSessions: (
    recruiterId: string,
    params: { limit?: number } = {},
    token: string
  ) => {
    const searchParams = new URLSearchParams();
    if (params.limit) searchParams.set('limit', String(params.limit));
    return api.get<{ sessions: InterviewSessionDTO[] }>(
      `/interviews/recruiter/${recruiterId}/candidates${searchParams.toString() ? `?${searchParams.toString()}` : ''}`,
      token
    );
  },
};

export default api;
