# 🚀 EvolvEd New Features - Quick Reference

## 📦 Installation (Already Done!)
```bash
✅ npm install socket.io-client (frontend)
✅ npm install socket.io (backend)
```

---

## 🔔 1. Notifications

### Backend - Send Notification
```javascript
const { createNotification } = require('./controllers/notificationController');

await createNotification(studentId, 'Student', {
  type: 'achievement_unlocked',
  title: 'Achievement Unlocked!',
  message: 'You earned 50 points!',
  priority: 'high',
  actionUrl: '/profile?tab=achievements'
});
```

### Frontend - Use Notifications
```tsx
import { NotificationBell } from '@/components/NotificationBell';
import { useNotifications } from '@/contexts/NotificationContext';

// Add to header
<NotificationBell />

// Use in components
const { notifications, unreadCount, markAsRead } = useNotifications();
```

**Available Types:**
- profile_update, skill_verified, achievement_unlocked
- interview_scheduled, interview_reminder
- recruiter_view, shortlist, message
- system_announcement, leaderboard_rank
- streak_milestone, github_sync, challenge_invitation

---

## 🌓 2. Dark Mode

### Setup in App
```tsx
import { ThemeProvider } from '@/contexts/ThemeContext';
import { NotificationProvider } from '@/contexts/NotificationContext';

function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        {/* Your app */}
      </NotificationProvider>
    </ThemeProvider>
  );
}
```

### Add Toggle
```tsx
import { ThemeToggle } from '@/components/ThemeToggle';

<div className="header">
  <ThemeToggle />
</div>
```

### Use in Components
```tsx
import { useTheme } from '@/contexts/ThemeContext';

const { theme, toggleTheme, setTheme } = useTheme();
```

---

## 🔍 3. Advanced Filters (Recruiters)

```tsx
import { AdvancedFilters } from '@/components/AdvancedFilters';

<AdvancedFilters
  onApplyFilters={(config) => {
    // config contains:
    // - minScore, maxScore
    // - skills: string[]
    // - minCGPA, maxCGPA
    // - minProjects
    // - colleges: string[]
    // - verified, githubConnected
    // - minLeetCodeScore, minHackerRankScore
    // - yearOfGraduation
    
    fetchStudents(config);
  }}
  currentFilters={filters}
  activeStudentCount={students.length}
/>
```

---

## 🏆 4. Achievements & Gamification

### Backend - Award Achievements
```javascript
const { unlockAchievement, checkAchievements } = require('./utils/gamification');

// Manual unlock
await unlockAchievement(studentId, 'github_connected');

// Auto-check eligibility (call after student updates)
await checkAchievements(studentId);
```

### Frontend - Display Achievements
```tsx
import { AchievementShowcase } from '@/components/AchievementShowcase';

<AchievementShowcase studentId={student.id} />
```

### Achievement Categories (42 total)
- **Skills**: first_skill, skill_master, polyglot, framework_expert
- **Coding**: leetcode_warrior, hackerrank_champion, problem_solver
- **GitHub**: first_commit, contributor, open_source_hero, streak_keeper
- **Profile**: profile_complete, resume_uploaded, github_connected
- **Interview**: interview_ready, mock_master, interview_ace
- **Engagement**: early_bird, night_owl, daily_grind, week_warrior, monthly_champion
- **Milestones**: top_10, top_50, top_100, score_milestone_50/75/90
- **Social**: endorsement_received, endorsement_given, mentor
- **Special**: verified_student, trendsetter, fast_learner

---

## 📊 5. Analytics Dashboard

```tsx
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';

<AnalyticsDashboard studentId={student.id} />
```

**Features:**
- Readiness score progress (area chart)
- Skill distribution (bar chart)
- Skill radar (multi-domain)
- Weekly activity heatmap
- Platform distribution (pie chart)
- Streak tracking
- Activity insights

---

## 🛠️ API Endpoints

### Notifications
```
GET    /api/notifications              - Get notifications (paginated)
GET    /api/notifications/unread-count - Get unread count
PATCH  /api/notifications/:id/read     - Mark as read
PATCH  /api/notifications/read-all     - Mark all as read
DELETE /api/notifications/:id          - Delete notification
```

### Gamification
```
GET /api/gamification/:id/achievements - Get student achievements
GET /api/gamification/leaderboard      - Get leaderboard (top 100)
GET /api/gamification/:id/analytics    - Get student analytics
```

