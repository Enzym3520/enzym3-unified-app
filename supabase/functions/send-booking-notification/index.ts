import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate JWT and get caller identity
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { vendorEmail, vendorName, clientName, clientEmail, eventType, eventDate, message } =
      await req.json();

    if (!vendorEmail || !clientName) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is the vendor or an admin
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("email")
      .eq("id", user.id)
      .single();

    const { data: roles } = await supabaseClient.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (profile?.email !== vendorEmail && !roles) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.warn("[send-booking-notification] RESEND_API_KEY not configured — logging only");
      console.log(`[send-booking-notification] New booking request for ${vendorName} (${vendorEmail})`);
      console.log(`  From: ${clientName} <${clientEmail}>`);
      console.log(`  Event: ${eventType ?? "N/A"} on ${eventDate ?? "TBD"}`);
      console.log(`  Message: ${message ?? "No message"}`);
      return new Response(JSON.stringify({ success: true, stub: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:32px 36px;">
          <h1 style="font-size:22px;color:#2D2921;margin:0 0 16px;">New Booking Request</h1>
          <p style="color:#4b4540;font-size:15px;line-height:1.7;">Hey <strong>${vendorName}</strong>,</p>
          <p style="color:#4b4540;font-size:15px;line-height:1.7;">You've received a new booking request:</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <tr><td style="padding:8px 0;color:#888;width:120px;">Client</td><td style="padding:8px 0;font-weight:600;">${clientName}</td></tr>
            ${clientEmail ? `<tr><td style="padding:8px 0;color:#888;">Email</td><td style="padding:8px 0;">${clientEmail}</td></tr>` : ""}
            ${eventType ? `<tr><td style="padding:8px 0;color:#888;">Event Type</td><td style="padding:8px 0;">${eventType}</td></tr>` : ""}
            ${eventDate ? `<tr><td style="padding:8px 0;color:#888;">Date</td><td style="padding:8px 0;">${eventDate}</td></tr>` : ""}
          </table>
          ${message ? `<p style="color:#4b4540;font-size:15px;line-height:1.7;"><strong>Message:</strong><br/>${message}</p>` : ""}
          <p style="color:#4b4540;font-size:15px;line-height:1.7;">Please log in to your vendor portal to review this request.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Enzym3 Entertainment <booking@enzym3.com>",
        to: [vendorEmail],
        subject: `New Booking Request from ${clientName}${eventType ? ` - ${eventType}` : ""}`,
        html,
      }),
    });

    const resendData = await resendRes.json();
    if (!resendRes.ok) {
      console.error("[send-booking-notification] Resend error:", resendData);
      return new Response(JSON.stringify({ error: "Failed to send email", details: resendData }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, resendId: resendData.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[send-booking-notification] Error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
