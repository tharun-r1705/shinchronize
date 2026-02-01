import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  Bell,
  Settings,
  Menu,
  Command,
  Moon,
  Sun,
  User,
  ChevronDown,
  LogOut,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useLayout } from "./AppShell";
import { useEffect, useState } from "react";

interface TopBarProps {
  userType: "student" | "recruiter" | "admin";
}

export const TopBar = ({ userType }: TopBarProps) => {
  const navigate = useNavigate();
  const { setSidebarOpen, setCommandPaletteOpen, sidebarCollapsed } = useLayout();
  const [isDark, setIsDark] = useState(true); // Default to dark
  const [notifications] = useState(0);

  // Check initial theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const isDarkMode = savedTheme === "dark" || (!savedTheme && true); // Default dark
    setIsDark(isDarkMode);
    document.documentElement.classList.toggle("dark", isDarkMode);
    document.documentElement.classList.toggle("light", !isDarkMode);
  }, []);

  // Toggle theme
  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    document.documentElement.classList.toggle("dark", newIsDark);
    document.documentElement.classList.toggle("light", !newIsDark);
    localStorage.setItem("theme", newIsDark ? "dark" : "light");
  };

  // Get user data from localStorage
  const getUserData = () => {
    try {
      if (userType === "student") {
        const data = localStorage.getItem("studentData");
        return data ? JSON.parse(data) : null;
      } else if (userType === "recruiter") {
        const data = localStorage.getItem("recruiterData");
        return data ? JSON.parse(data) : null;
      }
      return null;
    } catch {
      return null;
    }
  };

  const userData = getUserData();
  const userName = userData?.name || userData?.fullName || "User";
  const userEmail = userData?.email || "";
  const userInitials = userName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header
      className={cn(
        "sticky top-0 z-20 h-[60px] border-b border-border/50",
        "bg-background/80 backdrop-blur-xl",
        "flex items-center justify-between px-4 lg:px-6"
      )}
    >
      {/* Left section */}
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon-sm"
          className="lg:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Search / Command palette trigger */}
        <motion.button
          onClick={() => setCommandPaletteOpen(true)}
          className={cn(
            "hidden sm:flex items-center gap-2.5 h-9 px-3",
            "rounded-lg border border-border/50 bg-muted/30",
            "text-sm text-muted-foreground",
            "hover:bg-muted/50 hover:border-border",
            "transition-all duration-200",
            "min-w-[180px] md:min-w-[260px]"
          )}
          whileTap={{ scale: 0.98 }}
        >
          <Search className="h-4 w-4 text-muted-foreground" />
          <span className="flex-1 text-left">Search...</span>
          <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono bg-background rounded border border-border/50 text-muted-foreground">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        </motion.button>

        {/* Mobile search */}
        <Button
          variant="ghost"
          size="icon-sm"
          className="sm:hidden"
          onClick={() => setCommandPaletteOpen(true)}
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-1.5">
        {/* AI Mentor Quick Access - Student only */}
        {userType === "student" && (
          <Button
            variant="ghost"
            size="sm"
            className="hidden md:flex gap-2 text-amber-500 hover:text-amber-400 hover:bg-amber-500/10"
            onClick={() => navigate("/student/ai")}
          >
            <Sparkles className="h-4 w-4" />
            <span className="text-sm">AI Mentor</span>
          </Button>
        )}

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon-sm"
          className="h-8 w-8"
          onClick={toggleTheme}
        >
          <motion.div
            initial={false}
            animate={{ rotate: isDark ? 0 : 180 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {isDark ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </motion.div>
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="h-8 w-8 relative">
              <Bell className="h-4 w-4" />
              {notifications > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                  {notifications > 9 ? "9+" : notifications}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              {notifications > 0 && (
                <Badge variant="default" size="sm">
                  {notifications} new
                </Badge>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="py-8 text-center">
              <Bell className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">
                {notifications > 0
                  ? "Your notifications will appear here"
                  : "You're all caught up!"}
              </p>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Divider */}
        <div className="h-6 w-px bg-border/50 mx-1.5 hidden md:block" />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 h-9 pl-1.5 pr-2 hover:bg-muted/50"
            >
              <Avatar className="h-7 w-7 border border-border/50">
                <AvatarImage src={userData?.avatar} alt={userName} />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-purple-500/20 text-primary text-xs font-medium">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden lg:flex flex-col items-start">
                <span className="text-sm font-medium leading-none">{userName.split(" ")[0]}</span>
              </div>
              <ChevronDown className="h-3 w-3 text-muted-foreground hidden lg:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{userName}</p>
                {userEmail && (
                  <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                )}
                <Badge variant="secondary" size="sm" className="w-fit mt-1 capitalize">
                  {userType}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => navigate(userType === "recruiter" ? "/recruiter/settings" : "/student/profile")}
              className="cursor-pointer"
            >
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => navigate(userType === "recruiter" ? "/recruiter/settings" : "/student/profile")}
              className="cursor-pointer"
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
              onClick={() => {
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
                navigate("/");
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default TopBar;
