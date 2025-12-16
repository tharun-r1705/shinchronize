import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  GraduationCap, 
  Mail, 
  Eye, 
  EyeOff, 
  Github, 
  CheckCircle2, 
  Link as LinkIcon,
  Sparkles,
  Shield,
  TrendingUp,
  Code2,
  Loader2,
  Info,
  Star,
  Zap,
  ArrowLeft,
  Chrome,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { studentApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import CollegeAutocomplete from "@/components/CollegeAutocomplete";

const StudentLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Signup form states
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [signupCollege, setSignupCollege] = useState("");
  const [githubUsername, setGithubUsername] = useState("");
  const [githubConnected, setGithubConnected] = useState(false);
  const [githubConnectedUsername, setGithubConnectedUsername] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);
  const [showGithubOptions, setShowGithubOptions] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // OAuth and GitHub handle dialog states
  const [showGithubHandleDialog, setShowGithubHandleDialog] = useState(false);
  const [oauthGithubHandle, setOauthGithubHandle] = useState("");
  const [isSubmittingGithubHandle, setIsSubmittingGithubHandle] = useState(false);

  // Check for OAuth callbacks (GitHub and Google)
  useEffect(() => {
    const tab = searchParams.get('tab');
    const githubStatus = searchParams.get('github');
    const githubConnected = searchParams.get('githubconnected');
    const googleConnected = searchParams.get('googleconnected');
    const username = searchParams.get('username');
    const error = searchParams.get('error');
    const oauthLogin = searchParams.get('oauth_login');
    const oauthSignup = searchParams.get('oauth_signup');
    const token = searchParams.get('token');
    const needsProfile = searchParams.get('needs_profile');

    // Handle GitHub OAuth success with token
    if (githubConnected === 'true' && token) {
      console.log('✅ GitHub OAuth completed with token');
      localStorage.setItem('token', token);
      localStorage.setItem('userType', 'student');
      toast({
        title: "GitHub Login Successful!",
        description: `Welcome ${username || 'back'}!`,
      });
      navigate("/student/dashboard");
      return;
    }

    // Handle Google OAuth success with token
    if (googleConnected === 'true' && token) {
      console.log('✅ Google OAuth completed with token');
      localStorage.setItem('token', token);
      localStorage.setItem('userType', 'student');
      toast({
        title: "Google Login Successful!",
        description: "Welcome back!",
      });
      navigate("/student/dashboard");
      return;
    }

    // Handle legacy OAuth success redirects (without token - for backward compatibility)
    if (githubConnected === 'true' || googleConnected === 'true') {
      const provider = githubConnected === 'true' ? 'GitHub' : 'Google';
      toast({
        title: `${provider} Connected!`,
        description: `Successfully authenticated with ${provider}. Please check your profile.`,
      });
      // If no token, redirect to dashboard anyway (user might already be logged in)
      navigate("/student/dashboard");
      return;
    }

    if (error) {
      const message = searchParams.get('message') || 'OAuth connection failed';
      toast({
        title: error === 'account_exists' ? "Account Already Exists" : 
               error === 'account_not_found' ? "Account Not Found" :
               error === 'no_email' ? "No Email Found" :
               "OAuth Failed",
        description: decodeURIComponent(message),
        variant: "destructive",
      });
      // Clean URL
      window.history.replaceState({}, '', '/student/login');
    }

    // Handle Google OAuth login success
    if (oauthLogin === 'success' && token) {
      localStorage.setItem('token', token);
      localStorage.setItem('userType', 'student');
      toast({
        title: "Login successful!",
        description: "Welcome back!",
      });
      navigate("/student/dashboard");
      return;
    }

    // Handle Google OAuth signup success - show GitHub handle dialog
    if (oauthSignup === 'success' && token && needsProfile === 'true') {
      localStorage.setItem('token', token);
      localStorage.setItem('userType', 'student');
      setShowGithubHandleDialog(true);
      // Clean URL
      window.history.replaceState({}, '', '/student/login');
      return;
    }

    // Handle GitHub OAuth callback
    if (githubStatus === 'connected' && username) {
      setGithubConnected(true);
      setGithubConnectedUsername(username);
      toast({
        title: "GitHub Connected!",
        description: `Successfully connected to GitHub as ${username}`,
      });
    }

    // Auto-switch to signup tab if GitHub OAuth completed
    if (tab === 'signup' && githubStatus === 'connected') {
      // Tab will be set by Tabs component defaultValue logic
    }
  }, [searchParams, toast, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response: any = await studentApi.login({ email, password });
      
      // Store token and user data
      localStorage.setItem('token', response.token);
      localStorage.setItem('userType', 'student');
      localStorage.setItem('studentData', JSON.stringify(response.student));

      toast({
        title: "Login successful!",
        description: `Welcome back, ${response.student.name}!`,
      });

      navigate("/student/dashboard");
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

    if (signupPassword !== signupConfirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please ensure both password fields are identical.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const signupData: any = {
        name: signupName,
        email: signupEmail,
        password: signupPassword,
        college: signupCollege,
      };

      // Add manual GitHub username if provided (and OAuth not used)
      if (!githubConnected && githubUsername.trim()) {
        signupData.githubUsername = githubUsername.trim();
      }

      const response: any = await studentApi.signup(signupData);

      // Store token and user data
      localStorage.setItem('token', response.token);
      localStorage.setItem('userType', 'student');
      localStorage.setItem('studentData', JSON.stringify(response.student));

      toast({
        title: "Account created!",
        description: `Welcome to EvolvEd, ${response.student.name}!`,
      });

      navigate("/student/dashboard");
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

  const handleGitHubConnect = (e?: React.MouseEvent) => {
    e?.preventDefault();
    console.log('🚀 GitHub OAuth button clicked - redirecting to backend');
    // Redirect to backend OAuth endpoint - backend handles all OAuth logic
    // Must use absolute URL to reach backend server on port 5001
    window.location.href = 'http://localhost:5001/api/github/login';
  };

  const handleGoogleOAuth = (e?: React.MouseEvent) => {
    e?.preventDefault();
    console.log('🚀 Google OAuth button clicked - redirecting to backend');
    // Redirect to backend OAuth endpoint - backend handles all OAuth logic
    // Must use absolute URL to reach backend server on port 5001
    window.location.href = 'http://localhost:5001/api/google/login';
  };

  const handleGitHubOAuth = (e?: React.MouseEvent) => {
    e?.preventDefault();
    console.log('🚀 GitHub OAuth button clicked - redirecting to backend');
    // Redirect to backend OAuth endpoint - backend handles all OAuth logic
    // Must use absolute URL to reach backend server on port 5001
    window.location.href = 'http://localhost:5001/api/github/login';
  };

  const handleSubmitGithubHandle = async () => {
    setIsSubmittingGithubHandle(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      // Call API to link GitHub username
      if (oauthGithubHandle.trim()) {
        await fetch('http://localhost:5001/api/github/link-manual', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ githubUsername: oauthGithubHandle.trim() }),
        });
      }

      toast({
        title: "Profile Updated!",
        description: oauthGithubHandle.trim() ? `GitHub linked as ${oauthGithubHandle}` : "You can add GitHub later from your profile",
      });

      setShowGithubHandleDialog(false);
      navigate("/student/dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingGithubHandle(false);
    }
  };

  const handleSkipGithubHandle = () => {
    setShowGithubHandleDialog(false);
    navigate("/student/dashboard");
  };

  // Calculate password strength
  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 10;
    return Math.min(strength, 100);
  };

  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(signupPassword));
  }, [signupPassword]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-4 left-4 z-20"
        onClick={() => navigate('/')}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      {/* GitHub Handle Collection Dialog */}
      <Dialog open={showGithubHandleDialog} onOpenChange={setShowGithubHandleDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect Your GitHub</DialogTitle>
            <DialogDescription>
              Add your GitHub username to boost your profile credibility and readiness score. You can also skip this step and add it later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="oauth-github-handle">GitHub Username (Optional)</Label>
              <div className="relative">
                <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="oauth-github-handle"
                  placeholder="yourusername"
                  value={oauthGithubHandle}
                  onChange={(e) => setOauthGithubHandle(e.target.value)}
                  className="pl-10"
                  disabled={isSubmittingGithubHandle}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Enter your GitHub username to automatically validate your coding skills
              </p>
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={handleSkipGithubHandle}
              disabled={isSubmittingGithubHandle}
            >
              Skip for now
            </Button>
            <Button
              onClick={handleSubmitGithubHandle}
              disabled={isSubmittingGithubHandle}
            >
              {isSubmittingGithubHandle ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
      
      {/* Floating elements for visual interest */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse delay-1000" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-6xl relative z-10 grid lg:grid-cols-2 gap-8 items-center"
      >
        {/* Left side - Benefits & Branding */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="hidden lg:block space-y-8"
        >
          <div>
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-primary rounded-3xl mb-6 shadow-lg">
              <GraduationCap className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
              EvolvEd
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Your placement readiness companion
            </p>
          </div>

          <div className="space-y-6">
            <h3 className="text-2xl font-semibold">Why join EvolvEd?</h3>
            
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex gap-4 items-start p-4 rounded-xl bg-card/50 backdrop-blur border"
            >
              <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">Track Your Progress</h4>
                <p className="text-sm text-muted-foreground">
                  Real-time readiness score based on projects, coding activity, and certifications
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex gap-4 items-start p-4 rounded-xl bg-card/50 backdrop-blur border"
            >
              <div className="flex items-center justify-center w-12 h-12 bg-green-500/10 rounded-lg flex-shrink-0">
                <Github className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">GitHub Integration</h4>
                <p className="text-sm text-muted-foreground">
                  Automatically validate your coding skills and showcase real projects
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="flex gap-4 items-start p-4 rounded-xl bg-card/50 backdrop-blur border"
            >
              <div className="flex items-center justify-center w-12 h-12 bg-blue-500/10 rounded-lg flex-shrink-0">
                <Star className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">Stand Out to Recruiters</h4>
                <p className="text-sm text-muted-foreground">
                  Verified badges and trust indicators make your profile shine
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="flex gap-4 items-start p-4 rounded-xl bg-card/50 backdrop-blur border"
            >
              <div className="flex items-center justify-center w-12 h-12 bg-yellow-500/10 rounded-lg flex-shrink-0">
                <Sparkles className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">AI-Powered Insights</h4>
                <p className="text-sm text-muted-foreground">
                  Get personalized recommendations to boost your placement chances
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Right side - Auth Form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="text-center mb-6 lg:hidden">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl mb-4">
              <GraduationCap className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              EvolvEd Student Portal
            </h1>
            <p className="text-muted-foreground mt-2">Track your placement readiness journey</p>
          </div>

        <Card className="shadow-2xl border-2 backdrop-blur-sm bg-card/95">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>Sign in to continue your learning journey</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Tabs defaultValue={searchParams.get('tab') === 'signup' ? 'signup' : 'login'} className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-11">
                <TabsTrigger value="login" className="text-base">Login</TabsTrigger>
                <TabsTrigger value="signup" className="text-base">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-4 mt-6">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="student@university.edu"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                        className="pl-10 h-11"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showLoginPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        className="h-11"
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
                  <Button type="submit" className="w-full bg-gradient-primary h-11 font-semibold" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11"
                      onClick={handleGoogleOAuth}
                      disabled={isLoading}
                    >
                      <Chrome className="w-4 h-4 mr-2" />
                      Google
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11"
                      onClick={handleGitHubOAuth}
                      disabled={isLoading}
                    >
                      <Github className="w-4 h-4 mr-2" />
                      GitHub
                    </Button>
                  </div>
                </form>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4 mt-6">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      required
                      disabled={isLoading}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="student@university.edu"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        required
                        disabled={isLoading}
                        className="pl-10 h-11"
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
                        className="h-11"
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
                    {/* Password Strength Indicator */}
                    {signupPassword && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-1"
                      >
                        <div className="flex gap-1">
                          {[0, 1, 2, 3].map((i) => (
                            <div
                              key={i}
                              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                                passwordStrength > i * 25
                                  ? passwordStrength <= 50
                                    ? 'bg-red-500'
                                    : passwordStrength <= 75
                                    ? 'bg-yellow-500'
                                    : 'bg-green-500'
                                  : 'bg-muted'
                              }`}
                            />
                          ))}
                        </div>
                        <p className={`text-xs font-medium ${
                          passwordStrength <= 50
                            ? 'text-red-600'
                            : passwordStrength <= 75
                            ? 'text-yellow-600'
                            : 'text-green-600'
                        }`}>
                          {passwordStrength <= 50
                            ? 'Weak password'
                            : passwordStrength <= 75
                            ? 'Good password'
                            : 'Strong password'}
                        </p>
                      </motion.div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-confirm-password"
                        type={showSignupConfirmPassword ? "text" : "password"}
                        value={signupConfirmPassword}
                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        className="h-11"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupConfirmPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={showSignupConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showSignupConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="college">College / University</Label>
                    <CollegeAutocomplete
                      inputId="college"
                      value={signupCollege}
                      onChange={setSignupCollege}
                      disabled={isLoading}
                      placeholder="Start typing your college"
                    />
                  </div>

                  {/* GitHub Connection Section - Enhanced */}
                  <div className="space-y-4 pt-3">
                    <Separator />
                    
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Label className="text-base font-semibold">
                              Connect GitHub
                            </Label>
                            <Badge variant="secondary" className="text-xs">
                              Recommended
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Boost your profile credibility and readiness score
                          </p>
                        </div>
                        {githubConnected && (
                          <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-700">
                            <CheckCircle2 className="w-3 h-3" />
                            Connected
                          </Badge>
                        )}
                      </div>

                      {/* Benefits Section */}
                      {!githubConnected && !showGithubOptions && (
                        <Alert className="border-primary/20 bg-primary/5">
                          <Sparkles className="h-4 w-4 text-primary" />
                          <AlertDescription className="text-xs space-y-2">
                            <p className="font-medium">Why connect GitHub?</p>
                            <ul className="space-y-1 ml-4">
                              <li className="flex items-center gap-2">
                                <Shield className="w-3 h-3 text-green-600" />
                                <span>Verified coding skills & projects</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <TrendingUp className="w-3 h-3 text-blue-600" />
                                <span>+5 points to readiness score</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <Star className="w-3 h-3 text-yellow-600" />
                                <span>Stand out to recruiters</span>
                              </li>
                            </ul>
                          </AlertDescription>
                        </Alert>
                      )}

                      {githubConnected ? (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="relative overflow-hidden"
                        >
                          <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-2 border-green-200 dark:border-green-800 rounded-lg">
                            <div className="flex items-center justify-center w-12 h-12 bg-white dark:bg-gray-900 rounded-full border-2 border-green-500">
                              <Github className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-green-900 dark:text-green-100 flex items-center gap-2">
                                GitHub Connected
                                <Zap className="w-4 h-4 text-yellow-500" />
                              </p>
                              <p className="text-xs text-green-700 dark:text-green-300 font-mono">
                                @{githubConnectedUsername}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline" className="text-xs border-green-600 text-green-700 dark:text-green-300">
                                OAuth Verified
                              </Badge>
                            </div>
                          </div>
                          {/* Sparkle animation */}
                          <div className="absolute top-2 right-2 animate-pulse">
                            <Sparkles className="w-4 h-4 text-yellow-500" />
                          </div>
                        </motion.div>
                      ) : (
                        <AnimatePresence mode="wait">
                          {!showGithubOptions ? (
                            <motion.div
                              key="initial"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="space-y-2"
                            >
                              <Button
                                type="button"
                                variant="outline"
                                className="w-full gap-2 h-11 border-2 hover:border-gray-900 dark:hover:border-gray-100 transition-all group"
                                onClick={() => setShowGithubOptions(true)}
                                disabled={isLoading}
                              >
                                <Github className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                <span className="font-medium">Connect GitHub Account</span>
                              </Button>
                              <p className="text-xs text-center text-muted-foreground">
                                Or skip for now (can connect later)
                              </p>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="expanded"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="space-y-4"
                            >
                              {/* OAuth Button - Primary */}
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Shield className="w-4 h-4 text-green-600" />
                                  <span className="text-sm font-medium">Recommended Method</span>
                                </div>
                                <Button
                                  type="button"
                                  className="w-full gap-2 h-12 bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-gray-200 text-white dark:text-gray-900 transition-all group"
                                  onClick={handleGitHubConnect}
                                  disabled={isLoading}
                                >
                                  {isLoading ? (
                                    <>
                                      <Loader2 className="w-5 h-5 animate-spin" />
                                      <span>Connecting...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Github className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                      <span className="font-semibold">Continue with GitHub OAuth</span>
                                      <Badge variant="secondary" className="ml-auto bg-green-600 text-white text-xs">
                                        Verified
                                      </Badge>
                                    </>
                                  )}
                                </Button>
                                <div className="flex items-start gap-2 p-2 bg-green-50 dark:bg-green-950/20 rounded-md">
                                  <Info className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                  <p className="text-xs text-green-700 dark:text-green-300">
                                    Secure authentication via GitHub. Your profile will be marked as "GitHub Verified"
                                  </p>
                                </div>
                              </div>

                              <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                  <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                  <span className="bg-card px-2 text-muted-foreground">Or enter manually</span>
                                </div>
                              </div>

                              {/* Manual Username Input - Alternative */}
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Code2 className="w-4 h-4 text-blue-600" />
                                  <Label htmlFor="github-username" className="text-sm font-medium">
                                    GitHub Username
                                  </Label>
                                  <Badge variant="outline" className="text-xs">
                                    Unverified
                                  </Badge>
                                </div>
                                <div className="relative">
                                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                  <Input
                                    id="github-username"
                                    type="text"
                                    placeholder="octocat"
                                    value={githubUsername}
                                    onChange={(e) => setGithubUsername(e.target.value)}
                                    disabled={isLoading}
                                    className="pl-10"
                                  />
                                </div>
                                <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                                  <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                  <span>Manual entry will be marked as unverified. Use OAuth above for full benefits.</span>
                                </p>
                              </div>

                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="w-full text-xs"
                                onClick={() => setShowGithubOptions(false)}
                              >
                                Skip GitHub connection
                              </Button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      )}
                    </div>
                  </div>

                  <Button type="submit" className="w-full bg-gradient-primary h-11 font-semibold" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Create Account
                      </>
                    )}
                  </Button>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Or sign up with</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11"
                      onClick={handleGoogleOAuth}
                      disabled={isLoading}
                    >
                      <Chrome className="w-4 h-4 mr-2" />
                      Google
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11"
                      onClick={handleGitHubOAuth}
                      disabled={isLoading}
                    >
                      <Github className="w-4 h-4 mr-2" />
                      GitHub
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="text-center mt-6 space-y-2">
          <p className="text-xs text-muted-foreground">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </p>
          <Button
            variant="link"
            onClick={() => navigate("/")}
            className="text-muted-foreground text-sm"
          >
            ← Back to Home
          </Button>
        </div>
      </motion.div>
      </motion.div>
    </div>
  );
};

export default StudentLogin;
