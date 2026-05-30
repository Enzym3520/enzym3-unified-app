import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, calculatePricing, type PricingType } from "@/lib/venueUtils";
import { Calculator, CheckCircle2, CreditCard, Banknote } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export type PaymentType = "full" | "deposit" | "balance";

interface ContractPricingCardProps {
  hours: number;
  hourlyRate: number;
  editable?: boolean;
  paymentType?: PaymentType;
  onPaymentTypeChange?: (type: PaymentType) => void;
  pricingType?: PricingType;
  totalPrice?: number | null;
}

export default function ContractPricingCard({
  hours,
  hourlyRate,
  paymentType = "full",
  onPaymentTypeChange,
  pricingType = "hourly",
  totalPrice,
}: ContractPricingCardProps) {
  const pricing = calculatePricing(hours, hourlyRate, pricingType, totalPrice);
  const isFlatRate = pricingType === "flat_rate";
  const isValidHours = hours >= 1 && hours <= 12;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          Pricing Breakdown
          {(isFlatRate ? pricing.total > 0 : isValidHours) && (
            <CheckCircle2 className="h-4 w-4 text-green-600 ml-auto" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isFlatRate ? (
          <div>
            <span className="text-sm text-muted-foreground">Flat Rate Service Fee</span>
            <p className="text-lg font-semibold mt-1">{formatCurrency(pricing.total)}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">Hours of Service</span>
              <p className="text-lg font-semibold mt-1">{hours}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Hourly Rate</span>
              <p className="text-lg font-semibold mt-1">{formatCurrency(hourlyRate)}</p>
            </div>
          </div>
        )}

        <div className="border-t pt-4 space-y-3">
          {!isFlatRate && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{hours} hours × {formatCurrency(hourlyRate)}/hr</span>
              <span>{formatCurrency(pricing.total)}</span>
            </div>
          )}
          
          <div className="flex justify-between font-medium text-lg border-t pt-3">
            <span>Total</span>
            <span>{formatCurrency(pricing.total)}</span>
          </div>

          {/* Payment type selector */}
          {onPaymentTypeChange && (
            <div className="pt-2">
              <p className="text-sm font-medium text-muted-foreground mb-3">Payment Option</p>
              <RadioGroup
                value={paymentType}
                onValueChange={(val) => onPaymentTypeChange(val as PaymentType)}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                <Label
                  htmlFor="pay-full"
                  className={`flex items-center gap-3 rounded-xl border-2 p-4 cursor-pointer transition-all ${
                    paymentType === "full"
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <RadioGroupItem value="full" id="pay-full" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Banknote className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-sm">Pay in Full</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">No balance due</p>
                  </div>
                  <span className="font-bold text-primary">{formatCurrency(pricing.total)}</span>
                </Label>

                <Label
                  htmlFor="pay-deposit"
                  className={`flex items-center gap-3 rounded-xl border-2 p-4 cursor-pointer transition-all ${
                    paymentType === "deposit"
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <RadioGroupItem value="deposit" id="pay-deposit" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-sm">50% Deposit</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Balance due on event day</p>
                  </div>
                  <span className="font-bold text-primary">{formatCurrency(pricing.deposit)}</span>
                </Label>
              </RadioGroup>
            </div>
          )}

          {/* Payment summary */}
          {paymentType === "full" ? (
            <div className="bg-primary/10 rounded-xl p-5 space-y-3 ring-2 ring-primary/20">
              <div className="flex justify-between items-center">
                <span className="text-primary font-semibold">Amount Due Today</span>
                <span className="text-2xl font-bold text-primary">{formatCurrency(pricing.total)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground pt-2 border-t border-primary/10">
                <span>Balance Due on Event Day</span>
                <span className="font-medium text-green-600">$0.00</span>
              </div>
            </div>
          ) : (
            <div className="bg-primary/10 rounded-xl p-5 space-y-3 ring-2 ring-primary/20">
              <div className="flex justify-between items-center">
                <span className="text-primary font-semibold">50% Deposit Due Today</span>
                <span className="text-2xl font-bold text-primary">{formatCurrency(pricing.deposit)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground pt-2 border-t border-primary/10">
                <span>Balance Due on Event Day</span>
                <span className="font-medium">{formatCurrency(pricing.balance)}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
