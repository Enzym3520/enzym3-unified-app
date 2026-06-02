import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let appUrl = Deno.env.get('APP_URL') || 'https://wedding-vibe-planning.lovable.app';

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const stateToken = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Look up the state token server-side (CSRF protection)
    let stateData: { user_id: string; wedding_id: string; origin_url: string | null } | null = null;

    if (stateToken) {
      const { data, error: lookupError } = await supabase
        .from('spotify_oauth_states')
        .select('user_id, wedding_id, origin_url')
        .eq('state_token', stateToken)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (!lookupError && data) {
        stateData = data;
        if (data.origin_url) {
          appUrl = data.origin_url;
        }
        // Delete used state token (one-time use)
        await supabase.from('spotify_oauth_states').delete().eq('state_token', stateToken);
      }
    }

    if (error) {
      console.error('Spotify OAuth error:', error);
      return new Response(null, {
        status: 302,
        headers: { 'Location': `${appUrl}/app/vibe-sheet?spotify_error=auth_failed` },
      });
    }

    if (!code || !stateToken || !stateData) {
      console.error('Invalid or expired OAuth state token');
      return new Response(null, {
        status: 302,
        headers: { 'Location': `${appUrl}/app/vibe-sheet?spotify_error=invalid_request` },
      });
    }

    const { user_id: userId, wedding_id: weddingId } = stateData;

    const clientId = Deno.env.get('SPOTIFY_CLIENT_ID');
    const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET');
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/spotify-auth-callback`;

    // Exchange code for tokens
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`),
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      console.error('Spotify token exchange failed:', tokenResponse.status);
      return new Response(null, {
        status: 302,
        headers: { 'Location': `${appUrl}/app/vibe-sheet?spotify_error=connection_failed` },
      });
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    // Get Spotify user info
    const userResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': `Bearer ${access_token}` },
    });

    if (!userResponse.ok) {
      console.error('Failed to get Spotify user info:', userResponse.status);
      return new Response(null, {
        status: 302,
        headers: { 'Location': `${appUrl}/app/vibe-sheet?spotify_error=connection_failed` },
      });
    }

    const userData = await userResponse.json();
    const spotifyUserId = userData.id;

    // Calculate expiry time
    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    // Store tokens encrypted in Vault via the store_spotify_tokens RPC
    const { error: dbError } = await supabase.rpc('store_spotify_tokens', {
      p_user_id: userId,
      p_wedding_id: weddingId,
      p_spotify_user_id: spotifyUserId,
      p_access_token: access_token,
      p_refresh_token: refresh_token,
      p_expires_at: expiresAt,
    });

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(null, {
        status: 302,
        headers: { 'Location': `${appUrl}/app/vibe-sheet?spotify_error=connection_failed` },
      });
    }

    // Redirect back to vibe sheet with success
    return new Response(null, {
      status: 302,
      headers: { 'Location': `${appUrl}/app/vibe-sheet?spotify_connected=true` },
    });

  } catch (error) {
    console.error('Error in spotify-auth-callback:', error);
    return new Response(null, {
      status: 302,
      headers: { 'Location': `${appUrl}/app/vibe-sheet?spotify_error=unexpected_error` },
    });
  }
});
