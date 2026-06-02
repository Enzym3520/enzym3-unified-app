import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const brandColors = {
  header: '#6ba3be',
  accent: '#6ba3be',
  white: '#ffffff',
  background: '#f5f5f5',
  textPrimary: '#1f2937',
  textSecondary: '#4a4a4a',
  textMuted: '#6b7280',
  border: '#e5e7eb'
};

const logoUrl = 'https://ytembomoyhuwdtrzlwbi.supabase.co/storage/v1/object/public/email-assets/logo-blue.png?v=1';

function escapeHtml(unsafe: string | null | undefined): string {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { booking_id, action } = body;

    if (!booking_id) {
      console.error('Missing booking_id');
      return new Response(
        JSON.stringify({ error: 'Missing booking_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Email service unavailable' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch booking with wedding details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, booking_date, booking_time, meeting_type, meeting_format, meeting_link, vendor_id, wedding_id, status')
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) {
      console.error('Booking not found:', bookingError);
      return new Response(
        JSON.stringify({ error: 'Booking not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!booking.vendor_id) {
      console.log('No vendor assigned to booking, skipping email');
      return new Response(
        JSON.stringify({ success: true, message: 'No vendor to notify' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch vendor
    const { data: vendor } = await supabase
      .from('profiles')
      .select('email, first_name, last_name')
      .eq('id', booking.vendor_id)
      .single();

    if (!vendor?.email) {
      console.warn('Vendor has no email');
      return new Response(
        JSON.stringify({ success: true, message: 'No vendor email' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch event info
    const { data: event } = await supabase
      .from('event_notification_history')
      .select('couple_name, event_type')
      .eq('id', booking.wedding_id)
      .single();

    const vendorName = escapeHtml(vendor.first_name || 'Team Member');
    const coupleName = escapeHtml(event?.couple_name || 'a client');
    const meetingDate = new Date(booking.booking_date).toLocaleDateString('en-US', { dateStyle: 'full', timeZone: 'America/Denver' });
    const meetingTime = escapeHtml(booking.booking_time);
    const meetingType = escapeHtml(booking.meeting_type || 'Meeting');
    const meetingFormat = escapeHtml(booking.meeting_format || 'TBD');
    const actionLabel = action === 'cancelled' ? '❌ Meeting Cancelled' : action === 'updated' ? '📅 Meeting Updated' : '📅 New Meeting Scheduled';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; margin: 0; padding: 0; background-color: ${brandColors.background};">
          <div style="background-color: ${brandColors.header}; padding: 30px 20px; text-align: center;">
            <img src="${logoUrl}" alt="Enzym3 Entertainment" width="180" style="max-width: 100%; height: auto;" />
          </div>
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: ${brandColors.white}; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <h2 style="color: ${brandColors.textPrimary}; margin-top: 0;">${actionLabel}</h2>
              <p style="color: ${brandColors.textSecondary};">Hi ${vendorName},</p>
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid ${brandColors.accent}; margin: 20px 0;">
                <p style="margin: 8px 0;"><strong>Client:</strong> ${coupleName}</p>
                <p style="margin: 8px 0;"><strong>Type:</strong> ${meetingType}</p>
                <p style="margin: 8px 0;"><strong>Date:</strong> ${meetingDate}</p>
                <p style="margin: 8px 0;"><strong>Time:</strong> ${meetingTime}</p>
                <p style="margin: 8px 0;"><strong>Format:</strong> ${meetingFormat}</p>
                ${booking.meeting_link ? `<p style="margin: 8px 0;"><strong>Link:</strong> <a href="${escapeHtml(booking.meeting_link)}" style="color: ${brandColors.accent};">Join Meeting</a></p>` : ''}
              </div>
              <p style="color: ${brandColors.textSecondary};">Log in to the vendor portal for full details.</p>
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid ${brandColors.border};">
                <p style="color: ${brandColors.textMuted}; font-size: 12px;">This is an automated notification from Enzym3 Entertainment.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: "Enzym3 Entertainment <booking@enzym3.com>",
        to: [vendor.email],
        subject: `${actionLabel}: ${event?.couple_name || 'Client'} — ${meetingDate}`,
        html: emailHtml,
        text: `Hi ${vendor.first_name || 'Team Member'}, ${action === 'cancelled' ? 'a meeting has been cancelled' : 'you have a meeting scheduled'} with ${event?.couple_name || 'a client'} on ${meetingDate} at ${booking.booking_time}. Log in to the vendor portal for details.`,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Resend API error:', response.status, errText);
      return new Response(
        JSON.stringify({ error: 'Failed to send email' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();
    console.log(`Meeting email sent to ${vendor.email}:`, result);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in send-vendor-meeting-email:', error);
    return new Response(
      JSON.stringify({ error: 'An internal error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
