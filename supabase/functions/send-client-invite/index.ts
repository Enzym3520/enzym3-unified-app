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

Deno.serve(async (req: Request) => {
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

    const { wedding_id, client_email, client_name, invite_code: providedCode, is_venue_partner } = await req.json() as {
      wedding_id: string;
      client_email: string;
      client_name: string;
      invite_code?: string;
      is_venue_partner?: boolean;
    };

    if (!wedding_id || !client_email || !client_name) {
      return new Response(
        JSON.stringify({ error: "wedding_id, client_email, and client_name are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Look up event
    const { data: event, error: eventError } = await supabase
      .from("event_notification_history")
      .select("id, couple_name, contact_email, event_date, event_type, coordinator_name")
      .eq("id", wedding_id)
      .maybeSingle();

    if (eventError || !event) {
      return new Response(
        JSON.stringify({ error: "Event not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Resolve invite code
    let inviteCode = providedCode;
    if (!inviteCode) {
      const { data: codeRow } = await supabase
        .from("couple_codes")
        .select("code")
        .eq("wedding_id", wedding_id)
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      inviteCode = codeRow?.code ?? undefined;
    }

    if (!inviteCode) {
      return new Response(
        JSON.stringify({ error: "No invite code found for this event" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const inviteLink = `https://plan.enzym3entertainment.vip/join/${encodeURIComponent(inviteCode)}`;
    const formattedDate = formatDate(event.event_date);

    const venuePartner = is_venue_partner === true;

    const portalItems = venuePartner
      ? `<li style="padding:8px 0;border-bottom:1px solid #e5e0d8;font-size:14px;color:#4b4540;"><strong style="color:#2D2921;">Vibe Sheet</strong> — your must-plays, do-not-plays, and how you want each moment to feel</li>
         <li style="padding:8px 0;border-bottom:1px solid #e5e0d8;font-size:14px;color:#4b4540;"><strong style="color:#2D2921;">Upgrades</strong> — Ruby ($250) · Emerald ($500) · Sapphire ($1,000) + à la carte options</li>
         <li style="padding:8px 0;font-size:14px;color:#4b4540;"><strong style="color:#2D2921;">Schedule a call</strong> — book a planning meeting when you're ready</li>`
      : `<li style="padding:8px 0;border-bottom:1px solid #e5e0d8;font-size:14px;color:#4b4540;"><strong style="color:#2D2921;">Vibe Sheet</strong> — your must-plays, do-not-plays, and how you want each moment to feel</li>
         <li style="padding:8px 0;border-bottom:1px solid #e5e0d8;font-size:14px;color:#4b4540;"><strong style="color:#2D2921;">Contract</strong> — sign digitally, no printing needed</li>
         <li style="padding:8px 0;border-bottom:1px solid #e5e0d8;font-size:14px;color:#4b4540;"><strong style="color:#2D2921;">Deposit</strong> — pay your 50% deposit securely online</li>
         <li style="padding:8px 0;border-bottom:1px solid #e5e0d8;font-size:14px;color:#4b4540;"><strong style="color:#2D2921;">Upgrades</strong> — Ruby ($250) · Emerald ($500) · Sapphire ($1,000) + à la carte options</li>
         <li style="padding:8px 0;font-size:14px;color:#4b4540;"><strong style="color:#2D2921;">Schedule a call</strong> — book a planning meeting when you're ready</li>`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Your Enzym3 portal is ready</title></head>
<body style="margin:0;padding:0;background:#DBD4C3;font-family:'Poppins',Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#DBD4C3;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Logo -->
        <tr>
          <td style="background:#DBD4C3;padding:36px 40px;text-align:center;">
            <img src="https://mcusercontent.com/ceda7c82a77b57df5ca0efccc/images/68f041cd-3568-14f6-bd6f-e7306c3f526f.png"
                 alt="Enzym3 Entertainment" width="200"
                 style="display:block;margin:0 auto;max-width:100%;height:auto;" />
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            <h1 style="font-size:22px;color:#2D2921;margin:0 0 6px;font-weight:600;">Your portal is ready</h1>
            <div style="width:50px;height:3px;background:#85D4FA;margin:0 0 20px;"></div>

            <p style="margin:0 0 8px;font-size:15px;color:#2D2921;">Hey <strong>${esc(client_name)}</strong>,</p>
            <p style="margin:0 0 20px;font-size:15px;color:#4b4540;line-height:1.7;">
              Your big day is getting closer and I want to make sure we have everything dialed in before we get there.
            </p>

            <p style="margin:0 0 12px;font-size:15px;color:#4b4540;">Here's what's waiting for you inside your portal:</p>

            <ul style="list-style:none;padding:0;margin:0 0 24px;">
              ${portalItems}
            </ul>

            <!-- Event info -->
            <table cellpadding="0" cellspacing="0" style="background:#f9f6f2;border-radius:8px;padding:16px 20px;margin-bottom:24px;width:100%;">
              <tr><td style="padding:4px 0;">
                <p style="margin:0;font-size:13px;color:#888;">Event Date</p>
                <p style="margin:4px 0 0;font-size:15px;color:#2D2921;font-weight:600;">${esc(formattedDate)}</p>
              </td></tr>
              ${event.event_type ? `<tr><td style="padding:4px 0;">
                <p style="margin:0;font-size:13px;color:#888;">Event Type</p>
                <p style="margin:4px 0 0;font-size:15px;color:#2D2921;font-weight:600;">${esc(event.event_type)}</p>
              </td></tr>` : ""}
              ${event.coordinator_name ? `<tr><td style="padding:4px 0;">
                <p style="margin:0;font-size:13px;color:#888;">Your Coordinator</p>
                <p style="margin:4px 0 0;font-size:15px;color:#2D2921;font-weight:600;">${esc(event.coordinator_name)}</p>
              </td></tr>` : ""}
            </table>

            <!-- CTA -->
            <div style="text-align:center;margin-bottom:24px;">
              <a href="${esc(inviteLink)}"
                 style="display:inline-block;background:#85D4FA;color:#2D2921;padding:14px 36px;text-decoration:none;border-radius:30px;font-weight:600;font-size:15px;">
                Access Your Portal →
              </a>
            </div>

            <p style="margin:0 0 24px;font-size:13px;color:#888;line-height:1.6;text-align:center;">
              Button not working? <a href="${esc(inviteLink)}" style="color:#2D2921;">${esc(inviteLink)}</a>
            </p>

            <!-- Signature -->
            <div style="border-top:1px solid #e5e0d8;padding-top:16px;">
              <p style="margin:0;font-size:14px;color:#2D2921;line-height:1.8;">
                <strong>JJ | DJ Enzym3</strong><br>
                Enzym3 Entertainment · 520-406-8600<br>
                <a href="mailto:booking@enzym3entertainment.vip" style="color:#85D4FA;text-decoration:none;">booking@enzym3entertainment.vip</a>
              </p>
              <p style="margin:10px 0 0;font-size:13px;color:#4b4540;">Questions? Just reply here.</p>
            </div>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f9f6f2;padding:20px 40px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#aaa;">&copy; 2026 Enzym3 Entertainment · Tucson, AZ</p>
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
        from: "Enzym3 Entertainment <booking@enzym3entertainment.vip>",
        to: client_email,
        subject: "You're invited to your Enzym3 Entertainment portal",
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
    console.error("send-client-invite error:", err instanceof Error ? err.message : "Unknown error");
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
