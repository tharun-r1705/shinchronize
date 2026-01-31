import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
    Map,
    Plus,
    CheckCircle2,
    Clock,
    Target,
    Calendar,
    Trash2,
    Zap,
    Sparkles
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { roadmapApi, Roadmap } from "@/lib/api";
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
import { StudentLayout } from "@/components/layout";

const MyRoadmaps = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const fetchRoadmaps = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/student/login');
            return;
        }

        try {
            setIsLoading(true);
            const response = await roadmapApi.getAll(token);
            setRoadmaps(response.roadmaps);
        } catch (error: any) {
            console.error('Failed to fetch roadmaps:', error);
            toast({
                title: "Error loading roadmaps",
                description: error.message || "Failed to fetch roadmaps",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRoadmaps();
    }, []);

    const handleActivate = async (roadmapId: string) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            await roadmapApi.activate(roadmapId, token);
            toast({
                title: "Roadmap activated",
                description: "This roadmap is now your active roadmap"
            });
            fetchRoadmaps();
        } catch (error: any) {
            toast({
                title: "Activation failed",
                description: error.message || "Could not activate roadmap",
                variant: "destructive"
            });
        }
    };

    const handleDelete = async (roadmapId: string) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            setDeletingId(roadmapId);
            await roadmapApi.delete(roadmapId, token);
            toast({
                title: "Roadmap deleted",
                description: "The roadmap has been removed"
            });
            fetchRoadmaps();
        } catch (error: any) {
            toast({
                title: "Delete failed",
                description: error.message || "Could not delete roadmap",
                variant: "destructive"
            });
        } finally {
            setDeletingId(null);
        }
    };

    const handleViewDetails = (roadmapId: string) => {
        navigate(`/student/roadmaps/${roadmapId}`);
    };

    if (isLoading) {
        return (
            <StudentLayout>
                <div className="mb-8">
                    <Skeleton className="h-10 w-64 mb-2" />
                    <Skeleton className="h-5 w-96" />
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-64" />
                    ))}
                </div>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                                <Map className="w-6 h-6 text-white" />
                            </div>
                            My Roadmaps
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            Manage and track your learning roadmaps
                        </p>
                    </div>
                    <Button
                        onClick={() => navigate('/student/ai')}
                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Create with AI
                    </Button>
                </div>

                {/* Roadmaps Grid */}
                {roadmaps.length === 0 ? (
                    <Card className="mt-8">
                        <CardContent className="py-16">
                            <div className="text-center">
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="w-20 h-20 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-2xl flex items-center justify-center mb-6 mx-auto"
                                >
                                    <Map className="w-10 h-10 text-amber-500" />
                                </motion.div>
                                <h3 className="text-xl font-semibold mb-2">No Roadmaps Yet</h3>
                                <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
                                    Start your learning journey by creating a personalized roadmap with our AI Mentor
                                </p>
                                <Button
                                    onClick={() => navigate('/student/ai')}
                                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                                >
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Create Your First Roadmap
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {roadmaps.map((roadmap, index) => {
                            const completedCount = roadmap.milestones.filter(m => m.status === 'completed').length;
                            const inProgressCount = roadmap.milestones.filter(m => m.status === 'in-progress').length;

                            return (
                                <motion.div
                                    key={roadmap._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <Card 
                                        className={`h-full hover:shadow-lg transition-all cursor-pointer ${roadmap.isActive ? 'ring-2 ring-primary' : ''}`}
                                        onClick={() => handleViewDetails(roadmap._id)}
                                    >
                                        <CardHeader>
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1">
                                                    <CardTitle className="text-lg line-clamp-1">{roadmap.title}</CardTitle>
                                                    <CardDescription className="mt-1 line-clamp-2">
                                                        {roadmap.description || "No description"}
                                                    </CardDescription>
                                                </div>
                                                {roadmap.isActive && (
                                                    <Badge className="ml-2 bg-primary">
                                                        <Zap className="w-3 h-3 mr-1" />
                                                        Active
                                                    </Badge>
                                                )}
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                {/* Progress */}
                                                <div>
                                                    <div className="flex items-center justify-between text-sm mb-2">
                                                        <span className="text-muted-foreground">Progress</span>
                                                        <span className="font-semibold">{roadmap.progress}%</span>
                                                    </div>
                                                    <Progress value={roadmap.progress} className="h-2" />
                                                    <div className="flex gap-3 text-xs mt-2 text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                                                            {completedCount} done
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3 text-amber-500" />
                                                            {inProgressCount} active
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Info */}
                                                <div className="space-y-2">
                                                    {roadmap.targetRole && (
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <Target className="w-4 h-4 text-muted-foreground" />
                                                            <span className="truncate">{roadmap.targetRole}</span>
                                                        </div>
                                                    )}
                                                    {roadmap.timeline && (
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                            <Calendar className="w-4 h-4" />
                                                            <span>{roadmap.timeline}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Actions */}
                                                <div className="flex gap-2 pt-2 border-t" onClick={(e) => e.stopPropagation()}>
                                                    {!roadmap.isActive && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="flex-1"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleActivate(roadmap._id);
                                                            }}
                                                        >
                                                            <Zap className="w-3 h-3 mr-1" />
                                                            Activate
                                                        </Button>
                                                    )}
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className={`text-destructive hover:text-destructive hover:bg-destructive/10 ${!roadmap.isActive ? 'flex-1' : 'w-full'}`}
                                                                disabled={deletingId === roadmap._id}
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <Trash2 className="w-3 h-3 mr-1" />
                                                                Delete
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Delete Roadmap?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    This will permanently delete "{roadmap.title}" and all progress. This action cannot be undone.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDelete(roadmap._id);
                                                                    }}
                                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                >
                                                                    Delete
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
        </StudentLayout>
    );
};

export default MyRoadmaps;
