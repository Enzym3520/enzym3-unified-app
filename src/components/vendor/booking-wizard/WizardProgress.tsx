import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const STEPS = [
  { num: 1, label: "Event Details" },
  { num: 2, label: "Contact Info" },
  { num: 3, label: "Review" },
];

export function WizardProgress({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-2 md:gap-4 mb-8">
      {STEPS.map((s, i) => {
        const done = currentStep > s.num;
        const active = currentStep === s.num;
        return (
          <div key={s.num} className="flex items-center gap-2 md:gap-4">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "flex items-center justify-center h-9 w-9 rounded-full border-2 text-sm font-bold transition-all",
                  done && "bg-primary border-primary text-primary-foreground",
                  active && "border-primary text-primary bg-primary/10",
                  !done && !active && "border-muted-foreground/30 text-muted-foreground"
                )}
              >
                {done ? <Check className="h-4 w-4" /> : s.num}
              </div>
              <span
                className={cn(
                  "text-xs font-medium hidden sm:block",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-0.5 w-8 md:w-16 rounded-full transition-colors",
                  currentStep > s.num ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
