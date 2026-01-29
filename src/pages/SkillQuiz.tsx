import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { StudentNavbar } from "@/components/StudentNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, ChevronLeft, ChevronRight, Award, Timer, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { roadmapApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const quizQuestions: Record<string, any[]> = {
    python: [
        {
            id: 1,
            question: "Which of the following is used to define a block of code in Python?",
            options: ["Brackets", "Indentation", "Parentheses", "Quotation marks"],
            correct: 1
        },
        {
            id: 2,
            question: "What is the correct way to create a list in Python?",
            options: ["list = (1, 2, 3)", "list = {1, 2, 3}", "list = [1, 2, 3]", "list = <1, 2, 3>"],
            correct: 2
        },
        {
            id: 3,
            question: "How do you start a comment in Python?",
            options: ["//", "/*", "--", "#"],
            correct: 3
        },
        {
            id: 4,
            question: "Which data type is used to store multiple items in a single variable and is ordered?",
            options: ["Set", "List", "Dictionary", "String"],
            correct: 1
        }
    ],
    javascript: [
        {
            id: 1,
            question: "Which keyword is used to declare a block-scoped variable in JavaScript?",
            options: ["var", "let", "const", "Both let and const"],
            correct: 3
        },
        {
            id: 2,
            question: "What does 'DOM' stand for?",
            options: ["Data Object Model", "Document Object Model", "Digital Orbital Model", "Document Observation Method"],
            correct: 1
        }
    ]
};

