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
  const [isDark, setIsDark] = useState(false);
  const [notifications] = useState(0); // Default to no notifications

  // Check initial theme
  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains("dark");
    setIsDark(isDarkMode);
  }, []);

  // Toggle theme
  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    document.documentElement.classList.toggle("dark", newIsDark);
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
        "sticky top-0 z-20 h-16 border-b border-border",
        "bg-background/80 backdrop-blur-md",
        "flex items-center justify-between px-4 lg:px-6"
      )}
    >
      {/* Left section */}
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Search / Command palette trigger */}
        <motion.button
          onClick={() => setCommandPaletteOpen(true)}
          className={cn(
            "hidden sm:flex items-center gap-2 h-9 px-3 pr-2",
            "rounded-lg border border-border bg-muted/30",
            "text-sm text-muted-foreground",
            "hover:bg-muted/50 hover:border-muted-foreground/20",
            "transition-all duration-200",
            "min-w-[200px] md:min-w-[280px]"
          )}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">Search...</span>
          <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-mono bg-muted rounded border border-border">
            <Command className="h-3 w-3" />K
          </kbd>
        </motion.button>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={toggleTheme}
        >
          <motion.div
            initial={false}
            animate={{ rotate: isDark ? 180 : 0 }}
            transition={{ duration: 0.3 }}
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
            <Button variant="ghost" size="icon" className="h-9 w-9 relative">
              <Bell className="h-4 w-4" />
              {notifications > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center animate-pulse">
                  {notifications}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              Notifications
              {notifications > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {notifications} new
                </Badge>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="py-2 px-2 text-sm text-muted-foreground text-center">
              <p>
                {notifications > 0
                  ? "Your notifications will appear here"
                  : "You're all caught up"}
              </p>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Settings (quick access) */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 hidden md:flex"
          onClick={() => navigate(userType === "recruiter" ? "/recruiter/settings" : "/student/profile")}
        >
          <Settings className="h-4 w-4" />
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 h-9 px-2 hover:bg-muted/50"
            >
              <Avatar className="h-7 w-7">
                <AvatarImage src={userData?.avatar} alt={userName} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium leading-none">{userName}</span>
                <span className="text-xs text-muted-foreground capitalize">{userType}</span>
              </div>
              <ChevronDown className="h-3 w-3 text-muted-foreground hidden md:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{userName}</p>
                {userEmail && (
                  <p className="text-xs text-muted-foreground">{userEmail}</p>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate(userType === "recruiter" ? "/recruiter/settings" : "/student/profile")}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(userType === "recruiter" ? "/recruiter/settings" : "/student/profile")}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => {
                // Trigger logout - could use a custom event or context
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
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default TopBar;
