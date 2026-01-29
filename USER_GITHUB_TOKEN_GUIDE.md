# GitHub Token Setup Guide (User-Based)

To see your **full GitHub statistics** (commits, streaks, contribution calendar), you need to provide your own GitHub Personal Access Token.

## Why do I need this?

GitHub requires authentication to access contribution data, even for public profiles. Without a token:
- ✅ **Works**: Repos, stars, followers, programming languages
- ❌ **Shows 0**: Total commits, active days, current streak, contribution calendar

## How to Set Up Your GitHub Token

### Step 1: Create a GitHub Personal Access Token

1. Go to: **[https://github.com/settings/tokens/new](https://github.com/settings/tokens/new?scopes=public_repo,read:user&description=EvolvEd%20Stats)**
   
2. Fill in the form:
   - **Note**: `EvolvEd Stats`
   - **Expiration**: Choose `No expiration` or `90 days` (you'll need to update it when it expires)
   - **Select scopes** (check these boxes):
     - ✅ `public_repo` - Access public repositories  
     - ✅ `read:user` - Read user profile data

3. Click **"Generate token"** at the bottom

4. **Copy the token** - it starts with `ghp_...`
   - ⚠️ **Important**: You won't be able to see it again!

### Step 2: Add Token to Your Profile

1. Go to your **Profile** page in EvolvEd
2. Scroll to the **"Links & Profiles"** section
3. Find the **"GitHub Personal Access Token"** field
4. Paste your token (it will be hidden with password dots)
5. Click **"Update Profile"** to save

### Step 3: Refresh Your GitHub Stats

1. Go to the **Progress** page
2. Click **"Refresh stats"** in the GitHub section
3. You should now see:
   - ✅ Total Commits
   - ✅ Active Days  
   - ✅ Current Streak
   - ✅ Full contribution calendar heatmap

---

## Security & Privacy

### Is it safe?

✅ **Yes!** Your token is:
- Stored securely in the database
- **Never shown in the UI** (password field)
- **Never sent to the frontend** (excluded from API responses)
- **Read-only permissions** - it can't modify anything
- Only used when **you** request to refresh your own stats

### What can this token access?

The token with `public_repo` and `read:user` scopes can only:
- ✅ Read your public repositories
- ✅ Read your public profile data
- ✅ Read your contribution calendar
- ❌ **Cannot** push code or modify repos
- ❌ **Cannot** access private repos (unless you grant that scope, which we don't recommend)

### Can I revoke it?

Yes! You can revoke your token anytime at:
**[https://github.com/settings/tokens](https://github.com/settings/tokens)**

If you revoke it, just create a new one and update your profile.

---

## Troubleshooting

### "Contribution data unavailable" message

**Cause**: No GitHub token is set in your profile

**Solution**:
1. Follow the steps above to create a token
2. Add it to your Profile page
3. Click "Refresh stats" on the Progress page

### "Unable to fetch contribution calendar. Check your token permissions."

**Cause**: Your token might be expired or missing required scopes

**Solution**:
1. Go to [https://github.com/settings/tokens](https://github.com/settings/tokens)
2. Check if your token is expired
3. Create a new token with `public_repo` and `read:user` scopes
4. Update your profile with the new token

### "Total commits still showing 0"

**Possible causes**:
1. Token not saved yet - make sure you clicked "Update Profile"
2. Token doesn't have required scopes - recreate with `public_repo` and `read:user`
3. Need to refresh - click "Refresh stats" on Progress page

---

## For Administrators

If you want to provide a **server-side fallback token** (so users don't need their own):

1. Create a GitHub account for the app (e.g., `evolved-bot`)
2. Generate a token for that account
3. Add to `backend/.env`:
   ```env
   GITHUB_TOKEN=ghp_your_server_token_here
   ```
4. Restart the backend

**Token priority**: User's token (if provided) → Server token (fallback) → No data

---

## FAQ

**Q: Do I have to create a token?**  
A: No, but without it you'll only see repos, stars, and languages. No commits or streaks.

**Q: Will my token expire?**  
A: Only if you set an expiration date when creating it. Choose "No expiration" for permanent access.

**Q: Can others see my token?**  
A: No. Your token is hidden from all users and never appears in API responses.

**Q: What if I change my GitHub password?**  
A: Your Personal Access Token is independent of your password and will continue working.

**Q: Can I use the same token for multiple apps?**  
A: Yes, but for security it's better to create separate tokens for each app.

---

**Need help?** Contact your administrator or open an issue on the EvolvEd repository.
