import { Card, CardContent } from "@/components/ui/card";
import { getPortalDisplayName } from "@/lib/eventUtils";
import { Button } from "@/components/ui/button";
import { Check, Heart, Calendar, PartyPopper, FileText, Printer, Download } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ContractViewer from "@/components/ContractViewer";
import ContractPDFTemplate from "@/components/ContractPDFTemplate";
import { formatCurrency, calculatePricing } from "@/lib/venueUtils";
import { parseLocalDate } from "@/lib/formatters";
import type { PricingType } from "@/lib/venueUtils";
import type { WeddingDetails } from "@/hooks/useContract";

interface ContractCompletedProps {
  wedding: WeddingDetails;
  effectiveOvertimeRate: number;
  onNavigateDashboard: () => void;
  onPrint: () => void;
  onDownloadPDF: () => void;
}

export function ContractCompleted({ wedding, effectiveOvertimeRate, onNavigateDashboard, onPrint, onDownloadPDF }: ContractCompletedProps) {
  const pricingTypeVal = (wedding.pricing_type as PricingType) || 'hourly';
  const pricing = calculatePricing(wedding.hours_booked ?? 0, wedding.hourly_rate ?? 0, pricingTypeVal, wedding.total_price);

  return (
    <div className="container max-w-5xl py-8">
      {wedding.contract_signature_data && wedding.client_signature_name && wedding.contract_signed_at && (
        <ContractPDFTemplate
          coupleName={wedding.couple_name}
          eventDate={wedding.event_date}
          venue={wedding.venue || ''}
          hours={wedding.hours_booked ?? 0}
          hourlyRate={wedding.hourly_rate ?? 0}
          guestCount={wedding.guest_count || undefined}
          djMealIncluded={wedding.dj_meal_included || false}
          overtimeRate={effectiveOvertimeRate}
          pricingType={pricingTypeVal}
          totalPrice={wedding.total_price}
          signatureName={wedding.client_signature_name}
          signatureData={wedding.contract_signature_data}
          signedAt={wedding.contract_signed_at}
        />
      )}

      <Card className="border-green-200 bg-gradient-to-br from-green-50/80 to-emerald-50/50 overflow-hidden">
        <CardContent className="flex flex-col items-center justify-center py-12 relative">
          <div className="absolute top-4 left-4 opacity-20">
            <PartyPopper className="h-12 w-12 text-green-600" />
          </div>
          <div className="absolute top-4 right-4 opacity-20 rotate-90">
            <PartyPopper className="h-12 w-12 text-green-600" />
          </div>

          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-green-800">You're All Set!</h2>
          <p className="text-muted-foreground text-center mb-6">
            Your contract is signed and deposit is paid. We can't wait to celebrate with you!
          </p>

          <div className="bg-card rounded-xl p-6 border shadow-sm mb-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <Heart className="h-5 w-5 text-primary" />
              <span className="font-semibold">{getPortalDisplayName(wedding.event_type, wedding.couple_name, wedding.primary_contact_name)}</span>
            </div>
            <div className="flex items-center gap-3 mb-4 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {parseLocalDate(wedding.event_date).toLocaleDateString('en-US', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                })}
              </span>
            </div>
            <div className="border-t pt-4 mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-medium">{formatCurrency(pricing.total)}</span>
              </div>
              <div className="flex justify-between text-sm text-green-600">
                <span>Deposit Paid</span>
                <span className="font-medium">{formatCurrency(pricing.deposit)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Balance Due (Event Day)</span>
                <span className="font-medium">{formatCurrency(pricing.balance)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  View Contract
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Signed Contract</DialogTitle>
                </DialogHeader>
                <ContractViewer
                  coupleName={wedding.couple_name}
                  eventDate={wedding.event_date}
                  venue={wedding.venue || ''}
                  hours={wedding.hours_booked ?? 0}
                  hourlyRate={wedding.hourly_rate ?? 0}
                  guestCount={wedding.guest_count || undefined}
                  djMealIncluded={wedding.dj_meal_included || false}
                  overtimeRate={effectiveOvertimeRate}
                  pricingType={pricingTypeVal}
                  totalPrice={wedding.total_price}
                />
                {wedding.contract_signature_data && (
                  <div className="border-t pt-4 mt-4">
                    <h3 className="font-semibold mb-3">Signed By</h3>
                    <div className="flex items-end gap-8">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Client Signature</p>
                        <div className="border-b-2 border-foreground pb-1 min-w-[200px]">
                          <img src={wedding.contract_signature_data} alt="Client Signature" className="max-h-12" />
                        </div>
                        <p className="text-sm font-medium mt-1">{wedding.client_signature_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Signed: {wedding.contract_signed_at && new Date(wedding.contract_signed_at).toLocaleDateString('en-US', {
                            year: 'numeric', month: 'long', day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            <Button variant="outline" size="sm" onClick={onPrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>

            <Button variant="outline" size="sm" onClick={onDownloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>

          <Button onClick={onNavigateDashboard} size="lg">
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
