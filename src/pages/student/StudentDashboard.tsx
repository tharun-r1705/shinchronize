import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { studentApi, marketApi, interviewApi, StudentProfileDTO, InterviewStatsResponse } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
    TrendingUp,
    Target,
    Mic,
    Map,
    ArrowRight,
    Sparkles,
    Code,
    GitBranch,
    Award,
    Calendar,
    Brain,
    Zap,
    ChevronRight,
    Flame,
    Trophy,
    BookOpen,
    BarChart3,
    Clock,
    CheckCircle2,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress, ProgressRing } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.1,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { 
        opacity: 1, 
        y: 0,
        transition: {
            duration: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94] as const,
        }
    },
};

// Readiness Score Card with Large Ring
function ReadinessScoreCard({ score, isLoading }: { score: number; isLoading: boolean }) {
    const getScoreColor = (s: number) => {
        if (s >= 80) return 'success';
        if (s >= 60) return 'primary';
        if (s >= 40) return 'warning';
        return 'destructive';
    };

    const getScoreLabel = (s: number) => {
        if (s >= 80) return 'Excellent';
        if (s >= 60) return 'Good';
        if (s >= 40) return 'Fair';
        return 'Needs Work';
    };

    if (isLoading) {
        return (
            <Card variant="bento" className="row-span-2">
                <CardContent className="p-6 h-full flex flex-col items-center justify-center">
                    <Skeleton className="w-36 h-36 rounded-full" />
                    <Skeleton className="w-24 h-4 mt-4" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card variant="glow" className="row-span-2 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
            <CardContent className="p-6 h-full flex flex-col items-center justify-center relative">
                <div className="relative">
                    <ProgressRing
                        value={score}
                        size={160}
                        strokeWidth={12}
                        variant="gradient"
                        className="drop-shadow-[0_0_15px_hsl(var(--primary)/0.3)]"
                    >
                        <div className="text-center">
                            <motion.span
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.3, type: "spring" }}
                                className="text-4xl font-bold text-gradient"
                            >
                                {score}
                            </motion.span>
                            <span className="text-lg text-muted-foreground">/100</span>
                        </div>
                    </ProgressRing>
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5, type: "spring" }}
                        className="absolute -top-2 -right-2"
                    >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-glow">
                            <Target className="w-5 h-5 text-white" />
                        </div>
                    </motion.div>
                </div>
                
                <div className="mt-6 text-center space-y-1">
                    <h3 className="text-lg font-semibold">Placement Readiness</h3>
                    <Badge variant={getScoreColor(score) as "success" | "warning" | "default" | "destructive"} size="lg">
                        {getScoreLabel(score)}
                    </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground text-center mt-3 max-w-[200px]">
                    Keep improving your skills to increase your readiness score
                </p>
            </CardContent>
        </Card>
    );
}

