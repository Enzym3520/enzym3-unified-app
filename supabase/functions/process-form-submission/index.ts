import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@4.0.0";
import { redactEmail, safeLogger } from '../_shared/validators.ts';
import { htmlToPlainText } from '../_shared/htmlToText.ts';

// Initialize Resend for direct email sending
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Test data detection utilities
function detectTestData(formData: any): { isTest: boolean; reasons: string[] } {
  const reasons: string[] = [];
  
  const normalize = (str?: string) => str?.toLowerCase().trim() || '';
  
  const coupleName = normalize(formData.couple_name);
  const contactEmail = normalize(formData.contact_email);
  const submittedBy = normalize(formData.submitted_by);
  const coordinatorName = normalize(formData.coordinator_name);
  const venue = normalize(formData.venue);
  
  const testPatterns = ['test', 'example', 'demo', 'sample', 'dummy'];
  
  testPatterns.forEach(pattern => {
    if (coupleName.includes(pattern) || 
        contactEmail.includes(pattern) || 
        submittedBy.includes(pattern) || 
        coordinatorName.includes(pattern) || 
        venue.includes(pattern)) {
      reasons.push(`Contains test pattern: ${pattern}`);
    }
  });
  
  if (coupleName === 'john & jane' || contactEmail === 'test@example.com') {
    reasons.push('Generic placeholder data detected');
  }
  
  return { isTest: reasons.length > 0, reasons };
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  'form-submission': { maxRequests: 100, windowMinutes: 60 },
  'default': { maxRequests: 100, windowMinutes: 60 }
};

// Server-side rate limiting - cannot be bypassed
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

// Basic HTML escape helper
function escapeHtml(input: unknown): string {
  if (input === undefined || input === null) return '';
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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

    // Block common private IP ranges (RFC 1918)
    const ipPrivateRegexes = [
      /^(10)\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/,           // 10.0.0.0/8
      /^(192)\.(168)\.(\d{1,3})\.(\d{1,3})$/,              // 192.168.0.0/16
      /^(172)\.(1[6-9]|2[0-9]|3[0-1])\.(\d{1,3})\.(\d{1,3})$/, // 172.16.0.0/12
      /^(169)\.(254)\.(\d{1,3})\.(\d{1,3})$/               // 169.254.0.0/16 (link-local)
    ];
    if (ipPrivateRegexes.some((r) => r.test(host))) return false;

    // Block metadata endpoints (cloud provider metadata services)
    const metadataEndpoints = new Set([
      '169.254.169.254',  // AWS, Azure, GCP metadata
      'metadata.google.internal',
      'metadata.azure.com',
    ]);
    if (metadataEndpoints.has(host)) return false;

    // Block localhost variants
    if (host.startsWith('127.') || host === 'ip6-localhost') return false;

    // Allowlist trusted domains only
    const allowed = (
      host.endsWith('.elestio.app') ||
      host === 'hooks.zapier.com' ||
      host === 'maker.ifttt.com'
    );
    if (!allowed) {
      console.warn(`Webhook URL rejected - not in allowlist: ${host}`);
      return false;
    }

    // Block non-standard ports
    if (u.port && u.port !== '443') return false;

    return true;
  } catch {
    return false;
  }
}

interface ProcessRequest {
  submissionId?: string;
  notificationId?: string;
  reason?: string;
}

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

// PRIMARY WEBHOOK URL for email automation (Zapier or n8n)
// This webhook receives notification_data and sends emails via Zapier (primary) or n8n (secondary)
// Set this to your Zapier "Catch Hook" URL: https://hooks.zapier.com/hooks/catch/xxxxx/yyyyy
// Environment variable name kept as N8N_WEBHOOK_URL for backward compatibility
const N8N_WEBHOOK_URL = Deno.env.get('N8N_WEBHOOK_URL') || '';

// Email configuration
const ADMIN_EMAIL = 'jj.madison17@gmail.com';
const FROM_EMAIL = 'Enzym3 Entertainment <booking@enzym3.com>';
const PORTAL_URL = 'https://booking.enzym3entertainment.vip';

