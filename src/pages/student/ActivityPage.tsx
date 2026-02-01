import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { api, studentApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
    Activity,
    Calendar,
    Clock,
    Code,
    ExternalLink,
    Github,
    Trophy,
    Target,
    Zap,
    BookOpen,
    Mic,
    CheckCircle,
    Star,
    Flame,
    TrendingUp,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress, ProgressRing } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ActivityHeatmap } from '@/components/data-display/ActivityHeatmap';

interface ActivityEvent {
    _id: string;
    type: string;
    action: string;
    details?: Record<string, any>;
    createdAt: string;
}

interface ActivityStats {
    totalEvents: number;
    lastActive: string;
    streakDays: number;
    thisWeek: number;
    byType: Record<string, number>;
    calendar: Record<string, number>;
}

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

const activityTypeConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string; label: string }> = {
    coding: { icon: Code, color: 'text-amber-400', bgColor: 'bg-amber-500/15', label: 'Coding Activity' },
    interview: { icon: Mic, color: 'text-primary', bgColor: 'bg-primary/15', label: 'Interview' },
    roadmap: { icon: BookOpen, color: 'text-emerald-400', bgColor: 'bg-emerald-500/15', label: 'Roadmap' },
    profile: { icon: Target, color: 'text-sky-400', bgColor: 'bg-sky-500/15', label: 'Profile Update' },
    achievement: { icon: Trophy, color: 'text-amber-400', bgColor: 'bg-amber-500/15', label: 'Achievement' },
    default: { icon: Activity, color: 'text-muted-foreground', bgColor: 'bg-muted', label: 'Activity' },
};

function getActivityConfig(type: string) {
    return activityTypeConfig[type] || activityTypeConfig.default;
}

function formatRelativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

function normalizeCalendar(source?: Record<string, number> | null): Record<string, number> {
    if (!source) return {};
    return Object.entries(source).reduce<Record<string, number>>((acc, [key, value]) => {
        if (!key) return acc;
        const date = new Date(key);
        const normalized = !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : key;
        const safeValue = Number(value) || 0;
        acc[normalized] = (acc[normalized] || 0) + safeValue;
        return acc;
    }, {});
}

function mergeCalendars(...sources: Array<Record<string, number> | null | undefined>) {
    return sources.reduce<Record<string, number>>((acc, source) => {
        const normalized = normalizeCalendar(source || undefined);
        Object.entries(normalized).forEach(([date, value]) => {
            acc[date] = (acc[date] || 0) + value;
        });
        return acc;
    }, {});
}

function buildProfileUrl(type: 'leetcode' | 'github' | 'hackerrank', profile?: string, fallback?: string) {
    const raw = fallback || profile || '';
    if (!raw) return '';
    if (raw.startsWith('http')) return raw;
    if (type === 'leetcode') return `https://leetcode.com/${raw}`;
    if (type === 'hackerrank') return `https://www.hackerrank.com/${raw}`;
    return `https://github.com/${raw}`;
}

function ActivityItem({ event }: { event: ActivityEvent }) {
    const config = getActivityConfig(event.type);
    const Icon = config.icon;

    return (
        <motion.div
            variants={itemVariants}
            className="flex gap-4 py-4 border-b border-border/50 last:border-0 group"
        >
            <div
                className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110',
                    config.bgColor
                )}
            >
                <Icon className={cn('w-5 h-5', config.color)} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">{event.action}</p>
                {event.details && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                        {event.details.description || JSON.stringify(event.details)}
                    </p>
                )}
                <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant="outline" className="text-xs border-border/50">
                        {config.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(event.createdAt)}
                    </span>
                </div>
            </div>
        </motion.div>
    );
}

function StatBar({ label, value, colorClass }: { label: string; value: number; colorClass: string }) {
    const safeValue = Number.isFinite(value) ? value : 0;
    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium text-foreground">{safeValue}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden">
                <motion.div
                    className={cn('h-full rounded-full', colorClass)}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, safeValue)}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                />
            </div>
        </div>
    );
}

