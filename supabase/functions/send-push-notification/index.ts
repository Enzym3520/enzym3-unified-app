import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Web Push helpers — pure Deno, no npm dependencies

function base64UrlToUint8Array(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = (4 - (base64.length % 4)) % 4;
  const raw = atob(base64 + '='.repeat(pad));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

function uint8ArrayToBase64Url(arr: Uint8Array): string {
  let binary = '';
  for (const byte of arr) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function importVapidKeys(publicKeyB64: string, privateKeyB64: string) {
  const publicKeyBytes = base64UrlToUint8Array(publicKeyB64);
  const privateKeyBytes = base64UrlToUint8Array(privateKeyB64);

  // Build raw key for ECDSA P-256
  // Public key is 65 bytes (uncompressed), private is 32 bytes
  const privateJwk = await buildPrivateJwk(publicKeyBytes, privateKeyBytes);

  const key = await crypto.subtle.importKey(
    'jwk',
    privateJwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  return { signingKey: key, publicKeyBytes };
}

function buildPrivateJwk(publicKeyBytes: Uint8Array, privateKeyBytes: Uint8Array) {
  // publicKeyBytes[0] should be 0x04 (uncompressed)
  const x = uint8ArrayToBase64Url(publicKeyBytes.slice(1, 33));
  const y = uint8ArrayToBase64Url(publicKeyBytes.slice(33, 65));
  const d = uint8ArrayToBase64Url(privateKeyBytes);
  return { kty: 'EC', crv: 'P-256', x, y, d, ext: true };
}

async function createVapidAuthHeader(
  endpoint: string,
  signingKey: CryptoKey,
  publicKeyBytes: Uint8Array,
  sub: string
) {
  const aud = new URL(endpoint).origin;
  const exp = Math.floor(Date.now() / 1000) + 12 * 3600;

  const header = { typ: 'JWT', alg: 'ES256' };
  const payload = { aud, exp, sub };

  const enc = new TextEncoder();
  const headerB64 = uint8ArrayToBase64Url(enc.encode(JSON.stringify(header)));
  const payloadB64 = uint8ArrayToBase64Url(enc.encode(JSON.stringify(payload)));
  const unsigned = `${headerB64}.${payloadB64}`;

  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    signingKey,
    enc.encode(unsigned)
  );

  // Convert DER signature to raw r||s
  const rawSig = derToRaw(new Uint8Array(sig));
  const token = `${unsigned}.${uint8ArrayToBase64Url(rawSig)}`;
  const pubB64 = uint8ArrayToBase64Url(publicKeyBytes);

  return `vapid t=${token}, k=${pubB64}`;
}

function derToRaw(der: Uint8Array): Uint8Array {
  // If already 64 bytes, it's raw
  if (der.length === 64) return der;

  // Parse DER SEQUENCE
  const raw = new Uint8Array(64);
  let offset = 2; // skip SEQUENCE tag + length

  // R
  const rLen = der[offset + 1];
  offset += 2;
  const rStart = rLen > 32 ? offset + (rLen - 32) : offset;
  const rDest = rLen < 32 ? 32 - rLen : 0;
  raw.set(der.slice(rStart, rStart + Math.min(rLen, 32)), rDest);
  offset += rLen;

  // S
  const sLen = der[offset + 1];
  offset += 2;
  const sStart = sLen > 32 ? offset + (sLen - 32) : offset;
  const sDest = sLen < 32 ? 64 - sLen : 32;
  raw.set(der.slice(sStart, sStart + Math.min(sLen, 32)), sDest);

  return raw;
}

// HKDF + ECDH encryption for Web Push payload (RFC 8291)
// Using aes128gcm content encoding

async function encryptPayload(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payloadText: string
) {
  const clientPublicKey = base64UrlToUint8Array(subscription.p256dh);
  const clientAuthSecret = base64UrlToUint8Array(subscription.auth);

  // Generate local ECDH key pair
  const localKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );

  // Import client public key
  const clientKey = await crypto.subtle.importKey(
    'raw',
    clientPublicKey,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );

  // Derive shared secret
  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: 'ECDH', public: clientKey },
      localKeyPair.privateKey,
      256
    )
  );

  // Export local public key
  const localPublicKeyRaw = new Uint8Array(
    await crypto.subtle.exportKey('raw', localKeyPair.publicKey)
  );

  // Salt (16 random bytes)
  const salt = crypto.getRandomValues(new Uint8Array(16));

  const enc = new TextEncoder();

  // Build info for HKDF
  // PRK = HKDF-Extract(clientAuth, sharedSecret)
  const authInfo = enc.encode('WebPush: info\0');
  const keyInfoInput = new Uint8Array(authInfo.length + clientPublicKey.length + localPublicKeyRaw.length);
  keyInfoInput.set(authInfo);
  keyInfoInput.set(clientPublicKey, authInfo.length);
  keyInfoInput.set(localPublicKeyRaw, authInfo.length + clientPublicKey.length);

  // IKM = HKDF(auth_secret, ecdh_secret, "WebPush: info\0" || client_pub || server_pub, 32)
  const authHkdfKey = await crypto.subtle.importKey('raw', clientAuthSecret, { name: 'HKDF' }, false, ['deriveBits']);
  // Actually we need to use the shared secret as the IKM and auth as salt for the first extract
  // Then use the result as IKM for the second HKDF

  // Step 1: PRK_key = HKDF-Extract(auth_secret, shared_secret)
  const prkKey = await crypto.subtle.importKey('raw', sharedSecret, { name: 'HKDF' }, false, ['deriveBits']);

  // Use HKDF with auth secret as salt to derive IKM
  const ikm = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: 'HKDF', hash: 'SHA-256', salt: clientAuthSecret, info: keyInfoInput },
      prkKey,
      256
    )
  );

  // Step 2: Derive content encryption key and nonce
  const cekInfo = buildInfo('Content-Encoding: aes128gcm\0');
  const nonceInfo = buildInfo('Content-Encoding: nonce\0');

  const ikmKey = await crypto.subtle.importKey('raw', ikm, { name: 'HKDF' }, false, ['deriveBits']);

  const cekBits = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: 'HKDF', hash: 'SHA-256', salt, info: cekInfo },
      ikmKey,
      128
    )
  );

  const nonceBits = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: 'HKDF', hash: 'SHA-256', salt, info: nonceInfo },
      ikmKey,
      96
    )
  );

  // Encrypt
  const contentKey = await crypto.subtle.importKey('raw', cekBits, { name: 'AES-GCM' }, false, ['encrypt']);

  // Pad payload (add 0x02 delimiter + optional padding)
  const payloadBytes = enc.encode(payloadText);
  const paddedPayload = new Uint8Array(payloadBytes.length + 1);
  paddedPayload.set(payloadBytes);
  paddedPayload[payloadBytes.length] = 2; // delimiter

  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: nonceBits },
      contentKey,
      paddedPayload
    )
  );

  // Build aes128gcm header: salt(16) + rs(4) + idlen(1) + keyid(65) + ciphertext
  const rs = 4096;
  const header = new Uint8Array(16 + 4 + 1 + localPublicKeyRaw.length);
  header.set(salt);
  new DataView(header.buffer).setUint32(16, rs);
  header[20] = localPublicKeyRaw.length;
  header.set(localPublicKeyRaw, 21);

  const body = new Uint8Array(header.length + ciphertext.length);
  body.set(header);
  body.set(ciphertext, header.length);

  return body;
}

