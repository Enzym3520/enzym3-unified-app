import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

function escapeHtml(unsafe: string | null | undefined): string {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function formatEventDate(dateStr: string): string {
  try {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch {
    return dateStr;
  }
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
    // Also accept Authorization header from pg_cron (service role key)
    const authHeader = req.headers.get('authorization');
    const isServiceRole = authHeader?.includes(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '___none___');
    
    if (providedSecret !== webhookSecret && !isServiceRole) {
      console.error('Invalid authentication');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role for DB access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get today's month and day in Arizona time (MST = UTC-7)
    const now = new Date();
    const arizonaOffset = -7 * 60; // MST in minutes
    const arizonaTime = new Date(now.getTime() + (arizonaOffset + now.getTimezoneOffset()) * 60000);
    const todayMonth = arizonaTime.getMonth() + 1; // 1-indexed
    const todayDay = arizonaTime.getDate();
    const todayYear = arizonaTime.getFullYear();

    console.log(`Checking for anniversaries on ${todayMonth}/${todayDay} (Arizona time)`);

    // Find events where event_date matches today's month/day and is in the past
    const { data: events, error: eventsError } = await supabase
      .from('event_notification_history')
      .select('id, couple_name, event_date, event_type, venue, contact_email, bride_email, groom_email, status, is_test')
      .not('status', 'eq', 'cancelled')
      .or('is_test.is.null,is_test.eq.false');

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      return new Response(
        JSON.stringify({ error: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter to matching month/day that are in the past
    const matchingEvents = (events || []).filter(event => {
      if (!event.event_date) return false;
      const eventDate = new Date(event.event_date + 'T00:00:00');
      const eventMonth = eventDate.getMonth() + 1;
      const eventDay = eventDate.getDate();
      const eventYear = eventDate.getFullYear();
      return eventMonth === todayMonth && eventDay === todayDay && eventYear < todayYear;
    });

    console.log(`Found ${matchingEvents.length} anniversary matches`);

    let sentCount = 0;
    let skippedCount = 0;

    for (const event of matchingEvents) {
      const eventDate = new Date(event.event_date + 'T00:00:00');
      const yearNumber = todayYear - eventDate.getFullYear();

      // Check if already sent for this year
      const { data: existing } = await supabase
        .from('anniversary_emails_sent')
        .select('id')
        .eq('event_id', event.id)
        .eq('year_number', yearNumber)
        .maybeSingle();

      if (existing) {
        console.log(`Already sent ${getOrdinal(yearNumber)} anniversary for ${event.couple_name} — skipping`);
        skippedCount++;
        continue;
      }

      // Collect recipient emails (deduplicated)
      const recipients = new Set<string>();
      if (event.contact_email) recipients.add(event.contact_email.toLowerCase());
      if (event.bride_email) recipients.add(event.bride_email.toLowerCase());
      if (event.groom_email) recipients.add(event.groom_email.toLowerCase());

      if (recipients.size === 0) {
        console.log(`No email addresses for ${event.couple_name} — skipping`);
        skippedCount++;
        continue;
      }

      const safeName = escapeHtml(event.couple_name);
      const ordinal = getOrdinal(yearNumber);
      const formattedDate = formatEventDate(event.event_date);
      const safeVenue = escapeHtml(event.venue);

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; margin: 0; padding: 0; background-color: ${brandColors.background};">
            <div style="background-color: ${brandColors.header}; padding: 30px 20px; text-align: center;">
              <img src="${logoUrl}" alt="Enzym3 Entertainment" width="180" style="max-width: 100%; height: auto;" />
            </div>

            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="background: ${brandColors.white}; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <h2 style="color: ${brandColors.textPrimary}; margin-top: 0; margin-bottom: 24px; text-align: center;">
                  🎉 Happy ${ordinal} Anniversary, ${safeName}!
                </h2>

                <p style="font-size: 16px; color: ${brandColors.textSecondary}; margin-bottom: 20px; line-height: 1.6;">
                  Can you believe it's been ${yearNumber === 1 ? 'a whole year' : yearNumber + ' years'} since your beautiful celebration? Time really does fly!
                </p>

                <div style="background: linear-gradient(135deg, ${brandColors.header} 0%, ${brandColors.headerDark} 100%); color: white; padding: 25px; border-radius: 10px; margin: 25px 0; text-align: center;">
                  <p style="margin: 0 0 8px 0; font-size: 14px; opacity: 0.9;">Your special day</p>
                  <p style="margin: 0; font-size: 18px; font-weight: 600;">${escapeHtml(formattedDate)}</p>
                  ${safeVenue ? `<p style="margin: 8px 0 0 0; font-size: 15px; opacity: 0.9;">📍 ${safeVenue}</p>` : ''}
                </div>

                <p style="font-size: 16px; color: ${brandColors.textSecondary}; margin-bottom: 20px; line-height: 1.6;">
                  It was such an honor to be part of your ${escapeHtml(event.event_type || 'event')}. I hope this anniversary brings you even more joy and love than the day itself. 🥂
                </p>

                <p style="font-size: 16px; color: ${brandColors.textSecondary}; margin-bottom: 20px; line-height: 1.6;">
                  Wishing you both all the happiness in the world. Here's to many more years of love, laughter, and great music! 🎶
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
        to: Array.from(recipients),
        subject: `🎉 Happy ${ordinal} Anniversary, ${event.couple_name}!`,
        html: htmlContent,
      });

      if (emailResult.error) {
        console.error(`Error sending anniversary email to ${event.couple_name}:`, emailResult.error);
        continue;
      }

      // Record that we sent it
      const { error: insertError } = await supabase
        .from('anniversary_emails_sent')
        .insert({ event_id: event.id, year_number: yearNumber });

      if (insertError) {
        console.error(`Error recording sent anniversary for ${event.couple_name}:`, insertError);
      }

      console.log(`Sent ${ordinal} anniversary email to ${event.couple_name} (${Array.from(recipients).join(', ')})`);
      sentCount++;
    }

    console.log(`Anniversary emails complete: ${sentCount} sent, ${skippedCount} skipped`);

    return new Response(
      JSON.stringify({ success: true, sent: sentCount, skipped: skippedCount, checked: matchingEvents.length }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in send-anniversary-email:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process request' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
