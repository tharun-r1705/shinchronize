import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { studentApi, recruiterApi, adminApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
    Eye,
    EyeOff,
    Mail,
    Lock,
    Sparkles,
    GraduationCap,
    Building2,
    Shield,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

const loginSchema = z.object({
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface RoleConfig {
    key: UserRole;
    label: string;
    icon: React.ElementType;
    description: string;
    color: string;
}

const roles: RoleConfig[] = [
    {
        key: 'student',
        label: 'Student',
        icon: GraduationCap,
        description: 'Looking for placement opportunities',
        color: 'from-cyan-500 to-blue-500',
    },
    {
        key: 'recruiter',
        label: 'Recruiter',
        icon: Building2,
        description: 'Hiring talented candidates',
        color: 'from-violet-500 to-purple-500',
    },
    {
        key: 'admin',
        label: 'Admin',
        icon: Shield,
        description: 'Platform administration',
        color: 'from-amber-500 to-orange-500',
    },
];

export default function LoginPage() {
    const [selectedRole, setSelectedRole] = useState<UserRole>('student');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true);
        try {
            let response: any;

            switch (selectedRole) {
                case 'student':
                    response = await studentApi.login(data);
                    break;
                case 'recruiter':
                    response = await recruiterApi.login(data);
                    break;
                case 'admin':
                    response = await adminApi.login(data);
                    break;
            }

            if (response.token) {
                const userData = {
                    _id: response.student?._id || response.recruiter?._id || response.admin?._id || response._id,
                    name: response.student?.name || response.recruiter?.name || response.admin?.name || response.name,
                    email: data.email,
                    role: selectedRole,
                    avatarUrl: response.student?.avatarUrl || response.recruiter?.profilePicture,
                    company: response.recruiter?.company,
                    isProfileComplete: response.student?.isProfileComplete,
                };

                login(response.token, userData);
                toast.success(`Welcome back, ${userData.name}!`);

                // Navigate to appropriate dashboard
                const dashboardRoutes: Record<UserRole, string> = {
                    student: '/student',
                    recruiter: '/recruiter',
                    admin: '/admin',
                };
                navigate(dashboardRoutes[selectedRole]);
            }
        } catch (error: any) {
            toast.error(error.message || 'Login failed. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    const currentRole = roles.find(r => r.key === selectedRole)!;

    return (
        <div className="min-h-screen bg-background flex">
            {/* Left: Branding Panel */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-mesh">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20" />

                <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                                <Sparkles className="w-7 h-7 text-primary-foreground" />
                            </div>
                            <span className="text-3xl font-bold text-gradient">EvolvEd</span>
                        </div>

                        <h1 className="text-4xl xl:text-5xl font-bold text-foreground mb-4">
                            Campus Placements,{' '}
                            <span className="text-gradient">Reimagined</span>
                        </h1>

                        <p className="text-lg text-muted-foreground max-w-md mb-12">
                            AI-powered placement tracking platform connecting students with their dream careers.
                        </p>

                        {/* Features */}
                        <div className="space-y-4">
                            {[
                                'AI Mock Interviews with real-time feedback',
                                'Personalized learning roadmaps',
                                'Smart job matching algorithms',
                                'Skill market insights & trends',
                            ].map((feature, i) => (
                                <motion.div
                                    key={feature}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 + i * 0.1 }}
                                    className="flex items-center gap-3 text-muted-foreground"
                                >
                                    <div className="w-2 h-2 rounded-full bg-primary" />
                                    <span>{feature}</span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Decorative elements */}
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute top-20 right-20 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
            </div>

            {/* Right: Login Form */}
            <div className="flex-1 flex items-center justify-center p-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="w-full max-w-md"
                >
                    <Card className="border-border/50 shadow-xl">
                        <CardHeader className="text-center pb-2">
                            {/* Mobile logo */}
                            <div className="lg:hidden flex items-center justify-center gap-2 mb-4">
                                <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                                    <Sparkles className="w-6 h-6 text-primary-foreground" />
                                </div>
                                <span className="text-2xl font-bold text-gradient">EvolvEd</span>
                            </div>

                            <CardTitle className="text-2xl">Welcome back</CardTitle>
                            <CardDescription>
                                Sign in to your account to continue
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-6">
                            {/* Role Selector */}
                            <Tabs
                                value={selectedRole}
                                onValueChange={(v) => setSelectedRole(v as UserRole)}
                                className="w-full"
                            >
                                <TabsList className="grid grid-cols-3 w-full">
                                    {roles.map((role) => (
                                        <TabsTrigger
                                            key={role.key}
                                            value={role.key}
                                            className="flex items-center gap-1.5 text-xs sm:text-sm"
                                        >
                                            <role.icon className="w-4 h-4" />
                                            <span className="hidden sm:inline">{role.label}</span>
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </Tabs>

                            {/* Role Description */}
                            <div className={cn(
                                "p-3 rounded-lg bg-gradient-to-r text-white text-center text-sm",
                                currentRole.color
                            )}>
                                <currentRole.icon className="w-5 h-5 mx-auto mb-1" />
                                <p>{currentRole.description}</p>
                            </div>

                            {/* Login Form */}
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="you@example.com"
                                            className="pl-10"
                                            {...register('email')}
                                        />
                                    </div>
                                    {errors.email && (
                                        <p className="text-sm text-destructive">{errors.email.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            className="pl-10 pr-10"
                                            {...register('password')}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <p className="text-sm text-destructive">{errors.password.message}</p>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full"
                                    size="lg"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                            Signing in...
                                        </div>
                                    ) : (
                                        'Sign in'
                                    )}
                                </Button>
                            </form>

                            {/* Sign up link */}
                            {selectedRole !== 'admin' && (
                                <p className="text-center text-sm text-muted-foreground">
                                    Don't have an account?{' '}
                                    <Link
                                        to={`/signup?role=${selectedRole}`}
                                        className="text-primary hover:underline font-medium"
                                    >
                                        Sign up
                                    </Link>
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
