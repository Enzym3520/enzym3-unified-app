import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Input validation schema
const RequestSchema = z.object({
  code: z.string().min(1).max(50).trim(),
  type: z.enum(['invitation', 'couple', 'vendor', 'vendor_client']).default('invitation'),
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate input
    const parseResult = RequestSchema.safeParse(body);
    if (!parseResult.success) {
      console.log('Invalid request:', parseResult.error.flatten());
      return new Response(
        JSON.stringify({ valid: false, error: 'Invalid request format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let { code, type } = parseResult.data;
    
    // AUTO-DETECT: If code starts with "WED-", it's from couple_codes table
    if (code.startsWith('WED-') && type === 'invitation') {
      console.log('Auto-detected WED- code, switching to couple type');
      type = 'couple';
    }
    
    // AUTO-DETECT: If code starts with "VC-", it's from vendor_client_invitations table
    if (code.startsWith('VC-') && type === 'invitation') {
      console.log('Auto-detected VC- code, switching to vendor_client type');
      type = 'vendor_client';
    }

    // FALLBACK AUTO-DETECT: bare code (no known prefix) — pre-check couple_codes
    // so coordinator-app codes that arrive without a "WED-" prefix still validate.
    if (type === 'invitation' && !code.startsWith('WED-') && !code.startsWith('VC-') && !code.startsWith('INV-')) {
      const supabasePreCheck = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        { auth: { persistSession: false } }
      );
      const { data: bareMatch } = await supabasePreCheck
        .from('couple_codes')
        .select('id')
        .eq('code', code)
        .eq('active', true)
        .maybeSingle();
      if (bareMatch) {
        console.log('Auto-detected bare couple_codes match, switching to couple type');
        type = 'couple';
      }
    }

    console.log(`Validating ${type} code: ${code.substring(0, 4)}...`);

    // Use service role to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Handle vendor code validation (dj_codes table)
    if (type === 'vendor') {
      const { data, error } = await supabaseAdmin
        .from('dj_codes')
        .select('id, code, email, name, phone, vendor_type, invited_first_name, invited_last_name, invited_email, invited_company, invited_role, active, expires_at')
        .eq('code', code)
        .eq('active', true)
        .maybeSingle();

      if (error) {
        console.error('Database error:', error);
        return new Response(
          JSON.stringify({ valid: false, error: 'Unable to validate code. Please try again.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!data) {
        console.log('Invalid or expired vendor code');
        return new Response(
          JSON.stringify({ valid: false, error: 'Invalid or expired code' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check expiration if set
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        console.log('Vendor code expired');
        return new Response(
          JSON.stringify({ valid: false, error: 'This invitation code has expired' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Valid vendor code found for: ${data.invited_first_name || data.name}`);

      return new Response(
        JSON.stringify({
          valid: true,
          vendor: {
            id: data.id,
            first_name: data.invited_first_name || '',
            last_name: data.invited_last_name || '',
            email: data.invited_email || data.email,
            company: data.invited_company || '',
            role: data.invited_role || 'dj',
            vendor_type: data.vendor_type || 'dj',
            phone: data.phone || '',
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle couple_codes validation
    if (type === 'couple') {
      const { data, error } = await supabaseAdmin
        .from('couple_codes')
        .select('id, code, wedding_id, bride_email, groom_email, active, expires_at')
        .eq('code', code)
        .eq('active', true)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (error) {
        console.error('Database error:', error);
        return new Response(
          JSON.stringify({ valid: false, error: 'Unable to validate code. Please try again.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!data) {
        console.log('Invalid or expired couple code');
        return new Response(
          JSON.stringify({ valid: false, error: 'Invalid or expired code' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Valid couple code found for wedding: ${data.wedding_id}`);

      // Fetch the event details from event_notification_history using wedding_id
      const { data: eventData, error: eventError } = await supabaseAdmin
        .from('event_notification_history')
        .select(`
          id, couple_name, event_date, venue, event_type, 
          bride_email, groom_email, 
          booking_source, payment_required,
          hours_booked, hourly_rate, total_price, deposit_amount,
          contract_signed, deposit_paid
        `)
        .eq('id', data.wedding_id)
        .maybeSingle();

      if (eventError) {
        console.error('Error fetching event data:', eventError);
      }

      // Priority: event_notification_history emails > couple_codes emails
      const brideEmail = eventData?.bride_email || data.bride_email || '';
      const groomEmail = eventData?.groom_email || data.groom_email || '';
      
      console.log(`Emails resolved - bride: ${brideEmail || '(empty)'}, groom: ${groomEmail || '(empty)'}`);

      // Parse couple name to extract names
      let brideFirstName = '';
      let brideLastName = '';
      let groomFirstName = '';
      let groomLastName = '';
      
      if (eventData?.couple_name) {
        const parts = eventData.couple_name.split(' & ');
        if (parts.length >= 1) {
          const brideParts = parts[0].trim().split(' ');
          brideFirstName = brideParts[0] || '';
          brideLastName = brideParts.slice(1).join(' ') || '';
        }
        if (parts.length >= 2) {
          const groomParts = parts[1].trim().split(' ');
          groomFirstName = groomParts[0] || '';
          groomLastName = groomParts.slice(1).join(' ') || '';
        }
      }

      // Determine booking type based on venue if not explicitly set
      const venue = eventData?.venue || '';
      const isVenuePartner = venue.toLowerCase().includes('saguaro buttes');
      const bookingSource = eventData?.booking_source || (isVenuePartner ? 'venue_partner' : 'independent');
      const paymentRequired = eventData?.payment_required ?? !isVenuePartner;

      return new Response(
        JSON.stringify({
          valid: true,
          // Return in the same format as wedding_invitations for compatibility
          invitation: {
            id: data.id,
            wedding_id: data.wedding_id,
            bride_first_name: brideFirstName,
            bride_last_name: brideLastName,
            bride_email: brideEmail,
            groom_first_name: groomFirstName,
            groom_last_name: groomLastName,
            groom_email: groomEmail,
            wedding_date: eventData?.event_date || '',
            venue: venue,
            couple_name: eventData?.couple_name || '',
            event_type: eventData?.event_type || 'wedding',
            // Booking type and pricing fields for contract/payment flow
            booking_type: bookingSource,
            booking_source: bookingSource,
            hours_booked: eventData?.hours_booked,
            hourly_rate: eventData?.hourly_rate ?? null,
            total_price: eventData?.total_price,
            deposit_amount: eventData?.deposit_amount,
            requires_contract: paymentRequired && !eventData?.contract_signed,
            requires_payment: paymentRequired && !eventData?.deposit_paid,
            payment_required: paymentRequired,
            // Source indicator for Register.tsx to know which table to update
            _source: 'couple_codes',
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle vendor_client_invitations validation
    if (type === 'vendor_client') {
      const { data, error } = await supabaseAdmin
        .from('vendor_client_invitations')
        .select('id, code, vendor_id, vendor_type, event_id, client_name, client_email, active, expires_at')
        .eq('code', code)
        .eq('active', true)
        .maybeSingle();

      if (error) {
        console.error('Database error:', error);
        return new Response(
          JSON.stringify({ valid: false, error: 'Unable to validate code. Please try again.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!data) {
        console.log('Invalid or expired vendor client code');
        return new Response(
          JSON.stringify({ valid: false, error: 'Invalid or expired code' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check expiration if set
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        console.log('Vendor client code expired');
        return new Response(
          JSON.stringify({ valid: false, error: 'This invitation code has expired' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Fetch event details if linked
      let eventData = null;
      if (data.event_id) {
        const { data: ed } = await supabaseAdmin
          .from('event_notification_history')
          .select('couple_name, event_date, event_type, venue')
          .eq('id', data.event_id)
          .maybeSingle();
        eventData = ed;
      }

      // Get vendor profile
      const { data: vendorProfile } = await supabaseAdmin
        .from('profiles')
        .select('first_name, last_name, company_name')
        .eq('id', data.vendor_id)
        .maybeSingle();

      const vendorName = vendorProfile?.company_name
        || (vendorProfile?.first_name ? `${vendorProfile.first_name} ${vendorProfile.last_name}` : '');

      // Parse client name into first/last
      const clientNameParts = (data.client_name || '').trim().split(' ');
      const clientFirstName = clientNameParts[0] || '';
      const clientLastName = clientNameParts.slice(1).join(' ') || '';

      console.log(`Valid vendor client code for: ${data.client_name} (${data.vendor_type})`);

      return new Response(
        JSON.stringify({
          valid: true,
          invitation: {
            id: data.id,
            bride_first_name: clientFirstName,
            bride_last_name: clientLastName,
            bride_email: data.client_email || '',
            groom_first_name: '',
            groom_last_name: '',
            groom_email: '',
            wedding_date: eventData?.event_date || '',
            venue: eventData?.venue || '',
            couple_name: eventData?.couple_name || data.client_name,
            event_type: eventData?.event_type || 'event',
            vendor_type: data.vendor_type,
            vendor_id: data.vendor_id,
            vendor_name: vendorName,
            event_id: data.event_id,
            // No contract/payment required for vendor clients by default
            requires_contract: false,
            requires_payment: false,
            payment_required: false,
            _source: 'vendor_client_invitations',
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle wedding_invitations validation (default)
    const { data, error } = await supabaseAdmin
      .from('wedding_invitations')
      .select('id, invitation_code, bride_first_name, bride_last_name, bride_email, groom_first_name, groom_last_name, groom_email, wedding_date, venue, couple_name, status, expires_at, booking_type, hours_booked, hourly_rate, total_price, deposit_amount, requires_contract, requires_payment')
      .eq('invitation_code', code)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ valid: false, error: 'Unable to validate code. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!data) {
      // Fallback: check couple_codes table (codes created via n8n or direct DB insert)
      console.log('Not found in wedding_invitations, checking couple_codes fallback...');
      const { data: coupleData, error: coupleError } = await supabaseAdmin
        .from('couple_codes')
        .select('id, code, wedding_id, bride_email, groom_email, active, expires_at')
        .eq('code', code)
        .eq('active', true)
        .maybeSingle();

      if (coupleError) {
        console.error('Couple codes fallback error:', coupleError);
        return new Response(
          JSON.stringify({ valid: false, error: 'Unable to validate code. Please try again.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (coupleData) {
        // Check expiration
        if (coupleData.expires_at && new Date(coupleData.expires_at) < new Date()) {
          console.log('Couple code expired (fallback)');
          return new Response(
            JSON.stringify({ valid: false, error: 'This invitation code has expired' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Re-route to the couple code handler by recursing the logic
        console.log('Found in couple_codes fallback, processing as couple type');
        type = 'couple';
        // We need to process this — jump to couple handling by re-invoking the request internally
        // Instead, inline the couple_codes response here using coupleData

        // Fetch event details
        const { data: fallbackEvent } = await supabaseAdmin
          .from('event_notification_history')
          .select(`
            id, couple_name, event_date, venue, event_type,
            bride_email, groom_email,
            booking_source, payment_required,
            hours_booked, hourly_rate, total_price, deposit_amount,
            contract_signed, deposit_paid
          `)
          .eq('id', coupleData.wedding_id)
          .maybeSingle();

        const brideEmail = fallbackEvent?.bride_email || coupleData.bride_email || '';
        const groomEmail = fallbackEvent?.groom_email || coupleData.groom_email || '';

        let brideFirstName = '';
        let brideLastName = '';
        let groomFirstName = '';
        let groomLastName = '';

        if (fallbackEvent?.couple_name) {
          const parts = fallbackEvent.couple_name.split(' & ');
          if (parts.length >= 1) {
            const brideParts = parts[0].trim().split(' ');
            brideFirstName = brideParts[0] || '';
            brideLastName = brideParts.slice(1).join(' ') || '';
          }
          if (parts.length >= 2) {
            const groomParts = parts[1].trim().split(' ');
            groomFirstName = groomParts[0] || '';
            groomLastName = groomParts.slice(1).join(' ') || '';
          }
        }

        const venue = fallbackEvent?.venue || '';
        const isVenuePartner = venue.toLowerCase().includes('saguaro buttes');
        const bookingSource = fallbackEvent?.booking_source || (isVenuePartner ? 'venue_partner' : 'independent');
        const paymentRequired = fallbackEvent?.payment_required ?? !isVenuePartner;

        return new Response(
          JSON.stringify({
            valid: true,
            invitation: {
              id: coupleData.id,
              wedding_id: coupleData.wedding_id,
              bride_first_name: brideFirstName,
              bride_last_name: brideLastName,
              bride_email: brideEmail,
              groom_first_name: groomFirstName,
              groom_last_name: groomLastName,
              groom_email: groomEmail,
              wedding_date: fallbackEvent?.event_date || '',
              venue: venue,
              couple_name: fallbackEvent?.couple_name || '',
              event_type: fallbackEvent?.event_type || 'wedding',
              booking_type: bookingSource,
              booking_source: bookingSource,
              hours_booked: fallbackEvent?.hours_booked,
              hourly_rate: fallbackEvent?.hourly_rate ?? null,
              total_price: fallbackEvent?.total_price,
              deposit_amount: fallbackEvent?.deposit_amount,
              requires_contract: paymentRequired && !fallbackEvent?.contract_signed,
              requires_payment: paymentRequired && !fallbackEvent?.deposit_paid,
              payment_required: paymentRequired,
              _source: 'couple_codes',
            }
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Invalid or expired invitation code');
      return new Response(
        JSON.stringify({ valid: false, error: 'Invalid or expired code' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Valid invitation found for: ${data.couple_name}`);

    // Try to get event_type from event_notification_history if there's a linked event
    let eventType = 'wedding'; // Default to wedding
    const { data: eventData } = await supabaseAdmin
      .from('event_notification_history')
      .select('event_type')
      .or(`bride_email.ilike.${(data.bride_email || '').toLowerCase()},groom_email.ilike.${(data.groom_email || data.bride_email || '').toLowerCase()}`)
      .maybeSingle();
    
    if (eventData?.event_type) {
      eventType = eventData.event_type;
    }

    // Return only necessary data for registration pre-fill
    return new Response(
      JSON.stringify({
        valid: true,
        invitation: {
          id: data.id,
          bride_first_name: data.bride_first_name,
          bride_last_name: data.bride_last_name,
          bride_email: data.bride_email,
          groom_first_name: data.groom_first_name,
          groom_last_name: data.groom_last_name,
          groom_email: data.groom_email,
          wedding_date: data.wedding_date,
          venue: data.venue,
          couple_name: data.couple_name,
          event_type: eventType,
          // Booking type and pricing fields
          booking_type: data.booking_type || 'independent',
          hours_booked: data.hours_booked,
          hourly_rate: data.hourly_rate ?? null,
          total_price: data.total_price,
          deposit_amount: data.deposit_amount,
          requires_contract: data.requires_contract ?? true,
          requires_payment: data.requires_payment ?? true,
          _source: 'wedding_invitations',
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ valid: false, error: 'An error occurred. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
