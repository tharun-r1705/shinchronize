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
    default: 'bg-card hover:bg-card/80',
    primary: 'bg-primary/10 border-primary/20 hover:bg-primary/15',
    success: 'bg-success/10 border-success/20 hover:bg-success/15',
    warning: 'bg-warning/10 border-warning/20 hover:bg-warning/15',
    destructive: 'bg-destructive/10 border-destructive/20 hover:bg-destructive/15',
};

const iconStyles = {
    default: 'bg-muted text-muted-foreground',
    primary: 'bg-primary/20 text-primary',
    success: 'bg-success/20 text-success',
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
                'border transition-all duration-200',
                variantStyles[variant],
                onClick && 'cursor-pointer hover:shadow-lg',
                className
            )}
            onClick={onClick}
        >
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="space-y-3">
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold tracking-tight">{value}</span>
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
