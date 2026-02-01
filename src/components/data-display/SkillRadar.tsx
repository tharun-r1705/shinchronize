import React from 'react';
import { cn } from '@/lib/utils';

export interface SkillRadarProps {
    data: Record<string, number>; // Skill name to value (0-100)
    maxValue?: number;
    size?: number;
    className?: string;
}

export function SkillRadar({
    data,
    maxValue = 100,
    size = 200,
    className,
}: SkillRadarProps) {
    const skills = Object.entries(data);
    const numSkills = skills.length;
    
    if (numSkills < 3) {
        return (
            <div className={cn('flex items-center justify-center text-muted-foreground', className)}>
                Need at least 3 skills for radar chart
            </div>
        );
    }

    const center = size / 2;
    const radius = (size / 2) - 30;
    const angleStep = (2 * Math.PI) / numSkills;

    // Generate points for the polygon
    const generatePolygonPoints = (values: number[]) => {
        return values
            .map((value, index) => {
                const angle = angleStep * index - Math.PI / 2;
                const r = (value / maxValue) * radius;
                const x = center + r * Math.cos(angle);
                const y = center + r * Math.sin(angle);
                return `${x},${y}`;
            })
            .join(' ');
    };

    // Generate grid lines
    const gridLevels = [0.2, 0.4, 0.6, 0.8, 1];
    const gridLines = gridLevels.map(level => {
        const points = Array.from({ length: numSkills }, (_, index) => {
            const angle = angleStep * index - Math.PI / 2;
            const r = level * radius;
            const x = center + r * Math.cos(angle);
            const y = center + r * Math.sin(angle);
            return `${x},${y}`;
        }).join(' ');
        return points;
    });

    // Generate axis lines
    const axisLines = skills.map((_, index) => {
        const angle = angleStep * index - Math.PI / 2;
        const x = center + radius * Math.cos(angle);
        const y = center + radius * Math.sin(angle);
        return { x1: center, y1: center, x2: x, y2: y };
    });

    // Generate labels
    const labels = skills.map(([skill], index) => {
        const angle = angleStep * index - Math.PI / 2;
        const labelRadius = radius + 20;
        const x = center + labelRadius * Math.cos(angle);
        const y = center + labelRadius * Math.sin(angle);
        return { skill, x, y, angle };
    });

    const values = skills.map(([, value]) => value);
    const polygonPoints = generatePolygonPoints(values);

    return (
        <div className={cn('relative', className)}>
            <svg width={size} height={size} className="overflow-visible">
                {/* Grid */}
                {gridLines.map((points, level) => (
                    <polygon
                        key={level}
                        points={points}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                        className="text-border"
                        strokeDasharray={level < gridLevels.length - 1 ? '2,2' : 'none'}
                    />
                ))}

                {/* Axis lines */}
                {axisLines.map((line, index) => (
                    <line
                        key={index}
                        x1={line.x1}
                        y1={line.y1}
                        x2={line.x2}
                        y2={line.y2}
                        stroke="currentColor"
                        strokeWidth="1"
                        className="text-border"
                    />
                ))}

                {/* Data polygon */}
                <polygon
                    points={polygonPoints}
                    fill="currentColor"
                    className="text-primary/20"
                />
                <polygon
                    points={polygonPoints}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-primary"
                />

                {/* Data points */}
                {values.map((value, index) => {
                    const angle = angleStep * index - Math.PI / 2;
                    const r = (value / maxValue) * radius;
                    const x = center + r * Math.cos(angle);
                    const y = center + r * Math.sin(angle);
                    return (
                        <circle
                            key={index}
                            cx={x}
                            cy={y}
                            r="4"
                            fill="currentColor"
                            className="text-primary"
                        />
                    );
                })}

                {/* Labels */}
                {labels.map(({ skill, x, y }, index) => (
                    <text
                        key={index}
                        x={x}
                        y={y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-xs fill-muted-foreground font-medium"
                    >
                        {skill.length > 10 ? skill.slice(0, 10) + '...' : skill}
                    </text>
                ))}
            </svg>
        </div>
    );
}
