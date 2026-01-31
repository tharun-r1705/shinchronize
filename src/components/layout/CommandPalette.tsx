import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
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
  Moon,
  Sun,
  ArrowRight,
  Plus,
  Zap,
} from "lucide-react";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userType: "student" | "recruiter" | "admin";
}

interface CommandAction {
  id: string;
  label: string;
  icon: typeof LayoutDashboard;
  shortcut?: string;
  action: () => void;
  group: string;
}

export const CommandPalette = ({
  open,
  onOpenChange,
  userType,
}: CommandPaletteProps) => {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, [open]);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    document.documentElement.classList.toggle("dark", newIsDark);
    localStorage.setItem("theme", newIsDark ? "dark" : "light");
    onOpenChange(false);
  };

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
    navigate("/");
    onOpenChange(false);
  };

  const navigateTo = (path: string) => {
    navigate(path);
    onOpenChange(false);
  };

  const studentActions: CommandAction[] = [
    {
      id: "dashboard",
      label: "Go to Dashboard",
      icon: LayoutDashboard,
      shortcut: "⌘D",
      action: () => navigateTo("/student/dashboard"),
      group: "Navigation",
    },
    {
      id: "profile",
      label: "Go to Profile",
      icon: User,
      shortcut: "⌘P",
      action: () => navigateTo("/student/profile"),
      group: "Navigation",
    },
    {
      id: "interview",
      label: "Go to Interview Prep",
      icon: Mic,
      action: () => navigateTo("/student/interview"),
      group: "Navigation",
    },
    {
      id: "roadmaps",
      label: "Go to Roadmaps",
      icon: Map,
      action: () => navigateTo("/student/roadmaps"),
      group: "Navigation",
    },
    {
      id: "ai-mentor",
      label: "Open AI Mentor",
      icon: Sparkles,
      shortcut: "⌘M",
      action: () => navigateTo("/student/ai"),
      group: "Navigation",
    },
    {
      id: "progress",
      label: "View Progress",
      icon: TrendingUp,
      action: () => navigateTo("/student/progress"),
      group: "Navigation",
    },
    {
      id: "market",
      label: "Skill Market Tracker",
      icon: BarChart3,
      action: () => navigateTo("/student/market"),
      group: "Navigation",
    },
    {
      id: "resume",
      label: "Resume Analyzer",
      icon: FileText,
      action: () => navigateTo("/student/resume"),
      group: "Navigation",
    },
    {
      id: "leaderboard",
      label: "View Leaderboard",
      icon: Trophy,
      action: () => navigateTo("/leaderboard"),
      group: "Navigation",
    },
    // Quick Actions
    {
      id: "start-interview",
      label: "Start Mock Interview",
      icon: Zap,
      action: () => navigateTo("/student/interview"),
      group: "Quick Actions",
    },
    {
      id: "new-roadmap",
      label: "Create New Roadmap",
      icon: Plus,
      action: () => navigateTo("/student/roadmaps"),
      group: "Quick Actions",
    },
  ];

  const recruiterActions: CommandAction[] = [
    {
      id: "dashboard",
      label: "Go to Dashboard",
      icon: LayoutDashboard,
      shortcut: "⌘D",
      action: () => navigateTo("/recruiter/dashboard"),
      group: "Navigation",
    },
    {
      id: "settings",
      label: "Go to Settings",
      icon: Settings,
      action: () => navigateTo("/recruiter/settings"),
      group: "Navigation",
    },
  ];

  const adminActions: CommandAction[] = [
    {
      id: "dashboard",
      label: "Go to Admin Panel",
      icon: LayoutDashboard,
      shortcut: "⌘D",
      action: () => navigateTo("/admin"),
      group: "Navigation",
    },
  ];

  const commonActions: CommandAction[] = [
    {
      id: "toggle-theme",
      label: isDark ? "Switch to Light Mode" : "Switch to Dark Mode",
      icon: isDark ? Sun : Moon,
      shortcut: "⌘T",
      action: toggleTheme,
      group: "Preferences",
    },
    {
      id: "logout",
      label: "Logout",
      icon: LogOut,
      action: handleLogout,
      group: "Account",
    },
  ];

  const actions = {
    student: [...studentActions, ...commonActions],
    recruiter: [...recruiterActions, ...commonActions],
    admin: [...adminActions, ...commonActions],
  }[userType];

  // Group actions by group
  const groupedActions = actions.reduce((acc, action) => {
    if (!acc[action.group]) {
      acc[action.group] = [];
    }
    acc[action.group].push(action);
    return acc;
  }, {} as Record<string, CommandAction[]>);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {Object.entries(groupedActions).map(([group, items], index) => (
          <div key={group}>
            {index > 0 && <CommandSeparator />}
            <CommandGroup heading={group}>
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.id}
                    onSelect={item.action}
                    className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted/50">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="flex-1">{item.label}</span>
                    {item.shortcut && (
                      <CommandShortcut>{item.shortcut}</CommandShortcut>
                    )}
                    <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-aria-selected:opacity-100 transition-opacity" />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  );
};

export default CommandPalette;
