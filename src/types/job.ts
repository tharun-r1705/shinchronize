// Job and Talent Pool Type Definitions

// Learning rate categories
export type LearningCategory = 'fast' | 'steady' | 'developing' | 'not_determined';
export type LearningTrend = 'accelerating' | 'steady' | 'slowing';

// Learning metrics interface
export interface LearningMetrics {
  learningRate: number | null;
  learningCategory: LearningCategory;
  components?: {
    readinessVelocity: number;
    milestoneSpeed: number;
    quizPerformance: number;
    codingGrowth: number;
    skillAcquisition: number;
    projectVelocity: number;
  };
  trend?: LearningTrend;
  calculatedAt?: Date | string;
}

export interface MatchedStudent {
  studentId: {
    _id: string;
    name?: string;
    email?: string;
    college?: string;
    branch?: string;
    cgpa?: number;
    skills?: string[];
    readinessScore?: number;
    avatarUrl?: string;
    projects?: Array<{
      _id: string;
      title: string;
      description?: string;
      tags?: string[];
      githubLink?: string;
    }>;
    certifications?: Array<{
      _id: string;
      name: string;
      provider?: string;
    }>;
    githubStats?: {
      username?: string;
      streak?: number;
      totalCommits?: number;
    };
    leetcodeStats?: {
      totalSolved?: number;
      streak?: number;
    };
    learningMetrics?: LearningMetrics;
  } | string;
  matchScore: number;
  matchReason: string;
  skillsMatched: string[];
  skillsMissing: string[];
  scoreBreakdown?: {
    requiredSkills: number;
    preferredSkills: number;
    projects: number;
    readiness: number;
    growth: number;
    cgpa: number;
    certifications: number;
    codingConsistency: number;
  };
  matchedAt?: Date | string;
}

export interface Job {
  _id: string;
  recruiterId: string;
  title: string;
  company: string;
  location: string;
  jobType: 'Full-time' | 'Internship' | 'Contract' | 'Part-time';
  description: string;
  responsibilities: string[];
  qualifications: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  experienceRequired?: string;
  minReadinessScore: number;
  minCGPA: number;
  minProjects: number;
  salaryRange?: {
    min: number;
    max: number;
    currency: string;
  };
  matchedStudents: MatchedStudent[];
  matchCount: number;
  status: 'draft' | 'active' | 'closed' | 'expired';
  postedAt?: Date | string;
  expiresAt?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateJobPayload {
  title: string;
  location: string;
  jobType?: 'Full-time' | 'Internship' | 'Contract' | 'Part-time';
  requiredSkills: string[];
  preferredSkills?: string[];
  experienceRequired?: string;
  minReadinessScore?: number;
  minCGPA?: number;
  minProjects?: number;
  salaryRange?: {
    min: number;
    max: number;
    currency: string;
  };
}

export interface JobStats {
  totalApplications: number;
  viewedProfiles: number;
  shortlisted: number;
  contacted: number;
  avgMatchScore: number;
  topSkills: Array<{ skill: string; count: number }>;
  matchDistribution: {
    excellent: number; // 80-100
    good: number; // 60-79
    fair: number; // 40-59
    poor: number; // 0-39
  };
}

export interface MatchExplanation {
  student: {
    id: string; // Backend returns 'id' not '_id'
    name?: string;
    email?: string;
    college?: string;
    branch?: string;
    cgpa?: number;
    readinessScore?: number;
    skills?: string[];
    projects?: Array<{
      _id?: string;
      title: string;
      description?: string;
      tags?: string[];
      githubLink?: string;
    }>;
    certifications?: Array<{
      _id?: string;
      name: string;
      provider?: string;
    }>;
    learningMetrics?: LearningMetrics;
  };
  job: {
    id: string; // Backend returns 'id' not '_id'
    title: string;
    requiredSkills: string[];
    preferredSkills?: string[];
    minReadinessScore?: number;
    minCGPA?: number;
    minProjects?: number;
  };
  matchScore: number;
  matchReason: string;
  skillsMatched: string[];
  skillsMissing: string[];
  scoreBreakdown: {
    requiredSkills: number;
    preferredSkills: number;
    projects: number;
    readiness: number;
    growth: number;
    cgpa: number;
    certifications: number;
    codingConsistency: number;
  };
  detailedAnalysis: {
    strengths: string[];
    gaps: string[];
    recommendations: string[];
  };
}
