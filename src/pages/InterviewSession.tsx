import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Brain, ChevronLeft, Loader2, Send, CheckCircle2, Info, Mic, Square, Trash2, Volume2 } from "lucide-react";

import { StudentNavbar } from "@/components/StudentNavbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { interviewApi, ttsApi, InterviewQuestionDTO } from "@/lib/api";
import type { InterviewSessionDTO } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

function safePct(current: number, total: number) {
  if (!total) return 0;
  return Math.max(0, Math.min(100, Math.round((current / total) * 100)));
}

function formatDuration(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function pickAudioMimeType() {
  if (typeof window === 'undefined') return '';
  const mr = (window as { MediaRecorder?: typeof MediaRecorder }).MediaRecorder;
  if (!mr?.isTypeSupported) return '';
  if (mr.isTypeSupported('audio/webm;codecs=opus')) return 'audio/webm;codecs=opus';
  if (mr.isTypeSupported('audio/webm')) return 'audio/webm';
  if (mr.isTypeSupported('audio/mp4')) return 'audio/mp4';
  return '';
}

export default function InterviewSession() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { sessionId } = useParams();

  const token = localStorage.getItem("token");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  const [session, setSession] = useState<InterviewSessionDTO | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<InterviewQuestionDTO | null>(null);
  const [answer, setAnswer] = useState<string>("");

  const [answerMode, setAnswerMode] = useState<'text' | 'voice'>('text');
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'recording' | 'stopped' | 'uploading'>('idle');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [transcription, setTranscription] = useState<string>('');
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedDuration, setRecordedDuration] = useState<number>(0);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const ttsObjectUrlRef = useRef<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const recordTimerRef = useRef<number | null>(null);
  const recordStartedAtRef = useRef<number>(0);

  const startedAtRef = useRef<number>(Date.now());
  const didAutoCompleteRef = useRef(false);

  const answeredCount = useMemo(() => {
    const qs: InterviewQuestionDTO[] = session?.questions || [];
    return qs.filter((q) => (q.answer || "").trim()).length;
  }, [session]);

  const totalTarget = session?.questionsTarget || 5;
  const questionNumber = session?.status === 'in-progress'
    ? Math.min(answeredCount + 1, totalTarget)
    : totalTarget;

  const resetPerQuestionUI = useCallback(() => {
    setAnswer('');
    setTranscription('');
    setRecordedBlob(null);
    setRecordedDuration(0);
    setError('');
  }, []);

  const findActiveQuestion = (s: InterviewSessionDTO | null): InterviewQuestionDTO | null => {
    const qs: InterviewQuestionDTO[] = s?.questions || [];
    const open = qs.find((q) => !(q.answer || "").trim());
    return open || (qs.length ? qs[qs.length - 1] : null);
  };

  useEffect(() => {
    if (!token) {
      navigate("/student/login");
      return;
    }
    if (!sessionId) {
      navigate("/student/interview");
      return;
    }

    const run = async () => {
      setIsLoading(true);
      setError("");
      try {
        const res = await interviewApi.getSession(sessionId, token);
        setSession(res.session);
        const q = findActiveQuestion(res.session);
        setCurrentQuestion(q);
        resetPerQuestionUI();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load session");
      } finally {
        setIsLoading(false);
      }
    };

    run();
  }, [navigate, resetPerQuestionUI, sessionId, token]);

  useEffect(() => {
    // When question changes, clear any previous input/transcription
    resetPerQuestionUI();
  }, [currentQuestion?.id, resetPerQuestionUI]);

  const cleanupRecorder = useCallback(() => {
    if (recordTimerRef.current) {
      window.clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    try {
      mediaRecorderRef.current?.stop();
    } catch {
      // ignore
    }
    mediaRecorderRef.current = null;

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }

    audioChunksRef.current = [];
    recordStartedAtRef.current = 0;
    setRecordingSeconds(0);
  }, []);

  useEffect(() => {
    return () => cleanupRecorder();
  }, [cleanupRecorder]);

  useEffect(() => {
    return () => {
      try {
        ttsAudioRef.current?.pause();
      } catch {
        // ignore
      }
      ttsAudioRef.current = null;
      if (ttsObjectUrlRef.current) {
        URL.revokeObjectURL(ttsObjectUrlRef.current);
        ttsObjectUrlRef.current = null;
      }
    };
  }, []);

  const complete = useCallback(async () => {
    if (!token || !sessionId) return;

    const durationMinutes = Math.max(0, Math.round((Date.now() - startedAtRef.current) / 60000));
    try {
      const res = await interviewApi.completeSession(sessionId, { durationMinutes }, token);
      toast({
        title: "Session completed",
        description: `Overall score: ${res.overallScore}`,
      });
      const refreshed = await interviewApi.getSession(sessionId, token);
      setSession(refreshed.session);
      setCurrentQuestion(null);
    } catch (e: unknown) {
      toast({
        title: "Complete failed",
        description: e instanceof Error ? e.message : "Failed to complete session",
        variant: "destructive",
      });
    }
  }, [sessionId, toast, token]);

  useEffect(() => {
    if (!session) return;
    if (session.status !== "in-progress") return;
    if (didAutoCompleteRef.current) return;

    const target = Number(session.questionsTarget) || 0;
    if (target && answeredCount >= target) {
      didAutoCompleteRef.current = true;
      complete();
    }
  }, [answeredCount, complete, session]);

  const submit = async () => {
    if (!token) {
      navigate("/student/login");
      return;
    }
    if (!sessionId) {
      navigate("/student/interview");
      return;
    }
    if (!currentQuestion?.id) {
      setError("No active question found");
      return;
    }
    if (!answer.trim()) {
      setError("Answer is required");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const res = await interviewApi.submitAnswerText(
        sessionId,
        { questionId: currentQuestion.id, answer: answer.trim(), language: "en" },
        token
      );

      setAnswer("");

      const refreshed = await interviewApi.getSession(sessionId, token);
      setSession(refreshed.session);
      setCurrentQuestion(findActiveQuestion(refreshed.session));

      if (res.done) {
        await complete();
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to submit answer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitVoiceAnswer = useCallback(async (blob: Blob, durationSeconds: number) => {
    if (!token) {
      navigate('/student/login');
      return;
    }
    if (!sessionId) {
      navigate('/student/interview');
      return;
    }
    if (!currentQuestion?.id) {
      setError('No active question found');
      return;
    }

    setVoiceStatus('uploading');
    setIsSubmitting(true);
    setError('');

    try {
      const mimeType = blob.type || pickAudioMimeType() || 'audio/webm';
      const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
      const file = new File([blob], `answer.${ext}`, { type: mimeType });

      const formData = new FormData();
      formData.append('audio', file);
      formData.append('questionId', currentQuestion.id);
      formData.append('answerMethod', 'voice');
      formData.append('language', 'en');
      formData.append('durationSeconds', String(Math.max(0, Math.round(durationSeconds))));

      const res = await interviewApi.submitAnswerVoice(sessionId, formData, token);
      
      // Show transcription immediately
      setTranscription(res.transcription || '');
      
      // Delete audio immediately after transcription (client-side)
      audioChunksRef.current = [];
      setRecordedBlob(null);
      
      // Move to 'stopped' state so user can review transcription before clicking Next
      setVoiceStatus('stopped');
      setIsSubmitting(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to submit voice answer');
      setVoiceStatus('idle');
      setIsSubmitting(false);
    }
  }, [currentQuestion?.id, navigate, sessionId, token]);

  const moveToNextQuestion = useCallback(async () => {
    if (!token) {
      navigate('/student/login');
      return;
    }
    if (!sessionId) {
      navigate('/student/interview');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Refresh session to get the updated questions (backend already processed the answer)
      const refreshed = await interviewApi.getSession(sessionId, token);
      setSession(refreshed.session);
      setCurrentQuestion(findActiveQuestion(refreshed.session));

      // Check if session is complete
      if (refreshed.session.status === 'completed') {
        await complete();
      }
      
      setVoiceStatus('idle');
      setTranscription('');
      setRecordedDuration(0);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load next question');
    } finally {
      setIsSubmitting(false);
    }
  }, [complete, navigate, sessionId, token]);

  const startRecording = async () => {
    if (voiceStatus !== 'idle') return;
    if (!currentQuestion?.id) {
      setError('No active question found');
      return;
    }

    // Stop TTS if speaking
    stopSpeaking();

    setError('');
    setTranscription('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const mimeType = pickAudioMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const chunks = audioChunksRef.current;
        const type = mimeType || recorder.mimeType || 'audio/webm';
        const blob = new Blob(chunks, { type });

        // Stop mic immediately
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((t) => t.stop());
          mediaStreamRef.current = null;
        }

        if (recordTimerRef.current) {
          window.clearInterval(recordTimerRef.current);
          recordTimerRef.current = null;
        }

        const duration = recordingSeconds || Math.max(0, Math.round((Date.now() - recordStartedAtRef.current) / 1000));
        setRecordingSeconds(duration);
        setRecordedBlob(blob);
        setRecordedDuration(duration);
        
        // Submit and transcribe immediately (backend processes it but we show transcription first)
        await submitVoiceAnswer(blob, duration);
      };

      recordStartedAtRef.current = Date.now();
      setRecordingSeconds(0);
      setVoiceStatus('recording');
      recorder.start(250);

      recordTimerRef.current = window.setInterval(() => {
        const seconds = Math.max(0, Math.round((Date.now() - recordStartedAtRef.current) / 1000));
        setRecordingSeconds(seconds);
      }, 250);
    } catch (e: unknown) {
      cleanupRecorder();
      setVoiceStatus('idle');
      setError(e instanceof Error ? e.message : 'Microphone permission is required');
    }
  };

  const stopAndSendRecording = () => {
    if (voiceStatus !== 'recording') return;
    try {
      mediaRecorderRef.current?.stop();
    } catch {
      cleanupRecorder();
      setVoiceStatus('idle');
    }
  };

  const speakQuestion = async () => {
    if (!token) {
      navigate('/student/login');
      return;
    }
    if (!currentQuestion?.question?.trim()) return;

    setIsSpeaking(true);
    setError('');
    try {
      const audioBuf = await ttsApi.synthesize(
        {
          text: currentQuestion.question,
          model: 'canopylabs/orpheus-v1-english',
          voice: 'troy',
          responseFormat: 'wav',
        },
        token
      );

      const blob = new Blob([audioBuf], { type: 'audio/wav' });
      if (ttsObjectUrlRef.current) {
        URL.revokeObjectURL(ttsObjectUrlRef.current);
      }
      const url = URL.createObjectURL(blob);
      ttsObjectUrlRef.current = url;

      if (!ttsAudioRef.current) {
        ttsAudioRef.current = new Audio();
      }
      const audio = ttsAudioRef.current;
      audio.src = url;
      audio.onended = () => setIsSpeaking(false);
      audio.onerror = () => setIsSpeaking(false);
      await audio.play();
    } catch (e: unknown) {
      setIsSpeaking(false);
      const errorMsg = e instanceof Error ? e.message : 'Failed to generate speech';
      toast({
        title: "TTS unavailable",
        description: errorMsg.includes('terms acceptance') 
          ? 'Text-to-speech requires model terms acceptance. You can continue without it.'
          : errorMsg,
        variant: "destructive",
      });
    }
  };

  // Stop TTS playback
  const stopSpeaking = () => {
    if (ttsAudioRef.current) {
      ttsAudioRef.current.pause();
      ttsAudioRef.current.currentTime = 0;
    }
    setIsSpeaking(false);
  };

  const statusBadgeVariant = (status?: string) => {
    if (status === "completed") return "secondary" as const;
    if (status === "in-progress") return "outline" as const;
    return "outline" as const;
  };

  return (
    <div className="min-h-screen bg-background">
      <StudentNavbar />
      <div className="container mx-auto px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex items-start justify-between gap-6 flex-col lg:flex-row"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold tracking-tight">Interview Session</h2>
              <Badge variant={statusBadgeVariant(session?.status)}>{session?.status || "—"}</Badge>
            </div>
            <p className="text-muted-foreground">
              {session?.targetRole ? `Target: ${session.targetRole}` : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => navigate("/student/interview")}
              className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
        </motion.div>

        {error ? (
          <div className="mt-6">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-4 flex-wrap">
                <span>Question</span>
                <span className="text-sm text-muted-foreground">
                  {questionNumber}/{totalTarget}
                </span>
              </CardTitle>
              <CardDescription>
                {session?.difficulty ? `Difficulty: ${session.difficulty}` : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={safePct(answeredCount, totalTarget)} />

              {isLoading ? (
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading…
                </div>
              ) : session?.status !== "in-progress" ? (
                <div className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-2 font-semibold">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      Completed
                    </div>
                    <div className="mt-2 space-y-1 text-sm">
                      <div className="text-muted-foreground">
                        Overall score: <span className="font-semibold text-foreground">{session?.summary?.overallScore ?? 0}</span>
                      </div>
                      {session?.summary?.categoryScores && (
                        <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                          {session.summary.categoryScores.technical ? (
                            <div className="text-muted-foreground">
                              Technical: <span className="font-medium text-foreground">{session.summary.categoryScores.technical}</span>
                            </div>
                          ) : null}
                          {session.summary.categoryScores.behavioral ? (
                            <div className="text-muted-foreground">
                              Behavioral: <span className="font-medium text-foreground">{session.summary.categoryScores.behavioral}</span>
                            </div>
                          ) : null}
                          {session.summary.categoryScores.communication ? (
                            <div className="text-muted-foreground">
                              Communication: <span className="font-medium text-foreground">{session.summary.categoryScores.communication}</span>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Session Review</CardTitle>
                      <CardDescription>Questions, your answers, and feedback</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {(session?.questions || []).map((q: InterviewQuestionDTO, i: number) => (
                        <div key={q.id} className="rounded-lg border p-4 space-y-3">
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="font-semibold">Q{i + 1}: {q.question}</div>
                            <Badge variant="outline">{q.type}</Badge>
                          </div>
                          {q.context ? (
                            <div className="text-sm text-muted-foreground">{q.context}</div>
                          ) : null}
                          <Separator />
                          <div className="space-y-2">
                            <div className="text-xs text-muted-foreground">Your answer</div>
                            <div className="whitespace-pre-wrap text-sm">{q.answer?.trim() ? q.answer : "—"}</div>
                          </div>
                          {q.feedback ? (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="text-xs text-muted-foreground">Feedback</div>
                                <div className="text-xs">Score: <span className="font-semibold">{q.feedback.score ?? 0}</span></div>
                              </div>
                              {(q.feedback.strengths || []).length ? (
                                <div className="text-sm">
                                  <span className="font-semibold">Strengths:</span> {(q.feedback.strengths || []).join(" • ")}
                                </div>
                              ) : null}
                              {(q.feedback.improvements || []).length ? (
                                <div className="text-sm">
                                  <span className="font-semibold">Improvements:</span> {(q.feedback.improvements || []).join(" • ")}
                                </div>
                              ) : null}
                              {q.feedback.sampleAnswer ? (
                                <div className="text-sm">
                                  <span className="font-semibold">Sample answer:</span>
                                  <div className="mt-1 whitespace-pre-wrap text-muted-foreground">{q.feedback.sampleAnswer}</div>
                                </div>
                              ) : null}
                              {q.feedback.communication ? (
                                <div className="mt-2 pt-2 border-t space-y-1">
                                  <div className="text-xs font-semibold">Communication</div>
                                  <div className="grid grid-cols-3 gap-2 text-xs">
                                    <div>Clarity: <span className="font-medium">{q.feedback.communication.clarity ?? 0}</span></div>
                                    <div>Structure: <span className="font-medium">{q.feedback.communication.structure ?? 0}</span></div>
                                    <div>Conciseness: <span className="font-medium">{q.feedback.communication.conciseness ?? 0}</span></div>
                                  </div>
                                  {(q.feedback.communication.feedback || []).length ? (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {(q.feedback.communication.feedback || []).join(" • ")}
                                    </div>
                                  ) : null}
                                </div>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              ) : !currentQuestion ? (
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  No active question.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="font-semibold">{currentQuestion.question}</div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{currentQuestion.type}</Badge>
                        {currentQuestion.category ? <Badge variant="secondary">{currentQuestion.category}</Badge> : null}
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={isSpeaking ? stopSpeaking : speakQuestion}
                        >
                          {isSpeaking ? (
                            <>
                              <Square className="h-4 w-4" />
                              Stop
                            </>
                          ) : (
                            <>
                              <Volume2 className="h-4 w-4" />
                              Listen
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    {currentQuestion.context ? (
                      <div className="mt-2 text-sm text-muted-foreground">{currentQuestion.context}</div>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Your answer</div>
                    <Tabs value={answerMode} onValueChange={(v) => setAnswerMode(v as 'text' | 'voice')}>
                      <TabsList>
                        <TabsTrigger value="text">Text</TabsTrigger>
                        <TabsTrigger value="voice">Voice</TabsTrigger>
                      </TabsList>

                      <TabsContent value="text" className="space-y-2">
                        <Textarea
                          value={answer}
                          onChange={(e) => setAnswer(e.target.value)}
                          onFocus={stopSpeaking}
                          placeholder="Type your answer…"
                          className="min-h-[180px]"
                          disabled={isSubmitting}
                        />
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div className="text-xs text-muted-foreground">
                            Tip: be concise, then add tradeoffs and edge cases.
                          </div>
                          <Button onClick={submit} disabled={isSubmitting} className="gap-2">
                            {isSubmitting ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Processing…
                              </>
                            ) : (
                              <>
                                <Send className="h-4 w-4" />
                                Next
                              </>
                            )}
                          </Button>
                        </div>
                      </TabsContent>

                      <TabsContent value="voice" className="space-y-3">
                        <div className="rounded-lg border p-4">
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-2">
                              <Mic className="h-4 w-4 text-muted-foreground" />
                              <div className="font-medium">Voice recording</div>
                              <Badge variant={voiceStatus === 'recording' ? 'secondary' : voiceStatus === 'stopped' ? 'outline' : voiceStatus === 'uploading' ? 'default' : 'outline'}>
                                {voiceStatus === 'recording' ? 'Recording' : voiceStatus === 'stopped' ? 'Stopped' : voiceStatus === 'uploading' ? 'Transcribing' : 'Idle'}
                              </Badge>
                            </div>
                            <div className="text-sm font-mono">{formatDuration(recordingSeconds)}</div>
                          </div>
                          <div className="mt-3 flex items-center gap-2 flex-wrap">
                            {voiceStatus === 'idle' ? (
                              <Button onClick={startRecording} disabled={isSubmitting} className="gap-2">
                                <Mic className="h-4 w-4" />
                                Start recording
                              </Button>
                            ) : null}
                            {voiceStatus === 'recording' ? (
                              <Button onClick={stopAndSendRecording} disabled={isSubmitting} className="gap-2">
                                <Square className="h-4 w-4" />
                                Stop recording
                              </Button>
                            ) : null}
                            {voiceStatus === 'stopped' ? (
                              <Button onClick={moveToNextQuestion} disabled={isSubmitting || !transcription.trim()} className="gap-2">
                                {isSubmitting ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Loading…
                                  </>
                                ) : (
                                  <>
                                    <Send className="h-4 w-4" />
                                    Next
                                  </>
                                )}
                              </Button>
                            ) : null}
                            {voiceStatus === 'uploading' ? (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Transcribing…
                              </div>
                            ) : null}
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground">
                            {voiceStatus === 'stopped' 
                              ? 'Review your transcription, then click Next to continue.'
                              : 'Audio is transcribed immediately after recording. Not stored in the app.'
                            }
                          </div>
                        </div>

                        {transcription ? (
                          <div className="rounded-lg border p-4 space-y-2">
                            <div className="text-xs text-muted-foreground">Transcription</div>
                            <div className="whitespace-pre-wrap text-sm">{transcription}</div>
                          </div>
                        ) : null}
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Session Details</CardTitle>
                <CardDescription>Config + progress</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium">{session?.sessionType || "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Difficulty</span>
                  <span className="font-medium">{session?.difficulty || "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Persona</span>
                  <span className="font-medium">{session?.interviewerPersona || "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Answered</span>
                  <span className="font-medium">{answeredCount}/{totalTarget}</span>
                </div>
                {(session?.interviewTypes || []).length ? (
                  <div className="pt-2">
                    <div className="text-muted-foreground mb-2">Interview types</div>
                    <div className="flex gap-2 flex-wrap">
                      {session.interviewTypes.map((t: string) => (
                        <Badge key={t} variant="secondary">{t}</Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {session?.status === "in-progress" ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Finish</CardTitle>
                  <CardDescription>End early if needed</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" onClick={complete}>
                    Complete session
                  </Button>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
