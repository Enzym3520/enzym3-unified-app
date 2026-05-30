import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, GripVertical, Megaphone } from "lucide-react";

export interface Announcement {
  id: string;
  order: number;
  title: string;
  content: string;
  timing?: string;
}

interface AnnouncementsSectionProps {
  announcements: Announcement[];
  onChange: (announcements: Announcement[]) => void;
}

export const AnnouncementsSection = ({ announcements, onChange }: AnnouncementsSectionProps) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const addAnnouncement = () => {
    const newAnnouncement: Announcement = {
      id: crypto.randomUUID(),
      order: announcements.length + 1,
      title: '',
      content: '',
      timing: ''
    };
    onChange([...announcements, newAnnouncement]);
  };

  const updateAnnouncement = (id: string, field: keyof Announcement, value: string | number) => {
    onChange(announcements.map(ann => 
      ann.id === id ? { ...ann, [field]: value } : ann
    ));
  };

  const removeAnnouncement = (id: string) => {
    const newAnnouncements = announcements
      .filter(ann => ann.id !== id)
      .map((ann, idx) => ({ ...ann, order: idx + 1 }));
    onChange(newAnnouncements);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newAnnouncements = [...announcements];
    const draggedItem = newAnnouncements[draggedIndex];
    newAnnouncements.splice(draggedIndex, 1);
    newAnnouncements.splice(index, 0, draggedItem);
    
    const reorderedItems = newAnnouncements.map((ann, idx) => ({
      ...ann,
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
        <CardTitle>Announcements & Intros</CardTitle>
        <CardDescription>
          Special announcements, introductions, or dedications you'd like the DJ to make
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {announcements.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
            <Megaphone className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-4">No announcements yet</p>
            <Button onClick={addAnnouncement} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add First Announcement
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((announcement, index) => (
              <div
                key={announcement.id}
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
                        placeholder="When? (e.g., Before cake cutting)"
                        value={announcement.timing || ''}
                        onChange={(e) => updateAnnouncement(announcement.id, 'timing', e.target.value)}
                        className="md:col-span-1"
                      />
                      <Input
                        placeholder="Title (e.g., Thank You Speech)"
                        value={announcement.title}
                        onChange={(e) => updateAnnouncement(announcement.id, 'title', e.target.value)}
                        className="md:col-span-3"
                      />
                    </div>
                    
                    <Textarea
                      placeholder="Announcement content or script..."
                      value={announcement.content}
                      onChange={(e) => updateAnnouncement(announcement.id, 'content', e.target.value)}
                      rows={3}
                    />
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeAnnouncement(announcement.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {announcements.length > 0 && (
          <Button onClick={addAnnouncement} variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Announcement
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
