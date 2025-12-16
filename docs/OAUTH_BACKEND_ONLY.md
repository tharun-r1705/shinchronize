# OAuth Implementation - Backend-Only Environment Variables

## Architecture Overview

This implementation uses **backend-only** environment variables. The frontend does NOT have access to any secrets or OAuth credentials.

## Environment Variables (Backend Only)

All environment variables are in `/backend/.env` (or root `.env`) and loaded at the top of `server.js`:

```javascript
require('dotenv').config({ path: path.join(__dirname, '../.env') });
```

### Required Variables

```env
PORT=5001
FRONTEND_URL=http://localhost:8080
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_REDIRECT_URI=http://localhost:5001/api/github/callback
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5001/api/google/callback
JWT_SECRET=your_jwt_secret
```

## OAuth Flow

### 1. User Initiates OAuth (Frontend)

User clicks "Continue with Google" or "Continue with GitHub" button:

```typescript
// frontend: src/pages/StudentLogin.tsx
const handleGoogleOAuth = () => {
  window.location.href = '/api/google/login';
};

const handleGitHubOAuth = () => {
  window.location.href = '/api/github/login';
};
```

**No environment variables used in frontend!**

### 2. Backend Redirects to OAuth Provider

Backend constructs the OAuth URL using `process.env.*` and redirects:

```javascript
// backend: routes/googleRoutes.js or routes/githubRoutes.js
router.get('/login', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID; // or GITHUB_CLIENT_ID
  const redirectUri = process.env.GOOGLE_REDIRECT_URI; // or GITHUB_REDIRECT_URI
  
  // Generate CSRF protection state
  const state = Math.random().toString(36).substring(7);
  res.cookie('google_oauth_state', state, { httpOnly: true, ... });
  
  // Construct OAuth URL
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.append('client_id', clientId);
  authUrl.searchParams.append('redirect_uri', redirectUri);
  // ... other params
  
  // Redirect user to OAuth provider
  res.redirect(authUrl.toString());
});
```

### 3. User Authorizes on Provider

User logs in and grants permissions on Google/GitHub.

### 4. Provider Redirects to Callback

OAuth provider redirects to:
- `http://localhost:5001/api/google/callback?code=...&state=...`
- `http://localhost:5001/api/github/callback?code=...&state=...`

### 5. Backend Handles Callback

Backend exchanges code for access token and fetches user profile:

```javascript
router.get('/callback', async (req, res) => {
  const { code, state } = req.query;
  
  // Validate CSRF state
  const storedState = req.cookies.google_oauth_state;
  if (state !== storedState) {
    return res.redirect(`${process.env.FRONTEND_URL}/student/login?error=invalid_state`);
  }
  
  // Exchange code for access token (using process.env.* secrets)
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      code: code,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code'
    })
  });
  
  const { access_token } = await tokenResponse.json();
  
  // Fetch user profile
  const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { 'Authorization': `Bearer ${access_token}` }
  });
  
  const userData = await userResponse.json();
  
  // TODO: Create/update user in database, generate JWT
  
  // Redirect back to frontend
  res.redirect(`${process.env.FRONTEND_URL}/student/login?provider=google&email=${userData.email}&connected=true`);
});
```

### 6. Frontend Handles Success

Frontend checks URL params and shows success message:

```typescript
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('connected') === 'true') {
    toast({ title: "Successfully connected!", ... });
  }
}, []);
```

## Key Security Features

1. ✅ **No secrets in frontend** - All OAuth credentials stay in backend
2. ✅ **CSRF protection** - State parameter validates callback authenticity
3. ✅ **HttpOnly cookies** - State stored in secure cookie
4. ✅ **Backend token exchange** - Access tokens never exposed to frontend
5. ✅ **Environment variables only in backend** - `process.env.*` used only server-side

## API Endpoints

### GitHub OAuth
- `GET /api/github/login` - Initiates OAuth flow, redirects to GitHub
- `GET /api/github/callback` - Handles OAuth callback, redirects to frontend

### Google OAuth
- `GET /api/google/login` - Initiates OAuth flow, redirects to Google
- `GET /api/google/callback` - Handles OAuth callback, redirects to frontend

## File Structure

```
backend/
  server.js                  # dotenv loaded at top, routes registered
  routes/
    githubRoutes.js          # /login and /callback endpoints
    googleRoutes.js          # /login and /callback endpoints
    
frontend/
  src/pages/StudentLogin.tsx # Buttons redirect to /api/*/login
                             # NO environment variables used!
```

## Development Setup

1. Create `.env` in project root:
```env
PORT=5001
FRONTEND_URL=http://localhost:8080
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:5001/api/google/callback
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_REDIRECT_URI=http://localhost:5001/api/github/callback
JWT_SECRET=...
```

2. Start backend:
```bash
cd backend
npm start
```

3. Start frontend (on port 8080):
```bash
npm run dev -- --port 8080
```

4. Visit `http://localhost:8080/student/login`
5. Click OAuth buttons - they'll redirect to backend `/api/*/login` endpoints

## Production Deployment

Update `.env` with production URLs:
```env
FRONTEND_URL=https://yourdomain.com
GOOGLE_REDIRECT_URI=https://api.yourdomain.com/api/google/callback
GITHUB_REDIRECT_URI=https://api.yourdomain.com/api/github/callback
```

Update OAuth app settings in Google/GitHub console with production callback URLs.

## What Changed

### Before (Incorrect)
- ❌ Frontend had `VITE_API_URL` environment variable
- ❌ Frontend constructed OAuth URLs with secrets
- ❌ Complex controllers and utilities for OAuth

### After (Correct)
- ✅ Frontend has NO environment variables
- ✅ Frontend simply redirects to `/api/*/login`
- ✅ Backend handles ALL OAuth logic with `process.env.*`
- ✅ Simple, secure, no secrets exposed

## Testing

1. Click "Continue with Google" → Browser goes to Google login
2. Authorize → Redirected to `http://localhost:5001/api/google/callback`
3. Backend processes → Redirects to `http://localhost:8080/student/login?connected=true`
4. Frontend shows success message

Same flow for GitHub OAuth.
