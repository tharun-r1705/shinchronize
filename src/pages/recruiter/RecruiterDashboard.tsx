import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { recruiterApi, api } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
    Users,
    Heart,
    Briefcase,
    TrendingUp,
    ArrowRight,
    Mail,
    Eye,
    UserPlus,
    Search,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ElementType;
    variant?: 'default' | 'primary' | 'success' | 'warning';
    onClick?: () => void;
}

function StatCard({ title, value, subtitle, icon: Icon, variant = 'default', onClick }: StatCardProps) {
    const variantStyles = {
        default: 'bg-card',
        primary: 'bg-primary/10 border-primary/20',
        success: 'bg-success/10 border-success/20',
        warning: 'bg-warning/10 border-warning/20',
    };

    const iconStyles = {
        default: 'bg-muted text-muted-foreground',
        primary: 'bg-primary/20 text-primary',
        success: 'bg-success/20 text-success',
        warning: 'bg-warning/20 text-warning',
    };

    return (
        <Card
            className={cn(
                'border transition-all duration-200',
                variantStyles[variant],
                onClick && 'cursor-pointer hover:shadow-lg'
            )}
            onClick={onClick}
        >
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold">{value}</span>
                            {subtitle && <span className="text-sm text-muted-foreground">{subtitle}</span>}
                        </div>
                    </div>
                    <div className={cn('p-3 rounded-xl', iconStyles[variant])}>
                        <Icon className="w-6 h-6" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

interface CandidatePreviewProps {
    candidate: {
        _id: string;
        name: string;
        email: string;
        college: string;
        skills: string[];
        readinessScore: number;
        avatarUrl?: string;
    };
}

function CandidatePreview({ candidate }: CandidatePreviewProps) {
    const navigate = useNavigate();

    return (
        <div
            onClick={() => navigate(`/recruiter/candidates/${candidate._id}`)}
            className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
        >
            <Avatar className="w-12 h-12">
                <AvatarImage src={candidate.avatarUrl} alt={candidate.name} />
                <AvatarFallback>
                    {candidate.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{candidate.name}</p>
                <p className="text-sm text-muted-foreground truncate">{candidate.college}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                    {candidate.skills?.slice(0, 3).map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                        </Badge>
                    ))}
                </div>
            </div>
            <div className="text-right flex-shrink-0">
                <p className="text-lg font-bold text-primary">{candidate.readinessScore}%</p>
                <p className="text-xs text-muted-foreground">Readiness</p>
            </div>
        </div>
    );
}

export default function RecruiterDashboard() {
    const { user, token } = useAuth();
    const navigate = useNavigate();

    // Fetch saved candidates count
    const { data: savedCandidates, isLoading: savedLoading } = useQuery({
        queryKey: ['saved-candidates'],
        queryFn: () => recruiterApi.getSavedCandidates(token!),
        enabled: !!token,
    });

    // Fetch recent candidates
    const { data: recentCandidates, isLoading: candidatesLoading } = useQuery<{
        students: any[];
        total: number;
    }>({
        queryKey: ['recent-candidates'],
        queryFn: () => recruiterApi.listStudents({ limit: 5, sortBy: 'readinessScore' }, token!) as any,
        enabled: !!token,
    });

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

    const savedCount = Array.isArray(savedCandidates) ? savedCandidates.length : 0;
    const totalCandidates = recentCandidates?.total || 0;

    return (
        <div className="p-6 lg:p-8 space-y-8">
            {/* Welcome Header */}
            <motion.div
                variants={itemVariants}
                initial="hidden"
                animate="visible"
            >
                <h1 className="text-3xl font-bold">
                    Welcome, <span className="text-gradient">{user?.name?.split(' ')[0] || 'Recruiter'}</span>
                </h1>
                <p className="text-muted-foreground mt-1">
                    {user?.company && <span className="font-medium">{user.company}</span>}
                    {user?.company && ' • '}
                    Find and connect with top talent
                </p>
            </motion.div>

            {/* Stats Grid */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            >
                <motion.div variants={itemVariants}>
                    <StatCard
                        title="Total Candidates"
                        value={totalCandidates}
                        icon={Users}
                        variant="primary"
                        onClick={() => navigate('/recruiter/discover')}
                    />
                </motion.div>
                <motion.div variants={itemVariants}>
                    <StatCard
                        title="Saved Candidates"
                        value={savedCount}
                        icon={Heart}
                        variant="success"
                        onClick={() => navigate('/recruiter/saved')}
                    />
                </motion.div>
                <motion.div variants={itemVariants}>
                    <StatCard
                        title="Active Jobs"
                        value={0}
                        icon={Briefcase}
                        onClick={() => navigate('/recruiter/jobs')}
                    />
                </motion.div>
                <motion.div variants={itemVariants}>
                    <StatCard
                        title="Candidates Contacted"
                        value={0}
                        icon={Mail}
                        variant="warning"
                    />
                </motion.div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <motion.div variants={itemVariants}>
                        <Card
                            onClick={() => navigate('/recruiter/discover')}
                            className="cursor-pointer group hover:shadow-lg transition-all border-0 bg-gradient-to-br from-violet-600 to-purple-600 text-white"
                        >
                            <CardContent className="p-6">
                                <Search className="w-8 h-8 mb-4" />
                                <h3 className="font-semibold text-lg mb-1">Find Candidates</h3>
                                <p className="text-sm opacity-90 mb-4">Search by skills, college, or readiness</p>
                                <div className="flex items-center gap-1 text-sm font-medium">
                                    Explore <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <Card
                            onClick={() => navigate('/recruiter/jobs/new')}
                            className="cursor-pointer group hover:shadow-lg transition-all border-0 bg-gradient-to-br from-cyan-600 to-blue-600 text-white"
                        >
                            <CardContent className="p-6">
                                <Briefcase className="w-8 h-8 mb-4" />
                                <h3 className="font-semibold text-lg mb-1">Post a Job</h3>
                                <p className="text-sm opacity-90 mb-4">Create job with auto-matching</p>
                                <div className="flex items-center gap-1 text-sm font-medium">
                                    Create <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <Card
                            onClick={() => navigate('/recruiter/compare')}
                            className="cursor-pointer group hover:shadow-lg transition-all border-0 bg-gradient-to-br from-emerald-600 to-green-600 text-white"
                        >
                            <CardContent className="p-6">
                                <Users className="w-8 h-8 mb-4" />
                                <h3 className="font-semibold text-lg mb-1">Compare Candidates</h3>
                                <p className="text-sm opacity-90 mb-4">Side-by-side skill comparison</p>
                                <div className="flex items-center gap-1 text-sm font-medium">
                                    Compare <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </motion.div>

            {/* Recent Candidates */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Top Candidates</h2>
                    <Button variant="ghost" onClick={() => navigate('/recruiter/discover')}>
                        View All <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                </div>
                <Card>
                    <CardContent className="p-4">
                        {candidatesLoading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <Skeleton key={i} className="h-20 w-full" />
                                ))}
                            </div>
                        ) : recentCandidates?.students && recentCandidates.students.length > 0 ? (
                            <div className="space-y-3">
                                {recentCandidates.students.map((candidate) => (
                                    <CandidatePreview key={candidate._id} candidate={candidate} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>No candidates found</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
