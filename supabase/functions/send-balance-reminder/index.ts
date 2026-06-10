import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function esc(s: string | null | undefined): string {
  return (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(n);
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  } catch { return dateStr; }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const resendApiKey = Deno.env.get("RESEND_API_KEY");

  if (!resendApiKey) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Verify JWT is a valid admin user
  const admin = createClient(supabaseUrl, serviceKey);
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authErr } = await admin.auth.getUser(token);
  if (authErr || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: roleData } = await admin.from("user_roles").select("role").eq("user_id", user.id).in("role", ["admin", "coordinator"]).maybeSingle();
  if (!roleData) {
    return new Response(JSON.stringify({ error: "Staff access required" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const body = await req.json();
  const { event_id } = body;
  if (!event_id) {
    return new Response(JSON.stringify({ error: "event_id required" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Fetch event
  const { data: event, error: eventErr } = await admin
    .from("event_notification_history")
    .select("couple_name, contact_email, event_date, event_type, venue, balance_due, total_price, deposit_amount, deposit_paid, balance_paid, additional_metadata")
    .eq("id", event_id)
    .maybeSingle();

  if (eventErr || !event) {
    return new Response(JSON.stringify({ error: "Event not found" }), {
      status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!event.deposit_paid) {
    return new Response(JSON.stringify({ error: "Deposit has not been paid yet" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (event.balance_paid) {
    return new Response(JSON.stringify({ error: "Balance is already paid" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!event.contact_email) {
    return new Response(JSON.stringify({ error: "No email on file for this event" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const meta = (event.additional_metadata ?? {}) as Record<string, any>;
  const formData = meta.form_data ?? {};
  const balanceDue = event.balance_due ?? (Number(event.total_price ?? 0) - Number(event.deposit_amount ?? 0));
  const totalPrice = event.total_price ?? meta.totalPrice ?? formData.totalPrice;
  const coupleName = esc(event.couple_name);
  const eventDate = formatDate(event.event_date);
  const eventType = esc(event.event_type);
  const venue = event.venue ?? formData.venue;
  const portalUrl = "https://plan.enzym3entertainment.vip";

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Balance Due — Enzym3 Entertainment</title></head>
<body style="margin:0;padding:0;background:#f4f0eb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f0eb;padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
<tr><td style="background:#2D2921;padding:32px 40px;text-align:center;">
  <h1 style="margin:0;color:#fff;font-size:26px;font-weight:700;">Enzym3 Entertainment</h1>
  <p style="margin:8px 0 0;color:#c8b99a;font-size:14px;letter-spacing:1px;text-transform:uppercase;">Balance Due</p>
</td></tr>
<tr><td style="padding:40px;">
  <h2 style="margin:0 0 16px;color:#2D2921;font-size:22px;font-weight:600;">Hi ${coupleName},</h2>
  <p style="margin:0 0 20px;color:#555;font-size:15px;line-height:1.7;">
    Your deposit is confirmed — thank you! Your remaining balance is due before your event. Please complete your payment at your earliest convenience.
  </p>
  <div style="background:#faf8f5;border-left:4px solid #2D2921;border-radius:4px;padding:20px 24px;margin-bottom:24px;">
    <p style="margin:0 0 8px;font-size:14px;color:#888;text-transform:uppercase;letter-spacing:0.8px;font-weight:600;">Event Details</p>
    <p style="margin:4px 0;color:#2D2921;font-size:15px;"><strong>Date:</strong> ${eventDate}</p>
    <p style="margin:4px 0;color:#2D2921;font-size:15px;"><strong>Type:</strong> ${eventType}</p>
    ${venue ? `<p style="margin:4px 0;color:#2D2921;font-size:15px;"><strong>Venue:</strong> ${esc(venue)}</p>` : ""}
  </div>
  <div style="background:#fff8f0;border:2px solid #e8a045;border-radius:8px;padding:20px 24px;margin-bottom:28px;text-align:center;">
    <p style="margin:0 0 4px;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:0.8px;">Balance Due</p>
    <p style="margin:0;font-size:36px;font-weight:700;color:#2D2921;">${formatCurrency(balanceDue)}</p>
    ${totalPrice ? `<p style="margin:8px 0 0;font-size:13px;color:#888;">Total: ${formatCurrency(Number(totalPrice))} · Deposit paid: ${formatCurrency(Number(event.deposit_amount ?? 0))}</p>` : ""}
  </div>
  <div style="text-align:center;margin-bottom:28px;">
    <a href="${portalUrl}" style="display:inline-block;background:#2D2921;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">Pay Balance in Portal</a>
  </div>
  <div style="border-top:1px solid #ede8e0;padding-top:24px;">
    <p style="margin:0 0 8px;color:#2D2921;font-size:15px;font-weight:600;">Questions?</p>
    <p style="margin:0;color:#555;font-size:14px;line-height:1.7;">
      Call us at <a href="tel:+15204068600" style="color:#2D2921;font-weight:600;">(520) 406-8600</a> or email
      <a href="mailto:booking@enzym3entertainment.vip" style="color:#2D2921;font-weight:600;">booking@enzym3entertainment.vip</a>.
    </p>
  </div>
</td></tr>
<tr><td style="background:#2D2921;padding:20px 40px;text-align:center;">
  <p style="margin:0;color:#c8b99a;font-size:13px;">Enzym3 Entertainment &nbsp;•&nbsp; (520) 406-8600 &nbsp;•&nbsp;
    <a href="mailto:booking@enzym3entertainment.vip" style="color:#c8b99a;">booking@enzym3entertainment.vip</a>
  </p>
</td></tr>
</table></td></tr></table>
</body></html>`;

  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Enzym3 Entertainment <booking@enzym3entertainment.vip>",
      to: event.contact_email,
      subject: `Balance Due: ${formatCurrency(balanceDue)} — ${eventType} on ${event.event_date}`,
      html,
    }),
  });

  if (!resendRes.ok) {
    const err = await resendRes.text();
    console.error("Resend error:", err);
    return new Response(JSON.stringify({ error: "Failed to send email" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Log to reminders table
  await admin.from("reminders").insert({
    contact_email: event.contact_email,
    contact_name: event.couple_name,
    channel: "email",
    reminder_type: "balance_reminder",
    priority: "high",
    status: "completed",
    scheduled_date: new Date().toISOString().split("T")[0],
    sent_at: new Date().toISOString(),
  }).then(({ error }) => { if (error) console.error("Failed to log reminder:", error.message); });

  console.log(`Balance reminder sent to ${event.contact_email} for event ${event_id}`);
  return new Response(JSON.stringify({ success: true, sent_to: event.contact_email, balance_due: balanceDue }), {
    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
