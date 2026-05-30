import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFormWizard } from '@/contexts/FormWizardContext';
import { useFormProgress } from '@/hooks/useFormProgress';

interface WizardProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
}

const WizardProgressIndicator = ({ currentStep, totalSteps, stepTitles }: WizardProgressIndicatorProps) => {
  const { form } = useFormWizard();
  const overall = Math.round(useFormProgress(form));
  return (
    <div className="w-full py-4 md:py-8 px-2">
      <div className="flex items-center justify-between max-w-4xl mx-auto mb-2">
        <span className="text-sm text-muted-foreground">Overall progress</span>
        <span className="text-sm font-semibold text-primary">{overall}%</span>
      </div>
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isUpcoming = stepNumber > currentStep;

          return (
            <div key={stepNumber} className="flex items-center">
              <div className="flex flex-col items-center group">
                <div
                  className={cn(
                    "w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl",
                    {
                      "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-primary/25": isCompleted,
                      "bg-gradient-to-r from-primary/20 to-primary/10 border-2 border-primary text-primary shadow-primary/20 scale-110": isCurrent,
                      "bg-gradient-to-r from-muted to-muted/80 border-2 border-muted-foreground/20 text-muted-foreground": isUpcoming,
                    }
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-3 h-3 md:w-5 md:h-5 animate-scale-in" />
                  ) : (
                    <span className="text-xs md:text-sm font-semibold">{stepNumber}</span>
                  )}
                </div>
                <span
                  className={cn(
                    "mt-2 md:mt-3 text-xs md:text-sm font-medium text-center max-w-16 md:max-w-24 transition-all duration-300 leading-tight",
                    {
                      "text-primary font-semibold": isCompleted || isCurrent,
                      "text-muted-foreground": isUpcoming,
                    }
                  )}
                >
                  {stepTitles[index]}
                </span>
              </div>
              {index < totalSteps - 1 && (
                <div className="flex-1 h-1 mx-2 md:mx-6 rounded-full overflow-hidden bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500 ease-out",
                      {
                        "bg-gradient-to-r from-primary to-primary/80 w-full": stepNumber < currentStep,
                        "bg-gradient-to-r from-primary to-primary/60 w-1/2": stepNumber === currentStep,
                        "w-0": stepNumber > currentStep,
                      }
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WizardProgressIndicator;