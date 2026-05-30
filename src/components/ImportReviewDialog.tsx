import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { X, RotateCcw, AlertCircle } from 'lucide-react';

interface Track {
  id: string;
  name: string;
  artist: string;
  album: string;
  albumArt: string;
  duration_ms?: number;
}

interface ParsedSong {
  song: string;
  artist?: string;
  rawLine: string;
}

interface SearchResult {
  original: ParsedSong;
  match: Track | null;
  confidence?: 'high' | 'medium' | 'low' | 'none';
  isDuplicate: boolean;
  eventType: string;
}

interface ImportReviewDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (songs: Array<{ song: string; artist: string; eventType?: string }>) => void;
  searchResults: SearchResult[];
  importMode: 'add' | 'replace' | 'fill';
  existingEvents: Array<{ song?: string; artist?: string }>;
  targetTimeline?: 'ceremony' | 'reception';
}

const CEREMONY_EVENTS = [
  'Parents/Grandparents Processional',
  "Groom's Entrance",
  'Bridal Party Processional',
  "Bride's Entrance",
  'Recessional',
  'Unity Ceremony'
];

const RECEPTION_EVENTS = [
  'Intro of Party',
  'Intro of Bride & Groom',
  'First Dance',
  'Dinner',
  'Cake Cutting',
  'Father/Daughter Dance',
  'Mother/Son Dance',
  'Bouquet Toss',
  'Garter Toss',
  'Dollar Dance',
  'Anniversary Dance',
  'Open Dancing',
  'Slideshow',
  'Last Dance'
];

