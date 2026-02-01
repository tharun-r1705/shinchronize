import React from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export interface ActivityHeatmapProps {
    data: Record<string, number>; // Date string (YYYY-MM-DD) to count
    startDate?: Date;
    endDate?: Date;
    colorScale?: string[];
    className?: string;
}

const DEFAULT_COLOR_SCALE = [
    'bg-muted/30',
    'bg-primary/20',
    'bg-primary/40',
    'bg-primary/60',
    'bg-primary/80',
    'bg-primary',
];

function getColorForValue(value: number, max: number, colorScale: string[]): string {
    if (value === 0) return colorScale[0];
    const index = Math.min(
        Math.ceil((value / max) * (colorScale.length - 1)),
        colorScale.length - 1
    );
    return colorScale[index];
}

function getWeeksArray(startDate: Date, endDate: Date): Date[][] {
    const weeks: Date[][] = [];
    let currentDate = new Date(startDate);
    let currentWeek: Date[] = [];

    // Fill in empty days at the start to align with week start
    const startDay = currentDate.getDay();
    for (let i = 0; i < startDay; i++) {
        currentWeek.push(new Date(NaN)); // Invalid date as placeholder
    }

    while (currentDate <= endDate) {
        currentWeek.push(new Date(currentDate));
        if (currentDate.getDay() === 6) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Fill in remaining days
    if (currentWeek.length > 0) {
        while (currentWeek.length < 7) {
            currentWeek.push(new Date(NaN));
        }
        weeks.push(currentWeek);
    }

    return weeks;
}

function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
}

export function ActivityHeatmap({
    data,
    startDate,
    endDate,
    colorScale = DEFAULT_COLOR_SCALE,
    className,
}: ActivityHeatmapProps) {
    const end = endDate || new Date();
    const start = startDate || new Date(end.getFullYear(), end.getMonth() - 11, 1);
    const weeks = getWeeksArray(start, end);
    
    const values = Object.values(data);
    const maxValue = values.length > 0 ? Math.max(...values) : 1;

    const months: { label: string; colStart: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, weekIndex) => {
        const validDay = week.find(d => !isNaN(d.getTime()));
        if (validDay) {
            const month = validDay.getMonth();
            if (month !== lastMonth) {
                months.push({
                    label: validDay.toLocaleDateString('en-US', { month: 'short' }),
                    colStart: weekIndex,
                });
                lastMonth = month;
            }
        }
    });

    return (
        <div className={cn('overflow-x-auto', className)}>
            {/* Month labels */}
            <div className="flex text-xs text-muted-foreground mb-2 pl-8">
                {months.map((month, i) => (
                    <div
                        key={i}
                        className="flex-shrink-0"
                        style={{ marginLeft: i === 0 ? 0 : `${(month.colStart - (months[i - 1]?.colStart || 0) - 1) * 14}px` }}
                    >
                        {month.label}
                    </div>
                ))}
            </div>

            <div className="flex gap-0.5">
                {/* Day labels */}
                <div className="flex flex-col gap-0.5 text-xs text-muted-foreground pr-2">
                    <span className="h-3"></span>
                    <span className="h-3">Mon</span>
                    <span className="h-3"></span>
                    <span className="h-3">Wed</span>
                    <span className="h-3"></span>
                    <span className="h-3">Fri</span>
                    <span className="h-3"></span>
                </div>

                {/* Grid */}
                <div className="flex gap-0.5">
                    {weeks.map((week, weekIndex) => (
                        <div key={weekIndex} className="flex flex-col gap-0.5">
                            {week.map((date, dayIndex) => {
                                const isValid = !isNaN(date.getTime());
                                const dateStr = isValid ? formatDate(date) : '';
                                const value = isValid ? (data[dateStr] || 0) : 0;
                                const colorClass = isValid
                                    ? getColorForValue(value, maxValue, colorScale)
                                    : 'bg-transparent';

                                if (!isValid) {
                                    return (
                                        <div
                                            key={dayIndex}
                                            className="w-3 h-3 rounded-sm bg-transparent"
                                        />
                                    );
                                }

                                return (
                                    <Tooltip key={dayIndex}>
                                        <TooltipTrigger asChild>
                                            <div
                                                className={cn(
                                                    'w-3 h-3 rounded-sm transition-colors cursor-default',
                                                    colorClass
                                                )}
                                            />
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="text-xs">
                                            <p className="font-medium">{value} contributions</p>
                                            <p className="text-muted-foreground">
                                                {date.toLocaleDateString('en-US', {
                                                    weekday: 'long',
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                })}
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                <span>Less</span>
                <div className="flex gap-0.5">
                    {colorScale.map((color, i) => (
                        <div key={i} className={cn('w-3 h-3 rounded-sm', color)} />
                    ))}
                </div>
                <span>More</span>
            </div>
        </div>
    );
}
