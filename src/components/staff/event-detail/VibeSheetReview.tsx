import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Printer, Mail, Inbox, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { safeFormatDate } from '@/utils/dateHelpers';

interface VibeSheetReviewProps {
  eventId: string;
  eventType: string;
  clientEmail?: string | null;
}

// ── Primitive field row ───────────────────────────────────────────────────────

const FieldRow: React.FC<{ label: string; value: unknown }> = ({ label, value }) => {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="grid grid-cols-[160px_1fr] gap-2 py-1.5 border-b last:border-0 text-sm">
      <span className="text-muted-foreground font-medium shrink-0">{label}</span>
      <span>{String(value)}</span>
    </div>
  );
};

// ── Timeline event list ───────────────────────────────────────────────────────

const TimelineList: React.FC<{ events: any[] }> = ({ events }) => {
  if (!Array.isArray(events) || events.length === 0) return null;
  return (
    <ol className="space-y-2">
      {events.map((e: any, i: number) => {
        const name = e?.event_name || e?.label || e?.name || `Item ${i + 1}`;
        const song = [e?.song || e?.song_name, e?.artist || e?.artist_name].filter(Boolean).join(' — ');
        const time = e?.time || e?.start_time;
        const notes = e?.notes || e?.note;
        return (
          <li key={e?.id || i} className="p-3 rounded-md border bg-muted/30">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-sm font-medium">{name}</p>
                {song && <p className="text-sm text-muted-foreground mt-0.5">🎵 {song}</p>}
                {notes && <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{notes}</p>}
              </div>
              {time && <Badge variant="outline" className="text-xs flex-shrink-0">{time}</Badge>}
            </div>
          </li>
        );
      })}
    </ol>
  );
};

// ── Section label ─────────────────────────────────────────────────────────────

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">{children}</p>
);

// ── Ceremony panel ────────────────────────────────────────────────────────────

const CeremonyPanel: React.FC<{ vs: Record<string, unknown> }> = ({ vs }) => {
  const details = vs.ceremony_details as Record<string, unknown> | null;
  const events = vs.ceremony_timeline_events as any[] | null;
  const cocktailHour = details?.cocktail_hour as Record<string, unknown> | null;

  return (
    <div className="space-y-4">
      {details && (
        <div className="space-y-0">
          <FieldRow label="Invite Time" value={details.arrival_time as string} />
          <FieldRow label="Ceremony Time" value={details.ceremony_time as string} />
          {cocktailHour?.music_info ? (
            <FieldRow label="Cocktail Hour Music" value={cocktailHour.music_info as string} />
          ) : null}
        </div>
      )}
      {Array.isArray(events) && events.length > 0 && (
        <div>
          <SectionLabel>Ceremony Timeline</SectionLabel>
          <TimelineList events={events} />
        </div>
      )}
      {!details && (!Array.isArray(events) || events.length === 0) && (
        <p className="text-sm text-muted-foreground italic">No ceremony data</p>
      )}
    </div>
  );
};

// ── Reception panel ───────────────────────────────────────────────────────────

