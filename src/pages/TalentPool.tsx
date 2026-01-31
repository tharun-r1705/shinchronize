import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  TrendingUp,
  Users,
  Brain,
  ArrowLeft,
  Loader2,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  PlayCircle,
  Settings,
  Mail,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { jobApi } from "@/lib/api";
import type { Job, MatchedStudent } from "@/types/job";
import JobCreationDialog from "@/components/JobCreationDialog";
import MatchExplanationModal from "@/components/MatchExplanationModal";

export default function TalentPoolPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // State
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [matchedStudents, setMatchedStudents] = useState<any[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<"jobs" | "matches">("jobs");
  
  // Modal states
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedStudentName, setSelectedStudentName] = useState<string>("");
  const [selectedMatchScore, setSelectedMatchScore] = useState<number>(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "active" | "closed">("all");
  const [minMatchScore, setMinMatchScore] = useState<number>(0);

  useEffect(() => {
    fetchJobs();
  }, [statusFilter]);

  useEffect(() => {
    if (selectedJob) {
      fetchMatches(selectedJob._id);
    }
  }, [selectedJob, minMatchScore]);

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Authentication required",
          description: "Please log in to continue",
          variant: "destructive",
        });
        navigate("/recruiter/login");
        return;
      }

      const { jobs: fetchedJobs } = await jobApi.getAllJobs(
        token,
        statusFilter === "all" ? undefined : statusFilter
      );
      setJobs(fetchedJobs || []);
    } catch (error: any) {
      toast({
        title: "Error loading jobs",
        description: error.message || "Failed to fetch jobs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMatches = async (jobId: string) => {
    setIsLoadingMatches(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const { matches } = await jobApi.getMatches(jobId, token, {
        minScore: minMatchScore,
        limit: 50,
        sortBy: "score",
      });
      setMatchedStudents(matches || []);
    } catch (error: any) {
      toast({
        title: "Error loading matches",
        description: error.message || "Failed to fetch matched students",
        variant: "destructive",
      });
    } finally {
      setIsLoadingMatches(false);
    }
  };

  const handlePublishJob = async (jobId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await jobApi.publishJob(jobId, token);
      toast({
        title: "Job published successfully!",
        description: "AI is now matching students. This may take a few moments.",
      });
      fetchJobs();
    } catch (error: any) {
      toast({
        title: "Error publishing job",
        description: error.message || "Failed to publish job",
        variant: "destructive",
      });
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job?")) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await jobApi.deleteJob(jobId, token);
      toast({
        title: "Job deleted successfully",
      });
      setJobs(jobs.filter((j) => j._id !== jobId));
      if (selectedJob?._id === jobId) {
        setSelectedJob(null);
        setActiveTab("jobs");
      }
    } catch (error: any) {
      toast({
        title: "Error deleting job",
        description: error.message || "Failed to delete job",
        variant: "destructive",
      });
    }
  };

  const handleRefreshMatches = async (jobId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      toast({
        title: "Refreshing matches...",
        description: "This may take a few moments.",
      });

      await jobApi.matchStudents(jobId, token);
      await fetchMatches(jobId);

      toast({
        title: "Matches refreshed successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error refreshing matches",
        description: error.message || "Failed to refresh matches",
        variant: "destructive",
      });
    }
  };

  const handleViewMatches = (job: Job) => {
    setSelectedJob(job);
    setActiveTab("matches");
  };

  const handleShowExplanation = (studentId: string, studentName: string, matchScore: number) => {
    setSelectedStudentId(studentId);
    setSelectedStudentName(studentName);
    setSelectedMatchScore(matchScore);
    setShowExplanationModal(true);
  };

  const getStatusBadge = (status: Job["status"]) => {
    const variants = {
      draft: "secondary",
      active: "default",
      closed: "outline",
      expired: "destructive",
    };
    return (
      <Badge variant={variants[status] as any}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getMatchScoreBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-500">Excellent ({score})</Badge>;
    if (score >= 60) return <Badge className="bg-blue-500">Good ({score})</Badge>;
    if (score >= 40) return <Badge className="bg-yellow-500">Fair ({score})</Badge>;
    return <Badge variant="outline">Limited ({score})</Badge>;
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      searchQuery === "" ||
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/recruiter/dashboard")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="flex items-center gap-2">
                <Briefcase className="h-6 w-6 text-purple-600" />
                <h1 className="text-2xl font-bold">Talent Pool</h1>
              </div>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create New Job
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="jobs">
              <Briefcase className="h-4 w-4 mr-2" />
              My Jobs ({jobs.length})
            </TabsTrigger>
            <TabsTrigger value="matches" disabled={!selectedJob}>
              <Users className="h-4 w-4 mr-2" />
              Matched Students
              {selectedJob && ` (${selectedJob.matchCount || 0})`}
            </TabsTrigger>
          </TabsList>

          {/* Jobs Tab */}
          <TabsContent value="jobs">
            <div className="space-y-4">
              {/* Filters */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search jobs..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Jobs</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Jobs List */}
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                </div>
              ) : filteredJobs.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No jobs found</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first job posting to start matching with talented students.
                    </p>
                    <Button onClick={() => setShowCreateDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Job
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredJobs.map((job) => (
                    <motion.div
                      key={job._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg mb-2">{job.title}</CardTitle>
                              <CardDescription className="flex items-center gap-2">
                                {job.location} • {job.jobType}
                              </CardDescription>
                            </div>
                            {getStatusBadge(job.status)}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Matches:</span>
                            <Badge variant="secondary">
                              {job.matchCount || 0} students
                            </Badge>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {job.requiredSkills.slice(0, 3).map((skill) => (
                              <Badge key={skill} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {job.requiredSkills.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{job.requiredSkills.length - 3}
                              </Badge>
                            )}
                          </div>

                          <div className="flex gap-2">
                            {job.status === "draft" ? (
                              <Button
                                size="sm"
                                className="flex-1"
                                onClick={() => handlePublishJob(job._id)}
                              >
                                <PlayCircle className="h-4 w-4 mr-1" />
                                Publish
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="default"
                                className="flex-1"
                                onClick={() => handleViewMatches(job)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View Matches
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteJob(job._id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Matches Tab */}
          <TabsContent value="matches">
            {selectedJob && (
              <div className="space-y-4">
                {/* Job Info Banner */}
                <Card className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                  <CardHeader>
                    <CardTitle className="text-xl">{selectedJob.title}</CardTitle>
                    <CardDescription className="text-white/90">
                      {selectedJob.location} • {selectedJob.matchCount || 0} matches found
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2 flex-wrap">
                      {selectedJob.requiredSkills.map((skill) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                    
                    {/* Warning about 80% threshold */}
                    <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg p-3">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-semibold mb-1">Quality Matching Active</p>
                          <p className="text-white/90">
                            Students must match at least <strong>80% of required skills</strong> ({Math.ceil(selectedJob.requiredSkills.length * 0.8)} out of {selectedJob.requiredSkills.length} skills) to appear in results.
                            Click "Refresh Matches" to update with latest matching algorithm.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleRefreshMatches(selectedJob._id)}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Refresh Matches
                    </Button>
                  </CardContent>
                </Card>

                {/* Match Filters */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <Label className="text-sm font-medium">Min Match Score:</Label>
                      <Select
                        value={String(minMatchScore)}
                        onValueChange={(v) => setMinMatchScore(Number(v))}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">All Matches</SelectItem>
                          <SelectItem value="40">Fair (40+)</SelectItem>
                          <SelectItem value="60">Good (60+)</SelectItem>
                          <SelectItem value="80">Excellent (80+)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Matched Students */}
                {isLoadingMatches ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                  </div>
                ) : matchedStudents.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No matches found</h3>
                      <p className="text-muted-foreground">
                        Try adjusting your filters or refresh matches.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {matchedStudents.map((match: any) => {
                      const student = typeof match.studentId === 'object' ? match.studentId : null;
                      if (!student) return null;

                      return (
                        <motion.div
                          key={student._id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                        >
                          <Card className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                              <div className="flex items-start justify-between">
                                <div>
                                  <CardTitle className="text-lg">
                                    {student.name || student.email}
                                  </CardTitle>
                                  <CardDescription>
                                    {student.college} • {student.branch}
                                  </CardDescription>
                                </div>
                                {getMatchScoreBadge(match.matchScore)}
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              {/* AI Justification */}
                              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                                <div className="flex items-start gap-2">
                                  <Brain className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                                  <p className="text-sm text-muted-foreground">
                                    {match.matchReason}
                                  </p>
                                </div>
                              </div>

                              {/* Student Stats */}
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                  <span className="text-muted-foreground">CGPA:</span>
                                  <span className="ml-2 font-medium">{student.cgpa || "N/A"}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Readiness:</span>
                                  <span className="ml-2 font-medium">
                                    {student.readinessScore || "N/A"}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Projects:</span>
                                  <span className="ml-2 font-medium">
                                    {student.projects?.length || 0}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Skills:</span>
                                  <span className="ml-2 font-medium">
                                    {student.skills?.length || 0}
                                  </span>
                                </div>
                              </div>

                              {/* Skills Matched */}
                              <div>
                                <p className="text-xs text-muted-foreground mb-2">Skills Matched:</p>
                                <div className="flex flex-wrap gap-1">
                                  {match.skillsMatched.slice(0, 5).map((skill: string) => (
                                    <Badge key={skill} variant="default" className="text-xs">
                                      {skill}
                                    </Badge>
                                  ))}
                                  {match.skillsMatched.length > 5 && (
                                    <Badge variant="secondary" className="text-xs">
                                      +{match.skillsMatched.length - 5}
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                  onClick={() =>
                                    handleShowExplanation(
                                      student._id,
                                      student.name || student.email,
                                      match.matchScore
                                    )
                                  }
                                >
                                  <Brain className="h-4 w-4 mr-1" />
                                  Why?
                                </Button>
                                <Button
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => navigate(`/recruiter/student/${student._id}`)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View Profile
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <JobCreationDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onJobCreated={fetchJobs}
      />

      {selectedJob && (
        <MatchExplanationModal
          open={showExplanationModal}
          onOpenChange={setShowExplanationModal}
          jobId={selectedJob._id}
          studentId={selectedStudentId}
          studentName={selectedStudentName}
          matchScore={selectedMatchScore}
        />
      )}
    </div>
  );
}
