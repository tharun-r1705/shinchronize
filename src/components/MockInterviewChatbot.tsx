import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  interviewApi,
  InterviewLearningPoint,
  InterviewRubric,
  InterviewSessionDTO,
  InterviewTurnDTO,
} from "@/lib/api";
import {
  CheckCircle2,
  CircleSlash2,
  Loader2,
  MessageCircleQuestion,
  Sparkles,
  TrendingUp,
  LineChart as LineChartIcon,
  Target,
} from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Line, LineChart, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from "recharts";

interface MockInterviewChatbotProps {
  onSessionReady?: (session: InterviewSessionDTO) => void;
  autoFetch?: boolean;
  variant?: "panel" | "full";
  defaultRole?: string;
  defaultFocusAreas?: string[];
  defaultRoleLevel?: "basic" | "intermediate" | "advanced";
  displayMode?: "interactive" | "graph-only";
}

const clampQuestionCount = (value: number) => {
  if (!Number.isFinite(value)) return 10;
  return Math.max(4, Math.min(25, Math.round(value)));
};

const defaultChartConfig = {
  clarity: { label: "Clarity", color: "hsl(var(--chart-1))" },
  technicalAccuracy: { label: "Technical", color: "hsl(var(--chart-2))" },
  communication: { label: "Communication", color: "hsl(var(--chart-3))" },
  overall: { label: "Overall", color: "hsl(var(--chart-4))" },
};

