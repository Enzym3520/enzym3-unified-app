const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function toBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow authenticated requests
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Generate ECDSA P-256 key pair
    const keyPair = await crypto.subtle.generateKey(
      { name: "ECDSA", namedCurve: "P-256" },
      true,
      ["sign", "verify"]
    );

    // Export as JWK to get raw components
    const privateJwk = await crypto.subtle.exportKey("jwk", keyPair.privateKey);
    const publicRaw = await crypto.subtle.exportKey("raw", keyPair.publicKey);

    // Public key in base64url (65 bytes uncompressed) — this goes to VAPID_PUBLIC_KEY
    const publicKeyBase64Url = toBase64Url(publicRaw);

    // Private key as base64url (32 bytes) — this goes to VAPID_PRIVATE_KEY
    const privateKeyBase64Url = privateJwk.d!;

    return new Response(
      JSON.stringify({
        message:
          "Save these as Supabase Edge Function secrets. DO NOT share the private key.",
        VAPID_PUBLIC_KEY: publicKeyBase64Url,
        VAPID_PRIVATE_KEY: privateKeyBase64Url,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Key generation failed:", err);
    return new Response(JSON.stringify({ error: "Failed to generate keys" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
