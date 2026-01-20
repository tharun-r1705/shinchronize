import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Target,
  Loader2,
  Brain,
  X,
  Zap,
  ShieldCheck,
  Search,
  ArrowRight,
  ListChecks,
  History,
  Star
} from 'lucide-react';
import { StudentNavbar } from "@/components/StudentNavbar";
import { studentApi } from '@/lib/api';

interface ResumeAnalysis {
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  sections: {
    name: string;
    score: number;
    feedback: string;
  }[];
  keywords: {
    present: string[];
    missing: string[];
  };
  formatting: {
    score: number;
    issues: string[];
  };
  atsScore?: number;
  atsInsights?: string[];
}

const ScoreCircle = ({ score, label, colorClass, size = "lg" }: { score: number, label: string, colorClass: string, size?: "sm" | "lg" }) => {
  const radius = size === "lg" ? 45 : 35;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`relative ${size === "lg" ? "w-32 h-32" : "w-24 h-24"}`}>
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx={size === "lg" ? "64" : "48"}
            cy={size === "lg" ? "64" : "48"}
            r={radius}
            stroke="currentColor"
            strokeWidth={size === "lg" ? "8" : "6"}
            fill="transparent"
            className="text-muted/20"
          />
          <motion.circle
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeOut" }}
            cx={size === "lg" ? "64" : "48"}
            cy={size === "lg" ? "64" : "48"}
            r={radius}
            stroke="currentColor"
            strokeWidth={size === "lg" ? "8" : "6"}
            strokeDasharray={circumference}
            fill="transparent"
            className={colorClass}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-bold ${size === "lg" ? "text-3xl" : "text-xl"}`}>{score}%</span>
        </div>
      </div>
      <span className="text-sm font-medium text-muted-foreground tracking-tight">{label}</span>
    </div>
  );
};

export default function ResumeAnalyzer() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resumeText, setResumeText] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [error, setError] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setUploadedFile(file);
    setError('');
    setIsExtracting(true);
    setResumeText('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/student/login');
        return;
      }

      const data = await studentApi.extractResumeText(file, token);
      if (!data?.text) {
        throw new Error('The server did not return any extracted text. Please try another PDF or use Paste Text.');
      }
      setResumeText(data.text.trim());
    } catch (err: any) {
      console.error('PDF extraction error:', err);
      setError(err.message || 'Failed to extract text from PDF.');
      setUploadedFile(null);
      setResumeText('');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setResumeText('');
    setError('');
    setAnalysis(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    setAnalysis(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleAnalyze = async () => {
    if (!resumeText.trim()) {
      setError('Please upload a PDF or paste your resume text');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/student/login');
        return;
      }

      const response = await studentApi.analyzeResume(
        { resumeText, targetRole: targetRole || 'Software Engineer' },
        token
      ) as { analysis: ResumeAnalysis };

      setAnalysis(response.analysis);
      setTimeout(() => {
        document.getElementById('analysis-results')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      console.error('Resume analysis error:', err);
      setError(err.message || 'Failed to analyze resume. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColorClass = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-rose-500';
  };

  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      <StudentNavbar />

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-card border-b">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
        <div className="container mx-auto px-4 py-16 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl"
          >
            <Badge variant="outline" className="mb-6 border-primary/20 bg-primary/5 text-primary px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 mr-2 animate-pulse" />
              Next-Gen AI Resume Intelligence
            </Badge>
            <h1 className="text-5xl md:text-6xl font-black mb-6 tracking-tight leading-[1.1]">
              Elevate Your Resume to <span className="bg-gradient-accent bg-clip-text text-transparent italic">Elite Levels</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
              Precision ATS analysis, strategic keyword injection, and behavioral feedback
              engineered to help you bypass algorithms and impress top-tier hiring managers.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-12">
        <div className="grid lg:grid-cols-12 gap-10">
          {/* Input Panel */}
          <div className="lg:col-span-5 space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="shadow-2xl border-primary/5 rounded-[2rem] overflow-hidden bg-card/80 backdrop-blur-xl">
                <CardHeader className="bg-muted/30 pb-6 border-b border-primary/5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shadow-inner">
                      <Zap className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold">Resume Input</CardTitle>
                      <CardDescription className="text-sm">Configure your analysis parameters</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-8 space-y-8">
                  <div className="space-y-3">
                    <label className="text-sm font-bold flex items-center gap-2 text-muted-foreground uppercase tracking-widest">
                      <Target className="w-4 h-4" />
                      Target Role
                    </label>
                    <div className="relative group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <input
                        type="text"
                        placeholder="e.g. Senior Software Engineer"
                        value={targetRole}
                        onChange={(e) => setTargetRole(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 border-2 border-muted bg-muted/20 rounded-2xl focus:border-primary/50 focus:bg-background transition-all outline-none font-medium"
                      />
                    </div>
                  </div>

                  <Tabs defaultValue="upload" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 p-1.5 bg-muted rounded-[1.25rem] mb-8">
                      <TabsTrigger value="upload" className="rounded-xl py-2.5 font-bold data-[state=active]:bg-background data-[state=active]:shadow-xl">
                        <Upload className="w-4 h-4 mr-2" />
                        PDF Upload
                      </TabsTrigger>
                      <TabsTrigger value="paste" className="rounded-xl py-2.5 font-bold data-[state=active]:bg-background data-[state=active]:shadow-xl">
                        <ListChecks className="w-4 h-4 mr-2" />
                        Paste Content
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="upload" className="space-y-6 focus-visible:outline-none">
                      {!uploadedFile ? (
                        <div
                          onClick={handleUploadClick}
                          className="group border-2 border-dashed border-primary/10 rounded-3xl p-12 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/[0.02] transition-all duration-500 ease-out"
                        >
                          <div className="w-20 h-20 bg-primary/5 rounded-[2rem] flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-500">
                            <Upload className="w-10 h-10 text-primary/60 group-hover:text-primary" />
                          </div>
                          <h3 className="font-black text-2xl mb-2 tracking-tight">Drop your PDF</h3>
                          <p className="text-muted-foreground mb-8 max-w-[200px] mx-auto leading-relaxed">Select a PDF file from your device to begin</p>
                          <div className="flex justify-center gap-2">
                            <Badge variant="outline" className="px-4 py-1.5 rounded-full bg-background border-primary/5 text-[10px] font-bold uppercase tracking-tighter">MAX 5MB</Badge>
                            <Badge variant="outline" className="px-4 py-1.5 rounded-full bg-background border-primary/5 text-[10px] font-bold uppercase tracking-tighter">PDF ONLY</Badge>
                          </div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </div>
                      ) : (
                        <div className="border-2 rounded-3xl p-6 bg-card shadow-2xl border-primary/10 relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-8 opacity-5">
                            <FileText className="w-24 h-24" />
                          </div>
                          <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-5">
                              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center shadow-inner">
                                <FileText className="w-7 h-7 text-primary" />
                              </div>
                              <div>
                                <p className="font-black text-base truncate max-w-[180px]">
                                  {uploadedFile.name}
                                </p>
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                  {(uploadedFile.size / 1024).toFixed(1)} KB
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={handleRemoveFile}
                              className="rounded-2xl hover:bg-rose-500 hover:text-white transition-all h-10 w-10"
                            >
                              <X className="w-5 h-5" />
                            </Button>
                          </div>
                          {isExtracting && (
                            <div className="mt-6 p-4 bg-primary/5 rounded-2xl flex items-center gap-4 text-xs font-bold text-primary border border-primary/5">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span className="animate-pulse tracking-widest uppercase italic">Synthesizing Document Data...</span>
                            </div>
                          )}
                        </div>
                      )}

                      {resumeText && uploadedFile && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-3 pt-2"
                        >
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
                            Parsed Output
                          </label>
                          <div className="relative group">
                            <Textarea
                              value={resumeText}
                              onChange={(e) => setResumeText(e.target.value)}
                              className="min-h-[200px] font-mono text-xs p-6 bg-muted/30 border-none rounded-3xl group-focus-within:bg-background transition-all shadow-inner"
                            />
                            <div className="absolute bottom-4 right-4">
                              <Badge className="bg-primary/10 text-primary border-none text-[10px] font-bold">
                                {resumeText.length} CHARS
                              </Badge>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </TabsContent>

                    <TabsContent value="paste" className="space-y-6 focus-visible:outline-none">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Full Content</label>
                        <Textarea
                          placeholder="Paste the entire text of your resume here..."
                          value={resumeText}
                          onChange={(e) => setResumeText(e.target.value)}
                          className="min-h-[350px] text-sm p-6 border-none bg-muted/30 focus:bg-background rounded-3xl transition-all shadow-inner leading-relaxed"
                        />
                        <div className="flex justify-end p-2">
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                            Payload: <span className="text-primary">{resumeText.length}</span> / 15K
                          </p>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>

                  {error && (
                    <Alert variant="destructive" className="bg-rose-50 border-rose-100 text-rose-600 rounded-2xl shadow-sm border-2">
                      <AlertCircle className="h-5 w-5" />
                      <AlertDescription className="text-xs font-bold tracking-tight">{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || isExtracting || !resumeText.trim()}
                    className="w-full py-8 rounded-2xl shadow-2xl shadow-primary/30 bg-gradient-to-r from-primary via-blue-600 to-secondary hover:translate-y-[-2px] active:translate-y-[1px] transition-all font-black text-xl tracking-tight overflow-hidden group relative"
                  >
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {isAnalyzing ? (
                      <div className="flex items-center gap-4">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span className="uppercase tracking-[0.1em] text-sm italic">Engine Processing...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                        <span>ANALYZE RESUME</span>
                        <ArrowRight className="w-5 h-5 ml-1 group-hover:translate-x-2 transition-transform" />
                      </div>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Pro Tip Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="p-8 bg-black rounded-[2rem] text-white shadow-2xl relative overflow-hidden group"
            >
              <div className="absolute -bottom-6 -right-6 p-4 opacity-5 group-hover:scale-125 group-hover:opacity-10 transition-all duration-700">
                <Brain className="w-48 h-48" />
              </div>
              <div className="relative z-10 space-y-4">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                  <Star className="w-6 h-6 text-yellow-400" />
                </div>
                <h4 className="font-black text-2xl tracking-tight">AI Strategy</h4>
                <p className="text-white/60 leading-relaxed font-medium">
                  "ATS systems scan for nouns. Convert your achievements into hard outcomes using action verbs and technical keywords mentioned in the job post."
                </p>
              </div>
            </motion.div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-7" id="analysis-results">
            <AnimatePresence mode="wait">
              {!analysis && !isAnalyzing ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="h-full"
                >
                  <Card className="h-full border-dashed border-2 border-primary/10 bg-muted/10 flex flex-col items-center justify-center p-16 text-center rounded-[3rem] min-h-[600px] shadow-inner">
                    <div className="w-32 h-32 bg-card rounded-[2.5rem] shadow-2xl border border-primary/5 flex items-center justify-center mb-10 relative group">
                      <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full group-hover:bg-primary/40 transition-all duration-700" />
                      <Search className="w-12 h-12 text-primary opacity-20 relative z-10" />
                    </div>
                    <h3 className="text-3xl font-black mb-4 tracking-tighter">Ready for Inspection</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto mb-12 text-lg leading-relaxed">
                      Power up our AI engine by providing your resume details on the left.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-xl">
                      {[
                        { icon: ShieldCheck, label: "ATS Vigor", color: "text-blue-500" },
                        { icon: Zap, label: "Precision", color: "text-amber-500" },
                        { icon: Brain, label: "AI Insights", color: "text-purple-500" }
                      ].map((item, i) => (
                        <div key={i} className="p-6 bg-card rounded-3xl border border-primary/5 flex flex-col items-center gap-3 shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300">
                          <item.icon className={`w-6 h-6 ${item.color}`} />
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              ) : isAnalyzing ? (
                <motion.div
                  key="analyzing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full"
                >
                  <Card className="h-full flex flex-col items-center justify-center p-16 text-center bg-card border-none rounded-[3rem] min-h-[600px] shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] to-transparent" />
                    <div className="relative mb-14">
                      <div className="w-40 h-40 border-4 border-primary/5 border-t-primary rounded-full animate-spin duration-[2s]" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center animate-pulse">
                          <Brain className="w-12 h-12 text-primary" />
                        </div>
                      </div>
                    </div>
                    <h3 className="text-4xl font-black mb-6 tracking-tighter">Deep Scanning...</h3>
                    <div className="w-full max-w-md space-y-4">
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden shadow-inner">
                        <motion.div
                          className="h-full bg-gradient-to-r from-primary to-secondary"
                          initial={{ width: "0%" }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 12, ease: "easeInOut" }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-2 opacity-60">
                        <span>Parser</span>
                        <span>Logic Analysis</span>
                        <span>Feedback Generation</span>
                      </div>
                    </div>
                    <p className="mt-12 text-sm font-bold text-primary/60 tracking-widest uppercase italic animate-bounce">
                      Engineered for high-performing careers
                    </p>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-8"
                >
                  {/* Performance Metrics */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <Card className="shadow-2xl border-primary/5 rounded-[2.5rem] bg-card overflow-hidden group">
                      <div className="h-2 bg-emerald-500 opacity-20" />
                      <CardContent className="flex flex-col items-center justify-center p-10">
                        <ScoreCircle
                          score={analysis.overallScore}
                          label="RESUME INTEGRITY"
                          colorClass={getScoreColorClass(analysis.overallScore)}
                        />
                        <div className="mt-8 p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 w-full">
                          <p className="text-xs font-bold text-center text-emerald-700/70 tracking-tight leading-relaxed">
                            Overall quality based on structure, impact, and clarity.
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="shadow-2xl border-secondary/5 rounded-[2.5rem] bg-card overflow-hidden group">
                      <div className="h-2 bg-blue-500 opacity-20" />
                      <CardContent className="flex flex-col items-center justify-center p-10">
                        <ScoreCircle
                          score={analysis.atsScore || 0}
                          label="ATS VIGOR SCORE"
                          colorClass={getScoreColorClass(analysis.atsScore || 0)}
                        />
                        <div className="mt-8 p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10 w-full">
                          <p className="text-xs font-bold text-center text-blue-700/70 tracking-tight leading-relaxed">
                            Algorithm compatibility and parser readability index.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* ATS Strategy */}
                  {analysis.atsInsights && analysis.atsInsights.length > 0 && (
                    <Card className="border-none bg-black text-white rounded-[2.5rem] overflow-hidden shadow-2xl relative">
                      <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
                        <ShieldCheck className="w-32 h-32" />
                      </div>
                      <div className="p-8 bg-white/5 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                            <ShieldCheck className="w-6 h-6 text-blue-400" />
                          </div>
                          <h4 className="font-black text-lg tracking-tight uppercase">ATS Intelligence Report</h4>
                        </div>
                        <Badge className="bg-blue-600 text-white border-none px-4 py-1 font-bold text-[10px] tracking-widest uppercase">Verified</Badge>
                      </div>
                      <CardContent className="grid gap-4 p-8">
                        {analysis.atsInsights.map((insight, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * idx }}
                            className="flex gap-4 items-start bg-white/5 p-5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors group cursor-default"
                          >
                            <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                              <span className="text-[10px] font-black">{idx + 1}</span>
                            </div>
                            <span className="text-sm font-semibold leading-relaxed tracking-tight text-white/80 group-hover:text-white transition-colors">{insight}</span>
                          </motion.div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Detailed Analysis Tabs */}
                  <Tabs defaultValue="overview" className="space-y-8">
                    <TabsList className="bg-muted/50 p-1.5 rounded-2xl w-full grid grid-cols-3 shadow-inner border border-primary/5">
                      <TabsTrigger value="overview" className="rounded-xl py-3 font-black text-xs uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-2xl">Strategy</TabsTrigger>
                      <TabsTrigger value="skills" className="rounded-xl py-3 font-black text-xs uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-2xl">Keywords</TabsTrigger>
                      <TabsTrigger value="sections" className="rounded-xl py-3 font-black text-xs uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-2xl">Modules</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                      <div className="grid md:grid-cols-2 gap-8">
                        <Card className="border-none shadow-2xl rounded-[2rem] bg-emerald-50/50">
                          <CardHeader className="pb-4">
                            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3 text-emerald-600">
                              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                                <CheckCircle2 className="w-4 h-4" />
                              </div>
                              Strategic Peaks
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {analysis.strengths.map((s, i) => (
                              <div key={i} className="flex gap-3 text-sm bg-white p-4 rounded-2xl shadow-sm border border-emerald-100/50">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                                <span className="text-emerald-950 font-bold leading-relaxed">{s}</span>
                              </div>
                            ))}
                          </CardContent>
                        </Card>

                        <Card className="border-none shadow-2xl rounded-[2rem] bg-rose-50/50">
                          <CardHeader className="pb-4">
                            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3 text-rose-600">
                              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                                <AlertCircle className="w-4 h-4" />
                              </div>
                              Critical Gaps
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {analysis.weaknesses.map((w, i) => (
                              <div key={i} className="flex gap-3 text-sm bg-white p-4 rounded-2xl shadow-sm border border-rose-100/50">
                                <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
                                <span className="text-rose-950 font-bold leading-relaxed">{w}</span>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      </div>

                      <Card className="border-none shadow-2xl rounded-[2.5rem] bg-card overflow-hidden">
                        <div className="p-8 bg-gradient-to-r from-primary/10 to-transparent border-b border-primary/5">
                          <CardTitle className="text-xl font-black flex items-center gap-3 tracking-tighter">
                            <TrendingUp className="w-6 h-6 text-primary" />
                            Optimization Roadmap
                          </CardTitle>
                          <CardDescription className="text-sm font-bold mt-1 tracking-tight">Priority sequence for peak performance</CardDescription>
                        </div>
                        <CardContent className="p-8">
                          <div className="space-y-4">
                            {analysis.suggestions.map((item, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 * i }}
                                className="flex gap-6 p-6 bg-muted/20 rounded-[1.5rem] border border-transparent hover:border-primary/20 hover:bg-background transition-all group"
                              >
                                <div className="w-10 h-10 rounded-[1rem] bg-primary text-primary-foreground flex items-center justify-center font-black text-sm flex-shrink-0 group-hover:rotate-6 transition-transform shadow-xl">
                                  {i + 1}
                                </div>
                                <span className="text-base font-bold leading-relaxed pt-1 tracking-tight">{item}</span>
                              </motion.div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="skills" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                      <Card className="border-none shadow-2xl rounded-[2.5rem] bg-card overflow-hidden">
                        <CardHeader className="p-10 pb-6 border-b border-primary/5 bg-muted/[0.02]">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-2xl font-black tracking-tighter flex items-center gap-3">
                                <Target className="w-7 h-7 text-secondary" />
                                Semantic Intelligence
                              </CardTitle>
                              <CardDescription className="text-base font-bold mt-1">Cross-referencing competencies with industry benchmarks</CardDescription>
                            </div>
                            <div className="p-4 bg-secondary/10 rounded-3xl border border-secondary/5 hidden md:block">
                              <Search className="w-8 h-8 text-secondary" />
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-10 space-y-12">
                          <div className="space-y-6">
                            <div className="flex items-center justify-between">
                              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600 ml-1">Detected Expertise</h4>
                              <Badge className="bg-emerald-500 shadow-lg shadow-emerald-500/20 px-4 py-1.5 rounded-full font-black text-[10px] tracking-widest">{analysis.keywords.present.length} DETECTED</Badge>
                            </div>
                            <div className="flex flex-wrap gap-3">
                              {analysis.keywords.present.map((kw, i) => (
                                <Badge key={i} variant="secondary" className="px-5 py-2.5 bg-emerald-500/[0.03] text-emerald-700 border-none rounded-xl text-sm font-black hover:bg-emerald-500 hover:text-white transition-all shadow-sm">
                                  {kw}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="p-10 bg-rose-500/[0.03] rounded-[2rem] border border-rose-500/10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-[2s]">
                              <AlertCircle className="w-32 h-32 text-rose-500" />
                            </div>
                            <div className="flex items-center justify-between mb-8 relative z-10">
                              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-600 ml-1">Critical Skill Omissions</h4>
                              <Badge variant="destructive" className="bg-rose-500 shadow-lg shadow-rose-500/20 px-4 py-1.5 rounded-full font-black text-[10px] tracking-widest animate-pulse">{analysis.keywords.missing.length} CRITICAL GAPS</Badge>
                            </div>
                            <div className="flex flex-wrap gap-3 relative z-10">
                              {analysis.keywords.missing.map((kw, i) => (
                                <Badge key={i} variant="outline" className="px-5 py-2.5 bg-white border-none text-rose-600 shadow-xl rounded-xl text-sm font-black hover:scale-105 transition-all">
                                  {kw}
                                </Badge>
                              ))}
                            </div>
                            <div className="mt-10 p-5 bg-white/50 backdrop-blur-sm rounded-2xl border border-rose-100 relative z-10">
                              <p className="text-[11px] font-black text-rose-800 leading-relaxed uppercase tracking-tighter italic">
                                Expert Recommendation: Injecting these specific high-value keywords into your experience section can increase interview callback probability by up to 40%.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="sections" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                      <div className="grid gap-6">
                        {analysis.sections.map((section, idx) => (
                          <Card key={idx} className="overflow-hidden border-none shadow-2xl rounded-[2rem] bg-card hover:translate-y-[-5px] transition-all duration-300 group">
                            <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-primary/5">
                              <div className="p-10 md:w-56 bg-muted/20 flex flex-col items-center justify-center text-center">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">{section.name}</span>
                                <div className={`text-5xl font-black ${getScoreColorClass(section.score)} mb-2 tracking-tighter`}>{section.score}</div>
                                <span className="text-[10px] font-black text-muted-foreground opacity-30 tracking-[0.1em]">QUOTIENT</span>
                                <div className="h-1.5 w-24 bg-muted rounded-full mt-6 overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${section.score}%` }}
                                    transition={{ duration: 1, delay: 0.5 }}
                                    className={`h-full ${getScoreColorClass(section.score).replace('text-', 'bg-')}`}
                                  />
                                </div>
                              </div>
                              <div className="p-10 flex-1 bg-card group-hover:bg-gradient-to-br from-transparent to-primary/[0.02] transition-colors">
                                <div className="w-10 h-10 bg-primary/5 rounded-2xl flex items-center justify-center mb-4">
                                  <CheckCircle2 className="w-5 h-5 text-primary/40" />
                                </div>
                                <h4 className="font-black text-lg mb-3 tracking-tight">Strategic Modular Analysis</h4>
                                <p className="text-base text-muted-foreground font-medium leading-relaxed tracking-tight">{section.feedback}</p>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-4 pt-8">
                    <Button variant="outline" className="flex-1 py-8 rounded-3xl font-black text-sm uppercase tracking-widest border-2 hover:bg-muted/50 shadow-xl transition-all group" onClick={() => window.print()}>
                      <FileText className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                      Generate Artifact
                    </Button>
                    <Button variant="secondary" className="flex-1 py-8 rounded-3xl font-black text-sm uppercase tracking-widest bg-secondary/10 text-secondary hover:bg-secondary/20 shadow-xl transition-all group" onClick={() => navigate('/leaderboard')}>
                      <History className="w-5 h-5 mr-3 group-hover:rotate-[-10deg] transition-transform" />
                      Leaderboard Metrics
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