const ReceptionPanel: React.FC<{ vs: Record<string, unknown> }> = ({ vs }) => {
  const events = vs.reception_timeline_events as any[] | null;
  const groupDancesRaw = vs.group_dances;
  const toasts = vs.toasts as any[] | null;
  const announcements = vs.announcements as any[] | null;

  // Normalize group dances
  const groupDanceList: { name: string; on: boolean }[] = [];
  if (Array.isArray(groupDancesRaw)) {
    (groupDancesRaw as any[]).forEach((d: any) => {
      const name = typeof d === 'string' ? d : d?.dance_name || d?.name;
      if (name) groupDanceList.push({ name, on: d?.approved ?? true });
    });
  } else if (groupDancesRaw && typeof groupDancesRaw === 'object') {
    Object.entries(groupDancesRaw as Record<string, unknown>).forEach(([k, v]) => {
      if (k === 'other' && typeof v === 'string' && v.trim()) {
        v.split(/\n|,/).map(s => s.trim()).filter(Boolean).forEach(name => groupDanceList.push({ name, on: true }));
      } else if (v === true) {
        groupDanceList.push({ name: k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), on: true });
      }
    });
  }

  const hasContent = (Array.isArray(events) && events.length > 0) ||
    groupDanceList.length > 0 ||
    (Array.isArray(toasts) && toasts.length > 0) ||
    (Array.isArray(announcements) && announcements.length > 0);

  if (!hasContent) return <p className="text-sm text-muted-foreground italic">No reception data</p>;

  return (
    <div className="space-y-4">
      {Array.isArray(events) && events.length > 0 && (
        <div>
          <SectionLabel>Reception Timeline</SectionLabel>
          <TimelineList events={events} />
        </div>
      )}
      {groupDanceList.length > 0 && (
        <div>
          <SectionLabel>Group / Line Dances</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {groupDanceList.map((d, i) => (
              <Badge key={i} variant={d.on ? 'default' : 'secondary'}>{d.name}</Badge>
            ))}
          </div>
        </div>
      )}
      {Array.isArray(toasts) && toasts.length > 0 && (
        <div>
          <SectionLabel>Toasts</SectionLabel>
          <div className="space-y-2">
            {toasts.map((t: any, i: number) => (
              <div key={t?.id || i} className="p-3 rounded border bg-muted/30 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{t?.name || `Toast #${i + 1}`}</p>
                  {t?.time && <Badge variant="outline" className="text-xs">{t.time}</Badge>}
                </div>
                {(t?.song || t?.artist) && (
                  <p className="text-xs text-muted-foreground">🎵 {[t.song, t.artist].filter(Boolean).join(' — ')}</p>
                )}
                {t?.notes && <p className="text-xs text-muted-foreground whitespace-pre-wrap">{t.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
      {Array.isArray(announcements) && announcements.length > 0 && (
        <div>
          <SectionLabel>Announcements</SectionLabel>
          <ul className="space-y-2">
            {announcements.map((a: any, i: number) => (
              <li key={i} className="p-3 rounded border bg-muted/30">
                <p className="text-sm font-medium">{a?.title || a?.label || `Announcement ${i + 1}`}</p>
                {a?.text && <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{a.text}</p>}
                {a?.time && <Badge variant="outline" className="text-xs mt-1">{a.time}</Badge>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// ── Music style panel ─────────────────────────────────────────────────────────

const SongExamples: React.FC<{ examples: unknown }> = ({ examples }) => {
  if (!Array.isArray(examples) || examples.length === 0) return null;
  const filled = examples.filter((e: any) => e?.song || e?.artist || e?.song_name || e?.artist_name);
  if (filled.length === 0) return null;
  return (
    <ul className="mt-1 text-xs text-muted-foreground list-disc pl-5">
      {filled.map((e: any, i: number) => {
        const s = [e?.song || e?.song_name, e?.artist || e?.artist_name].filter(Boolean).join(' — ');
        return <li key={i}>{s}</li>;
      })}
    </ul>
  );
};

const MusicStylePanel: React.FC<{ vs: Record<string, unknown> }> = ({ vs }) => {
  const prefs = vs.preferences as Record<string, unknown> | null;
  const playlistLinks = vs.playlist_links as any[] | null;
  const songRequests = vs.song_requests as string | null;

  return (
    <div className="space-y-3 text-sm">
      {prefs ? (
        <>
          {prefs.favorite_style && (
            <div>
              <p className="text-xs text-muted-foreground">Primary Style</p>
              <p className="font-medium">{String(prefs.favorite_style)}</p>
              <SongExamples examples={prefs.favorite_examples} />
            </div>
          )}
          {prefs.second_favorite_style && (
            <div>
              <p className="text-xs text-muted-foreground">Secondary Style</p>
              <p className="font-medium">{String(prefs.second_favorite_style)}</p>
              <SongExamples examples={prefs.second_favorite_examples} />
            </div>
          )}
          {prefs.other_styles && (
            <div>
              <p className="text-xs text-muted-foreground">Other Styles</p>
              <p>{Array.isArray(prefs.other_styles) ? (prefs.other_styles as string[]).join(', ') : String(prefs.other_styles)}</p>
            </div>
          )}
          {prefs.dislikes && (
            <div>
              <p className="text-xs text-muted-foreground">Do Not Plays</p>
              <p>{Array.isArray(prefs.dislikes) ? (prefs.dislikes as string[]).join(', ') : String(prefs.dislikes)}</p>
            </div>
          )}
        </>
      ) : (
        <p className="text-muted-foreground italic">No music preferences submitted</p>
      )}
      {Array.isArray(playlistLinks) && playlistLinks.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">Playlists</p>
          <div className="space-y-1">
            {playlistLinks.map((p: any, i: number) => (
              <a key={i} href={p?.url || '#'} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary hover:underline text-xs">
                <ExternalLink className="w-3 h-3" />
                {p?.label || p?.url || 'Playlist'}
              </a>
            ))}
          </div>
        </div>
      )}
      {songRequests && (
        <div>
          <p className="text-xs text-muted-foreground">Song Requests / Notes</p>
          <p className="whitespace-pre-wrap">{songRequests}</p>
        </div>
      )}
    </div>
  );
};

// ── Additional songs panel ────────────────────────────────────────────────────

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

// ── Grand intro panel ─────────────────────────────────────────────────────────

const GrandIntroPanel: React.FC<{ vs: Record<string, unknown> }> = ({ vs }) => {
  const intro = vs.grand_intro as Record<string, unknown> | null;
  if (!intro || Object.keys(intro).length === 0) {
    return <p className="text-sm text-muted-foreground italic">No grand introduction data</p>;
  }
  const entries: any[] = Array.isArray(intro) ? intro : Array.isArray(intro?.entries) ? intro.entries as any[] : [];
  return (
    <div className="space-y-3 text-sm">
      {intro.intro_style && <FieldRow label="Intro Style" value={intro.intro_style} />}
      {(intro.intro_song || intro.intro_artist) && (
        <FieldRow label="Intro Song" value={[intro.intro_song, intro.intro_artist].filter(Boolean).join(' — ')} />
      )}
      {entries.length > 0 && (
        <div>
          <SectionLabel>Lineup</SectionLabel>
          <ol className="space-y-2">
            {entries.map((p: any, i: number) => (
              <li key={i} className="flex items-center gap-3 p-2 rounded bg-muted/40">
                <span className="text-xs text-muted-foreground w-6">{i + 1}.</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{p?.name || '—'}</p>
                  {p?.role && <p className="text-xs text-muted-foreground">{p.role}</p>}
                </div>
                {p?.pairing && <p className="text-xs text-muted-foreground">with {p.pairing}</p>}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};

// ── Non-wedding songs panel ───────────────────────────────────────────────────

const SongsPanel: React.FC<{ vs: Record<string, unknown> }> = ({ vs }) => {
  const songs = vs.additional_songs as Array<{ song: string; artist: string; notes?: string }> | null;
  const agendaItems = vs.agenda_items as any[] | null;
  const quinceC = vs.quince_ceremony_events as any[] | null;
  const quinceR = vs.quince_reception_events as any[] | null;

  const hasSongs = Array.isArray(songs) && songs.length > 0;
  const hasAgenda = Array.isArray(agendaItems) && agendaItems.length > 0;
  const hasQuince = (Array.isArray(quinceC) && quinceC.length > 0) || (Array.isArray(quinceR) && quinceR.length > 0);

  if (!hasSongs && !hasAgenda && !hasQuince) {
    return <p className="text-sm text-muted-foreground italic">No songs submitted</p>;
  }

  return (
    <div className="space-y-4">
      {hasSongs && (
        <div>
          <SectionLabel>Song Requests</SectionLabel>
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
          {Array.isArray(quinceC) && quinceC.length > 0 && (
            <>
              <SectionLabel>Ceremony</SectionLabel>
              <TimelineList events={quinceC} />
            </>
          )}
          {Array.isArray(quinceR) && quinceR.length > 0 && (
            <>
              <SectionLabel>Reception</SectionLabel>
              <TimelineList events={quinceR} />
            </>
          )}
        </div>
      )}
      {hasAgenda && (
        <div>
          <SectionLabel>Agenda</SectionLabel>
          <TimelineList events={agendaItems!} />
        </div>
      )}
    </div>
  );
};

// ── Notes panel ───────────────────────────────────────────────────────────────

const NotesPanel: React.FC<{ vs: Record<string, unknown> }> = ({ vs }) => {
  const announcements = vs.announcements as any[] | null;
  return (
    <div className="space-y-3 text-sm">
      <FieldRow label="Song Requests" value={vs.song_requests as string | null} />
      <FieldRow label="DJ Email" value={vs.dj_email as string | null} />
      <FieldRow label="Venue Email" value={vs.venue_email as string | null} />
      {Array.isArray(announcements) && announcements.length > 0 && (
        <div>
          <SectionLabel>Announcements</SectionLabel>
          <ul className="space-y-2">
            {announcements.map((a: any, i: number) => (
              <li key={i} className="p-3 rounded border bg-muted/30">
                <p className="text-sm font-medium">{a?.title || a?.label || `Announcement ${i + 1}`}</p>
                {a?.text && <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{a.text}</p>}
                {a?.time && <Badge variant="outline" className="text-xs mt-1">{a.time}</Badge>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// ── Print-all view (hidden on screen, expands every section for PDF) ──────────

const PrintSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="mb-6 break-inside-avoid">
    <h3 className="font-semibold text-sm uppercase tracking-wide border-b pb-1 mb-3">{title}</h3>
    {children}
  </section>
);

const PrintAllView: React.FC<{
  vs: Record<string, unknown>;
  isWedding: boolean;
  submittedAt: string | null;
}> = ({ vs, isWedding, submittedAt }) => (
  <div className="hidden print:block text-sm">
    <div className="mb-6 pb-2 border-b">
      <h2 className="text-lg font-bold">Vibe Sheet</h2>
      {submittedAt && (
        <p className="text-xs text-muted-foreground">Submitted: {safeFormatDate(submittedAt, 'PPPp', '')}</p>
      )}
    </div>
    {isWedding ? (
      <>
        <PrintSection title="Ceremony"><CeremonyPanel vs={vs} /></PrintSection>
        <PrintSection title="Reception"><ReceptionPanel vs={vs} /></PrintSection>
        <PrintSection title="Music Style"><MusicStylePanel vs={vs} /></PrintSection>
        <PrintSection title="Additional Songs"><AdditionalSongsPanel vs={vs} /></PrintSection>
        <PrintSection title="Grand Introduction"><GrandIntroPanel vs={vs} /></PrintSection>
      </>
    ) : (
      <>
        <PrintSection title="Songs"><SongsPanel vs={vs} /></PrintSection>
        <PrintSection title="Music Style"><MusicStylePanel vs={vs} /></PrintSection>
        <PrintSection title="Notes"><NotesPanel vs={vs} /></PrintSection>
      </>
    )}
  </div>
);

// ── Main component ─────────────────────────────────────────────────────────────

export const VibeSheetReview: React.FC<VibeSheetReviewProps> = ({ eventId, eventType, clientEmail }) => {
  const { data: vibeSheet, isLoading } = useQuery({
    queryKey: ['vibe-sheet-staff', eventId],
    queryFn: async () => {
      // Step 1: direct match (eventId is already vibe_sheets.wedding_id)
      const { data: direct, error } = await supabase
        .from('vibe_sheets')
        .select('*')
        .eq('wedding_id', eventId)
        .maybeSingle();
      if (error) throw error;
      if (direct) return direct;

      // Step 2: eventId might be event_notification_history.id — resolve to weddings.id
      const { data: enh } = await supabase
        .from('event_notification_history')
        .select('wedding_id')
        .eq('id', eventId)
        .maybeSingle();
      if (enh?.wedding_id) {
        const { data: viaEnh } = await supabase
          .from('vibe_sheets')
          .select('*')
          .eq('wedding_id', enh.wedding_id)
          .maybeSingle();
        if (viaEnh) return viaEnh;
      }

      return null;
    },
    enabled: !!eventId,
  });

  const handleSendReminder = async () => {
    if (clientEmail) {
      supabase.functions
        .invoke('send-event-reminders', {
          body: { wedding_id: eventId, reminder_type: 'vibe_sheet_nudge' },
        })
        .catch(() => {});
      toast.success('Reminder sent to client');
    } else {
      toast.error('No client email on file');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (!vibeSheet) {
    return (
      <Card>
        <CardContent className="py-12 flex flex-col items-center gap-4 text-center">
          <Inbox className="w-12 h-12 text-muted-foreground" />
          <div>
            <p className="font-semibold text-lg">Vibe sheet not submitted yet</p>
            <p className="text-sm text-muted-foreground mt-1">The client hasn't filled out their vibe sheet.</p>
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
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-semibold text-base">Vibe Sheet</h3>
          {submittedAt ? (
            <p className="text-xs text-muted-foreground">Submitted on {safeFormatDate(submittedAt, 'PPPp', 'Unknown date')}</p>
          ) : (
            <p className="text-xs text-muted-foreground italic">Saved but not yet submitted</p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2 print:hidden">
          <Printer className="w-4 h-4" />
          Export PDF
        </Button>
      </div>

      {/* Screen: tabbed view */}
      <div className="print:hidden">
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
              <TabsContent value="ceremony" className="mt-0"><CeremonyPanel vs={vs} /></TabsContent>
              <TabsContent value="reception" className="mt-0"><ReceptionPanel vs={vs} /></TabsContent>
              <TabsContent value="music-style" className="mt-0"><MusicStylePanel vs={vs} /></TabsContent>
              <TabsContent value="additional-songs" className="mt-0"><AdditionalSongsPanel vs={vs} /></TabsContent>
              <TabsContent value="grand-intro" className="mt-0"><GrandIntroPanel vs={vs} /></TabsContent>
            </CardContent>
          </Card>
        </Tabs>
      ) : (
        <Tabs defaultValue="songs" className="space-y-3">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="songs">Songs</TabsTrigger>
            <TabsTrigger value="music-style">Music Style</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>
          <Card>
            <CardContent className="py-4">
              <TabsContent value="songs" className="mt-0"><SongsPanel vs={vs} /></TabsContent>
              <TabsContent value="music-style" className="mt-0"><MusicStylePanel vs={vs} /></TabsContent>
              <TabsContent value="notes" className="mt-0"><NotesPanel vs={vs} /></TabsContent>
            </CardContent>
          </Card>
        </Tabs>
      )}
      </div>

      {/* Print: all sections expanded */}
      <PrintAllView vs={vs} isWedding={isWedding} submittedAt={submittedAt} />
    </div>
  );
};
