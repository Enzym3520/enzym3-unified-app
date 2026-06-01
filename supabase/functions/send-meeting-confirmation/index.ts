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
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendKey = Deno.env.get("RESEND_API_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Supabase credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

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

    const {
      wedding_id,
      meeting_date,
      meeting_time,
      meeting_type,
      meeting_link,
      client_name,
      client_email,
    } = await req.json() as {
      wedding_id: string;
      meeting_date: string;
      meeting_time: string;
      meeting_type: string;
      meeting_link?: string;
      client_name?: string;
      client_email?: string;
    };

    if (!wedding_id || !meeting_date || !meeting_time || !meeting_type) {
      return new Response(
        JSON.stringify({ error: "wedding_id, meeting_date, meeting_time, and meeting_type are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Look up event if we need email or name, or always for event_date
    const { data: event, error: eventError } = await supabase
      .from("event_notification_history")
      .select("id, contact_email, couple_name, event_date")
      .eq("id", wedding_id)
      .maybeSingle();

    if (eventError || !event) {
      return new Response(
        JSON.stringify({ error: "Event not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const resolvedEmail = client_email || event.contact_email;
    const resolvedName = client_name || event.couple_name || "there";

    if (!resolvedEmail) {
      return new Response(
        JSON.stringify({ error: "No client email available" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const formattedEventDate = formatDate(event.event_date);
    const formattedMeetingDate = formatDate(meeting_date);

    const meetingLinkHtml = meeting_link
      ? `<tr><td style="padding:6px 0;">
          <p style="margin:0;font-size:14px;color:#666;">Meeting Link</p>
          <p style="margin:4px 0 0;font-size:15px;color:#2D2921;font-weight:bold;">
            <a href="${esc(meeting_link)}" style="color:#2D2921;">${esc(meeting_link)}</a>
          </p>
        </td></tr>`
      : "";

    // Client email HTML
    const clientHtml = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Meeting scheduled with Enzym3 Entertainment</title></head>
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
            <p style="margin:0 0 16px;font-size:18px;color:#2D2921;font-weight:bold;">Hi ${esc(resolvedName)},</p>
            <p style="margin:0 0 24px;font-size:15px;color:#444;line-height:1.6;">
              Your meeting with Enzym3 Entertainment has been scheduled. Here are the details:
            </p>
            <table cellpadding="0" cellspacing="0" style="background:#f9f6f2;border-radius:6px;padding:20px;margin-bottom:24px;width:100%;">
              <tr><td style="padding:6px 0;">
                <p style="margin:0;font-size:14px;color:#666;">Meeting Date</p>
                <p style="margin:4px 0 0;font-size:15px;color:#2D2921;font-weight:bold;">${esc(formattedMeetingDate)}</p>
              </td></tr>
              <tr><td style="padding:6px 0;">
                <p style="margin:0;font-size:14px;color:#666;">Meeting Time</p>
                <p style="margin:4px 0 0;font-size:15px;color:#2D2921;font-weight:bold;">${esc(meeting_time)}</p>
              </td></tr>
              <tr><td style="padding:6px 0;">
                <p style="margin:0;font-size:14px;color:#666;">Meeting Type</p>
                <p style="margin:4px 0 0;font-size:15px;color:#2D2921;font-weight:bold;">${esc(meeting_type)}</p>
              </td></tr>
              ${meetingLinkHtml}
            </table>
            <p style="margin:0;font-size:15px;color:#444;line-height:1.6;">
              See you soon! If you have any questions beforehand, feel free to reach out.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f9f6f2;padding:24px 40px;text-align:center;">
            <p style="margin:0;font-size:13px;color:#888;">(770) 312-9619 &bull; booking@enzym3.com</p>
            <p style="margin:8px 0 0;font-size:12px;color:#aaa;">&copy; 2026 Enzym3 Entertainment</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    // Coordinator notification HTML
    const coordMeetingLinkHtml = meeting_link
      ? `<tr><td style="padding:6px 0;">
          <p style="margin:0;font-size:14px;color:#666;">Meeting Link</p>
          <p style="margin:4px 0 0;font-size:15px;color:#2D2921;font-weight:bold;">
            <a href="${esc(meeting_link)}" style="color:#2D2921;">${esc(meeting_link)}</a>
          </p>
        </td></tr>`
      : "";

    const coordHtml = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Meeting booked: ${esc(resolvedName)}</title></head>
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
            <p style="margin:0 0 16px;font-size:18px;color:#2D2921;font-weight:bold;">New Meeting Booked</p>
            <p style="margin:0 0 24px;font-size:15px;color:#444;line-height:1.6;">
              A client has scheduled a meeting. Details below:
            </p>
            <table cellpadding="0" cellspacing="0" style="background:#f9f6f2;border-radius:6px;padding:20px;margin-bottom:24px;width:100%;">
              <tr><td style="padding:6px 0;">
                <p style="margin:0;font-size:14px;color:#666;">Client</p>
                <p style="margin:4px 0 0;font-size:15px;color:#2D2921;font-weight:bold;">${esc(resolvedName)}</p>
              </td></tr>
              <tr><td style="padding:6px 0;">
                <p style="margin:0;font-size:14px;color:#666;">Event Date</p>
                <p style="margin:4px 0 0;font-size:15px;color:#2D2921;font-weight:bold;">${esc(formattedEventDate)}</p>
              </td></tr>
              <tr><td style="padding:6px 0;">
                <p style="margin:0;font-size:14px;color:#666;">Meeting Date</p>
                <p style="margin:4px 0 0;font-size:15px;color:#2D2921;font-weight:bold;">${esc(formattedMeetingDate)}</p>
              </td></tr>
              <tr><td style="padding:6px 0;">
                <p style="margin:0;font-size:14px;color:#666;">Meeting Time</p>
                <p style="margin:4px 0 0;font-size:15px;color:#2D2921;font-weight:bold;">${esc(meeting_time)}</p>
              </td></tr>
              <tr><td style="padding:6px 0;">
                <p style="margin:0;font-size:14px;color:#666;">Meeting Type</p>
                <p style="margin:4px 0 0;font-size:15px;color:#2D2921;font-weight:bold;">${esc(meeting_type)}</p>
              </td></tr>
              ${coordMeetingLinkHtml}
            </table>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f9f6f2;padding:24px 40px;text-align:center;">
            <p style="margin:0;font-size:13px;color:#888;">(770) 312-9619 &bull; booking@enzym3.com</p>
            <p style="margin:8px 0 0;font-size:12px;color:#aaa;">&copy; 2026 Enzym3 Entertainment</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    // Send to client
    const clientEmailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Enzym3 Entertainment <booking@enzym3.com>",
        to: resolvedEmail,
        subject: "Meeting scheduled with Enzym3 Entertainment",
        html: clientHtml,
      }),
    });

    if (!clientEmailRes.ok) {
      const errBody = await clientEmailRes.text();
      console.error("Resend error (client):", errBody);
      return new Response(
        JSON.stringify({ error: "Failed to send client email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Send to coordinator
    const coordEmailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Enzym3 Entertainment <booking@enzym3.com>",
        to: "booking@enzym3.com",
        subject: `Meeting booked: ${resolvedName} — ${meeting_date}`,
        html: coordHtml,
      }),
    });

    if (!coordEmailRes.ok) {
      const errBody = await coordEmailRes.text();
      console.error("Resend error (coordinator):", errBody);
      // Non-fatal: client email succeeded, just log coordinator failure
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("send-meeting-confirmation error:", err instanceof Error ? err.message : "Unknown error");
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
