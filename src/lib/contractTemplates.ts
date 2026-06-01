import type { WeddingDetails } from "@/hooks/useContract";
import { calculatePricing } from "@/lib/venueUtils";
import type { PricingType } from "@/lib/venueUtils";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatEventDate(dateStr: string): string {
  // Parse as local date to avoid UTC offset shifting
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatHoursRange(eventDate: string, hoursBooked: number | null): string {
  if (!hoursBooked) return "TBD";
  // Show placeholder start/end since we don't store start time
  return `${hoursBooked} hours`;
}

/**
 * Generates a wedding contract HTML body (no <html>/<body> tags).
 * Intended for weddings — uses couple name, venue, package price, deposit terms.
 */
export function generateWeddingContract(event: WeddingDetails): string {
  const pricingType = (event.pricing_type as PricingType) || "hourly";
  const pricing = calculatePricing(
    event.hours_booked ?? 0,
    event.hourly_rate ?? 0,
    pricingType,
    event.total_price,
  );

  const overtimeRate = event.overtime_rate ?? 150;
  const formattedDate = formatEventDate(event.event_date);
  const coupleName = event.couple_name || "Client";
  const venue = event.venue || "To be confirmed";
  const isFlatRate = pricingType === "flat_rate";

  return `
<div style="font-family: Arial, sans-serif; font-size: 13px; line-height: 1.6; color: #1f2937; max-width: 800px; margin: 0 auto;">

  <!-- Header -->
  <div style="text-align: center; margin-bottom: 28px;">
    <div style="background-color: #6ba3be; padding: 20px 24px; border-radius: 8px 8px 0 0;">
      <h1 style="font-size: 22px; font-weight: bold; color: #ffffff; margin: 0 0 4px 0; letter-spacing: 1px;">
        ENZYM3 ENTERTAINMENT
      </h1>
      <p style="color: rgba(255,255,255,0.85); margin: 0; font-size: 13px;">DJ Services Agreement — Wedding</p>
    </div>
    <p style="font-size: 11px; color: #9ca3af; margin: 10px 0 0 0;">
      (520) 406-8600 &bull; booking@enzym3.com
    </p>
    <div style="height: 2px; background-color: rgba(107,163,190,0.3); margin-top: 10px;"></div>
  </div>

  <!-- 1. PARTIES -->
  <section style="margin-bottom: 18px;">
    <h2 style="font-size: 14px; font-weight: bold; margin-bottom: 8px; color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px;">
      1. PARTIES
    </h2>
    <p style="margin: 0;">
      This Agreement is entered into between <strong>Enzym3 Entertainment</strong> ("DJ" / "Company")
      and <strong>${coupleName}</strong> ("Client") for professional DJ services.
      This Agreement becomes binding upon receipt of the required deposit.
    </p>
  </section>

  <!-- 2. EVENT DETAILS -->
  <section style="margin-bottom: 18px;">
    <h2 style="font-size: 14px; font-weight: bold; margin-bottom: 8px; color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px;">
      2. EVENT DETAILS
    </h2>
    <table style="width: 100%; border-collapse: collapse; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
      <tbody>
        <tr>
          <td style="padding: 8px 12px; width: 160px; color: #6b7280; font-size: 12px;">Event Type</td>
          <td style="padding: 8px 12px; font-weight: 500;">Wedding</td>
        </tr>
        <tr style="background-color: #ffffff;">
          <td style="padding: 8px 12px; color: #6b7280; font-size: 12px;">Event Date</td>
          <td style="padding: 8px 12px; font-weight: 500;">${formattedDate}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; color: #6b7280; font-size: 12px;">Venue</td>
          <td style="padding: 8px 12px; font-weight: 500;">${venue}</td>
        </tr>
        ${
          !isFlatRate
            ? `<tr style="background-color: #ffffff;">
          <td style="padding: 8px 12px; color: #6b7280; font-size: 12px;">Duration</td>
          <td style="padding: 8px 12px; font-weight: 500;">${event.hours_booked ?? 0} hours</td>
        </tr>`
            : ""
        }
        ${
          event.guest_count
            ? `<tr>
          <td style="padding: 8px 12px; color: #6b7280; font-size: 12px;">Guest Count</td>
          <td style="padding: 8px 12px; font-weight: 500;">${event.guest_count}</td>
        </tr>`
            : ""
        }
      </tbody>
    </table>
  </section>

  <!-- 3. COMPENSATION & PAYMENT TERMS -->
  <section style="margin-bottom: 18px;">
    <h2 style="font-size: 14px; font-weight: bold; margin-bottom: 8px; color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px;">
      3. COMPENSATION &amp; PAYMENT TERMS
    </h2>
    <div style="background-color: rgba(107,163,190,0.08); padding: 14px; border-radius: 8px; border-left: 4px solid #6ba3be;">
      ${
        isFlatRate
          ? `<div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #6b7280;">Flat Rate Service Fee</span>
              <span style="font-weight: 600;">${formatCurrency(pricing.total)}</span>
            </div>`
          : `<div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="color: #6b7280;">Rate</span>
              <span style="font-weight: 500;">${formatCurrency(event.hourly_rate ?? 0)}/hour &times; ${event.hours_booked ?? 0} hours</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #6b7280;">Total Service Fee</span>
              <span style="font-weight: 600;">${formatCurrency(pricing.total)}</span>
            </div>`
      }
      <div style="border-top: 1px solid rgba(107,163,190,0.3); padding-top: 8px; margin-top: 8px;">
        <div style="display: flex; justify-content: space-between; color: #6ba3be; font-weight: 700;">
          <span>Deposit (50% — due to reserve date)</span>
          <span>${formatCurrency(pricing.deposit)}</span>
        </div>
        <p style="font-size: 11px; color: #6b7280; margin: 4px 0 0 0;">
          Non-refundable. Secures your event date.
        </p>
      </div>
      <div style="display: flex; justify-content: space-between; margin-top: 8px;">
        <span style="color: #6b7280;">Remaining Balance</span>
        <span style="font-weight: 600;">${formatCurrency(pricing.balance)}</span>
      </div>
      <p style="font-size: 11px; color: #6b7280; margin: 4px 0 0 0;">
        Balance due no later than 7 days prior to the event. Failure to remit payment before
        performance begins constitutes cancellation by Client.
      </p>
    </div>
  </section>

  <!-- 4. CANCELLATION POLICY -->
  <section style="margin-bottom: 18px;">
    <h2 style="font-size: 14px; font-weight: bold; margin-bottom: 8px; color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px;">
      4. CANCELLATION POLICY
    </h2>
    <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
      <li style="margin-bottom: 4px;"><strong>30+ days prior:</strong> Deposit retained, no further balance due.</li>
      <li style="margin-bottom: 4px;"><strong>14–29 days prior:</strong> 75% of total contract due.</li>
      <li style="margin-bottom: 4px;"><strong style="color: #dc2626;">Within 14 days:</strong> 100% of total contract due.</li>
    </ul>
  </section>

  <!-- 5. OVERTIME -->
  <section style="margin-bottom: 18px;">
    <h2 style="font-size: 14px; font-weight: bold; margin-bottom: 8px; color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px;">
      5. OVERTIME
    </h2>
    <p style="margin: 0;">
      Overtime is billed at <strong>${formatCurrency(overtimeRate)} per hour</strong>, in full-hour increments.
      Must be approved by Client and venue before extension begins.
    </p>
  </section>

  <!-- 6. ADDITIONAL TERMS -->
  <section style="margin-bottom: 24px;">
    <h2 style="font-size: 14px; font-weight: bold; margin-bottom: 8px; color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px;">
      6. ADDITIONAL TERMS
    </h2>
    <p style="margin: 0 0 6px 0;">
      The client assumes full responsibility for any damage to DJ equipment during the event.
      Enzym3 Entertainment reserves the right to refuse to play certain songs or music types if they
      are deemed inappropriate. The DJ will make every effort to honor all song requests.
      The client agrees that Enzym3 Entertainment is not responsible for any technical difficulties
      beyond our control.
    </p>
    <p style="margin: 0;">
      This Agreement constitutes the entire understanding between the parties and shall be governed
      by the laws of the State of Arizona.
    </p>
  </section>

  <!-- SIGNATURES -->
  <div style="margin-top: 32px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
    <h2 style="font-size: 15px; font-weight: bold; margin-bottom: 20px; text-align: center; color: #1f2937;">
      SIGNATURES
    </h2>
    <table style="width: 100%; border-collapse: collapse;">
      <tbody>
        <tr>
          <td style="width: 48%; vertical-align: top; padding-right: 16px;">
            <p style="font-size: 12px; font-weight: 600; margin-bottom: 6px; color: #374151;">CLIENT</p>
            <div style="border-bottom: 2px solid #1f2937; min-height: 56px; margin-bottom: 8px;"></div>
            <p style="font-size: 12px; margin: 0 0 4px 0;"><strong>${coupleName}</strong></p>
            <p style="font-size: 11px; color: #6b7280; margin: 0;">Date: ____________________</p>
          </td>
          <td style="width: 4%;"></td>
          <td style="width: 48%; vertical-align: top; padding-left: 16px;">
            <p style="font-size: 12px; font-weight: 600; margin-bottom: 6px; color: #374151;">ENZYM3 ENTERTAINMENT (DJ)</p>
            <div style="border-bottom: 2px solid #1f2937; min-height: 56px; margin-bottom: 8px; display: flex; align-items: flex-end;">
              <span style="font-family: cursive; font-size: 22px; color: #6ba3be; padding-bottom: 4px;">Jairus Madison</span>
            </div>
            <p style="font-size: 12px; margin: 0 0 4px 0;"><strong>Jairus Madison</strong></p>
            <p style="font-size: 11px; color: #6b7280; margin: 0;">Date: ____________________</p>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Footer -->
  <div style="margin-top: 28px; padding-top: 14px; border-top: 1px solid #e5e7eb; text-align: center;">
    <p style="font-size: 11px; color: #9ca3af; margin: 0;">
      Enzym3 Entertainment &bull; (520) 406-8600 &bull; booking@enzym3.com
    </p>
  </div>

</div>
`.trim();
}

/**
 * Generates a DJ agreement HTML body (no <html>/<body> tags) for non-wedding events.
 * Matches the layout of the physical Enzym3 DJ Agreement form.
 */
export function generateDJAgreement(event: WeddingDetails): string {
  const pricingType = (event.pricing_type as PricingType) || "hourly";
  const pricing = calculatePricing(
    event.hours_booked ?? 0,
    event.hourly_rate ?? 0,
    pricingType,
    event.total_price,
  );

  const overtimeRate = event.overtime_rate ?? 100;
  const formattedDate = formatEventDate(event.event_date);
  const purchaserName =
    event.primary_contact_name || event.couple_name || "Client";
  const occasion = event.event_type || "Special Event";
  const hoursDisplay = formatHoursRange(event.event_date, event.hours_booked);
  const djMeal = event.dj_meal_included ? "Yes" : "No";
  const balanceDue =
    event.balance_due != null
      ? formatCurrency(event.balance_due)
      : formatCurrency(pricing.balance);

  return `
<div style="font-family: Arial, sans-serif; font-size: 13px; line-height: 1.6; color: #1f2937; max-width: 800px; margin: 0 auto;">

  <!-- Header -->
  <div style="text-align: center; margin-bottom: 24px;">
    <div style="background-color: #6ba3be; padding: 18px 24px; border-radius: 8px 8px 0 0;">
      <h1 style="font-size: 22px; font-weight: bold; color: #ffffff; margin: 0 0 4px 0; letter-spacing: 1px;">
        ENZYM3 ENTERTAINMENT
      </h1>
      <p style="color: rgba(255,255,255,0.85); margin: 0; font-size: 13px;">DJ Services Agreement</p>
    </div>
    <p style="font-size: 11px; color: #9ca3af; margin: 10px 0 0 0;">
      (520) 406-8600 &bull; booking@enzym3.com
    </p>
    <div style="height: 2px; background-color: rgba(107,163,190,0.3); margin-top: 10px;"></div>
  </div>

  <!-- PURCHASER INFORMATION -->
  <section style="margin-bottom: 20px;">
    <h2 style="font-size: 14px; font-weight: bold; margin-bottom: 10px; color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px;">
      PURCHASER INFORMATION
    </h2>
    <table style="width: 100%; border-collapse: collapse;">
      <tbody>
        <tr>
          <td style="padding: 6px 0; width: 160px; color: #6b7280; font-size: 12px; vertical-align: top;">Name</td>
          <td style="padding: 6px 0; font-weight: 500; border-bottom: 1px solid #d1d5db;">${purchaserName}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #6b7280; font-size: 12px; vertical-align: top;">Phone</td>
          <td style="padding: 6px 0; border-bottom: 1px solid #d1d5db;">____________________________</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #6b7280; font-size: 12px; vertical-align: top;">Email</td>
          <td style="padding: 6px 0; font-weight: 500; border-bottom: 1px solid #d1d5db;">${event.contact_email || "____________________________"}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #6b7280; font-size: 12px; vertical-align: top;">Mailing Address</td>
          <td style="padding: 6px 0; border-bottom: 1px solid #d1d5db;">____________________________</td>
        </tr>
      </tbody>
    </table>
  </section>

  <!-- EVENT DETAILS -->
  <section style="margin-bottom: 20px;">
    <h2 style="font-size: 14px; font-weight: bold; margin-bottom: 10px; color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px;">
      EVENT DETAILS
    </h2>
    <table style="width: 100%; border-collapse: collapse;">
      <tbody>
        <tr>
          <td style="padding: 6px 0; width: 160px; color: #6b7280; font-size: 12px;">Date</td>
          <td style="padding: 6px 0; font-weight: 500; border-bottom: 1px solid #d1d5db;">${formattedDate}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #6b7280; font-size: 12px;">Hours</td>
          <td style="padding: 6px 0; font-weight: 500; border-bottom: 1px solid #d1d5db;">From: __________ To: __________ (${hoursDisplay} booked)</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #6b7280; font-size: 12px;">Occasion</td>
          <td style="padding: 6px 0; font-weight: 500; border-bottom: 1px solid #d1d5db;">${occasion}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #6b7280; font-size: 12px;">Number of Guests</td>
          <td style="padding: 6px 0; font-weight: 500; border-bottom: 1px solid #d1d5db;">${event.guest_count ?? "____________________"}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #6b7280; font-size: 12px;">Average Age of Guests</td>
          <td style="padding: 6px 0; border-bottom: 1px solid #d1d5db;">____________________________</td>
        </tr>
      </tbody>
    </table>
  </section>

  <!-- LOCATION INFORMATION -->
  <section style="margin-bottom: 20px;">
    <h2 style="font-size: 14px; font-weight: bold; margin-bottom: 10px; color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px;">
      LOCATION INFORMATION
    </h2>
    <table style="width: 100%; border-collapse: collapse;">
      <tbody>
        <tr>
          <td style="padding: 6px 0; width: 160px; color: #6b7280; font-size: 12px;">Location Name</td>
          <td style="padding: 6px 0; font-weight: 500; border-bottom: 1px solid #d1d5db;">${event.venue || "____________________________"}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #6b7280; font-size: 12px;">Address</td>
          <td style="padding: 6px 0; border-bottom: 1px solid #d1d5db;">____________________________</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #6b7280; font-size: 12px;">City</td>
          <td style="padding: 6px 0; border-bottom: 1px solid #d1d5db;">____________________</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #6b7280; font-size: 12px;">State</td>
          <td style="padding: 6px 0; border-bottom: 1px solid #d1d5db;">____________________</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #6b7280; font-size: 12px;">Zip</td>
          <td style="padding: 6px 0; border-bottom: 1px solid #d1d5db;">____________________</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #6b7280; font-size: 12px;">Location Phone</td>
          <td style="padding: 6px 0; border-bottom: 1px solid #d1d5db;">____________________________</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #6b7280; font-size: 12px;">DJ Meal Included</td>
          <td style="padding: 6px 0; font-weight: 500; border-bottom: 1px solid #d1d5db;">${djMeal}</td>
        </tr>
      </tbody>
    </table>
  </section>

  <!-- OVERTIME -->
  <section style="margin-bottom: 20px;">
    <h2 style="font-size: 14px; font-weight: bold; margin-bottom: 8px; color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px;">
      OVERTIME
    </h2>
    <p style="margin: 0;">
      Overtime charge is <strong>${formatCurrency(overtimeRate)} per hour</strong>, billed in full-hour increments.
      Must be approved before extension begins.
    </p>
  </section>

  <!-- CONDITIONS -->
  <section style="margin-bottom: 20px;">
    <h2 style="font-size: 14px; font-weight: bold; margin-bottom: 8px; color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px;">
      CONDITIONS
    </h2>
    <p style="margin: 0; color: #4b5563;">
      The client assumes full responsibility for any damage to the DJ equipment during the event.
      Enzym3 Entertainment reserves the right to refuse to play certain songs or music types if they
      are deemed inappropriate. The DJ will make every effort to honor all song requests. The client
      agrees that Enzym3 Entertainment is not responsible for any technical difficulties beyond our
      control.
    </p>
  </section>

  <!-- PAYMENT -->
  <section style="margin-bottom: 20px;">
    <h2 style="font-size: 14px; font-weight: bold; margin-bottom: 8px; color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px;">
      PAYMENT
    </h2>
    <div style="background-color: rgba(107,163,190,0.08); padding: 14px; border-radius: 8px; border-left: 4px solid #6ba3be; margin-bottom: 12px;">
      <p style="margin: 0 0 8px 0;">
        A non-refundable deposit is required to secure your date.
        <strong style="color: red;">Cancellations within 14 days of the event will forfeit the full contract price.</strong>
        The remaining balance is due on the day of the event.
      </p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <tbody>
          ${
            !((pricingType as string) === "flat_rate")
              ? `<tr>
              <td style="padding: 5px 0; color: #6b7280; font-size: 12px; width: 200px;">Rate</td>
              <td style="padding: 5px 0; font-weight: 500;">${formatCurrency(event.hourly_rate ?? 0)}/hr &times; ${event.hours_booked ?? 0} hrs</td>
            </tr>`
              : ""
          }
          <tr>
            <td style="padding: 5px 0; color: #6b7280; font-size: 12px; width: 200px;">Total Contract Price</td>
            <td style="padding: 5px 0; font-weight: 600;">${formatCurrency(pricing.total)}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #6b7280; font-size: 12px;">Deposit Paid (50%)</td>
            <td style="padding: 5px 0; font-weight: 500; color: #6ba3be;">${formatCurrency(pricing.deposit)}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #6b7280; font-size: 12px; font-weight: 700;">Balance Due</td>
            <td style="padding: 5px 0; font-weight: 700; font-size: 14px; color: #1f2937;">${balanceDue}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <!-- SIGNATURES -->
  <div style="margin-top: 32px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
    <h2 style="font-size: 15px; font-weight: bold; margin-bottom: 20px; text-align: center; color: #1f2937;">
      SIGNATURES
    </h2>
    <table style="width: 100%; border-collapse: collapse;">
      <tbody>
        <tr>
          <td style="width: 48%; vertical-align: top; padding-right: 16px;">
            <p style="font-size: 12px; font-weight: 600; margin-bottom: 6px; color: #374151;">PURCHASER / CLIENT</p>
            <div style="border-bottom: 2px solid #1f2937; min-height: 56px; margin-bottom: 8px;"></div>
            <p style="font-size: 12px; margin: 0 0 4px 0;"><strong>${purchaserName}</strong></p>
            <p style="font-size: 11px; color: #6b7280; margin: 0;">Date: ____________________</p>
          </td>
          <td style="width: 4%;"></td>
          <td style="width: 48%; vertical-align: top; padding-left: 16px;">
            <p style="font-size: 12px; font-weight: 600; margin-bottom: 6px; color: #374151;">DJ / ENZYM3 ENTERTAINMENT</p>
            <div style="border-bottom: 2px solid #1f2937; min-height: 56px; margin-bottom: 8px; display: flex; align-items: flex-end;">
              <span style="font-family: cursive; font-size: 22px; color: #6ba3be; padding-bottom: 4px;">Jairus Madison</span>
            </div>
            <p style="font-size: 12px; margin: 0 0 4px 0;"><strong>Jairus Madison</strong></p>
            <p style="font-size: 11px; color: #6b7280; margin: 0;">Date: ____________________</p>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Footer -->
  <div style="margin-top: 28px; padding-top: 14px; border-top: 1px solid #e5e7eb; text-align: center;">
    <p style="font-size: 11px; color: #9ca3af; margin: 0;">
      Enzym3 Entertainment &bull; (520) 406-8600 &bull; booking@enzym3.com
    </p>
  </div>

</div>
`.trim();
}
