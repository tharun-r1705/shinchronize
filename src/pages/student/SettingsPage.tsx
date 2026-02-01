import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
    User,
    Bell,
    Shield,
    Palette,
    Code,
    LogOut,
    Trash2,
    Moon,
    Sun,
    Monitor,
    Mail,
    Smartphone,
    Globe,
    Eye,
    EyeOff,
    Save,
    RefreshCw,
    Settings,
    Lock,
    Zap,
    CheckCircle,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

interface NotificationSettings {
    email: boolean;
    push: boolean;
    weeklyDigest: boolean;
    roadmapReminders: boolean;
    interviewTips: boolean;
    marketUpdates: boolean;
}

interface PrivacySettings {
    profilePublic: boolean;
    showOnLeaderboard: boolean;
    allowRecruiterContact: boolean;
}

export default function SettingsPage() {
    const { user, logout, role } = useAuth();
    const navigate = useNavigate();

    const [notifications, setNotifications] = useState<NotificationSettings>({
        email: true,
        push: true,
        weeklyDigest: true,
        roadmapReminders: true,
        interviewTips: false,
        marketUpdates: true,
    });

    const [privacy, setPrivacy] = useState<PrivacySettings>({
        profilePublic: true,
        showOnLeaderboard: true,
        allowRecruiterContact: true,
    });

    const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('dark');
    const [isSaving, setIsSaving] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
        toast.success('Logged out successfully');
    };

    const handleSave = async () => {
        setIsSaving(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsSaving(false);
        toast.success('Settings saved successfully');
    };

    return (
        <div className="p-4 lg:p-6 space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                        <Settings className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Settings</h1>
                        <p className="text-muted-foreground">
                            Manage your account preferences and settings
                        </p>
                    </div>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <Tabs defaultValue="account" className="w-full">
                    <TabsList className="w-full max-w-lg grid grid-cols-4 p-1 bg-muted/50 rounded-xl">
                        <TabsTrigger value="account" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            <User className="w-4 h-4" />
                            <span className="hidden sm:inline">Account</span>
                        </TabsTrigger>
                        <TabsTrigger value="notifications" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            <Bell className="w-4 h-4" />
                            <span className="hidden sm:inline">Alerts</span>
                        </TabsTrigger>
                        <TabsTrigger value="privacy" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            <Shield className="w-4 h-4" />
                            <span className="hidden sm:inline">Privacy</span>
                        </TabsTrigger>
                        <TabsTrigger value="appearance" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            <Palette className="w-4 h-4" />
                            <span className="hidden sm:inline">Theme</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* Account Tab */}
                    <TabsContent value="account" className="mt-6">
                        <motion.div 
                            className="space-y-6"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            <motion.div variants={itemVariants}>
                                <Card variant="bento">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <div className="p-2 rounded-lg bg-primary/10">
                                                <User className="w-4 h-4 text-primary" />
                                            </div>
                                            Account Information
                                        </CardTitle>
                                        <CardDescription>
                                            Your basic account details
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label>Name</Label>
                                                <Input value={user?.name || ''} disabled className="bg-muted/50" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Email</Label>
                                                <Input value={user?.email || ''} disabled className="bg-muted/50" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Role</Label>
                                            <Input value={user?.role || ''} disabled className="capitalize bg-muted/50" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            <motion.div variants={itemVariants}>
                                <Card variant="bento">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <div className="p-2 rounded-lg bg-warning/10">
                                                <Lock className="w-4 h-4 text-warning" />
                                            </div>
                                            Change Password
                                        </CardTitle>
                                        <CardDescription>
                                            Update your password to keep your account secure
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="current-password">Current Password</Label>
                                            <Input
                                                id="current-password"
                                                type="password"
                                                placeholder="Enter current password"
                                                className="bg-background/50"
                                            />
                                        </div>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="new-password">New Password</Label>
                                                <Input
                                                    id="new-password"
                                                    type="password"
                                                    placeholder="Enter new password"
                                                    className="bg-background/50"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="confirm-password">Confirm Password</Label>
                                                <Input
                                                    id="confirm-password"
                                                    type="password"
                                                    placeholder="Confirm new password"
                                                    className="bg-background/50"
                                                />
                                            </div>
                                        </div>
                                        <Button variant="soft-primary">Update Password</Button>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {role === 'student' && (
                                <motion.div variants={itemVariants}>
                                    <Card variant="bento">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <div className="p-2 rounded-lg bg-accent/10">
                                                    <Zap className="w-4 h-4 text-accent" />
                                                </div>
                                                Connected Accounts
                                            </CardTitle>
                                            <CardDescription>
                                                Manage your connected coding profiles
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-warning/5 to-warning/0 border border-warning/20">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                                                        <Code className="w-5 h-5 text-warning" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">LeetCode</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            Sync your problem-solving progress
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button variant="soft-primary" size="sm">Configure</Button>
                                            </div>
                                            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-foreground/5 to-foreground/0 border border-border">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-foreground/10 flex items-center justify-center">
                                                        <Globe className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">GitHub</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            Track your contributions
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button variant="soft-primary" size="sm">Configure</Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )}

                            <motion.div variants={itemVariants}>
                                <Card variant="bento" className="border-destructive/20">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-destructive">
                                            <div className="p-2 rounded-lg bg-destructive/10">
                                                <Trash2 className="w-4 h-4 text-destructive" />
                                            </div>
                                            Danger Zone
                                        </CardTitle>
                                        <CardDescription>
                                            Irreversible actions for your account
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
                                            <div>
                                                <p className="font-medium">Sign Out</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Sign out from your account
                                                </p>
                                            </div>
                                            <Button variant="outline" onClick={handleLogout}>
                                                <LogOut className="w-4 h-4 mr-2" />
                                                Sign Out
                                            </Button>
                                        </div>
                                        <div className="flex items-center justify-between p-4 rounded-xl border border-destructive/20 bg-destructive/5">
                                            <div>
                                                <p className="font-medium text-destructive">Delete Account</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Permanently delete your account and all data
                                                </p>
                                            </div>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive">
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        Delete
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete Account?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone. This will permanently
                                                            delete your account and remove all your data from our
                                                            servers.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                            Yes, delete my account
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </motion.div>
                    </TabsContent>

                    {/* Notifications Tab */}
                    <TabsContent value="notifications" className="mt-6">
                        <motion.div 
                            className="space-y-6"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            <motion.div variants={itemVariants}>
                                <Card variant="bento">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <div className="p-2 rounded-lg bg-primary/10">
                                                <Bell className="w-4 h-4 text-primary" />
                                            </div>
                                            Notification Channels
                                        </CardTitle>
                                        <CardDescription>
                                            Choose how you want to receive notifications
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-primary/10">
                                                    <Mail className="w-4 h-4 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">Email Notifications</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Receive notifications via email
                                                    </p>
                                                </div>
                                            </div>
                                            <Switch
                                                checked={notifications.email}
                                                onCheckedChange={(checked) =>
                                                    setNotifications({ ...notifications, email: checked })
                                                }
                                            />
                                        </div>
                                        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-accent/10">
                                                    <Smartphone className="w-4 h-4 text-accent" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">Push Notifications</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Receive push notifications in browser
                                                    </p>
                                                </div>
                                            </div>
                                            <Switch
                                                checked={notifications.push}
                                                onCheckedChange={(checked) =>
                                                    setNotifications({ ...notifications, push: checked })
                                                }
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            <motion.div variants={itemVariants}>
                                <Card variant="bento">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <div className="p-2 rounded-lg bg-accent/10">
                                                <CheckCircle className="w-4 h-4 text-accent" />
                                            </div>
                                            Notification Preferences
                                        </CardTitle>
                                        <CardDescription>
                                            Choose what you want to be notified about
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {[
                                            { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'Summary of your weekly progress' },
                                            { key: 'roadmapReminders', label: 'Roadmap Reminders', desc: 'Reminders to continue your learning' },
                                            { key: 'interviewTips', label: 'Interview Tips', desc: 'Tips to improve your interview skills' },
                                            { key: 'marketUpdates', label: 'Market Updates', desc: 'Updates on skill market trends' },
                                        ].map((item) => (
                                            <div key={item.key} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors">
                                                <div>
                                                    <p className="font-medium">{item.label}</p>
                                                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                                                </div>
                                                <Switch
                                                    checked={notifications[item.key as keyof NotificationSettings]}
                                                    onCheckedChange={(checked) =>
                                                        setNotifications({ ...notifications, [item.key]: checked })
                                                    }
                                                />
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </motion.div>
                    </TabsContent>

                    {/* Privacy Tab */}
                    <TabsContent value="privacy" className="mt-6">
                        <motion.div 
                            className="space-y-6"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            <motion.div variants={itemVariants}>
                                <Card variant="bento">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <div className="p-2 rounded-lg bg-primary/10">
                                                <Shield className="w-4 h-4 text-primary" />
                                            </div>
                                            Profile Visibility
                                        </CardTitle>
                                        <CardDescription>
                                            Control who can see your profile
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-primary/10">
                                                    {privacy.profilePublic ? (
                                                        <Eye className="w-4 h-4 text-primary" />
                                                    ) : (
                                                        <EyeOff className="w-4 h-4 text-muted-foreground" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium">Public Profile</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Allow recruiters to find and view your profile
                                                    </p>
                                                </div>
                                            </div>
                                            <Switch
                                                checked={privacy.profilePublic}
                                                onCheckedChange={(checked) =>
                                                    setPrivacy({ ...privacy, profilePublic: checked })
                                                }
                                            />
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors">
                                            <div>
                                                <p className="font-medium">Show on Leaderboard</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Display your ranking on the public leaderboard
                                                </p>
                                            </div>
                                            <Switch
                                                checked={privacy.showOnLeaderboard}
                                                onCheckedChange={(checked) =>
                                                    setPrivacy({ ...privacy, showOnLeaderboard: checked })
                                                }
                                            />
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors">
                                            <div>
                                                <p className="font-medium">Allow Recruiter Contact</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Let recruiters contact you about opportunities
                                                </p>
                                            </div>
                                            <Switch
                                                checked={privacy.allowRecruiterContact}
                                                onCheckedChange={(checked) =>
                                                    setPrivacy({ ...privacy, allowRecruiterContact: checked })
                                                }
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </motion.div>
                    </TabsContent>

                    {/* Appearance Tab */}
                    <TabsContent value="appearance" className="mt-6">
                        <motion.div 
                            className="space-y-6"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            <motion.div variants={itemVariants}>
                                <Card variant="bento">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <div className="p-2 rounded-lg bg-primary/10">
                                                <Palette className="w-4 h-4 text-primary" />
                                            </div>
                                            Theme
                                        </CardTitle>
                                        <CardDescription>
                                            Choose your preferred color theme
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-3 gap-4">
                                            <button
                                                onClick={() => setTheme('light')}
                                                className={cn(
                                                    'relative h-24 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all',
                                                    theme === 'light' 
                                                        ? 'border-primary bg-primary/5 shadow-lg shadow-primary/20' 
                                                        : 'border-border hover:border-primary/50 hover:bg-muted/30'
                                                )}
                                            >
                                                <div className="p-2 rounded-lg bg-amber-500/10">
                                                    <Sun className="w-6 h-6 text-amber-500" />
                                                </div>
                                                <span className="text-sm font-medium">Light</span>
                                                {theme === 'light' && (
                                                    <div className="absolute top-2 right-2">
                                                        <CheckCircle className="w-4 h-4 text-primary" />
                                                    </div>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => setTheme('dark')}
                                                className={cn(
                                                    'relative h-24 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all',
                                                    theme === 'dark' 
                                                        ? 'border-primary bg-primary/5 shadow-lg shadow-primary/20' 
                                                        : 'border-border hover:border-primary/50 hover:bg-muted/30'
                                                )}
                                            >
                                                <div className="p-2 rounded-lg bg-primary/10">
                                                    <Moon className="w-6 h-6 text-primary" />
                                                </div>
                                                <span className="text-sm font-medium">Dark</span>
                                                {theme === 'dark' && (
                                                    <div className="absolute top-2 right-2">
                                                        <CheckCircle className="w-4 h-4 text-primary" />
                                                    </div>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => setTheme('system')}
                                                className={cn(
                                                    'relative h-24 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all',
                                                    theme === 'system' 
                                                        ? 'border-primary bg-primary/5 shadow-lg shadow-primary/20' 
                                                        : 'border-border hover:border-primary/50 hover:bg-muted/30'
                                                )}
                                            >
                                                <div className="p-2 rounded-lg bg-muted">
                                                    <Monitor className="w-6 h-6 text-muted-foreground" />
                                                </div>
                                                <span className="text-sm font-medium">System</span>
                                                {theme === 'system' && (
                                                    <div className="absolute top-2 right-2">
                                                        <CheckCircle className="w-4 h-4 text-primary" />
                                                    </div>
                                                )}
                                            </button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </motion.div>
                    </TabsContent>
                </Tabs>
            </motion.div>

            {/* Save Button */}
            <motion.div 
                className="flex justify-end pt-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <Button variant="gradient" onClick={handleSave} disabled={isSaving} className="gap-2">
                    {isSaving ? (
                        <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            Save Changes
                        </>
                    )}
                </Button>
            </motion.div>
        </div>
    );
}
