import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  FileText,
  DollarSign,
  Music,
  Sparkles,
  Check,
  Circle,
  PartyPopper
} from "lucide-react";
import { cn } from "@/lib/utils";
import { parseLocalDate } from "@/lib/formatters";

interface Milestone {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  path?: string;
  icon: React.ElementType;
}

interface ProgressTrackerProps {
  contractSigned: boolean;
  depositPaid: boolean;
  vibeSheetCompleted: boolean;
  bookingSource?: string | null;
  paymentRequired?: boolean;
  hasUnpaidUpgrades?: boolean;
  hasUpgrades?: boolean;
  eventDate?: string | null;
}

const ProgressTracker = ({
  contractSigned,
  depositPaid,
  vibeSheetCompleted,
  bookingSource,
  paymentRequired,
  hasUnpaidUpgrades = false,
  hasUpgrades = false,
  eventDate,
}: ProgressTrackerProps) => {
  const navigate = useNavigate();

  const isIndependent = paymentRequired === true || bookingSource === 'independent';

  const milestones: Milestone[] = [];

  if (isIndependent) {
    milestones.push(
      {
        id: "contract",
        label: "Contract Signed",
        description: "Review and sign your service agreement",
        completed: contractSigned,
        path: "/app/contract",
        icon: FileText,
      },
      {
        id: "deposit",
        label: "Deposit Paid",
        description: "Secure your date with a deposit",
        completed: depositPaid,
        path: "/app/contract",
        icon: DollarSign,
      }
    );
  }

  milestones.push({
    id: "vibe-sheet",
    label: "Vibe Sheet Completed",
    description: "Share your music preferences",
    completed: vibeSheetCompleted,
    path: "/app/vibe-sheet",
    icon: Music,
  });

  if (hasUpgrades) {
    milestones.push({
      id: "upgrades",
      label: "Upgrades Paid",
      description: "Complete payment for your selected upgrades",
      completed: !hasUnpaidUpgrades,
      path: "/app/upgrades",
      icon: Sparkles,
    });
  }

  if (eventDate) {
    const eventDayPassed = new Date() >= parseLocalDate(eventDate);
    milestones.push({
      id: "event-day",
      label: eventDayPassed ? "Event Complete" : "Event Day",
      description: "Your big day",
      completed: eventDayPassed,
      icon: PartyPopper,
    });
  }

  const completedCount = milestones.filter((m) => m.completed).length;
  const progressPercent = Math.round((completedCount / milestones.length) * 100);

  return (
    // Tour step: portalTourSteps.ts — "Your Progress Checklist"
    <Card className="card-luxury" data-tour="progress-tracker">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Your Progress</CardTitle>
          <span className="text-sm font-medium text-muted-foreground">
            {completedCount}/{milestones.length} complete
          </span>
        </div>
        <Progress value={progressPercent} className="h-2 mt-2" />
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1">
          {milestones.map((milestone) => {
            const Icon = milestone.icon;
            const innerContent = (
              <>
                <div
                  className={cn(
                    "flex items-center justify-center h-7 w-7 rounded-full flex-shrink-0",
                    milestone.completed
                      ? "bg-primary text-primary-foreground"
                      : "border-2 border-muted-foreground/30 text-muted-foreground"
                  )}
                >
                  {milestone.completed ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Circle className="h-3 w-3" />
                  )}
                </div>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Icon
                    className={cn(
                      "h-4 w-4 flex-shrink-0",
                      milestone.completed
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                  />
                  <div className="min-w-0">
                    <p
                      className={cn(
                        "text-sm font-medium truncate",
                        milestone.completed
                          ? "line-through text-muted-foreground"
                          : "text-foreground"
                      )}
                    >
                      {milestone.label}
                    </p>
                  </div>
                </div>
              </>
            );

            if (!milestone.path) {
              return (
                <div
                  key={milestone.id}
                  className={cn(
                    "flex items-center gap-3 w-full text-left p-2.5 rounded-lg",
                    milestone.completed && "opacity-80"
                  )}
                >
                  {innerContent}
                </div>
              );
            }

            return (
              <button
                key={milestone.id}
                onClick={() => navigate(milestone.path!)}
                className={cn(
                  "flex items-center gap-3 w-full text-left p-2.5 rounded-lg transition-colors",
                  "hover:bg-accent/50",
                  milestone.completed && "opacity-80"
                )}
              >
                {innerContent}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressTracker;
