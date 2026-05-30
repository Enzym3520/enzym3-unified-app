import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Calendar, MapPin, Clock, Users } from "lucide-react";
import logoTan from "@/assets/logo-tan.png";
import { parseLocalDate } from "@/lib/formatters";
import type { PricingType } from "@/lib/venueUtils";
import { calculatePricing } from "@/lib/venueUtils";

interface ContractViewerProps {
  coupleName: string;
  eventDate: string;
  venue: string;
  hours: number;
  hourlyRate: number;
  guestCount?: number;
  djMealIncluded?: boolean;
  overtimeRate?: number;
  pricingType?: PricingType;
  totalPrice?: number | null;
}

function SectionHeader({ num, title }: { num: string; title: string }) {
  return (
    <h3 className="font-semibold mb-2 flex items-center gap-2">
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">{num}</span>
      {title}
    </h3>
  );
}

export default function ContractViewer({
  coupleName,
  eventDate,
  venue,
  hours,
  hourlyRate,
  guestCount,
  overtimeRate = 150,
  pricingType = 'hourly',
  totalPrice,
}: ContractViewerProps) {
  const pricing = calculatePricing(hours, hourlyRate, pricingType, totalPrice);
  const isFlatRate = pricingType === 'flat_rate';

  const formattedDate = parseLocalDate(eventDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          DJ Services Agreement
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-6 text-sm">
            {/* Logo and Header */}
            <div className="text-center rounded-lg overflow-hidden mb-2">
              <div className="bg-[#6ba3be] py-5 px-6">
                <img 
                  src={logoTan} 
                  alt="Enzym3 Entertainment" 
                  className="h-14 mx-auto mb-3 brightness-0 invert"
                />
                <h2 className="text-xl font-bold text-white tracking-wide">ENZYM3 ENTERTAINMENT</h2>
                <p className="text-white/80 text-sm">Tucson, Arizona</p>
              </div>
              <p className="text-xs text-muted-foreground mt-3 pb-4">
                (520) 406-8600 • Booking@enzym3entertainment.vip
              </p>
              <div className="h-[2px] bg-[#6ba3be]/30" />
            </div>

            {/* 1. PARTIES */}
            <section>
              <SectionHeader num="1" title="PARTIES" />
              <div className="pl-8 space-y-2">
                <p>
                  This Agreement is entered into between <strong>Enzym3 Entertainment</strong> ("DJ" or "Company") 
                  and <strong>{coupleName}</strong> ("Client" or "Purchaser") for professional DJ services.
                </p>
                <p>This Agreement becomes binding upon receipt of the required deposit.</p>
              </div>
            </section>

            {/* 2. EVENT DETAILS */}
            <section>
              <SectionHeader num="2" title="EVENT DETAILS" />
              <div className="ml-8 bg-muted/50 p-4 rounded-lg border border-border/50">
                <div className="grid gap-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-primary" />
                    <div>
                      <span className="text-muted-foreground text-xs">Date</span>
                      <p className="font-medium">{formattedDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-primary" />
                    <div>
                      <span className="text-muted-foreground text-xs">Venue</span>
                      <p className="font-medium">{venue || 'To be confirmed'}</p>
                    </div>
                  </div>
                  {!isFlatRate && (
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-primary" />
                      <div>
                        <span className="text-muted-foreground text-xs">Duration</span>
                        <p className="font-medium">{hours} hours</p>
                      </div>
                    </div>
                  )}
                  {guestCount && (
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-primary" />
                      <div>
                        <span className="text-muted-foreground text-xs">Estimated Guest Count</span>
                        <p className="font-medium">{guestCount} guests</p>
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50">
                  Any enhancements or upgrades selected through the Enzym3 client portal are incorporated into this Agreement by reference.
                </p>
              </div>
            </section>

            {/* 3. COMPENSATION & PAYMENT TERMS */}
            <section>
              <SectionHeader num="3" title="COMPENSATION & PAYMENT TERMS" />
              <div className="ml-8 bg-primary/5 p-4 rounded-lg border-l-4 border-primary">
                <div className="space-y-2">
                  {isFlatRate ? (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Flat Rate Service Fee</span>
                      <span className="font-medium">${pricing.total}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Rate</span>
                        <span className="font-medium">${hourlyRate}/hour × {hours} hours</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Service Fee</span>
                        <span className="font-medium">${pricing.total}</span>
                      </div>
                    </>
                  )}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between text-primary font-semibold">
                      <span>Deposit (50%)</span>
                      <span>${pricing.deposit}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Non-refundable deposit required to reserve the event date</p>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Remaining Balance</span>
                    <span className="font-medium">${pricing.balance}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Balance due no later than 7 days prior to the event unless otherwise agreed in writing. If unpaid, full balance is due upon arrival prior to setup.</p>
                  <p className="text-xs text-muted-foreground font-medium pt-2 border-t">
                    Failure to remit payment before performance begins constitutes cancellation by Client.
                  </p>
                </div>
              </div>
            </section>

            {/* 4. NON-REFUNDABLE DEPOSIT */}
            <section>
              <SectionHeader num="4" title="NON-REFUNDABLE DEPOSIT" />
              <p className="pl-8 text-muted-foreground">
                The deposit secures the event date and compensates DJ for declining other engagements. Deposit is non-refundable unless Company cancels.
              </p>
            </section>

            {/* 5. CANCELLATION POLICY */}
            <section>
              <SectionHeader num="5" title="CANCELLATION POLICY" />
              <div className="pl-8 space-y-3">
                <p className="font-medium text-xs uppercase tracking-wide">Client Cancellation:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li><strong className="text-foreground">30+ days prior:</strong> Deposit retained, no further balance due</li>
                  <li><strong className="text-foreground">14–29 days prior:</strong> 75% of total contract due</li>
                  <li><strong className="text-foreground">Within 14 days:</strong> 100% of total contract due</li>
                </ul>
                <p className="text-muted-foreground text-xs">Rescheduling is subject to availability and possible rate adjustments.</p>
                <p className="font-medium text-xs uppercase tracking-wide pt-2">DJ Cancellation:</p>
                <p className="text-muted-foreground">
                  If Company must cancel due to emergency, illness, or force majeure, all payments received will be refunded.
                </p>
              </div>
            </section>

            {/* 6. OVERTIME */}
            <section>
              <SectionHeader num="6" title="OVERTIME" />
              <div className="pl-8 space-y-2 text-muted-foreground">
                <p>Overtime is billed at <strong className="text-foreground">${overtimeRate} per hour</strong>, in full-hour increments.</p>
                <p>Overtime must be approved by Client and venue and paid before extension begins.</p>
              </div>
            </section>

            {/* 7. CHARGEBACK PROTECTION */}
            <section>
              <SectionHeader num="7" title="CHARGEBACK PROTECTION" />
              <div className="pl-8 space-y-2 text-muted-foreground">
                <p>Client agrees not to initiate chargebacks or payment disputes for authorized payments.</p>
                <p>In the event of a chargeback attempt, Client remains responsible for:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Full contract amount</li>
                  <li>Processing fees</li>
                  <li>Collection costs</li>
                  <li>Attorney fees</li>
                </ul>
                <p className="text-xs">This Agreement and digital payment authorization serve as proof of authorized transaction.</p>
              </div>
            </section>

            {/* 8. VENUE, POWER & SETUP REQUIREMENTS */}
            <section>
              <SectionHeader num="8" title="VENUE, POWER & SETUP REQUIREMENTS" />
              <div className="pl-8 space-y-3">
                <p className="font-medium text-xs uppercase tracking-wide">Client agrees to provide:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>One 6-foot banquet table (unless otherwise arranged)</li>
                  <li>Safe, grounded power outlet within 15 feet of DJ setup area</li>
                  <li>Minimum 1–2 hours of access prior to event</li>
                  <li>Safe working environment</li>
                </ul>
                <p className="font-medium text-xs uppercase tracking-wide pt-2">Company is not responsible for interruptions caused by:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Power failure</li>
                  <li>Venue sound restrictions</li>
                  <li>Generator malfunction</li>
                  <li>Venue-enforced curfews</li>
                </ul>
              </div>
            </section>

            {/* 9. EQUIPMENT OWNERSHIP & PROTECTION */}
            <section>
              <SectionHeader num="9" title="EQUIPMENT OWNERSHIP & PROTECTION" />
              <div className="pl-8 space-y-2 text-muted-foreground">
                <p>All sound, lighting, and production equipment used for the event remains the sole property of Enzym3 Entertainment.</p>
                <p>Client assumes responsibility for any damage to equipment caused by guests, venue staff, or unsafe conditions.</p>
                <p>Company reserves the right to suspend performance if equipment is tampered with or guest behavior becomes unsafe. No refunds will be issued in such cases.</p>
              </div>
            </section>

            {/* 10. MUSIC & PROFESSIONAL DISCRETION */}
            <section>
              <SectionHeader num="10" title="MUSIC & PROFESSIONAL DISCRETION" />
              <div className="pl-8 space-y-2 text-muted-foreground">
                <p>Client may submit music preferences via the Enzym3 Vibe Planner.</p>
                <p>Company will make reasonable efforts to accommodate requests while maintaining professional discretion regarding music selection, flow, and appropriateness.</p>
                <p><strong className="text-foreground">Final musical direction remains at Company's discretion.</strong></p>
              </div>
            </section>

            {/* 11. WEATHER & SPECIAL EFFECTS */}
            <section>
              <SectionHeader num="11" title="WEATHER & SPECIAL EFFECTS" />
              <div className="pl-8 space-y-2 text-muted-foreground">
                <p>Outdoor performances and special effects are subject to:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Weather conditions</li>
                  <li>Venue approval</li>
                  <li>Fire code compliance</li>
                  <li>Safety judgment</li>
                </ul>
                <p>Special effects may be withheld if conditions are unsafe. Base DJ services remain non-refundable.</p>
              </div>
            </section>

            {/* 12. MEDIA RELEASE */}
            <section>
              <SectionHeader num="12" title="MEDIA RELEASE" />
              <p className="pl-8 text-muted-foreground">
                Client grants Company permission to capture photo and video content for promotional purposes unless declined in writing prior to event.
              </p>
            </section>

            {/* 13. INSURANCE & RESPONSIBILITY DISCLAIMER */}
            <section>
              <SectionHeader num="13" title="INSURANCE & RESPONSIBILITY DISCLAIMER" />
              <div className="pl-8 space-y-2 text-muted-foreground">
                <p>Enzym3 Entertainment maintains general liability coverage as required by law.</p>
                <p>However, Company is not responsible for:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Guest injuries</li>
                  <li>Alcohol-related incidents</li>
                  <li>Venue negligence</li>
                  <li>Security failures</li>
                  <li>Property damage caused by guests</li>
                </ul>
                <p>Client is responsible for ensuring venue compliance, security, and appropriate event insurance where required.</p>
              </div>
            </section>

            {/* 14. LIMITATION OF LIABILITY */}
            <section>
              <SectionHeader num="14" title="LIMITATION OF LIABILITY" />
              <div className="pl-8 space-y-2 text-muted-foreground">
                <p>The total liability of Enzym3 Entertainment, including its owners, employees, DJs, contractors, assistants, and affiliates, shall not exceed the total amount paid under this Agreement.</p>
                <p>Company shall not be liable for indirect, incidental, consequential, emotional, or punitive damages.</p>
              </div>
            </section>

            {/* 15. FORCE MAJEURE */}
            <section>
              <SectionHeader num="15" title="FORCE MAJEURE" />
              <div className="pl-8 space-y-2 text-muted-foreground">
                <p>Neither party shall be liable for failure to perform due to causes beyond reasonable control including natural disasters, government mandates, severe weather, or venue closure.</p>
                <p>If performance becomes legally impossible, payments may be applied toward a rescheduled date within 12 months.</p>
              </div>
            </section>

            {/* 16. GOVERNING LAW */}
            <section>
              <SectionHeader num="16" title="GOVERNING LAW" />
              <p className="pl-8 text-muted-foreground">
                This Agreement shall be governed by the laws of the State of Arizona. Venue for disputes shall be Pima County, Arizona.
              </p>
            </section>

            {/* 17. ENTIRE AGREEMENT */}
            <section>
              <SectionHeader num="17" title="ENTIRE AGREEMENT" />
              <p className="pl-8 text-muted-foreground">
                This Agreement constitutes the entire understanding between the parties.
              </p>
            </section>

            <div className="border-t pt-6 mt-8">
              <p className="text-xs text-muted-foreground text-center">
                Enzym3 Entertainment • Booking@enzym3entertainment.vip • (520) 406-8600 • Tucson, AZ
              </p>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
