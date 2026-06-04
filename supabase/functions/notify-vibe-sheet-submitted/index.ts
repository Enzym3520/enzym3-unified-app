import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, serviceKey);

    const { wedding_id } = await req.json() as { wedding_id: string };
    if (!wedding_id) {
      return new Response(JSON.stringify({ error: "wedding_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch event details
    const { data: event, error: eventErr } = await supabase
      .from("event_notification_history")
      .select("couple_name, event_date, event_type")
      .eq("id", wedding_id)
      .maybeSingle();

    if (eventErr || !event) {
      return new Response(JSON.stringify({ error: "Event not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get DJ email from assignment
    const { data: djAssignment } = await supabase
      .from('event_dj_assignments')
      .select('profiles(email)')
      .eq('event_id', wedding_id)
      .eq('status', 'confirmed')
      .maybeSingle();

    const djEmail = (djAssignment?.profiles as any)?.email || null;

    if (!resendKey) {
      console.warn("RESEND_API_KEY not set — skipping email notification");
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const coupleName = event.couple_name || "Unknown couple";
    const eventDate = event.event_date
      ? new Date(event.event_date).toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "TBD";

    const staffEmail = "booking@enzym3entertainment.vip";
    if (!djEmail) {
      console.warn("No confirmed DJ assignment found for event — skipping DJ email");
    }

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f9f6f2;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0"
  style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.08);">
  <tr>
    <td style="background:#2D2921;padding:28px 32px;text-align:center;">
      <p style="margin:0;color:#85D4FA;font-size:13px;letter-spacing:2px;text-transform:uppercase;font-weight:600;">Vibe Sheet Update</p>
      <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-family:Georgia,serif;">Client Submitted Their Vibe Sheet</h1>
    </td>
  </tr>
  <tr>
    <td style="padding:36px 40px;color:#2D2921;">
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">
        <strong>${coupleName}</strong> has submitted their vibe sheet for their event on <strong>${eventDate}</strong>.
      </p>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#555;">
        Their music preferences, song requests, and timeline details are ready for review.
      </p>
      <div style="text-align:center;margin:28px 0;">
        <a href="https://coordination.enzym3entertainment.vip/staff/coordinator-dashboard"
          style="display:inline-block;background:#85D4FA;color:#2D2921;text-decoration:none;
                 font-size:15px;font-weight:bold;padding:14px 32px;border-radius:999px;">
          View in Dashboard
        </a>
      </div>
    </td>
  </tr>
  <tr>
    <td style="background:#f9f6f2;padding:20px 40px;text-align:center;">
      <p style="margin:0;font-size:12px;color:#999;">&copy; ${new Date().getFullYear()} Enzym3 Entertainment &bull; (520) 406-8600</p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`;

    const recipients = [staffEmail];
    if (djEmail && djEmail !== staffEmail) recipients.push(djEmail);

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Enzym3 Entertainment <booking@enzym3entertainment.vip>",
        to: recipients,
        subject: `🎵 Vibe sheet submitted — ${coupleName} (${eventDate})`,
        html,
      }),
    });

    if (!emailRes.ok) {
      const err = await emailRes.text();
      console.error("Resend error:", err);
      return new Response(JSON.stringify({ error: "Failed to send email" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("notify-vibe-sheet-submitted error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
