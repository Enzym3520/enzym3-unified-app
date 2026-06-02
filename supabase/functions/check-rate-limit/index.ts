import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RateLimitConfig {
  maxRequests: number;
  windowMinutes: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  'form-submission': { maxRequests: 100, windowMinutes: 60 },
  'notification': { maxRequests: 100, windowMinutes: 60 },
  'default': { maxRequests: 100, windowMinutes: 60 },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate caller is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ allowed: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    // Check if caller is service role or authenticated user
    const token = authHeader.replace('Bearer ', '');
    const isServiceRole = token === serviceRoleKey;

    if (!isServiceRole) {
      const authClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });
      const { data: claimsData, error: claimsError } = await authClient.auth.getUser();
      if (claimsError || !claimsData?.user) {
        return new Response(
          JSON.stringify({ allowed: false, error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { ipAddress, endpoint = 'default' } = await req.json();

    if (!ipAddress) {
      return new Response(
        JSON.stringify({ allowed: false, error: 'IP address required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const config = RATE_LIMITS[endpoint] || RATE_LIMITS.default;
    const windowStart = new Date();
    windowStart.setMinutes(windowStart.getMinutes() - config.windowMinutes);

    // Get current rate limit record within the time window
    const { data: existingLimit, error: fetchError } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('ip_address', ipAddress)
      .eq('endpoint', endpoint)
      .gte('window_start', windowStart.toISOString())
      .order('window_start', { ascending: false })
      .limit(1)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching rate limit:', fetchError);
      // On error, allow the request (fail open)
      return new Response(
        JSON.stringify({ allowed: true, remaining: config.maxRequests }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let allowed = true;
    let remaining = config.maxRequests;
    let requestCount = 1;

    if (existingLimit) {
      requestCount = existingLimit.request_count + 1;
      allowed = requestCount <= config.maxRequests;
      remaining = Math.max(0, config.maxRequests - requestCount);

      if (allowed) {
        // Update existing record
        await supabase
          .from('rate_limits')
          .update({ 
            request_count: requestCount,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingLimit.id);
      }
    } else {
      // Create new rate limit record
      await supabase
        .from('rate_limits')
        .insert({
          ip_address: ipAddress,
          endpoint: endpoint,
          request_count: 1,
          window_start: new Date().toISOString()
        });
    }

    const statusCode = allowed ? 200 : 429;
    
    return new Response(
      JSON.stringify({ 
        allowed, 
        remaining,
        resetAt: new Date(Date.now() + config.windowMinutes * 60 * 1000).toISOString(),
        limit: config.maxRequests
      }),
      { 
        status: statusCode,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': remaining.toString()
        } 
      }
    );

  } catch (error) {
    console.error('Rate limit check error:', error);
    // On error, allow the request (fail open)
    return new Response(
      JSON.stringify({ allowed: true, error: 'An error occurred' }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
