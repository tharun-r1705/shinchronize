import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import MockInterviewChatbot from "@/components/MockInterviewChatbot";
import { interviewApi, InterviewSessionDTO } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ShieldCheck,
  Users2,
  Timer,
  ListChecks,
  Trophy,
  Code2,
  Database,
  Brain,
  Cloud,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type StackLevel = "basic" | "intermediate" | "advanced";

interface TechStackOption {
  id: string;
  label: string;
  summary: string;
  icon: LucideIcon;
  role: string;
  roleLevel: StackLevel;
  focusAreas: string[];
}

const techStacks: TechStackOption[] = [
  {
    id: "fullstack",
    label: "Full-Stack Web",
    summary: "React, Node, REST APIs, and schema trade-offs.",
    icon: Code2,
    role: "Full-Stack Developer",
    roleLevel: "intermediate",
    focusAreas: ["component architecture", "API design", "database modeling"],
  },
  {
    id: "data",
    label: "Data Engineering",
    summary: "Pipelines, SQL optimisation, warehousing, analytics engineering.",
    icon: Database,
    role: "Data Engineer",
    roleLevel: "intermediate",
    focusAreas: ["ETL pipelines", "SQL tuning", "data governance"],
  },
  {
    id: "ai",
    label: "AI / ML",
    summary: "Model selection, evaluation, responsible AI, deployment patterns.",
    icon: Brain,
    role: "AI Engineer",
    roleLevel: "advanced",
    focusAreas: ["model evaluation", "prompt engineering", "MLOps"],
  },
  {
    id: "cloud",
    label: "Cloud & DevOps",
    summary: "Scalability, observability, IaC, and secure delivery.",
    icon: Cloud,
    role: "Cloud Engineer",
    roleLevel: "intermediate",
    focusAreas: ["infrastructure as code", "observability", "deployment automation"],
  },
];

const MockInterview = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [history, setHistory] = useState<InterviewSessionDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStack, setSelectedStack] = useState<TechStackOption | null>(null);
  const stackTiles = useMemo(() => techStacks, []);

  const fetchHistory = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const response = await interviewApi.getStudentHistory("me", { limit: 6 }, token);
      setHistory(response.sessions || []);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to fetch mock interviews";
      console.error(message);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast({
        title: "Sign in required",
        description: "Log in to access your mock interviews",
        variant: "destructive",
      });
      navigate("/student/login");
      return;
    }

    fetchHistory().finally(() => setIsLoading(false));
  }, [navigate, toast]);

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-card border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Practice Space</p>
            <h1 className="text-2xl font-bold">Adaptive Mock Interview</h1>
            <p className="text-sm text-muted-foreground">
              Pick a stack, run a 10-question MCQ test, then switch stacks anytime to build a richer attempt log.
            </p>
          </div>
          <Button variant="ghost" onClick={() => navigate("/student/dashboard")}> 
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          {selectedStack ? (
            <Card className="shadow-card">
              <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Current stack</p>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <selectedStack.icon className="h-5 w-5 text-primary" />
                    {selectedStack.label}
                  </CardTitle>
                  <CardDescription>{selectedStack.summary}</CardDescription>
                </div>
                <Button variant="ghost" onClick={() => setSelectedStack(null)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to stacks
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  {selectedStack.focusAreas.map((area) => (
                    <Badge key={area} variant="secondary">
                      {area}
                    </Badge>
                  ))}
                </div>
                <MockInterviewChatbot
                  key={selectedStack.id}
                  variant="full"
                  defaultRole={selectedStack.role}
                  defaultRoleLevel={selectedStack.roleLevel}
                  defaultFocusAreas={selectedStack.focusAreas}
                  onSessionReady={() => {
                    fetchHistory();
                  }}
                />
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Select a tech stack</CardTitle>
                <CardDescription>Spin up as many tests as you like—each stack saves its own history.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                {stackTiles.map((stack) => (
                  <button
                    key={stack.id}
                    onClick={() => setSelectedStack(stack)}
                    className="rounded-xl border p-4 text-left transition hover:border-primary hover:shadow-glow"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="rounded-full bg-primary/10 p-2 text-primary">
                        <stack.icon className="h-5 w-5" />
                      </span>
                      <span className="font-semibold">{stack.label}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{stack.summary}</p>
                    <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                      {stack.focusAreas.map((area) => (
                        <span key={area} className="rounded-full bg-muted px-2 py-0.5">
                          {area}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>How the test works</CardTitle>
              <CardDescription>Each attempt is saved for recruiters with your stack, difficulty curve, and final verdict.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Timer className="h-5 w-5 text-primary" />
                <p className="text-sm">Fixed-length tests (4–25 questions). Difficulty ramps up automatically.</p>
              </div>
              <div className="flex items-center gap-3">
                <ListChecks className="h-5 w-5 text-primary" />
                <p className="text-sm">Single best answer required. Immediate rubric feedback per question.</p>
              </div>
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <p className="text-sm">Summaries highlight your accuracy, strengths, and readiness recommendation.</p>
              </div>
              <div className="flex items-center gap-3">
                <Users2 className="h-5 w-5 text-primary" />
                <p className="text-sm">Share multiple attempts to prove consistency before live screenings.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your recent tests</CardTitle>
              <CardDescription>Review accuracy trends before meeting recruiters.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading && <p className="text-sm text-muted-foreground">Loading history...</p>}
              {!isLoading && history.length === 0 && (
                <p className="text-sm text-muted-foreground">No tests yet. Launch your first session to unlock analytics.</p>
              )}
              {history.map((session) => {
                const scorePercent = session.summary?.scorePercent ?? session.overallScore ?? 0;
                const totalQuestions = session.meta?.maxQuestions || session.learningCurve?.length || 0;
                const answered = session.meta?.totalAnswers || session.learningCurve?.length || 0;
                return (
                  <div key={session._id} className="rounded-lg border p-3 flex flex-col gap-2 bg-card/40">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{session.role}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {session.roleLevel} • {new Date(session.createdAt || '').toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="secondary">{scorePercent}%</Badge>
                    </div>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <span>
                        {answered}/{totalQuestions} questions
                      </span>
                      <span>•</span>
                      <span>Status: {session.status}</span>
                    </div>
                    {session.summary?.overallFeedback && (
                      <p className="text-xs text-foreground">{session.summary.overallFeedback}</p>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/10 to-secondary/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Build your attempt log
              </CardTitle>
              <CardDescription>Each completed test boosts your readiness portfolio.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Recruiters compare your latest three tests inside Shinchronize. Mix stacks, dial the difficulty, and show measurable growth.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default MockInterview;
