import React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressRingProps {
    value: number;
    max?: number;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showLabel?: boolean;
    label?: string;
    variant?: 'default' | 'success' | 'warning' | 'destructive';
    className?: string;
}

const sizeConfig = {
    sm: { size: 64, stroke: 4, fontSize: 'text-sm' },
    md: { size: 96, stroke: 6, fontSize: 'text-xl' },
    lg: { size: 128, stroke: 8, fontSize: 'text-2xl' },
    xl: { size: 160, stroke: 10, fontSize: 'text-3xl' },
};

const variantColors = {
    default: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
    destructive: 'text-destructive',
};

export function ProgressRing({
    value,
    max = 100,
    size = 'md',
    showLabel = true,
    label,
    variant = 'default',
    className,
}: ProgressRingProps) {
    const config = sizeConfig[size];
    const radius = (config.size - config.stroke) / 2;
    const circumference = radius * 2 * Math.PI;
    const percent = Math.min(Math.max(value / max, 0), 1);
    const offset = circumference - percent * circumference;

    return (
        <div className={cn('relative inline-flex items-center justify-center', className)}>
            <svg
                width={config.size}
                height={config.size}
                className="transform -rotate-90"
            >
                {/* Background circle */}
                <circle
                    cx={config.size / 2}
                    cy={config.size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={config.stroke}
                    className="text-muted/30"
                />
                {/* Progress circle */}
                <circle
                    cx={config.size / 2}
                    cy={config.size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={config.stroke}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className={cn(
                        'transition-all duration-500 ease-out',
                        variantColors[variant]
                    )}
                />
            </svg>
            {showLabel && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={cn('font-bold', config.fontSize)}>
                        {Math.round(value)}
                    </span>
                    {label && (
                        <span className="text-xs text-muted-foreground">{label}</span>
                    )}
                </div>
            )}
        </div>
    );
}
