# GitHub OAuth Integration - Setup Guide

## Overview

This implementation adds GitHub OAuth support to EvolvEd's student signup and profile management. Students can connect their GitHub accounts to:
- Validate coding skills automatically
- Improve profile credibility with recruiters
- Increase readiness scores
- Display verified GitHub activity

## Features Implemented

### 1. **OAuth Flow (Primary Method)**
- Students click "Connect with GitHub" button
- Redirected to GitHub authorization page
- After approval, GitHub data is automatically linked
- Trust badge: "GitHub Verified"
- Higher confidence in skill validation

### 2. **Manual Username Entry (Fallback)**
- Students can enter GitHub username manually
- Lower trust level than OAuth
- Trust badge: "GitHub Contributor"
- Can upgrade to OAuth later from profile

### 3. **Secure Token Storage**
- OAuth access tokens encrypted using AES-256-GCM
- Never exposed to frontend
- Used for enhanced data access (private repos stats)

### 4. **Trust Indicators for Recruiters**
- OAuth-verified accounts get "GitHub Verified" badge
- Manual links get "GitHub Contributor" badge
- Activity scores and language stats visible

## Setup Instructions

### Step 1: Create GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in details:
   - **Application name**: EvolvEd
   - **Homepage URL**: `http://localhost:5173` (dev) or your production URL
   - **Authorization callback URL**: `http://localhost:5001/api/github/callback`
4. Click "Register application"
5. Note your **Client ID** and generate a **Client Secret**

### Step 2: Configure Environment Variables

Add to your `.env` file:

```bash
# GitHub OAuth Configuration
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here
GITHUB_REDIRECT_URI=http://localhost:5001/api/github/callback

# Generate encryption key (run this command):
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
GITHUB_TOKEN_ENCRYPTION_KEY=your_64_character_hex_key_here

# Frontend URL for redirects
FRONTEND_URL=http://localhost:5173
```

### Step 3: Install Dependencies

```bash
cd backend
npm install cookie-parser express-rate-limit
```

### Step 4: Update Frontend Environment

Add to `frontend/.env` (if needed):

```bash
VITE_API_URL=http://localhost:5001
```

