import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { SpotifySearch } from "@/components/SpotifySearch";

export interface QuinceTimelineEvent {
  id: string;
  order: number;
  event_name: string;
  song: string;
  artist: string;
  notes?: string;
}

export const DEFAULT_QUINCE_CEREMONY_EVENTS: QuinceTimelineEvent[] = [
  { id: crypto.randomUUID(), order: 1, event_name: 'Processional / Entrada', song: '', artist: '' },
  { id: crypto.randomUUID(), order: 2, event_name: 'Last Doll Ceremony (La Última Muñeca)', song: '', artist: '' },
  { id: crypto.randomUUID(), order: 3, event_name: 'Changing of Shoes (Cambio de Zapatos)', song: '', artist: '' },
  { id: crypto.randomUUID(), order: 4, event_name: 'Crowning Ceremony (La Coronación)', song: '', artist: '' },
  { id: crypto.randomUUID(), order: 5, event_name: 'Recessional', song: '', artist: '' },
];

export const DEFAULT_QUINCE_RECEPTION_EVENTS: QuinceTimelineEvent[] = [
  { id: crypto.randomUUID(), order: 1, event_name: 'Grand Entrance', song: '', artist: '' },
  { id: crypto.randomUUID(), order: 2, event_name: 'Toast (El Brindis)', song: '', artist: '' },
  { id: crypto.randomUUID(), order: 3, event_name: 'Father-Daughter Waltz (Vals)', song: '', artist: '' },
  { id: crypto.randomUUID(), order: 4, event_name: 'Court of Honor Dance', song: '', artist: '' },
  { id: crypto.randomUUID(), order: 5, event_name: 'Surprise Dance', song: '', artist: '' },
  { id: crypto.randomUUID(), order: 6, event_name: 'Cake Cutting', song: '', artist: '' },
  { id: crypto.randomUUID(), order: 7, event_name: 'Group Dances (Hora Loca)', song: '', artist: '' },
  { id: crypto.randomUUID(), order: 8, event_name: 'Last Dance', song: '', artist: '' },
];

interface QuinceTimelineProps {
  events: QuinceTimelineEvent[];
  onChange: (events: QuinceTimelineEvent[]) => void;
  type: 'ceremony' | 'reception';
}

export const QuinceTimeline = ({ events, onChange, type }: QuinceTimelineProps) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  const addEvent = () => {
    const newEvent: QuinceTimelineEvent = {
      id: crypto.randomUUID(),
      order: events.length + 1,
      event_name: '',
      song: '',
      artist: ''
    };
    onChange([...events, newEvent]);
  };

  const updateEvent = (id: string, field: keyof QuinceTimelineEvent, value: string | number) => {
    onChange(events.map(event => 
      event.id === id ? { ...event, [field]: value } : event
    ));
  };

  const removeEvent = (id: string) => {
    const newEvents = events
      .filter(event => event.id !== id)
      .map((event, idx) => ({ ...event, order: idx + 1 }));
    onChange(newEvents);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newEvents = [...events];
    const draggedEvent = newEvents[draggedIndex];
    newEvents.splice(draggedIndex, 1);
    newEvents.splice(index, 0, draggedEvent);
    
    const reorderedEvents = newEvents.map((event, idx) => ({
      ...event,
      order: idx + 1
    }));
    
    onChange(reorderedEvents);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSongSelect = (eventId: string, track: { name: string; artist: string }) => {
    onChange(events.map(event => 
      event.id === eventId 
        ? { ...event, song: track.name, artist: track.artist }
        : event
    ));
    setExpandedEventId(null);
  };

  const title = type === 'ceremony' ? 'Quinceañera Ceremony' : 'Reception Timeline';
  const description = type === 'ceremony' 
    ? 'Traditional ceremony moments and their music'
    : 'Reception events and songs';

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {events.map((event, index) => (
          <div
            key={event.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`
              p-3 border rounded-lg bg-card transition-all
              ${draggedIndex === index ? 'opacity-50 border-primary' : 'hover:border-primary/50'}
            `}
          >
            <div className="flex items-start gap-3">
              <div className="cursor-grab pt-2">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
              </div>
              
              <div className="flex-1 space-y-2">
                <Input
                  placeholder="Event Name"
                  value={event.event_name}
                  onChange={(e) => updateEvent(event.id, 'event_name', e.target.value)}
                  className="font-medium"
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="relative">
                    {expandedEventId === event.id ? (
                      <SpotifySearch
                        initialSong={event.song}
                        initialArtist={event.artist}
                        onSelect={(track) => handleSongSelect(event.id, { name: track.name, artist: track.artist })}
                        compact
                      />
                    ) : (
                      <Input
                        placeholder="Song"
                        value={event.song}
                        onChange={(e) => updateEvent(event.id, 'song', e.target.value)}
                        onFocus={() => setExpandedEventId(event.id)}
                      />
                    )}
                  </div>
                  <Input
                    placeholder="Artist"
                    value={event.artist}
                    onChange={(e) => updateEvent(event.id, 'artist', e.target.value)}
                  />
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeEvent(event.id)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        
        <Button onClick={addEvent} variant="outline" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Event
        </Button>
      </CardContent>
    </Card>
  );
};
