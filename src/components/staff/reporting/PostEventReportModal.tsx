import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Star, X, Plus, Users, Music, MapPin, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { parseLocalDate } from '@/utils/dateHelpers';
import { EventNotification } from '@/types/notification';
import { EventPostReport, EventPostReportInput } from '@/hooks/useEventPostReports';

interface PostEventReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  notification: EventNotification | null;
  existingReport: EventPostReport | null;
  onSave: (eventId: string, data: Partial<EventPostReportInput>, reportId?: string) => Promise<boolean>;
}

const GENRES = ['Hip-Hop', 'Regional Mexican', 'Top 40', 'EDM', 'Latin', 'Country', 'R&B', 'Rock', 'Mixed', 'Jazz', 'Pop', 'Reggaeton'];
const AGE_RANGES = ['Under 21', 'Mixed 21–35', 'Mixed 25–45', '40+', 'All Ages', 'Mixed All Ages'];

function StarRating({ value, onChange, max = 5 }: { value: number; onChange: (v: number) => void; max?: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <button key={i} type="button" onClick={() => onChange(i + 1)} className="transition-transform hover:scale-110">
          <Star
            className={`w-6 h-6 ${i < value ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/40'}`}
          />
        </button>
      ))}
    </div>
  );
}

function TagInput({ tags, onAdd, onRemove, placeholder }: {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault();
      onAdd(input.trim());
      setInput('');
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button type="button" size="sm" variant="outline" onClick={() => { if (input.trim()) { onAdd(input.trim()); setInput(''); } }}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map(tag => (
            <Badge key={tag} variant="secondary" className="flex items-center gap-1 pr-1">
              {tag}
              <button type="button" onClick={() => onRemove(tag)} className="hover:text-destructive ml-1">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export const PostEventReportModal: React.FC<PostEventReportModalProps> = ({
  isOpen,
  onClose,
  notification,
  existingReport,
  onSave,
}) => {
  const isEdit = !!existingReport;

  // Tab 1 — Crowd & Energy
  const [energyLevel, setEnergyLevel] = useState(7);
  const [crowdSize, setCrowdSize] = useState<string>('');
  const [ageRange, setAgeRange] = useState('');

  // Tab 2 — Music Intelligence
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [hitSongs, setHitSongs] = useState<string[]>([]);
  const [missedSongs, setMissedSongs] = useState<string[]>([]);

  // Tab 3 — Venue & Notes
  const [soundRating, setSoundRating] = useState(0);
  const [lightingRating, setLightingRating] = useState(0);
  const [overallRating, setOverallRating] = useState(0);
  const [wouldBookAgain, setWouldBookAgain] = useState(true);
  const [venueNotes, setVenueNotes] = useState('');
  const [coordinatorNotes, setCoordinatorNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Pre-fill from existing report
  useEffect(() => {
    if (existingReport) {
      setEnergyLevel(existingReport.energy_level ?? 7);
      setCrowdSize(existingReport.estimated_crowd_size?.toString() ?? '');
      setAgeRange(existingReport.crowd_age_range ?? '');
      setSelectedGenres(existingReport.top_genres ?? []);
      setHitSongs(existingReport.hit_songs ?? []);
      setMissedSongs(existingReport.missed_songs ?? []);
      setSoundRating(existingReport.venue_sound_rating ?? 0);
      setLightingRating(existingReport.venue_lighting_rating ?? 0);
      setOverallRating(existingReport.overall_rating ?? 0);
      setWouldBookAgain(existingReport.would_book_venue_again ?? true);
      setVenueNotes(existingReport.venue_notes ?? '');
      setCoordinatorNotes(existingReport.coordinator_notes ?? '');
    } else {
      setEnergyLevel(7);
      setCrowdSize('');
      setAgeRange('');
      setSelectedGenres([]);
      setHitSongs([]);
      setMissedSongs([]);
      setSoundRating(0);
      setLightingRating(0);
      setOverallRating(0);
      setWouldBookAgain(true);
      setVenueNotes('');
      setCoordinatorNotes('');
    }
  }, [existingReport, isOpen]);

  if (!notification) return null;

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    const data: Partial<EventPostReportInput> = {
      energy_level: energyLevel,
      crowd_age_range: ageRange || null,
      estimated_crowd_size: crowdSize ? parseInt(crowdSize) : null,
      top_genres: selectedGenres,
      hit_songs: hitSongs,
      missed_songs: missedSongs,
      venue_sound_rating: soundRating || null,
      venue_lighting_rating: lightingRating || null,
      overall_rating: overallRating || null,
      would_book_venue_again: wouldBookAgain,
      venue_notes: venueNotes || null,
      coordinator_notes: coordinatorNotes || null,
    };
    const success = await onSave(notification.id, data, existingReport?.id);
    setSaving(false);
    if (success) onClose();
  };

  let eventDateStr = 'Unknown date';
  try {
    if (notification.event_date) {
      eventDateStr = format(parseLocalDate(notification.event_date), 'MMMM d, yyyy');
    }
  } catch {}

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isEdit ? 'Edit Post-Event Report' : 'File Post-Event Report'}
          </DialogTitle>
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground pt-1">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              {notification.couple_name || 'Unknown'}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {eventDateStr}
            </span>
            {notification.venue && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                {notification.venue}
              </span>
            )}
          </div>
        </DialogHeader>

        <Tabs defaultValue="crowd" className="mt-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="crowd" className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Crowd & Energy
            </TabsTrigger>
            <TabsTrigger value="music" className="flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5" />
              Music
            </TabsTrigger>
            <TabsTrigger value="venue" className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              Venue & Notes
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Crowd & Energy */}
          <TabsContent value="crowd" className="space-y-6 mt-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Energy Level: <span className="text-primary font-bold">{energyLevel}/10</span></Label>
              <div className="px-2">
                <Slider
                  value={[energyLevel]}
                  onValueChange={([v]) => setEnergyLevel(v)}
                  min={1}
                  max={10}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Low energy</span>
                  <span>High energy</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="crowd-size">Estimated Crowd Size</Label>
              <Input
                id="crowd-size"
                type="number"
                placeholder="e.g. 150"
                value={crowdSize}
                onChange={e => setCrowdSize(e.target.value)}
                min={0}
              />
            </div>

            <div className="space-y-2">
              <Label>Crowd Age Range</Label>
              <Select value={ageRange} onValueChange={setAgeRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select age range" />
                </SelectTrigger>
                <SelectContent>
                  {AGE_RANGES.map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          {/* Tab 2: Music Intelligence */}
          <TabsContent value="music" className="space-y-6 mt-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Top Genres</Label>
              <div className="flex flex-wrap gap-2">
                {GENRES.map(genre => (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => toggleGenre(genre)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      selectedGenres.includes(genre)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background border-border text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">🔥 Hit Songs <span className="text-muted-foreground font-normal">(songs that got the floor going)</span></Label>
              <TagInput
                tags={hitSongs}
                onAdd={tag => setHitSongs(prev => prev.includes(tag) ? prev : [...prev, tag])}
                onRemove={tag => setHitSongs(prev => prev.filter(t => t !== tag))}
                placeholder="Type a song and press Enter..."
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">💤 Missed Songs <span className="text-muted-foreground font-normal">(songs that fell flat)</span></Label>
              <TagInput
                tags={missedSongs}
                onAdd={tag => setMissedSongs(prev => prev.includes(tag) ? prev : [...prev, tag])}
                onRemove={tag => setMissedSongs(prev => prev.filter(t => t !== tag))}
                placeholder="Type a song and press Enter..."
              />
            </div>
          </TabsContent>

          {/* Tab 3: Venue & Notes */}
          <TabsContent value="venue" className="space-y-6 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Sound System</Label>
                <StarRating value={soundRating} onChange={setSoundRating} />
              </div>
              <div className="space-y-2">
                <Label>Lighting</Label>
                <StarRating value={lightingRating} onChange={setLightingRating} />
              </div>
              <div className="space-y-2">
                <Label>Overall Event Rating</Label>
                <StarRating value={overallRating} onChange={setOverallRating} />
              </div>
              <div className="space-y-2">
                <Label>Would Book Venue Again?</Label>
                <div className="flex items-center gap-3 pt-1">
                  <Switch checked={wouldBookAgain} onCheckedChange={setWouldBookAgain} />
                  <span className="text-sm text-muted-foreground">{wouldBookAgain ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="venue-notes">Venue Notes</Label>
              <Textarea
                id="venue-notes"
                placeholder="Load-in issues, acoustics, layout notes..."
                value={venueNotes}
                onChange={e => setVenueNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="coordinator-notes">Coordinator Notes / Event Highlight</Label>
              <Textarea
                id="coordinator-notes"
                placeholder="The story of the night — memorable moments, what worked, what to remember..."
                value={coordinatorNotes}
                onChange={e => setCoordinatorNotes(e.target.value)}
                rows={3}
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 pt-4 border-t mt-4">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Update Report' : 'File Report'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PostEventReportModal;
