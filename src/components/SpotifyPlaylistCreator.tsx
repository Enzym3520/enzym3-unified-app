import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Music, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

interface Song {
  name: string;
  artist: string;
}

interface SpotifyPlaylistCreatorProps {
  weddingId: string;
  tabName?: string;
  songs?: Song[];
  eventDate?: string;
}

export const SpotifyPlaylistCreator = ({ 
  weddingId, 
  tabName, 
  songs,
  eventDate 
}: SpotifyPlaylistCreatorProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [playlistUrl, setPlaylistUrl] = useState<string | null>(null);
  const [creationResult, setCreationResult] = useState<{
    tracksAdded: number;
    tracksNotFound: string[];
  } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkConnection();
    
    // Check for OAuth callback results
    const params = new URLSearchParams(window.location.search);
    if (params.get('spotify_connected') === 'true') {
      toast({
        title: "Spotify Connected!",
        description: "You can now create playlists from your vibe sheet.",
      });
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
      checkConnection();
    } else if (params.get('spotify_error')) {
      toast({
        title: "Connection Failed",
        description: "There was an error connecting to Spotify. Please try again.",
        variant: "destructive",
      });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [weddingId]);

  const checkConnection = async () => {
    try {
      // Use secure view that excludes OAuth tokens
      const { data, error } = await supabase
        .from('spotify_connections_safe')
        .select('id')
        .eq('wedding_id', weddingId)
        .maybeSingle();

      if (!error && data) {
        setIsConnected(true);
      }
    } catch (error) {
      console.error('Error checking Spotify connection:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('spotify-auth', {
        body: { 
          weddingId,
          originUrl: window.location.origin 
        },
      });

      if (error) throw error;

      if (data.authUrl) {
        // Navigate in the same tab to preserve session
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Error connecting to Spotify:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to start Spotify authorization.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleCreatePlaylist = async () => {
    setIsLoading(true);
    setCreationResult(null);
    setPlaylistUrl(null);

    // Filter out empty songs
    const validSongs = songs?.filter(s => s.name && s.name.trim() !== '') || [];

    if (songs && validSongs.length === 0) {
      toast({
        title: "No Songs",
        description: `Add some songs to the ${tabName || 'timeline'} before creating a playlist.`,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('spotify-create-playlist', {
        body: { 
          weddingId,
          tabName,
          songs: validSongs.length > 0 ? validSongs : undefined,
          eventDate
        },
      });

      // FunctionsHttpError (non-2xx) is thrown as `error` — read its body to check needsReconnect
      if (error) {
        let errorBody: { needsReconnect?: boolean } = {};
        try {
          errorBody = await (error as { context?: Response }).context?.json?.() ?? {};
        } catch {
          // ignore parse errors
        }
        if (errorBody.needsReconnect) {
          setIsConnected(false);
          toast({
            title: "Spotify Reconnection Required",
            description: "Your Spotify authorization expired. Please reconnect your account.",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      if (data.success) {
        setPlaylistUrl(data.playlistUrl);
        setCreationResult({
          tracksAdded: data.tracksAdded,
          tracksNotFound: data.tracksNotFound || [],
        });
        
        toast({
          title: "Playlist Created!",
          description: `${data.tracksAdded} songs added to "${data.playlistName}"`,
        });
      }
    } catch (error) {
      console.error('Error creating playlist:', error);
      toast({
        title: "Creation Failed",
        description: "Failed to create Spotify playlist. Please try reconnecting your Spotify account.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return null;
  }

  const buttonLabel = tabName 
    ? `Create ${tabName} Playlist` 
    : 'Create Spotify Playlist';

  return (
    <div className="space-y-4">
      {!isConnected ? (
        <Alert>
          <Music className="h-4 w-4" />
          <AlertDescription>
            Connect your Spotify account to create a playlist from your {tabName?.toLowerCase() || 'vibe sheet'} songs.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription>
            Spotify connected! Ready to create your {tabName?.toLowerCase() || 'wedding'} playlist.
          </AlertDescription>
        </Alert>
      )}

      {creationResult && creationResult.tracksNotFound.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription>
            <p className="font-medium mb-2">Some songs couldn't be found on Spotify:</p>
            <ul className="text-sm list-disc list-inside space-y-1">
              {creationResult.tracksNotFound.slice(0, 5).map((song, idx) => (
                <li key={idx}>{song}</li>
              ))}
              {creationResult.tracksNotFound.length > 5 && (
                <li>...and {creationResult.tracksNotFound.length - 5} more</li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap gap-3">
        {!isConnected ? (
          <Button
            onClick={handleConnect}
            disabled={isLoading}
            className="bg-[#1DB954] hover:bg-[#1ed760] text-white"
          >
            <Music className="mr-2 h-4 w-4" />
            {isLoading ? 'Connecting...' : 'Connect Spotify'}
          </Button>
        ) : (
          <>
            <Button
              onClick={handleCreatePlaylist}
              disabled={isLoading}
              className="bg-[#1DB954] hover:bg-[#1ed760] text-white"
            >
              <Music className="mr-2 h-4 w-4" />
              {isLoading ? 'Creating Playlist...' : buttonLabel}
            </Button>

            {playlistUrl && (
              <Button
                onClick={() => window.open(playlistUrl, '_blank')}
                variant="outline"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Playlist
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
