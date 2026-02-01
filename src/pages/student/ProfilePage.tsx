import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { studentApi, StudentProfileDTO, UpdateStudentProfilePayload } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
    User,
    Mail,
    Phone,
    MapPin,
    GraduationCap,
    Calendar,
    Globe,
    Linkedin,
    Github,
    FileText,
    Edit2,
    Save,
    X,
    Plus,
    Trash2,
    ExternalLink,
    CheckCircle,
    Clock,
    RefreshCw,
    Code,
    Award,
    Trophy,
    Sparkles,
    Target,
    Zap,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress, ProgressRing } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { SkillRadar } from '@/components/data-display/SkillRadar';

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

// Profile Header Component
function ProfileHeader({
    profile,
    onEdit,
    isEditing,
}: {
    profile: StudentProfileDTO;
    onEdit: () => void;
    isEditing: boolean;
}) {
    const completionPercent = calculateProfileCompletion(profile);

    return (
        <Card variant="bento" className="overflow-hidden">
            {/* Gradient Banner */}
            <div className="h-32 bg-gradient-to-r from-primary/30 via-purple-500/20 to-accent/30 relative">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
                <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute -top-4 -left-4 w-24 h-24 bg-accent/10 rounded-full blur-3xl" />
            </div>
            
            <CardContent className="relative pt-0 pb-6">
                <div className="flex flex-col md:flex-row gap-6 -mt-16">
                    <div className="relative">
                        <Avatar className="w-28 h-28 border-4 border-background ring-2 ring-primary/20 shadow-xl">
                            <AvatarImage src={profile.avatarUrl} alt={profile.name} />
                            <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-purple-600 text-white">
                                {profile.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-success rounded-full border-4 border-background flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                    </div>

                    <div className="flex-1 space-y-3 pt-4 md:pt-8">
                        <div className="flex items-start justify-between">
                            <div>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                                    {profile.name || 'Your Name'}
                                </h1>
                                <p className="text-muted-foreground">
                                    {profile.headline || 'Add a headline to describe yourself'}
                                </p>
                            </div>
                            <Button
                                variant={isEditing ? 'soft-destructive' : 'soft-primary'}
                                onClick={onEdit}
                                className="gap-2"
                            >
                                {isEditing ? (
                                    <>
                                        <X className="w-4 h-4" /> Cancel
                                    </>
                                ) : (
                                    <>
                                        <Edit2 className="w-4 h-4" /> Edit Profile
                                    </>
                                )}
                            </Button>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            {profile.college && (
                                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/50">
                                    <GraduationCap className="w-4 h-4 text-primary" />
                                    {profile.college}
                                </span>
                            )}
                            {profile.location && (
                                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/50">
                                    <MapPin className="w-4 h-4 text-accent" />
                                    {profile.location}
                                </span>
                            )}
                            {profile.email && (
                                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/50">
                                    <Mail className="w-4 h-4 text-secondary" />
                                    {profile.email}
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-6 pt-2">
                            <div className="flex-1 max-w-md">
                                <div className="flex items-center justify-between text-sm mb-2">
                                    <span className="text-muted-foreground flex items-center gap-1.5">
                                        <Target className="w-4 h-4" />
                                        Profile Completion
                                    </span>
                                    <span className="font-semibold text-primary">{completionPercent}%</span>
                                </div>
                                <Progress 
                                    value={completionPercent} 
                                    variant="primary"
                                    indicatorVariant="gradient"
                                    size="sm"
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <ProgressRing
                                    value={profile.readinessScore || 0}
                                    size={64}
                                    strokeWidth={6}
                                    variant={
                                        (profile.readinessScore || 0) >= 70
                                            ? 'success'
                                            : (profile.readinessScore || 0) >= 40
                                            ? 'warning'
                                            : 'destructive'
                                    }
                                >
                                    <div className="text-center">
                                        <span className="text-lg font-bold">{profile.readinessScore || 0}</span>
                                    </div>
                                </ProgressRing>
                                <div className="text-sm">
                                    <p className="font-medium">Readiness</p>
                                    <p className="text-xs text-muted-foreground">Score</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Edit Profile Form
function EditProfileForm({
    profile,
    onSave,
    onCancel,
    isSaving,
}: {
    profile: StudentProfileDTO;
    onSave: (data: UpdateStudentProfilePayload) => void;
    onCancel: () => void;
    isSaving: boolean;
}) {
    const [formData, setFormData] = useState<UpdateStudentProfilePayload>({
        name: profile.name || '',
        headline: profile.headline || '',
        summary: profile.summary || '',
        phone: profile.phone || '',
        location: profile.location || '',
        college: profile.college || '',
        branch: profile.branch || '',
        year: profile.year || '',
        graduationYear: profile.graduationYear,
        cgpa: profile.cgpa,
        portfolioUrl: profile.portfolioUrl || '',
        linkedinUrl: profile.linkedinUrl || '',
        githubUrl: profile.githubUrl || '',
    });

    const handleChange = (field: keyof UpdateStudentProfilePayload, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <Card variant="glass">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Edit2 className="w-5 h-5 text-primary" />
                    Edit Profile
                </CardTitle>
                <CardDescription>Update your personal and academic information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={e => handleChange('name', e.target.value)}
                            placeholder="John Doe"
                            className="bg-background/50"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="headline">Headline</Label>
                        <Input
                            id="headline"
                            value={formData.headline}
                            onChange={e => handleChange('headline', e.target.value)}
                            placeholder="Aspiring Full Stack Developer"
                            className="bg-background/50"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="summary">Summary</Label>
                    <Textarea
                        id="summary"
                        value={formData.summary}
                        onChange={e => handleChange('summary', e.target.value)}
                        placeholder="Tell recruiters about yourself..."
                        rows={4}
                        className="bg-background/50"
                    />
                </div>

                <Separator className="bg-border/50" />

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                            id="phone"
                            value={formData.phone}
                            onChange={e => handleChange('phone', e.target.value)}
                            placeholder="+91 98765 43210"
                            className="bg-background/50"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                            id="location"
                            value={formData.location}
                            onChange={e => handleChange('location', e.target.value)}
                            placeholder="City, Country"
                            className="bg-background/50"
                        />
                    </div>
                </div>

                <Separator className="bg-border/50" />

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="college">College</Label>
                        <Input
                            id="college"
                            value={formData.college}
                            onChange={e => handleChange('college', e.target.value)}
                            placeholder="Your College Name"
                            className="bg-background/50"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="branch">Branch</Label>
                        <Input
                            id="branch"
                            value={formData.branch}
                            onChange={e => handleChange('branch', e.target.value)}
                            placeholder="Computer Science"
                            className="bg-background/50"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="year">Year</Label>
                        <Select
                            value={formData.year}
                            onValueChange={value => handleChange('year', value)}
                        >
                            <SelectTrigger className="bg-background/50">
                                <SelectValue placeholder="Select year" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1st">1st Year</SelectItem>
                                <SelectItem value="2nd">2nd Year</SelectItem>
                                <SelectItem value="3rd">3rd Year</SelectItem>
                                <SelectItem value="4th">4th Year</SelectItem>
                                <SelectItem value="Graduate">Graduate</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="cgpa">CGPA</Label>
                        <Input
                            id="cgpa"
                            type="number"
                            step="0.01"
                            min="0"
                            max="10"
                            value={formData.cgpa || ''}
                            onChange={e => handleChange('cgpa', parseFloat(e.target.value) || 0)}
                            placeholder="8.5"
                            className="bg-background/50"
                        />
                    </div>
                </div>

                <Separator className="bg-border/50" />

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="linkedinUrl" className="flex items-center gap-2">
                            <Linkedin className="w-4 h-4 text-[#0077b5]" />
                            LinkedIn URL
                        </Label>
                        <Input
                            id="linkedinUrl"
                            value={formData.linkedinUrl}
                            onChange={e => handleChange('linkedinUrl', e.target.value)}
                            placeholder="https://linkedin.com/in/yourprofile"
                            className="bg-background/50"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="githubUrl" className="flex items-center gap-2">
                            <Github className="w-4 h-4" />
                            GitHub URL
                        </Label>
                        <Input
                            id="githubUrl"
                            value={formData.githubUrl}
                            onChange={e => handleChange('githubUrl', e.target.value)}
                            placeholder="https://github.com/yourusername"
                            className="bg-background/50"
                        />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="portfolioUrl" className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-accent" />
                            Portfolio URL
                        </Label>
                        <Input
                            id="portfolioUrl"
                            value={formData.portfolioUrl}
                            onChange={e => handleChange('portfolioUrl', e.target.value)}
                            placeholder="https://yourportfolio.com"
                            className="bg-background/50"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline" onClick={onCancel} disabled={isSaving}>
                        Cancel
                    </Button>
                    <Button variant="gradient" onClick={() => onSave(formData)} disabled={isSaving}>
                        {isSaving ? (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Save Changes
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

// Skills Tab
function SkillsTab({ profile }: { profile: StudentProfileDTO }) {
    return (
        <motion.div 
            className="grid gap-6 md:grid-cols-2"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <motion.div variants={itemVariants}>
                <Card variant="bento">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Sparkles className="w-4 h-4 text-primary" />
                            </div>
                            Skill Radar
                        </CardTitle>
                        <CardDescription>Visual representation of your skills</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        {profile.skillRadar && Object.keys(profile.skillRadar).length >= 3 ? (
                            <SkillRadar data={profile.skillRadar} size={250} />
                        ) : (
                            <div className="text-center text-muted-foreground py-8">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                                    <Code className="w-8 h-8 opacity-50" />
                                </div>
                                <p className="font-medium">Add more skills</p>
                                <p className="text-sm">to see your radar chart</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
                <Card variant="bento">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-accent/10">
                                    <Code className="w-4 h-4 text-accent" />
                                </div>
                                Skills
                            </CardTitle>
                            <CardDescription>Your technical skills</CardDescription>
                        </div>
                        <Button variant="soft-primary" size="sm" className="gap-1">
                            <Plus className="w-4 h-4" /> Add
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {profile.skills && profile.skills.length > 0 ? (
                                profile.skills.map((skill, index) => (
                                    <Badge 
                                        key={index} 
                                        variant="secondary" 
                                        className="px-3 py-1.5 bg-gradient-to-r from-muted to-muted/50 hover:from-primary/10 hover:to-primary/5 transition-colors"
                                    >
                                        {skill}
                                    </Badge>
                                ))
                            ) : (
                                <p className="text-muted-foreground text-sm">No skills added yet</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
}

// Coding Profiles Tab
function CodingProfilesTab({
    profile,
    onSync,
    isSyncing,
}: {
    profile: StudentProfileDTO;
    onSync: () => void;
    isSyncing: boolean;
}) {
    const leetcode = profile.leetcodeStats;
    const github = profile.githubStats;
    const hackerrank = profile.hackerrankStats;

    return (
        <motion.div 
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <motion.div variants={itemVariants} className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Zap className="w-5 h-5 text-warning" />
                        Connected Profiles
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Link your coding profiles to track your progress
                    </p>
                </div>
                <Button variant="gradient" onClick={onSync} disabled={isSyncing} className="gap-2">
                    <RefreshCw className={cn('w-4 h-4', isSyncing && 'animate-spin')} />
                    Sync Now
                </Button>
            </motion.div>

            <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-3">
                {/* LeetCode */}
                <Card variant={leetcode ? 'glow' : 'bento'} className={cn(!leetcode && 'border-dashed')}>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-warning/10">
                                    <Code className="w-4 h-4 text-warning" />
                                </div>
                                LeetCode
                            </CardTitle>
                            {leetcode && <CheckCircle className="w-5 h-5 text-success" />}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {leetcode ? (
                            <div className="space-y-3">
                                <div className="flex items-end gap-2">
                                    <p className="text-3xl font-bold">{leetcode.totalSolved}</p>
                                    <p className="text-sm text-muted-foreground pb-1">problems</p>
                                </div>
                                <div className="flex gap-2 text-xs">
                                    <Badge variant="success" className="font-normal">Easy: {leetcode.easy}</Badge>
                                    <Badge variant="warning" className="font-normal">Med: {leetcode.medium}</Badge>
                                    <Badge variant="outline" className="text-destructive border-destructive/30">Hard: {leetcode.hard}</Badge>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-sm text-muted-foreground">Not connected</p>
                                <Button variant="soft-primary" size="sm" className="mt-3">Connect</Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* GitHub */}
                <Card variant={github ? 'glow' : 'bento'} className={cn(!github && 'border-dashed')}>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-foreground/10">
                                    <Github className="w-4 h-4" />
                                </div>
                                GitHub
                            </CardTitle>
                            {github && <CheckCircle className="w-5 h-5 text-success" />}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {github ? (
                            <div className="space-y-3">
                                <div className="flex items-end gap-2">
                                    <p className="text-3xl font-bold">{github.totalCommits}</p>
                                    <p className="text-sm text-muted-foreground pb-1">commits</p>
                                </div>
                                <div className="flex gap-3 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-primary" />
                                        {github.totalRepos} repos
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-accent" />
                                        {github.streak} day streak
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-sm text-muted-foreground">Not connected</p>
                                <Button variant="soft-primary" size="sm" className="mt-3">Connect</Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* HackerRank */}
                <Card variant={hackerrank ? 'glow' : 'bento'} className={cn(!hackerrank && 'border-dashed')}>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-success/10">
                                    <Award className="w-4 h-4 text-success" />
                                </div>
                                HackerRank
                            </CardTitle>
                            {hackerrank && <CheckCircle className="w-5 h-5 text-success" />}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {hackerrank ? (
                            <div className="space-y-3">
                                <div className="flex items-end gap-2">
                                    <p className="text-3xl font-bold">{hackerrank.totalSolved}</p>
                                    <p className="text-sm text-muted-foreground pb-1">challenges</p>
                                </div>
                                <div className="flex gap-1 flex-wrap">
                                    {hackerrank.badges?.slice(0, 3).map((badge, i) => (
                                        <Badge key={i} variant="outline" className="text-xs">
                                            {badge}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-sm text-muted-foreground">Not connected</p>
                                <Button variant="soft-primary" size="sm" className="mt-3">Connect</Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
}

// Projects Tab
function ProjectsTab({ profile }: { profile: StudentProfileDTO }) {
    const projects = (profile as any).projects || [];

    return (
        <motion.div 
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <motion.div variants={itemVariants} className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        Projects
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Showcase your work to recruiters
                    </p>
                </div>
                <Button variant="gradient" className="gap-2">
                    <Plus className="w-4 h-4" /> Add Project
                </Button>
            </motion.div>

            {projects.length > 0 ? (
                <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2">
                    {projects.map((project: any, index: number) => (
                        <motion.div 
                            key={project._id || project.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card variant="interactive" className="h-full">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <CardTitle className="text-base">{project.title}</CardTitle>
                                        <Badge
                                            variant={project.verified ? 'success' : 'secondary'}
                                            className="text-xs"
                                        >
                                            {project.verified ? 'Verified' : 'Pending'}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {project.description && (
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {project.description}
                                        </p>
                                    )}
                                    {project.tags && project.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {project.tags.map((tag: string, i: number) => (
                                                <Badge key={i} variant="outline" className="text-xs font-normal">
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
                                            className="text-sm text-primary flex items-center gap-1.5 hover:underline group"
                                        >
                                            <Github className="w-4 h-4" />
                                            View on GitHub
                                            <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                        </a>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>
            ) : (
                <motion.div variants={itemVariants}>
                    <Card variant="bento" className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                                <FileText className="w-8 h-8 text-muted-foreground/50" />
                            </div>
                            <p className="text-muted-foreground mb-4">No projects added yet</p>
                            <Button variant="soft-primary">Add Your First Project</Button>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </motion.div>
    );
}

// Certifications Tab
function CertificationsTab({ profile }: { profile: StudentProfileDTO }) {
    const certifications = (profile as any).certifications || [];

    return (
        <motion.div 
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <motion.div variants={itemVariants} className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Award className="w-5 h-5 text-warning" />
                        Certifications
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Your verified credentials and certificates
                    </p>
                </div>
                <Button variant="gradient" className="gap-2">
                    <Plus className="w-4 h-4" /> Add Certification
                </Button>
            </motion.div>

            {certifications.length > 0 ? (
                <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2">
                    {certifications.map((cert: any, index: number) => (
                        <motion.div 
                            key={cert._id || cert.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card variant="interactive" className="h-full">
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between">
                                        <CardTitle className="text-base">{cert.title}</CardTitle>
                                        <Badge
                                            variant={cert.verified ? 'success' : 'secondary'}
                                            className="text-xs"
                                        >
                                            {cert.verified ? 'Verified' : 'Pending'}
                                        </Badge>
                                    </div>
                                    <CardDescription>{cert.issuer}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {cert.issueDate && (
                                        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                            <Calendar className="w-4 h-4" />
                                            Issued: {new Date(cert.issueDate).toLocaleDateString()}
                                        </p>
                                    )}
                                    {cert.credentialUrl && (
                                        <a
                                            href={cert.credentialUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-primary flex items-center gap-1.5 hover:underline mt-2 group"
                                        >
                                            View Credential
                                            <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                        </a>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>
            ) : (
                <motion.div variants={itemVariants}>
                    <Card variant="bento" className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                                <Award className="w-8 h-8 text-muted-foreground/50" />
                            </div>
                            <p className="text-muted-foreground mb-4">No certifications added yet</p>
                            <Button variant="soft-primary">Add Your First Certification</Button>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </motion.div>
    );
}

// Helper function
function calculateProfileCompletion(profile: StudentProfileDTO): number {
    const fields = [
        profile.name,
        profile.headline,
        profile.summary,
        profile.college,
        profile.branch,
        profile.skills && profile.skills.length > 0,
        profile.leetcodeStats,
        profile.githubStats,
        (profile as any).projects && (profile as any).projects.length > 0,
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
}

// Main Component
export default function ProfilePage() {
    const { token } = useAuth();
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);

    const { data: profile, isLoading } = useQuery({
        queryKey: ['student-profile'],
        queryFn: () => studentApi.getProfile(token!),
        enabled: !!token,
    });

    const updateMutation = useMutation({
        mutationFn: (data: UpdateStudentProfilePayload) =>
            studentApi.updateProfile(data, token!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['student-profile'] });
            setIsEditing(false);
            toast.success('Profile updated successfully!');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update profile');
        },
    });

    const syncMutation = useMutation({
        mutationFn: () => studentApi.syncCodingActivity(token!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['student-profile'] });
            toast.success('Coding profiles synced!');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to sync');
        },
    });

    if (isLoading) {
        return (
            <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
                <Skeleton className="h-56 w-full rounded-2xl" />
                <Skeleton className="h-12 w-full max-w-md rounded-xl" />
                <Skeleton className="h-96 w-full rounded-2xl" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="p-4 lg:p-6 flex items-center justify-center min-h-[60vh]">
                <Card variant="bento" className="max-w-md text-center p-8">
                    <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                        <X className="w-8 h-8 text-destructive" />
                    </div>
                    <h2 className="text-xl font-semibold mb-2">Failed to load profile</h2>
                    <p className="text-muted-foreground">Please try refreshing the page</p>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <ProfileHeader
                    profile={profile}
                    onEdit={() => setIsEditing(!isEditing)}
                    isEditing={isEditing}
                />
            </motion.div>

            {isEditing ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <EditProfileForm
                        profile={profile}
                        onSave={updateMutation.mutate}
                        onCancel={() => setIsEditing(false)}
                        isSaving={updateMutation.isPending}
                    />
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                >
                    <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="w-full max-w-2xl grid grid-cols-5 p-1 bg-muted/50 rounded-xl">
                            <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                Overview
                            </TabsTrigger>
                            <TabsTrigger value="skills" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                Skills
                            </TabsTrigger>
                            <TabsTrigger value="coding" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                Coding
                            </TabsTrigger>
                            <TabsTrigger value="projects" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                Projects
                            </TabsTrigger>
                            <TabsTrigger value="certs" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                Certs
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="mt-6 space-y-6">
                            <motion.div 
                                className="grid gap-6 md:grid-cols-2"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                <motion.div variants={itemVariants}>
                                    <Card variant="bento">
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <div className="p-2 rounded-lg bg-primary/10">
                                                    <User className="w-4 h-4 text-primary" />
                                                </div>
                                                Personal Info
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <InfoRow icon={User} label="Name" value={profile.name} />
                                            <InfoRow icon={Mail} label="Email" value={profile.email} />
                                            <InfoRow icon={Phone} label="Phone" value={profile.phone} />
                                            <InfoRow icon={MapPin} label="Location" value={profile.location} />
                                        </CardContent>
                                    </Card>
                                </motion.div>

                                <motion.div variants={itemVariants}>
                                    <Card variant="bento">
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <div className="p-2 rounded-lg bg-accent/10">
                                                    <GraduationCap className="w-4 h-4 text-accent" />
                                                </div>
                                                Academic Info
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <InfoRow icon={GraduationCap} label="College" value={profile.college} />
                                            <InfoRow icon={FileText} label="Branch" value={profile.branch} />
                                            <InfoRow icon={Calendar} label="Year" value={profile.year} />
                                            <InfoRow icon={Trophy} label="CGPA" value={profile.cgpa?.toString()} />
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            </motion.div>

                            {profile.summary && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <Card variant="bento">
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <div className="p-2 rounded-lg bg-secondary/10">
                                                    <FileText className="w-4 h-4 text-secondary" />
                                                </div>
                                                Summary
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-muted-foreground leading-relaxed">{profile.summary}</p>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )}

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <Card variant="bento">
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <div className="p-2 rounded-lg bg-primary/10">
                                                <Globe className="w-4 h-4 text-primary" />
                                            </div>
                                            Links
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {profile.linkedinUrl && (
                                            <a
                                                href={profile.linkedinUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 p-3 rounded-xl bg-[#0077b5]/10 hover:bg-[#0077b5]/20 transition-colors group"
                                            >
                                                <Linkedin className="w-5 h-5 text-[#0077b5]" />
                                                <span className="font-medium text-[#0077b5]">LinkedIn Profile</span>
                                                <ExternalLink className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </a>
                                        )}
                                        {profile.githubUrl && (
                                            <a
                                                href={profile.githubUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 p-3 rounded-xl bg-foreground/5 hover:bg-foreground/10 transition-colors group"
                                            >
                                                <Github className="w-5 h-5" />
                                                <span className="font-medium">GitHub Profile</span>
                                                <ExternalLink className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </a>
                                        )}
                                        {profile.portfolioUrl && (
                                            <a
                                                href={profile.portfolioUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 p-3 rounded-xl bg-accent/10 hover:bg-accent/20 transition-colors group"
                                            >
                                                <Globe className="w-5 h-5 text-accent" />
                                                <span className="font-medium text-accent">Portfolio</span>
                                                <ExternalLink className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </a>
                                        )}
                                        {!profile.linkedinUrl && !profile.githubUrl && !profile.portfolioUrl && (
                                            <p className="text-muted-foreground text-center py-4">No links added yet</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </TabsContent>

                        <TabsContent value="skills" className="mt-6">
                            <SkillsTab profile={profile} />
                        </TabsContent>

                        <TabsContent value="coding" className="mt-6">
                            <CodingProfilesTab
                                profile={profile}
                                onSync={() => syncMutation.mutate()}
                                isSyncing={syncMutation.isPending}
                            />
                        </TabsContent>

                        <TabsContent value="projects" className="mt-6">
                            <ProjectsTab profile={profile} />
                        </TabsContent>

                        <TabsContent value="certs" className="mt-6">
                            <CertificationsTab profile={profile} />
                        </TabsContent>
                    </Tabs>
                </motion.div>
            )}
        </div>
    );
}

// Helper Component
function InfoRow({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ElementType;
    label: string;
    value?: string;
}) {
    return (
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
            <div className="p-1.5 rounded-md bg-muted/50">
                <Icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <span className="text-sm text-muted-foreground w-20">{label}</span>
            <span className="text-sm font-medium flex-1">{value || '-'}</span>
        </div>
    );
}
