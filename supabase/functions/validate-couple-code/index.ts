import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limit configuration: 10 attempts per IP per hour
const RATE_LIMIT_MAX_REQUESTS = 10;
const RATE_LIMIT_WINDOW_MINUTES = 60;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code } = await req.json();
    
    // Get client IP for rate limiting
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("cf-connecting-ip") || 
                     "unknown";
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    
    // Check rate limit before processing
    const endpoint = "validate-couple-code";
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString();
    
    const { data: existingLimit, error: limitError } = await supabase
      .from("rate_limits")
      .select("*")
      .eq("ip_address", clientIP)
      .eq("endpoint", endpoint)
      .gte("window_start", windowStart)
      .maybeSingle();
    
    if (limitError) {
      console.error("Rate limit check error:", limitError);
    } else if (existingLimit && existingLimit.request_count >= RATE_LIMIT_MAX_REQUESTS) {
      console.warn(`Rate limit exceeded for IP: ${clientIP.substring(0, 8)}*** on couple code validation`);
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: "Too many attempts. Please try again later.",
          retryAfter: RATE_LIMIT_WINDOW_MINUTES 
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "Retry-After": String(RATE_LIMIT_WINDOW_MINUTES * 60)
          } 
        }
      );
    }
    
    // Update rate limit counter
    if (existingLimit) {
      await supabase
        .from("rate_limits")
        .update({ request_count: existingLimit.request_count + 1 })
        .eq("id", existingLimit.id);
    } else {
      await supabase
        .from("rate_limits")
        .insert({
          ip_address: clientIP,
          endpoint: endpoint,
          request_count: 1,
          window_start: new Date().toISOString()
        });
    }

    if (!code || typeof code !== 'string') {
      return new Response(
        JSON.stringify({ error: "Code is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize: strip any known event-type prefix and match by suffix.
    // Accepts WED-, QCE-, SW16-, BDY-, BNQ-, GRD-, or bare codes (case-insensitive).
    const rawCode = code.trim().toUpperCase();
    // Sanitize: only alphanumeric and hyphens allowed to prevent .or() injection
    const safeCode = rawCode.replace(/[^A-Z0-9-]/g, '');
    const codeSuffix = safeCode.replace(/^(WED|QCE|SW16|BDY|BNQ|GRD)-/, '');

    // Match either the exact sanitized input or any stored code ending with -<suffix>
    const { data: coupleCode, error: codeError } = await supabase
      .from("couple_codes")
      .select(`id, code, wedding_id, expires_at, used_at, active`)
      .or(`code.eq.${safeCode},code.ilike.%-${codeSuffix}`)
      .maybeSingle();

    if (codeError) {
      console.error("Error fetching code:", codeError);
      return new Response(
        JSON.stringify({ error: "Failed to validate code" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generic error for all invalid/inactive/used/expired states — prevents enumeration
    if (!coupleCode || coupleCode.used_at || !coupleCode.active ||
        (coupleCode.expires_at && new Date(coupleCode.expires_at) < new Date())) {
      console.warn(`Invalid couple code attempt from IP: ${clientIP.substring(0, 8)}***`);
      return new Response(
        JSON.stringify({ valid: false, error: "Invalid or inactive code" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch only event_type (needed for UI routing) — no PII
    const { data: event, error: eventError } = await supabase
      .from("event_notification_history")
      .select("event_type")
      .eq("id", coupleCode.wedding_id)
      .single();

    if (eventError || !event) {
      console.error("Error fetching event:", eventError);
      return new Response(
        JSON.stringify({ valid: false, error: "Event information not found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return only event_type — no couple_name, venue, or event_date
    return new Response(
      JSON.stringify({
        valid: true,
        wedding: {
          event_type: event.event_type || 'wedding',
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error validating couple code:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
