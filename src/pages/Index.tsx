import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Users,
  BarChart3,
  Award,
  Sparkles,
  ArrowRight,
  Command,
  Zap,
  Shield,
  Layers,
  Moon,
  Sun,
  Target,
  GitBranch,
  Brain,
  CheckCircle2,
  Play,
  Briefcase,
  GraduationCap,
} from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";

// Animated counter component
const AnimatedCounter = ({ value, suffix = "" }: { value: number; suffix?: string }) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [value]);
  
  return <span className="tabular-nums">{count.toLocaleString()}{suffix}</span>;
};

// Feature card component
const FeatureCard = ({ 
  icon: Icon, 
  title, 
  description, 
  index 
}: { 
  icon: typeof TrendingUp; 
  title: string; 
  description: string;
  index: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ delay: index * 0.1, duration: 0.5 }}
  >
    <Card variant="bento" className="p-6 h-full group hover:border-primary/30 transition-all duration-300">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <h3 className="font-heading text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </Card>
  </motion.div>
);

// Comparison bar animation
const ComparisonBar = ({ delay, height, color }: { delay: number; height: number; color: string }) => (
  <motion.div
    className={`w-6 rounded-t-sm ${color}`}
    initial={{ height: 0 }}
    whileInView={{ height }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
  />
);

const Index = () => {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(true);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const shouldBeDark = savedTheme === 'dark' || !savedTheme;
    setIsDark(shouldBeDark);
    document.documentElement.classList.toggle('dark', shouldBeDark);
    document.documentElement.classList.toggle('light', !shouldBeDark);
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    document.documentElement.classList.toggle('dark', newIsDark);
    document.documentElement.classList.toggle('light', !newIsDark);
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
  };

  const features = [
    {
      icon: Target,
      title: "Readiness Score",
      description: "AI-powered assessment that measures your true placement readiness, not just test scores."
    },
    {
      icon: Brain,
      title: "AI Mentor",
      description: "Get personalized guidance and actionable recommendations tailored to your career goals."
    },
    {
      icon: GitBranch,
      title: "Activity Tracking",
      description: "Sync LeetCode, GitHub, and HackerRank to build a verified coding portfolio."
    },
    {
      icon: BarChart3,
      title: "Skill Market",
      description: "Real-time insights on trending skills and their ROI in the job market."
    },
    {
      icon: Award,
      title: "Gamified Progress",
      description: "Earn badges, maintain streaks, and climb leaderboards as you grow."
    },
    {
      icon: Shield,
      title: "Verified Profiles",
      description: "Certificates and projects verified by admins for authentic portfolios."
    },
  ];

  const stats = [
    { value: 5000, suffix: "+", label: "Students" },
    { value: 150, suffix: "+", label: "Companies" },
    { value: 89, suffix: "%", label: "Placement Rate" },
    { value: 4.8, suffix: "", label: "Rating" },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 bg-gradient-hero pointer-events-none" />
      <div className="fixed inset-0 bg-dot-pattern bg-dot-pattern opacity-[0.02] pointer-events-none" />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-glow">
              <span className="text-sm font-bold text-white">S</span>
            </div>
            <span className="text-xl font-heading font-bold text-gradient">Shinchronize</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-9 w-9"
              onClick={toggleTheme}
            >
              {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/student/login")}
              className="hidden sm:inline-flex"
            >
              Student Login
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => navigate("/recruiter/login")}
            >
              Recruiter Portal
            </Button>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative pt-32 pb-20 md:pt-40 md:pb-32">
        <motion.div 
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="container mx-auto px-4 relative z-10"
        >
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm border-primary/30 bg-primary/5">
                <Sparkles className="w-3.5 h-3.5 mr-2 text-primary" />
                The Future of Campus Placements
              </Badge>
            </motion.div>
            
            {/* Main Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-bold mb-6 tracking-tighter"
            >
              Your Growth.{" "}
              <span className="text-gradient">Verified.</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-4"
            >
              Transform campus placements from one-day snapshots to continuous growth stories. 
              Track skills, build portfolios, and get discovered.
            </motion.p>

            {/* Keyboard hint */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-10"
            >
              <span>Press</span>
              <kbd className="px-2 py-1 rounded-md bg-muted border border-border text-xs font-mono inline-flex items-center gap-1">
                <Command className="w-3 h-3" /> K
              </kbd>
              <span>to navigate</span>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
            >
              <Button
                size="xl"
                variant="glow"
                className="text-base group"
                onClick={() => navigate("/student/login")}
              >
                <GraduationCap className="w-5 h-5 mr-2" />
                Start as Student
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="xl"
                variant="outline"
                className="text-base"
                onClick={() => navigate("/recruiter/login")}
              >
                <Briefcase className="w-5 h-5 mr-2" />
                Recruiter Access
              </Button>
            </motion.div>

            {/* Visual Comparison */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto"
            >
              {/* Traditional */}
              <Card variant="ghost" className="p-6 text-center bg-muted/30 border-border/50">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-1 text-muted-foreground">Traditional</h3>
                <p className="text-sm text-muted-foreground/70 mb-4">One-day test snapshot</p>
                <div className="flex items-end justify-center gap-2 h-16">
                  <div className="w-8 h-16 rounded-t-sm bg-muted-foreground/20" />
                </div>
              </Card>

              {/* Shinchronize */}
              <Card variant="glow" className="p-6 text-center border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1 text-primary">Shinchronize</h3>
                <p className="text-sm text-foreground/70 mb-4">Continuous growth tracking</p>
                <div className="flex items-end justify-center gap-1.5 h-16">
                  <ComparisonBar delay={0.6} height={20} color="bg-primary/60" />
                  <ComparisonBar delay={0.7} height={28} color="bg-primary/70" />
                  <ComparisonBar delay={0.8} height={36} color="bg-primary/80" />
                  <ComparisonBar delay={0.9} height={48} color="bg-primary/90" />
                  <ComparisonBar delay={1.0} height={64} color="bg-primary" />
                </div>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-border/50 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-heading font-bold text-gradient mb-1">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge variant="outline" className="mb-4 px-3 py-1 text-xs">
              <Zap className="w-3 h-3 mr-1.5" />
              Features
            </Badge>
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              Everything you need to <span className="text-gradient">succeed</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A comprehensive platform for students, recruiters, and administrators
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <FeatureCard key={feature.title} {...feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 md:py-32 bg-muted/20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge variant="outline" className="mb-4 px-3 py-1 text-xs">
              <Layers className="w-3 h-3 mr-1.5" />
              How It Works
            </Badge>
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              Simple. Effective. <span className="text-gradient">Powerful.</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: "01",
                title: "Build Your Profile",
                description: "Connect coding platforms, add projects, and let AI analyze your skills.",
                icon: Users,
              },
              {
                step: "02",
                title: "Track & Improve",
                description: "Follow personalized roadmaps, practice interviews, and grow daily.",
                icon: TrendingUp,
              },
              {
                step: "03",
                title: "Get Discovered",
                description: "Recruiters find you based on verified skills, not just resumes.",
                icon: Sparkles,
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="relative"
              >
                <div className="text-6xl font-heading font-bold text-muted/50 mb-4">
                  {item.step}
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-heading font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <Card variant="gradient" className="p-8 md:p-12 text-center relative overflow-hidden">
              {/* Background glow effects */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-accent/20 rounded-full blur-3xl" />
              
              <div className="relative z-10">
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-glow"
                >
                  <Sparkles className="w-8 h-8 text-white" />
                </motion.div>
                
                <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
                  Ready to <span className="text-gradient">transform</span> your career?
                </h2>
                <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                  Join thousands of students already building their verified growth stories.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="xl"
                    variant="glow"
                    className="text-base group"
                    onClick={() => navigate("/student/login")}
                  >
                    Get Started Free
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button
                    size="xl"
                    variant="outline"
                    className="text-base"
                    onClick={() => navigate("/recruiter/login")}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Watch Demo
                  </Button>
                </div>

                {/* Trust indicators */}
                <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-accent" />
                    <span>Free to start</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-accent" />
                    <span>No credit card</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-accent" />
                    <span>Instant setup</span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                <span className="text-xs font-bold text-white">S</span>
              </div>
              <span className="text-sm text-muted-foreground">
                © 2026 Shinchronize. All rights reserved.
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