### Step 5: Restart Services

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
npm run dev
```

## API Endpoints

### Public Endpoints

#### `GET /api/github/connect`
Initiates GitHub OAuth flow. Redirects to GitHub authorization page.

**Query Parameters:**
- `studentId` (optional) - For linking existing accounts

**Response:** 302 redirect to GitHub

---

#### `GET /api/github/callback`
Handles OAuth callback from GitHub.

**Query Parameters:**
- `code` - Authorization code from GitHub
- `state` - CSRF protection token

**Response:** 302 redirect to frontend with status

---

### Protected Endpoints (require authentication)

#### `POST /api/github/link-manual`
Manually link GitHub via username (fallback method).

**Request Body:**
```json
{
  "githubUsername": "octocat"
}
```

**Response:**
```json
{
  "success": true,
  "message": "GitHub username linked successfully",
  "authType": "manual",
  "githubStats": { ... },
  "readinessScore": 78
}
```

---

#### `GET /api/github/status`
Get current GitHub connection status.

**Response:**
```json
{
  "connected": true,
  "authType": "oauth",
  "username": "octocat",
  "avatarUrl": "https://...",
  "connectedAt": "2024-12-15T10:00:00.000Z",
  "lastSynced": "2024-12-15T10:05:00.000Z",
  "activityScore": 87,
  "totalRepos": 42
}
```

---

#### `POST /api/github/disconnect`
Disconnect GitHub account.

**Request Body:**
```json
{
  "keepStats": true  // Optional, default true
}
```

**Response:**
```json
{
  "success": true,
  "message": "GitHub account disconnected"
}
```

## User Flows

### Signup Flow with OAuth

1. User visits signup page
2. Fills name, email, password, college
3. Clicks "Connect with GitHub" button
4. Redirected to GitHub → authorizes app
5. Redirected back to signup page with GitHub connected
6. Completes signup → account created with OAuth link
7. GitHub stats auto-synced
8. Growth timeline entry added

### Signup Flow with Manual Username

1. User visits signup page
2. Fills name, email, password, college
3. Enters GitHub username manually
4. Submits form
5. Backend verifies username exists
6. Account created with manual GitHub link
7. Stats fetched (lower trust level)

### Profile Linking (Existing Users)

1. User logs in
2. Goes to profile page
3. Clicks "Connect GitHub"
4. Follows OAuth flow
5. GitHub data added to existing profile
6. Trust badge upgraded to "GitHub Verified"

## Database Schema

### Student Model Updates

```javascript
githubAuth: {
  githubId: String,           // GitHub user ID (from OAuth)
  username: String,            // GitHub username
  avatarUrl: String,           // GitHub avatar
  encryptedAccessToken: String, // Encrypted OAuth token
  connectedAt: Date,           // Connection timestamp
  authType: String,            // "oauth" or "manual"
  lastVerifiedAt: Date         // Last OAuth token validation
}
```

## Security Features

1. **CSRF Protection**: State parameter with timestamp validation
2. **Token Encryption**: AES-256-GCM encryption for OAuth tokens
3. **Rate Limiting**: 10 requests per 15 minutes for OAuth endpoints
4. **Secure Cookies**: httpOnly, secure (in production), sameSite
5. **Token Isolation**: Access tokens never sent to frontend
6. **State Expiration**: OAuth states expire after 10 minutes

## Trust Badges

The system automatically assigns badges based on GitHub connection:

- **"GitHub Verified"** - Connected via OAuth (highest trust)
- **"GitHub Contributor"** - Manual username (medium trust)
- **"Active Coder"** - Recent GitHub activity (last 14 days)

## Testing

### Test OAuth Flow Locally

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `npm run dev`
3. Navigate to signup page
4. Click "Connect with GitHub"
5. Authorize the app on GitHub
6. Should redirect back with success message

### Test Manual Username

1. Go to signup page
2. Scroll to GitHub section
3. Click "Or enter manually"
4. Enter a valid GitHub username (e.g., "octocat")
5. Complete signup
6. Check profile for GitHub stats

## Troubleshooting

### "OAuth failed" error

**Cause**: Invalid OAuth credentials or callback URL mismatch

**Solution**: 
- Verify `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` in `.env`
- Ensure callback URL in GitHub app settings matches `GITHUB_REDIRECT_URI`

### "State expired" error

**Cause**: OAuth flow took longer than 10 minutes

**Solution**: Retry the connection

### "GitHub already linked" error

**Cause**: GitHub account connected to another EvolvEd account

**Solution**: Disconnect from other account first, or use different GitHub account

### Token encryption errors

**Cause**: Missing or invalid `GITHUB_TOKEN_ENCRYPTION_KEY`

**Solution**: Generate a new key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Add to `.env`

## Production Deployment

### Environment Variables

Update these for production:

```bash
GITHUB_REDIRECT_URI=https://yourdomain.com/api/github/callback
FRONTEND_URL=https://yourdomain.com
NODE_ENV=production
```

### GitHub OAuth App Settings

1. Update callback URL to production URL
2. Set homepage URL to production domain
3. Consider creating separate OAuth apps for dev/prod

### CORS Configuration

Ensure backend allows requests from production frontend domain.

## Future Enhancements

1. **Periodic Token Refresh**: Auto-refresh OAuth tokens before expiration
2. **Private Repo Access**: Use OAuth token to access private repository stats
3. **Contribution Calendar**: Display GitHub contribution heatmap on profile
4. **Repository Showcase**: Let students feature specific repositories
5. **Commit Analysis**: Analyze commit patterns for skill assessment

## Support

For issues or questions:
- Check backend logs for detailed error messages
- Verify environment variables are set correctly
- Ensure GitHub OAuth app is configured properly
- Test with a fresh browser session (clear cookies)
