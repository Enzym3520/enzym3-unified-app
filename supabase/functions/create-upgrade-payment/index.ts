import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CartItem {
  id: string;
  type: string;
  name: string;
  price: number;
  emeraldChoice?: string;
}

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

    // useUpgrades sends: { items, weddingId, coupleName }
    const { items, weddingId, coupleName } = await req.json() as {
      items: CartItem[];
      weddingId: string;
      coupleName?: string;
    };

    if (!items || items.length === 0) {
      return new Response(
        JSON.stringify({ error: "No items provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!weddingId) {
      return new Response(
        JSON.stringify({ error: "weddingId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Verify user has access to this event
    const { data: codeRow } = await supabase
      .from("couple_codes")
      .select("event_id")
      .eq("user_id", user.id)
      .eq("event_id", weddingId)
      .maybeSingle();

    const { data: event, error: eventError } = await supabase
      .from("event_notification_history")
      .select("id, contact_email, couple_name")
      .eq("id", weddingId)
      .maybeSingle();

    if (eventError || !event) {
      return new Response(
        JSON.stringify({ error: "Event not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const emailMatch = event.contact_email?.toLowerCase() === user.email?.toLowerCase();
    if (!codeRow && !emailMatch) {
      return new Response(
        JSON.stringify({ error: "You do not have access to this event" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

    const origin = req.headers.get("origin") || "https://app.enzym3.com";

    // Build Stripe line items from cart
    const lineItems = items.map((item) => {
      const unitAmount = Math.round(item.price * 100); // convert to cents
      const itemName = item.emeraldChoice
        ? `${item.name} Package (${item.emeraldChoice})`
        : item.name;

      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: itemName,
            description: `Enzym3 Entertainment — Upgrade for ${coupleName || event.couple_name || "your event"}`,
          },
          unit_amount: unitAmount,
        },
        quantity: 1,
      };
    });

    // Create Stripe Checkout Session (NOT PaymentIntent)
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: lineItems,
      success_url: `${origin}/app/upgrades?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/app/upgrades?payment=cancelled`,
      metadata: {
        wedding_id: weddingId,
        order_type: "upgrade",
      },
      customer_email: user.email,
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("create-upgrade-payment error:", err instanceof Error ? err.message : "Unknown error");
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
