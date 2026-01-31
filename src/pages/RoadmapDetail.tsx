import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { roadmapApi, Roadmap } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { StudentLayout } from "@/components/layout";
import RoadmapVisualizer from "@/components/RoadmapVisualizer";
import ActivityTimeline from "@/components/ActivityTimeline";

const RoadmapDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchRoadmap = async () => {
        const token = localStorage.getItem('token');
        if (!token || !id) {
            navigate('/student/login');
            return;
        }

        try {
            setIsLoading(true);
            const response = await roadmapApi.getById(id, token);
            setRoadmap(response.roadmap);
        } catch (error: any) {
            console.error('Failed to fetch roadmap:', error);
            toast({
                title: "Error loading roadmap",
                description: error.message || "Failed to fetch roadmap details",
                variant: "destructive"
            });
            navigate('/student/roadmaps');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRoadmap();
    }, [id]);

    if (isLoading) {
        return (
            <StudentLayout>
                <Skeleton className="h-10 w-48 mb-8" />
                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <Skeleton className="h-[600px]" />
                    </div>
                    <div>
                        <Skeleton className="h-[600px]" />
                    </div>
                </div>
            </StudentLayout>
        );
    }

    if (!roadmap) {
        return (
            <StudentLayout>
                <div className="text-center py-16">
                    <h2 className="text-2xl font-bold mb-4">Roadmap Not Found</h2>
                    <Button onClick={() => navigate('/student/roadmaps')}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Roadmaps
                    </Button>
                </div>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout>
            {/* Back Button */}
            <Button
                    variant="ghost"
                    onClick={() => navigate('/student/roadmaps')}
                    className="mb-6"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Roadmaps
                </Button>

                {/* Main Content */}
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Roadmap Visualizer - 2/3 width */}
                    <div className="lg:col-span-2">
                        <RoadmapVisualizer roadmapId={id} />
                    </div>

                    {/* Activity Timeline - 1/3 width */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-8">
                            <ActivityTimeline roadmapId={id} limit={30} />
                        </div>
                    </div>
                </div>
        </StudentLayout>
    );
};

export default RoadmapDetail;
