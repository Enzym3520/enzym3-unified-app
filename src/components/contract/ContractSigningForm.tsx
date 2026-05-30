import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getPortalDisplayName, getClientLabel } from "@/lib/eventUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Loader2, FileSignature, CreditCard, AlertCircle, Heart, Calendar, MapPin, Mail, Users } from "lucide-react";
import SignaturePad from "@/components/SignaturePad";
import ContractPricingCard from "@/components/ContractPricingCard";
import ContractViewer from "@/components/ContractViewer";
import { parseLocalDate } from "@/lib/formatters";
import QuickMessageDialog from "@/components/QuickMessageDialog";
import { formatCurrency, calculatePricing } from "@/lib/venueUtils";
import type { PricingType } from "@/lib/venueUtils";
import type { WeddingDetails } from "@/hooks/useContract";
import { ProgressSteps } from "./ProgressSteps";

interface ContractSigningFormProps {
  wedding: WeddingDetails;
  hours: number;
  hourlyRate: number;
  guestCount: number;
  setGuestCount: (v: number) => void;
  djMealIncluded: boolean;
  setDjMealIncluded: (v: boolean) => void;
  signatureName: string;
  setSignatureName: (v: string) => void;
  setSignatureData: (v: string | null) => void;
  agreedToTerms: boolean;
  setAgreedToTerms: (v: boolean) => void;
  submitting: boolean;
  effectiveOvertimeRate: number;
  pricingType: PricingType;
  quickMsgOpen: boolean;
  setQuickMsgOpen: (v: boolean) => void;
  quickMsgContext: string;
  setQuickMsgContext: (v: string) => void;
  onSign: () => void;
  signatureData: string | null;
}

export function ContractSigningForm({
  wedding, hours, hourlyRate, guestCount, setGuestCount, djMealIncluded, setDjMealIncluded,
  signatureName, setSignatureName, setSignatureData, agreedToTerms, setAgreedToTerms,
  submitting, effectiveOvertimeRate, pricingType, quickMsgOpen, setQuickMsgOpen,
  quickMsgContext, setQuickMsgContext, onSign, signatureData,
}: ContractSigningFormProps) {
  const pricing = calculatePricing(hours, hourlyRate, pricingType, wedding?.total_price);
  const isMissingPricing = pricingType === 'flat_rate'
    ? (wedding.total_price ?? 0) <= 0
    : hours === 0 || hourlyRate === 0;

  return (
    <>
      <div className="container max-w-5xl py-8 space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
            <FileSignature className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Sign Your Contract</h1>
          <p className="text-muted-foreground">
            Review the terms, sign below, and pay your 50% deposit to confirm your booking
          </p>
          <ProgressSteps currentStep={1} />
        </div>

        {/* Event Summary */}
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
                  <p className="font-medium">
                    {parseLocalDate(wedding.event_date).toLocaleDateString('en-US', {
                      weekday: 'short', month: 'long', day: 'numeric', year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Venue</p>
                  <p className="font-medium">{wedding.venue || 'To be confirmed'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Contact</p>
                  <p className="font-medium">{wedding.contact_email}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <ContractPricingCard
          hours={hours}
          hourlyRate={hourlyRate}
          pricingType={pricingType}
          totalPrice={wedding.total_price}
        />
        {isMissingPricing ? (
          <div className="flex items-center gap-2 bg-destructive/10 text-destructive rounded-lg p-3 -mt-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p className="text-sm">Your pricing hasn't been configured yet. Please <button type="button" onClick={() => { setQuickMsgContext("My pricing hasn't been configured yet"); setQuickMsgOpen(true); }} className="underline font-medium">message us</button> so we can get this set up.</p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center -mt-2">
            If something looks wrong, please <button type="button" onClick={() => { setQuickMsgContext("I have a question about my contract pricing"); setQuickMsgOpen(true); }} className="underline text-primary">message us</button> to request a change.
          </p>
        )}

        {/* Guest Count & DJ Meal */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Event Details
            </CardTitle>
            <CardDescription>
              Let us know your expected guest count and meal arrangements.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <Label htmlFor="guestCount">Expected Guest Count</Label>
              <Input
                id="guestCount"
                type="number"
                min={0}
                max={1000}
                value={guestCount || ''}
                onChange={(e) => setGuestCount(Number(e.target.value))}
                placeholder="e.g. 150"
                className="mt-1 max-w-[200px]"
              />
            </div>
            <div className="flex items-start space-x-3 bg-muted/50 rounded-lg p-4">
              <Switch id="djMeal" checked={djMealIncluded} onCheckedChange={setDjMealIncluded} />
              <div>
                <Label htmlFor="djMeal" className="cursor-pointer">DJ Meal Included</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  If dinner is being served, we kindly ask that a meal be provided for the DJ as well.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contract Terms */}
        <ContractViewer
          coupleName={wedding.couple_name}
          eventDate={wedding.event_date}
          venue={wedding.venue || ''}
          hours={hours}
          hourlyRate={hourlyRate}
          guestCount={guestCount || undefined}
          djMealIncluded={djMealIncluded}
          overtimeRate={effectiveOvertimeRate}
          pricingType={pricingType}
          totalPrice={wedding.total_price}
        />

        {/* Signature Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileSignature className="h-5 w-5 text-primary" />
              Sign Below
            </CardTitle>
            <CardDescription>
              Please type your full legal name and sign in the box below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="signatureName">Full Legal Name *</Label>
              <Input
                id="signatureName"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                placeholder="Enter your full legal name"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Signature *</Label>
              <div className="mt-1">
                <SignaturePad onSignatureChange={setSignatureData} />
              </div>
            </div>
            <div className="flex items-start space-x-3 bg-muted/50 rounded-lg p-4">
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                className="mt-0.5"
              />
              <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
                I have read and agree to the terms and conditions outlined in this agreement.
                I understand that my signature is legally binding and that the 50% deposit is
                non-refundable if cancelled within 60 days of the event.
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Button
          onClick={onSign}
          size="lg"
          className="w-full h-14 text-lg"
          disabled={submitting || !signatureName || !signatureData || !agreedToTerms}
        >
          {submitting ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="h-5 w-5 mr-2" />
              Sign Contract & Pay Deposit - {formatCurrency(pricing.deposit)}
            </>
          )}
        </Button>
      </div>

      <QuickMessageDialog
        open={quickMsgOpen}
        onOpenChange={setQuickMsgOpen}
        contextLabel={quickMsgContext}
      />
    </>
  );
}
