import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
    Briefcase,
    Plus,
    Search,
    Users,
    Clock,
    CheckCircle,
    XCircle,
    MoreVertical,
    Edit,
    Trash2,
    Eye,
    Send,
    ChevronRight,
    Building2,
    MapPin,
    DollarSign,
    Filter,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { EmptyState } from '@/components/data-display/EmptyState';

interface Job {
    _id: string;
    title: string;
    description: string;
    location: string;
    type: 'full-time' | 'part-time' | 'internship' | 'contract';
    experience: string;
    salary?: { min?: number; max?: number; currency?: string };
    requiredSkills: string[];
    preferredSkills?: string[];
    status: 'draft' | 'active' | 'closed';
    matchedStudents?: { count: number };
    createdAt: string;
    updatedAt: string;
}

interface JobFormData {
    title: string;
    description: string;
    location: string;
    type: string;
    experience: string;
    requiredSkills: string[];
    preferredSkills: string[];
    salaryMin?: number;
    salaryMax?: number;
}

const initialFormData: JobFormData = {
    title: '',
    description: '',
    location: '',
    type: 'full-time',
    experience: 'entry',
    requiredSkills: [],
    preferredSkills: [],
};

function JobCard({ job, onView, onEdit, onDelete }: {
    job: Job;
    onView: () => void;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const statusConfig = {
        draft: { label: 'Draft', variant: 'secondary' as const, icon: Clock },
        active: { label: 'Active', variant: 'default' as const, icon: CheckCircle },
        closed: { label: 'Closed', variant: 'destructive' as const, icon: XCircle },
    };

    const config = statusConfig[job.status];
    const StatusIcon = config.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
        >
            <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={onView}>
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-lg">{job.title}</CardTitle>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="w-4 h-4" />
                                {job.location || 'Remote'}
                                <span className="mx-1">•</span>
                                <span className="capitalize">{job.type}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant={config.variant} className="gap-1">
                                <StatusIcon className="w-3 h-3" />
                                {config.label}
                            </Badge>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                                    <Button variant="ghost" size="icon">
                                        <MoreVertical className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(); }}>
                                        <Eye className="w-4 h-4 mr-2" />
                                        View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit Job
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                                        className="text-destructive"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                        {job.description || 'No description provided'}
                    </p>

                    {job.requiredSkills && job.requiredSkills.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {job.requiredSkills.slice(0, 5).map((skill, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                    {skill}
                                </Badge>
                            ))}
                            {job.requiredSkills.length > 5 && (
                                <Badge variant="outline" className="text-xs">
                                    +{job.requiredSkills.length - 5}
                                </Badge>
                            )}
                        </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="w-4 h-4" />
                            <span>
                                {job.matchedStudents?.count || 0} matches
                            </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                            {new Date(job.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

function CreateJobDialog({
    open,
    onOpenChange,
    onSubmit,
    isLoading,
    initialData,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: JobFormData) => void;
    isLoading: boolean;
    initialData?: Job;
}) {
    const [formData, setFormData] = useState<JobFormData>(
        initialData
            ? {
                  title: initialData.title,
                  description: initialData.description,
                  location: initialData.location,
                  type: initialData.type,
                  experience: initialData.experience,
                  requiredSkills: initialData.requiredSkills,
                  preferredSkills: initialData.preferredSkills || [],
                  salaryMin: initialData.salary?.min,
                  salaryMax: initialData.salary?.max,
              }
            : initialFormData
    );
    const [skillInput, setSkillInput] = useState('');

    const addSkill = (type: 'required' | 'preferred') => {
        if (!skillInput.trim()) return;
        const key = type === 'required' ? 'requiredSkills' : 'preferredSkills';
        setFormData({
            ...formData,
            [key]: [...formData[key], skillInput.trim()],
        });
        setSkillInput('');
    };

    const removeSkill = (type: 'required' | 'preferred', index: number) => {
        const key = type === 'required' ? 'requiredSkills' : 'preferredSkills';
        setFormData({
            ...formData,
            [key]: formData[key].filter((_, i) => i !== index),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {initialData ? 'Edit Job' : 'Create New Job'}
                    </DialogTitle>
                    <DialogDescription>
                        {initialData
                            ? 'Update the job posting details'
                            : 'Fill in the details to create a new job posting'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="title">Job Title *</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g., Senior Frontend Developer"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Input
                                id="location"
                                value={formData.location}
                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                                placeholder="e.g., Bangalore, Remote"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Describe the role, responsibilities, and requirements..."
                            rows={4}
                        />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Job Type</Label>
                            <Select
                                value={formData.type}
                                onValueChange={value => setFormData({ ...formData, type: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="full-time">Full-time</SelectItem>
                                    <SelectItem value="part-time">Part-time</SelectItem>
                                    <SelectItem value="internship">Internship</SelectItem>
                                    <SelectItem value="contract">Contract</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Experience Level</Label>
                            <Select
                                value={formData.experience}
                                onValueChange={value => setFormData({ ...formData, experience: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="entry">Entry Level (0-1 years)</SelectItem>
                                    <SelectItem value="mid">Mid Level (2-4 years)</SelectItem>
                                    <SelectItem value="senior">Senior Level (5+ years)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Required Skills</Label>
                        <div className="flex gap-2">
                            <Input
                                value={skillInput}
                                onChange={e => setSkillInput(e.target.value)}
                                placeholder="Add a skill"
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill('required'))}
                            />
                            <Button type="button" variant="secondary" onClick={() => addSkill('required')}>
                                Add
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                            {formData.requiredSkills.map((skill, i) => (
                                <Badge key={i} variant="secondary" className="gap-1">
                                    {skill}
                                    <button
                                        type="button"
                                        onClick={() => removeSkill('required', i)}
                                        className="ml-1 hover:text-destructive"
                                    >
                                        ×
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={() => onSubmit(formData)}
                        disabled={isLoading || !formData.title || !formData.description}
                    >
                        {isLoading ? 'Saving...' : initialData ? 'Update Job' : 'Create Job'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function JobsPage() {
    const { token } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editingJob, setEditingJob] = useState<Job | null>(null);

    const { data: jobs, isLoading } = useQuery({
        queryKey: ['recruiter-jobs'],
        queryFn: async () => {
            const response = await api.get<{ jobs: Job[] } | Job[]>('/jobs', token!);
            return Array.isArray(response) ? response : response.jobs || [];
        },
        enabled: !!token,
    });

    const createMutation = useMutation({
        mutationFn: (data: JobFormData) =>
            api.post('/jobs', {
                ...data,
                salary: data.salaryMin || data.salaryMax
                    ? { min: data.salaryMin, max: data.salaryMax, currency: 'INR' }
                    : undefined,
            }, token!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recruiter-jobs'] });
            setCreateDialogOpen(false);
            toast.success('Job created successfully!');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to create job');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (jobId: string) => api.delete(`/jobs/${jobId}`, token!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recruiter-jobs'] });
            toast.success('Job deleted');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete job');
        },
    });

    const filteredJobs = jobs?.filter(job => {
        const matchesTab = activeTab === 'all' || job.status === activeTab;
        const matchesSearch =
            !searchQuery ||
            job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTab && matchesSearch;
    }) || [];

    const stats = {
        total: jobs?.length || 0,
        active: jobs?.filter(j => j.status === 'active').length || 0,
        draft: jobs?.filter(j => j.status === 'draft').length || 0,
        totalMatches: jobs?.reduce((acc, j) => acc + (j.matchedStudents?.count || 0), 0) || 0,
    };

    if (isLoading) {
        return (
            <div className="p-6 space-y-6 max-w-6xl mx-auto">
                <Skeleton className="h-8 w-48" />
                <div className="grid gap-4 md:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-24" />
                    ))}
                </div>
                <Skeleton className="h-96" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="text-2xl font-bold mb-2">My Jobs</h1>
                    <p className="text-muted-foreground">
                        Create and manage your job postings
                    </p>
                </div>
                <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    New Job
                </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid gap-4 md:grid-cols-4"
            >
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/20">
                                <Briefcase className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.total}</p>
                                <p className="text-sm text-muted-foreground">Total Jobs</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-success/20">
                                <CheckCircle className="w-5 h-5 text-success" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.active}</p>
                                <p className="text-sm text-muted-foreground">Active</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-warning/20">
                                <Clock className="w-5 h-5 text-warning" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.draft}</p>
                                <p className="text-sm text-muted-foreground">Drafts</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-accent/20">
                                <Users className="w-5 h-5 text-accent" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.totalMatches}</p>
                                <p className="text-sm text-muted-foreground">Total Matches</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Filters & List */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
                            <Tabs value={activeTab} onValueChange={setActiveTab}>
                                <TabsList>
                                    <TabsTrigger value="all">All</TabsTrigger>
                                    <TabsTrigger value="active">Active</TabsTrigger>
                                    <TabsTrigger value="draft">Drafts</TabsTrigger>
                                    <TabsTrigger value="closed">Closed</TabsTrigger>
                                </TabsList>
                            </Tabs>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search jobs..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="pl-9 w-full md:w-64"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {filteredJobs.length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-2">
                                {filteredJobs.map(job => (
                                    <JobCard
                                        key={job._id}
                                        job={job}
                                        onView={() => navigate(`/recruiter/jobs/${job._id}`)}
                                        onEdit={() => setEditingJob(job)}
                                        onDelete={() => deleteMutation.mutate(job._id)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                icon={Briefcase}
                                title="No jobs found"
                                description={
                                    searchQuery
                                        ? 'Try a different search term'
                                        : 'Create your first job posting to start finding candidates'
                                }
                                action={
                                    !searchQuery
                                        ? {
                                              label: 'Create Job',
                                              onClick: () => setCreateDialogOpen(true),
                                          }
                                        : undefined
                                }
                            />
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* Create Dialog */}
            <CreateJobDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onSubmit={createMutation.mutate}
                isLoading={createMutation.isPending}
            />

            {/* Edit Dialog */}
            {editingJob && (
                <CreateJobDialog
                    open={!!editingJob}
                    onOpenChange={() => setEditingJob(null)}
                    onSubmit={(data) => {
                        // Handle edit
                        api.put(`/jobs/${editingJob._id}`, data, token!)
                            .then(() => {
                                queryClient.invalidateQueries({ queryKey: ['recruiter-jobs'] });
                                setEditingJob(null);
                                toast.success('Job updated!');
                            })
                            .catch((err: any) => toast.error(err.message));
                    }}
                    isLoading={false}
                    initialData={editingJob}
                />
            )}
        </div>
    );
}
