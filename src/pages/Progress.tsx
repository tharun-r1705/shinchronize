import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { studentApi, platformApi, LeetCodeStats, GitHubStats } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  LogOut,
  Code2,
  Github,
  ExternalLink,
  Star,
  GitFork,
  Calendar,
  Flame,
  Trophy,
  TrendingUp,
  Users,
  GitPullRequest,
  CircleDot,
  FolderGit2
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const PIE_COLORS = ["#34d399", "#22c55e", "#0ea5e9"];
const LANGUAGE_COLORS = [
  "#3178c6", "#f1e05a", "#e34c26", "#563d7c", "#4F5D95",
  "#89e051", "#b07219", "#00ADD8", "#DA5B0B", "#178600"
];

const extractLeetCodeUsername = (rawValue?: string | null) => {
  if (!rawValue) return "";
  const trimmed = String(rawValue).trim();
  if (!trimmed) return "";
  if (!trimmed.toLowerCase().includes("leetcode.com")) {
    return trimmed.replace(/[^a-zA-Z0-9_-]/g, "");
  }
  const candidate = trimmed.match(/^https?:\/\//)
    ? trimmed
    : `https://${trimmed.replace(/^\/+/, "")}`;
  try {
    const url = new URL(candidate);
    const segments = url.pathname.split("/").map((s) => s.trim()).filter(Boolean);
    if (segments.length === 0) return "";
    if (segments[0].toLowerCase() === "u" || segments[0].toLowerCase() === "profile") {
      return segments[1]?.replace(/[^a-zA-Z0-9_-]/g, "") || "";
    }
    return segments[0]?.replace(/[^a-zA-Z0-9_-]/g, "") || "";
  } catch {
    return trimmed.replace(/[^a-zA-Z0-9_-]/g, "");
  }
};

const extractGitHubUsername = (rawValue?: string | null) => {
  if (!rawValue) return "";
  const trimmed = String(rawValue).trim();
  if (!trimmed) return "";
  if (!trimmed.toLowerCase().includes("github.com")) {
    return trimmed.replace(/[^a-zA-Z0-9_-]/g, "");
  }
  try {
    const url = new URL(trimmed.match(/^https?:\/\//) ? trimmed : `https://${trimmed}`);
    const segments = url.pathname.split("/").filter(Boolean);
    return segments[0]?.replace(/[^a-zA-Z0-9_-]/g, "") || "";
  } catch {
    return trimmed.replace(/[^a-zA-Z0-9_-]/g, "");
  }
};

const Progress = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("leetcode");

  // LeetCode state
  const [leetUsername, setLeetUsername] = useState("");
  const [leetStats, setLeetStats] = useState<LeetCodeStats | null>(null);
  const [leetLoading, setLeetLoading] = useState(false);
  const [leetError, setLeetError] = useState<string | null>(null);

  // GitHub state
  const [githubUsername, setGithubUsername] = useState("");
  const [githubStats, setGithubStats] = useState<GitHubStats | null>(null);
  const [githubLoading, setGithubLoading] = useState(false);
  const [githubError, setGithubError] = useState<string | null>(null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    localStorage.removeItem('studentData');
    localStorage.removeItem('studentToken');
    toast({ title: "Logged out successfully" });
    navigate('/');
  };

  // Load student profile and pre-populate usernames
  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/student/login");
          return;
        }
        const data = await studentApi.getProfile(token);
        setStudent(data);

        // Pre-populate usernames from profile
        const derivedLeet = extractLeetCodeUsername(data?.codingProfiles?.leetcode || data?.leetcodeUrl);
        const derivedGithub = extractGitHubUsername(data?.connectedGithubUsername || data?.githubUrl);

        if (derivedLeet) setLeetUsername(derivedLeet);
        if (derivedGithub) setGithubUsername(derivedGithub);

        // Load saved stats if available
        if (data?.leetcodeStats) {
          setLeetStats({
            success: true,
            platform: 'leetcode',
            username: data.leetcodeStats.username || derivedLeet,
            profileUrl: `https://leetcode.com/${derivedLeet}`,
            stats: {
              profile: {
                username: data.leetcodeStats.username || derivedLeet,
                totalSolved: data.leetcodeStats.totalSolved || 0,
                ranking: data.leetcodeStats.profile?.ranking ?? null,
                realName: data.leetcodeStats.profile?.realName || null,
                countryName: data.leetcodeStats.profile?.countryName || null,
                reputation: data.leetcodeStats.profile?.reputation ?? null,
                starRating: data.leetcodeStats.profile?.starRating ?? null,
                badges: data.leetcodeStats.profile?.badges || [],
              },
              problemStats: {
                easy: data.leetcodeStats.easy || 0,
                medium: data.leetcodeStats.medium || 0,
                hard: data.leetcodeStats.hard || 0,
                totalSolved: data.leetcodeStats.totalSolved || 0,
              },
              consistency: {
                streak: data.leetcodeStats.streak || 0,
                activeDays: data.leetcodeStats.activeDays || 0,
                last7Days: data.leetcodeStats.recentActivity?.last7Days || 0,
                last30Days: data.leetcodeStats.recentActivity?.last30Days || 0,
                bestDay: data.leetcodeStats.bestDay || null,
                calendar: data.leetcodeStats.calendar
                  ? (typeof data.leetcodeStats.calendar === 'object' && data.leetcodeStats.calendar.entries
                      ? Object.fromEntries(data.leetcodeStats.calendar.entries())
                      : data.leetcodeStats.calendar)
                  : {},
              },
              domains: data.leetcodeStats.topDomains || [],
              recentSubmissions: data.leetcodeStats.recentSubmissions || [],
            },
            fetchedAt: data.leetcodeStats.fetchedAt || new Date().toISOString(),
            autoLinked: true,
          });
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [navigate]);

  // Fetch LeetCode stats
  const fetchLeetCodeStats = useCallback(async () => {
    if (!leetUsername.trim()) {
      toast({
        title: "Username required",
        description: "Please enter your LeetCode username",
        variant: "destructive",
      });
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/student/login");
      return;
    }

    setLeetLoading(true);
    setLeetError(null);

    try {
      const stats = await platformApi.getLeetCodeStats(leetUsername.trim(), token);
      setLeetStats(stats);
      toast({
        title: "LeetCode stats fetched",
        description: `Found ${stats.stats.problemStats.totalSolved} problems solved!`,
      });
    } catch (error: any) {
      setLeetError(error?.message || "Failed to fetch LeetCode stats");
      toast({
        title: "Fetch failed",
        description: error?.message || "Could not fetch LeetCode stats",
        variant: "destructive",
      });
    } finally {
      setLeetLoading(false);
    }
  }, [leetUsername, navigate, toast]);

  // Fetch GitHub stats
  const fetchGitHubStats = useCallback(async () => {
    if (!githubUsername.trim()) {
      toast({
        title: "Username required",
        description: "Please enter your GitHub username",
        variant: "destructive",
      });
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/student/login");
      return;
    }

    setGithubLoading(true);
    setGithubError(null);

    try {
      const stats = await platformApi.getGitHubStats(githubUsername.trim(), token);
      setGithubStats(stats);
      toast({
        title: "GitHub stats fetched",
        description: `Found ${stats.stats.repos.total} repositories!`,
      });
    } catch (error: any) {
      setGithubError(error?.message || "Failed to fetch GitHub stats");
      toast({
        title: "Fetch failed",
        description: error?.message || "Could not fetch GitHub stats",
        variant: "destructive",
      });
    } finally {
      setGithubLoading(false);
    }
  }, [githubUsername, navigate, toast]);

  // LeetCode computed values
  const difficultyPieData = useMemo(() => {
    if (!leetStats?.stats?.problemStats) return [];
    const ps = leetStats.stats.problemStats;
    return [
      { name: "Easy", value: ps.easy ?? 0 },
      { name: "Medium", value: ps.medium ?? 0 },
      { name: "Hard", value: ps.hard ?? 0 },
    ];
  }, [leetStats]);

  const hasDifficultyData = useMemo(
    () => difficultyPieData.some((item) => Number(item.value) > 0),
    [difficultyPieData]
  );

  const topDomains = useMemo(() => {
    if (!Array.isArray(leetStats?.stats?.domains)) return [];
    return leetStats.stats.domains.slice(0, 5);
  }, [leetStats]);

  const recentSubmissions = useMemo(() => {
    if (!Array.isArray(leetStats?.stats?.recentSubmissions)) return [];
    return leetStats.stats.recentSubmissions.slice(0, 8);
  }, [leetStats]);

  // LeetCode Calendar Heatmap
  const { calendarWeeks, maxCalendarCount } = useMemo(() => {
    const calendar = leetStats?.stats?.consistency?.calendar;
    if (!calendar || typeof calendar !== 'object') {
      return { calendarWeeks: [] as any[], maxCalendarCount: 0 };
    }

    const dayMs = 24 * 60 * 60 * 1000;
    const calendarMap = new Map(
      Object.entries(calendar)
        .map(([epoch, val]) => {
          const date = new Date(Number(epoch) * 1000);
          if (Number.isNaN(date.getTime())) return null;
          return [date.toISOString().slice(0, 10), Number(val) || 0];
        })
        .filter(Boolean) as [string, number][]
    );

    if (calendarMap.size === 0) {
      return { calendarWeeks: [], maxCalendarCount: 0 };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setDate(today.getDate() - 364);
    start.setHours(0, 0, 0, 0);
    const startDay = start.getDay();
    start.setDate(start.getDate() - startDay);

    const totalDays = Math.ceil((today.getTime() - start.getTime()) / dayMs) + 1;
    const weeks: Array<Array<{ date: string | null; count: number }>> = [];
    let currentWeek: Array<{ date: string | null; count: number }> = [];
    let maxCountLocal = 0;

    for (let i = 0; i < totalDays; i += 1) {
      const current = new Date(start.getTime() + i * dayMs);
      const iso = current.toISOString().slice(0, 10);
      const count = calendarMap.get(iso) || 0;
      maxCountLocal = Math.max(maxCountLocal, count);
      currentWeek.push({ date: iso, count });
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    if (currentWeek.length) {
      while (currentWeek.length < 7) {
        currentWeek.push({ date: null, count: 0 });
      }
      weeks.push(currentWeek);
    }

    return { calendarWeeks: weeks, maxCalendarCount: maxCountLocal };
  }, [leetStats]);

  const getHeatmapClass = useCallback(
    (count: number) => {
      if (!count) return "bg-muted";
      if (!maxCalendarCount || maxCalendarCount <= 1) {
        return "bg-emerald-400/70";
      }
      const ratio = count / maxCalendarCount;
      if (ratio >= 0.75) return "bg-emerald-600";
      if (ratio >= 0.5) return "bg-emerald-500";
      if (ratio >= 0.25) return "bg-emerald-400";
      return "bg-emerald-300";
    },
    [maxCalendarCount]
  );

  // GitHub computed values
  const languageData = useMemo(() => {
    if (!githubStats?.stats?.languages) return [];
    return githubStats.stats.languages.slice(0, 6);
  }, [githubStats]);

  const weeklyActivityData = useMemo(() => {
    if (!githubStats?.stats?.consistency?.weeklyActivity) return [];
    return githubStats.stats.consistency.weeklyActivity.slice(-12);
  }, [githubStats]);

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-card border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            EvolvEd
          </h1>
          <nav className="flex gap-4 items-center">
            <Button variant="ghost" onClick={() => navigate('/student/dashboard')}>Dashboard</Button>
            <Button variant="ghost" onClick={() => navigate('/student/profile')}>Profile</Button>
            <Button variant="ghost" onClick={() => navigate('/student/progress')}>Progress</Button>
            <Button variant="ghost" onClick={() => navigate('/student/mock-interview')}>Mock Interview</Button>
            <Button variant="ghost" onClick={() => navigate('/student/resume')}>Resume</Button>
            <Button variant="ghost" onClick={() => navigate('/leaderboard')}>Leaderboard</Button>
            <Button variant="ghost" onClick={handleLogout}><LogOut className="w-4 h-4 mr-2" />Logout</Button>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Progress Analytics</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track your coding progress across multiple platforms
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="leetcode" className="flex items-center gap-2">
              <Code2 className="w-4 h-4" />
              LeetCode
            </TabsTrigger>
            <TabsTrigger value="github" className="flex items-center gap-2">
              <Github className="w-4 h-4" />
              GitHub
            </TabsTrigger>
          </TabsList>

          {/* LeetCode Tab */}
          <TabsContent value="leetcode" className="space-y-6 mt-6">
            {/* Username Input */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-orange-500" />
                  LeetCode Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Input
                    placeholder="Enter LeetCode username"
                    value={leetUsername}
                    onChange={(e) => setLeetUsername(e.target.value)}
                    className="max-w-xs"
                    onKeyDown={(e) => e.key === 'Enter' && fetchLeetCodeStats()}
                  />
                  <Button
                    onClick={fetchLeetCodeStats}
                    disabled={leetLoading || !leetUsername.trim()}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${leetLoading ? "animate-spin" : ""}`} />
                    {leetLoading ? "Fetching..." : "Get Stats"}
                  </Button>
                  {leetStats && (
                    <Button variant="outline" asChild>
                      <a
                        href={leetStats.profileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Profile
                      </a>
                    </Button>
                  )}
                </div>

                {leetStats && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Connected as <span className="font-mono">@{leetStats.username}</span>
                    <span className="text-xs">
                      · Last updated {new Date(leetStats.fetchedAt).toLocaleString()}
                    </span>
                  </div>
                )}

                {leetError && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <XCircle className="w-4 h-4" />
                    {leetError}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats Display */}
            {leetStats && (
              <>
                {/* Profile Details */}
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Profile Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Name</p>
                      <p className="font-medium">{leetStats.stats.profile.realName || leetStats.stats.profile.username}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Country</p>
                      <p className="font-medium">{leetStats.stats.profile.countryName || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Ranking</p>
                      <p className="font-medium">{leetStats.stats.profile.ranking ?? 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Reputation</p>
                      <p className="font-medium">{leetStats.stats.profile.reputation ?? 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Star Rating</p>
                      <p className="font-medium">{leetStats.stats.profile.starRating ?? 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Badges</p>
                      {leetStats.stats.profile.badges?.length ? (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {leetStats.stats.profile.badges.slice(0, 6).map((badge) => (
                            <span key={badge} className="px-2 py-0.5 rounded-full bg-muted text-[11px]">
                              {badge}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="font-medium">None</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Summary Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  <Card className="shadow-sm">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Trophy className="w-4 h-4" />
                        Total Solved
                      </div>
                      <div className="text-2xl font-bold mt-1">
                        {leetStats.stats.problemStats.totalSolved}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="shadow-sm">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Flame className="w-4 h-4" />
                        Streak
                      </div>
                      <div className="text-2xl font-bold mt-1">
                        {leetStats.stats.consistency.streak} days
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="shadow-sm">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <TrendingUp className="w-4 h-4" />
                        Last 7 Days
                      </div>
                      <div className="text-2xl font-bold mt-1">
                        {leetStats.stats.consistency.last7Days}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="shadow-sm">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Calendar className="w-4 h-4" />
                        Last 30 Days
                      </div>
                      <div className="text-2xl font-bold mt-1">
                        {leetStats.stats.consistency.last30Days}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="shadow-sm">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Calendar className="w-4 h-4" />
                        Active Days
                      </div>
                      <div className="text-2xl font-bold mt-1">
                        {leetStats.stats.consistency.activeDays}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="shadow-sm">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Trophy className="w-4 h-4" />
                        Best Day
                      </div>
                      <div className="text-2xl font-bold mt-1">
                        {leetStats.stats.consistency.bestDay?.count || 0}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Difficulty & Domains Row */}
                <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
                  {/* Difficulty Mix */}
                  <Card className="shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-base">Difficulty Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {hasDifficultyData ? (
                        <div className="flex items-center gap-8">
                          <ResponsiveContainer width="50%" height={200}>
                            <PieChart>
                              <Pie
                                data={difficultyPieData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius={45}
                                outerRadius={80}
                                paddingAngle={4}
                              >
                                {difficultyPieData.map((entry, index) => (
                                  <Cell
                                    key={entry.name}
                                    fill={PIE_COLORS[index % PIE_COLORS.length]}
                                  />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="space-y-4">
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                              <span className="text-sm">Easy</span>
                              <span className="font-bold">{leetStats.stats.problemStats.easy}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 rounded-full bg-green-500"></div>
                              <span className="text-sm">Medium</span>
                              <span className="font-bold">{leetStats.stats.problemStats.medium}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 rounded-full bg-sky-500"></div>
                              <span className="text-sm">Hard</span>
                              <span className="font-bold">{leetStats.stats.problemStats.hard}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Solve some problems to see the breakdown
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Top Domains */}
                  <Card className="shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-base">Top Domains</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {topDomains.length > 0 ? (
                        <ul className="space-y-2">
                          {topDomains.map((domain, idx) => (
                            <li
                              key={domain.tag}
                              className="flex items-center justify-between gap-3 rounded-md bg-muted/60 px-3 py-2"
                            >
                              <span className="text-sm font-medium">
                                {idx + 1}. {domain.tag}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {domain.count}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No domain data available yet
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Problems Solved */}
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <GitPullRequest className="w-4 h-4" />
                      Recent Problems Solved
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">Last {recentSubmissions.length || 0} accepted submissions</p>
                  </CardHeader>
                  <CardContent>
                    {recentSubmissions.length > 0 ? (
                      <div className="space-y-3">
                        {recentSubmissions.map((submission) => (
                          <div
                            key={`${submission.titleSlug}-${submission.timestamp}`}
                            className="flex flex-col gap-1 rounded-md border border-border/70 px-3 py-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              {submission.titleSlug ? (
                                <a
                                  href={`https://leetcode.com/problems/${submission.titleSlug}/`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="font-medium hover:underline"
                                >
                                  {submission.title}
                                </a>
                              ) : (
                                <span className="font-medium">{submission.title}</span>
                              )}
                              <span className="text-xs font-semibold text-emerald-600">
                                {submission.status}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <CircleDot className="w-3 h-3" />
                                {submission.difficulty || 'Unknown'}</span>
                              <span>{submission.lang || 'Language N/A'}</span>
                              <span>
                                {submission.submittedAt
                                  ? new Date(submission.submittedAt).toLocaleString()
                                  : '—'}
                              </span>
                            </div>
                            {submission.tags?.length ? (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {submission.tags.slice(0, 4).map((tag) => (
                                  <span
                                    key={`${submission.titleSlug}-${tag.slug || tag.name}`}
                                    className="px-2 py-0.5 rounded-full bg-muted text-[11px]"
                                  >
                                    {tag.name}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No recent accepted submissions yet.
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Submission Calendar */}
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">Submission Calendar</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Last 52 weeks of activity
                    </p>
                  </CardHeader>
                  <CardContent>
                    {calendarWeeks.length > 0 ? (
                      <div className="space-y-4">
                        <div className="flex gap-3">
                          <div className="flex flex-col justify-between py-1 text-[10px] leading-none text-muted-foreground">
                            <span>Mon</span>
                            <span>Wed</span>
                            <span>Fri</span>
                          </div>
                          <div className="overflow-x-auto">
                            <div className="flex gap-[3px] pr-4">
                              {calendarWeeks.map((week, weekIndex) => (
                                <div key={`week-${weekIndex}`} className="flex flex-col gap-[3px]">
                                  {week.map((day, dayIndex) => {
                                    if (!day?.date) {
                                      return (
                                        <div
                                          key={`empty-${weekIndex}-${dayIndex}`}
                                          className="w-3 h-3 rounded-sm bg-transparent"
                                        />
                                      );
                                    }
                                    return (
                                      <div
                                        key={`${day.date}-${dayIndex}`}
                                        title={`${day.date}: ${day.count} submissions`}
                                        className={`w-3 h-3 rounded-sm ${getHeatmapClass(day.count)}`}
                                      />
                                    );
                                  })}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span>Less</span>
                          <div className="flex gap-1">
                            <div className="w-3 h-3 rounded-sm bg-muted" />
                            <div className="w-3 h-3 rounded-sm bg-emerald-300" />
                            <div className="w-3 h-3 rounded-sm bg-emerald-400" />
                            <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                            <div className="w-3 h-3 rounded-sm bg-emerald-600" />
                          </div>
                          <span>More</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No submission history available
                      </p>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            {!leetStats && !leetLoading && (
              <Card className="shadow-sm">
                <CardContent className="py-12 text-center">
                  <Code2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Connect Your LeetCode Profile</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Enter your LeetCode username above to view your problem-solving statistics,
                    difficulty breakdown, and submission history.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* GitHub Tab */}
          <TabsContent value="github" className="space-y-6 mt-6">
            {/* Username Input */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Github className="w-5 h-5" />
                  GitHub Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Input
                    placeholder="Enter GitHub username"
                    value={githubUsername}
                    onChange={(e) => setGithubUsername(e.target.value)}
                    className="max-w-xs"
                    onKeyDown={(e) => e.key === 'Enter' && fetchGitHubStats()}
                  />
                  <Button
                    onClick={fetchGitHubStats}
                    disabled={githubLoading || !githubUsername.trim()}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${githubLoading ? "animate-spin" : ""}`} />
                    {githubLoading ? "Fetching..." : "Get Stats"}
                  </Button>
                  {githubStats && (
                    <Button variant="outline" asChild>
                      <a
                        href={githubStats.profileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Profile
                      </a>
                    </Button>
                  )}
                </div>

                {githubStats && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Connected as <span className="font-mono">@{githubStats.username}</span>
                    <span className="text-xs">
                      · Last updated {new Date(githubStats.fetchedAt).toLocaleString()}
                    </span>
                  </div>
                )}

                {githubError && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <XCircle className="w-4 h-4" />
                    {githubError}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats Display */}
            {githubStats && (
              <>
                {/* Profile Overview */}
                <Card className="shadow-sm">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-6">
                      {githubStats.stats.profile.avatar && (
                        <img
                          src={githubStats.stats.profile.avatar}
                          alt={githubStats.stats.profile.username}
                          className="w-20 h-20 rounded-full"
                        />
                      )}
                      <div className="flex-1 space-y-2">
                        <div>
                          <h3 className="text-xl font-bold">
                            {githubStats.stats.profile.name || githubStats.stats.profile.username}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            @{githubStats.stats.profile.username}
                          </p>
                        </div>
                        {githubStats.stats.profile.bio && (
                          <p className="text-sm">{githubStats.stats.profile.bio}</p>
                        )}
                        <div className="flex flex-wrap gap-4 text-sm">
                          {githubStats.stats.profile.company && (
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {githubStats.stats.profile.company}
                            </span>
                          )}
                          {githubStats.stats.profile.location && (
                            <span>{githubStats.stats.profile.location}</span>
                          )}
                          <span>{githubStats.stats.profile.accountAge}</span>
                        </div>
                        <div className="flex gap-6 text-sm">
                          <span>
                            <strong>{githubStats.stats.profile.followers}</strong> followers
                          </span>
                          <span>
                            <strong>{githubStats.stats.profile.following}</strong> following
                          </span>
                          <span>
                            <strong>{githubStats.stats.profile.publicRepos}</strong> repos
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Summary Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  <Card className="shadow-sm">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <FolderGit2 className="w-4 h-4" />
                        Repositories
                      </div>
                      <div className="text-2xl font-bold mt-1">
                        {githubStats.stats.repos.total}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="shadow-sm">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Star className="w-4 h-4" />
                        Total Stars
                      </div>
                      <div className="text-2xl font-bold mt-1">
                        {githubStats.stats.repos.totalStars}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="shadow-sm">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <GitFork className="w-4 h-4" />
                        Total Forks
                      </div>
                      <div className="text-2xl font-bold mt-1">
                        {githubStats.stats.repos.totalForks}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="shadow-sm">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Flame className="w-4 h-4" />
                        Current Streak
                      </div>
                      <div className="text-2xl font-bold mt-1">
                        {githubStats.stats.consistency.currentStreak}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="shadow-sm">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <GitPullRequest className="w-4 h-4" />
                        PRs Merged
                      </div>
                      <div className="text-2xl font-bold mt-1">
                        {githubStats.stats.openSource.pullRequestsMerged}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="shadow-sm">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <CircleDot className="w-4 h-4" />
                        Issues Closed
                      </div>
                      <div className="text-2xl font-bold mt-1">
                        {githubStats.stats.openSource.issuesClosed}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Repositories List */}
                <div className="grid gap-4">{/* Removed language breakdown chart */}

                  {/* All Repositories */}
                  <Card className="shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-base">All Repositories</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {githubStats.stats.repos.topRepos.length > 0 ? (
                        <div className="max-h-[300px] overflow-y-auto space-y-2">
                          {githubStats.stats.repos.topRepos.map((repo, index) => (
                            <div
                              key={`${repo.name}-${index}`}
                              className="flex items-center justify-between rounded-md border bg-card px-3 py-2"
                            >
                              <a
                                href={repo.url}
                                target="_blank"
                                rel="noreferrer"
                                className="font-medium text-sm hover:underline flex-1"
                              >
                                {repo.name}
                              </a>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Star className="w-3 h-3" />
                                  {repo.stars}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No repositories found
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Commits */}
                {githubStats.stats.consistency.recentCommits &&
                 githubStats.stats.consistency.recentCommits.length > 0 && (
                  <Card className="shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-base">Recent Commits</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {githubStats.stats.consistency.recentCommits.slice(0, 15).map((commit: any, idx: number) => (
                          <div key={idx} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex-shrink-0 w-2 h-2 mt-2 bg-green-500 rounded-full"></div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium text-blue-600">{commit.repo}</span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(commit.date).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-foreground truncate">{commit.message}</p>
                            </div>
                            <a
                              href={commit.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-shrink-0 text-xs text-blue-600 hover:underline"
                            >
                              View
                            </a>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {!githubStats && !githubLoading && (
              <Card className="shadow-sm">
                <CardContent className="py-12 text-center">
                  <Github className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Connect Your GitHub Profile</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Enter your GitHub username above to view your repository statistics,
                    tech stack, contribution history, and open source activity.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Progress;
