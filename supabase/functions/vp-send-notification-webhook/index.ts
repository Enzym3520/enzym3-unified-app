import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
  border: '#e5e7eb'
};

const logoUrl = 'https://ytembomoyhuwdtrzlwbi.supabase.co/storage/v1/object/public/email-assets/logo-blue.png?v=1';

interface NotificationPayload {
  notification_id: string;
}

// HTML escape function to prevent XSS and email injection
function escapeHtml(unsafe: string | null | undefined): string {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/\n/g, "<br/>"); // Convert newlines to <br/> for readability
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // AuthN: only accept calls from server-side contexts (DB triggers / cron)
  // that pass the service-role bearer token.
  const authHeader = req.headers.get('Authorization') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!serviceRoleKey || authHeader !== `Bearer ${serviceRoleKey}`) {
    console.warn('Unauthorized call to vp-send-notification-webhook');
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { notification_id }: NotificationPayload = await req.json();

    if (!notification_id) {
      console.error('Missing notification_id');
      return new Response(
        JSON.stringify({ error: 'notification_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch notification details
    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notification_id)
      .single();

    if (notificationError || !notification) {
      console.error('Error fetching notification:', notificationError);
      return new Response(
        JSON.stringify({ error: 'Notification not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing notification:', notification.type);

    // Build email based on notification type
    let subject = '';
    let htmlContent = '';

    const metadata = notification.metadata || {};
    
    // Escape all user-provided data to prevent HTML injection
    const safeCoupleName = escapeHtml(metadata.couple_name) || 'Unknown Couple';
    const safeEventDate = escapeHtml(metadata.event_date) || 'Date TBD';
    const safeContactEmail = escapeHtml(metadata.contact_email) || 'N/A';
    const safeContactPhone = escapeHtml(metadata.contact_phone);
    const safePackage = escapeHtml(metadata.package) || 'N/A';
    const safeEmeraldChoice = escapeHtml(metadata.emerald_choice);
    const safePaymentStatus = escapeHtml(metadata.payment_status) || 'Pending';
    const safeNotes = escapeHtml(metadata.notes);
    const safeContent = escapeHtml(notification.content);
    const safeFieldsChangedCount = escapeHtml(String(metadata.fields_changed_count)) || 'Multiple';
    const safeMustPlaysCount = escapeHtml(String(metadata.must_plays_count));
    const safeDoNotPlaysCount = escapeHtml(String(metadata.do_not_plays_count));

    // Common email wrapper
    const emailWrapper = (title: string, emoji: string, content: string) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; margin: 0; padding: 0; background-color: ${brandColors.background};">
          <!-- Blue Header Bar with Logo -->
          <div style="background-color: ${brandColors.header}; padding: 30px 20px; text-align: center;">
            <img 
              src="${logoUrl}" 
              alt="Enzym3 Entertainment" 
              width="180" 
              style="max-width: 100%; height: auto;"
            />
          </div>

          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: ${brandColors.white}; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <h2 style="color: ${brandColors.textPrimary}; margin-top: 0; margin-bottom: 24px;">${emoji} ${title}</h2>
              ${content}
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid ${brandColors.border};">
                <p style="color: ${brandColors.textMuted}; font-size: 12px; margin: 4px 0;">
                  Notification at ${escapeHtml(new Date(notification.created_at).toLocaleString())}
                </p>
                <p style="color: ${brandColors.textMuted}; font-size: 12px; margin: 4px 0;">
                  View full details in your admin dashboard.
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    switch (notification.type) {
      case 'music_sheet_created':
        subject = `🎵 New Music Sheet Submitted - ${safeCoupleName}`;
        htmlContent = emailWrapper('New Music Sheet Submitted', '🎵', `
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid ${brandColors.accent}; margin-bottom: 20px;">
            <p style="margin: 8px 0;"><strong>Couple:</strong> ${safeCoupleName}</p>
            <p style="margin: 8px 0;"><strong>Event Date:</strong> ${safeEventDate}</p>
            <p style="margin: 8px 0;"><strong>Contact Email:</strong> ${safeContactEmail}</p>
          </div>
          <div style="margin: 20px 0;">
            ${metadata.has_ceremony_songs ? '<p style="margin: 8px 0;">✅ Ceremony songs added</p>' : ''}
            ${metadata.has_reception_songs ? '<p style="margin: 8px 0;">✅ Reception songs added</p>' : ''}
            ${metadata.must_plays_count ? `<p style="margin: 8px 0;"><strong>Must-Play Songs:</strong> ${safeMustPlaysCount}</p>` : ''}
            ${metadata.do_not_plays_count ? `<p style="margin: 8px 0;"><strong>Do-Not-Play Songs:</strong> ${safeDoNotPlaysCount}</p>` : ''}
            ${metadata.has_notes ? '<p style="margin: 8px 0;">📝 Additional notes provided</p>' : ''}
          </div>
        `);
        break;

      case 'music_sheet_updated':
        subject = `✏️ Music Sheet Updated - ${safeCoupleName}`;
        htmlContent = emailWrapper('Music Sheet Updated', '✏️', `
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid ${brandColors.accent}; margin-bottom: 20px;">
            <p style="margin: 8px 0;"><strong>Couple:</strong> ${safeCoupleName}</p>
            <p style="margin: 8px 0;"><strong>Event Date:</strong> ${safeEventDate}</p>
            <p style="margin: 8px 0;"><strong>Contact Email:</strong> ${safeContactEmail}</p>
          </div>
          <div style="background: linear-gradient(135deg, ${brandColors.header} 0%, ${brandColors.headerDark} 100%); color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 8px 0;"><strong>Fields Changed:</strong> ${safeFieldsChangedCount}</p>
          </div>
          <div style="margin: 20px 0;">
            <p style="color: ${brandColors.textSecondary}; font-style: italic;">${safeContent}</p>
          </div>
        `);
        break;

      case 'upgrade_order':
        subject = `💎 New Upgrade Order - ${safeCoupleName} - ${safePackage}`;
        htmlContent = emailWrapper('New Upgrade Order', '💎', `
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid ${brandColors.accent}; margin-bottom: 20px;">
            <p style="margin: 8px 0;"><strong>Couple:</strong> ${safeCoupleName}</p>
            <p style="margin: 8px 0;"><strong>Event Date:</strong> ${safeEventDate}</p>
            <p style="margin: 8px 0;"><strong>Contact Email:</strong> ${safeContactEmail}</p>
            ${safeContactPhone ? `<p style="margin: 8px 0;"><strong>Contact Phone:</strong> ${safeContactPhone}</p>` : ''}
          </div>
          <div style="background: linear-gradient(135deg, ${brandColors.header} 0%, ${brandColors.headerDark} 100%); color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; margin-bottom: 12px;">Order Details</h3>
            <p style="margin: 8px 0;"><strong>Package Selected:</strong> ${safePackage}</p>
            ${safeEmeraldChoice ? `<p style="margin: 8px 0;"><strong>Emerald Choice:</strong> ${safeEmeraldChoice}</p>` : ''}
            <p style="margin: 8px 0;"><strong>Payment Status:</strong> ${safePaymentStatus}</p>
          </div>
          ${safeNotes ? `
            <div style="margin: 20px 0;">
              <p style="margin: 8px 0;"><strong>Notes:</strong></p>
              <p style="color: ${brandColors.textSecondary};">${safeNotes}</p>
            </div>
          ` : ''}
        `);
        break;

      default:
        console.log('Unknown notification type:', notification.type);
        return new Response(
          JSON.stringify({ error: 'Unknown notification type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    // Send email via Resend
    const emailResult = await resend.emails.send({
      from: 'Enzym3 Entertainment <notifications@enzym3entertainment.vip>',
      to: ['help@enzym3entertainment.vip'],
      subject: subject,
      html: htmlContent,
    });

    if (emailResult.error) {
      console.error('Error sending email:', emailResult.error);
      return new Response(
        JSON.stringify({ error: 'Failed to send email' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Email sent successfully:', emailResult.data);

    return new Response(
      JSON.stringify({ success: true, email_id: emailResult.data?.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in send-notification-webhook:', error);
    return new Response(
      JSON.stringify({ error: 'An internal error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
