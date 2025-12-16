# GitHub OAuth Testing Checklist

## Pre-Testing Setup

- [ ] GitHub OAuth app created at https://github.com/settings/developers
- [ ] Environment variables added to `.env`:
  - [ ] `GITHUB_CLIENT_ID`
  - [ ] `GITHUB_CLIENT_SECRET`
  - [ ] `GITHUB_REDIRECT_URI`
  - [ ] `GITHUB_TOKEN_ENCRYPTION_KEY`
  - [ ] `FRONTEND_URL`
- [ ] Dependencies installed: `npm install` in backend
- [ ] Backend running: `npm run dev` in backend directory
- [ ] Frontend running: `npm run dev` in project root
- [ ] MongoDB connected

---

## Test 1: OAuth Signup Flow (Happy Path)

### Steps
1. [ ] Navigate to http://localhost:5173/student/login
2. [ ] Click "Sign Up" tab
3. [ ] Fill in:
   - [ ] Name: "Test User"
   - [ ] Email: "test@example.com"
   - [ ] Password: "Test123!"
   - [ ] Confirm Password: "Test123!"
   - [ ] College: "MIT"
4. [ ] Click "Connect with GitHub" button
5. [ ] Verify redirect to GitHub authorization page
6. [ ] Click "Authorize" on GitHub
7. [ ] Verify redirect back to signup page
8. [ ] Verify "GitHub Connected" badge appears
9. [ ] Verify username displays: "@yourusername"
10. [ ] Click "Create Account" button
11. [ ] Verify redirect to student dashboard
12. [ ] Verify success toast message

### Expected Results
- [ ] Account created successfully
- [ ] GitHub stats synced automatically
- [ ] Trust badge shows "GitHub Verified"
- [ ] Readiness score includes GitHub bonus
- [ ] Growth timeline entry created

### Database Verification
```bash
# Check in MongoDB
db.students.findOne({ email: "test@example.com" })
```

Verify:
- [ ] `githubAuth.authType === "oauth"`
- [ ] `githubAuth.encryptedAccessToken` exists (encrypted format)
- [ ] `githubAuth.username` matches GitHub username
- [ ] `githubStats` populated with repo data
- [ ] `validatedSkills` includes GitHub languages
- [ ] `growthTimeline` has OAuth entry

---

## Test 2: Manual Username Signup Flow

### Steps
1. [ ] Navigate to signup page
2. [ ] Fill in basic information
3. [ ] Scroll to GitHub section
4. [ ] Click "Or enter manually"
5. [ ] Enter GitHub username: "octocat"
6. [ ] Click "Create Account"
7. [ ] Verify account created

### Expected Results
- [ ] Account created successfully
- [ ] GitHub stats fetched from public profile
- [ ] Trust badge shows "GitHub Contributor" (not "Verified")
- [ ] `githubAuth.authType === "manual"`
- [ ] No `encryptedAccessToken` in database

---

## Test 3: OAuth with Invalid Credentials

### Steps
1. [ ] Set invalid `GITHUB_CLIENT_ID` in `.env`
2. [ ] Restart backend
3. [ ] Try OAuth flow
4. [ ] Click "Connect with GitHub"

### Expected Results
- [ ] Redirect back with error parameter
- [ ] Error toast displayed
- [ ] Can continue with manual username
- [ ] Signup not blocked

### Cleanup
- [ ] Restore correct `GITHUB_CLIENT_ID`
- [ ] Restart backend

---

## Test 4: OAuth State Expiration

### Steps
1. [ ] Click "Connect with GitHub"
2. [ ] Wait on GitHub authorization page for 11+ minutes
3. [ ] Click "Authorize"

### Expected Results
- [ ] Redirect back with "State expired" error
- [ ] Error toast displayed
- [ ] Can retry connection
- [ ] No partial data saved

---

## Test 5: Manual Username Validation

### Steps
1. [ ] Try entering invalid GitHub username
   - [ ] With spaces: "user name"
   - [ ] With special chars: "user@123"
   - [ ] Non-existent: "thisuserdoesnotexist999999"
2. [ ] Click "Create Account"

### Expected Results
- [ ] Invalid formats auto-sanitized
- [ ] Non-existent username shows error
- [ ] Account not created with invalid username
- [ ] Clear error message displayed

---

## Test 6: Duplicate GitHub Account

### Steps
1. [ ] Create account with GitHub OAuth
2. [ ] Try creating second account with same GitHub
3. [ ] Should see error

### Expected Results
- [ ] "GitHub already linked" error
- [ ] Second account not created
- [ ] First account unchanged

---

## Test 7: Profile GitHub Linking (Existing User)

### Steps
1. [ ] Create account without GitHub
2. [ ] Login to dashboard
3. [ ] Navigate to profile settings
4. [ ] Click "Connect GitHub" (if available)
5. [ ] Complete OAuth flow

### Expected Results
- [ ] GitHub linked to existing account
- [ ] Trust badge updated to "GitHub Verified"
- [ ] Stats synced
- [ ] Readiness score updated

---

## Test 8: Rate Limiting

### Steps
1. [ ] Make 11 rapid requests to `/api/github/connect`
2. [ ] Use curl or Postman:
   ```bash
   for i in {1..11}; do
     curl http://localhost:5001/api/github/connect
   done
   ```

### Expected Results
- [ ] First 10 requests succeed
- [ ] 11th request returns 429 (Too Many Requests)
- [ ] Error message: "Too many OAuth requests"

---

## Test 9: Token Encryption/Decryption

