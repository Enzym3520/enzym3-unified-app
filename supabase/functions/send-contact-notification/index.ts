import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const brandColors = {
  header: '#6ba3be',
  headerDark: '#5a92ad',
  accent: '#6ba3be',
  white: '#ffffff',
  background: '#f5f5f5',
  textPrimary: '#1f2937',
  textSecondary: '#4a4a4a',
  textMuted: '#6b7280',
  border: '#e5e7eb'
};

const logoUrl = 'https://ytembomoyhuwdtrzlwbi.supabase.co/storage/v1/object/public/email-assets/logo-blue.png?v=1';

const RequestSchema = z.object({
  contact_message_id: z.string().uuid(),
});

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

    // Validate input
    const parseResult = RequestSchema.safeParse(body);
    if (!parseResult.success) {
      console.error('Invalid request:', parseResult.error.flatten());
      return new Response(
        JSON.stringify({ error: 'Invalid request format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { contact_message_id } = parseResult.data;

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Email service unavailable' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role — this function is called from both authenticated
    // (Contact page) and unauthenticated (Home page) contexts.
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch contact message details
    console.log(`Fetching contact message: ${contact_message_id}`);
    const { data: contactMessage, error: messageError } = await supabase
      .from('contact_messages')
      .select('id, name, email, subject, message, created_at, status, notification_sent_at')
      .eq('id', contact_message_id)
      .maybeSingle();

    if (messageError || !contactMessage) {
      console.error('Failed to fetch contact message:', messageError);
      return new Response(
        JSON.stringify({ error: 'Message not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Idempotency: refuse to re-send notifications for the same message.
    // Prevents anyone from re-triggering admin email floods by replaying the call.
    if (contactMessage.notification_sent_at) {
      console.log(`Notification already sent at ${contactMessage.notification_sent_at}; skipping.`);
      return new Response(
        JSON.stringify({ success: true, message: 'Notification already sent' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark as sent immediately (best-effort lock) before dispatching emails
    await supabase
      .from('contact_messages')
      .update({ notification_sent_at: new Date().toISOString() })
      .eq('id', contact_message_id)
      .is('notification_sent_at', null);

    console.log(`Contact message found: ${contactMessage.subject}`);

    // Fetch admin emails
    const { data: adminRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (rolesError || !adminRoles || adminRoles.length === 0) {
      console.warn('No admin users found');
      return new Response(
        JSON.stringify({ success: true, message: 'No recipients available' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const adminUserIds = adminRoles.map(role => role.user_id);
    const { data: adminProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name')
      .in('id', adminUserIds)
      .not('email', 'is', null);

    if (profilesError || !adminProfiles || adminProfiles.length === 0) {
      console.warn('No admin profiles with email found');
      return new Response(
        JSON.stringify({ success: true, message: 'No recipients available' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const submittedAt = new Date(contactMessage.created_at).toLocaleString('en-US', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'America/Denver'
    });

    const emailSubject = `📨 New Help Request: ${contactMessage.subject}`;
    const emailHtml = `
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
              <h2 style="color: ${brandColors.textPrimary}; margin-top: 0; margin-bottom: 24px;">📨 New Help Request</h2>
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid ${brandColors.accent}; margin-bottom: 20px;">
                <p style="margin: 8px 0;"><strong>From:</strong> ${escapeHtml(contactMessage.name)}</p>
                <p style="margin: 8px 0;"><strong>Email:</strong> <a href="mailto:${escapeHtml(contactMessage.email)}" style="color: ${brandColors.accent};">${escapeHtml(contactMessage.email)}</a></p>
                <p style="margin: 8px 0;"><strong>Subject:</strong> ${escapeHtml(contactMessage.subject)}</p>
                <p style="margin: 8px 0;"><strong>Submitted:</strong> ${submittedAt}</p>
              </div>
              <div style="margin: 20px 0;">
                <h3 style="color: ${brandColors.textPrimary}; margin-bottom: 12px;">Message:</h3>
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid ${brandColors.accent}; white-space: pre-wrap; color: ${brandColors.textSecondary};">
${escapeHtml(contactMessage.message)}
                </div>
              </div>
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid ${brandColors.border};">
                <p style="color: ${brandColors.textMuted}; font-size: 12px; margin: 4px 0;">
                  This is an automated notification from your wedding management system.<br>
                  Reply directly to the customer at: <a href="mailto:${escapeHtml(contactMessage.email)}" style="color: ${brandColors.accent};">${escapeHtml(contactMessage.email)}</a>
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailText = `
New Contact Message

From: ${contactMessage.name}
Email: ${contactMessage.email}
Subject: ${contactMessage.subject}
Submitted: ${submittedAt}

Message:
${contactMessage.message}

---
This is an automated notification from your wedding management system.
Reply directly to the customer at: ${contactMessage.email}
    `.trim();

    const emailResults = [];
    for (const profile of adminProfiles) {
      if (!profile?.email) continue;

      try {
        console.log(`Sending notification to: ${profile.email}`);
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Help Desk <help@enzym3entertainment.vip>',
            to: [profile.email],
            subject: emailSubject,
            html: emailHtml,
            text: emailText,
            reply_to: contactMessage.email,
          }),
        });

        if (!response.ok) {
          console.error(`Email API error for ${profile.email}:`, response.status);
          emailResults.push({ recipient: profile.email, success: false });
          continue;
        }

        const result = await response.json();
        console.log(`Email sent to ${profile.email}:`, result);
        emailResults.push({ recipient: profile.email, success: true, messageId: result.id });
      } catch (emailError: any) {
        console.error(`Failed to send email to ${profile.email}:`, emailError);
        emailResults.push({ recipient: profile.email, success: false });
      }
    }

    const successCount = emailResults.filter(r => r.success).length;
    console.log(`Email sending complete: ${successCount}/${emailResults.length} succeeded`);

    return new Response(
      JSON.stringify({ success: true, message: `Sent ${successCount} notification(s)` }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in send-contact-notification:', error);
    return new Response(
      JSON.stringify({ error: 'An internal error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
