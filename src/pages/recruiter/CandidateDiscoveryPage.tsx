import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { recruiterApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
    Search,
    Filter,
    Heart,
    HeartOff,
    Mail,
    ExternalLink,
    SlidersHorizontal,
    X,
    ChevronDown,
    GraduationCap,
    Code,
    Target,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface Candidate {
    _id: string;
    name: string;
    email: string;
    college: string;
    branch?: string;
    year?: string;
    graduationYear?: number;
    skills: string[];
    readinessScore: number;
    avatarUrl?: string;
    headline?: string;
    cgpa?: number;
    leetcodeStats?: {
        totalSolved?: number;
    };
    githubStats?: {
        totalCommits?: number;
    };
}

interface FilterState {
    search: string;
    skills: string[];
    minReadiness: number;
    minCGPA: number;
    graduationYear: string;
    sortBy: string;
}

const defaultFilters: FilterState = {
    search: '',
    skills: [],
    minReadiness: 0,
    minCGPA: 0,
    graduationYear: '',
    sortBy: 'readinessScore',
};

const skillOptions = [
    'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'TypeScript',
    'SQL', 'MongoDB', 'AWS', 'Docker', 'Git', 'C++', 'Machine Learning',
    'Data Structures', 'System Design', 'REST APIs',
];

function CandidateCard({
    candidate,
    isSaved,
    onToggleSave,
    onView,
}: {
    candidate: Candidate;
    isSaved: boolean;
    onToggleSave: () => void;
    onView: () => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
        >
            <Card className="hover:shadow-lg transition-all">
                <CardContent className="p-5">
                    <div className="flex gap-4">
                        {/* Avatar */}
                        <Avatar className="w-16 h-16 flex-shrink-0">
                            <AvatarImage src={candidate.avatarUrl} alt={candidate.name} />
                            <AvatarFallback className="text-lg">
                                {candidate.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                        </Avatar>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="font-semibold text-lg">{candidate.name}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {candidate.headline || `${candidate.branch || 'Student'} at ${candidate.college}`}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onToggleSave();
                                        }}
                                        className={isSaved ? 'text-destructive' : ''}
                                    >
                                        {isSaved ? <Heart className="w-5 h-5 fill-current" /> : <Heart className="w-5 h-5" />}
                                    </Button>
                                </div>
                            </div>

                            {/* Stats Row */}
                            <div className="flex items-center gap-4 mt-3 text-sm">
                                <div className="flex items-center gap-1.5">
                                    <Target className="w-4 h-4 text-primary" />
                                    <span className="font-medium">{candidate.readinessScore}%</span>
                                    <span className="text-muted-foreground">Ready</span>
                                </div>
                                {candidate.cgpa && (
                                    <div className="flex items-center gap-1.5">
                                        <GraduationCap className="w-4 h-4 text-muted-foreground" />
                                        <span>{candidate.cgpa} CGPA</span>
                                    </div>
                                )}
                                {candidate.leetcodeStats?.totalSolved && (
                                    <div className="flex items-center gap-1.5">
                                        <Code className="w-4 h-4 text-warning" />
                                        <span>{candidate.leetcodeStats.totalSolved} problems</span>
                                    </div>
                                )}
                            </div>

                            {/* Skills */}
                            <div className="flex flex-wrap gap-1.5 mt-3">
                                {candidate.skills?.slice(0, 5).map((skill) => (
                                    <Badge key={skill} variant="secondary" className="text-xs">
                                        {skill}
                                    </Badge>
                                ))}
                                {candidate.skills?.length > 5 && (
                                    <Badge variant="outline" className="text-xs">
                                        +{candidate.skills.length - 5}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                        <Button variant="outline" className="flex-1" onClick={onView}>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View Profile
                        </Button>
                        <Button className="flex-1">
                            <Mail className="w-4 h-4 mr-2" />
                            Contact
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

function FilterSheet({
    filters,
    onFiltersChange,
    onReset,
}: {
    filters: FilterState;
    onFiltersChange: (filters: FilterState) => void;
    onReset: () => void;
}) {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <SlidersHorizontal className="w-4 h-4" />
                    Filters
                    {(filters.skills.length > 0 || filters.minReadiness > 0 || filters.minCGPA > 0) && (
                        <Badge variant="secondary" className="ml-1">
                            Active
                        </Badge>
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent className="w-80">
                <SheetHeader>
                    <SheetTitle>Filter Candidates</SheetTitle>
                    <SheetDescription>
                        Narrow down candidates based on criteria
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                    {/* Min Readiness Score */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Min Readiness Score</label>
                            <span className="text-sm text-muted-foreground">{filters.minReadiness}%</span>
                        </div>
                        <Slider
                            value={[filters.minReadiness]}
                            onValueChange={([value]) => onFiltersChange({ ...filters, minReadiness: value })}
                            max={100}
                            step={5}
                        />
                    </div>

                    {/* Min CGPA */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Min CGPA</label>
                            <span className="text-sm text-muted-foreground">{filters.minCGPA}</span>
                        </div>
                        <Slider
                            value={[filters.minCGPA]}
                            onValueChange={([value]) => onFiltersChange({ ...filters, minCGPA: value })}
                            max={10}
                            step={0.5}
                        />
                    </div>

                    {/* Graduation Year */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Graduation Year</label>
                        <Select
                            value={filters.graduationYear}
                            onValueChange={(value) => onFiltersChange({ ...filters, graduationYear: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Any year" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">Any year</SelectItem>
                                {[2024, 2025, 2026, 2027].map((year) => (
                                    <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Skills */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium">Required Skills</label>
                        <ScrollArea className="h-48 rounded-md border p-3">
                            <div className="space-y-2">
                                {skillOptions.map((skill) => (
                                    <label key={skill} className="flex items-center gap-2 cursor-pointer">
                                        <Checkbox
                                            checked={filters.skills.includes(skill)}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    onFiltersChange({ ...filters, skills: [...filters.skills, skill] });
                                                } else {
                                                    onFiltersChange({ ...filters, skills: filters.skills.filter(s => s !== skill) });
                                                }
                                            }}
                                        />
                                        <span className="text-sm">{skill}</span>
                                    </label>
                                ))}
                            </div>
                        </ScrollArea>
                        {filters.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                {filters.skills.map((skill) => (
                                    <Badge key={skill} variant="secondary" className="gap-1">
                                        {skill}
                                        <X
                                            className="w-3 h-3 cursor-pointer"
                                            onClick={() => onFiltersChange({ ...filters, skills: filters.skills.filter(s => s !== skill) })}
                                        />
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Reset Button */}
                    <Button variant="outline" className="w-full" onClick={onReset}>
                        Reset Filters
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}

export default function CandidateDiscoveryPage() {
    const { token } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [filters, setFilters] = useState<FilterState>(defaultFilters);

    // Fetch candidates
    const { data, isLoading } = useQuery<{ students: Candidate[]; total: number }>({
        queryKey: ['candidates', filters],
        queryFn: () => recruiterApi.listStudents({
            search: filters.search || undefined,
            skills: filters.skills.join(',') || undefined,
            minReadiness: filters.minReadiness || undefined,
            minCGPA: filters.minCGPA || undefined,
            graduationYear: filters.graduationYear || undefined,
            sortBy: filters.sortBy,
            limit: 20,
        }, token!) as any,
        enabled: !!token,
    });

    // Fetch saved candidates
    const { data: savedCandidates } = useQuery<{ _id: string }[]>({
        queryKey: ['saved-candidates'],
        queryFn: () => recruiterApi.getSavedCandidates(token!) as any,
        enabled: !!token,
    });

    const savedIds = new Set(savedCandidates?.map(c => c._id) || []);

    // Save/unsave mutation
    const toggleSave = useMutation({
        mutationFn: async (studentId: string) => {
            if (savedIds.has(studentId)) {
                await recruiterApi.removeSavedCandidate(studentId, token!);
            } else {
                await recruiterApi.saveCandidate(studentId, token!);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['saved-candidates'] });
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update saved candidates');
        },
    });

    const candidates = data?.students || [];

    return (
        <div className="p-6 lg:p-8 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Search className="w-8 h-8 text-primary" />
                    Find Candidates
                </h1>
                <p className="text-muted-foreground mt-1">
                    Discover talented students for your open positions
                </p>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, college, or skills..."
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        className="pl-10"
                    />
                </div>
                <div className="flex gap-2">
                    <Select
                        value={filters.sortBy}
                        onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}
                    >
                        <SelectTrigger className="w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="readinessScore">Readiness Score</SelectItem>
                            <SelectItem value="cgpa">CGPA</SelectItem>
                            <SelectItem value="name">Name</SelectItem>
                            <SelectItem value="college">College</SelectItem>
                        </SelectContent>
                    </Select>
                    <FilterSheet
                        filters={filters}
                        onFiltersChange={setFilters}
                        onReset={() => setFilters(defaultFilters)}
                    />
                </div>
            </div>

            {/* Results Count */}
            <div className="text-sm text-muted-foreground">
                {data?.total || 0} candidates found
            </div>

            {/* Candidates Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-64" />
                    ))}
                </div>
            ) : candidates.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="py-16 text-center">
                        <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h3 className="font-semibold mb-2">No candidates found</h3>
                        <p className="text-muted-foreground">
                            Try adjusting your filters or search query
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {candidates.map((candidate) => (
                        <CandidateCard
                            key={candidate._id}
                            candidate={candidate}
                            isSaved={savedIds.has(candidate._id)}
                            onToggleSave={() => toggleSave.mutate(candidate._id)}
                            onView={() => navigate(`/recruiter/candidates/${candidate._id}`)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
