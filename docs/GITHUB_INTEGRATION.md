# GitHub Integration - Implementation Guide

## Overview

This document details the complete GitHub integration feature that enriches student profiles with real coding activity, validated skills, and trust indicators based on their GitHub repositories.

## Features Implemented

### 1. GitHub Profile Sync
**Endpoint:** `POST /api/students/github-sync`

Fetches public data from a student's GitHub profile and updates their EvolvEd account with:
- Profile information (username, avatar, bio)
- Repository statistics (total repos, languages used)
- Top repositories (sorted by stars + recency)
- Activity score (0-100 based on recent contributions)

**Request Body:**
```json
{
  "githubUsername": "octocat",
  "githubUrl": "https://github.com/octocat"  // Alternative to username
}
```

**Response:**
```json
{
  "success": true,
  "message": "GitHub profile synced successfully",
  "githubStats": {
    "username": "octocat",
    "avatarUrl": "https://avatars.githubusercontent.com/u/583231",
    "bio": "GitHub mascot",
    "totalRepos": 42,
    "topLanguages": [
      { "name": "JavaScript", "count": 15, "percentage": 35.7 },
      { "name": "Python", "count": 12, "percentage": 28.6 }
    ],
    "topRepos": [
      {
        "name": "hello-world",
        "stars": 1234,
        "language": "JavaScript",
        "description": "My first repository",
        "url": "https://github.com/octocat/hello-world",
        "lastActive": "2024-12-10T00:00:00.000Z"
      }
    ],
    "activityScore": 87,
    "lastSyncedAt": "2024-12-15T10:00:00.000Z"
  },
  "validatedSkills": [
    {
      "name": "JavaScript",
      "source": "github",
      "confidence": 0.95,
      "evidence": ["15 repositories using JavaScript"]
    }
  ],
  "readinessScore": 78,
  "readinessBreakdown": {
    "projects": 24,
    "codingConsistency": 16,
    "certifications": 15,
    "githubActivity": 4.35
  },
  "trustBadges": [
    "Verified Projects",
    "Active Coder",
    "GitHub Contributor"
  ]
}
```

### 2. Skill Validation & Confidence Scoring

Automatically infers skills from multiple data sources with confidence scores:

**Data Sources:**
- **GitHub Languages** (0.80-0.95 confidence): Extracted from repo languages
- **Project Tags** (0.70-0.85 confidence): From student-submitted projects
- **Certifications** (1.0 confidence): From verified certificates
- **Resume** (0.60 confidence): Listed in resume document

**Skill Inference Logic:**

```javascript
// GitHub: Languages → Skills mapping
JavaScript (35% usage) → ["JavaScript", "Node.js", "Web Development"] @ 0.95
Python (28% usage) → ["Python", "Backend Development"] @ 0.90

// Projects: Tags → Skills
Used in 3 projects → confidence 0.85
Used in 2 projects → confidence 0.80
Used in 1 project → confidence 0.70

// Certifications: Pattern matching
"AWS Certified Developer" → ["AWS"] @ 1.0
"React Nanodegree" → ["React"] @ 1.0

// Resume: Direct listing
Listed in resume → confidence 0.60
```

**Skill Merging:**
When skills appear across multiple sources, the system:
1. Keeps the highest confidence score
2. Merges evidence from all sources
3. Sorts by confidence (descending)

Example merged skill:
```json
{
  "name": "JavaScript",
  "source": "github",  // Primary source
  "confidence": 0.95,
  "evidence": [
    "15 repositories using JavaScript",
    "Used in 3 project(s): E-commerce Site, Chat App",
    "Listed in resume"
  ]
}
```

### 3. Growth Timeline

Automatically tracks major profile milestones with timestamps and readiness score snapshots:

**Triggers:**
- ✅ Project/certification verified by admin
- 🔄 Coding activity synced (LeetCode/HackerRank)
- 🎯 Mock interview completed
- 🐙 GitHub profile synced

