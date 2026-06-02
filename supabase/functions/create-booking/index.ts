import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};


// Input validation schema
const BookingSchema = z.object({
  wedding_id: z.string().uuid(),
  booking_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  booking_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Invalid time format'),
  meeting_type: z.enum(['dj_details', 'consultation', 'follow_up']).default('dj_details'),
  meeting_format: z.enum(['in_person', 'online']).default('in_person'),
  customer_notes: z.string().max(2000).optional().nullable(),
  vendor_id: z.string().uuid().optional().nullable(),
});

function escapeHtml(unsafe: string | null | undefined): string {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Format meeting type for display
function formatMeetingType(type: string): string {
  const labels: Record<string, string> = {
    'dj_details': 'DJ Details Meeting',
    'consultation': 'Quick Consultation',
    'follow_up': 'Follow-up Call'
  };
  return labels[type] || type;
}

// Format meeting format for display
function formatMeetingFormat(format: string): string {
  const labels: Record<string, string> = {
    'in_person': 'In-Person',
    'online': 'Online'
  };
  return labels[format] || format;
}

// Format date for display with weekday (e.g., "Saturday, February 7, 2026")
function formatDateWithWeekday(dateStr: string): string {
  try {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  } catch {
    return dateStr;
  }
}

// Format date for display (e.g., "February 13, 2026")
function formatDateSimple(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  } catch {
    return dateStr;
  }
}

