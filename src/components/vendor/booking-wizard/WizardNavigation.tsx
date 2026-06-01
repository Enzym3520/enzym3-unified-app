import { Button } from "@/components/ui/button";
import { useBookingWizard, derivePrimaryEmail } from "@/contexts/BookingWizardContext";
import { ArrowLeft, ArrowRight, Send, Loader2 } from "lucide-react";

interface Props {
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function WizardNavigation({ onSubmit, isSubmitting }: Props) {
  const { step, setStep, data } = useBookingWizard();

  // Step 1: event type required
  const canProceedStep1 = data.event_type.length > 0;

  // Step 2: type-specific required fields
  const canProceedStep2 = (() => {
    const type = data.event_type;
    if (type === "wedding") {
      const hasName = data.bride_name.trim().length > 0 || data.groom_name.trim().length > 0;
      const hasEmail = data.bride_email.trim().length > 0 || data.groom_email.trim().length > 0;
      return hasName && hasEmail;
    }
    if (type === "quinceanera") {
      return data.honoree_name.trim().length > 0 && data.parent_name.trim().length > 0 && data.parent_email.trim().length > 0;
    }
    if (type === "birthday" || type === "sweet_16") {
      return data.honoree_name.trim().length > 0 && data.contact_name.trim().length > 0 && data.contact_email.trim().length > 0;
    }
    // Generic: contact name + email
    return data.contact_name.trim().length > 0 && data.contact_email.trim().length > 0;
  })();

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const canProceed = step === 1 ? canProceedStep1 : step === 2 ? canProceedStep2 : true;

  return (
    <div className="flex items-center justify-between pt-4">
      {step > 1 ? (
        <Button variant="outline" onClick={() => setStep(step - 1)} disabled={isSubmitting}>
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
        </Button>
      ) : (
        <div />
      )}

      {step < 3 ? (
        <Button onClick={handleNext} disabled={!canProceed}>
          Next <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
      ) : (
        <Button onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Creating…</>
          ) : (
            <><Send className="mr-1.5 h-4 w-4" /> Create Booking</>
          )}
        </Button>
      )}
    </div>
  );
}
