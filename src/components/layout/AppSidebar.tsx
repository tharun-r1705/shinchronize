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
  Users,
  Shield,
  CheckCircle,
  Briefcase,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  { label: "Interview Prep", path: "/student/interview", icon: Mic },
  { label: "Roadmaps", path: "/student/roadmaps", icon: Map },
  { label: "AI Mentor", path: "/student/ai", icon: Sparkles, special: true },
  { label: "Progress", path: "/student/progress", icon: TrendingUp },
  { label: "Skill Market", path: "/student/market", icon: BarChart3 },
  { label: "Resume", path: "/student/resume", icon: FileText },
  { label: "Leaderboard", path: "/leaderboard", icon: Trophy },
];

const recruiterNavItems: NavItem[] = [
  { label: "Dashboard", path: "/recruiter/dashboard", icon: LayoutDashboard },
  { label: "Jobs", path: "/recruiter/jobs", icon: Briefcase },
  { label: "Candidates", path: "/recruiter/candidates", icon: Users },
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
          "relative w-full flex items-center rounded-lg text-sm font-medium",
          "transition-all duration-200 group",
          sidebarCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5",
          active
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
          item.special && !active && "text-amber-500"
        )}
        whileTap={{ scale: 0.98 }}
      >
        {/* Active indicator */}
        {active && (
          <motion.div
            layoutId="activeNavIndicator"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full"
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          />
        )}

        {/* Icon */}
        <div
          className={cn(
            "flex items-center justify-center transition-all duration-200",
            sidebarCollapsed ? "w-5 h-5" : "w-5 h-5",
            active && "text-primary",
            item.special && !active && "text-amber-500"
          )}
        >
          <Icon className={cn(
            "w-[18px] h-[18px]",
            item.special && !active && "animate-pulse"
          )} />
        </div>

        {/* Label */}
        <AnimatePresence mode="wait">
          {!sidebarCollapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.15 }}
              className="whitespace-nowrap overflow-hidden"
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Badge */}
        {item.badge && !sidebarCollapsed && (
          <span className="ml-auto px-1.5 py-0.5 text-[10px] font-medium bg-primary/10 text-primary rounded-md">
            {item.badge}
          </span>
        )}

        {/* Special glow for AI Mentor */}
        {item.special && active && (
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-lg -z-10" />
        )}
      </motion.button>
    );

    if (sidebarCollapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" sideOffset={10} className="font-medium">
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  const LogoSection = ({ collapsed }: { collapsed: boolean }) => (
    <div className={cn(
      "flex items-center h-14 border-b border-sidebar-border",
      collapsed ? "justify-center px-2" : "justify-between px-4"
    )}>
      <motion.button
        onClick={() => navigate("/")}
        className="flex items-center gap-2.5"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-glow">
          <span className="text-sm font-bold text-white">S</span>
        </div>
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="text-lg font-heading font-semibold text-gradient"
            >
              Shinchronize
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Collapse button - desktop only */}
      {!collapsed && (
        <Button
          variant="ghost"
          size="icon-xs"
          className="h-7 w-7 text-muted-foreground hover:text-foreground hidden lg:flex"
          onClick={() => setSidebarCollapsed(true)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: sidebarCollapsed ? 68 : 240,
        }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "fixed left-0 top-0 h-screen z-30",
          "hidden lg:flex flex-col",
          "bg-sidebar/95 border-r border-sidebar-border",
          "backdrop-blur-xl"
        )}
      >
        <LogoSection collapsed={sidebarCollapsed} />

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4">
          <nav className={cn("space-y-1", sidebarCollapsed ? "px-2" : "px-3")}>
            {navItems.map((item) => (
              <NavItemComponent key={item.path} item={item} />
            ))}
          </nav>
        </ScrollArea>

        {/* Bottom section */}
        <div className={cn(
          "py-3 border-t border-sidebar-border space-y-1",
          sidebarCollapsed ? "px-2" : "px-3"
        )}>
          {/* Expand button when collapsed */}
          {sidebarCollapsed && (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-full h-9"
                  onClick={() => setSidebarCollapsed(false)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={10}>Expand sidebar</TooltipContent>
            </Tooltip>
          )}

          {/* Logout */}
          {sidebarCollapsed ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-full h-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setShowLogoutDialog(true)}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={10}>Logout</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-3 h-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => setShowLogoutDialog(true)}
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          )}
        </div>
      </motion.aside>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-0 top-0 h-screen w-[280px] z-50 lg:hidden flex flex-col bg-sidebar border-r border-sidebar-border"
          >
            {/* Logo Area */}
            <div className="flex items-center justify-between h-14 px-4 border-b border-sidebar-border">
              <button onClick={() => navigate("/")} className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-glow">
                  <span className="text-sm font-bold text-white">S</span>
                </div>
                <span className="text-lg font-heading font-semibold text-gradient">Shinchronize</span>
              </button>
              <Button
                variant="ghost"
                size="icon-xs"
                className="h-8 w-8"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-4 w-4" />
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
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                        item.special && !active && "text-amber-500"
                      )}
                    >
                      {active && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
                      )}
                      <Icon className={cn("w-[18px] h-[18px]", item.special && !active && "animate-pulse")} />
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
                className="w-full justify-start gap-3 px-3 h-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={() => setShowLogoutDialog(true)}
              >
                <LogOut className="h-4 w-4" />
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
