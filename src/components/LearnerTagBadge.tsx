import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Rocket, TrendingUp, Sprout, HelpCircle } from "lucide-react";
import type { LearningCategory, LearningTrend } from "@/types/job";

interface LearnerTagBadgeProps {
  learningCategory: LearningCategory;
  learningRate?: number | null;
  trend?: LearningTrend;
  showRate?: boolean;
  size?: "sm" | "md" | "lg";
}

const categoryConfig = {
  fast: {
    label: "Fast Learner",
    shortLabel: "Fast",
    icon: Rocket,
    className: "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 hover:from-green-600 hover:to-emerald-600",
    description: "Quickly acquires new skills and completes milestones ahead of schedule",
  },
  steady: {
    label: "Steady Learner",
    shortLabel: "Steady",
    icon: TrendingUp,
    className: "bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 hover:from-blue-600 hover:to-indigo-600",
    description: "Consistent progress with reliable skill development",
  },
  developing: {
    label: "Developing",
    shortLabel: "Developing",
    icon: Sprout,
    className: "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 hover:from-amber-600 hover:to-orange-600",
    description: "Building foundational skills with room for growth",
  },
  not_determined: {
    label: "Not Determined",
    shortLabel: "N/A",
    icon: HelpCircle,
    className: "bg-gray-100 text-gray-600 border border-gray-300",
    description: "Insufficient data to determine learning rate",
  },
};

const trendIcons = {
  accelerating: "↑",
  steady: "→",
  slowing: "↓",
};

export default function LearnerTagBadge({
  learningCategory,
  learningRate,
  trend,
  showRate = true,
  size = "md",
}: LearnerTagBadgeProps) {
  const config = categoryConfig[learningCategory] || categoryConfig.not_determined;
  const Icon = config.icon;

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
    lg: "h-4 w-4",
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            className={`${config.className} ${sizeClasses[size]} flex items-center gap-1 cursor-help font-medium shadow-sm`}
          >
            <Icon className={iconSizes[size]} />
            <span>{size === "sm" ? config.shortLabel : config.label}</span>
            {showRate && learningRate !== null && learningRate !== undefined && (
              <span className="opacity-90">
                ({learningRate}
                {trend && trendIcons[trend] ? trendIcons[trend] : ""})
              </span>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-2">
            <p className="font-semibold">{config.label}</p>
            <p className="text-sm text-muted-foreground">{config.description}</p>
            {learningRate !== null && learningRate !== undefined && (
              <div className="text-sm">
                <span className="font-medium">Learning Score: </span>
                <span>{learningRate}/100</span>
              </div>
            )}
            {trend && (
              <div className="text-sm">
                <span className="font-medium">Trend: </span>
                <span className="capitalize">{trend}</span>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Export a simple version without tooltip for list views
export function LearnerTagBadgeSimple({
  learningCategory,
  learningRate,
  size = "sm",
}: Omit<LearnerTagBadgeProps, "trend" | "showRate">) {
  const config = categoryConfig[learningCategory] || categoryConfig.not_determined;
  const Icon = config.icon;

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
    lg: "h-4 w-4",
  };

  return (
    <Badge
      className={`${config.className} ${sizeClasses[size]} flex items-center gap-1 font-medium shadow-sm`}
    >
      <Icon className={iconSizes[size]} />
      <span>{config.shortLabel}</span>
      {learningRate !== null && learningRate !== undefined && (
        <span className="opacity-90">({learningRate})</span>
      )}
    </Badge>
  );
}
