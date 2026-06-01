import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ACHIEVEMENT_ICONS, ACHIEVEMENT_COLORS } from "@/types";
import type { Achievement } from "@/types";
import { format } from "date-fns";

interface AchievementBadgeProps {
  achievement: Achievement;
  size?: "sm" | "md" | "lg";
}

export function AchievementBadge({ achievement, size = "md" }: AchievementBadgeProps) {
  const icon = ACHIEVEMENT_ICONS[achievement.achievement_type] || "🏅";
  const colorClass = ACHIEVEMENT_COLORS[achievement.achievement_type] || "bg-muted text-muted-foreground border-border";
  const sizeClasses = { sm: "h-6 w-6 text-xs", md: "h-8 w-8 text-sm", lg: "h-10 w-10 text-base" };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("inline-flex items-center justify-center rounded-full border", sizeClasses[size], colorClass)}>
            <span>{icon}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold">{achievement.achievement_name}</p>
            {achievement.description && <p className="text-xs text-muted-foreground">{achievement.description}</p>}
            {achievement.earned_at && <p className="text-xs text-muted-foreground">Earned {format(new Date(achievement.earned_at), "MMM d, yyyy")}</p>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface AchievementBadgeListProps {
  achievements: Achievement[];
  size?: "sm" | "md" | "lg";
  maxVisible?: number;
}

export function AchievementBadgeList({ achievements, size = "md", maxVisible = 5 }: AchievementBadgeListProps) {
  const visible = achievements.slice(0, maxVisible);
  const remaining = achievements.length - maxVisible;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {visible.map((a) => <AchievementBadge key={a.id} achievement={a} size={size} />)}
      {remaining > 0 && (
        <div className={cn(
          "inline-flex items-center justify-center rounded-full bg-muted text-muted-foreground border border-border",
          size === "sm" ? "h-6 px-2 text-xs" : size === "md" ? "h-8 px-2.5 text-sm" : "h-10 px-3 text-base"
        )}>
          +{remaining}
        </div>
      )}
    </div>
  );
}