// Format time for display (e.g., "1:00 PM")
function formatTimeDisplay(timeStr: string): string {
  const [hour, min] = timeStr.split(':').map(Number);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${String(min).padStart(2, '0')} ${period}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header found');
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract JWT from "Bearer <token>"
    const jwt = authHeader.replace('Bearer ', '');

    // Create Supabase client with JWT for authenticated queries
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: authHeader
          }
        }
      }
    );

    // Verify authentication via getClaims
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(jwt);
    if (claimsError || !claimsData?.claims) {
      console.error('Auth error:', claimsError);
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub as string;
    const userEmail = ((claimsData.claims.email as string) || '').toLowerCase();

    const body = await req.json();
    
    // Validate input (before ownership check to fail fast on bad data)
    const parseResult = BookingSchema.safeParse(body);
    if (!parseResult.success) {
      console.log('Invalid request:', parseResult.error.flatten());
      return new Response(
        JSON.stringify({ error: 'Invalid booking details' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { wedding_id, booking_date, booking_time, meeting_type, meeting_format, customer_notes, vendor_id } = parseResult.data;

    // Service client for ownership verification
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 3-step ownership verification
    let isOwner = false;

    // Step 1: couple_codes
    const { data: cc } = await serviceClient
      .from('couple_codes')
      .select('id')
      .eq('wedding_id', wedding_id)
      .eq('used_by', userId)
      .limit(1)
      .maybeSingle();
    if (cc) isOwner = true;

    if (!isOwner) {
      // Step 2: event emails
      const { data: evt } = await serviceClient
        .from('event_notification_history')
        .select('contact_email, bride_email, groom_email')
        .eq('id', wedding_id)
        .single();
      if (evt) {
        const emails = [evt.contact_email, evt.bride_email, evt.groom_email]
          .filter(Boolean).map((e: string) => e.toLowerCase());
        if (emails.includes(userEmail)) isOwner = true;
      }
    }

    if (!isOwner) {
      // Step 3: vendor assignments
      const { data: assignment } = await serviceClient
        .from('event_dj_assignments')
        .select('id')
        .eq('event_id', wedding_id)
        .eq('dj_user_id', userId)
        .in('status', ['confirmed', 'pending', 'assigned'])
        .limit(1)
        .maybeSingle();
      if (assignment) isOwner = true;
    }

    if (!isOwner) {
      console.error('Ownership check failed for user:', userId, 'wedding:', wedding_id);
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get wedding details for calendar event
    console.log('Querying wedding_id:', wedding_id);
    
    const { data: wedding, error: weddingError } = await serviceClient
      .from('event_notification_history')
      .select('couple_name, contact_email, event_date, bride_email, groom_email, venue, event_type, package_type, guest_count, hours_booked, dj_name, coordinator_name, contact_phone')
      .eq('id', wedding_id)
      .maybeSingle();

    if (weddingError) {
      console.error('Wedding query error:', weddingError);
      return new Response(
        JSON.stringify({ error: 'Unable to access wedding details' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!wedding) {
      console.error('No wedding found for id:', wedding_id);
      return new Response(
        JSON.stringify({ error: 'Wedding not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Look up assigned vendor if not provided
    let resolvedVendorId = vendor_id || null;
    if (!resolvedVendorId) {
      const { data: assignment } = await serviceClient
        .from('event_dj_assignments')
        .select('dj_user_id')
        .eq('event_id', wedding_id)
        .in('status', ['confirmed', 'pending'])
        .limit(1)
        .maybeSingle();
      if (assignment) {
        resolvedVendorId = assignment.dj_user_id;
      }
    }

    // Check if slot is still available (prevent race conditions)
    let slotQuery = supabase
      .from('bookings')
      .select('id')
      .eq('booking_date', booking_date)
      .eq('booking_time', booking_time)
      .neq('status', 'cancelled');

    if (resolvedVendorId) {
      slotQuery = slotQuery.eq('vendor_id', resolvedVendorId);
    }

    const { data: existingBooking, error: checkError } = await slotQuery.maybeSingle();

    if (checkError) {
      console.error('Error checking slot availability:', checkError);
    }

    if (existingBooking) {
      return new Response(
        JSON.stringify({ 
          error: 'This time slot was just booked by someone else. Please select a different time.' 
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create booking in database
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        wedding_id,
        booking_date,
        booking_time,
        meeting_type,
        meeting_format,
        customer_notes,
        vendor_id: resolvedVendorId,
        status: 'scheduled'
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Booking creation error:', bookingError);
      return new Response(
        JSON.stringify({ error: 'Unable to create booking. Please try again.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate deterministic JaaS meeting link
    const JAAS_APP_ID = Deno.env.get('JAAS_APP_ID') || '';
    const jitsiRoomId = booking.id.slice(0, 8);
    const meetLink = JAAS_APP_ID
      ? `https://8x8.vc/${JAAS_APP_ID}/vibesheet-${jitsiRoomId}`
      : `https://meet.jit.si/vibesheet-${jitsiRoomId}`;

    // Save Jitsi meeting link to booking
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ meeting_link: meetLink })
      .eq('id', booking.id);

    if (updateError) {
      console.error('Failed to save Jitsi meeting link:', updateError);
    } else {
      console.log('Saved Jitsi meeting link:', meetLink);
    }

    // Send email notifications
    try {
      await sendBookingNotifications({
        booking,
        wedding,
        booking_date,
        booking_time,
        meeting_type,
        meeting_format,
        customer_notes,
        meetLink
      });
    } catch (emailError) {
      console.error('Failed to send email notifications:', emailError);
      // Continue even if email fails
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        booking,
        meetLink
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error creating booking:', error);
    return new Response(
      JSON.stringify({ error: 'Unable to create booking. Please try again.' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

async function sendBookingNotifications(details: any) {
  const { booking, wedding, booking_date, booking_time, meeting_type, meeting_format, customer_notes, meetLink } = details;
  
  const webhookUrl = Deno.env.get('N8N_BOOKING_NOTIFICATION_WEBHOOK_URL');
  if (!webhookUrl) {
    console.warn('N8N_BOOKING_NOTIFICATION_WEBHOOK_URL not configured — skipping admin notification');
    return;
  }

  try {
    console.log('Sending booking notification to n8n webhook');

    const payload = {
      type: 'booking_notification',
      action: 'created',
      bookingId: booking.id,
      weddingId: booking.wedding_id,
      coupleName: wedding.couple_name,
      contactEmail: wedding.contact_email,
      brideEmail: wedding.bride_email || '',
      groomEmail: wedding.groom_email || '',
      contactPhone: wedding.contact_phone || '',
      eventDate: wedding.event_date || '',
      venue: wedding.venue || '',
      packageType: wedding.package_type || '',
      guestCount: wedding.guest_count || 0,
      meetingType: meeting_type,
      meetingFormat: meeting_format,
      bookingDate: booking_date,
      bookingTime: booking_time,
      customerNotes: customer_notes || '',
      meetLink: meetLink || '',
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('n8n booking notification webhook error:', response.status, text);
    } else {
      console.log('n8n booking notification webhook called successfully');
    }
  } catch (error) {
    console.error('Failed to call n8n booking notification webhook:', error);
  }
}
