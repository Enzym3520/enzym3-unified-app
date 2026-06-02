import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    // ── Auth: require admin role ──────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: roleData } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'super_admin'])
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Business logic ────────────────────────────────────────────
    const { daysOld = 30, dryRun = false } = await req.json().catch(() => ({}));

    console.log(`[cleanup-test-data] Admin ${user.id} starting cleanup: daysOld=${daysOld}, dryRun=${dryRun}`);

    // First, mark any new test submissions
    const { error: markError } = await adminClient.rpc('mark_test_submissions');
    if (markError) {
      console.error('[cleanup-test-data] Error marking test submissions:', markError.message);
      return new Response(
        JSON.stringify({ error: 'Failed to mark test submissions', success: false }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let deletedCount = 0;

    if (!dryRun) {
      const { data, error: cleanupError } = await adminClient.rpc('cleanup_test_data', {
        days_old: daysOld,
      });
      if (cleanupError) {
        console.error('[cleanup-test-data] Cleanup error:', cleanupError.message);
        return new Response(
          JSON.stringify({ error: 'Cleanup operation failed', success: false }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      deletedCount = data || 0;
    } else {
      const { count, error: countError } = await adminClient
        .from('event_notification_history')
        .select('*', { count: 'exact', head: true })
        .eq('is_test', true)
        .lt('created_at', new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString());
      if (countError) {
        console.error('[cleanup-test-data] Count error:', countError.message);
        return new Response(
          JSON.stringify({ error: 'Failed to count test data', success: false }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      deletedCount = count || 0;
    }

    const result = {
      success: true,
      deletedCount,
      daysOld,
      dryRun,
      timestamp: new Date().toISOString(),
    };

    console.log('[cleanup-test-data] Completed:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('[cleanup-test-data] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', success: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
