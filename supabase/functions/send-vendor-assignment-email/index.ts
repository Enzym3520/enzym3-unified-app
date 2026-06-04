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

  // AuthN: accept service-role callers OR authenticated users (staff portal)
  const authHeader = req.headers.get('Authorization') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const isServiceRole = serviceRoleKey && authHeader === `Bearer ${serviceRoleKey}`;

  if (!isServiceRole) {
    // Fall back to verifying a valid Supabase JWT
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    if (!authHeader.startsWith('Bearer ') || !supabaseUrl || !anonKey) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.38.4");
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await callerClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  try {
    const body = await req.json();
    const { assignment_id, dj_user_id, event_id } = body;

    if (!assignment_id || !dj_user_id || !event_id) {
      console.error('Missing required fields:', { assignment_id, dj_user_id, event_id });
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
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

    // Fetch vendor profile
    const { data: vendor } = await supabase
      .from('profiles')
      .select('email, first_name, last_name')
      .eq('id', dj_user_id)
      .single();

    if (!vendor?.email) {
      console.warn('Vendor has no email:', dj_user_id);
      return new Response(
        JSON.stringify({ success: true, message: 'No vendor email found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch event details
    const { data: event } = await supabase
      .from('event_notification_history')
      .select('couple_name, event_date, event_type, venue')
      .eq('id', event_id)
      .single();

    const eventDate = event?.event_date
      ? new Date(event.event_date + 'T12:00:00').toLocaleDateString('en-US', { dateStyle: 'full', timeZone: 'America/Phoenix' })
      : 'TBD';

    const vendorName = vendor.first_name || 'Team Member';
    const coupleName = escapeHtml(event?.couple_name || 'a client');
    const eventType = escapeHtml(event?.event_type || 'Event');
    const venue = escapeHtml(event?.venue || 'TBD');

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
              <h2 style="color: ${brandColors.textPrimary}; margin-top: 0;">🎧 New Event Assignment</h2>
              <p style="color: ${brandColors.textSecondary};">Hi ${escapeHtml(vendorName)},</p>
              <p style="color: ${brandColors.textSecondary};">You've been assigned to a new event. Here are the details:</p>
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid ${brandColors.accent}; margin: 20px 0;">
                <p style="margin: 8px 0;"><strong>Client:</strong> ${coupleName}</p>
                <p style="margin: 8px 0;"><strong>Event Type:</strong> ${eventType}</p>
                <p style="margin: 8px 0;"><strong>Date:</strong> ${eventDate}</p>
                <p style="margin: 8px 0;"><strong>Venue:</strong> ${venue}</p>
              </div>
              <p style="color: ${brandColors.textSecondary};">Please log in to the vendor portal to confirm your assignment and review event details.</p>
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
        from: "Enzym3 Entertainment <booking@enzym3entertainment.vip>",
        to: [vendor.email],
        subject: `🎧 New Assignment: ${event?.couple_name || 'Event'} — ${eventDate}`,
        html: emailHtml,
        text: `Hi ${vendorName}, you've been assigned to ${event?.couple_name || 'an event'} (${eventType}) on ${eventDate} at ${event?.venue || 'TBD'}. Log in to the vendor portal to confirm.`,
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
    console.log(`Assignment email sent to ${vendor.email}:`, result);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in send-vendor-assignment-email:', error);
    return new Response(
      JSON.stringify({ error: 'An internal error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
