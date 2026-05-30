import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search, Music2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Track {
  id: string;
  name: string;
  artist: string;
  album: string;
  albumArt: string | null;
  previewUrl: string | null;
  spotifyUri: string;
  externalUrl: string;
}

interface SpotifySearchProps {
  label?: string;
  onSelect: (track: Track) => void;
  initialSong?: string;
  initialArtist?: string;
  compact?: boolean;
  className?: string;
}

export const SpotifySearch = ({ 
  label, 
  onSelect, 
  initialSong = '', 
  initialArtist = '',
  compact = false,
  className
}: SpotifySearchProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [songName, setSongName] = useState(initialSong);
  const [artistName, setArtistName] = useState(initialArtist);
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Update local state when initial values change
  useEffect(() => {
    setSongName(initialSong);
    setArtistName(initialArtist);
  }, [initialSong, initialArtist]);

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(async () => {
      await performSearch(searchQuery);
    }, 500);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('spotify-search', {
        body: { query }
      });

      if (error) throw error;

      setSearchResults(data.tracks || []);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search Spotify');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectTrack = (track: Track) => {
    setSongName(track.name);
    setArtistName(track.artist);
    setSearchQuery('');
    setShowResults(false);
    setSearchResults([]);
    onSelect(track);
    toast.success('Song selected!');
  };

  // Compact mode: display only song name
  const displayValue = songName || '';

  if (compact) {
    return (
      <div className={cn("relative", className)}>
        <Input
          value={displayValue}
          onChange={(e) => {
            const value = e.target.value;
            setSongName(value);
            setSearchQuery(value);
            onSelect({ 
              id: '', 
              name: value, 
              artist: artistName,
              album: '',
              albumArt: null,
              previewUrl: null,
              spotifyUri: '',
              externalUrl: ''
            });
          }}
          placeholder="Enter song name (or search Spotify)..."
          className="h-9"
        />

        {/* Search Results Dropdown */}
        {showResults && searchResults.length > 0 && (
          <div 
            ref={resultsRef}
            className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-[300px] overflow-y-auto"
          >
            {searchResults.map((track) => (
              <button
                key={track.id}
                onClick={() => handleSelectTrack(track)}
                className="w-full flex items-center gap-3 p-3 hover:bg-accent transition-colors text-left"
              >
                {track.albumArt ? (
                  <img 
                    src={track.albumArt} 
                    alt={track.album}
                    className="w-10 h-10 rounded object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                    <Music2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-sm">{track.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {isSearching && (
          <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg p-3 text-center text-xs text-muted-foreground">
            Searching Spotify...
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      
      {/* Song Name with Autocomplete */}
      <div className="relative">
        <div>
          <Label>Song Title</Label>
          <Input
            value={songName}
            onChange={(e) => {
              const value = e.target.value;
              setSongName(value);
              setSearchQuery(value);
              onSelect({ 
                id: '', 
                name: value, 
                artist: artistName,
                album: '',
                albumArt: null,
                previewUrl: null,
                spotifyUri: '',
                externalUrl: ''
              });
            }}
            placeholder="Enter song name (or search Spotify)..."
          />

          {/* Search Results Dropdown */}
          {showResults && searchResults.length > 0 && (
            <div 
              ref={resultsRef}
              className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-[300px] overflow-y-auto"
            >
              {searchResults.map((track) => (
                <button
                  key={track.id}
                  onClick={() => handleSelectTrack(track)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-accent transition-colors text-left"
                >
                  {track.albumArt ? (
                    <img 
                      src={track.albumArt} 
                      alt={track.album}
                      className="w-10 h-10 rounded object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                      <Music2 className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-sm">{track.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {isSearching && (
            <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg p-3 text-center text-xs text-muted-foreground">
              Searching Spotify...
            </div>
          )}
        </div>
        <div>
          <Label>Artist</Label>
          <Input
            value={artistName}
            onChange={(e) => {
              setArtistName(e.target.value);
              onSelect({ 
                id: '', 
                name: songName, 
                artist: e.target.value,
                album: '',
                albumArt: null,
                previewUrl: null,
                spotifyUri: '',
                externalUrl: ''
              });
            }}
            placeholder="Enter artist name manually"
          />
        </div>
      </div>
    </div>
  );
};
