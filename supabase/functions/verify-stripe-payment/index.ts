import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) return json(503, { error: "Stripe not configured" });

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json(401, { error: "Unauthorized" });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller is admin/staff
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json(401, { error: "Unauthorized" });

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: roles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .limit(10);
    const allowed = (roles ?? []).some((r) =>
      ["admin", "moderator"].includes(r.role as string),
    );
    if (!allowed) return json(403, { error: "Forbidden" });

    const body = await req.json().catch(() => ({}));
    const eventId: string | undefined = body.event_id;
    if (!eventId || typeof eventId !== "string") {
      return json(400, { error: "event_id required" });
    }

    // Load event to know what's already marked
    const { data: evt, error: evtErr } = await admin
      .from("event_notification_history")
      .select("id, deposit_paid, balance_paid, stripe_payment_intent_id")
      .eq("id", eventId)
      .maybeSingle();
    if (evtErr) return json(500, { error: evtErr.message });
    if (!evt) return json(404, { error: "Event not found" });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Search Stripe checkout sessions by metadata.wedding_id
    // Stripe Search API supports metadata search on sessions.
    const search = await stripe.checkout.sessions.search({
      query: `metadata['wedding_id']:'${eventId}' AND status:'complete'`,
      limit: 20,
    });

    const sessions = search.data.filter((s) => s.payment_status === "paid");

    let depositFound = false;
    let balanceFound = false;
    let depositPi: string | null = null;
    let balancePi: string | null = null;

    for (const s of sessions) {
      const t = (s.metadata?.payment_type || "").toLowerCase();
      const pi = typeof s.payment_intent === "string" ? s.payment_intent : null;
      if (t === "deposit" || t === "full") {
        depositFound = true;
        depositPi = depositPi ?? pi;
      } else if (t === "balance") {
        balanceFound = true;
        balancePi = balancePi ?? pi;
      }
    }

    const update: Record<string, unknown> = {};
    if (depositFound && !evt.deposit_paid) {
      update.deposit_paid = true;
      update.deposit_paid_at = new Date().toISOString();
    }
    if (balanceFound && !evt.balance_paid) {
      update.balance_paid = true;
      update.balance_paid_at = new Date().toISOString();
    }
    if (!evt.stripe_payment_intent_id && (depositPi || balancePi)) {
      update.stripe_payment_intent_id = depositPi || balancePi;
    }

    if (Object.keys(update).length > 0) {
      const { error: upErr } = await admin
        .from("event_notification_history")
        .update(update)
        .eq("id", eventId);
      if (upErr) return json(500, { error: upErr.message });
    }

    return json(200, {
      ok: true,
      checked: sessions.length,
      deposit_found: depositFound,
      balance_found: balanceFound,
      updated: Object.keys(update),
      already: {
        deposit_paid: !!evt.deposit_paid,
        balance_paid: !!evt.balance_paid,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[verify-stripe-payment]", msg);
    return json(500, { error: msg });
  }
});
