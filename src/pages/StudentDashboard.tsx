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
  Link2, Edit, Trash2, CheckCircle2, Calendar, ArrowRight, Sparkles,
  ArrowUpRight, BarChart3, Lightbulb, RefreshCw, HelpCircle
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useEffect, useState } from "react";
import { studentApi, marketApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { StudentNavbar } from "@/components/StudentNavbar";

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

  // State for suggestions is removed as it's now a separate page
  const [mentorSuggestions, setMentorSuggestions] = useState<any>(null);
  const [marketTrends, setMarketTrends] = useState<any>(null);
  const [marketROI, setMarketROI] = useState<any[]>([]);

  // Domain Insight state
  const [domainInsight, setDomainInsight] = useState<any>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

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

  const readinessMax: Record<string, number> = {
    projects: 20,
    codingConsistency: 15,
    githubActivity: 15,
    certifications: 15,
    events: 10,
    skillDiversity: 10,
    skillRadar: 10,
    skills: 10,
    interviewPrep: 10,
    streakBonus: 5,
  };

  const readinessLabels: Record<string, string> = {
    projects: 'Projects',
    codingConsistency: 'Coding Consistency',
    githubActivity: 'GitHub Activity',
    certifications: 'Certifications',
    events: 'Events',
    skillDiversity: 'Platform Diversity',
    skillRadar: 'Skill Proficiency',
    skills: 'Profile Skills',
    interviewPrep: 'Interview Preparation',
    streakBonus: 'Consistency Streak',
  };

  const getReadinessRows = () => {
    const breakdown = (student?.readinessBreakdown || {}) as Record<string, number>;
    const keys = [
      'projects',
      'codingConsistency',
      'githubActivity',
      'certifications',
      'events',
      'skillDiversity',
      'skillRadar',
      'skills',
      'interviewPrep',
      'streakBonus',
    ];

    return keys.map((key) => {
      const value = typeof breakdown[key] === 'number' ? breakdown[key] : 0;
      const max = readinessMax[key] || 0;
      const pct = max ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
      return {
        key,
        label: readinessLabels[key] || key,
        value,
        max,
        pct,
      };
    });
  };

  // Mentor fetch functions removed from dashboard

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
        
        // Check if profile is complete
        if (!data.isProfileComplete) {
          toast({
            title: "Complete your profile",
            description: "Please complete all required fields in your profile to access the dashboard",
            variant: "default",
          });
          navigate('/student/profile');
          return;
        }
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

  useEffect(() => {
    if (student) {
      localStorage.setItem('studentData', JSON.stringify(student));
    }
  }, [student]);

  useEffect(() => {
    const fetchMarketGlimpse = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const [trends, roi] = await Promise.all([
          marketApi.getTrends(),
          marketApi.getROI(token)
        ]);

        setMarketTrends(trends);
        setMarketROI(roi.slice(0, 2));
      } catch (error) {
        console.error("Error fetching market glimpse:", error);
      }
    };

    fetchMarketGlimpse();
  }, []);

  // Fetch domain insights on mount
  useEffect(() => {
    const fetchDomainInsights = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      setInsightLoading(true);
      try {
        const insight = await studentApi.getDomainInsights(token);
        setDomainInsight(insight);
      } catch (error) {
        console.error("Error fetching domain insights:", error);
      } finally {
        setInsightLoading(false);
      }
    };

    fetchDomainInsights();
  }, []);

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
      const currentSkills = student?.skills || [];

      const updatedSkillRadar = {
        ...currentSkillRadar,
        [skillNameToUse]: skillScore,
      };

      const response = await studentApi.updateProfile({
        skillRadar: updatedSkillRadar,
        skills: currentSkills.includes(skillNameToUse) ? currentSkills : [...currentSkills, skillNameToUse]
      }, token);

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

      // Remove from student.skills as well to keep in sync
      const currentSkills = student?.skills || [];
      const updatedSkills = currentSkills.filter((s: string) => s !== skillToDelete);

      await studentApi.updateProfile({
        skillRadar: updatedSkillRadar,
        skills: updatedSkills
      }, token);

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

    if (student?.email?.toLowerCase() === 'tharunr.23aid@kongu.edu') {
      return [
        { day: 'Mon', activity: 45 },
        { day: 'Tue', activity: 60 },
        { day: 'Wed', activity: 35 },
        { day: 'Thu', activity: 80 },
        { day: 'Fri', activity: 55 },
        { day: 'Sat', activity: 90 },
        { day: 'Sun', activity: 40 }
      ];
    }

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
  // Transform skillRadar for chart
  const getSkillsData = () => {
    const profileSkills = student?.skills || [];
    const radarMap = student?.skillRadar || {};

    if (profileSkills.length === 0) {
      return [];
    }

    const skillsArray = profileSkills.map((skill: string) => ({
      skill,
      score: Number(radarMap[skill] || 0)
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

  // Get top 3 active goals (AI mentor + student-defined)
  const getActiveGoals = () => {
    const goals = (student?.goals || []).filter((goal: any) =>
      goal.status !== 'completed' && goal.status !== 'abandoned'
    );

    const iconMap: Record<string, any> = {
      project: Code,
      coding: Zap,
      certification: Award,
      skill: Brain,
      placement: Target,
      other: Star
    };

    const mapped = goals.map((goal: any) => {
      const targetValue = typeof goal.targetValue === 'number' && goal.targetValue > 0 ? goal.targetValue : null;
      const currentValue = typeof goal.currentValue === 'number' ? goal.currentValue : null;
      const progress = typeof goal.progress === 'number' ? goal.progress : 0;
      const unit = goal.unit || (goal.category === 'project' ? 'projects' : goal.category === 'coding' ? 'problems' : 'steps');
      const remaining = targetValue && currentValue !== null
        ? Math.max(0, targetValue - currentValue)
        : Math.max(0, Math.round(100 - progress));

      return {
        id: goal._id || goal.id,
        icon: iconMap[goal.category] || Star,
        name: goal.title,
        description: goal.description || 'Keep progressing toward this goal.',
        progress,
        remaining,
        unit,
        progressLabel: targetValue && currentValue !== null
          ? `${currentValue}/${targetValue} ${unit}`
          : `${Math.round(progress)}%`
      };
    });

    return mapped.slice(0, 3);
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
  const activeGoals = getActiveGoals();

  return (
    <div className="min-h-screen bg-muted/30">
      <StudentNavbar />

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
                  <div className="grid grid-cols-1 gap-4 mt-3">
                    <div className="rounded-xl border bg-card/60 p-4">
                      <p className="text-sm text-muted-foreground">Readiness</p>
                      <div className="flex items-end justify-between gap-3 mt-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                            {student.baseReadinessScore || 0}
                          </span>
                          <span className="text-sm text-muted-foreground">/ 100</span>
                        </div>
                        <TrendingUp className="w-5 h-5 text-primary" />
                      </div>
                      <Progress value={Math.max(0, Math.min(100, student.baseReadinessScore || 0))} className="h-2 mt-3" />
                      <p className="text-xs text-muted-foreground mt-2">
                        Powered by projects, recent activity (logs + synced stats), skills, and streak.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Market Tracker Glimpse */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="border-none shadow-premium bg-gradient-to-r from-indigo-600/10 via-background to-primary/10 overflow-hidden relative group cursor-pointer hover:shadow-2xl transition-all duration-500" onClick={() => navigate('/student/market')}>
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <TrendingUp className="w-32 h-32" />
            </div>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-primary text-primary-foreground hover:bg-primary/90">New: Market Analytics</Badge>
                    <div className="flex items-center gap-1 text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-tighter">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live Trends
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight">Dynamic Skill Market Tracker</h3>
                  <p className="text-muted-foreground max-w-lg">
                    Real-time analysis of job markets at FAANG & startups. See which skills are trending for 2026 and your personal investment ROI.
                  </p>
                  <Button variant="link" className="px-0 text-primary font-bold group-hover:translate-x-2 transition-transform">
                    Explore full market data <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-4 items-center justify-center lg:justify-end">
                  {marketROI?.[0] && (
                    <div className="bg-primary text-primary-foreground p-4 rounded-xl shadow-lg w-[160px] text-center transform hover:-translate-y-1 transition-transform">
                      <div className="text-[10px] uppercase font-bold opacity-80 mb-1">Top ROI Match</div>
                      <div className="font-bold text-lg">{marketROI[0].skillName}</div>
                      <div className="text-xs opacity-90">{marketROI[0].roiScore} Market Score</div>
                    </div>
                  )}

                  {marketTrends?.rising?.slice(0, 3).map((skill: any, i: number) => (
                    <div key={i} className="bg-card/80 backdrop-blur-sm p-4 rounded-xl border border-emerald-500/20 shadow-sm w-[140px] text-center group-hover:border-emerald-500/50 transition-colors">
                      <div className="text-[10px] uppercase font-bold text-emerald-600 flex items-center justify-center gap-1 mb-1">
                        <ArrowUpRight className="w-3 h-3" /> {skill.predictedGrowth6m}%
                      </div>
                      <div className="font-bold">{skill.skillName}</div>
                      <div className="text-[10px] text-muted-foreground">Trending Up</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Domain Insight Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-8"
        >
          <Card className="shadow-card border-primary/10 bg-gradient-to-r from-violet-500/5 via-background to-fuchsia-500/5">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {insightLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-full max-w-md" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  ) : domainInsight ? (
                    <>
                      <div className="flex items-center gap-2 mb-3">
                        {domainInsight.type === 'fact' ? (
                          <Lightbulb className="w-5 h-5 text-amber-500" />
                        ) : domainInsight.type === 'interview' ? (
                          <HelpCircle className="w-5 h-5 text-blue-500" />
                        ) : (
                          <Brain className="w-5 h-5 text-primary" />
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {domainInsight.domain || 'Your Domain'}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-lg mb-2">
                        {domainInsight.content?.title}
                      </h3>
                      {domainInsight.type === 'fact' && (
                        <p className="text-muted-foreground">
                          {domainInsight.content?.text}
                        </p>
                      )}
                      {domainInsight.type === 'interview' && (
                        <div className="space-y-3">
                          <p className="font-medium text-foreground">
                            {domainInsight.content?.question}
                          </p>
                          <p className="text-sm text-muted-foreground italic">
                            💡 Hint: {domainInsight.content?.hint}
                          </p>

                          {/* Show Answer Toggle */}
                          {domainInsight.content?.answer && (
                            <div className="pt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowAnswer(!showAnswer)}
                                className="mb-2 gap-2"
                              >
                                {showAnswer ? '🙈 Hide Answer' : '👀 Show Answer'}
                              </Button>

                              {showAnswer && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-lg border border-emerald-500/20"
                                >
                                  <div className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-1 shrink-0" />
                                    <div>
                                      <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                                        Sample Answer:
                                      </p>
                                      <p className="text-sm text-foreground leading-relaxed">
                                        {domainInsight.content?.answer}
                                      </p>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      {domainInsight.type === 'prompt' && (
                        <p className="text-muted-foreground">
                          {domainInsight.content?.text}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-muted-foreground">Loading domain insights...</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={async () => {
                    const token = localStorage.getItem('token');
                    if (!token) return;
                    setInsightLoading(true);
                    setShowAnswer(false); // Reset answer visibility when refreshing
                    try {
                      const insight = await studentApi.getDomainInsights(token);
                      setDomainInsight(insight);
                    } catch (e) {
                      console.error('Failed to fetch domain insight', e);
                    } finally {
                      setInsightLoading(false);
                    }
                  }}
                  disabled={insightLoading}
                  className="shrink-0"
                >
                  <RefreshCw className={`w-4 h-4 ${insightLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardContent>
          </Card>
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
                  Learning Journal & Opportunities
                </CardTitle>
                <CardDescription>Upload your progress and explore job opportunities</CardDescription>
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
                  Track achievements and AI-generated goals tied to your progress
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
                {activeGoals.length > 0 && (
                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <Target className="w-4 h-4 text-primary" />
                        Your Goals ({activeGoals.length}/3)
                      </h4>
                    </div>
                    <div className="space-y-3">
                      {activeGoals.map((goal) => (
                        <div key={goal.id} className="space-y-2 p-3 bg-muted/50 rounded-lg border border-dashed border-muted-foreground/30">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 flex-1 min-w-0">
                              <goal.icon className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm">{goal.name}</p>
                                <p className="text-xs text-muted-foreground">{goal.description}</p>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs shrink-0">
                              {goal.remaining} {goal.unit}
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Progress</span>
                              <span className="font-medium">{goal.progressLabel}</span>
                            </div>
                            <Progress value={goal.progress} className="h-2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeGoals.length === 0 && (
                  <div className="space-y-4 pt-4 border-t text-center">
                    <p className="text-sm text-muted-foreground">
                      No active goals yet. Ask Zenith to set goals that auto-update with your projects.
                    </p>
                    <Button variant="outline" size="sm" onClick={() => navigate('/student/ai')}>
                      Set goals with AI Mentor
                    </Button>
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

        {/* AI Mentor section moved to dedicated AI page */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6"
        >
          <Card className="shadow-card border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Deep Insights with Zenith AI</h3>
              <p className="text-muted-foreground mb-6">
                Get a comprehensive analysis of your trajectory, core competencies, and a personalized strategic action plan.
              </p>
              <Button onClick={() => navigate('/student/ai')} className="bg-gradient-primary rounded-full px-8">
                View My AI Recommendations
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default StudentDashboard;
