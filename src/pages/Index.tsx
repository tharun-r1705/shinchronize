import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TrendingUp, Users, BarChart3, Award, CalendarX2, Sparkles, ArrowRight, Command, Zap, Shield, Layers, Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const Index = () => {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check saved theme preference or system preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    setIsDark(shouldBeDark);
    document.documentElement.classList.toggle('dark', shouldBeDark);
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    document.documentElement.classList.toggle('dark', newIsDark);
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Animated background gradient mesh */}
      <div className="fixed inset-0 bg-gradient-mesh opacity-50 pointer-events-none" />
      
      {/* Floating orbs for visual interest */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{ top: '10%', left: '10%' }}
        />
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full bg-accent/10 blur-3xl"
          animate={{
            x: [0, -80, 0],
            y: [0, 60, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          style={{ top: '50%', right: '10%' }}
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 border-b border-border/50 glass">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
              <span className="text-sm font-bold text-white">S</span>
            </div>
            <span className="text-xl font-bold text-gradient">Shinchronize</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={toggleTheme}
            >
              <motion.div
                initial={false}
                animate={{ rotate: isDark ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {isDark ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </motion.div>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/student/login")}
            >
              Student Login
            </Button>
            <Button
              variant="glow"
              size="sm"
              onClick={() => navigate("/recruiter/login")}
            >
              Recruiter Portal
            </Button>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full glass border border-primary/20"
            >
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-sm font-medium">The Future of Campus Placements</span>
            </motion.div>
            
            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 tracking-tight">
              <span className="text-gradient">Redefining</span>
              <br />
              <span className="text-foreground">Campus Placements</span>
            </h1>
            
            <p className="text-xl md:text-2xl mb-4 text-muted-foreground max-w-2xl mx-auto">
              From snapshots to growth stories. Track skills, consistency, and real progress.
            </p>

            {/* Keyboard shortcut hint */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-12"
            >
              <span>Press</span>
              <kbd className="px-2 py-1 rounded bg-muted border border-border text-xs font-mono">
                <Command className="inline w-3 h-3" /> K
              </kbd>
              <span>to navigate quickly</span>
            </motion.div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button
                size="xl"
                variant="glow"
                className="text-lg group"
                onClick={() => navigate("/student/login")}
              >
                Start Your Journey
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="xl"
                variant="outline"
                className="text-lg"
                onClick={() => navigate("/recruiter/login")}
              >
                For Recruiters
              </Button>
            </div>

            {/* Visual Comparison Cards */}
            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card variant="ghost" className="p-6 text-center bg-muted/30">
                  <BarChart3 className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2 text-muted-foreground">Traditional Approach</h3>
                  <p className="text-sm text-muted-foreground mb-4">One-day exam snapshot</p>
                  <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                      <CalendarX2 className="w-8 h-8 text-muted-foreground" />
                    </div>
                  </div>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card variant="glow" className="p-6 text-center border-primary/30 bg-gradient-glow">
                  <TrendingUp className="w-10 h-10 mx-auto mb-4 text-primary" />
                  <h3 className="font-semibold mb-2 text-primary">Shinchronize Approach</h3>
                  <p className="text-sm text-foreground mb-4">Continuous growth tracking</p>
                  <div className="flex items-end justify-center gap-1.5 h-16">
                    {[8, 12, 16, 20, 24].map((h, i) => (
                      <motion.div
                        key={i}
                        className="w-4 rounded-t bg-gradient-primary"
                        initial={{ height: 0 }}
                        animate={{ height: `${h * 2.5}px` }}
                        transition={{ delay: 0.7 + i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                      />
                    ))}
                  </div>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Built for <span className="text-gradient">Growth</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tracking meets intelligent insights
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                icon: Zap,
                title: "Real-time Tracking",
                description: "Monitor skills development with AI-powered insights and live analytics",
                gradient: "from-primary/20 to-primary/5"
              },
              {
                icon: Users,
                title: "Recruiter Dashboard",
                description: "Find consistent, growth-oriented candidates beyond just test scores",
                gradient: "from-accent/20 to-accent/5"
              },
              {
                icon: Award,
                title: "Gamified Learning",
                description: "Earn badges, maintain streaks, and showcase your learning journey",
                gradient: "from-success/20 to-success/5"
              },
              {
                icon: Layers,
                title: "Skill Roadmaps",
                description: "AI-generated personalized learning paths tailored to your goals",
                gradient: "from-warning/20 to-warning/5"
              },
              {
                icon: Shield,
                title: "Verified Profiles",
                description: "GitHub integration and certificate verification for authentic portfolios",
                gradient: "from-secondary/20 to-secondary/5"
              },
              {
                icon: Sparkles,
                title: "AI Mentor",
                description: "Get personalized guidance and actionable recommendations",
                gradient: "from-primary/20 to-accent/5"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card variant="interactive" className={`p-6 h-full bg-gradient-to-br ${feature.gradient}`}>
                  <div className="w-12 h-12 rounded-xl bg-background/80 flex items-center justify-center mb-4 shadow-sm">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <Card variant="glass" className="p-12 text-center relative overflow-hidden">
              {/* Background glow */}
              <div className="absolute inset-0 bg-gradient-primary opacity-10" />
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/30 rounded-full blur-3xl" />
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-accent/30 rounded-full blur-3xl" />
              
              <div className="relative z-10">
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-6 shadow-glow"
                >
                  <Sparkles className="w-8 h-8 text-white" />
                </motion.div>
                
                <h2 className="text-4xl md:text-5xl font-bold mb-4">
                  Ready to <span className="text-gradient">Get Started?</span>
                </h2>
                <p className="text-xl text-muted-foreground mb-8 max-w-xl mx-auto">
                  Join the future of campus placements. Your growth story begins here.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="xl"
                    variant="glow"
                    className="text-lg group"
                    onClick={() => navigate("/student/login")}
                  >
                    Student Portal
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button
                    size="xl"
                    variant="outline"
                    className="text-lg"
                    onClick={() => navigate("/recruiter/login")}
                  >
                    Recruiter Portal
                  </Button>
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
              <div className="w-6 h-6 rounded bg-gradient-primary flex items-center justify-center">
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
