import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { studentApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { StudentNavbar } from "@/components/StudentNavbar";
import { Link2, RefreshCw, CheckCircle, XCircle, LogOut } from "lucide-react";
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
    const segments = url.pathname
      .split("/")
      .map((segment) => segment.trim())
      .filter(Boolean);

    if (segments.length === 0) return "";
    if (segments[0].toLowerCase() === "u" || segments[0].toLowerCase() === "profile") {
      return segments[1]?.replace(/[^a-zA-Z0-9_-]/g, "") || "";
    }

    return segments[0]?.replace(/[^a-zA-Z0-9_-]/g, "") || "";
  } catch (error) {
    return trimmed.replace(/[^a-zA-Z0-9_-]/g, "");
  }
};

const extractHackerRankUsername = (rawValue?: string | null) => {
  if (!rawValue) return "";
  const trimmed = String(rawValue).trim();
  if (!trimmed) return "";

  if (!trimmed.toLowerCase().includes("hackerrank.com")) {
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
    if (segments[0].toLowerCase() === "profile") {
      return segments[1]?.replace(/[^a-zA-Z0-9_-]/g, "") || "";
    }

    return segments[0]?.replace(/[^a-zA-Z0-9_-]/g, "") || "";
  } catch (error) {
    return trimmed.replace(/[^a-zA-Z0-9_-]/g, "");
  }
};

