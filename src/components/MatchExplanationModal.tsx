import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, X, TrendingUp, Award, Brain, Code, GitBranch } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { jobApi } from "@/lib/api";
import type { MatchExplanation } from "@/types/job";

interface MatchExplanationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  studentId: string;
  studentName?: string;
  matchScore: number;
}

export default function MatchExplanationModal({
  open,
  onOpenChange,
  jobId,
  studentId,
  studentName,
  matchScore,
}: MatchExplanationModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [explanation, setExplanation] = useState<MatchExplanation | null>(null);

  useEffect(() => {
    if (open && jobId && studentId) {
      fetchExplanation();
    }
  }, [open, jobId, studentId]);

  const fetchExplanation = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Not authenticated");
      }

      const data = await jobApi.getMatchExplanation(jobId, studentId, token);
      setExplanation(data);
    } catch (error: any) {
      toast({
        title: "Error loading explanation",
        description: error.message || "Failed to fetch match details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const ScoreItem = ({ label, score, max, icon: Icon }: { label: string; score: number; max: number; icon: any }) => {
    const percentage = (score / max) * 100;
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{label}</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {score}/{max}
          </span>
        </div>
        <Progress value={percentage} className="h-2" />
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            Match Analysis: {studentName || "Student"}
          </DialogTitle>
          <DialogDescription>
            Detailed breakdown of why this candidate matches your job requirements.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          </div>
        ) : explanation ? (
          <div className="space-y-6 py-4">
            {/* Overall Score */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Overall Match Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="text-5xl font-bold text-purple-600">
                    {explanation.matchScore}
                  </div>
                  <div className="flex-1">
                    <Progress value={explanation.matchScore} className="h-4" />
                    <p className="text-sm text-muted-foreground mt-2">
                      {explanation.matchScore >= 80
                        ? "Excellent match"
                        : explanation.matchScore >= 60
                        ? "Good match"
                        : explanation.matchScore >= 40
                        ? "Fair match"
                        : "Limited match"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Justification */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{explanation.matchReason}</p>
              </CardContent>
            </Card>

            {/* Score Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Score Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ScoreItem
                  label="Required Skills"
                  score={explanation.scoreBreakdown.requiredSkills}
                  max={30}
                  icon={Code}
                />
                <ScoreItem
                  label="Preferred Skills"
                  score={explanation.scoreBreakdown.preferredSkills}
                  max={10}
                  icon={Award}
                />
                <ScoreItem
                  label="Project Relevance"
                  score={explanation.scoreBreakdown.projects}
                  max={25}
                  icon={GitBranch}
                />
                <ScoreItem
                  label="Readiness Score"
                  score={explanation.scoreBreakdown.readiness}
                  max={20}
                  icon={TrendingUp}
                />
                <ScoreItem
                  label="Growth Trajectory"
                  score={explanation.scoreBreakdown.growth}
                  max={10}
                  icon={TrendingUp}
                />
                <ScoreItem
                  label="CGPA"
                  score={explanation.scoreBreakdown.cgpa}
                  max={3}
                  icon={Award}
                />
                <ScoreItem
                  label="Certifications"
                  score={explanation.scoreBreakdown.certifications}
                  max={2}
                  icon={Award}
                />
                <ScoreItem
                  label="Coding Consistency"
                  score={explanation.scoreBreakdown.codingConsistency}
                  max={5}
                  icon={Code}
                />
              </CardContent>
            </Card>

            {/* Skills Match */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Skills Matched
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {explanation.skillsMatched.length > 0 ? (
                      explanation.skillsMatched.map((skill) => (
                        <Badge key={skill} variant="default" className="bg-green-500">
                          {skill}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No matched skills</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <X className="h-5 w-5 text-red-500" />
                    Skills Missing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {explanation.skillsMissing.length > 0 ? (
                      explanation.skillsMissing.map((skill) => (
                        <Badge key={skill} variant="outline" className="border-red-500 text-red-500">
                          {skill}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">All skills matched!</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Analysis */}
            {explanation.detailedAnalysis && (
              <div className="grid grid-cols-1 gap-4">
                {explanation.detailedAnalysis.strengths && explanation.detailedAnalysis.strengths.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2 text-green-600">
                        <TrendingUp className="h-5 w-5" />
                        Strengths
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc list-inside space-y-1">
                        {explanation.detailedAnalysis.strengths.map((strength, idx) => (
                          <li key={idx} className="text-sm">{strength}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {explanation.detailedAnalysis.gaps && explanation.detailedAnalysis.gaps.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2 text-orange-600">
                        <X className="h-5 w-5" />
                        Gaps
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc list-inside space-y-1">
                        {explanation.detailedAnalysis.gaps.map((gap, idx) => (
                          <li key={idx} className="text-sm">{gap}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {explanation.detailedAnalysis.recommendations && explanation.detailedAnalysis.recommendations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2 text-blue-600">
                        <Brain className="h-5 w-5" />
                        Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc list-inside space-y-1">
                        {explanation.detailedAnalysis.recommendations.map((rec, idx) => (
                          <li key={idx} className="text-sm">{rec}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Student Summary */}
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-lg">Candidate Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">College:</span>
                  <span className="font-medium">{explanation.student.college || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Branch:</span>
                  <span className="font-medium">{explanation.student.branch || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CGPA:</span>
                  <span className="font-medium">{explanation.student.cgpa || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Readiness Score:</span>
                  <span className="font-medium">{explanation.student.readinessScore || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Projects:</span>
                  <span className="font-medium">{explanation.student.projects?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Certifications:</span>
                  <span className="font-medium">{explanation.student.certifications?.length || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            No explanation data available
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
