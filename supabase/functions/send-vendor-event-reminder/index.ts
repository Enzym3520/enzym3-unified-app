import React from 'npm:react@18.3.1'
import { Resend } from 'npm:resend@4.0.0'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { VendorEventReminderEmail } from '../_shared/email-templates.tsx'
import { htmlToPlainText } from '../_shared/htmlToText.ts'

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type Milestone = '14_day' | '7_day' | '3_day'

function subjectFor(milestone: Milestone, coupleName: string, dateStr: string) {
  switch (milestone) {
    case '14_day': return `Heads up — ${coupleName}'s event is in 2 weeks`
    case '7_day':  return `1 week out — ${coupleName} on ${dateStr}`
    case '3_day':  return `Final reminder — ${coupleName} in 3 days`
  }
}

function formatDateShort(iso: string): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  const date = new Date(Date.UTC(y, m - 1, d))
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Service-role gated — only DB cron/triggers should call this function
  const authHeader = req.headers.get('Authorization') ?? ''
  const token = authHeader.replace('Bearer ', '')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  if (!token || token !== serviceKey) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, serviceKey)

  let assignmentId: string | undefined
  let milestone: Milestone | undefined

  try {
    const payload = await req.json()
    assignmentId = payload.assignmentId
    milestone = payload.milestone

    if (!assignmentId || !milestone || !['14_day', '7_day', '3_day'].includes(milestone)) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid assignmentId / milestone' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Load assignment + event + vendor
    const { data: assignment, error: aErr } = await supabase
      .from('event_dj_assignments')
      .select('id, dj_user_id, status, event_id')
      .eq('id', assignmentId)
      .maybeSingle()

    if (aErr) throw aErr
    if (!assignment) {
      return new Response(JSON.stringify({ error: 'Assignment not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (['declined', 'cancelled'].includes(String(assignment.status))) {
      // Mark as skipped so we don't retry
      await supabase.from('vendor_assignment_reminders')
        .update({ email_status: 'failed', error_message: `Skipped: status=${assignment.status}` })
        .eq('assignment_id', assignmentId).eq('milestone', milestone)
      return new Response(JSON.stringify({ skipped: true, reason: 'declined_or_cancelled' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: event, error: eErr } = await supabase
      .from('event_notification_history')
      .select('id, couple_name, event_type, event_date, venue, guest_count, package_type, coordinator_name, bride_email, groom_email, primary_contact_email, secondary_contact_email, primary_contact_phone, secondary_contact_phone, dress_code, is_test')
      .eq('id', assignment.event_id)
      .maybeSingle()

    if (eErr) throw eErr
    if (!event) {
      return new Response(JSON.stringify({ error: 'Event not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (event.is_test) {
      await supabase.from('vendor_assignment_reminders')
        .update({ email_status: 'failed', error_message: 'Skipped: test event' })
        .eq('assignment_id', assignmentId).eq('milestone', milestone)
      return new Response(JSON.stringify({ skipped: true, reason: 'test_event' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: vendor, error: vErr } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name, company_name')
      .eq('id', assignment.dj_user_id)
      .maybeSingle()

    if (vErr) throw vErr
    if (!vendor?.email) {
      await supabase.from('vendor_assignment_reminders')
        .update({ email_status: 'failed', error_message: 'Vendor email missing' })
        .eq('assignment_id', assignmentId).eq('milestone', milestone)
      return new Response(JSON.stringify({ error: 'Vendor email missing' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const vendorName = vendor.company_name
      || `${vendor.first_name ?? ''} ${vendor.last_name ?? ''}`.trim()
      || 'Team Member'

    const portalLink = 'https://vendor.enzym3entertainment.vip'

    const html = await renderAsync(
      React.createElement(VendorEventReminderEmail, {
        vendorName,
        coupleName: event.couple_name || 'Client',
        eventType: event.event_type || 'event',
        eventDate: event.event_date || '',
        milestone,
        venue: event.venue || undefined,
        guestCount: event.guest_count || undefined,
        packageType: event.package_type || undefined,
        coordinatorName: event.coordinator_name || undefined,
        brideEmail: event.bride_email || undefined,
        groomEmail: event.groom_email || undefined,
        contactEmail: event.primary_contact_email || event.secondary_contact_email || undefined,
        contactPhone: event.primary_contact_phone || event.secondary_contact_phone || undefined,
        portalLink,
        dressCode: event.dress_code || undefined,
      })
    )

    const subject = subjectFor(milestone, event.couple_name || 'Client', formatDateShort(event.event_date || ''))

    console.log(`[reminder] Sending ${milestone} to ${vendor.email.substring(0, 3)}*** for assignment ${assignmentId}`)

    const { error: sendErr } = await resend.emails.send({
      from: "Enzym3 Entertainment <booking@enzym3.com>",
      to: [vendor.email],
      subject,
      html,
      text: htmlToPlainText(html),
    })

    if (sendErr) {
      await supabase.from('vendor_assignment_reminders')
        .update({ email_status: 'failed', error_message: String(sendErr.message || sendErr) })
        .eq('assignment_id', assignmentId).eq('milestone', milestone)
      throw sendErr
    }

    await supabase.from('vendor_assignment_reminders')
      .update({ email_status: 'sent', sent_at: new Date().toISOString() })
      .eq('assignment_id', assignmentId).eq('milestone', milestone)

    // In-app notification + push (non-blocking — don't fail the email if these error)
    try {
      const milestoneLabel = milestone === '14_day' ? '2 weeks away'
        : milestone === '7_day' ? '1 week away'
        : '3 days away';
      const notifTitle = `Upcoming event: ${event.couple_name || 'Client'} (${milestoneLabel})`;
      const notifBody = `${event.event_type || 'Event'} on ${formatDateShort(event.event_date || '')}${event.venue ? ` at ${event.venue}` : ''}.`;

      await supabase.from('notifications').insert({
        user_id: assignment.dj_user_id,
        type: 'reminder',
        title: notifTitle,
        content: notifBody,
        wedding_id: assignment.event_id,
        metadata: { milestone, assignment_id: assignmentId, source: 'vendor_event_reminder' },
        is_read: false,
      });

      // Fire-and-forget push notification
      await supabase.functions.invoke('send-push-notification', {
        body: {
          userId: assignment.dj_user_id,
          title: notifTitle,
          body: notifBody,
          url: '/',
          tag: `vendor-reminder-${assignmentId}-${milestone}`,
        },
      });
    } catch (notifErr) {
      console.error('[reminder] In-app/push notification failed (email already sent):', notifErr);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[send-vendor-event-reminder] Error:', error)
    if (assignmentId && milestone) {
      try {
        await supabase.from('vendor_assignment_reminders')
          .update({ email_status: 'failed', error_message: String((error as Error).message || error) })
          .eq('assignment_id', assignmentId).eq('milestone', milestone)
      } catch (_) { /* swallow */ }
    }
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