export default function ActivityPage() {
    const { token } = useAuth();

    const { data: activities, isLoading: activitiesLoading } = useQuery({
        queryKey: ['activity-feed'],
        queryFn: async () => {
            try {
                const response = await api.get<{ items: ActivityEvent[] }>('/activity', token!);
                return response.items || [];
            } catch {
                return [];
            }
        },
        enabled: !!token,
    });

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['activity-stats'],
        queryFn: async () => {
            try {
                const response = await api.get<ActivityStats>('/activity/stats', token!);
                return response;
            } catch {
                return null;
            }
        },
        enabled: !!token,
    });

    const { data: profile } = useQuery({
        queryKey: ['student-profile-activity'],
        queryFn: async () => {
            try {
                return await studentApi.getProfile(token!);
            } catch {
                return null;
            }
        },
        enabled: !!token,
    });

    const isLoading = activitiesLoading || statsLoading;
    const calendarData = mergeCalendars(
        stats?.calendar,
        profile?.leetcodeStats?.calendar,
        profile?.githubStats?.calendar
    );

    if (isLoading) {
        return (
            <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
                <Skeleton className="h-8 w-48" />
                <div className="grid gap-4 md:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-32 rounded-2xl" />
                    ))}
                </div>
                <Skeleton className="h-48 rounded-2xl" />
                <Skeleton className="h-96 rounded-2xl" />
            </div>
        );
    }

    return (
        <motion.div
            className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Header */}
            <motion.div variants={itemVariants}>
                <h1 className="text-2xl lg:text-3xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    My Activity
                </h1>
                <p className="text-muted-foreground">
                    Track your learning journey and stay consistent
                </p>
            </motion.div>

            {/* Stats Row - Bento Style */}
            <motion.div variants={itemVariants} className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                {/* Total Events */}
                <Card variant="bento" className="relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
                    <CardContent className="p-5 relative">
                        <div className="flex items-start justify-between">
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">Total Events</p>
                                <p className="text-3xl font-bold tracking-tight">{stats?.totalEvents || 0}</p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                <Activity className="w-5 h-5 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Current Streak */}
                <Card variant="bento" className="relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent" />
                    <CardContent className="p-5 relative">
                        <div className="flex items-start justify-between">
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">Current Streak</p>
                                <div className="flex items-baseline gap-1.5">
                                    <p className="text-3xl font-bold tracking-tight">{stats?.streakDays || 0}</p>
                                    <span className="text-sm text-muted-foreground">days</span>
                                </div>
                            </div>
                            <div className="p-2.5 rounded-xl bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                                <Flame className="w-5 h-5 text-amber-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* This Week */}
                <Card variant="bento" className="relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent" />
                    <CardContent className="p-5 relative">
                        <div className="flex items-start justify-between">
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">This Week</p>
                                <div className="flex items-baseline gap-1.5">
                                    <p className="text-3xl font-bold tracking-tight">{stats?.thisWeek || 0}</p>
                                    <span className="text-sm text-muted-foreground">activities</span>
                                </div>
                            </div>
                            <div className="p-2.5 rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                                <TrendingUp className="w-5 h-5 text-emerald-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Last Active */}
                <Card variant="bento" className="relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent" />
                    <CardContent className="p-5 relative">
                        <div className="flex items-start justify-between">
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">Last Active</p>
                                <p className="text-2xl font-bold tracking-tight">
                                    {stats?.lastActive ? formatRelativeTime(stats.lastActive) : 'N/A'}
                                </p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-sky-500/10 group-hover:bg-sky-500/20 transition-colors">
                                <Clock className="w-5 h-5 text-sky-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Activity Heatmap */}
            <motion.div variants={itemVariants}>
                <Card variant="bento" className="overflow-hidden">
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Calendar className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Activity Calendar</CardTitle>
                                <CardDescription>
                                    Your coding and learning activity over the past year
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <ActivityHeatmap data={calendarData} />
                    </CardContent>
                </Card>
            </motion.div>

            {/* Coding Profiles Visualization */}
            <motion.div variants={itemVariants}>
                <Card variant="bento" className="overflow-hidden">
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Code className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Coding Profiles</CardTitle>
                                <CardDescription>
                                    LeetCode, GitHub, and HackerRank activity snapshots
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="grid gap-4 md:grid-cols-3">
                            {/* LeetCode */}
                            <div className="p-5 rounded-2xl border border-border/50 bg-gradient-to-br from-card to-muted/20 hover:border-amber-500/30 transition-colors">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
                                            <Code className="w-5 h-5 text-amber-400" />
                                        </div>
                                        <span className="font-semibold">LeetCode</span>
                                    </div>
                                    {(profile?.leetcodeUrl || profile?.codingProfiles?.leetcode) && (
                                        <a
                                            href={buildProfileUrl('leetcode', profile?.codingProfiles?.leetcode, profile?.leetcodeUrl)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-primary flex items-center gap-1 hover:underline"
                                        >
                                            View <ExternalLink className="w-3 h-3" />
                                        </a>
                                    )}
                                </div>
                                <div className="text-4xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
                                    {profile?.leetcodeStats?.totalSolved || 0}
                                </div>
                                <p className="text-xs text-muted-foreground mb-4">Problems solved</p>

                                <div className="space-y-3">
                                    <StatBar
                                        label="Easy"
                                        value={profile?.leetcodeStats?.easy || 0}
                                        colorClass="bg-gradient-to-r from-emerald-500 to-emerald-400"
                                    />
                                    <StatBar
                                        label="Medium"
                                        value={profile?.leetcodeStats?.medium || 0}
                                        colorClass="bg-gradient-to-r from-amber-500 to-amber-400"
                                    />
                                    <StatBar
                                        label="Hard"
                                        value={profile?.leetcodeStats?.hard || 0}
                                        colorClass="bg-gradient-to-r from-red-500 to-red-400"
                                    />
                                </div>
                            </div>

                            {/* GitHub */}
                            <div className="p-5 rounded-2xl border border-border/50 bg-gradient-to-br from-card to-muted/20 hover:border-primary/30 transition-colors">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                                            <Github className="w-5 h-5 text-primary" />
                                        </div>
                                        <span className="font-semibold">GitHub</span>
                                    </div>
                                    {(profile?.githubUrl || profile?.codingProfiles?.github) && (
                                        <a
                                            href={buildProfileUrl('github', profile?.codingProfiles?.github, profile?.githubUrl)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-primary flex items-center gap-1 hover:underline"
                                        >
                                            View <ExternalLink className="w-3 h-3" />
                                        </a>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="rounded-xl bg-muted/50 p-3 text-center">
                                        <div className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                                            {profile?.githubStats?.totalCommits || 0}
                                        </div>
                                        <p className="text-xs text-muted-foreground">Commits</p>
                                    </div>
                                    <div className="rounded-xl bg-muted/50 p-3 text-center">
                                        <div className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                                            {profile?.githubStats?.totalRepos || 0}
                                        </div>
                                        <p className="text-xs text-muted-foreground">Repos</p>
                                    </div>
                                </div>
                                {profile?.githubStats?.topLanguages && profile.githubStats.topLanguages.length > 0 && (
                                    <div className="space-y-3">
                                        {profile.githubStats.topLanguages.slice(0, 3).map((lang) => (
                                            <div key={lang.name} className="space-y-1.5">
                                                <div className="flex justify-between text-xs">
                                                    <span className="font-medium">{lang.name}</span>
                                                    <span className="text-muted-foreground">{lang.percentage}%</span>
                                                </div>
                                                <Progress value={lang.percentage} className="h-2" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* HackerRank */}
                            <div className="p-5 rounded-2xl border border-border/50 bg-gradient-to-br from-card to-muted/20 hover:border-emerald-500/30 transition-colors">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                                            <Star className="w-5 h-5 text-emerald-400" />
                                        </div>
                                        <span className="font-semibold">HackerRank</span>
                                    </div>
                                    {(profile?.hackerrankUrl || profile?.codingProfiles?.hackerrank) && (
                                        <a
                                            href={buildProfileUrl('hackerrank', profile?.codingProfiles?.hackerrank, profile?.hackerrankUrl)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-primary flex items-center gap-1 hover:underline"
                                        >
                                            View <ExternalLink className="w-3 h-3" />
                                        </a>
                                    )}
                                </div>
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <div className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
                                            {profile?.hackerrankStats?.totalSolved || 0}
                                        </div>
                                        <p className="text-xs text-muted-foreground">Challenges solved</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-1">
                                            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                                            <span className="text-2xl font-bold text-amber-400">
                                                {profile?.hackerrankStats?.stars || 0}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Stars</p>
                                    </div>
                                </div>
                                {profile?.hackerrankStats?.skills && profile.hackerrankStats.skills.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {profile.hackerrankStats.skills.slice(0, 6).map((skill, index) => (
                                            <Badge key={`${skill.name}-${index}`} variant="outline" className="text-xs border-emerald-500/30 text-emerald-400">
                                                {skill.name || 'Skill'}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Activity by Type */}
            {stats?.byType && Object.keys(stats.byType).length > 0 && (
                <motion.div variants={itemVariants}>
                    <Card variant="bento">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <Target className="w-4 h-4 text-primary" />
                                </div>
                                <CardTitle className="text-lg">Activity Breakdown</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="flex flex-wrap gap-3">
                                {Object.entries(stats.byType).map(([type, count]) => {
                                    const config = getActivityConfig(type);
                                    const Icon = config.icon;
                                    return (
                                        <div
                                            key={type}
                                            className={cn(
                                                'flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-border/50 transition-colors hover:border-primary/30',
                                                config.bgColor
                                            )}
                                        >
                                            <Icon className={cn('w-4 h-4', config.color)} />
                                            <span className="text-sm font-medium">{config.label}</span>
                                            <Badge variant="secondary" className="ml-1 bg-background/50">{count}</Badge>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Activity Feed */}
            <motion.div variants={itemVariants}>
                <Card variant="bento">
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Activity className="w-4 h-4 text-primary" />
                            </div>
                            <CardTitle className="text-lg">Recent Activity</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                        {activities && activities.length > 0 ? (
                            <motion.div
                                className="space-y-0"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                {activities.map((event) => (
                                    <ActivityItem key={event._id} event={event} />
                                ))}
                            </motion.div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                                    <Activity className="w-8 h-8 text-muted-foreground/50" />
                                </div>
                                <p className="text-muted-foreground font-medium">No activity yet</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Start learning to see your activity here
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
}
