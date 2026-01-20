import { useNavigate, useLocation } from "react-router-dom";
import { LogOut, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { LogoutConfirmDialog } from "./LogoutConfirmDialog";
import { useToast } from "@/hooks/use-toast";

export const StudentNavbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);
    const token = localStorage.getItem('token') || localStorage.getItem('studentToken');

    const handleLogout = () => {
        // Clear all possible tokens/data from all pages
        const keysToRemove = [
            'token',
            'userRole',
            'userType',
            'studentData',
            'studentToken',
            'recruiterData'
        ];
        keysToRemove.forEach(key => localStorage.removeItem(key));

        toast({
            title: "Logged out successfully",
        });
        navigate('/');
    };

    const navItems = [
        { label: "Dashboard", path: "/student/dashboard", private: true },
        { label: "Profile", path: "/student/profile", private: true },
        { label: "AI Mentor", path: "/student/ai", private: true, special: true },
        { label: "Progress", path: "/student/progress", private: true },
        { label: "Market", path: "/student/market", private: true },
        { label: "Resume", path: "/student/resume", private: true },
        { label: "Leaderboard", path: "/leaderboard", private: false },
    ].filter(item => !item.private || token);

    const isActive = (path: string) => location.pathname === path;

    return (
        <header className="bg-card border-b sticky top-0 z-50 shadow-sm">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                <h1
                    className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent cursor-pointer"
                    onClick={() => navigate(token ? '/student/dashboard' : '/')}
                >
                    EvolvEd
                </h1>
                <nav className="flex gap-2 items-center">
                    {navItems.map((item: any) => (
                        <Button
                            key={item.path}
                            variant={isActive(item.path) ? "secondary" : (item.special ? "outline" : "ghost")}
                            className={`${isActive(item.path) ? "font-bold" : ""} ${item.special && !isActive(item.path) ? "bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10 hover:border-amber-500/40 text-amber-700 dark:text-amber-400" : ""}`}
                            onClick={() => navigate(item.path)}
                        >
                            {item.special && (
                                <Sparkles className={`w-4 h-4 mr-2 ${isActive(item.path) ? "text-white" : "text-amber-500 animate-pulse"}`} />
                            )}
                            {item.label}
                        </Button>
                    ))}
                    <div className="ml-2 pl-2 border-l">
                        {token ? (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowLogoutDialog(true)}
                                className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground transition-all duration-300 shadow-sm"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Logout
                            </Button>
                        ) : (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate('/student/login')}
                                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                            >
                                Login
                            </Button>
                        )}
                    </div>
                </nav>
            </div>

            <LogoutConfirmDialog
                isOpen={showLogoutDialog}
                onClose={() => setShowLogoutDialog(false)}
                onConfirm={handleLogout}
            />
        </header>
    );
};
