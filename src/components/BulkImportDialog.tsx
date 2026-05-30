import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Checkbox } from './ui/checkbox';
import { Loader2, Music } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ImportReviewDialog } from './ImportReviewDialog';
import { toast } from 'sonner';

interface ParsedSong {
  song: string;
  artist?: string;
  rawLine: string;
}

interface SearchResult {
  original: ParsedSong;
  match: Track | null;
  confidence: 'high' | 'medium' | 'low' | 'none';
  isDuplicate: boolean;
  eventType: string;
}

interface Track {
  id: string;
  name: string;
  artist: string;
  album: string;
  albumArt: string;
}

interface BulkImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (songs: Array<{ song: string; artist: string; eventType?: string }>, importMode: 'add' | 'replace' | 'fill') => void;
  existingEvents: Array<{ song?: string; artist?: string }>;
  targetTimeline?: 'ceremony' | 'reception';
}

// Ceremony event mappings
const CEREMONY_EVENT_MAPPINGS: Record<string, string[]> = {
  'Processional': ['processional', 'walking', 'walk down', 'entrance', 'bridal party'],
  'Bride Entrance': ['bride', 'bridal', 'here comes the bride', 'canon in d', 'pachelbel'],
  'Recessional': ['recessional', 'exit', 'walking out', 'leaving', 'celebration'],
  'Unity Ceremony': ['unity', 'candle', 'sand ceremony'],
};

// Reception event mappings
const RECEPTION_EVENT_MAPPINGS: Record<string, string[]> = {
  'Grand Entrance': ['grand entrance', 'introduction', 'announce', 'presented'],
  'First Dance': ['first dance', 'couple dance', 'bride groom dance', 'newlyweds'],
  'Father/Daughter Dance': ['father daughter', 'daddy daughter', 'dad dance'],
  'Mother/Son Dance': ['mother son', 'mom son', 'mother dance'],
  'Cake Cutting': ['cake', 'cutting cake', 'sweet'],
  'Bouquet Toss': ['bouquet', 'toss', 'single ladies', 'beyonce'],
  'Last Dance': ['last dance', 'final dance', 'end', 'closing'],
};

