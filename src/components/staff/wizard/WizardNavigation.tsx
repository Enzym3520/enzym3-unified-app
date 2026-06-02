import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus, Save } from 'lucide-react';
import { useFormWizard } from '@/contexts/FormWizardContext';
import { useNavigate } from 'react-router-dom';
import { defaultValues } from '@/types/eventForm';
import { toast } from '@/hooks/use-toast';

interface WizardNavigationProps {
  onNext?: () => Promise<boolean> | boolean;
  onPrevious?: () => void;
  nextLabel?: string;
  previousLabel?: string;
  isLastStep?: boolean;
  isSubmitting?: boolean;
}

const WizardNavigation = ({ 
  onNext, 
  onPrevious, 
  nextLabel = "Next",
  previousLabel = "Previous",
  isLastStep = false,
  isSubmitting = false
}: WizardNavigationProps) => {
  const { currentStep, setCurrentStep, totalSteps, form, setUploadedFiles, clearDraft } = useFormWizard();
  const navigate = useNavigate();

  const handleStartNew = () => {
    clearDraft();
    form.reset({
      ...defaultValues,
      wedding_id: crypto.randomUUID(),
    });
    setUploadedFiles([]);
    setCurrentStep(1);
    navigate('/staff/event-notification/step-1');
  };

  const handleSaveForLater = () => {
    toast({
      title: "Draft saved!",
      description: "You can resume anytime within 24 hours.",
    });
    navigate('/staff/coordinator-dashboard');
  };

  // Determine validity for current step
  const isFieldFilled = (key: string, value: any) => {
    if (key === 'numberOfGuests') return typeof value === 'number' ? value > 0 : Number(value) > 0;
    return value !== undefined && value !== null && value !== '';
  };
  
  // Dynamic validation based on event type
  const eventType = form.getValues('eventType');
  const getRequiredFields = (): string[] => {
    switch (currentStep) {
      case 1:
        return ['from', 'vendorType', 'eventType', 'venue'];
      case 2:
        return ['weddingDate', 'numberOfGuests'];
      case 3:
        // Contact details vary by event type
        if (eventType === 'wedding') {
          return ['brideName', 'groomName'];
        } else if (eventType === 'quince') {
          return ['quinceaneraName', 'parentName'];
        } else if (eventType === 'birthday') {
          return ['honoreeName', 'parentName'];
        } else if (eventType === 'banquet') {
          return ['contactName'];
        }
        return [];
      case 4:
        return [];
      default:
        return [];
    }
  };
  
  const values = form.watch();
  const requiredFields = getRequiredFields();
  const isCurrentStepValid = requiredFields.every((k) => isFieldFilled(k, (values as any)[k]));

  const handleNext = async () => {
    if (onNext) {
      const canProceed = await onNext();
      if (!canProceed) return;
    }

    if (currentStep < totalSteps) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      navigate(`/staff/event-notification/step-${nextStep}`);
    }
  };

  const handlePrevious = () => {
    if (onPrevious) {
      onPrevious();
    }

    if (currentStep > 1) {
      const previousStep = currentStep - 1;
      setCurrentStep(previousStep);
      navigate(`/staff/event-notification/step-${previousStep}`);
    }
  };

  return (
    <div className="flex justify-between items-center mt-8 pt-6 border-t border-border/40">
      <Button
        type="button"
        variant="outline"
        onClick={handlePrevious}
        disabled={currentStep === 1}
        className="flex items-center gap-2 rounded-xl px-6 py-3 transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:hover:scale-100 disabled:hover:shadow-none"
      >
        <ChevronLeft className="w-4 h-4" />
        {previousLabel}
      </Button>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleSaveForLater}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-muted-foreground hover:text-foreground transition-all duration-300"
        >
          <Save className="w-4 h-4" />
          <span className="hidden sm:inline">Save & Finish Later</span>
          <span className="sm:hidden">Save</span>
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={handleStartNew}
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground transition-all duration-300 text-xs"
        >
          <Plus className="w-3 h-3" />
          <span className="hidden sm:inline">New</span>
        </Button>
      </div>

      <Button
        type={isLastStep ? "submit" : "button"}
        onClick={isLastStep ? undefined : handleNext}
        disabled={isSubmitting || (!isLastStep && !isCurrentStepValid)}
        className="flex items-center gap-2 rounded-xl px-8 py-3 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 transition-all duration-300 hover:scale-105 hover:shadow-lg shadow-primary/25 disabled:opacity-60 disabled:hover:scale-100 disabled:hover:shadow-none"
      >
        {isSubmitting ? (
          <>
            <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            {isLastStep ? "Submit Event" : nextLabel}
            {!isLastStep && <ChevronRight className="w-4 h-4" />}
          </>
        )}
      </Button>
    </div>
  );
};

export default WizardNavigation;
