import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
    TrendingUp,
    TrendingDown,
    Users,
    GraduationCap,
    Briefcase,
    CheckCircle,
    Code,
    Calendar,
    Download,
    RefreshCw,
    ArrowUp,
    ArrowDown,
    Activity,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { StatCard } from '@/components/data-display/StatCard';
import { ProgressRing } from '@/components/data-display/ProgressRing';

interface PlatformStats {
    students: {
        total: number;
        active: number;
        newThisMonth: number;
        trend: number;
    };
    recruiters: {
        total: number;
        active: number;
        newThisMonth: number;
        trend: number;
    };
    jobs: {
        total: number;
        active: number;
        applications: number;
        trend: number;
    };
    verifications: {
        pending: number;
        approvedThisMonth: number;
        avgProcessTime: number;
    };
    engagement: {
        avgDailyActive: number;
        avgSessionDuration: number;
        topFeature: string;
    };
}

interface ChartData {
    registrations: { date: string; students: number; recruiters: number }[];
    readinessDistribution: { range: string; count: number }[];
    skillsBreakdown: { skill: string; count: number }[];
    collegeWise: { college: string; students: number; avgReadiness: number }[];
}

export default function AnalyticsPage() {
    const { token } = useAuth();
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['admin-analytics-stats', timeRange],
        queryFn: async () => {
            const response = await adminApi.getPlatformStats(timeRange, token!);
            return response as PlatformStats;
        },
        enabled: !!token,
    });

    const { data: chartData, isLoading: chartLoading } = useQuery({
        queryKey: ['admin-analytics-charts', timeRange],
        queryFn: async () => {
            const response = await adminApi.getAnalyticsCharts(timeRange, token!);
            return response as ChartData;
        },
        enabled: !!token,
    });

    const isLoading = statsLoading || chartLoading;

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
            >
                <div>
                    <h1 className="text-2xl font-bold">Analytics</h1>
                    <p className="text-muted-foreground">
                        Platform metrics and insights
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={timeRange} onValueChange={(v) => setTimeRange(v as '7d' | '30d' | '90d' | '1y')}>
                        <SelectTrigger className="w-[140px]">
                            <Calendar className="w-4 h-4 mr-2" />
                            <SelectValue placeholder="Time Range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7d">Last 7 days</SelectItem>
                            <SelectItem value="30d">Last 30 days</SelectItem>
                            <SelectItem value="90d">Last 90 days</SelectItem>
                            <SelectItem value="1y">Last year</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" className="gap-2">
                        <Download className="w-4 h-4" />
                        Export
                    </Button>
                </div>
            </motion.div>

            {/* Main Stats Grid */}
            {isLoading ? (
                <div className="grid gap-4 md:grid-cols-4">
                    {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} className="h-32" />
                    ))}
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="grid gap-4 md:grid-cols-4"
                >
                    <MetricCard
                        title="Total Students"
                        value={stats?.students.total || 0}
                        subtitle={`${stats?.students.newThisMonth || 0} new this month`}
                        trend={stats?.students.trend || 0}
                        icon={GraduationCap}
                    />
                    <MetricCard
                        title="Active Students"
                        value={stats?.students.active || 0}
                        subtitle="Last 30 days"
                        trend={5.2}
                        icon={Activity}
                    />
                    <MetricCard
                        title="Total Recruiters"
                        value={stats?.recruiters.total || 0}
                        subtitle={`${stats?.recruiters.newThisMonth || 0} new this month`}
                        trend={stats?.recruiters.trend || 0}
                        icon={Briefcase}
                    />
                    <MetricCard
                        title="Active Jobs"
                        value={stats?.jobs.active || 0}
                        subtitle={`${stats?.jobs.applications || 0} applications`}
                        trend={stats?.jobs.trend || 0}
                        icon={CheckCircle}
                    />
                </motion.div>
            )}

            {/* Charts Row 1 */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Registrations Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle className="text-lg">User Registrations</CardTitle>
                            <CardDescription>New users over time</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {chartLoading ? (
                                <Skeleton className="h-64" />
                            ) : (
                                <div className="h-64">
                                    <SimpleLineChart data={chartData?.registrations || []} />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Readiness Distribution */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle className="text-lg">Readiness Distribution</CardTitle>
                            <CardDescription>Student readiness score breakdown</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {chartLoading ? (
                                <Skeleton className="h-64" />
                            ) : (
                                <div className="space-y-4">
                                    {(chartData?.readinessDistribution || defaultReadinessData).map(item => (
                                        <div key={item.range} className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span>{item.range}</span>
                                                <span className="font-medium">{item.count} students</span>
                                            </div>
                                            <Progress
                                                value={
                                                    (item.count /
                                                        Math.max(
                                                            ...(chartData?.readinessDistribution || defaultReadinessData).map(
                                                                d => d.count
                                                            )
                                                        )) *
                                                    100
                                                }
                                                className="h-2"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Top Skills */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle className="text-lg">Top Skills</CardTitle>
                            <CardDescription>Most common student skills</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {chartLoading ? (
                                <Skeleton className="h-48" />
                            ) : (
                                <div className="space-y-3">
                                    {(chartData?.skillsBreakdown || defaultSkillsData)
                                        .slice(0, 8)
                                        .map((skill, index) => (
                                            <div
                                                key={skill.skill}
                                                className="flex items-center justify-between"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-muted-foreground w-4">
                                                        {index + 1}
                                                    </span>
                                                    <Badge variant="outline">{skill.skill}</Badge>
                                                </div>
                                                <span className="text-sm font-medium">
                                                    {skill.count}
                                                </span>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* College Breakdown */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="lg:col-span-2"
                >
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle className="text-lg">Top Colleges</CardTitle>
                            <CardDescription>Students by institution</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {chartLoading ? (
                                <Skeleton className="h-48" />
                            ) : (
                                <div className="space-y-4">
                                    {(chartData?.collegeWise || defaultCollegeData)
                                        .slice(0, 5)
                                        .map((college, index) => (
                                            <div
                                                key={college.college}
                                                className="flex items-center gap-4"
                                            >
                                                <span className="text-lg font-bold text-muted-foreground w-6">
                                                    #{index + 1}
                                                </span>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="font-medium truncate">
                                                            {college.college}
                                                        </span>
                                                        <span className="text-sm text-muted-foreground">
                                                            {college.students} students
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Progress
                                                            value={college.avgReadiness}
                                                            className="flex-1 h-2"
                                                        />
                                                        <span className="text-xs text-muted-foreground w-12">
                                                            {college.avgReadiness}% avg
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Engagement Stats */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
            >
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Engagement Overview</CardTitle>
                        <CardDescription>Platform usage and activity metrics</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-6 md:grid-cols-4">
                            <div className="text-center p-4 rounded-lg bg-muted/50">
                                <p className="text-3xl font-bold">
                                    {stats?.engagement.avgDailyActive || 0}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Avg Daily Active Users
                                </p>
                            </div>
                            <div className="text-center p-4 rounded-lg bg-muted/50">
                                <p className="text-3xl font-bold">
                                    {stats?.engagement.avgSessionDuration || 0}m
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Avg Session Duration
                                </p>
                            </div>
                            <div className="text-center p-4 rounded-lg bg-muted/50">
                                <p className="text-3xl font-bold">
                                    {stats?.verifications.pending || 0}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Pending Verifications
                                </p>
                            </div>
                            <div className="text-center p-4 rounded-lg bg-muted/50">
                                <p className="text-3xl font-bold">
                                    {stats?.verifications.avgProcessTime || 0}h
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Avg Verification Time
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}

// Simple metric card with trend
function MetricCard({
    title,
    value,
    subtitle,
    trend,
    icon: Icon,
}: {
    title: string;
    value: number | string;
    subtitle: string;
    trend: number;
    icon: React.ElementType;
}) {
    const isPositive = trend >= 0;

    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="w-5 h-5 text-primary" />
                    </div>
                    {trend !== 0 && (
                        <Badge
                            variant="outline"
                            className={cn(
                                'gap-1',
                                isPositive
                                    ? 'bg-success/10 text-success border-success/20'
                                    : 'bg-destructive/10 text-destructive border-destructive/20'
                            )}
                        >
                            {isPositive ? (
                                <ArrowUp className="w-3 h-3" />
                            ) : (
                                <ArrowDown className="w-3 h-3" />
                            )}
                            {Math.abs(trend)}%
                        </Badge>
                    )}
                </div>
                <div className="mt-4">
                    <p className="text-3xl font-bold">{value.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">{title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
                </div>
            </CardContent>
        </Card>
    );
}

// Simple line chart component (placeholder for actual chart library)
function SimpleLineChart({
    data,
}: {
    data: { date: string; students: number; recruiters: number }[];
}) {
    if (!data || data.length === 0) {
        return (
            <div className="h-full flex items-center justify-center text-muted-foreground">
                No data available
            </div>
        );
    }

    const maxValue = Math.max(...data.flatMap(d => [d.students, d.recruiters]));

    return (
        <div className="h-full flex flex-col">
            <div className="flex gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    Students
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full bg-accent" />
                    Recruiters
                </div>
            </div>
            <div className="flex-1 flex items-end gap-1">
                {data.slice(-14).map((item, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full flex gap-0.5" style={{ height: '150px' }}>
                            <div
                                className="flex-1 bg-primary/80 rounded-t transition-all hover:bg-primary"
                                style={{
                                    height: `${(item.students / maxValue) * 100}%`,
                                    marginTop: 'auto',
                                }}
                                title={`Students: ${item.students}`}
                            />
                            <div
                                className="flex-1 bg-accent/80 rounded-t transition-all hover:bg-accent"
                                style={{
                                    height: `${(item.recruiters / maxValue) * 100}%`,
                                    marginTop: 'auto',
                                }}
                                title={`Recruiters: ${item.recruiters}`}
                            />
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                            {new Date(item.date).getDate()}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Default data for fallback
const defaultReadinessData = [
    { range: '0-20%', count: 15 },
    { range: '21-40%', count: 45 },
    { range: '41-60%', count: 120 },
    { range: '61-80%', count: 85 },
    { range: '81-100%', count: 35 },
];

const defaultSkillsData = [
    { skill: 'JavaScript', count: 180 },
    { skill: 'Python', count: 165 },
    { skill: 'React', count: 142 },
    { skill: 'Node.js', count: 98 },
    { skill: 'Java', count: 87 },
    { skill: 'SQL', count: 76 },
    { skill: 'TypeScript', count: 68 },
    { skill: 'AWS', count: 45 },
];

const defaultCollegeData = [
    { college: 'IIT Delhi', students: 156, avgReadiness: 78 },
    { college: 'IIT Bombay', students: 142, avgReadiness: 82 },
    { college: 'NIT Trichy', students: 98, avgReadiness: 71 },
    { college: 'BITS Pilani', students: 87, avgReadiness: 75 },
    { college: 'VIT Vellore', students: 76, avgReadiness: 68 },
];
