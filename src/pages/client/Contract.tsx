import { Loader2, AlertCircle, Building2, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useContract } from "@/hooks/useContract";
import { ContractCompleted } from "@/components/contract/ContractCompleted";
import { SignedNotPaid } from "@/components/contract/SignedNotPaid";
import { ContractSigningForm } from "@/components/contract/ContractSigningForm";
import { handleContractPrint, handleContractDownloadPDF } from "@/lib/contractPdf";
import { parseLocalDate } from "@/lib/formatters";

export default function Contract() {
  const c = useContract();

  // Debug: log resolved event to confirm correct record is loaded
  if (c.wedding) {
    console.log('[Contract] Resolved event:', c.wedding.id, 'date:', c.wedding.event_date);
  }

  if (c.loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!c.wedding) {
    return (
      <div className="container max-w-5xl py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Wedding Found</h2>
            <p className="text-muted-foreground text-center">
              We couldn't find a wedding associated with your account.
            </p>
            <Button onClick={() => c.navigate('/app/dashboard')} className="mt-4">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Venue partner — no contract needed
  if (c.isVenuePartnerBooking) {
    return (
      <div className="container max-w-5xl py-8">
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-green-50/30">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-emerald-800">Contract Handled by Venue Partner</h2>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Your event at <strong className="text-foreground">{c.wedding.venue}</strong> is through our venue partner program.
              Your contract and payment are handled directly through the venue.
            </p>
            <div className="bg-card rounded-lg p-4 border mb-6">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="font-medium">
                  {parseLocalDate(c.wedding.event_date).toLocaleDateString('en-US', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </span>
              </div>
            </div>
            <Button onClick={() => c.navigate('/app/dashboard')}>Go to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Signed and fully paid (deposit + balance)
  if (c.wedding.contract_signed && c.wedding.deposit_paid && c.wedding.balance_paid) {
    return (
      <ContractCompleted
        wedding={c.wedding}
        effectiveOvertimeRate={c.effectiveOvertimeRate}
        onNavigateDashboard={() => c.navigate('/app/dashboard')}
        onPrint={() => handleContractPrint(c.wedding!)}
        onDownloadPDF={() => handleContractDownloadPDF(c.wedding!, c.effectiveOvertimeRate)}
      />
    );
  }

  // Signed but payment incomplete — deposit or remaining balance
  if (c.wedding.contract_signed && (!c.wedding.deposit_paid || !c.wedding.balance_paid)) {
    return (
      <SignedNotPaid
        wedding={c.wedding}
        submitting={c.submitting}
        onPayDeposit={c.handlePayDeposit}
        onVerified={c.handlePaymentVerified}
        paymentType={c.paymentType}
        onPaymentTypeChange={c.setPaymentType}
        paymentProcessing={c.paymentProcessing}
        paymentCancelled={c.paymentCancelled}
        onDismissCancelled={() => c.setPaymentCancelled(false)}
      />
    );
  }

  // Main signing flow
  return (
    <ContractSigningForm
      wedding={c.wedding}
      hours={c.hours}
      hourlyRate={c.hourlyRate}
      guestCount={c.guestCount}
      setGuestCount={c.setGuestCount}
      djMealIncluded={c.djMealIncluded}
      setDjMealIncluded={c.setDjMealIncluded}
      signatureName={c.signatureName}
      setSignatureName={c.setSignatureName}
      setSignatureData={c.setSignatureData}
      agreedToTerms={c.agreedToTerms}
      setAgreedToTerms={c.setAgreedToTerms}
      submitting={c.submitting}
      effectiveOvertimeRate={c.effectiveOvertimeRate}
      pricingType={c.pricingType}
      quickMsgOpen={c.quickMsgOpen}
      setQuickMsgOpen={c.setQuickMsgOpen}
      quickMsgContext={c.quickMsgContext}
      setQuickMsgContext={c.setQuickMsgContext}
      onSign={c.handleSignContract}
      signatureData={c.signatureData}
    />
  );
}
