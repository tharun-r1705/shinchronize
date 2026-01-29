# Progress.tsx GitHub Integration Update Guide

## Overview
This file contains instructions to update `src/pages/Progress.tsx` to add GitHub analytics alongside the existing LeetCode analytics.

## Backup
A backup has been created at `src/pages/Progress.tsx.backup`

## Changes Required

### 1. Add GitHub Color Constant (Line ~24)
```typescript
const PIE_COLORS = ["#34d399", "#22c55e", "#0ea5e9"];
const GITHUB_COLORS = ["#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef"];  // ADD THIS LINE
```

### 2. Add GitHub Username Extraction Function (After extractLeetCodeUsername)
```typescript
const extractGitHubUsername = (rawValue?: string | null) => {
  if (!rawValue) return "";
  const trimmed = String(rawValue).trim();
  if (!trimmed) return "";

  if (!trimmed.toLowerCase().includes("github.com")) {
    return trimmed.replace(/[^a-zA-Z0-9_-]/g, "");
  }

  const candidate = trimmed.match(/^https?:\/\//)
    ? trimmed
    : `https://${trimmed.replace(/^\/+/, "")}`;

  try {
    const url = new URL(candidate);
    const segments = url.pathname
      .split("/")
      .map((segment) => segment.trim())
      .filter(Boolean);

    if (segments.length === 0) return "";
    return segments[0]?.replace(/[^a-zA-Z0-9_-]/g, "") || "";
  } catch (error) {
    return trimmed.replace(/[^a-zA-Z0-9_-]/g, "");
  }
};
```

### 3. Update State Variables (Line ~62)
```typescript
const [verifyingLeetCode, setVerifyingLeetCode] = useState(false);  // RENAME from 'verifying'
const [verifyingGitHub, setVerifyingGitHub] = useState(false);  // ADD THIS LINE
```

### 4. Add GitHub State Variables (After leetStats)
```typescript
const leetStats = student?.leetcodeStats;
const githubStats = student?.githubStats;  // ADD THIS LINE

const derivedLeetUsername = useMemo(...);
const derivedGitHubUsername = useMemo(  // ADD THIS BLOCK
  () => extractGitHubUsername(student?.codingProfiles?.github || student?.githubUrl),
  [student?.codingProfiles?.github, student?.githubUrl]
);

const isLeetConnected = Boolean(leetStats);
const isGitHubConnected = Boolean(githubStats?.username);  // ADD THIS LINE
```

### 5. Add GitHub Data Processing (After LeetCode useMemos)
```typescript
// ADD THESE useMemo BLOCKS:

const topLanguages = useMemo(() => {
  if (!Array.isArray(githubStats?.topLanguages)) return [];
  return githubStats.topLanguages
    .filter((item: any) => item && typeof item.name === "string")
    .slice(0, 5);
}, [githubStats?.topLanguages]);

const githubCalendarSeries = useMemo(() => {
  if (!githubStats?.calendar) return [];
  return Object.entries(githubStats.calendar)
    .map(([epoch, count]) => {
      const date = new Date(Number(epoch) * 1000);
      if (Number.isNaN(date.getTime())) return null;
      return {
        date: date.toISOString().slice(0, 10),
        count: Number(count) || 0,
      };
    })
    .filter(Boolean)
    .sort((a: any, b: any) => (a.date as string).localeCompare(b.date as string));
}, [githubStats?.calendar]);

const { githubCalendarWeeks, maxGithubCalendarCount } = useMemo(() => {
  // COPY THE EXACT SAME LOGIC AS calendarWeeks BUT USE githubStats?.calendar
  // Change variable names: githubCalendarWeeks, maxGithubCalendarCount
  // (See full implementation in the backup or LeetCode version)
}, [githubStats?.calendar]);

const githubWeeklyAreaSeries = useMemo(() => {
  // COPY weeklyAreaSeries logic but use githubCalendarSeries
}, [githubCalendarSeries]);

