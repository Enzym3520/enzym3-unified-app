import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Printer, Mail, Inbox } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { safeFormatDate } from '@/utils/dateHelpers';

interface VibeSheetReviewProps {
  eventId: string;
  eventType: string;
  clientEmail?: string | null;
}

// ── helpers ────────────────────────────────────────────────────────────────────

/** Render a single value — plain text for strings/numbers, <pre> for objects/arrays. */
const FieldValue: React.FC<{ value: unknown }> = ({ value }) => {
  if (value === null || value === undefined || value === '') {
    return <span className="text-muted-foreground italic">—</span>;
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return <span>{String(value)}</span>;
  }
  return (
    <pre className="text-xs bg-muted rounded p-2 whitespace-pre-wrap break-all overflow-x-auto max-w-full">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
};

/** A labelled row inside a section. */
const FieldRow: React.FC<{ label: string; value: unknown }> = ({ label, value }) => (
  <div className="grid grid-cols-[160px_1fr] gap-2 py-1.5 border-b last:border-0 text-sm">
    <span className="text-muted-foreground font-medium shrink-0">{label}</span>
    <FieldValue value={value} />
  </div>
);

// ── Wedding tab panels ─────────────────────────────────────────────────────────

const CeremonyPanel: React.FC<{ vs: Record<string, unknown> }> = ({ vs }) => {
  const details = vs.ceremony_details as Record<string, unknown> | null;
  const events = vs.ceremony_timeline_events as unknown[] | null;
  return (
    <div className="space-y-3">
      {details && (
        <>
          <FieldRow label="Arrival Time" value={(details.arrival_time as string) || ''} />
          <FieldRow label="Ceremony Time" value={(details.ceremony_time as string) || ''} />
          <FieldRow label="Cocktail Hour" value={details.cocktail_hour} />
        </>
      )}
      {Array.isArray(events) && events.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Timeline Events</p>
          <FieldValue value={events} />
        </div>
      )}
      {!details && (!Array.isArray(events) || events.length === 0) && (
        <p className="text-sm text-muted-foreground italic">No ceremony data</p>
      )}
    </div>
  );
};

const ReceptionPanel: React.FC<{ vs: Record<string, unknown> }> = ({ vs }) => {
  const events = vs.reception_timeline_events as unknown[] | null;
  const groupDances = vs.group_dances as Record<string, unknown> | null;
  const toasts = vs.toasts as unknown[] | null;
  const announcements = vs.announcements as unknown[] | null;
  return (
    <div className="space-y-3">
      {Array.isArray(events) && events.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Reception Timeline</p>
          <FieldValue value={events} />
        </div>
      )}
      {groupDances && Object.keys(groupDances).length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Group Dances</p>
          <FieldValue value={groupDances} />
        </div>
      )}
      {Array.isArray(toasts) && toasts.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Toasts</p>
          <FieldValue value={toasts} />
        </div>
      )}
      {Array.isArray(announcements) && announcements.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Announcements</p>
          <FieldValue value={announcements} />
        </div>
      )}
      {(!Array.isArray(events) || events.length === 0) &&
        (!groupDances || Object.keys(groupDances).length === 0) && (
          <p className="text-sm text-muted-foreground italic">No reception data</p>
        )}
    </div>
  );
};

const MusicStylePanel: React.FC<{ vs: Record<string, unknown> }> = ({ vs }) => {
  const prefs = vs.preferences as Record<string, unknown> | null;
  return (
    <div className="space-y-3">
      {prefs ? (
        <>
          <FieldRow label="Favorite Style" value={prefs.favorite_style} />
          <FieldRow label="Examples" value={prefs.favorite_examples} />
          <FieldRow label="2nd Favorite Style" value={prefs.second_favorite_style} />
          <FieldRow label="2nd Examples" value={prefs.second_favorite_examples} />
          <FieldRow label="Other Styles" value={prefs.other_styles} />
          <FieldRow label="Do Not Plays" value={prefs.dislikes} />
          {Object.entries(prefs)
            .filter(([k]) => !['favorite_style', 'favorite_examples', 'second_favorite_style', 'second_favorite_examples', 'other_styles', 'dislikes'].includes(k))
            .map(([k, v]) => (
              <FieldRow key={k} label={k.replace(/_/g, ' ')} value={v} />
            ))}
        </>
      ) : (
        <p className="text-sm text-muted-foreground italic">No music preferences submitted</p>
      )}
      {vs.playlist_links && (
        <FieldRow label="Playlist Links" value={vs.playlist_links} />
      )}
      {vs.song_requests && (
        <FieldRow label="Song Requests" value={vs.song_requests as string} />
      )}
    </div>
  );
};