### Steps
1. [ ] Complete OAuth signup
2. [ ] Check database for `encryptedAccessToken`
3. [ ] Verify format: `iv:encrypted:authTag` (all hex)
4. [ ] Try decrypting with wrong key (should fail)

### Backend Test Script
```javascript
const { encryptToken, decryptToken } = require('./backend/utils/githubOAuth');

const token = "test_token_123";
const encrypted = encryptToken(token);
const decrypted = decryptToken(encrypted);

console.assert(decrypted === token, "Encryption/Decryption failed");
```

### Expected Results
- [ ] Token encrypted in database (not plain text)
- [ ] Format matches: `[hex]:[hex]:[hex]`
- [ ] Decryption works with correct key
- [ ] Decryption fails with wrong key

---

## Test 10: GitHub API Connection Status

### Steps
1. [ ] Login as student with GitHub connected
2. [ ] Make request to `/api/github/status`
   ```bash
   curl http://localhost:5001/api/github/status \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

### Expected Results
- [ ] Returns GitHub connection info
- [ ] Shows `authType`, `username`, `activityScore`
- [ ] No `encryptedAccessToken` in response (security)
- [ ] Last synced timestamp present

---

## Test 11: GitHub Disconnection

### Steps
1. [ ] Login as student
2. [ ] POST to `/api/github/disconnect`
3. [ ] Verify response
4. [ ] Check database

### Expected Results
- [ ] `githubAuth` field cleared
- [ ] `githubStats` optionally kept (based on `keepStats`)
- [ ] Success message returned
- [ ] Can reconnect later

---

## Test 12: UI/UX Testing

### Visual Tests
- [ ] GitHub button has correct styling (GitHub colors)
- [ ] Connection badge displays properly
- [ ] Manual input divider looks good
- [ ] Success/error toasts appear correctly
- [ ] Loading states work (disabled buttons)

### Responsive Tests
- [ ] Works on mobile viewport
- [ ] Works on tablet viewport
- [ ] Works on desktop
- [ ] No layout breaks

---

## Test 13: Error Handling

### Scenarios to Test
1. [ ] GitHub API is down
   - Expected: Continue without sync, show warning
   
2. [ ] Network timeout during OAuth
   - Expected: Show error, allow retry
   
3. [ ] Invalid code parameter
   - Expected: Redirect with error message
   
4. [ ] Missing encryption key in env
   - Expected: Error logged, OAuth disabled
   
5. [ ] Database connection lost during signup
   - Expected: Proper error message, no partial data

---

## Test 14: Performance Testing

### Metrics to Check
- [ ] OAuth redirect time: < 2 seconds
- [ ] Token encryption time: < 100ms
- [ ] GitHub stats sync time: < 5 seconds
- [ ] Signup completion time: < 3 seconds
- [ ] No memory leaks during repeated OAuth flows

---

## Test 15: Security Testing

### Security Checks
- [ ] Access tokens never logged in console
- [ ] Access tokens never in network responses
- [ ] Cookies have correct security flags
- [ ] CSRF state parameter validated
- [ ] SQL injection attempts blocked (username input)
- [ ] XSS attempts blocked (username display)
- [ ] Rate limiting prevents brute force

---

## Production Readiness Checklist

### Before Deploying
- [ ] Environment variables set in production
- [ ] GitHub OAuth app updated with production URLs
- [ ] `NODE_ENV=production` set
- [ ] HTTPS enabled (required for secure cookies)
- [ ] CORS configured for production domain
- [ ] Database backups enabled
- [ ] Error logging configured (e.g., Sentry)
- [ ] Rate limits reviewed and adjusted
- [ ] Documentation reviewed

---

## Rollback Plan

If issues arise in production:

1. [ ] Revert frontend changes (GitHub UI)
2. [ ] Disable GitHub OAuth routes (comment out in server.js)
3. [ ] Existing auth continues working normally
4. [ ] No data loss (optional field)
5. [ ] Users can still sign up without GitHub

---

## Test Results Template

```
Test Date: ___________
Tester: ___________
Environment: [ ] Local  [ ] Staging  [ ] Production

| Test # | Test Name | Status | Notes |
|--------|-----------|--------|-------|
| 1      | OAuth Flow | ✅ / ❌ |       |
| 2      | Manual Username | ✅ / ❌ |       |
| 3      | Invalid Creds | ✅ / ❌ |       |
| ...    | ...       | ✅ / ❌ |       |

Overall Status: ___________
Issues Found: ___________
Blockers: ___________
```

---

## Common Issues & Solutions

### Issue: "Redirect URI mismatch"
**Solution**: Verify `GITHUB_REDIRECT_URI` in `.env` matches GitHub app settings exactly

### Issue: "Invalid state parameter"
**Solution**: Clear browser cookies and retry. State may have expired.

### Issue: "Token encryption failed"
**Solution**: Check `GITHUB_TOKEN_ENCRYPTION_KEY` is valid 64-char hex string

### Issue: GitHub button does nothing
**Solution**: Check browser console for errors. Verify `VITE_API_URL` is set.

### Issue: Stats not syncing
**Solution**: Check GitHub API rate limits. May need `GITHUB_TOKEN` for higher limits.

---

## Automated Testing (Future)

Consider adding:
- [ ] Unit tests for OAuth utilities
- [ ] Integration tests for OAuth flow
- [ ] E2E tests with Playwright/Cypress
- [ ] Load testing for rate limits
- [ ] Security scanning tools

---

**Note**: This checklist should be completed before merging to main branch and deploying to production.
