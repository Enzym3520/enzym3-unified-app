import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function replaceMergeTags(text: string, vars: Record<string, string>): string {
  let result = text;
  for (const [key, value] of Object.entries(vars)) {
    result = result.split(key).join(value);
  }
  return result;
}

function sanitizeHtml(html: string): string {
  // Strip <script>, <iframe>, <object>, <embed>, <form> tags and on* event handlers
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<iframe[\s\S]*?\/?>/gi, "")
    .replace(/<object[\s\S]*?<\/object>/gi, "")
    .replace(/<embed[\s\S]*?\/?>/gi, "")
    .replace(/<form[\s\S]*?<\/form>/gi, "")
    .replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/\bon\w+\s*=\s*\S+/gi, "")
    .replace(/javascript\s*:/gi, "");
}

function generateCustomEmailHtml(template: any, mergeVars: Record<string, string>): string {
  const greeting = replaceMergeTags(template.greeting || "", mergeVars);
  const rawBodyHtml = replaceMergeTags(template.body_html || "", mergeVars);
  const bodyHtml = sanitizeHtml(rawBodyHtml);
  const signoff = replaceMergeTags(template.signoff_text || "", mergeVars);
  const brandColor = template.brand_color || "#85D4FA";
  const ctaText = template.cta_text || "";
  const ctaUrl = template.cta_url || "#";
  const contactName = template.contact_name || "";
  const contactEmail = template.contact_email || "";
  const contactPhone = template.contact_phone || "";
  const logoUrl = template.logo_url || "";

  const logoHtml = logoUrl
    ? `<img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(contactName)}" width="200" style="display: block; margin: 0 auto;" />`
    : `<div style="font-size: 24px; font-weight: 600; color: ${brandColor};">${escapeHtml(contactName)}</div>`;

  const ctaHtml = ctaText
    ? `<div style="text-align: center; margin: 24px 0;">
        <a href="${escapeHtml(ctaUrl)}" style="display: inline-block; background-color: ${brandColor}; color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 30px; font-weight: 600; font-size: 16px;">${escapeHtml(ctaText)}</a>
      </div>`
    : "";

  const contactLines = [
    contactName ? `<strong>${escapeHtml(contactName)}</strong>` : "",
    contactEmail ? `<a href="mailto:${escapeHtml(contactEmail)}" style="color: ${brandColor}; text-decoration: none;">${escapeHtml(contactEmail)}</a>` : "",
    contactPhone ? escapeHtml(contactPhone) : "",
  ].filter(Boolean).join("<br>");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f0;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden;">
          <tr>
            <td align="center" style="padding: 40px 30px 24px; background-color: ${brandColor}20;">
              ${logoHtml}
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 36px 0;">
              <p style="color: #2D2921; font-size: 15px; line-height: 1.7; margin: 0 0 16px; font-weight: 500;">
                ${escapeHtml(greeting)}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 36px;">
              <div style="color: #4b4540; font-size: 15px; line-height: 1.7;">
                ${bodyHtml}
              </div>
              ${ctaHtml}
              <p style="color: #4b4540; font-size: 15px; line-height: 1.7; margin: 16px 0 28px;">
                ${escapeHtml(signoff)}
              </p>
              ${contactLines ? `<div style="border-top: 1px solid #e5e0d8; padding-top: 20px; margin-bottom: 32px;">
                <p style="color: #2D2921; font-size: 14px; line-height: 1.8; margin: 0;">${contactLines}</p>
              </div>` : ""}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Fallback hardcoded Enzym3 template
function generateFallbackEmailHtml(clientName: string, eventDate: string, eventType: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;">
    <tr><td align="center" style="padding:40px 20px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:32px 36px;">
          <h1 style="font-size:24px;color:#2D2921;margin:0 0 16px;">Welcome!</h1>
          <p style="color:#4b4540;font-size:15px;line-height:1.7;">Hey <strong>${escapeHtml(clientName)}</strong>,</p>
          <p style="color:#4b4540;font-size:15px;line-height:1.7;">Thank you for booking! We're excited to be part of your ${escapeHtml(eventType)} on <strong>${formatDate(eventDate)}</strong>.</p>
          <p style="color:#4b4540;font-size:15px;line-height:1.7;">We'll be in touch soon with next steps.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate user
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: authUser }, error: authError } = await userClient.auth.getUser();
    if (authError || !authUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = authUser.id;

    const body = await req.json();
    const { eventId, bookingRequestId } = body;

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // ---- Path A: Send to a booking request (new flow) ----
    if (bookingRequestId) {
      // Get booking request
      const { data: booking, error: bookingErr } = await adminClient
        .from("booking_requests")
        .select("*")
        .eq("id", bookingRequestId)
        .eq("vendor_id", userId)
        .single();

      if (bookingErr || !booking) {
        return new Response(JSON.stringify({ error: "Booking request not found or not yours" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get vendor's custom template
      const { data: template } = await adminClient
        .from("vendor_email_templates")
        .select("*")
        .eq("vendor_id", userId)
        .maybeSingle();

      // Get vendor profile for name + vendor_type
      const { data: vendorProfile } = await adminClient
        .from("profiles")
        .select("first_name, last_name, company_name, vendor_type")
        .eq("id", userId)
        .single();

      const vendorName = vendorProfile?.company_name ||
        `${vendorProfile?.first_name || ""} ${vendorProfile?.last_name || ""}`.trim() ||
        "Your Vendor";

      // Generate invite token for Vibe Planner join flow
      const PORTAL_URL = "https://plan.enzym3entertainment.vip";
      const { data: tokenRow, error: tokenErr } = await adminClient
        .from("booking_invite_tokens")
        .insert({
          booking_request_id: bookingRequestId,
          vendor_id: userId,
          vendor_type: vendorProfile?.vendor_type || null,
          client_email: booking.client_email,
          client_name: booking.client_name || "Client",
          event_date: booking.event_date || null,
          event_type: booking.event_type || null,
        })
        .select("token")
        .single();

      if (tokenErr) {
        console.error("Token creation error:", tokenErr);
      }

      // Generate VC- code for Vendor Client Portal registration
      const vcCode = "VC-" + Array.from(crypto.getRandomValues(new Uint8Array(4)))
        .map(b => b.toString(36).toUpperCase().padStart(2, "0"))
        .join("")
        .slice(0, 8);

      const { error: vcErr } = await adminClient
        .from("vendor_client_invitations")
        .insert({
          code: vcCode,
          vendor_id: userId,
          vendor_type: vendorProfile?.vendor_type || "other",
          client_email: booking.client_email,
          client_name: booking.client_name || "Client",
          event_date: booking.event_date || null,
          event_type: booking.event_type || null,
          booking_request_id: bookingRequestId,
        });

      if (vcErr) {
        console.error("VC invitation creation error:", vcErr);
      }

      // Use VC- code URL as the primary invite link
      const inviteUrl = `${PORTAL_URL}/register?code=${vcCode}`;

      const mergeVars: Record<string, string> = {
        "{{client_name}}": booking.client_name || "there",
        "{{event_date}}": booking.event_date ? formatDate(booking.event_date) : "your event",
        "{{event_type}}": booking.event_type || "event",
        "{{vendor_name}}": vendorName,
      };

      let html: string;
      let subject: string;

      if (template) {
        const templateWithCta = {
          ...template,
          cta_url: template.cta_url || inviteUrl,
          cta_text: template.cta_text || "Get Started",
        };
        html = generateCustomEmailHtml(templateWithCta, mergeVars);
        subject = replaceMergeTags(template.subject_template || "Welcome!", mergeVars);
      } else {
        html = generateFallbackEmailHtml(
          booking.client_name || "there",
          booking.event_date || "",
          booking.event_type || "event"
        );
        subject = `Welcome, ${booking.client_name}!`;
      }

      const fromEmail = template?.contact_email
        ? `${template.contact_name || vendorName} <${template.contact_email}>`
        : `${vendorName} <booking@enzym3entertainment.vip>`;

      const recipients = [booking.client_email];

      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: recipients,
          subject,
          html,
        }),
      });

      const resendData = await resendRes.json();

      if (!resendRes.ok) {
        console.error("Resend error:", resendData);
        return new Response(JSON.stringify({ error: "Failed to send email", details: resendData }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({ success: true, recipients, resendId: resendData.id, inviteToken: tokenRow?.token || null }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ---- Path B: Legacy eventId flow (existing behavior) ----
    if (!eventId) {
      return new Response(JSON.stringify({ error: "eventId or bookingRequestId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify vendor is assigned
    const { data: assignment, error: assignErr } = await adminClient
      .from("event_dj_assignments")
      .select("id, status")
      .eq("event_id", eventId)
      .eq("dj_user_id", userId)
      .maybeSingle();

    if (assignErr || !assignment) {
      return new Response(JSON.stringify({ error: "You are not assigned to this event" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get event data
    const { data: event, error: eventErr } = await adminClient
      .from("event_notification_history")
      .select("*")
      .eq("id", eventId)
      .single();

    if (eventErr || !event) {
      return new Response(JSON.stringify({ error: "Event not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get couple code
    const { data: codeRow } = await adminClient
      .from("couple_codes")
      .select("code")
      .eq("wedding_id", eventId)
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const coupleCode = codeRow?.code || "";
    if (!coupleCode) {
      return new Response(JSON.stringify({ error: "No couple code found for this event." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Try custom template first
    const { data: template } = await adminClient
      .from("vendor_email_templates")
      .select("*")
      .eq("vendor_id", userId)
      .maybeSingle();

    const { data: vendorProfile } = await adminClient
      .from("profiles")
      .select("first_name, last_name, company_name")
      .eq("id", userId)
      .single();

    const vendorName = vendorProfile?.company_name ||
      `${vendorProfile?.first_name || ""} ${vendorProfile?.last_name || ""}`.trim() ||
      "Your Vendor";

    // Collect recipients
    const emails = new Set<string>();
    [event.contact_email, event.bride_email, event.groom_email].forEach((e: string | null) => {
      if (e && e.includes("@")) emails.add(e.toLowerCase().trim());
    });

    if (emails.size === 0) {
      return new Response(JSON.stringify({ error: "No valid email recipients found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const PORTAL_URL = "https://plan.enzym3entertainment.vip";
    const mergeVars: Record<string, string> = {
      "{{client_name}}": event.couple_name || "there",
      "{{event_date}}": formatDate(event.event_date),
      "{{event_type}}": (event.event_type || "event").toLowerCase(),
      "{{vendor_name}}": vendorName,
    };

    let html: string;
    let subject: string;

    if (template) {
      // Use custom template but inject couple code link as CTA URL if not set
      const templateWithCta = {
        ...template,
        cta_url: template.cta_url || `${PORTAL_URL}/register?code=${coupleCode}`,
      };
      html = generateCustomEmailHtml(templateWithCta, mergeVars);
      subject = replaceMergeTags(template.subject_template || "Welcome!", mergeVars);
    } else {
      html = generateFallbackEmailHtml(
        event.couple_name || "there",
        event.event_date,
        (event.event_type || "event").toLowerCase()
      );
      subject = `Let's Build Your Event, ${event.couple_name}! 🎶`;
    }

    const fromEmail = template?.contact_email
      ? `${template.contact_name || vendorName} <${template.contact_email}>`
      : `${vendorName} <booking@enzym3entertainment.vip>`;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: Array.from(emails),
        subject,
        html,
      }),
    });

    const resendData = await resendRes.json();

    if (!resendRes.ok) {
      console.error("Resend error:", resendData);
      return new Response(JSON.stringify({ error: "Failed to send email", details: resendData }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update resend count
    await adminClient
      .from("event_notification_history")
      .update({
        resend_count: (event.resend_count || 0) + 1,
        last_resent_at: new Date().toISOString(),
      })
      .eq("id", eventId);

    return new Response(
      JSON.stringify({ success: true, recipients: Array.from(emails), resendId: resendData.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-vendor-welcome-email error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
