import { Check } from "lucide-react";

export function ProgressSteps({ currentStep }: { currentStep: number }) {
  const steps = [
    { number: 1, label: "Review" },
    { number: 2, label: "Sign" },
    { number: 3, label: "Pay" },
  ];

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                step.number < currentStep
                  ? "bg-primary text-primary-foreground"
                  : step.number === currentStep
                  ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {step.number < currentStep ? <Check className="h-4 w-4" /> : step.number}
            </div>
            <span
              className={`text-sm font-medium ${
                step.number <= currentStep ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`w-12 h-0.5 mx-3 ${
                step.number < currentStep ? "bg-primary" : "bg-muted"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
