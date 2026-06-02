import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { playlistId, playlistUrl } = await req.json();
    
    console.log('Fetching Spotify playlist:', { playlistId, playlistUrl });
    
    // Extract playlist ID from various URL formats
    let extractedId = playlistId;
    if (playlistUrl && !playlistId) {
      // Handle formats:
      // https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M
      // spotify:playlist:37i9dQZF1DXcBWIGoYBM5M
      // 37i9dQZF1DXcBWIGoYBM5M
      const urlMatch = playlistUrl.match(/playlist[\/:]([a-zA-Z0-9]+)/);
      extractedId = urlMatch ? urlMatch[1] : playlistUrl;
    }
    
    if (!extractedId) {
      return new Response(
        JSON.stringify({ error: 'Playlist ID or URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Spotify API credentials
    const clientId = Deno.env.get('SPOTIFY_CLIENT_ID');
    const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      console.error('Missing Spotify credentials');
      return new Response(
        JSON.stringify({ error: 'Spotify API credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get access token
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret),
      },
      body: 'grant_type=client_credentials',
    });

    if (!tokenResponse.ok) {
      console.error('Failed to get Spotify access token:', await tokenResponse.text());
      return new Response(
        JSON.stringify({ error: 'Failed to authenticate with Spotify' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { access_token } = await tokenResponse.json();

    // Fetch playlist tracks
    const playlistResponse = await fetch(
      `https://api.spotify.com/v1/playlists/${extractedId}/tracks?fields=items(track(name,artists(name),album(name,images))),name,total`,
      {
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      }
    );

    if (!playlistResponse.ok) {
      console.error('Failed to fetch playlist:', await playlistResponse.text());
      return new Response(
        JSON.stringify({ error: 'Failed to fetch playlist. Check that the playlist is public and the URL is correct.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const playlistData = await playlistResponse.json();
    
    // Format tracks
    const tracks = playlistData.items
      .filter((item: any) => item.track) // Filter out null tracks
      .map((item: any) => ({
        id: item.track.id,
        name: item.track.name,
        artist: item.track.artists.map((a: any) => a.name).join(', '),
        album: item.track.album.name,
        albumArt: item.track.album.images[0]?.url || '',
      }));

    console.log(`Successfully fetched ${tracks.length} tracks from playlist`);

    return new Response(
      JSON.stringify({ 
        tracks,
        total: playlistData.total 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in spotify-playlist function:', error);
    return new Response(
      JSON.stringify({ error: 'An internal error occurred' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
