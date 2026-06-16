import { useEffect, useState, useRef } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface PaymentStatusResult {
  isLocked: boolean;
  checking: boolean;
}

export function usePaymentStatus(): PaymentStatusResult {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const checkedRef = useRef(false);
  const lastUserIdRef = useRef<string | undefined>(undefined);

  const isContractPage = location.pathname.startsWith('/app/contract');
  const hasPaymentParam = searchParams.get('payment') === 'success';

  useEffect(() => {
    if (authLoading) return;

    // Reset check when user changes (logout/login)
    if (user?.id !== lastUserIdRef.current) {
      checkedRef.current = false;
      lastUserIdRef.current = user?.id;
    }

    // Reset check when returning from payment so deposit gets re-verified
    if (hasPaymentParam) {
      checkedRef.current = false;
    }

    // Contract page and payment-success bypass are never locked
    if (isContractPage || hasPaymentParam) {
      setIsLocked(false);
      setChecking(false);
      return;
    }

    if (!user?.email) {
      setChecking(false);
      return;
    }

    // Only check once per mount/user
    if (checkedRef.current) return;
    checkedRef.current = true;

    checkDepositStatus();
    // checkDepositStatus reads only the deps already listed; the checkedRef guard
    // above makes it run once per mount/user, so adding it as a dep is unnecessary.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, isContractPage, hasPaymentParam]);

  const checkDepositStatus = async () => {
    if (!user?.email) {
      setChecking(false);
      return;
    }

    try {
      const emailLower = user.email.toLowerCase();
      // Find wedding via couple_codes (case-insensitive)
      const { data: coupleCode } = await supabase
        .from('couple_codes')
        .select('wedding_id')
        .or(`bride_email.ilike.${emailLower},groom_email.ilike.${emailLower}`)
        .maybeSingle();

      let weddingId = coupleCode?.wedding_id;

      if (!weddingId) {
        const { data: event } = await supabase
          .from('event_notification_history')
          .select('id')
          .or(`contact_email.ilike.${emailLower},bride_email.ilike.${emailLower},groom_email.ilike.${emailLower}`)
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

      // No wedding found — allow access (new user or admin)
      if (!weddingId) {
        setIsLocked(false);
        setChecking(false);
        return;
      }

      const { data: wedding, error } = await supabase
        .from('event_notification_history')
        .select('id, deposit_paid, booking_source, payment_required')
        .eq('id', weddingId)
        .maybeSingle();

      if (error || !wedding) {
        setIsLocked(false);
        setChecking(false);
        return;
      }

      const requiresPayment =
        wedding.booking_source !== 'venue_partner' &&
        wedding.payment_required !== false;

      setIsLocked(requiresPayment && !wedding.deposit_paid);
    } catch {
      // Default to unlocked on network errors to avoid locking users out during outages
      setIsLocked(false);
    } finally {
      setChecking(false);
    }
  };

  return { isLocked, checking };
}
