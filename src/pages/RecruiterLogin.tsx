import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase, Mail, Eye, EyeOff, ArrowLeft, Users, BarChart3, Target, Building2 } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { recruiterApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const features = [
  { icon: Users, text: "Access Verified Talent Pool" },
  { icon: BarChart3, text: "Data-Driven Hiring Insights" },
  { icon: Target, text: "AI-Matched Candidates" },
];

const RecruiterLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Signup form states
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupCompany, setSignupCompany] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response: any = await recruiterApi.login({ email, password });
      
      // Store token and user data
      localStorage.setItem('token', response.token);
      localStorage.setItem('userType', 'recruiter');
      localStorage.setItem('recruiterData', JSON.stringify(response.recruiter));

      toast({
        title: "Login successful!",
        description: `Welcome back, ${response.recruiter.name}!`,
      });

      navigate("/recruiter/dashboard");
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response: any = await recruiterApi.signup({
        name: signupName,
        email: signupEmail,
        password: signupPassword,
        company: signupCompany,
      });

      // Store token and user data
      localStorage.setItem('token', response.token);
      localStorage.setItem('userType', 'recruiter');
      localStorage.setItem('recruiterData', JSON.stringify(response.recruiter));

      toast({
        title: "Account created!",
        description: `Welcome to Shinchronize, ${response.recruiter.name}!`,
      });

      navigate("/recruiter/dashboard");
    } catch (error: any) {
      toast({
        title: "Signup failed",
        description: error.message || "Could not create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Gradient Background - Accent/Emerald toned for recruiters */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-background to-secondary/10" />
        
        {/* Animated Orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-accent/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-secondary/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center p-12 max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-teal-400 flex items-center justify-center shadow-glow-accent">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold">
                <span className="text-accent">Shinchronize</span>
                <span className="text-muted-foreground text-lg ml-2">for Recruiters</span>
              </span>
            </div>
            
            <h1 className="text-4xl font-bold mb-4">
              Find Your Next
              <br />
              <span className="bg-gradient-to-r from-accent to-teal-400 bg-clip-text text-transparent">Star Performers</span>
            </h1>
            
            <p className="text-muted-foreground text-lg mb-8">
              Access pre-verified, job-ready candidates with detailed skill profiles and growth trajectories.
            </p>
            
            <div className="space-y-4">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-accent" />
                  </div>
                  <span className="text-foreground">{feature.text}</span>
                </motion.div>
              ))}
            </div>
            
            {/* Stats */}
            <div className="mt-10 pt-8 border-t border-border/50">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-2xl font-bold text-accent">10K+</p>
                  <p className="text-sm text-muted-foreground">Active Students</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-accent">500+</p>
                  <p className="text-sm text-muted-foreground">Partner Colleges</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-accent">95%</p>
                  <p className="text-sm text-muted-foreground">Placement Rate</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative">
        {/* Mobile background */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-secondary/5 lg:hidden" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md relative"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-teal-400 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-accent">Shinchronize</span>
            </div>
            <p className="text-sm text-muted-foreground">Recruiter Portal</p>
          </div>

          <Card variant="glass" className="border-border/50">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl">Recruiter Access</CardTitle>
              <CardDescription>Discover candidates beyond test scores</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login" className="mt-0">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Work Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="recruiter@company.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          disabled={isLoading}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <Button 
                          type="button" 
                          variant="link" 
                          className="px-0 h-auto text-xs text-muted-foreground hover:text-accent"
                        >
                          Forgot password?
                        </Button>
                      </div>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showLoginPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          disabled={isLoading}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword((prev) => !prev)}
                          className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                          aria-label={showLoginPassword ? "Hide password" : "Show password"}
                        >
                          {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <Button 
                      type="submit" 
                      variant="gradient-accent"
                      className="w-full" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Signing in...
                        </span>
                      ) : "Sign In"}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup" className="mt-0">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Jane Smith"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="company"
                          type="text"
                          placeholder="Tech Corp"
                          value={signupCompany}
                          onChange={(e) => setSignupCompany(e.target.value)}
                          required
                          disabled={isLoading}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Work Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="recruiter@company.com"
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          required
                          disabled={isLoading}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="signup-password"
                          type={showSignupPassword ? "text" : "password"}
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          required
                          disabled={isLoading}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignupPassword((prev) => !prev)}
                          className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                          aria-label={showSignupPassword ? "Hide password" : "Show password"}
                        >
                          {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <Button 
                      type="submit" 
                      variant="gradient-accent"
                      className="w-full" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Creating Account...
                        </span>
                      ) : "Create Account"}
                    </Button>
                    
                    <p className="text-xs text-muted-foreground text-center">
                      By signing up, you agree to our{" "}
                      <Button variant="link" className="p-0 h-auto text-xs">Terms of Service</Button>
                      {" "}and{" "}
                      <Button variant="link" className="p-0 h-auto text-xs">Privacy Policy</Button>
                    </p>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="flex items-center justify-center mt-6">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default RecruiterLogin;