---

## 🎯 Quick Integration Checklist

### App Setup (main.tsx or App.tsx)
```tsx
import { ThemeProvider } from '@/contexts/ThemeContext';
import { NotificationProvider } from '@/contexts/NotificationContext';

<ThemeProvider>
  <NotificationProvider>
    <RouterProvider router={router} />
  </NotificationProvider>
</ThemeProvider>
```

### Header/Navbar
```tsx
import { NotificationBell } from '@/components/NotificationBell';
import { ThemeToggle } from '@/components/ThemeToggle';

<header>
  <nav>
    {/* Your nav items */}
    <div className="flex items-center gap-2">
      <NotificationBell />
      <ThemeToggle />
    </div>
  </nav>
</header>
```

### Student Dashboard/Profile
```tsx
import { AchievementShowcase } from '@/components/AchievementShowcase';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';

<Tabs>
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="achievements">Achievements</TabsTrigger>
    <TabsTrigger value="analytics">Analytics</TabsTrigger>
  </TabsList>
  
  <TabsContent value="achievements">
    <AchievementShowcase />
  </TabsContent>
  
  <TabsContent value="analytics">
    <AnalyticsDashboard />
  </TabsContent>
</Tabs>
```

### Recruiter Dashboard
```tsx
import { AdvancedFilters } from '@/components/AdvancedFilters';

<div className="dashboard-header">
  <AdvancedFilters
    onApplyFilters={setFilters}
    currentFilters={filters}
    activeStudentCount={students.length}
  />
</div>
```

---

## 🔧 Common Patterns

### Trigger Notification After Action
```javascript
// In your controller after student action
const { createNotification } = require('./controllers/notificationController');

// Student updated profile
await createNotification(req.user._id, 'Student', {
  type: 'profile_update',
  title: 'Profile Updated',
  message: 'Your profile has been successfully updated',
  priority: 'low'
});

// Check for new achievements
const { checkAchievements } = require('./utils/gamification');
await checkAchievements(req.user._id);
```

### Dark Mode Styling
```tsx
// Add dark: prefix to any Tailwind class
<Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
  <h2 className="text-gray-900 dark:text-white">Title</h2>
  <p className="text-gray-600 dark:text-gray-400">Description</p>
</Card>
```

### Filter Students
```javascript
// In recruiter controller
const students = await Student.find({
  readinessScore: { $gte: minScore, $lte: maxScore },
  skills: { $in: requiredSkills },
  cgpa: { $gte: minCGPA },
  'projects.length': { $gte: minProjects },
  isVerified: verified,
  'githubAuth.username': { $exists: githubConnected }
});
```

---

## 🎨 Rarity Colors

```css
/* Common */ - Gray (400-600)
/* Rare */   - Blue (400-600)
/* Epic */   - Purple (400-600)
/* Legendary */ - Yellow/Orange gradient (400-600)
```

---

## ⚡ Performance Tips

1. **Notifications**: Limit to 20 per page for smooth scrolling
2. **WebSocket**: Connection auto-reconnects on network issues
3. **Achievements**: Checked automatically after profile updates
4. **Charts**: Use ResponsiveContainer for adaptive sizing
5. **Dark Mode**: Pure CSS transitions, no JS overhead

---

## 🐛 Debugging

### Check WebSocket Connection
```javascript
// Browser console
const socket = io('http://localhost:5000', {
  auth: { token: localStorage.getItem('token') }
});
socket.on('connect', () => console.log('✅ Connected'));
socket.on('error', (err) => console.error('❌ Error:', err));
```

### Test Notifications
```bash
# Create test notification via API
curl -X POST http://localhost:5000/api/notifications \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"system_announcement","title":"Test","message":"Hello"}'
```

### Check Achievements
```javascript
// In backend console or route
const { getStudentAchievements } = require('./utils/gamification');
const result = await getStudentAchievements('STUDENT_ID');
console.log(result);
```

---

## 📚 Documentation Files

- **NEW_FEATURES_GUIDE.md** - Complete feature documentation
- **setup-new-features.sh** - Automated setup script
- **QUICK_REFERENCE.md** - This file (quick snippets)

---

## 🎉 That's It!

All features are installed and ready to use. Check NEW_FEATURES_GUIDE.md for detailed docs!
