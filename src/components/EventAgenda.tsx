import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, GripVertical, Clock, Music } from "lucide-react";

export interface AgendaItem {
  id: string;
  order: number;
  time: string;
  event_name: string;
  notes: string;
  song?: string;
  artist?: string;
}

export const DEFAULT_AGENDA_ITEMS: AgendaItem[] = [];

interface EventAgendaProps {
  items: AgendaItem[];
  onChange: (items: AgendaItem[]) => void;
  eventType?: string;
}

export const EventAgenda = ({ items, onChange }: EventAgendaProps) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const addItem = () => {
    const newItem: AgendaItem = {
      id: crypto.randomUUID(),
      order: items.length + 1,
      time: '',
      event_name: '',
      notes: '',
      song: '',
      artist: ''
    };
    onChange([...items, newItem]);
  };

  const updateItem = (id: string, field: keyof AgendaItem, value: string | number) => {
    onChange(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const removeItem = (id: string) => {
    const newItems = items
      .filter(item => item.id !== id)
      .map((item, idx) => ({ ...item, order: idx + 1 }));
    onChange(newItems);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newItems = [...items];
    const draggedItem = newItems[draggedIndex];
    newItems.splice(draggedIndex, 1);
    newItems.splice(index, 0, draggedItem);
    
    // Update order numbers
    const reorderedItems = newItems.map((item, idx) => ({
      ...item,
      order: idx + 1
    }));
    
    onChange(reorderedItems);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Event Agenda</CardTitle>
        <CardDescription>
          Create your custom timeline for the event. Drag and drop to reorder items.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-4">No agenda items yet</p>
            <Button onClick={addItem} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add First Item
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`
                  p-4 border rounded-lg bg-card transition-all
                  ${draggedIndex === index ? 'opacity-50 border-primary' : 'hover:border-primary/50'}
                `}
              >
                <div className="flex items-start gap-3">
                  <div className="cursor-grab pt-2">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <Input
                        type="time"
                        value={item.time}
                        onChange={(e) => updateItem(item.id, 'time', e.target.value)}
                        className="md:col-span-1"
                      />
                      <Input
                        placeholder="Event Name (e.g., Welcome Speech)"
                        value={item.event_name}
                        onChange={(e) => updateItem(item.id, 'event_name', e.target.value)}
                        className="md:col-span-3"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <Music className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <Input
                          placeholder="Song (optional)"
                          value={item.song || ''}
                          onChange={(e) => updateItem(item.id, 'song', e.target.value)}
                        />
                      </div>
                      <Input
                        placeholder="Artist (optional)"
                        value={item.artist || ''}
                        onChange={(e) => updateItem(item.id, 'artist', e.target.value)}
                      />
                    </div>
                    
                    <Textarea
                      placeholder="Notes, announcements, or special instructions..."
                      value={item.notes}
                      onChange={(e) => updateItem(item.id, 'notes', e.target.value)}
                      rows={2}
                    />
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {items.length > 0 && (
          <Button onClick={addItem} variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Agenda Item
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
