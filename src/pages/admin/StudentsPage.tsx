import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
    Search,
    Filter,
    Users,
    GraduationCap,
    CheckCircle,
    XCircle,
    MoreVertical,
    Eye,
    Ban,
    Unlock,
    Mail,
    Download,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    TrendingUp,
    Code,
    Github,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { StatCard } from '@/components/data-display/StatCard';
import { ProgressRing } from '@/components/data-display/ProgressRing';

interface Student {
    _id: string;
    name: string;
    email: string;
    college?: string;
    branch?: string;
    year?: string;
    avatarUrl?: string;
    readinessScore: number;
    isVerified: boolean;
    isActive: boolean;
    skills: string[];
    leetcodeStats?: {
        totalSolved?: number;
    };
    githubStats?: {
        totalCommits?: number;
    };
    createdAt: string;
    lastActive?: string;
}

interface StudentStats {
    total: number;
    verified: number;
    active: number;
    avgReadiness: number;
}

export default function StudentsPage() {
    const { token } = useAuth();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'readiness' | 'createdAt'>('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [collegeFilter, setCollegeFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [page, setPage] = useState(1);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const pageSize = 10;

    const { data: students, isLoading } = useQuery({
        queryKey: ['admin-students', page, sortBy, sortOrder, collegeFilter, statusFilter],
        queryFn: async () => {
            const response = await adminApi.getStudents(
                {
                    page,
                    limit: pageSize,
                    sortBy,
                    sortOrder,
                    college: collegeFilter !== 'all' ? collegeFilter : undefined,
                    active: statusFilter !== 'all' ? statusFilter === 'active' : undefined,
                },
                token!
            );
            return response as { students: Student[]; total: number; colleges: string[] };
        },
        enabled: !!token,
    });

    const { data: stats } = useQuery({
        queryKey: ['admin-student-stats'],
        queryFn: async () => {
            const response = await adminApi.getStudentStats(token!);
            return response as StudentStats;
        },
        enabled: !!token,
    });

    const toggleStatusMutation = useMutation({
        mutationFn: ({ id, active }: { id: string; active: boolean }) =>
            adminApi.updateStudentStatus(id, active, token!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-students'] });
            queryClient.invalidateQueries({ queryKey: ['admin-student-stats'] });
            toast.success('Student status updated');
            setSelectedStudent(null);
        },
        onError: () => toast.error('Failed to update status'),
    });

    const filteredStudents = students?.students.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.college?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalPages = students ? Math.ceil(students.total / pageSize) : 0;

    const handleSort = (field: 'name' | 'readiness' | 'createdAt') => {
        if (sortBy === field) {
            setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
            >
                <div>
                    <h1 className="text-2xl font-bold">Students</h1>
                    <p className="text-muted-foreground">
                        Manage and monitor all registered students
                    </p>
                </div>
                <Button variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Export CSV
                </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="grid gap-4 md:grid-cols-4"
            >
                <StatCard
                    title="Total Students"
                    value={stats?.total || 0}
                    icon={Users}
                />
                <StatCard
                    title="Verified"
                    value={stats?.verified || 0}
                    icon={CheckCircle}
                    variant="success"
                />
                <StatCard
                    title="Active (30d)"
                    value={stats?.active || 0}
                    icon={TrendingUp}
                />
                <StatCard
                    title="Avg Readiness"
                    value={`${stats?.avgReadiness || 0}%`}
                    icon={GraduationCap}
                />
            </motion.div>

            {/* Filters */}
            <Card>
                <CardContent className="py-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, email, or college..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select value={collegeFilter} onValueChange={setCollegeFilter}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="All Colleges" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Colleges</SelectItem>
                                {students?.colleges.map(college => (
                                    <SelectItem key={college} value={college}>
                                        {college}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | 'active' | 'inactive')}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Student Table */}
            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-6 space-y-4">
                            {[1, 2, 3, 4, 5].map(i => (
                                <Skeleton key={i} className="h-16" />
                            ))}
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[300px]">
                                            <Button
                                                variant="ghost"
                                                onClick={() => handleSort('name')}
                                                className="gap-1 -ml-4"
                                            >
                                                Student
                                                <ArrowUpDown className="w-4 h-4" />
                                            </Button>
                                        </TableHead>
                                        <TableHead>College</TableHead>
                                        <TableHead className="text-center">
                                            <Button
                                                variant="ghost"
                                                onClick={() => handleSort('readiness')}
                                                className="gap-1"
                                            >
                                                Readiness
                                                <ArrowUpDown className="w-4 h-4" />
                                            </Button>
                                        </TableHead>
                                        <TableHead className="text-center">Coding</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                        <TableHead>
                                            <Button
                                                variant="ghost"
                                                onClick={() => handleSort('createdAt')}
                                                className="gap-1"
                                            >
                                                Joined
                                                <ArrowUpDown className="w-4 h-4" />
                                            </Button>
                                        </TableHead>
                                        <TableHead className="w-[50px]" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredStudents?.map(student => (
                                        <TableRow key={student._id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar>
                                                        <AvatarImage src={student.avatarUrl} />
                                                        <AvatarFallback>
                                                            {student.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-medium">{student.name}</p>
                                                            {student.isVerified && (
                                                                <CheckCircle className="w-4 h-4 text-primary" />
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">
                                                            {student.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="text-sm">{student.college || '-'}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {student.branch} • {student.year}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Progress
                                                        value={student.readinessScore}
                                                        className="w-16 h-2"
                                                    />
                                                    <span className="text-sm font-medium w-10">
                                                        {student.readinessScore}%
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Code className="w-3 h-3" />
                                                        {student.leetcodeStats?.totalSolved || 0}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Github className="w-3 h-3" />
                                                        {student.githubStats?.totalCommits || 0}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge
                                                    variant={student.isActive ? 'default' : 'secondary'}
                                                    className={cn(
                                                        student.isActive
                                                            ? 'bg-success/10 text-success border-success/20'
                                                            : 'bg-muted text-muted-foreground'
                                                    )}
                                                >
                                                    {student.isActive ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-muted-foreground">
                                                    {new Date(student.createdAt).toLocaleDateString()}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreVertical className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem>
                                                            <Eye className="w-4 h-4 mr-2" />
                                                            View Profile
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <Mail className="w-4 h-4 mr-2" />
                                                            Send Email
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => setSelectedStudent(student)}
                                                            className={student.isActive ? 'text-destructive' : 'text-success'}
                                                        >
                                                            {student.isActive ? (
                                                                <>
                                                                    <Ban className="w-4 h-4 mr-2" />
                                                                    Deactivate
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Unlock className="w-4 h-4 mr-2" />
                                                                    Activate
                                                                </>
                                                            )}
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between p-4 border-t">
                                    <p className="text-sm text-muted-foreground">
                                        Showing {((page - 1) * pageSize) + 1} to{' '}
                                        {Math.min(page * pageSize, students?.total || 0)} of{' '}
                                        {students?.total || 0} students
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(p => p - 1)}
                                            disabled={page === 1}
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </Button>
                                        <span className="text-sm">
                                            Page {page} of {totalPages}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(p => p + 1)}
                                            disabled={page === totalPages}
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Status Toggle Dialog */}
            <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {selectedStudent?.isActive ? 'Deactivate' : 'Activate'} Student
                        </DialogTitle>
                        <DialogDescription>
                            {selectedStudent?.isActive
                                ? 'This will prevent the student from logging in and accessing the platform.'
                                : 'This will restore the student\'s access to the platform.'}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedStudent && (
                        <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                            <Avatar>
                                <AvatarImage src={selectedStudent.avatarUrl} />
                                <AvatarFallback>
                                    {selectedStudent.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-medium">{selectedStudent.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    {selectedStudent.email}
                                </p>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedStudent(null)}>
                            Cancel
                        </Button>
                        <Button
                            variant={selectedStudent?.isActive ? 'destructive' : 'default'}
                            onClick={() =>
                                toggleStatusMutation.mutate({
                                    id: selectedStudent!._id,
                                    active: !selectedStudent!.isActive,
                                })
                            }
                            disabled={toggleStatusMutation.isPending}
                        >
                            {selectedStudent?.isActive ? (
                                <>
                                    <Ban className="w-4 h-4 mr-2" />
                                    Deactivate
                                </>
                            ) : (
                                <>
                                    <Unlock className="w-4 h-4 mr-2" />
                                    Activate
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
