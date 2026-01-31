import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  User,
  Mic,
  Map,
  Sparkles,
  TrendingUp,
  BarChart3,
  FileText,
  Trophy,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Building2,
  Users,
  Search,
  Shield,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useLayout } from "./AppShell";
import { useState, memo } from "react";
import { LogoutConfirmDialog } from "@/components/LogoutConfirmDialog";
import { useToast } from "@/hooks/use-toast";

interface NavItem {
  label: string;
  path: string;
  icon: typeof LayoutDashboard;
  badge?: string;
  special?: boolean;
}

const studentNavItems: NavItem[] = [
  { label: "Dashboard", path: "/student/dashboard", icon: LayoutDashboard },
  { label: "Profile", path: "/student/profile", icon: User },
  { label: "Interview", path: "/student/interview", icon: Mic },
  { label: "Roadmaps", path: "/student/roadmaps", icon: Map },
  { label: "AI Mentor", path: "/student/ai", icon: Sparkles, special: true },
  { label: "Progress", path: "/student/progress", icon: TrendingUp },
  { label: "Market", path: "/student/market", icon: BarChart3 },
  { label: "Resume", path: "/student/resume", icon: FileText },
  { label: "Leaderboard", path: "/leaderboard", icon: Trophy },
];

const recruiterNavItems: NavItem[] = [
  { label: "Dashboard", path: "/recruiter/dashboard", icon: LayoutDashboard },
  { label: "Candidates", path: "/recruiter/candidates", icon: Users },
  { label: "Search", path: "/recruiter/search", icon: Search },
  { label: "Company", path: "/recruiter/company", icon: Building2 },
  { label: "Settings", path: "/recruiter/settings", icon: Settings },
];

const adminNavItems: NavItem[] = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
  { label: "Verifications", path: "/admin/verifications", icon: CheckCircle },
  { label: "Users", path: "/admin/users", icon: Users },
  { label: "Security", path: "/admin/security", icon: Shield },
];

interface AppSidebarProps {
  userType: "student" | "recruiter" | "admin";
}

export const AppSidebar = memo(({ userType }: AppSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { sidebarCollapsed, setSidebarCollapsed, sidebarOpen, setSidebarOpen } = useLayout();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const navItems = {
    student: studentNavItems,
    recruiter: recruiterNavItems,
    admin: adminNavItems,
  }[userType];

  const handleLogout = () => {
    const keysToRemove = [
      "token",
      "userRole",
      "userType",
      "studentData",
      "studentToken",
      "recruiterData",
      "adminToken",
    ];
    keysToRemove.forEach((key) => localStorage.removeItem(key));
    toast({ title: "Logged out successfully" });
    navigate("/");
  };

  const isActive = (path: string) => location.pathname === path;

  const NavItemComponent = ({ item }: { item: NavItem }) => {
    const active = isActive(item.path);
    const Icon = item.icon;

    const content = (
      <motion.button
        onClick={() => navigate(item.path)}
        className={cn(
          "relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium",
          "transition-all duration-200 ease-out-quart group",
          active
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
          item.special && !active && "text-amber-600 dark:text-amber-400"
        )}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Active indicator */}
        {active && (
          <motion.div
            layoutId="activeNavIndicator"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-full"
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        )}

        {/* Icon */}
        <div
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-md",
            "transition-all duration-200",
            active
              ? "bg-primary text-primary-foreground shadow-glow"
              : "bg-muted/50 group-hover:bg-muted",
            item.special && !active && "bg-amber-500/10 text-amber-500"
          )}
        >
          <Icon className={cn("w-4 h-4", item.special && !active && "animate-pulse")} />
        </div>

        {/* Label */}
        <AnimatePresence mode="wait">
          {!sidebarCollapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="whitespace-nowrap overflow-hidden"
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Badge */}
        {item.badge && !sidebarCollapsed && (
          <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
            {item.badge}
          </span>
        )}
      </motion.button>
    );

    if (sidebarCollapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: sidebarCollapsed ? 72 : 280,
        }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "fixed left-0 top-0 h-screen z-30",
          "hidden lg:flex flex-col",
          "bg-sidebar border-r border-sidebar-border",
          "glass-strong"
        )}
      >
        {/* Logo Area */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
          <AnimatePresence mode="wait">
            {!sidebarCollapsed ? (
              <motion.button
                key="full-logo"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => navigate("/")}
                className="flex items-center gap-2"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
                  <span className="text-sm font-bold text-white">S</span>
                </div>
                <span className="text-lg font-bold text-gradient">Shinchronize</span>
              </motion.button>
            ) : (
              <motion.button
                key="mini-logo"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => navigate("/")}
                className="w-8 h-8 mx-auto rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow"
              >
                <span className="text-sm font-bold text-white">S</span>
              </motion.button>
            )}
          </AnimatePresence>

          {/* Collapse button */}
          {!sidebarCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setSidebarCollapsed(true)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavItemComponent key={item.path} item={item} />
            ))}
          </nav>
        </ScrollArea>

        {/* Bottom section */}
        <div className="p-3 border-t border-sidebar-border space-y-1">
          {/* Expand button when collapsed */}
          {sidebarCollapsed && (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-full h-10"
                  onClick={() => setSidebarCollapsed(false)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Expand sidebar</TooltipContent>
            </Tooltip>
          )}

          {/* Logout */}
          {sidebarCollapsed ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-full h-10 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setShowLogoutDialog(true)}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Logout</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-3 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => setShowLogoutDialog(true)}
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-destructive/10">
                <LogOut className="h-4 w-4" />
              </div>
              <span>Logout</span>
            </Button>
          )}
        </div>
      </motion.aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-0 top-0 h-screen w-[280px] z-50 lg:hidden flex flex-col bg-sidebar border-r border-sidebar-border"
          >
            {/* Logo Area */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
              <button onClick={() => navigate("/")} className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
                  <span className="text-sm font-bold text-white">S</span>
                </div>
                <span className="text-lg font-bold text-gradient">Shinchronize</span>
              </button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setSidebarOpen(false)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>

            {/* Navigation */}
            <ScrollArea className="flex-1 px-3 py-4">
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const active = isActive(item.path);
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        navigate(item.path);
                        setSidebarOpen(false);
                      }}
                      className={cn(
                        "relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium",
                        "transition-all duration-200",
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      <div
                        className={cn(
                          "flex items-center justify-center w-8 h-8 rounded-md",
                          active ? "bg-primary text-primary-foreground" : "bg-muted/50"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </ScrollArea>

            {/* Bottom section */}
            <div className="p-3 border-t border-sidebar-border">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 px-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setShowLogoutDialog(true)}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-destructive/10">
                  <LogOut className="h-4 w-4" />
                </div>
                <span>Logout</span>
              </Button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <LogoutConfirmDialog
        isOpen={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
        onConfirm={handleLogout}
      />
    </>
  );
});

AppSidebar.displayName = "AppSidebar";

export default AppSidebar;
