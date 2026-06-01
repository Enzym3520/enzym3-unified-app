import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { code } = await req.json() as { code?: string };

    if (!code || typeof code !== "string" || code.trim().length === 0) {
      return new Response(
        JSON.stringify({ valid: false, error: "Invite code is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // First: check dj_codes
    const { data: djRow, error: djDbError } = await supabase
      .from("dj_codes")
      .select("id, code, active, expires_at, used_at")
      .eq("code", code.trim())
      .maybeSingle();

    if (djDbError) {
      console.error("dj_codes lookup error:", djDbError.message);
      return new Response(
        JSON.stringify({ valid: false, error: "Something went wrong. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (djRow) {
      // Found in dj_codes — validate it
      if (!djRow.active) {
        return new Response(
          JSON.stringify({ valid: false, error: "This invite code has been deactivated." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (djRow.used_at) {
        return new Response(
          JSON.stringify({ valid: false, error: "This invite link has already been used." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (djRow.expires_at && new Date(djRow.expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ valid: false, error: "This invite link has expired." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify({ valid: true, source: "dj_codes" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Fallback: check couple_codes
    const { data: coupleRow, error: coupleDbError } = await supabase
      .from("couple_codes")
      .select("id, code, wedding_id, active, expires_at, used_at")
      .eq("code", code.trim())
      .maybeSingle();

    if (coupleDbError) {
      console.error("couple_codes lookup error:", coupleDbError.message);
      return new Response(
        JSON.stringify({ valid: false, error: "Something went wrong. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!coupleRow) {
      return new Response(
        JSON.stringify({ valid: false, error: "Invalid invite code" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Validate couple_codes row
    if (!coupleRow.active) {
      return new Response(
        JSON.stringify({ valid: false, error: "This invite code has been deactivated." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (coupleRow.used_at) {
      return new Response(
        JSON.stringify({ valid: false, error: "This invite link has already been used." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (coupleRow.expires_at && new Date(coupleRow.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ valid: false, error: "This invite link has expired." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ valid: true, source: "couple_codes", wedding_id: coupleRow.wedding_id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("validate-invite-code error:", err instanceof Error ? err.message : "Unknown error");
    return new Response(
      JSON.stringify({ valid: false, error: "Something went wrong. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
