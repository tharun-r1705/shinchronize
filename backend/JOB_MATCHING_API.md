# Job Matching API Documentation

## Overview
The Job Matching API enables recruiters to create AI-powered job postings, automatically match students based on multi-factor scoring, and receive AI-generated justifications for each match.

---

## Authentication
All endpoints require JWT authentication with `recruiter` role.

**Header:**
```
Authorization: Bearer <token>
```

---

## Endpoints

### 1. Create Job Posting
**POST** `/api/jobs`

Creates a new job posting with AI-generated description, responsibilities, and qualifications.

**Request Body:**
```json
{
  "title": "Software Development Intern",
  "location": "Bangalore",
  "jobType": "Internship",
  "experience": "0-1 years",
  "salaryRange": "15-20k/month",
  "requiredSkills": ["JavaScript", "React", "Node.js"],
  "preferredSkills": ["TypeScript", "MongoDB"],
  "minReadinessScore": 70,
  "minCGPA": 7.0,
  "minProjects": 2
}
```

**Response:**
```json
{
  "message": "Job created successfully",
  "job": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "title": "Software Development Intern",
    "company": "Your Company",
    "location": "Bangalore",
    "description": "AI-generated engaging job description...",
    "responsibilities": [
      "Develop and maintain web applications using React and Node.js",
      "Collaborate with cross-functional teams...",
      "..."
    ],
    "qualifications": [
      "Strong proficiency in JavaScript, React, and Node.js",
      "Understanding of RESTful APIs...",
      "..."
    ],
    "requiredSkills": ["JavaScript", "React", "Node.js"],
    "preferredSkills": ["TypeScript", "MongoDB"],
    "status": "draft",
    "createdAt": "2024-01-30T10:00:00.000Z"
  }
}
```

---

### 2. Get All Jobs
**GET** `/api/jobs`

Retrieves all jobs for the authenticated recruiter.

**Query Parameters:**
- `status` (optional): Filter by status (`draft`, `active`, `closed`, `expired`)

**Response:**
```json
{
  "count": 5,
  "jobs": [
    {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "title": "Software Development Intern",
      "location": "Bangalore",
      "status": "active",
      "matchCount": 24,
      "postedAt": "2024-01-28T10:00:00.000Z",
      "createdAt": "2024-01-27T10:00:00.000Z"
    }
  ]
}
```

---

### 3. Get Job by ID
**GET** `/api/jobs/:jobId`

Retrieves a specific job with all details.

**Response:**
```json
{
  "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
  "title": "Software Development Intern",
  "description": "...",
  "requiredSkills": ["JavaScript", "React", "Node.js"],
  "matchedStudents": [
    {
      "studentId": "64a1b2c3d4e5f6g7h8i9j0k1",
      "matchScore": 92,
      "matchReason": "Strong match due to 4 React projects...",
      "skillsMatched": ["JavaScript", "React", "Node.js"],
      "skillsMissing": ["TypeScript"],
      "lastUpdated": "2024-01-30T10:00:00.000Z"
    }
  ],
  "matchCount": 24,
  "viewCount": 45
}
```

---

### 4. Update Job
**PUT** `/api/jobs/:jobId`

Updates job details. If matching criteria change, cached matches are cleared.

**Request Body:**
```json
{
  "title": "Updated Title",
  "requiredSkills": ["JavaScript", "React", "Node.js", "GraphQL"],
  "status": "active"
}
```

**Response:**
```json
{
  "message": "Job updated successfully",
  "job": { /* updated job object */ },
  "matchesCleared": true
}
```

---

### 5. Delete Job
**DELETE** `/api/jobs/:jobId`

Permanently deletes a job posting.

**Response:**
```json
{
  "message": "Job deleted successfully",
  "deletedJobId": "64f1a2b3c4d5e6f7g8h9i0j1"
}
```

---

### 6. Publish Job
**POST** `/api/jobs/:jobId/publish`

Activates a draft job and triggers automatic student matching.

**Response:**
```json
{
  "message": "Job published successfully. Student matching in progress...",
  "job": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "status": "active",
    "postedAt": "2024-01-30T10:00:00.000Z",
    "expiresAt": "2024-02-29T10:00:00.000Z"
  }
}
```

