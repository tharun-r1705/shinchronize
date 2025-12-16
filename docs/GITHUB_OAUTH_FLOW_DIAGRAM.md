# GitHub OAuth Flow Diagram

## Complete OAuth Flow Visualization

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         GITHUB OAUTH SIGNUP FLOW                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   Student    │
│   Browser    │
└──────┬───────┘
       │
       │ 1. Visit signup page
       │    /student/login?tab=signup
       ▼
┌──────────────────────────────┐
│   Frontend (React)           │
│   StudentLogin.tsx           │
│                              │
│  ┌────────────────────────┐ │
│  │ Name:     [John Doe  ] │ │
│  │ Email:    [john@...  ] │ │
│  │ Password: [********  ] │ │
│  │ College:  [MIT       ] │ │
│  │                        │ │
│  │ ┌────────────────────┐ │ │
│  │ │  Connect GitHub    │ │ │  ◄── Student clicks
│  │ │  [GitHub Logo]     │ │ │
│  │ └────────────────────┘ │ │
│  └────────────────────────┘ │
└──────────┬───────────────────┘
           │
           │ 2. Redirect to OAuth endpoint
           │    GET /api/github/connect
           ▼
┌──────────────────────────────────────┐
│   Backend (Node.js)                  │
│   githubController.js                │
│                                      │
│   initiateGitHubOAuth()              │
│   ├─ Generate state parameter        │
│   │  {                               │
│   │    studentId: "signup",          │
│   │    timestamp: 1702650000,        │
│   │    random: "abc123..."           │
│   │  }                               │
│   │                                  │
│   ├─ Encrypt & set cookie            │
│   │  github_oauth_state = state      │
│   │                                  │
│   └─ Build GitHub auth URL           │
│      scope: read:user, public_repo   │
└──────────┬───────────────────────────┘
           │
           │ 3. Redirect to GitHub
           │    https://github.com/login/oauth/authorize
           ▼
┌─────────────────────────────────────────┐
│   GitHub OAuth Authorization Page       │
│                                         │
│   ┌───────────────────────────────────┐│
│   │  EvolvEd wants permission to:     ││
│   │  • Read your profile info         ││
│   │  • Access public repositories     ││
│   │                                   ││
│   │  [Authorize] [Cancel]             ││  ◄── Student authorizes
│   └───────────────────────────────────┘│
└─────────┬───────────────────────────────┘
          │
          │ 4. Redirect with code
          │    /api/github/callback?code=abc&state=xyz
          ▼
┌──────────────────────────────────────────────┐
│   Backend (Node.js)                          │
│   githubController.js                        │
│                                              │
│   handleGitHubCallback()                     │
│   ├─ Validate state parameter                │
│   │  ✓ Check timestamp (< 10 min)           │
│   │  ✓ Compare with cookie                  │
│   │                                          │
│   ├─ Exchange code for access token          │
│   │  POST github.com/login/oauth/access_token│
│   │  → Response: { access_token: "..." }    │
│   │                                          │
│   ├─ Fetch GitHub user profile               │
│   │  GET api.github.com/user                 │
│   │  Authorization: Bearer <token>           │
│   │  → Response: {                           │
│   │      id: 12345,                          │
│   │      login: "johndoe",                   │
│   │      avatar_url: "https://..."           │
│   │    }                                     │
│   │                                          │
│   ├─ Encrypt access token                    │
│   │  AES-256-GCM with env key               │
│   │  → encrypted: "iv:data:tag"             │
│   │                                          │
│   └─ Store in cookie                         │
│      github_oauth_data = {                   │
│        githubId: 12345,                      │
│        username: "johndoe",                  │
│        avatarUrl: "https://...",             │
│        encryptedToken: "iv:data:tag"         │
│      }                                       │
└──────────┬───────────────────────────────────┘
           │
           │ 5. Redirect back to signup
           │    /student/login?tab=signup&github=connected&username=johndoe
           ▼
