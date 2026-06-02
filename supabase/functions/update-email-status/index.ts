import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-secret-token, x-webhook-signature',
};

interface ZeptomailWebhookPayload {
  event_name: 'email_open' | 'email_link_click' | 'email_bounce';
  event_message: Array<{
    email_info: {
      client_reference: string;
      email_reference: string;
    };
    time: string;
    ip_address?: string;
    device_name?: string;
    browser_name?: string;
    bounce_type?: string;
    bounce_reason?: string;
  }>;
}

interface DirectPayload {
  wedding_id?: string;
  notification_id?: string;
  event_id?: string;
  email_status: 'opened' | 'clicked' | 'bounced' | 'sent' | 'delivered' | 'failed';
  email_id?: string;
  secret_token?: string;
  email_sent_at?: string;
  error_message?: string;
  metadata?: Record<string, any>;
}

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Verify HMAC-SHA256 webhook signature
async function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): Promise<boolean> {
  if (!signature || !secret) return false;
  
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signatureBytes = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payload)
    );
    
    const expectedSignature = Array.from(new Uint8Array(signatureBytes))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Constant-time comparison
    if (signature.length !== expectedSignature.length) return false;
    let mismatch = 0;
    for (let i = 0; i < signature.length; i++) {
      mismatch |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
    }
    return mismatch === 0;
  } catch {
    return false;
  }
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Handle GET/HEAD requests for webhook verification
  if (req.method === 'GET' || req.method === 'HEAD') {
    console.log(`[EMAIL-STATUS] Verification request: ${req.method}`);
    return new Response(
      req.method === 'HEAD' ? null : JSON.stringify({ 
        status: 'ready', 
        service: 'email-status-webhook',
        version: '2.0'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  console.log(`[EMAIL-STATUS] Received ${req.method} request`);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const webhookSecret = Deno.env.get('EMAIL_STATUS_SECRET');
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Read body as text for signature verification
    const bodyText = await req.text();
    
    // Authentication: require either HMAC signature or secret token
    const hmacSignature = req.headers.get('x-webhook-signature');
    const secretToken = req.headers.get('x-secret-token');
    
    let isAuthenticated = false;
    
    // Method 1: HMAC signature verification (preferred for Zeptomail)
    if (hmacSignature && webhookSecret) {
      isAuthenticated = await verifyWebhookSignature(bodyText, hmacSignature, webhookSecret);
      if (!isAuthenticated) {
        console.warn('[EMAIL-STATUS] HMAC signature verification failed');
      }
    }
    
    // Method 2: Secret token header (for Zapier/n8n integrations)
    if (!isAuthenticated && secretToken && webhookSecret) {
      isAuthenticated = secretToken === webhookSecret;
      if (!isAuthenticated) {
        console.warn('[EMAIL-STATUS] Secret token verification failed');
      }
    }
    
    // Method 3: Secret token in body (legacy support)
    let body: any;
    try {
      body = JSON.parse(bodyText);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!isAuthenticated && body.secret_token && webhookSecret) {
      isAuthenticated = body.secret_token === webhookSecret;
    }
    
    // If webhook secret is configured but auth failed, reject
    if (webhookSecret && !isAuthenticated) {
      console.error('[EMAIL-STATUS] Authentication failed - rejecting request');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - invalid or missing authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log request metadata (no PII)
    console.log(`[EMAIL-STATUS] Processing authenticated request`);

    let weddingId: string;
    let emailStatus: string;
    let metadata: Record<string, any> = {};
    let shouldUpdateEmailSentAt = false;
    let emailSentAt: string | null = null;

    // Parse Resend webhook format
    if (body.type && typeof body.type === 'string' && body.type.startsWith('email.') && body.data) {
      const resendData = body.data;
      
      // Verify Resend webhook signature (svix) if secret is configured
      const resendWebhookSecret = Deno.env.get('RESEND_WEBHOOK_SECRET');
      if (resendWebhookSecret) {
        const svixId = req.headers.get('svix-id');
        const svixTimestamp = req.headers.get('svix-timestamp');
        const svixSignature = req.headers.get('svix-signature');
        
        if (!svixId || !svixTimestamp || !svixSignature) {
          console.error('[EMAIL-STATUS] Missing svix signature headers');
          return new Response(
            JSON.stringify({ error: 'Missing signature headers' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Verify timestamp is within 5 minutes
        const timestampSeconds = parseInt(svixTimestamp, 10);
        const now = Math.floor(Date.now() / 1000);
        if (Math.abs(now - timestampSeconds) > 300) {
          console.error('[EMAIL-STATUS] Svix timestamp too old');
          return new Response(
            JSON.stringify({ error: 'Timestamp too old' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Verify HMAC signature
        const signedContent = `${svixId}.${svixTimestamp}.${bodyText}`;
        // Resend secret is prefixed with "whsec_" and base64-encoded
        const secretBytes = Uint8Array.from(atob(resendWebhookSecret.replace('whsec_', '')), c => c.charCodeAt(0));
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey('raw', secretBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
        const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(signedContent));
        const expectedSig = btoa(String.fromCharCode(...new Uint8Array(sig)));
        
        // svix-signature can contain multiple signatures separated by spaces (v1,sig1 v1,sig2)
        const signatures = svixSignature.split(' ').map(s => s.replace('v1,', ''));
        const isValid = signatures.some(s => s === expectedSig);
        
        if (!isValid) {
          console.error('[EMAIL-STATUS] Resend webhook signature verification failed');
          return new Response(
            JSON.stringify({ error: 'Invalid signature' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        isAuthenticated = true;
        console.log('[EMAIL-STATUS] Resend webhook signature verified');
      }
      
      // Extract notification ID from tags
      const tags = resendData.tags || {};
      const notificationId = tags.notification_id;
      
      if (!notificationId) {
        console.warn('[EMAIL-STATUS] Resend webhook missing notification_id tag');
        return new Response(
          JSON.stringify({ error: 'Missing notification_id tag' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      weddingId = notificationId;
      
      // Map Resend event types to our status values
      const eventType = body.type;
      switch (eventType) {
        case 'email.delivered':
          emailStatus = 'delivered';
          metadata.email_delivered_at = resendData.created_at;
          shouldUpdateEmailSentAt = true;
          emailSentAt = resendData.created_at || new Date().toISOString();
          break;
        case 'email.opened':
          emailStatus = 'opened';
          metadata.email_opened_at = resendData.created_at;
          break;
        case 'email.clicked':
          emailStatus = 'clicked';
          metadata.email_clicked_at = resendData.created_at;
          break;
        case 'email.bounced':
          emailStatus = 'bounced';
          metadata.email_bounced_at = resendData.created_at;
          break;
        case 'email.complained':
          emailStatus = 'complained';
          metadata.email_complained_at = resendData.created_at;
          break;
        case 'email.delivery_delayed':
          emailStatus = 'delayed';
          metadata.email_delayed_at = resendData.created_at;
          break;
        default:
          emailStatus = eventType.replace('email.', '');
      }
      
      if (resendData.email_id) metadata.email_id = resendData.email_id;
      if (resendData.to) metadata.email_to = resendData.to;
      
      console.log(`[EMAIL-STATUS] Resend webhook - ID: ${weddingId}, Event: ${eventType}, Status: ${emailStatus}`);
    }
    // Parse Zeptomail webhook format
    else if (body.event_name && body.event_message) {
      const payload = body as ZeptomailWebhookPayload;
      const event = payload.event_message[0];
      
      weddingId = event.email_info.client_reference;
      
      switch (payload.event_name) {
        case 'email_open':
          emailStatus = 'opened';
          metadata.email_opened_at = event.time;
          if (event.device_name) metadata.email_open_device = event.device_name;
          if (event.browser_name) metadata.email_open_browser = event.browser_name;
          break;
        case 'email_link_click':
          emailStatus = 'clicked';
          metadata.email_clicked_at = event.time;
          if (event.device_name) metadata.email_click_device = event.device_name;
          if (event.browser_name) metadata.email_click_browser = event.browser_name;
          break;
        case 'email_bounce':
          emailStatus = 'bounced';
          metadata.email_bounced_at = event.time;
          if (event.bounce_type) metadata.email_bounce_type = event.bounce_type;
          if (event.bounce_reason) metadata.email_bounce_reason = event.bounce_reason;
          break;
        default:
          throw new Error(`Unknown event: ${payload.event_name}`);
      }
      
      if (event.email_info.email_reference) {
        metadata.email_id = event.email_info.email_reference;
      }
    } 
    // Parse direct/manual format
    else if ((body.wedding_id || body.notification_id || body.event_id) && body.email_status) {
      const payload = body as DirectPayload;
      weddingId = payload.wedding_id || payload.notification_id || payload.event_id!;
      emailStatus = payload.email_status;
      
      // Validate email_status value
      const validStatuses = ['opened', 'clicked', 'bounced', 'sent', 'delivered', 'failed'];
      if (!validStatuses.includes(emailStatus)) {
        return new Response(
          JSON.stringify({ error: 'Invalid email_status value' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (emailStatus === 'sent' || emailStatus === 'delivered') {
        shouldUpdateEmailSentAt = true;
        emailSentAt = payload.email_sent_at || new Date().toISOString();
        metadata.email_delivered_at = emailSentAt;
      }
      
      if (payload.email_id) metadata.email_id = payload.email_id;
      if (payload.error_message) metadata.error_message = payload.error_message;
      if (payload.metadata) metadata = { ...metadata, ...payload.metadata };
      
      console.log(`[EMAIL-STATUS] Direct webhook - ID: ${weddingId}, Status: ${emailStatus}`);
    }
    else {
      return new Response(
        JSON.stringify({ error: 'Invalid payload format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate wedding_id format
    if (!UUID_REGEX.test(weddingId)) {
      console.error(`[EMAIL-STATUS] Invalid wedding ID format`);
      return new Response(
        JSON.stringify({ error: 'Invalid wedding ID format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate wedding_id exists
    const { data: notification, error: fetchError } = await supabase
      .from('event_notification_history')
      .select('id, additional_metadata')
      .eq('id', weddingId)
      .single();

    if (fetchError || !notification) {
      console.error(`[EMAIL-STATUS] Wedding ID not found`);
      return new Response(
        JSON.stringify({ error: 'Wedding ID not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Merge new metadata with existing
    const existingMetadata = notification.additional_metadata || {};
    const updatedMetadata = {
      ...existingMetadata,
      email_status: emailStatus,
      ...metadata,
      last_email_status_update: new Date().toISOString()
    };

    // Update the notification
    const updateData: any = { 
      additional_metadata: updatedMetadata
    };
    
    if (shouldUpdateEmailSentAt && emailSentAt) {
      updateData.email_sent_at = emailSentAt;
      console.log(`[EMAIL-STATUS] Setting email_sent_at`);
    }
    
    const { error: updateError } = await supabase
      .from('event_notification_history')
      .update(updateData)
      .eq('id', weddingId);

    if (updateError) {
      console.error('[EMAIL-STATUS] Update error:', updateError.message);
      throw updateError;
    }

    console.log(`[EMAIL-STATUS] Updated wedding ${weddingId} with status: ${emailStatus}`);

    // Forward to Zapier webhook if configured
    let zapierWebhookUrl: string | undefined;
    
    if (emailStatus === 'opened') {
      zapierWebhookUrl = Deno.env.get('ZAPIER_EMAIL_OPEN_URL');
    } else if (emailStatus === 'clicked') {
      zapierWebhookUrl = Deno.env.get('ZAPIER_EMAIL_CLICK_URL');
    } else if (emailStatus === 'bounced') {
      zapierWebhookUrl = Deno.env.get('ZAPIER_EMAIL_BOUNCE_URL');
    } else if (emailStatus === 'sent') {
      zapierWebhookUrl = Deno.env.get('ZAPIER_EMAIL_SENT_URL');
    } else if (emailStatus === 'failed') {
      zapierWebhookUrl = Deno.env.get('ZAPIER_EMAIL_FAILED_URL');
    }
    
    if (!zapierWebhookUrl) {
      zapierWebhookUrl = Deno.env.get('ZAPIER_EMAIL_WEBHOOK_URL');
    }
    
    if (zapierWebhookUrl) {
      console.log(`[EMAIL-STATUS] Forwarding ${emailStatus} event to Zapier`);
      try {
        await fetch(zapierWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wedding_id: weddingId,
            email_status: emailStatus,
            metadata: metadata,
            timestamp: new Date().toISOString(),
            source: 'zeptomail'
          })
        });
        console.log('[EMAIL-STATUS] Forwarded to Zapier successfully');
      } catch (zapierError) {
        console.error('[EMAIL-STATUS] Failed to forward to Zapier');
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        wedding_id: weddingId,
        email_status: emailStatus,
        message: 'Email status updated successfully' 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[EMAIL-STATUS] Error:', error.message);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
