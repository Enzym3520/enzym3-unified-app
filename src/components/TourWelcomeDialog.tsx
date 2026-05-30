import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePortalTour } from "@/contexts/PortalTourContext";
import { supabase } from "@/integrations/supabase/client";
import { PartyPopper } from "lucide-react";
import { getEventLabel } from "@/lib/eventUtils";

export const TourWelcomeDialog = () => {
  const { startTour, hasCompletedTour, markTourComplete, eventType } = usePortalTour();
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const eventLabel = getEventLabel(eventType);

  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout> | null = null;

    const showTourWithDelay = () => {
      timerId = setTimeout(() => {
        setOpen(true);
      }, 1000);
    };

    const checkIfPaymentRequired = (wedding: {
      deposit_paid: boolean | null;
      booking_source: string | null;
      payment_required: boolean | null;
    }): boolean => {
      if (wedding.booking_source === 'venue_partner') return false;
      if (wedding.payment_required === false) return false;
      return true;
    };

    const checkTourStatus = async () => {
      if (hasCompletedTour || dismissed) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('tour_completed')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.tour_completed) return;

      const userEmail = user.email;
      if (!userEmail) return;

      const { data: coupleCode } = await supabase
        .from('couple_codes')
        .select('wedding_id')
        .or(`bride_email.eq.${userEmail},groom_email.eq.${userEmail}`)
        .maybeSingle();

      let weddingId = coupleCode?.wedding_id;

      if (!weddingId) {
        const { data: event } = await supabase
          .from('event_notification_history')
          .select('id')
          .or(`contact_email.eq.${userEmail},bride_email.eq.${userEmail},groom_email.eq.${userEmail}`)
          .maybeSingle();
        weddingId = event?.id;
      }

      if (!weddingId && user.id) {
        const { data: vcAssignment } = await supabase
          .from('vendor_client_assignments')
          .select('event_id')
          .eq('client_user_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        weddingId = vcAssignment?.event_id ?? undefined;
      }

      if (!weddingId) {
        showTourWithDelay();
        return;
      }

      const { data: wedding, error } = await supabase
        .from('event_notification_history')
        .select('deposit_paid, booking_source, payment_required')
        .eq('id', weddingId)
        .maybeSingle();

      if (error || !wedding) {
        showTourWithDelay();
        return;
      }

      const requiresPayment = checkIfPaymentRequired(wedding);
      if (!requiresPayment || wedding.deposit_paid) {
        showTourWithDelay();
      }
    };

    checkTourStatus();

    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [hasCompletedTour, dismissed]);

  const handleStartTour = () => {
    setOpen(false);
    setTimeout(() => {
      startTour();
    }, 300);
  };

  const handleDismiss = async () => {
    setDismissed(true);
    try {
      await markTourComplete();
      setOpen(false);
    } catch (error) {
      console.error('Failed to save tour status:', error);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <PartyPopper className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-2xl">Welcome to Your {eventLabel} Portal!</DialogTitle>
          </div>
          <DialogDescription className="text-base space-y-3 pt-2">
            <p>
              Congratulations on your upcoming {eventLabel.toLowerCase()}! This portal is your central hub for managing
              all entertainment details with Enzym3 Entertainment.
            </p>
            <p>
              Would you like a quick guided tour? We'll show you around and highlight the key features
              to help you get started.
            </p>
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <p className="font-medium text-foreground mb-1">You'll learn how to:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Complete your music preferences (Vibe Sheet)</li>
                <li>• Browse and request entertainment upgrades</li>
                <li>• Schedule your final details meeting</li>
                <li>• Upload and share important documents</li>
              </ul>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleDismiss} className="w-full sm:w-auto">
            Skip for Now
          </Button>
          <Button onClick={handleStartTour} className="w-full sm:w-auto">
            Start Tour (2 min)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
