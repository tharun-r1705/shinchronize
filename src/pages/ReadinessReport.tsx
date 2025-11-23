import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Download, Target, Sparkles, Calendar, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const ReadinessReport = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    localStorage.removeItem('studentData');
    navigate('/');
  };

  const growthData = [
    { month: "Jan", score: 45 },
    { month: "Feb", score: 52 },
    { month: "Mar", score: 58 },
    { month: "Apr", score: 65 },
    { month: "May", score: 68 },
    { month: "Jun", score: 72 },
  ];

  const scoreBreakdown = [
    { name: "Consistency", value: 40, color: "hsl(var(--primary))" },
    { name: "Growth Rate", value: 30, color: "hsl(var(--secondary))" },
    { name: "Skill Diversity", value: 20, color: "hsl(var(--accent))" },
    { name: "Projects & Achievements", value: 10, color: "hsl(262 83% 58%)" },
  ];

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
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">Placement Readiness Report</h1>
              <p className="text-muted-foreground">Comprehensive analysis of your growth journey</p>
            </div>
            <Button className="bg-gradient-primary">
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>

          <Card className="shadow-card bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center md:text-left">
                  <p className="text-sm text-muted-foreground mb-2">Overall Readiness Score</p>
                  <div className="flex items-center gap-3">
                    <span className="text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">72%</span>
                    <div className="flex items-center gap-1 text-primary">
                      <TrendingUp className="w-5 h-5" />
                      <span className="text-lg font-semibold">+18%</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Last 6 months</p>
                </div>
                <div className="h-24 w-px bg-border hidden md:block" />
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Job Role Benchmark</p>
                  <p className="text-lg font-semibold mb-1">Software Engineer</p>
                  <Badge className="bg-primary">Target: 80%</Badge>
                  <p className="text-xs text-muted-foreground mt-2">You are 8% away from target</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Growth Curve */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Growth Curve</CardTitle>
              <CardDescription>Your placement readiness journey over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" domain={[0, 100]} />
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
                    dot={{ fill: 'hsl(var(--primary))', r: 6 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Score Breakdown */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Score Breakdown</CardTitle>
                <CardDescription>How your readiness score is calculated</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={scoreBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}%`}
                      outerRadius={100}
                      fill="hsl(var(--primary))"
                      dataKey="value"
                    >
                      {scoreBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {scoreBreakdown.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-muted-foreground">{item.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Predictive Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-semibold mb-1">Projected Timeline</h4>
                      <p className="text-sm text-muted-foreground">
                        At your current pace, you'll reach 85% readiness in approximately 3 months.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Key Milestones</h4>
                  <div className="space-y-2">
                    {[
                      { milestone: "Complete 5 more projects", status: "In Progress", progress: 60 },
                      { milestone: "Improve System Design score to 75%", status: "Pending", progress: 30 },
                      { milestone: "Maintain 150-day streak", status: "On Track", progress: 80 },
                    ].map((item, index) => (
                      <div key={index} className="p-3 bg-muted rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">{item.milestone}</span>
                          <Badge variant={item.status === "On Track" ? "default" : "secondary"}>
                            {item.status}
                          </Badge>
                        </div>
                        <div className="w-full bg-muted-foreground/20 rounded-full h-1.5">
                          <div 
                            className="bg-primary h-1.5 rounded-full transition-all"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* AI Growth Story */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="shadow-card border-accent/20 bg-gradient-to-br from-accent/5 to-secondary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                AI-Generated Growth Story
              </CardTitle>
              <CardDescription>Your unique learning journey</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <p className="text-foreground leading-relaxed">
                  Vikram began his journey with moderate proficiency in data structures and algorithms. 
                  Over the past six months, he has demonstrated exceptional consistency with a remarkable 
                  <span className="font-semibold text-primary"> 120-day coding streak</span>.
                </p>
                <p className="text-foreground leading-relaxed mt-4">
                  Initially struggling with machine learning concepts, Vikram took initiative by completing 
                  three comprehensive ML projects, including a price prediction model that showcases practical 
                  application of theoretical knowledge. His project portfolio demonstrates a 
                  <span className="font-semibold text-primary"> strong blend of theory and implementation</span>.
                </p>
                <p className="text-foreground leading-relaxed mt-4">
                  What sets Vikram apart is his resilience and adaptability. Despite early challenges in 
                  cloud computing and system design, he has shown consistent improvement. His growth trajectory 
                  suggests a candidate who doesn't just learn—he 
                  <span className="font-semibold text-primary"> evolves and adapts</span>.
                </p>
                <p className="text-foreground leading-relaxed mt-4">
                  The data reveals a learner who values consistency over cramming, practical experience over 
                  theoretical knowledge alone, and continuous improvement over perfection. These qualities 
                  make Vikram an ideal candidate for roles requiring 
                  <span className="font-semibold text-primary"> long-term growth potential and reliability</span>.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default ReadinessReport;
