import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium",
    "ring-offset-background transition-all duration-200 ease-out-quart",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    "active:scale-[0.98]",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-primary text-primary-foreground",
          "hover:bg-primary/90 hover:shadow-glow",
          "active:bg-primary/80",
        ].join(" "),
        destructive: [
          "bg-destructive text-destructive-foreground",
          "hover:bg-destructive/90 hover:shadow-[0_0_20px_hsl(var(--destructive)/0.3)]",
          "active:bg-destructive/80",
        ].join(" "),
        outline: [
          "border border-input bg-background",
          "hover:bg-muted hover:border-muted-foreground/20",
          "active:bg-muted/80",
        ].join(" "),
        secondary: [
          "bg-secondary text-secondary-foreground",
          "hover:bg-secondary/80",
          "active:bg-secondary/70",
        ].join(" "),
        ghost: [
          "hover:bg-muted/50 hover:text-foreground",
          "active:bg-muted/70",
        ].join(" "),
        link: [
          "text-primary underline-offset-4",
          "hover:underline",
        ].join(" "),
        // New premium variants
        glow: [
          "bg-primary text-primary-foreground",
          "shadow-glow hover:shadow-glow-lg",
          "hover:scale-[1.02]",
          "active:scale-[0.98]",
        ].join(" "),
        gradient: [
          "bg-gradient-primary text-white",
          "hover:opacity-90 hover:shadow-glow",
          "active:opacity-80",
        ].join(" "),
        glass: [
          "glass border-0",
          "hover:bg-white/20 dark:hover:bg-white/10",
          "active:bg-white/30 dark:active:bg-white/15",
        ].join(" "),
        success: [
          "bg-success text-success-foreground",
          "hover:bg-success/90 hover:shadow-[0_0_20px_hsl(var(--success)/0.3)]",
          "active:bg-success/80",
        ].join(" "),
        warning: [
          "bg-warning text-warning-foreground",
          "hover:bg-warning/90 hover:shadow-[0_0_20px_hsl(var(--warning)/0.3)]",
          "active:bg-warning/80",
        ].join(" "),
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-8 text-base",
        xl: "h-12 rounded-lg px-10 text-base",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading...
          </>
        ) : (
          children
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
