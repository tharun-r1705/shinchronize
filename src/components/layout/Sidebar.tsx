import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { UserRole } from '@/contexts/AuthContext';
import {
    LayoutDashboard,
    Map,
    Mic,
    TrendingUp,
    Trophy,
    Bot,
    Activity,
    Users,
    Heart,
    Briefcase,
    GitCompare,
    ClipboardCheck,
    BarChart3,
    Settings,
    ChevronLeft,
    ChevronRight,
    Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface SidebarProps {
    collapsed: boolean;
    onCollapsedChange: (collapsed: boolean) => void;
    role: UserRole | null;
}

interface NavItem {
    label: string;
    href: string;
    icon: React.ElementType;
    badge?: number;
}

interface NavGroup {
    label?: string;
    items: NavItem[];
}

const studentNavigation: NavGroup[] = [
    {
        items: [
            { label: 'Dashboard', href: '/student', icon: LayoutDashboard },
            { label: 'My Roadmaps', href: '/student/roadmaps', icon: Map },
            { label: 'AI Interview', href: '/student/interview', icon: Mic },
            { label: 'Skill Market', href: '/student/market', icon: TrendingUp },
            { label: 'Leaderboard', href: '/student/leaderboard', icon: Trophy },
        ],
    },
    {
        label: 'MENTOR',
        items: [
            { label: 'Zenith AI', href: '/student/zenith', icon: Bot },
            { label: 'My Activity', href: '/student/activity', icon: Activity },
        ],
    },
];

const recruiterNavigation: NavGroup[] = [
    {
        items: [
            { label: 'Dashboard', href: '/recruiter', icon: LayoutDashboard },
            { label: 'Find Candidates', href: '/recruiter/discover', icon: Users },
            { label: 'Saved Candidates', href: '/recruiter/saved', icon: Heart },
            { label: 'My Jobs', href: '/recruiter/jobs', icon: Briefcase },
        ],
    },
    {
        label: 'TOOLS',
        items: [
            { label: 'Compare', href: '/recruiter/compare', icon: GitCompare },
        ],
    },
];

const adminNavigation: NavGroup[] = [
    {
        items: [
            { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
            { label: 'Verifications', href: '/admin/verifications', icon: ClipboardCheck },
            { label: 'Students', href: '/admin/students', icon: Users },
            { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
        ],
    },
];

function getNavigationForRole(role: UserRole | null): NavGroup[] {
    switch (role) {
        case 'student':
            return studentNavigation;
        case 'recruiter':
            return recruiterNavigation;
        case 'admin':
            return adminNavigation;
        default:
            return [];
    }
}

export function Sidebar({ collapsed, onCollapsedChange, role }: SidebarProps) {
    const location = useLocation();
    const navigation = getNavigationForRole(role);

    return (
        <motion.aside
            initial={false}
            animate={{ width: collapsed ? 72 : 280 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
                "fixed left-0 top-0 bottom-0 z-40",
                "bg-sidebar border-r border-sidebar-border",
                "flex flex-col"
            )}
        >
            {/* Logo */}
            <div className="h-16 flex items-center px-4 border-b border-sidebar-border">
                <NavLink to="/" className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-5 h-5 text-primary-foreground" />
                    </div>
                    {!collapsed && (
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="font-semibold text-lg text-sidebar-foreground"
                        >
                            EvolvEd
                        </motion.span>
                    )}
                </NavLink>
            </div>

            {/* Navigation */}
            <ScrollArea className="flex-1 py-4">
                <nav className="space-y-6 px-3">
                    {navigation.map((group, groupIndex) => (
                        <div key={groupIndex}>
                            {group.label && !collapsed && (
                                <h3 className="px-3 mb-2 text-xs font-medium text-muted-foreground tracking-wider">
                                    {group.label}
                                </h3>
                            )}
                            {group.label && collapsed && (
                                <Separator className="mx-2 my-3" />
                            )}
                            <ul className="space-y-1">
                                {group.items.map((item) => {
                                    const isActive = location.pathname === item.href ||
                                        (item.href !== `/${role}` && location.pathname.startsWith(item.href));

                                    const linkContent = (
                                        <NavLink
                                            to={item.href}
                                            className={cn(
                                                "flex items-center gap-3 px-3 py-2.5 rounded-lg",
                                                "text-sm font-medium transition-all duration-200",
                                                "group relative",
                                                isActive
                                                    ? "bg-sidebar-accent text-sidebar-primary"
                                                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                                            )}
                                        >
                                            {isActive && (
                                                <motion.div
                                                    layoutId="activeIndicator"
                                                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full"
                                                    transition={{ duration: 0.2 }}
                                                />
                                            )}
                                            <item.icon className={cn(
                                                "w-5 h-5 flex-shrink-0",
                                                isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                                            )} />
                                            {!collapsed && (
                                                <span className="truncate">{item.label}</span>
                                            )}
                                            {!collapsed && item.badge !== undefined && item.badge > 0 && (
                                                <span className="ml-auto bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                                                    {item.badge}
                                                </span>
                                            )}
                                        </NavLink>
                                    );

                                    if (collapsed) {
                                        return (
                                            <li key={item.href}>
                                                <Tooltip delayDuration={0}>
                                                    <TooltipTrigger asChild>
                                                        {linkContent}
                                                    </TooltipTrigger>
                                                    <TooltipContent side="right" sideOffset={8}>
                                                        {item.label}
                                                        {item.badge !== undefined && item.badge > 0 && (
                                                            <span className="ml-2 text-primary">({item.badge})</span>
                                                        )}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </li>
                                        );
                                    }

                                    return <li key={item.href}>{linkContent}</li>;
                                })}
                            </ul>
                        </div>
                    ))}
                </nav>
            </ScrollArea>

            {/* Collapse Toggle */}
            <div className="p-3 border-t border-sidebar-border">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onCollapsedChange(!collapsed)}
                    className={cn(
                        "w-full justify-center",
                        !collapsed && "justify-start"
                    )}
                >
                    {collapsed ? (
                        <ChevronRight className="w-4 h-4" />
                    ) : (
                        <>
                            <ChevronLeft className="w-4 h-4 mr-2" />
                            <span>Collapse</span>
                        </>
                    )}
                </Button>
            </div>
        </motion.aside>
    );
}
