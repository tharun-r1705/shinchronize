import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Brain, Loader2, Play, History, Target, Gauge, Upload, X } from "lucide-react";

import { StudentLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { InterviewHistoryResponse, InterviewStatsResponse } from "@/lib/api";
import { interviewApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

type SessionType = "quick" | "full";
type Difficulty = "beginner" | "intermediate" | "advanced";
type Persona = "friendly" | "neutral" | "tough";

const INTERVIEW_TYPE_OPTIONS: Array<{ id: string; label: string; hint: string }> = [
  { id: "technical-domain", label: "Technical", hint: "DSA/system/design/domain" },
  { id: "behavioral", label: "Behavioral", hint: "HR + STAR" },
  { id: "project", label: "Projects", hint: "deep-dive on your work" },
  { id: "tricky", label: "Tricky", hint: "edge cases + pressure" },
];

function formatDateTime(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

export default function InterviewHub() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const token = localStorage.getItem("token");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const [stats, setStats] = useState<InterviewStatsResponse["interviewStats"] | null>(null);
  const [history, setHistory] = useState<InterviewHistoryResponse | null>(null);

  const [sessionType, setSessionType] = useState<SessionType>("quick");
  const [difficulty, setDifficulty] = useState<Difficulty>("intermediate");
  const [persona, setPersona] = useState<Persona>("neutral");
  const [targetRole, setTargetRole] = useState<string>("Software Engineer");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([
    "technical-domain",
    "behavioral",
    "project",
  ]);

  const [isStarting, setIsStarting] = useState(false);

  const typeBadges = useMemo(() => {
    const map = new Map(INTERVIEW_TYPE_OPTIONS.map((o) => [o.id, o.label]));
    return selectedTypes.map((t) => map.get(t) || t);
  }, [selectedTypes]);

  useEffect(() => {
    if (!token) {
      navigate("/student/login");
      return;
    }

    const run = async () => {
      setIsLoading(true);
      setError("");
      try {
        const [statsRes, historyRes] = await Promise.all([
          interviewApi.getStats(token),
          interviewApi.getHistory({ page: 1, limit: 10 }, token),
        ]);
        setStats(statsRes.interviewStats || {});
        setHistory(historyRes);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load interview data");
      } finally {
        setIsLoading(false);
      }
    };

    run();
  }, [navigate, token]);

  const toggleType = (id: string) => {
    setSelectedTypes((prev) => {
      if (prev.includes(id)) return prev.filter((t) => t !== id);
      return [...prev, id];
    });
  };

  const start = async () => {
    if (!token) {
      navigate("/student/login");
      return;
    }

    const interviewTypes = selectedTypes.length ? selectedTypes : ["technical-domain", "behavioral", "project"];

    setIsStarting(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append('sessionType', sessionType);
      formData.append('difficulty', difficulty);
      formData.append('interviewerPersona', persona);
      formData.append('targetRole', targetRole.trim() || 'Software Engineer');
      formData.append('interviewTypes', JSON.stringify(interviewTypes));
      
      if (resumeFile) {
        formData.append('resume', resumeFile);
      }

      const res = await interviewApi.startSession(formData, token);
      toast({
        title: "Session started",
        description: `Question 1 of ${res.progress.total}`,
      });
      navigate(`/student/interview/${res.sessionId}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to start session");
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <StudentLayout>
      <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex items-start justify-between gap-6 flex-col lg:flex-row"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold tracking-tight">Interview Prep</h2>
            </div>
            <p className="text-muted-foreground max-w-2xl">
              Run resume-aware mock interviews and get structured feedback.
            </p>
          </div>
        </motion.div>

        {error ? (
          <div className="mt-6">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        ) : null}

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Start a Session
              </CardTitle>
              <CardDescription>
                Pick your session settings. You can paste resume text for sharper project and role questions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Session Type</Label>
                  <Select value={sessionType} onValueChange={(v) => setSessionType(v as SessionType)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quick">Quick (5 Qs)</SelectItem>
                      <SelectItem value="full">Full (12 Qs)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Interviewer Persona</Label>
                  <Select value={persona} onValueChange={(v) => setPersona(v as Persona)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="neutral">Neutral</SelectItem>
                      <SelectItem value="tough">Tough</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Target Role</Label>
                  <Input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="Software Engineer" />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <Label>Interview Types</Label>
                  <div className="flex gap-2 flex-wrap">
                    {typeBadges.map((t) => (
                      <Badge key={t} variant="secondary">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {INTERVIEW_TYPE_OPTIONS.map((opt) => {
                    const checked = selectedTypes.includes(opt.id);
                    return (
                      <div
                        key={opt.id}
                        className="flex items-start gap-3 rounded-lg border p-3"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleType(opt.id)}
                          aria-label={`Toggle ${opt.label}`}
                        />
                        <div className="space-y-1">
                          <div className="font-medium leading-none">{opt.label}</div>
                          <div className="text-xs text-muted-foreground">{opt.hint}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Resume (optional)</Label>
                  <span className="text-xs text-muted-foreground">Upload PDF for personalized questions</span>
                </div>
                
                {resumeFile ? (
                  <div className="flex items-center gap-2 rounded-lg border p-3">
                    <div className="flex-1 text-sm">
                      <div className="font-medium">{resumeFile.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {(resumeFile.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setResumeFile(null)}
                      className="gap-2"
                    >
                      <X className="h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 10 * 1024 * 1024) {
                            setError('Resume file must be less than 10MB');
                            return;
                          }
                          setResumeFile(file);
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      id="resume-upload"
                    />
                    <label
                      htmlFor="resume-upload"
                      className="flex items-center justify-center gap-2 rounded-lg border border-dashed p-6 cursor-pointer hover:border-primary hover:bg-accent/50 transition-colors"
                    >
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Click to upload PDF (max 10MB)
                      </span>
                    </label>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="text-xs text-muted-foreground">
                  {resumeFile ? 'Resume uploaded. Questions will be personalized.' : 'Upload resume for personalized interview questions.'}
                </div>
                <Button onClick={start} disabled={isStarting}>
                  {isStarting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Starting…
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Start
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="h-5 w-5" />
                  Your Stats
                </CardTitle>
                <CardDescription>Interview performance snapshot</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading…
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg border p-3">
                      <div className="text-muted-foreground">Sessions</div>
                      <div className="text-lg font-semibold">{stats?.completedSessions || 0}/{stats?.totalSessions || 0}</div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="text-muted-foreground">Avg Score</div>
                      <div className="text-lg font-semibold">{stats?.avgScore ?? 0}</div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="text-muted-foreground">Best Score</div>
                      <div className="text-lg font-semibold">{stats?.bestScore ?? 0}</div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="text-muted-foreground">Last Session</div>
                      <div className="text-sm font-medium">{formatDateTime(stats?.lastSessionAt)}</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Recent Sessions
                </CardTitle>
                <CardDescription>Last 10 sessions</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading…
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Score</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(history?.items || []).length ? (
                            history.items.map((item) => (
                              <TableRow key={item._id} className="cursor-pointer" onClick={() => navigate(`/student/interview/${item._id}`)}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Target className="h-4 w-4 text-muted-foreground" />
                                    <div className="font-medium">{item.targetRole || "—"}</div>
                                  </div>
                                  <div className="text-xs text-muted-foreground">{formatDateTime(item.createdAt)}</div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={item.status === "completed" ? "secondary" : "outline"}>{item.status}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <span className="font-semibold">{item.summary?.overallScore ?? "—"}</span>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={3} className="text-sm text-muted-foreground">
                                No sessions yet.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Clicking a session opens it (completed sessions show full Q&A).
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
    </StudentLayout>
  );
}
