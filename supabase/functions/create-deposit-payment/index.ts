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

    // Create supabase client with service role key for admin ops
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify the JWT to get the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { wedding_id, payment_type } = await req.json() as {
      wedding_id: string;
      payment_type: "deposit" | "full" | "balance";
    };

    if (!wedding_id) {
      return new Response(
        JSON.stringify({ error: "wedding_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Look up event — verify user is associated via couple_codes
    const { data: codeRow } = await supabase
      .from("couple_codes")
      .select("event_id")
      .eq("user_id", user.id)
      .eq("event_id", wedding_id)
      .maybeSingle();

    // Also allow if the contact_email matches
    const { data: event, error: eventError } = await supabase
      .from("event_notification_history")
      .select(
        "id, couple_name, total_price, hours_booked, hourly_rate, deposit_amount, balance_due, pricing_type, contact_email",
      )
      .eq("id", wedding_id)
      .maybeSingle();

    if (eventError || !event) {
      return new Response(
        JSON.stringify({ error: "Event not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Authorization: user must be linked via couple_codes OR contact_email matches
    const emailMatch = event.contact_email?.toLowerCase() === user.email?.toLowerCase();
    if (!codeRow && !emailMatch) {
      return new Response(
        JSON.stringify({ error: "You do not have access to this event" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Calculate amount in cents
    const hours = event.hours_booked ?? 0;
    const hourlyRate = event.hourly_rate ?? 0;
    const totalFromHours = hours * hourlyRate;
    const totalPrice = (event.total_price && event.total_price > 0)
      ? event.total_price
      : totalFromHours;

    const depositAmount = event.deposit_amount ?? Math.round(totalPrice * 0.5);
    const balanceAmount = event.balance_due ?? Math.max(0, totalPrice - (event.deposit_amount ?? Math.round(totalPrice * 0.5)));

    let amountCents: number;
    let description: string;

    switch (payment_type) {
      case "deposit":
        amountCents = depositAmount * 100;
        description = `Deposit for ${event.couple_name || "event"} — 50% of total`;
        break;
      case "full":
        amountCents = totalPrice * 100;
        description = `Full payment for ${event.couple_name || "event"}`;
        break;
      case "balance":
        amountCents = balanceAmount * 100;
        description = `Remaining balance for ${event.couple_name || "event"}`;
        break;
      default:
        amountCents = depositAmount * 100;
        description = `Deposit for ${event.couple_name || "event"}`;
    }

    if (amountCents <= 0) {
      return new Response(
        JSON.stringify({ error: "Invalid payment amount" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

    const origin = req.headers.get("origin") || "https://app.enzym3.com";

    // Create Stripe Checkout Session (NOT PaymentIntent)
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: description,
              description: `Enzym3 Entertainment — DJ Services`,
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/app/contract?payment=success&wedding_id=${wedding_id}`,
      cancel_url: `${origin}/app/contract?payment=cancelled`,
      metadata: {
        wedding_id,
        payment_type,
      },
      customer_email: user.email,
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("create-deposit-payment error:", err instanceof Error ? err.message : "Unknown error");
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
