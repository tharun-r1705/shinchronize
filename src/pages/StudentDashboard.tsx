import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, Award, Upload, FileText, Trophy, 
  Target, Zap, Star, BookOpen, Code, Brain, LogOut,
  Link2, Edit, Trash2, CheckCircle2, Calendar
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useEffect, useState } from "react";
import { studentApi } from "@/lib/api";
import MockInterviewChatbot from "@/components/MockInterviewChatbot";
import { useToast } from "@/hooks/use-toast";

interface MentorSuggestions {
  overview: string;
  strengths: Array<{ title: string; detail: string }>;
  opportunities: Array<{
    title: string;
    detail: string;
    impact?: string;
    actions?: string[];
  }>;
  actionPlan: Array<{
    title: string;
    timeframe?: string;
    steps?: string[];
    metrics?: string[];
    resources?: string[];
  }>;
  quickWins?: string[];
  mindset?: string;
  generatedAt?: string;
  model?: string;
  [key: string]: unknown;
}

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [student, setStudent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Project dialog state
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectGithub, setProjectGithub] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectDomain, setProjectDomain] = useState("");
  const [projectTags, setProjectTags] = useState("");
  
  // Certificate dialog state
  const [certDialogOpen, setCertDialogOpen] = useState(false);
  const [certName, setCertName] = useState("");
  const [certProvider, setCertProvider] = useState("");
  const [certDomain, setCertDomain] = useState("");
  const [certId, setCertId] = useState("");
  const [certDate, setCertDate] = useState("");
  
  // Event dialog state
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [eventName, setEventName] = useState("");
  const [eventDomain, setEventDomain] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventLocation, setEventLocation] = useState("");

  // Edit mode state
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingCertId, setEditingCertId] = useState<string | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  // Skill Radar dialog state
  const [skillRadarDialogOpen, setSkillRadarDialogOpen] = useState(false);
  const [skillName, setSkillName] = useState("");
  const [skillScore, setSkillScore] = useState(50);
  const [editingSkillName, setEditingSkillName] = useState<string | null>(null);

  const [mentorSuggestions, setMentorSuggestions] = useState<MentorSuggestions | null>(null);
  const [mentorStatus, setMentorStatus] = useState<"idle" | "loading" | "error">("loading");
  const [mentorError, setMentorError] = useState<string | null>(null);

  const domains = [
    "Web Development",
    "Mobile Development",
    "Data Science",
    "Machine Learning",
    "Artificial Intelligence",
    "Cybersecurity",
    "Cloud Computing",
    "DevOps",
    "Blockchain",
    "Game Development",
    "IoT",
    "UI/UX Design",
    "Database Management",
    "Software Testing",
    "Other"
  ];

    const formatTimestamp = (value?: string | null) => {
      if (!value) return null;
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) {
        return value;
      }
      return parsed.toLocaleString();
    };

    const fetchMentorSuggestions = async (authToken: string, options: { silent?: boolean } = {}) => {
      const { silent = false } = options;
      if (!authToken) {
        setMentorStatus("error");
        setMentorError("Authentication token missing");
        return;
      }

      setMentorStatus("loading");
      setMentorError(null);

      try {
        const response = await studentApi.getMentorSuggestions(authToken);
        const suggestions = (response as { suggestions?: MentorSuggestions })?.suggestions;

        setMentorSuggestions(suggestions ?? null);
        setMentorStatus("idle");
      } catch (error: any) {
        const message = error?.message || "Failed to fetch mentor suggestions";
        setMentorSuggestions(null);
        setMentorStatus("error");
        setMentorError(message);

        if (!silent) {
          toast({
            title: "AI mentor unavailable",
            description: message,
            variant: "destructive",
          });
        }
      }
    };

    const handleMentorRefresh = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: "Session expired",
          description: "Please sign in again to regenerate mentor suggestions",
          variant: "destructive",
        });
        navigate('/student/login');
        return;
      }

      await fetchMentorSuggestions(token);
    };

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast({
            title: "Authentication required",
            description: "Please log in to view your dashboard",
            variant: "destructive",
          });
          navigate('/student/login');
          return;
        }

        const data = await studentApi.getProfile(token);
        setStudent(data);
        await fetchMentorSuggestions(token, { silent: true });
      } catch (error: any) {
        toast({
          title: "Error loading profile",
          description: error.message || "Failed to fetch student data",
          variant: "destructive",
        });
        if (error.message.includes('401') || error.message.includes('token')) {
          navigate('/student/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentData();
  }, [navigate, toast]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    localStorage.removeItem('studentData');
    toast({
      title: "Logged out successfully",
    });
    navigate('/');
  };

  const handleProjectSubmit = async () => {
    if (!projectName || !projectDomain) {
      toast({
        title: "Missing fields",
        description: "Please provide at least a project name and domain",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const tagsArray = projectTags ? projectTags.split(',').map(tag => tag.trim()).filter(Boolean) : [projectDomain];

      if (editingProjectId) {
        // Update existing project
        await studentApi.updateProject(editingProjectId, {
          title: projectName,
          githubLink: projectGithub,
          description: projectDescription,
          tags: tagsArray,
        }, token);

        toast({
          title: "Project updated successfully",
        });
      } else {
        // Add new project
        await studentApi.addProject({
          title: projectName,
          githubLink: projectGithub,
          description: projectDescription,
          tags: tagsArray,
        }, token);

        toast({
          title: "Project added successfully",
          description: "Your project is pending admin verification",
        });
      }

      // Reset form and close dialog
      setProjectName("");
      setProjectGithub("");
      setProjectDescription("");
      setProjectDomain("");
      setProjectTags("");
      setEditingProjectId(null);
      setProjectDialogOpen(false);

      // Refresh student data
      const updatedData = await studentApi.getProfile(token);
      setStudent(updatedData);
    } catch (error: any) {
      toast({
        title: editingProjectId ? "Error updating project" : "Error adding project",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleCertificateSubmit = async () => {
    if (!certName || !certDomain) {
      toast({
        title: "Missing fields",
        description: "Please provide certificate name and domain",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      if (editingCertId) {
        // Update existing certification
        await studentApi.updateCertification(editingCertId, {
          name: certName,
          provider: certProvider,
          certificateId: certId,
          issuedDate: certDate || new Date().toISOString(),
          fileLink: "",
        }, token);

        toast({
          title: "Certificate updated successfully",
        });
      } else {
        // Add new certification
        await studentApi.addCertification({
          name: certName,
          provider: certProvider,
          certificateId: certId,
          issuedDate: certDate || new Date().toISOString(),
          fileLink: "",
        }, token);

        toast({
          title: "Certificate added successfully",
          description: "Your certificate is pending admin verification",
        });
      }

      // Reset form and close dialog
      setCertName("");
      setCertProvider("");
      setCertDomain("");
      setCertId("");
      setCertDate("");
      setEditingCertId(null);
      setCertDialogOpen(false);

      // Refresh student data
      const updatedData = await studentApi.getProfile(token);
      setStudent(updatedData);
    } catch (error: any) {
      toast({
        title: editingCertId ? "Error updating certificate" : "Error adding certificate",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleEventSubmit = async () => {
    if (!eventName || !eventDomain) {
      toast({
        title: "Missing fields",
        description: "Please provide event name and domain",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      if (editingEventId) {
        // Update existing event
        await studentApi.updateEvent(editingEventId, {
          name: eventName,
          description: eventDescription,
          date: eventDate || new Date().toISOString(),
          location: eventLocation,
          certificateLink: "",
          outcome: `Participated in ${eventDomain} event`,
        }, token);

        toast({
          title: "Event updated successfully",
        });
      } else {
        // Add new event
        await studentApi.addEvent({
          name: eventName,
          description: eventDescription,
          date: eventDate || new Date().toISOString(),
          location: eventLocation,
          certificateLink: "",
          outcome: `Participated in ${eventDomain} event`,
        }, token);

        toast({
          title: "Event added successfully",
          description: "Your event participation is pending admin verification",
        });
      }

      // Reset form and close dialog
      setEventName("");
      setEventDomain("");
      setEventDescription("");
      setEventDate("");
      setEventLocation("");
      setEditingEventId(null);
      setEventDialogOpen(false);

      // Refresh student data
      const updatedData = await studentApi.getProfile(token);
      setStudent(updatedData);
    } catch (error: any) {
      toast({
        title: editingEventId ? "Error updating event" : "Error adding event",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    }
  };

  // Edit handlers - populate form with existing data
  const handleEditProject = (project: any) => {
    setEditingProjectId(project._id);
    setProjectName(project.title || "");
    setProjectGithub(project.githubLink || "");
    setProjectDescription(project.description || "");
    setProjectDomain(project.tags?.[0] || "");
    setProjectTags(project.tags?.join(", ") || "");
    setProjectDialogOpen(true);
  };

  const handleEditCertification = (cert: any) => {
    setEditingCertId(cert._id);
    setCertName(cert.name || "");
    setCertProvider(cert.provider || "");
    setCertDomain(cert.domain || "");
    setCertId(cert.certificateId || "");
    setCertDate(cert.issuedDate ? new Date(cert.issuedDate).toISOString().split('T')[0] : "");
    setCertDialogOpen(true);
  };

  const handleEditEvent = (event: any) => {
    setEditingEventId(event._id);
    setEventName(event.name || "");
    setEventDomain(event.domain || "");
    setEventDescription(event.description || "");
    setEventDate(event.date ? new Date(event.date).toISOString().split('T')[0] : "");
    setEventLocation(event.location || "");
    setEventDialogOpen(true);
  };

  // Delete handlers
  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await studentApi.deleteProject(projectId, token);

      toast({
        title: "Project deleted successfully",
      });

      // Refresh student data
      const updatedData = await studentApi.getProfile(token);
      setStudent(updatedData);
    } catch (error: any) {
      toast({
        title: "Error deleting project",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCertification = async (certId: string) => {
    if (!confirm("Are you sure you want to delete this certification?")) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await studentApi.deleteCertification(certId, token);

      toast({
        title: "Certification deleted successfully",
      });

      // Refresh student data
      const updatedData = await studentApi.getProfile(token);
      setStudent(updatedData);
    } catch (error: any) {
      toast({
        title: "Error deleting certification",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await studentApi.deleteEvent(eventId, token);

      toast({
        title: "Event deleted successfully",
      });

      // Refresh student data
      const updatedData = await studentApi.getProfile(token);
      setStudent(updatedData);
    } catch (error: any) {
      toast({
        title: "Error deleting event",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    }
  };

  // Skill Radar Management
  const handleSkillRadarSubmit = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast({ title: "Not authenticated", description: "Please login again", variant: "destructive" });
      navigate("/student/login");
      return;
    }

    const skillNameToUse = editingSkillName || skillName.trim();
    if (!skillNameToUse) {
      toast({ title: "Skill name is required", variant: "destructive" });
      return;
    }

    try {
      // Create updated skillRadar object
      const currentSkillRadar = student?.skillRadar || {};
      
      const updatedSkillRadar = {
        ...currentSkillRadar,
        [skillNameToUse]: skillScore,
      };

      const response = await studentApi.updateProfile({ skillRadar: updatedSkillRadar }, token);
      
      toast({ 
        title: editingSkillName ? "Skill updated successfully" : "Skill added successfully",
        variant: "default" 
      });

      // Refresh student data
      const updatedData = await studentApi.getProfile(token);
      setStudent(updatedData);

      // Reset form
      setSkillName("");
      setSkillScore(50);
      setEditingSkillName(null);
      setSkillRadarDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Failed to update skill",
        description: error?.response?.data?.message || "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleEditSkill = (skill: string, score: number) => {
    setEditingSkillName(skill);
    setSkillName(skill);
    setSkillScore(score);
    setSkillRadarDialogOpen(true);
  };

  const handleDeleteSkill = async (skillToDelete: string) => {
    if (!confirm(`Are you sure you want to delete "${skillToDelete}" from your skill radar?`)) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast({ title: "Not authenticated", description: "Please login again", variant: "destructive" });
      navigate("/student/login");
      return;
    }

    try {
      // Create updated skillRadar object without the deleted skill
      const currentSkillRadar = student?.skillRadar || {};
      const updatedSkillRadar = { ...currentSkillRadar };
      delete updatedSkillRadar[skillToDelete];

      await studentApi.updateProfile({ skillRadar: updatedSkillRadar }, token);
      
      toast({ title: "Skill deleted successfully", variant: "default" });

      // Refresh student data
      const updatedData = await studentApi.getProfile(token);
      setStudent(updatedData);
    } catch (error: any) {
      toast({
        title: "Failed to delete skill",
        description: error?.response?.data?.message || "Please try again",
        variant: "destructive",
      });
    }
  };

  // Transform coding logs for weekly activity chart
  const getWeeklyData = () => {
    if (!student?.codingLogs) return [];
    
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weekData = days.map(day => ({ day, activity: 0 }));
    
    // Get logs from the last 7 days
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    student.codingLogs.forEach((log: any) => {
      const logDate = new Date(log.date);
      if (logDate >= sevenDaysAgo) {
        const dayIndex = logDate.getDay();
        const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1; // Convert Sunday=0 to Sunday=6
        weekData[adjustedIndex].activity += log.minutesSpent || 0;
      }
    });
    
    return weekData;
  };

  // Transform skillRadar for chart
  const getSkillsData = () => {
    if (!student?.skillRadar) {
      return [];
    }
    const entries = Object.entries(student.skillRadar);

    if (entries.length === 0) {
      return [];
    }

    const skillsArray = entries.map(([skill, score]) => ({
      skill,
      score: Number(score)
    }));
    return skillsArray;
  };

  // Get top 3 achievements based on student data
  const getBadges = () => {
    const badges = [];
    const streakDays = student?.streakDays || 0;
    const projectCount = student?.projects?.length || 0;
    
    // Always show these 3 core achievements
    
    // 1. Streak Achievement (30-day target)
    if (streakDays >= 30) {
      badges.push({ 
        icon: Zap, 
        name: "30-Day Streak Achieved", 
        description: `${streakDays} days and counting!`,
        color: "text-yellow-500",
        bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
        earned: true
      });
    }
    
    // 2. Projects Achievement (from student data)
    if (projectCount > 0) {
      badges.push({ 
        icon: Code, 
        name: "Project Builder", 
        description: `${projectCount} project${projectCount > 1 ? 's' : ''} completed`,
        color: "text-blue-500",
        bgColor: "bg-blue-100 dark:bg-blue-900/30",
        earned: true
      });
    }
    
    // 3. Skills Achievement (from skill radar)
    const skillCount = student?.skillRadar ? Object.keys(student.skillRadar).length : 0;
    if (skillCount > 0) {
      badges.push({ 
        icon: Brain, 
        name: "Skill Developer", 
        description: `${skillCount} skill${skillCount > 1 ? 's' : ''} tracked`,
        color: "text-indigo-500",
        bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
        earned: true
      });
    }
    
    return badges.slice(0, 3); // Ensure only 3 badges max
  };

  // Get next 3 specific achievements to unlock
  const getNextAchievements = () => {
    const next = [];
    const streakDays = student?.streakDays || 0;
    const projectCount = student?.projects?.length || 0;
    const skillRadar = student?.skillRadar || {};
    
    // Get lowest skill from skill radar for improvement target
    const skills = Object.entries(skillRadar).map(([skill, score]) => ({ skill, score: Number(score) }));
    const lowestSkill = skills.length > 0 
      ? skills.reduce((min, curr) => curr.score < min.score ? curr : min, skills[0])
      : null;
    
    // 1. 30-Day Streak Goal
    if (streakDays < 30) {
      next.push({
        icon: Zap,
        name: "Achieve 30-Day Streak",
        description: "Maintain daily learning consistency",
        progress: Math.min(100, (streakDays / 30) * 100),
        remaining: 30 - streakDays,
        unit: "days"
      });
    }
    
    // 2. Project Completion Goal (always show, target is +2 from current)
    const projectTarget = Math.max(5, projectCount + 2);
    next.push({
      icon: Code,
      name: `Complete ${projectTarget} Projects`,
      description: "Build and showcase your work",
      progress: Math.min(100, (projectCount / projectTarget) * 100),
      remaining: Math.max(0, projectTarget - projectCount),
      unit: "projects"
    });
    
    // 3. Skill Improvement Goal (from skill radar)
    if (lowestSkill && lowestSkill.score < 75) {
      const targetScore = 75;
      next.push({
        icon: Brain,
        name: `Improve ${lowestSkill.skill}`,
        description: `Reach ${targetScore}% proficiency`,
        progress: Math.min(100, (lowestSkill.score / targetScore) * 100),
        remaining: Math.max(0, Math.ceil(targetScore - lowestSkill.score)),
        unit: "points"
      });
    } else if (skills.length === 0) {
      // If no skills tracked yet
      next.push({
        icon: Brain,
        name: "Track Your First Skill",
        description: "Start measuring your progress",
        progress: 0,
        remaining: 1,
        unit: "skill"
      });
    }
    
    return next.slice(0, 3); // Exactly 3 goals
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Failed to load student data</p>
          <Button onClick={() => navigate('/student/login')} className="mt-4">
            Back to Login
          </Button>
        </div>
      </div>
    );
  }

  const weeklyData = getWeeklyData();
  const skillsData = getSkillsData();
  const badges = getBadges();
  const nextAchievements = getNextAchievements();

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Top Navigation */}
      <header className="bg-card border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            EvolvEd
          </h1>
          <nav className="flex gap-4 items-center">
            <Button variant="ghost" onClick={() => navigate('/student/dashboard')}>Dashboard</Button>
            <Button variant="ghost" onClick={() => navigate('/student/profile')}>Profile</Button>
            <Button variant="ghost" onClick={() => navigate('/student/progress')}>Progress</Button>
            <Button variant="ghost" onClick={() => navigate('/student/mock-interview')}>Mock Interview</Button>
            <Button variant="ghost" onClick={() => navigate('/student/resume')}>Resume</Button>
            <Button variant="ghost" onClick={() => navigate('/leaderboard')}>Leaderboard</Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="mb-8 shadow-card">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center text-3xl font-bold text-primary-foreground">
                  {student.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'ST'}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-1">{student.name || 'Student'}</h2>
                  <p className="text-muted-foreground mb-3">
                    {student.branch || 'Computer Science'} {student.year && `• ${student.year} Year`} {student.college && `• ${student.college}`}
                  </p>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Base Readiness Score</p>
                      <div className="flex items-center gap-2">
                        <span className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                          {student.baseReadinessScore || 0}%
                        </span>
                        <TrendingUp className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                    <div className="h-12 w-px bg-border" />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Current Streak</p>
                      <span className="text-2xl font-bold text-primary">{student.streakDays || 0} days</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-8"
        >
          <MockInterviewChatbot variant="panel" displayMode="graph-only" />
          <div className="flex flex-wrap items-center gap-3 mt-4 text-sm text-muted-foreground">
            <span>
              Track your interview learning curve and share the graph with recruiters instantly.
            </span>
            <Button variant="link" className="px-0" onClick={() => navigate('/student/mock-interview')}>
              Open full workspace →
            </Button>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Learning Journal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Card className="shadow-card h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-primary" />
                  Learning Journal
                </CardTitle>
                <CardDescription>Upload your progress and achievements</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="projects" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="projects">Projects</TabsTrigger>
                    <TabsTrigger value="certs">Certs</TabsTrigger>
                    <TabsTrigger value="events">Events</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="projects" className="space-y-4">
                    <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
                      <DialogTrigger asChild>
                        <div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors">
                          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                          <h3 className="font-semibold mb-2">Upload Project</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Add GitHub link, description, and tags
                          </p>
                          <Button>Add Project</Button>
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>{editingProjectId ? "Edit Project" : "Add New Project"}</DialogTitle>
                          <DialogDescription>
                            Add your project details with GitHub link.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="project-name">Project Name *</Label>
                            <Input
                              id="project-name"
                              placeholder="e.g., E-commerce Website"
                              value={projectName}
                              onChange={(e) => setProjectName(e.target.value)}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="project-github">GitHub Link</Label>
                            <Input
                              id="project-github"
                              placeholder="https://github.com/username/repo"
                              value={projectGithub}
                              onChange={(e) => setProjectGithub(e.target.value)}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="project-domain">Domain/Category *</Label>
                            <Select value={projectDomain} onValueChange={setProjectDomain}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select domain" />
                              </SelectTrigger>
                              <SelectContent>
                                {domains.map((domain) => (
                                  <SelectItem key={domain} value={domain}>
                                    {domain}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="project-description">Description</Label>
                            <Textarea
                              id="project-description"
                              placeholder="Describe your project..."
                              rows={3}
                              value={projectDescription}
                              onChange={(e) => setProjectDescription(e.target.value)}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="project-tags">Technologies/Tags (comma-separated)</Label>
                            <Input
                              id="project-tags"
                              placeholder="e.g., React, Node.js, MongoDB"
                              value={projectTags}
                              onChange={(e) => setProjectTags(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                              Domain will be automatically added as a tag
                            </p>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setProjectDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleProjectSubmit}>
                            {editingProjectId ? "Update Project" : "Add Project"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    
                    <div className="space-y-2">
                      {student.projects && student.projects.length > 0 ? (
                        student.projects.slice(0, 3).map((project: any, index: number) => (
                          <div key={index} className="p-4 bg-muted rounded-lg">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold">{project.title}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {project.tags?.join(', ') || 'No tags'}
                                </p>
                                {project.githubLink && (
                                  <a 
                                    href={project.githubLink} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
                                  >
                                    <Link2 className="w-3 h-3" />
                                    View on GitHub
                                  </a>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditProject(project)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteProject(project._id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No projects yet. Add your first project!
                        </p>
                      )}
                    </div>
                  </TabsContent>

                  

                  <TabsContent value="certs">
                    <Dialog open={certDialogOpen} onOpenChange={setCertDialogOpen}>
                      <DialogTrigger asChild>
                        <div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors">
                          <Award className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                          <h3 className="font-semibold mb-2">Add Certification</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Upload certificate for verification
                          </p>
                          <Button>Upload Certificate</Button>
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>{editingCertId ? "Edit Certificate" : "Upload Certificate"}</DialogTitle>
                          <DialogDescription>
                            Add your certificate details and credentials.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="cert-name">Certificate Name *</Label>
                            <Input
                              id="cert-name"
                              placeholder="e.g., AWS Certified Developer"
                              value={certName}
                              onChange={(e) => setCertName(e.target.value)}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="cert-provider">Provider/Issuing Organization</Label>
                            <Input
                              id="cert-provider"
                              placeholder="e.g., Amazon Web Services, Coursera"
                              value={certProvider}
                              onChange={(e) => setCertProvider(e.target.value)}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="cert-domain">Domain/Category *</Label>
                            <Select value={certDomain} onValueChange={setCertDomain}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select domain" />
                              </SelectTrigger>
                              <SelectContent>
                                {domains.map((domain) => (
                                  <SelectItem key={domain} value={domain}>
                                    {domain}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="cert-id">Certificate ID/Credential ID</Label>
                            <Input
                              id="cert-id"
                              placeholder="e.g., ABC123XYZ"
                              value={certId}
                              onChange={(e) => setCertId(e.target.value)}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="cert-date">Issue Date</Label>
                            <Input
                              id="cert-date"
                              type="date"
                              value={certDate}
                              onChange={(e) => setCertDate(e.target.value)}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setCertDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleCertificateSubmit}>
                            {editingCertId ? "Update Certificate" : "Upload Certificate"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    
                    <div className="space-y-2 mt-4">
                      {student.certifications && student.certifications.length > 0 ? (
                        student.certifications.slice(0, 3).map((cert: any, index: number) => (
                          <div key={index} className="p-4 bg-muted rounded-lg">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold">{cert.name}</h4>
                                {cert.provider && (
                                  <p className="text-sm text-muted-foreground">
                                    {cert.provider}
                                  </p>
                                )}
                                {cert.issuedDate && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Issued: {new Date(cert.issuedDate).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditCertification(cert)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteCertification(cert._id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No certifications yet. Add your first certification!
                        </p>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="events">
                    <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
                      <DialogTrigger asChild>
                        <div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors">
                          <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                          <h3 className="font-semibold mb-2">Add Event Participation</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Hackathons, competitions, workshops
                          </p>
                          <Button>Add Event</Button>
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>{editingEventId ? "Edit Event" : "Add Event Participation"}</DialogTitle>
                          <DialogDescription>
                            Record your participation in hackathons, competitions, or workshops.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="event-name">Event Name *</Label>
                            <Input
                              id="event-name"
                              placeholder="e.g., Smart India Hackathon 2024"
                              value={eventName}
                              onChange={(e) => setEventName(e.target.value)}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="event-domain">Domain/Category *</Label>
                            <Select value={eventDomain} onValueChange={setEventDomain}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select domain" />
                              </SelectTrigger>
                              <SelectContent>
                                {domains.map((domain) => (
                                  <SelectItem key={domain} value={domain}>
                                    {domain}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="event-description">Description/Achievement</Label>
                            <Textarea
                              id="event-description"
                              placeholder="Describe your participation, role, or achievement..."
                              rows={3}
                              value={eventDescription}
                              onChange={(e) => setEventDescription(e.target.value)}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="event-date">Event Date</Label>
                            <Input
                              id="event-date"
                              type="date"
                              value={eventDate}
                              onChange={(e) => setEventDate(e.target.value)}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="event-location">Location/Platform</Label>
                            <Input
                              id="event-location"
                              placeholder="e.g., IIT Delhi, Online - Devfolio"
                              value={eventLocation}
                              onChange={(e) => setEventLocation(e.target.value)}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setEventDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleEventSubmit}>
                            {editingEventId ? "Update Event" : "Add Event"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    
                    <div className="space-y-2 mt-4">
                      {student.events && student.events.length > 0 ? (
                        student.events.slice(0, 3).map((event: any, index: number) => (
                          <div key={index} className="p-4 bg-muted rounded-lg">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold">{event.name}</h4>
                                {event.location && (
                                  <p className="text-sm text-muted-foreground">
                                    📍 {event.location}
                                  </p>
                                )}
                                {event.date && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {new Date(event.date).toLocaleDateString()}
                                  </p>
                                )}
                                {event.description && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {event.description}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditEvent(event)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteEvent(event._id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No events yet. Add your first event!
                        </p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>

          {/* Gamification Badges & Achievements */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="shadow-card h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  Achievements & Goals
                </CardTitle>
                <CardDescription>
                  Your top 3 milestones: Streak, Projects & Skills
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Earned Badges */}
                {badges.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-primary" />
                        Unlocked ({badges.length}/3)
                      </h4>
                      <Badge variant="secondary" className="text-xs">
                        {badges.length === 3 ? "All Complete!" : `${3 - badges.length} to go`}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {badges.map((badge, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className={`flex items-center gap-3 p-3 rounded-lg border ${badge.bgColor} hover:shadow-md transition-all cursor-pointer group`}
                        >
                          <div className={`p-2 rounded-full bg-white dark:bg-gray-800 shadow-sm group-hover:scale-110 transition-transform`}>
                            <badge.icon className={`w-6 h-6 ${badge.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm">{badge.name}</p>
                            <p className="text-xs text-muted-foreground">{badge.description}</p>
                          </div>
                          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Next Achievements to Unlock */}
                {nextAchievements.length > 0 && (
                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <Target className="w-4 h-4 text-primary" />
                        Your Goals ({nextAchievements.length}/3)
                      </h4>
                    </div>
                    <div className="space-y-3">
                      {nextAchievements.map((achievement, index) => (
                        <div key={index} className="space-y-2 p-3 bg-muted/50 rounded-lg border border-dashed border-muted-foreground/30">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 flex-1 min-w-0">
                              <achievement.icon className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm">{achievement.name}</p>
                                <p className="text-xs text-muted-foreground">{achievement.description}</p>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs shrink-0">
                              {achievement.remaining} {achievement.unit}
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Progress</span>
                              <span className="font-medium">{Math.round(achievement.progress)}%</span>
                            </div>
                            <Progress value={achievement.progress} className="h-2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {badges.length === 0 && (
                  <div className="text-center py-8 px-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                      <Award className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Start Your Journey!</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      Work towards these 3 key achievements
                    </p>
                    <div className="space-y-3 text-left max-w-xs mx-auto">
                      <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                        <Zap className="w-5 h-5 text-yellow-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">30-Day Streak</p>
                          <p className="text-xs text-muted-foreground">Build consistent learning habits</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                        <Code className="w-5 h-5 text-blue-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">Complete Projects</p>
                          <p className="text-xs text-muted-foreground">Upload and verify your work</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                        <Brain className="w-5 h-5 text-indigo-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">Track Skills</p>
                          <p className="text-xs text-muted-foreground">Monitor your skill radar progress</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="shadow-card h-full">
              <CardHeader>
                <CardTitle>Weekly Activity</CardTitle>
                <CardDescription>Your learning consistency this week</CardDescription>
              </CardHeader>
              <CardContent>
                {weeklyData && weeklyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
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
                        dataKey="activity" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={3}
                        dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-8">No activity yet</div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="shadow-card h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-primary" />
                      Skill Radar
                    </CardTitle>
                    <CardDescription>Track your technical proficiency</CardDescription>
                  </div>
                  <Dialog open={skillRadarDialogOpen} onOpenChange={setSkillRadarDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => {
                          setSkillName("");
                          setSkillScore(50);
                          setEditingSkillName(null);
                        }}
                        size="sm"
                        className="gap-2"
                      >
                        <Code className="w-4 h-4" />
                        Add Skill
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          {editingSkillName ? (
                            <>
                              <Edit className="w-5 h-5 text-primary" />
                              Edit Skill
                            </>
                          ) : (
                            <>
                              <Code className="w-5 h-5 text-primary" />
                              Add New Skill
                            </>
                          )}
                        </DialogTitle>
                        <DialogDescription>
                          {editingSkillName 
                            ? "Update your proficiency level for this skill"
                            : "Add a technical skill and rate your proficiency (0-100)"
                          }
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="skillName" className="text-sm font-medium">Skill Name</Label>
                          <Input
                            id="skillName"
                            placeholder="e.g., React, Python, DSA, System Design"
                            value={editingSkillName || skillName}
                            onChange={(e) => setSkillName(e.target.value)}
                            disabled={!!editingSkillName}
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="skillScore" className="text-sm font-medium">
                              Proficiency Level
                            </Label>
                            <Badge 
                              variant={
                                skillScore >= 80 ? "default" :
                                skillScore >= 60 ? "secondary" :
                                "outline"
                              }
                              className="px-3 py-1"
                            >
                              {skillScore >= 80 ? "🏆 Expert" :
                               skillScore >= 60 ? "💪 Intermediate" :
                               skillScore >= 40 ? "🌱 Beginner" :
                               "📚 Learning"}
                            </Badge>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Current Level</span>
                              <span className="font-bold text-lg text-primary">{skillScore}%</span>
                            </div>
                            <input
                              id="skillScore"
                              type="range"
                              min="0"
                              max="100"
                              step="5"
                              value={skillScore}
                              onChange={(e) => setSkillScore(Number(e.target.value))}
                              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                            <Progress value={skillScore} className="h-2" />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Beginner</span>
                              <span>Intermediate</span>
                              <span>Expert</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <DialogFooter className="gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSkillRadarDialogOpen(false);
                            setSkillName("");
                            setSkillScore(50);
                            setEditingSkillName(null);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleSkillRadarSubmit} className="gap-2">
                          {editingSkillName ? (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              Update Skill
                            </>
                          ) : (
                            <>
                              <Code className="w-4 h-4" />
                              Add Skill
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {skillsData && skillsData.length > 0 ? (
                  <div className="space-y-6">
                    {/* Radar Chart */}
                    <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg p-6">
                      <ResponsiveContainer width="100%" height={300}>
                        <RadarChart data={skillsData}>
                          <PolarGrid 
                            stroke="hsl(var(--border))" 
                            strokeDasharray="3 3"
                          />
                          <PolarAngleAxis 
                            dataKey="skill" 
                            tick={{ 
                              fill: 'hsl(var(--foreground))', 
                              fontSize: 13,
                              fontWeight: 500
                            }}
                          />
                          <PolarRadiusAxis 
                            angle={90} 
                            domain={[0, 100]} 
                            stroke="hsl(var(--muted-foreground))"
                            tick={{ fontSize: 11 }}
                          />
                          <Radar 
                            name="Skills" 
                            dataKey="score" 
                            stroke="hsl(var(--primary))" 
                            fill="hsl(var(--primary))" 
                            fillOpacity={0.4}
                            strokeWidth={2.5}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                            }}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Skill List */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                          Your Skills ({skillsData.length})
                        </h4>
                        <div className="text-xs text-muted-foreground">
                          Avg: {Math.round(skillsData.reduce((sum: number, s: any) => sum + s.score, 0) / skillsData.length)}%
                        </div>
                      </div>
                      <div className="grid gap-3">
                        {skillsData.map((skillData: any) => (
                          <div
                            key={skillData.skill}
                            className="group relative flex items-center gap-4 p-4 bg-card border border-border rounded-lg hover:border-primary/50 hover:shadow-md transition-all duration-200"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary font-bold text-sm shrink-0">
                                  {skillData.score}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-semibold text-base truncate">{skillData.skill}</span>
                                    <Badge 
                                      variant={
                                        skillData.score >= 80 ? "default" :
                                        skillData.score >= 60 ? "secondary" :
                                        "outline"
                                      }
                                      className="shrink-0 text-xs"
                                    >
                                      {skillData.score >= 80 ? "Expert" :
                                       skillData.score >= 60 ? "Intermediate" :
                                       skillData.score >= 40 ? "Beginner" :
                                       "Learning"}
                                    </Badge>
                                  </div>
                                  <Progress value={skillData.score} className="h-2 mt-2" />
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                                onClick={() => handleEditSkill(skillData.skill, skillData.score)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => handleDeleteSkill(skillData.skill)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 px-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                      <Brain className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No skills added yet</h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                      Start tracking your technical proficiency by adding your first skill
                    </p>
                    <Button 
                      onClick={() => setSkillRadarDialogOpen(true)}
                      className="gap-2"
                    >
                      <Code className="w-4 h-4" />
                      Add Your First Skill
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* AI Mentor */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6"
        >
          <Card className="shadow-card border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-primary" />
                  AI Mentor Suggestions
                </CardTitle>
                {mentorSuggestions?.generatedAt && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Updated {formatTimestamp(mentorSuggestions.generatedAt)}
                    {mentorSuggestions.model ? ` • ${mentorSuggestions.model}` : ""}
                  </p>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {mentorStatus === "loading" && (
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              )}
              {mentorStatus === "error" && (
                <div className="p-4 border border-destructive/30 rounded-lg bg-destructive/5">
                  <p className="text-sm text-destructive font-medium mb-2">
                    {mentorError || "Unable to generate mentor suggestions."}
                  </p>
                  <Button variant="destructive" size="sm" onClick={async () => {
                    const token = localStorage.getItem('token');
                    if (!token) {
                      toast({ title: 'Not authenticated', description: 'Please login', variant: 'destructive' });
                      navigate('/student/login');
                      return;
                    }
                    await fetchMentorSuggestions(token);
                  }}>
                    Retry
                  </Button>
                </div>
              )}
              {mentorStatus === "idle" && mentorSuggestions && (
                <div className="space-y-6">
                  {mentorSuggestions.overview && (
                    <p className="text-sm leading-relaxed text-muted-foreground bg-card border border-primary/10 rounded-lg p-4">
                      {mentorSuggestions.overview}
                    </p>
                  )}

                  {mentorSuggestions.strengths?.length > 0 && (
                    <section className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        <Star className="w-4 h-4 text-primary" />
                        Strengths to celebrate
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        {mentorSuggestions.strengths.map((item, index) => (
                          <div
                            key={`${item.title}-${index}`}
                            className="p-4 rounded-lg border border-primary/10 bg-card"
                          >
                            <p className="font-medium mb-2 text-sm text-foreground">{item.title}</p>
                            <p className="text-sm text-muted-foreground">{item.detail}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {mentorSuggestions.opportunities?.length > 0 && (
                    <section className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        <Target className="w-4 h-4 text-primary" />
                        Prioritised growth areas
                      </div>
                      <div className="space-y-3">
                        {mentorSuggestions.opportunities.map((item, index) => (
                          <div
                            key={`${item.title}-${index}`}
                            className="p-4 border border-border/60 rounded-lg bg-card/80"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="font-semibold text-sm text-foreground flex items-center gap-2">
                                <Zap className="w-4 h-4 text-primary" />
                                {item.title}
                              </p>
                              {item.impact && (
                                <Badge variant="outline" className="text-xs uppercase tracking-wide">
                                  {item.impact}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">{item.detail}</p>
                            {item.actions && item.actions.length > 0 && (
                              <ul className="mt-3 text-sm text-muted-foreground space-y-1 list-disc pl-5">
                                {item.actions.map((action, idx) => (
                                  <li key={`${item.title}-action-${idx}`}>{action}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {mentorSuggestions.actionPlan?.length > 0 && (
                    <section className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        Action plan
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        {mentorSuggestions.actionPlan.map((item, index) => (
                          <div
                            key={`${item.title}-${index}`}
                            className="p-4 rounded-lg border border-primary/15 bg-card"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-semibold text-sm text-foreground">{item.title}</p>
                              {item.timeframe && (
                                <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                                  {item.timeframe}
                                </Badge>
                              )}
                            </div>
                            {item.steps && item.steps.length > 0 && (
                              <ul className="mt-3 text-sm text-muted-foreground space-y-1 list-disc pl-5">
                                {item.steps.map((step, idx) => (
                                  <li key={`${item.title}-step-${idx}`}>{step}</li>
                                ))}
                              </ul>
                            )}
                            {item.metrics && item.metrics.length > 0 && (
                              <p className="mt-3 text-xs text-muted-foreground">
                                <span className="font-semibold text-foreground">Measure:</span> {item.metrics.join(' • ')}
                              </p>
                            )}
                            {item.resources && item.resources.length > 0 && (
                              <p className="mt-2 text-xs text-muted-foreground">
                                <span className="font-semibold text-foreground">Resources:</span> {item.resources.join(' • ')}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {mentorSuggestions.quickWins && mentorSuggestions.quickWins.length > 0 && (
                    <section className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        <BookOpen className="w-4 h-4 text-primary" />
                        Quick wins
                      </div>
                      <ul className="grid gap-2 md:grid-cols-2">
                        {mentorSuggestions.quickWins.map((win, index) => (
                          <li
                            key={`quickwin-${index}`}
                            className="flex items-start gap-2 p-3 rounded-lg border border-primary/10 bg-card"
                          >
                            <Award className="w-4 h-4 text-primary mt-0.5" />
                            <span className="text-sm text-muted-foreground">{win}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {mentorSuggestions.mindset && (
                    <div className="p-4 rounded-lg border border-primary/20 bg-primary/10 text-sm text-foreground">
                      <p className="font-medium mb-1 text-black">Keep the momentum</p>
                      <p className="text-black">{mentorSuggestions.mindset}</p>
                    </div>
                  )}
                </div>
              )}

              {mentorStatus === "idle" && !mentorSuggestions && (
                <div className="p-4 border border-dashed rounded-lg text-sm text-muted-foreground bg-card/70">
                  AI mentor suggestions will appear once you add more skills, projects, and activity. Update your profile and regenerate to see personalised advice.
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default StudentDashboard;