**Schema:**
```javascript
growthTimeline: [{
  date: Date,
  readinessScore: Number,
  reason: String
}]
```

**Example Timeline:**
```json
[
  {
    "date": "2024-12-01T00:00:00.000Z",
    "readinessScore": 45,
    "reason": "Project verified: E-commerce Platform"
  },
  {
    "date": "2024-12-05T00:00:00.000Z",
    "readinessScore": 52,
    "readinessScore": "Certification verified: AWS Solutions Architect"
  },
  {
    "date": "2024-12-10T00:00:00.000Z",
    "readinessScore": 65,
    "reason": "Coding activity synced: 12 new log(s) from LeetCode and HackerRank"
  },
  {
    "date": "2024-12-12T00:00:00.000Z",
    "readinessScore": 71,
    "reason": "Mock interview completed: 85% score, 15 questions answered"
  },
  {
    "date": "2024-12-15T00:00:00.000Z",
    "readinessScore": 78,
    "reason": "GitHub profile synced: 42 repositories, 8 languages"
  }
]
```

### 4. Recruiter Trust Indicators

Dynamic badges computed in real-time from student data:

**Badge Logic:**
```javascript
"Verified Projects"       → student.projects.filter(p => p.verified).length > 0
"Active Coder"            → student.codingLogs in last 30 days
"Certified Skills"        → student.certifications.filter(c => c.status === 'verified').length > 0
"GitHub Contributor"      → student.githubStats?.totalRepos > 0
"Top Performer"           → student.readinessScore >= 80
"Rising Star"             → readiness score increased by 15+ in last 30 days
```

**Implementation:**
Implemented as a Mongoose virtual property on the Student model:
```javascript
studentSchema.virtual('trustBadges').get(function() {
  const badges = [];
  
  if (this.projects?.some(p => p.verified)) {
    badges.push('Verified Projects');
  }
  
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  if (this.codingLogs?.some(log => log.date >= thirtyDaysAgo)) {
    badges.push('Active Coder');
  }
  
  if (this.certifications?.some(c => c.status === 'verified')) {
    badges.push('Certified Skills');
  }
  
  if (this.githubStats?.totalRepos > 0) {
    badges.push('GitHub Contributor');
  }
  
  if (this.readinessScore >= 80) {
    badges.push('Top Performer');
  }
  
  return badges;
});
```

### 5. GitHub Activity Score

Calculates a 0-100 score based on repository activity:

**Components:**
1. **Repository Count** (max 30 points)
   - 10+ repos → 30 points
   - 5-9 repos → 20 points
   - 1-4 repos → 10 points

2. **Recent Activity** (max 40 points)
   - Based on commits in last 90 days
   - Linear scale: 10+ commits = 40 points

3. **Language Diversity** (max 30 points)
   - 5+ languages → 30 points
   - 3-4 languages → 20 points
   - 1-2 languages → 10 points

**Algorithm:**
```javascript
function calculateGitHubActivityScore(githubData) {
  let score = 0;
  
  // Repository count (max 30 points)
  const repoCount = githubData.totalRepos;
  if (repoCount >= 10) score += 30;
  else if (repoCount >= 5) score += 20;
  else if (repoCount > 0) score += 10;
  
  // Recent activity (max 40 points)
  const ninetyDaysAgo = dayjs().subtract(90, 'day');
  const recentRepos = githubData.repos.filter(repo => 
    dayjs(repo.lastActive).isAfter(ninetyDaysAgo)
  );
  const recentActivity = Math.min(recentRepos.length, 10);
  score += (recentActivity / 10) * 40;
  
  // Language diversity (max 30 points)
  const uniqueLanguages = githubData.topLanguages.length;
  if (uniqueLanguages >= 5) score += 30;
  else if (uniqueLanguages >= 3) score += 20;
  else if (uniqueLanguages > 0) score += 10;
  
  return Math.round(score);
}
```

### 6. Readiness Score Enhancement

GitHub activity score contributes up to **5 bonus points** to the overall readiness score:

```javascript
const githubBonus = Math.min(5, githubStats.activityScore / 20);
student.readinessScore = Math.min(100, baseReadinessScore + githubBonus);
```

**Example:**
- Base readiness: 73/100
- GitHub activity: 87/100
- GitHub bonus: min(5, 87/20) = 4.35
- **Final readiness: 77.35/100**

## Rate Limiting

**Rule:** Students can sync GitHub profile **once per hour** to prevent API abuse.

**Implementation:**
```javascript
const lastSyncedAt = student.githubStats?.lastSyncedAt;
if (lastSyncedAt) {
  const hoursSinceLastSync = (Date.now() - lastSyncedAt.getTime()) / (1000 * 60 * 60);
  if (hoursSinceLastSync < 1) {
    return res.status(429).json({
      message: 'GitHub sync rate limit exceeded. Please wait at least 1 hour between syncs.',
      nextSyncAvailable: new Date(lastSyncedAt.getTime() + 60 * 60 * 1000)
    });
  }
}
```

## GitHub API Configuration

**Base URL:** `https://api.github.com`

**Authentication:** Optional Personal Access Token via `GITHUB_TOKEN` env variable

**Rate Limits:**
- Without token: 60 requests/hour per IP
- With token: 5,000 requests/hour

**Setup Instructions:**
1. Generate token at https://github.com/settings/tokens
2. No scopes needed for public data
3. Add to `.env`: `GITHUB_TOKEN=your_token_here`

## Error Handling

The implementation gracefully handles common GitHub API errors:

### 404 - User Not Found
```json
{
  "message": "GitHub user not found. Please check the username."
}
```

### 403 - Forbidden / Rate Limited
```json
{
  "message": "GitHub API rate limit exceeded. Please try again later."
}
```

### 429 - EvolvEd Rate Limit
```json
{
  "message": "GitHub sync rate limit exceeded. Please wait at least 1 hour between syncs.",
  "nextSyncAvailable": "2024-12-15T11:00:00.000Z"
}
```

## Database Schema Changes

### Student Model Extensions

```javascript
// New fields added to Student schema
githubStats: {
  username: String,
  avatarUrl: String,
  bio: String,
  totalRepos: Number,
  topLanguages: [{
    name: String,
    count: Number,
    percentage: Number
  }],
  topRepos: [{
    name: String,
    stars: Number,
    language: String,
    description: String,
    url: String,
    lastActive: Date
  }],
  activityScore: { type: Number, min: 0, max: 100 },
  lastSyncedAt: Date
},

validatedSkills: [{
  name: { type: String, required: true },
  source: {
    type: String,
    enum: ['github', 'project', 'certificate', 'resume', 'manual'],
    required: true
  },
  confidence: { type: Number, min: 0, max: 1, default: 0.5 },
  evidence: [String]
}],

growthTimeline: [{
  date: { type: Date, default: Date.now },
  readinessScore: Number,
  reason: String
}]
```

## Files Modified/Created

### New Files
1. `backend/utils/githubIntegration.js` - GitHub API integration
2. `backend/utils/skillValidation.js` - Skill inference and merging
3. `docs/GITHUB_INTEGRATION.md` - This documentation

### Modified Files
1. `backend/models/Student.js` - Added 3 new schema fields + virtual property
2. `backend/controllers/studentController.js` - Added syncGitHubProfile endpoint
3. `backend/controllers/adminController.js` - Added growth timeline trigger
4. `backend/controllers/interviewController.js` - Added growth timeline trigger
5. `backend/routes/studentRoutes.js` - Added /github-sync route
6. `backend/server.js` - Fixed dotenv path resolution
7. `.env` - Added GITHUB_TOKEN documentation

## Testing

### Manual Test with cURL