┌──────────────────────────────────┐
│   Frontend (React)               │
│   StudentLogin.tsx               │
│                                  │
│   useEffect() detects params:   │
│   ├─ tab=signup                  │
│   ├─ github=connected            │
│   └─ username=johndoe            │
│                                  │
│   Updates UI:                    │
│   ┌────────────────────────┐    │
│   │ ✓ GitHub Connected     │    │
│   │   @johndoe             │    │
│   └────────────────────────┘    │
│                                  │
│   Shows toast notification       │
└──────────┬───────────────────────┘
           │
           │ 6. Student completes signup
           │    Submits form with name, email, password, college
           ▼
┌─────────────────────────────────────────────────────┐
│   Backend (Node.js)                                 │
│   studentController.js                              │
│                                                     │
│   signup()                                          │
│   ├─ Create Student document                        │
│   │  { name, email, password, college }            │
│   │                                                 │
│   ├─ Check for github_oauth_data cookie             │
│   │  ✓ Found! Parse JSON                           │
│   │                                                 │
│   ├─ Add GitHub auth to student                     │
│   │  student.githubAuth = {                         │
│   │    githubId: 12345,                             │
│   │    username: "johndoe",                         │
│   │    avatarUrl: "https://...",                    │
│   │    encryptedAccessToken: "iv:data:tag",         │
│   │    connectedAt: new Date(),                     │
│   │    authType: "oauth",                           │
│   │    lastVerifiedAt: new Date()                   │
│   │  }                                              │
│   │                                                 │
│   ├─ Fetch GitHub stats                             │
│   │  fetchGitHubData("johndoe")                     │
│   │  → Returns: {                                   │
│   │      totalRepos: 42,                            │
│   │      topLanguages: [...],                       │
│   │      activityScore: 87,                         │
│   │      ...                                        │
│   │    }                                            │
│   │                                                 │
│   ├─ Update validated skills                        │
│   │  Extract languages from repos                   │
│   │  Add with confidence scores                     │
│   │                                                 │
│   ├─ Calculate readiness score                      │
│   │  Base score + GitHub bonus                     │
│   │  → Total: 78 points                            │
│   │                                                 │
│   ├─ Add growth timeline entry                      │
│   │  "GitHub account connected via OAuth"          │
│   │                                                 │
│   ├─ Clear OAuth cookie                             │
│   │  res.clearCookie('github_oauth_data')          │
│   │                                                 │
│   └─ Return JWT token + student data               │
└─────────┬───────────────────────────────────────────┘
          │
          │ 7. Return success response
          │    { token, student, readiness }
          ▼
┌──────────────────────────────────────┐
│   Frontend (React)                   │
│                                      │
│   ├─ Store token in localStorage     │
│   ├─ Store user data                 │
│   ├─ Show success toast              │
│   └─ Navigate to dashboard           │
│      /student/dashboard              │
└──────────┬───────────────────────────┘
           │
           │ 8. Dashboard loads
           ▼
┌──────────────────────────────────────────┐
│   Student Dashboard                      │
│                                          │
│   Welcome, John Doe!                     │
│                                          │
│   Readiness Score: 78                    │
│                                          │
│   Badges:                                │
│   🔰 GitHub Verified                     │
│   ⭐ Active Coder                        │
│                                          │
│   GitHub Stats:                          │
│   • 42 repositories                      │
│   • Top Languages: JS, Python, Go        │
│   • Activity Score: 87/100               │
└──────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════

MANUAL USERNAME FLOW (Fallback)

┌──────────────┐
│   Student    │
└──────┬───────┘
       │
       │ 1. Visit signup page
       ▼
┌────────────────────────┐
│   Signup Form          │
│                        │
│   [Name, Email, etc]   │
│                        │
│   GitHub (Optional):   │
│   ┌──────────────────┐│
│   │ Username: [john]  ││  ◄── Manual entry
│   └──────────────────┘│
│                        │
│   [Create Account]     │
└──────┬─────────────────┘
       │
       │ 2. Submit with githubUsername
       ▼
┌─────────────────────────────────┐
│   Backend                       │
│                                 │
│   signup()                      │
│   ├─ Validate username format   │
│   ├─ Fetch public GitHub data   │
│   │  (no OAuth token needed)    │
│   ├─ Create student with:       │
│   │  githubAuth: {              │
│   │    username: "john",        │
│   │    authType: "manual",      │
│   │    connectedAt: Date        │
│   │  }                          │
│   └─ Return success             │
└─────────┬───────────────────────┘
          │
          │ 3. Account created
          │    Badge: "GitHub Contributor"
          │    (Lower trust level)
          ▼
    [Dashboard]


