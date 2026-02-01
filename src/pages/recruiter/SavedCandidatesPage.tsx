import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { recruiterApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
    Heart,
    HeartOff,
    Mail,
    GitCompare,
    User,
    GraduationCap,
    Code,
    ChevronRight,
    Search,
    Filter,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { EmptyState } from '@/components/data-display/EmptyState';

interface SavedCandidate {
    _id: string;
    name: string;
    email: string;
    college?: string;
    branch?: string;
    year?: string;
    skills: string[];
    readinessScore: number;
    avatarUrl?: string;
    savedAt?: string;
    leetcodeStats?: { totalSolved?: number };
    githubStats?: { totalCommits?: number };
}

function CandidateCard({
    candidate,
    isSelected,
    onSelect,
    onUnsave,
    onClick,
}: {
    candidate: SavedCandidate;
    isSelected: boolean;
    onSelect: () => void;
    onUnsave: () => void;
    onClick: () => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
        >
            <Card
                className={cn(
                    'cursor-pointer transition-all hover:shadow-lg',
                    isSelected && 'ring-2 ring-primary'
                )}
            >
                <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                        <Checkbox
                            checked={isSelected}
                            onCheckedChange={onSelect}
                            onClick={e => e.stopPropagation()}
                        />

                        <div className="flex-1 min-w-0" onClick={onClick}>
                            <div className="flex items-start gap-3">
                                <Avatar className="w-12 h-12">
                                    <AvatarImage src={candidate.avatarUrl} />
                                    <AvatarFallback>
                                        {candidate.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <p className="font-semibold truncate">{candidate.name}</p>
                                        <Badge variant="secondary">
                                            {candidate.readinessScore || 0}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground truncate">
                                        {candidate.college}
                                        {candidate.year && ` • ${candidate.year}`}
                                    </p>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {candidate.skills?.slice(0, 4).map((skill, i) => (
                                            <Badge key={i} variant="outline" className="text-xs">
                                                {skill}
                                            </Badge>
                                        ))}
                                        {(candidate.skills?.length || 0) > 4 && (
                                            <Badge variant="outline" className="text-xs">
                                                +{candidate.skills!.length - 4}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-3 pt-3 border-t">
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Code className="w-3 h-3" />
                                        {candidate.leetcodeStats?.totalSolved || 0} LeetCode
                                    </span>
                                    <span className="flex items-center gap-1">
                                        {candidate.githubStats?.totalCommits || 0} Commits
                                    </span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            </div>
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={e => {
                                e.stopPropagation();
                                onUnsave();
                            }}
                        >
                            <HeartOff className="w-4 h-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

export default function SavedCandidatesPage() {
    const { token } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [search, setSearch] = React.useState('');
    const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

    const { data: candidates, isLoading } = useQuery({
        queryKey: ['saved-candidates'],
        queryFn: async () => {
            try {
                const response = await recruiterApi.getSavedCandidates(token!);
                return (response as any).candidates || (response as any) || [];
            } catch {
                return [];
            }
        },
        enabled: !!token,
    });

    const unsaveMutation = useMutation({
        mutationFn: (studentId: string) =>
            recruiterApi.unsaveStudent(studentId, token!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['saved-candidates'] });
            toast.success('Candidate removed from saved list');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to unsave candidate');
        },
    });

    const filteredCandidates = candidates?.filter((c: SavedCandidate) =>
        !search ||
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.college?.toLowerCase().includes(search.toLowerCase()) ||
        c.skills?.some(s => s.toLowerCase().includes(search.toLowerCase()))
    ) || [];

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id)
                ? prev.filter(i => i !== id)
                : [...prev, id]
        );
    };

    const selectAll = () => {
        if (selectedIds.length === filteredCandidates.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredCandidates.map((c: SavedCandidate) => c._id));
        }
    };

    if (isLoading) {
        return (
            <div className="p-6 space-y-6 max-w-6xl mx-auto">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-12 w-full" />
                <div className="grid gap-4 md:grid-cols-2">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-40" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
                    <Heart className="w-6 h-6 text-destructive" />
                    Saved Candidates
                </h1>
                <p className="text-muted-foreground">
                    {candidates?.length || 0} candidates saved
                </p>
            </motion.div>

            {/* Actions Bar */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between"
            >
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search candidates..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={selectAll}
                    >
                        {selectedIds.length === filteredCandidates.length
                            ? 'Deselect All'
                            : 'Select All'}
                    </Button>
                    {selectedIds.length > 0 && (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    // Navigate to compare with selected candidates
                                    navigate('/recruiter/compare', {
                                        state: { candidateIds: selectedIds },
                                    });
                                }}
                                className="gap-1"
                            >
                                <GitCompare className="w-4 h-4" />
                                Compare ({selectedIds.length})
                            </Button>
                            <Button size="sm" className="gap-1">
                                <Mail className="w-4 h-4" />
                                Bulk Contact
                            </Button>
                        </>
                    )}
                </div>
            </motion.div>

            {/* Candidates Grid */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                {filteredCandidates.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                        {filteredCandidates.map((candidate: SavedCandidate, index: number) => (
                            <motion.div
                                key={candidate._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <CandidateCard
                                    candidate={candidate}
                                    isSelected={selectedIds.includes(candidate._id)}
                                    onSelect={() => toggleSelect(candidate._id)}
                                    onUnsave={() => unsaveMutation.mutate(candidate._id)}
                                    onClick={() => navigate(`/recruiter/candidates/${candidate._id}`)}
                                />
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <Card className="p-12">
                        <EmptyState
                            icon={Heart}
                            title={search ? 'No candidates found' : 'No saved candidates'}
                            description={
                                search
                                    ? 'Try a different search term'
                                    : 'Save candidates from the discovery page to see them here'
                            }
                            action={
                                !search
                                    ? {
                                          label: 'Find Candidates',
                                          onClick: () => navigate('/recruiter/discover'),
                                      }
                                    : undefined
                            }
                        />
                    </Card>
                )}
            </motion.div>
        </div>
    );
}
