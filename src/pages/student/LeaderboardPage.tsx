import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { studentApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
    Trophy,
    Medal,
    Crown,
    Target,
    TrendingUp,
    Users,
    Star,
    Sparkles,
    Flame,
    Code,
    GitCommit,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress, ProgressRing } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.05 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

interface LeaderboardEntry {
    _id: string;
    name: string;
    college: string;
    readinessScore: number;
    avatarUrl?: string;
    rank?: number;
    skills?: string[];
    leetcodeStats?: { totalSolved?: number };
    githubStats?: { totalCommits?: number };
}

interface LeaderboardResponse {
    items: LeaderboardEntry[];
    total: number;
    currentUserRank?: number;
}

const rankConfig: Record<number, { color: string; bg: string; ring: string; icon: React.ElementType }> = {
    1: { color: 'text-amber-400', bg: 'bg-gradient-to-br from-amber-400/20 to-yellow-500/10', ring: 'ring-amber-400/50', icon: Crown },
    2: { color: 'text-slate-300', bg: 'bg-gradient-to-br from-slate-300/20 to-slate-400/10', ring: 'ring-slate-300/50', icon: Medal },
    3: { color: 'text-orange-400', bg: 'bg-gradient-to-br from-orange-400/20 to-amber-500/10', ring: 'ring-orange-400/50', icon: Medal },
};

function LeaderboardRow({
    entry,
    rank,
    isCurrentUser,
}: {
    entry: LeaderboardEntry;
    rank: number;
    isCurrentUser?: boolean;
}) {
    const config = rankConfig[rank];
    const RankIcon = config?.icon || Trophy;

    return (
        <motion.div
            variants={itemVariants}
            className={cn(
                'flex items-center gap-4 p-4 rounded-xl transition-all',
                isCurrentUser
                    ? 'bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/30 shadow-lg shadow-primary/5'
                    : 'hover:bg-muted/50 border border-transparent'
            )}
        >
            {/* Rank */}
            <div className="w-14 flex items-center justify-center">
                {rank <= 3 ? (
                    <div className={cn('p-2 rounded-lg', config?.bg)}>
                        <RankIcon className={cn('w-6 h-6', config?.color)} />
                    </div>
                ) : (
                    <span className="text-xl font-bold text-muted-foreground">#{rank}</span>
                )}
            </div>

            {/* Avatar & Info */}
            <Avatar className={cn('w-12 h-12 ring-2', rank <= 3 ? config?.ring : 'ring-border')}>
                <AvatarImage src={entry.avatarUrl} alt={entry.name} />
                <AvatarFallback className={cn(
                    rank <= 3 
                        ? 'bg-gradient-to-br from-primary to-purple-600 text-white' 
                        : 'bg-muted'
                )}>
                    {entry.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
                </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className="font-semibold truncate">{entry.name || 'Anonymous'}</p>
                    {isCurrentUser && (
                        <Badge variant="success" className="text-xs">You</Badge>
                    )}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                    {entry.college || 'Unknown College'}
                </p>
            </div>

            {/* Stats */}
            <div className="hidden md:flex items-center gap-6 text-sm">
                {entry.leetcodeStats?.totalSolved !== undefined && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-warning/10">
                        <Code className="w-4 h-4 text-warning" />
                        <div className="text-center">
                            <p className="font-semibold">{entry.leetcodeStats.totalSolved}</p>
                        </div>
                    </div>
                )}
                {entry.githubStats?.totalCommits !== undefined && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-foreground/5">
                        <GitCommit className="w-4 h-4 text-muted-foreground" />
                        <div className="text-center">
                            <p className="font-semibold">{entry.githubStats.totalCommits}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Readiness Score */}
            <div className="flex items-center gap-3">
                <ProgressRing
                    value={entry.readinessScore || 0}
                    size={48}
                    strokeWidth={4}
                    variant={
                        (entry.readinessScore || 0) >= 70
                            ? 'success'
                            : (entry.readinessScore || 0) >= 40
                            ? 'warning'
                            : 'destructive'
                    }
                >
                    <span className="text-sm font-bold">{entry.readinessScore || 0}</span>
                </ProgressRing>
            </div>
        </motion.div>
    );
}

