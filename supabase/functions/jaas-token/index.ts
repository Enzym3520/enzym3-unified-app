import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { decode as decodeBase64 } from "https://deno.land/std@0.190.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Import RS256 signing via Web Crypto API
async function importPrivateKey(pem: string): Promise<CryptoKey> {
  // Handle escaped newlines from environment variables
  const normalizedPem = pem.replace(/\\n/g, '\n').replace(/\\r/g, '').trim();
  
  console.log('Raw PEM length:', pem.length);
  console.log('Normalized PEM starts with:', normalizedPem.substring(0, 40));
  
  // Strip PEM headers/footers and whitespace
  const pemContents = normalizedPem
    .replace(/-----BEGIN[\w\s]*-----/g, '')
    .replace(/-----END[\w\s]*-----/g, '')
    .replace(/[\s\r\n]/g, '');

  console.log('PEM base64 content length:', pemContents.length);

  // Use Deno standard library base64 decoder (more forgiving than atob)
  const binaryDer = decodeBase64(pemContents);

  return crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
}

function base64UrlEncode(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function createJWT(payload: Record<string, unknown>, privateKey: CryptoKey): Promise<string> {
  const header = { alg: 'RS256', typ: 'JWT' };

  const encodedHeader = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const encodedPayload = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(signingInput)
  );

  const encodedSignature = base64UrlEncode(new Uint8Array(signature));
  return `${signingInput}.${encodedSignature}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const userId = user.id;
    const userEmail = user.email || '';

    const { bookingId } = await req.json();
    if (!bookingId) {
      return new Response(JSON.stringify({ error: 'bookingId required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Look up booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, wedding_id, booking_date, booking_time, status')
      .eq('id', bookingId)
      .maybeSingle();

    if (bookingError || !booking) {
      console.error('Booking lookup error:', bookingError);
      return new Response(JSON.stringify({ error: 'Booking not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get wedding data for display name
    const { data: wedding } = await supabase
      .from('event_notification_history')
      .select('couple_name, contact_email, bride_email, groom_email')
      .eq('id', booking.wedding_id)
      .maybeSingle();

    // Check if user is admin (moderator)
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: roleData } = await serviceClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    const isAdmin = roleData?.role === 'admin';
    const displayName = isAdmin
      ? 'DJ'
      : (wedding?.couple_name || 'Guest');

    const JAAS_APP_ID = Deno.env.get('JAAS_APP_ID');
    const JAAS_PRIVATE_KEY = Deno.env.get('JAAS_PRIVATE_KEY');

    if (!JAAS_APP_ID || !JAAS_PRIVATE_KEY) {
      console.error('JaaS secrets not configured');
      return new Response(JSON.stringify({ error: 'Video meeting not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const roomName = `vibesheet-${booking.id.slice(0, 8)}`;
    const now = Math.floor(Date.now() / 1000);
    const exp = now + (2 * 60 * 60); // 2 hours

    const jwtPayload = {
      iss: 'chat',
      aud: 'jitsi',
      sub: JAAS_APP_ID,
      room: roomName,
      iat: now,
      nbf: now,
      exp,
      context: {
        user: {
          id: userId,
          name: displayName,
          email: userEmail,
          moderator: isAdmin,
        },
        features: {
          livestreaming: false,
          recording: true,
          'outbound-call': false,
          transcription: false,
        },
      },
    };

    const privateKey = await importPrivateKey(JAAS_PRIVATE_KEY);
    const jwt = await createJWT(jwtPayload, privateKey);

    const roomUrl = `https://8x8.vc/${JAAS_APP_ID}/${roomName}`;

    return new Response(JSON.stringify({ token: jwt, roomUrl, appId: JAAS_APP_ID, roomName }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('jaas-token error:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate meeting token' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
