import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface Song {
  name: string;
  artist: string;
}

interface TimelineEvent {
  id?: string;
  order?: number;
  event_name?: string;
  song?: string;
  artist?: string;
  time?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Extract the token and pass it directly to getUser for proper auth in Deno
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('User authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { weddingId, tabName, songs: providedSongs, eventDate } = await req.json();

    if (!weddingId) {
      return new Response(
        JSON.stringify({ error: 'Wedding ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Creating playlist for wedding:', weddingId, 'tab:', tabName || 'all');

    // Get Spotify connection using service role for token access
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: connection, error: connError } = await supabaseAdmin
      .from('spotify_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('wedding_id', weddingId)
      .single();

    if (connError || !connection) {
      console.error('Spotify connection error:', connError);
      return new Response(
        JSON.stringify({ error: 'Spotify not connected' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch real tokens from Vault via get_spotify_tokens RPC
    // If access_token_secret_id is null, the connection is stale (pre-Vault plaintext row)
    if (!connection.access_token_secret_id) {
      console.error('Spotify connection is stale — no Vault secret IDs found. Needs reconnect.');
      // Delete stale row so user can reconnect cleanly
      await supabaseAdmin.from('spotify_connections').delete().eq('id', connection.id);
      return new Response(
        JSON.stringify({ error: 'Spotify authorization expired. Please reconnect your Spotify account.', needsReconnect: true }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .rpc('get_spotify_tokens', { p_connection_id: connection.id });

    if (tokenError || !tokenData || tokenData.length === 0) {
      console.error('Failed to retrieve Spotify tokens from Vault:', tokenError);
      return new Response(
        JSON.stringify({ error: 'Failed to retrieve Spotify tokens. Please reconnect your Spotify account.', needsReconnect: true }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const vaultTokens = tokenData[0];

    // Check if token is expired and refresh if needed
    let accessToken = vaultTokens.access_token;
    if (new Date(vaultTokens.expires_at) <= new Date()) {
      console.log('Token expired, refreshing...');
      const clientId = Deno.env.get('SPOTIFY_CLIENT_ID');
      const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET');

      const refreshResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`),
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: vaultTokens.refresh_token,
        }),
      });

      if (!refreshResponse.ok) {
        const refreshError = await refreshResponse.json().catch(() => ({ error: 'unknown' }));
        console.error('Token refresh failed:', refreshError);
        
        // If the refresh token is invalid/revoked, delete the connection so user can reconnect
        if (refreshError.error === 'invalid_grant') {
          await supabaseAdmin
            .from('spotify_connections')
            .delete()
            .eq('id', connection.id);
          return new Response(
            JSON.stringify({ error: 'Spotify authorization expired. Please reconnect your Spotify account.', needsReconnect: true }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        return new Response(
          JSON.stringify({ error: 'Failed to refresh Spotify token. Please try reconnecting.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const refreshData = await refreshResponse.json();
      accessToken = refreshData.access_token;

      // Rotate tokens in Vault via update_spotify_tokens RPC
      await supabaseAdmin.rpc('update_spotify_tokens', {
        p_connection_id: connection.id,
        p_access_token: accessToken,
        p_refresh_token: refreshData.refresh_token ?? vaultTokens.refresh_token,
        p_expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString(),
      });
    }

    // Get wedding details for playlist name
    const { data: wedding } = await supabase
      .from('event_notification_history')
      .select('couple_name, event_date')
      .eq('id', weddingId)
      .single();

    // Format date for playlist name (e.g., "1.28.26")
    const formatDateForPlaylist = (dateStr: string | undefined): string => {
      if (!dateStr) return '';
      try {
        const date = new Date(dateStr);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const year = date.getFullYear().toString().slice(-2);
        return `${month}.${day}.${year}`;
      } catch {
        return '';
      }
    };

    const datePrefix = formatDateForPlaylist(eventDate || wedding?.event_date);
    
    // Build playlist name based on tab and date
    let playlistName: string;
    if (tabName && datePrefix) {
      playlistName = `${datePrefix} ${tabName} Playlist`;
    } else if (tabName) {
      playlistName = `${wedding?.couple_name || 'Wedding'}'s ${tabName} Playlist`;
    } else if (datePrefix) {
      playlistName = `${datePrefix} Wedding Playlist`;
    } else {
      playlistName = wedding?.couple_name 
        ? `${wedding.couple_name}'s Wedding Playlist`
        : 'Wedding Playlist';
    }

    // If songs were provided directly, use them
    let songs: Song[] = [];
    
    if (providedSongs && Array.isArray(providedSongs) && providedSongs.length > 0) {
      console.log(`Using ${providedSongs.length} provided songs`);
      songs = providedSongs.filter((s: Song) => s.name && s.name.trim() !== '');
    } else {
      // Fall back to extracting from vibe sheet
      console.log('No songs provided, extracting from vibe sheet...');
      
      // Get vibe sheet data
      const { data: musicSheet, error: sheetError } = await supabase
        .from('vibe_sheets')
        .select('*')
        .eq('wedding_id', weddingId)
        .single();

      if (sheetError || !musicSheet) {
        console.error('Music sheet error:', sheetError);
        return new Response(
          JSON.stringify({ error: 'Vibe sheet not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Music sheet found, extracting songs...');

      // Helper to extract songs from timeline events array
      const extractFromTimeline = (events: TimelineEvent[] | null | undefined) => {
        if (!Array.isArray(events)) return;
        
        events.forEach((event) => {
          if (event.song && event.song.trim() !== '') {
            songs.push({
              name: event.song.trim(),
              artist: event.artist?.trim() || ''
            });
          }
        });
      };

      // Helper to parse song strings (for legacy format)
      const parseSong = (songStr: string): Song | null => {
        if (!songStr || songStr.trim() === '') return null;
        
        // Try to parse "Song Name - Artist Name" format
        const parts = songStr.split(' - ');
        if (parts.length >= 2) {
          return { name: parts[0].trim(), artist: parts.slice(1).join(' - ').trim() };
        }
        
        // If no artist, just use song name
        return { name: songStr.trim(), artist: '' };
      };

      // NEW FORMAT: Extract from ceremony_timeline_events
      extractFromTimeline((musicSheet as any).ceremony_timeline_events);
      
      // NEW FORMAT: Extract from reception_timeline_events  
      extractFromTimeline((musicSheet as any).reception_timeline_events);
      
      // NEW FORMAT: Extract from quince_ceremony_events
      extractFromTimeline((musicSheet as any).quince_ceremony_events);
      
      // NEW FORMAT: Extract from quince_reception_events
      extractFromTimeline((musicSheet as any).quince_reception_events);
      
      // NEW FORMAT: Extract from agenda_items
      extractFromTimeline((musicSheet as any).agenda_items);

      // LEGACY FORMAT: Ceremony details (for backward compatibility)
      const ceremonyDetails = musicSheet.ceremony_details as any;
      if (ceremonyDetails) {
        // Old nested format
        if (ceremonyDetails.processional) {
          if (Array.isArray(ceremonyDetails.processional)) {
            ceremonyDetails.processional.forEach((s: string) => {
              const song = parseSong(s);
              if (song) songs.push(song);
            });
          } else if (typeof ceremonyDetails.processional === 'string') {
            const song = parseSong(ceremonyDetails.processional);
            if (song) songs.push(song);
          }
        }
        if (ceremonyDetails.bride_entrance) {
          if (Array.isArray(ceremonyDetails.bride_entrance)) {
            ceremonyDetails.bride_entrance.forEach((s: string) => {
              const song = parseSong(s);
              if (song) songs.push(song);
            });
          } else if (typeof ceremonyDetails.bride_entrance === 'string') {
            const song = parseSong(ceremonyDetails.bride_entrance);
            if (song) songs.push(song);
          }
        }
        if (ceremonyDetails.recessional) {
          if (Array.isArray(ceremonyDetails.recessional)) {
            ceremonyDetails.recessional.forEach((s: string) => {
              const song = parseSong(s);
              if (song) songs.push(song);
            });
          } else if (typeof ceremonyDetails.recessional === 'string') {
            const song = parseSong(ceremonyDetails.recessional);
            if (song) songs.push(song);
          }
        }
      }

      // LEGACY FORMAT: Reception timeline
      const receptionTimeline = (musicSheet as any).reception_timeline;
      if (Array.isArray(receptionTimeline)) {
        receptionTimeline.forEach((event: any) => {
          if (event.song) {
            const song = parseSong(event.song);
            if (song) songs.push(song);
          }
        });
      }

      // Grand intro songs
      const grandIntro = (musicSheet as any).grand_intro;
      if (Array.isArray(grandIntro)) {
        grandIntro.forEach((person: any) => {
          if (person.song) {
            const song = parseSong(person.song);
            if (song) songs.push(song);
          }
        });
      }

      // Group dances
      const groupDances = (musicSheet as any).group_dances;
      if (Array.isArray(groupDances)) {
        groupDances.forEach((dance: any) => {
          if (dance.song) {
            const song = parseSong(dance.song);
            if (song) songs.push(song);
          }
        });
      }

      // Additional songs
      const additionalSongs = (musicSheet as any).additional_songs;
      if (Array.isArray(additionalSongs)) {
        additionalSongs.forEach((item: any) => {
          if (item.song_name) {
            songs.push({ name: item.song_name, artist: item.artist_name || '' });
          }
        });
      }

      // Standalone fields for legacy compatibility
      if (musicSheet.processional) {
        const song = parseSong(musicSheet.processional);
        if (song) songs.push(song);
      }
      if (musicSheet.bride_entrance) {
        const song = parseSong(musicSheet.bride_entrance);
        if (song) songs.push(song);
      }
      if (musicSheet.recessional) {
        const song = parseSong(musicSheet.recessional);
        if (song) songs.push(song);
      }
      if (musicSheet.first_dance) {
        const song = parseSong(musicSheet.first_dance);
        if (song) songs.push(song);
      }
      if (musicSheet.grand_entrance) {
        const song = parseSong(musicSheet.grand_entrance);
        if (song) songs.push(song);
      }
      if (musicSheet.last_dance) {
        const song = parseSong(musicSheet.last_dance);
        if (song) songs.push(song);
      }
    }

    // Deduplicate songs by name+artist
    const uniqueSongs = songs.filter((song, index, self) => 
      index === self.findIndex(s => 
        s.name.toLowerCase() === song.name.toLowerCase() && 
        s.artist.toLowerCase() === song.artist.toLowerCase()
      )
    );

    console.log(`Found ${uniqueSongs.length} unique songs`);

    if (uniqueSongs.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No songs found to add to playlist' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Search for each song on Spotify
    const trackUris: string[] = [];
    const notFound: string[] = [];

    for (const song of uniqueSongs) {
      const searchQuery = song.artist 
        ? `track:${song.name} artist:${song.artist}`
        : song.name;

      try {
        const searchResponse = await fetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=track&limit=1`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        );

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          if (searchData.tracks?.items?.length > 0) {
            trackUris.push(searchData.tracks.items[0].uri);
          } else {
            notFound.push(`${song.name}${song.artist ? ' - ' + song.artist : ''}`);
          }
        } else {
          console.error('Spotify search failed:', await searchResponse.text());
          notFound.push(`${song.name}${song.artist ? ' - ' + song.artist : ''}`);
        }
      } catch (searchError) {
        console.error('Search error:', searchError);
        notFound.push(`${song.name}${song.artist ? ' - ' + song.artist : ''}`);
      }
    }

    console.log(`Found ${trackUris.length} tracks on Spotify, ${notFound.length} not found`);

    if (trackUris.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No songs could be found on Spotify', tracksNotFound: notFound }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create playlist
    const createPlaylistResponse = await fetch(
      `https://api.spotify.com/v1/users/${connection.spotify_user_id}/playlists`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: playlistName,
          description: tabName 
            ? `${tabName} music created from my wedding vibe sheet`
            : 'Created from my wedding vibe sheet',
          public: false,
        }),
      }
    );

    if (!createPlaylistResponse.ok) {
      const errorText = await createPlaylistResponse.text();
      console.error('Failed to create playlist:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to create playlist' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const playlist = await createPlaylistResponse.json();
    console.log('Playlist created:', playlist.id);

    // Add tracks to playlist (max 100 at a time)
    for (let i = 0; i < trackUris.length; i += 100) {
      const batch = trackUris.slice(i, i + 100);
      const addTracksResponse = await fetch(
        `https://api.spotify.com/v1/playlists/${playlist.id}/tracks`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uris: batch,
          }),
        }
      );

      if (!addTracksResponse.ok) {
        console.error('Failed to add tracks:', await addTracksResponse.text());
      }
    }

    console.log('Playlist creation complete');

    return new Response(
      JSON.stringify({
        success: true,
        playlistUrl: playlist.external_urls.spotify,
        playlistName: playlist.name,
        tracksAdded: trackUris.length,
        tracksNotFound: notFound,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in spotify-create-playlist:', error);
    return new Response(
      JSON.stringify({ error: 'An internal error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
