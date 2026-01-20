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
    Briefcase
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { StudentNavbar } from "@/components/StudentNavbar";
import { marketApi, SkillMarketData, TrendPredictions, SkillROIRecommendation, CompanySkillProfile } from "@/lib/api";
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

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const [skillsData, trendsData, roiData, companiesData] = await Promise.all([
                    marketApi.getSkills(),
                    marketApi.getTrends(),
                    token ? marketApi.getROI(token) : Promise.resolve([]),
                    marketApi.getCompanies()
                ]);

                setSkills(skillsData);
                setTrends(trendsData);
                setRoiReport(roiData);
                setCompanies(companiesData);
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

    const handleSearch = async () => {
        try {
            const data = await marketApi.getCompanies(searchQuery, companyType);
            setCompanies(data);
        } catch (error: any) {
            toast({
                title: "Search failed",
                description: error.message,
                variant: "destructive",
            });
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
                            <Card>
                                <CardHeader>
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                <Building2 className="w-5 h-5 text-primary" />
                                                Company-Specific Skill Database
                                            </CardTitle>
                                            <CardDescription>Know exactly what target companies are looking for</CardDescription>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <Input
                                                    placeholder="Search company..."
                                                    className="pl-9 w-[200px]"
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                                />
                                            </div>
                                            <Button size="sm" onClick={handleSearch}>Search</Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {companies.map((company) => (
                                            <div key={company._id} className="border rounded-xl p-5 hover:bg-muted/30 transition-all">
                                                <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-lg bg-white border p-2 flex items-center justify-center">
                                                            {company.logoUrl ? (
                                                                <img src={company.logoUrl} alt={company.companyName} className="max-w-full max-h-full object-contain" />
                                                            ) : (
                                                                <Building2 className="w-6 h-6 text-muted-foreground" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-lg">{company.companyName}</h4>
                                                            <div className="flex gap-2">
                                                                <Badge variant="outline" className="text-[10px] capitalize">{company.type}</Badge>
                                                                <span className="text-xs text-muted-foreground">{company.industry} • {company.location}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-sm font-semibold">Est. Salary Package</div>
                                                        <div className="text-lg font-bold text-emerald-600">₹{(company.avgSalaryRange.min / 100000).toFixed(1)}L - ₹{(company.avgSalaryRange.max / 100000).toFixed(1)}L PA</div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Core Tech Stack</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {company.requiredSkills.map((s, i) => (
                                                            <div key={i} className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full border border-border">
                                                                <span className="text-sm font-medium">{s.skillName}</span>
                                                                <div className="flex gap-0.5">
                                                                    {[...Array(5)].map((_, idx) => (
                                                                        <div key={idx} className={`w-1 h-3 rounded-full ${idx < s.proficiencyLevel ? 'bg-primary' : 'bg-muted-foreground/30'}`}></div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
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
