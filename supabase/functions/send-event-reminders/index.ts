import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

// HTML escape helper — no external deps
function esc(s: string | null | undefined): string {
  return (s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// UTC-safe date arithmetic (no date-fns)
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split("T")[0];
}

function buildEmailHtml(event: Record<string, unknown>, daysUntil: number): string {
  const coupleName = esc(event.couple_name as string);
  const eventDate = esc(event.event_date as string);
  const eventType = esc(event.event_type as string);
  const venue = event.venue ? esc(event.venue as string) : null;
  const contractSigned = Boolean(event.contract_signed);
  const depositPaid = Boolean(event.deposit_paid);

  // Checklist items
  const checklistItems: string[] = [];
  if (!contractSigned) {
    checklistItems.push("Sign your contract");
  }
  if (!depositPaid) {
    checklistItems.push("Pay your deposit");
  }
  checklistItems.push("Complete your vibe sheet (music preferences)");

  const checklistHtml = checklistItems.length > 0
    ? `
      <div style="background:#f9f6f2;border-radius:8px;padding:20px 24px;margin:24px 0;">
        <p style="margin:0 0 12px;font-weight:600;color:#2D2921;font-size:15px;">Still to do:</p>
        <ul style="margin:0;padding-left:20px;color:#555;font-size:14px;line-height:1.8;">
          ${checklistItems.map((item) => `<li>${esc(item)}</li>`).join("")}
        </ul>
      </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${daysUntil} days until your event with Enzym3!</title>
</head>
<body style="margin:0;padding:0;background:#f4f0eb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f0eb;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#2D2921;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:0.5px;">
                Enzym3 Entertainment
              </h1>
              <p style="margin:8px 0 0;color:#c8b99a;font-size:14px;letter-spacing:1px;text-transform:uppercase;">
                Event Reminder
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">

              <h2 style="margin:0 0 16px;color:#2D2921;font-size:22px;font-weight:600;">
                ${daysUntil} day${daysUntil === 1 ? "" : "s"} to go, ${coupleName}!
              </h2>

              <p style="margin:0 0 20px;color:#555;font-size:15px;line-height:1.7;">
                We're excited to be part of your special day. Here's a quick reminder of your upcoming event details.
              </p>

              <!-- Event Details -->
              <div style="background:#faf8f5;border-left:4px solid #2D2921;border-radius:4px;padding:20px 24px;margin-bottom:24px;">
                <p style="margin:0 0 8px;font-size:14px;color:#888;text-transform:uppercase;letter-spacing:0.8px;font-weight:600;">Event Details</p>
                <p style="margin:4px 0;color:#2D2921;font-size:15px;"><strong>Date:</strong> ${eventDate}</p>
                <p style="margin:4px 0;color:#2D2921;font-size:15px;"><strong>Type:</strong> ${eventType}</p>
                ${venue ? `<p style="margin:4px 0;color:#2D2921;font-size:15px;"><strong>Venue:</strong> ${venue}</p>` : ""}
              </div>

              ${checklistHtml}

              <!-- Contact -->
              <div style="margin-top:28px;border-top:1px solid #ede8e0;padding-top:24px;">
                <p style="margin:0 0 8px;color:#2D2921;font-size:15px;font-weight:600;">Questions? We're here to help.</p>
                <p style="margin:0;color:#555;font-size:14px;line-height:1.7;">
                  Reach your coordinator at
                  <a href="tel:+15204068600" style="color:#2D2921;font-weight:600;">(520) 406-8600</a>
                  or
                  <a href="mailto:booking@enzym3.com" style="color:#2D2921;font-weight:600;">booking@enzym3.com</a>.
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#2D2921;padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#c8b99a;font-size:13px;">
                Enzym3 Entertainment &nbsp;•&nbsp; (520) 406-8600 &nbsp;•&nbsp;
                <a href="mailto:booking@enzym3.com" style="color:#c8b99a;">booking@enzym3.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Auth: check x-cron-secret if CRON_SECRET is configured
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret) {
    const providedSecret = req.headers.get("x-cron-secret");
    if (providedSecret !== cronSecret) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendApiKey = Deno.env.get("RESEND_API_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: "Supabase env vars not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  if (!resendApiKey) {
    return new Response(
      JSON.stringify({ error: "RESEND_API_KEY is not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const today = new Date().toISOString().split("T")[0];
    const targets = [1, 7, 14, 30].map((days) => ({
      days,
      date: addDays(today, days),
      reminderType: `event_reminder_${days}day`,
    }));

    const targetDates = targets.map((t) => t.date);

    // Query events on the target dates
    const { data: events, error: eventsError } = await supabase
      .from("event_notification_history")
      .select(
        "id, contact_email, couple_name, event_date, event_type, venue, contract_signed, deposit_paid, status",
      )
      .in("event_date", targetDates)
      .not("contact_email", "is", null)
      .neq("status", "cancelled")
      .gte("event_date", today);

    if (eventsError) {
      console.error("Error querying events:", eventsError);
      return new Response(
        JSON.stringify({ error: "Failed to query events", details: eventsError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let sent = 0;
    let skipped = 0;

    for (const event of events ?? []) {
      // Find which interval this event belongs to
      const target = targets.find((t) => t.date === event.event_date);
      if (!target) continue;

      const { days, reminderType, date: scheduledDate } = target;

      // Check if reminder already sent for this event+interval
      const { data: existingReminder } = await supabase
        .from("reminders")
        .select("id")
        .eq("contact_email", event.contact_email)
        .eq("reminder_type", reminderType)
        .eq("status", "completed")
        .eq("scheduled_date", scheduledDate)
        .maybeSingle();

      if (existingReminder) {
        console.log(
          `Skipping ${event.contact_email} — ${reminderType} already sent`,
        );
        skipped++;
        continue;
      }

      // Build and send the email
      const html = buildEmailHtml(event as Record<string, unknown>, days);
      const subject = `${days} day${days === 1 ? "" : "s"} until your event with Enzym3!`;

      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Enzym3 Entertainment <booking@enzym3.com>",
          to: event.contact_email,
          subject,
          html,
        }),
      });

      if (!resendRes.ok) {
        const errorBody = await resendRes.text();
        console.error(
          `Failed to send email to ${event.contact_email}:`,
          resendRes.status,
          errorBody,
        );
        // Continue to next event rather than aborting the whole run
        continue;
      }

      console.log(
        `Sent ${reminderType} to ${event.contact_email} (event: ${event.event_date})`,
      );

      // Record the sent reminder
      const { error: insertError } = await supabase.from("reminders").insert({
        contact_email: event.contact_email,
        contact_name: event.couple_name,
        channel: "email",
        reminder_type: reminderType,
        priority: "medium",
        status: "completed",
        scheduled_date: scheduledDate,
        sent_at: new Date().toISOString(),
      });

      if (insertError) {
        console.error(
          `Failed to record reminder for ${event.contact_email}:`,
          insertError.message,
        );
      }

      sent++;
    }

    return new Response(
      JSON.stringify({ success: true, sent, skipped, today, targetDates }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error(
      "send-event-reminders error:",
      err instanceof Error ? err.message : "Unknown error",
    );
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
