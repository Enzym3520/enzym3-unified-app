import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useClientEvent } from "@/hooks/useClientEvent";
import { toast } from "sonner";
import { calculatePricing, isVenuePartner, VENUE_PARTNER_OVERTIME_RATE, INDEPENDENT_OVERTIME_RATE } from "@/lib/venueUtils";
import type { PricingType } from "@/lib/venueUtils";
import type { PaymentType } from "@/components/ContractPricingCard";

export interface WeddingDetails {
  id: string;
  couple_name: string;
  event_date: string;
  event_type: string | null;
  venue: string | null;
  contact_email: string;
  hours_booked: number | null;
  hourly_rate: number | null;
  contract_signed: boolean | null;
  contract_signed_at: string | null;
  deposit_paid: boolean | null;
  deposit_paid_at: string | null;
  deposit_amount: number | null;
  balance_paid: boolean | null;
  balance_paid_at: string | null;
  balance_due: number | null;
  booking_source: string | null;
  payment_required: boolean | null;
  contract_signature_data: string | null;
  client_signature_name: string | null;
  client_signature_date: string | null;
  guest_count: number | null;
  dj_meal_included: boolean | null;
  overtime_rate: number | null;
  pricing_type: string | null;
  total_price: number | null;
  primary_contact_name: string | null;
}

const CONTRACT_SELECT = 'id, couple_name, event_date, event_type, venue, contact_email, hours_booked, hourly_rate, contract_signed, contract_signed_at, deposit_paid, deposit_paid_at, deposit_amount, balance_paid, balance_paid_at, balance_due, booking_source, payment_required, contract_signature_data, client_signature_name, client_signature_date, guest_count, dj_meal_included, overtime_rate, pricing_type, total_price, primary_contact_name';

