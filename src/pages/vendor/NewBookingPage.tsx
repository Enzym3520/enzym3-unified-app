import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookingWizardProvider, useBookingWizard, deriveCoupleNameFromData, derivePrimaryEmail } from "@/contexts/BookingWizardContext";
import { WizardProgress } from "@/components/vendor/booking-wizard/WizardProgress";
import { StepClientInfo } from "@/components/vendor/booking-wizard/StepClientInfo";
import { StepEventDetails } from "@/components/vendor/booking-wizard/StepEventDetails";
import { StepReviewSend } from "@/components/vendor/booking-wizard/StepReviewSend";
import { WizardNavigation } from "@/components/vendor/booking-wizard/WizardNavigation";
import { useCreateBooking } from "@/hooks/use-booking-requests";
import { EVENT_TYPE_OPTIONS } from "@/utils/smartFields";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Plus, Users } from "lucide-react";

function WizardContent() {
  const navigate = useNavigate();
  const { step, data, reset } = useBookingWizard();
  const createMutation = useCreateBooking();
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const eventTypeLabel =
        data.event_type === "other"
          ? data.custom_event_type.trim() || "Other"
          : EVENT_TYPE_OPTIONS.find((o) => o.value === data.event_type)?.label ?? data.event_type;

      const coupleName = deriveCoupleNameFromData(data);
      const primaryEmail = derivePrimaryEmail(data);

      await createMutation.mutateAsync({
        couple_name: coupleName,
        contact_email: primaryEmail,
        event_date: data.event_date || undefined,
        event_type: eventTypeLabel || undefined,
        venue: data.venue.trim() || undefined,
        guest_count: data.guest_count ? parseInt(data.guest_count) : undefined,
        notes: data.notes.trim() || undefined,
        start_time: data.start_time || undefined,
        // Wedding-specific
        bride_name: data.bride_name.trim() || undefined,
        groom_name: data.groom_name.trim() || undefined,
        bride_email: data.bride_email.trim() || undefined,
        groom_email: data.groom_email.trim() || undefined,
        bride_phone: data.bride_phone.trim() || undefined,
        groom_phone: data.groom_phone.trim() || undefined,
        // Quince/Birthday
        honoree_name: data.honoree_name.trim() || undefined,
        // Parent/contact
        primary_contact_name: data.event_type === "quinceanera" ? data.parent_name.trim() || undefined : data.contact_name.trim() || undefined,
        primary_contact_email: data.event_type === "quinceanera" ? data.parent_email.trim() || undefined : data.contact_email.trim() || undefined,
        primary_contact_phone: data.event_type === "quinceanera" ? data.parent_phone.trim() || undefined : data.contact_phone.trim() || undefined,
      });

      setSuccess(true);
    } catch {
      // Error handled by mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    const coupleName = deriveCoupleNameFromData(data);
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Booking Created!</h2>
            <p className="text-muted-foreground text-sm">
              {coupleName}'s booking has been created successfully and you've been auto-assigned to this event.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
              <Button variant="outline" onClick={() => navigate("/vendor/clients")}>
                <Users className="mr-1.5 h-4 w-4" /> View Clients
              </Button>
              <Button onClick={() => { reset(); setSuccess(false); }}>
                <Plus className="mr-1.5 h-4 w-4" /> New Booking
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <WizardProgress currentStep={step} />
      {step === 1 && <StepEventDetails />}
      {step === 2 && <StepClientInfo />}
      {step === 3 && <StepReviewSend />}
      <WizardNavigation onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  );
}

export default function NewBookingPage() {
  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">New Booking</h1>
        <p className="text-muted-foreground mt-1">Create a new client booking step by step</p>
      </div>
      <BookingWizardProvider>
        <WizardContent />
      </BookingWizardProvider>
    </div>
  );
}