// Streak Counter Card with Flame Effect
function StreakCard({ streak, isLoading }: { streak: number; isLoading: boolean }) {
    if (isLoading) {
        return (
            <Card variant="stat">
                <CardContent className="p-5">
                    <Skeleton className="w-full h-20" />
                </CardContent>
            </Card>
        );
    }

    const hasStreak = streak > 0;

    return (
        <Card variant="stat" className={cn(
            "overflow-hidden transition-all",
            hasStreak && "border-orange-500/30"
        )}>
            <div className={cn(
                "absolute inset-0 opacity-0 transition-opacity",
                hasStreak && "opacity-100 bg-gradient-to-br from-orange-500/10 via-transparent to-red-500/5"
            )} />
            <CardContent className="p-5 relative">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Current Streak</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold">{streak}</span>
                            <span className="text-sm text-muted-foreground">days</span>
                        </div>
                    </div>
                    <div className={cn(
                        "relative p-3 rounded-xl",
                        hasStreak 
                            ? "bg-gradient-to-br from-orange-500/20 to-red-500/20" 
                            : "bg-muted"
                    )}>
                        <Flame className={cn(
                            "w-6 h-6",
                            hasStreak ? "text-orange-500 animate-pulse" : "text-muted-foreground"
                        )} />
                        {hasStreak && streak >= 7 && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center"
                            >
                                <span className="text-[10px] font-bold text-white">{Math.floor(streak / 7)}</span>
                            </motion.div>
                        )}
                    </div>
                </div>
                {hasStreak && (
                    <div className="mt-3 flex items-center gap-2">
                        <Badge variant="streak" size="sm" icon={<Zap className="w-3 h-3" />}>
                            {streak >= 30 ? 'On Fire!' : streak >= 7 ? 'Hot Streak!' : 'Keep Going!'}
                        </Badge>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// Stat Card Component - Updated with new variants
interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ElementType;
    trend?: { value: number; label: string };
    variant?: 'default' | 'primary' | 'success' | 'accent';
    href?: string;
}

function StatCard({ title, value, subtitle, icon: Icon, trend, variant = 'default', href }: StatCardProps) {
    const navigate = useNavigate();
    
    const iconStyles = {
        default: 'bg-muted text-muted-foreground',
        primary: 'bg-primary/20 text-primary',
        success: 'bg-success/20 text-success',
        accent: 'bg-accent/20 text-accent',
    };

    const content = (
        <CardContent className="p-5">
            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-bold">{value}</span>
                        {subtitle && <span className="text-sm text-muted-foreground">{subtitle}</span>}
                    </div>
                    {trend && (
                        <div className={cn(
                            'flex items-center gap-1 text-xs font-medium',
                            trend.value >= 0 ? 'text-success' : 'text-destructive'
                        )}>
                            <TrendingUp className={cn('w-3 h-3', trend.value < 0 && 'rotate-180')} />
                            <span>{trend.value > 0 ? '+' : ''}{trend.value}% {trend.label}</span>
                        </div>
                    )}
                </div>
                <div className={cn('p-2.5 rounded-xl', iconStyles[variant])}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
        </CardContent>
    );

    if (href) {
        return (
            <Card 
                variant="interactive" 
                className="cursor-pointer"
                onClick={() => navigate(href)}
            >
                {content}
            </Card>
        );
    }

    return <Card variant="stat">{content}</Card>;
}

// Quick Action Card - Updated with new design
interface QuickActionProps {
    title: string;
    description: string;
    icon: React.ElementType;
    href: string;
    gradient: string;
    badge?: string;
}

function QuickActionCard({ title, description, icon: Icon, href, gradient, badge }: QuickActionProps) {
    const navigate = useNavigate();

    return (
        <motion.div
            whileHover={{ y: -4, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
            <Card
                onClick={() => navigate(href)}
                className="cursor-pointer border-0 overflow-hidden group relative"
            >
                <CardContent className={cn('p-5 text-white relative min-h-[140px] flex flex-col', gradient)}>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                    
                    <div className="relative z-10 flex-1">
                        <div className="flex items-start justify-between mb-3">
                            <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                                <Icon className="w-5 h-5" />
                            </div>
                            {badge && (
                                <Badge variant="gradient" size="sm" className="bg-white/20 border-0">
                                    {badge}
                                </Badge>
                            )}
                        </div>
                        <h3 className="font-semibold text-base mb-1">{title}</h3>
                        <p className="text-sm text-white/80 line-clamp-2">{description}</p>
                    </div>
                    
                    <div className="relative z-10 flex items-center gap-1 text-sm font-medium mt-3 text-white/90 group-hover:text-white transition-colors">
                        Get started 
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

// Coding Stats Widget - Redesigned
function CodingStatsWidget({ profile }: { profile: StudentProfileDTO }) {
    const leetcode = profile.leetcodeStats;
    const github = profile.githubStats;
    const totalProblems = (leetcode?.easy || 0) + (leetcode?.medium || 0) + (leetcode?.hard || 0);

    return (
        <Card variant="bento" className="h-full">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-primary/10">
                            <Code className="w-4 h-4 text-primary" />
                        </div>
                        <CardTitle className="text-base">Coding Activity</CardTitle>
                    </div>
                    <Badge variant="default" size="sm">
                        {totalProblems} solved
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* LeetCode Stats */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">LeetCode</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <div className="p-3 rounded-lg bg-success/10 border border-success/20 text-center">
                            <p className="text-lg font-bold text-success">{leetcode?.easy || 0}</p>
                            <p className="text-xs text-muted-foreground">Easy</p>
                        </div>
                        <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 text-center">
                            <p className="text-lg font-bold text-warning">{leetcode?.medium || 0}</p>
                            <p className="text-xs text-muted-foreground">Medium</p>
                        </div>
                        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-center">
                            <p className="text-lg font-bold text-destructive">{leetcode?.hard || 0}</p>
                            <p className="text-xs text-muted-foreground">Hard</p>
                        </div>
                    </div>
                </div>

                {/* GitHub Stats */}
                <div className="space-y-3 pt-3 border-t border-border/50">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">GitHub</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded bg-muted">
                                <GitBranch className="w-3.5 h-3.5 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold">{github?.totalRepos || 0}</p>
                                <p className="text-xs text-muted-foreground">Repos</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded bg-muted">
                                <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold">{github?.totalCommits || 0}</p>
                                <p className="text-xs text-muted-foreground">Commits</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded bg-muted">
                                <Flame className="w-3.5 h-3.5 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold">{github?.streak || 0}</p>
                                <p className="text-xs text-muted-foreground">Streak</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Top Domains */}
                {leetcode?.topDomains && leetcode.topDomains.length > 0 && (
                    <div className="pt-3 border-t border-border/50">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Top Domains</p>
                        <div className="flex flex-wrap gap-1.5">
                            {leetcode.topDomains.slice(0, 4).map((domain) => (
                                <Badge key={domain.tag} variant="secondary" size="sm">
                                    {domain.tag}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// Skill Market Widget - Redesigned
function SkillMarketWidget() {
    const { data: trends, isLoading } = useQuery({
        queryKey: ['market-trends'],
        queryFn: () => marketApi.getTrends(),
        staleTime: 5 * 60 * 1000,
    });

    if (isLoading) {
        return (
            <Card variant="bento" className="h-full">
                <CardHeader className="pb-3">
                    <Skeleton className="h-5 w-32" />
                </CardHeader>
                <CardContent className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-14 w-full" />
                    ))}
                </CardContent>
            </Card>
        );
    }

    const risingSkills = trends?.rising?.slice(0, 4) || [];

    return (
        <Card variant="bento" className="h-full">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-success/10">
                            <TrendingUp className="w-4 h-4 text-success" />
                        </div>
                        <CardTitle className="text-base">Trending Skills</CardTitle>
                    </div>
                    <Badge variant="success" size="sm">Hot</Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-2">
                {risingSkills.map((skill, index) => (
                    <motion.div
                        key={skill.skillName}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <span className={cn(
                                "w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center",
                                index === 0 ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white" :
                                index === 1 ? "bg-gradient-to-br from-slate-300 to-slate-400 text-slate-800" :
                                index === 2 ? "bg-gradient-to-br from-amber-600 to-amber-700 text-white" :
                                "bg-muted text-muted-foreground"
                            )}>
                                {index + 1}
                            </span>
                            <div>
                                <p className="font-medium text-sm group-hover:text-primary transition-colors">{skill.skillName}</p>
                                <p className="text-xs text-muted-foreground">{skill.category}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-semibold text-success">+{skill.yoyGrowth}%</p>
                            <p className="text-xs text-muted-foreground">{skill.jobCount} jobs</p>
                        </div>
                    </motion.div>
                ))}
                <Button variant="ghost" className="w-full mt-2" size="sm">
                    View All Skills <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
            </CardContent>
        </Card>
    );
}

// Interview Performance Widget - New
function InterviewPerformanceWidget({ stats }: { stats?: InterviewStatsResponse }) {
    const completed = stats?.interviewStats?.completedSessions || 0;
    const avgScore = stats?.interviewStats?.avgScore || 0;

    return (
        <Card variant="bento">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-purple-500/10">
                        <Mic className="w-4 h-4 text-purple-500" />
                    </div>
                    <CardTitle className="text-base">Mock Interviews</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-6">
                    <div className="flex-1">
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-bold">{completed}</span>
                            <span className="text-sm text-muted-foreground">sessions</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">completed</p>
                    </div>
                    <div className="h-12 w-px bg-border" />
                    <div className="flex-1">
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-bold">{avgScore.toFixed(0)}</span>
                            <span className="text-sm text-muted-foreground">%</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">avg score</p>
                    </div>
                </div>
                {completed > 0 && (
                    <div className="mt-4">
                        <Progress 
                            value={avgScore} 
                            variant="primary"
                            indicatorVariant="gradient"
                            size="sm"
                            className="bg-primary/10"
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// AI Mentor Tip Card - New
function AIMentorTipCard({ profile }: { profile?: StudentProfileDTO }) {
    const navigate = useNavigate();
    
    return (
        <Card variant="gradient" className="overflow-hidden">
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02]" />
            <CardContent className="p-5 relative">
                <div className="flex items-start gap-4">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-purple-500 shadow-glow flex-shrink-0">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm mb-2">Zenith AI Suggests</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Based on your profile, consider focusing on <span className="font-medium text-primary">System Design</span> concepts.
                            Companies are increasingly asking these in interviews.
                        </p>
                        <Button 
                            variant="link" 
                            className="p-0 h-auto mt-3 text-primary" 
                            onClick={() => navigate('/student/zenith')}
                        >
                            Chat with Zenith AI <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Achievements Widget - Simplified
function AchievementsWidget({ profile }: { profile?: StudentProfileDTO }) {
    // Using a simple placeholder since certifications type issue exists
    const achievements = [
        { name: 'First Interview', icon: Mic, unlocked: true },
        { name: '7-Day Streak', icon: Flame, unlocked: profile?.leetcodeStats?.streak && profile.leetcodeStats.streak >= 7 },
        { name: '50 Problems', icon: Brain, unlocked: profile?.leetcodeStats?.totalSolved && profile.leetcodeStats.totalSolved >= 50 },
        { name: 'Profile Complete', icon: CheckCircle2, unlocked: profile?.isProfileComplete },
    ];

    return (
        <Card variant="bento">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-500/10">
                        <Trophy className="w-4 h-4 text-amber-500" />
                    </div>
                    <CardTitle className="text-base">Achievements</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-4 gap-3">
                    {achievements.map((achievement, i) => (
                        <motion.div
                            key={i}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: i * 0.1, type: "spring" }}
                            className={cn(
                                "flex flex-col items-center gap-1.5 p-2 rounded-lg transition-colors",
                                achievement.unlocked 
                                    ? "bg-amber-500/10 border border-amber-500/20" 
                                    : "bg-muted/30 opacity-50"
                            )}
                        >
                            <achievement.icon className={cn(
                                "w-5 h-5",
                                achievement.unlocked ? "text-amber-500" : "text-muted-foreground"
                            )} />
                            <span className="text-[10px] text-center leading-tight text-muted-foreground line-clamp-2">
                                {achievement.name}
                            </span>
                        </motion.div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

// Main Dashboard Component
export default function StudentDashboard() {
    const { user, token } = useAuth();
    const navigate = useNavigate();

    const { data: profile, isLoading: profileLoading } = useQuery({
        queryKey: ['student-profile'],
        queryFn: () => studentApi.getProfile(token!),
        enabled: !!token,
    });

    const { data: interviewStats } = useQuery<InterviewStatsResponse>({
        queryKey: ['interview-stats'],
        queryFn: () => interviewApi.getStats(token!),
        enabled: !!token,
    });

    const streak = profile?.leetcodeStats?.streak || profile?.githubStats?.streak || 0;

    return (
        <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
            {/* Welcome Header */}
            <motion.div
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold">
                        Welcome back, <span className="text-gradient">{user?.name?.split(' ')[0] || 'Student'}</span>
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Track your progress and prepare for placements
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {profile && !profile.isProfileComplete && (
                        <Button 
                            onClick={() => navigate('/student/profile')} 
                            variant="gradient"
                            size="sm"
                        >
                            <Sparkles className="w-4 h-4 mr-2" />
                            Complete Profile
                        </Button>
                    )}
                </div>
            </motion.div>

            {/* Main Bento Grid */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
            >
                {/* Readiness Score - Large */}
                <motion.div variants={itemVariants} className="md:col-span-1 lg:row-span-2">
                    <ReadinessScoreCard 
                        score={profile?.readinessScore || 0} 
                        isLoading={profileLoading} 
                    />
                </motion.div>

                {/* Streak Card */}
                <motion.div variants={itemVariants}>
                    <StreakCard streak={streak} isLoading={profileLoading} />
                </motion.div>

                {/* Problems Solved */}
                <motion.div variants={itemVariants}>
                    <StatCard
                        title="Problems Solved"
                        value={profile?.leetcodeStats?.totalSolved || 0}
                        icon={Brain}
                        variant="success"
                        href="/student/roadmaps"
                    />
                </motion.div>

                {/* Interview Performance */}
                <motion.div variants={itemVariants}>
                    <InterviewPerformanceWidget stats={interviewStats} />
                </motion.div>

                {/* Achievements */}
                <motion.div variants={itemVariants} className="lg:col-span-2">
                    <AchievementsWidget profile={profile} />
                </motion.div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Quick Actions</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <motion.div variants={itemVariants}>
                        <QuickActionCard
                            title="AI Mock Interview"
                            description="Practice with AI-powered personalized questions"
                            icon={Mic}
                            href="/student/interview"
                            gradient="bg-gradient-to-br from-violet-600 to-purple-700"
                            badge="AI"
                        />
                    </motion.div>
                    <motion.div variants={itemVariants}>
                        <QuickActionCard
                            title="Learning Roadmaps"
                            description="Track your skill development journey"
                            icon={Map}
                            href="/student/roadmaps"
                            gradient="bg-gradient-to-br from-cyan-600 to-blue-700"
                        />
                    </motion.div>
                    <motion.div variants={itemVariants}>
                        <QuickActionCard
                            title="Skill Market"
                            description="Discover in-demand skills & trends"
                            icon={BarChart3}
                            href="/student/market"
                            gradient="bg-gradient-to-br from-emerald-600 to-green-700"
                            badge="New"
                        />
                    </motion.div>
                    <motion.div variants={itemVariants}>
                        <QuickActionCard
                            title="AI Mentor"
                            description="Get personalized career guidance"
                            icon={Sparkles}
                            href="/student/zenith"
                            gradient="bg-gradient-to-br from-amber-500 to-orange-600"
                            badge="Zenith"
                        />
                    </motion.div>
                </div>
            </motion.div>

            {/* Detailed Widgets */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 lg:grid-cols-2 gap-4"
            >
                <motion.div variants={itemVariants}>
                    {profile ? <CodingStatsWidget profile={profile} /> : (
                        <Card variant="bento">
                            <CardContent className="p-6">
                                <Skeleton className="h-48 w-full" />
                            </CardContent>
                        </Card>
                    )}
                </motion.div>
                <motion.div variants={itemVariants}>
                    <SkillMarketWidget />
                </motion.div>
            </motion.div>

            {/* AI Mentor Tip */}
            <motion.div variants={itemVariants} initial="hidden" animate="visible">
                <AIMentorTipCard profile={profile} />
            </motion.div>
        </div>
    );
}
