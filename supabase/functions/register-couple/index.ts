import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { redactEmail, safeLogger, sanitizeString } from '../_shared/validators.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, password } = await req.json();

    if (!code || typeof code !== 'string') {
      return new Response(
        JSON.stringify({ error: "Code is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 8 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Complexity checks: must include uppercase, lowercase, and a number
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      return new Response(
        JSON.stringify({ error: "Password must contain at least one uppercase letter, one lowercase letter, and one number" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Normalize: strip any known event-type prefix and match by suffix.
    // Accepts WED-, QCE-, SW16-, BDY-, BNQ-, GRD-, or bare codes (case-insensitive).
    const rawCode = code.trim().toUpperCase();
    const codeSuffix = rawCode.replace(/^(WED|QCE|SW16|BDY|BNQ|GRD)-/, '');

    // Match either the exact raw input or any stored code ending with -<suffix>
    const { data: coupleCode, error: codeError } = await supabase
      .from("couple_codes")
      .select("*")
      .or(`code.eq.${rawCode},code.ilike.%-${codeSuffix}`)
      .maybeSingle();

    if (codeError || !coupleCode) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if already used
    if (coupleCode.used_at) {
      return new Response(
        JSON.stringify({ error: "This code has already been used" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if expired
    if (coupleCode.expires_at && new Date(coupleCode.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "This code has expired" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch event details including event_type and contact_email
    const { data: event, error: eventError } = await supabase
      .from("event_notification_history")
      .select("couple_name, bride_email, groom_email, contact_email, event_type")
      .eq("id", coupleCode.wedding_id)
      .single();

    if (eventError || !event) {
      return new Response(
        JSON.stringify({ error: "Event not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Event-type-aware email resolution
    let email: string | null = null;
    
    if (event.event_type === 'wedding') {
      // For weddings: prioritize bride/groom emails
      email = coupleCode.bride_email || event.bride_email || 
              coupleCode.groom_email || event.groom_email ||
              event.contact_email; // Fallback for edge cases
    } else {
      // For non-wedding events (birthday, quince, banquet, etc.): 
      // prioritize contact_email as that's the primary contact
      email = event.contact_email ||
              coupleCode.bride_email || event.bride_email ||
              coupleCode.groom_email || event.groom_email;
    }

    if (!email) {
      return new Response(
        JSON.stringify({ error: "No email address associated with this event" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create auth user with event_type in metadata
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm email
      app_metadata: {
        role: 'client',
        wedding_id: coupleCode.wedding_id,
        event_type: event.event_type || 'wedding',
      },
    });

    if (authError) {
      safeLogger.error("Auth error during couple registration", authError, { email: redactEmail(email) });
      
      // Check if user already exists
      if (authError.message.includes('already registered')) {
        return new Response(
          JSON.stringify({ error: "An account with this email already exists. Please login instead." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to create account. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark code as used
    const { error: updateError } = await supabase
      .from("couple_codes")
      .update({
        used_at: new Date().toISOString(),
        used_by: authData.user.id,
        active: false,
      })
      .eq("id", coupleCode.id);

    if (updateError) {
      safeLogger.error("Error updating code", updateError);
    }

    // Create session for the user
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
    });

    if (sessionError) {
      safeLogger.error("Session error", sessionError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: authData.user.id,
          email: authData.user.email,
        },
        wedding_id: coupleCode.wedding_id,
        event_type: event.event_type || 'wedding',
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    safeLogger.error("Error registering client", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
