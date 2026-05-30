import jsPDF from "jspdf";
import { calculatePricing, formatCurrency } from "@/lib/venueUtils";
import type { PricingType } from "@/lib/venueUtils";
import type { WeddingDetails } from "@/hooks/useContract";
import { toast } from "sonner";

export function handleContractPrint(wedding: WeddingDetails) {
  const element = document.getElementById('contract-pdf-template');
  if (!element) {
    toast.error('Print content not found');
    return;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    toast.error('Please allow popups to print');
    return;
  }

  const escapeHtml = (str: string) => {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  };
  const title = `Contract - ${escapeHtml(wedding.couple_name)}`;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { margin: 0; padding: 20px; font-family: Arial, sans-serif; color: #1f2937; }
          @media print { body { padding: 0; } }
          h1, h2, h3 { color: #1f2937; }
          .section { margin-bottom: 20px; page-break-inside: avoid; }
        </style>
      </head>
      <body>
        ${element.innerHTML}
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
}

export function handleContractDownloadPDF(wedding: WeddingDetails, effectiveOvertimeRate: number) {
  try {
    toast.info('Generating PDF...');

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageW = 210;
    const pageH = 297;
    const margin = 18;
    const contentW = pageW - margin * 2;
    let y = margin;

    const BRAND_BLUE = [107, 163, 190] as [number, number, number];
    const SECTION_TITLE = [31, 71, 107] as [number, number, number];
    const BADGE_BG = [227, 239, 244] as [number, number, number];
    const LIGHT_BLUE = [239, 246, 255] as [number, number, number];
    const GRAY = [107, 114, 128] as [number, number, number];
    const DARK = [31, 41, 55] as [number, number, number];

    const drawContinuationHeader = () => {
      pdf.setFillColor(...BRAND_BLUE);
      pdf.rect(0, 0, pageW, 14, 'F');
      pdf.setFontSize(9);
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.text('ENZYM3 ENTERTAINMENT', pageW / 2, 9, { align: 'center' });
      y = 22;
    };

    const checkPageBreak = (needed: number) => {
      if (y + needed > pageH - margin) {
        pdf.addPage();
        drawContinuationHeader();
      }
    };

    const startSection = (needed: number) => {
      if (y + needed > pageH - margin) {
        pdf.addPage();
        drawContinuationHeader();
      }
    };

    const drawSectionHeader = (num: string, title: string) => {
      pdf.setFillColor(...BADGE_BG);
      pdf.circle(margin + 4, y + 3.5, 4, 'F');
      pdf.setFontSize(7);
      pdf.setTextColor(...BRAND_BLUE);
      pdf.setFont('helvetica', 'bold');
      pdf.text(num, margin + 4, y + 5.5, { align: 'center' });
      pdf.setFontSize(11);
      pdf.setTextColor(...SECTION_TITLE);
      pdf.setFont('helvetica', 'bold');
      pdf.text(title, margin + 10, y + 5.5);
      y += 10;
    };

    const drawBodyText = (text: string, indent = 10) => {
      pdf.setFontSize(9);
      pdf.setTextColor(...DARK);
      pdf.setFont('helvetica', 'normal');
      const lines = pdf.splitTextToSize(text, contentW - indent);
      lines.forEach((line: string) => {
        checkPageBreak(5.5);
        pdf.text(line, margin + indent, y);
        y += 5;
      });
      y += 2;
    };

    const drawBullet = (text: string) => {
      pdf.setFontSize(9);
      pdf.setTextColor(...GRAY);
      pdf.setFont('helvetica', 'normal');
      const lines = pdf.splitTextToSize(text, contentW - 14);
      lines.forEach((line: string, i: number) => {
        checkPageBreak(5.5);
        if (i === 0) pdf.text('•', margin + 10, y);
        pdf.text(line, margin + 14, y);
        y += 5;
      });
    };

    const weddingPT = (wedding.pricing_type as PricingType) || 'hourly';
    const isFlatRate = weddingPT === 'flat_rate';
    const pricing = calculatePricing(wedding.hours_booked ?? 0, wedding.hourly_rate ?? 0, weddingPT, wedding.total_price);
    const formattedDate = new Date(wedding.event_date + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    // HEADER BAR
    pdf.setFillColor(...BRAND_BLUE);
    pdf.rect(0, 0, pageW, 32, 'F');
    pdf.setFontSize(18);
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ENZYM3 ENTERTAINMENT', pageW / 2, 13, { align: 'center' });
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Professional DJ Services Agreement', pageW / 2, 20, { align: 'center' });
    pdf.setFontSize(8);
    pdf.setTextColor(200, 220, 255);
    pdf.text('(520) 406-8600  •  Booking@enzym3entertainment.vip', pageW / 2, 27, { align: 'center' });
    y = 40;

    // SECTION 1: PARTIES
    drawSectionHeader('1', 'PARTIES');
    drawBodyText(`This Agreement is entered into between Enzym3 Entertainment ("DJ" or "Company") and ${wedding.couple_name} ("Client" or "Purchaser") for professional DJ services.`);
    drawBodyText('This Agreement becomes binding upon receipt of the required deposit.');

    // SECTION 2: EVENT DETAILS
    drawSectionHeader('2', 'EVENT DETAILS');
    checkPageBreak(32);
    pdf.setFillColor(249, 250, 251);
    const detailBoxH = 28 + (wedding.guest_count ? 6 : 0);
    pdf.roundedRect(margin + 10, y - 2, contentW - 10, detailBoxH, 2, 2, 'F');
    pdf.setDrawColor(229, 231, 235);
    pdf.roundedRect(margin + 10, y - 2, contentW - 10, detailBoxH, 2, 2, 'S');

    const detailRow = (label: string, value: string) => {
      pdf.setFontSize(8);
      pdf.setTextColor(...GRAY);
      pdf.setFont('helvetica', 'normal');
      pdf.text(label, margin + 14, y + 4);
      pdf.setTextColor(...DARK);
      pdf.setFont('helvetica', 'bold');
      pdf.text(value, margin + 40, y + 4);
      y += 6;
    };

    detailRow('Date:', formattedDate);
    detailRow('Venue:', wedding.venue || 'To be confirmed');
    detailRow('Duration:', `${wedding.hours_booked ?? 0} hours`);
    if (wedding.guest_count) detailRow('Guest Count:', `${wedding.guest_count} guests`);
    y += 2;
    pdf.setFontSize(7);
    pdf.setTextColor(...GRAY);
    pdf.setFont('helvetica', 'italic');
    pdf.text('Any enhancements or upgrades selected through the Enzym3 client portal are incorporated into this Agreement by reference.', margin + 14, y + 2);
    y += 8;

    // SECTION 3: COMPENSATION
    drawSectionHeader('3', 'COMPENSATION & PAYMENT TERMS');
    checkPageBreak(48);
    pdf.setFillColor(...LIGHT_BLUE);
    pdf.roundedRect(margin + 10, y - 2, contentW - 10, 44, 2, 2, 'F');
    pdf.setDrawColor(...BRAND_BLUE);
    pdf.setLineWidth(0.8);
    pdf.line(margin + 10, y - 2, margin + 10, y + 42);
    pdf.setLineWidth(0.2);

    const priceRow = (label: string, value: string, bold = false, color?: [number, number, number]) => {
      pdf.setFontSize(9);
      pdf.setFont('helvetica', bold ? 'bold' : 'normal');
      pdf.setTextColor(...(color || DARK));
      pdf.text(label, margin + 14, y + 4);
      pdf.text(value, margin + contentW - 4, y + 4, { align: 'right' });
      y += 6;
    };

    if (isFlatRate) {
      priceRow('Flat Rate Service Fee', `$${pricing.total}`, true);
    } else {
      priceRow('Rate', `$${wedding.hourly_rate ?? 0}/hour × ${wedding.hours_booked ?? 0} hours`);
      priceRow('Total Service Fee', `$${pricing.total}`, true);
    }
    y += 2;
    pdf.setDrawColor(191, 219, 254);
    pdf.line(margin + 14, y - 1, margin + contentW - 4, y - 1);
    y += 2;
    priceRow('Deposit (50%)', `$${pricing.deposit}`, true, BRAND_BLUE);
    priceRow('Remaining Balance', `$${pricing.balance}`);
    y += 2;
    drawBodyText('Balance due no later than 7 days prior to the event. If unpaid, full balance is due upon arrival prior to setup.');
    drawBodyText('Failure to remit payment before performance begins constitutes cancellation by Client.');

    // SECTION 4-17
    startSection(20);
    drawSectionHeader('4', 'NON-REFUNDABLE DEPOSIT');
    drawBodyText('The deposit secures the event date and compensates DJ for declining other engagements. Deposit is non-refundable unless Company cancels.');

    startSection(55);
    drawSectionHeader('5', 'CANCELLATION POLICY');
    drawBodyText('Client Cancellation:');
    drawBullet('30+ days prior: Deposit retained, no further balance due');
    drawBullet('14–29 days prior: 75% of total contract due');
    drawBullet('Within 14 days: 100% of total contract due');
    y += 2;
    drawBodyText('Rescheduling is subject to availability and possible rate adjustments.');
    y += 2;
    drawBodyText('DJ Cancellation:');
    drawBodyText('If Company must cancel due to emergency, illness, or force majeure, all payments received will be refunded.');

    startSection(20);
    drawSectionHeader('6', 'OVERTIME');
    drawBodyText(`Overtime is billed at $${effectiveOvertimeRate} per hour, in full-hour increments.`);
    drawBodyText('Overtime must be approved by Client and venue and paid before extension begins.');

    startSection(45);
    drawSectionHeader('7', 'CHARGEBACK PROTECTION');
    drawBodyText('Client agrees not to initiate chargebacks or payment disputes for authorized payments.');
    drawBodyText('In the event of a chargeback attempt, Client remains responsible for:');
    drawBullet('Full contract amount');
    drawBullet('Processing fees');
    drawBullet('Collection costs');
    drawBullet('Attorney fees');
    y += 2;
    drawBodyText('This Agreement and digital payment authorization serve as proof of authorized transaction.');

    startSection(60);
    drawSectionHeader('8', 'VENUE, POWER & SETUP REQUIREMENTS');
    drawBodyText('Client agrees to provide:');
    drawBullet('One 6-foot banquet table (unless otherwise arranged)');
    drawBullet('Safe, grounded power outlet within 15 feet of DJ setup area');
    drawBullet('Minimum 1–2 hours of access prior to event');
    drawBullet('Safe working environment');
    y += 2;
    drawBodyText('Company is not responsible for interruptions caused by:');
    drawBullet('Power failure');
    drawBullet('Venue sound restrictions');
    drawBullet('Generator malfunction');
    drawBullet('Venue-enforced curfews');
    y += 2;

    startSection(30);
    drawSectionHeader('9', 'EQUIPMENT OWNERSHIP & PROTECTION');
    drawBodyText('All sound, lighting, and production equipment used for the event remains the sole property of Enzym3 Entertainment.');
    drawBodyText('Client assumes responsibility for any damage to equipment caused by guests, venue staff, or unsafe conditions.');
    drawBodyText('Company reserves the right to suspend performance if equipment is tampered with or guest behavior becomes unsafe. No refunds will be issued in such cases.');

    startSection(25);
    drawSectionHeader('10', 'MUSIC & PROFESSIONAL DISCRETION');
    drawBodyText('Client may submit music preferences via the Enzym3 Vibe Planner.');
    drawBodyText('Company will make reasonable efforts to accommodate requests while maintaining professional discretion regarding music selection, flow, and appropriateness.');
    drawBodyText('Final musical direction remains at Company\'s discretion.');

    startSection(35);
    drawSectionHeader('11', 'WEATHER & SPECIAL EFFECTS');
    drawBodyText('Outdoor performances and special effects are subject to:');
    drawBullet('Weather conditions');
    drawBullet('Venue approval');
    drawBullet('Fire code compliance');
    drawBullet('Safety judgment');
    y += 2;
    drawBodyText('Special effects may be withheld if conditions are unsafe. Base DJ services remain non-refundable.');

    startSection(20);
    drawSectionHeader('12', 'MEDIA RELEASE');
    drawBodyText('Client grants Company permission to capture photo and video content for promotional purposes unless declined in writing prior to event.');

    startSection(45);
    drawSectionHeader('13', 'INSURANCE & RESPONSIBILITY DISCLAIMER');
    drawBodyText('Enzym3 Entertainment maintains general liability coverage as required by law.');
    drawBodyText('However, Company is not responsible for:');
    drawBullet('Guest injuries');
    drawBullet('Alcohol-related incidents');
    drawBullet('Venue negligence');
    drawBullet('Security failures');
    drawBullet('Property damage caused by guests');
    y += 2;
    drawBodyText('Client is responsible for ensuring venue compliance, security, and appropriate event insurance where required.');

    startSection(25);
    drawSectionHeader('14', 'LIMITATION OF LIABILITY');
    drawBodyText('The total liability of Enzym3 Entertainment, including its owners, employees, DJs, contractors, assistants, and affiliates, shall not exceed the total amount paid under this Agreement.');
    drawBodyText('Company shall not be liable for indirect, incidental, consequential, emotional, or punitive damages.');

    startSection(20);
    drawSectionHeader('15', 'FORCE MAJEURE');
    drawBodyText('Neither party shall be liable for failure to perform due to causes beyond reasonable control including natural disasters, government mandates, severe weather, or venue closure.');
    drawBodyText('If performance becomes legally impossible, payments may be applied toward a rescheduled date within 12 months.');

    startSection(15);
    drawSectionHeader('16', 'GOVERNING LAW');
    drawBodyText('This Agreement shall be governed by the laws of the State of Arizona. Venue for disputes shall be Pima County, Arizona.');

    startSection(15);
    drawSectionHeader('17', 'ENTIRE AGREEMENT');
    drawBodyText('This Agreement constitutes the entire understanding between the parties.');

    // SIGNATURES
    checkPageBreak(60);
    y += 4;
    pdf.setDrawColor(229, 231, 235);
    pdf.setLineWidth(0.5);
    pdf.line(margin, y, margin + contentW, y);
    y += 8;

    pdf.setFontSize(13);
    pdf.setTextColor(...BRAND_BLUE);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SIGNATURES', pageW / 2, y, { align: 'center' });
    y += 10;

    const sigColW = (contentW - 10) / 2;

    pdf.setFontSize(9);
    pdf.setTextColor(...DARK);
    pdf.setFont('helvetica', 'bold');
    pdf.text('CLIENT', margin, y);

    const sigData = wedding.contract_signature_data;
    if (sigData && sigData.startsWith('data:image')) {
      try {
        pdf.addImage(sigData, 'PNG', margin, y + 2, sigColW, 18);
      } catch {
        // skip
      }
    }
    y += 22;
    pdf.setLineWidth(0.6);
    pdf.setDrawColor(...DARK);
    pdf.line(margin, y, margin + sigColW, y);
    y += 4;
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...DARK);
    pdf.text(wedding.client_signature_name || '', margin, y);
    y += 5;
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...GRAY);
    const signedDate = wedding.contract_signed_at
      ? new Date(wedding.contract_signed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : '';
    pdf.text(`Date: ${signedDate}`, margin, y);

    const djX = margin + sigColW + 10;
    const djY = y - 30;
    pdf.setFontSize(9);
    pdf.setTextColor(...DARK);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PERFORMER (DJ)', djX, djY);
    pdf.setFontSize(20);
    pdf.setFont('times', 'italic');
    pdf.setTextColor(...BRAND_BLUE);
    pdf.text('Enzym3', djX, djY + 14);
    pdf.setLineWidth(0.6);
    pdf.setDrawColor(...DARK);
    pdf.line(djX, djY + 20, djX + sigColW, djY + 20);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...DARK);
    pdf.text('Enzym3 Entertainment', djX, djY + 25);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...GRAY);
    pdf.text(`Date: ${signedDate}`, djX, djY + 31);

    // FOOTER
    const totalPages = (pdf as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(...GRAY);
      pdf.setFont('helvetica', 'normal');
      pdf.text(
        'Enzym3 Entertainment  •  Booking@enzym3entertainment.vip  •  (520) 406-8600  •  Tucson, AZ',
        pageW / 2,
        pageH - 8,
        { align: 'center' }
      );
      pdf.text(`Page ${i} of ${totalPages}`, pageW - margin, pageH - 8, { align: 'right' });
    }

    pdf.save(`${wedding.couple_name.replace(/[^a-z0-9]/gi, '_')}_Contract.pdf`);
    toast.success('PDF downloaded!');
  } catch (error) {
    console.error('PDF generation error:', error);
    toast.error('Failed to generate PDF');
  }
}
