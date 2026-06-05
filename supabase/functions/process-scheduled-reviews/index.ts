import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

function buildEmailHtml(brideFirstName: string, groomFirstName: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Enzym3 Entertainment</title>
</head>
<body style="margin:0;padding:0;background:#f4f1ea;font-family:Arial, Helvetica, sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f1ea;padding:40px 0;">
<tr>
<td align="center">
<table width="640" cellpadding="0" cellspacing="0" border="0"
style="background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,0.08);">
<tr>
<td style="background:#D6CFC2;padding:38px 30px;text-align:center;">
<img src="https://ytembomoyhuwdtrzlwbi.supabase.co/storage/v1/object/public/email-assets/logo-blue.png?v=1"
     alt="Enzym3 Entertainment" width="180" style="display:block;margin:0 auto;" />
</td>
</tr>
<tr>
<td style="padding:42px 48px 38px 48px;color:#2D2921;">
<h1 style="margin:0 0 12px 0;text-align:center;font-size:28px;line-height:1.2;color:#2D2921;font-family:Georgia, 'Times New Roman', serif;">
Thank You Again
</h1>
<div style="width:60px;height:8px;background:#85D4FA;margin:0 auto 28px auto;"></div>
<p style="margin:0 0 18px 0;font-size:16px;line-height:1.7;">
Hi ${brideFirstName} & ${groomFirstName}, this is JJ from Enzym3 Entertainment.
</p>
<p style="margin:0 0 18px 0;font-size:16px;line-height:1.7;">
I wanted to reach out and thank you again for having me at your wedding.
Being part of such a big moment in people's lives is something I never take for granted,
and I really appreciate you trusting me with your day!
</p>
<p style="margin:0 0 18px 0;font-size:16px;line-height:1.7;">
If you have a minute, I'd really appreciate a quick review.
</p>
<p style="margin:0 0 18px 0;font-size:16px;line-height:1.7;">
After you submit the review on my page, the next page will take you to a review
for our venue partner, Saguaro Buttes.
If you leave one there as well, feel free to mention my name
(DJ JJ / Enzym3 Entertainment).
</p>
<p style="margin:0 0 26px 0;font-size:16px;line-height:1.7;">
There's also a share option on the page if any friends or family from the wedding
would like to leave a review too.
</p>
<div style="text-align:center;margin:30px 0 32px 0;">
<a href="https://review.enzym3entertainment.com/"
style="display:inline-block;background:#85D4FA;color:#2D2921;text-decoration:none;font-size:16px;font-weight:bold;padding:16px 36px;border-radius:999px;">
Leave a Review
</a>
</div>
<p style="margin:0 0 18px 0;font-size:16px;line-height:1.7;">
Thank you again, and I hope married life has been treating you well!
</p>
<p style="margin:0;font-size:16px;line-height:1.7;">
– DJ JJ<br>
Enzym3 Entertainment
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const resendKey = Deno.env.get("RESEND_API_KEY")!;
  const cronSecret = Deno.env.get("CRON_SECRET");

  // AuthN: accept x-cron-secret or service-role bearer only. Anon key is NOT accepted.
  const providedCronSecret = req.headers.get("x-cron-secret");
  const authHeader = req.headers.get("Authorization") ?? "";
  const bearer = authHeader.replace(/^Bearer\s+/i, "");

  const authorized =
    (cronSecret && providedCronSecret === cronSecret) ||
    bearer === serviceKey;

  if (!authorized) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: rows, error: fetchError } = await supabase
      .from("vp_scheduled_review_emails")
      .select("*")
      .eq("status", "pending")
      .order("scheduled_batch", { ascending: true })
      .order("created_at", { ascending: true })
      .limit(20);

    if (fetchError) {
      throw new Error(`Fetch error: ${fetchError.message}`);
    }

    if (!rows || rows.length === 0) {
      return new Response(
        JSON.stringify({ message: "No pending emails to send" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${rows.length} scheduled review emails`);

    const results: Array<{ id: string; status: string; error?: string }> = [];

    for (const row of rows) {
      try {
        const html = buildEmailHtml(row.bride_first_name, row.groom_first_name);
        const subject = `⭐ ${row.bride_first_name} & ${row.groom_first_name} — We'd love your feedback!`;

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Enzym3 Entertainment <booking@enzym3entertainment.vip>",
            to: [row.email],
            subject,
            html,
          }),
        });

        if (!res.ok) {
          const errBody = await res.text();
          throw new Error(`Resend ${res.status}: ${errBody}`);
        }

        await supabase
          .from("vp_scheduled_review_emails")
          .update({ status: "sent", sent_at: new Date().toISOString() })
          .eq("id", row.id);

        results.push({ id: row.id, status: "sent" });
        console.log(`Sent review email to ${row.email}`);
      } catch (sendErr) {
        const errorMsg = sendErr instanceof Error ? sendErr.message : String(sendErr);
        await supabase
          .from("vp_scheduled_review_emails")
          .update({ status: "failed", error: errorMsg })
          .eq("id", row.id);

        results.push({ id: row.id, status: "failed", error: errorMsg });
        console.error(`Failed to send to ${row.email}: ${errorMsg}`);
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("process-scheduled-reviews error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
