import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function verifyOwnership(serviceClient: any, userId: string, userEmail: string, weddingId: string): Promise<boolean> {
  // Step 1: Check couple_codes
  const { data: coupleCode } = await serviceClient
    .from('couple_codes')
    .select('id')
    .eq('wedding_id', weddingId)
    .eq('used_by', userId)
    .limit(1)
    .maybeSingle();
  if (coupleCode) return true;

  // Step 2: Check event emails
  const { data: event } = await serviceClient
    .from('event_notification_history')
    .select('contact_email, bride_email, groom_email')
    .eq('id', weddingId)
    .single();
  if (event) {
    const emails = [event.contact_email, event.bride_email, event.groom_email]
      .filter(Boolean)
      .map((e: string) => e.toLowerCase());
    if (emails.includes(userEmail.toLowerCase())) return true;
  }

  // Step 3: Check vendor assignments
  const { data: assignment } = await serviceClient
    .from('event_dj_assignments')
    .select('id')
    .eq('event_id', weddingId)
    .eq('dj_user_id', userId)
    .in('status', ['confirmed', 'pending', 'assigned'])
    .limit(1)
    .maybeSingle();
  if (assignment) return true;

  return false;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    const userEmail = user.email || '';

    const { booking_id } = await req.json();

    if (!booking_id) {
      throw new Error('Booking ID is required');
    }

    // Service client for ownership checks
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get booking details
    const { data: booking, error: bookingError } = await serviceClient
      .from('bookings')
      .select('*')
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) {
      throw new Error('Booking not found');
    }

    // Verify ownership of the wedding
    const isOwner = await verifyOwnership(serviceClient, userId, userEmail, booking.wedding_id);
    if (!isOwner) {
      console.error('Ownership check failed for user:', userId, 'wedding:', booking.wedding_id);
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update booking status
    const { error: updateError } = await serviceClient
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', booking_id);

    if (updateError) {
      throw updateError;
    }

    // Delete Google Calendar event via n8n webhook if event exists
    if (booking.google_event_id) {
      try {
        let coupleName = 'Unknown Couple';
        if (booking.wedding_id) {
          const { data: event } = await serviceClient
            .from('event_notification_history')
            .select('couple_name')
            .eq('id', booking.wedding_id)
            .single();
          if (event?.couple_name) {
            coupleName = event.couple_name;
          }
        }

        await deleteCalendarEventViaN8n(booking.google_event_id, booking_id, coupleName);
      } catch (calError) {
        console.error('Failed to trigger calendar deletion via n8n:', calError);
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return new Response(
      JSON.stringify({ error: 'An internal error occurred' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});

async function deleteCalendarEventViaN8n(googleEventId: string, bookingId: string, coupleName: string) {
  const webhookUrl = Deno.env.get('N8N_CANCEL_BOOKING_WEBHOOK_URL');

  if (!webhookUrl) {
    console.warn('N8N_CANCEL_BOOKING_WEBHOOK_URL not configured — skipping calendar deletion');
    return;
  }

  console.log('Sending calendar delete request to n8n for event:', googleEventId);

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      google_event_id: googleEventId,
      booking_id: bookingId,
      couple_name: coupleName,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('n8n calendar delete webhook returned error:', response.status, text);
    throw new Error(`n8n webhook failed with status ${response.status}`);
  }

  console.log('n8n calendar delete webhook called successfully');
}
