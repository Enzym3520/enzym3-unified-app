import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
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

// Flexible list item schema
const ListItemSchema = z.object({
  name: z.string().max(200).optional(),
  couple_name: z.string().max(200).optional(),
  date: z.string().max(30).optional(),
  event_date: z.string().max(30).optional(),
  event_type: z.string().max(100).optional(),
  venue: z.string().max(300).optional(),
  email: z.string().max(254).optional(),
  amount: z.number().optional(),
}).passthrough();

// Input validation
const WeeklySummarySchema = z.object({
  period_start: z.string().min(1).max(30).trim(),
  period_end: z.string().min(1).max(30).trim(),
  new_registrations: z.object({
    count: z.number().int().min(0),
    list: z.array(ListItemSchema).optional().default([]),
  }),
  new_bookings: z.object({
    count: z.number().int().min(0),
    list: z.array(ListItemSchema).optional().default([]),
  }),
  contracts_signed: z.object({
    count: z.number().int().min(0),
  }),
  deposits_paid: z.object({
    count: z.number().int().min(0),
    total_amount: z.number().min(0).optional().default(0),
  }),
  vibe_sheets_submitted: z.object({
    count: z.number().int().min(0),
  }),
  upcoming_events: z.object({
    count: z.number().int().min(0),
    list: z.array(ListItemSchema).optional().default([]),
  }),
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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateRange(start: string, end: string): string {
  try {
    const s = new Date(start + 'T00:00:00');
    const e = new Date(end + 'T00:00:00');
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${s.toLocaleDateString('en-US', opts)} – ${e.toLocaleDateString('en-US', { ...opts, year: 'numeric' })}`;
  } catch {
    return `${start} – ${end}`;
  }
}

function buildListHtml(items: z.infer<typeof ListItemSchema>[]): string {
  if (!items || items.length === 0) return '';
  return `
    <ul style="list-style: none; padding: 0; margin: 10px 0 0 0;">
      ${items.map(item => {
        const label = escapeHtml(item.couple_name || item.name || '');
        const detail = escapeHtml(item.event_date || item.date || '');
        const extra = escapeHtml(item.venue || item.event_type || '');
        return `<li style="padding: 6px 0; border-bottom: 1px solid ${brandColors.border}; font-size: 14px; color: ${brandColors.textSecondary};">
          ${label}${detail ? ` — ${detail}` : ''}${extra ? ` (${extra})` : ''}
        </li>`;
      }).join('')}
    </ul>
  `;
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
    const parseResult = WeeklySummarySchema.safeParse(body);

    if (!parseResult.success) {
      console.error('Invalid request:', parseResult.error.flatten());
      return new Response(
        JSON.stringify({ error: 'Invalid request format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = parseResult.data;
    const dateRange = formatDateRange(data.period_start, data.period_end);

    console.log('Sending weekly summary for period:', dateRange);

    // Build metric sections
    const metricBlock = (emoji: string, title: string, count: number, extra?: string, listHtml?: string) => `
      <div style="padding: 20px; border-bottom: 1px solid ${brandColors.border};">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 24px;">${emoji}</span>
          <div>
            <div style="font-size: 28px; font-weight: 700; color: ${brandColors.textPrimary};">${count}</div>
            <div style="font-size: 14px; color: ${brandColors.textMuted};">${escapeHtml(title)}</div>
            ${extra ? `<div style="font-size: 13px; color: ${brandColors.accent}; font-weight: 600; margin-top: 2px;">${escapeHtml(extra)}</div>` : ''}
          </div>
        </div>
        ${listHtml || ''}
      </div>
    `;

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
              <h2 style="color: ${brandColors.textPrimary}; margin-top: 0; margin-bottom: 8px;">📊 Weekly Summary</h2>
              <p style="font-size: 14px; color: ${brandColors.textMuted}; margin-top: 0; margin-bottom: 24px;">${escapeHtml(dateRange)}</p>

              <!-- Metrics Grid -->
              <div style="background-color: #f8f9fa; border-radius: 8px; overflow: hidden;">
                ${metricBlock('👤', 'New Registrations', data.new_registrations.count, undefined, buildListHtml(data.new_registrations.list))}
                ${metricBlock('📅', 'New Bookings', data.new_bookings.count, undefined, buildListHtml(data.new_bookings.list))}
                ${metricBlock('📄', 'Contracts Signed', data.contracts_signed.count)}
                ${metricBlock('💳', 'Deposits Paid', data.deposits_paid.count, data.deposits_paid.total_amount ? `Total: ${formatCurrency(data.deposits_paid.total_amount)}` : undefined)}
                ${metricBlock('🎵', 'Vibe Sheets Submitted', data.vibe_sheets_submitted.count)}
                ${metricBlock('🎉', 'Upcoming Events (Next 30 Days)', data.upcoming_events.count, undefined, buildListHtml(data.upcoming_events.list))}
              </div>

              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid ${brandColors.border};">
                <p style="font-size: 13px; color: ${brandColors.textMuted}; margin: 0;">
                  This report is generated automatically every Monday. View full details in your
                  <a href="https://wedding-vibe-planning.lovable.app/admin" style="color: ${brandColors.accent}; text-decoration: none;">Admin Dashboard</a>.
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResult = await resend.emails.send({
      from: 'Enzym3 Entertainment <reports@enzym3entertainment.vip>',
      to: ['help@enzym3entertainment.vip'],
      subject: `📊 Weekly Summary — ${dateRange}`,
      html: htmlContent,
    });

    if (emailResult.error) {
      console.error('Error sending weekly summary:', emailResult.error);
      return new Response(
        JSON.stringify({ error: 'Failed to send email' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Weekly summary sent successfully:', emailResult.data);

    return new Response(
      JSON.stringify({ success: true, email_id: emailResult.data?.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in send-weekly-summary:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process request' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
