import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  GraduationCap, 
  Phone, 
  Mail, 
  Globe, 
  Github, 
  Linkedin,
  ExternalLink,
  Award,
  BookOpen,
  Code,
  TrendingUp,
  User,
  Building,
  CheckCircle2,
  Clock,
  X
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { recruiterApi } from "@/lib/api";
import { GitHubDetails } from "@/components/GitHubDetails";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const StudentProfileView = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [student, setStudent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStudentProfile = async () => {
      if (!studentId) {
        setError("Student ID is required");
        setIsLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast({
            title: "Authentication required",
            description: "Please log in to view student profiles",
            variant: "destructive",
          });
          navigate('/recruiter/login');
          return;
        }

        // Get the specific student profile
        const studentData = await recruiterApi.getStudentProfile(studentId, token);
        
        if (!studentData) {
          setError("Student not found");
          return;
        }

        setStudent(studentData);
      } catch (error: any) {
        console.error('Error fetching student profile:', error);
        setError(error.message || "Failed to load student profile");
        toast({
          title: "Error loading profile",
          description: error.message || "Failed to fetch student data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentProfile();
  }, [studentId, navigate, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-secondary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Profile Not Found</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => navigate('/recruiter/dashboard')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Generate readiness score history data
  const getReadinessHistoryData = () => {
    if (student.readinessHistory && student.readinessHistory.length > 0) {
      return student.readinessHistory.slice(-6).map((entry: any, index: number) => ({
        month: new Date(entry.calculatedAt).toLocaleDateString('en-US', { month: 'short' }),
        score: entry.score || 0
      }));
    }
    
    // Generate sample data if no history available
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    const currentScore = student.readinessScore || 0;
    return months.map((month, index) => ({
      month,
      score: Math.max(0, currentScore - (5 - index) * 10)
    }));
  };

  // Generate skill distribution data
  const getSkillDistributionData = () => {
    if (!student.projects || student.projects.length === 0) {
      return [];
    }

    const skillCounts: { [key: string]: number } = {};
    student.projects.forEach((project: any) => {
      if (project.tags && Array.isArray(project.tags)) {
        project.tags.forEach((tag: string) => {
          skillCounts[tag] = (skillCounts[tag] || 0) + 1;
        });
      }
    });

    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0'];
    return Object.entries(skillCounts)
      .slice(0, 6)
      .map(([skill, count], index) => ({
        name: skill,
        value: count,
        color: colors[index % colors.length]
      }));
  };

  const readinessHistoryData = getReadinessHistoryData();
  const skillDistributionData = getSkillDistributionData();

  // Get all unique skills from projects and student.skills
  const getAllSkills = () => {
    const projectSkills = student.projects?.flatMap((p: any) => p.tags || []) || [];
    const profileSkills = student.skills || [];
    return [...new Set([...projectSkills, ...profileSkills])];
  };

  const allSkills = getAllSkills();

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/recruiter/dashboard')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <h1 className="text-2xl font-bold bg-gradient-secondary bg-clip-text text-transparent">
              Student Profile
            </h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Avatar and Basic Info */}
                <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
                  <div className="w-24 h-24 bg-gradient-secondary rounded-full flex items-center justify-center text-3xl font-bold text-secondary-foreground mb-4">
                    {student.avatarUrl ? (
                      <img 
                        src={student.avatarUrl} 
                        alt={student.name}
                        className="w-24 h-24 rounded-full object-cover"
                      />
                    ) : (
                      student.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'ST'
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-3xl font-bold">{student.name || 'Unknown Student'}</h1>
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-xl text-muted-foreground mb-4">
                    {student.headline || `${student.branch || 'Student'} at ${student.college || 'Unknown College'}`}
                  </p>
                  <div className="text-center lg:text-left">
                    <div className="text-4xl font-bold bg-gradient-secondary bg-clip-text text-transparent mb-1">
                      {student.readinessScore || 0}%
                    </div>
                    <p className="text-sm text-muted-foreground">Readiness Score</p>
                  </div>
                </div>

                {/* Key Stats */}
                <div className="flex-1">
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                    <div className="text-center p-4 bg-primary/5 rounded-lg">
                      <div className="text-2xl font-bold text-primary">{student.streakDays || 0}</div>
                      <div className="text-sm text-muted-foreground">Day Streak</div>
                    </div>
                    <div className="text-center p-4 bg-secondary/5 rounded-lg">
                      <div className="text-2xl font-bold text-secondary">{student.projects?.length || 0}</div>
                      <div className="text-sm text-muted-foreground">Projects</div>
                    </div>
                    <div className="text-center p-4 bg-accent/5 rounded-lg">
                      <div className="text-2xl font-bold text-accent">{student.certifications?.length || 0}</div>
                      <div className="text-sm text-muted-foreground">Certificates</div>
                    </div>
                    <div className="text-center p-4 bg-green-500/5 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{student.cgpa ? student.cgpa.toFixed(1) : 'N/A'}</div>
                      <div className="text-sm text-muted-foreground">CGPA</div>
                    </div>
                    <div className="text-center p-4 bg-muted/5 rounded-lg">
                      <div className="text-2xl font-bold">{allSkills.length}</div>
                      <div className="text-sm text-muted-foreground">Skills</div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2">
                    {student.college && (
                      <div className="flex items-center gap-2 text-sm">
                        <GraduationCap className="w-4 h-4 text-muted-foreground" />
                        <span>{student.college}</span>
                        {student.branch && <span className="text-muted-foreground">• {student.branch}</span>}
                        {student.year && <span className="text-muted-foreground">• {student.year} Year</span>}
                      </div>
                    )}
                    {student.location && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>{student.location}</span>
                      </div>
                    )}
                    {student.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{student.email}</span>
                      </div>
                    )}
                    {student.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{student.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Social Links */}
                  <div className="flex gap-2 mt-4">
                    {student.portfolioUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={student.portfolioUrl} target="_blank" rel="noopener noreferrer">
                          <Globe className="w-4 h-4 mr-2" />
                          Portfolio
                        </a>
                      </Button>
                    )}
                    {student.githubUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={student.githubUrl} target="_blank" rel="noopener noreferrer">
                          <Github className="w-4 h-4 mr-2" />
                          GitHub
                        </a>
                      </Button>
                    )}
                    {student.linkedinUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={student.linkedinUrl} target="_blank" rel="noopener noreferrer">
                          <Linkedin className="w-4 h-4 mr-2" />
                          LinkedIn
                        </a>
                      </Button>
                    )}
                    {student.leetcodeUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={student.leetcodeUrl} target="_blank" rel="noopener noreferrer">
                          <Code className="w-4 h-4 mr-2" />
                          LeetCode
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Detailed Information Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="github">GitHub</TabsTrigger>
              <TabsTrigger value="projects">Projects ({student.projects?.length || 0})</TabsTrigger>
              <TabsTrigger value="skills">Skills ({allSkills.length})</TabsTrigger>
              <TabsTrigger value="certifications">Certificates ({student.certifications?.length || 0})</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* About */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      About
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {student.summary || "No summary provided yet."}
                    </p>
                    {student.graduationYear && (
                      <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">Expected Graduation: {student.graduationYear}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {student.projects && student.projects.length > 0 ? (
                        student.projects.slice(0, 3).map((project: any, index: number) => (
                          <div key={index} className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                            <div>
                              <p className="text-sm font-medium">{project.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(project.submittedAt)}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No recent activity</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* LeetCode Stats */}
              {student.leetcodeStats && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code className="w-5 h-5" />
                      LeetCode Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{student.leetcodeStats.totalSolved || 0}</div>
                        <div className="text-sm text-muted-foreground">Total Solved</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{student.leetcodeStats.easy || 0}</div>
                        <div className="text-sm text-muted-foreground">Easy</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">{student.leetcodeStats.medium || 0}</div>
                        <div className="text-sm text-muted-foreground">Medium</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{student.leetcodeStats.hard || 0}</div>
                        <div className="text-sm text-muted-foreground">Hard</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{student.leetcodeStats.streak || 0}</div>
                        <div className="text-sm text-muted-foreground">Streak</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* GitHub Tab - Read Only for Recruiters */}
            <TabsContent value="github" className="space-y-4">
              <GitHubDetails 
                token={localStorage.getItem('token') || ''} 
                readOnly={true}
                studentId={studentId}
              />
            </TabsContent>

            <TabsContent value="projects" className="space-y-4">
              {student.projects && student.projects.length > 0 ? (
                student.projects.map((project: any, index: number) => (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {project.title}
                            {project.status === 'verified' && (
                              <CheckCircle2 className="w-5 h-5 text-primary" />
                            )}
                            {project.status === 'pending' && (
                              <Clock className="w-5 h-5 text-yellow-600" />
                            )}
                          </CardTitle>
                          <CardDescription>
                            Submitted on {formatDate(project.submittedAt)}
                          </CardDescription>
                        </div>
                        {project.githubLink && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={project.githubLink} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4 mr-2" />
                              View Code
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">
                        {project.description || "No description provided."}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {project.tags && project.tags.map((tag: string, tagIndex: number) => (
                          <Badge key={tagIndex} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No projects submitted yet</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="skills" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Technical Skills</CardTitle>
                  <CardDescription>
                    Skills demonstrated through projects and profile
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {allSkills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {allSkills.map((skill: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-sm">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No skills listed yet</p>
                  )}
                </CardContent>
              </Card>

              {/* Skill Distribution Chart */}
              {skillDistributionData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Skill Distribution</CardTitle>
                    <CardDescription>Based on project tags</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={skillDistributionData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="value"
                          >
                            {skillDistributionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap gap-4 justify-center mt-4">
                      {skillDistributionData.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: entry.color }}
                          ></div>
                          <span className="text-sm">{entry.name} ({entry.value})</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="certifications" className="space-y-4">
              {student.certifications && student.certifications.length > 0 ? (
                student.certifications.map((cert: any, index: number) => (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Award className="w-5 h-5" />
                            {cert.name}
                            {cert.status === 'verified' && (
                              <CheckCircle2 className="w-5 h-5 text-primary" />
                            )}
                          </CardTitle>
                          <CardDescription>
                            {cert.provider} • Issued {formatDate(cert.issuedDate)}
                          </CardDescription>
                        </div>
                        {cert.fileLink && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={cert.fileLink} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4 mr-2" />
                              View Certificate
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    {cert.certificateId && (
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Certificate ID: {cert.certificateId}
                        </p>
                      </CardContent>
                    )}
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Award className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No certifications added yet</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              {/* Readiness Score Progress */}
              <Card>
                <CardHeader>
                  <CardTitle>Readiness Score Progress</CardTitle>
                  <CardDescription>6-month growth trend</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={readinessHistoryData}>
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
                          dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Activity Summary */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Activity Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Profile Completion</span>
                      <span className="font-bold">{student.isProfileComplete ? '100%' : '75%'}</span>
                    </div>
                    <Progress value={student.isProfileComplete ? 100 : 75} />
                    
                    <div className="flex justify-between items-center">
                      <span>Project Verification Rate</span>
                      <span className="font-bold">
                        {student.projects?.length > 0 
                          ? Math.round((student.projects.filter((p: any) => p.status === 'verified').length / student.projects.length) * 100)
                          : 0
                        }%
                      </span>
                    </div>
                    <Progress 
                      value={student.projects?.length > 0 
                        ? (student.projects.filter((p: any) => p.status === 'verified').length / student.projects.length) * 100
                        : 0
                      } 
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Growth Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Current Streak</span>
                      <span className="font-bold text-primary">{student.streakDays || 0} days</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Total Projects</span>
                      <span className="font-bold">{student.projects?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Verified Projects</span>
                      <span className="font-bold text-primary">
                        {student.projects?.filter((p: any) => p.status === 'verified').length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Skills Demonstrated</span>
                      <span className="font-bold">{allSkills.length}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default StudentProfileView;