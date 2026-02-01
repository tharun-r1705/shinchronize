import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const cardVariants = cva(
  "rounded-xl border bg-card text-card-foreground transition-all duration-200 ease-out-quart",
  {
    variants: {
      variant: {
        default: "border-border/50 shadow-sm",
        elevated: "border-border/50 shadow-md hover:shadow-lg hover:-translate-y-0.5",
        outline: "border-border bg-transparent shadow-none",
        ghost: "border-transparent bg-transparent shadow-none",
        filled: "border-transparent bg-muted shadow-none",
        glass: [
          "glass border-white/[0.08]",
          "backdrop-blur-xl",
        ].join(" "),
        "glass-subtle": [
          "bg-card/50 border-border/30",
          "backdrop-blur-sm",
        ].join(" "),
        gradient: [
          "border-0",
          "bg-gradient-to-br from-primary/5 via-transparent to-accent/5",
        ].join(" "),
        "gradient-border": [
          "border-0 relative",
          "before:absolute before:inset-0 before:rounded-xl before:p-[1px]",
          "before:bg-gradient-to-br before:from-primary/50 before:to-accent/50",
          "before:-z-10",
        ].join(" "),
        interactive: [
          "border-border/50 shadow-sm cursor-pointer",
          "hover:shadow-md hover:-translate-y-1 hover:border-border",
          "active:translate-y-0 active:shadow-sm",
        ].join(" "),
        glow: [
          "border-primary/20 shadow-sm",
          "hover:shadow-glow hover:border-primary/40",
        ].join(" "),
        "glow-accent": [
          "border-accent/20 shadow-sm",
          "hover:shadow-glow-accent hover:border-accent/40",
        ].join(" "),
        stat: [
          "border-border/50 shadow-sm overflow-hidden",
          "before:absolute before:inset-x-0 before:top-0 before:h-px",
          "before:bg-gradient-to-r before:from-transparent before:via-primary/50 before:to-transparent",
          "before:opacity-0 hover:before:opacity-100 before:transition-opacity",
          "relative",
        ].join(" "),
        bento: [
          "border-border/30 bg-card/80",
          "hover:bg-card hover:border-border/50",
          "backdrop-blur-sm",
        ].join(" "),
      },
      padding: {
        default: "",
        none: "[&>*]:p-0",
        sm: "[&_.card-header]:p-4 [&_.card-content]:p-4 [&_.card-content]:pt-0 [&_.card-footer]:p-4 [&_.card-footer]:pt-0",
        md: "[&_.card-header]:p-5 [&_.card-content]:p-5 [&_.card-content]:pt-0 [&_.card-footer]:p-5 [&_.card-footer]:pt-0",
        lg: "[&_.card-header]:p-6 [&_.card-content]:p-6 [&_.card-content]:pt-0 [&_.card-footer]:p-6 [&_.card-footer]:pt-0",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "default",
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, padding, className }))}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("card-header flex flex-col space-y-1.5 p-5", className)}
      {...props}
    />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        "font-heading text-lg font-semibold leading-none tracking-tight",
        className
      )}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("card-content p-5 pt-0", className)}
      {...props}
    />
  )
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("card-footer flex items-center p-5 pt-0", className)}
      {...props}
    />
  )
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants };
