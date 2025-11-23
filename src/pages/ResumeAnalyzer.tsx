import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  LogOut,
  Loader2,
  Download,
  Brain,
  X
} from 'lucide-react';
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    navigate('/student/login');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setUploadedFile(file);
    setError('');
    setIsExtracting(true);

    try {
      setResumeText('');
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/student/login');
        return;
      }

      const data = await studentApi.extractResumeText(file, token);
      if (!data?.text) {
        throw new Error('The server did not return any extracted text. Please try another PDF or use Paste Text.');
      }
      console.log('Text extracted successfully:', data.text.substring(0, 100) + '...');
      setResumeText(data.text);
    } catch (err: any) {
      console.error('PDF extraction error:', err);
      console.error('Error message:', err.message);
      console.error('Error response:', err.response);
      console.error('Full error object:', JSON.stringify(err, Object.getOwnPropertyNames(err)));
      
      let userMessage = 'Failed to extract text from PDF. ';
      
      if (err.message.includes('corrupted') || err.message.includes('Invalid PDF')) {
        userMessage += 'The PDF file appears to be corrupted or invalid. Please try a different file or use "Paste Text".';
      } else if (err.message.includes('image-based')) {
        userMessage += 'This appears to be an image-based (scanned) PDF. Please use "Paste Text" instead.';
      } else if (err.message.includes('password')) {
        userMessage += 'This PDF is password-protected. Please remove the password or use "Paste Text".';
      } else {
        userMessage += err.message || 'Please try a different PDF or use "Paste Text".';
      }
      
      setError(userMessage);
      setUploadedFile(null);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setResumeText('');
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    // Clear previous state before opening file picker
    setUploadedFile(null);
    setResumeText('');
    setError('');
    setAnalysis(null);
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
    setAnalysis(null);

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
    } catch (err: any) {
      console.error('Resume analysis error:', err);
      setError(err.message || 'Failed to analyze resume. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900/30';
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Navigation */}
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
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-primary/10 rounded-lg">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Resume Analyzer</h1>
              <p className="text-muted-foreground">
                Get AI-powered insights to improve your resume
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="shadow-card h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-primary" />
                  Upload Resume
                </CardTitle>
                <CardDescription>
                  Upload a PDF file or paste your resume text for AI-powered analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Target Role (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g., Software Engineer, Data Scientist"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                  />
                </div>

                <Tabs defaultValue="upload" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upload">Upload PDF</TabsTrigger>
                    <TabsTrigger value="paste">Paste Text</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="upload" className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Upload PDF File</label>
                      
                      {!uploadedFile ? (
                        <div
                          onClick={handleUploadClick}
                          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors bg-muted/30"
                        >
                          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                          <h3 className="font-semibold mb-2">Upload PDF Resume</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Click to browse or drag and drop
                          </p>
                          <p className="text-xs text-muted-foreground">
                            PDF files only • Max 5MB
                          </p>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf"
                            onChange={handleFileUpload}
                            className="hidden"
                            key={uploadedFile ? 'has-file' : 'no-file'}
                          />
                        </div>
                      ) : (
                        <div className="border rounded-lg p-4 bg-muted/30">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <FileText className="w-8 h-8 text-primary" />
                              <div>
                                <p className="font-semibold text-sm">{uploadedFile.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {(uploadedFile.size / 1024).toFixed(2)} KB
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleRemoveFile}
                              className="h-8 w-8 p-0"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          {isExtracting && (
                            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Extracting text from PDF...
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {resumeText && uploadedFile && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Extracted Text Preview</label>
                        <Textarea
                          value={resumeText}
                          onChange={(e) => setResumeText(e.target.value)}
                          rows={10}
                          className="font-mono text-xs resize-none"
                        />
                        <p className="text-xs text-muted-foreground">
                          {resumeText.length} characters extracted
                        </p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="paste" className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Resume Text *</label>
                      <Textarea
                        placeholder="Paste your resume text here..."
                        value={resumeText}
                        onChange={(e) => setResumeText(e.target.value)}
                        rows={15}
                        className="font-mono text-sm resize-none"
                      />
                      <p className="text-xs text-muted-foreground">
                        {resumeText.length} characters
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button 
                  onClick={handleAnalyze} 
                  disabled={isAnalyzing || isExtracting || !resumeText.trim()}
                  className="w-full gap-2"
                  size="lg"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analyzing with AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Analyze Resume
                    </>
                  )}
                </Button>

                <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-3">
                    <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div className="text-sm space-y-1">
                      <p className="font-semibold text-blue-900 dark:text-blue-100">
                        AI-Powered Analysis
                      </p>
                      <p className="text-blue-700 dark:text-blue-300">
                        Upload a PDF or paste your resume text. Our Groq AI will analyze it for content quality, 
                        ATS compatibility, keywords, and provide personalized suggestions for improvement.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Results Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {!analysis && !isAnalyzing && (
              <Card className="shadow-card h-full">
                <CardContent className="flex items-center justify-center h-full min-h-[600px]">
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
                      <Sparkles className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Ready to Analyze</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                      Upload a PDF or paste your resume text, then click "Analyze Resume" to get AI-powered insights and suggestions
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {isAnalyzing && (
              <Card className="shadow-card h-full">
                <CardContent className="flex items-center justify-center h-full min-h-[600px]">
                  <div className="text-center py-12">
                    <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Analyzing Your Resume...</h3>
                    <p className="text-muted-foreground">
                      Our AI is reviewing your resume. This may take a moment.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {analysis && (
              <div className="space-y-6">
                {/* Overall Score */}
                <Card className="shadow-card border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-primary" />
                        Overall Score
                      </span>
                      <span className={`text-4xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                        {analysis.overallScore}%
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Progress value={analysis.overallScore} className="h-3" />
                  </CardContent>
                </Card>

                {typeof analysis.atsScore === "number" && (
                  <Card className="shadow-card">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-secondary" />
                          ATS Compatibility
                        </span>
                        <span className={`text-3xl font-semibold ${getScoreColor(analysis.atsScore)}`}>
                          {analysis.atsScore}%
                        </span>
                      </CardTitle>
                      <CardDescription>
                        Higher scores mean better keyword coverage, structure, and parsing for applicant tracking systems.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Progress value={analysis.atsScore} className="h-2 mb-4" />
                      {analysis.atsInsights && analysis.atsInsights.length > 0 ? (
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          {analysis.atsInsights.map((insight, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <Sparkles className="w-4 h-4 text-secondary mt-0.5" />
                              <span>{insight}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No ATS notes were provided. Try re-running the analysis if you expected keyword feedback.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Strengths */}
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="w-5 h-5" />
                      Strengths
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Weaknesses */}
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="w-5 h-5" />
                      Areas for Improvement
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.weaknesses.map((weakness, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Suggestions */}
                <Card className="shadow-card border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      AI Suggestions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {analysis.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start gap-3 p-3 bg-card rounded-lg border">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex-shrink-0">
                            {index + 1}
                          </span>
                          <span className="text-sm">{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Section Scores */}
                {analysis.sections && analysis.sections.length > 0 && (
                  <Card className="shadow-card">
                    <CardHeader>
                      <CardTitle>Section Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {analysis.sections.map((section, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{section.name}</span>
                            <Badge className={`${getScoreBgColor(section.score)} ${getScoreColor(section.score)} font-semibold`}>
                              {section.score}%
                            </Badge>
                          </div>
                          <Progress value={section.score} className="h-2" />
                          <p className="text-xs text-muted-foreground">{section.feedback}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Keywords */}
                {analysis.keywords && (
                  <Card className="shadow-card">
                    <CardHeader>
                      <CardTitle>Keywords Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {analysis.keywords.present.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold mb-2 text-green-600">
                            Present Keywords
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {analysis.keywords.present.map((keyword, index) => (
                              <Badge key={index} variant="secondary" className="bg-green-100 text-green-700">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {analysis.keywords.missing.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold mb-2 text-red-600">
                            Missing Keywords
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {analysis.keywords.missing.map((keyword, index) => (
                              <Badge key={index} variant="outline" className="border-red-300 text-red-600">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
