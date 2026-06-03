import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth: require valid JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendKey = Deno.env.get("RESEND_API_KEY");

    // Verify caller identity
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { contractId } = await req.json();
    if (!contractId) throw new Error("contractId is required");

    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch contract
    const { data: contract, error: cErr } = await supabase
      .from("vendor_contracts")
      .select("*, vendor:profiles!vendor_contracts_vendor_id_fkey(first_name, last_name, company_name)")
      .eq("id", contractId)
      .single();
    if (cErr || !contract) throw new Error("Contract not found");

    // Verify caller is the vendor who owns this contract
    if (contract.vendor_id !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!contract.signer_email) throw new Error("No client email on contract");

    // Build signing URL
    const appUrl = Deno.env.get("APP_URL") || "https://plan.enzym3entertainment.vip";
    const signUrl = `${appUrl}/sign/${contract.sign_token}`;

    const vendorName = contract.vendor
      ? `${contract.vendor.first_name ?? ""} ${contract.vendor.last_name ?? ""}`.trim()
      : "Your vendor";
    const companyName = contract.vendor?.company_name ?? "";

    const subject = `Contract Ready for Signature — ${contract.title}`;
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Contract Ready for Signature</h2>
        <p>Hi ${contract.signer_name ?? "there"},</p>
        <p>${vendorName}${companyName ? ` from ${companyName}` : ""} has sent you a contract to review and sign:</p>
        <p style="font-weight: bold; font-size: 16px;">${contract.title}</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${signUrl}" style="background-color: #dc2626; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
            Review &amp; Sign Contract
          </a>
        </div>
        <p style="color: #666; font-size: 13px;">If the button doesn't work, copy this link into your browser:<br/>${signUrl}</p>
      </div>
    `;

    // Update status to sent
    await supabase
      .from("vendor_contracts")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", contractId);

    // Send email via Resend (if key available)
    if (resendKey) {
      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Enzym3 Entertainment <booking@enzym3entertainment.vip>",
          to: [contract.signer_email],
          subject,
          html: htmlBody,
        }),
      });
      if (!emailRes.ok) {
        const errText = await emailRes.text();
        console.error("Resend error:", errText);
        // Still return success — contract is marked as sent
      }
    } else {
      console.log("No RESEND_API_KEY — skipping email. Sign URL:", signUrl);
    }

    return new Response(JSON.stringify({ success: true, signUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-contract-email error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
