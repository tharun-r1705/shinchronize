import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { recruiterApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
    GitCompare,
    Plus,
    X,
    User,
    GraduationCap,
    Code,
    Trophy,
    Target,
    Check,
    Minus,
    Search,
    Mail,
    Heart,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { EmptyState } from '@/components/data-display/EmptyState';
import { SkillRadar } from '@/components/data-display/SkillRadar';

interface Candidate {
    _id: string;
    name: string;
    email: string;
    college?: string;
    branch?: string;
    year?: string;
    skills: string[];
    readinessScore: number;
    avatarUrl?: string;
    skillRadar?: Record<string, number>;
    leetcodeStats?: { totalSolved?: number; easy?: number; medium?: number; hard?: number };
    githubStats?: { totalCommits?: number; totalRepos?: number };
    cgpa?: number;
}

function CandidateSelector({
    candidates,
    selectedIds,
    onSelect,
    onRemove,
}: {
    candidates: Candidate[];
    selectedIds: string[];
    onSelect: (id: string) => void;
    onRemove: (id: string) => void;
}) {
    const [search, setSearch] = useState('');
    const [open, setOpen] = useState(false);

    const filtered = candidates.filter(
        c =>
            !selectedIds.includes(c._id) &&
            (c.name?.toLowerCase().includes(search.toLowerCase()) ||
                c.email?.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 h-24 w-full flex-col border-dashed">
                    <Plus className="w-6 h-6" />
                    <span>Add Candidate</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Select Candidate</DialogTitle>
                    <DialogDescription>
                        Choose a candidate to add to the comparison
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search candidates..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <ScrollArea className="h-[300px]">
                        <div className="space-y-2">
                            {filtered.map(candidate => (
                                <div
                                    key={candidate._id}
                                    onClick={() => {
                                        onSelect(candidate._id);
                                        setOpen(false);
                                    }}
                                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer"
                                >
                                    <Avatar>
                                        <AvatarImage src={candidate.avatarUrl} />
                                        <AvatarFallback>
                                            {candidate.name?.[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{candidate.name}</p>
                                        <p className="text-sm text-muted-foreground truncate">
                                            {candidate.college}
                                        </p>
                                    </div>
                                    <Badge>{candidate.readinessScore}</Badge>
                                </div>
                            ))}
                            {filtered.length === 0 && (
                                <p className="text-center text-muted-foreground py-8">
                                    No candidates found
                                </p>
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function ComparisonColumn({
    candidate,
    onRemove,
    highlightBest,
}: {
    candidate: Candidate;
    onRemove: () => void;
    highlightBest: Record<string, boolean>;
}) {
    return (
        <Card className="flex-1 min-w-[280px]">
            <CardHeader className="pb-3 relative">
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2"
                    onClick={onRemove}
                >
                    <X className="w-4 h-4" />
                </Button>
                <div className="flex flex-col items-center text-center">
                    <Avatar className="w-16 h-16 mb-3">
                        <AvatarImage src={candidate.avatarUrl} />
                        <AvatarFallback className="text-lg">
                            {candidate.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-lg">{candidate.name}</CardTitle>
                    <CardDescription>{candidate.college}</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Readiness Score */}
                <div className={cn(
                    'p-4 rounded-lg text-center',
                    highlightBest.readiness ? 'bg-success/10 ring-2 ring-success' : 'bg-muted/50'
                )}>
                    <p className="text-3xl font-bold">{candidate.readinessScore || 0}</p>
                    <p className="text-sm text-muted-foreground">Readiness Score</p>
                    {highlightBest.readiness && (
                        <Badge variant="default" className="mt-2 bg-success">
                            <Trophy className="w-3 h-3 mr-1" /> Best
                        </Badge>
                    )}
                </div>

                {/* Academic */}
                <div className="space-y-2">
                    <p className="text-sm font-medium flex items-center gap-2">
                        <GraduationCap className="w-4 h-4" />
                        Academic
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className={cn(
                            'p-2 rounded bg-muted/50 text-center',
                            highlightBest.cgpa ? 'ring-2 ring-success' : ''
                        )}>
                            <p className="font-semibold">{candidate.cgpa || '-'}</p>
                            <p className="text-xs text-muted-foreground">CGPA</p>
                        </div>
                        <div className="p-2 rounded bg-muted/50 text-center">
                            <p className="font-semibold">{candidate.year || '-'}</p>
                            <p className="text-xs text-muted-foreground">Year</p>
                        </div>
                    </div>
                </div>

                {/* Coding Stats */}
                <div className="space-y-2">
                    <p className="text-sm font-medium flex items-center gap-2">
                        <Code className="w-4 h-4" />
                        Coding Stats
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className={cn(
                            'p-2 rounded bg-muted/50 text-center',
                            highlightBest.leetcode ? 'ring-2 ring-success' : ''
                        )}>
                            <p className="font-semibold">
                                {candidate.leetcodeStats?.totalSolved || 0}
                            </p>
                            <p className="text-xs text-muted-foreground">LeetCode</p>
                        </div>
                        <div className={cn(
                            'p-2 rounded bg-muted/50 text-center',
                            highlightBest.commits ? 'ring-2 ring-success' : ''
                        )}>
                            <p className="font-semibold">
                                {candidate.githubStats?.totalCommits || 0}
                            </p>
                            <p className="text-xs text-muted-foreground">Commits</p>
                        </div>
                    </div>
                </div>

                {/* Skills */}
                <div className="space-y-2">
                    <p className="text-sm font-medium">Skills</p>
                    <div className="flex flex-wrap gap-1">
                        {candidate.skills?.slice(0, 6).map((skill, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                                {skill}
                            </Badge>
                        ))}
                        {(candidate.skills?.length || 0) > 6 && (
                            <Badge variant="outline" className="text-xs">
                                +{candidate.skills!.length - 6}
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Skill Radar */}
                {candidate.skillRadar && Object.keys(candidate.skillRadar).length >= 3 && (
                    <div className="pt-4 border-t">
                        <p className="text-sm font-medium mb-2">Skill Radar</p>
                        <SkillRadar data={candidate.skillRadar} size={180} />
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                    <Button variant="outline" size="sm" className="flex-1 gap-1">
                        <Heart className="w-4 h-4" />
                        Save
                    </Button>
                    <Button size="sm" className="flex-1 gap-1">
                        <Mail className="w-4 h-4" />
                        Contact
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

export default function ComparePage() {
    const { token } = useAuth();
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const { data: allCandidates, isLoading } = useQuery({
        queryKey: ['all-candidates'],
        queryFn: async () => {
            try {
                const response = await recruiterApi.searchStudents({}, token!);
                return (response as any).students || [];
            } catch {
                return [];
            }
        },
        enabled: !!token,
    });

    const selectedCandidates = useMemo(() => {
        return selectedIds
            .map(id => allCandidates?.find((c: Candidate) => c._id === id))
            .filter(Boolean) as Candidate[];
    }, [selectedIds, allCandidates]);

    const highlightBest = useMemo(() => {
        if (selectedCandidates.length < 2) {
            return { readiness: false, cgpa: false, leetcode: false, commits: false };
        }

        const maxReadiness = Math.max(...selectedCandidates.map(c => c.readinessScore || 0));
        const maxCgpa = Math.max(...selectedCandidates.map(c => c.cgpa || 0));
        const maxLeetcode = Math.max(...selectedCandidates.map(c => c.leetcodeStats?.totalSolved || 0));
        const maxCommits = Math.max(...selectedCandidates.map(c => c.githubStats?.totalCommits || 0));

        return selectedCandidates.reduce((acc, c) => {
            acc[c._id] = {
                readiness: c.readinessScore === maxReadiness,
                cgpa: c.cgpa === maxCgpa,
                leetcode: (c.leetcodeStats?.totalSolved || 0) === maxLeetcode,
                commits: (c.githubStats?.totalCommits || 0) === maxCommits,
            };
            return acc;
        }, {} as Record<string, Record<string, boolean>>);
    }, [selectedCandidates]);

    const addCandidate = (id: string) => {
        if (selectedIds.length >= 4) {
            toast.error('Maximum 4 candidates can be compared');
            return;
        }
        setSelectedIds([...selectedIds, id]);
    };

    const removeCandidate = (id: string) => {
        setSelectedIds(selectedIds.filter(i => i !== id));
    };

    if (isLoading) {
        return (
            <div className="p-6 space-y-6 max-w-7xl mx-auto">
                <Skeleton className="h-8 w-48" />
                <div className="flex gap-4">
                    {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-96 flex-1" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
                    <GitCompare className="w-6 h-6 text-primary" />
                    Compare Candidates
                </h1>
                <p className="text-muted-foreground">
                    Select up to 4 candidates to compare side by side
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex gap-4 overflow-x-auto pb-4"
            >
                {selectedCandidates.map((candidate, index) => (
                    <motion.div
                        key={candidate._id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex-1 min-w-[280px] max-w-[350px]"
                    >
                        <ComparisonColumn
                            candidate={candidate}
                            onRemove={() => removeCandidate(candidate._id)}
                            highlightBest={highlightBest[candidate._id] || {}}
                        />
                    </motion.div>
                ))}

                {selectedIds.length < 4 && (
                    <div className="min-w-[280px] max-w-[350px]">
                        <CandidateSelector
                            candidates={allCandidates || []}
                            selectedIds={selectedIds}
                            onSelect={addCandidate}
                            onRemove={removeCandidate}
                        />
                    </div>
                )}
            </motion.div>

            {selectedCandidates.length === 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card className="p-12">
                        <EmptyState
                            icon={GitCompare}
                            title="No candidates selected"
                            description="Add candidates from your saved list or search results to compare them side by side"
                        />
                    </Card>
                </motion.div>
            )}

            {selectedCandidates.length >= 2 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Quick Comparison</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {/* Readiness Comparison */}
                                <div>
                                    <p className="text-sm font-medium mb-2">Readiness Score</p>
                                    <div className="space-y-2">
                                        {selectedCandidates.map(c => (
                                            <div key={c._id} className="flex items-center gap-3">
                                                <span className="w-24 text-sm truncate">{c.name}</span>
                                                <Progress
                                                    value={c.readinessScore || 0}
                                                    className="flex-1 h-3"
                                                />
                                                <span className="w-12 text-sm text-right font-medium">
                                                    {c.readinessScore || 0}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* LeetCode Comparison */}
                                <div>
                                    <p className="text-sm font-medium mb-2">LeetCode Problems</p>
                                    <div className="space-y-2">
                                        {selectedCandidates.map(c => {
                                            const total = c.leetcodeStats?.totalSolved || 0;
                                            const maxTotal = Math.max(...selectedCandidates.map(
                                                x => x.leetcodeStats?.totalSolved || 0
                                            ));
                                            return (
                                                <div key={c._id} className="flex items-center gap-3">
                                                    <span className="w-24 text-sm truncate">{c.name}</span>
                                                    <Progress
                                                        value={maxTotal > 0 ? (total / maxTotal) * 100 : 0}
                                                        className="flex-1 h-3"
                                                    />
                                                    <span className="w-12 text-sm text-right font-medium">
                                                        {total}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </div>
    );
}
