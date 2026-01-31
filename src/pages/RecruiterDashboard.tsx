import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, TrendingUp, Award, CheckCircle2, Brain, Filter, LogOut, Info, BookOpen, Clock, GraduationCap, Settings, Mail, Send, Briefcase, Plus, Eye, Trash2, PlayCircle, Sparkles, AlertTriangle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useEffect, useState } from "react";
import { recruiterApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import AIRecruiterAssistant from "@/components/AIRecruiterAssistant";
import { LogoutConfirmDialog } from "@/components/LogoutConfirmDialog";
import JobCreationDialog from "@/components/JobCreationDialog";
import MatchExplanationModal from "@/components/MatchExplanationModal";
import type { Job } from "@/types/job";
import { jobApi } from "@/lib/api";

const RecruiterDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [contactStudent, setContactStudent] = useState<any>(null);
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [isSendingContact, setIsSendingContact] = useState(false);
  const [recruiterProfile, setRecruiterProfile] = useState<any>(null);

  // Job management state
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [matchedStudents, setMatchedStudents] = useState<any[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "active" | "closed">("all");
  const [minMatchScore, setMinMatchScore] = useState<number>(0);
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedStudentName, setSelectedStudentName] = useState<string>("");
  const [selectedMatchScore, setSelectedMatchScore] = useState<number>(0);
  const [jobSearchQuery, setJobSearchQuery] = useState("");
  
  // Bulk contact state
  const [showBulkContactDialog, setShowBulkContactDialog] = useState(false);
  const [bulkContactSubject, setBulkContactSubject] = useState("");
  const [bulkContactMessage, setBulkContactMessage] = useState("");
  const [isSendingBulkContact, setIsSendingBulkContact] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
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

        // Fetch recruiter profile first to check if complete
        const profile: any = await recruiterApi.getProfile(token);
        setRecruiterProfile(profile);
        
        // Check if profile is complete
        if (!profile.isProfileComplete) {
          toast({
            title: "Complete Your Profile",
            description: "Please complete your profile before accessing the dashboard",
            variant: "destructive",
          });
          navigate('/recruiter/settings');
          return;
        }

        // Build params with all current filter values
        const params: any = {};
        if (minScore) params.minScore = minScore;
        if (maxScore) params.maxScore = maxScore;
        if (searchQuery) params.college = searchQuery;
        if (selectedSkills.length > 0) params.skills = selectedSkills.join(',');
        if (minProjects) params.minProjects = minProjects;
        if (minCGPA) params.minCGPA = minCGPA;

        const data = await recruiterApi.listStudents(params, token);
        setStudents(Array.isArray(data) ? data : []);
      } catch (error: any) {
        toast({
          title: "Error loading students",
          description: error.message || "Failed to fetch student data",
          variant: "destructive",
        });
        if (error.message.includes('401') || error.message.includes('token')) {
          navigate('/recruiter/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, [navigate, toast]);


  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    localStorage.removeItem('recruiterData');
    toast({
      title: "Logged out successfully",
    });
    navigate('/');
  };

  const openContactModal = (student: any) => {
    setContactStudent(student);
    const recruiterData = JSON.parse(localStorage.getItem('recruiterData') || '{}');
    const company = recruiterData.company || 'our company';

    // Pre-fill with template
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
      const userType = localStorage.getItem('userType');

      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      if (userType !== 'recruiter') {
        throw new Error(`Invalid user type: ${userType}. Only recruiters can contact candidates.`);
      }

      await recruiterApi.contactStudent(
        contactStudent._id,
        {
          subject: contactSubject,
          message: contactMessage,
        },
        token
      );

      toast({
        title: "Message sent successfully",
        description: `Your message has been sent to ${contactStudent.name}`,
      });

      // Close modal and reset
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

  // Job management functions
  const fetchJobs = async () => {
    setIsLoadingJobs(true);
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
      toast({
        title: "Job deleted successfully",
      });
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
    // Scroll to matched students section
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
      jobSearchQuery === "" ||
      job.title.toLowerCase().includes(jobSearchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(jobSearchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleContactAll = () => {
    if (matchedStudents.length === 0) {
      toast({
        title: "No students to contact",
        description: "There are no matched students to send messages to.",
        variant: "destructive",
      });
      return;
    }

    // Pre-fill template
    const recruiterData = JSON.parse(localStorage.getItem('recruiterData') || '{}');
    const company = recruiterData.company || 'our company';
    
    setBulkContactSubject(`Exciting Opportunity at ${company} - ${selectedJob?.title || 'Position'}`);
    setBulkContactMessage(`Dear Candidate,\n\nWe came across your profile and are impressed by your skills and background. We have an exciting opportunity for the position of ${selectedJob?.title || 'a role'} at ${company} that aligns with your profile.\n\nBased on our AI matching system, your skills particularly in ${selectedJob?.requiredSkills.slice(0, 3).join(', ')} make you an excellent fit for this role.\n\nWe would love to discuss this opportunity with you further. Please let us know if you're interested.\n\nBest regards,\n${recruiterData.name || 'The Hiring Team'}\n${company}`);
    
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
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      // Extract student IDs from matched students
      const studentIds = matchedStudents
        .map((match: any) => {
          const student = typeof match.studentId === 'object' ? match.studentId : null;
          return student?._id;
        })
        .filter(Boolean);

      if (studentIds.length === 0) {
        throw new Error('No valid students to contact');
      }

      await recruiterApi.contactMultipleStudents(
        studentIds,
        {
          subject: bulkContactSubject,
          message: bulkContactMessage,
        },
        token
      );

      toast({
        title: "Messages sent successfully!",
        description: `Your message has been sent to ${studentIds.length} matched candidate${studentIds.length > 1 ? 's' : ''}`,
      });

      // Close modal and reset
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

  // useEffect hooks for job management
  useEffect(() => {
    fetchJobs();
  }, [statusFilter]);

  useEffect(() => {
    if (selectedJob) {
      fetchMatches(selectedJob._id);
    }
  }, [selectedJob, minMatchScore]);

  if (isLoading || isLoadingJobs) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-secondary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Top Navigation */}
      <header className="bg-card border-b sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-secondary bg-clip-text text-transparent">
            EvolvEd Recruiter
          </h1>
          <nav className="flex gap-4 items-center">
            <Button variant="ghost" onClick={() => navigate("/recruiter/dashboard")}>
              Dashboard
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowCreateDialog(true)}
              className="bg-gradient-secondary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Job
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/recruiter/settings")}
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLogoutDialog(true)}
              className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground transition-all duration-300 shadow-sm"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* My Job Postings Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-secondary" />
                    Talent Pool
                  </CardTitle>
                  <CardDescription>Manage your job postings and view AI-matched candidates</CardDescription>
                </div>
                <div className="flex gap-2">
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
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Job
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredJobs.length === 0 ? (
                <div className="py-12 text-center">
                  <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No jobs found</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first job posting to start matching with talented students.
                  </p>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Job
                  </Button>
                </div>
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
            </CardContent>
          </Card>
        </motion.div>

        {/* Matched Students Section */}
        {selectedJob && (
          <motion.div
            id="matched-students-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-card mb-4">
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
                
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleRefreshMatches(selectedJob._id)}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Refresh Matches
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setSelectedJob(null)}
                  >
                    Close Matches
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card mb-4">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
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
                  {matchedStudents.length > 0 && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleContactAll}
                      className="bg-gradient-secondary"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Contact All ({matchedStudents.length})
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {isLoadingMatches ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
              </div>
            ) : matchedStudents.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
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
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                              <Brain className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-muted-foreground">
                                {match.matchReason}
                              </p>
                            </div>
                          </div>

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
          </motion.div>
        )}



      </div>

      {/* AI Recruiter Assistant */}
      <AIRecruiterAssistant
        students={students}
      />
      <LogoutConfirmDialog
        isOpen={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
        onConfirm={handleLogout}
      />

      {/* Contact Student Dialog */}
      <Dialog open={!!contactStudent} onOpenChange={(open) => !open && setContactStudent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-secondary" />
              Contact {contactStudent?.name}
            </DialogTitle>
            <DialogDescription>
              Send a message to this candidate through the EvolvEd portal. They will receive this via email.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Student Info Preview */}
            <div className="p-3 bg-muted/50 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-secondary rounded-full flex items-center justify-center text-lg font-bold text-secondary-foreground">
                  {contactStudent?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'ST'}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{contactStudent?.name}</p>
                  <p className="text-sm text-muted-foreground">{contactStudent?.email}</p>
                  <p className="text-sm text-muted-foreground">{contactStudent?.college}</p>
                </div>
                <Badge variant="secondary">
                  {contactStudent?.readinessScore || 0}% Ready
                </Badge>
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="contact-subject">Subject *</Label>
              <Input
                id="contact-subject"
                value={contactSubject}
                onChange={(e) => setContactSubject(e.target.value)}
                placeholder="e.g., Opportunity at TechCorp"
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="contact-message">Message *</Label>
              <Textarea
                id="contact-message"
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="Write your message here..."
                rows={10}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Tip: Be specific about the opportunity and mention relevant skills you noticed in their profile
              </p>
            </div>

            {/* Template Suggestions */}
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <p className="text-sm font-semibold mb-2">Quick Templates:</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const recruiterData = JSON.parse(localStorage.getItem('recruiterData') || '{}');
                    const company = recruiterData.company || 'our company';
                    setContactMessage(`Dear ${contactStudent?.name},\n\nI'd like to invite you for an interview at ${company}. We're impressed by your profile and believe you'd be a great fit for our team.\n\nPlease let me know your availability for the coming week.\n\nBest regards`);
                  }}
                >
                  Interview Invite
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const recruiterData = JSON.parse(localStorage.getItem('recruiterData') || '{}');
                    const company = recruiterData.company || 'our company';
                    setContactMessage(`Dear ${contactStudent?.name},\n\nWe're hosting a campus recruitment drive and would love for you to participate. Based on your skills in ${contactStudent?.skills?.[0] || 'technology'}, we think you'd be an excellent candidate.\n\nDetails will be shared once you confirm your interest.\n\nLooking forward to hearing from you!`);
                  }}
                >
                  Campus Drive
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const recruiterData = JSON.parse(localStorage.getItem('recruiterData') || '{}');
                    const company = recruiterData.company || 'our company';
                    setContactMessage(`Hi ${contactStudent?.name},\n\nI noticed your impressive work in ${contactStudent?.skills?.[0] || 'your field'}. We have an exciting internship opportunity at ${company} that aligns perfectly with your skills.\n\nWould you like to learn more?\n\nCheers`);
                  }}
                >
                  Internship Offer
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setContactStudent(null)}
              disabled={isSendingContact}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendContact}
              disabled={isSendingContact || !contactSubject.trim() || !contactMessage.trim()}
              className="bg-gradient-secondary"
            >
              {isSendingContact ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
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
        </DialogContent>
      </Dialog>

      {/* Job Creation Dialog */}
      <JobCreationDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onJobCreated={fetchJobs}
      />

      {/* Match Explanation Modal */}
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
            {/* Recipient List */}
            <div className="border rounded-lg p-4 bg-muted/30">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Award className="h-4 w-4" />
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
                      className="flex items-center justify-between p-2 bg-card rounded border text-sm hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-8 h-8 bg-gradient-secondary rounded-full flex items-center justify-center text-xs font-bold text-white">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{student.name || student.email}</p>
                          <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {student.college?.substring(0, 20)}{student.college?.length > 20 ? '...' : ''}
                        </Badge>
                        {getMatchScoreBadge(match.matchScore)}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                All listed candidates will receive this email based on your current match filters.
              </div>
            </div>

            {/* Subject Input */}
            <div>
              <Label htmlFor="bulk-subject">Subject</Label>
              <Input
                id="bulk-subject"
                placeholder="Email subject"
                value={bulkContactSubject}
                onChange={(e) => setBulkContactSubject(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Message Textarea */}
            <div>
              <Label htmlFor="bulk-message">Message</Label>
              <Textarea
                id="bulk-message"
                placeholder="Your message to candidates..."
                value={bulkContactMessage}
                onChange={(e) => setBulkContactMessage(e.target.value)}
                rows={10}
                className="mt-1 font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Tip: Use professional language. Your signature will be added automatically.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowBulkContactDialog(false)}
              disabled={isSendingBulkContact}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendBulkContact}
              disabled={isSendingBulkContact || !bulkContactSubject.trim() || !bulkContactMessage.trim()}
              className="bg-gradient-secondary"
            >
              {isSendingBulkContact ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Sending to {matchedStudents.length} candidate{matchedStudents.length !== 1 ? 's' : ''}...
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
    </div>
  );
};

export default RecruiterDashboard;
