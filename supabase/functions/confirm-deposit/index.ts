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

function formatDollars(dollars: number): string {
  return `$${(dollars).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Only allow internal service-role calls (from stripe-webhook).
  // supabase.functions.invoke() reliably sends the key as the `apikey` header;
  // it may also arrive as `Authorization: Bearer <key>` depending on client state.
  const authHeader = req.headers.get('Authorization') || '';
  const apiKeyHeader = req.headers.get('apikey') || '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const isServiceRole =
    authHeader === `Bearer ${serviceRoleKey}` ||
    apiKeyHeader === serviceRoleKey;

  if (!isServiceRole) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
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

    const { wedding_id, amount_paid, session_id, payment_type } = await req.json() as {
      wedding_id: string;
      amount_paid: number;
      session_id?: string;
      payment_type?: string;
    };

    if (!wedding_id || amount_paid == null) {
      return new Response(
        JSON.stringify({ error: "wedding_id and amount_paid are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Look up event
    const { data: event, error: eventError } = await supabase
      .from("event_notification_history")
      .select("id, couple_name, contact_email, event_date, event_type, venue, balance_due, total_price")
      .eq("id", wedding_id)
      .maybeSingle();

    if (eventError || !event) {
      return new Response(
        JSON.stringify({ error: "Event not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const isBalance = payment_type === "balance";

    const totalPrice = event.total_price ?? 0;
    const computedBalance = isBalance
      ? 0
      : totalPrice > 0
        ? Math.max(0, totalPrice - amount_paid)
        : (event.balance_due ?? 0);

    // Update event_notification_history: mark deposit or balance paid
    // Deposit path also writes balance_due so clients can see what they owe
    const updateFields = isBalance
      ? { balance_paid: true, balance_paid_at: new Date().toISOString(), balance_due: 0 }
      : {
          deposit_paid: true,
          deposit_paid_at: new Date().toISOString(),
          deposit_amount: amount_paid,
          ...(totalPrice > 0 ? { balance_due: Math.max(0, totalPrice - amount_paid) } : {}),
        };

    const { error: updateError } = await supabase
      .from("event_notification_history")
      .update(updateFields)
      .eq("id", wedding_id);

    if (updateError) {
      console.error("Update error:", updateError.message);
      return new Response(
        JSON.stringify({ error: "Failed to update event record" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const formattedDate = formatDate(event.event_date);
    const amountPaidStr = esc(formatDollars(amount_paid));
    const balanceDueStr = esc(formatDollars(computedBalance));
    const portalLink = "https://plan.enzym3entertainment.vip/app/contract";

    // --- Email 1: Client confirmation ---
    const clientHtml = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Deposit confirmed — you're all set!</title></head>
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
            <p style="margin:0 0 8px;font-size:22px;color:#2D2921;font-weight:bold;">${isBalance ? "Balance Received — You're Fully Paid!" : "You're all set!"}</p>
            <p style="margin:0 0 24px;font-size:15px;color:#444;line-height:1.6;">
              Hi ${esc(event.couple_name || "there")} — ${isBalance ? "your remaining balance has been received. Your event is fully paid. We can't wait to be part of your day!" : "your contract is signed and your deposit has been received. We can't wait to be part of your event!"}
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
              <tr><td style="padding:6px 0;">
                <p style="margin:0;font-size:14px;color:#666;">Deposit Paid</p>
                <p style="margin:4px 0 0;font-size:15px;color:#2D2921;font-weight:bold;">${amountPaidStr}</p>
              </td></tr>
              ${computedBalance > 0 ? `<tr><td style="padding:6px 0;">
                <p style="margin:0;font-size:14px;color:#666;">Remaining Balance</p>
                <p style="margin:4px 0 0;font-size:15px;color:#2D2921;font-weight:bold;">${balanceDueStr}</p>
              </td></tr>` : ""}
            </table>
            <p style="margin:0 0 16px;font-size:15px;color:#444;font-weight:bold;">Next steps:</p>
            <p style="margin:0 0 8px;font-size:15px;color:#444;line-height:1.6;">
              &bull; Fill out your vibe sheet in your client portal to help your DJ tailor the perfect experience.
            </p>
            <p style="margin:0 0 24px;font-size:15px;color:#444;line-height:1.6;">
              &bull; Log in any time to view your contract, track payments, and message your coordinator.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td style="background:#2D2921;border-radius:6px;padding:14px 28px;">
                  <a href="${esc(portalLink)}" style="color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;">Go to Your Portal</a>
                </td>
              </tr>
            </table>
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

    // --- Email 2: Coordinator notification ---
    const coordinatorHtml = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Deposit received: ${esc(event.couple_name || "")}</title></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;">
        <tr>
          <td style="background:#2D2921;padding:32px 40px;text-align:center;">
            <p style="margin:0;color:#ffffff;font-size:24px;font-weight:bold;letter-spacing:1px;">Enzym3 Entertainment</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 16px;font-size:18px;color:#2D2921;font-weight:bold;">Deposit Received</p>
            <p style="margin:0 0 24px;font-size:15px;color:#444;line-height:1.6;">
              A deposit has been received for the following event:
            </p>
            <table cellpadding="0" cellspacing="0" style="background:#f9f6f2;border-radius:6px;padding:20px;margin-bottom:24px;width:100%;">
              <tr><td style="padding:6px 0;">
                <p style="margin:0;font-size:14px;color:#666;">Client</p>
                <p style="margin:4px 0 0;font-size:15px;color:#2D2921;font-weight:bold;">${esc(event.couple_name || "—")}</p>
              </td></tr>
              <tr><td style="padding:6px 0;">
                <p style="margin:0;font-size:14px;color:#666;">Event Date</p>
                <p style="margin:4px 0 0;font-size:15px;color:#2D2921;font-weight:bold;">${esc(formattedDate)}</p>
              </td></tr>
              ${event.event_type ? `<tr><td style="padding:6px 0;">
                <p style="margin:0;font-size:14px;color:#666;">Event Type</p>
                <p style="margin:4px 0 0;font-size:15px;color:#2D2921;font-weight:bold;">${esc(event.event_type)}</p>
              </td></tr>` : ""}
              <tr><td style="padding:6px 0;">
                <p style="margin:0;font-size:14px;color:#666;">Amount Paid</p>
                <p style="margin:4px 0 0;font-size:15px;color:#2D2921;font-weight:bold;">${amountPaidStr}</p>
              </td></tr>
              ${session_id ? `<tr><td style="padding:6px 0;">
                <p style="margin:0;font-size:14px;color:#666;">Stripe Session</p>
                <p style="margin:4px 0 0;font-size:13px;color:#555;font-family:monospace;">${esc(session_id)}</p>
              </td></tr>` : ""}
            </table>
          </td>
        </tr>
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

    // Send both emails — collect errors but don't fail the whole request if coordinator email fails
    const emailErrors: string[] = [];

    // Client email
    if (event.contact_email) {
      const clientRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Enzym3 Entertainment <booking@enzym3entertainment.vip>",
          to: event.contact_email,
          subject: isBalance ? "Balance received — you're fully paid!" : "Contract signed and deposit confirmed — you're all set!",
          html: clientHtml,
        }),
      });
      if (!clientRes.ok) {
        const errBody = await clientRes.text();
        console.error("Resend client email error:", errBody);
        emailErrors.push("client");
      }
    }

    // Coordinator email (booking@enzym3entertainment.vip)
    const coordRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Enzym3 Entertainment <booking@enzym3entertainment.vip>",
        to: "booking@enzym3entertainment.vip",
        subject: isBalance ? `Balance received: ${event.couple_name || wedding_id}` : `Deposit received: ${event.couple_name || wedding_id}`,
        html: coordinatorHtml,
      }),
    });
    if (!coordRes.ok) {
      const errBody = await coordRes.text();
      console.error("Resend coordinator email error:", errBody);
      emailErrors.push("coordinator");
    }

    if (emailErrors.length === 2) {
      return new Response(
        JSON.stringify({ error: "Failed to send confirmation emails" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Push notification to client (fire-and-forget — don't block the response)
    supabase.rpc('get_user_id_by_email', { p_email: event.contact_email }).then(({ data: userId }) => {
      if (userId) {
        supabase.functions.invoke('send-push-notification', {
          body: {
            userId,
            title: isBalance ? 'Balance received — fully paid!' : 'Deposit confirmed — you\'re all set!',
            body: isBalance
              ? 'Your event is fully paid. We can\'t wait to celebrate with you!'
              : `$${amount_paid} deposit received. Log in to view your contract.`,
            url: '/app/contract',
            tag: 'payment',
          },
        }).catch(() => {/* non-critical */});
      }
    }).catch(() => {/* non-critical */});

    return new Response(
      JSON.stringify({ success: true, emailErrors: emailErrors.length > 0 ? emailErrors : undefined }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("confirm-deposit error:", err instanceof Error ? err.message : "Unknown error");
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
