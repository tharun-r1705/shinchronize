import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TrendingUp, Users, BarChart3, Award, CalendarX2 } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary opacity-10" />
        <div className="container mx-auto px-4 py-20 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-primary/10 rounded-full">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-primary">The Future of Campus Placements</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
              EvolvEd
            </h1>
            
            <p className="text-2xl md:text-3xl font-semibold mb-4 text-foreground">
              Redefining Campus Placements
            </p>
            <p className="text-xl md:text-2xl mb-8 text-muted-foreground">
              From Snapshots to Growth Stories
            </p>
            
            <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
              Track skills, consistency, and growth. Recruiters see effort, not just one-day scores.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button
                size="lg"
                className="text-lg px-8 py-6 bg-gradient-primary hover:opacity-90 transition-opacity"
                onClick={() => navigate("/student/login")}
              >
                For Students
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                onClick={() => navigate("/recruiter/login")}
              >
                For Recruiters
              </Button>
            </div>

            {/* Visual Comparison */}
            <Card className="p-8 shadow-card max-w-3xl mx-auto">
              <div className="grid md:grid-cols-2 gap-8">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-center p-6 rounded-lg bg-muted/50"
                >
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2 text-muted-foreground">Traditional Approach</h3>
                  <p className="text-sm text-muted-foreground">One-day exam snapshot</p>
                  <div className="mt-6 flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                      <CalendarX2 className="w-8 h-8 text-muted-foreground" />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-center p-6 rounded-lg bg-gradient-primary/10"
                >
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 text-primary" />
                  <h3 className="font-semibold mb-2 text-primary">EvolvEd Approach</h3>
                  <p className="text-sm text-foreground">Continuous growth tracking</p>
                  <div className="mt-4 h-24 flex items-end justify-center gap-1">
                    <div className="w-3 h-8 bg-gradient-primary rounded" />
                    <div className="w-3 h-12 bg-gradient-primary rounded" />
                    <div className="w-3 h-16 bg-gradient-primary rounded" />
                    <div className="w-3 h-20 bg-gradient-primary rounded" />
                    <div className="w-3 h-24 bg-gradient-primary rounded" />
                  </div>
                </motion.div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Why Choose EvolvEd?</h2>
            <p className="text-xl text-muted-foreground">Comprehensive tracking meets intelligent insights</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: TrendingUp,
                title: "Growth Tracking",
                description: "Monitor skills development over time with detailed analytics and AI-powered insights"
              },
              {
                icon: Users,
                title: "For Recruiters",
                description: "Find consistent, growth-oriented candidates beyond just test scores"
              },
              {
                icon: Award,
                title: "Gamification",
                description: "Earn badges, maintain streaks, and showcase your learning journey"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 h-full hover:shadow-glow transition-shadow">
                  <feature.icon className="w-12 h-12 mb-4 text-primary" />
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center"
          >
            <Card className="p-12 bg-gradient-primary text-primary-foreground shadow-glow">
              <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-xl mb-8 opacity-90">
                Join the future of campus placements today
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  variant="secondary"
                  className="text-lg px-8 py-6"
                  onClick={() => navigate("/student/login")}
                >
                  Student Portal
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 py-6 bg-transparent border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
                  onClick={() => navigate("/recruiter/login")}
                >
                  Recruiter Portal
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Index;
