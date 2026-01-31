import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    Clock,
    CheckCircle2,
    XCircle,
    Code2,
    Award,
    RefreshCw,
    Trash2,
    Play,
    RotateCcw,
    Map,
    Zap,
    ExternalLink
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { activityApi, ActivityLog } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface ActivityTimelineProps {
    roadmapId?: string;
    limit?: number;
    showHeader?: boolean;
}

const eventIcons: Record<string, typeof Clock> = {
    'roadmap_created': Map,
    'roadmap_deleted': Trash2,
    'roadmap_activated': Zap,
    'milestone_started': Play,
    'milestone_completed': CheckCircle2,
    'milestone_reset': RotateCcw,
    'quiz_attempted': Award,
    'quiz_passed': CheckCircle2,
    'quiz_failed': XCircle,
    'project_submitted': Code2,
    'project_verified': CheckCircle2,
    'project_needs_improvement': RefreshCw,
    'project_rejected': XCircle,
    'project_resubmitted': RefreshCw,
    'resource_accessed': ExternalLink,
    'resource_link_validated': CheckCircle2,
    'resource_link_replaced': RefreshCw
};

const eventColors: Record<string, string> = {
    'roadmap_created': 'text-blue-500 bg-blue-500/10',
    'roadmap_deleted': 'text-red-500 bg-red-500/10',
    'roadmap_activated': 'text-amber-500 bg-amber-500/10',
    'milestone_started': 'text-indigo-500 bg-indigo-500/10',
    'milestone_completed': 'text-green-500 bg-green-500/10',
    'milestone_reset': 'text-gray-500 bg-gray-500/10',
    'quiz_attempted': 'text-purple-500 bg-purple-500/10',
    'quiz_passed': 'text-green-500 bg-green-500/10',
    'quiz_failed': 'text-red-500 bg-red-500/10',
    'project_submitted': 'text-cyan-500 bg-cyan-500/10',
    'project_verified': 'text-green-500 bg-green-500/10',
    'project_needs_improvement': 'text-orange-500 bg-orange-500/10',
    'project_rejected': 'text-red-500 bg-red-500/10',
    'project_resubmitted': 'text-blue-500 bg-blue-500/10',
    'resource_accessed': 'text-teal-500 bg-teal-500/10',
    'resource_link_validated': 'text-green-500 bg-green-500/10',
    'resource_link_replaced': 'text-amber-500 bg-amber-500/10'
};

const formatEventTitle = (activity: ActivityLog): string => {
    const { eventType, metadata } = activity;

    switch (eventType) {
        case 'roadmap_created':
            return `Created roadmap "${metadata.title}"`;
        case 'roadmap_deleted':
            return `Deleted roadmap "${metadata.title}"`;
        case 'roadmap_activated':
            return `Activated roadmap "${metadata.title}"`;
        case 'milestone_started':
            return `Started "${metadata.title}"`;
        case 'milestone_completed':
            return `Completed "${metadata.title}"`;
        case 'milestone_reset':
            return `Reset "${metadata.title}"`;
        case 'quiz_attempted':
            return `Attempted quiz for "${metadata.title}"`;
        case 'quiz_passed':
            return `Passed quiz for "${metadata.title}" (${metadata.score}%)`;
        case 'quiz_failed':
            return `Quiz failed for "${metadata.title}" (${metadata.score}%)`;
        case 'project_submitted':
            return `Submitted project for "${metadata.title}"`;
        case 'project_verified':
            return `Project verified for "${metadata.title}"`;
        case 'project_needs_improvement':
            return `Project needs improvement: "${metadata.title}"`;
        case 'project_rejected':
            return `Project rejected for "${metadata.title}"`;
        case 'project_resubmitted':
            return `Resubmitted project for "${metadata.title}"`;
        default:
            return eventType.replace(/_/g, ' ');
    }
};

const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const ActivityTimeline = ({ roadmapId, limit = 20, showHeader = true }: ActivityTimelineProps) => {
    const { toast } = useToast();
    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchActivities = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            setIsLoading(true);
            const response = await activityApi.getActivities(token, limit, roadmapId);
            setActivities(response.activities);
        } catch (error: any) {
            console.error('Failed to fetch activities:', error);
            toast({
                title: "Failed to load activities",
                description: error.message || "Please try again",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchActivities();
    }, [roadmapId, limit]);

    if (isLoading) {
        return (
            <Card className="h-full">
                {showHeader && (
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Recent Activity
                        </CardTitle>
                    </CardHeader>
                )}
                <CardContent className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex gap-3">
                            <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-3 w-1/2" />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        );
    }

    if (activities.length === 0) {
        return (
            <Card className="h-full">
                {showHeader && (
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Recent Activity
                        </CardTitle>
                    </CardHeader>
                )}
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p className="text-sm">No recent activity</p>
                        <p className="text-xs mt-1">Start working on your roadmap to see your progress here!</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full">
            {showHeader && (
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Recent Activity
                    </CardTitle>
                </CardHeader>
            )}
            <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
                {activities.map((activity, index) => {
                    const Icon = eventIcons[activity.eventType] || Clock;
                    const colorClass = eventColors[activity.eventType] || 'text-gray-500 bg-gray-500/10';

                    return (
                        <motion.div
                            key={activity._id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex gap-3 items-start pb-3 border-b last:border-0 last:pb-0"
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}>
                                <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium line-clamp-2">
                                    {formatEventTitle(activity)}
                                </p>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span className="text-xs text-muted-foreground">
                                        {formatTimestamp(activity.timestamp)}
                                    </span>
                                    {activity.roadmap && (
                                        <Badge variant="outline" className="text-[10px] h-4 px-1">
                                            {activity.roadmap.title}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </CardContent>
        </Card>
    );
};

export default ActivityTimeline;
