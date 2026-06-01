import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

const ReviewRequestSchema = z.object({
  couple_name: z.string().min(1).max(200).trim(),
  contact_email: z.string().email().max(254),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  event_type: z.string().max(100).default("wedding"),
  google_review_url: z.string().url().max(500).optional(),
});

const brandColors = {
  header: "#6ba3be",
  headerDark: "#5a92ad",
  accent: "#6ba3be",
  white: "#ffffff",
  background: "#f5f5f5",
  textPrimary: "#1f2937",
  textSecondary: "#4a4a4a",
  textMuted: "#6b7280",
  border: "#e5e7eb",
};

const logoUrl = "https://ytembomoyhuwdtrzlwbi.supabase.co/storage/v1/object/public/email-assets/logo-blue.png?v=1";
const portalReviewUrl = "https://vibeplanner.enzym3entertainment.vip/app/review";
const defaultGoogleReviewUrl = "https://g.page/r/enzym3entertainment/review";

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate webhook secret (fail-closed)
    const webhookSecret = Deno.env.get("N8N_WEBHOOK_SECRET");
    if (!webhookSecret) {
      console.error("N8N_WEBHOOK_SECRET not configured");
      return new Response(JSON.stringify({ error: "Service unavailable" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const incomingSecret = req.headers.get("x-webhook-secret");
    if (incomingSecret !== webhookSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const parseResult = ReviewRequestSchema.safeParse(body);

    if (!parseResult.success) {
      console.error("Invalid request:", parseResult.error.flatten());
      return new Response(JSON.stringify({ error: "Invalid request format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = parseResult.data;
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    const formattedDate = new Date(data.event_date + 'T12:00:00').toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const googleUrl = data.google_review_url || defaultGoogleReviewUrl;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: ${brandColors.textPrimary}; margin: 0; padding: 0; background-color: ${brandColors.background};">
          <div style="background-color: ${brandColors.header}; padding: 30px 20px; text-align: center;">
            <img src="${logoUrl}" alt="Enzym3 Entertainment" width="180" style="max-width: 100%; height: auto;" />
          </div>
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: ${brandColors.white}; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <div style="font-size: 24px; font-weight: 600; margin-bottom: 20px;">
                Hey ${data.couple_name}! 🎉
              </div>
              <p style="font-size: 16px; color: ${brandColors.textSecondary};">
                Hope you're still riding that post-${data.event_type} high! It was an absolute blast being part of your special day on ${formattedDate}.
              </p>
              <p style="font-size: 16px; color: ${brandColors.textSecondary};">
                If you have a moment, I'd love to hear how everything went. Your feedback helps me keep the vibes going for future couples!
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${portalReviewUrl}" style="display: inline-block; background: linear-gradient(135deg, ${brandColors.header}, ${brandColors.headerDark}); color: white !important; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                  Leave a Review in Your Portal ⭐
                </a>
              </div>

              <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;">
                <p style="font-size: 14px; color: ${brandColors.textMuted}; margin: 0 0 12px 0;">
                  You can also help us out on Google:
                </p>
                <a href="${googleUrl}" style="color: ${brandColors.accent}; font-weight: 600; text-decoration: none; font-size: 15px;">
                  Leave a Google Review →
                </a>
              </div>

              <p style="font-size: 16px; color: ${brandColors.textSecondary};">
                Thanks for choosing Enzym3 — it truly means the world! 💙
              </p>

              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid ${brandColors.border};">
                <div style="font-size: 16px; font-weight: 600;">— JJ</div>
                <div style="font-size: 14px; color: ${brandColors.accent}; font-weight: 500;">Enzym3 Entertainment</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResult = await resend.emails.send({
      from: "JJ at Enzym3 Entertainment <reviews@enzym3entertainment.vip>",
      to: [data.contact_email],
      subject: `⭐ ${data.couple_name}, how was your ${data.event_type}?`,
      html: htmlContent,
    });

    if (emailResult.error) {
      console.error("Error sending review request email:", emailResult.error);
      return new Response(JSON.stringify({ error: "Failed to send email" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Review request email sent:", emailResult.data);

    return new Response(JSON.stringify({ success: true, email_id: emailResult.data?.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in send-review-request:", error);
    return new Response(JSON.stringify({ error: "Failed to process request" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
