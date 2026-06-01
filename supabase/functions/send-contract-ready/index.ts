import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function esc(s: string | null | undefined): string {
  return (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "TBD";
  try {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendKey = Deno.env.get("RESEND_API_KEY");

    if (!resendKey) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Verify JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const jwt = authHeader.replace("Bearer ", "");

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { wedding_id } = await req.json() as { wedding_id: string };

    if (!wedding_id) {
      return new Response(
        JSON.stringify({ error: "wedding_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Look up event
    const { data: event, error: eventError } = await supabase
      .from("event_notification_history")
      .select("id, couple_name, contact_email, event_date, event_type, venue")
      .eq("id", wedding_id)
      .maybeSingle();

    if (eventError || !event) {
      return new Response(
        JSON.stringify({ error: "Event not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!event.contact_email) {
      return new Response(
        JSON.stringify({ error: "Event has no contact email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const contractLink = "https://app.enzym3.com/app/contract";
    const formattedDate = formatDate(event.event_date);

    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Your Enzym3 contract is ready to sign</title></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;">
        <!-- Header -->
        <tr>
          <td style="background:#2D2921;padding:32px 40px;text-align:center;">
            <p style="margin:0;color:#ffffff;font-size:24px;font-weight:bold;letter-spacing:1px;">Enzym3 Entertainment</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 16px;font-size:18px;color:#2D2921;font-weight:bold;">Hi ${esc(event.couple_name || "there")},</p>
            <p style="margin:0 0 24px;font-size:15px;color:#444;line-height:1.6;">
              Great news — your Enzym3 Entertainment contract is ready for your review and signature. Please sign at your earliest convenience to secure your booking.
            </p>
            <table cellpadding="0" cellspacing="0" style="background:#f9f6f2;border-radius:6px;padding:20px;margin-bottom:24px;width:100%;">
              <tr><td style="padding:6px 0;">
                <p style="margin:0;font-size:14px;color:#666;">Event Date</p>
                <p style="margin:4px 0 0;font-size:15px;color:#2D2921;font-weight:bold;">${esc(formattedDate)}</p>
              </td></tr>
              ${event.event_type ? `<tr><td style="padding:6px 0;">
                <p style="margin:0;font-size:14px;color:#666;">Event Type</p>
                <p style="margin:4px 0 0;font-size:15px;color:#2D2921;font-weight:bold;">${esc(event.event_type)}</p>
              </td></tr>` : ""}
              ${event.venue ? `<tr><td style="padding:6px 0;">
                <p style="margin:0;font-size:14px;color:#666;">Venue</p>
                <p style="margin:4px 0 0;font-size:15px;color:#2D2921;font-weight:bold;">${esc(event.venue)}</p>
              </td></tr>` : ""}
            </table>
            <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td style="background:#2D2921;border-radius:6px;padding:14px 28px;">
                  <a href="${esc(contractLink)}" style="color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;">Review &amp; Sign Contract</a>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 16px;font-size:14px;color:#666;line-height:1.6;">
              <strong style="color:#444;">Cancellation policy reminder:</strong> Per our agreement, cancellations made within 14 days of the event are subject to full payment. Please review the full terms in your contract.
            </p>
            <p style="margin:0;font-size:13px;color:#888;line-height:1.6;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${esc(contractLink)}" style="color:#2D2921;">${esc(contractLink)}</a>
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f9f6f2;padding:24px 40px;text-align:center;">
            <p style="margin:0;font-size:13px;color:#888;">(520) 406-8600 &bull; booking@enzym3.com</p>
            <p style="margin:8px 0 0;font-size:12px;color:#aaa;">&copy; 2026 Enzym3 Entertainment</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Enzym3 Entertainment <booking@enzym3.com>",
        to: event.contact_email,
        subject: "Your Enzym3 contract is ready to sign",
        html,
      }),
    });

    if (!emailRes.ok) {
      const errBody = await emailRes.text();
      console.error("Resend error:", errBody);
      return new Response(
        JSON.stringify({ error: "Failed to send email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("send-contract-ready error:", err instanceof Error ? err.message : "Unknown error");
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
