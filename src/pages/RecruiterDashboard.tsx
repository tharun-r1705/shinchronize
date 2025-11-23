import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, TrendingUp, Award, CheckCircle2, Brain, Filter, LogOut, GitCompare, Info, BookOpen, Clock, GraduationCap } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useEffect, useState } from "react";
import { recruiterApi, interviewApi, InterviewSessionDTO } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import AIRecruiterAssistant from "@/components/AIRecruiterAssistant";

const RecruiterDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
  const [interviewSessions, setInterviewSessions] = useState<InterviewSessionDTO[]>([]);
  const [selectedInterview, setSelectedInterview] = useState<InterviewSessionDTO | null>(null);

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

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const response = await interviewApi.getRecruiterSessions('me', { limit: 10 }, token);
        const sessions = response.sessions || [];
        setInterviewSessions(sessions);
        if (sessions.length > 0) {
          setSelectedInterview(sessions[0]);
        }
      } catch (error) {
        console.error('Failed to load interview sessions', error);
      }
    };

    fetchSessions();
  }, []);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-secondary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading students...</p>
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

  const interviewChartData = (selectedInterview?.learningCurve || []).map((point, index) => ({
    turn: index + 1,
    score: point.overall,
  }));

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Top Navigation */}
      <header className="bg-card border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-secondary bg-clip-text text-transparent">
            EvolvEd Recruiter
          </h1>
          <nav className="flex gap-4 items-center">
            <Button variant="ghost" onClick={() => navigate("/recruiter/dashboard")}>
              Dashboard
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-8 grid gap-6 lg:grid-cols-[2fr_1fr]"
        >
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Mock interview learning curve</span>
                <Badge variant="secondary">
                  {selectedInterview ? selectedInterview.role : 'No session selected'}
                </Badge>
              </CardTitle>
              <CardDescription>
                Live Groq evaluations are stored for recruiters. Track readiness momentum before scheduling a live screen.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedInterview && interviewChartData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer>
                    <LineChart data={interviewChartData} margin={{ left: 12, right: 12 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="turn" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}`} tickLine={false} axisLine={false} />
                      <Tooltip formatter={(value) => [`${value}/100`, 'Score']} />
                      <Line type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={2} dot />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No mock interview data yet. Encourage candidates to practice so their confidence curve appears here.</p>
              )}
              {selectedInterview && (
                <div className="mt-4 text-sm text-muted-foreground">
                  <p>Turns completed: {selectedInterview.learningCurve?.length || 0}</p>
                  <p>Current status: {selectedInterview.status}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Candidates recently coached</CardTitle>
              <CardDescription>Tap to view their learning curves.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {interviewSessions.length === 0 && (
                <p className="text-sm text-muted-foreground">No mock interviews recorded yet.</p>
              )}
              {interviewSessions.map((sessionItem) => (
                <button
                  key={sessionItem._id}
                  onClick={() => setSelectedInterview(sessionItem)}
                  className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                    selectedInterview?._id === sessionItem._id ? 'border-primary bg-primary/5' : 'hover:border-primary/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{sessionItem.student?.name || 'Candidate'}</p>
                      <p className="text-xs text-muted-foreground">{sessionItem.role}</p>
                    </div>
                    <Badge variant="outline">{sessionItem.overallScore || 0}/100</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(sessionItem.createdAt || '').toLocaleDateString()} • {sessionItem.learningCurve?.length || 0} turns
                  </p>
                </button>
              ))}
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
                  className={`shadow-card hover:shadow-glow transition-shadow ${
                    selectedStudents.includes(candidate._id) ? 'ring-2 ring-secondary' : ''
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
                        <Button 
                          variant="outline" 
                          className="w-full md:w-auto"
                          onClick={() => navigate(`/recruiter/student/${candidate._id}`)}
                        >
                          View Full Profile
                        </Button>
                        
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
    </div>
  );
};

export default RecruiterDashboard;
