import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

function escapeHtml(unsafe: string | null | undefined): string {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function extractFirstName(fullName: string | null | undefined): string {
  if (!fullName) return '';
  return fullName.trim().split(/\s+/)[0];
}

function buildReviewEmail(brideFirst: string, groomFirst: string, reviewUrl: string): string {
  const safeBride = escapeHtml(brideFirst);
  const safeGroom = escapeHtml(groomFirst);
  const safeUrl = escapeHtml(reviewUrl);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Enzym3 Entertainment Review Request</title>
</head>
<body style="margin:0; padding:0; background:#DBD4C3; font-family:Arial, Helvetica, sans-serif; color:#2D2921;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:30px 0; background:#DBD4C3;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff; border-radius:8px; overflow:hidden;">
          <tr>
            <td style="background:#2D2921; color:#ffffff; padding:22px; text-align:center; font-size:24px; font-family:Georgia, serif;">
              Enzym3 Entertainment
            </td>
          </tr>
          <tr>
            <td style="height:4px; background:#85D4FA; font-size:0; line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:30px; font-size:16px; line-height:1.6; color:#2D2921;">
              <p style="margin:0 0 18px 0;">
                Hi ${safeBride} &amp; ${safeGroom}, this is JJ from Enzym3 Entertainment.
              </p>
              <p style="margin:0 0 18px 0;">
                I wanted to reach out and thank you again for having me at your wedding.
                Being part of such a big moment in people&apos;s lives is something I never take for granted,
                and I really appreciate you trusting me with your day.
              </p>
              <p style="margin:0 0 18px 0;">
                If you have a minute, I&apos;d really appreciate a quick review.
                It helps future couples know what to expect, and reviews for both Enzym3 Entertainment
                and our venue partners help us continue doing what we love.
              </p>
              <p style="margin:0 0 24px 0;">
                After you submit the review on my page, the next page will take you to a review
                for our venue partner, Saguaro Buttes.
                If you do leave a review there as well, feel free to mention my name
                (DJ JJ / Enzym3 Entertainment). It really helps future couples know who they&apos;re working
                with, especially at venues like Saguaro Buttes.
              </p>
              <div style="text-align:center; margin:28px 0;">
                <a href="${safeUrl}"
                   style="background:#85D4FA; color:#2D2921; padding:12px 20px; text-decoration:none; border-radius:6px; font-weight:bold; display:inline-block;">
                  Leave a Review
                </a>
              </div>
              <p style="margin:0 0 18px 0;">
                Thank you again, and I hope married life has been treating you well!
              </p>
              <p style="margin:0;">
                – DJ JJ<br />
                Enzym3 Entertainment
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#DBD4C3; text-align:center; padding:12px; font-size:12px; color:#2D2921;">
              Enzym3 Entertainment &bull; Tucson, AZ
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Auth: accept service role key OR anon key from pg_cron
    const authHeader = req.headers.get('authorization');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const isServiceRole = authHeader?.includes(supabaseServiceKey);
    const isAnon = authHeader?.includes(anonKey);
    if (!isServiceRole && !isAnon) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get date range: 3–7 days ago in Arizona time (MST = UTC-7)
    const now = new Date();
    const arizonaOffset = -7 * 60;
    const arizonaTime = new Date(now.getTime() + (arizonaOffset + now.getTimezoneOffset()) * 60000);
    const maxDate = new Date(arizonaTime);
    maxDate.setDate(maxDate.getDate() - 3);
    const minDate = new Date(arizonaTime);
    minDate.setDate(minDate.getDate() - 7);
    const maxDateStr = maxDate.toISOString().split('T')[0];
    const minDateStr = minDate.toISOString().split('T')[0];

    console.log(`Looking for events between ${minDateStr} and ${maxDateStr} (3–7 days ago Arizona time)`);

    // Find events in the 3–7 day window
    const { data: events, error: eventsError } = await supabase
      .from('event_notification_history')
      .select('id, couple_name, event_date, event_type, contact_email, bride_email, groom_email, status, is_test')
      .gte('event_date', minDateStr)
      .lte('event_date', maxDateStr)
      .not('status', 'in', '("cancelled","deleted")')
      .or('is_test.is.null,is_test.eq.false');

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      return new Response(
        JSON.stringify({ error: 'An internal error occurred' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!events || events.length === 0) {
      console.log('No events found for review reminders');
      return new Response(
        JSON.stringify({ success: true, sent: 0, skipped: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${events.length} events from ${minDateStr} to ${maxDateStr}`);

    let sentCount = 0;
    let skippedCount = 0;

    for (const event of events) {
      // Check if already sent
      const { data: existing } = await supabase
        .from('review_reminders_sent')
        .select('id')
        .eq('event_id', event.id)
        .maybeSingle();

      if (existing) {
        console.log(`Already sent review reminder for ${event.couple_name} — skipping`);
        skippedCount++;
        continue;
      }

      // Extract first names
      const coupleParts = (event.couple_name || '').split(/\s*&\s*|\s+and\s+/i);
      const brideFirst = extractFirstName(coupleParts[0]);
      const groomFirst = extractFirstName(coupleParts[1] || '');

      // Collect recipient emails
      const recipients = new Set<string>();
      if (event.contact_email) recipients.add(event.contact_email.toLowerCase());
      if (event.bride_email) recipients.add(event.bride_email.toLowerCase());
      if (event.groom_email) recipients.add(event.groom_email.toLowerCase());

      if (recipients.size === 0) {
        console.log(`No email addresses for ${event.couple_name} — skipping`);
        skippedCount++;
        continue;
      }

      // --- 1. Send email ---
      const reviewUrl = 'https://review.enzym3entertainment.com/';
      const html = buildReviewEmail(brideFirst, groomFirst, reviewUrl);

      const emailResult = await resend.emails.send({
        from: "Enzym3 Entertainment <booking@enzym3entertainment.vip>",
        to: Array.from(recipients),
        subject: `${event.couple_name} — We'd love your feedback!`,
        html,
      });

      if (emailResult.error) {
        console.error(`Error sending review email to ${event.couple_name}:`, emailResult.error);
        continue;
      }

      console.log(`Sent review email to ${event.couple_name} (${Array.from(recipients).join(', ')})`);

      // --- 2. In-app notification + push for linked users ---
      // Find user IDs linked to this event via couple_codes or auth email match
      const userIds = new Set<string>();

      // Check couple_codes for used_by user
      const { data: codes } = await supabase
        .from('couple_codes')
        .select('used_by, bride_email, groom_email')
        .eq('wedding_id', event.id);

      if (codes) {
        for (const code of codes) {
          if (code.used_by) userIds.add(code.used_by);
        }
      }

      // Find auth users by email
      const allEmails = Array.from(recipients);
      for (const email of allEmails) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .ilike('email', email.toLowerCase())
          .maybeSingle();
        if (profile) userIds.add(profile.id);
      }

      for (const userId of userIds) {
        // In-app notification
        try {
          await supabase.from('notifications').insert({
            user_id: userId,
            type: 'review_request',
            title: 'How was your event?',
            content: "We'd love to hear about your experience! Leave a quick review.",
            wedding_id: event.id,
          });
        } catch (e) {
          console.error(`Error inserting notification for user ${userId}:`, e);
        }

        // Push notification
        try {
          await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              userId,
              title: 'How was your event? 🎶',
              body: "We'd love to hear about your experience! Leave a quick review.",
              url: '/app/review',
              tag: 'review-request',
            }),
          });
        } catch (e) {
          console.error(`Error sending push to user ${userId}:`, e);
        }
      }

      // --- 3. Record send ---
      const { error: insertError } = await supabase
        .from('review_reminders_sent')
        .insert({ event_id: event.id });

      if (insertError) {
        console.error(`Error recording review reminder for ${event.couple_name}:`, insertError);
      }

      sentCount++;
    }

    console.log(`Review reminders complete: ${sentCount} sent, ${skippedCount} skipped`);

    return new Response(
      JSON.stringify({ success: true, sent: sentCount, skipped: skippedCount, checked: events.length }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in send-review-reminder:', error);
    return new Response(
      JSON.stringify({ error: 'An internal error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
