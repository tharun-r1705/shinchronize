import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle, Circle, Clock, ChevronRight } from 'lucide-react';

export interface TimelineItem {
    id: string;
    title: string;
    description?: string;
    status: 'completed' | 'in-progress' | 'not-started';
    date?: string;
    onClick?: () => void;
}

export interface TimelineProps {
    items: TimelineItem[];
    orientation?: 'vertical' | 'horizontal';
    className?: string;
}

const statusConfig = {
    completed: {
        icon: CheckCircle,
        color: 'text-success',
        bgColor: 'bg-success/20',
        lineColor: 'bg-success',
    },
    'in-progress': {
        icon: Clock,
        color: 'text-warning',
        bgColor: 'bg-warning/20',
        lineColor: 'bg-warning',
    },
    'not-started': {
        icon: Circle,
        color: 'text-muted-foreground',
        bgColor: 'bg-muted',
        lineColor: 'bg-border',
    },
};

export function Timeline({
    items,
    orientation = 'vertical',
    className,
}: TimelineProps) {
    if (orientation === 'horizontal') {
        return (
            <div className={cn('flex items-center gap-2 overflow-x-auto pb-2', className)}>
                {items.map((item, index) => {
                    const config = statusConfig[item.status];
                    const Icon = config.icon;
                    const isLast = index === items.length - 1;

                    return (
                        <React.Fragment key={item.id}>
                            <div
                                className={cn(
                                    'flex flex-col items-center gap-2 min-w-[120px]',
                                    item.onClick && 'cursor-pointer'
                                )}
                                onClick={item.onClick}
                            >
                                <div
                                    className={cn(
                                        'w-10 h-10 rounded-full flex items-center justify-center',
                                        config.bgColor
                                    )}
                                >
                                    <Icon className={cn('w-5 h-5', config.color)} />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-medium line-clamp-1">{item.title}</p>
                                    {item.date && (
                                        <p className="text-xs text-muted-foreground">{item.date}</p>
                                    )}
                                </div>
                            </div>
                            {!isLast && (
                                <div className={cn('h-0.5 w-8 flex-shrink-0', config.lineColor)} />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        );
    }

    return (
        <div className={cn('space-y-0', className)}>
            {items.map((item, index) => {
                const config = statusConfig[item.status];
                const Icon = config.icon;
                const isLast = index === items.length - 1;

                return (
                    <div
                        key={item.id}
                        className={cn(
                            'flex gap-4',
                            item.onClick && 'cursor-pointer hover:bg-muted/50 rounded-lg p-2 -m-2'
                        )}
                        onClick={item.onClick}
                    >
                        {/* Timeline indicator */}
                        <div className="flex flex-col items-center">
                            <div
                                className={cn(
                                    'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                                    config.bgColor
                                )}
                            >
                                <Icon className={cn('w-4 h-4', config.color)} />
                            </div>
                            {!isLast && (
                                <div className={cn('w-0.5 flex-1 min-h-[40px]', config.lineColor)} />
                            )}
                        </div>

                        {/* Content */}
                        <div className={cn('flex-1 pb-6', isLast && 'pb-0')}>
                            <div className="flex items-center justify-between">
                                <p className="font-medium">{item.title}</p>
                                {item.onClick && (
                                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                )}
                            </div>
                            {item.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    {item.description}
                                </p>
                            )}
                            {item.date && (
                                <p className="text-xs text-muted-foreground mt-1">{item.date}</p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