function TopThree({ entries }: { entries: LeaderboardEntry[] }) {
    const [second, first, third] = [entries[1], entries[0], entries[2]];

    const podiumConfig = {
        first: { size: 'w-24 h-24', podium: 'h-28', color: 'from-amber-400 to-yellow-500', ring: 'ring-amber-400' },
        second: { size: 'w-20 h-20', podium: 'h-20', color: 'from-slate-300 to-slate-400', ring: 'ring-slate-300' },
        third: { size: 'w-18 h-18', podium: 'h-16', color: 'from-orange-400 to-amber-500', ring: 'ring-orange-400' },
    };

    return (
        <div className="flex items-end justify-center gap-4 py-8 px-4">
            {/* Second Place */}
            {second && (
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col items-center"
                >
                    <div className="relative mb-3">
                        <Avatar className={cn('w-20 h-20 ring-4', podiumConfig.second.ring)}>
                            <AvatarImage src={second.avatarUrl} />
                            <AvatarFallback className="bg-gradient-to-br from-slate-300 to-slate-400 text-slate-800 text-xl font-bold">
                                {second.name?.[0]}
                            </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-slate-300 flex items-center justify-center text-slate-800 font-bold text-sm shadow-lg">
                            2
                        </div>
                    </div>
                    <p className="font-semibold text-sm truncate max-w-24 text-center">{second.name}</p>
                    <Badge variant="secondary" className="mt-1">
                        {second.readinessScore}
                    </Badge>
                    <div className={cn('w-28 rounded-t-xl mt-3 flex items-center justify-center bg-gradient-to-t from-slate-400/30 to-slate-300/10 border-t border-x border-slate-300/30', podiumConfig.second.podium)}>
                        <Medal className="w-8 h-8 text-slate-300" />
                    </div>
                </motion.div>
            )}

            {/* First Place */}
            {first && (
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-col items-center -mt-4"
                >
                    <motion.div 
                        className="mb-2"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                    >
                        <Crown className="w-10 h-10 text-amber-400 drop-shadow-lg" />
                    </motion.div>
                    <div className="relative mb-3">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-400/50 to-yellow-500/50 rounded-full blur-xl scale-110" />
                        <Avatar className={cn('w-24 h-24 ring-4 relative', podiumConfig.first.ring)}>
                            <AvatarImage src={first.avatarUrl} />
                            <AvatarFallback className="bg-gradient-to-br from-amber-400 to-yellow-500 text-amber-900 text-2xl font-bold">
                                {first.name?.[0]}
                            </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-amber-900 font-bold shadow-lg">
                            1
                        </div>
                    </div>
                    <p className="font-bold truncate max-w-28 text-center">{first.name}</p>
                    <Badge className="mt-1 bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-900 border-0">
                        {first.readinessScore}
                    </Badge>
                    <div className={cn('w-28 rounded-t-xl mt-3 flex items-center justify-center bg-gradient-to-t from-amber-400/30 to-amber-300/10 border-t border-x border-amber-400/30', podiumConfig.first.podium)}>
                        <Trophy className="w-10 h-10 text-amber-400" />
                    </div>
                </motion.div>
            )}

            {/* Third Place */}
            {third && (
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-col items-center"
                >
                    <div className="relative mb-3">
                        <Avatar className={cn('w-18 h-18 ring-4', podiumConfig.third.ring)}>
                            <AvatarImage src={third.avatarUrl} />
                            <AvatarFallback className="bg-gradient-to-br from-orange-400 to-amber-500 text-orange-900 text-lg font-bold">
                                {third.name?.[0]}
                            </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-orange-400 flex items-center justify-center text-orange-900 font-bold text-sm shadow-lg">
                            3
                        </div>
                    </div>
                    <p className="font-semibold text-sm truncate max-w-24 text-center">{third.name}</p>
                    <Badge variant="secondary" className="mt-1">
                        {third.readinessScore}
                    </Badge>
                    <div className={cn('w-28 rounded-t-xl mt-3 flex items-center justify-center bg-gradient-to-t from-orange-400/30 to-orange-300/10 border-t border-x border-orange-400/30', podiumConfig.third.podium)}>
                        <Medal className="w-6 h-6 text-orange-400" />
                    </div>
                </motion.div>
            )}
        </div>
    );
}

export default function LeaderboardPage() {
    const { user, token } = useAuth();

    const { data, isLoading } = useQuery({
        queryKey: ['leaderboard'],
        queryFn: async () => {
            const response = await studentApi.getLeaderboard(50);
            return response as LeaderboardResponse;
        },
        enabled: !!token,
    });

    if (isLoading) {
        return (
            <div className="p-4 lg:p-6 space-y-6 max-w-4xl mx-auto">
                <Skeleton className="h-12 w-64 rounded-xl" />
                <Skeleton className="h-64 rounded-2xl" />
                <div className="space-y-3">
                    {[...Array(10)].map((_, i) => (
                        <Skeleton key={i} className="h-20 rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    const entries = data?.items || [];
    const currentUserRank = data?.currentUserRank;

    return (
        <div className="p-4 lg:p-6 space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-400/20 to-yellow-500/10">
                            <Trophy className="w-6 h-6 text-amber-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                Leaderboard
                                <Sparkles className="w-5 h-5 text-amber-400" />
                            </h1>
                            <p className="text-muted-foreground">
                                Top performers ranked by readiness score
                            </p>
                        </div>
                    </div>
                    {currentUserRank && (
                        <Card variant="glow" className="px-6 py-3">
                            <div className="text-center">
                                <p className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                                    #{currentUserRank}
                                </p>
                                <p className="text-sm text-muted-foreground">Your Rank</p>
                            </div>
                        </Card>
                    )}
                </div>
            </motion.div>

            {/* Top 3 Podium */}
            {entries.length >= 3 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Card variant="bento" className="overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
                        <CardContent className="pt-6 relative">
                            <TopThree entries={entries.slice(0, 3)} />
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Full Leaderboard */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <Card variant="bento">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Users className="w-4 h-4 text-primary" />
                            </div>
                            All Rankings
                        </CardTitle>
                        <CardDescription>
                            {data?.total || entries.length} students ranked
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {entries.length > 0 ? (
                            <motion.div 
                                className="space-y-2"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                {entries.map((entry, index) => (
                                    <LeaderboardRow
                                        key={entry._id}
                                        entry={entry}
                                        rank={index + 1}
                                        isCurrentUser={entry._id === user?._id}
                                    />
                                ))}
                            </motion.div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 mx-auto rounded-full bg-muted/50 flex items-center justify-center mb-4">
                                    <Trophy className="w-8 h-8 text-muted-foreground/50" />
                                </div>
                                <p className="text-muted-foreground font-medium">No rankings yet</p>
                                <p className="text-sm text-muted-foreground">
                                    Complete your profile to appear on the leaderboard
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