const Progress = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verifyingHR, setVerifyingHR] = useState(false);
  const [autoSyncAttempted, setAutoSyncAttempted] = useState(false);


  const leetStats = student?.leetcodeStats;
  const hackerStats = student?.hackerrankStats;
  const derivedLeetUsername = useMemo(
    () => extractLeetCodeUsername(student?.codingProfiles?.leetcode || student?.leetcodeUrl),
    [student?.codingProfiles?.leetcode, student?.leetcodeUrl]
  );
  const derivedHRUsername = useMemo(
    () => extractHackerRankUsername(student?.codingProfiles?.hackerrank || student?.hackerrankUrl),
    [student?.codingProfiles?.hackerrank, student?.hackerrankUrl]
  );
  const isLeetConnected = Boolean(leetStats);
  const isHRConnected = Boolean(hackerStats);

  const difficultyPieData = useMemo(() => {
    if (!leetStats) return [];
    return [
      { name: "Easy", value: leetStats.easy ?? 0 },
      { name: "Medium", value: leetStats.medium ?? 0 },
      { name: "Hard", value: leetStats.hard ?? 0 },
    ];
  }, [leetStats?.easy, leetStats?.medium, leetStats?.hard]);

  const hasDifficultyData = useMemo(
    () => difficultyPieData.some((item) => Number(item.value) > 0),
    [difficultyPieData]
  );

  const topDomains = useMemo(() => {
    if (!Array.isArray(leetStats?.topDomains)) return [];
    return leetStats.topDomains
      .filter((item: any) => item && typeof item.tag === "string")
      .slice(0, 5);
  }, [leetStats?.topDomains]);

  const calendarSeries = useMemo(() => {
    if (!leetStats?.calendar) return [];
    return Object.entries(leetStats.calendar)
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
  }, [leetStats?.calendar]);

  const { calendarWeeks, maxCalendarCount } = useMemo(() => {
    if (!leetStats?.calendar) {
      return { calendarWeeks: [] as any[], maxCalendarCount: 0 };
    }

    const dayMs = 24 * 60 * 60 * 1000;
    const calendarMap = new Map(
      Object.entries(leetStats.calendar)
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
  }, [leetStats?.calendar]);

  const weeklyAreaSeries = useMemo(() => {
    if (calendarSeries.length === 0) return [];
    const weeklyMap = new Map<string, number>();

    calendarSeries.forEach((entry: any) => {
      const entryDate = new Date(entry.date as string);
      if (Number.isNaN(entryDate.getTime())) return;
      const weekStart = new Date(entryDate);
      const weekDay = weekStart.getDay();
      weekStart.setDate(weekStart.getDate() - weekDay);
      const key = weekStart.toISOString().slice(0, 10);
      weeklyMap.set(key, (weeklyMap.get(key) || 0) + (entry.count as number));
    });

    return Array.from(weeklyMap.entries())
      .map(([week, total]) => ({ week, total }))
      .sort((a, b) => a.week.localeCompare(b.week));
  }, [calendarSeries]);

  const leetSummaryMetrics = useMemo(() => {
    if (!leetStats) return [];

    const formatBestDay = () => {
      if (!leetStats.bestDay?.date) return "—";
      const parsed = new Date(leetStats.bestDay.date);
      if (Number.isNaN(parsed.getTime())) {
        return `${leetStats.bestDay.count} submissions`;
      }
      return `${leetStats.bestDay.count} on ${parsed.toLocaleDateString()}`;
    };

    return [
      { label: "Total Solved", value: leetStats.totalSolved ?? 0 },
      { label: "Last 7 Days", value: leetStats.recentActivity?.last7Days ?? 0 },
      { label: "Last 30 Days", value: leetStats.recentActivity?.last30Days ?? 0 },
      { label: "Active Days", value: leetStats.activeDays ?? 0 },
      { label: "Current Streak", value: leetStats.streak ?? 0 },
      { label: "Best Day", value: formatBestDay() },
    ];
  }, [leetStats]);

  const hackerBestDayLabel = useMemo(() => {
    if (!hackerStats?.bestDay?.date) return "—";
    const parsed = new Date(hackerStats.bestDay.date);
    if (Number.isNaN(parsed.getTime())) return `${hackerStats.bestDay.count} submissions`;
    return `${hackerStats.bestDay.count} on ${parsed.toLocaleDateString()}`;
  }, [hackerStats?.bestDay]);

  const lastUpdated = useMemo(() => {
    if (!leetStats?.fetchedAt) return null;
    const parsed = new Date(leetStats.fetchedAt);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toLocaleString();
  }, [leetStats?.fetchedAt]);

  const hackerSummaryMetrics = useMemo(() => {
    if (!hackerStats) return [];

    return [
      { label: "Total Solved", value: hackerStats.totalSolved ?? 0 },
      { label: "Stars", value: hackerStats.stars ?? 0 },
      { label: "Badges", value: hackerStats.badges?.length ?? 0 },
      { label: "Last 7 Days", value: hackerStats.recentActivity?.last7Days ?? 0 },
      { label: "Last 30 Days", value: hackerStats.recentActivity?.last30Days ?? 0 },
      { label: "Active Days", value: hackerStats.activeDays ?? 0 },
    ];
  }, [hackerStats]);

  const lastUpdatedHR = useMemo(() => {
    if (!hackerStats?.fetchedAt) return null;
    const parsed = new Date(hackerStats.fetchedAt);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toLocaleString();
  }, [hackerStats?.fetchedAt]);

  const topSkills = useMemo(() => {
    if (!Array.isArray(hackerStats?.skills)) return [];
    return hackerStats.skills.slice(0, 5);
  }, [hackerStats?.skills]);

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

  const heatmapLegend = useMemo(() => {
    const highest = maxCalendarCount || 10;
    return [
      { label: "0", className: "bg-muted" },
      { label: "1+", className: "bg-emerald-300" },
      { label: "25%", className: "bg-emerald-400" },
      { label: "50%", className: "bg-emerald-500" },
      { label: `${highest}+`, className: "bg-emerald-600" },
    ];
  }, [maxCalendarCount]);

  // HackerRank heatmap support
  const hackerCalendar = useMemo(() => {
    if (!hackerStats?.calendar) return [] as any[];
    return Object.entries(hackerStats.calendar)
      .map(([epoch, count]) => {
        const date = new Date(Number(epoch) * 1000);
        if (Number.isNaN(date.getTime())) return null;
        return { date: date.toISOString().slice(0, 10), count: Number(count) || 0 };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => (a.date as string).localeCompare(b.date as string));
  }, [hackerStats?.calendar]);

  const hackerWeeklySeries = useMemo(() => {
    if (hackerCalendar.length === 0) return [];
    const weeklyMap = new Map<string, number>();

    hackerCalendar.forEach((entry: any) => {
      const entryDate = new Date(entry.date as string);
      if (Number.isNaN(entryDate.getTime())) return;
      const weekStart = new Date(entryDate);
      const weekDay = weekStart.getDay();
      weekStart.setDate(weekStart.getDate() - weekDay);
      const key = weekStart.toISOString().slice(0, 10);
      weeklyMap.set(key, (weeklyMap.get(key) || 0) + (entry.count as number));
    });

    return Array.from(weeklyMap.entries())
      .map(([week, total]) => ({ week, total }))
      .sort((a, b) => a.week.localeCompare(b.week));
  }, [hackerCalendar]);

  const { hackerCalendarWeeks, hackerMaxCount } = useMemo(() => {
    if (!hackerStats?.calendar) return { hackerCalendarWeeks: [] as any[], hackerMaxCount: 0 };

    const dayMs = 24 * 60 * 60 * 1000;
    const calendarMap = new Map(
      Object.entries(hackerStats.calendar)
        .map(([epoch, val]) => {
          const date = new Date(Number(epoch) * 1000);
          if (Number.isNaN(date.getTime())) return null;
          return [date.toISOString().slice(0, 10), Number(val) || 0];
        })
        .filter(Boolean) as [string, number][]
    );

    if (calendarMap.size === 0) return { hackerCalendarWeeks: [], hackerMaxCount: 0 };

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

    return { hackerCalendarWeeks: weeks, hackerMaxCount: maxCountLocal };
  }, [hackerStats?.calendar]);

  const leetCodingLogs = useMemo(() => {
    if (!Array.isArray(student?.codingLogs)) return [];
    return student.codingLogs.filter((log: any) =>
      (log.platform || "").toLowerCase().includes("leetcode")
    );
  }, [student?.codingLogs]);

  const leetRecentSessions = useMemo(() => {
    if (leetCodingLogs.length === 0) return [];
    return leetCodingLogs
      .slice()
      .sort((a: any, b: any) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
      .slice(0, 5);
  }, [leetCodingLogs]);


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
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [navigate]);

  const refreshLeetCodeStats = useCallback(
    async (options?: { silent?: boolean }) => {
      const username = derivedLeetUsername;
      if (!username) {
        if (!options?.silent) {
          toast({
            title: "LeetCode link missing",
            description: "Add your LeetCode profile link from the Profile page to enable analytics.",
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
        setVerifying(true);
      }

      try {
        await studentApi.verifyLeetCode(username, token);
        const refreshed = await studentApi.getProfile(token);
        setStudent(refreshed);
        if (!options?.silent) {
          toast({
            title: "LeetCode stats updated",
            description: `Fetched the latest submissions for ${username}.`,
          });
        }
      } catch (error: any) {
        if (!options?.silent) {
          toast({
            title: "Refresh failed",
            description: error?.message || "Could not refresh LeetCode stats",
            variant: "destructive",
          });
        }
      } finally {
        if (!options?.silent) {
          setVerifying(false);
        }
      }
    },
    [derivedLeetUsername, navigate, toast]
  );

  const refreshHackerRankStats = useCallback(
    async (options?: { silent?: boolean }) => {
      const username = derivedHRUsername;
      if (!username) {
        if (!options?.silent) {
          toast({
            title: "HackerRank link missing",
            description: "Add your HackerRank profile link from the Profile page to enable analytics.",
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
        setVerifyingHR(true);
      }

      try {
        await studentApi.verifyHackerRank(username, token);
        const refreshed = await studentApi.getProfile(token);
        setStudent(refreshed);
        if (!options?.silent) {
          toast({
            title: "HackerRank stats updated",
            description: `Fetched the latest data for ${username}.`,
          });
        }
      } catch (error: any) {
        if (!options?.silent) {
          toast({
            title: "Refresh failed",
            description: error?.message || "Could not refresh HackerRank stats",
            variant: "destructive",
          });
        }
      } finally {
        if (!options?.silent) {
          setVerifyingHR(false);
        }
      }
    },
    [derivedHRUsername, navigate, toast]
  );

  useEffect(() => {
    if (!student || autoSyncAttempted) return;
    if (derivedLeetUsername && !student.leetcodeStats) {
      refreshLeetCodeStats({ silent: true });
    }
    if (derivedHRUsername && !student.hackerrankStats) {
      refreshHackerRankStats({ silent: true });
    }
    setAutoSyncAttempted(true);
  }, [
    student,
    derivedLeetUsername,
    derivedHRUsername,
    autoSyncAttempted,
    refreshLeetCodeStats,
    refreshHackerRankStats,
  ]);

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <StudentNavbar />

      <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Progress Analytics</h2>
            <p className="text-sm text-muted-foreground">
              Track your LeetCode progress and discover areas to improve.
            </p>
          </div>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Progress Sources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border border-border/60 bg-muted/60 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-primary" />
                <span className="font-semibold">LeetCode Profile</span>
                {isLeetConnected ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : derivedLeetUsername ? (
                  <XCircle className="w-4 h-4 text-amber-500" />
                ) : null}
              </div>

              {derivedLeetUsername ? (
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="font-mono">@{derivedLeetUsername}</span>
                  <Button variant="link" size="sm" className="px-0" asChild>
                    <a
                      href={`https://leetcode.com/${derivedLeetUsername}/`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open profile
                    </a>
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Add your LeetCode profile link under Profile → Coding Profiles to unlock automatic stats.
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={() => refreshLeetCodeStats()}
                  disabled={verifying || !derivedLeetUsername}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${verifying ? "animate-spin" : ""}`} />
                  {verifying ? "Refreshing..." : "Refresh stats"}
                </Button>
                {lastUpdated && (
                  <span className="text-xs text-muted-foreground">Last refreshed {lastUpdated}</span>
                )}
              </div>

              {isLeetConnected && (
                <p className="text-xs text-muted-foreground">
                  We reuse your saved profile link, so you never have to re-enter your LeetCode username here.
                </p>
              )}
            </div>

            <div className="rounded-lg border border-border/60 bg-muted/60 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-primary" />
                <span className="font-semibold">HackerRank Profile</span>
                {isHRConnected ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : derivedHRUsername ? (
                  <XCircle className="w-4 h-4 text-amber-500" />
                ) : null}
              </div>

              {derivedHRUsername ? (
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="font-mono">@{derivedHRUsername}</span>
                  <Button variant="link" size="sm" className="px-0" asChild>
                    <a
                      href={`https://www.hackerrank.com/${derivedHRUsername}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open profile
                    </a>
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Add your HackerRank profile link under Profile → Coding Profiles to unlock analytics.
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={() => refreshHackerRankStats()}
                  disabled={verifyingHR || !derivedHRUsername}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${verifyingHR ? "animate-spin" : ""}`} />
                  {verifyingHR ? "Refreshing..." : "Refresh stats"}
                </Button>
                {lastUpdatedHR && (
                  <span className="text-xs text-muted-foreground">Last refreshed {lastUpdatedHR}</span>
                )}
              </div>

              {isHRConnected && (
                <p className="text-xs text-muted-foreground">
                  We reuse your saved profile link, so you never have to re-enter your HackerRank username here.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">LeetCode Snapshot</CardTitle>
              </CardHeader>
              <CardContent>
                {isLeetConnected ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {leetSummaryMetrics.map((metric) => (
                      <div
                        key={metric.label}
                        className="rounded-lg border bg-card px-4 py-3 shadow-sm"
                      >
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">
                          {metric.label}
                        </div>
                        <div className="mt-1 text-lg font-semibold">
                          {typeof metric.value === "number"
                            ? metric.value.toLocaleString()
                            : metric.value}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Refresh your LeetCode stats to see recent progress.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Difficulty Mix</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                {hasDifficultyData ? (
                  <ResponsiveContainer width="100%" height={220}>
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
                        isAnimationActive
                        animationDuration={900}
                      >
                        {difficultyPieData.map((entry, index) => (
                          <Cell
                            key={entry.name}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, name) => [
                          `${Number(value).toLocaleString()} problems`,
                          name,
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center w-full">
                    Solve a few problems to unlock the difficulty breakdown.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">HackerRank Snapshot</CardTitle>
              </CardHeader>
              <CardContent>
                {isHRConnected ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {hackerSummaryMetrics.map((metric) => (
                      <div
                        key={metric.label}
                        className="rounded-lg border bg-card px-4 py-3 shadow-sm"
                      >
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">
                          {metric.label}
                        </div>
                        <div className="mt-1 text-lg font-semibold">
                          {typeof metric.value === "number"
                            ? metric.value.toLocaleString()
                            : metric.value}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Refresh your HackerRank stats to see recent progress.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">HackerRank Skills</CardTitle>
              </CardHeader>
              <CardContent>
                {topSkills.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Your skill ratings will appear here once HackerRank stats are synced.
                  </p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {topSkills.map((skill: any, idx: number) => (
                      <li
                        key={skill.name || idx}
                        className="flex items-center justify-between gap-3 rounded-md bg-muted/60 px-3 py-2"
                      >
                        <span className="font-medium">
                          {idx + 1}. {skill.name}
                        </span>
                        <span className="text-muted-foreground">
                          {skill.score ?? 0} {skill.level ? `· ${skill.level}` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">HackerRank Badges</CardTitle>
              </CardHeader>
              <CardContent>
                {isHRConnected && hackerStats?.badges?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {hackerStats.badges.map((badge: string, idx: number) => (
                      <span
                        key={badge || idx}
                        className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 text-xs font-medium"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No badges yet.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Top 5 Problem Domains</CardTitle>
            </CardHeader>
            <CardContent>
              {topDomains.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Your domain strengths will appear here once LeetCode stats are synced.
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-[3fr_2fr]">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={topDomains}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="tag"
                        tick={{ fontSize: 11 }}
                        interval={0}
                        angle={-15}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis allowDecimals={false} width={32} />
                      <Tooltip formatter={(value: number) => [`${value} solved`, "Solved"]} />
                      <Bar dataKey="count" fill="#22c55e" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <ul className="space-y-2 text-sm">
                    {topDomains.map((domain: any, idx: number) => (
                      <li
                        key={domain.tag}
                        className="flex items-center justify-between gap-3 rounded-md bg-muted/60 px-3 py-2"
                      >
                        <span className="font-medium">
                          {idx + 1}. {domain.tag}
                        </span>
                        <span className="text-muted-foreground">
                          {domain.count} problems
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">HackerRank Submission Calendar</CardTitle>
              <p className="text-xs text-muted-foreground">
                Last 52 weeks of HackerRank activity
              </p>
            </CardHeader>
            <CardContent>
              {hackerCalendarWeeks.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No submission history available yet.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex flex-col justify-between py-1 text-[10px] leading-none text-muted-foreground">
                      <span>Mon</span>
                      <span>Wed</span>
                      <span>Fri</span>
                    </div>
                    <div className="overflow-x-auto">
                      <div className="flex gap-[3px] pr-4">
                        {hackerCalendarWeeks.map((week, weekIndex) => (
                          <div key={`hr-week-${weekIndex}`} className="flex flex-col gap-[3px]">
                            {week.map((day, dayIndex) => {
                              if (!day?.date) {
                                return (
                                  <div
                                    key={`hr-empty-${weekIndex}-${dayIndex}`}
                                    className="w-3 h-3 rounded-sm bg-transparent"
                                  />
                                );
                              }
                              const label = `${day.date}: ${day.count} submission${day.count === 1 ? "" : "s"}`;
                              return (
                                <div
                                  key={`hr-${day.date}-${dayIndex}`}
                                  title={label}
                                  className={`w-3 h-3 rounded-sm transition-colors duration-200 ${
                                    day.count
                                      ? day.count / (hackerMaxCount || 1) >= 0.75
                                        ? "bg-emerald-600"
                                        : day.count / (hackerMaxCount || 1) >= 0.5
                                        ? "bg-emerald-500"
                                        : day.count / (hackerMaxCount || 1) >= 0.25
                                        ? "bg-emerald-400"
                                        : "bg-emerald-300"
                                      : "bg-muted"
                                  }`}
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
              )}
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">HackerRank Weekly Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {hackerWeeklySeries.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  Not enough data yet to plot a weekly trend.
                </div>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={hackerWeeklySeries}>
                      <defs>
                        <linearGradient id="hrWeeklyGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                      <XAxis
                        dataKey="week"
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          if (Number.isNaN(date.getTime())) return value;
                          return date.toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          });
                        }}
                        minTickGap={16}
                      />
                      <YAxis allowDecimals={false} />
                      <Tooltip formatter={(value: number) => [`${value} solved`, "Solved"]} />
                      <Area
                        type="monotone"
                        dataKey="total"
                        stroke="#0284c7"
                        fill="url(#hrWeeklyGradient)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Submission Calendar</CardTitle>
              <p className="text-xs text-muted-foreground">
                Last 52 weeks of LeetCode activity
              </p>
            </CardHeader>
            <CardContent>
              {calendarWeeks.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No submission history available yet.
                </div>
              ) : (
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
                              const label = `${day.date}: ${day.count} submission${day.count === 1 ? "" : "s"
                                }`;
                              return (
                                <div
                                  key={`${day.date}-${dayIndex}`}
                                  title={label}
                                  className={`w-3 h-3 rounded-sm transition-colors duration-200 ${getHeatmapClass(
                                    day.count
                                  )}`}
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
                      {heatmapLegend.map((item) => (
                        <div key={item.label} className={`w-3 h-3 rounded-sm ${item.className}`} />
                      ))}
                    </div>
                    <span>More</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Weekly Submission Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {weeklyAreaSeries.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  Not enough data yet to plot a weekly trend.
                </div>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklyAreaSeries}>
                      <defs>
                        <linearGradient id="leetcodeWeeklyGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                      <XAxis
                        dataKey="week"
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          if (Number.isNaN(date.getTime())) return value;
                          return date.toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          });
                        }}
                        minTickGap={16}
                      />
                      <YAxis allowDecimals={false} />
                      <Tooltip formatter={(value: number) => [`${value} solved`, "Solved"]} />
                      <Area
                        type="monotone"
                        dataKey="total"
                        stroke="#16a34a"
                        fill="url(#leetcodeWeeklyGradient)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Recent LeetCode Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {leetRecentSessions.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  We&apos;ll show imported LeetCode practice sessions here after your next sync.
                </div>
              ) : (
                <ul className="space-y-3">
                  {leetRecentSessions.map((session: any, index: number) => {
                    const date = session.date ? new Date(session.date) : null;
                    const key = session._id || `${session.platform}-${index}`;
                    return (
                      <li
                        key={key}
                        className="flex items-center justify-between gap-3 rounded-md border bg-card px-3 py-2 shadow-sm"
                      >
                        <div>
                          <div className="text-sm font-medium">
                            {session.activity || "Practice Session"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {date && !Number.isNaN(date.getTime())
                              ? date.toLocaleDateString()
                              : "Unknown date"}
                            {" · "}
                            {(Number(session.problemsSolved) || 0).toLocaleString()} problems
                            {" · "}
                            {(Number(session.minutesSpent) || 0).toLocaleString()} mins
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Progress;


