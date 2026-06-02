import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';
import { EventNotificationEmail } from '../_shared/email-templates.tsx';
import { htmlToPlainText } from '../_shared/htmlToText.ts';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  'notification-email': { maxRequests: 10, windowMinutes: 60 },
  'default': { maxRequests: 20, windowMinutes: 60 }
};

// Server-side rate limiting
async function checkRateLimit(supabase: any, clientIP: string, endpoint: string = 'default') {
  const config = RATE_LIMIT_CONFIG[endpoint] || RATE_LIMIT_CONFIG.default;
  const windowStart = new Date();
  windowStart.setMinutes(windowStart.getMinutes() - config.windowMinutes);

  const { data: existingLimit, error: fetchError } = await supabase
    .from('rate_limits')
    .select('*')
    .eq('ip_address', clientIP)
    .eq('endpoint', endpoint)
    .gte('window_start', windowStart.toISOString())
    .order('window_start', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fetchError) {
    console.error('[NOTIFICATION-EMAIL] Rate limit check error:', fetchError);
    return { allowed: true, remaining: config.maxRequests, limit: config.maxRequests };
  }

  let allowed = true;
  let remaining = config.maxRequests;
  let requestCount = 1;
  const resetAt = new Date(Date.now() + config.windowMinutes * 60 * 1000);

  if (existingLimit) {
    requestCount = existingLimit.request_count + 1;
    allowed = requestCount <= config.maxRequests;
    remaining = Math.max(0, config.maxRequests - requestCount);

    if (allowed) {
      await supabase
        .from('rate_limits')
        .update({ 
          request_count: requestCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingLimit.id);
    }
  } else {
    await supabase
      .from('rate_limits')
      .insert({
        ip_address: clientIP,
        endpoint: endpoint,
        request_count: 1,
        window_start: new Date().toISOString()
      });
  }

  return { allowed, remaining, limit: config.maxRequests, resetAt: resetAt.toISOString() };
}

interface NotificationEmailRequest {
  notification: {
    id?: string;
    couple_name: string;
    event_type: string;
    event_date: string;
    venue?: string;
    contact_email: string;
    coordinator_name?: string;
    dj_name?: string;
    package_type?: string;
    notes?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify authentication
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Authentication required' }), 
      { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  // Verify the JWT token
  const supabaseAuth = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
  if (authError || !user) {
    console.error('[NOTIFICATION-EMAIL] Auth error:', authError);
    return new Response(
      JSON.stringify({ error: 'Invalid authentication' }), 
      { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  // Verify admin role
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const { data: userRoles } = await supabaseAdmin
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .in('role', ['admin', 'super_admin'])
    .limit(1)
    .maybeSingle();

  if (!userRoles) {
    return new Response(
      JSON.stringify({ error: 'Admin access required' }), 
      { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  // Get real client IP from request headers
  const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                   req.headers.get('x-real-ip') || 
                   req.headers.get('cf-connecting-ip') ||
                   'unknown';

  // Check rate limit (server-side - cannot be bypassed)
  const rateLimit = await checkRateLimit(supabase, clientIP, 'notification-email');
  
  if (!rateLimit.allowed) {
    console.warn(`[NOTIFICATION-EMAIL] Rate limit exceeded for IP: ${clientIP}`);
    return new Response(
      JSON.stringify({ 
        error: 'Too many email requests. Please try again later.',
        retryAfter: rateLimit.resetAt
      }), {
        status: 429,
        headers: { 
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': rateLimit.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimit.resetAt || new Date().toISOString(),
          'Retry-After': '3600',
          ...corsHeaders 
        }
      }
    );
  }

  try {
    const { notification }: NotificationEmailRequest = await req.json();

    console.log(`[NOTIFICATION-EMAIL] Sending notification for ${notification.couple_name}`);

    // Basic payload validation
    const required = ['couple_name','event_type','event_date','contact_email'] as const;
    for (const key of required) {
      if (!notification || typeof (notification as any)[key] !== 'string' || !(notification as any)[key]) {
        return new Response(JSON.stringify({ error: `Missing or invalid field: ${key}` }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
    }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(notification.contact_email);
    if (!emailOk) {
      return new Response(JSON.stringify({ error: 'Invalid contact_email' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }
    if (Number.isNaN(Date.parse(notification.event_date))) {
      return new Response(JSON.stringify({ error: 'Invalid event_date' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    // Render the React Email template
    const html = await renderAsync(
      React.createElement(EventNotificationEmail, {
        coupleName: notification.couple_name,
        eventType: notification.event_type,
        eventDate: notification.event_date,
        contactEmail: notification.contact_email,
        venue: notification.venue,
        coordinatorName: notification.coordinator_name,
        djName: notification.dj_name,
        packageType: notification.package_type,
        notes: notification.notes,
      })
    );

    const emailResponse = await resend.emails.send({
      from: "Enzym3 Entertainment <booking@enzym3.com>",
      to: [notification.contact_email],
      subject: `Event Notification: ${notification.couple_name} - ${notification.event_type}`,
      html,
      text: htmlToPlainText(html),
      ...(notification.id ? {
        headers: { 'X-Entity-Ref-ID': notification.id },
        tags: [{ name: 'notification_id', value: notification.id }],
      } : {}),
    });

    console.log("[NOTIFICATION-EMAIL] Email sent successfully", { emailId: emailResponse?.data?.id, success: true });

    // Update the database with email sent status
    if (notification.id) {
      const { error: updateError } = await supabase
        .from('event_notification_history')
        .update({ 
          additional_metadata: {
            email_status: 'sent',
            email_id: emailResponse.data?.id,
            last_email_sent_at: new Date().toISOString()
          }
        })
        .eq('id', notification.id);

      if (updateError) {
        console.error("[NOTIFICATION-EMAIL] Error updating email status:", updateError);
      }
    }

    return new Response(JSON.stringify({
      ...emailResponse,
      email_tracked: !!notification.id
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("[NOTIFICATION-EMAIL] Error:", error);
    
    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request' }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
