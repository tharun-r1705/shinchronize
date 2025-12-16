# OAuth Setup Guide

This guide explains how to set up Google and GitHub OAuth authentication for the EvolvEd platform.

## Features

- **Google OAuth**: Users can sign up and log in using their Google accounts
- **GitHub OAuth**: Users can sign up and log in using their GitHub accounts
- **Flexible Authentication**: Users who sign up with Google can optionally add their GitHub handle later
- **Seamless Flow**: After OAuth signup, users are prompted to complete their profile with additional information

## Google OAuth Setup

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth 2.0 Client ID**
5. Configure the OAuth consent screen if prompted
6. Select **Web application** as the application type
7. Add authorized redirect URIs:
   - Development: `http://localhost:5001/api/google/callback`
   - Production: `https://yourdomain.com/api/google/callback`
8. Save and copy the **Client ID** and **Client Secret**

### 2. Configure Environment Variables

Add the following to your `.env` file:

```env
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5001/api/google/callback
GOOGLE_TOKEN_ENCRYPTION_KEY=your_64_character_hex_encryption_key
```

Generate the encryption key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## GitHub OAuth Setup

### 1. Create GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in the application details:
   - **Application name**: EvolvEd
   - **Homepage URL**: `http://localhost:5173` (or your domain)
   - **Authorization callback URL**: `http://localhost:5001/api/github/callback`
4. Click **Register application**
5. Copy the **Client ID** and generate a **Client Secret**

### 2. Configure Environment Variables

Add the following to your `.env` file:

```env
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
GITHUB_REDIRECT_URI=http://localhost:5001/api/github/callback
GITHUB_TOKEN_ENCRYPTION_KEY=your_64_character_hex_encryption_key
```

## OAuth Flow

### Signup Flow

1. **User clicks "Continue with Google" or "Continue with GitHub"**
   - Redirected to OAuth provider's authorization page
   - User grants permissions

2. **OAuth Callback**
   - Backend receives authorization code
   - Exchanges code for access token
   - Fetches user profile information

3. **Account Creation**
   - For Google: New account created with user's name and email
   - For GitHub: New account created with GitHub username and email
   - User is automatically logged in with JWT token

4. **Profile Completion (Google only)**
   - After Google signup, dialog appears asking for GitHub username (optional)
   - User can either:
     - Enter GitHub username to link their account
     - Click "Skip for now" to complete later from profile settings

5. **Redirect to Dashboard**
   - User is taken to their dashboard

### Login Flow

1. **User clicks "Continue with Google" or "Continue with GitHub"**
   - Redirected to OAuth provider's authorization page

2. **OAuth Callback**
   - Backend verifies account exists with that email
   - Updates OAuth connection data
   - Generates JWT token

3. **Automatic Login**
   - User is logged in and redirected to dashboard

## API Endpoints

### Google OAuth

- `GET /api/google/connect?type=signup|login` - Initiates OAuth flow
- `GET /api/google/callback` - Handles OAuth callback
- `GET /api/google/status` - Get connection status (protected)
- `POST /api/google/disconnect` - Disconnect Google account (protected)

### GitHub OAuth

- `GET /api/github/connect?type=signup|login` - Initiates OAuth flow
- `GET /api/github/callback` - Handles OAuth callback
- `GET /api/github/status` - Get connection status (protected)
- `POST /api/github/disconnect` - Disconnect GitHub account (protected)
- `POST /api/github/link-manual` - Manually link GitHub username (protected)

## Frontend Components

### StudentLogin Page Features

1. **Back Button**: Top-left corner navigation to go back to home
2. **OAuth Buttons**: Google and GitHub buttons in both login and signup tabs
3. **GitHub Handle Dialog**: Modal that appears after Google OAuth signup to collect GitHub username

### Usage Example

```tsx
// Initiate Google signup
<Button onClick={() => handleGoogleOAuth('signup')}>
  <Chrome className="w-4 h-4 mr-2" />
  Google
</Button>

// Initiate GitHub login
<Button onClick={() => handleGitHubOAuth('login')}>
  <Github className="w-4 h-4 mr-2" />
  GitHub
</Button>
```

## Security Features

1. **CSRF Protection**: State parameter validation prevents cross-site request forgery
2. **Token Encryption**: OAuth access tokens are encrypted using AES-256-GCM before storage
3. **Rate Limiting**: OAuth endpoints are rate-limited to prevent abuse
4. **Secure Cookies**: State cookies are httpOnly and use sameSite protection
5. **Email Verification**: OAuth users are automatically marked as email-verified

## Testing

### Development Testing

1. Start the backend server:
```bash
cd backend
npm start
```

2. Start the frontend development server:
```bash
npm run dev
```

3. Navigate to `http://localhost:5173/student/login`
4. Click "Continue with Google" or "Continue with GitHub"
5. Complete the OAuth flow

### Production Deployment

1. Update redirect URIs in Google and GitHub OAuth settings
2. Update environment variables with production URLs:
   - `FRONTEND_URL=https://yourdomain.com`
   - `GOOGLE_REDIRECT_URI=https://yourdomain.com/api/google/callback`
   - `GITHUB_REDIRECT_URI=https://yourdomain.com/api/github/callback`

## Troubleshooting

### Common Issues

1. **"Redirect URI mismatch"**
   - Ensure redirect URIs in OAuth app settings match your `.env` configuration
   - Check for trailing slashes and protocol (http vs https)

2. **"State mismatch" or "State expired"**
   - Clear browser cookies
   - Ensure system time is synchronized
   - State tokens expire after 10 minutes

3. **"Account already exists"**
   - User trying to sign up with an email that's already registered
   - Direct them to use login instead

4. **"Account not found"**
   - User trying to log in with OAuth but no account exists
   - Direct them to sign up first

## Database Schema

### Student Model Updates

New fields added to support OAuth:

```javascript
googleAuth: {
  googleId: String,
  email: String,
  name: String,
  picture: String,
  encryptedAccessToken: String,
  connectedAt: Date,
  lastLoginAt: Date
}

githubAuth: {
  githubId: String,
  username: String,
  avatarUrl: String,
  encryptedAccessToken: String,
  connectedAt: Date,
  authType: String, // 'oauth' or 'manual'
  lastVerifiedAt: Date
}

oauthProvider: String, // 'google', 'github', or null
emailVerified: Boolean
```

## Future Enhancements

- [ ] Add LinkedIn OAuth
- [ ] Add Microsoft OAuth for educational institutions
- [ ] Implement OAuth token refresh
- [ ] Add two-factor authentication
- [ ] Allow users to link multiple OAuth providers
- [ ] Implement passwordless login for OAuth users

## Support

For issues or questions, please refer to the main project documentation or create an issue in the repository.