// Event type configurations for email templates
const EVENT_CONFIG = {
  wedding: {
    emoji: '💍',
    greeting: 'Hey',
    eventLabel: 'Wedding',
    dateLabel: 'Wedding Date',
    portalName: 'Wedding Vibe Planner',
    features: [
      'Share your must-play and do-not-play songs',
      'Search Spotify in real-time as you type',
      'Share your favorite playlist links',
      'Browse and request upgrade packages',
      'Keep everything organized for your big day'
    ]
  },
  quinceanera: {
    emoji: '🎀',
    greeting: 'Hey',
    eventLabel: 'Quinceañera',
    dateLabel: 'Quinceañera Date',
    portalName: 'Quinceañera Vibe Planner',
    features: [
      'Request songs for vals, surprise dance, and party',
      'Search Spotify in real-time as you type',
      'Share your favorite playlists and song links',
      'View and request upgrade packages',
      'Keep all your music choices organized'
    ]
  },
  birthday: {
    emoji: '🎂',
    greeting: 'Hey',
    eventLabel: 'Birthday',
    dateLabel: 'Event Date',
    portalName: 'Birthday Vibe Planner',
    features: [
      'Share your must-play and do-not-play songs',
      'Search Spotify in real-time as you type',
      'Share your favorite playlist links',
      'View and request upgrade packages',
      'Keep everything organized for your celebration'
    ]
  },
  banquet: {
    emoji: '🎉',
    greeting: 'Hello',
    eventLabel: 'Event',
    dateLabel: 'Event Date',
    portalName: 'Event Vibe Planner',
    features: [
      'Share your must-play and do-not-play songs',
      'Search our music library in real-time',
      'Share playlist links with your team',
      'View and request upgrade packages',
      'Keep everything organized for your event'
    ]
  },
  corporate: {
    emoji: '🎉',
    greeting: 'Hello',
    eventLabel: 'Corporate Event',
    dateLabel: 'Event Date',
    portalName: 'Event Vibe Planner',
    features: [
      'Share your must-play and do-not-play songs',
      'Search our music library in real-time',
      'Share playlist links with your team',
      'View and request upgrade packages',
      'Keep everything organized for your event'
    ]
  },
  graduation: {
    emoji: '🎓',
    greeting: 'Hey',
    eventLabel: 'Graduation Party',
    dateLabel: 'Event Date',
    portalName: 'Graduation Vibe Planner',
    features: [
      'Share your must-play and do-not-play songs',
      'Search Spotify in real-time as you type',
      'Share your favorite playlist links',
      'View and request upgrade packages',
      'Keep everything organized for your celebration'
    ]
  },
  sweet16: {
    emoji: '🎀',
    greeting: 'Hey',
    eventLabel: 'Sweet 16',
    dateLabel: 'Event Date',
    portalName: 'Sweet 16 Vibe Planner',
    features: [
      'Share your must-play and do-not-play songs',
      'Search Spotify in real-time as you type',
      'Share your favorite playlist links',
      'View and request upgrade packages',
      'Keep everything organized for your celebration'
    ]
  }
};

function getEventConfig(eventType: string) {
  const normalized = (eventType || 'wedding').toLowerCase();
  if (normalized.includes('quince') || normalized.includes('xv')) return EVENT_CONFIG.quinceanera;
  if (normalized.includes('birthday')) return EVENT_CONFIG.birthday;
  if (normalized.includes('graduation')) return EVENT_CONFIG.graduation;
  if (normalized.includes('sweet') && normalized.includes('16')) return EVENT_CONFIG.sweet16;
  if (normalized.includes('corporate') || normalized.includes('banquet')) return EVENT_CONFIG.banquet;
  return EVENT_CONFIG.wedding;
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  } catch {
    return dateStr;
  }
}

// Detect youth/milestone events where the contact person ≠ the honoree
function isYouthEvent(eventType: string): boolean {
  const normalized = (eventType || '').toLowerCase();
  return (
    normalized.includes('quince') || normalized.includes('xv') ||
    normalized.includes('birthday') ||
    normalized.includes('graduation') ||
    (normalized.includes('sweet') && normalized.includes('16'))
  );
}

