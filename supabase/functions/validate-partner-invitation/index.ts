import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();

    if (!token || typeof token !== 'string' || token.length < 10) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Look up invitation by token using service role (bypasses RLS)
    const { data, error } = await supabase
      .from('partner_invitations')
      .select('id, token, invited_email, wedding_id, used, expires_at')
      .eq('token', token)
      .maybeSingle();

    if (error || !data) {
      return new Response(JSON.stringify({ valid: false, error: 'Invalid invitation' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (data.used) {
      return new Response(JSON.stringify({ valid: false, error: 'Already used' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return new Response(JSON.stringify({ valid: false, error: 'Expired' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get event details for display
    const { data: event } = await supabase
      .from('event_notification_history')
      .select('couple_name, event_date, venue')
      .eq('id', data.wedding_id)
      .maybeSingle();

    return new Response(JSON.stringify({
      valid: true,
      invitation: {
        invited_email: data.invited_email,
        wedding_id: data.wedding_id,
      },
      event: event || null,
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('validate-partner-invitation error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
