import logoTan from "@/assets/logo-tan.png";
import { parseLocalDate } from "@/lib/formatters";
import type { PricingType } from "@/lib/venueUtils";
import { calculatePricing } from "@/lib/venueUtils";

interface ContractPDFTemplateProps {
  coupleName: string;
  eventDate: string;
  venue: string;
  hours: number;
  hourlyRate: number;
  guestCount?: number;
  djMealIncluded?: boolean;
  overtimeRate?: number;
  signatureName: string;
  signatureData: string;
  signedAt: string;
  pricingType?: PricingType;
  totalPrice?: number | null;
}

const badgeStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: '20px', height: '20px', borderRadius: '50%',
  backgroundColor: 'rgba(107,163,190,0.15)', color: '#6ba3be',
  fontSize: '10px', fontWeight: 'bold',
};

const sectionHeadingStyle: React.CSSProperties = {
  fontSize: '14px', fontWeight: 'bold', marginBottom: '8px',
  display: 'flex', alignItems: 'center', gap: '8px',
};

const bodyStyle: React.CSSProperties = { marginLeft: '28px', color: '#6b7280' };

export default function ContractPDFTemplate({
  coupleName, eventDate, venue, hours, hourlyRate,
  guestCount, overtimeRate = 150, signatureName, signatureData, signedAt,
  pricingType = 'hourly', totalPrice,
}: ContractPDFTemplateProps) {
  const pricing = calculatePricing(hours, hourlyRate, pricingType, totalPrice);
  const isFlatRate = pricingType === 'flat_rate';

  const formattedDate = parseLocalDate(eventDate).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const formattedSignedDate = new Date(signedAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div id="contract-pdf-template" style={{
      position: 'absolute', left: '-9999px', width: '210mm', minHeight: '297mm',
      padding: '20mm', backgroundColor: 'white', fontFamily: 'Arial, sans-serif',
      fontSize: '12px', lineHeight: '1.5', color: '#1f2937',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#6ba3be', padding: '20px 24px', borderRadius: '8px 8px 0 0' }}>
          <img src={logoTan} alt="Enzym3 Entertainment" style={{ height: '44px', marginBottom: '10px', filter: 'brightness(0) invert(1)' }} />
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffffff', margin: '0 0 4px 0', letterSpacing: '1px' }}>ENZYM3 ENTERTAINMENT</h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', margin: '0', fontSize: '13px' }}>Tucson, Arizona</p>
        </div>
        <p style={{ fontSize: '10px', color: '#9ca3af', margin: '12px 0 0 0' }}>(520) 406-8600 • Booking@enzym3entertainment.vip</p>
        <div style={{ height: '2px', backgroundColor: 'rgba(107,163,190,0.3)', marginTop: '12px' }} />
      </div>

      {/* 1. PARTIES */}
      <div style={{ marginBottom: '16px' }}>
        <h2 style={sectionHeadingStyle}><span style={badgeStyle}>1</span>PARTIES</h2>
        <div style={bodyStyle}>
          <p style={{ margin: '0 0 4px 0' }}>This Agreement is entered into between <strong>Enzym3 Entertainment</strong> ("DJ" or "Company") and <strong>{coupleName}</strong> ("Client" or "Purchaser") for professional DJ services.</p>
          <p style={{ margin: 0 }}>This Agreement becomes binding upon receipt of the required deposit.</p>
        </div>
      </div>

      {/* 2. EVENT DETAILS */}
      <div style={{ marginBottom: '16px' }}>
        <h2 style={sectionHeadingStyle}><span style={badgeStyle}>2</span>EVENT DETAILS</h2>
        <div style={{ marginLeft: '28px', backgroundColor: '#f9fafb', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'grid', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '8px' }}><span style={{ color: '#6b7280', fontSize: '10px' }}>Date:</span><span style={{ fontWeight: 500 }}>{formattedDate}</span></div>
            <div style={{ display: 'flex', gap: '8px' }}><span style={{ color: '#6b7280', fontSize: '10px' }}>Venue:</span><span style={{ fontWeight: 500 }}>{venue || 'To be confirmed'}</span></div>
            {!isFlatRate && (
              <div style={{ display: 'flex', gap: '8px' }}><span style={{ color: '#6b7280', fontSize: '10px' }}>Duration:</span><span style={{ fontWeight: 500 }}>{hours} hours</span></div>
            )}
            {guestCount && <div style={{ display: 'flex', gap: '8px' }}><span style={{ color: '#6b7280', fontSize: '10px' }}>Guest Count:</span><span style={{ fontWeight: 500 }}>{guestCount} guests</span></div>}
          </div>
          <p style={{ fontSize: '10px', color: '#6b7280', margin: '8px 0 0 0', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>Any enhancements or upgrades selected through the Enzym3 client portal are incorporated into this Agreement by reference.</p>
        </div>
      </div>

      {/* 3. COMPENSATION & PAYMENT TERMS */}
      <div style={{ marginBottom: '16px' }}>
        <h2 style={sectionHeadingStyle}><span style={badgeStyle}>3</span>COMPENSATION & PAYMENT TERMS</h2>
        <div style={{ marginLeft: '28px', backgroundColor: 'rgba(107,163,190,0.08)', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #6ba3be' }}>
          {isFlatRate ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span style={{ color: '#6b7280' }}>Flat Rate Service Fee</span><span style={{ fontWeight: 500 }}>${pricing.total}</span></div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span style={{ color: '#6b7280' }}>Rate</span><span style={{ fontWeight: 500 }}>${hourlyRate}/hour × {hours} hours</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span style={{ color: '#6b7280' }}>Total Service Fee</span><span style={{ fontWeight: 500 }}>${pricing.total}</span></div>
            </>
          )}
          <div style={{ borderTop: '1px solid rgba(107,163,190,0.3)', paddingTop: '8px', marginTop: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6ba3be', fontWeight: 600 }}><span>Deposit (50%)</span><span>${pricing.deposit}</span></div>
            <p style={{ fontSize: '10px', color: '#6b7280', margin: '4px 0 0 0' }}>Non-refundable deposit required to reserve the event date</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}><span style={{ color: '#6b7280' }}>Remaining Balance</span><span style={{ fontWeight: 500 }}>${pricing.balance}</span></div>
          <p style={{ fontSize: '10px', color: '#6b7280', margin: '4px 0 0 0' }}>Balance due no later than 7 days prior to the event. If unpaid, full balance is due upon arrival prior to setup.</p>
          <p style={{ fontSize: '10px', color: '#6b7280', margin: '4px 0 0 0', fontWeight: 500, paddingTop: '4px', borderTop: '1px solid rgba(107,163,190,0.2)' }}>Failure to remit payment before performance begins constitutes cancellation by Client.</p>
        </div>
      </div>

      {/* 4. NON-REFUNDABLE DEPOSIT */}
      <div style={{ marginBottom: '16px' }}>
        <h2 style={sectionHeadingStyle}><span style={badgeStyle}>4</span>NON-REFUNDABLE DEPOSIT</h2>
        <p style={{ ...bodyStyle, margin: '0 0 0 28px' }}>The deposit secures the event date and compensates DJ for declining other engagements. Deposit is non-refundable unless Company cancels.</p>
      </div>

      {/* 5. CANCELLATION POLICY */}
      <div style={{ marginBottom: '16px' }}>
        <h2 style={sectionHeadingStyle}><span style={badgeStyle}>5</span>CANCELLATION POLICY</h2>
        <div style={bodyStyle}>
          <p style={{ margin: '0 0 4px 0', fontWeight: 600, fontSize: '11px' }}>Client Cancellation:</p>
          <ul style={{ paddingLeft: '16px', margin: '0 0 8px 0' }}>
            <li><strong style={{ color: '#1f2937' }}>30+ days prior:</strong> Deposit retained, no further balance due</li>
            <li><strong style={{ color: '#1f2937' }}>14–29 days prior:</strong> 75% of total contract due</li>
            <li><strong style={{ color: '#1f2937' }}>Within 14 days:</strong> 100% of total contract due</li>
          </ul>
          <p style={{ margin: '0 0 8px 0', fontSize: '10px' }}>Rescheduling is subject to availability and possible rate adjustments.</p>
          <p style={{ margin: '0 0 4px 0', fontWeight: 600, fontSize: '11px' }}>DJ Cancellation:</p>
          <p style={{ margin: 0 }}>If Company must cancel due to emergency, illness, or force majeure, all payments received will be refunded.</p>
        </div>
      </div>

      {/* 6. OVERTIME */}
      <div style={{ marginBottom: '16px' }}>
        <h2 style={sectionHeadingStyle}><span style={badgeStyle}>6</span>OVERTIME</h2>
        <div style={bodyStyle}>
          <p style={{ margin: '0 0 4px 0' }}>Overtime is billed at <strong style={{ color: '#1f2937' }}>${overtimeRate} per hour</strong>, in full-hour increments.</p>
          <p style={{ margin: 0 }}>Overtime must be approved by Client and venue and paid before extension begins.</p>
        </div>
      </div>

      {/* 7. CHARGEBACK PROTECTION */}
      <div style={{ marginBottom: '16px' }}>
        <h2 style={sectionHeadingStyle}><span style={badgeStyle}>7</span>CHARGEBACK PROTECTION</h2>
        <div style={bodyStyle}>
          <p style={{ margin: '0 0 4px 0' }}>Client agrees not to initiate chargebacks or payment disputes for authorized payments.</p>
          <p style={{ margin: '0 0 4px 0' }}>In the event of a chargeback attempt, Client remains responsible for:</p>
          <ul style={{ paddingLeft: '16px', margin: '0 0 8px 0' }}>
            <li>Full contract amount</li>
            <li>Processing fees</li>
            <li>Collection costs</li>
            <li>Attorney fees</li>
          </ul>
          <p style={{ margin: 0, fontSize: '10px' }}>This Agreement and digital payment authorization serve as proof of authorized transaction.</p>
        </div>
      </div>

      {/* 8. VENUE, POWER & SETUP REQUIREMENTS */}
      <div style={{ marginBottom: '16px' }}>
        <h2 style={sectionHeadingStyle}><span style={badgeStyle}>8</span>VENUE, POWER & SETUP REQUIREMENTS</h2>
        <div style={bodyStyle}>
          <p style={{ margin: '0 0 4px 0', fontWeight: 600, fontSize: '11px' }}>Client agrees to provide:</p>
          <ul style={{ paddingLeft: '16px', margin: '0 0 8px 0' }}>
            <li>One 6-foot banquet table (unless otherwise arranged)</li>
            <li>Safe, grounded power outlet within 15 feet of DJ setup area</li>
            <li>Minimum 1–2 hours of access prior to event</li>
            <li>Safe working environment</li>
          </ul>
          <p style={{ margin: '0 0 4px 0', fontWeight: 600, fontSize: '11px' }}>Company is not responsible for interruptions caused by:</p>
          <ul style={{ paddingLeft: '16px', margin: 0 }}>
            <li>Power failure</li>
            <li>Venue sound restrictions</li>
            <li>Generator malfunction</li>
            <li>Venue-enforced curfews</li>
          </ul>
        </div>
      </div>

      {/* 9. EQUIPMENT OWNERSHIP & PROTECTION */}
      <div style={{ marginBottom: '16px' }}>
        <h2 style={sectionHeadingStyle}><span style={badgeStyle}>9</span>EQUIPMENT OWNERSHIP & PROTECTION</h2>
        <div style={bodyStyle}>
          <p style={{ margin: '0 0 4px 0' }}>All sound, lighting, and production equipment used for the event remains the sole property of Enzym3 Entertainment.</p>
          <p style={{ margin: '0 0 4px 0' }}>Client assumes responsibility for any damage to equipment caused by guests, venue staff, or unsafe conditions.</p>
          <p style={{ margin: 0 }}>Company reserves the right to suspend performance if equipment is tampered with or guest behavior becomes unsafe. No refunds will be issued in such cases.</p>
        </div>
      </div>

      {/* 10. MUSIC & PROFESSIONAL DISCRETION */}
      <div style={{ marginBottom: '16px' }}>
        <h2 style={sectionHeadingStyle}><span style={badgeStyle}>10</span>MUSIC & PROFESSIONAL DISCRETION</h2>
        <div style={bodyStyle}>
          <p style={{ margin: '0 0 4px 0' }}>Client may submit music preferences via the Enzym3 Vibe Planner.</p>
          <p style={{ margin: '0 0 4px 0' }}>Company will make reasonable efforts to accommodate requests while maintaining professional discretion regarding music selection, flow, and appropriateness.</p>
          <p style={{ margin: 0 }}><strong style={{ color: '#1f2937' }}>Final musical direction remains at Company's discretion.</strong></p>
        </div>
      </div>

      {/* 11. WEATHER & SPECIAL EFFECTS */}
      <div style={{ marginBottom: '16px' }}>
        <h2 style={sectionHeadingStyle}><span style={badgeStyle}>11</span>WEATHER & SPECIAL EFFECTS</h2>
        <div style={bodyStyle}>
          <p style={{ margin: '0 0 4px 0' }}>Outdoor performances and special effects are subject to:</p>
          <ul style={{ paddingLeft: '16px', margin: '0 0 8px 0' }}>
            <li>Weather conditions</li>
            <li>Venue approval</li>
            <li>Fire code compliance</li>
            <li>Safety judgment</li>
          </ul>
          <p style={{ margin: 0 }}>Special effects may be withheld if conditions are unsafe. Base DJ services remain non-refundable.</p>
        </div>
      </div>

      {/* 12. MEDIA RELEASE */}
      <div style={{ marginBottom: '16px' }}>
        <h2 style={sectionHeadingStyle}><span style={badgeStyle}>12</span>MEDIA RELEASE</h2>
        <p style={{ ...bodyStyle, margin: '0 0 0 28px' }}>Client grants Company permission to capture photo and video content for promotional purposes unless declined in writing prior to event.</p>
      </div>

      {/* 13. INSURANCE & RESPONSIBILITY DISCLAIMER */}
      <div style={{ marginBottom: '16px' }}>
        <h2 style={sectionHeadingStyle}><span style={badgeStyle}>13</span>INSURANCE & RESPONSIBILITY DISCLAIMER</h2>
        <div style={bodyStyle}>
          <p style={{ margin: '0 0 4px 0' }}>Enzym3 Entertainment maintains general liability coverage as required by law.</p>
          <p style={{ margin: '0 0 4px 0' }}>However, Company is not responsible for:</p>
          <ul style={{ paddingLeft: '16px', margin: '0 0 8px 0' }}>
            <li>Guest injuries</li>
            <li>Alcohol-related incidents</li>
            <li>Venue negligence</li>
            <li>Security failures</li>
            <li>Property damage caused by guests</li>
          </ul>
          <p style={{ margin: 0 }}>Client is responsible for ensuring venue compliance, security, and appropriate event insurance where required.</p>
        </div>
      </div>

      {/* 14. LIMITATION OF LIABILITY */}
      <div style={{ marginBottom: '16px' }}>
        <h2 style={sectionHeadingStyle}><span style={badgeStyle}>14</span>LIMITATION OF LIABILITY</h2>
        <div style={bodyStyle}>
          <p style={{ margin: '0 0 4px 0' }}>The total liability of Enzym3 Entertainment, including its owners, employees, DJs, contractors, assistants, and affiliates, shall not exceed the total amount paid under this Agreement.</p>
          <p style={{ margin: 0 }}>Company shall not be liable for indirect, incidental, consequential, emotional, or punitive damages.</p>
        </div>
      </div>

      {/* 15. FORCE MAJEURE */}
      <div style={{ marginBottom: '16px' }}>
        <h2 style={sectionHeadingStyle}><span style={badgeStyle}>15</span>FORCE MAJEURE</h2>
        <div style={bodyStyle}>
          <p style={{ margin: '0 0 4px 0' }}>Neither party shall be liable for failure to perform due to causes beyond reasonable control including natural disasters, government mandates, severe weather, or venue closure.</p>
          <p style={{ margin: 0 }}>If performance becomes legally impossible, payments may be applied toward a rescheduled date within 12 months.</p>
        </div>
      </div>

      {/* 16. GOVERNING LAW */}
      <div style={{ marginBottom: '16px' }}>
        <h2 style={sectionHeadingStyle}><span style={badgeStyle}>16</span>GOVERNING LAW</h2>
        <p style={{ ...bodyStyle, margin: '0 0 0 28px' }}>This Agreement shall be governed by the laws of the State of Arizona. Venue for disputes shall be Pima County, Arizona.</p>
      </div>

      {/* 17. ENTIRE AGREEMENT */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={sectionHeadingStyle}><span style={badgeStyle}>17</span>ENTIRE AGREEMENT</h2>
        <p style={{ ...bodyStyle, margin: '0 0 0 28px' }}>This Agreement constitutes the entire understanding between the parties.</p>
      </div>

      {/* Signature Section */}
      <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '2px solid #e5e7eb' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', textAlign: 'center' }}>SIGNATURES</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '40px' }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: '#374151' }}>CLIENT</p>
            <div style={{ borderBottom: '2px solid #1f2937', paddingBottom: '4px', marginBottom: '8px', minHeight: '60px' }}>
              {signatureData && <img src={signatureData} alt="Client Signature" style={{ maxHeight: '56px', maxWidth: '100%' }} />}
            </div>
            <p style={{ fontSize: '12px', margin: '0 0 4px 0' }}><strong>{signatureName}</strong></p>
            <p style={{ fontSize: '10px', color: '#6b7280', margin: 0 }}>Date: {formattedSignedDate}</p>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: '#374151' }}>ENZYM3 ENTERTAINMENT</p>
            <div style={{ borderBottom: '2px solid #1f2937', paddingBottom: '4px', marginBottom: '8px', minHeight: '60px', display: 'flex', alignItems: 'flex-end' }}>
              <span style={{ fontFamily: 'cursive', fontSize: '24px', color: '#6ba3be' }}>Enzym3 Entertainment</span>
            </div>
            <p style={{ fontSize: '12px', margin: '0 0 4px 0' }}><strong>Authorized Representative</strong></p>
            <p style={{ fontSize: '10px', color: '#6b7280', margin: 0 }}>Date: {formattedSignedDate}</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: '32px', paddingTop: '16px', borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
        <p style={{ fontSize: '10px', color: '#9ca3af', margin: 0 }}>Enzym3 Entertainment • Booking@enzym3entertainment.vip • (520) 406-8600 • Tucson, AZ</p>
      </div>
    </div>
  );
}
