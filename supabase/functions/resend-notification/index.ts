
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  'resend-notification': { maxRequests: 100, windowMinutes: 60 },
  'default': { maxRequests: 100, windowMinutes: 60 }
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
    console.error('Rate limit check error:', fetchError);
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

// Types are kept minimal to avoid coupling to app code
interface ResendRequest {
  id: string;
  reason?: string;
  updatedData?: Record<string, any>;
  mode?: "resend" | "edit_and_resend";
}

// Validate outbound webhook destinations to prevent SSRF
function isAllowedWebhook(urlString: string): boolean {
  try {
    const u = new URL(urlString);
    if (u.protocol !== 'https:') return false;

    const host = u.hostname.toLowerCase();

    // Block localhost and obvious private hosts
    const blockedHosts = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1', '[::1]']);
    if (blockedHosts.has(host)) return false;

    // Block common private IP ranges
    const ipPrivateRegexes = [
      /^(10)\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/,           // 10.0.0.0/8
      /^(192)\.(168)\.(\d{1,3})\.(\d{1,3})$/,              // 192.168.0.0/16
      /^(172)\.(1[6-9]|2[0-9]|3[0-1])\.(\d{1,3})\.(\d{1,3})$/, // 172.16.0.0/12
      /^(169)\.(254)\.(\d{1,3})\.(\d{1,3})$/               // 169.254.0.0/16
    ];
    if (ipPrivateRegexes.some((r) => r.test(host))) return false;

    // Allowlist trusted domains only
    const allowed = (
      host.endsWith('.elestio.app') ||
      host === 'hooks.zapier.com' ||
      host === 'maker.ifttt.com'
    );
    if (!allowed) return false;

    // Block non-standard ports
    if (u.port && u.port !== '443') return false;

    return true;
  } catch {
    return false;
  }
}

function deriveGuestCount(n: any): number | null {
  const gc = n.guest_count ?? n.guests?.count ?? n.additional_metadata?.guest_count;
  if (gc == null) return null;
  const num = Number(gc);
  return Number.isFinite(num) ? num : null;
}