const AdditionalSongsPanel: React.FC<{ vs: Record<string, unknown> }> = ({ vs }) => {
  const songs = vs.additional_songs as Array<{ song: string; artist: string; notes?: string }> | null;
  if (!Array.isArray(songs) || songs.length === 0) {
    return <p className="text-sm text-muted-foreground italic">No additional songs listed</p>;
  }
  return (
    <div className="space-y-2">
      {songs.map((s, i) => (
        <div key={i} className="flex flex-col gap-0.5 border-b pb-2 last:border-0 text-sm">
          <span className="font-medium">{s.song || '—'}</span>
          {s.artist && <span className="text-muted-foreground">{s.artist}</span>}
          {s.notes && <span className="text-xs text-muted-foreground">{s.notes}</span>}
        </div>
      ))}
    </div>
  );
};

const GrandIntroPanel: React.FC<{ vs: Record<string, unknown> }> = ({ vs }) => {
  const intro = vs.grand_intro as Record<string, unknown> | null;
  if (!intro || Object.keys(intro).length === 0) {
    return <p className="text-sm text-muted-foreground italic">No grand introduction data</p>;
  }
  return (
    <div className="space-y-1">
      {Object.entries(intro).map(([k, v]) => (
        <FieldRow key={k} label={k.replace(/_/g, ' ')} value={v} />
      ))}
    </div>
  );
};

// ── Non-wedding tab panels ─────────────────────────────────────────────────────

const SongsPanel: React.FC<{ vs: Record<string, unknown> }> = ({ vs }) => {
  const songs = vs.additional_songs as Array<{ song: string; artist: string; notes?: string }> | null;
  const agendaItems = vs.agenda_items as unknown[] | null;
  const quinceC = vs.quince_ceremony_events as unknown[] | null;
  const quinceR = vs.quince_reception_events as unknown[] | null;

  const hasSongs = Array.isArray(songs) && songs.length > 0;
  const hasAgenda = Array.isArray(agendaItems) && agendaItems.length > 0;
  const hasQuince = (Array.isArray(quinceC) && quinceC.length > 0) || (Array.isArray(quinceR) && quinceR.length > 0);

  if (!hasSongs && !hasAgenda && !hasQuince) {
    return <p className="text-sm text-muted-foreground italic">No songs submitted</p>;
  }

  return (
    <div className="space-y-3">
      {hasSongs && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Song Requests</p>
          {songs!.map((s, i) => (
            <div key={i} className="flex flex-col gap-0.5 border-b pb-2 last:border-0 text-sm">
              <span className="font-medium">{s.song || '—'}</span>
              {s.artist && <span className="text-muted-foreground">{s.artist}</span>}
              {s.notes && <span className="text-xs text-muted-foreground">{s.notes}</span>}
            </div>
          ))}
        </div>
      )}
      {hasQuince && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Ceremony</p>
          <FieldValue value={quinceC} />
          <p className="text-xs font-semibold text-muted-foreground mb-1 mt-2 uppercase tracking-wide">Reception</p>
          <FieldValue value={quinceR} />
        </div>
      )}
      {hasAgenda && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Agenda</p>
          <FieldValue value={agendaItems} />
        </div>
      )}
    </div>
  );
};