---

### 7. Match Students to Job (AI-Powered)
**POST** `/api/jobs/:jobId/match`

Runs the AI-powered matching algorithm to find and rank students.

**Response:**
```json
{
  "message": "Student matching completed successfully",
  "jobId": "64f1a2b3c4d5e6f7g8h9i0j1",
  "jobTitle": "Software Development Intern",
  "totalStudents": 1247,
  "matchCount": 24,
  "topMatches": [
    {
      "studentId": "64a1b2c3d4e5f6g7h8i9j0k1",
      "matchScore": 92,
      "matchReason": "Strong match with all required skills (JavaScript, React, Node.js) and 4 relevant projects including a production-ready MERN stack application. Demonstrates consistent growth with 85% readiness score and 45-day LeetCode streak. Minor gap: Limited TypeScript experience.",
      "skillsMatched": ["JavaScript", "React", "Node.js"],
      "skillsMissing": ["TypeScript"]
    }
  ]
}
```

---

### 8. Get Matched Students
**GET** `/api/jobs/:jobId/matches`

Retrieves matched students with full profiles.

**Query Parameters:**
- `limit` (optional, default: 50, max: 100): Number of matches to return
- `minScore` (optional, default: 0): Minimum match score filter

**Response:**
```json
{
  "jobId": "64f1a2b3c4d5e6f7g8h9i0j1",
  "jobTitle": "Software Development Intern",
  "totalMatches": 24,
  "matches": [
    {
      "studentId": {
        "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
        "name": "Ravi Kumar",
        "email": "ravi@example.com",
        "college": "IIT Delhi",
        "branch": "Computer Science",
        "readinessScore": 85,
        "skills": ["JavaScript", "React", "Node.js", "MongoDB"],
        "projects": [ /* project array */ ],
        "cgpa": 8.5
      },
      "matchScore": 92,
      "matchReason": "Strong match with all required skills...",
      "skillsMatched": ["JavaScript", "React", "Node.js"],
      "skillsMissing": ["TypeScript"]
    }
  ]
}
```

---

### 9. Get Match Explanation
**GET** `/api/jobs/:jobId/matches/:studentId/explain`

Gets detailed AI explanation for why a specific student matches the job.

**Response:**
```json
{
  "student": {
    "id": "64a1b2c3d4e5f6g7h8i9j0k1",
    "name": "Ravi Kumar",
    "college": "IIT Delhi",
    "branch": "Computer Science",
    "readinessScore": 85,
    "cgpa": 8.5
  },
  "job": {
    "id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "title": "Software Development Intern",
    "requiredSkills": ["JavaScript", "React", "Node.js"],
    "preferredSkills": ["TypeScript", "MongoDB"]
  },
  "matchScore": 92,
  "matchReason": "Strong match with all required skills...",
  "breakdown": {
    "requiredSkills": 30,
    "preferredSkills": 5,
    "projects": 25,
    "readiness": 17,
    "growth": 8,
    "cgpa": 2.6,
    "certifications": 2,
    "consistency": 4.4
  },
  "skillsMatched": ["JavaScript", "React", "Node.js"],
  "skillsMissing": ["TypeScript"]
}
```

---

### 10. Get Job Statistics
**GET** `/api/jobs/:jobId/stats`

Retrieves analytics and statistics for a job.

**Response:**
```json
{
  "jobId": "64f1a2b3c4d5e6f7g8h9i0j1",
  "title": "Software Development Intern",
  "status": "active",
  "totalMatches": 24,
  "viewCount": 45,
  "applicationCount": 8,
  "contactedCount": 12,
  "daysActive": 3,
  "topMatchScore": 92,
  "avgMatchScore": 78,
  "skillsCoverage": {
    "requiredSkills": ["JavaScript", "React", "Node.js"],
    "preferredSkills": ["TypeScript", "MongoDB"]
  },
  "lastMatchedAt": "2024-01-30T10:00:00.000Z"
}
```

---

## Multi-Factor Matching Algorithm

### Score Breakdown (Total: 100 points)