═══════════════════════════════════════════════════════════════

DATABASE STORAGE

┌─────────────────────────────────────────────────┐
│   MongoDB - Student Collection                  │
│                                                 │
│   {                                             │
│     _id: ObjectId("..."),                       │
│     name: "John Doe",                           │
│     email: "john@example.com",                  │
│     password: "$2a$10$...",  // Hashed          │
│     college: "MIT",                             │
│                                                 │
│     githubAuth: {                               │
│       githubId: "12345",                        │
│       username: "johndoe",                      │
│       avatarUrl: "https://avatars...",          │
│       encryptedAccessToken: "abc:def:ghi",  ◄── Encrypted!
│       connectedAt: ISODate("2024-12-15..."),    │
│       authType: "oauth",                        │
│       lastVerifiedAt: ISODate("2024-12-15...")  │
│     },                                          │
│                                                 │
│     githubStats: {                              │
│       username: "johndoe",                      │
│       totalRepos: 42,                           │
│       topLanguages: [...],                      │
│       topRepos: [...],                          │
│       activityScore: 87,                        │
│       lastSyncedAt: ISODate("...")              │
│     },                                          │
│                                                 │
│     validatedSkills: [                          │
│       {                                         │
│         name: "JavaScript",                     │
│         source: "github",                       │
│         confidence: 0.95,                       │
│         evidence: ["15 repos using JS"]         │
│       }                                         │
│     ],                                          │
│                                                 │
│     growthTimeline: [                           │
│       {                                         │
│         date: ISODate("..."),                   │
│         readinessScore: 78,                     │
│         reason: "GitHub OAuth connected"        │
│       }                                         │
│     ],                                          │
│                                                 │
│     readinessScore: 78,                         │
│     ...                                         │
│   }                                             │
└─────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════

SECURITY LAYERS

┌──────────────────────────────────────────────────┐
│   Layer 1: CSRF Protection                       │
│   • State parameter with timestamp               │
│   • Random nonce included                        │
│   • 10-minute expiration                         │
└──────────────────────────────────────────────────┘
                      ▼
┌──────────────────────────────────────────────────┐
│   Layer 2: Token Encryption                      │
│   • AES-256-GCM algorithm                        │
│   • 32-byte encryption key from env              │
│   • Unique IV per encryption                     │
│   • Authentication tag for integrity             │
└──────────────────────────────────────────────────┘
                      ▼
┌──────────────────────────────────────────────────┐
│   Layer 3: Secure Cookies                        │
│   • httpOnly: Prevents XSS                       │
│   • secure: HTTPS only in production             │
│   • sameSite: Lax CSRF protection               │
│   • Short expiration (10-15 min)                 │
└──────────────────────────────────────────────────┘
                      ▼
┌──────────────────────────────────────────────────┐
│   Layer 4: Rate Limiting                         │
│   • 10 requests per 15 minutes                   │
│   • Per IP address                               │
│   • Applied to OAuth endpoints                   │
└──────────────────────────────────────────────────┘
                      ▼
┌──────────────────────────────────────────────────┐
│   Layer 5: Input Validation                      │
│   • Username sanitization                        │
│   • Code/state parameter validation              │
│   • GitHub API response validation               │
└──────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════

```

## Key Points

### 🔐 Security
- Access tokens are **encrypted** before database storage
- Tokens are **never exposed** to frontend
- CSRF protection via **state parameter**
- Rate limiting prevents **abuse**

### 🔄 OAuth Flow
1. Student initiates connection
2. Backend generates state
3. Redirect to GitHub
4. GitHub returns with code
5. Exchange code for token
6. Encrypt and store token
7. Return to frontend
8. Complete signup

### 📊 Data Storage
- OAuth data in `githubAuth` field
- Public stats in `githubStats` field
- Skills in `validatedSkills` array
- Timeline in `growthTimeline` array

### 🎯 Trust Levels
- **OAuth**: High trust, encrypted token
- **Manual**: Medium trust, public data only

### 🛡️ Error Handling
- Invalid code → Show error message
- Expired state → Prompt retry
- Token encryption fails → Graceful fallback
- GitHub API down → Continue without sync
