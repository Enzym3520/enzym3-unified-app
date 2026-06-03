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

function safeLinkUrl(url: string): string {
  const n = url.trim().toLowerCase();
  if (!n.startsWith("https://") && !n.startsWith("http://")) return "";
  return url;
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

    // Verify JWT — staff member sending invite
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

    // Verify caller is staff (admin or super_admin)
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "super_admin"])
      .maybeSingle();

    if (!roleRow) {
      return new Response(
        JSON.stringify({ error: "Forbidden: staff access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { vendor_email, vendor_name, vendor_type, invite_code: providedCode } = await req.json() as {
      vendor_email: string;
      vendor_name: string;
      vendor_type?: string;
      invite_code?: string;
    };

    if (!vendor_email || !vendor_name) {
      return new Response(
        JSON.stringify({ error: "vendor_email and vendor_name are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!vendor_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vendor_email)) {
      return new Response(
        JSON.stringify({ error: "Invalid vendor_email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Generate invite code if not provided
    const invite_code: string = providedCode ??
      crypto.randomUUID().replace(/-/g, "").substring(0, 12).toUpperCase();

    // Save invite to booking_invite_tokens — best-effort, don't 500 if it fails
    const insertPayload: Record<string, string | undefined> = {
      token: invite_code,
      client_email: vendor_email,
      client_name: vendor_name,
    };
    if (vendor_type) {
      insertPayload.vendor_type = vendor_type;
    }
    const { error: insertError } = await supabase
      .from("booking_invite_tokens")
      .insert(insertPayload);
    if (insertError) {
      console.error("booking_invite_tokens insert error (non-fatal):", insertError.message);
    }

    // Build registration link
    const registrationLink = `https://app.enzym3.com/vendor/register?code=${encodeURIComponent(invite_code)}`;
    const safeLink = safeLinkUrl(registrationLink);

    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>You've been invited to join Enzym3 Entertainment's vendor network</title></head>
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
            <p style="margin:0 0 16px;font-size:18px;color:#2D2921;font-weight:bold;">Hi, ${esc(vendor_name)}!</p>
            <p style="margin:0 0 24px;font-size:15px;color:#444;line-height:1.6;">
              You've been invited to join the Enzym3 Entertainment vendor network. As part of our vendor network, you'll get access to upcoming events, client coordination tools, and more.
            </p>
            <p style="margin:0 0 24px;font-size:15px;color:#444;line-height:1.6;">
              Click the button below to complete your registration:
            </p>
            <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td style="background:#2D2921;border-radius:6px;padding:14px 28px;">
                  <a href="${safeLink ? esc(safeLink) : "#"}" style="color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;">Join the Vendor Network</a>
                </td>
              </tr>
            </table>
            <table cellpadding="0" cellspacing="0" style="background:#f9f6f2;border-radius:6px;padding:20px;margin-bottom:24px;width:100%;">
              <tr><td style="padding:6px 0;">
                <p style="margin:0;font-size:14px;color:#666;">Your Invite Code</p>
                <p style="margin:4px 0 0;font-size:18px;color:#2D2921;font-weight:bold;letter-spacing:2px;">${esc(invite_code)}</p>
              </td></tr>
            </table>
            <p style="margin:0;font-size:13px;color:#888;line-height:1.6;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              ${safeLink ? `<a href="${esc(safeLink)}" style="color:#2D2921;">${esc(registrationLink)}</a>` : esc(registrationLink)}
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f9f6f2;padding:24px 40px;text-align:center;">
            <p style="margin:0;font-size:13px;color:#888;">(520) 406-8600 &bull; booking@enzym3entertainment.vip</p>
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
        from: "Enzym3 Entertainment <booking@enzym3entertainment.vip>",
        to: vendor_email,
        subject: "You've been invited to join Enzym3 Entertainment's vendor network",
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
      JSON.stringify({ success: true, invite_code }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("send-vendor-invite error:", err instanceof Error ? err.message : "Unknown error");
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
