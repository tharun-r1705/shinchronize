import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { studentApi, recruiterApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
    Eye,
    EyeOff,
    Mail,
    Lock,
    User,
    Sparkles,
    GraduationCap,
    Building2,
    ArrowRight,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

const studentSignupSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    college: z.string().min(2, 'College name is required'),
});

const recruiterSignupSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    company: z.string().min(2, 'Company name is required'),
});

type StudentSignupData = z.infer<typeof studentSignupSchema>;
type RecruiterSignupData = z.infer<typeof recruiterSignupSchema>;

interface RoleConfig {
    key: 'student' | 'recruiter';
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
        description: 'Create your placement profile',
        color: 'from-cyan-500 to-blue-500',
    },
    {
        key: 'recruiter',
        label: 'Recruiter',
        icon: Building2,
        description: 'Find talented candidates',
        color: 'from-violet-500 to-purple-500',
    },
];

export default function SignupPage() {
    const [searchParams] = useSearchParams();
    const initialRole = (searchParams.get('role') as 'student' | 'recruiter') || 'student';

    const [selectedRole, setSelectedRole] = useState<'student' | 'recruiter'>(initialRole);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const studentForm = useForm<StudentSignupData>({
        resolver: zodResolver(studentSignupSchema),
    });

    const recruiterForm = useForm<RecruiterSignupData>({
        resolver: zodResolver(recruiterSignupSchema),
    });

    const onStudentSubmit = async (data: StudentSignupData) => {
        setIsLoading(true);
        try {
            const response: any = await studentApi.signup(data);

            if (response.token) {
                const userData = {
                    _id: response.student?._id || response._id,
                    name: data.name,
                    email: data.email,
                    role: 'student' as UserRole,
                    isProfileComplete: false,
                };

                login(response.token, userData);
                toast.success('Account created! Complete your profile to get started.');
                navigate('/student/profile');
            }
        } catch (error: any) {
            toast.error(error.message || 'Signup failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const onRecruiterSubmit = async (data: RecruiterSignupData) => {
        setIsLoading(true);
        try {
            const response: any = await recruiterApi.signup(data);

            if (response.token) {
                const userData = {
                    _id: response.recruiter?._id || response._id,
                    name: data.name,
                    email: data.email,
                    role: 'recruiter' as UserRole,
                    company: data.company,
                };

                login(response.token, userData);
                toast.success('Account created! Start exploring candidates.');
                navigate('/recruiter');
            }
        } catch (error: any) {
            toast.error(error.message || 'Signup failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const currentRole = roles.find(r => r.key === selectedRole)!;

    return (
        <div className="min-h-screen bg-background flex">
            {/* Left: Form */}
            <div className="flex-1 flex items-center justify-center p-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="w-full max-w-md"
                >
                    <Card className="border-border/50 shadow-xl">
                        <CardHeader className="text-center pb-2">
                            <div className="flex items-center justify-center gap-2 mb-4">
                                <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                                    <Sparkles className="w-6 h-6 text-primary-foreground" />
                                </div>
                                <span className="text-2xl font-bold text-gradient">EvolvEd</span>
                            </div>

                            <CardTitle className="text-2xl">Create your account</CardTitle>
                            <CardDescription>
                                Get started with your placement journey
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-6">
                            {/* Role Selector */}
                            <Tabs
                                value={selectedRole}
                                onValueChange={(v) => setSelectedRole(v as 'student' | 'recruiter')}
                                className="w-full"
                            >
                                <TabsList className="grid grid-cols-2 w-full">
                                    {roles.map((role) => (
                                        <TabsTrigger
                                            key={role.key}
                                            value={role.key}
                                            className="flex items-center gap-2"
                                        >
                                            <role.icon className="w-4 h-4" />
                                            {role.label}
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

                            {/* Student Signup Form */}
                            {selectedRole === 'student' && (
                                <form onSubmit={studentForm.handleSubmit(onStudentSubmit)} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Full Name</Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input
                                                id="name"
                                                placeholder="John Doe"
                                                className="pl-10"
                                                {...studentForm.register('name')}
                                            />
                                        </div>
                                        {studentForm.formState.errors.name && (
                                            <p className="text-sm text-destructive">{studentForm.formState.errors.name.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="you@college.edu"
                                                className="pl-10"
                                                {...studentForm.register('email')}
                                            />
                                        </div>
                                        {studentForm.formState.errors.email && (
                                            <p className="text-sm text-destructive">{studentForm.formState.errors.email.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="college">College</Label>
                                        <div className="relative">
                                            <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input
                                                id="college"
                                                placeholder="Your college name"
                                                className="pl-10"
                                                {...studentForm.register('college')}
                                            />
                                        </div>
                                        {studentForm.formState.errors.college && (
                                            <p className="text-sm text-destructive">{studentForm.formState.errors.college.message}</p>
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
                                                {...studentForm.register('password')}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        {studentForm.formState.errors.password && (
                                            <p className="text-sm text-destructive">{studentForm.formState.errors.password.message}</p>
                                        )}
                                    </div>

                                    <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                                        {isLoading ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                                Creating account...
                                            </div>
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                Create Student Account
                                                <ArrowRight className="w-4 h-4" />
                                            </span>
                                        )}
                                    </Button>
                                </form>
                            )}

                            {/* Recruiter Signup Form */}
                            {selectedRole === 'recruiter' && (
                                <form onSubmit={recruiterForm.handleSubmit(onRecruiterSubmit)} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Full Name</Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input
                                                id="name"
                                                placeholder="Jane Smith"
                                                className="pl-10"
                                                {...recruiterForm.register('name')}
                                            />
                                        </div>
                                        {recruiterForm.formState.errors.name && (
                                            <p className="text-sm text-destructive">{recruiterForm.formState.errors.name.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email">Work Email</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="you@company.com"
                                                className="pl-10"
                                                {...recruiterForm.register('email')}
                                            />
                                        </div>
                                        {recruiterForm.formState.errors.email && (
                                            <p className="text-sm text-destructive">{recruiterForm.formState.errors.email.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="company">Company</Label>
                                        <div className="relative">
                                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input
                                                id="company"
                                                placeholder="Your company name"
                                                className="pl-10"
                                                {...recruiterForm.register('company')}
                                            />
                                        </div>
                                        {recruiterForm.formState.errors.company && (
                                            <p className="text-sm text-destructive">{recruiterForm.formState.errors.company.message}</p>
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
                                                {...recruiterForm.register('password')}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        {recruiterForm.formState.errors.password && (
                                            <p className="text-sm text-destructive">{recruiterForm.formState.errors.password.message}</p>
                                        )}
                                    </div>

                                    <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                                        {isLoading ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                                Creating account...
                                            </div>
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                Create Recruiter Account
                                                <ArrowRight className="w-4 h-4" />
                                            </span>
                                        )}
                                    </Button>
                                </form>
                            )}

                            {/* Login link */}
                            <p className="text-center text-sm text-muted-foreground">
                                Already have an account?{' '}
                                <Link to="/login" className="text-primary hover:underline font-medium">
                                    Sign in
                                </Link>
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Right: Branding Panel */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-mesh">
                <div className="absolute inset-0 bg-gradient-to-bl from-accent/20 via-transparent to-primary/20" />

                <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1 className="text-4xl xl:text-5xl font-bold text-foreground mb-4">
                            Start Your{' '}
                            <span className="text-gradient">Journey</span>
                        </h1>

                        <p className="text-lg text-muted-foreground max-w-md mb-12">
                            Join thousands of students and recruiters transforming the campus placement experience.
                        </p>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-6">
                            {[
                                { value: '10K+', label: 'Students' },
                                { value: '500+', label: 'Companies' },
                                { value: '95%', label: 'Placement Rate' },
                                { value: '50+', label: 'Colleges' },
                            ].map((stat, i) => (
                                <motion.div
                                    key={stat.label}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 + i * 0.1 }}
                                    className="text-center p-4 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50"
                                >
                                    <div className="text-3xl font-bold text-gradient">{stat.value}</div>
                                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Decorative elements */}
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
                <div className="absolute top-20 left-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
            </div>
        </div>
    );
}
