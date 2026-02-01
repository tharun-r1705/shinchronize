import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary/10 text-primary",
        secondary: "border-transparent bg-muted text-muted-foreground",
        destructive: "border-transparent bg-destructive/10 text-destructive",
        outline: "border-border text-foreground bg-transparent",
        success: "border-transparent bg-success/10 text-success",
        warning: "border-transparent bg-warning/10 text-warning",
        info: "border-transparent bg-info/10 text-info",
        // Solid variants
        "solid-primary": "border-transparent bg-primary text-primary-foreground",
        "solid-success": "border-transparent bg-success text-success-foreground",
        "solid-warning": "border-transparent bg-warning text-warning-foreground",
        "solid-destructive": "border-transparent bg-destructive text-destructive-foreground",
        // Gradient variants
        gradient: "border-0 bg-gradient-to-r from-primary to-purple-500 text-white",
        "gradient-accent": "border-0 bg-gradient-to-r from-accent to-teal-400 text-white",
        "gradient-warm": "border-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white",
        // Achievement/gaming style
        achievement: [
          "border-amber-500/30 bg-gradient-to-r from-amber-500/20 to-orange-500/20",
          "text-amber-400",
        ].join(" "),
        streak: [
          "border-orange-500/30 bg-gradient-to-r from-orange-500/20 to-red-500/20",
          "text-orange-400",
        ].join(" "),
        level: [
          "border-purple-500/30 bg-gradient-to-r from-purple-500/20 to-pink-500/20",
          "text-purple-400",
        ].join(" "),
        // Status badges
        active: "border-success/30 bg-success/10 text-success",
        inactive: "border-muted bg-muted/50 text-muted-foreground",
        pending: "border-warning/30 bg-warning/10 text-warning",
        verified: "border-accent/30 bg-accent/10 text-accent",
      },
      size: {
        default: "px-2 py-0.5 text-xs",
        sm: "px-1.5 py-px text-[10px]",
        lg: "px-2.5 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode;
}

function Badge({ className, variant, size, icon, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
