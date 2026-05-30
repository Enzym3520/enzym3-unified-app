import { useState, useEffect, useRef, useCallback } from "react";
import { getPortalDisplayName, getClientLabel } from "@/lib/eventUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, FileSignature, CreditCard, AlertCircle, Heart, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ContractPricingCard from "@/components/ContractPricingCard";
import { formatCurrency, calculatePricing } from "@/lib/venueUtils";
import type { PricingType } from "@/lib/venueUtils";
import type { PaymentType } from "@/components/ContractPricingCard";
import { parseLocalDate } from "@/lib/formatters";
import type { WeddingDetails } from "@/hooks/useContract";
import { ProgressSteps } from "./ProgressSteps";

interface SignedNotPaidProps {
  wedding: WeddingDetails;
  submitting: boolean;
  onPayDeposit: () => void;
  onVerified: () => Promise<void>;
  paymentType: PaymentType;
  onPaymentTypeChange: (type: PaymentType) => void;
}

export function SignedNotPaid({ wedding, submitting, onPayDeposit, onVerified, paymentType, onPaymentTypeChange }: SignedNotPaidProps) {
  const [checking, setChecking] = useState(false);
  const autoCheckedRef = useRef(false);
  const weddingPricingType = (wedding.pricing_type as PricingType) || 'hourly';
  const pricing = calculatePricing(wedding.hours_booked ?? 0, wedding.hourly_rate ?? 0, weddingPricingType, wedding.total_price);

  // Mode: if deposit already paid, this screen is for collecting the remaining balance.
  const isBalanceMode = !!wedding.deposit_paid && !wedding.balance_paid;
  const depositPaidAmount = wedding.deposit_amount ?? pricing.deposit;
  const remainingBalance = Math.max(0, (wedding.total_price ?? pricing.total) - depositPaidAmount);

  const verifyPayment = useCallback(async (isAuto = false) => {
    setChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-deposit-payment', {
        body: { wedding_id: wedding.id },
      });
      if (error) throw error;
      if (data?.verified) {
        toast.success("Payment confirmed!");
        await onVerified();
        return;
      }
      if (!isAuto) {
        toast.info("No completed payment found yet. If you just paid, please wait a moment and try again.");
      }
    } catch (err) {
      console.error('Verify payment error:', err);
      if (!isAuto) toast.error("Could not verify payment. Please try again.");
    } finally {
      setChecking(false);
    }
  }, [wedding.id, onVerified]);

  useEffect(() => {
    if (autoCheckedRef.current) return;
    autoCheckedRef.current = true;
    verifyPayment(true);
  }, [verifyPayment]);

  const heading = isBalanceMode ? 'Pay Remaining Balance' : 'Complete Your Booking';
  const subheading = isBalanceMode
    ? 'Your deposit is paid. Pay the remaining balance below.'
    : 'Just one more step to confirm your reservation';
  const banner = isBalanceMode
    ? {
        title: 'Deposit Paid - Balance Remaining',
        body: `Your deposit of ${formatCurrency(depositPaidAmount)} has been received. The remaining balance is due before your event.`,
      }
    : {
        title: 'Contract Signed - Payment Required',
        body: `Your contract was signed on ${new Date(wedding.contract_signed_at!).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}. Complete your deposit payment to secure your date.`,
      };

  return (
    <div className="container max-w-5xl py-8 space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
          {isBalanceMode ? <CreditCard className="h-6 w-6 text-primary" /> : <FileSignature className="h-6 w-6 text-primary" />}
        </div>
        <h1 className="text-2xl font-bold">{heading}</h1>
        <p className="text-muted-foreground">{subheading}</p>
        {!isBalanceMode && <ProgressSteps currentStep={3} />}
      </div>
      {checking && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-4 flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Checking payment status with Stripe...</p>
          </CardContent>
        </Card>
      )}
      <Card className={isBalanceMode ? "border-emerald-200 bg-gradient-to-r from-emerald-50/80 to-green-50/40" : "border-amber-200 bg-gradient-to-r from-amber-50/80 to-orange-50/50"}>
        <CardContent className="py-5">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isBalanceMode ? 'bg-emerald-100' : 'bg-amber-100'}`}>
              <AlertCircle className={`h-5 w-5 ${isBalanceMode ? 'text-emerald-600' : 'text-amber-600'}`} />
            </div>
            <div>
              <h3 className={`font-semibold ${isBalanceMode ? 'text-emerald-800' : 'text-amber-800'}`}>{banner.title}</h3>
              <p className="text-sm text-muted-foreground">{banner.body}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Event Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Heart className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">{getClientLabel(wedding.event_type)}</p>
                <p className="font-medium">{getPortalDisplayName(wedding.event_type, wedding.couple_name, wedding.primary_contact_name)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="font-medium">{parseLocalDate(wedding.event_date).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {isBalanceMode ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Payment Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-medium">{formatCurrency(wedding.total_price ?? pricing.total)}</span>
            </div>
            <div className="flex justify-between text-sm text-emerald-700">
              <span>Deposit Paid</span>
              <span className="font-medium">−{formatCurrency(depositPaidAmount)}</span>
            </div>
            <div className="border-t pt-3 flex justify-between text-lg font-bold">
              <span>Remaining Balance Due</span>
              <span className="text-primary">{formatCurrency(remainingBalance)}</span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <ContractPricingCard hours={wedding.hours_booked ?? 0} hourlyRate={wedding.hourly_rate ?? 0} paymentType={paymentType} onPaymentTypeChange={onPaymentTypeChange} pricingType={weddingPricingType} totalPrice={wedding.total_price} />
      )}

      <Button onClick={onPayDeposit} size="lg" className="w-full h-14 text-lg" disabled={submitting || checking}>
        {submitting ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <CreditCard className="h-5 w-5 mr-2" />}
        {isBalanceMode
          ? `Pay Remaining Balance - ${formatCurrency(remainingBalance)}`
          : paymentType === 'full'
            ? `Pay in Full - ${formatCurrency(pricing.total)}`
            : `Pay Deposit - ${formatCurrency(pricing.deposit)}`}
      </Button>
      <div className="text-center">
        <Button variant="link" onClick={() => verifyPayment(false)} disabled={checking} className="text-sm">
          {checking ? (<><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Checking...</>) : "Already paid? Click here to verify"}
        </Button>
      </div>
    </div>
  );
}