function buildInfo(type: string): Uint8Array {
  return new TextEncoder().encode(type);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // AuthN: only allow service-role callers (server-side senders).
  // Push delivery content is sensitive — never accept untrusted callers.
  const authHeader = req.headers.get('Authorization') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!serviceRoleKey || authHeader !== `Bearer ${serviceRoleKey}`) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { userId, title, body: notifBody, url, tag } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY');
    const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      console.error('VAPID keys not configured');
      return new Response(
        JSON.stringify({ error: 'VAPID keys not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get all push subscriptions for this user
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth, id')
      .eq('user_id', userId);

    if (subError) {
      console.error('Error fetching subscriptions:', subError);
      throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log(`No push subscriptions for user ${userId}`);
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'No subscriptions' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { signingKey, publicKeyBytes } = await importVapidKeys(VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

    const payload = JSON.stringify({
      title: title || 'New Notification',
      body: notifBody || '',
      url: url || '/app/dashboard',
      tag: tag || 'default',
    });

    let sent = 0;
    const staleIds: string[] = [];

    for (const sub of subscriptions) {
      try {
        const encrypted = await encryptPayload(
          { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
          payload
        );

        const authHeader = await createVapidAuthHeader(
          sub.endpoint,
          signingKey,
          publicKeyBytes,
          'mailto:help@enzym3entertainment.vip'
        );

        const pushRes = await fetch(sub.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Encoding': 'aes128gcm',
            'TTL': '86400',
            'Authorization': authHeader,
          },
          body: encrypted,
        });

        if (pushRes.status === 201 || pushRes.status === 200) {
          sent++;
        } else if (pushRes.status === 404 || pushRes.status === 410) {
          // Subscription expired/invalid — remove it
          staleIds.push(sub.id);
          console.log(`Stale subscription ${sub.id} (${pushRes.status}) — will remove`);
        } else {
          const errText = await pushRes.text();
          console.error(`Push failed for ${sub.endpoint}: ${pushRes.status} ${errText}`);
        }
      } catch (pushErr) {
        console.error(`Error sending to ${sub.endpoint}:`, pushErr);
      }
    }

    // Clean up stale subscriptions
    if (staleIds.length > 0) {
      await supabase.from('push_subscriptions').delete().in('id', staleIds);
      console.log(`Removed ${staleIds.length} stale subscriptions`);
    }

    return new Response(
      JSON.stringify({ success: true, sent, total: subscriptions.length, removed: staleIds.length }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in send-push-notification:', error);
    return new Response(
      JSON.stringify({ error: 'An internal error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
