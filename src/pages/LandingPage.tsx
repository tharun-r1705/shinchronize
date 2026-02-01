import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Users, Briefcase, TrendingUp, Bot, Mic, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function LandingPage() {
    const features = [
        {
            icon: Mic,
            title: 'AI Mock Interviews',
            description: 'Practice with personalized questions and get real-time feedback on your answers.',
            gradient: 'from-violet-600 to-purple-600',
        },
        {
            icon: Map,
            title: 'Learning Roadmaps',
            description: 'AI-generated personalized paths to develop skills employers are looking for.',
            gradient: 'from-cyan-600 to-blue-600',
        },
        {
            icon: TrendingUp,
            title: 'Skill Market Intelligence',
            description: 'Discover trending skills, market demand, and personalized ROI recommendations.',
            gradient: 'from-emerald-600 to-green-600',
        },
        {
            icon: Bot,
            title: 'Zenith AI Mentor',
            description: 'Your personal career mentor available 24/7 for guidance and advice.',
            gradient: 'from-amber-600 to-orange-600',
        },
        {
            icon: Users,
            title: 'Smart Candidate Matching',
            description: 'Recruiters find the best candidates with AI-powered skill matching.',
            gradient: 'from-pink-600 to-rose-600',
        },
        {
            icon: Briefcase,
            title: 'Job Auto-Matching',
            description: 'Automatic matching of jobs with qualified candidates based on skills.',
            gradient: 'from-indigo-600 to-blue-600',
        },
    ];

    const stats = [
        { value: '10K+', label: 'Students' },
        { value: '500+', label: 'Companies' },
        { value: '95%', label: 'Placement Rate' },
        { value: '50+', label: 'Colleges' },
    ];

    return (
        <div className="min-h-screen bg-background overflow-x-hidden">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
                <div className="w-full max-w-6xl mx-auto px-6">
                    <div className="flex items-center justify-between h-16">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-lg bg-gradient-primary flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-primary-foreground" />
                            </div>
                            <span className="text-xl font-bold text-gradient">EvolvEd</span>
                        </Link>

                        <div className="flex items-center gap-3">
                            <Link to="/login">
                                <Button variant="ghost" className="rounded-full">Sign in</Button>
                            </Link>
                            <Link to="/signup">
                                <Button className="rounded-full">Get Started</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="min-h-screen pt-16 px-6 relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-mesh opacity-50" />
                <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 left-0 w-[400px] h-[400px] bg-accent/15 rounded-full blur-[100px]" />

                <div className="w-full max-w-6xl mx-auto relative z-10">
                    <div className="text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                        >
                            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
                                Campus Placements,
                                <br />
                                <span className="text-gradient">Reimagined</span>
                            </h1>
                            <p className="mt-8 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                                AI-powered platform connecting students with recruiters through smart matching,
                                personalized learning, and mock interview practice.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                            className="mt-10 flex items-center justify-center gap-4 flex-wrap"
                        >
                            <Link to="/signup">
                                <Button size="lg" className="text-base sm:text-lg px-6 sm:px-8 h-12 sm:h-14 rounded-full">
                                    Get Started Free <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            </Link>
                            <Link to="/login">
                                <Button size="lg" variant="outline" className="text-base sm:text-lg px-6 sm:px-8 h-12 sm:h-14 rounded-full">
                                    Sign In
                                </Button>
                            </Link>
                        </motion.div>

                        {/* Stats */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
                            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto"
                        >
                            {stats.map((stat, index) => (
                                <motion.div 
                                    key={stat.label} 
                                    className="text-center"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                                >
                                    <div className="text-3xl sm:text-4xl font-bold text-gradient">{stat.value}</div>
                                    <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 px-6 bg-muted/30">
                <div className="w-full max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold">
                            Everything you need to <span className="text-gradient">succeed</span>
                        </h2>
                        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                            Comprehensive tools for students and recruiters to streamline the placement process.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                whileHover={{ y: -4 }}
                                className="group"
                            >
                                <div className="h-full p-6 rounded-2xl bg-card border hover:shadow-xl transition-all">
                                    <div className={cn(
                                        'w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br text-white mb-4',
                                        feature.gradient
                                    )}>
                                        <feature.icon className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                                        {feature.title}
                                    </h3>
                                    <p className="text-muted-foreground">{feature.description}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10" />

                <div className="w-full max-w-6xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                            Ready to transform your career journey?
                        </h2>
                        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                            Join thousands of students who have already started their path to successful placements.
                        </p>
                        <Link to="/signup">
                            <Button size="lg" className="text-lg px-8 h-14 rounded-full">
                                Start Free Today <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-border/50 py-12 px-6">
                <div className="w-full max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                                <Sparkles className="w-4 h-4 text-primary-foreground" />
                            </div>
                            <span className="text-lg font-bold">EvolvEd</span>
                        </div>

                        <div className="flex items-center gap-8 text-sm text-muted-foreground">
                            <a href="#" className="hover:text-foreground transition-colors">About</a>
                            <a href="#" className="hover:text-foreground transition-colors">Careers</a>
                            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
                            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
                        </div>

                        <p className="text-sm text-muted-foreground">
                            © 2026 EvolvEd. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
