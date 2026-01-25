import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    TrendingUp,
    BarChart3,
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
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, 
    ResponsiveContainer, Area, AreaChart, Cell, RadialBarChart, RadialBar, Legend,
    PieChart, Pie
} from "recharts";
import { StudentNavbar } from "@/components/StudentNavbar";
import { marketApi, studentApi, SkillMarketData, TrendPredictions, SkillROIRecommendation, CompanySkillProfile } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

// Gradient colors for charts
const GRADIENT_COLORS = [
    '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', 
    '#f43f5e', '#f97316', '#facc15', '#22c55e', '#14b8a6'
];

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

    // State for real-time search
    const [isSearching, setIsSearching] = useState(false);
    const [visibleCompaniesCount, setVisibleCompaniesCount] = useState(5);

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
                
                // Debug: Check skillRadar structure
                if (profileData) {
                    console.log('Student Profile:', profileData);
                    console.log('SkillRadar:', profileData.skillRadar);
                    console.log('SkillRadar type:', typeof profileData.skillRadar);
                    console.log('SkillRadar keys:', profileData.skillRadar ? Object.keys(profileData.skillRadar) : 'none');
                }
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

    // Load all companies when companyType changes (without search query)
    useEffect(() => {
        if (!searchQuery.trim()) {
            const fetchCompanies = async () => {
                try {
                    const data = await marketApi.getCompanies('', companyType);
                    setCompanies(data);
                    setVisibleCompaniesCount(5); // Reset to show 5 companies
                } catch (error) {
                    console.error("Fetch error:", error);
                }
            };
            fetchCompanies();
        }
    }, [companyType]);

    const handleSearch = async () => {
        if (!searchQuery.trim() || isSearching) return;

        setIsSearching(true);
        try {
            const data = await marketApi.getCompanies(searchQuery, companyType);
            setCompanies(data);
            setVisibleCompaniesCount(5); // Reset to show 5 companies after search
            
            if (data.length > 0) {
                toast({
                    title: "Company found! 🎉",
                    description: `Found ${data.length} matching ${data.length === 1 ? 'company' : 'companies'}`,
                });
            } else {
                toast({
                    title: "Company not found",
                    description: `"${searchQuery}" doesn't appear to be a real company or isn't in our database yet.`,
                    variant: "destructive",
                });
            }
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
                                    <Tabs defaultValue="cards" className="w-full">
                                        <TabsList className="mb-4">
                                            <TabsTrigger value="cards">Card View</TabsTrigger>
                                            <TabsTrigger value="chart">Chart View</TabsTrigger>
                                        </TabsList>
                                        
                                        <TabsContent value="cards" className="mt-0">
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
                                        </TabsContent>
                                        
                                        <TabsContent value="chart" className="mt-0">
                                            <div className="h-[400px] w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={skills.slice(0, 10)} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                                                        <defs>
                                                            <linearGradient id="skillGradient" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1}/>
                                                                <stop offset="100%" stopColor="#6366f1" stopOpacity={0.8}/>
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                                        <XAxis 
                                                            dataKey="skillName" 
                                                            angle={-45}
                                                            textAnchor="end"
                                                            height={80}
                                                            fontSize={11}
                                                            tick={{ fill: '#64748b' }}
                                                            axisLine={{ stroke: '#e2e8f0' }}
                                                        />
                                                        <YAxis 
                                                            tick={{ fill: '#64748b' }}
                                                            axisLine={{ stroke: '#e2e8f0' }}
                                                            fontSize={11}
                                                        />
                                                        <ChartTooltip 
                                                            cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }}
                                                            content={({ active, payload }) => {
                                                                if (active && payload && payload.length) {
                                                                    const data = payload[0].payload;
                                                                    return (
                                                                        <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl p-4 shadow-xl">
                                                                            <p className="font-bold text-lg text-slate-900">{data.skillName}</p>
                                                                            <p className="text-sm text-slate-600">{data.category}</p>
                                                                            <div className="mt-2 space-y-1">
                                                                                <p className="text-sm"><span className="font-semibold text-indigo-600">{data.demandScore}%</span> Demand Score</p>
                                                                                <p className="text-sm"><span className="font-semibold text-emerald-600">{(data.jobCount / 1000).toFixed(0)}k</span> Job Openings</p>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                }
                                                                return null;
                                                            }}
                                                        />
                                                        <Bar 
                                                            dataKey="demandScore" 
                                                            fill="url(#skillGradient)" 
                                                            radius={[8, 8, 0, 0]}
                                                            stroke="#8b5cf6"
                                                            strokeWidth={1}
                                                        >
                                                            {skills.slice(0, 10).map((entry, index) => (
                                                                <Cell 
                                                                    key={`cell-${index}`} 
                                                                    fill={GRADIENT_COLORS[index % GRADIENT_COLORS.length]}
                                                                    fillOpacity={0.85}
                                                                />
                                                            ))}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </TabsContent>
                                    </Tabs>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Personalized ROI Calculator */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-violet-500/5 shadow-premium overflow-hidden">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <DollarSign className="w-5 h-5 text-primary" />
                                        Personalized Skill ROI Calculator
                                    </CardTitle>
                                    <CardDescription>Top skills recommended for you based on market value and effort</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {roiReport.length > 0 ? (
                                        <>
                                            {/* ROI Visualization Chart */}
                                            <div className="bg-white/80 rounded-xl p-4 mb-4 border border-slate-100">
                                                <div className="h-[180px] w-full">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <BarChart 
                                                            data={roiReport} 
                                                            layout="vertical"
                                                            margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                                                        >
                                                            <defs>
                                                                <linearGradient id="roiGradient" x1="0" y1="0" x2="1" y2="0">
                                                                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.8}/>
                                                                    <stop offset="100%" stopColor="#a855f7" stopOpacity={0.9}/>
                                                                </linearGradient>
                                                            </defs>
                                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                                                            <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} />
                                                            <YAxis 
                                                                dataKey="skillName" 
                                                                type="category" 
                                                                tick={{ fill: '#334155', fontSize: 12, fontWeight: 500 }}
                                                                axisLine={false}
                                                                width={55}
                                                            />
                                                            <ChartTooltip 
                                                                cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                                                                content={({ active, payload }) => {
                                                                    if (active && payload && payload.length) {
                                                                        const data = payload[0].payload;
                                                                        return (
                                                                            <div className="bg-white/95 backdrop-blur-sm border border-indigo-200 rounded-xl p-3 shadow-xl">
                                                                                <p className="font-bold text-slate-900">{data.skillName}</p>
                                                                                <p className="text-xs text-slate-500">{data.category}</p>
                                                                                <div className="mt-2 space-y-1">
                                                                                    <p className="text-sm"><span className="font-bold text-indigo-600">{data.roiScore}</span> ROI Score</p>
                                                                                    <p className="text-sm">~₹{(data.avgSalary / 100000).toFixed(1)}L Avg Salary</p>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    }
                                                                    return null;
                                                                }}
                                                            />
                                                            <Bar 
                                                                dataKey="roiScore" 
                                                                fill="url(#roiGradient)"
                                                                radius={[0, 8, 8, 0]}
                                                            />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>
                                            
                                            {/* ROI Detail Cards */}
                                            {roiReport.map((item, idx) => (
                                            <div key={idx} className="bg-card p-4 rounded-lg border border-border flex flex-col md:flex-row md:items-center gap-4 group hover:border-primary/40 transition-colors hover:shadow-md">
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
                                            </div>
                                            ))}
                                        </>
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
                                            <CardTitle className="flex items-center gap-2 text-white">
                                                <Building2 className="w-6 h-6" />
                                                Company-Specific Skill Database
                                            </CardTitle>
                                            <CardDescription className="text-indigo-100">Browse company tech stacks and salary information</CardDescription>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="relative group">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                                                <Input
                                                    placeholder="Search companies..."
                                                    className="pl-9 w-[260px] bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white focus:text-black transition-all"
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            handleSearch();
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                className="font-bold shrink-0"
                                                onClick={handleSearch}
                                                disabled={isSearching}
                                            >
                                                {isSearching ? 'Searching...' : 'Search'}
                                            </Button>
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
                                            companies.slice(0, visibleCompaniesCount).map((company, idx) => {
                                                return (
                                                    <motion.div
                                                        key={company._id}
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        transition={{ delay: idx * 0.05 }}
                                                        className="p-6 transition-all hover:bg-muted/30"
                                                    >
                                                        <div className="flex flex-col md:flex-row justify-between gap-6">
                                                            <div className="flex items-start gap-4">
                                                                <div className="w-14 h-14 rounded-2xl bg-white border-2 border-muted shadow-sm p-3 flex items-center justify-center">
                                                                    {company.logoUrl ? (
                                                                        <img src={company.logoUrl} alt={company.companyName} className="max-w-full max-h-full object-contain" />
                                                                    ) : (
                                                                        <Building2 className="w-8 h-8 text-indigo-500" />
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <h4 className="font-bold text-xl">{company.companyName}</h4>
                                                                        <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 uppercase text-[90%] scale-90">{company.type}</Badge>
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

                                                        {/* Tech Stack */}
                                                        <div className="mt-5 space-y-3">
                                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Core Tech Stack</p>
                                                            <div className="flex flex-wrap gap-2.5">
                                                                {company.requiredSkills.map((s, i) => (
                                                                    <div key={i} className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-border shadow-sm">
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
                                        {companies.length > visibleCompaniesCount && (
                                            <div className="p-6 text-center bg-gradient-to-b from-transparent to-muted/50">
                                                <Button
                                                    variant="outline"
                                                    size="lg"
                                                    className="font-bold gap-2 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300"
                                                    onClick={() => setVisibleCompaniesCount(prev => prev + 5)}
                                                >
                                                    Load More Companies
                                                    <ArrowDownRight className="w-4 h-4" />
                                                </Button>
                                                <p className="text-xs text-muted-foreground mt-2">
                                                    Showing {visibleCompaniesCount} of {companies.length} companies
                                                </p>
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
                                    {/* Trend Chart - Beautiful Area Chart */}
                                    <div className="mb-6 bg-gradient-to-br from-slate-50 to-indigo-50/50 rounded-xl p-4 border border-slate-100">
                                        <div className="h-[220px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={trends?.rising || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                    <defs>
                                                        <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.4}/>
                                                            <stop offset="50%" stopColor="#22c55e" stopOpacity={0.15}/>
                                                            <stop offset="100%" stopColor="#22c55e" stopOpacity={0}/>
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                                    <XAxis 
                                                        dataKey="skillName" 
                                                        fontSize={10}
                                                        tick={{ fill: '#64748b' }}
                                                        axisLine={false}
                                                        tickLine={false}
                                                    />
                                                    <YAxis 
                                                        fontSize={10} 
                                                        tick={{ fill: '#64748b' }}
                                                        axisLine={false}
                                                        tickLine={false}
                                                    />
                                                    <ChartTooltip 
                                                        content={({ active, payload }) => {
                                                            if (active && payload && payload.length) {
                                                                const data = payload[0].payload;
                                                                return (
                                                                    <div className="bg-white/95 backdrop-blur-sm border border-emerald-200 rounded-lg p-3 shadow-lg">
                                                                        <p className="font-bold text-slate-900">{data.skillName}</p>
                                                                        <p className="text-emerald-600 font-semibold">+{data.predictedGrowth6m}% Growth</p>
                                                                    </div>
                                                                );
                                                            }
                                                            return null;
                                                        }}
                                                    />
                                                    <Area 
                                                        type="monotone" 
                                                        dataKey="predictedGrowth6m" 
                                                        stroke="#22c55e"
                                                        strokeWidth={3}
                                                        fill="url(#trendGradient)"
                                                        dot={{ fill: "#fff", stroke: "#22c55e", strokeWidth: 2, r: 5 }}
                                                        activeDot={{ fill: "#22c55e", stroke: "#fff", strokeWidth: 2, r: 7 }}
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

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
