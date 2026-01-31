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
import { Search, TrendingUp, Award, CheckCircle2, Brain, Filter, LogOut, GitCompare, Info, BookOpen, Clock, GraduationCap, Settings, Mail, Send, Briefcase, Plus, Eye, Trash2, PlayCircle, Sparkles, AlertTriangle, Loader2 } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [minScore, setMinScore] = useState("");
  const [maxScore, setMaxScore] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [compareMode, setCompareMode] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "skills" | "projects" | "score" | "cgpa">("all");
  const [skillFilter, setSkillFilter] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [minProjects, setMinProjects] = useState("");
  const [minCGPA, setMinCGPA] = useState("");
  const [showFilters, setShowFilters] = useState(false);
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

  // Predefined trending skills
  const trendingSkills = [
    "JavaScript", "Python", "Java", "TypeScript", "React",
    "Node.js", "MongoDB", "SQL", "AWS", "Docker",
    "Kubernetes", "Git", "REST API", "GraphQL", "Machine Learning",
    "AI/ML", "Data Science", "DevOps", "CI/CD", "Microservices"
  ];

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
  }, [navigate, toast, selectedSkills, minScore, maxScore, minProjects, minCGPA, searchQuery]);


  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    localStorage.removeItem('recruiterData');
    toast({
      title: "Logged out successfully",
    });
    navigate('/');
  };

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params: any = {};

      if (minScore) params.minScore = minScore;
      if (maxScore) params.maxScore = maxScore;
      if (searchQuery) params.college = searchQuery;
      if (selectedSkills.length > 0) params.skills = selectedSkills.join(',');
      if (minProjects) params.minProjects = minProjects;
      if (minCGPA) params.minCGPA = minCGPA;

      const data = await recruiterApi.listStudents(params, token!);
      setStudents(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast({
        title: "Search failed",
        description: error.message || "Failed to search students",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        if (prev.length >= 3) {
          toast({
            title: "Maximum selection reached",
            description: "You can compare up to 3 students at a time",
            variant: "destructive",
          });
          return prev;
        }
        return [...prev, studentId];
      }
    });
  };

  const handleCompare = () => {
    if (selectedStudents.length < 2) {
      toast({
        title: "Select at least 2 students",
        description: "Please select at least 2 students to compare",
        variant: "destructive",
      });
      return;
    }
    setCompareMode(true);
    // Scroll to comparison section
    document.getElementById('comparison-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const clearComparison = () => {
    setSelectedStudents([]);
    setCompareMode(false);
  };

  const addSkill = (skill?: string) => {
    const skillToAdd = skill || skillFilter.trim();
    if (skillToAdd && !selectedSkills.includes(skillToAdd)) {
      setSelectedSkills([...selectedSkills, skillToAdd]);
      setSkillFilter("");
    }
  };

  const removeSkill = (skill: string) => {
    setSelectedSkills(selectedSkills.filter(s => s !== skill));
  };

  const clearAllFilters = () => {
    setFilterType("all");
    setMinScore("");
    setMaxScore("");
    setSelectedSkills([]);
    setSkillFilter("");
    setMinProjects("");
    setMinCGPA("");
    setSearchQuery("");
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

  // Filter students based on ALL selected criteria (applied simultaneously)
  const getFilteredStudents = () => {
    let filtered = students;

    // College/Name search filter
    if (searchQuery) {
      filtered = filtered.filter(student =>
        student.college?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Skills filter - applies if any skills are selected
    if (selectedSkills.length > 0) {
      filtered = filtered.filter(student => {
        const projectSkills = student.projects?.flatMap((p: any) => p.tags || []) || [];
        const profileSkills = student.skills || [];
        const allStudentSkills = [...projectSkills, ...profileSkills];

        return selectedSkills.some(skill =>
          allStudentSkills.some((s: string) =>
            s.toLowerCase().includes(skill.toLowerCase())
          )
        );
      });
    }

    // Projects filter - applies if minimum is set
    if (minProjects) {
      filtered = filtered.filter(student =>
        (student.projects?.length || 0) >= parseInt(minProjects)
      );
    }

    // CGPA filter - applies if minimum is set
    if (minCGPA) {
      filtered = filtered.filter(student =>
        (student.cgpa || 0) >= parseFloat(minCGPA)
      );
    }

    // Readiness Score filter - applies if min/max are set
    if (minScore) {
      filtered = filtered.filter(student =>
        (student.readinessScore || 0) >= parseInt(minScore)
      );
    }
    if (maxScore) {
      filtered = filtered.filter(student =>
        (student.readinessScore || 0) <= parseInt(maxScore)
      );
    }

    return filtered;
  };

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

  // Generate comparison data from actual student readiness history
  const getStudentGrowthData = (student: any) => {
    if (!student?.readinessHistory || student.readinessHistory.length === 0) {
      // Generate sample consistent growth pattern if no history
      return [
        { month: "Jan", score: Math.max(0, student.readinessScore - 25) },
        { month: "Feb", score: Math.max(0, student.readinessScore - 20) },
        { month: "Mar", score: Math.max(0, student.readinessScore - 15) },
        { month: "Apr", score: Math.max(0, student.readinessScore - 10) },
        { month: "May", score: Math.max(0, student.readinessScore - 5) },
        { month: "Jun", score: student.readinessScore || 0 },
      ];
    }

    // Use actual readiness history if available
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    const history = student.readinessHistory.slice(-6); // Last 6 entries

    return months.map((month, index) => ({
      month,
      score: history[index]?.score || 0
    }));
  };

  // Get filtered students based on current filter settings
  const filteredStudents = getFilteredStudents();

  const topCandidates = filteredStudents.slice(0, 10);

  // Get selected students for comparison - only show if user has selected students
  const comparedStudents = selectedStudents.length >= 2
    ? students.filter(s => selectedStudents.includes(s._id))
    : [];

  // Get data for comparison charts
  const studentAData = comparedStudents.length > 0 ? getStudentGrowthData(comparedStudents[0]) : [];
  const studentBData = comparedStudents.length > 1 ? getStudentGrowthData(comparedStudents[1]) : [];
  const studentCData = comparedStudents.length > 2 ? getStudentGrowthData(comparedStudents[2]) : [];

  const studentAName = comparedStudents[0]?.name || "Student A";
  const studentBName = comparedStudents[1]?.name || "Student B";
  const studentCName = comparedStudents[2]?.name || "Student C";


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

        {/* Search & Filter */}
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
                    <Filter className="w-5 h-5 text-secondary" />
                    Find Candidates
                  </CardTitle>
                  <CardDescription>Advanced filtering by skills, projects, and readiness score</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  {showFilters ? "Hide Filters" : "Show Filters"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Basic Search */}
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search by name or college..."
                    className="w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold">Advanced Filters <span className="text-sm text-muted-foreground">(All filters apply simultaneously)</span></h4>
                    <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                      Clear All Filters
                    </Button>
                  </div>

                  {/* Skills Filter */}
                  <div className="space-y-3">
                    <h5 className="text-sm font-medium flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Skills
                    </h5>

                    {/* Trending Skills */}
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Trending Skills (click to add):</p>
                      <div className="flex flex-wrap gap-2">
                        {trendingSkills.map((skill) => (
                          <Badge
                            key={skill}
                            variant={selectedSkills.includes(skill) ? "default" : "outline"}
                            className="cursor-pointer hover:bg-secondary transition-colors"
                            onClick={() => selectedSkills.includes(skill) ? removeSkill(skill) : addSkill(skill)}
                          >
                            {skill} {selectedSkills.includes(skill) && "✓"}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Custom Skill Input */}
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Or enter custom skill:</p>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter custom skill (e.g., Flutter, Vue.js)"
                          value={skillFilter}
                          onChange={(e) => setSkillFilter(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && addSkill()}
                        />
                        <Button onClick={() => addSkill()} size="sm">Add</Button>
                      </div>
                    </div>

                    {/* Selected Skills */}
                    {selectedSkills.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">Selected Skills (click to remove):</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedSkills.map((skill) => (
                            <Badge
                              key={skill}
                              variant="secondary"
                              className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                              onClick={() => removeSkill(skill)}
                            >
                              {skill} ×
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-4 space-y-4">
                    {/* Projects Filter */}
                    <div className="flex gap-2 items-center">
                      <label className="text-sm font-medium w-32">Min Projects:</label>
                      <Input
                        type="number"
                        placeholder="e.g., 3"
                        value={minProjects}
                        onChange={(e) => setMinProjects(e.target.value)}
                        className="w-32"
                        min="0"
                      />
                      <span className="text-xs text-muted-foreground">Students with at least this many projects</span>
                    </div>

                    {/* CGPA Filter */}
                    <div className="flex gap-2 items-center">
                      <label className="text-sm font-medium w-32">Min CGPA:</label>
                      <Input
                        type="number"
                        placeholder="e.g., 8.0"
                        value={minCGPA}
                        onChange={(e) => setMinCGPA(e.target.value)}
                        className="w-32"
                        min="0"
                        max="10"
                        step="0.1"
                      />
                      <span className="text-xs text-muted-foreground">Students with CGPA above this value</span>
                    </div>

                    {/* Readiness Score Filter */}
                    <div className="space-y-2">
                      <div className="flex gap-4 items-center">
                        <div className="flex gap-2 items-center">
                          <label className="text-sm font-medium">Min Score:</label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={minScore}
                            onChange={(e) => setMinScore(e.target.value)}
                            className="w-24"
                            min="0"
                            max="100"
                          />
                        </div>
                        <div className="flex gap-2 items-center">
                          <label className="text-sm font-medium">Max Score:</label>
                          <Input
                            type="number"
                            placeholder="100"
                            value={maxScore}
                            onChange={(e) => setMaxScore(e.target.value)}
                            className="w-24"
                            min="0"
                            max="100"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge
                          variant="outline"
                          className="cursor-pointer hover:bg-secondary"
                          onClick={() => { setMinScore("75"); setMaxScore(""); }}
                        >
                          Score &gt; 75%
                        </Badge>
                        <Badge
                          variant="outline"
                          className="cursor-pointer hover:bg-secondary"
                          onClick={() => { setMinScore("80"); setMaxScore(""); }}
                        >
                          Score &gt; 80%
                        </Badge>
                        <Badge
                          variant="outline"
                          className="cursor-pointer hover:bg-secondary"
                          onClick={() => { setMinScore("90"); setMaxScore(""); }}
                        >
                          Score &gt; 90%
                        </Badge>
                        <Badge
                          variant="outline"
                          className="cursor-pointer hover:bg-secondary"
                          onClick={() => { setMinScore("50"); setMaxScore("75"); }}
                        >
                          50-75%
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Results Count */}
                  <div className="border-t pt-3">
                    <Badge variant="default" className="text-sm">
                      {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} match your filters
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>


        {/* Top Candidates */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          {/* Dynamic Scoring Info Banner */}
          {(selectedSkills.length > 0 || minProjects || minCGPA || minScore) && (
            <Card className="mb-4 border-primary/50 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">Dynamic Match Scoring Active</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Students are now ranked by relevance to your search criteria. The match score considers skill alignment,
                      relevant projects, certifications, consistency, and academic performance.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">
                        <Award className="w-3 h-3 mr-1" />
                        Skill Match: 30%
                      </Badge>
                      <Badge variant="outline">
                        <BookOpen className="w-3 h-3 mr-1" />
                        Projects: 25%
                      </Badge>
                      <Badge variant="outline">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Base Score: 20%
                      </Badge>
                      <Badge variant="outline">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Certifications: 10%
                      </Badge>
                      <Badge variant="outline">
                        <Clock className="w-3 h-3 mr-1" />
                        Consistency: 10%
                      </Badge>
                      <Badge variant="outline">
                        <GraduationCap className="w-3 h-3 mr-1" />
                        CGPA: 5%
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">
              {topCandidates.length > 0 ? 'Top Candidates' : 'No students found'}
            </h2>
            {selectedStudents.length > 0 && (
              <div className="flex gap-2">
                <Badge variant="secondary" className="px-3 py-1">
                  {selectedStudents.length} selected
                </Badge>
                <Button
                  onClick={handleCompare}
                  className="bg-gradient-secondary"
                  disabled={selectedStudents.length < 2}
                >
                  <GitCompare className="w-4 h-4 mr-2" />
                  Compare Students
                </Button>
                <Button
                  onClick={clearComparison}
                  variant="outline"
                >
                  Clear
                </Button>
              </div>
            )}
          </div>
          {topCandidates.length > 0 ? (
            <div className="grid gap-4">
              {topCandidates.map((candidate: any, index: number) => (
                <Card
                  key={candidate._id || index}
                  className={`shadow-card hover:shadow-glow transition-shadow ${selectedStudents.includes(candidate._id) ? 'ring-2 ring-secondary' : ''
                    }`}
                >
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex items-start gap-4">
                        <Checkbox
                          checked={selectedStudents.includes(candidate._id)}
                          onCheckedChange={() => toggleStudentSelection(candidate._id)}
                          className="mt-1"
                        />
                        <div className="w-16 h-16 bg-gradient-secondary rounded-full flex items-center justify-center text-2xl font-bold text-secondary-foreground flex-shrink-0">
                          {candidate.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'ST'}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-xl font-bold">{candidate.name || 'Unknown'}</h3>
                            </div>
                            <p className="text-muted-foreground">{candidate.college || 'No college info'}</p>
                          </div>
                          <div className="text-right">
                            <div className="flex flex-col items-end gap-1">
                              <p className="text-3xl font-bold bg-gradient-secondary bg-clip-text text-transparent">
                                {candidate.dynamicScore !== undefined ? candidate.dynamicScore : candidate.readinessScore || 0}%
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {selectedSkills.length > 0 || minProjects || minCGPA ? 'Match Score' : 'Readiness Score'}
                              </p>
                              {candidate.dynamicScore !== undefined && candidate.dynamicScore !== candidate.originalReadinessScore && (
                                <Badge variant="secondary" className="text-xs">
                                  Base: {candidate.originalReadinessScore || 0}%
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                          <div>
                            <p className="text-sm text-muted-foreground">Projects</p>
                            <p className="font-semibold">{candidate.projects?.length || 0}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">CGPA</p>
                            <p className="font-semibold">{candidate.cgpa ? candidate.cgpa.toFixed(1) : 'N/A'}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-sm text-muted-foreground mb-1">Skills</p>
                            <div className="flex flex-wrap gap-1">
                              {(() => {
                                // Get skills from both profile skills and project tags
                                const projectSkills = candidate.projects?.flatMap((p: any) => p.tags || []) || [];
                                const profileSkills = candidate.skills || [];
                                const allSkills = [...new Set([...profileSkills, ...projectSkills])];

                                return allSkills.length > 0 ? (
                                  allSkills.slice(0, 3).map((skill: string, i: number) => (
                                    <Badge key={i} variant="secondary">{skill}</Badge>
                                  ))
                                ) : (
                                  <span className="text-sm text-muted-foreground">No skills listed</span>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            className="flex-1 md:flex-none"
                            onClick={() => navigate(`/recruiter/student/${candidate._id}`)}
                          >
                            View Full Profile
                          </Button>
                          <Button
                            className="flex-1 md:flex-none bg-gradient-secondary"
                            onClick={() => openContactModal(candidate)}
                          >
                            <Mail className="w-4 h-4 mr-2" />
                            Contact
                          </Button>
                        </div>

                        {/* Score Breakdown Dialog */}
                        {(selectedSkills.length > 0 || minProjects || minCGPA || minScore) && candidate.dynamicScore !== undefined && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="w-full md:w-auto">
                                <Info className="w-4 h-4 mr-2" />
                                Score Breakdown
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Match Score Breakdown for {candidate.name}</DialogTitle>
                                <DialogDescription>
                                  How this candidate's score was calculated based on your filters
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 pr-2">
                                <div className="grid gap-2">
                                  <div className="flex justify-between items-center p-2.5 bg-muted/50 rounded-lg">
                                    <div className="flex-1">
                                      <p className="font-semibold text-sm">Base Readiness Score</p>
                                      <p className="text-xs text-muted-foreground">Original platform score (20% weight)</p>
                                    </div>
                                    <Badge variant="outline" className="text-base font-semibold">
                                      {Math.round((candidate.originalReadinessScore || 0) * 0.20)}
                                    </Badge>
                                  </div>

                                  {selectedSkills.length > 0 && (
                                    <div className="flex justify-between items-center p-2.5 bg-primary/5 rounded-lg border border-primary/20">
                                      <div className="flex-1">
                                        <p className="font-semibold text-sm">Skill Match</p>
                                        <p className="text-xs text-muted-foreground">
                                          Matches {(() => {
                                            const studentSkills = [
                                              ...(candidate.skills || []),
                                              ...(candidate.projects?.flatMap((p: any) => p.tags || []) || [])
                                            ].map((s: string) => s.toLowerCase());
                                            const matched = selectedSkills.filter(skill =>
                                              studentSkills.some(studentSkill =>
                                                studentSkill.includes(skill.toLowerCase())
                                              )
                                            );
                                            return matched.length;
                                          })()}/{selectedSkills.length} skills (30% weight)
                                        </p>
                                      </div>
                                      <Badge variant="default" className="text-base font-semibold">
                                        ~{Math.round((() => {
                                          const studentSkills = [
                                            ...(candidate.skills || []),
                                            ...(candidate.projects?.flatMap((p: any) => p.tags || []) || [])
                                          ].map((s: string) => s.toLowerCase());
                                          const matched = selectedSkills.filter(skill =>
                                            studentSkills.some(studentSkill =>
                                              studentSkill.includes(skill.toLowerCase())
                                            )
                                          );
                                          return (matched.length / selectedSkills.length) * 30;
                                        })())}
                                      </Badge>
                                    </div>
                                  )}

                                  <div className="flex justify-between items-center p-2.5 bg-muted/50 rounded-lg">
                                    <div className="flex-1">
                                      <p className="font-semibold text-sm">Project Relevance</p>
                                      <p className="text-xs text-muted-foreground">
                                        {candidate.projects?.length || 0} projects (25% weight)
                                      </p>
                                    </div>
                                    <Badge variant="outline" className="text-base font-semibold">
                                      ~{Math.min((candidate.projects?.length || 0) * 5, 25)}
                                    </Badge>
                                  </div>

                                  <div className="flex justify-between items-center p-2.5 bg-muted/50 rounded-lg">
                                    <div className="flex-1">
                                      <p className="font-semibold text-sm">Certifications</p>
                                      <p className="text-xs text-muted-foreground">
                                        {candidate.certifications?.length || 0} certifications (10% weight)
                                      </p>
                                    </div>
                                    <Badge variant="outline" className="text-base font-semibold">
                                      ~{Math.min((candidate.certifications?.length || 0) * 2, 10)}
                                    </Badge>
                                  </div>

                                  <div className="flex justify-between items-center p-2.5 bg-muted/50 rounded-lg">
                                    <div className="flex-1">
                                      <p className="font-semibold text-sm">Consistency</p>
                                      <p className="text-xs text-muted-foreground">
                                        {candidate.leetcodeStats?.streak || 0} day LeetCode streak (10% weight)
                                      </p>
                                    </div>
                                    <Badge variant="outline" className="text-base font-semibold">
                                      ~{Math.round(Math.min((candidate.leetcodeStats?.streak || 0) / 10 + (candidate.projects?.length || 0) / 2, 10))}
                                    </Badge>
                                  </div>

                                  <div className="flex justify-between items-center p-2.5 bg-muted/50 rounded-lg">
                                    <div className="flex-1">
                                      <p className="font-semibold text-sm">Academic Performance</p>
                                      <p className="text-xs text-muted-foreground">
                                        CGPA: {candidate.cgpa ? candidate.cgpa.toFixed(2) : 'N/A'} (5% weight)
                                      </p>
                                    </div>
                                    <Badge variant="outline" className="text-base font-semibold">
                                      ~{candidate.cgpa ? Math.round((candidate.cgpa / 10) * 5) : 0}
                                    </Badge>
                                  </div>
                                </div>

                                <div className="border-t pt-3">
                                  <div className="flex justify-between items-center p-3 bg-gradient-secondary/10 rounded-lg border-2 border-secondary">
                                    <p className="text-base font-bold">Total Match Score</p>
                                    <Badge className="text-xl px-3 py-1.5">
                                      {candidate.dynamicScore}%
                                    </Badge>
                                  </div>
                                </div>

                                <div className="text-xs text-muted-foreground space-y-1 p-2.5 bg-muted/30 rounded">
                                  <p className="font-semibold">Scoring Formula:</p>
                                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                                    <p>• Base Readiness: 20%</p>
                                    <p>• Skill Match: 30%</p>
                                    <p>• Projects: 25%</p>
                                    <p>• Certifications: 10%</p>
                                    <p>• Consistency: 10%</p>
                                    <p>• Academic: 5%</p>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="shadow-card">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No students match your criteria. Try adjusting your filters.</p>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Comparison Card */}
        <motion.div
          id="comparison-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Card className="shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Candidate Comparison</CardTitle>
                  <CardDescription>
                    {selectedStudents.length >= 2
                      ? `Comparing ${selectedStudents.length} selected students`
                      : 'Select 2-3 students from the list above to compare their growth patterns'}
                  </CardDescription>
                </div>
                {compareMode && (
                  <Button variant="outline" onClick={clearComparison} size="sm">
                    Reset to Default
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="comparison" className="w-full">
                <TabsList>
                  <TabsTrigger value="comparison">Growth Comparison</TabsTrigger>
                  <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
                </TabsList>

                <TabsContent value="comparison" className="space-y-6">
                  {comparedStudents.length >= 2 ? (
                    <div className={`grid ${comparedStudents.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6`}>
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-primary" />
                          {studentAName}
                        </h4>
                        <ResponsiveContainer width="100%" height={200}>
                          <LineChart data={studentAData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                            <YAxis stroke="hsl(var(--muted-foreground))" />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px'
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="score"
                              stroke="hsl(var(--primary))"
                              strokeWidth={3}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                        <div className="mt-3 p-3 bg-primary/10 rounded-lg">
                          <p className="text-sm">
                            <span className="font-semibold">Growth Pattern:</span> Current readiness score of {comparedStudents[0]?.readinessScore || 0}%
                          </p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-secondary" />
                          {studentBName}
                        </h4>
                        <ResponsiveContainer width="100%" height={200}>
                          <LineChart data={studentBData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                            <YAxis stroke="hsl(var(--muted-foreground))" />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px'
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="score"
                              stroke="hsl(var(--secondary))"
                              strokeWidth={3}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                        <div className="mt-3 p-3 bg-secondary/10 rounded-lg">
                          <p className="text-sm">
                            <span className="font-semibold">Growth Pattern:</span> Current readiness score of {comparedStudents[1]?.readinessScore || 0}%
                          </p>
                        </div>
                      </div>

                      {comparedStudents.length > 2 && (
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-accent" />
                            {studentCName}
                          </h4>
                          <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={studentCData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                              <YAxis stroke="hsl(var(--muted-foreground))" />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: 'hsl(var(--card))',
                                  border: '1px solid hsl(var(--border))',
                                  borderRadius: '8px'
                                }}
                              />
                              <Line
                                type="monotone"
                                dataKey="score"
                                stroke="hsl(var(--accent))"
                                strokeWidth={3}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                          <div className="mt-3 p-3 bg-accent/10 rounded-lg">
                            <p className="text-sm">
                              <span className="font-semibold">Growth Pattern:</span> Current readiness score of {comparedStudents[2]?.readinessScore || 0}%
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <GitCompare className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-lg font-semibold mb-2">No Students Selected for Comparison</p>
                      <p className="text-muted-foreground mb-4">Select at least 2 students using the checkboxes above to compare their growth patterns.</p>
                      <Button variant="outline" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        Go to Student List
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="analysis">
                  {comparedStudents.length >= 2 ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-secondary/10 rounded-lg border border-secondary/20">
                        <div className="flex items-start gap-3">
                          <Brain className="w-5 h-5 text-secondary mt-0.5" />
                          <div>
                            <h4 className="font-semibold mb-2">AI Comparison Analysis</h4>
                            <p className="text-sm text-muted-foreground mb-3">
                              Comparing {comparedStudents.map((s: any) => s.name).join(', ')} based on their growth patterns and metrics.
                            </p>
                            <div className={`grid ${comparedStudents.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4 mb-3`}>
                              {comparedStudents.map((student: any, index: number) => (
                                <div key={student._id} className="p-3 bg-card rounded-lg">
                                  <h5 className="font-semibold mb-2">{student.name}</h5>
                                  <ul className="space-y-1 text-sm">
                                    <li>• Readiness Score: {student?.readinessScore || 0}%</li>
                                    <li>• Projects: {student?.projects?.length || 0}</li>
                                    <li>• Certifications: {student?.certifications?.length || 0}</li>
                                  </ul>
                                </div>
                              ))}
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-primary" />
                                <span className="text-sm">
                                  {comparedStudents[0]?.readinessScore >= comparedStudents[1]?.readinessScore
                                    ? `${studentAName} has a higher readiness score`
                                    : `${studentBName} has a higher readiness score`}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-primary" />
                                <span className="text-sm">
                                  {(comparedStudents[0]?.projects?.length || 0) >= (comparedStudents[1]?.projects?.length || 0)
                                    ? `${studentAName} has more project experience`
                                    : `${studentBName} has more project experience`}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Brain className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-lg font-semibold mb-2">No Students Selected for Analysis</p>
                      <p className="text-muted-foreground mb-4">Select at least 2 students using the checkboxes to get AI-powered comparison insights.</p>
                      <Button variant="outline" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        Go to Student List
                      </Button>
                    </div>
                  )}
                </TabsContent>


              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* AI Recruiter Assistant */}
      <AIRecruiterAssistant
        students={students}
        selectedStudents={selectedStudents}
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
