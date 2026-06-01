import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const { eventId, signatureData, signatureName, guestCount, djMealIncluded } =
      await req.json() as {
        eventId: string;
        signatureData: string;
        signatureName: string;
        guestCount?: number | null;
        djMealIncluded?: boolean;
      };

    if (!eventId || !signatureData || !signatureName) {
      return new Response(
        JSON.stringify({ error: "eventId, signatureData, and signatureName are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Verify user has access to this event
    const { data: codeRow } = await supabase
      .from("couple_codes")
      .select("event_id")
      .eq("user_id", user.id)
      .eq("event_id", eventId)
      .maybeSingle();

    const { data: event, error: eventError } = await supabase
      .from("event_notification_history")
      .select("id, contact_email")
      .eq("id", eventId)
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

    const now = new Date().toISOString();

    // Build update object — never log signatureData (sensitive)
    const updatePayload: Record<string, unknown> = {
      contract_signed: true,
      contract_signed_at: now,
      contract_signature_data: signatureData,
      client_signature_name: signatureName,
      client_signature_date: now,
    };

    if (guestCount != null) {
      updatePayload.guest_count = guestCount;
    }

    if (djMealIncluded !== undefined) {
      updatePayload.dj_meal_included = djMealIncluded;
    }

    const { error: updateError } = await supabase
      .from("event_notification_history")
      .update(updatePayload)
      .eq("id", eventId);

    if (updateError) {
      console.error("sign-contract update error:", updateError.message);
      return new Response(
        JSON.stringify({ error: "Failed to save contract signature" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("sign-contract error:", err instanceof Error ? err.message : "Unknown error");
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