export function useContract() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { event: wedding, setEvent: setWedding, loading, refetch, user } = useClientEvent<WeddingDetails>(CONTRACT_SELECT);

  const [hours, setHours] = useState(0);
  const [hourlyRate, setHourlyRate] = useState(0);
  const [guestCount, setGuestCount] = useState<number>(0);
  const [djMealIncluded, setDjMealIncluded] = useState(false);
  const [signatureName, setSignatureName] = useState("");
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paymentType, setPaymentType] = useState<PaymentType>("deposit");
  const [quickMsgOpen, setQuickMsgOpen] = useState(false);
  const [quickMsgContext, setQuickMsgContext] = useState("");
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentCancelled, setPaymentCancelled] = useState(false);
  const paymentHandledRef = useRef(false);

  const paymentStatus = searchParams.get('payment');

  // Sync local state when wedding loads
  useEffect(() => {
    if (!wedding) return;
    setHours(wedding.hours_booked ?? 0);
    setHourlyRate(wedding.hourly_rate ?? 0);
    if (wedding.guest_count) setGuestCount(wedding.guest_count);
    if (wedding.dj_meal_included) setDjMealIncluded(wedding.dj_meal_included);
  }, [wedding]);

  // Handle payment redirect — runs once per session when Stripe returns
  useEffect(() => {
    if (paymentHandledRef.current) return;
    if (paymentStatus === 'success' && wedding?.id) {
      paymentHandledRef.current = true;
      setPaymentProcessing(true);
      setPaymentCancelled(false);
      toast.success("Payment received! Confirming with Stripe...");
      navigate('/app/contract', { replace: true });
    } else if (paymentStatus === 'cancelled') {
      paymentHandledRef.current = true;
      setPaymentCancelled(true);
      setPaymentProcessing(false);
      navigate('/app/contract', { replace: true });
    }
  }, [paymentStatus, wedding?.id, navigate]);

  // Derived values
  const isVenuePartnerBooking = wedding?.booking_source === 'venue_partner' || wedding?.payment_required === false;

  const effectiveOvertimeRate = wedding?.overtime_rate
    ?? (wedding?.booking_source === 'venue_partner'
      ? VENUE_PARTNER_OVERTIME_RATE
      : isVenuePartner(wedding?.venue)
        ? VENUE_PARTNER_OVERTIME_RATE
        : INDEPENDENT_OVERTIME_RATE);

  const pricingType: PricingType = (wedding?.pricing_type as PricingType) || 'hourly';
  const pricing = calculatePricing(hours, hourlyRate, pricingType, wedding?.total_price);

  const handleSignContract = async () => {
    if (!wedding || !signatureData || !signatureName || !agreedToTerms) {
      toast.error("Please complete all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const { data: signResult, error } = await supabase.functions.invoke('sign-contract', {
        body: {
          eventId: wedding.id,
          signatureData,
          signatureName,
          guestCount: guestCount || null,
          djMealIncluded,
        },
      });
      if (error) throw error;
      if (signResult?.error) throw new Error(signResult.error);

      setWedding({
        ...wedding,
        contract_signed: true,
        contract_signed_at: new Date().toISOString(),
        contract_signature_data: signatureData,
        client_signature_name: signatureName,
        client_signature_date: new Date().toISOString(),
        guest_count: guestCount || null,
        dj_meal_included: djMealIncluded,
      });

      toast.success("Contract signed successfully!");
      await handlePayDeposit();
    } catch (error: any) {
      console.error('Error signing contract:', error);
      toast.error("Failed to sign contract. Please try again.");
      setSubmitting(false);
    }
  };

  const handlePayDeposit = async () => {
    if (!wedding) return;
    try {
      // If the deposit is already paid, this button is paying the remaining balance.
      const effectivePaymentType: PaymentType =
        wedding.deposit_paid && !wedding.balance_paid ? 'balance' : paymentType;

      const amountLabel =
        effectivePaymentType === 'full' ? `$${pricing.total}`
        : effectivePaymentType === 'balance' ? `$${pricing.balance}`
        : `$${pricing.deposit}`;
      toast.info(`Opening Stripe Checkout for ${amountLabel}…`);

      const { data, error } = await supabase.functions.invoke('create-deposit-payment', {
        body: { wedding_id: wedding.id, payment_type: effectivePaymentType },
      });
      if (error) throw error;
      if (!data?.url) throw new Error("No payment URL received");

      // Mobile / touch devices: popups opened after an async await get blocked
      // on iOS Safari and mobile Chrome. Same-tab navigation always works.
      const isMobile =
        typeof window !== 'undefined' &&
        (window.matchMedia('(max-width: 768px)').matches || navigator.maxTouchPoints > 0);

      if (isMobile) {
        window.location.href = data.url;
        return;
      }

      const stripeWindow = window.open(data.url, '_blank', 'noopener,noreferrer');
      if (!stripeWindow) {
        toast.info(
          <span>
            Popup blocked.{" "}
            <a href={data.url} target="_blank" rel="noopener noreferrer" className="underline font-semibold">
              Click here to open Stripe Checkout
            </a>
          </span>,
          { duration: 30000 }
        );
      } else {
        toast.success("Stripe Checkout opened in a new tab.");
      }
      setSubmitting(false);
    } catch (error: any) {
      console.error('Error creating payment:', error);
      toast.error("Failed to create payment. Please try again.");
      setSubmitting(false);
    }
  };

  const handlePaymentVerified = useCallback(async () => {
    await refetch();
    setPaymentProcessing(false);
  }, [refetch]);

  return {
    wedding,
    loading,
    navigate,
    // Form state
    hours, hourlyRate,
    guestCount, setGuestCount,
    djMealIncluded, setDjMealIncluded,
    signatureName, setSignatureName,
    signatureData, setSignatureData,
    agreedToTerms, setAgreedToTerms,
    submitting,
    paymentType, setPaymentType,
    quickMsgOpen, setQuickMsgOpen,
    quickMsgContext, setQuickMsgContext,
    // Payment session state
    paymentProcessing,
    paymentCancelled,
    setPaymentCancelled,
    // Derived
    isVenuePartnerBooking,
    effectiveOvertimeRate,
    pricingType,
    pricing,
    // Actions
    handleSignContract,
    handlePayDeposit,
    refetch,
    handlePaymentVerified,
  };
}