function buildPayload(n: any, options: { source: string; reason?: string; editCount?: number; isEdited?: boolean }) {
  const metadata = n.additional_metadata || {};
  const coupleCode = metadata.couple_code || '';
  const registrationLink = coupleCode ? `https://booking.enzym3entertainment.vip/couple/register?code=${coupleCode}` : '';
  
  return {
    // Match initial webhook structure exactly
    id: n.id,
    wedding_id: n.id,
    event_type: n.event_type,
    couple_name: n.couple_name,
    bride_name: metadata.brideName || '',
    groom_name: metadata.groomName || '',
    bride_email: metadata.brideEmail || '',
    groom_email: metadata.groomEmail || '',
    bride_phone: metadata.bridePhone || '',
    groom_phone: metadata.groomPhone || '',
    event_date: n.event_date,
    venue: n.venue,
    coordinator_name: n.coordinator_name,
    dj_name: n.dj_name,
    package_type: n.package_type,
    contact_email: n.contact_email,
    contact_phone: n.contact_phone,
    submitted_by: n.submitted_by,
    guest_count: deriveGuestCount(n),
    couple_code: coupleCode,
    registration_link: registrationLink,
    additional_metadata: n.additional_metadata,
    timestamp: new Date().toISOString(),
    // Resend-specific metadata
    resend_metadata: {
      source: options.source,
      reason: options.reason ?? null,
      editCount: options.editCount ?? null,
      isEdited: options.isEdited ?? false,
      sentAt: new Date().toISOString(),
    }
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Get real client IP from request headers
  const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                   req.headers.get('x-real-ip') || 
                   req.headers.get('cf-connecting-ip') ||
                   'unknown';

  try {
    // Initialize supabase first for rate limiting
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      console.error("Missing Supabase env vars");
      return new Response(JSON.stringify({ error: "Server not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Check rate limit (server-side - cannot be bypassed)
    const rateLimit = await checkRateLimit(supabase, clientIP, 'resend-notification');
    
    if (!rateLimit.allowed) {
      console.warn(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ 
          error: 'Too many resend requests. Please try again later.',
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

    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

    if (!ANON_KEY) {
      console.error("Missing ANON_KEY env var");
      return new Response(JSON.stringify({ error: "Server not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Check authentication - JWT is now required
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Create client with anon key to verify user
    const supabaseAuth = createClient(SUPABASE_URL, ANON_KEY, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Supabase already initialized above for rate limiting, reuse it
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin');

    if (!roles || roles.length === 0) {
      console.error("User lacks admin role:", user.id);
      return new Response(JSON.stringify({ error: "Forbidden - Admin access required" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const body: ResendRequest = await req.json();
    const id = body?.id;
    const mode: "resend" | "edit_and_resend" = body?.mode || "resend";

    if (!id) {
      return new Response(JSON.stringify({ error: "Missing id" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return new Response(JSON.stringify({ error: "Invalid ID format" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Validate reason length
    if (body.reason && typeof body.reason === 'string' && body.reason.length > 500) {
      return new Response(JSON.stringify({ error: "Reason too long (max 500 chars)" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Validate mode
    if (mode !== "resend" && mode !== "edit_and_resend") {
      return new Response(JSON.stringify({ error: "Invalid mode" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Fetch the notification
    const { data: notification, error: fetchError } = await supabase
      .from("event_notification_history")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      console.error("Fetch error:", fetchError);
      return new Response(JSON.stringify({ error: 'Failed to fetch notification' }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!notification) {
      return new Response(JSON.stringify({ error: "Notification not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Fall back to N8N_WEBHOOK_URL env var if DB record has no webhook_url
    const resolvedWebhookUrl = notification.webhook_url || Deno.env.get("N8N_WEBHOOK_URL");

    if (!resolvedWebhookUrl) {
      return new Response(JSON.stringify({ error: "No webhook URL configured" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Validate webhook URL to prevent SSRF attacks
    if (!isAllowedWebhook(resolvedWebhookUrl)) {
      console.warn("Blocked invalid or disallowed webhook URL:", resolvedWebhookUrl);
      return new Response(JSON.stringify({ error: "Invalid webhook destination. Only whitelisted domains are allowed." }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Merge edits if provided
    const updatedNotification = mode === "edit_and_resend" && body.updatedData
      ? { ...notification, ...body.updatedData }
      : notification;

    const payload = buildPayload(updatedNotification, {
      source: mode === "edit_and_resend" ? "Event Notification Form (Edit & Resend)" : "Event Notification Form (Resend)",
      reason: body.reason,
      editCount: (notification.edit_count || 0) + (mode === "edit_and_resend" ? 1 : 0),
      isEdited: mode === "edit_and_resend",
    });

    let webhookStatus = 0;
    let webhookResponse = "";
    let webhookError: string | null = null;
    let attempts: any[] = [];
    let usedFallback = false;
    let finalUrl = resolvedWebhookUrl;

    try {
      const originalUrl = resolvedWebhookUrl;
      // First attempt: original URL
      const resp1 = await fetch(originalUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const text1 = await resp1.text().catch(() => "");
      attempts.push({
        url: originalUrl,
        status: resp1.status,
        ok: resp1.ok,
        response: text1?.slice(0, 500) ?? "",
      });
      webhookStatus = resp1.status;
      webhookResponse = text1;
      if (!resp1.ok) {
        webhookError = `Non-2xx status: ${resp1.status}`;
      }

      // Smart fallback for n8n test webhooks returning 404 (not armed)
      if (resp1.status === 404 && originalUrl.includes("/webhook-test/")) {
        const prodUrl = originalUrl.replace("/webhook-test/", "/webhook/");
        usedFallback = true;
        try {
          const resp2 = await fetch(prodUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const text2 = await resp2.text().catch(() => "");
          attempts.push({
            url: prodUrl,
            status: resp2.status,
            ok: resp2.ok,
            response: text2?.slice(0, 500) ?? "",
          });
          // Use fallback attempt result as final
          webhookStatus = resp2.status;
          webhookResponse = text2;
          finalUrl = prodUrl;
          if (!resp2.ok) {
            webhookError = `Non-2xx status (fallback): ${resp2.status}`;
          } else {
            webhookError = null;
          }
        } catch (err2) {
          const msg2 = (err2 as Error).message || "Unknown webhook error (fallback)";
          attempts.push({ url: prodUrl, status: 0, ok: false, error: msg2 });
          webhookError = msg2;
        }
      }
    } catch (err) {
      webhookError = (err as Error).message || "Unknown webhook error";
      attempts.push({ url: notification.webhook_url, status: 0, ok: false, error: webhookError });
      console.error("Webhook call failed:", webhookError);
    }

    const existingMetadata = (notification.additional_metadata as any) || {};
    const existingResendHistory = existingMetadata.resend_history || [];
    const existingEditHistory = existingMetadata.edit_history || [];

    const newResendCount = (notification.resend_count || 0) + 1;
    const newEditCount = (notification.edit_count || 0) + (mode === "edit_and_resend" ? 1 : 0);

    const metaUpdate: any = {
      ...existingMetadata,
      resend_history: [
        ...existingResendHistory,
        {
          timestamp: new Date().toISOString(),
          reason: body.reason || null,
          webhook_status: webhookStatus,
          webhook_error: webhookError,
          type: mode,
          used_fallback: usedFallback,
          attempts,
        },
      ],
    };

    if (mode === "edit_and_resend") {
      metaUpdate.edit_history = [
        ...existingEditHistory,
        {
          timestamp: new Date().toISOString(),
          reason: body.reason || null,
          changes: body.updatedData || {},
          edited_by: "system",
        },
      ];
    }

    const updateData: any = {
      resend_count: newResendCount,
      last_resent_at: new Date().toISOString(),
      webhook_status_code: webhookStatus,
      webhook_response: webhookResponse,
      additional_metadata: metaUpdate,
    };

    // Persist production URL if fallback succeeded
    if (usedFallback && !webhookError && finalUrl && finalUrl !== notification.webhook_url) {
      updateData.webhook_url = finalUrl;
    }

    if (mode === "edit_and_resend") {
      updateData.edit_count = newEditCount;
      updateData.edited_at = new Date().toISOString();
      if (body.updatedData) {
        // Persist edited fields
        Object.assign(updateData, body.updatedData);
      }
    }

    const { data: updatedRow, error: updateError } = await supabase
      .from("event_notification_history")
      .update(updateData)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (updateError) {
      console.error("Update error:", updateError);
      return new Response(JSON.stringify({ error: 'Failed to update notification record' }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (webhookError) {
      let friendly = `Webhook failed: ${webhookError}`;
      if (!usedFallback && webhookStatus === 404 && (notification.webhook_url as string).includes("/webhook-test/")) {
        friendly = "Webhook failed with 404. This looks like an n8n test webhook that is not armed. In n8n, click 'Execute workflow' on the test webhook or switch to the production URL. " + friendly;
      }
      return new Response(
        JSON.stringify({ error: friendly, data: updatedRow, attempts, usedFallback }),
        { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    return new Response(JSON.stringify({ data: updatedRow }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e) {
    console.error("Unhandled error:", e);
    return new Response(JSON.stringify({ error: 'An error occurred processing your request' }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
