import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Input validation schema
const WelcomeEmailSchema = z.object({
  couple_name: z.string().min(1, 'Couple name is required').max(200, 'Couple name too long').trim(),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD required)'),
  venue: z.string().min(1, 'Venue is required').max(300, 'Venue name too long').trim(),
  couple_code: z.string().min(1, 'Couple code is required').max(50, 'Couple code too long').trim(),
  bride_email: z.string().email('Invalid bride email').max(254, 'Email too long'),
  groom_email: z.string().email('Invalid groom email').max(254, 'Email too long').optional().nullable(),
  registration_link: z.string().url('Invalid registration link').max(500, 'Registration link too long'),
  is_venue_partner: z.boolean().default(false),
  hours_booked: z.number().positive('Hours must be positive').optional(),
  hourly_rate: z.number().positive('Rate must be positive').optional(),
});

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

/**
 * Dual auth: accepts either x-webhook-secret (n8n) or Supabase JWT with admin role.
 * Returns null on success, or a Response on failure.
 */
async function authenticate(req: Request): Promise<Response | null> {
  // Path 1: webhook secret (n8n)
  const webhookSecret = Deno.env.get('N8N_WEBHOOK_SECRET');
  const providedSecret = req.headers.get('x-webhook-secret');
  if (providedSecret && webhookSecret && providedSecret === webhookSecret) {
    return null; // authorized
  }

  // Path 2: Supabase JWT with admin role
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  });

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const userId = user.id;

  // Check admin role using service role client
  const serviceClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const { data: roleData } = await serviceClient
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin');

  if (!roleData || roleData.length === 0) {
    return new Response(
      JSON.stringify({ error: 'Forbidden' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return null; // authorized
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authResult = await authenticate(req);
    if (authResult) return authResult;

    // Parse and validate request body
    const body = await req.json();
    const parseResult = WelcomeEmailSchema.safeParse(body);

    if (!parseResult.success) {
      console.error('Invalid request:', parseResult.error.flatten());
      return new Response(
        JSON.stringify({ error: 'Invalid request format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = parseResult.data;
    console.log('Sending welcome email to:', data.bride_email, data.groom_email);

    const {
      couple_name,
      event_date,
      venue,
      couple_code,
      bride_email,
      groom_email,
      registration_link,
      is_venue_partner = false,
    } = data;

    // Format date nicely
    const formattedDate = new Date(event_date + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Build the portal features list
    const portalFeatures = buildPortalFeatures(is_venue_partner);

    const htmlContent = buildEmailHtml({
      couple_name, formattedDate, venue, couple_code, registration_link, portalFeatures
    });

    // Build recipient list
    const recipients = [bride_email];
    if (groom_email && groom_email !== bride_email) {
      recipients.push(groom_email);
    }

    console.log('Sending to recipients:', recipients);

    const emailResult = await resend.emails.send({
      from: "Enzym3 Entertainment <booking@enzym3entertainment.vip>",
      to: recipients,
      subject: `💍 Welcome ${couple_name}! Your Wedding Vibe Planner is Ready`,
      html: htmlContent,
    });

    if (emailResult.error) {
      console.error('Error sending welcome email:', emailResult.error);
      return new Response(
        JSON.stringify({ error: 'Failed to send email' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Welcome email sent successfully:', emailResult.data);

    return new Response(
      JSON.stringify({ success: true, email_id: emailResult.data?.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in send-welcome-email:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process email request' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildPortalFeatures(is_venue_partner: boolean): string {
  return `
    <ul style="list-style: none; padding: 0; margin: 20px 0;">
      <li style="padding: 12px 0; border-bottom: 1px solid ${brandColors.border};">
        📋 <strong>Fill Out Your Vibe Sheet</strong> – Share your music preferences, must-play songs, do-not-play list, and timeline details
      </li>
      <li style="padding: 12px 0; border-bottom: 1px solid ${brandColors.border};">
        📅 <strong>Book a Meeting</strong> – Schedule a call or in-person meeting to discuss your event details
      </li>
      <li style="padding: 12px 0; border-bottom: 1px solid ${brandColors.border};">
        ✨ <strong>Browse & Pay for Upgrades</strong> – Check out premium packages like Uplights, Monograms, Cold Sparks, Cloud 9, and Videography
      </li>
      ${!is_venue_partner ? `
      <li style="padding: 12px 0; border-bottom: 1px solid ${brandColors.border};">
        📄 <strong>Sign Your Contract</strong> – Review and sign your DJ contract digitally
      </li>
      <li style="padding: 12px 0; border-bottom: 1px solid ${brandColors.border};">
        💳 <strong>Pay Your Deposit</strong> – Securely pay your 50% deposit online
      </li>
      ` : ''}
      <li style="padding: 12px 0; border-bottom: 1px solid ${brandColors.border};">
        📁 <strong>Upload & Download Files</strong> – Share documents and access files from your coordinator
      </li>
      <li style="padding: 12px 0;">
        ⚙️ <strong>Update Your Info</strong> – Keep your contact details current in Settings
      </li>
    </ul>
  `;
}

interface EmailTemplateData {
  couple_name: string;
  formattedDate: string;
  venue: string;
  couple_code: string;
  registration_link: string;
  portalFeatures: string;
}

function buildEmailHtml(data: EmailTemplateData): string {
  const { couple_name, formattedDate, venue, couple_code, registration_link, portalFeatures } = data;
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: ${brandColors.textPrimary}; margin: 0; padding: 0; background-color: ${brandColors.background};">
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
            <div style="font-size: 24px; font-weight: 600; color: ${brandColors.textPrimary}; margin-bottom: 20px;">
              Hey ${couple_name}! 💍
            </div>

            <p style="font-size: 16px; color: ${brandColors.textSecondary}; margin-bottom: 30px;">
              First off, huge congrats on your upcoming wedding! I'm JJ, your go-to Wedding DJ for everything tunes and vibes.
            </p>

            <!-- Blue Details Box -->
            <div style="background: linear-gradient(135deg, ${brandColors.header} 0%, ${brandColors.headerDark} 100%); color: white; padding: 25px; border-radius: 10px; margin: 25px 0;">
              <h3 style="margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">📋 Your Wedding Details</h3>
              <p style="margin: 8px 0; font-size: 15px;"><strong>📅 Date:</strong> ${formattedDate}</p>
              <p style="margin: 8px 0; font-size: 15px;"><strong>📍 Venue:</strong> ${venue || 'To be confirmed'}</p>
            </div>

            <p>
              I've set up a personal <strong>Wedding Vibe Planner</strong> just for you! Here's what you can do:
            </p>

            <h4 style="font-size: 18px; font-weight: 600; color: ${brandColors.textPrimary}; margin: 30px 0 15px 0;">✨ What You Can Do In Your Portal:</h4>
            ${portalFeatures}

            <!-- Registration Code Box with Blue Accent -->
            <div style="background: #f8f9fa; border: 2px dashed ${brandColors.accent}; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;">
              <div style="font-size: 14px; color: ${brandColors.textMuted}; margin-bottom: 8px;">Your Registration Code</div>
              <div style="font-size: 28px; font-weight: 700; color: ${brandColors.accent}; letter-spacing: 2px; font-family: 'Courier New', monospace;">${couple_code}</div>
            </div>

            <div style="text-align: center;">
              <a href="${registration_link}" style="display: inline-block; background: linear-gradient(135deg, ${brandColors.header} 0%, ${brandColors.headerDark} 100%); color: white !important; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; margin: 25px 0; text-align: center;">
                Open Your Wedding Vibe Planner →
              </a>
            </div>

            <p style="font-size: 16px; color: ${brandColors.textSecondary}; margin-top: 30px;">
              Can't wait to make your day unforgettable! ✨
            </p>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid ${brandColors.border};">
              <div style="font-size: 16px; font-weight: 600; color: ${brandColors.textPrimary};">— JJ</div>
              <div style="font-size: 14px; color: ${brandColors.accent}; font-weight: 500;">Enzym3 Entertainment</div>
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid ${brandColors.border}; font-size: 13px; color: ${brandColors.textMuted};">
              <p>
                Questions? Just reply to this email or reach out anytime:<br>
                <a href="mailto:help@enzym3entertainment.vip" style="color: ${brandColors.accent}; text-decoration: none;">help@enzym3entertainment.vip</a>
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}
