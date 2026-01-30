import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, Medal, Star, Share2, LogOut } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { StudentNavbar } from "@/components/StudentNavbar";
import { studentApi } from "@/lib/api";

type LeaderboardEntry = {
  id: string;
  rank: number;
  name: string;
  college: string;
  score: number;
  streak: number;
  projects: number;
  totalSolved: number;
  badges: string[];
  achievements: string;
  avatarUrl?: string;
  platformStats?: {
    leetcode: { totalSolved: number; recent30: number };
    hackerrank: { totalSolved: number; recent30: number };
    github: { totalCommits: number; recent30: number };
  };
};

const Leaderboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();


  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<LeaderboardEntry | null>(null);
  const [currentStudentId, setCurrentStudentId] = useState<string | null>(null);
  const [currentStudentMeta, setCurrentStudentMeta] = useState<{
    name?: string;
    college?: string;
    readinessScore?: number;
  } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("studentData");
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      const id = parsed?._id || parsed?.id;
      if (id) {
        setCurrentStudentId(String(id));
      }
      setCurrentStudentMeta({
        name: parsed?.name,
        college: parsed?.college,
        readinessScore: typeof parsed?.readinessScore === "number" ? parsed.readinessScore : undefined,
      });
    } catch (err) {
      console.warn("Failed to read stored student data", err);
    }
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        // Refresh student data
        const updatedData = await studentApi.getProfile(token);
        setStudentProfile(updatedData);
        localStorage.setItem('studentData', JSON.stringify(updatedData));
      } catch (err) {
        console.warn("Failed to fetch student profile", err);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const resp = await studentApi.getLeaderboard(50);
        const normalized = ((resp as { leaderboard?: unknown })?.leaderboard as any[] | undefined)?.map(
          (entry: any, index: number): LeaderboardEntry => ({
            id: String(entry?.id ?? entry?._id ?? entry?.rank ?? `leader-${index}`),
            rank: Number(entry?.rank) || 0,
            name: String(entry?.name || "Anonymous"),
            college: String(entry?.college || ""),
            score: Number(entry?.score) || 0,
            streak: Number(entry?.streak) || 0,
            projects: Number(entry?.projects) || 0,
            totalSolved: Number(entry?.totalSolved) || 0,
            badges: Array.isArray(entry?.badges)
              ? entry.badges.map((badge: unknown) => String(badge)).filter(Boolean)
              : [],
            achievements: String(entry?.achievements || ""),
            avatarUrl: entry?.avatarUrl ? String(entry.avatarUrl) : undefined,
            platformStats: entry?.platformStats,
          })
        ) || [];

        if (mounted) {
          setLeaderboardData(normalized);
        }
      } catch (e: any) {
        if (mounted) setError(e?.message || "Failed to load leaderboard");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-8 h-8 text-yellow-500" />;
      case 2:
        return <Medal className="w-8 h-8 text-gray-400" />;
      case 3:
        return <Medal className="w-8 h-8 text-amber-600" />;
      default:
        return <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold">{rank}</div>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/30";
      case 2:
        return "bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/30";
      case 3:
        return "bg-gradient-to-r from-amber-600/20 to-amber-700/20 border-amber-600/30";
      default:
        return "bg-card";
    }
  };

  const getInitials = useCallback((name: string) => {
    return name
      .split(" ")
      .map((part) => part.trim()[0])
      .filter(Boolean)
      .slice(0, 3)
      .join("")
      .toUpperCase();
  }, []);

  const topThree = useMemo(() => leaderboardData.slice(0, 3), [leaderboardData]);
  const top1 = topThree[0];
  const top2 = topThree[1];
  const top3 = topThree[2];

  const currentUserEntry = useMemo(() => {
    if (!currentStudentId) return null;
    return leaderboardData.find((entry) => entry.id === currentStudentId) || null;
  }, [leaderboardData, currentStudentId]);

  const displayLeaderboard = useMemo(() => {
    if (!currentStudentId) return leaderboardData;
    if (!currentUserEntry) return leaderboardData;
    return [currentUserEntry, ...leaderboardData.filter((entry) => entry.id !== currentStudentId)];
  }, [leaderboardData, currentStudentId, currentUserEntry]);

  const handleViewProfile = useCallback((student: LeaderboardEntry) => {
    setSelectedStudent(student);
  }, []);

  const shareAchievement = useCallback(
    async (student?: LeaderboardEntry | null) => {
      if (!student) {
        toast({
          title: "Nothing to share yet",
          description: "Leaderboard data is still loading.",
          variant: "destructive",
        });
        return;
      }

      const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/leaderboard` : "https://evolved.app";
      const text = `${student.name} just secured Rank #${student.rank} on the EvolvEd Leaderboard with a readiness score of ${student.score}%! ${student.achievements}`.trim();

      try {
        if (typeof navigator !== "undefined" && navigator.share) {
          await navigator.share({
            title: `EvolvEd Leaderboard: #${student.rank} ${student.name}`,
            text,
            url: shareUrl,
          });
          toast({
            title: "Achievement shared",
            description: "Thanks for spreading the word!",
          });
          return;
        }

        if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(`${text} ${shareUrl}`);
          toast({
            title: "Link copied",
            description: "Share it with your network.",
          });
          return;
        }

        throw new Error("Sharing is not supported on this device.");
      } catch (error: unknown) {
        if ((error as Error)?.name === "AbortError") {
          return;
        }
        toast({
          title: "Unable to share",
          description: (error as Error)?.message || "Try copying the link manually.",
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <header className="bg-card border-b sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">EvolvEd</h1>
          </div>
        </header>
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="animate-pulse text-muted-foreground">Loading leaderboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-muted/30">
        <header className="bg-card border-b sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">EvolvEd</h1>
          </div>
        </header>
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="text-red-500">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <StudentNavbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-primary/10 rounded-full">
            <Trophy className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-primary">Top Performers</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Global Leaderboard</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Ranked by consistency, growth, and achievements—not just test scores
          </p>
        </motion.div>

        {currentStudentId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mb-12"
          >
            <Card className={`max-w-4xl mx-auto border-primary/20 ${currentUserEntry ? "shadow-glow" : "shadow-card"}`}>
              <CardContent className="py-6 px-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center text-2xl font-semibold text-primary-foreground">
                      {getInitials(currentUserEntry?.name || currentStudentMeta?.name || "You")}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-semibold">
                          {currentUserEntry?.name || currentStudentMeta?.name || "You're logged in"}
                        </h2>
                        <Badge variant="secondary">You</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {currentUserEntry?.college || currentStudentMeta?.college || "Add your college details to personalize this section."}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col md:items-end gap-3">
                    <div className="text-lg font-semibold">
                      {currentUserEntry ? (
                        <>{"Current Rank: "}<span className="text-2xl">#{currentUserEntry.rank}</span></>
                      ) : (
                        "Outside Top 50"
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {currentUserEntry
                        ? `Readiness Score: ${currentUserEntry.score}%`
                        : currentStudentMeta?.readinessScore
                          ? `Your latest readiness score: ${currentStudentMeta.readinessScore}%`
                          : "Keep improving your readiness to break into the leaderboard."}
                    </p>
                    <div className="flex gap-2">
                      {currentUserEntry ? (
                        <>
                          <Button variant="secondary" size="sm" onClick={() => handleViewProfile(currentUserEntry)}>
                            View Profile
                          </Button>
                          <Button size="sm" className="bg-gradient-primary" onClick={() => shareAchievement(currentUserEntry)}>
                            <Share2 className="w-4 h-4 mr-2" />
                            Share Rank
                          </Button>
                        </>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => navigate("/student/progress")}>
                          View Progress
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Top 3 Podium */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* 2nd Place */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="md:order-1"
            >
              <Card className="shadow-card border-gray-400/30 bg-gradient-to-br from-gray-400/10 to-gray-500/10">
                <CardContent className="pt-8 text-center">
                  <div className="mb-4 flex justify-center">
                    <Medal className="w-16 h-16 text-gray-400" />
                  </div>
                  {top2 && (
                    <>
                      <div className="w-20 h-20 mx-auto bg-gradient-secondary rounded-full flex items-center justify-center text-2xl font-bold text-secondary-foreground mb-4">
                        {getInitials(top2.name)}
                      </div>
                      <h3 className="text-xl font-bold mb-1">{top2.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{top2.college}</p>
                      <div className="text-3xl font-bold bg-gradient-secondary bg-clip-text text-transparent mb-2">
                        {top2.score}%
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{top2.streak} day streak</p>
                      <div className="flex flex-col gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewProfile(top2)}>
                          View Profile
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => shareAchievement(top2)}>
                          <Share2 className="w-4 h-4 mr-2" />
                          Share
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* 1st Place */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="md:order-2"
            >
              <Card className="shadow-glow border-yellow-500/30 bg-gradient-to-br from-yellow-500/20 to-amber-500/20 md:-mt-6">
                <CardContent className="pt-8 text-center">
                  <div className="mb-4 flex justify-center animate-glow-pulse">
                    <Trophy className="w-20 h-20 text-yellow-500" />
                  </div>
                  {top1 && (
                    <>
                      <div className="w-24 h-24 mx-auto bg-gradient-primary rounded-full flex items-center justify-center text-3xl font-bold text-primary-foreground mb-4">
                        {getInitials(top1.name)}
                      </div>
                      <h3 className="text-2xl font-bold mb-1">{top1.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{top1.college}</p>
                      <div className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
                        {top1.score}%
                      </div>
                      <p className="text-sm text-muted-foreground mb-6">{top1.streak} day streak</p>
                    </>
                  )}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                    <Button variant="secondary" onClick={() => top1 && handleViewProfile(top1)}>
                      View Profile
                    </Button>
                    <Button className="bg-gradient-primary" onClick={() => shareAchievement(top1)}>
                      <Share2 className="w-4 h-4 mr-2" />
                      Share Achievement
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* 3rd Place */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="md:order-3"
            >
              <Card className="shadow-card border-amber-600/30 bg-gradient-to-br from-amber-600/10 to-amber-700/10">
                <CardContent className="pt-8 text-center">
                  <div className="mb-4 flex justify-center">
                    <Medal className="w-16 h-16 text-amber-600" />
                  </div>
                  {top3 && (
                    <>
                      <div className="w-20 h-20 mx-auto bg-gradient-accent rounded-full flex items-center justify-center text-2xl font-bold text-accent-foreground mb-4">
                        {getInitials(top3.name)}
                      </div>
                      <h3 className="text-xl font-bold mb-1">{top3.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{top3.college}</p>
                      <div className="text-3xl font-bold bg-gradient-accent bg-clip-text text-transparent mb-2">
                        {top3.score}%
                      </div>
                      <p className="text-sm text-muted-foreground mb-6">{top3.streak} day streak</p>
                      <div className="flex flex-col gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewProfile(top3)}>
                          View Profile
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => shareAchievement(top3)}>
                          <Share2 className="w-4 h-4 mr-2" />
                          Share
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>

        {/* Full Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="max-w-5xl mx-auto"
        >
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Complete Rankings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {displayLeaderboard.map((student, index) => {
                const isCurrentUser = currentStudentId === student.id;
                return (
                  <motion.div
                    key={student.id ?? `leader-list-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                  >
                    <Card
                      className={`${getRankBg(student.rank)} border transition-all hover:shadow-md ${isCurrentUser ? "ring-2 ring-primary/80 shadow-glow" : ""
                        }`}
                    >
                      <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                          <div className="flex items-center gap-4 flex-shrink-0">
                            {getRankIcon(student.rank)}
                            <div
                              className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold ${isCurrentUser
                                ? "bg-primary text-primary-foreground"
                                : "bg-gradient-primary text-primary-foreground"
                                }`}
                            >
                              {getInitials(student.name)}
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-bold truncate">{student.name}</h3>
                              {isCurrentUser && <Badge variant="secondary">You</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2 truncate">
                              {student.college}
                            </p>
                            <p className="text-sm text-muted-foreground mb-3 max-h-12 overflow-hidden text-ellipsis">
                              {student.achievements}
                            </p>

                            {!!student.badges?.length && (
                              <div className="flex flex-wrap gap-2">
                                {student.badges.slice(0, 4).map((badge: any, i: number) => (
                                  <div key={i} className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md">
                                    <Star className="w-4 h-4 text-yellow-500" />
                                    <span className="text-xs font-medium">{String(badge)}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {student.platformStats && (
                              <div className="flex gap-4 mt-3">
                                {student.platformStats.leetcode.totalSolved > 0 && (
                                  <div className="flex items-center gap-1.5" title="LeetCode Solved">
                                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                    <span className="text-xs font-medium text-muted-foreground">LC: {student.platformStats.leetcode.totalSolved}</span>
                                  </div>
                                )}
                                {student.platformStats.hackerrank.totalSolved > 0 && (
                                  <div className="flex items-center gap-1.5" title="HackerRank Solved">
                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                    <span className="text-xs font-medium text-muted-foreground">HR: {student.platformStats.hackerrank.totalSolved}</span>
                                  </div>
                                )}
                                {student.platformStats.github.totalCommits > 0 && (
                                  <div className="flex items-center gap-1.5" title="GitHub Commits">
                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                                    <span className="text-xs font-medium text-muted-foreground">GH: {student.platformStats.github.totalCommits}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-2 items-end flex-shrink-0">
                            <div className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                              {student.score}%
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <div className="text-center">
                                <p className="text-muted-foreground">Solved</p>
                                <p className="font-semibold">{student.totalSolved}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-muted-foreground">Streak</p>
                                <p className="font-semibold">{student.streak}d</p>
                              </div>
                              <div className="text-center">
                                <p className="text-muted-foreground">Projects</p>
                                <p className="font-semibold">{student.projects}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleViewProfile(student)}>
                                View Profile
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => shareAchievement(student)}>
                                <Share2 className="w-4 h-4 mr-2" />
                                Share
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>

        {/* Share Achievement CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mt-12 text-center"
        >
          <Card className="max-w-2xl mx-auto bg-gradient-primary text-primary-foreground shadow-glow">
            <CardContent className="pt-8 pb-8">
              <Trophy className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Share Your Achievement</h3>
              <p className="mb-6 opacity-90">
                Showcase your growth story and inspire others on LinkedIn
              </p>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => shareAchievement(selectedStudent ?? currentUserEntry ?? top1 ?? leaderboardData[0])}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share on LinkedIn
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <Dialog open={!!selectedStudent} onOpenChange={(open) => !open && setSelectedStudent(null)}>
          <DialogContent className="max-w-lg">
            {selectedStudent && (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedStudent.name}</DialogTitle>
                  <DialogDescription>
                    Rank #{selectedStudent.rank} &bull; {selectedStudent.college || "College info unavailable"}
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center text-2xl font-semibold">
                      {getInitials(selectedStudent.name)}
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="font-semibold text-base">Readiness Score: {selectedStudent.score}%</p>
                      {selectedStudent.achievements && (
                        <p className="text-muted-foreground">{selectedStudent.achievements}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="rounded-md border bg-card/60 p-2 shadow-sm">
                      <p className="text-[10px] text-muted-foreground">Rank</p>
                      <p className="text-lg font-semibold">#{selectedStudent.rank}</p>
                    </div>
                    <div className="rounded-md border bg-card/60 p-2 shadow-sm">
                      <p className="text-[10px] text-muted-foreground">Solved</p>
                      <p className="text-lg font-semibold">{selectedStudent.totalSolved}</p>
                    </div>
                    <div className="rounded-md border bg-card/60 p-2 shadow-sm">
                      <p className="text-[10px] text-muted-foreground">Streak</p>
                      <p className="text-lg font-semibold">{selectedStudent.streak}d</p>
                    </div>
                    <div className="rounded-md border bg-card/60 p-2 shadow-sm">
                      <p className="text-[10px] text-muted-foreground">Projects</p>
                      <p className="text-lg font-semibold">{selectedStudent.projects}</p>
                    </div>
                  </div>

                  {selectedStudent.platformStats && (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Coding Activity</p>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 bg-muted/50 rounded-lg flex flex-col items-center">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold">LeetCode</span>
                          <span className="text-lg font-bold">{selectedStudent.platformStats.leetcode.totalSolved}</span>
                          <span className="text-[10px] text-muted-foreground">Solved</span>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg flex flex-col items-center">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold">HackerRank</span>
                          <span className="text-lg font-bold">{selectedStudent.platformStats.hackerrank.totalSolved}</span>
                          <span className="text-[10px] text-muted-foreground">Solved</span>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg flex flex-col items-center">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold">GitHub</span>
                          <span className="text-lg font-bold">{selectedStudent.platformStats.github.totalCommits}</span>
                          <span className="text-[10px] text-muted-foreground">Commits</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {!!selectedStudent.badges?.length && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Badges</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedStudent.badges.map((badge, index) => (
                          <Badge key={`${selectedStudent.id}-badge-${index}`} variant="secondary">
                            {badge}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 pt-2">
                  <Button variant="outline" onClick={() => setSelectedStudent(null)}>
                    Close
                  </Button>
                  <Button className="bg-gradient-primary" onClick={() => shareAchievement(selectedStudent)}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Achievement
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Leaderboard;
