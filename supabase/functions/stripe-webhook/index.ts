import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight (Stripe won't send this, but useful for debug testing)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Get raw body BEFORE any JSON parsing — required for signature verification
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!stripeSecretKey) {
    console.error("stripe-webhook: STRIPE_SECRET_KEY is not configured");
    return new Response(
      JSON.stringify({ error: "Stripe not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  if (!webhookSecret) {
    console.error("stripe-webhook: STRIPE_WEBHOOK_SECRET is not configured");
    return new Response(
      JSON.stringify({ error: "Webhook secret not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("stripe-webhook: Supabase credentials not configured");
    return new Response(
      JSON.stringify({ error: "Supabase not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  if (!signature) {
    console.error("stripe-webhook: Missing stripe-signature header");
    return new Response(
      JSON.stringify({ error: "Missing stripe-signature header" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  // Verify Stripe webhook signature
  const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Signature verification failed";
    console.error("stripe-webhook: Signature verification failed:", message);
    return new Response(
      JSON.stringify({ error: `Webhook signature verification failed: ${message}` }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  // Return 200 to Stripe immediately — process synchronously (Stripe waits up to 30s)
  // We process synchronously here since EdgeRuntime.waitUntil availability varies
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    await handleEvent(event, supabase);
  } catch (err) {
    // Log but don't let processing errors affect the 200 response to Stripe
    console.error("stripe-webhook: Event handling error:", err instanceof Error ? err.message : "Unknown error");
  }

  return new Response(
    JSON.stringify({ received: true }),
    { headers: { "Content-Type": "application/json" } },
  );
});

async function handleEvent(
  event: Stripe.Event,
  supabase: ReturnType<typeof createClient>,
): Promise<void> {
  console.log(`stripe-webhook: handling event type=${event.type} id=${event.id}`);

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutSessionCompleted(session, supabase);
      break;
    }
    default:
      console.log(`stripe-webhook: unhandled event type=${event.type} — ignoring`);
  }
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  supabase: ReturnType<typeof createClient>,
): Promise<void> {
  const weddingId = session.metadata?.wedding_id;

  if (!weddingId) {
    console.log(`stripe-webhook: checkout.session.completed has no wedding_id in metadata — session=${session.id}, skipping`);
    return;
  }

  // payment_type is set by create-deposit-payment (values: "deposit", "full", "balance")
  // create-upgrade-payment does NOT set payment_type — it sets order_type: "upgrade" instead
  const paymentType = session.metadata?.payment_type;

  // amount_total is in cents — convert to dollars
  if (session.amount_total === null || session.amount_total === undefined) {
    console.error(`stripe-webhook: amount_total is null for session ${session.id} — skipping`);
    return;
  }
  const amountPaidDollars = session.amount_total / 100;

  if (paymentType) {
    // Deposit / full / balance payment
    console.log(
      `stripe-webhook: deposit payment completed — wedding_id=${weddingId}, payment_type=${paymentType}, amount=$${amountPaidDollars}, session=${session.id}`,
    );

    const { data: existingEvent } = await supabase
      .from("event_notification_history")
      .select("deposit_paid")
      .eq("id", weddingId)
      .maybeSingle();

    if (existingEvent?.deposit_paid === true) {
      console.log(`stripe-webhook: deposit already processed for wedding_id=${weddingId}, skipping`);
      return;
    }

    const { error } = await supabase.functions.invoke("confirm-deposit", {
      body: {
        wedding_id: weddingId,
        amount_paid: amountPaidDollars,
        session_id: session.id,
      },
    });

    if (error) {
      console.error(
        `stripe-webhook: confirm-deposit failed for wedding_id=${weddingId}:`,
        error instanceof Error ? error.message : JSON.stringify(error),
      );
      // Don't throw — webhook already responded 200, log and continue
    } else {
      console.log(`stripe-webhook: confirm-deposit succeeded for wedding_id=${weddingId}`);
    }
  } else {
    // Upgrade order — no payment_type means this is an upgrade session
    console.log(
      `stripe-webhook: upgrade payment completed — wedding_id=${weddingId}, session=${session.id}`,
    );

    const { data: existingOrder } = await supabase
      .from("upgrade_orders")
      .select("payment_status")
      .eq("stripe_session_id", session.id)
      .maybeSingle();

    if (existingOrder?.payment_status === "paid") {
      console.log(`stripe-webhook: upgrade already processed for session ${session.id}, skipping`);
      return;
    }

    const { error } = await supabase.functions.invoke("send-upgrade-confirmation", {
      body: {
        wedding_id: weddingId,
        session_id: session.id,
      },
    });

    if (error) {
      console.error(
        `stripe-webhook: send-upgrade-confirmation failed for wedding_id=${weddingId}:`,
        error instanceof Error ? error.message : JSON.stringify(error),
      );
      // Don't throw — webhook already responded 200, log and continue
    } else {
      console.log(`stripe-webhook: send-upgrade-confirmation succeeded for wedding_id=${weddingId}`);
    }
  }
}
