import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search, TrendingUp, Award, CheckCircle2, Brain, Users, Briefcase,
  Plus, Eye, Trash2, PlayCircle, Sparkles, AlertTriangle, Loader2,
  Mail, Send, ArrowRight, Building2, Target, Star, UserCheck, Filter, Pencil
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { recruiterApi, jobApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { RecruiterLayout } from "@/components/layout";
import AIRecruiterAssistant from "@/components/AIRecruiterAssistant";
import JobCreationDialog from "@/components/JobCreationDialog";
import MatchExplanationModal from "@/components/MatchExplanationModal";
import type { Job } from "@/types/job";

const RecruiterDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recruiterProfile, setRecruiterProfile] = useState<any>(null);
  const [contactStudent, setContactStudent] = useState<any>(null);
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [isSendingContact, setIsSendingContact] = useState(false);

  // Job management state
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [matchedStudents, setMatchedStudents] = useState<any[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [jobDialogOpen, setJobDialogOpen] = useState(false);
  const [jobDialogJob, setJobDialogJob] = useState<Job | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "active" | "closed">("all");
  const [minMatchScore, setMinMatchScore] = useState<number>(0);
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedStudentName, setSelectedStudentName] = useState<string>("");
  const [selectedMatchScore, setSelectedMatchScore] = useState<number>(0);
  const [jobSearchQuery, setJobSearchQuery] = useState("");
  const [whyChatInput, setWhyChatInput] = useState("");
  const [whyChatMessages, setWhyChatMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [whyChatStudentId, setWhyChatStudentId] = useState<string>("");
  const [whyChatLoading, setWhyChatLoading] = useState(false);

  // Bulk contact state
  const [showBulkContactDialog, setShowBulkContactDialog] = useState(false);
  const [bulkContactSubject, setBulkContactSubject] = useState("");
  const [bulkContactMessage, setBulkContactMessage] = useState("");
  const [isSendingBulkContact, setIsSendingBulkContact] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast({
            title: "Authentication required",
            description: "Please log in to view the dashboard",
            variant: "destructive",
          });
          navigate('/recruiter/login');
          return;
        }

        // Fetch recruiter profile
        const profile: any = await recruiterApi.getProfile(token);
        setRecruiterProfile(profile);

        const data = await recruiterApi.listStudents({}, token);
        setStudents(Array.isArray(data) ? data : []);
      } catch (error: any) {
        toast({
          title: "Error loading data",
          description: error.message || "Failed to fetch data",
          variant: "destructive",
        });
        if (error.message?.includes('401') || error.message?.includes('token')) {
          navigate('/recruiter/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [navigate, toast]);

  // Job management functions
  const fetchJobs = async () => {
    setIsLoadingJobs(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

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
      setIsLoadingJobs(false);
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
      toast({ title: "Job deleted successfully" });
      setJobs(jobs.filter((j) => j._id !== jobId));
      if (selectedJob?._id === jobId) {
        setSelectedJob(null);
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

      toast({ title: "Matches refreshed successfully!" });
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
    setTimeout(() => {
      document.getElementById('matched-students-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleShowExplanation = (studentId: string, studentName: string, matchScore: number) => {
    setSelectedStudentId(studentId);
    setSelectedStudentName(studentName);
    setSelectedMatchScore(matchScore);
    setShowExplanationModal(true);
  };

  const handleWhyChatSubmit = async () => {
    if (!selectedJob) return;
    if (!whyChatInput.trim()) return;
    if (!whyChatStudentId) {
      toast({
        title: "Select a candidate",
        description: "Choose a candidate to ask about.",
        variant: "destructive",
      });
      return;
    }

    const question = whyChatInput.trim();
    setWhyChatMessages((prev) => [...prev, { role: "user", content: question }]);
    setWhyChatInput("");
    setWhyChatLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Not authenticated");

      const explanation = await jobApi.getMatchExplanation(selectedJob._id, whyChatStudentId, token);
      const responseText = explanation.matchReason || "No explanation available for this candidate.";
      setWhyChatMessages((prev) => [...prev, { role: "assistant", content: responseText }]);
    } catch (error: any) {
      toast({
        title: "Unable to fetch explanation",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setWhyChatLoading(false);
    }
  };

  const openContactModal = (student: any) => {
    setContactStudent(student);
    const company = recruiterProfile?.company || 'our company';
    setContactSubject(`Opportunity at ${company}`);
    setContactMessage(`Dear ${student.name},\n\nI came across your profile on EvolvEd and was impressed by your skills and projects, particularly your work in ${student.skills?.[0] || 'technology'}.\n\nWe have an exciting opportunity at ${company} that aligns with your profile. I'd love to discuss this further with you.\n\nWould you be available for a brief call this week?\n\nBest regards`);
  };

  const handleSendContact = async () => {
    if (!contactStudent || !contactSubject.trim() || !contactMessage.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both subject and message",
        variant: "destructive",
      });
      return;
    }

    setIsSendingContact(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      await recruiterApi.contactStudent(
        contactStudent._id,
        { subject: contactSubject, message: contactMessage },
        token
      );

      toast({
        title: "Message sent successfully",
        description: `Your message has been sent to ${contactStudent.name}`,
      });

      setContactStudent(null);
      setContactSubject("");
      setContactMessage("");
    } catch (error: any) {
      toast({
        title: "Failed to send message",
        description: error.message || "Unable to contact student",
        variant: "destructive",
      });
    } finally {
      setIsSendingContact(false);
    }
  };

  const handleContactAll = () => {
    if (matchedStudents.length === 0) {
      toast({
        title: "No students to contact",
        description: "There are no matched students to send messages to.",
        variant: "destructive",
      });
      return;
    }

    const company = recruiterProfile?.company || 'our company';
    setBulkContactSubject(`Exciting Opportunity at ${company} - ${selectedJob?.title || 'Position'}`);
    setBulkContactMessage(`Dear Candidate,\n\nWe came across your profile and are impressed by your skills and background. We have an exciting opportunity for the position of ${selectedJob?.title || 'a role'} at ${company} that aligns with your profile.\n\nBased on our AI matching system, your skills particularly in ${selectedJob?.requiredSkills?.slice(0, 3).join(', ') || 'relevant technologies'} make you an excellent fit for this role.\n\nWe would love to discuss this opportunity with you further. Please let us know if you're interested.\n\nBest regards,\n${recruiterProfile?.name || 'The Hiring Team'}\n${company}`);
    setShowBulkContactDialog(true);
  };

  const handleSendBulkContact = async () => {
    if (!bulkContactSubject.trim() || !bulkContactMessage.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both subject and message",
        variant: "destructive",
      });
      return;
    }

    setIsSendingBulkContact(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const studentIds = matchedStudents
        .map((match: any) => {
          const student = typeof match.studentId === 'object' ? match.studentId : null;
          return student?._id;
        })
        .filter(Boolean);

      if (studentIds.length === 0) throw new Error('No valid students to contact');

      await recruiterApi.contactMultipleStudents(
        studentIds,
        { subject: bulkContactSubject, message: bulkContactMessage },
        token
      );

      toast({
        title: "Messages sent successfully!",
        description: `Your message has been sent to ${studentIds.length} matched candidate${studentIds.length > 1 ? 's' : ''}`,
      });

      setShowBulkContactDialog(false);
      setBulkContactSubject("");
      setBulkContactMessage("");
    } catch (error: any) {
      toast({
        title: "Failed to send messages",
        description: error.message || "Unable to contact students",
        variant: "destructive",
      });
    } finally {
      setIsSendingBulkContact(false);
    }
  };

  const getStatusBadge = (status: Job["status"]) => {
    const variants: Record<string, { variant: any; className: string }> = {
      draft: { variant: "secondary", className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
      active: { variant: "default", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
      closed: { variant: "outline", className: "bg-gray-100 text-gray-600" },
      expired: { variant: "destructive", className: "" },
    };
    const config = variants[status] || variants.draft;
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getMatchScoreBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-emerald-500 hover:bg-emerald-600">Excellent ({score}%)</Badge>;
    if (score >= 60) return <Badge className="bg-blue-500 hover:bg-blue-600">Good ({score}%)</Badge>;
    if (score >= 40) return <Badge className="bg-amber-500 hover:bg-amber-600">Fair ({score}%)</Badge>;
    return <Badge variant="outline">Limited ({score}%)</Badge>;
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      jobSearchQuery === "" ||
      job.title.toLowerCase().includes(jobSearchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(jobSearchQuery.toLowerCase());
    return matchesSearch;
  });

  // Stats calculations
  const totalJobs = jobs.length;
  const activeJobs = jobs.filter(j => j.status === 'active').length;
  const totalMatches = jobs.reduce((sum, j) => sum + (j.matchCount || 0), 0);

  useEffect(() => {
    fetchJobs();
  }, [statusFilter]);

  useEffect(() => {
    if (selectedJob) {
      fetchMatches(selectedJob._id);
    }
  }, [selectedJob, minMatchScore]);

  if (isLoading) {
    return (
      <RecruiterLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </div>
        </div>
      </RecruiterLayout>
    );
  }

  return (
    <RecruiterLayout>
      {/* Profile Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card variant="elevated" className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                {recruiterProfile?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'RC'}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-1">{recruiterProfile?.name || 'Recruiter'}</h2>
                <p className="text-muted-foreground mb-3">
                  <span className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    {recruiterProfile?.company || 'Company'} • {recruiterProfile?.designation || 'HR'}
                  </span>
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div className="rounded-xl border bg-card/60 p-4 text-center">
                    <Briefcase className="w-5 h-5 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold">{totalJobs}</p>
                    <p className="text-xs text-muted-foreground">Total Jobs</p>
                  </div>
                  <div className="rounded-xl border bg-card/60 p-4 text-center">
                    <PlayCircle className="w-5 h-5 mx-auto mb-2 text-emerald-500" />
                    <p className="text-2xl font-bold">{activeJobs}</p>
                    <p className="text-xs text-muted-foreground">Active Jobs</p>
                  </div>
                  <div className="rounded-xl border bg-card/60 p-4 text-center">
                    <Users className="w-5 h-5 mx-auto mb-2 text-blue-500" />
                    <p className="text-2xl font-bold">{totalMatches}</p>
                    <p className="text-xs text-muted-foreground">Total Matches</p>
                  </div>
                  <div className="rounded-xl border bg-card/60 p-4 text-center">
                    <Target className="w-5 h-5 mx-auto mb-2 text-amber-500" />
                    <p className="text-2xl font-bold">{students.length}</p>
                    <p className="text-xs text-muted-foreground">Talent Pool</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <Card className="border-none bg-gradient-to-r from-violet-600/10 via-background to-purple-600/10 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <Sparkles className="w-32 h-32" />
          </div>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-primary text-primary-foreground hover:bg-primary/90">AI-Powered Matching</Badge>
                </div>
                <h3 className="text-2xl font-bold tracking-tight">Find Your Perfect Candidates</h3>
                <p className="text-muted-foreground max-w-lg">
                  Create job postings and let our AI match you with the most qualified students based on skills, projects, and readiness scores.
                </p>
              </div>
              <Button
                size="lg"
                onClick={() => {
                  setJobDialogJob(null);
                  setJobDialogOpen(true);
                }}
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create New Job
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs defaultValue="jobs" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="jobs" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Job Postings
            </TabsTrigger>
            <TabsTrigger value="talent" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Talent Pool
            </TabsTrigger>
          </TabsList>

          {/* Jobs Tab */}
          <TabsContent value="jobs" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search jobs..."
                      value={jobSearchQuery}
                      onChange={(e) => setJobSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                      <SelectTrigger className="w-[150px]">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Filter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Jobs</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={() => {
                      setJobDialogJob(null);
                      setJobDialogOpen(true);
                    }}>
                      <Plus className="w-4 h-4 mr-2" />
                      New Job
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Job Cards Grid */}
            {isLoadingJobs ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredJobs.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Briefcase className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-xl font-semibold mb-2">No Jobs Found</h3>
                  <p className="text-muted-foreground mb-6">
                    Create your first job posting to start matching with talented students.
                  </p>
                  <Button onClick={() => {
                    setJobDialogJob(null);
                    setJobDialogOpen(true);
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Job
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredJobs.map((job, index) => (
                  <motion.div
                    key={job._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg truncate">{job.title}</CardTitle>
                            <CardDescription className="mt-1">
                              {job.location} • {job.jobType}
                            </CardDescription>
                          </div>
                          {getStatusBadge(job.status)}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2">
                            <UserCheck className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium">Matches</span>
                          </div>
                          <Badge variant="secondary" className="font-bold">
                            {job.matchCount || 0} students
                          </Badge>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {job.requiredSkills.length > 0 ? (
                            <>
                              {job.requiredSkills.slice(0, 3).map((skill) => (
                                <Badge key={skill} variant="outline" className="text-xs font-normal">
                                  {skill}
                                </Badge>
                              ))}
                              {job.requiredSkills.length > 3 && (
                                <Badge variant="outline" className="text-xs font-normal">
                                  +{job.requiredSkills.length - 3}
                                </Badge>
                              )}
                            </>
                          ) : (
                            <Badge variant="outline" className="text-xs font-normal">
                              AI Parsed Skills
                            </Badge>
                          )}
                        </div>

                        <div className="flex gap-2 pt-2">
                          {job.status === "draft" ? (
                            <Button
                              size="sm"
                              className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600"
                              onClick={() => handlePublishJob(job._id)}
                            >
                              <PlayCircle className="w-4 h-4 mr-1" />
                              Publish
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => handleViewMatches(job)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View Matches
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setJobDialogJob(job);
                              setJobDialogOpen(true);
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => handleDeleteJob(job._id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Selected Job Matches Section */}
            {selectedJob && (
              <motion.div
                id="matched-students-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Selected Job Header */}
                <Card className="bg-gradient-to-r from-violet-600 to-purple-600 text-white border-none">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-bold mb-1">{selectedJob.title}</h3>
                        <p className="text-white/80">
                          {selectedJob.location} • {selectedJob.matchCount || 0} matches found
                        </p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {selectedJob.requiredSkills.length > 0 ? (
                            selectedJob.requiredSkills.map((skill) => (
                              <Badge key={skill} className="bg-white/20 text-white border-white/30">
                                {skill}
                              </Badge>
                            ))
                          ) : (
                            <Badge className="bg-white/20 text-white border-white/30">
                              AI-parsed skills will appear here
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleRefreshMatches(selectedJob._id)}
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          Refresh Matches
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedJob(null)}
                        >
                          Close
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 p-3 rounded-lg bg-white/10 border border-white/20">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-white/90">
                          {selectedJob.requiredSkills.length > 0
                            ? <>Students must match at least <strong>50% of AI-extracted skills</strong> ({Math.ceil(selectedJob.requiredSkills.length * 0.5)} out of {selectedJob.requiredSkills.length} skills) to appear in results.</>
                            : <>AI is matching candidates based on your job description.</>}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Match Filters */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <Label className="text-sm font-medium whitespace-nowrap">Min Match Score:</Label>
                        <Select
                          value={String(minMatchScore)}
                          onValueChange={(v) => setMinMatchScore(Number(v))}
                        >
                          <SelectTrigger className="w-[150px]">
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
                      {matchedStudents.length > 0 && (
                        <Button onClick={handleContactAll}>
                          <Mail className="w-4 h-4 mr-2" />
                          Contact All ({matchedStudents.length})
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Matched Students Grid */}
                {isLoadingMatches ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : matchedStudents.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Award className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Matches Found</h3>
                      <p className="text-muted-foreground">
                        Try adjusting your filters or refresh matches to find candidates.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {matchedStudents.map((match: any, index: number) => {
                      const student = typeof match.studentId === 'object' ? match.studentId : null;
                      if (!student) return null;

                      return (
                        <motion.div
                          key={student._id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Card className="hover:shadow-lg transition-all duration-300">
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center text-lg font-bold text-white">
                                    {student.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'ST'}
                                  </div>
                                  <div>
                                    <CardTitle className="text-lg">{student.name || student.email}</CardTitle>
                                    <CardDescription>{student.college} • {student.branch}</CardDescription>
                                  </div>
                                </div>
                                {getMatchScoreBadge(match.matchScore)}
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800">
                                <div className="flex items-start gap-2">
                                  <Brain className="w-4 h-4 text-violet-600 dark:text-violet-400 mt-0.5 flex-shrink-0" />
                                  <p className="text-sm text-muted-foreground">{match.matchReason}</p>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">CGPA:</span>
                                  <span className="font-medium">{student.cgpa || "N/A"}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Readiness:</span>
                                  <span className="font-medium">{student.readinessScore || "N/A"}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Projects:</span>
                                  <span className="font-medium">{student.projects?.length || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Skills:</span>
                                  <span className="font-medium">{student.skills?.length || 0}</span>
                                </div>
                              </div>

                              <div>
                                <p className="text-xs text-muted-foreground mb-2">Skills Matched:</p>
                                <div className="flex flex-wrap gap-1">
                                  {match.skillsMatched?.slice(0, 5).map((skill: string) => (
                                    <Badge key={skill} className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                      {skill}
                                    </Badge>
                                  ))}
                                  {match.skillsMatched?.length > 5 && (
                                    <Badge variant="secondary" className="text-xs">
                                      +{match.skillsMatched.length - 5}
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              <div className="flex gap-2 pt-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                  onClick={() => handleShowExplanation(student._id, student.name || student.email, match.matchScore)}
                                >
                                  <Brain className="w-4 h-4 mr-1" />
                                  Why?
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                  onClick={() => openContactModal(student)}
                                >
                                  <Mail className="w-4 h-4 mr-1" />
                                  Contact
                                </Button>
                                <Button
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => navigate(`/recruiter/student/${student._id}`)}
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  Profile
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {/* Why This Candidate Chat */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Brain className="w-5 h-5" />
                      Ask Why This Candidate Was Chosen
                    </CardTitle>
                    <CardDescription>
                      Select a candidate and ask a question. The AI will justify the match.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Candidate</Label>
                        <Select value={whyChatStudentId} onValueChange={setWhyChatStudentId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select candidate" />
                          </SelectTrigger>
                          <SelectContent>
                            {matchedStudents.map((match: any) => {
                              const student = typeof match.studentId === 'object' ? match.studentId : null;
                              if (!student) return null;
                              return (
                                <SelectItem key={student._id} value={student._id}>
                                  {student.name || student.email}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Question</Label>
                        <Input
                          placeholder="Why did you choose this person?"
                          value={whyChatInput}
                          onChange={(e) => setWhyChatInput(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleWhyChatSubmit();
                            }
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={handleWhyChatSubmit} disabled={whyChatLoading || !whyChatInput.trim()}>
                        {whyChatLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Thinking...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Ask AI
                          </>
                        )}
                      </Button>
                    </div>

                    {whyChatMessages.length > 0 && (
                      <div className="space-y-3 max-h-64 overflow-y-auto border rounded-lg p-3 bg-muted/30">
                        {whyChatMessages.map((msg, idx) => (
                          <div key={idx} className={msg.role === "user" ? "text-right" : "text-left"}>
                            <div className={msg.role === "user" ? "inline-block rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm" : "inline-block rounded-lg bg-card px-3 py-2 text-sm"}>
                              {msg.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </TabsContent>

          {/* Talent Pool Tab */}
          <TabsContent value="talent" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Browse Talent Pool
                </CardTitle>
                <CardDescription>
                  Explore {students.length} students registered on the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                {students.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">No students available yet.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {students.slice(0, 12).map((student, index) => (
                      <motion.div
                        key={student._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <Card className="hover:shadow-md transition-shadow">
                          <CardContent className="pt-6">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center text-sm font-bold text-white">
                                {student.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'ST'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold truncate">{student.name}</p>
                                <p className="text-sm text-muted-foreground truncate">{student.college}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {student.readinessScore || 0}% Ready
                                  </Badge>
                                  {student.skills?.length > 0 && (
                                    <Badge variant="outline" className="text-xs">
                                      {student.skills.length} skills
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2 mt-4">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                onClick={() => openContactModal(student)}
                              >
                                <Mail className="w-4 h-4 mr-1" />
                                Contact
                              </Button>
                              <Button
                                size="sm"
                                className="flex-1"
                                onClick={() => navigate(`/recruiter/student/${student._id}`)}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
                {students.length > 12 && (
                  <div className="text-center mt-6">
                    <Button variant="outline" onClick={() => navigate('/recruiter/talent')}>
                      View All {students.length} Students
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* AI Assistant */}
      <AIRecruiterAssistant students={students} />

      {/* Dialogs */}
      <JobCreationDialog
        open={jobDialogOpen}
        onOpenChange={(open) => {
          setJobDialogOpen(open);
          if (!open) {
            setJobDialogJob(null);
          }
        }}
        onJobCreated={fetchJobs}
        job={jobDialogJob}
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

      {/* Contact Student Dialog */}
      <Dialog open={!!contactStudent} onOpenChange={(open) => !open && setContactStudent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Contact {contactStudent?.name}
            </DialogTitle>
            <DialogDescription>
              Send a message to this candidate. They will receive this via email.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-3 rounded-lg bg-muted/50 border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center text-lg font-bold text-white">
                  {contactStudent?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'ST'}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{contactStudent?.name}</p>
                  <p className="text-sm text-muted-foreground">{contactStudent?.email}</p>
                  <p className="text-sm text-muted-foreground">{contactStudent?.college}</p>
                </div>
                <Badge variant="secondary">{contactStudent?.readinessScore || 0}% Ready</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-subject">Subject *</Label>
              <Input
                id="contact-subject"
                value={contactSubject}
                onChange={(e) => setContactSubject(e.target.value)}
                placeholder="e.g., Opportunity at TechCorp"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-message">Message *</Label>
              <Textarea
                id="contact-message"
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="Write your message here..."
                rows={8}
                className="resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setContactStudent(null)} disabled={isSendingContact}>
                Cancel
              </Button>
              <Button
                onClick={handleSendContact}
                disabled={isSendingContact || !contactSubject.trim() || !contactMessage.trim()}
              >
                {isSendingContact ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Contact Dialog */}
      <Dialog open={showBulkContactDialog} onOpenChange={setShowBulkContactDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Contact All Matched Candidates</DialogTitle>
            <DialogDescription>
              Send a message to all {matchedStudents.length} matched candidate{matchedStudents.length !== 1 ? 's' : ''} for {selectedJob?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="border rounded-lg p-4 bg-muted/30">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Recipients ({matchedStudents.length})
                </h4>
                <Badge variant="secondary">
                  {matchedStudents.filter((m: any) => m.matchScore >= 80).length} Excellent • {matchedStudents.filter((m: any) => m.matchScore >= 60 && m.matchScore < 80).length} Good
                </Badge>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-2">
                {matchedStudents.map((match: any, index: number) => {
                  const student = typeof match.studentId === 'object' ? match.studentId : null;
                  if (!student) return null;

                  return (
                    <div
                      key={student._id}
                      className="flex items-center justify-between p-2 bg-card rounded border text-sm"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{student.name || student.email}</p>
                          <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                        </div>
                      </div>
                      {getMatchScoreBadge(match.matchScore)}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bulk-subject">Subject</Label>
              <Input
                id="bulk-subject"
                placeholder="Email subject"
                value={bulkContactSubject}
                onChange={(e) => setBulkContactSubject(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bulk-message">Message</Label>
              <Textarea
                id="bulk-message"
                placeholder="Your message to candidates..."
                value={bulkContactMessage}
                onChange={(e) => setBulkContactMessage(e.target.value)}
                rows={10}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowBulkContactDialog(false)} disabled={isSendingBulkContact}>
              Cancel
            </Button>
            <Button
              onClick={handleSendBulkContact}
              disabled={isSendingBulkContact || !bulkContactSubject.trim() || !bulkContactMessage.trim()}
            >
              {isSendingBulkContact ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send to All ({matchedStudents.length})
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </RecruiterLayout>
  );
};

export default RecruiterDashboard;