const NotesPanel: React.FC<{ vs: Record<string, unknown> }> = ({ vs }) => (
  <div className="space-y-2">
    <FieldRow label="Song Requests" value={vs.song_requests as string | null} />
    <FieldRow label="DJ Email" value={vs.dj_email as string | null} />
    <FieldRow label="Venue Email" value={vs.venue_email as string | null} />
    {vs.announcements && (
      <FieldRow label="Announcements" value={vs.announcements} />
    )}
  </div>
);

// ── Main component ─────────────────────────────────────────────────────────────

export const VibeSheetReview: React.FC<VibeSheetReviewProps> = ({ eventId, eventType, clientEmail }) => {
  const { data: vibeSheet, isLoading } = useQuery({
    queryKey: ['vibe-sheet-staff', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vibe_sheets')
        .select('*')
        .eq('wedding_id', eventId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });

  const handleSendReminder = async () => {
    if (clientEmail) {
      // Use send-event-reminders edge function
      supabase.functions
        .invoke('send-event-reminders', {
          body: { wedding_id: eventId, reminder_type: 'vibe_sheet_nudge' },
        })
        .catch(() => {
          // non-critical — fire and forget
        });
      toast.success('Reminder sent to client');
    } else {
      toast.error('No client email on file');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  // Not submitted yet
  if (!vibeSheet) {
    return (
      <Card>
        <CardContent className="py-12 flex flex-col items-center gap-4 text-center">
          <Inbox className="w-12 h-12 text-muted-foreground" />
          <div>
            <p className="font-semibold text-lg">Vibe sheet not submitted yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              The client hasn&apos;t filled out their vibe sheet.
            </p>
          </div>
          {clientEmail ? (
            <Button onClick={handleSendReminder} variant="outline" className="gap-2">
              <Mail className="w-4 h-4" />
              Send Reminder
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground">No client email on file to send a reminder.</p>
          )}
        </CardContent>
      </Card>
    );
  }

  const vs = vibeSheet as unknown as Record<string, unknown>;
  const submittedAt = vs.submitted_at as string | null;
  const isWedding = (eventType || '').toLowerCase() === 'wedding';

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-semibold text-base">Vibe Sheet</h3>
          {submittedAt ? (
            <p className="text-xs text-muted-foreground">
              Submitted on {safeFormatDate(submittedAt, 'PPPp', 'Unknown date')}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground italic">Saved but not yet submitted</p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2 print:hidden">
          <Printer className="w-4 h-4" />
          Print
        </Button>
      </div>

      {/* Tabbed content */}
      {isWedding ? (
        <Tabs defaultValue="ceremony" className="space-y-3">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="ceremony">Ceremony</TabsTrigger>
            <TabsTrigger value="reception">Reception</TabsTrigger>
            <TabsTrigger value="music-style">Music Style</TabsTrigger>
            <TabsTrigger value="additional-songs">Additional Songs</TabsTrigger>
            <TabsTrigger value="grand-intro">Grand Introduction</TabsTrigger>
          </TabsList>

          <Card>
            <CardContent className="py-4">
              <TabsContent value="ceremony" className="mt-0">
                <CeremonyPanel vs={vs} />
              </TabsContent>
              <TabsContent value="reception" className="mt-0">
                <ReceptionPanel vs={vs} />
              </TabsContent>
              <TabsContent value="music-style" className="mt-0">
                <MusicStylePanel vs={vs} />
              </TabsContent>
              <TabsContent value="additional-songs" className="mt-0">
                <AdditionalSongsPanel vs={vs} />
              </TabsContent>
              <TabsContent value="grand-intro" className="mt-0">
                <GrandIntroPanel vs={vs} />
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>
      ) : (
        <Tabs defaultValue="music-style" className="space-y-3">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="music-style">Music Style</TabsTrigger>
            <TabsTrigger value="songs">Songs</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <Card>
            <CardContent className="py-4">
              <TabsContent value="music-style" className="mt-0">
                <MusicStylePanel vs={vs} />
              </TabsContent>
              <TabsContent value="songs" className="mt-0">
                <SongsPanel vs={vs} />
              </TabsContent>
              <TabsContent value="notes" className="mt-0">
                <NotesPanel vs={vs} />
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>
      )}
    </div>
  );
};
