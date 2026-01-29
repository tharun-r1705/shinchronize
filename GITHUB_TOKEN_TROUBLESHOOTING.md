# 🔍 GitHub Token Troubleshooting Guide

Your GitHub stats are showing zeros for commits, active days, and streak? Let's fix it!

## Quick Checklist

- [ ] GitHub token is saved in Profile page
- [ ] Token has correct scopes (`public_repo` and `read:user`)
- [ ] Backend server has been restarted after code changes
- [ ] Clicked "Refresh stats" on Progress page after adding token

---

## Step-by-Step Debugging

### Step 1: Verify Your Token Works

Run this test script to check if your token is valid:

```bash
cd backend
node test-github-token.js YOUR_GITHUB_USERNAME YOUR_TOKEN
```

**Expected output:**
```
✅ Token works! Here's your contribution data:
   Total Contributions: 547
   Data available for 52 weeks
   Active Days: 125
```

**If you see errors:**
- ❌ "Bad credentials" → Token is invalid or expired
- ❌ "API rate limit" → Token doesn't have required scopes
- ❌ "Resource not accessible" → Username is wrong

**Fix:** Create a new token at:
https://github.com/settings/tokens/new?scopes=public_repo,read:user&description=EvolvEd%20Stats

---

### Step 2: Check If Token Is Saved in Database

Open MongoDB and check:

```javascript
// In MongoDB Compass or shell:
db.students.findOne(
  { email: "your-email@example.com" },
  { githubToken: 1, githubUrl: 1, email: 1 }
)
```

**Expected:**
```json
{
  "email": "your-email@example.com",
  "githubUrl": "https://github.com/yourusername",
  "githubToken": "ghp_xxxxxxxxxxx..."
}
```

**If `githubToken` is missing or null:**
1. Go to Profile page
2. Paste your token in the "GitHub Personal Access Token" field
3. Click "Update Profile"
4. Check database again

---

### Step 3: Check Backend Logs

When you click "Refresh stats", the backend should log:

```
[updateProfile] GitHub token SET for user your-email@example.com
[updateGitHubStats] User: your-email@example.com, Token present: true, Token length: 40
[GitHub] Fetching calendar for yourusername. Token source: USER
[GitHub] Calendar data fetched successfully for yourusername
```

**If you see:**

❌ `Token present: false`
→ Token not saved in database (go back to Step 2)

❌ `Token source: NONE`
→ Token not being passed to GitHub API (backend code issue)

❌ `GitHub GraphQL API error: 401`
→ Token is invalid or expired (create new token)

❌ `GitHub GraphQL errors: "Bad credentials"`
→ Token format is wrong (should start with `ghp_`)

---

### Step 4: Restart Backend Server

After my code changes, you **must** restart the backend:

```bash
# Stop the backend (Ctrl+C if running)

# Start it again
cd backend
npm run dev
```

Wait for:
```
✓ Server running on http://localhost:5000
✓ MongoDB connected successfully
```

---

### Step 5: Test the Full Flow

1. **Go to Profile page**
2. **Verify token is filled** (shows as `••••••••••`)
3. **Go to Progress page**
4. **Click "Refresh stats"** for GitHub
5. **Check the response** in browser DevTools (Network tab)

**Expected Response:**
```json
{
  "student": {
    "githubStats": {
      "totalCommits": 547,
      "activeDays": 125,
      "streak": 7,
      "calendarWarning": null
    }
  }
}
```

**If you see `calendarWarning`:**
- Check the warning message
- Usually means token is missing or invalid

---

## Common Issues & Solutions

### Issue: "Token shows as empty in Profile"

**Cause:** Token is `select: false` in schema, so it's never sent to frontend

**Solution:** This is intentional for security! You need to re-enter the token each time you update your profile.

---

### Issue: "I saved the token but it's not working"

**Possible causes:**
1. Token expired (if you set expiration when creating it)
2. Token revoked on GitHub
3. Wrong scopes selected

**Solution:**
1. Go to https://github.com/settings/tokens
2. Delete the old token
3. Create new one with correct scopes
4. Update Profile with new token

---

### Issue: "Backend logs show 'Token present: true' but still zeros"

**Cause:** GitHub API might be rejecting the token

**Check backend logs for:**
```
GitHub GraphQL API error: 401 Unauthorized
```

**Solution:** Token is invalid. Create a new one.

---

### Issue: "Works for repos/stars but not commits"

**Cause:** The REST API works without auth (repos/stars), but GraphQL needs auth (commits/calendar)

**Solution:** Add your GitHub token - this is expected behavior!

---

## Token Permissions Checklist

When creating your token, make sure you select:

✅ **public_repo** - Access public repositories
✅ **read:user** - Read user profile data

❌ DO NOT select:
- `repo` (full control - too much access)
- `admin:*` (unnecessary)
- `delete_repo` (dangerous)

---

## Testing Without Restarting Backend

If you want to test quickly without restarting:

```bash
# In backend directory
node -e "
const { fetchGitHubStats } = require('./utils/github');
fetchGitHubStats('YOUR_GITHUB_USERNAME', 'YOUR_TOKEN')
  .then(stats => console.log(JSON.stringify(stats, null, 2)))
  .catch(err => console.error('Error:', err.message));
"
```

This will show you exactly what data the GitHub API returns.

---

## Still Not Working?

1. **Check backend terminal** for error messages
2. **Check browser console** (F12) for frontend errors
3. **Check MongoDB** to verify token is saved
4. **Run the test script** to verify token works
5. **Create a new token** if all else fails

**Share these details if you need help:**
- Backend logs when clicking "Refresh stats"
- Browser Network tab response
- Output of test-github-token.js script

---

## Quick Fix Summary

Most common solution (works 90% of the time):

1. ✅ Create new token: https://github.com/settings/tokens/new?scopes=public_repo,read:user
2. ✅ Add token to Profile page
3. ✅ Restart backend: `Ctrl+C`, then `npm run dev`
4. ✅ Click "Refresh stats" on Progress page
5. ✅ Should work! 🎉
