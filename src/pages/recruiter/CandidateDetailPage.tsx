import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { recruiterApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
    ArrowLeft,
    Mail,
    Heart,
    HeartOff,
    GitCompare,
    ExternalLink,
    Github,
    Linkedin,
    Globe,
    GraduationCap,
    MapPin,
    Phone,
    Code,
    Trophy,
    Target,
    CheckCircle,
    Award,
    FileText,
    Calendar,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { ProgressRing } from '@/components/data-display/ProgressRing';
import { SkillRadar } from '@/components/data-display/SkillRadar';

interface CandidateDetail {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    location?: string;
    college?: string;
    branch?: string;
    year?: string;
    graduationYear?: number;
    cgpa?: number;
    headline?: string;
    summary?: string;
    skills: string[];
    skillRadar?: Record<string, number>;
    readinessScore: number;
    avatarUrl?: string;
    linkedinUrl?: string;
    githubUrl?: string;
    portfolioUrl?: string;
    leetcodeStats?: {
        totalSolved?: number;
        easy?: number;
        medium?: number;
        hard?: number;
        topDomains?: { tag: string; count: number }[];
    };
    githubStats?: {
        totalCommits?: number;
        totalRepos?: number;
        topLanguages?: { name: string; count: number }[];
        streak?: number;
    };
    projects?: {
        _id: string;
        title: string;
        description?: string;
        githubLink?: string;
        tags?: string[];
        verified?: boolean;
    }[];
    certifications?: {
        _id: string;
        title: string;
        issuer?: string;
        issueDate?: string;
        credentialUrl?: string;
        verified?: boolean;
    }[];
    isSaved?: boolean;
}

export default function CandidateDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { token } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: candidate, isLoading } = useQuery({
        queryKey: ['candidate-detail', id],
        queryFn: async () => {
            const response = await recruiterApi.getStudentById(id!, token!);
            return response as CandidateDetail;
        },
        enabled: !!token && !!id,
    });

    const saveMutation = useMutation({
        mutationFn: () => recruiterApi.saveStudent(id!, token!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['candidate-detail', id] });
            toast.success('Candidate saved!');
        },
    });

    const unsaveMutation = useMutation({
        mutationFn: () => recruiterApi.unsaveStudent(id!, token!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['candidate-detail', id] });
            toast.success('Candidate removed from saved');
        },
    });

    if (isLoading) {
        return (
            <div className="p-6 space-y-6 max-w-5xl mx-auto">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-48" />
                <Skeleton className="h-96" />
            </div>
        );
    }

    if (!candidate) {
        return (
            <div className="p-6 text-center">
                <p className="text-muted-foreground">Candidate not found</p>
                <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">
                    Go Back
                </Button>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
            {/* Back Button */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Button
                    variant="ghost"
                    onClick={() => navigate(-1)}
                    className="gap-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </Button>
            </motion.div>

            {/* Header Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <Card className="overflow-hidden">
                    <div className="h-20 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20" />
                    <CardContent className="relative pt-0 pb-6">
                        <div className="flex flex-col md:flex-row gap-6 -mt-10">
                            <Avatar className="w-20 h-20 border-4 border-background">
                                <AvatarImage src={candidate.avatarUrl} />
                                <AvatarFallback className="text-2xl">
                                    {candidate.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 space-y-2">
                                <div className="flex items-start justify-between flex-wrap gap-4">
                                    <div>
                                        <h1 className="text-2xl font-bold">{candidate.name}</h1>
                                        <p className="text-muted-foreground">
                                            {candidate.headline || `${candidate.branch} • ${candidate.college}`}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant={candidate.isSaved ? 'secondary' : 'outline'}
                                            onClick={() =>
                                                candidate.isSaved
                                                    ? unsaveMutation.mutate()
                                                    : saveMutation.mutate()
                                            }
                                            className="gap-2"
                                        >
                                            {candidate.isSaved ? (
                                                <>
                                                    <HeartOff className="w-4 h-4" /> Unsave
                                                </>
                                            ) : (
                                                <>
                                                    <Heart className="w-4 h-4" /> Save
                                                </>
                                            )}
                                        </Button>
                                        <Button className="gap-2">
                                            <Mail className="w-4 h-4" />
                                            Contact
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                    {candidate.college && (
                                        <span className="flex items-center gap-1">
                                            <GraduationCap className="w-4 h-4" />
                                            {candidate.college}
                                        </span>
                                    )}
                                    {candidate.location && (
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-4 h-4" />
                                            {candidate.location}
                                        </span>
                                    )}
                                    {candidate.email && (
                                        <span className="flex items-center gap-1">
                                            <Mail className="w-4 h-4" />
                                            {candidate.email}
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-3 pt-2">
                                    {candidate.linkedinUrl && (
                                        <a
                                            href={candidate.linkedinUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:text-primary/80"
                                        >
                                            <Linkedin className="w-5 h-5" />
                                        </a>
                                    )}
                                    {candidate.githubUrl && (
                                        <a
                                            href={candidate.githubUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:text-primary/80"
                                        >
                                            <Github className="w-5 h-5" />
                                        </a>
                                    )}
                                    {candidate.portfolioUrl && (
                                        <a
                                            href={candidate.portfolioUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:text-primary/80"
                                        >
                                            <Globe className="w-5 h-5" />
                                        </a>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-center">
                                <ProgressRing
                                    value={candidate.readinessScore || 0}
                                    size="lg"
                                    label="Readiness"
                                    variant={
                                        (candidate.readinessScore || 0) >= 70
                                            ? 'success'
                                            : (candidate.readinessScore || 0) >= 40
                                            ? 'warning'
                                            : 'destructive'
                                    }
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Content Tabs */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="skills">Skills</TabsTrigger>
                        <TabsTrigger value="projects">Projects</TabsTrigger>
                        <TabsTrigger value="coding">Coding</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="mt-6 space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Academic Info</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <InfoRow label="College" value={candidate.college} />
                                    <InfoRow label="Branch" value={candidate.branch} />
                                    <InfoRow label="Year" value={candidate.year} />
                                    <InfoRow label="CGPA" value={candidate.cgpa?.toString()} />
                                    <InfoRow
                                        label="Graduation"
                                        value={candidate.graduationYear?.toString()}
                                    />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Quick Stats</CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 gap-4">
                                    <div className="text-center p-3 rounded-lg bg-muted/50">
                                        <p className="text-2xl font-bold">
                                            {candidate.leetcodeStats?.totalSolved || 0}
                                        </p>
                                        <p className="text-xs text-muted-foreground">LeetCode</p>
                                    </div>
                                    <div className="text-center p-3 rounded-lg bg-muted/50">
                                        <p className="text-2xl font-bold">
                                            {candidate.githubStats?.totalCommits || 0}
                                        </p>
                                        <p className="text-xs text-muted-foreground">Commits</p>
                                    </div>
                                    <div className="text-center p-3 rounded-lg bg-muted/50">
                                        <p className="text-2xl font-bold">
                                            {candidate.projects?.length || 0}
                                        </p>
                                        <p className="text-xs text-muted-foreground">Projects</p>
                                    </div>
                                    <div className="text-center p-3 rounded-lg bg-muted/50">
                                        <p className="text-2xl font-bold">
                                            {candidate.certifications?.length || 0}
                                        </p>
                                        <p className="text-xs text-muted-foreground">Certs</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {candidate.summary && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">About</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">{candidate.summary}</p>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="skills" className="mt-6 space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Skill Radar</CardTitle>
                                </CardHeader>
                                <CardContent className="flex justify-center">
                                    {candidate.skillRadar &&
                                    Object.keys(candidate.skillRadar).length >= 3 ? (
                                        <SkillRadar data={candidate.skillRadar} size={250} />
                                    ) : (
                                        <div className="text-center text-muted-foreground py-8">
                                            <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                            <p>Skill radar not available</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Skills</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-2">
                                        {candidate.skills?.length > 0 ? (
                                            candidate.skills.map((skill, i) => (
                                                <Badge key={i} variant="secondary" className="px-3 py-1">
                                                    {skill}
                                                </Badge>
                                            ))
                                        ) : (
                                            <p className="text-muted-foreground">No skills listed</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="projects" className="mt-6 space-y-6">
                        {candidate.projects && candidate.projects.length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-2">
                                {candidate.projects.map(project => (
                                    <Card key={project._id}>
                                        <CardHeader className="pb-2">
                                            <div className="flex items-start justify-between">
                                                <CardTitle className="text-base">
                                                    {project.title}
                                                </CardTitle>
                                                {project.verified && (
                                                    <Badge variant="default" className="gap-1">
                                                        <CheckCircle className="w-3 h-3" />
                                                        Verified
                                                    </Badge>
                                                )}
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-2">
                                            {project.description && (
                                                <p className="text-sm text-muted-foreground line-clamp-2">
                                                    {project.description}
                                                </p>
                                            )}
                                            {project.tags && project.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1">
                                                    {project.tags.map((tag, i) => (
                                                        <Badge key={i} variant="outline" className="text-xs">
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                            {project.githubLink && (
                                                <a
                                                    href={project.githubLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm text-primary flex items-center gap-1 hover:underline"
                                                >
                                                    <Github className="w-4 h-4" />
                                                    View on GitHub
                                                    <ExternalLink className="w-3 h-3" />
                                                </a>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <Card className="p-12">
                                <div className="text-center text-muted-foreground">
                                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>No projects available</p>
                                </div>
                            </Card>
                        )}

                        {/* Certifications */}
                        {candidate.certifications && candidate.certifications.length > 0 && (
                            <>
                                <h3 className="text-lg font-semibold mt-8 mb-4">Certifications</h3>
                                <div className="grid gap-4 md:grid-cols-2">
                                    {candidate.certifications.map(cert => (
                                        <Card key={cert._id}>
                                            <CardHeader className="pb-2">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <CardTitle className="text-base">
                                                            {cert.title}
                                                        </CardTitle>
                                                        <CardDescription>{cert.issuer}</CardDescription>
                                                    </div>
                                                    {cert.verified && (
                                                        <Badge variant="default" className="gap-1">
                                                            <CheckCircle className="w-3 h-3" />
                                                            Verified
                                                        </Badge>
                                                    )}
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                {cert.issueDate && (
                                                    <p className="text-sm text-muted-foreground">
                                                        Issued: {new Date(cert.issueDate).toLocaleDateString()}
                                                    </p>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </>
                        )}
                    </TabsContent>

                    <TabsContent value="coding" className="mt-6 space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* LeetCode Stats */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Code className="w-5 h-5 text-warning" />
                                        LeetCode
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="text-center">
                                        <p className="text-4xl font-bold">
                                            {candidate.leetcodeStats?.totalSolved || 0}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Problems Solved
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="text-center p-2 rounded bg-success/10">
                                            <p className="font-semibold text-success">
                                                {candidate.leetcodeStats?.easy || 0}
                                            </p>
                                            <p className="text-xs text-muted-foreground">Easy</p>
                                        </div>
                                        <div className="text-center p-2 rounded bg-warning/10">
                                            <p className="font-semibold text-warning">
                                                {candidate.leetcodeStats?.medium || 0}
                                            </p>
                                            <p className="text-xs text-muted-foreground">Medium</p>
                                        </div>
                                        <div className="text-center p-2 rounded bg-destructive/10">
                                            <p className="font-semibold text-destructive">
                                                {candidate.leetcodeStats?.hard || 0}
                                            </p>
                                            <p className="text-xs text-muted-foreground">Hard</p>
                                        </div>
                                    </div>
                                    {candidate.leetcodeStats?.topDomains &&
                                        candidate.leetcodeStats.topDomains.length > 0 && (
                                            <div>
                                                <p className="text-sm font-medium mb-2">Top Domains</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {candidate.leetcodeStats.topDomains
                                                        .slice(0, 5)
                                                        .map(domain => (
                                                            <Badge
                                                                key={domain.tag}
                                                                variant="outline"
                                                                className="text-xs"
                                                            >
                                                                {domain.tag} ({domain.count})
                                                            </Badge>
                                                        ))}
                                                </div>
                                            </div>
                                        )}
                                </CardContent>
                            </Card>

                            {/* GitHub Stats */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Github className="w-5 h-5" />
                                        GitHub
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="text-center p-3 rounded-lg bg-muted/50">
                                            <p className="text-2xl font-bold">
                                                {candidate.githubStats?.totalCommits || 0}
                                            </p>
                                            <p className="text-xs text-muted-foreground">Commits</p>
                                        </div>
                                        <div className="text-center p-3 rounded-lg bg-muted/50">
                                            <p className="text-2xl font-bold">
                                                {candidate.githubStats?.totalRepos || 0}
                                            </p>
                                            <p className="text-xs text-muted-foreground">Repos</p>
                                        </div>
                                    </div>
                                    {candidate.githubStats?.streak && (
                                        <div className="text-center p-2 rounded bg-primary/10">
                                            <p className="font-semibold text-primary">
                                                🔥 {candidate.githubStats.streak} day streak
                                            </p>
                                        </div>
                                    )}
                                    {candidate.githubStats?.topLanguages &&
                                        candidate.githubStats.topLanguages.length > 0 && (
                                            <div>
                                                <p className="text-sm font-medium mb-2">
                                                    Top Languages
                                                </p>
                                                <div className="space-y-2">
                                                    {candidate.githubStats.topLanguages
                                                        .slice(0, 4)
                                                        .map(lang => (
                                                            <div
                                                                key={lang.name}
                                                                className="flex items-center gap-2"
                                                            >
                                                                <span className="text-sm w-24 truncate">
                                                                    {lang.name}
                                                                </span>
                                                                <Progress
                                                                    value={
                                                                        (lang.count /
                                                                            candidate.githubStats!
                                                                                .topLanguages![0]
                                                                                .count) *
                                                                        100
                                                                    }
                                                                    className="flex-1 h-2"
                                                                />
                                                                <span className="text-xs text-muted-foreground w-8">
                                                                    {lang.count}
                                                                </span>
                                                            </div>
                                                        ))}
                                                </div>
                                            </div>
                                        )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </motion.div>
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="text-sm font-medium">{value || '-'}</span>
        </div>
    );
}
