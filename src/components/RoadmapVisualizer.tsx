import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";

import {
    Map,
    CheckCircle2,
    Circle,
    Clock,
    BookOpen,
    Code2,
    Award,
    Target,
    Users,
    Briefcase,
    ChevronDown,
    ChevronUp,
    ExternalLink,
    Sparkles,
    RefreshCw,
    Trash2,
    Lock
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { roadmapApi, Roadmap, RoadmapMilestone } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const categoryIcons: Record<string, typeof BookOpen> = {
    'skill': BookOpen,
    'project': Code2,
    'certification': Award,
    'interview': Briefcase,
    'networking': Users,
    'other': Target
};

const categoryColors: Record<string, string> = {
    'skill': 'from-blue-500 to-cyan-500',
    'project': 'from-purple-500 to-pink-500',
    'certification': 'from-amber-500 to-orange-500',
    'interview': 'from-rose-500 to-red-500',
    'networking': 'from-indigo-500 to-violet-500',
    'other': 'from-green-500 to-emerald-500'
};

const statusIcons: Record<string, typeof Circle> = {
    'not-started': Circle,
    'in-progress': Clock,
    'completed': CheckCircle2
};

interface MilestoneCardProps {
    milestone: RoadmapMilestone;
    index: number;
    total: number;
    onStatusChange: (id: string, status: RoadmapMilestone['status']) => void;
    isLocked?: boolean;
}

const MilestoneCard = ({ milestone, index, total, onStatusChange, isLocked }: MilestoneCardProps) => {
    const navigate = useNavigate();

    const [expanded, setExpanded] = useState(false);

    const IconComponent = categoryIcons[milestone.category] || Target;
    const StatusIcon = statusIcons[milestone.status];
    const gradientClass = categoryColors[milestone.category] || 'from-gray-500 to-slate-500';

    const statusColors = {
        'not-started': 'text-muted-foreground',
        'in-progress': 'text-amber-500',
        'completed': 'text-green-500'
    };

    return (
        <div className={`relative flex gap-6 ${isLocked ? 'opacity-60 grayscale-[0.5]' : ''}`}>
            {/* Timeline Line */}
            {index < total - 1 && (
                <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-muted -ml-[1px]" />
            )}

            {/* Icon Circle */}
            <div className={`z-10 w-12 h-12 rounded-full bg-gradient-to-br ${isLocked ? 'from-gray-400 to-gray-500' : gradientClass} flex items-center justify-center text-white shadow-lg shrink-0`}>
                {isLocked ? <Lock className="w-6 h-6" /> : <IconComponent className="w-6 h-6" />}
            </div>

            <Card className={`flex-1 mb-12 hover:shadow-md transition-shadow relative overflow-hidden ${isLocked ? 'bg-muted/30 cursor-not-allowed' : ''}`}>
                {/* Status Indicator Bar */}
                <div className={`absolute top-0 left-0 bottom-0 w-1 ${milestone.status === 'completed' ? 'bg-green-500' :
                    milestone.status === 'in-progress' ? 'bg-primary' : 'bg-muted'
                    }`} />

                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                <Badge variant="outline" className="capitalize text-[10px] h-5">
                                    {milestone.category}
                                </Badge>
                                {milestone.duration && (
                                    <Badge variant="secondary" className="text-[10px] h-5 flex items-center gap-1">
                                        <Clock className="w-2.5 h-2.5" /> {milestone.duration}
                                    </Badge>
                                )}
                                {milestone.requiresQuiz && (
                                    <Badge variant={milestone.quizStatus === 'passed' ? 'default' : 'secondary'} className={`text-[10px] h-5 flex items-center gap-1 ${milestone.quizStatus === 'passed' ? 'bg-green-500/20 text-green-600 border-green-500/30' : ''
                                        }`}>
                                        <Award className="w-2.5 h-2.5" />
                                        {milestone.quizStatus === 'passed' ? 'Quiz Passed' : 'Quiz Required'}
                                    </Badge>
                                )}
                            </div>


                            <h4 className="font-semibold text-base mb-1">{milestone.title}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">{milestone.description}</p>

                            {/* Skills */}
                            {milestone.skills && milestone.skills.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {milestone.skills.map((skill, i) => (
                                        <Badge key={i} variant="outline" className="text-xs bg-background">
                                            {skill}
                                        </Badge>
                                    ))}
                                </div>
                            )}

                            {/* Expandable section */}
                            <AnimatePresence>
                                {expanded && milestone.resources && milestone.resources.length > 0 && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="mt-3 pt-3 border-t"
                                    >
                                        <p className="text-xs font-medium text-muted-foreground mb-2">Resources:</p>
                                        <div className="space-y-1">
                                            {milestone.resources.map((resource, i) => {
                                                const isInternal = resource.url?.startsWith('/student/learning/') || resource.url?.startsWith('learning/');
                                                const url = isInternal
                                                    ? (resource.url.startsWith('/') ? resource.url : `/${resource.url}`)
                                                    : (resource.url?.startsWith('http') ? resource.url : `https://${resource.url}`);

                                                if (isInternal) {
                                                    return (
                                                        <Link
                                                            key={i}
                                                            to={url}
                                                            className="flex items-center gap-2 text-sm text-primary hover:underline"
                                                        >
                                                            <BookOpen className="w-3 h-3" />
                                                            {resource.title || "Learn on EvolvEd"}
                                                        </Link>
                                                    );
                                                }

                                                return (
                                                    <a
                                                        key={i}
                                                        href={url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                                                    >
                                                        <ExternalLink className="w-3 h-3" />
                                                        {resource.title || (resource.url?.length > 50 ? resource.url.slice(0, 50) + '...' : resource.url)}
                                                    </a>
                                                );
                                            })}
                                        </div>

                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Status and actions */}
                        <div className="flex flex-col items-end gap-2">
                            <div className={`flex items-center gap-1 ${statusColors[milestone.status]}`}>
                                <StatusIcon className="w-4 h-4" />
                                <span className="text-xs capitalize">{milestone.status.replace('-', ' ')}</span>
                            </div>

                            {/* Status change buttons */}
                            <div className="flex gap-1 flex-wrap">
                                {milestone.status === 'not-started' && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-xs hover:bg-amber-500/10 hover:border-amber-500/50"
                                        onClick={() => onStatusChange(milestone.id, 'in-progress')}
                                    >
                                        <Clock className="w-3 h-3 mr-1" />
                                        Start
                                    </Button>
                                )}
                                {milestone.status === 'in-progress' && (
                                    <>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-7 text-xs hover:bg-green-500/10 hover:border-green-500/50"
                                            onClick={() => onStatusChange(milestone.id, 'completed')}
                                        >
                                            <CheckCircle2 className="w-3 h-3 mr-1" />
                                            Complete
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 text-xs"
                                            onClick={() => onStatusChange(milestone.id, 'not-started')}
                                        >
                                            <Circle className="w-3 h-3 mr-1" />
                                            Reset
                                        </Button>
                                    </>
                                )}
                                {milestone.status === 'completed' && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 text-xs"
                                        onClick={() => onStatusChange(milestone.id, 'not-started')}
                                    >
                                        <Circle className="w-3 h-3 mr-1" />
                                        Reset
                                    </Button>
                                )}
                            </div>

                            {milestone.resources && milestone.resources.length > 0 && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 text-xs"
                                    onClick={() => setExpanded(!expanded)}
                                >
                                    {expanded ? (
                                        <ChevronUp className="w-3 h-3" />
                                    ) : (
                                        <ChevronDown className="w-3 h-3" />
                                    )}
                                    Resources
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};


const RoadmapVisualizer = () => {
    const { toast } = useToast();
    const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    const fetchRoadmap = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            setIsLoading(true);
            const response = await roadmapApi.getActive(token);
            setRoadmap(response.roadmap);
        } catch (error) {
            console.error('Failed to fetch roadmap:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRoadmap();
    }, []);

    const handleStatusChange = async (milestoneId: string, status: RoadmapMilestone['status']) => {
        const token = localStorage.getItem('token');
        if (!token || !roadmap) return;

        try {
            setIsUpdating(true);
            const response = await roadmapApi.updateMilestone(milestoneId, status, token);
            if (response.roadmap) {
                setRoadmap(response.roadmap);
                toast({
                    title: "Milestone updated",
                    description: `Marked as ${status.replace('-', ' ')}`
                });
            }
        } catch (error: any) {
            toast({
                title: "Update failed",
                description: error.message || "Could not update milestone status",
                variant: "destructive"
            });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDeleteRoadmap = async () => {
        const token = localStorage.getItem('token');
        if (!token || !roadmap) return;

        try {
            await roadmapApi.delete(roadmap._id, token);
            setRoadmap(null);
            toast({
                title: "Roadmap deleted",
                description: "You can ask Zenith to create a new one"
            });
        } catch (error) {
            toast({
                title: "Delete failed",
                description: "Could not delete roadmap",
                variant: "destructive"
            });
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4 p-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
        );
    }

    if (!roadmap) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-20 h-20 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-2xl flex items-center justify-center mb-6"
                >
                    <Map className="w-10 h-10 text-amber-500" />
                </motion.div>
                <h3 className="text-xl font-semibold mb-2">No Roadmap Yet</h3>
                <p className="text-muted-foreground text-sm mb-6 max-w-md">
                    Ask Zenith AI to create a personalized career roadmap for you.
                    Just say something like "Create a roadmap for becoming a Full Stack Developer"
                </p>
                <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                    <Badge variant="outline" className="text-xs">
                        <Sparkles className="w-3 h-3 mr-1 text-amber-500" />
                        "Create a roadmap for frontend development"
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                        <Sparkles className="w-3 h-3 mr-1 text-amber-500" />
                        "Help me plan my path to data science"
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                        <Sparkles className="w-3 h-3 mr-1 text-amber-500" />
                        "Build me a DevOps learning roadmap"
                    </Badge>
                </div>
            </div>
        );
    }

    const completedCount = roadmap.milestones.filter(m => m.status === 'completed').length;
    const inProgressCount = roadmap.milestones.filter(m => m.status === 'in-progress').length;

    return (
        <div className="p-4 space-y-6">
            {/* Roadmap Header */}
            <Card className="bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10 border-amber-500/20">
                <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                                    <Map className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">{roadmap.title}</h2>
                                    <p className="text-sm text-muted-foreground">Target: {roadmap.targetRole}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={fetchRoadmap}
                                disabled={isUpdating}
                            >
                                <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Roadmap?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will permanently delete your roadmap and all progress. You can ask Zenith to create a new one anytime.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDeleteRoadmap} className="bg-destructive text-destructive-foreground">
                                            Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>

                    {/* Progress stats */}
                    <div className="mt-4 space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Overall Progress</span>
                            <span className="font-semibold">{roadmap.progress}%</span>
                        </div>
                        <Progress value={roadmap.progress} className="h-2" />
                        <div className="flex gap-4 text-xs">
                            <span className="flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-green-500" />
                                {completedCount} completed
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-500" />
                                {inProgressCount} in progress
                            </span>
                            <span className="flex items-center gap-1">
                                <Circle className="w-3 h-3 text-muted-foreground" />
                                {roadmap.milestones.length - completedCount - inProgressCount} remaining
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Milestones */}
            <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Target className="w-5 h-5 text-amber-500" />
                    Milestones
                </h3>
                <div className="space-y-4">
                    {roadmap.milestones.sort((a, b) => a.order - b.order).map((milestone, index) => {
                        const isLocked = index > 0 && roadmap.milestones[index - 1].status !== 'completed';
                        return (
                            <MilestoneCard
                                key={milestone.id}
                                milestone={milestone}
                                index={index}
                                total={roadmap.milestones.length}
                                onStatusChange={handleStatusChange}
                                isLocked={isLocked}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default RoadmapVisualizer;
