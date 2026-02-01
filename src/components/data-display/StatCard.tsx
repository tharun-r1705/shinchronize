import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ElementType;
    trend?: { value: number; label: string };
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive';
    onClick?: () => void;
    className?: string;
}

const variantStyles = {
    default: 'bg-card border-border/50',
    primary: 'bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 border-primary/20',
    success: 'bg-gradient-to-br from-success/10 via-transparent to-emerald-400/5 border-success/20',
    warning: 'bg-gradient-to-br from-warning/10 via-transparent to-amber-400/5 border-warning/20',
    destructive: 'bg-gradient-to-br from-destructive/10 via-transparent to-rose-400/5 border-destructive/20',
};

const iconStyles = {
    default: 'bg-muted/60 text-muted-foreground',
    primary: 'bg-primary/20 text-primary shadow-glow',
    success: 'bg-success/20 text-success shadow-glow-accent',
    warning: 'bg-warning/20 text-warning',
    destructive: 'bg-destructive/20 text-destructive',
};

export function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    variant = 'default',
    onClick,
    className,
}: StatCardProps) {
    return (
        <Card
            className={cn(
                'stat-card border transition-all duration-300 ease-out-quart',
                variantStyles[variant],
                onClick && 'cursor-pointer',
                className
            )}
            onClick={onClick}
        >
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="space-y-3">
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold tracking-tight text-foreground">{value}</span>
                            {subtitle && (
                                <span className="text-sm text-muted-foreground">{subtitle}</span>
                            )}
                        </div>
                        {trend && (
                            <div
                                className={cn(
                                    'flex items-center gap-1 text-sm font-medium',
                                    trend.value >= 0 ? 'text-success' : 'text-destructive'
                                )}
                            >
                                {trend.value >= 0 ? (
                                    <TrendingUp className="w-4 h-4" />
                                ) : (
                                    <TrendingDown className="w-4 h-4" />
                                )}
                                <span>
                                    {trend.value > 0 ? '+' : ''}
                                    {trend.value}% {trend.label}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className={cn('p-3 rounded-xl', iconStyles[variant])}>
                        <Icon className="w-6 h-6" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
