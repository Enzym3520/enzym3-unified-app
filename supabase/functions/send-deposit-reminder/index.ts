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
const portalUrl = 'https://vibeplanner.enzym3entertainment.vip';

// Input validation
const DepositReminderSchema = z.object({
  couple_name: z.string().min(1).max(200).trim(),
  contact_email: z.string().email().max(254),
  event_date: z.string().min(1).max(30).trim(),
  event_type: z.string().min(1).max(100).trim(),
  package_type: z.string().max(50).trim().optional().nullable(),
  deposit_amount: z.number().positive(),
  total_price: z.number().positive(),
  booking_source: z.string().max(50).trim().optional().nullable(),
});

// Inline formatters
function capitalizeWords(str: string): string {
  const acronyms = ['dj', 'mc', 'vip', 'led', 'usb', 'pa'];
  return str.replace(/\b\w+/g, (word) => {
    if (acronyms.includes(word.toLowerCase())) return word.toUpperCase();
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
}

function formatPackageType(pkg: string | null): string {
  if (!pkg) return '';
  const map: Record<string, string> = {
    'gold': 'Gold', 'silver': 'Silver', 'bronze': 'Bronze',
    'platinum': 'Platinum', 'standard': 'Standard', 'premium': 'Premium',
  };
  return map[pkg.toLowerCase()] || capitalizeWords(pkg);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);
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
    const parseResult = DepositReminderSchema.safeParse(body);

    if (!parseResult.success) {
      console.error('Invalid request:', parseResult.error.flatten());
      return new Response(
        JSON.stringify({ error: 'Invalid request format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = parseResult.data;

    // Skip venue partner couples (they don't pay deposits)
    if (data.booking_source === 'venue_partner') {
      console.log('Skipping deposit reminder for venue partner:', data.couple_name);
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: 'venue_partner' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Sending deposit reminder to:', data.contact_email);

    const safeName = escapeHtml(data.couple_name);
    const formattedDate = formatEventDate(data.event_date);
    const formattedDeposit = formatCurrency(data.deposit_amount);
    const formattedTotal = formatCurrency(data.total_price);
    const formattedPackage = formatPackageType(data.package_type ?? null);

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
              <h2 style="color: ${brandColors.textPrimary}; margin-top: 0; margin-bottom: 24px;">💳 Deposit Reminder</h2>

              <p style="font-size: 16px; color: ${brandColors.textSecondary}; margin-bottom: 20px;">
                Hey ${safeName}! Great news — your contract is signed! 🎉 Just a friendly reminder to complete your deposit so we can lock everything in for your big day.
              </p>

              <!-- Payment Details Box -->
              <div style="background: linear-gradient(135deg, ${brandColors.header} 0%, ${brandColors.headerDark} 100%); color: white; padding: 25px; border-radius: 10px; margin: 25px 0;">
                <h3 style="margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">Payment Summary</h3>
                ${formattedPackage ? `<p style="margin: 8px 0; font-size: 15px;"><strong>📦 Package:</strong> ${escapeHtml(formattedPackage)}</p>` : ''}
                <p style="margin: 8px 0; font-size: 15px;"><strong>📅 Event Date:</strong> ${escapeHtml(formattedDate)}</p>
                <p style="margin: 8px 0; font-size: 15px;"><strong>💰 Total Price:</strong> ${escapeHtml(formattedTotal)}</p>
                <p style="margin: 12px 0; font-size: 20px; font-weight: 700;">
                  Deposit Due: ${escapeHtml(formattedDeposit)}
                </p>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center;">
                <a href="${portalUrl}/app/contract" style="display: inline-block; background: linear-gradient(135deg, ${brandColors.header} 0%, ${brandColors.headerDark} 100%); color: white !important; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; margin: 25px 0; text-align: center;">
                  Pay Deposit in Your Portal →
                </a>
              </div>

              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid ${brandColors.accent}; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px; color: ${brandColors.textSecondary};">
                  <strong>🔒 Secure Payment:</strong> All payments are processed securely through Stripe. Your deposit reserves your date and DJ services.
                </p>
              </div>

              <p style="font-size: 14px; color: ${brandColors.textMuted}; margin-top: 20px;">
                Questions about pricing or payment? Reach out anytime at
                <a href="mailto:help@enzym3entertainment.vip" style="color: ${brandColors.accent}; text-decoration: none;">help@enzym3entertainment.vip</a>
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
      from: 'Enzym3 Entertainment <reminders@enzym3entertainment.vip>',
      to: [data.contact_email],
      subject: `💳 Deposit Reminder - ${formattedDeposit} Due for Your ${escapeHtml(data.event_type)}`,
      html: htmlContent,
    });

    if (emailResult.error) {
      console.error('Error sending deposit reminder:', emailResult.error);
      return new Response(
        JSON.stringify({ error: 'Failed to send email' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Deposit reminder sent successfully:', emailResult.data);

    return new Response(
      JSON.stringify({ success: true, email_id: emailResult.data?.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in send-deposit-reminder:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process request' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
