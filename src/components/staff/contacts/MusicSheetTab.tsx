import { Music, Disc, ListMusic, Users, ExternalLink, Mic2, CalendarClock, Megaphone, FileText, Sparkles, Wine } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MusicSheetWithDetails } from '@/types/musicSheet';
import { format } from 'date-fns';

interface MusicSheetTabProps {
  musicSheet: (MusicSheetWithDetails & { _raw?: any }) | null;
  loading: boolean;
}

const songLabel = (e: any): string => {
  if (!e) return '';
  const song = (e.song || e.song_name || '').toString().trim();
  const artist = (e.artist || e.artist_name || '').toString().trim();
  return [song, artist].filter(Boolean).join(' — ');
};

const TimelineList = ({ events, emptyText }: { events: any[]; emptyText: string }) => {
  if (!Array.isArray(events) || events.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  }
  return (
    <ol className="space-y-2">
      {events.map((e, i) => {
        const name = e?.event_name || e?.label || e?.name || `Item ${i + 1}`;
        const song = songLabel(e);
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

export const MusicSheetTab = ({ musicSheet, loading }: MusicSheetTabProps) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!musicSheet) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Music className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Vibe Sheet Submitted</h3>
          <p className="text-muted-foreground text-center">
            This couple hasn't submitted their vibe sheet yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  const raw = (musicSheet as any)._raw || {};
  const ceremony = raw.ceremony_details || raw.ceremony || {};
  const ceremonyEvents: any[] = raw.ceremony_timeline_events || raw.quince_ceremony_events || [];
  const receptionEvents: any[] = raw.reception_timeline_events || raw.quince_reception_events || raw.reception_timeline || [];
  const preferences = raw.preferences || {};
  const groupDancesRaw = raw.group_dances || {};
  const additionalSongs: any[] = Array.isArray(raw.additional_songs) ? raw.additional_songs : [];
  const grandIntro = raw.grand_intro || {};
  const songRequests = raw.song_requests || musicSheet.notes;
  const playlistLinks: any[] = Array.isArray(raw.playlist_links) ? raw.playlist_links : [];
  const toasts: any[] = Array.isArray(raw.toasts) ? raw.toasts : [];
  const agendaItems: any[] = Array.isArray(raw.agenda_items) ? raw.agenda_items : [];
  const announcements: any[] = Array.isArray(raw.announcements) ? raw.announcements : [];
  const submittedAt = raw.submitted_at;

  // Normalize group dances to a list of { name, on }
  const groupDanceList: { name: string; on: boolean }[] = [];
  if (Array.isArray(groupDancesRaw)) {
    groupDancesRaw.forEach((d: any) => {
      const name = typeof d === 'string' ? d : d?.dance_name || d?.name;
      if (name) groupDanceList.push({ name, on: d?.approved ?? true });
    });
  } else if (groupDancesRaw && typeof groupDancesRaw === 'object') {
    Object.entries(groupDancesRaw).forEach(([k, v]: [string, any]) => {
      if (k === 'other' && typeof v === 'string' && v.trim()) {
        v.split(/\n|,/).map(s => s.trim()).filter(Boolean).forEach(name => groupDanceList.push({ name, on: true }));
      } else if (v === true) {
        groupDanceList.push({ name: k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), on: true });
      }
    });
  }

  const grandIntroEntries: any[] = Array.isArray(grandIntro)
    ? grandIntro
    : Array.isArray(grandIntro?.entries)
    ? grandIntro.entries
    : [];

  // Determine which tabs have data so we don't show empty noise
  const tabs = [
    { id: 'ceremony', label: 'Ceremony', icon: Music, has: ceremonyEvents.length > 0 || ceremony.ceremony_time || ceremony.arrival_time || ceremony.cocktail_hour?.music_info },
    { id: 'reception', label: 'Reception', icon: Disc, has: receptionEvents.length > 0 },
    { id: 'preferences', label: 'Preferences', icon: ListMusic, has: !!preferences.favorite_style || !!preferences.second_favorite_style || (musicSheet.must_plays?.length || 0) > 0 || (musicSheet.do_not_plays?.length || 0) > 0 || (preferences.other_styles && (Array.isArray(preferences.other_styles) ? preferences.other_styles.length : preferences.other_styles)) },
    { id: 'intro', label: 'Grand Intro', icon: Sparkles, has: grandIntroEntries.length > 0 || grandIntro.intro_song || grandIntro.intro_style },
    { id: 'dances', label: 'Group Dances', icon: Users, has: groupDanceList.length > 0 },
    { id: 'songs', label: 'Song Requests', icon: Mic2, has: additionalSongs.length > 0 || !!songRequests },
    { id: 'playlists', label: 'Playlists', icon: ExternalLink, has: playlistLinks.length > 0 },
    { id: 'toasts', label: 'Toasts', icon: Wine, has: toasts.length > 0 },
    { id: 'agenda', label: 'Agenda', icon: CalendarClock, has: agendaItems.length > 0 },
    { id: 'announcements', label: 'Announcements', icon: Megaphone, has: announcements.length > 0 },
  ].filter(t => t.has);

  const defaultTab = tabs[0]?.id || 'preferences';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold flex items-center gap-2"><Music className="w-4 h-4" /> Vibe Sheet</h3>
          {submittedAt && (
            <p className="text-xs text-muted-foreground">Submitted {format(new Date(submittedAt), 'PPP')}</p>
          )}
        </div>
        <Badge variant="secondary">Read-only</Badge>
      </div>

      {tabs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            The vibe sheet exists but no sections have been filled out yet.
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue={defaultTab} className="space-y-4">
          <TabsList className="w-full h-auto flex flex-wrap gap-1 justify-start">
            {tabs.map(t => (
              <TabsTrigger key={t.id} value={t.id} className="text-xs gap-1">
                <t.icon className="w-3 h-3" /> {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Ceremony */}
          {tabs.find(t => t.id === 'ceremony') && (
            <TabsContent value="ceremony">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Ceremony & Cocktail Hour</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(ceremony.arrival_time || ceremony.ceremony_time) && (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {ceremony.arrival_time && (
                        <div><p className="text-muted-foreground text-xs">Invite Time</p><p className="font-medium">{ceremony.arrival_time}</p></div>
                      )}
                      {ceremony.ceremony_time && (
                        <div><p className="text-muted-foreground text-xs">Ceremony Time</p><p className="font-medium">{ceremony.ceremony_time}</p></div>
                      )}
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Ceremony Timeline</p>
                    <TimelineList events={ceremonyEvents} emptyText="No ceremony timeline entries" />
                  </div>
                  {ceremony.cocktail_hour?.music_info && (
                    <div>
                      <p className="text-xs text-muted-foreground">Cocktail Hour Music</p>
                      <p className="text-sm">{ceremony.cocktail_hour.music_info}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Reception */}
          {tabs.find(t => t.id === 'reception') && (
            <TabsContent value="reception">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Reception Timeline</CardTitle>
                  <CardDescription>Special moments throughout the evening</CardDescription>
                </CardHeader>
                <CardContent>
                  <TimelineList events={receptionEvents} emptyText="No reception timeline entries" />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Preferences */}
          {tabs.find(t => t.id === 'preferences') && (
            <TabsContent value="preferences">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3"><CardTitle className="text-base">Favorite Styles</CardTitle></CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {preferences.favorite_style && (
                      <div>
                        <p className="text-muted-foreground text-xs">Primary Style</p>
                        <p className="font-medium">{preferences.favorite_style}</p>
                        {Array.isArray(preferences.favorite_examples) && preferences.favorite_examples.filter((e: any) => e?.song || e?.artist).length > 0 && (
                          <ul className="mt-1 text-xs text-muted-foreground list-disc pl-5">
                            {preferences.favorite_examples.filter((e: any) => e?.song || e?.artist).map((e: any, i: number) => (
                              <li key={i}>{songLabel(e)}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                    {preferences.second_favorite_style && (
                      <div>
                        <p className="text-muted-foreground text-xs">Secondary Style</p>
                        <p className="font-medium">{preferences.second_favorite_style}</p>
                        {Array.isArray(preferences.second_favorite_examples) && preferences.second_favorite_examples.filter((e: any) => e?.song || e?.artist).length > 0 && (
                          <ul className="mt-1 text-xs text-muted-foreground list-disc pl-5">
                            {preferences.second_favorite_examples.filter((e: any) => e?.song || e?.artist).map((e: any, i: number) => (
                              <li key={i}>{songLabel(e)}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                    {preferences.other_styles && (
                      <div>
                        <p className="text-muted-foreground text-xs">Other Styles</p>
                        <p className="text-sm">{Array.isArray(preferences.other_styles) ? preferences.other_styles.join(', ') : preferences.other_styles}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        Must Plays
                        {musicSheet.must_plays && <Badge variant="secondary">{musicSheet.must_plays.length}</Badge>}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {musicSheet.must_plays && musicSheet.must_plays.length > 0 ? (
                        <ul className="space-y-1 text-sm">
                          {musicSheet.must_plays.map((song, i) => (
                            <li key={i}>• {song}</li>
                          ))}
                        </ul>
                      ) : <p className="text-sm text-muted-foreground">None specified</p>}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        Do Not Plays
                        {musicSheet.do_not_plays && <Badge variant="secondary">{musicSheet.do_not_plays.length}</Badge>}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {musicSheet.do_not_plays && musicSheet.do_not_plays.length > 0 ? (
                        <ul className="space-y-1 text-sm">
                          {musicSheet.do_not_plays.map((song, i) => (
                            <li key={i}>✕ {song}</li>
                          ))}
                        </ul>
                      ) : <p className="text-sm text-muted-foreground">No restrictions</p>}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          )}

          {/* Grand Intro */}
          {tabs.find(t => t.id === 'intro') && (
            <TabsContent value="intro">
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base">Grand Introduction</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {grandIntro.intro_style && (
                    <div><p className="text-muted-foreground text-xs">Intro Style</p><p className="font-medium">{grandIntro.intro_style}</p></div>
                  )}
                  {(grandIntro.intro_song || grandIntro.intro_artist) && (
                    <div><p className="text-muted-foreground text-xs">Intro Song</p><p className="font-medium">{[grandIntro.intro_song, grandIntro.intro_artist].filter(Boolean).join(' — ')}</p></div>
                  )}
                  {grandIntroEntries.length > 0 && (
                    <div>
                      <p className="text-muted-foreground text-xs mb-2">Lineup</p>
                      <ol className="space-y-2">
                        {grandIntroEntries.map((p: any, i: number) => (
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
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Group Dances */}
          {tabs.find(t => t.id === 'dances') && (
            <TabsContent value="dances">
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base">Group / Line Dances</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {groupDanceList.map((d, i) => (
                      <Badge key={i} variant={d.on ? 'default' : 'secondary'}>{d.name}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Song Requests */}
          {tabs.find(t => t.id === 'songs') && (
            <TabsContent value="songs">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    Song Requests
                    {additionalSongs.length > 0 && <Badge variant="secondary">{additionalSongs.length}</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {additionalSongs.length > 0 && (
                    <ul className="space-y-2">
                      {additionalSongs.map((s: any, i: number) => (
                        <li key={i} className="p-2 rounded bg-muted/40">
                          <p className="text-sm font-medium">{s?.song || s?.song_name || 'Untitled'}</p>
                          {(s?.artist || s?.artist_name) && (
                            <p className="text-xs text-muted-foreground">by {s.artist || s.artist_name}</p>
                          )}
                          {(s?.notes || s?.note) && (
                            <p className="text-xs text-muted-foreground mt-1">{s.notes || s.note}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                  {songRequests && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><FileText className="w-3 h-3" /> Additional Notes</p>
                      <p className="text-sm whitespace-pre-wrap p-2 rounded bg-muted/40">{songRequests}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Playlists */}
          {tabs.find(t => t.id === 'playlists') && (
            <TabsContent value="playlists">
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base">Playlists</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {playlistLinks.map((p: any, i: number) => (
                    <a
                      key={i}
                      href={p?.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-2 p-3 rounded border hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p?.label || 'Playlist'}</p>
                        <p className="text-xs text-muted-foreground truncate">{p?.url}</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    </a>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Toasts */}
          {tabs.find(t => t.id === 'toasts') && (
            <TabsContent value="toasts">
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base">Toasts</CardTitle></CardHeader>
                <CardContent className="space-y-3">
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
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Agenda */}
          {tabs.find(t => t.id === 'agenda') && (
            <TabsContent value="agenda">
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base">Event Agenda</CardTitle></CardHeader>
                <CardContent><TimelineList events={agendaItems} emptyText="No agenda items" /></CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Announcements */}
          {tabs.find(t => t.id === 'announcements') && (
            <TabsContent value="announcements">
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base">Announcements</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {announcements.map((a: any, i: number) => (
                      <li key={i} className="p-3 rounded border bg-muted/30">
                        <p className="text-sm font-medium">{a?.title || a?.label || `Announcement ${i + 1}`}</p>
                        {a?.text && <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{a.text}</p>}
                        {a?.time && <Badge variant="outline" className="text-xs mt-1">{a.time}</Badge>}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      )}
    </div>
  );
};
