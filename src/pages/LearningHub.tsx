import { useParams, useNavigate } from "react-router-dom";
import { StudentNavbar } from "@/components/StudentNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    BookOpen,
    PlayCircle,
    Code2,
    ChevronLeft,
    CheckCircle2,
    Clock,
    ExternalLink,
    FileText,
    MessageSquare,
    Trophy,
    ArrowRight,
    Award
} from "lucide-react";

import { motion } from "framer-motion";

const skillData: Record<string, any> = {
    python: {
        title: "Python Programming",
        level: "Beginner to Intermediate",
        duration: "4 weeks",
        description: "Master Python from the basics of syntax to advanced concepts like decorators, generators, and OOP. This comprehensive track will prepare you for backend development, data science, and automation.",
        progress: 35,
        lastQuizScore: 0,
        modules: [

            {
                id: 1,
                title: "Python Basics",
                duration: "2 hours",
                status: "completed",
                lessons: ["Variables & Data Types", "Control Flow", "Functions", "Lists & Dictionaries"]
            },
            {
                id: 2,
                title: "Object-Oriented Programming (OOP)",
                duration: "3 hours",
                status: "in-progress",
                lessons: ["Classes & Objects", "Inheritance", "Polymorphism", "Encapsulation"]
            },
            {
                id: 3,
                title: "File I/O and Exceptions",
                duration: "1.5 hours",
                status: "not-started",
                lessons: ["Reading/Writing Files", "JSON handling", "Error Handling Mechanisms"]
            }
        ],
        resources: [
            { title: "Official Python Documentation", url: "https://docs.python.org/3/", type: "doc" },
            { title: "The Python Tutorial (Official)", url: "https://docs.python.org/3/tutorial/index.html", type: "tutorial" },
            { title: "Python Library Reference", url: "https://docs.python.org/3/library/index.html", type: "doc" }
        ]

    },
    javascript: {
        title: "Modern JavaScript (ES6+)",
        level: "Beginner",
        duration: "3 weeks",
        description: "Learn the language of the web. From DOM manipulation to asynchronous programming with Promises and Async/Await.",
        progress: 10,
        lastQuizScore: 0,
        modules: [

            {
                id: 1,
                title: "JS Fundamentals",
                duration: "2.5 hours",
                status: "completed",
                lessons: ["Scope & Hoisting", "Arrow Functions", "Array Methods", "Destructuring"]
            }
        ],
        resources: [
            { title: "MDN Web Docs (Official Reference)", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript", type: "doc" },
            { title: "ECMAScript Language Specification", url: "https://tc39.es/ecma262/", type: "doc" }
        ]

    },
    c: {
        title: "C Programming",
        level: "Beginner",
        duration: "4 weeks",
        description: "Master the fundamentals of C programming, memory management, and low-level system interaction.",
        progress: 0,
        lastQuizScore: 0,
        modules: [
            {
                id: 1,
                title: "Fundamentals",
                duration: "3 hours",
                status: "not-started",
                lessons: ["Syntax", "Datatypes", "Pointers"]
            }
        ],
        resources: [
            { title: "C Reference (Official)", url: "https://en.cppreference.com/w/c", type: "doc" }
        ]
    },
    cpp: {
        title: "C++ Programming",
        level: "Intermediate",
        duration: "6 weeks",
        description: "Deep dive into Object-Oriented Programming and Generic Programming with Modern C++ (C++11/14/17/20).",
        progress: 0,
        lastQuizScore: 0,
        modules: [
            {
                id: 1,
                title: "OOP in C++",
                duration: "4 hours",
                status: "not-started",
                lessons: ["Classes", "STL", "Templates"]
            }
        ],
        resources: [
            { title: "C++ Reference (Official)", url: "https://en.cppreference.com/w/cpp", type: "doc" },
            { title: "Standard C++ Foundation", url: "https://isocpp.org/", type: "doc" }
        ]
    }
};

const LearningHub = () => {
    const { skillId } = useParams<{ skillId: string }>();
    const navigate = useNavigate();

    const skill = skillId ? skillData[skillId.toLowerCase()] : null;
    const displayName = skill ? skill.title : (skillId?.charAt(0).toUpperCase() + skillId?.slice(1));

    if (!skill && skillId) {
        // Fallback for skills not in our static data
        return (
            <div className="min-h-screen bg-background">
                <StudentNavbar />
                <main className="container mx-auto px-4 py-8 max-w-6xl">
                    <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
                        <ChevronLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                    </Button>
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
                            <BookOpen className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <h1 className="text-3xl font-bold mb-4">Learning Path: {displayName}</h1>
                        <p className="text-muted-foreground max-w-md mb-8">
                            We're currently preparing the specialized content for {displayName}.
                            In the meantime, you can check the external resources in your roadmap!
                        </p>
                        <Button onClick={() => navigate('/student/dashboard')}>
                            Go to Dashboard
                        </Button>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <StudentNavbar />

            <main className="container mx-auto px-4 py-8 max-w-6xl">
                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 -ml-2 text-muted-foreground hover:text-foreground">
                        <ChevronLeft className="mr-2 h-4 w-4" /> Back to Roadmap
                    </Button>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Badge variant="secondary" className="px-3 py-1">
                                    {skill.level}
                                </Badge>
                                <Badge variant="outline" className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> {skill.duration}
                                </Badge>
                            </div>
                            <h1 className="text-4xl font-bold tracking-tight mb-3 bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                                {skill.title}
                            </h1>
                            <p className="text-muted-foreground text-lg max-w-3xl leading-relaxed">
                                {skill.description}
                            </p>
                        </div>

                        <div className="w-full md:w-64 bg-card border rounded-2xl p-5 shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium">Overall Progress</span>
                                <span className="text-sm font-bold">{skill.progress}%</span>
                            </div>
                            <Progress value={skill.progress} className="h-2 mb-4" />
                            <Button className="w-full group">
                                Continue Learning
                                <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </Button>
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        <section>
                            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                                <PlayCircle className="w-6 h-6 text-primary" />
                                Course Modules
                            </h2>
                            <div className="space-y-4">
                                {skill.modules.map((module: any, idx: number) => (
                                    <motion.div
                                        key={module.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                    >
                                        <Card className={`overflow-hidden transition-all hover:shadow-md ${module.status === 'in-progress' ? 'border-primary/50 bg-primary/5' : ''
                                            }`}>
                                            <CardContent className="p-0">
                                                <div className="p-6 flex items-start justify-between">
                                                    <div className="flex gap-4">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${module.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                                                            module.status === 'in-progress' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                                                            }`}>
                                                            {module.status === 'completed' ? <CheckCircle2 className="w-6 h-6" /> : <span className="font-bold">{module.id}</span>}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-lg">{module.title}</h3>
                                                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                                                                <Clock className="w-3 h-3" /> {module.duration} • {module.lessons.length} Lessons
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Badge className={
                                                        module.status === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                                            module.status === 'in-progress' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-muted text-muted-foreground'
                                                    }>
                                                        {module.status.replace('-', ' ')}
                                                    </Badge>
                                                </div>
                                                <div className="bg-muted/30 px-6 py-4 border-t">
                                                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4">
                                                        {module.lessons.map((lesson: string, i: number) => (
                                                            <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                                                                {lesson}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                                <Code2 className="w-6 h-6 text-primary" />
                                Hands-on Practice
                            </h2>
                            <Card className="bg-slate-900 text-slate-100 border-slate-800">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg">In-Browser Code Playground</CardTitle>
                                        <Badge className="bg-blue-500">Interactive</Badge>
                                    </div>
                                    <CardDescription className="text-slate-400">
                                        Test your knowledge by writing and running code snippets directly in your browser.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="bg-black/40 rounded-lg p-4 font-mono text-sm border border-slate-700 mb-4">
                                        <div className="text-blue-400"># Task: Define a function that returns the square of a number</div>
                                        <div><span className="text-purple-400">def</span> <span className="text-yellow-400">square</span>(n):</div>
                                        <div className="pl-4">  <span className="text-purple-400">return</span> n * n</div>
                                        <div className="mt-2 text-blue-400"># Test the function</div>
                                        <div><span className="text-green-400">print</span>(square(<span className="text-orange-400">5</span>))</div>
                                    </div>
                                    <Button variant="secondary" className="w-full bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700">
                                        Open Full Editor
                                    </Button>
                                </CardContent>
                            </Card>
                        </section>

                        <section className="mt-12 bg-card border rounded-3xl p-8 shadow-sm">
                            <div className="flex flex-col md:flex-row items-center gap-8">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Badge variant="outline" className="text-primary border-primary">Mandatory Assessment</Badge>
                                        <Trophy className="w-5 h-5 text-amber-500" />
                                    </div>
                                    <h2 className="text-3xl font-bold mb-4">Ready to test your knowledge?</h2>
                                    <p className="text-muted-foreground text-lg mb-6">
                                        Complete the skill assessment to verify your mastery of {displayName}.
                                        You need a score of <strong>75% or higher</strong> to officially mark this milestone as complete and move to the next step.
                                    </p>
                                    <div className="flex flex-wrap gap-4">
                                        <Button
                                            size="lg"
                                            className="px-8 bg-gradient-to-r from-primary to-purple-600 hover:shadow-lg transition-all"
                                            onClick={() => navigate(`/student/quiz/${skillId}`)}
                                        >
                                            Start Assessment
                                            <Award className="ml-2 w-5 h-5" />
                                        </Button>
                                        {skill.lastQuizScore > 0 && (
                                            <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-xl border">
                                                <span className="text-sm text-muted-foreground">Latest Score:</span>
                                                <span className={`font-bold ${skill.lastQuizScore >= 75 ? 'text-green-500' : 'text-red-500'}`}>
                                                    {skill.lastQuizScore}%
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="hidden md:block w-48 h-48 bg-primary/5 rounded-full border-4 border-dashed border-primary/20 flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="text-4xl font-black text-primary/40 leading-none">75%</div>
                                        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1 font-bold">Passing Grade</div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>


                    {/* Sidebar */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <FileText className="w-5 h-5" />
                                    Supplemantal Resources
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {skill.resources.map((res: any, i: number) => (
                                    <a
                                        key={i}
                                        href={res.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-muted rounded-md group-hover:bg-background transition-colors">
                                                {res.type === 'pdf' ? <FileText className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
                                            </div>
                                            <span className="text-sm font-medium">{res.title}</span>
                                        </div>
                                        <ExternalLink className="w-3 h-3 text-muted-foreground" />
                                    </a>
                                ))}
                            </CardContent>
                        </Card>

                        <Card className="bg-primary/5 border-primary/20">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5 text-primary" />
                                    AI Mentor Support
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Stuck on a concept? Zenith is here to help you understand {displayName} better.
                                </p>
                                <Button
                                    variant="outline"
                                    className="w-full border-primary/30 hover:bg-primary/10"
                                    onClick={() => navigate('/student/ai')}
                                >
                                    Ask Zenith
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="overflow-hidden">
                            <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-6 text-white text-center">
                                <Trophy className="w-12 h-12 mx-auto mb-3" />
                                <h3 className="font-bold text-xl mb-1">Earn a Badge</h3>
                                <p className="text-sm opacity-90">
                                    Complete this track to earn the {displayName} Mastery badge on your profile!
                                </p>
                            </div>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default LearningHub;