const MockInterviewChatbot = ({
  onSessionReady,
  autoFetch = true,
  variant = "panel",
  defaultRole,
  defaultFocusAreas,
  defaultRoleLevel,
  displayMode = "interactive",
}: MockInterviewChatbotProps) => {
  const { toast } = useToast();
  const [session, setSession] = useState<InterviewSessionDTO | null>(null);
  const [currentTurn, setCurrentTurn] = useState<InterviewTurnDTO | null>(null);
  const [coachingTip, setCoachingTip] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingQuestion, setIsFetchingQuestion] = useState(false);
  const [feedbackSummary, setFeedbackSummary] = useState<{
    feedback: string;
    improvements: string[];
    overall: number;
    rubric?: InterviewRubric;
    isCorrect?: boolean;
    correctOptionKey?: string;
    rationale?: string;
  } | null>(null);
  const [learningData, setLearningData] = useState<InterviewLearningPoint[]>([]);
  const [role, setRole] = useState("");
  const [roleLevel, setRoleLevel] = useState<"basic" | "intermediate" | "advanced">("intermediate");
  const [focusAreas, setFocusAreas] = useState("");
  const [questionCount, setQuestionCount] = useState(10);
  const [selectedOptionKey, setSelectedOptionKey] = useState<string | null>(null);
  const isGraphOnly = displayMode === "graph-only";

  const latestSessionReady = useRef(onSessionReady);
  useEffect(() => {
    latestSessionReady.current = onSessionReady;
  }, [onSessionReady]);

  useEffect(() => {
    if (session) return;
    if (defaultRole) {
      setRole(defaultRole);
    }
  }, [defaultRole, session]);

  useEffect(() => {
    if (session) return;
    if (defaultFocusAreas && defaultFocusAreas.length > 0) {
      setFocusAreas(defaultFocusAreas.join(", "));
    }
  }, [defaultFocusAreas, session]);

  useEffect(() => {
    if (session) return;
    if (defaultRoleLevel) {
      setRoleLevel(defaultRoleLevel);
    }
  }, [defaultRoleLevel, session]);

  useEffect(() => {
    if (!autoFetch) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    interviewApi
      .getActiveSession(token)
      .then((response) => {
        if (response.session) {
          setSession(response.session);
          setLearningData(response.session.learningCurve || []);
          const pendingTurn =
            response.session.turns?.find((turn) => !turn.answer && (turn.options?.length || 0) > 0) || null;
          setCurrentTurn(pendingTurn || null);
          if (pendingTurn) {
            setFeedbackSummary(null);
            setSelectedOptionKey(pendingTurn.selectedOptionKey || null);
          }
          latestSessionReady.current?.(response.session);
        }
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Unable to load active session';
        console.error("Failed to fetch active session", message);
      });
  }, [autoFetch]);

  const handleStartSession = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast({
        title: "Sign in required",
        description: "Please log in to start a mock interview",
        variant: "destructive",
      });
      return;
    }

    if (!role.trim()) {
      toast({
        title: "Role missing",
        description: "Tell the interviewer which role you are preparing for",
        variant: "destructive",
      });
      return;
    }

    if (!questionCount || Number.isNaN(questionCount)) {
      toast({
        title: "Question count required",
        description: "Pick how many questions you want in this test",
        variant: "destructive",
      });
      return;
    }

    setIsFetchingQuestion(true);

    try {
      const { session: newSession } = await interviewApi.startSession(
        {
          role: role.trim(),
          roleLevel,
          focusAreas: focusAreas
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
          questionCount: clampQuestionCount(questionCount),
          mode: "test",
        },
        token
      );

      setSession(newSession);
      setLearningData(newSession.learningCurve || []);
      setFeedbackSummary(null);
      latestSessionReady.current?.(newSession);
      await fetchQuestion(newSession._id, token);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Please try again";
      toast({
        title: "Unable to start session",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsFetchingQuestion(false);
    }
  };

  const fetchQuestion = async (sessionId?: string, providedToken?: string) => {
    const activeSessionId = sessionId || session?._id;
    if (!activeSessionId) return;

    const token = providedToken || localStorage.getItem("token");
    if (!token) return;

    setIsFetchingQuestion(true);
    setFeedbackSummary(null);
    setSelectedOptionKey(null);

    try {
      const response = await interviewApi.requestQuestion(activeSessionId, token);
      setCurrentTurn(response.turn);
      setCoachingTip(response.coachingTip || "");
      setSelectedOptionKey(null);
      setSession((prev) =>
        prev
          ? {
              ...prev,
              currentDifficulty: response.session.currentDifficulty || prev.currentDifficulty,
              meta: response.session.meta || prev.meta,
              maxQuestions: response.session.maxQuestions || prev.maxQuestions,
              turns: [...(prev.turns || []), response.turn],
            }
          : prev
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Try again in a moment";
      toast({
        title: "Failed to fetch question",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsFetchingQuestion(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!currentTurn || !session) return;

    if (!selectedOptionKey) {
      toast({
        title: "Choose an option",
        description: "Select the best answer before submitting",
        variant: "destructive",
      });
      return;
    }

    const selectedOption = currentTurn.options?.find((option) => option.key === selectedOptionKey);
    if (!selectedOption) {
      toast({
        title: "Invalid option",
        description: "Choose one of the available answers",
        variant: "destructive",
      });
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast({
        title: "Session expired",
        description: "Log in again to continue",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await interviewApi.submitAnswer(
        {
          sessionId: session._id,
          turnId: currentTurn._id,
          answer: selectedOption.text,
          selectedOptionKey,
        },
        token
      );

      setFeedbackSummary({
        feedback: response.evaluation.feedback,
        improvements: response.evaluation.improvements,
        overall: response.evaluation.overall,
        rubric: response.evaluation.rubric,
        isCorrect: response.evaluation.isCorrect,
        correctOptionKey: response.evaluation.correctOptionKey,
        rationale: response.evaluation.rationale,
      });

      setCurrentTurn(response.turn);
      setCoachingTip("");
      setSelectedOptionKey(response.turn.selectedOptionKey || null);
      setLearningData(response.session.learningCurve);
      setSession((prev) => {
        if (!prev) return prev;
        const updatedSession: InterviewSessionDTO = {
          ...prev,
          overallScore: response.session.overallScore || prev.overallScore,
          proficiencyVector: response.session.proficiencyVector || prev.proficiencyVector,
          learningCurve: response.session.learningCurve,
          status: response.session.status || prev.status,
          meta: response.session.meta || prev.meta,
          summary: response.session.summary || prev.summary,
          testStats: response.session.testStats || prev.testStats,
          turns: prev.turns?.map((turn) => (turn._id === response.turn._id ? response.turn : turn)) || [response.turn],
        };
        latestSessionReady.current?.(updatedSession);
        return updatedSession;
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Try again in a moment";
      toast({
        title: "Evaluation failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    if (!session) return;
    if ((session.meta?.totalAnswers || 0) >= (session.meta?.maxQuestions || session.maxQuestions || 10)) {
      toast({
        title: "Test completed",
        description: "Start a new test to keep practicing",
        variant: "default",
      });
      return;
    }
    fetchQuestion(session._id);
  };

  const handleResetSession = () => {
    setSession(null);
    setCurrentTurn(null);
    setFeedbackSummary(null);
    setSelectedOptionKey(null);
    setCoachingTip("");
    setLearningData([]);
  };

  useEffect(() => {
    if (isGraphOnly) return;
    if (!currentTurn) return;
    if (currentTurn.options && currentTurn.options.length > 0) return;

    setCurrentTurn(null);
    setSelectedOptionKey(null);
    toast({
      title: "Legacy question skipped",
      description: "Tap “Next question” to fetch a multiple-choice prompt compatible with the new test mode.",
    });
  }, [currentTurn, isGraphOnly, toast]);

  const totalAnswered = session?.meta?.totalAnswers || 0;
  const maxQuestions = session?.meta?.maxQuestions || session?.maxQuestions || questionCount || 10;
  const progressPercent = Math.min((totalAnswered / maxQuestions) * 100, 100);
  const hasPendingQuestion = Boolean(currentTurn && !currentTurn.answer);
  const projectedQuestion = hasPendingQuestion ? totalAnswered + 1 : totalAnswered;
  const questionNumber = Math.max(1, Math.min(projectedQuestion || 1, maxQuestions));
  const isSessionCompleted = session?.status === "completed";
  const questionAnswered = Boolean(currentTurn?.answer);
  const hasOptions = Boolean(currentTurn?.options && currentTurn.options.length > 0);
  const isLegacyTurn = Boolean(currentTurn && !hasOptions);
  const canRequestNext =
    !isSessionCompleted && totalAnswered < maxQuestions && (!currentTurn || questionAnswered || isLegacyTurn);

  const chartData = useMemo(() => {
    return learningData.map((point, index) => ({
      index: index + 1,
      clarity: point.clarity,
      technicalAccuracy: point.technicalAccuracy,
      communication: point.communication,
      overall: point.overall,
    }));
  }, [learningData]);

  const renderTestStats = () => {
    if (!session?.testStats) return null;
    return (
      <div className="grid gap-3 rounded-xl border bg-background/60 p-4 sm:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Correct</p>
          <p className="text-2xl font-semibold">{session.testStats.correctAnswers || 0}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Incorrect</p>
          <p className="text-2xl font-semibold">{session.testStats.incorrectAnswers || 0}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Progress</p>
          <p className="text-2xl font-semibold">{Math.round(progressPercent)}%</p>
        </div>
      </div>
    );
  };

  const renderChartCard = ({ showPlaceholder = false } = {}) => {
    if (!chartData.length && !showPlaceholder) return null;

    return (
      <div className="rounded-xl border bg-card/40 p-4">
        <div className="flex items-center gap-2 mb-4">
          <LineChartIcon className="h-4 w-4 text-primary" />
          <div>
            <p className="text-sm font-medium">Learning curve</p>
            <p className="text-xs text-muted-foreground">Track how your responses are improving</p>
          </div>
        </div>
        {chartData.length > 0 ? (
          <ChartContainer config={defaultChartConfig} className="h-64">
            <ResponsiveContainer>
              <LineChart data={chartData} margin={{ left: 12, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="index" tickLine={false} axisLine={false} />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}`}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="overall" stroke="var(--color-overall)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
            Complete at least one test to unlock this graph.
          </div>
        )}
      </div>
    );
  };

  const renderSummaryCard = () => {
    if (!isSessionCompleted || !session?.summary) return null;
    return (
      <div className="rounded-xl border bg-card/50 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <div>
            <p className="text-sm text-muted-foreground">Test summary</p>
            <p className="text-xl font-semibold">{session.summary.scorePercent || 0}% accuracy</p>
          </div>
        </div>
        {session.summary.overallFeedback && (
          <p className="text-sm text-foreground leading-relaxed">{session.summary.overallFeedback}</p>
        )}
        {session.summary.highlights && session.summary.highlights.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Highlights</p>
            <ul className="list-disc pl-5 text-sm space-y-1">
              {session.summary.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        {session.summary.improvements && session.summary.improvements.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Focus next</p>
            <ul className="list-disc pl-5 text-sm space-y-1">
              {session.summary.improvements.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        {session.summary.recommendation && (
          <p className="text-sm text-muted-foreground">Recommendation: {session.summary.recommendation}</p>
        )}
      </div>
    );
  };

  const renderGraphOnly = () => (
    <div className="space-y-6">
      {renderChartCard({ showPlaceholder: true })}
      {renderTestStats()}
      {renderSummaryCard() || (
        <p className="text-sm text-muted-foreground">
          Complete a mock interview test from the practice workspace to populate highlights here.
        </p>
      )}
    </div>
  );

  const renderSetup = () => (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Target role</label>
        <Input
          placeholder="e.g., Frontend Engineer"
          value={role}
          onChange={(event) => setRole(event.target.value)}
          disabled={isFetchingQuestion}
          className="mt-1"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Current level</label>
        <Select value={roleLevel} onValueChange={(value: typeof roleLevel) => setRoleLevel(value)}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="basic">Beginner</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium">Focus areas (comma separated)</label>
        <Input
          placeholder="DSA, cloud fundamentals, communication"
          value={focusAreas}
          onChange={(event) => setFocusAreas(event.target.value)}
          disabled={isFetchingQuestion}
          className="mt-1"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Questions per test</label>
        <Input
          type="number"
          min={4}
          max={25}
          value={questionCount}
          onChange={(event) => setQuestionCount(Number(event.target.value))}
          disabled={isFetchingQuestion}
          className="mt-1"
        />
        <p className="text-xs text-muted-foreground mt-1">We recommend 10 questions for a balanced assessment.</p>
      </div>
      <Button className="w-full" onClick={handleStartSession} disabled={isFetchingQuestion}>
        {isFetchingQuestion ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
        Start timed test
      </Button>
    </div>
  );

  const renderActiveSession = () => (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="secondary" className="text-xs">
          {session?.role}
        </Badge>
        <Badge variant="outline" className="text-xs capitalize">
          {session?.roleLevel} level
        </Badge>
        {session?.currentDifficulty && (
          <Badge className="text-xs bg-gradient-secondary">
            Difficulty: {session.currentDifficulty}
          </Badge>
        )}
      </div>

      <div className="rounded-xl border bg-card/50 p-4 shadow-sm space-y-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 font-medium">
            <Target className="h-4 w-4 text-primary" />
            Question {questionNumber} of {maxQuestions}
          </div>
          <span className="text-xs text-muted-foreground">{totalAnswered} answered</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <MessageCircleQuestion className="h-4 w-4 text-primary" />
            Question
          </div>
          {currentTurn ? (
            <p className="text-base leading-relaxed text-foreground">{currentTurn.question}</p>
          ) : (
            <p className="text-muted-foreground text-sm">Request the next question to continue.</p>
          )}
          {coachingTip && (
            <p className="text-sm text-muted-foreground border-l-2 border-primary pl-3">
              Tip: {coachingTip}
            </p>
          )}
        </div>
        <div className="grid gap-3">
          {hasOptions ? (
            currentTurn?.options?.map((option) => {
              const isSelected = selectedOptionKey === option.key;
              const wasAnswered = Boolean(currentTurn.answeredAt);
              const isCorrectOption = wasAnswered && currentTurn.correctOptionKey === option.key;
              const isWrongChoice = wasAnswered && currentTurn.selectedOptionKey === option.key && !currentTurn.isCorrect;

              const borderClass = isCorrectOption
                ? "border-emerald-500 bg-emerald-500/10"
                : isWrongChoice
                ? "border-destructive bg-destructive/10"
                : isSelected
                ? "border-primary bg-primary/10"
                : "hover:border-primary/40";

              return (
                <button
                  key={option.key}
                  disabled={isSubmitting || wasAnswered}
                  onClick={() => setSelectedOptionKey(option.key)}
                  className={`rounded-xl border p-4 text-left transition ${borderClass} ${
                    wasAnswered ? "cursor-default" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="w-8 justify-center">
                      {option.key}
                    </Badge>
                    <p className="text-sm text-foreground leading-relaxed">{option.text}</p>
                  </div>
                </button>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground">Options will appear once a question is loaded.</p>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleSubmitAnswer}
            disabled={isSubmitting || !currentTurn || questionAnswered || !hasOptions}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit answer"}
          </Button>
          <Button variant="outline" onClick={handleNextQuestion} disabled={!canRequestNext || isFetchingQuestion}>
            {isFetchingQuestion ? <Loader2 className="h-4 w-4 animate-spin" /> : "Next question"}
          </Button>
          {isSessionCompleted && (
            <Button variant="ghost" onClick={handleResetSession}>
              Start new test
            </Button>
          )}
        </div>
      </div>

      {renderTestStats()}

      {feedbackSummary && (
        <div className="rounded-xl border bg-background/60 p-4 space-y-3">
          <div className="flex items-center gap-2">
            {feedbackSummary.isCorrect ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : (
              <CircleSlash2 className="h-5 w-5 text-destructive" />
            )}
            <div>
              <p className="text-sm text-muted-foreground">{feedbackSummary.isCorrect ? "Correct" : "Keep refining"}</p>
              <p className="text-2xl font-semibold">{feedbackSummary.overall}/100</p>
            </div>
          </div>
          <p className="text-sm text-foreground leading-relaxed">{feedbackSummary.feedback}</p>
          {feedbackSummary.rationale && (
            <p className="text-xs text-muted-foreground">Why: {feedbackSummary.rationale}</p>
          )}
          {feedbackSummary.improvements?.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Improvement ideas
              </p>
              <ul className="list-disc pl-5 text-sm space-y-1">
                {feedbackSummary.improvements.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {renderChartCard()}
      {renderSummaryCard()}
    </div>
  );

  const headerTitle = isGraphOnly ? "Mock Interview Learning Curve" : "Adaptive Mock Interview";
  const headerDescription = isGraphOnly
    ? "Review your latest test accuracy and trends. Launch tests from the practice space when you need fresh data."
    : "Groq-powered 10-question tests that adapt difficulty, force a single best option, and summarise every attempt.";

  const cardBody = isGraphOnly ? renderGraphOnly() : session ? renderActiveSession() : renderSetup();

  return (
    <Card className={variant === "panel" ? "shadow-card border-primary/10" : "shadow-xl"}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          {headerTitle}
        </CardTitle>
        <CardDescription>{headerDescription}</CardDescription>
      </CardHeader>
      <CardContent>{cardBody}</CardContent>
    </Card>
  );
};

export default MockInterviewChatbot;