const githubSummaryMetrics = useMemo(() => {
  if (!githubStats) return [];
  return [
    { label: "Total Repos", value: githubStats.totalRepos ?? 0 },
    { label: "Total Stars", value: githubStats.totalStars ?? 0 },
    { label: "Total Commits", value: githubStats.totalCommits ?? 0 },
    { label: "Active Days", value: githubStats.activeDays ?? 0 },
    { label: "Current Streak", value: githubStats.streak ?? 0 },
    { label: "Best Day", value: formatBestDay() },  // Format similar to LeetCode
  ];
}, [githubStats]);

const githubLastUpdated = useMemo(() => {
  if (!githubStats?.fetchedAt) return null;
  const parsed = new Date(githubStats.fetchedAt);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleString();
}, [githubStats?.fetchedAt]);
```

### 6. Update getHeatmapClass Function
```typescript
const getHeatmapClass = useCallback(
  (count: number, type: 'leetcode' | 'github' = 'leetcode') => {
    if (!count) return "bg-muted";
    const maxCount = type === 'leetcode' ? maxCalendarCount : maxGithubCalendarCount;
    if (!maxCount || maxCount <= 1) {
      return type === 'leetcode' ? "bg-emerald-400/70" : "bg-blue-400/70";
    }
    const ratio = count / maxCount;
    if (type === 'leetcode') {
      if (ratio >= 0.75) return "bg-emerald-600";
      if (ratio >= 0.5) return "bg-emerald-500";
      if (ratio >= 0.25) return "bg-emerald-400";
      return "bg-emerald-300";
    } else {
      if (ratio >= 0.75) return "bg-blue-600";
      if (ratio >= 0.5) return "bg-blue-500";
      if (ratio >= 0.25) return "bg-blue-400";
      return "bg-blue-300";
    }
  },
  [maxCalendarCount, maxGithubCalendarCount]
);

const githubHeatmapLegend = useMemo(() => {
  const highest = maxGithubCalendarCount || 10;
  return [
    { label: "0", className: "bg-muted" },
    { label: "1+", className: "bg-blue-300" },
    { label: "25%", className: "bg-blue-400" },
    { label: "50%", className: "bg-blue-500" },
    { label: `${highest}+`, className: "bg-blue-600" },
  ];
}, [maxGithubCalendarCount]);
```

### 7. Add refreshGitHubStats Function
```typescript
const refreshGitHubStats = useCallback(
  async (options?: { silent?: boolean }) => {
    const username = derivedGitHubUsername;
    if (!username) {
      if (!options?.silent) {
        toast({
          title: "GitHub link missing",
          description: "Add your GitHub profile link from the Profile page to enable analytics.",
          variant: "destructive",
        });
      }
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/student/login");
      return;
    }

    if (!options?.silent) {
      setVerifyingGitHub(true);
    }

    try {
      await studentApi.verifyGitHub(username, token);
      const refreshed = await studentApi.getProfile(token);
      setStudent(refreshed);
      if (!options?.silent) {
        toast({
          title: "GitHub stats updated",
          description: `Fetched the latest activity for ${username}.`,
        });
      }
    } catch (error: any) {
      if (!options?.silent) {
        toast({
          title: "Refresh failed",
          description: error?.message || "Could not refresh GitHub stats",
          variant: "destructive",
        });
      }
    } finally {
      if (!options?.silent) {
        setVerifyingGitHub(false);
      }
    }
  },
  [derivedGitHubUsername, navigate, toast]
);
```

### 8. Update Auto-sync useEffect
```typescript
useEffect(() => {
  if (!student || autoSyncAttempted) return;
  if (derivedLeetUsername && !student.leetcodeStats) {
    refreshLeetCodeStats({ silent: true });
  }
  if (derivedGitHubUsername && !student.githubStats) {  // ADD THESE 3 LINES
    refreshGitHubStats({ silent: true });
  }
  setAutoSyncAttempted(true);
}, [student, derivedLeetUsername, derivedGitHubUsername, autoSyncAttempted, refreshLeetCodeStats, refreshGitHubStats]);
```

### 9. Update Page Title
```typescript
<p className="text-sm text-muted-foreground">
  Track your LeetCode and GitHub progress and discover areas to improve.
