import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { interviewApi, InterviewHistoryResponse, InterviewStatsResponse } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
    Mic,
    Play,
    Clock,
    Target,
    TrendingUp,
    Award,
    Calendar,
    ChevronRight,
    Settings,
    History,
    Sparkles,
    Zap,
    CheckCircle2,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress, ProgressRing } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface InterviewConfig {
    sessionType: 'quick' | 'full';
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    interviewerPersona: 'friendly' | 'neutral' | 'tough';
    targetRole: string;
    interviewTypes: string[];
}

const defaultConfig: InterviewConfig = {
    sessionType: 'quick',
    difficulty: 'intermediate',
    interviewerPersona: 'neutral',
    targetRole: 'Software Engineer',
    interviewTypes: ['technical', 'behavioral'],
};

const interviewTypeOptions = [
    { value: 'technical', label: 'Technical', description: 'DSA, System Design', icon: '💻' },
    { value: 'behavioral', label: 'Behavioral', description: 'STAR method questions', icon: '🎯' },
    { value: 'project', label: 'Project', description: 'Based on your projects', icon: '📂' },
    { value: 'tricky', label: 'Tricky', description: 'Edge cases & puzzles', icon: '🧩' },
];

const difficultyOptions = [
    { value: 'beginner', label: 'Beginner', color: 'text-success', bg: 'bg-success/10 border-success/20' },
    { value: 'intermediate', label: 'Intermediate', color: 'text-warning', bg: 'bg-warning/10 border-warning/20' },
    { value: 'advanced', label: 'Advanced', color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20' },
];

const personaOptions = [
    { value: 'friendly', label: 'Friendly', description: 'Encouraging and supportive', emoji: '😊' },
    { value: 'neutral', label: 'Neutral', description: 'Professional and balanced', emoji: '🎯' },
    { value: 'tough', label: 'Tough', description: 'Challenging and direct', emoji: '💪' },
];

function StatsCard({ stats }: { stats: InterviewStatsResponse['interviewStats'] }) {
    return (
        <Card variant="bento">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-primary/10">
                        <Target className="w-4 h-4 text-primary" />
                    </div>
                    <CardTitle className="text-base">Your Performance</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Main Score */}
                <div className="flex justify-center py-2">
                    <ProgressRing
                        value={stats?.avgScore || 0}
                        size={100}
                        strokeWidth={8}
                        variant="gradient"
                    >
                        <div className="text-center">
                            <span className="text-2xl font-bold">{stats?.avgScore?.toFixed(0) || 0}</span>
                            <span className="text-xs text-muted-foreground">%</span>
                        </div>
                    </ProgressRing>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 rounded-lg bg-muted/30 border border-border/50">
                        <p className="text-xl font-bold">{stats?.completedSessions || 0}</p>
                        <p className="text-xs text-muted-foreground">Sessions</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/30 border border-border/50">
                        <p className="text-xl font-bold">{stats?.bestScore || 0}%</p>
                        <p className="text-xs text-muted-foreground">Best Score</p>
                    </div>
                </div>

                <div className="text-center p-3 rounded-lg bg-muted/30 border border-border/50">
                    <p className="text-xl font-bold">{stats?.totalQuestionsAnswered || 0}</p>
                    <p className="text-xs text-muted-foreground">Questions Answered</p>
                </div>

                {stats?.trend && (
                    <div className={cn(
                        "flex items-center justify-center gap-2 p-2 rounded-lg text-sm font-medium",
                        stats.trend === 'improving' 
                            ? 'bg-success/10 text-success border border-success/20' 
                            : 'bg-muted/50 text-muted-foreground'
                    )}>
                        <TrendingUp className="w-4 h-4" />
                        <span className="capitalize">{stats.trend}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function HistoryList({ history }: { history: InterviewHistoryResponse['items'] }) {
    const navigate = useNavigate();

    if (history.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/30 flex items-center justify-center">
                    <History className="w-8 h-8 opacity-50" />
                </div>
                <p className="font-medium">No interview sessions yet</p>
                <p className="text-sm">Start your first mock interview!</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {history.map((session, index) => (
                <motion.div
                    key={session._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-all border border-transparent hover:border-border/50 group"
                    onClick={() => navigate(`/student/interview/session/${session._id}/results`)}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                'w-9 h-9 rounded-lg flex items-center justify-center',
                                session.status === 'completed' 
                                    ? 'bg-success/10 border border-success/20' 
                                    : 'bg-warning/10 border border-warning/20'
                            )}>
                                <Mic className={cn(
                                    'w-4 h-4',
                                    session.status === 'completed' ? 'text-success' : 'text-warning'
                                )} />
                            </div>
                            <div>
                                <p className="font-medium text-sm group-hover:text-primary transition-colors">{session.targetRole}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <Badge variant="secondary" size="sm">
                                        {session.sessionType}
                                    </Badge>
                                    <Badge 
                                        variant="secondary" 
                                        size="sm"
                                        className={difficultyOptions.find(d => d.value === session.difficulty)?.color}
                                    >
                                        {session.difficulty}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                        <div className="text-right flex items-center gap-2">
                            <div>
                                <p className="font-semibold text-sm">
                                    {session.summary?.overallScore ? `${session.summary.overallScore}%` : '-'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {session.createdAt ? new Date(session.createdAt).toLocaleDateString() : ''}
                                </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}

export default function InterviewPage() {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [config, setConfig] = useState<InterviewConfig>(defaultConfig);
    const [isStarting, setIsStarting] = useState(false);

    const { data: stats, isLoading: statsLoading } = useQuery<InterviewStatsResponse>({
        queryKey: ['interview-stats'],
        queryFn: () => interviewApi.getStats(token!),
        enabled: !!token,
    });

    const { data: history, isLoading: historyLoading } = useQuery<InterviewHistoryResponse>({
        queryKey: ['interview-history'],
        queryFn: () => interviewApi.getHistory({ limit: 5 }, token!),
        enabled: !!token,
    });

    const handleStartInterview = async () => {
        setIsStarting(true);
        try {
            const response = await interviewApi.startSession({
                sessionType: config.sessionType,
                difficulty: config.difficulty,
                interviewerPersona: config.interviewerPersona,
                targetRole: config.targetRole,
                interviewTypes: config.interviewTypes,
            }, token!);

            navigate(`/student/interview/session/${response.sessionId}`, {
                state: { sessionData: response },
            });
        } catch (error: any) {
            toast.error(error.message || 'Failed to start interview');
            setIsStarting(false);
        }
    };

    const toggleInterviewType = (type: string) => {
        setConfig(prev => ({
            ...prev,
            interviewTypes: prev.interviewTypes.includes(type)
                ? prev.interviewTypes.filter(t => t !== type)
                : [...prev.interviewTypes, type],
        }));
    };

    return (
        <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4"
            >
                <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-glow">
                    <Mic className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold">AI Mock Interview</h1>
                    <p className="text-muted-foreground text-sm">
                        Practice interviews with real-time AI feedback
                    </p>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Configuration Panel */}
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-2 space-y-6"
                >
                    <Card variant="bento">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-muted">
                                    <Settings className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <CardTitle className="text-base">Configure Your Interview</CardTitle>
                                    <CardDescription className="text-xs">Customize your practice session</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Session Type */}
                            <div className="space-y-3">
                                <label className="text-sm font-medium">Session Type</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { value: 'quick', label: 'Quick Session', desc: '5 questions, ~10 min', icon: <Zap className="w-4 h-4" /> },
                                        { value: 'full', label: 'Full Session', desc: '15 questions, ~30 min', icon: <Clock className="w-4 h-4" /> },
                                    ].map((type) => (
                                        <button
                                            key={type.value}
                                            type="button"
                                            onClick={() => setConfig(prev => ({ ...prev, sessionType: type.value as 'quick' | 'full' }))}
                                            className={cn(
                                                'p-4 rounded-xl border text-left transition-all',
                                                config.sessionType === type.value
                                                    ? 'border-primary bg-primary/5 shadow-sm'
                                                    : 'border-border/50 hover:border-primary/50 hover:bg-muted/30'
                                            )}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={cn(
                                                    config.sessionType === type.value ? 'text-primary' : 'text-muted-foreground'
                                                )}>
                                                    {type.icon}
                                                </span>
                                                <span className="font-medium">{type.label}</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground">{type.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Interview Types */}
                            <div className="space-y-3">
                                <label className="text-sm font-medium">Interview Types</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {interviewTypeOptions.map((type) => (
                                        <button
                                            key={type.value}
                                            type="button"
                                            onClick={() => toggleInterviewType(type.value)}
                                            className={cn(
                                                'p-3 rounded-xl border text-left transition-all relative overflow-hidden',
                                                config.interviewTypes.includes(type.value)
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-border/50 hover:border-primary/50 hover:bg-muted/30'
                                            )}
                                        >
                                            {config.interviewTypes.includes(type.value) && (
                                                <div className="absolute top-2 right-2">
                                                    <CheckCircle2 className="w-4 h-4 text-primary" />
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-base">{type.icon}</span>
                                                <span className="font-medium text-sm">{type.label}</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground">{type.description}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Difficulty & Persona */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Difficulty</label>
                                    <Select
                                        value={config.difficulty}
                                        onValueChange={(v) => setConfig(prev => ({ ...prev, difficulty: v as any }))}
                                    >
                                        <SelectTrigger className="h-11">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {difficultyOptions.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    <span className={opt.color}>{opt.label}</span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Interviewer Style</label>
                                    <Select
                                        value={config.interviewerPersona}
                                        onValueChange={(v) => setConfig(prev => ({ ...prev, interviewerPersona: v as any }))}
                                    >
                                        <SelectTrigger className="h-11">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {personaOptions.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    <span className="flex items-center gap-2">
                                                        <span>{opt.emoji}</span>
                                                        <span>{opt.label}</span>
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Target Role */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Target Role</label>
                                <Select
                                    value={config.targetRole}
                                    onValueChange={(v) => setConfig(prev => ({ ...prev, targetRole: v }))}
                                >
                                    <SelectTrigger className="h-11">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[
                                            'Software Engineer',
                                            'Frontend Developer',
                                            'Backend Developer',
                                            'Full Stack Developer',
                                            'Data Scientist',
                                            'Product Manager',
                                            'DevOps Engineer',
                                        ].map((role) => (
                                            <SelectItem key={role} value={role}>{role}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Start Button */}
                            <Button
                                size="lg"
                                variant="gradient"
                                className="w-full h-12 text-base"
                                onClick={handleStartInterview}
                                disabled={isStarting || config.interviewTypes.length === 0}
                            >
                                {isStarting ? (
                                    <span className="flex items-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Starting Interview...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <Play className="w-5 h-5" />
                                        Start Interview
                                    </span>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Sidebar */}
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-6"
                >
                    {/* Stats */}
                    {statsLoading ? (
                        <Card variant="bento">
                            <CardContent className="p-6">
                                <Skeleton className="h-48 w-full" />
                            </CardContent>
                        </Card>
                    ) : stats?.interviewStats ? (
                        <StatsCard stats={stats.interviewStats} />
                    ) : null}

                    {/* Recent History */}
                    <Card variant="bento">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-muted">
                                    <History className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <CardTitle className="text-base">Recent Sessions</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {historyLoading ? (
                                <div className="space-y-2">
                                    {[1, 2, 3].map((i) => (
                                        <Skeleton key={i} className="h-14 w-full" />
                                    ))}
                                </div>
                            ) : (
                                <HistoryList history={history?.items || []} />
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