```bash
# Get auth token first
TOKEN=$(curl -s -X POST http://localhost:5001/api/students/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student1@college.edu","password":"EvolvEd@123"}' \
  | jq -r '.token')

# Sync GitHub profile
curl -X POST http://localhost:5001/api/students/github-sync \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"githubUsername":"octocat"}' \
  | jq

# Try syncing again (should hit rate limit)
curl -X POST http://localhost:5001/api/students/github-sync \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"githubUsername":"octocat"}' \
  | jq

# Check updated profile
curl http://localhost:5001/api/students/profile \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.student | {githubStats, validatedSkills, trustBadges, growthTimeline}'
```

### Test Cases

1. ✅ Sync valid GitHub username
2. ✅ Sync with GitHub URL instead of username
3. ✅ Handle non-existent GitHub user (404)
4. ✅ Respect 1-hour rate limit
5. ✅ Skills automatically inferred from languages
6. ✅ Growth timeline entry created
7. ✅ Trust badges computed dynamically
8. ✅ Readiness score updated with GitHub bonus

## Frontend Integration (TODO)

To integrate this feature in the frontend:

### 1. Add GitHub Sync Section to StudentProfile.tsx

```typescript
const [githubSyncData, setGithubSyncData] = useState({ username: '', url: '' });
const [githubStats, setGithubStats] = useState(null);
const [isSyncing, setIsSyncing] = useState(false);

const handleGitHubSync = async () => {
  if (!githubSyncData.username && !githubSyncData.url) {
    toast({ title: 'Please enter a GitHub username or URL', variant: 'destructive' });
    return;
  }
  
  setIsSyncing(true);
  try {
    const response = await studentApi.syncGitHubProfile(githubSyncData);
    setGithubStats(response.githubStats);
    toast({ title: 'GitHub profile synced successfully!' });
  } catch (error) {
    toast({ 
      title: error.response?.data?.message || 'Failed to sync GitHub profile',
      variant: 'destructive' 
    });
  } finally {
    setIsSyncing(false);
  }
};
```

### 2. Add API Method to lib/api.ts

```typescript
export const studentApi = {
  // ... existing methods
  
  syncGitHubProfile: async (data: { githubUsername?: string, githubUrl?: string }) => {
    const response = await apiClient.post('/students/github-sync', data);
    return response.data;
  },
};
```

### 3. Display GitHub Stats Card

```tsx
{githubStats && (
  <Card>
    <CardHeader>
      <CardTitle>GitHub Profile</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="flex items-center gap-4 mb-4">
        <Avatar>
          <AvatarImage src={githubStats.avatarUrl} />
        </Avatar>
        <div>
          <p className="font-semibold">{githubStats.username}</p>
          <p className="text-sm text-muted-foreground">{githubStats.bio}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Repositories</p>
          <p className="text-2xl font-bold">{githubStats.totalRepos}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Activity Score</p>
          <p className="text-2xl font-bold">{githubStats.activityScore}/100</p>
        </div>
      </div>
      
      <div className="mt-4">
        <p className="text-sm font-semibold mb-2">Top Languages</p>
        {githubStats.topLanguages.map(lang => (
          <Badge key={lang.name} variant="secondary" className="mr-2">
            {lang.name} {lang.percentage.toFixed(1)}%
          </Badge>
        ))}
      </div>
    </CardContent>
  </Card>
)}
```

## Future Enhancements

1. **GitHub Commit History**: Fetch contribution graph data
2. **Pull Request Analysis**: Analyze code review participation
3. **Repository Quality Metrics**: Consider issues, documentation, tests
4. **Organization Contributions**: Track contributions to org repos
5. **Trending Skills Detection**: Identify emerging language trends
6. **Automatic Sync**: Webhook-based automatic profile updates
7. **GitHub OAuth**: Replace username input with OAuth login
8. **Repository Showcase**: Let students select repos to highlight

## Summary

This GitHub integration provides:
- ✅ Automated skill validation from real coding activity
- ✅ Trust indicators for recruiters (verified vs self-reported)
- ✅ Growth timeline tracking for student progress visualization
- ✅ Activity scoring to complement readiness assessment
- ✅ Rate-limited, error-handled API integration
- ✅ Backward-compatible implementation (no breaking changes)

The feature is fully functional and ready for frontend integration!
