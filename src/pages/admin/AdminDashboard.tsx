import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
    Users,
    ClipboardCheck,
    Building2,
    TrendingUp,
    AlertCircle,
    CheckCircle,
    Clock,
    ArrowRight,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

interface VerificationItem {
    _id: string;
    studentId: string;
    studentName: string;
    itemType: 'project' | 'certification' | 'event';
    itemId: string;
    itemTitle: string;
    submittedAt: string;
}

function VerificationPreview({ item, onView }: { item: VerificationItem; onView: () => void }) {
    const typeColors = {
        project: 'bg-blue-500/10 text-blue-500',
        certification: 'bg-amber-500/10 text-amber-500',
        event: 'bg-violet-500/10 text-violet-500',
    };

    return (
        <div
            onClick={onView}
            className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
        >
            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', typeColors[item.itemType])}>
                <ClipboardCheck className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{item.itemTitle}</p>
                <p className="text-sm text-muted-foreground">by {item.studentName}</p>
            </div>
            <div className="text-right">
                <Badge variant="outline" className="capitalize">{item.itemType}</Badge>
                <p className="text-xs text-muted-foreground mt-1">
                    {new Date(item.submittedAt).toLocaleDateString()}
                </p>
            </div>
        </div>
    );
}

export default function AdminDashboard() {
    const { user, token } = useAuth();
    const navigate = useNavigate();

    // Fetch pending verifications
    const { data: verifications, isLoading: verificationsLoading } = useQuery<VerificationItem[]>({
        queryKey: ['pending-verifications'],
        queryFn: () => adminApi.getPendingVerifications(token!) as any,
        enabled: !!token,
    });

    // Fetch students count
    const { data: students, isLoading: studentsLoading } = useQuery<any[]>({
        queryKey: ['all-students'],
        queryFn: () => adminApi.getAllStudents(token!) as any,
        enabled: !!token,
    });

    // Fetch recruiters count
    const { data: recruiters, isLoading: recruitersLoading } = useQuery<any[]>({
        queryKey: ['all-recruiters'],
        queryFn: () => adminApi.getAllRecruiters(token!) as any,
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

    const pendingCount = verifications?.length || 0;
    const studentCount = Array.isArray(students) ? students.length : 0;
    const recruiterCount = Array.isArray(recruiters) ? recruiters.length : 0;

    return (
        <div className="p-6 lg:p-8 space-y-8">
            {/* Welcome Header */}
            <motion.div
                variants={itemVariants}
                initial="hidden"
                animate="visible"
            >
                <h1 className="text-3xl font-bold">
                    Admin <span className="text-gradient">Dashboard</span>
                </h1>
                <p className="text-muted-foreground mt-1">
                    Welcome back, {user?.name || 'Admin'}
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
                        title="Pending Verifications"
                        value={pendingCount}
                        icon={ClipboardCheck}
                        variant={pendingCount > 0 ? 'warning' : 'default'}
                        onClick={() => navigate('/admin/verifications')}
                    />
                </motion.div>
                <motion.div variants={itemVariants}>
                    <StatCard
                        title="Total Students"
                        value={studentCount}
                        icon={Users}
                        variant="primary"
                        onClick={() => navigate('/admin/students')}
                    />
                </motion.div>
                <motion.div variants={itemVariants}>
                    <StatCard
                        title="Total Recruiters"
                        value={recruiterCount}
                        icon={Building2}
                        variant="success"
                    />
                </motion.div>
                <motion.div variants={itemVariants}>
                    <StatCard
                        title="Platform Health"
                        value="Good"
                        icon={TrendingUp}
                    />
                </motion.div>
            </motion.div>

            {/* Pending Verifications */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Clock className="w-5 h-5 text-warning" />
                        Pending Verifications
                    </h2>
                    <Button variant="ghost" onClick={() => navigate('/admin/verifications')}>
                        View All <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                </div>
                <Card>
                    <CardContent className="p-4">
                        {verificationsLoading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <Skeleton key={i} className="h-16 w-full" />
                                ))}
                            </div>
                        ) : verifications && verifications.length > 0 ? (
                            <div className="space-y-3">
                                {verifications.slice(0, 5).map((item) => (
                                    <VerificationPreview
                                        key={item._id}
                                        item={item}
                                        onView={() => navigate(`/admin/verifications/${item._id}`)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-success opacity-50" />
                                <p className="font-medium text-success">All caught up!</p>
                                <p className="text-sm text-muted-foreground">No pending verifications</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
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
                            onClick={() => navigate('/admin/verifications')}
                            className="cursor-pointer group hover:shadow-lg transition-all border-0 bg-gradient-to-br from-amber-600 to-orange-600 text-white"
                        >
                            <CardContent className="p-6">
                                <ClipboardCheck className="w-8 h-8 mb-4" />
                                <h3 className="font-semibold text-lg mb-1">Review Submissions</h3>
                                <p className="text-sm opacity-90 mb-4">Verify projects & certifications</p>
                                <div className="flex items-center gap-1 text-sm font-medium">
                                    Review <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <Card
                            onClick={() => navigate('/admin/students')}
                            className="cursor-pointer group hover:shadow-lg transition-all border-0 bg-gradient-to-br from-cyan-600 to-blue-600 text-white"
                        >
                            <CardContent className="p-6">
                                <Users className="w-8 h-8 mb-4" />
                                <h3 className="font-semibold text-lg mb-1">Manage Students</h3>
                                <p className="text-sm opacity-90 mb-4">View and manage all students</p>
                                <div className="flex items-center gap-1 text-sm font-medium">
                                    Manage <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <Card
                            onClick={() => navigate('/admin/analytics')}
                            className="cursor-pointer group hover:shadow-lg transition-all border-0 bg-gradient-to-br from-violet-600 to-purple-600 text-white"
                        >
                            <CardContent className="p-6">
                                <TrendingUp className="w-8 h-8 mb-4" />
                                <h3 className="font-semibold text-lg mb-1">View Analytics</h3>
                                <p className="text-sm opacity-90 mb-4">Platform statistics & trends</p>
                                <div className="flex items-center gap-1 text-sm font-medium">
                                    View <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
}
