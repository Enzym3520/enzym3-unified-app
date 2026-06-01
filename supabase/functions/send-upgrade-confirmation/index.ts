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

function formatPrice(price: number): string {
  return "$" + price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface UpgradeItem {
  name: string;
  price: number;
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

    const { wedding_id, session_id } = await req.json() as {
      wedding_id: string;
      session_id: string;
    };

    if (!wedding_id && !session_id) {
      return new Response(
        JSON.stringify({ error: "wedding_id or session_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Look up upgrade order — prefer session_id match, fall back to wedding_id with unpaid status
    let upgradeOrder = null;

    if (session_id) {
      const { data } = await supabase
        .from("upgrade_orders")
        .select("id, wedding_id, couple_name, selected_package, items, total_amount, payment_status, stripe_session_id, wedding_date")
        .eq("stripe_session_id", session_id)
        .maybeSingle();
      upgradeOrder = data;
    }

    if (!upgradeOrder && wedding_id) {
      const { data } = await supabase
        .from("upgrade_orders")
        .select("id, wedding_id, couple_name, selected_package, items, total_amount, payment_status, stripe_session_id, wedding_date")
        .eq("wedding_id", wedding_id)
        .neq("payment_status", "paid")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      upgradeOrder = data;
    }

    if (!upgradeOrder) {
      return new Response(
        JSON.stringify({ error: "Upgrade order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Update payment status to paid
    const { error: updateError } = await supabase
      .from("upgrade_orders")
      .update({ payment_status: "paid" })
      .eq("id", upgradeOrder.id);

    if (updateError) {
      console.error("Failed to update upgrade order:", updateError.message);
      return new Response(
        JSON.stringify({ error: "Failed to update order status" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Look up client info from event_notification_history
    const eventId = upgradeOrder.wedding_id || wedding_id;
    const { data: event, error: eventError } = await supabase
      .from("event_notification_history")
      .select("id, contact_email, couple_name, event_date")
      .eq("id", eventId)
      .maybeSingle();

    if (eventError || !event) {
      return new Response(
        JSON.stringify({ error: "Event not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!event.contact_email) {
      return new Response(
        JSON.stringify({ error: "Event has no contact email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Parse items — handle both string and already-parsed JSON
    let items: UpgradeItem[] = [];
    const rawItems = upgradeOrder.items;
    if (typeof rawItems === "string") {
      try {
        items = JSON.parse(rawItems) as UpgradeItem[];
      } catch {
        items = [];
      }
    } else if (Array.isArray(rawItems)) {
      items = rawItems as UpgradeItem[];
    }

    const coupleName = event.couple_name || upgradeOrder.couple_name || "there";
    const formattedEventDate = formatDate(event.event_date);
    const totalAmount = upgradeOrder.total_amount ?? 0;

    // Build itemized rows
    const itemRows = items.map((item) => `
      <tr>
        <td style="padding:8px 0;font-size:15px;color:#444;border-bottom:1px solid #eee;">${esc(item.name)}</td>
        <td style="padding:8px 0;font-size:15px;color:#2D2921;font-weight:bold;text-align:right;border-bottom:1px solid #eee;">${esc(formatPrice(item.price))}</td>
      </tr>`).join("");

    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Upgrade confirmed for your event!</title></head>
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
            <p style="margin:0 0 16px;font-size:18px;color:#2D2921;font-weight:bold;">Hi ${esc(coupleName)},</p>
            <p style="margin:0 0 24px;font-size:15px;color:#444;line-height:1.6;">
              Your upgrade payment has been received! Here's a summary of what's been added to your event.
            </p>
            <table cellpadding="0" cellspacing="0" style="background:#f9f6f2;border-radius:6px;padding:20px;margin-bottom:24px;width:100%;">
              <tr><td style="padding:6px 0;">
                <p style="margin:0;font-size:14px;color:#666;">Event Date</p>
                <p style="margin:4px 0 0;font-size:15px;color:#2D2921;font-weight:bold;">${esc(formattedEventDate)}</p>
              </td></tr>
            </table>
            <p style="margin:0 0 12px;font-size:16px;color:#2D2921;font-weight:bold;">Your Upgrades</p>
            <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:16px;">
              ${itemRows}
              <tr>
                <td style="padding:12px 0 0;font-size:16px;color:#2D2921;font-weight:bold;">Total</td>
                <td style="padding:12px 0 0;font-size:16px;color:#2D2921;font-weight:bold;text-align:right;">${esc(formatPrice(totalAmount))}</td>
              </tr>
            </table>
            <p style="margin:24px 0 0;font-size:15px;color:#444;line-height:1.6;">
              We're excited to make your event even more special. See you soon!
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

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Enzym3 Entertainment <booking@enzym3.com>",
        to: event.contact_email,
        subject: "Upgrade confirmed for your event!",
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
    console.error("send-upgrade-confirmation error:", err instanceof Error ? err.message : "Unknown error");
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
