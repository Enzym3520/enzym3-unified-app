import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, GripVertical, FileText, Music } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BulkImportDialog } from './BulkImportDialog';
import { useIsMobile } from '@/hooks/use-mobile';

export interface CeremonyTimelineEvent {
  id: string;
  order: number;
  event_name: string;
  song?: string;
  artist?: string;
}

interface Track {
  id: string;
  name: string;
  artist: string;
  album: string;
  albumArt: string;
}

interface CeremonyTimelineProps {
  events: CeremonyTimelineEvent[];
  onEventsChange: (events: CeremonyTimelineEvent[]) => void;
}

const DEFAULT_EVENTS: CeremonyTimelineEvent[] = [
  { id: crypto.randomUUID(), order: 1, event_name: 'Parents/Grandparents Processional', song: '', artist: '' },
  { id: crypto.randomUUID(), order: 2, event_name: "Groom's Entrance", song: '', artist: '' },
  { id: crypto.randomUUID(), order: 3, event_name: 'Bridal Party Processional', song: '', artist: '' },
  { id: crypto.randomUUID(), order: 4, event_name: "Bride's Entrance", song: '', artist: '' },
  { id: crypto.randomUUID(), order: 5, event_name: 'Recessional', song: '', artist: '' },
];

export const CeremonyTimeline = ({ events, onEventsChange }: CeremonyTimelineProps) => {
  const displayEvents = events.length > 0 ? events : DEFAULT_EVENTS;
  const [searchingRowId, setSearchingRowId] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<'top' | 'bottom'>('bottom');
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const isMobile = useIsMobile();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setSearchingRowId(null);
        setSearchResults([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchQuery.length > 1) {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      
      searchTimeoutRef.current = setTimeout(async () => {
        setIsSearching(true);
        try {
          const { data, error } = await supabase.functions.invoke('spotify-search', {
            body: { query: searchQuery }
          });
          
          if (!error && data && data.tracks) {
            setSearchResults(data.tracks);
          }
        } catch (error) {
          console.error('Spotify search error:', error);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    } else {
      setSearchResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery]);

  const addCustomEvent = () => {
    const newEvent: CeremonyTimelineEvent = {
      id: crypto.randomUUID(),
      order: displayEvents.length + 1,
      event_name: '',
      song: '',
      artist: ''
    };
    onEventsChange([...displayEvents, newEvent]);
  };

  const deleteEvent = (id: string) => {
    const filtered = displayEvents.filter(e => e.id !== id);
    const reordered = filtered.map((e, idx) => ({ ...e, order: idx + 1 }));
    onEventsChange(reordered);
  };

  const updateEvent = (id: string, updates: Partial<CeremonyTimelineEvent>) => {
    onEventsChange(
      displayEvents.map(e => e.id === id ? { ...e, ...updates } : e)
    );
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/html'));
    
    if (dragIndex === dropIndex) return;
    
    const newEvents = [...displayEvents];
    const [draggedEvent] = newEvents.splice(dragIndex, 1);
    newEvents.splice(dropIndex, 0, draggedEvent);
    
    const reordered = newEvents.map((e, idx) => ({ ...e, order: idx + 1 }));
    onEventsChange(reordered);
  };

  const handleSongFocus = (eventId: string) => {
    setSearchingRowId(eventId);
    const inputContainer = inputRefs.current.get(eventId);
    if (inputContainer) {
      const rect = inputContainer.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      setDropdownPosition(spaceBelow < 300 && spaceAbove > spaceBelow ? 'top' : 'bottom');
    }
  };

  const handleSelectTrack = (eventId: string, track: Track) => {
    updateEvent(eventId, { song: track.name, artist: track.artist });
    setSearchingRowId(null);
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleBulkImport = (songs: Array<{ song: string; artist: string; eventType?: string }>, importMode: 'add' | 'replace' | 'fill') => {
    if (importMode === 'replace') {
      const newEvents = songs.map((s, idx) => ({
        id: crypto.randomUUID(),
        order: idx + 1,
        event_name: s.eventType || '',
        song: s.song,
        artist: s.artist
      }));
      onEventsChange(newEvents);
    } else if (importMode === 'fill') {
      const updatedEvents = [...displayEvents];
      let songIndex = 0;
      
      for (let i = 0; i < updatedEvents.length && songIndex < songs.length; i++) {
        if (!updatedEvents[i].song || !updatedEvents[i].artist) {
          updatedEvents[i] = {
            ...updatedEvents[i],
            event_name: songs[songIndex].eventType || updatedEvents[i].event_name,
            song: songs[songIndex].song,
            artist: songs[songIndex].artist
          };
          songIndex++;
        }
      }
      
      onEventsChange(updatedEvents);
    } else { // add
      const newEvents = songs.map((s, idx) => ({
        id: crypto.randomUUID(),
        order: displayEvents.length + idx + 1,
        event_name: s.eventType || '',
        song: s.song,
        artist: s.artist
      }));
      onEventsChange([...displayEvents, ...newEvents]);
    }
  };

  // Mobile card layout
  if (isMobile) {
    return (
      <div className="space-y-4 pb-4">
        {displayEvents.map((event, index) => (
          <div 
            key={event.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            className="border rounded-lg p-4 bg-card space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteEvent(event.id)}
                className="h-8 w-8"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            
            <Input
              value={event.event_name}
              onChange={(e) => updateEvent(event.id, { event_name: e.target.value })}
              placeholder="Event name"
              className="font-medium"
            />
            
            <div 
              className="relative" 
              ref={(el) => {
                if (el) inputRefs.current.set(event.id, el);
                if (searchingRowId === event.id) dropdownRef.current = el;
              }}
            >
              <div className="flex items-center gap-2">
                <Music className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Input
                  value={event.song || ''}
                  onChange={(e) => {
                    updateEvent(event.id, { song: e.target.value });
                    setSearchQuery(e.target.value);
                    handleSongFocus(event.id);
                  }}
                  onFocus={() => {
                    setSearchQuery(event.song || '');
                    handleSongFocus(event.id);
                  }}
                  placeholder="Search for a song..."
                  className="flex-1"
                />
              </div>
              
              {searchingRowId === event.id && searchResults.length > 0 && (
                <div className={`absolute left-0 right-0 z-[100] bg-popover border rounded-md shadow-lg max-h-60 overflow-y-auto ${
                  dropdownPosition === 'top' ? 'bottom-full mb-1' : 'mt-1'
                }`}>
                  {searchResults.map((track) => (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => handleSelectTrack(event.id, track)}
                      className="w-full px-3 py-2 flex items-center gap-3 hover:bg-accent transition-colors text-left"
                    >
                      {track.albumArt && (
                        <img 
                          src={track.albumArt} 
                          alt={track.album}
                          className="w-10 h-10 rounded object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{track.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{track.artist}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {searchingRowId === event.id && isSearching && (
                <div className={`absolute left-0 right-0 z-[100] bg-popover border rounded-md shadow-lg px-3 py-2 ${
                  dropdownPosition === 'top' ? 'bottom-full mb-1' : 'mt-1'
                }`}>
                  <div className="text-sm text-muted-foreground">Searching...</div>
                </div>
              )}
            </div>
            
            {event.song && (
              <Input
                value={event.artist || ''}
                onChange={(e) => updateEvent(event.id, { artist: e.target.value })}
                placeholder="Artist name"
                className="text-sm"
              />
            )}
          </div>
        ))}
        
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => setShowBulkImport(true)}
            className="flex-1"
          >
            <FileText className="h-4 w-4 mr-2" />
            Bulk Import
          </Button>
          
          <Button
            variant="outline"
            onClick={addCustomEvent}
            className="flex-1"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        </div>

        <BulkImportDialog
          open={showBulkImport}
          onClose={() => setShowBulkImport(false)}
          onImport={handleBulkImport}
          existingEvents={displayEvents}
          targetTimeline="ceremony"
        />
      </div>
    );
  }

  // Desktop table layout
  return (
    <div className="space-y-4 pb-4">
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted px-4 py-2 grid grid-cols-[30px_60px_200px_1fr_1fr_40px] gap-3 text-sm font-medium">
          <div></div>
          <div>Order</div>
          <div>Event</div>
          <div>Song Name</div>
          <div>Artist</div>
          <div></div>
        </div>
        
        {displayEvents.map((event, index) => (
          <div 
            key={event.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            className="px-4 py-2 border-t grid grid-cols-[30px_60px_200px_1fr_1fr_40px] gap-3 items-center hover:bg-accent/50 transition-colors cursor-move"
          >
            <div className="flex items-center justify-center text-muted-foreground">
              <GripVertical className="h-4 w-4" />
            </div>
            
            <div className="text-center font-medium">
              {index + 1}
            </div>
            
            <Input
              value={event.event_name}
              onChange={(e) => updateEvent(event.id, { event_name: e.target.value })}
              placeholder="Event name"
              className="h-9"
            />
            
            <div 
              className="relative" 
              ref={(el) => {
                if (el) inputRefs.current.set(event.id, el);
                if (searchingRowId === event.id) dropdownRef.current = el;
              }}
            >
              <Input
                value={event.song || ''}
                onChange={(e) => {
                  updateEvent(event.id, { song: e.target.value });
                  setSearchQuery(e.target.value);
                  handleSongFocus(event.id);
                }}
                onFocus={() => {
                  setSearchQuery(event.song || '');
                  handleSongFocus(event.id);
                }}
                placeholder="Song name"
                className="h-9"
              />
              
              {searchingRowId === event.id && searchResults.length > 0 && (
                <div className={`absolute z-[100] min-w-[350px] w-max bg-popover border rounded-md shadow-lg max-h-60 overflow-y-auto ${
                  dropdownPosition === 'top' ? 'bottom-full mb-1' : 'mt-1'
                }`}>
                  {searchResults.map((track) => (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => handleSelectTrack(event.id, track)}
                      className="w-full px-3 py-2 flex items-center gap-3 hover:bg-accent transition-colors text-left"
                    >
                      {track.albumArt && (
                        <img 
                          src={track.albumArt} 
                          alt={track.album}
                          className="w-10 h-10 rounded object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{track.name}</div>
                        <div className="text-xs text-muted-foreground">{track.artist}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {searchingRowId === event.id && isSearching && (
                <div className={`absolute z-[100] min-w-[350px] w-max bg-popover border rounded-md shadow-lg px-3 py-2 ${
                  dropdownPosition === 'top' ? 'bottom-full mb-1' : 'mt-1'
                }`}>
                  <div className="text-sm text-muted-foreground">Searching...</div>
                </div>
              )}
            </div>
            
            <Input
              value={event.artist || ''}
              onChange={(e) => updateEvent(event.id, { artist: e.target.value })}
              placeholder="Artist name"
              className="h-9"
            />
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteEvent(event.id)}
              className="h-9 w-9"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => setShowBulkImport(true)}
          className="flex-1"
        >
          <FileText className="h-4 w-4 mr-2" />
          Bulk Import Songs
        </Button>
        
        <Button
          variant="outline"
          onClick={addCustomEvent}
          className="flex-1"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Custom Event
        </Button>
      </div>

      <BulkImportDialog
        open={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        onImport={handleBulkImport}
        existingEvents={displayEvents}
        targetTimeline="ceremony"
      />
    </div>
  );
};

export { DEFAULT_EVENTS };