const SkillQuiz = () => {
    const { skillId } = useParams<{ skillId: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);
    const [milestoneId, setMilestoneId] = useState<string | null>(null);

    const questions = skillId && quizQuestions[skillId.toLowerCase()] ? quizQuestions[skillId.toLowerCase()] : quizQuestions.python;
    const skillName = skillId ? skillId.charAt(0).toUpperCase() + skillId.slice(1) : "Skill";

    useEffect(() => {
        // Find the active milestone for this skill from the active roadmap
        const findMilestone = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;
            try {
                const response = await roadmapApi.getActive(token);
                if (response.roadmap) {
                    const milestone = response.roadmap.milestones.find((m: any) =>
                        m.status === 'in-progress' || m.status === 'not-started'
                    );
                    if (milestone) setMilestoneId(milestone.id);
                }
            } catch (error) {
                console.error("Failed to fetch roadmap:", error);
            }
        };
        findMilestone();
    }, []);

    const handleSelectOption = (optionIndex: number) => {
        setAnswers({ ...answers, [currentStep]: optionIndex });
    };

    const handleNext = () => {
        if (currentStep < questions.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        let correctCount = 0;
        questions.forEach((q, idx) => {
            if (answers[idx] === q.correct) correctCount++;
        });

        const score = Math.round((correctCount / questions.length) * 100);
        const passed = score >= 75;

        try {
            const token = localStorage.getItem('token');
            if (token && milestoneId) {
                await roadmapApi.submitQuiz(milestoneId, score, token);
            }

            setResult({ score, passed });

            if (passed) {
                toast({
                    title: "Assessment Passed!",
                    description: `You scored ${score}% and unlocked the next milestone.`,
                });
            } else {
                toast({
                    title: "Assessment Failed",
                    description: `You scored ${score}%. You need at least 75% to pass.`,
                    variant: "destructive"
                });
            }
        } catch (error: any) {
            toast({
                title: "Error submitting results",
                description: error.message,
                variant: "destructive"
            });
            setResult({ score, passed }); // Still show local result
        } finally {
            setIsSubmitting(false);
        }
    };

    if (result) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="max-w-md w-full"
                >
                    <Card className="text-center p-8 border-2 shadow-xl">
                        <div className="flex justify-center mb-6">
                            {result.passed ? (
                                <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-500">
                                    <Award className="w-12 h-12" />
                                </div>
                            ) : (
                                <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-500">
                                    <XCircle className="w-12 h-12" />
                                </div>
                            )}
                        </div>

                        <h2 className="text-3xl font-bold mb-2">
                            {result.passed ? "Well Done!" : "Keep Practicing"}
                        </h2>
                        <p className="text-muted-foreground mb-6">
                            {result.passed
                                ? "You've successfully mastered this module's requirements."
                                : "You haven't reached the requirement for this module yet."}
                        </p>

                        <div className="bg-muted/50 rounded-2xl p-6 mb-8">
                            <span className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Your Score</span>
                            <div className="text-5xl font-black mt-2 bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                                {result.score}%
                            </div>
                            <div className="mt-4 flex items-center justify-center gap-2">
                                <Badge variant={result.passed ? "default" : "destructive"} className="px-4 py-1">
                                    {result.passed ? "PASSED" : "FAILED"}
                                </Badge>
                                <span className="text-xs text-muted-foreground">Threshold: 75%</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <Button className="w-full" onClick={() => navigate('/student/dashboard')}>
                                {result.passed ? "Continue to Roadmap" : "Return to Roadmap"}
                            </Button>
                            {!result.passed && (
                                <Button variant="outline" onClick={() => window.location.reload()}>
                                    Try Again
                                </Button>
                            )}
                        </div>
                    </Card>
                </motion.div>
            </div>
        );
    }

    const currentQuestion = questions[currentStep];
    const isLastStep = currentStep === questions.length - 1;
    const progress = ((currentStep + 1) / questions.length) * 100;

    return (
        <div className="min-h-screen bg-background">
            <StudentNavbar />
            <main className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="flex items-center justify-between mb-8">
                    <Button variant="ghost" onClick={() => navigate(-1)} className="text-muted-foreground">
                        <ChevronLeft className="mr-2 h-4 w-4" /> Cancel Test
                    </Button>
                    <div className="flex items-center gap-2">
                        <Timer className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">Progress Assessment</span>
                    </div>
                    <Badge variant="outline" className="px-3">
                        {currentStep + 1} of {questions.length}
                    </Badge>
                </div>

                <div className="mb-8">
                    <div className="flex justify-between text-xs text-muted-foreground mb-2">
                        <span>Completing: {skillName} Basics</span>
                        <span>{Math.round(progress)}% done</span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Card className="shadow-lg border-2">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-2xl leading-tight">
                                    {currentQuestion.question}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {currentQuestion.options.map((option: string, idx: number) => (
                                    <div
                                        key={idx}
                                        onClick={() => handleSelectOption(idx)}
                                        className={`group cursor-pointer flex items-center p-4 rounded-xl border-2 transition-all duration-200 ${answers[currentStep] === idx
                                                ? 'border-primary bg-primary/5 shadow-inner'
                                                : 'border-transparent bg-muted/40 hover:bg-muted/70 hover:border-muted'
                                            }`}
                                    >
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 transition-colors ${answers[currentStep] === idx ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30'
                                            }`}>
                                            {String.fromCharCode(65 + idx)}
                                        </div>
                                        <span className={`font-medium transition-colors ${answers[currentStep] === idx ? 'text-primary' : 'text-foreground'
                                            }`}>
                                            {option}
                                        </span>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </motion.div>
                </AnimatePresence>

                <div className="flex justify-between mt-8">
                    <Button
                        variant="outline"
                        onClick={handlePrev}
                        disabled={currentStep === 0}
                        className="px-6"
                    >
                        <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                    </Button>

                    {isLastStep ? (
                        <Button
                            className="px-8 bg-gradient-to-r from-primary to-purple-600 hover:shadow-lg transition-all"
                            onClick={handleSubmit}
                            disabled={answers[currentStep] === undefined || isSubmitting}
                        >
                            {isSubmitting ? "Submitting..." : "Finish & Submit"}
                            <CheckCircle2 className="ml-2 h-4 w-4" />
                        </Button>
                    ) : (
                        <Button
                            className="px-8"
                            onClick={handleNext}
                            disabled={answers[currentStep] === undefined}
                        >
                            Next Question <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                </div>

                <div className="mt-12 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                        <strong>Passing Requirement:</strong> You must score at least <strong>75%</strong> to unlock the next milestone in your roadmap. If you fail, you can review the materials and try again anytime.
                    </p>
                </div>
            </main>
        </div>
    );
};

export default SkillQuiz;
