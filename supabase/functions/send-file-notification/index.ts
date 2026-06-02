import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Client theme (Blue - matches portal)
const brandColors = {
  header: '#6ba3be',
  headerDark: '#5a92ad',
  accent: '#6ba3be',
  white: '#ffffff',
  background: '#f5f5f5',
  textPrimary: '#1f2937',
  textSecondary: '#4a4a4a',
  textMuted: '#6b7280',
  border: '#e5e7eb'
};

const logoUrl = 'https://ytembomoyhuwdtrzlwbi.supabase.co/storage/v1/object/public/email-assets/logo-blue.png?v=1';

function escapeHtml(unsafe: string | null | undefined): string {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

interface NotificationRequest {
  item_id: string;
  item_type: 'file' | 'link';
}

/**
 * Server-side 3-step ownership check (mirrors resolveClientEvent).
 * Returns the wedding_id if the user owns it, or null.
 */
async function verifyEventOwnership(
  supabase: any,
  userId: string,
  userEmailRaw: string,
  weddingId: string
): Promise<boolean> {
  const userEmail = userEmailRaw.toLowerCase();
  // Step 1: couple_codes
  const { data: coupleCode } = await supabase
    .from('couple_codes')
    .select('wedding_id')
    .eq('wedding_id', weddingId)
    .or(`bride_email.ilike.${userEmail},groom_email.ilike.${userEmail}`)
    .maybeSingle();
  if (coupleCode) return true;

  // Step 2: event_notification_history email match
  const { data: event } = await supabase
    .from('event_notification_history')
    .select('id')
    .eq('id', weddingId)
    .or(`contact_email.ilike.${userEmail},bride_email.ilike.${userEmail},groom_email.ilike.${userEmail}`)
    .maybeSingle();
  if (event) return true;

  // Step 3: vendor_client_assignments
  const { data: vca } = await supabase
    .from('vendor_client_assignments')
    .select('event_id')
    .eq('client_user_id', userId)
    .eq('event_id', weddingId)
    .eq('status', 'active')
    .maybeSingle();
  if (vca) return true;

  return false;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing file notification request...');

    // Validate JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Create user-scoped client to validate JWT
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      console.error('JWT validation failed:', claimsError);
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub as string;
    const userEmail = claimsData.claims.email as string;
    console.log(`Authenticated user: ${userId} (${userEmail})`);

    // Parse request body
    const { item_id, item_type }: NotificationRequest = await req.json();

    if (!item_id || !item_type) {
      return new Response(
        JSON.stringify({ error: 'item_id and item_type are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (item_type !== 'file' && item_type !== 'link') {
      return new Response(
        JSON.stringify({ error: 'item_type must be "file" or "link"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Service role client for DB operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch item details
    let itemData: any;
    let weddingId: string;
    let itemLabel: string;
    let itemName: string;

    if (item_type === 'file') {
      const { data, error } = await supabase
        .from('files')
        .select('id, label, file_name, wedding_id, created_at, sent_to_coordinator')
        .eq('id', item_id)
        .single();

      if (error || !data) {
        return new Response(
          JSON.stringify({ error: 'File not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (data.sent_to_coordinator) {
        return new Response(
          JSON.stringify({ success: true, message: 'Already sent to coordinator' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      itemData = data;
      weddingId = data.wedding_id;
      itemLabel = data.label;
      itemName = data.file_name;
    } else {
      const { data, error } = await supabase
        .from('links')
        .select('id, label, url, link_type, wedding_id, created_at, sent_to_coordinator')
        .eq('id', item_id)
        .single();

      if (error || !data) {
        return new Response(
          JSON.stringify({ error: 'Link not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (data.sent_to_coordinator) {
        return new Response(
          JSON.stringify({ success: true, message: 'Already sent to coordinator' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      itemData = data;
      weddingId = data.wedding_id;
      itemLabel = data.label;
      itemName = data.url;
    }

    // Verify ownership via 3-step check
    const isOwner = await verifyEventOwnership(supabase, userId, userEmail, weddingId);
    if (!isOwner) {
      console.error(`User ${userId} does not own wedding ${weddingId}`);
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch wedding details
    const { data: wedding, error: weddingError } = await supabase
      .from('event_notification_history')
      .select('id, couple_name, event_date, contact_email, event_type')
      .eq('id', weddingId)
      .single();

    if (weddingError || !wedding) {
      return new Response(
        JSON.stringify({ error: 'Wedding not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch admin users
    const { data: adminRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (rolesError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch admin users' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!adminRoles || adminRoles.length === 0) {
      await updateSentStatus(supabase, item_type, item_id);
      return new Response(
        JSON.stringify({ success: true, message: 'No admins to notify' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const adminUserIds = adminRoles.map(role => role.user_id);

    const { data: adminProfiles } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name')
      .in('id', adminUserIds)
      .not('email', 'is', null);

    // Format timestamps
    const uploadedAt = new Date(itemData.created_at).toLocaleString('en-US', {
      dateStyle: 'full', timeStyle: 'short', timeZone: 'America/Denver'
    });
    const eventDate = new Date(wedding.event_date + 'T12:00:00').toLocaleDateString('en-US', {
      dateStyle: 'long', timeZone: 'America/Phoenix'
    });

    const isFile = item_type === 'file';
    const emoji = isFile ? '📁' : '🔗';
    const typeLabel = isFile ? 'File' : 'Link';

    const emailSubject = `${emoji} New ${typeLabel} Shared - ${wedding.couple_name}`;
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; margin: 0; padding: 0; background-color: ${brandColors.background};">
          <div style="background-color: ${brandColors.header}; padding: 30px 20px; text-align: center;">
            <img src="${logoUrl}" alt="Enzym3 Entertainment" width="180" style="max-width: 100%; height: auto;" />
          </div>
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: ${brandColors.white}; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <h2 style="color: ${brandColors.textPrimary}; margin-top: 0; margin-bottom: 24px;">${emoji} New ${typeLabel} Shared</h2>
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid ${brandColors.accent}; margin-bottom: 20px;">
                <p style="margin: 8px 0;"><strong>Couple:</strong> ${escapeHtml(wedding.couple_name)}</p>
                <p style="margin: 8px 0;"><strong>Event Date:</strong> ${eventDate}</p>
                <p style="margin: 8px 0;"><strong>Event Type:</strong> ${escapeHtml(wedding.event_type)}</p>
              </div>
              <div style="background: linear-gradient(135deg, ${brandColors.header} 0%, ${brandColors.headerDark} 100%); color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; margin-bottom: 12px;">${typeLabel} Details</h3>
                <p style="margin: 8px 0;"><strong>Label:</strong> ${escapeHtml(itemLabel)}</p>
                <p style="margin: 8px 0;"><strong>${isFile ? 'File Name' : 'URL'}:</strong> ${escapeHtml(itemName)}</p>
                <p style="margin: 8px 0;"><strong>Shared:</strong> ${uploadedAt}</p>
              </div>
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid ${brandColors.border};">
                <p style="color: ${brandColors.textMuted}; font-size: 12px; margin: 4px 0;">This is an automated notification from your wedding management system.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailText = `New ${typeLabel} Shared\n\nCouple: ${wedding.couple_name}\nEvent Date: ${eventDate}\nEvent Type: ${wedding.event_type}\n\n${typeLabel} Details:\nLabel: ${itemLabel}\n${isFile ? 'File Name' : 'URL'}: ${itemName}\nShared: ${uploadedAt}`;

    // Send emails to all admins
    const emailResults = [];
    for (const profile of adminProfiles || []) {
      if (!profile?.email) continue;

      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: "Enzym3 Entertainment <booking@enzym3.com>",
            to: [profile.email],
            subject: emailSubject,
            html: emailHtml,
            text: emailText,
          }),
        });

        if (!response.ok) {
          emailResults.push({ recipient: profile.email, success: false });
          continue;
        }

        const result = await response.json();
        emailResults.push({ recipient: profile.email, success: true, messageId: result.id });

        // In-app notification
        await supabase.from('notifications').insert({
          user_id: profile.id,
          wedding_id: weddingId,
          type: 'file_uploaded',
          title: `New ${typeLabel} from ${wedding.couple_name}`,
          content: `${itemLabel}: ${itemName}`,
          metadata: { item_type, item_id, item_label: itemLabel, item_name: itemName }
        });
      } catch (emailError: any) {
        emailResults.push({ recipient: profile.email, success: false, error: emailError.message });
      }
    }

    await updateSentStatus(supabase, item_type, item_id);

    const successCount = emailResults.filter(r => r.success).length;
    return new Response(
      JSON.stringify({ success: true, message: `Sent ${successCount} notification(s) to coordinators`, details: emailResults }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in send-file-notification function:', error);
    return new Response(
      JSON.stringify({ error: 'An internal error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function updateSentStatus(supabase: any, itemType: 'file' | 'link', itemId: string) {
  const tableName = itemType === 'file' ? 'files' : 'links';
  const { error } = await supabase
    .from(tableName)
    .update({ sent_to_coordinator: true, sent_at: new Date().toISOString() })
    .eq('id', itemId);

  if (error) {
    console.error(`Failed to update sent status for ${itemType}:`, error);
  }
}