export const ImportReviewDialog: React.FC<ImportReviewDialogProps> = ({
  open,
  onClose,
  onImport,
  searchResults,
  importMode,
  existingEvents,
  targetTimeline
}) => {
  const [editedResults, setEditedResults] = useState<SearchResult[]>([]);
  const [removedIndices, setRemovedIndices] = useState<Set<number>>(new Set());
  const [customEventTypes, setCustomEventTypes] = useState<Record<number, string>>({});
  
  const eventOptions = targetTimeline === 'ceremony' ? CEREMONY_EVENTS : RECEPTION_EVENTS;

  // Format duration from milliseconds to mm:ss
  const formatDuration = (ms?: number): string => {
    if (!ms) return '-';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Check if track name indicates a remix
  const isRemix = (trackName?: string): boolean => {
    if (!trackName) return false;
    const remixKeywords = ['remix', 'edit', 'mix', 'version', 'remaster', 'extended', 'radio edit', 'club mix'];
    const lowerName = trackName.toLowerCase();
    return remixKeywords.some(keyword => lowerName.includes(keyword));
  };

  // Initialize edited results when dialog opens
  useEffect(() => {
    if (open && searchResults.length > 0) {
      setEditedResults([...searchResults]);
      setRemovedIndices(new Set());
    }
  }, [open, searchResults]);

  const handleRemove = (index: number) => {
    setRemovedIndices(prev => new Set([...prev, index]));
  };

  const handleRestore = (index: number) => {
    setRemovedIndices(prev => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
  };

  const handleEditSong = (index: number, newSong: string) => {
    const updated = [...editedResults];
    if (updated[index].match) {
      updated[index].match!.name = newSong;
    }
    setEditedResults(updated);
  };

  const handleEditArtist = (index: number, newArtist: string) => {
    const updated = [...editedResults];
    if (updated[index].match) {
      updated[index].match!.artist = newArtist;
    }
    setEditedResults(updated);
  };

  const handleEditEventType = (index: number, newEventType: string) => {
    const updated = [...editedResults];
    updated[index].eventType = newEventType;
    setEditedResults(updated);
  };

  const handleCustomEventType = (index: number, customValue: string) => {
    setCustomEventTypes(prev => ({ ...prev, [index]: customValue }));
    handleEditEventType(index, customValue);
  };

  const getRemixBadge = (trackName?: string) => {
    if (!isRemix(trackName)) return null;
    return <Badge variant="secondary" className="text-xs">Remix</Badge>;
  };

  const handleImportSelected = () => {
    const selectedSongs = editedResults
      .filter((result, idx) => !removedIndices.has(idx) && result.match)
      .map(result => ({
        song: result.match!.name,
        artist: result.match!.artist,
        eventType: result.eventType
      }));
    
    onImport(selectedSongs);
  };

  const matchedCount = editedResults.filter(r => r.match && !removedIndices.has(editedResults.indexOf(r))).length;
  const duplicateCount = editedResults.filter(r => r.isDuplicate && !removedIndices.has(editedResults.indexOf(r))).length;
  const newCount = matchedCount - duplicateCount;
  const autoAssignedCount = editedResults.filter(r => r.eventType && !removedIndices.has(editedResults.indexOf(r))).length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review & Edit Imported Songs</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <div className="flex items-center gap-4 mb-4 text-sm">
            <span className="text-muted-foreground">
              Found {matchedCount} of {editedResults.length} songs
            </span>
            {newCount > 0 && (
              <Badge variant="default">{newCount} New</Badge>
            )}
            {duplicateCount > 0 && (
              <Badge variant="secondary" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                {duplicateCount} Duplicate{duplicateCount > 1 ? 's' : ''}
              </Badge>
            )}
            {autoAssignedCount > 0 && (
              <Badge variant="outline">{autoAssignedCount} Auto-assigned</Badge>
            )}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Status</TableHead>
                <TableHead className="w-[180px]">Original Input</TableHead>
                <TableHead className="w-[50px]">Album</TableHead>
                <TableHead className="w-[200px]">Song</TableHead>
                <TableHead className="w-[180px]">Artist</TableHead>
                <TableHead className="w-[150px]">Event Type</TableHead>
                <TableHead className="w-[70px]">Duration</TableHead>
                <TableHead className="w-[70px]">Remix</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {editedResults.map((result, index) => {
                const isRemoved = removedIndices.has(index);
                
                return (
                  <TableRow 
                    key={index} 
                    className={isRemoved ? 'opacity-50 bg-muted/50' : ''}
                  >
                    <TableCell>
                      {result.isDuplicate ? (
                        <Badge variant="secondary" className="gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Duplicate
                        </Badge>
                      ) : (
                        <Badge variant="default">New</Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {result.original.rawLine}
                    </TableCell>
                    <TableCell>
                      {result.match?.albumArt && (
                        <img 
                          src={result.match.albumArt} 
                          alt="Album art" 
                          className="w-10 h-10 rounded object-cover"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {result.match ? (
                        <Input
                          value={result.match.name}
                          onChange={(e) => handleEditSong(index, e.target.value)}
                          disabled={isRemoved}
                          className="h-8"
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">No match found</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {result.match ? (
                        <Input
                          value={result.match.artist}
                          onChange={(e) => handleEditArtist(index, e.target.value)}
                          disabled={isRemoved}
                          className="h-8"
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Select
                          value={result.eventType === 'Custom' || (result.eventType && !eventOptions.includes(result.eventType)) ? 'Custom' : result.eventType}
                          onValueChange={(value) => {
                            if (value === 'Custom') {
                              handleEditEventType(index, 'Custom');
                            } else {
                              handleEditEventType(index, value);
                              setCustomEventTypes(prev => {
                                const next = { ...prev };
                                delete next[index];
                                return next;
                              });
                            }
                          }}
                          disabled={isRemoved}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Select event" />
                          </SelectTrigger>
                          <SelectContent>
                            {eventOptions.map(event => (
                              <SelectItem key={event} value={event} className="text-xs">
                                {event}
                              </SelectItem>
                            ))}
                            <SelectItem value="Custom" className="text-xs font-medium">
                              Custom...
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        
                        {(result.eventType === 'Custom' || (result.eventType && !eventOptions.includes(result.eventType))) && (
                          <Input
                            value={customEventTypes[index] || result.eventType}
                            onChange={(e) => handleCustomEventType(index, e.target.value)}
                            disabled={isRemoved}
                            placeholder="Enter custom event"
                            className="h-8 text-xs"
                          />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">
                      {formatDuration(result.match?.duration_ms)}
                    </TableCell>
                    <TableCell className="text-center">
                      {getRemixBadge(result.match?.name)}
                    </TableCell>
                    <TableCell>
                      {isRemoved ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRestore(index)}
                          className="h-8 w-8 p-0"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemove(index)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Back
          </Button>
          <Button 
            onClick={handleImportSelected}
            disabled={matchedCount === 0}
          >
            Import {matchedCount} Selected Song{matchedCount !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
