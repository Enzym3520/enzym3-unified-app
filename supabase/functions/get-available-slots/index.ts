import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface AvailabilityConfig {
  timezone: string;
  businessHours: { start: string; end: string };
  meetingDuration: number;
  bufferTime: number;
  daysAvailable: number[];
  blockedDates: string[];
}

const AVAILABILITY: AvailabilityConfig = {
  timezone: 'America/Phoenix',
  businessHours: { start: '10:00', end: '15:15' },
  meetingDuration: 30,
  bufferTime: 15,
  daysAvailable: [2, 3, 4, 5, 6], // Tue, Wed, Thu, Fri, Sat
  blockedDates: ['2025-12-25', '2025-01-01'],
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
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

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { date, vendor_id } = await req.json();
    
    // Validate date input
    if (!date || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return new Response(
        JSON.stringify({ error: 'Valid date (YYYY-MM-DD) is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate vendor_id if provided
    if (vendor_id && typeof vendor_id !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid vendor_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get existing bookings for the date, optionally filtered by vendor
    let bookingsQuery = supabaseAdmin
      .from('bookings')
      .select('booking_time, meeting_type')
      .eq('booking_date', date)
      .neq('status', 'cancelled');

    if (vendor_id) {
      bookingsQuery = bookingsQuery.eq('vendor_id', vendor_id);
    } else {
      // Coordinator meetings: filter by null vendor_id to avoid conflicts
      bookingsQuery = bookingsQuery.is('vendor_id', null);
    }

    const { data: existingBookings, error: bookingsError } = await bookingsQuery;

    if (bookingsError) {
      throw bookingsError;
    }

    // Generate available slots
    const slots = generateTimeSlots(date, existingBookings || []);

    return new Response(
      JSON.stringify({ slots }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error getting available slots:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get available slots' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});

function generateTimeSlots(date: string, existingBookings: any[]) {
  const slots = [];
  const dateObj = new Date(date + 'T00:00:00');
  const dayOfWeek = dateObj.getDay();

  // Calculate current Arizona time (UTC-7, no DST)
  const nowUTC = new Date();
  const nowAZ = new Date(nowUTC.getTime() - 7 * 60 * 60 * 1000);
  const nowAZDateStr = nowAZ.toISOString().split('T')[0];
  const isToday = date === nowAZDateStr;
  const nowAZHour = nowAZ.getUTCHours();
  const nowAZMin = nowAZ.getUTCMinutes();

  // Check if date is available
  if (!AVAILABILITY.daysAvailable.includes(dayOfWeek)) {
    return [];
  }

  if (AVAILABILITY.blockedDates.includes(date)) {
    return [];
  }

  // Parse business hours
  const [startHour, startMin] = AVAILABILITY.businessHours.start.split(':').map(Number);
  const [endHour, endMin] = AVAILABILITY.businessHours.end.split(':').map(Number);

  let currentHour = startHour;
  let currentMin = startMin;

  while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
    const timeSlot = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
    
    // Check if slot is already booked
    const isBooked = existingBookings.some(booking => {
      const bookingTime = booking.booking_time.substring(0, 5);
      return bookingTime === timeSlot;
    });

    // Check if slot is in the past (for today's date)
    const isPast = isToday && (
      currentHour < nowAZHour ||
      (currentHour === nowAZHour && currentMin <= nowAZMin)
    );

    slots.push({
      time: timeSlot,
      available: !isBooked && !isPast,
      label: formatTime(timeSlot)
    });

    // Add meeting duration + buffer time
    currentMin += AVAILABILITY.meetingDuration + AVAILABILITY.bufferTime;
    if (currentMin >= 60) {
      currentHour += Math.floor(currentMin / 60);
      currentMin = currentMin % 60;
    }
  }

  return slots;
}

function formatTime(time: string): string {
  const [hour, min] = time.split(':').map(Number);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${String(min).padStart(2, '0')} ${period}`;
}