// Generate client welcome email HTML
function generateClientWelcomeEmail(notification: any, coupleCode: string): string {
  const config = getEventConfig(notification.event_type);
  const registrationLink = `${PORTAL_URL}/register?code=${coupleCode}`;
  const isIndependent = notification.booking_source === 'independent';
  
  // Extract hours booked from additional_metadata
  const hoursBooked = notification.additional_metadata?.hoursBooked 
    || notification.additional_metadata?.form_data?.hoursBooked 
    || notification.hours_booked
    || '';
  
  const hoursText = hoursBooked ? `${hoursBooked} hours` : 'your scheduled time';

  // Show package type for venue partners only
  const packageType = !isIndependent ? (notification.package_type || '') : '';

  // Youth events: greet the contact person, reference the honoree in body
  const youth = isYouthEvent(notification.event_type);
  const primaryContact = notification.additional_metadata?.primary_contact_name
    || notification.additional_metadata?.primaryContactName
    || notification.primary_contact_name
    || '';
  const greetingName = youth && primaryContact ? primaryContact : notification.couple_name;
  const honoreeName = notification.couple_name;

  // Body line differs for youth vs wedding/banquet
  const bodyEventPhrase = youth && primaryContact
    ? `${escapeHtml(honoreeName)}'s ${escapeHtml(config.eventLabel.toLowerCase())}`
    : `your ${escapeHtml(config.eventLabel.toLowerCase())}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Let's Build Your Event</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; background-color: #DBD4C3; font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #DBD4C3;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden;">
          
          <!-- Header: Logo -->
          <tr>
            <td align="center" style="padding: 40px 30px 24px; background-color: #DBD4C3;">
              <img src="https://e3ecoordination.lovable.app/lovable-uploads/logo_transparent_background-3.png"
                   alt="Enzym3 Entertainment" width="200"
                   style="display: block; margin: 0 auto;" />
            </td>
          </tr>

          <!-- Title: Let's Build Your Event -->
          <tr>
            <td style="padding: 32px 36px 0;">
              <h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 28px; color: #2D2921; margin: 0 0 12px; font-weight: 600; text-align: center;">
                Let's Build Your Event
              </h1>
              <div style="width: 60px; height: 3px; background-color: #85D4FA; margin: 0 auto 28px;"></div>
            </td>
          </tr>

          <!-- Body Copy -->
          <tr>
            <td style="padding: 0 36px;">
              <p style="color: #2D2921; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">
                Hey <strong>${escapeHtml(greetingName)}</strong>,
              </p>

              <p style="color: #4b4540; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">
                I'm excited to be part of ${bodyEventPhrase} on <strong>${formatDate(notification.event_date)}</strong>${notification.venue ? ` at <strong>${escapeHtml(notification.venue)}</strong>` : ''}.
                We've got you scheduled for <strong>${hoursText}</strong>, and now it's time to shape the vibe.${packageType ? ` <strong>(${escapeHtml(packageType)} Package)</strong>` : ''}
              </p>

              <p style="color: #4b4540; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">
                First step — let's get your music dialed in.
              </p>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 0 0 28px;">
                <a href="${registrationLink}"
                   style="display: inline-block; background-color: #85D4FA; color: #2D2921; padding: 14px 36px; text-decoration: none; border-radius: 30px; font-weight: 600; font-size: 16px; letter-spacing: 0.3px;">
                  Fill Out Your Vibe Planner
                </a>
              </div>

              <p style="color: #4b4540; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">
                Share your must-play songs, do-not-play list, special moments, and the overall energy you're going for.
              </p>

              ${isIndependent ? `
              <p style="color: #4b4540; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">
                You'll receive a separate email shortly with your contract and deposit details so we can officially lock everything in.
              </p>
              ` : ''}

              <p style="color: #4b4540; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">
                If you're interested in upgrades like uplighting, cold sparks, or a custom monogram, just let me know and I'll walk you through options.
              </p>

              <p style="color: #4b4540; font-size: 15px; line-height: 1.7; margin: 0 0 28px;">
                Looking forward to making this one special.
              </p>

              <!-- Signature -->
              <div style="border-top: 1px solid #e5e0d8; padding-top: 20px; margin-bottom: 32px;">
                <p style="color: #2D2921; font-size: 15px; line-height: 1.8; margin: 0;">
                  <strong>JJ | DJ Enzym3</strong><br>
                  Enzym3 Entertainment<br>
                  520-406-8600<br>
                  <a href="mailto:booking@enzym3entertainment.vip" style="color: #85D4FA; text-decoration: none;">booking@enzym3entertainment.vip</a>
                </p>
              </div>
            </td>
          </tr>
        </table>

        <!-- Outer footer -->
        <p style="text-align: center; color: #8a8278; font-size: 11px; margin-top: 16px;">
          &copy; ${new Date().getFullYear()} Enzym3 Entertainment &middot; Tucson, AZ &middot; <a href="https://enzym3entertainment.vip" style="color: #8a8278;">enzym3entertainment.vip</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Generate admin notification email HTML
function generateAdminNotificationEmail(notification: any, coupleCode: string): string {
  const config = getEventConfig(notification.event_type);
  const dashboardLink = 'https://coordination.enzym3entertainment.vip/contacts';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New ${config.eventLabel} Submitted</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #1f2937; padding: 20px; border-radius: 8px 8px 0 0;">
    <h2 style="color: white; margin: 0;">${config.emoji} New ${config.eventLabel} Submitted</h2>
  </div>
  
  <div style="background: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;"><strong>Client:</strong></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">${escapeHtml(notification.couple_name)}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;"><strong>Event Type:</strong></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">${escapeHtml(notification.event_type)}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;"><strong>Date:</strong></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">${formatDate(notification.event_date)}</td>
      </tr>
      ${notification.venue ? `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;"><strong>Venue:</strong></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">${escapeHtml(notification.venue)}</td>
      </tr>` : ''}
      ${notification.package_type ? `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;"><strong>Package:</strong></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">${escapeHtml(notification.package_type)}</td>
      </tr>` : ''}
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;"><strong>Contact Email:</strong></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">${escapeHtml(notification.contact_email)}</td>
      </tr>
      ${notification.contact_phone ? `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;"><strong>Phone:</strong></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">${escapeHtml(notification.contact_phone)}</td>
      </tr>` : ''}
      ${notification.guest_count ? `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;"><strong>Guest Count:</strong></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">${notification.guest_count}</td>
      </tr>` : ''}
      ${notification.coordinator_name ? `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;"><strong>Coordinator:</strong></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">${escapeHtml(notification.coordinator_name)}</td>
      </tr>` : ''}
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;"><strong>Submitted By:</strong></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">${escapeHtml(notification.submitted_by)}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0;"><strong>Couple Code:</strong></td>
        <td style="padding: 8px 0;"><code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">${coupleCode}</code></td>
      </tr>
    </table>
    
    <div style="margin-top: 20px; text-align: center;">
      <a href="${dashboardLink}" 
         style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
        View in Dashboard
      </a>
    </div>
  </div>
</body>
</html>`;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Get real client IP from request headers
  const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                   req.headers.get('x-real-ip') || 
                   req.headers.get('cf-connecting-ip') ||
                   'unknown';

  // Check rate limit (server-side - cannot be bypassed)
  const rateLimit = await checkRateLimit(supabase, clientIP, 'form-submission');
  
  if (!rateLimit.allowed) {
    console.warn(`Rate limit exceeded for IP: ${clientIP}`);
    return new Response(
      JSON.stringify({ 
        error: 'Too many requests. Please try again later.',
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
    // Check authentication - JWT is now required
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

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

    // Check if user has admin role
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: roles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'super_admin', 'moderator']);

    if (!roles || roles.length === 0) {
      console.error("User lacks required role:", user.id);
      return new Response(JSON.stringify({ error: "Forbidden - Staff access required" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const body = await req.json();
    const { submissionId, notificationId, reason }: ProcessRequest = body;

    // Input validation
    if (submissionId) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(submissionId)) {
        return new Response(JSON.stringify({ error: "Invalid submission ID format" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    if (notificationId) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(notificationId)) {
        return new Response(JSON.stringify({ error: "Invalid notification ID format" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    if (reason && typeof reason === 'string' && reason.length > 500) {
      return new Response(JSON.stringify({ error: "Reason too long (max 500 chars)" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (notificationId) {
      console.log("Processing notification:", notificationId);

      const { data: notification, error: notifError } = await supabase
        .from('event_notification_history')
        .select('*')
        .eq('id', notificationId)
        .single();

      if (notifError || !notification) {
        console.error('Failed to fetch notification:', notifError);
        throw new Error('Unable to process notification');
      }

      // Send emails via Resend
      const emailResult = await sendNotificationEmails(notification);
      safeLogger.info("Email processing complete", { success: emailResult?.success });

      // Optionally send to n8n webhook for orchestration
      let webhookResponse = null;
      let webhookStatusCode = null;

      if (N8N_WEBHOOK_URL && isAllowedWebhook(N8N_WEBHOOK_URL)) {
        webhookResponse = await sendOrchestrationWebhook(notification);
        webhookStatusCode = webhookResponse?.status || null;
        
        // Only store status code, NOT the webhook URL (security: URL contains secrets)
        await supabase
          .from('event_notification_history')
          .update({ 
            webhook_status_code: webhookStatusCode
          })
          .eq('id', notificationId);
      }

      const newResendCount = (notification.resend_count ?? 0) + 1;
      const newMetadata = {
        ...(notification.additional_metadata || {}),
        ...(reason ? { last_resend_reason: reason } : {}),
      };

      const { error: updateError } = await supabase
        .from('event_notification_history')
        .update({
          updated_at: new Date().toISOString(),
          resend_count: newResendCount,
          last_resent_at: new Date().toISOString(),
          additional_metadata: newMetadata,
          webhook_response: emailResult?.webhook_response ?? null,
          webhook_status_code: emailResult?.adminEmail?.statusCode ?? null
        })
        .eq('id', notificationId);
      if (updateError) {
        console.error('Error updating notification:', updateError);
      }

      return new Response(
        JSON.stringify({ success: true, notificationId, email: emailResult }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Processing submission:", submissionId);

    // Fetch submission data
    const { data: submission, error: submissionError } = await supabase
      .from('form_submissions')
      .select(`
        *,
        form_templates (
          name,
          title,
          form_type
        )
      `)
      .eq('id', submissionId)
      .single();

    if (submissionError || !submission) {
      console.error('Failed to fetch submission:', submissionError);
      throw new Error('Unable to process submission');
    }

    console.log("Found submission:", submission.wedding_id);

    // Generate PDF content (simplified version)
    const pdfContent = generatePDFContent(submission);

    // Send email with form data
    const emailResult = await sendEmailConfirmation(submission, pdfContent);
    console.log("Email sent:", emailResult);

    // Send webhook if URL provided
    if (submission.webhook_url) {
      await sendWebhook(submission);
    }

    // Update submission status
    const { error: updateError } = await supabase
      .from('form_submissions')
      .update({
        status: 'processed',
        email_sent_at: new Date().toISOString(),
        pdf_generated_at: new Date().toISOString(),
        webhook_sent_at: submission.webhook_url ? new Date().toISOString() : null
      })
      .eq('id', submissionId);

    if (updateError) {
      console.error("Error updating submission:", updateError);
    }

    return new Response(
      JSON.stringify({ success: true, submissionId }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error processing submission:", error);
    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request' }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

// Send both admin and client emails via Resend
async function sendNotificationEmails(notification: any) {
  const coupleCode = notification.additional_metadata?.couple_code || '';
  const config = getEventConfig(notification.event_type);
  
  const results = {
    adminEmail: null as any,
    clientEmail: null as any,
    webhook_response: '',
    success: false
  };

  try {
    // Email 1: Admin notification
    safeLogger.info("Sending admin notification email", { recipient: redactEmail(ADMIN_EMAIL) });
    const adminHtml = generateAdminNotificationEmail(notification, coupleCode);
    const adminResult = await resend.emails.send({
      from: FROM_EMAIL,
      to: [ADMIN_EMAIL],
      subject: `${config.emoji} New ${config.eventLabel} Submitted - ${notification.couple_name}`,
      html: adminHtml,
      text: htmlToPlainText(adminHtml),
      headers: { 'X-Entity-Ref-ID': notification.id },
      tags: [{ name: 'notification_id', value: notification.id }],
    });
    results.adminEmail = adminResult;
    if (adminResult.error) {
      console.error("Resend admin email ERROR:", JSON.stringify(adminResult.error));
    } else {
      safeLogger.info("Admin email sent", { success: true, emailId: adminResult?.data?.id });
    }

    // Email 2: Client welcome email - send to all unique recipients (bride, groom, contact)
    if (coupleCode) {
      // Collect all unique, valid email addresses
      const emailRecipients = new Set<string>();
      if (notification.contact_email) emailRecipients.add(notification.contact_email.toLowerCase().trim());
      if (notification.bride_email) emailRecipients.add(notification.bride_email.toLowerCase().trim());
      if (notification.groom_email) emailRecipients.add(notification.groom_email.toLowerCase().trim());
      
      // Also check additional_metadata.form_data for bride/groom emails (fallback)
      const formData = notification.additional_metadata?.form_data || {};
      if (formData.brideEmail) emailRecipients.add(formData.brideEmail.toLowerCase().trim());
      if (formData.groomEmail) emailRecipients.add(formData.groomEmail.toLowerCase().trim());
      
      // Filter out empty strings
      const validRecipients = Array.from(emailRecipients).filter(email => email && email.includes('@'));
      
      if (validRecipients.length > 0) {
        safeLogger.info("Sending client welcome email", { recipientCount: validRecipients.length, recipients: validRecipients.map(e => redactEmail(e)) });
        const clientHtml = generateClientWelcomeEmail(notification, coupleCode);
        const clientResult = await resend.emails.send({
          from: FROM_EMAIL,
          to: validRecipients,
          subject: `Let's Build Your Event, ${notification.couple_name}! 🎶`,
          html: clientHtml,
          text: htmlToPlainText(clientHtml),
          headers: { 'X-Entity-Ref-ID': notification.id },
          tags: [{ name: 'notification_id', value: notification.id }],
        });
        results.clientEmail = clientResult;
        if (clientResult.error) {
          console.error("Resend client email ERROR:", JSON.stringify(clientResult.error));
        } else {
          safeLogger.info("Client email sent successfully", {
            recipientCount: validRecipients.length,
            emailId: clientResult.data?.id
          });
        }
      } else {
        console.warn("No valid email recipients found for client welcome email");
      }
    }

    results.success = true;
    results.webhook_response = JSON.stringify({ admin: results.adminEmail, client: results.clientEmail });
    
  } catch (error) {
    console.error("Error sending emails via Resend:", error);
    results.webhook_response = error instanceof Error ? error.message : 'Email sending failed';
  }

  return results;
}

// Send data to n8n for orchestration (scheduling, CRM sync, etc.)
async function sendOrchestrationWebhook(notification: any) {
  try {
    const coupleCode = notification.additional_metadata?.couple_code || '';
    const registrationLink = coupleCode ? `${PORTAL_URL}/register?code=${coupleCode}` : '';

    const webhookData = {
      id: notification.id,
      wedding_id: notification.id,
      event_type: notification.event_type,
      couple_name: notification.couple_name,
      bride_name: notification.additional_metadata?.form_data?.brideName || '',
      groom_name: notification.additional_metadata?.form_data?.groomName || '',
      bride_email: notification.additional_metadata?.form_data?.brideEmail || '',
      groom_email: notification.additional_metadata?.form_data?.groomEmail || '',
      event_date: notification.event_date,
      venue: notification.venue,
      coordinator_name: notification.coordinator_name,
      dj_name: notification.dj_name,
      package_type: notification.package_type,
      contact_email: notification.contact_email,
      contact_phone: notification.contact_phone,
      submitted_by: notification.submitted_by,
      guest_count: notification.guest_count,
      couple_code: coupleCode,
      registration_link: registrationLink,
      additional_metadata: notification.additional_metadata,
      timestamp: new Date().toISOString(),
      action: 'NEW_SUBMISSION' // For n8n orchestrator
    };

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Enzym3-FormProcessor/1.0' },
      body: JSON.stringify(webhookData)
    });

    console.log(`Orchestration webhook sent, status: ${response.status}`);
    return response;
  } catch (error) {
    console.error('Orchestration webhook failed:', error);
    return null;
  }
}

function generatePDFContent(submission: any): string {
  const formData = submission.form_data;
  const template = submission.form_templates;
  
  let content = `
    <html>
      <head>
        <title>${escapeHtml(template.title)} - ${escapeHtml(submission.wedding_id)}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { text-align: center; margin-bottom: 30px; }
          .wedding-id { background: #f0f0f0; padding: 10px; text-align: center; margin: 20px 0; }
          .section { margin: 20px 0; }
          .field { margin: 10px 0; }
          .label { font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${escapeHtml(template.title)}</h1>
          <div class="wedding-id">
            <strong>Wedding ID: ${escapeHtml(submission.wedding_id)}</strong>
          </div>
        </div>
  `;

  // Add form fields
  for (const [key, value] of Object.entries(formData)) {
    if (value && typeof value === 'string') {
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      content += `
        <div class="field">
          <span class="label">${escapeHtml(label)}:</span> ${escapeHtml(value)}
        </div>
      `;
    }
  }

  content += `
        <div class="section">
          <p><strong>Submitted:</strong> ${new Date(submission.created_at).toLocaleString()}</p>
        </div>
      </body>
    </html>
  `;

  return content;
}

async function sendEmailConfirmation(submission: any, pdfContent: string) {
  const template = submission.form_templates;
  
  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: [submission.contact_email],
      subject: `${escapeHtml(template.title)} Confirmation - ${escapeHtml(submission.wedding_id)}`,
      html: `
        <h1>Thank you for your submission!</h1>
        <p>Dear ${escapeHtml(submission.contact_name)},</p>
        <p>We have received your ${escapeHtml(String(template.title).toLowerCase())} and assigned it Wedding ID: <strong>${escapeHtml(submission.wedding_id)}</strong></p>
        <h2>Your Submission Details:</h2>
        <div style="background: #f9f9f9; padding: 15px; border-radius: 5px;">
          ${Object.entries(submission.form_data)
            .filter(([_, value]) => value && typeof value === 'string')
            .map(([key, value]) => {
              const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              return `<p><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`;
            })
            .join('')}
        </div>
        <p>Best regards,<br>Enzym3 Entertainment Team</p>
      `,
    });

    console.log("Form confirmation email sent:", result);
    return { success: true, status: 200, webhook_response: JSON.stringify(result) };
  } catch (error) {
    console.error("Error sending form confirmation email:", error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function sendWebhook(submission: any) {
  try {
    if (!submission.webhook_url || !isAllowedWebhook(submission.webhook_url)) {
      console.warn('Blocked or missing webhook URL');
      return;
    }
    const webhookData = {
      wedding_id: submission.wedding_id,
      submission_id: submission.id,
      form_type: submission.form_templates.form_type,
      contact_email: submission.contact_email,
      contact_name: submission.contact_name,
      form_data: submission.form_data,
      submitted_at: submission.submitted_at,
      timestamp: new Date().toISOString()
    };

    const response = await fetch(submission.webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Enzym3-FormProcessor/1.0'
      },
      body: JSON.stringify(webhookData)
    });

    console.log(`Webhook sent to ${submission.webhook_url}, status: ${response.status}`);
  } catch (error) {
    console.error("Webhook failed:", error);
  }
}

serve(handler);
