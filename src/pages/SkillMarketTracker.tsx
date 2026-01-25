import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    TrendingUp,
    BarChart3,
    Target,
    Search,
    ArrowUpRight,
    ArrowDownRight,
    Info,
    Building2,
    DollarSign,
    Briefcase,
    CheckCircle2,
    XCircle,
    Sparkles
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { StudentNavbar } from "@/components/StudentNavbar";
import { marketApi, studentApi, SkillMarketData, TrendPredictions, SkillROIRecommendation, CompanySkillProfile } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const SkillMarketTracker = () => {
    const { toast } = useToast();
    const [skills, setSkills] = useState<SkillMarketData[]>([]);
    const [trends, setTrends] = useState<TrendPredictions | null>(null);
    const [roiReport, setRoiReport] = useState<SkillROIRecommendation[]>([]);
    const [companies, setCompanies] = useState<CompanySkillProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [companyType, setCompanyType] = useState("all");
    const [studentProfile, setStudentProfile] = useState<any>(null);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

    // State for real-time search
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const [skillsData, trendsData, roiData, companiesData, profileData] = await Promise.all([
                    marketApi.getSkills(),
                    marketApi.getTrends(),
                    token ? marketApi.getROI(token) : Promise.resolve([]),
                    marketApi.getCompanies(),
                    token ? studentApi.getProfile(token) : Promise.resolve(null)
                ]);

                setSkills(skillsData);
                setTrends(trendsData);
                setRoiReport(roiData);
                setCompanies(companiesData);
                setStudentProfile(profileData);
            } catch (error: any) {
                toast({
                    title: "Error loading market data",
                    description: error.message || "Please check your connection",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [toast]);

    // Real-time search debounce effect
    useEffect(() => {
        if (!searchQuery.trim()) return;

        const delayDebounceFn = setTimeout(async () => {
            if (isSearching) return; // Prevent double triggering if button was clicked

            setIsSearching(true);
            try {
                const data = await marketApi.getCompanies(searchQuery, companyType);
                setCompanies(data);
            } catch (error) {
                console.error("Search error:", error);
            } finally {
                setIsSearching(false);
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, companyType]);

    const calculateMatchScore = (company: CompanySkillProfile) => {
        if (!studentProfile || !studentProfile.skillRadar) return 0;

        let totalScore = 0;
        let possibleScore = 0;

        company.requiredSkills.forEach(req => {
            const importanceWeight = req.importance === 'must-have' ? 1.5 : 1;
            const studentSkillLevel = (studentProfile.skillRadar[req.skillName] || 0) / 20; // 0-100 to 0-5

            totalScore += Math.min(studentSkillLevel, req.proficiencyLevel) * importanceWeight;
            possibleScore += req.proficiencyLevel * importanceWeight;
        });

        return possibleScore > 0 ? Math.round((totalScore / possibleScore) * 100) : 0;
    };

    const handleSearch = async () => {
        if (!searchQuery.trim() || isSearching) return;

        setIsSearching(true);
        try {
            const data = await marketApi.getCompanies(searchQuery, companyType);
            setCompanies(data);
        } catch (error: any) {
            toast({
                title: "Search failed",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsSearching(false);
        }
    };

    const getIntensityColor = (score: number) => {
        if (score >= 90) return "bg-emerald-500/20 border-emerald-500/50 text-emerald-700 dark:text-emerald-400";
        if (score >= 80) return "bg-blue-500/20 border-blue-500/50 text-blue-700 dark:text-blue-400";
        if (score >= 70) return "bg-indigo-500/20 border-indigo-500/50 text-indigo-700 dark:text-indigo-400";
        return "bg-slate-500/20 border-slate-500/50 text-slate-700 dark:text-slate-400";
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-muted/30">
                <StudentNavbar />
                <div className="container mx-auto px-4 py-32 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-muted-foreground animate-pulse">Analyzing real-time market data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/30 pb-12">
            <StudentNavbar />

            <div className="container mx-auto px-4 py-8">
                <header className="mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col md:flex-row md:items-end justify-between gap-4"
                    >
                        <div>
                            <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center gap-3">
                                <TrendingUp className="w-10 h-10 text-primary" />
                                Skill Market Tracker
                            </h1>
                            <p className="text-muted-foreground text-lg max-w-2xl">
                                Real-time job market intelligence to help you prioritize the right skills for the current tech landscape.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-card px-4 py-2 rounded-full border border-border shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Live Data Synced: {new Date().toLocaleTimeString()}
                        </div>
                    </motion.div>
                </header>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Main Content Area */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Skill Demand Heatmap */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 }}
                        >
                            <Card className="overflow-hidden border-none shadow-premium bg-gradient-to-br from-card to-muted/20">
                                <CardHeader className="border-b bg-muted/10">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <CardTitle className="text-xl flex items-center gap-2">
                                                <BarChart3 className="w-5 h-5 text-primary" />
                                                Skill Demand Heatmap
                                            </CardTitle>
                                            <CardDescription>Global job posting density by skill category</CardDescription>
                                        </div>
                                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                                            Jan - June 2025 Forecast
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                        {skills.map((skill, idx) => (
                                            <motion.div
                                                key={skill._id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.05 * idx }}
                                                className={`p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md active:scale-95 ${getIntensityColor(skill.demandScore)}`}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-xs font-semibold uppercase tracking-wider opacity-70">{skill.category}</span>
                                                    {skill.trend === 'rising' && <ArrowUpRight className="w-4 h-4 text-emerald-500" />}
                                                </div>
                                                <h3 className="font-bold text-lg mb-1">{skill.skillName}</h3>
                                                <div className="flex items-end justify-between">
                                                    <span className="text-sm font-medium">{skill.demandScore}% Demand</span>
                                                    <span className="text-[10px] opacity-60">{(skill.jobCount / 1000).toFixed(0)}k Jobs</span>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Personalized ROI Calculator */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <Card className="border-primary/20 bg-primary/5 shadow-premium">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Target className="w-5 h-5 text-primary" />
                                        Personalized Skill ROI Calculator
                                    </CardTitle>
                                    <CardDescription>Top skills recommended for you based on market value and effort</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {roiReport.length > 0 ? (
                                        roiReport.map((item, idx) => (
                                            <div key={idx} className="bg-card p-4 rounded-lg border border-border flex flex-col md:flex-row md:items-center gap-4 group hover:border-primary/40 transition-colors">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-bold text-lg">{item.skillName}</h4>
                                                        <Badge variant="secondary" className="text-[10px]">{item.category}</Badge>
                                                        {item.impact === 'High' && <Badge className="bg-emerald-500/10 text-emerald-600 border-none">High Impact</Badge>}
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                        <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> ~₹{(item.avgSalary / 100000).toFixed(1)}L PA Avg</span>
                                                        <span className="flex items-center gap-1"><Info className="w-3 h-3" /> {item.timeInvestment} focus</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-center md:items-end gap-2 px-6">
                                                    <span className="text-xs text-muted-foreground uppercase font-semibold">Skill ROI Score</span>
                                                    <div className="text-2xl font-black text-primary">{item.roiScore}</div>
                                                </div>
                                                <Button className="md:w-32 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                                                    Boost Skill
                                                </Button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8">
                                            <p className="text-muted-foreground">Complete your profile to see personalized ROI recommendations.</p>
                                            <Button variant="outline" className="mt-4" onClick={() => window.location.href = '/student/profile'}>Complete Profile</Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Company Skill Database */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <Card className="border-none shadow-premium overflow-hidden">
                                <CardHeader className="bg-gradient-to-r from-indigo-600 to-violet-700 text-white">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <CardTitle className="flex items-center gap-2 text-white">
                                                    <Building2 className="w-6 h-6" />
                                                    Company-Specific Skill Database
                                                </CardTitle>
                                                <Badge className="bg-emerald-500 text-white border-none text-[10px] animate-pulse">
                                                    AI Discovery Active
                                                </Badge>
                                            </div>
                                            <CardDescription className="text-indigo-100">Proactively researching corporate tech stacks for you in real-time</CardDescription>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="relative group">
                                                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors ${isSearching ? 'text-white animate-spin' : ''}`} />
                                                <Input
                                                    placeholder="Search any company (e.g. Netflix, Uber...)"
                                                    className="pl-9 w-[260px] bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white focus:text-black transition-all"
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                />
                                            </div>

                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            size="sm"
                                                            variant="secondary"
                                                            className="font-bold shrink-0 gap-2"
                                                            onClick={handleSearch}
                                                            disabled={isSearching}
                                                        >
                                                            {isSearching ? <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-indigo-600" />}
                                                            {isSearching ? 'Scanning...' : 'AI Research'}
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p className="max-w-xs">Can't find a company? Click to have Zenith AI<br />research its tech stack and salaries in real-time.</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex flex-wrap gap-2">
                                        {['all', 'faang', 'startup', 'enterprise'].map((type) => (
                                            <Badge
                                                key={type}
                                                className={`cursor-pointer capitalize text-xs px-3 py-1 border-none transition-all ${companyType === type
                                                    ? "bg-white text-indigo-700 shadow-lg scale-105"
                                                    : "bg-white/10 text-white hover:bg-white/20"
                                                    }`}
                                                onClick={() => setCompanyType(type)}
                                            >
                                                {type}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-border">
                                        {isSearching ? (
                                            <div className="p-20 text-center">
                                                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                                <p className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent animate-pulse">Zenith is researching this company...</p>
                                                <p className="text-sm text-muted-foreground mt-2">Connecting to real-time market data to extract tech-stack requirements.</p>
                                            </div>
                                        ) : companies.length > 0 ? (
                                            companies.map((company, idx) => {
                                                const isSelected = selectedCompanyId === company._id;
                                                const matchScore = calculateMatchScore(company);

                                                return (
                                                    <motion.div
                                                        key={company._id}
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1, backgroundColor: isSelected ? "rgba(var(--primary), 0.03)" : "transparent" }}
                                                        transition={{ delay: idx * 0.05 }}
                                                        className={`p-6 transition-all group cursor-pointer ${isSelected ? 'bg-indigo-50/50 dark:bg-indigo-950/10' : 'hover:bg-muted/30'}`}
                                                        onClick={() => setSelectedCompanyId(isSelected ? null : company._id)}
                                                    >
                                                        <div className="flex flex-col md:flex-row justify-between gap-6">
                                                            <div className="flex items-start gap-4">
                                                                <div className={`w-14 h-14 rounded-2xl bg-white border-2 shadow-sm p-3 flex items-center justify-center transition-colors ${isSelected ? 'border-primary shadow-md scale-105' : 'border-muted group-hover:border-indigo-500/50'}`}>
                                                                    {company.logoUrl ? (
                                                                        <img src={company.logoUrl} alt={company.companyName} className="max-w-full max-h-full object-contain" />
                                                                    ) : (
                                                                        <Building2 className={`w-8 h-8 ${isSelected ? 'text-primary' : 'text-indigo-500'}`} />
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <h4 className={`font-bold text-xl transition-colors ${isSelected ? 'text-primary' : 'group-hover:text-indigo-600'}`}>{company.companyName}</h4>
                                                                        <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 uppercase text-[90%] scale-90">{company.type}</Badge>
                                                                        {isSelected && <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5">Selected</Badge>}
                                                                    </div>
                                                                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 font-medium">
                                                                        {company.industry} • <span className="opacity-70">{company.location}</span>
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="md:text-right bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10 min-w-[200px]">
                                                                <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Est. Salary Package</div>
                                                                <div className="text-xl font-black text-emerald-700">
                                                                    ₹{(company.avgSalaryRange.min / 100000).toFixed(1)}L - ₹{(company.avgSalaryRange.max / 100000).toFixed(1)}L <span className="text-xs font-bold text-emerald-600/70">PA</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Condensed View (Tech Stack Tags) */}
                                                        {!isSelected && (
                                                            <div className="mt-5 space-y-3">
                                                                <div className="flex items-center justify-between">
                                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Core Tech Stack</p>
                                                                    <p className="text-[10px] font-medium text-muted-foreground uppercase opacity-0 group-hover:opacity-100 transition-opacity">Click to view analysis</p>
                                                                </div>
                                                                <div className="flex flex-wrap gap-2.5">
                                                                    {company.requiredSkills.map((s, i) => (
                                                                        <div key={i} className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-border shadow-sm group-hover:shadow-md transition-all">
                                                                            <span className="text-sm font-bold text-foreground">{s.skillName}</span>
                                                                            <div className="flex gap-1">
                                                                                {[...Array(5)].map((_, starIdx) => (
                                                                                    <div key={starIdx} className={`w-1.5 h-3 rounded-full ${starIdx < s.proficiencyLevel ? 'bg-indigo-500' : 'bg-slate-200'}`}></div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Expanded View (Match Analysis) */}
                                                        {isSelected && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: "auto", opacity: 1 }}
                                                                className="mt-6 border-t pt-6"
                                                            >
                                                                <div className="grid md:grid-cols-3 gap-6">
                                                                    {/* Left: General Match Info */}
                                                                    <div className="space-y-4">
                                                                        <div className="bg-card rounded-xl p-4 border shadow-sm">
                                                                            <p className="text-sm font-medium text-muted-foreground mb-2">Detailed Match Analysis</p>
                                                                            <div className="flex items-end gap-2">
                                                                                <span className={`text-4xl font-black ${matchScore > 70 ? 'text-emerald-600' : matchScore > 40 ? 'text-amber-500' : 'text-red-500'}`}>{matchScore}%</span>
                                                                                <span className="text-sm text-muted-foreground mb-1">Profile Match</span>
                                                                            </div>
                                                                            <Progress value={matchScore} className={`h-2 mt-2 ${matchScore > 70 ? "bg-emerald-100" : "bg-slate-100"}`} />
                                                                        </div>
                                                                        <Button
                                                                            className="w-full bg-primary text-primary-foreground gap-2 font-bold shadow-lg shadow-primary/20"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                toast({ title: "Target Locked 🎯", description: `You have set ${company.companyName} as your primary placement goal.` });
                                                                            }}
                                                                        >
                                                                            <Target className="w-4 h-4" />
                                                                            Set as Target Company
                                                                        </Button>
                                                                    </div>

                                                                    {/* Right: Detailed Skill Gap */}
                                                                    <div className="md:col-span-2 space-y-3">
                                                                        <h5 className="font-semibold text-sm flex items-center gap-2">
                                                                            <Briefcase className="w-4 h-4 text-primary" />
                                                                            Skill Gap Report
                                                                        </h5>
                                                                        <div className="grid gap-2">
                                                                            {company.requiredSkills.map((req, i) => {
                                                                                const studentLevel = (studentProfile?.skillRadar?.[req.skillName] || 0) / 20; // 0-5
                                                                                const isMatch = studentLevel >= req.proficiencyLevel;
                                                                                const gap = Math.max(0, req.proficiencyLevel - studentLevel);

                                                                                return (
                                                                                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-background border hover:border-primary/30 transition-colors">
                                                                                        <div className="flex items-center gap-3">
                                                                                            {isMatch ? (
                                                                                                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                                                                            ) : (
                                                                                                <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                                                                                            )}
                                                                                            <div>
                                                                                                <p className="font-bold text-sm">{req.skillName}</p>
                                                                                                {req.importance === 'must-have' && <span className="text-[10px] text-red-500 font-semibold uppercase">Must Have</span>}
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="text-right">
                                                                                            {isMatch ? (
                                                                                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Ready</span>
                                                                                            ) : (
                                                                                                <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded">Gap: +{gap.toFixed(1)} Level</span>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </motion.div>
                                                );
                                            })
                                        ) : (
                                            <div className="p-20 text-center">
                                                <Building2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                                                <h3 className="font-bold text-lg">No companies found</h3>
                                                <p className="text-muted-foreground">Try a different search term or filter.</p>
                                                <Button variant="link" onClick={() => { setSearchQuery(""); setCompanyType("all"); }} className="mt-2 text-indigo-600">Clear all filters</Button>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                    </div>

                    {/* Sidebar / Trends Section */}
                    <div className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <Card className="h-full">
                                <CardHeader>
                                    <CardTitle className="text-lg">Emerging Skill Predictions</CardTitle>
                                    <CardDescription>AI-powered 6-month developer trend forecast</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div>
                                        <h5 className="text-sm font-bold flex items-center gap-2 mb-3 text-emerald-600 uppercase tracking-wider">
                                            <ArrowUpRight className="w-4 h-4" /> Burning Hot
                                        </h5>
                                        <div className="space-y-3">
                                            {trends?.rising.map((s) => (
                                                <div key={s._id} className="flex items-center justify-between gap-3">
                                                    <div className="flex-1">
                                                        <div className="flex justify-between text-xs mb-1">
                                                            <span>{s.skillName}</span>
                                                            <span className="font-bold text-emerald-500">+{s.predictedGrowth6m}%</span>
                                                        </div>
                                                        <Progress value={s.predictedGrowth6m * 2} className="h-1" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <h5 className="text-sm font-bold flex items-center gap-2 mb-3 text-blue-600 uppercase tracking-wider">
                                            <Briefcase className="w-4 h-4" /> Strong & Stable
                                        </h5>
                                        <div className="flex flex-wrap gap-2">
                                            {trends?.stable.map((s) => (
                                                <Badge key={s._id} variant="secondary" className="bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 border-none px-3 py-1">
                                                    {s.skillName}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-muted/50 p-4 rounded-xl">
                                        <h5 className="text-sm font-bold flex items-center gap-2 mb-2 text-primary">
                                            <Info className="w-4 h-4" /> Market Insight
                                        </h5>
                                        <p className="text-xs leading-relaxed text-muted-foreground">
                                            We're seeing a massive shift towards **Rust** and **AI-powered Backend tools**. Go is becoming the standard for cloud-native infrastructure. Web developers are expected to move towards full-stack TypeScript proficiency.
                                        </p>
                                    </div>

                                    <Card className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-none overflow-hidden">
                                        <CardContent className="p-6 relative">
                                            <h4 className="font-bold mb-2">Want a custom roadmap?</h4>
                                            <p className="text-xs opacity-90 mb-4">Talk to Zenith, your AI Mentor, to build a strategy for these skills.</p>
                                            <Button className="w-full bg-white text-indigo-600 hover:bg-slate-50 font-bold border-none shadow-sm" onClick={() => window.location.href = '/student/ai'}>
                                                Talk to Zenith
                                            </Button>
                                            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                                        </CardContent>
                                    </Card>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SkillMarketTracker;