</p>
```

### 10. Add GitHub Section to Progress Sources Card (After LeetCode section)
```tsx
{/* GitHub Section */}
<div className="rounded-lg border border-border/60 bg-muted/60 p-4 space-y-3">
  <div className="flex items-center gap-2">
    <Link2 className="w-4 h-4 text-blue-500" />
    <span className="font-semibold">GitHub Profile</span>
    {isGitHubConnected ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : derivedGitHubUsername ? (
      <XCircle className="w-4 h-4 text-amber-500" />
    ) : null}
  </div>

  {derivedGitHubUsername ? (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <span className="font-mono">@{derivedGitHubUsername}</span>
      <Button variant="link" size="sm" className="px-0" asChild>
        <a
          href={`https://github.com/${derivedGitHubUsername}`}
          target="_blank"
          rel="noreferrer"
        >
          Open profile
        </a>
      </Button>
    </div>
  ) : (
    <p className="text-sm text-muted-foreground">
      Add your GitHub profile link under Profile to unlock automatic stats.
    </p>
  )}

  <div className="flex flex-wrap items-center gap-3">
    <Button
      onClick={() => refreshGitHubStats()}
      disabled={verifyingGitHub || !derivedGitHubUsername}
      className="flex items-center gap-2"
    >
      <RefreshCw className={`w-4 h-4 ${verifyingGitHub ? "animate-spin" : ""}`} />
      {verifyingGitHub ? "Refreshing..." : "Refresh stats"}
    </Button>
    {githubLastUpdated && (
      <span className="text-xs text-muted-foreground">Last refreshed {githubLastUpdated}</span>
    )}
  </div>

  {isGitHubConnected && (
    <p className="text-xs text-muted-foreground">
      We reuse your saved profile link, so you never have to re-enter your GitHub username here.
    </p>
  )}
</div>
```

### 11. Add GitHub Analytics Section (After all LeetCode cards)
```tsx
{/* GitHub Analytics */}
<div className="space-y-6">
  <h3 className="text-lg font-semibold text-blue-500">GitHub Analytics</h3>
  
  {/* Copy all the LeetCode cards structure but adapt for GitHub: */}
  {/* - GitHub Snapshot Card (with githubSummaryMetrics) */}
  {/* - Top Languages Pie Chart */}
  {/* - Language Breakdown Bar Chart */}
  {/* - Contribution Calendar Heatmap */}
  {/* - Weekly Contribution Trend Area Chart */}
  
  {/* Use blue colors instead of green */}
  {/* Use "contributions" instead of "submissions" */}
  {/* Use githubStats data instead of leetStats */}
</div>
```

## Quick Reference for GitHub Cards

All GitHub cards should follow the exact same structure as LeetCode cards, but with:
- Color scheme: Blue (`#3b82f6`, `bg-blue-*`) instead of green
- Data source: `githubStats` instead of `leetStats`
- Labels: "contributions" instead of "submissions", "repos" instead of "problems"
- Heatmap: Use `getHeatmapClass(count, 'github')` and `githubHeatmapLegend`

## Testing
After updating, test:
1. Page loads without errors
2. Both LeetCode and GitHub sections render
3. Refresh buttons work for both platforms
4. Heatmaps display correctly with different colors
5. All charts and metrics show proper data

## Implementation Status
✅ Backend GitHub API integration complete
✅ Database schema updated
✅ API routes added
✅ Readiness score calculation updated
✅ AI mentor context updated
✅ Frontend types and API methods added
⏳ Progress.tsx UI update (this guide)
