import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { marketApi, SkillMarketData, SkillROIRecommendation } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
    TrendingUp,
    TrendingDown,
    Minus,
    Search,
    Filter,
    DollarSign,
    Briefcase,
    Zap,
    Target,
    ArrowUpRight,
    BarChart3,
    Sparkles,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const categories = ['All', 'Programming', 'Cloud', 'Data', 'DevOps', 'Frontend', 'Backend', 'AI/ML'];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.05 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
};

function TrendIcon({ trend }: { trend: 'rising' | 'stable' | 'declining' }) {
    if (trend === 'rising') return <TrendingUp className="w-4 h-4 text-success" />;
    if (trend === 'declining') return <TrendingDown className="w-4 h-4 text-destructive" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
}

function SkillCard({ skill, index }: { skill: SkillMarketData; index?: number }) {
    return (
        <motion.div variants={itemVariants}>
            <Card variant="interactive" className="h-full group">
                <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                {index !== undefined && (
                                    <span className={cn(
                                        "w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0",
                                        index === 0 ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white" :
                                        index === 1 ? "bg-gradient-to-br from-slate-300 to-slate-400 text-slate-800" :
                                        index === 2 ? "bg-gradient-to-br from-amber-600 to-amber-700 text-white" :
                                        "bg-muted text-muted-foreground"
                                    )}>
                                        {index + 1}
                                    </span>
                                )}
                                <h3 className="font-semibold group-hover:text-primary transition-colors truncate">
                                    {skill.skillName}
                                </h3>
                            </div>
                            <Badge variant="secondary" size="sm">
                                {skill.category}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                            <TrendIcon trend={skill.trend} />
                            <span className={cn(
                                'text-sm font-semibold',
                                skill.trend === 'rising' ? 'text-success' :
                                    skill.trend === 'declining' ? 'text-destructive' : 'text-muted-foreground'
                            )}>
                                {skill.yoyGrowth > 0 ? '+' : ''}{skill.yoyGrowth}%
                            </span>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 mt-4">
                        <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50">
                            <p className="text-xs text-muted-foreground">Demand</p>
                            <p className="text-base font-semibold">{skill.demandScore}</p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50">
                            <p className="text-xs text-muted-foreground">Jobs</p>
                            <p className="text-base font-semibold">{skill.jobCount.toLocaleString()}</p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50">
                            <p className="text-xs text-muted-foreground">Avg Salary</p>
                            <p className="text-base font-semibold">₹{(skill.avgSalary / 100000).toFixed(1)}L</p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50">
                            <p className="text-xs text-muted-foreground">6M Outlook</p>
                            <p className={cn(
                                'text-base font-semibold',
                                skill.predictedGrowth6m > 0 ? 'text-success' : 'text-destructive'
                            )}>
                                {skill.predictedGrowth6m > 0 ? '+' : ''}{skill.predictedGrowth6m}%
                            </p>
                        </div>
                    </div>

                    {skill.relatedSkills?.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-border/50">
                            <p className="text-xs text-muted-foreground mb-2">Related Skills</p>
                            <div className="flex flex-wrap gap-1">
                                {skill.relatedSkills.slice(0, 3).map((s) => (
                                    <Badge key={s} variant="outline" size="sm">
                                        {s}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}

function ROICard({ recommendation, index }: { recommendation: SkillROIRecommendation; index: number }) {
    const impactConfig = {
        High: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/20' },
        Medium: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/20' },
        Low: { bg: 'bg-muted/50', text: 'text-muted-foreground', border: 'border-border' },
    };

    const config = impactConfig[recommendation.impact];

    return (
        <motion.div variants={itemVariants}>
            <Card variant="bento" className="h-full hover:shadow-md transition-all">
                <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <span className={cn(
                                "w-8 h-8 rounded-lg text-sm font-bold flex items-center justify-center",
                                index === 0 ? "bg-gradient-to-br from-primary to-purple-500 text-white" :
                                "bg-muted text-muted-foreground"
                            )}>
                                {index + 1}
                            </span>
                            <div>
                                <h3 className="font-semibold">{recommendation.skillName}</h3>
                                <Badge variant="secondary" size="sm" className="mt-0.5">
                                    {recommendation.category}
                                </Badge>
                            </div>
                        </div>
                        <Badge className={cn('border', config.bg, config.text, config.border)}>
                            {recommendation.impact}
                        </Badge>
                    </div>

                    {/* ROI Score Highlight */}
                    <div className={cn("p-3 rounded-lg mb-4", config.bg, `border ${config.border}`)}>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">ROI Score</span>
                            <span className={cn("text-2xl font-bold", config.text)}>
                                {recommendation.roiScore}%
                            </span>
                        </div>
                        <Progress 
                            value={recommendation.roiScore} 
                            className="h-1.5 mt-2 bg-background/50"
                            indicatorVariant={recommendation.impact === 'High' ? 'success' : recommendation.impact === 'Medium' ? 'warning' : 'default'}
                        />
                    </div>

                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground flex items-center gap-2">
                                <Zap className="w-3.5 h-3.5" /> Market Demand
                            </span>
                            <span className="font-medium">{recommendation.marketDemand}%</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground flex items-center gap-2">
                                <TrendingUp className="w-3.5 h-3.5" /> Growth
                            </span>
                            <span className="font-medium text-success">+{recommendation.predictedGrowth}%</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground flex items-center gap-2">
                                <DollarSign className="w-3.5 h-3.5" /> Avg Salary
                            </span>
                            <span className="font-medium">₹{(recommendation.avgSalary / 100000).toFixed(1)}L</span>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-border/50">
                        <p className="text-xs text-muted-foreground">Time Investment</p>
                        <p className="font-medium text-sm">{recommendation.timeInvestment}</p>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

export default function SkillMarketPage() {
    const { token } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [activeTab, setActiveTab] = useState('trends');

    const { data: allSkills, isLoading: skillsLoading } = useQuery({
        queryKey: ['market-skills'],
        queryFn: () => marketApi.getSkills(),
    });

    const { data: trends, isLoading: trendsLoading } = useQuery({
        queryKey: ['market-trends'],
        queryFn: () => marketApi.getTrends(),
    });

    const { data: roi, isLoading: roiLoading } = useQuery({
        queryKey: ['market-roi'],
        queryFn: () => marketApi.getROI(token!),
        enabled: !!token,
    });

    const filteredSkills = allSkills?.filter((skill) => {
        const matchesSearch = skill.skillName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || skill.category === selectedCategory;
        return matchesSearch && matchesCategory;
    }) || [];

    return (
        <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4"
            >
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-glow-accent">
                    <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold">Skill Market Intelligence</h1>
                    <p className="text-muted-foreground text-sm">
                        Discover in-demand skills and optimize your learning investments
                    </p>
                </div>
            </motion.div>

            {/* Stats Overview */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
                <Card variant="stat" className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <BarChart3 className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{allSkills?.length || 0}</p>
                            <p className="text-xs text-muted-foreground">Skills Tracked</p>
                        </div>
                    </div>
                </Card>
                <Card variant="stat" className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-success/10">
                            <TrendingUp className="w-4 h-4 text-success" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-success">{trends?.rising?.length || 0}</p>
                            <p className="text-xs text-muted-foreground">Rising</p>
                        </div>
                    </div>
                </Card>
                <Card variant="stat" className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-warning/10">
                            <Minus className="w-4 h-4 text-warning" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-warning">{trends?.stable?.length || 0}</p>
                            <p className="text-xs text-muted-foreground">Stable</p>
                        </div>
                    </div>
                </Card>
                <Card variant="stat" className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-accent/10">
                            <Sparkles className="w-4 h-4 text-accent" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-accent">{roi?.length || 0}</p>
                            <p className="text-xs text-muted-foreground">ROI Matches</p>
                        </div>
                    </div>
                </Card>
            </motion.div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-muted/50">
                    <TabsTrigger value="trends">Trending</TabsTrigger>
                    <TabsTrigger value="all">All Skills</TabsTrigger>
                    <TabsTrigger value="roi">Your ROI</TabsTrigger>
                </TabsList>

                {/* Trending Tab */}
                <TabsContent value="trends" className="space-y-8">
                    {/* Rising Skills */}
                    <div>
                        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                            <TrendingUp className="w-5 h-5 text-success" />
                            Rising Skills
                            <Badge variant="success" size="sm">Hot</Badge>
                        </h2>
                        {trendsLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[1, 2, 3].map((i) => (
                                    <Skeleton key={i} className="h-64 rounded-xl" />
                                ))}
                            </div>
                        ) : (
                            <motion.div
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                            >
                                {trends?.rising?.slice(0, 6).map((skill, index) => (
                                    <SkillCard key={skill._id} skill={skill} index={index} />
                                ))}
                            </motion.div>
                        )}
                    </div>

                    {/* Stable Skills */}
                    <div>
                        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                            <Minus className="w-5 h-5 text-warning" />
                            Stable Demand
                        </h2>
                        {trendsLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[1, 2, 3].map((i) => (
                                    <Skeleton key={i} className="h-64 rounded-xl" />
                                ))}
                            </div>
                        ) : (
                            <motion.div
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                            >
                                {trends?.stable?.slice(0, 6).map((skill) => (
                                    <SkillCard key={skill._id} skill={skill} />
                                ))}
                            </motion.div>
                        )}
                    </div>
                </TabsContent>

                {/* All Skills Tab */}
                <TabsContent value="all" className="space-y-6">
                    {/* Search & Filter */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search skills..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 h-11"
                            />
                        </div>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger className="w-full sm:w-48 h-11">
                                <Filter className="w-4 h-4 mr-2" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((cat) => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Skills Grid */}
                    {skillsLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <Skeleton key={i} className="h-64 rounded-xl" />
                            ))}
                        </div>
                    ) : filteredSkills.length === 0 ? (
                        <Card variant="bento" className="border-dashed border-2">
                            <CardContent className="py-12 text-center">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                                    <Search className="w-8 h-8 text-muted-foreground/50" />
                                </div>
                                <p className="font-medium">No skills found</p>
                                <p className="text-sm text-muted-foreground">Try adjusting your search criteria</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                        >
                            {filteredSkills.map((skill) => (
                                <SkillCard key={skill._id} skill={skill} />
                            ))}
                        </motion.div>
                    )}
                </TabsContent>

                {/* ROI Tab */}
                <TabsContent value="roi">
                    {roiLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <Skeleton key={i} className="h-72 rounded-xl" />
                            ))}
                        </div>
                    ) : !roi || roi.length === 0 ? (
                        <Card variant="bento" className="border-dashed border-2">
                            <CardContent className="py-16 text-center">
                                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                                    <Target className="w-10 h-10 text-primary/50" />
                                </div>
                                <h3 className="font-semibold text-lg mb-2">Complete Your Profile</h3>
                                <p className="text-muted-foreground max-w-md mx-auto text-sm">
                                    Add your current skills and learning goals to get personalized ROI recommendations.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            <p className="text-muted-foreground mb-6 text-sm">
                                Personalized skill recommendations based on your profile and market trends.
                            </p>
                            <motion.div
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                            >
                                {roi.map((rec, index) => (
                                    <ROICard key={rec.skillName} recommendation={rec} index={index} />
                                ))}
                            </motion.div>
                        </>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
