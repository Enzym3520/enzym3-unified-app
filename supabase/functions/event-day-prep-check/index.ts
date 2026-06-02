import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

/**
 * Event Day Prep Check — Phase 1 of n8n Integration
 *
 * Called by n8n CRON (daily at 8 AM) or manually.
 * Returns upcoming events (next 48 hours by default) with readiness flags
 * so n8n can alert admins/vendors about missing items.
 *
 * Auth: validates CRON_SECRET header (not JWT-based — it's a machine-to-machine call)
 *
 * Query params:
 *   - hours_ahead: number of hours to look ahead (default 48)
 *   - include_ready: whether to include fully-ready events (default false)
 */

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── Auth: verify CRON_SECRET ──────────────────────────────────
    // Auth: only accept CRON_SECRET via dedicated x-cron-secret header
    // n8n should send: { "x-cron-secret": "<CRON_SECRET>" }
    const cronSecret = Deno.env.get("CRON_SECRET");
    const providedSecret = req.headers.get("x-cron-secret");

    if (!cronSecret || !providedSecret || providedSecret !== cronSecret) {
      console.error("[event-day-prep-check] Unauthorized request");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Parse optional query params ──────────────────────────────
    const url = new URL(req.url);
    const hoursAhead = parseInt(url.searchParams.get("hours_ahead") || "48", 10);
    const includeReady = url.searchParams.get("include_ready") === "true";

    console.log(`[event-day-prep-check] Checking events in next ${hoursAhead} hours, includeReady=${includeReady}`);

    // ── Supabase client (service role for full access) ───────────
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // ── Calculate date window ────────────────────────────────────
    const now = new Date();
    const cutoff = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);
    const todayStr = now.toISOString().split("T")[0];
    const cutoffStr = cutoff.toISOString().split("T")[0];

    console.log(`[event-day-prep-check] Window: ${todayStr} to ${cutoffStr}`);

    // ── Query via the secure RPC function ──────────────────────
    const { data: allEvents, error } = await supabase.rpc(
      "get_upcoming_event_readiness",
      {
        p_from_date: todayStr,
        p_limit: 200,
      }
    );

    if (error) {
      console.error("[event-day-prep-check] Query error:", error.message);
      return new Response(
        JSON.stringify({ error: "Database query failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Filter by cutoff date and readiness in code (RPC handles from_date)
    let events = (allEvents || []).filter(
      (evt: any) => evt.event_date <= cutoffStr
    );
    if (!includeReady) {
      events = events.filter((evt: any) => !evt.fully_ready);
    }

    if (error) {
      console.error("[event-day-prep-check] Query error:", error.message);
      return new Response(
        JSON.stringify({ error: "Database query failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Build structured response ────────────────────────────────
    const results = (events || []).map((evt: any) => {
      const missingItems: string[] = [];

      if (!evt.contract_signed) missingItems.push("contract_not_signed");
      if (!evt.deposit_paid) missingItems.push("deposit_not_paid");
      if (!evt.balance_paid && evt.balance_due && evt.balance_due > 0) missingItems.push("balance_not_paid");
      if (!evt.vendor_confirmed) missingItems.push("vendor_not_confirmed");
      if (!evt.music_sheet_submitted) missingItems.push("music_sheet_missing");
      if (!evt.vendor_files_uploaded) missingItems.push("vendor_files_not_uploaded");
      if (!evt.vendor_user_id) missingItems.push("no_vendor_assigned");

      // vendorName removed — PII minimization: n8n queries details on-demand

      return {
        event_id: evt.event_id,
        couple_name: evt.couple_name,
        event_date: evt.event_date,
        event_type: evt.event_type,
        venue: evt.venue,
        package_type: evt.package_type,
        guest_count: evt.guest_count,
        days_until_event: evt.days_until_event,
        fully_ready: evt.fully_ready,

        // Readiness breakdown (no PII — n8n queries details on-demand)
        readiness: {
          contract_signed: evt.contract_signed,
          deposit_paid: evt.deposit_paid,
          balance_paid: evt.balance_paid,
          vendor_confirmed: evt.vendor_confirmed,
          music_sheet_submitted: evt.music_sheet_submitted,
          vendor_files_uploaded: evt.vendor_files_uploaded,
        },

        missing_items: missingItems,

        // Minimal vendor/contact flags — n8n fetches full details only when needed
        has_vendor_assigned: !!evt.vendor_user_id,
        has_contact_info: !!evt.contact_email,
        has_music_sheet: !!evt.music_sheet_submitted,

        // Payment flags only (no amounts)
        payment: {
          deposit_paid: !!evt.deposit_paid,
          balance_paid: !!evt.balance_paid,
          has_stripe_payment: !!evt.stripe_payment_intent_id,
        },
      };
    });

    // ── Summary stats ────────────────────────────────────────────
    const summary = {
      total_events: results.length,
      fully_ready: results.filter((e: any) => e.fully_ready).length,
      needs_attention: results.filter((e: any) => !e.fully_ready).length,
      critical: results.filter(
        (e: any) => e.days_until_event <= 1 && !e.fully_ready
      ).length,
      checked_at: now.toISOString(),
      window_hours: hoursAhead,
    };

    console.log(
      `[event-day-prep-check] Found ${summary.total_events} events, ${summary.needs_attention} need attention, ${summary.critical} critical`
    );

    return new Response(
      JSON.stringify({ summary, events: results }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("[event-day-prep-check] Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
