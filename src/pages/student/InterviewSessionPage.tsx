import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { interviewApi, InterviewQuestionDTO, InterviewAnswerResponse } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
    Mic,
    MicOff,
    Send,
    Clock,
    ChevronRight,
    AlertCircle,
    CheckCircle,
    Loader2,
    X,
    Volume2,
    Sparkles,
    Target,
    ArrowRight,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress, ProgressRing } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

export default function InterviewSessionPage() {
    const { sessionId } = useParams<{ sessionId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { token } = useAuth();

    const [currentQuestion, setCurrentQuestion] = useState<InterviewQuestionDTO | null>(
        location.state?.sessionData?.question || null
    );
    const [progress, setProgress] = useState(
        location.state?.sessionData?.progress || { current: 1, total: 5 }
    );
    const [answer, setAnswer] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<InterviewAnswerResponse['feedback'] | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [showExitDialog, setShowExitDialog] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Start timer
    useEffect(() => {
        timerRef.current = setInterval(() => {
            setElapsedTime((prev) => prev + 1);
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    // Fetch session if coming directly
    const { data: sessionData, isLoading } = useQuery({
        queryKey: ['interview-session', sessionId],
        queryFn: () => interviewApi.getSession(sessionId!, token!),
        enabled: !!sessionId && !!token && !currentQuestion,
    });

    useEffect(() => {
        if (sessionData?.session) {
            const session = sessionData.session;
            const currentIdx = session.currentQuestionIndex;
            if (session.questions[currentIdx]) {
                setCurrentQuestion(session.questions[currentIdx]);
                setProgress({
                    current: currentIdx + 1,
                    total: session.questionsTarget,
                });
            }
        }
    }, [sessionData]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSubmitAnswer = async () => {
        if (!answer.trim() || !currentQuestion || !sessionId) return;

        setIsSubmitting(true);
        try {
            const response = await interviewApi.submitAnswerText(
                sessionId,
                { questionId: currentQuestion.id, answer: answer.trim() },
                token!
            );

            setFeedback(response.feedback);
            setShowFeedback(true);

            if (response.done) {
                // Complete the session
                await interviewApi.completeSession(sessionId, { durationMinutes: Math.floor(elapsedTime / 60) }, token!);
            } else if (response.nextQuestion) {
                // Store next question for after feedback
                setCurrentQuestion(response.nextQuestion);
                setProgress(response.progress);
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to submit answer');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleNextQuestion = () => {
        setShowFeedback(false);
        setFeedback(null);
        setAnswer('');

        // Check if interview is complete
        if (progress.current >= progress.total) {
            navigate(`/student/interview/session/${sessionId}/results`);
        }
    };

    const handleExit = async () => {
        if (sessionId && token) {
            try {
                await interviewApi.completeSession(sessionId, { durationMinutes: Math.floor(elapsedTime / 60) }, token);
            } catch (e) {
                // Ignore errors on exit
            }
        }
        navigate('/student/interview');
    };

    const progressPercent = (progress.current / progress.total) * 100;
    const scorePercent = feedback?.score || 0;
    const scoreColor = scorePercent >= 70 ? 'text-emerald-400' : scorePercent >= 50 ? 'text-amber-400' : 'text-red-400';

    if (isLoading || !currentQuestion) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent" />
                <div className="text-center space-y-4 relative">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                    <p className="text-muted-foreground">Loading interview...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Subtle gradient background */}
            <div className="fixed inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent pointer-events-none" />
            
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 h-16 bg-card/80 backdrop-blur-xl border-b border-border/50 z-50">
                <div className="h-full max-w-5xl mx-auto px-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowExitDialog(true)}
                            className="hover:bg-destructive/10 hover:text-destructive"
                        >
                            <X className="w-5 h-5" />
                        </Button>
                        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-muted/50">
                            <Clock className="w-4 h-4 text-primary" />
                            <span className="font-mono font-medium">{formatTime(elapsedTime)}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground">
                                Question <span className="text-foreground font-medium">{progress.current}</span> of {progress.total}
                            </span>
                            <div className="relative w-32">
                                <Progress value={progressPercent} className="h-2" />
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="pt-24 pb-8 px-4 max-w-4xl mx-auto relative">
                <AnimatePresence mode="wait">
                    {!showFeedback ? (
                        <motion.div
                            key="question"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-6"
                        >
                            {/* Question Card */}
                            <Card variant="bento" className="relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
                                <CardHeader className="relative">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Badge className="bg-primary/15 text-primary border-primary/30 capitalize">
                                            {currentQuestion.type}
                                        </Badge>
                                        {currentQuestion.category && (
                                            <Badge variant="outline" className="capitalize border-border/50">
                                                {currentQuestion.category}
                                            </Badge>
                                        )}
                                    </div>
                                    <CardTitle className="text-xl lg:text-2xl leading-relaxed font-semibold">
                                        {currentQuestion.question}
                                    </CardTitle>
                                </CardHeader>
                                {currentQuestion.context && (
                                    <CardContent className="relative pt-0">
                                        <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                                            <p className="text-sm text-muted-foreground italic leading-relaxed">
                                                {currentQuestion.context}
                                            </p>
                                        </div>
                                    </CardContent>
                                )}
                            </Card>

                            {/* Answer Input */}
                            <Card variant="bento" className="overflow-hidden">
                                <CardContent className="p-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-primary" />
                                            Your Answer
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant={isRecording ? "destructive" : "outline"}
                                                size="sm"
                                                onClick={() => setIsRecording(!isRecording)}
                                                disabled
                                                className="border-border/50"
                                            >
                                                {isRecording ? (
                                                    <><MicOff className="w-4 h-4 mr-2" /> Stop</>
                                                ) : (
                                                    <><Mic className="w-4 h-4 mr-2" /> Voice</>
                                                )}
                                            </Button>
                                        </div>
                                    </div>

                                    <Textarea
                                        ref={textareaRef}
                                        value={answer}
                                        onChange={(e) => setAnswer(e.target.value)}
                                        placeholder="Type your answer here... Be thorough and structured."
                                        className="min-h-[200px] resize-none text-base bg-muted/30 border-border/50 focus:border-primary/50 focus:ring-primary/20"
                                        disabled={isSubmitting}
                                    />

                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-muted-foreground">
                                            <span className={cn(answer.length > 0 && 'text-foreground font-medium')}>
                                                {answer.length}
                                            </span> characters
                                        </p>
                                        <Button
                                            variant="gradient"
                                            size="lg"
                                            onClick={handleSubmitAnswer}
                                            disabled={!answer.trim() || isSubmitting}
                                            className="min-w-[160px]"
                                        >
                                            {isSubmitting ? (
                                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</>
                                            ) : (
                                                <><Send className="w-4 h-4 mr-2" /> Submit Answer</>
                                            )}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="feedback"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-6"
                            variants={containerVariants}
                        >
                            {/* Score Card */}
                            <motion.div variants={itemVariants}>
                                <Card variant="bento" className="overflow-hidden">
                                    {/* Score Header */}
                                    <div className={cn(
                                        'p-8 text-center relative overflow-hidden',
                                        scorePercent >= 70
                                            ? 'bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-transparent'
                                            : scorePercent >= 50
                                                ? 'bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-transparent'
                                                : 'bg-gradient-to-br from-red-500/20 via-red-500/10 to-transparent'
                                    )}>
                                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.05),transparent)]" />
                                        <div className="relative">
                                            <p className="text-sm text-muted-foreground mb-4">Your Score</p>
                                            <div className="flex justify-center mb-4">
                                                <ProgressRing
                                                    value={scorePercent}
                                                    size={120}
                                                    strokeWidth={8}
                                                    className={scoreColor}
                                                />
                                            </div>
                                            <p className={cn('text-lg font-medium', scoreColor)}>
                                                {scorePercent >= 70 ? 'Excellent!' : scorePercent >= 50 ? 'Good effort!' : 'Keep practicing!'}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <CardContent className="p-6 space-y-6">
                                        {/* Strengths */}
                                        {feedback?.strengths && feedback.strengths.length > 0 && (
                                            <div className="space-y-3">
                                                <h3 className="font-semibold flex items-center gap-2 text-emerald-400">
                                                    <div className="p-1.5 rounded-lg bg-emerald-500/15">
                                                        <CheckCircle className="w-4 h-4" />
                                                    </div>
                                                    Strengths
                                                </h3>
                                                <ul className="space-y-2">
                                                    {feedback.strengths.map((s, i) => (
                                                        <motion.li
                                                            key={i}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: i * 0.1 }}
                                                            className="text-sm text-muted-foreground pl-8 relative before:content-[''] before:absolute before:left-3 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-emerald-500/50"
                                                        >
                                                            {s}
                                                        </motion.li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Improvements */}
                                        {feedback?.improvements && feedback.improvements.length > 0 && (
                                            <div className="space-y-3">
                                                <h3 className="font-semibold flex items-center gap-2 text-amber-400">
                                                    <div className="p-1.5 rounded-lg bg-amber-500/15">
                                                        <Target className="w-4 h-4" />
                                                    </div>
                                                    Areas to Improve
                                                </h3>
                                                <ul className="space-y-2">
                                                    {feedback.improvements.map((s, i) => (
                                                        <motion.li
                                                            key={i}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: i * 0.1 + 0.3 }}
                                                            className="text-sm text-muted-foreground pl-8 relative before:content-[''] before:absolute before:left-3 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-amber-500/50"
                                                        >
                                                            {s}
                                                        </motion.li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Sample Answer */}
                                        {feedback?.sampleAnswer && (
                                            <div className="space-y-3">
                                                <h3 className="font-semibold flex items-center gap-2">
                                                    <div className="p-1.5 rounded-lg bg-primary/15">
                                                        <Sparkles className="w-4 h-4 text-primary" />
                                                    </div>
                                                    Suggested Answer
                                                </h3>
                                                <div className="p-4 rounded-xl bg-muted/30 border border-border/50 text-sm leading-relaxed text-muted-foreground">
                                                    {feedback.sampleAnswer}
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Next Button */}
                            <motion.div variants={itemVariants}>
                                <Button
                                    variant="gradient"
                                    size="lg"
                                    className="w-full h-14 text-base"
                                    onClick={handleNextQuestion}
                                >
                                    {progress.current >= progress.total ? (
                                        <>View Results</>
                                    ) : (
                                        <>Next Question <ArrowRight className="w-5 h-5 ml-2" /></>
                                    )}
                                </Button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Exit Dialog */}
            <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
                <AlertDialogContent className="border-border/50 bg-card">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Exit Interview?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Your progress will be saved. You can review your answers later.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border-border/50">Continue Interview</AlertDialogCancel>
                        <AlertDialogAction onClick={handleExit} className="bg-destructive hover:bg-destructive/90">
                            Exit & Save
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
