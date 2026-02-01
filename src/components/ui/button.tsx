import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "rounded-lg text-sm font-medium",
    "ring-offset-background transition-all duration-200 ease-out-quart",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-primary text-primary-foreground",
          "hover:bg-primary/90",
          "active:scale-[0.98]",
        ].join(" "),
        destructive: [
          "bg-destructive text-destructive-foreground",
          "hover:bg-destructive/90",
          "active:scale-[0.98]",
        ].join(" "),
        outline: [
          "border border-border bg-transparent",
          "hover:bg-muted hover:text-foreground",
          "active:scale-[0.98]",
        ].join(" "),
        secondary: [
          "bg-muted text-foreground",
          "hover:bg-muted/80",
          "active:scale-[0.98]",
        ].join(" "),
        ghost: [
          "hover:bg-muted hover:text-foreground",
          "active:scale-[0.98]",
        ].join(" "),
        link: [
          "text-primary underline-offset-4",
          "hover:underline",
          "p-0 h-auto",
        ].join(" "),
        // Premium variants for Aurora theme
        glow: [
          "bg-primary text-primary-foreground",
          "shadow-glow hover:shadow-glow-lg",
          "hover:scale-[1.02]",
          "active:scale-[0.98]",
        ].join(" "),
        gradient: [
          "bg-gradient-to-r from-primary to-purple-500 text-white",
          "hover:opacity-90 hover:shadow-glow",
          "active:scale-[0.98]",
        ].join(" "),
        "gradient-secondary": [
          "bg-gradient-to-r from-secondary to-primary text-white",
          "hover:opacity-90",
          "active:scale-[0.98]",
        ].join(" "),
        "gradient-accent": [
          "bg-gradient-to-r from-accent to-teal-400 text-white",
          "hover:opacity-90 hover:shadow-glow-accent",
          "active:scale-[0.98]",
        ].join(" "),
        glass: [
          "glass text-foreground",
          "hover:bg-muted/30",
          "active:scale-[0.98]",
        ].join(" "),
        success: [
          "bg-success text-success-foreground",
          "hover:bg-success/90",
          "active:scale-[0.98]",
        ].join(" "),
        warning: [
          "bg-warning text-warning-foreground",
          "hover:bg-warning/90",
          "active:scale-[0.98]",
        ].join(" "),
        info: [
          "bg-info text-info-foreground",
          "hover:bg-info/90",
          "active:scale-[0.98]",
        ].join(" "),
        // Soft/subtle variants
        "soft-primary": [
          "bg-primary/10 text-primary",
          "hover:bg-primary/20",
          "active:scale-[0.98]",
        ].join(" "),
        "soft-success": [
          "bg-success/10 text-success",
          "hover:bg-success/20",
          "active:scale-[0.98]",
        ].join(" "),
        "soft-warning": [
          "bg-warning/10 text-warning",
          "hover:bg-warning/20",
          "active:scale-[0.98]",
        ].join(" "),
        "soft-destructive": [
          "bg-destructive/10 text-destructive",
          "hover:bg-destructive/20",
          "active:scale-[0.98]",
        ].join(" "),
      },
      size: {
        default: "h-9 px-4 py-2",
        xs: "h-7 px-2.5 text-xs rounded-md",
        sm: "h-8 px-3 text-xs rounded-md",
        lg: "h-10 px-6 text-sm",
        xl: "h-11 px-8 text-base",
        "2xl": "h-12 px-10 text-base",
        icon: "h-9 w-9",
        "icon-xs": "h-7 w-7 rounded-md",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-10 w-10",
        "icon-xl": "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
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
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading...</span>
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
