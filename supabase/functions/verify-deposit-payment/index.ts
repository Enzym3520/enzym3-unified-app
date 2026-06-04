import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY")!;

    // Extract JWT from Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const jwt = authHeader.replace("Bearer ", "");

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify the JWT to get the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { wedding_id } = await req.json() as { wedding_id: string };

    if (!wedding_id) {
      return new Response(
        JSON.stringify({ error: "wedding_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Check DB first — stripe-webhook should have already set this
    const { data: eventRow } = await supabase
      .from('event_notification_history')
      .select('deposit_paid, deposit_amount')
      .eq('id', wedding_id)
      .maybeSingle();

    if (eventRow?.deposit_paid === true) {
      return new Response(
        JSON.stringify({ verified: true, amount_paid: eventRow.deposit_amount ?? 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

    // Search recent checkout sessions for this wedding_id in metadata
    // Stripe allows metadata search via list + filter
    const sessions = await stripe.checkout.sessions.list({
      limit: 100,
      expand: ["data.payment_intent"],
    });

    const matchingSession = sessions.data.find(
      (s) =>
        s.metadata?.wedding_id === wedding_id &&
        s.metadata?.payment_type === "deposit" &&
        s.payment_status === "paid",
    );

    if (!matchingSession) {
      return new Response(
        JSON.stringify({ verified: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Amount paid in dollars (Stripe returns cents)
    const amountPaid = (matchingSession.amount_total ?? 0) / 100;

    // Update event record to reflect deposit paid
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("event_notification_history")
      .update({
        deposit_paid: true,
        deposit_paid_at: now,
        deposit_amount: amountPaid,
      })
      .eq("id", wedding_id);

    if (updateError) {
      console.error("Failed to update deposit status:", updateError.message);
      // Still return verified: true since Stripe confirmed payment
    }

    return new Response(
      JSON.stringify({ verified: true, amount_paid: amountPaid }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("verify-deposit-payment error:", err instanceof Error ? err.message : "Unknown error");
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
