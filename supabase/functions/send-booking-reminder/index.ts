import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Client theme (Blue - matches portal)
const brandColors = {
  header: '#6ba3be',
  headerDark: '#5a92ad',
  accent: '#6ba3be',
  white: '#ffffff',
  background: '#f5f5f5',
  textPrimary: '#1f2937',
  textSecondary: '#4a4a4a',
  textMuted: '#6b7280',
  border: '#e5e7eb',
};

const logoUrl = 'https://ytembomoyhuwdtrzlwbi.supabase.co/storage/v1/object/public/email-assets/logo-blue.png?v=1';

// Input validation
const BookingReminderSchema = z.object({
  couple_name: z.string().min(1).max(200).trim(),
  contact_email: z.string().email().max(254),
  booking_date: z.string().min(1).max(30).trim(),
  booking_time: z.string().min(1).max(20).trim(),
  meeting_type: z.string().min(1).max(50).trim(),
  meeting_format: z.string().max(50).trim().optional().nullable(),
  event_date: z.string().max(30).trim().optional().nullable(),
  event_type: z.string().max(50).trim().optional().nullable(),
});

// Inline formatters (matching src/lib/formatters.ts)
function formatMeetingType(type: string | null): string {
  if (!type) return '';
  const map: Record<string, string> = {
    'dj_details': 'DJ Details Meeting',
    'consultation': 'Quick Consultation',
    'follow_up': 'Follow-Up Call',
  };
  return map[type] || capitalizeWords(type.replace(/_/g, ' '));
}

function formatMeetingFormat(fmt: string | null): string {
  if (!fmt) return '';
  const map: Record<string, string> = {
    'in_person': 'In-Person',
    'online': 'Online',
  };
  return map[fmt] || capitalizeWords(fmt.replace(/_/g, ' '));
}

function capitalizeWords(str: string): string {
  const acronyms = ['dj', 'mc', 'vip', 'led', 'usb', 'pa'];
  return str.replace(/\b\w+/g, (word) => {
    if (acronyms.includes(word.toLowerCase())) return word.toUpperCase();
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
}

function formatBookingDate(dateStr: string): string {
  try {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatBookingTime(timeStr: string): string {
  try {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;
    return `${displayHour}:${String(minutes).padStart(2, '0')} ${period}`;
  } catch {
    return timeStr;
  }
}

function escapeHtml(unsafe: string | null | undefined): string {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate via shared secret (fail-closed)
    const webhookSecret = Deno.env.get('N8N_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.error('N8N_WEBHOOK_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'Service unavailable' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const providedSecret = req.headers.get('x-webhook-secret');
    if (providedSecret !== webhookSecret) {
      console.error('Invalid webhook secret');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate input
    const body = await req.json();
    const parseResult = BookingReminderSchema.safeParse(body);

    if (!parseResult.success) {
      console.error('Invalid request:', parseResult.error.flatten());
      return new Response(
        JSON.stringify({ error: 'Invalid request format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = parseResult.data;
    console.log('Sending booking reminder to:', data.contact_email);

    const safeName = escapeHtml(data.couple_name);
    const formattedDate = formatBookingDate(data.booking_date);
    const formattedTime = formatBookingTime(data.booking_time);
    const formattedType = formatMeetingType(data.meeting_type);
    const formattedFormat = formatMeetingFormat(data.meeting_format ?? null);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; margin: 0; padding: 0; background-color: ${brandColors.background};">
          <!-- Blue Header Bar with Logo -->
          <div style="background-color: ${brandColors.header}; padding: 30px 20px; text-align: center;">
            <img src="${logoUrl}" alt="Enzym3 Entertainment" width="180" style="max-width: 100%; height: auto;" />
          </div>

          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: ${brandColors.white}; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <h2 style="color: ${brandColors.textPrimary}; margin-top: 0; margin-bottom: 24px;">📅 Meeting Reminder</h2>

              <p style="font-size: 16px; color: ${brandColors.textSecondary}; margin-bottom: 20px;">
                Hey ${safeName}! Just a friendly reminder that your meeting is coming up soon.
              </p>

              <!-- Meeting Details Box -->
              <div style="background: linear-gradient(135deg, ${brandColors.header} 0%, ${brandColors.headerDark} 100%); color: white; padding: 25px; border-radius: 10px; margin: 25px 0;">
                <h3 style="margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">Meeting Details</h3>
                <p style="margin: 8px 0; font-size: 15px;"><strong>📋 Type:</strong> ${escapeHtml(formattedType)}</p>
                <p style="margin: 8px 0; font-size: 15px;"><strong>📅 Date:</strong> ${escapeHtml(formattedDate)}</p>
                <p style="margin: 8px 0; font-size: 15px;"><strong>🕐 Time:</strong> ${escapeHtml(formattedTime)}</p>
                ${formattedFormat ? `<p style="margin: 8px 0; font-size: 15px;"><strong>📍 Format:</strong> ${escapeHtml(formattedFormat)}</p>` : ''}
              </div>

              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid ${brandColors.accent}; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px; color: ${brandColors.textSecondary};">
                  <strong>💡 Tip:</strong> Have any questions or song ideas ready! This is your chance to share your vision for the perfect event.
                </p>
              </div>

              <p style="font-size: 14px; color: ${brandColors.textMuted}; margin-top: 20px;">
                Need to reschedule? Log in to your portal or contact us at 
                <a href="mailto:booking@enzym3entertainment.vip" style="color: ${brandColors.accent}; text-decoration: none;">booking@enzym3entertainment.vip</a>
              </p>

              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid ${brandColors.border};">
                <div style="font-size: 16px; font-weight: 600; color: ${brandColors.textPrimary};">— JJ</div>
                <div style="font-size: 14px; color: ${brandColors.accent}; font-weight: 500;">Enzym3 Entertainment</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResult = await resend.emails.send({
      from: "Enzym3 Entertainment <booking@enzym3entertainment.vip>",
      to: [data.contact_email],
      subject: `📅 Meeting Reminder - ${formattedType} on ${formattedDate}`,
      html: htmlContent,
    });

    if (emailResult.error) {
      console.error('Error sending booking reminder:', emailResult.error);
      return new Response(
        JSON.stringify({ error: 'Failed to send email' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Booking reminder sent successfully:', emailResult.data);

    return new Response(
      JSON.stringify({ success: true, email_id: emailResult.data?.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in send-booking-reminder:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process request' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
