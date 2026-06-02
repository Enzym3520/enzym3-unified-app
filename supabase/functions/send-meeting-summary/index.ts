import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function escapeHtml(unsafe: string | null | undefined): string {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // JWT validation
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const userId = claimsData.claims.sub as string;
    const userEmail = ((claimsData.claims.email as string) || '').toLowerCase();

    const { summaryId } = await req.json();
    if (!summaryId) {
      return new Response(JSON.stringify({ error: 'summaryId required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get summary with related data
    const { data: summary, error: summaryError } = await supabase
      .from('meeting_summaries')
      .select('*')
      .eq('id', summaryId)
      .single();

    if (summaryError || !summary) {
      console.error('Summary not found:', summaryError);
      return new Response(JSON.stringify({ error: 'Summary not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (summary.status !== 'completed') {
      return new Response(JSON.stringify({ error: 'Summary not ready' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify caller is linked to this event
    const weddingId = summary.wedding_id;
    let isLinked = false;

    // Check couple_codes
    const { data: cc } = await supabase
      .from('couple_codes')
      .select('id')
      .eq('wedding_id', weddingId)
      .eq('used_by', userId)
      .limit(1)
      .maybeSingle();
    if (cc) isLinked = true;

    if (!isLinked) {
      // Check event emails
      const { data: evt } = await supabase
        .from('event_notification_history')
        .select('contact_email, bride_email, groom_email')
        .eq('id', weddingId)
        .single();
      if (evt) {
        const emails = [evt.contact_email, evt.bride_email, evt.groom_email]
          .filter(Boolean).map((e: string) => e.toLowerCase());
        if (emails.includes(userEmail)) isLinked = true;
      }
    }

    if (!isLinked) {
      // Check vendor assignments
      const { data: assignment } = await supabase
        .from('event_dj_assignments')
        .select('id')
        .eq('event_id', weddingId)
        .eq('dj_user_id', userId)
        .in('status', ['confirmed', 'pending', 'assigned'])
        .limit(1)
        .maybeSingle();
      if (assignment) isLinked = true;
    }

    if (!isLinked) {
      // Check admin role
      const { data: role } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .limit(1)
        .maybeSingle();
      if (role) isLinked = true;
    }

    if (!isLinked) {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get wedding/event data for email recipients
    const { data: event } = await supabase
      .from('event_notification_history')
      .select('couple_name, contact_email, bride_email, groom_email, event_date, event_type')
      .eq('id', weddingId)
      .single();

    if (!event) {
      console.error('Event not found for wedding_id:', weddingId);
      return new Response(JSON.stringify({ error: 'Event not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Collect unique email recipients
    const emails = new Set<string>();
    if (event.contact_email) emails.add(event.contact_email);
    if (event.bride_email) emails.add(event.bride_email);
    if (event.groom_email) emails.add(event.groom_email);

    if (emails.size === 0) {
      console.warn('No email recipients found');
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'Email not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Format action items for email
    const actionItems = (summary.action_items as Array<{ task: string; responsible: string; priority: string; deadline?: string }>) || [];
    const actionItemsHtml = actionItems.length > 0
      ? actionItems.map((item) =>
        `<tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${escapeHtml(item.task)}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: center;">${escapeHtml(item.responsible)}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: center;">
            <span style="background: ${item.priority === 'high' ? '#fee2e2' : item.priority === 'medium' ? '#fef3c7' : '#dcfce7'}; padding: 2px 8px; border-radius: 12px; font-size: 12px;">${escapeHtml(item.priority)}</span>
          </td>
        </tr>`
      ).join('')
      : '<tr><td colspan="3" style="padding: 12px; text-align: center; color: #999;">No action items identified</td></tr>';

    // Convert markdown summary to simple HTML (escape first, then apply formatting)
    const summaryHtml = escapeHtml(summary.ai_summary)
      .replace(/\n\n/g, '</p><p>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');

    const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 4px;">Meeting Summary</h1>
        <p style="color: #666; font-size: 14px;">Your planning session recap</p>
      </div>

      <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <h2 style="font-size: 18px; margin-top: 0; color: #1a1a1a;">📋 Recap</h2>
        <p style="line-height: 1.6;">${summaryHtml}</p>
      </div>

      <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <h2 style="font-size: 18px; margin-top: 0; color: #1a1a1a;">✅ Action Items</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <thead>
            <tr style="border-bottom: 2px solid #e5e7eb;">
              <th style="padding: 8px 12px; text-align: left;">Task</th>
              <th style="padding: 8px 12px; text-align: center;">Owner</th>
              <th style="padding: 8px 12px; text-align: center;">Priority</th>
            </tr>
          </thead>
          <tbody>
            ${actionItemsHtml}
          </tbody>
        </table>
      </div>

      <div style="text-align: center; padding: 16px;">
        <p style="color: #999; font-size: 12px;">
          This summary was automatically generated from your planning meeting.<br>
          Log in to your portal to view the full transcript.
        </p>
      </div>
    </body>
    </html>`;

    // Send email via Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'DJ Planning <onboarding@resend.dev>',
        to: Array.from(emails),
        subject: `Meeting Summary — ${event.couple_name}`,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errText = await emailResponse.text();
      console.error('Resend error:', errText);
      return new Response(JSON.stringify({ error: 'Failed to send email' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Mark as sent
    await supabase
      .from('meeting_summaries')
      .update({ sent_at: new Date().toISOString() })
      .eq('id', summaryId);

    console.log('Meeting summary email sent to:', Array.from(emails));

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('send-meeting-summary error:', error);
    return new Response(JSON.stringify({ error: 'Failed to send summary email' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
