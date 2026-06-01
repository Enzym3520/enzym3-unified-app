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

    const { data: row, error: dbError } = await supabase
      .from("dj_codes")
      .select("id, code, active, expires_at, used_at")
      .eq("code", code.trim())
      .maybeSingle();

    if (dbError) {
      console.error("dj_codes lookup error:", dbError.message);
      return new Response(
        JSON.stringify({ valid: false, error: "Something went wrong. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!row) {
      return new Response(
        JSON.stringify({ valid: false, error: "Invalid invite code" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!row.active) {
      return new Response(
        JSON.stringify({ valid: false, error: "This invite code has been deactivated." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (row.used_at) {
      return new Response(
        JSON.stringify({ valid: false, error: "This invite link has already been used." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (row.expires_at && new Date(row.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ valid: false, error: "This invite link has expired." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ valid: true }),
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