1. **Required Skills Match (30 points)**
   - Percentage of required skills the student has
   - Critical factor - students without key skills score low

2. **Preferred Skills Match (10 points)**
   - Bonus for matching preferred/nice-to-have skills

3. **Project Relevance (25 points)**
   - Number of projects using required skills
   - Bonus for verified projects
   - Bonus for skill diversity in projects

4. **Readiness Score (20 points)**
   - Student's overall platform readiness score

5. **Growth Trajectory (10 points)**
   - Recent improvement in readiness score
   - Indicates learning velocity

6. **CGPA (3 points)**
   - Academic performance

7. **Certifications (2 points)**
   - Verified certifications

8. **Coding Consistency (5 points)**
   - LeetCode/GitHub streaks
   - Indicates discipline and dedication

### Minimum Thresholds
- Students must meet job's `minReadinessScore`, `minCGPA`, and `minProjects`
- Only students with match score ≥30 are included
- Top 50 matches get AI-generated justifications

---

## AI Integration Points

### 1. Job Description Generation
- **Model**: llama-3.3-70b-versatile (Groq)
- **Input**: Basic job info (title, location, skills)
- **Output**: Professional description, responsibilities, qualifications
- **Fallback**: Template-based if AI fails

### 2. Match Reason Generation
- **Model**: llama-3.3-70b-versatile (Groq)
- **Input**: Student profile + job requirements + match data
- **Output**: 2-3 sentence justification
- **Fallback**: Template-based explanation

---

## Error Responses

### 400 Bad Request
```json
{
  "errors": [
    {
      "msg": "Job title is required",
      "param": "title",
      "location": "body"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "message": "Not authorized to view this job"
}
```

### 404 Not Found
```json
{
  "message": "Job not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "Error message details",
  "stack": "..." // Only in development
}
```

---

## Usage Examples

### Complete Workflow

```javascript
// 1. Create a job
const createResponse = await fetch('/api/jobs', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Software Development Intern',
    location: 'Bangalore',
    requiredSkills: ['JavaScript', 'React', 'Node.js'],
    minReadinessScore: 70,
    minCGPA: 7.0
  })
});
const job = await createResponse.json();
console.log('Job created:', job.job._id);

// 2. Publish the job (activates and triggers matching)
const publishResponse = await fetch(`/api/jobs/${job.job._id}/publish`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});
console.log('Job published and matching started');

// 3. Get matched students after a few seconds
setTimeout(async () => {
  const matchesResponse = await fetch(`/api/jobs/${job.job._id}/matches?limit=10`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const matches = await matchesResponse.json();
  console.log(`Found ${matches.totalMatches} matches`);
  
  // 4. Get detailed explanation for top match
  const topStudent = matches.matches[0].studentId._id;
  const explainResponse = await fetch(
    `/api/jobs/${job.job._id}/matches/${topStudent}/explain`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  const explanation = await explainResponse.json();
  console.log('Match explanation:', explanation.matchReason);
}, 5000);
```

---

## Performance Considerations

- **Matching Speed**: ~1-3 seconds for 1000 students
- **AI Generation**: ~2-5 seconds per description/reason
- **Caching**: Matches are cached to avoid re-computation
- **Background Processing**: Matching can run asynchronously after job publish
- **Rate Limiting**: Consider implementing rate limits for AI-heavy endpoints

---

## Best Practices

1. **Create jobs as drafts first** - Review AI-generated content before publishing
2. **Re-match periodically** - Run `/match` endpoint weekly to update with new students
3. **Use filters wisely** - Set `minReadinessScore` and `minCGPA` to reduce noise
4. **Limit API calls** - Cached matches are valid for 24 hours
5. **Monitor AI quality** - Review AI justifications and provide feedback

---

## Future Enhancements

- [ ] Student application tracking
- [ ] Email notifications to matched students
- [ ] Bulk contact actions
- [ ] Interview scheduling integration
- [ ] Advanced analytics dashboard
- [ ] A/B testing for job descriptions
- [ ] Skill gap recommendations for students

---

## Support

For issues or questions:
- Backend API: Check server logs
- AI responses: Verify GROQ_API_KEY is set
- Matching errors: Check student data quality
