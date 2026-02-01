import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { api, StudentProfileDTO } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
    Map,
    Plus,
    ChevronRight,
    CheckCircle,
    Clock,
    CircleDashed,
    Sparkles,
    Loader2,
    RefreshCw,
    Target,
    TrendingUp,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress, ProgressRing } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface Roadmap {
    _id: string;
    title: string;
    description?: string;
    progress: number;
    milestones: {
        id: string;
        title: string;
        status: 'not-started' | 'in-progress' | 'completed';
        category: string;
    }[];
    isActive: boolean;
    createdAt: string;
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { 
        opacity: 1, 
        y: 0,
        transition: { duration: 0.3 }
    },
};

function RoadmapCard({ roadmap, onClick }: { roadmap: Roadmap; onClick: () => void }) {
    const completedCount = roadmap.milestones.filter(m => m.status === 'completed').length;
    const inProgressCount = roadmap.milestones.filter(m => m.status === 'in-progress').length;
    const totalCount = roadmap.milestones.length;

    return (
        <motion.div variants={itemVariants}>
            <Card
                variant="interactive"
                onClick={onClick}
                className={cn(
                    'h-full',
                    !roadmap.isActive && 'opacity-60'
                )}
            >
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                            <CardTitle className="text-base truncate">{roadmap.title}</CardTitle>
                            {roadmap.description && (
                                <CardDescription className="mt-1 line-clamp-2 text-xs">
                                    {roadmap.description}
                                </CardDescription>
                            )}
                        </div>
                        <div className="flex-shrink-0">
                            {!roadmap.isActive ? (
                                <Badge variant="secondary" size="sm">Paused</Badge>
                            ) : roadmap.progress === 100 ? (
                                <Badge variant="success" size="sm">Complete</Badge>
                            ) : null}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Progress Ring & Stats */}
                    <div className="flex items-center gap-4">
                        <ProgressRing
                            value={roadmap.progress}
                            size={64}
                            strokeWidth={6}
                            variant={roadmap.progress === 100 ? 'success' : 'primary'}
                        >
                            <span className="text-sm font-bold">{roadmap.progress}%</span>
                        </ProgressRing>
                        
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-1.5 text-xs">
                                <CheckCircle className="w-3.5 h-3.5 text-success" />
                                <span className="text-muted-foreground">{completedCount} completed</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs">
                                <Clock className="w-3.5 h-3.5 text-warning" />
                                <span className="text-muted-foreground">{inProgressCount} in progress</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs">
                                <CircleDashed className="w-3.5 h-3.5 text-muted-foreground" />
                                <span className="text-muted-foreground">{totalCount - completedCount - inProgressCount} remaining</span>
                            </div>
                        </div>
                    </div>

                    {/* Next Milestone Preview */}
                    {roadmap.milestones.length > 0 && (
                        <div className="pt-3 border-t border-border/50">
                            {(() => {
                                const next = roadmap.milestones.find(m => m.status !== 'completed');
                                return next ? (
                                    <div className="flex items-center justify-between gap-2 group/next">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-muted-foreground mb-0.5">Next up:</p>
                                            <p className="text-sm font-medium truncate group-hover/next:text-primary transition-colors">{next.title}</p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 group-hover/next:text-primary transition-colors" />
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-success">
                                        <CheckCircle className="w-4 h-4" />
                                        <p className="text-sm font-medium">All milestones completed!</p>
                                    </div>
                                );
                            })()}
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}

function CreateRoadmapDialog({ onCreated }: { onCreated: () => void }) {
    const { token } = useAuth();
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleCreate = async () => {
        if (!title.trim()) return;
        setIsLoading(true);
        try {
            await api.post('/roadmap', { title, description }, token!);
            toast.success('Roadmap created!');
            setOpen(false);
            setTitle('');
            setDescription('');
            onCreated();
        } catch (error: any) {
            toast.error(error.message || 'Failed to create roadmap');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            await api.post('/roadmap/generate', { targetRole: title || 'Software Engineer' }, token!);
            toast.success('AI Roadmap generated!');
            setOpen(false);
            onCreated();
        } catch (error: any) {
            toast.error(error.message || 'Failed to generate roadmap');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="gradient" className="gap-2">
                    <Plus className="w-4 h-4" />
                    New Roadmap
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Create Learning Roadmap</DialogTitle>
                    <DialogDescription>
                        Create a custom roadmap or let AI generate one for you.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title / Target Role</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Full Stack Developer"
                            className="h-11"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description (optional)</Label>
                        <Input
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description of your goals"
                            className="h-11"
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button
                            variant="outline"
                            onClick={handleGenerate}
                            disabled={isGenerating || isLoading}
                            className="flex-1 h-11"
                        >
                            {isGenerating ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                            ) : (
                                <><Sparkles className="w-4 h-4 mr-2" /> AI Generate</>
                            )}
                        </Button>
                        <Button
                            variant="gradient"
                            onClick={handleCreate}
                            disabled={!title.trim() || isLoading || isGenerating}
                            className="flex-1 h-11"
                        >
                            {isLoading ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</>
                            ) : (
                                'Create Empty'
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default function RoadmapsPage() {
    const { token } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: roadmaps, isLoading, refetch } = useQuery<Roadmap[]>({
        queryKey: ['roadmaps'],
        queryFn: async () => {
            const response = await api.get<{ roadmaps: Roadmap[] }>('/roadmap', token!);
            return response.roadmaps;
        },
        enabled: !!token,
    });

    // Calculate overall stats
    const totalRoadmaps = roadmaps?.length || 0;
    const activeRoadmaps = roadmaps?.filter(r => r.isActive).length || 0;
    const avgProgress = roadmaps?.length 
        ? Math.round(roadmaps.reduce((acc, r) => acc + r.progress, 0) / roadmaps.length) 
        : 0;

    return (
        <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-glow">
                        <Map className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold">My Roadmaps</h1>
                        <p className="text-muted-foreground text-sm">
                            Track your learning journey with personalized skill roadmaps
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => refetch()}
                        disabled={isLoading}
                        className="h-10 w-10"
                    >
                        <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
                    </Button>
                    <CreateRoadmapDialog onCreated={() => queryClient.invalidateQueries({ queryKey: ['roadmaps'] })} />
                </div>
            </motion.div>

            {/* Stats Overview */}
            {roadmaps && roadmaps.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-3 gap-4"
                >
                    <Card variant="stat" className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Map className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{totalRoadmaps}</p>
                                <p className="text-xs text-muted-foreground">Total Roadmaps</p>
                            </div>
                        </div>
                    </Card>
                    <Card variant="stat" className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-success/10">
                                <Target className="w-4 h-4 text-success" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{activeRoadmaps}</p>
                                <p className="text-xs text-muted-foreground">Active</p>
                            </div>
                        </div>
                    </Card>
                    <Card variant="stat" className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-accent/10">
                                <TrendingUp className="w-4 h-4 text-accent" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{avgProgress}%</p>
                                <p className="text-xs text-muted-foreground">Avg Progress</p>
                            </div>
                        </div>
                    </Card>
                </motion.div>
            )}

            {/* Roadmaps Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-64 rounded-xl" />
                    ))}
                </div>
            ) : !roadmaps || roadmaps.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <Card variant="bento" className="border-dashed border-2">
                        <CardContent className="py-16 text-center">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                                <Map className="w-10 h-10 text-primary/50" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">No Roadmaps Yet</h3>
                            <p className="text-muted-foreground max-w-md mx-auto mb-6 text-sm">
                                Create your first learning roadmap to track your skill development and stay on target for your career goals.
                            </p>
                            <CreateRoadmapDialog onCreated={() => queryClient.invalidateQueries({ queryKey: ['roadmaps'] })} />
                        </CardContent>
                    </Card>
                </motion.div>
            ) : (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                    {roadmaps.map((roadmap) => (
                        <RoadmapCard
                            key={roadmap._id}
                            roadmap={roadmap}
                            onClick={() => navigate(`/student/roadmaps/${roadmap._id}`)}
                        />
                    ))}
                </motion.div>
            )}
        </div>
    );
}
