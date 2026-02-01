import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const progressVariants = cva(
  "relative w-full overflow-hidden rounded-full",
  {
    variants: {
      variant: {
        default: "bg-muted",
        primary: "bg-primary/20",
        success: "bg-success/20",
        warning: "bg-warning/20",
        destructive: "bg-destructive/20",
        accent: "bg-accent/20",
      },
      size: {
        default: "h-2",
        xs: "h-1",
        sm: "h-1.5",
        lg: "h-3",
        xl: "h-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const indicatorVariants = cva(
  "h-full w-full flex-1 transition-all duration-500 ease-out-expo",
  {
    variants: {
      variant: {
        default: "bg-primary",
        primary: "bg-primary",
        success: "bg-success",
        warning: "bg-warning",
        destructive: "bg-destructive",
        accent: "bg-accent",
        gradient: "bg-gradient-to-r from-primary to-purple-500",
        "gradient-accent": "bg-gradient-to-r from-accent to-teal-400",
        "gradient-warm": "bg-gradient-to-r from-amber-500 to-orange-500",
      },
      animated: {
        true: "animate-progress-fill",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      animated: false,
    },
  }
);

export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
    VariantProps<typeof progressVariants> {
  indicatorVariant?: VariantProps<typeof indicatorVariants>["variant"];
  animated?: boolean;
  showValue?: boolean;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, variant, size, indicatorVariant, animated, showValue, ...props }, ref) => (
  <div className="relative w-full">
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(progressVariants({ variant, size }), className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          indicatorVariants({ 
            variant: indicatorVariant || (variant as VariantProps<typeof indicatorVariants>["variant"]) || "default",
            animated 
          }),
          "rounded-full"
        )}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
    {showValue && (
      <span className="absolute right-0 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground ml-2">
        {value}%
      </span>
    )}
  </div>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

// Circular Progress Ring Component
interface ProgressRingProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  trackClassName?: string;
  indicatorClassName?: string;
  children?: React.ReactNode;
  variant?: "default" | "primary" | "success" | "warning" | "destructive" | "accent" | "gradient";
}

const ProgressRing = React.forwardRef<SVGSVGElement, ProgressRingProps>(
  ({ 
    value, 
    max = 100, 
    size = 120, 
    strokeWidth = 8, 
    className,
    trackClassName,
    indicatorClassName,
    children,
    variant = "primary"
  }, ref) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const progress = Math.min(Math.max(value, 0), max);
    const offset = circumference - (progress / max) * circumference;

    const variantColors = {
      default: "stroke-primary",
      primary: "stroke-primary",
      success: "stroke-success",
      warning: "stroke-warning",
      destructive: "stroke-destructive",
      accent: "stroke-accent",
      gradient: "stroke-[url(#gradient)]",
    };

    return (
      <div className={cn("relative inline-flex items-center justify-center", className)}>
        <svg
          ref={ref}
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(280 87% 65%)" />
            </linearGradient>
          </defs>
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className={cn("text-muted", trackClassName)}
          />
          {/* Progress indicator */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={cn(
              "transition-all duration-500 ease-out-expo",
              variant === "gradient" ? "" : variantColors[variant],
              indicatorClassName
            )}
            style={variant === "gradient" ? { stroke: "url(#gradient)" } : undefined}
          />
        </svg>
        {children && (
          <div className="absolute inset-0 flex items-center justify-center">
            {children}
          </div>
        )}
      </div>
    );
  }
);
ProgressRing.displayName = "ProgressRing";

export { Progress, ProgressRing, progressVariants };