export const BulkImportDialog: React.FC<BulkImportDialogProps> = ({
  open,
  onClose,
  onImport,
  existingEvents,
  targetTimeline = 'reception'
}) => {
  const [inputText, setInputText] = useState('');
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [importMode, setImportMode] = useState<'add' | 'replace' | 'fill'>('add');
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [autoAssign, setAutoAssign] = useState(true);
  const [activeTab, setActiveTab] = useState<'paste' | 'playlist'>('paste');

  const parseSongLine = (line: string): ParsedSong => {
    const trimmedLine = line.trim();
    
    // Try "Song - Artist" or "Artist - Song"
    if (trimmedLine.includes(' - ')) {
      const parts = trimmedLine.split(' - ');
      if (parts.length === 2) {
        return {
          song: parts[0].trim(),
          artist: parts[1].trim(),
          rawLine: trimmedLine
        };
      }
    }
    
    // Try "Song by Artist"
    const byMatch = trimmedLine.match(/(.+?)\s+by\s+(.+)/i);
    if (byMatch) {
      return {
        song: byMatch[1].trim(),
        artist: byMatch[2].trim(),
        rawLine: trimmedLine
      };
    }
    
    // Just song name
    return {
      song: trimmedLine,
      rawLine: trimmedLine
    };
  };

  const parseSongList = (text: string): ParsedSong[] => {
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(parseSongLine);
  };

  // Auto-assign event type based on song name and artist
  const autoAssignEventType = (song: string, artist: string): string => {
    if (!autoAssign) return '';
    
    const searchText = `${song} ${artist}`.toLowerCase();
    
    // Check ceremony mappings first
    for (const [eventType, keywords] of Object.entries(CEREMONY_EVENT_MAPPINGS)) {
      if (keywords.some(keyword => searchText.includes(keyword))) {
        return eventType;
      }
    }
    
    // Check reception mappings
    for (const [eventType, keywords] of Object.entries(RECEPTION_EVENT_MAPPINGS)) {
      if (keywords.some(keyword => searchText.includes(keyword))) {
        return eventType;
      }
    }
    
    return ''; // No match
  };

  // Calculate confidence of match
  const calculateConfidence = (parsed: ParsedSong, spotifyTrack: Track): 'high' | 'medium' | 'low' => {
    const songMatch = spotifyTrack.name.toLowerCase().includes(parsed.song.toLowerCase()) ||
                      parsed.song.toLowerCase().includes(spotifyTrack.name.toLowerCase());
    const artistMatch = parsed.artist && 
                        (spotifyTrack.artist.toLowerCase().includes(parsed.artist.toLowerCase()) ||
                         parsed.artist.toLowerCase().includes(spotifyTrack.artist.toLowerCase()));
    
    if (songMatch && artistMatch) return 'high';
    if (songMatch) return 'medium';
    return 'low';
  };

  // Check for duplicates
  const checkForDuplicates = (results: SearchResult[]): SearchResult[] => {
    return results.map(result => {
      if (!result.match) return { ...result, isDuplicate: false, eventType: '' };
      
      const isDuplicate = existingEvents.some(event => {
        const songMatch = event.song?.toLowerCase() === result.match!.name.toLowerCase();
        const artistMatch = event.artist?.toLowerCase() === result.match!.artist.toLowerCase();
        return songMatch && artistMatch;
      });
      
      const eventType = autoAssignEventType(result.match.name, result.match.artist);
      
      return { ...result, isDuplicate, eventType };
    });
  };

  const searchSongsOnSpotify = async (songs: ParsedSong[]): Promise<SearchResult[]> => {
    const results: SearchResult[] = [];
    
    for (let i = 0; i < songs.length; i++) {
      const { song, artist } = songs[i];
      const query = artist ? `${song} ${artist}` : song;
      
      setProgress({ current: i + 1, total: songs.length });
      
      const { data, error } = await supabase.functions.invoke('spotify-search', {
        body: { query }
      });
      
      if (error) {
        console.error('Spotify search error:', error);
        results.push({
          original: songs[i],
          match: null,
          confidence: 'none',
          isDuplicate: false,
          eventType: ''
        });
      } else if (data && data.tracks && data.tracks.length > 0) {
        results.push({
          original: songs[i],
          match: data.tracks[0],
          confidence: calculateConfidence(songs[i], data.tracks[0]),
          isDuplicate: false,
          eventType: ''
        });
      } else {
        results.push({
          original: songs[i],
          match: null,
          confidence: 'none',
          isDuplicate: false,
          eventType: ''
        });
      }
      
      // Rate limiting delay
      if (i < songs.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
    
    // Check for duplicates and assign event types
    const resultsWithMetadata = checkForDuplicates(results);
    return resultsWithMetadata;
  };

  // Fetch Spotify playlist
  const handleFetchPlaylist = async () => {
    if (!playlistUrl.trim()) {
      toast.error('Please enter a Spotify playlist URL');
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('spotify-playlist', {
        body: { playlistUrl }
      });

      if (error) throw error;

      if (data && data.tracks) {
        toast.success(`Found ${data.tracks.length} tracks in playlist`);
        
        // Create search results directly from playlist data
        const results: SearchResult[] = data.tracks.map((track: Track) => ({
          original: {
            song: track.name,
            artist: track.artist,
            rawLine: `${track.name} - ${track.artist}`
          },
          match: track,
          confidence: 'high' as const,
          isDuplicate: false,
          eventType: ''
        }));

        // Check for duplicates and assign event types
        const resultsWithMetadata = checkForDuplicates(results);
        setSearchResults(resultsWithMetadata);
        setShowReviewDialog(true);
      }
    } catch (error) {
      console.error('Playlist fetch error:', error);
      toast.error('Failed to fetch playlist. Make sure it\'s public and the URL is correct.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImportAndSearch = async () => {
    if (!inputText.trim()) {
      toast.error('Please paste at least one song');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const parsedSongs = parseSongList(inputText);
      const results = await searchSongsOnSpotify(parsedSongs);
      setSearchResults(results);
      setShowReviewDialog(true);
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to process song list');
    } finally {
      setIsProcessing(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  const handleReviewComplete = (selectedSongs: Array<{ song: string; artist: string; eventType?: string }>) => {
    // Filter out duplicates if skipDuplicates is enabled
    let finalSongs = selectedSongs;
    if (skipDuplicates) {
      const resultsToCheck = searchResults.filter(r => r.match);
      finalSongs = selectedSongs.filter((song, idx) => {
        const result = resultsToCheck[idx];
        return !result?.isDuplicate;
      });
    }

    onImport(finalSongs, importMode);
    setShowReviewDialog(false);
    onClose();
    setInputText('');
    setPlaylistUrl('');
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Import Songs</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="paste">Paste Song List</TabsTrigger>
                <TabsTrigger value="playlist">
                  <Music className="h-4 w-4 mr-2" />
                  Spotify Playlist
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="paste" className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Paste your song list below. Supported formats:
                  </Label>
                  <ul className="text-sm text-muted-foreground space-y-1 pl-4">
                    <li>• Song Name - Artist Name</li>
                    <li>• Artist Name - Song Name</li>
                    <li>• Song Name by Artist Name</li>
                    <li>• Just Song Name (will auto-search)</li>
                  </ul>
                  <p className="text-xs text-muted-foreground">One song per line</p>
                </div>

                <Textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste your song list here..."
                  className="min-h-[200px] font-mono text-sm"
                />
              </TabsContent>
              
              <TabsContent value="playlist" className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Import from Spotify Playlist
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Paste a Spotify playlist URL or ID. The playlist must be public.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Input
                    value={playlistUrl}
                    onChange={(e) => setPlaylistUrl(e.target.value)}
                    placeholder="https://open.spotify.com/playlist/..."
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleFetchPlaylist} 
                    disabled={!playlistUrl.trim() || isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Fetching...
                      </>
                    ) : (
                      'Fetch Tracks'
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            <div className="border rounded-lg p-4 space-y-3">
              <Label className="font-medium">Import Options</Label>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="skip-duplicates"
                  checked={skipDuplicates}
                  onCheckedChange={(checked) => setSkipDuplicates(checked as boolean)}
                />
                <Label htmlFor="skip-duplicates" className="font-normal cursor-pointer">
                  Skip duplicate songs
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="auto-assign"
                  checked={autoAssign}
                  onCheckedChange={(checked) => setAutoAssign(checked as boolean)}
                />
                <Label htmlFor="auto-assign" className="font-normal cursor-pointer">
                  Auto-assign event types based on song names
                </Label>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Import Mode</Label>
              <RadioGroup value={importMode} onValueChange={(value: any) => setImportMode(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="add" id="add" />
                  <Label htmlFor="add" className="font-normal cursor-pointer">
                    Add to existing events
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="replace" id="replace" />
                  <Label htmlFor="replace" className="font-normal cursor-pointer">
                    Replace all events
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fill" id="fill" />
                  <Label htmlFor="fill" className="font-normal cursor-pointer">
                    Fill empty rows only
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {isProcessing && activeTab === 'paste' && (
              <div className="flex items-center justify-center space-x-2 py-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>
                  Searching Spotify... ({progress.current}/{progress.total})
                </span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={isProcessing}>
              Cancel
            </Button>
            {activeTab === 'paste' && (
              <Button onClick={handleImportAndSearch} disabled={!inputText.trim() || isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  'Import & Search'
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImportReviewDialog
        open={showReviewDialog}
        onClose={() => {
          setShowReviewDialog(false);
          setSearchResults([]);
        }}
        onImport={handleReviewComplete}
        searchResults={searchResults}
        importMode={importMode}
        existingEvents={existingEvents}
        targetTimeline={targetTimeline}
      />
    </>
  );
};
