# GitHub Token Setup Guide

The GitHub integration requires a **GitHub Personal Access Token** to fetch contribution calendar data (commits, streaks, active days).

## Why is this needed?

GitHub's GraphQL API requires authentication to access contribution data, even for public profiles. Without a token:
- ✅ Repos, stars, and languages will work
- ❌ Total commits, active days, and streaks will show as 0

## How to create a GitHub Personal Access Token

### Step 1: Go to GitHub Settings
Visit: https://github.com/settings/tokens/new

### Step 2: Configure the Token
- **Note**: `EvolvEd App - Contribution Data`
- **Expiration**: `No expiration` (or choose your preference)
- **Select scopes**:
  - ✅ `public_repo` - Access public repositories
  - ✅ `read:user` - Read user profile data

### Step 3: Generate Token
Click **"Generate token"** at the bottom of the page.

### Step 4: Copy the Token
Copy the token that starts with `ghp_` - **you won't be able to see it again!**

### Step 5: Add to `.env` file
Open `backend/.env` and add:

```env
GITHUB_TOKEN=ghp_your_token_here
```

Replace `ghp_your_token_here` with your actual token.

### Step 6: Restart the Backend
```bash
cd backend
npm run dev
```

## Verification

After adding the token:
1. Go to the Progress page in your app
2. Click "Refresh stats" for GitHub
3. You should now see:
   - ✅ Total Commits
   - ✅ Active Days
   - ✅ Current Streak
   - ✅ Contribution Calendar heatmap

## Security Notes

- ⚠️ **Never commit your token to Git!** The `.env` file is already in `.gitignore`.
- 🔒 Keep your token secure - it has access to your GitHub account.
- 🔄 You can revoke tokens at any time at: https://github.com/settings/tokens

## Alternative: Use a Bot Account

For production, consider creating a dedicated GitHub bot account and using its token instead of your personal account.

## Troubleshooting

### "Total commits still showing 0"
- Check that `GITHUB_TOKEN` is set in `backend/.env`
- Verify the token has `public_repo` and `read:user` scopes
- Restart the backend server
- Check backend logs for error messages

### "GitHub API rate limit exceeded"
- Without authentication: 60 requests/hour
- With authentication: 5,000 requests/hour
- The token solves this issue automatically

## For Vercel/Production Deployment

Add the `GITHUB_TOKEN` as an environment variable in your hosting platform:

**Vercel:**
1. Go to Project Settings → Environment Variables
2. Add: `GITHUB_TOKEN` = `ghp_your_token_here`
3. Redeploy

**Heroku:**
```bash
heroku config:set GITHUB_TOKEN=ghp_your_token_here
```

**Docker:**
```bash
docker run -e GITHUB_TOKEN=ghp_your_token_here ...
```
