import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Loader2, Music, ExternalLink, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent } from './ui/card';

interface Track {
  id: string;
  name: string;
  artist: string;
  album: string;
  albumArt: string;
}

interface SpotifyPlaylistPreviewProps {
  playlistUrl: string;
  onImportToCeremony?: (tracks: Track[], targetTimeline: 'ceremony') => void;
  onImportToReception?: (tracks: Track[], targetTimeline: 'reception') => void;
}

export const SpotifyPlaylistPreview: React.FC<SpotifyPlaylistPreviewProps> = ({
  playlistUrl,
  onImportToCeremony,
  onImportToReception,
}) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [playlistId, setPlaylistId] = useState<string | null>(null);
  const [totalTracks, setTotalTracks] = useState(0);

  // Extract playlist ID from URL
  useEffect(() => {
    if (!playlistUrl) {
      setTracks([]);
      setPlaylistId(null);
      return;
    }

    // Check if it's a Spotify URL
    if (!playlistUrl.includes('spotify.com/playlist/')) {
      setTracks([]);
      setPlaylistId(null);
      return;
    }

    // Extract ID
    const match = playlistUrl.match(/playlist[\/:]([a-zA-Z0-9]+)/);
    if (match) {
      setPlaylistId(match[1]);
      fetchPlaylist(playlistUrl);
    } else {
      setPlaylistId(null);
    }
  }, [playlistUrl]);

  const fetchPlaylist = async (url: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('spotify-playlist', {
        body: { playlistUrl: url }
      });

      if (error) throw error;

      if (data && data.tracks) {
        setTracks(data.tracks);
        setTotalTracks(data.total || data.tracks.length);
      }
    } catch (error) {
      console.error('Failed to fetch playlist:', error);
      toast.error('Failed to load playlist. Make sure it\'s public.');
      setTracks([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!playlistUrl || !playlistUrl.includes('spotify.com/playlist/')) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className="mt-3">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading playlist...</span>
        </CardContent>
      </Card>
    );
  }

  if (tracks.length === 0) {
    return null;
  }

  const handleImportToCeremony = () => {
    if (onImportToCeremony) {
      onImportToCeremony(tracks, 'ceremony');
      toast.success(`Ready to import ${tracks.length} songs to Ceremony`);
    }
  };

  const handleImportToReception = () => {
    if (onImportToReception) {
      onImportToReception(tracks, 'reception');
      toast.success(`Ready to import ${tracks.length} songs to Reception`);
    }
  };

  return (
    <Card className="mt-3 border-primary/20">
      <CardContent className="p-4 space-y-4">
        {/* Playlist Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="h-5 w-5 text-[#1DB954]" />
            <div>
              <p className="font-medium text-sm">{totalTracks} tracks</p>
              <p className="text-xs text-muted-foreground">Spotify Playlist</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(playlistUrl, '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in Spotify
          </Button>
        </div>

        {/* Embedded Spotify Player */}
        {playlistId && (
          <div className="rounded-lg overflow-hidden">
            <iframe
              src={`https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator&theme=0`}
              width="100%"
              height="152"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="rounded-lg"
            />
          </div>
        )}

        {/* Quick Import Buttons */}
        <div className="flex gap-2">
          {onImportToCeremony && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleImportToCeremony}
              className="flex-1"
            >
              <Plus className="h-4 w-4 mr-2" />
              Import to Ceremony
            </Button>
          )}
          {onImportToReception && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleImportToReception}
              className="flex-1"
            >
              <Plus className="h-4 w-4 mr-2" />
              Import to Reception
            </Button>
          )}
        </div>

        {/* Track List Preview (First 5 tracks) */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Preview:</p>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {tracks.slice(0, 10).map((track, idx) => (
              <div
                key={track.id || idx}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 transition-colors"
              >
                {track.albumArt && (
                  <img
                    src={track.albumArt}
                    alt={track.album}
                    className="w-10 h-10 rounded object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{track.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {track.artist}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {tracks.length > 10 && (
            <p className="text-xs text-muted-foreground text-center pt-2">
              + {tracks.length - 10} more tracks
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
