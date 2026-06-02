import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json() as {
      name?: string;
      email?: string;
      phone?: string;
      eventDate?: string;
      eventType?: string;
      message?: string;
    };

    const { name, email, phone, eventDate, eventType, message } = body;

    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: "name, email, and message are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // --- Internal notification to booking team ---
    const internalHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: Arial, sans-serif; background: #f9f6f2; margin: 0; padding: 0; }
    .container { max-width: 560px; margin: 32px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: #2D2921; padding: 28px 32px; }
    .header h1 { color: #85D4FA; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { color: #DBD4C3; margin: 6px 0 0; font-size: 14px; }
    .body { padding: 28px 32px; }
    .field { margin-bottom: 18px; }
    .field label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #85D4FA; margin-bottom: 4px; }
    .field p { margin: 0; color: #2D2921; font-size: 15px; line-height: 1.5; }
    .message-box { background: #f9f6f2; border-left: 3px solid #85D4FA; padding: 14px 16px; border-radius: 0 6px 6px 0; }
    .footer { background: #f9f6f2; padding: 16px 32px; text-align: center; font-size: 12px; color: #2D2921; opacity: 0.5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Inquiry</h1>
      <p>Enzym3 Entertainment — Event Portal</p>
    </div>
    <div class="body">
      <div class="field">
        <label>Name</label>
        <p>${escapeHtml(name)}</p>
      </div>
      <div class="field">
        <label>Email</label>
        <p>${escapeHtml(email)}</p>
      </div>
      ${phone ? `<div class="field"><label>Phone</label><p>${escapeHtml(phone)}</p></div>` : ""}
      ${eventDate ? `<div class="field"><label>Event Date</label><p>${escapeHtml(eventDate)}</p></div>` : ""}
      ${eventType ? `<div class="field"><label>Event Type</label><p>${escapeHtml(eventType)}</p></div>` : ""}
      <div class="field">
        <label>Message</label>
        <div class="message-box"><p>${escapeHtml(message).replace(/\n/g, "<br>")}</p></div>
      </div>
    </div>
    <div class="footer">Reply directly to this email to respond to ${escapeHtml(name)}.</div>
  </div>
</body>
</html>
`;

    // --- Confirmation email to submitter ---
    const confirmationHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: Arial, sans-serif; background: #f9f6f2; margin: 0; padding: 0; }
    .container { max-width: 560px; margin: 32px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: #2D2921; padding: 28px 32px; }
    .header h1 { color: #85D4FA; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { color: #DBD4C3; margin: 6px 0 0; font-size: 14px; }
    .body { padding: 28px 32px; color: #2D2921; font-size: 15px; line-height: 1.7; }
    .body p { margin: 0 0 14px; }
    .contact-block { background: #f9f6f2; border-radius: 8px; padding: 16px 20px; margin-top: 20px; }
    .contact-block p { margin: 0; font-size: 14px; color: #2D2921; }
    .contact-block strong { color: #2D2921; }
    .footer { background: #f9f6f2; padding: 16px 32px; text-align: center; font-size: 12px; color: #2D2921; opacity: 0.5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Enzym3 Entertainment</h1>
      <p>We got your message!</p>
    </div>
    <div class="body">
      <p>Hi ${escapeHtml(name)},</p>
      <p>Thanks for reaching out — we received your inquiry and will be in touch soon. We typically respond within one business day.</p>
      <p>In the meantime, feel free to reach us directly:</p>
      <div class="contact-block">
        <p><strong>Phone:</strong> (520) 406-8600</p>
        <p><strong>Email:</strong> booking@enzym3entertainment.vip</p>
      </div>
    </div>
    <div class="footer">&copy; ${new Date().getFullYear()} Enzym3 Entertainment. All rights reserved.</div>
  </div>
</body>
</html>
`;

    const fromAddress = "Enzym3 Entertainment <booking@enzym3.com>";

    // Send internal notification
    const internalRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: "booking@enzym3entertainment.vip",
        reply_to: email,
        subject: `New Inquiry from ${name}`,
        html: internalHtml,
      }),
    });

    if (!internalRes.ok) {
      const errorBody = await internalRes.text();
      console.error("Resend internal email error:", internalRes.status, errorBody);
      return new Response(
        JSON.stringify({ error: "Failed to send notification email", details: errorBody }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Send confirmation to submitter (best-effort — don't fail the request if this errors)
    try {
      const confirmRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromAddress,
          to: email,
          subject: "We received your inquiry — Enzym3 Entertainment",
          html: confirmationHtml,
        }),
      });
      if (!confirmRes.ok) {
        console.warn("Confirmation email failed (non-fatal):", await confirmRes.text());
      }
    } catch (confirmErr) {
      console.warn("Confirmation email threw (non-fatal):", confirmErr);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("send-inquiry-email error:", err instanceof Error ? err.message : "Unknown error");
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
