import { capitalizeWords } from "@/lib/utils";
import { parseLocalDate } from "@/lib/formatters";
import { 
  getVibeSheetSubtitle, 
  getVibeSheetTabs, 
  normalizeEventType,
  getEventLabel
} from "@/lib/eventUtils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Music, ChevronDown, ChevronRight, GripVertical, ExternalLink } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SpotifySearch } from "@/components/SpotifySearch";
import { ReceptionTimeline } from "@/components/ReceptionTimeline";
import { CeremonyTimeline } from "@/components/CeremonyTimeline";
import { QuinceTimeline } from "@/components/QuinceTimeline";
import { EventAgenda } from "@/components/EventAgenda";
import { AnnouncementsSection } from "@/components/AnnouncementsSection";
import { ShareVibeSheetDialog } from "@/components/ShareVibeSheetDialog";
import { SpotifyPlaylistPreview } from "@/components/SpotifyPlaylistPreview";
import { OverwriteConfirmDialog } from "@/components/OverwriteConfirmDialog";
import { useVibeSheet } from "@/hooks/useVibeSheet";
import { GrandIntroTab } from "@/components/vibe-sheet/GrandIntroTab";
import { VibeSheetActionBar } from "@/components/vibe-sheet/VibeSheetActionBar";
import { FullPrintTemplate, CurrentTabPrintTemplate } from "@/components/vibe-sheet/VibeSheetPrintTemplates";

const VibeSheet = () => {
  const vs = useVibeSheet();

  if (vs.loading) return <div className="text-center py-12">Loading...</div>;
  if (!vs.wedding) return <div className="text-center py-12">No event found</div>;

  const eventType = normalizeEventType(vs.wedding.event_type);
  const tabs = getVibeSheetTabs(vs.wedding.event_type);
  const visibleTabs = tabs.filter(tab => tab.visible);
  const defaultTab = tabs[0]?.id || 'ceremony';

  const getTabGridClasses = (tabCount: number): string => {
    if (tabCount <= 4) return '!grid grid-cols-2 sm:grid-cols-4 gap-2';
    if (tabCount <= 5) return '!grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2';
    return '!grid grid-cols-2 sm:grid-cols-4 gap-2';
  };

  const printTemplateProps = {
    wedding: vs.wedding,
    eventType,
    activeTabValue: vs.activeTabValue,
    vibeSheet: vs.vibeSheet,
    ceremony: vs.ceremony,
    ceremonyEvents: vs.ceremonyEvents,
    receptionEvents: vs.receptionEvents,
    quinceReceptionEvents: vs.quinceReceptionEvents,
    agendaItems: vs.agendaItems,
    announcements: vs.announcements,
    preferences: vs.preferences,
    groupDances: vs.groupDances,
    additionalSongs: vs.additionalSongs,
    songRequests: vs.songRequests,
    playlistLinks: vs.playlistLinks,
    toasts: vs.toasts,
    grandIntro: vs.grandIntro,
  };

  return (
    <div className="container mx-auto px-4 space-y-6 max-w-full overflow-x-hidden" data-tour="vibe-sheet-intro">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Your Vibe Sheet</h1>
          <p className="text-muted-foreground mt-1">{getVibeSheetSubtitle(vs.wedding.event_type)}</p>
        </div>
        {vs.vibeSheet?.submitted_at && (
          <Badge variant="secondary" className="text-sm">
            Submitted {new Date(vs.vibeSheet.submitted_at).toLocaleDateString()}
          </Badge>
        )}
      </div>

      {vs.vibeSheet?.submitted_at && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-4">
            <p className="text-sm">✓ Thanks! We've got your vibe sheet. You can still edit and resubmit anytime.</p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue={defaultTab} className="space-y-6" onValueChange={(value) => vs.setActiveTabValue(value)}>
        <Collapsible open={vs.tabsExpanded} onOpenChange={vs.setTabsExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 mb-2">
              {vs.tabsExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <span className="text-sm text-muted-foreground">
                {vs.tabsExpanded ? 'Navigation' : `Current: ${visibleTabs.find(t => t.id === (vs.activeTabValue || defaultTab))?.label || 'Tab'}`}
              </span>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <TabsList className={`w-full h-auto ${getTabGridClasses(visibleTabs.length)} mb-6`} data-tour="vibe-tabs">
              {visibleTabs.map(tab => (
                <TabsTrigger key={tab.id} value={tab.id}>{tab.label}</TabsTrigger>
              ))}
            </TabsList>
          </CollapsibleContent>
        </Collapsible>

        <div className="print-only-header">
          <h1>Vibe Sheet — {capitalizeWords(vs.wedding?.couple_name || '')}</h1>

          <p>Enzym3 Entertainment · enzym3entertainment.vip</p>
        </div>

        {/* Event Agenda Tab */}
        {eventType !== 'wedding' && eventType !== 'quince' && (
          <TabsContent value="agenda" className="space-y-4" data-current-tab={(vs.activeTabValue || defaultTab) === 'agenda' ? true : undefined}>
            <EventAgenda items={vs.agendaItems} onChange={vs.setAgendaItems} eventType={eventType} />
          </TabsContent>
        )}

        {/* Announcements Tab */}
        {eventType !== 'wedding' && eventType !== 'quince' && (
          <TabsContent value="announcements" className="space-y-4" data-current-tab={(vs.activeTabValue || defaultTab) === 'announcements' ? true : undefined}>
            <AnnouncementsSection announcements={vs.announcements} onChange={vs.setAnnouncements} />
          </TabsContent>
        )}

        {/* Ceremony Tab */}
        {eventType === 'wedding' && (
          <TabsContent value="ceremony" className="space-y-4 pb-8" data-current-tab={(vs.activeTabValue || defaultTab) === 'ceremony' ? true : undefined}>
            <Card>
              <CardHeader>
                <CardTitle>Ceremony & Cocktail Hour</CardTitle>
                <CardDescription>Timing and music for your ceremony</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Invite Time</Label>
                    <Input type="time" className="cursor-pointer" value={vs.ceremony.arrival_time || ''} onChange={(e) => vs.setCeremony({...vs.ceremony, arrival_time: e.target.value})} onClick={(e) => (e.currentTarget as HTMLInputElement).showPicker?.()} />
                  </div>
                  <div>
                    <Label>Ceremony Time</Label>
                    <Input type="time" className="cursor-pointer" value={vs.ceremony.ceremony_time || ''} onChange={(e) => vs.setCeremony({...vs.ceremony, ceremony_time: e.target.value})} onClick={(e) => (e.currentTarget as HTMLInputElement).showPicker?.()} />
                  </div>
                </div>
                <CeremonyTimeline events={vs.ceremonyEvents} onEventsChange={vs.setCeremonyEvents} />
                <div className="space-y-2">
                  <Label>Cocktail Hour Music</Label>
                  <Input
                    placeholder="Jazz, Acoustic, or paste a playlist link..."
                    value={vs.ceremony.cocktail_hour?.music_info || ''}
                    onChange={(e) => vs.setCeremony({ ...vs.ceremony, cocktail_hour: { music_info: e.target.value } })}
                  />
                  <p className="text-xs text-muted-foreground">Describe the music vibe or paste a Spotify, Apple Music, or YouTube playlist link</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Reception Tab */}
        <TabsContent value="reception" className="space-y-4 pb-8" data-current-tab={(vs.activeTabValue || defaultTab) === 'reception' ? true : undefined}>
          {eventType === 'wedding' ? (
            <Card data-tour="timeline-editor">
              <CardHeader>
                <CardTitle>Reception Timeline</CardTitle>
                <CardDescription>Special moments throughout the evening - drag to reorder</CardDescription>
              </CardHeader>
              <CardContent>
                <ReceptionTimeline events={vs.receptionEvents} onEventsChange={vs.setReceptionEvents} />
              </CardContent>
            </Card>
          ) : eventType === 'quince' ? (
            <QuinceTimeline events={vs.quinceReceptionEvents} onChange={vs.setQuinceReceptionEvents} type="reception" />
          ) : null}
          {(eventType === 'wedding' || eventType === 'quince') && (
            <button
              onClick={() => vs.setActiveTabValue('toasts')}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-border bg-muted/40 hover:bg-muted transition-colors text-sm text-muted-foreground hover:text-foreground group"
            >
              <span className="flex items-center gap-2">
                <Music className="h-4 w-4 text-primary" />
                <span>🥂 Need to add <strong className="text-foreground">Toasts</strong>? Manage them in the Toasts tab</span>
              </span>
              <ChevronRight className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-4" data-current-tab={(vs.activeTabValue || defaultTab) === 'preferences' ? true : undefined}>
          <Card>
            <CardHeader>
              <CardTitle>Music Preferences</CardTitle>
              <CardDescription>Tell us your favorite music styles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Music Dislikes</Label>
                <Textarea
                  placeholder="List any styles, songs, or artists you don't want played"
                  value={Array.isArray(vs.preferences.dislikes) ? vs.preferences.dislikes.join(', ') : (vs.preferences.dislikes || '')}
                  onChange={(e) => vs.setPreferences({...vs.preferences, dislikes: e.target.value.split(',').map((s: string) => s.trim())})}
                  rows={3}
                />
              </div>
              <div className="space-y-4">
                <div>
                  <Label>Favorite Music Style</Label>
                  <Input placeholder="e.g., R&B / 90s" value={vs.preferences.favorite_style || ''} onChange={(e) => vs.setPreferences({...vs.preferences, favorite_style: e.target.value})} />
                </div>
                <div>
                  <Label>Three Examples</Label>
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="mt-2">
                      <SpotifySearch
                        compact={true}
                        initialSong={vs.preferences.favorite_examples?.[i]?.song || ''}
                        initialArtist={vs.preferences.favorite_examples?.[i]?.artist || ''}
                        onSelect={(track) => {
                          const examples = [...(vs.preferences.favorite_examples || [{}, {}, {}])];
                          examples[i] = { song: track.name, artist: track.artist };
                          vs.setPreferences({...vs.preferences, favorite_examples: examples});
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label>Second Favorite Style</Label>
                  <Input placeholder="e.g., Country" value={vs.preferences.second_favorite_style || ''} onChange={(e) => vs.setPreferences({...vs.preferences, second_favorite_style: e.target.value})} />
                </div>
                <div>
                  <Label>Three Examples</Label>
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="mt-2">
                      <SpotifySearch
                        compact={true}
                        initialSong={vs.preferences.second_favorite_examples?.[i]?.song || ''}
                        initialArtist={vs.preferences.second_favorite_examples?.[i]?.artist || ''}
                        onSelect={(track) => {
                          const examples = [...(vs.preferences.second_favorite_examples || [{}, {}, {}])];
                          examples[i] = { song: track.name, artist: track.artist };
                          vs.setPreferences({...vs.preferences, second_favorite_examples: examples});
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label>Other Styles You'd Like</Label>
                <Textarea
                  placeholder="e.g., Pop, Oldies, etc."
                  value={Array.isArray(vs.preferences.other_styles) ? vs.preferences.other_styles.join(', ') : (vs.preferences.other_styles || '')}
                  onChange={(e) => vs.setPreferences({...vs.preferences, other_styles: e.target.value.split(',').map((s: string) => s.trim())})}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Group Dances Tab */}
        <TabsContent value="dances" className="space-y-4" data-current-tab={(vs.activeTabValue || defaultTab) === 'dances' ? true : undefined}>
          <Card>
            <CardHeader>
              <CardTitle>Group / Line Dances</CardTitle>
              <CardDescription>Which group dances would you like?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'macarena', label: 'Macarena' }, { key: 'chicken_dance', label: 'Chicken Dance' },
                { key: 'electric_slide', label: 'Electric Slide' }, { key: 'conga_line', label: 'Conga Line' },
                { key: 'cotton_eyed_joe', label: 'Cotton-Eyed Joe' }, { key: 'cha_cha_slide', label: 'Cha Cha Slide' },
                { key: 'ymca', label: 'YMCA' }, { key: 'cupid_shuffle', label: 'Cupid Shuffle' },
                { key: 'wobble', label: 'Wobble' }
              ].map((dance) => (
                <div key={dance.key} className="flex items-center justify-between">
                  <Label htmlFor={dance.key}>{dance.label}</Label>
                  <Switch id={dance.key} checked={vs.groupDances[dance.key] || false} onCheckedChange={(checked) => vs.setGroupDances({...vs.groupDances, [dance.key]: checked})} />
                </div>
              ))}
              <div className="pt-4">
                <Label>Other Group Dances</Label>
                <Textarea placeholder="List any other group dances you'd like" value={vs.groupDances.other || ''} onChange={(e) => vs.setGroupDances({...vs.groupDances, other: e.target.value})} rows={2} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Song Requests Tab */}
        <TabsContent value="songs" className="space-y-4" data-current-tab={(vs.activeTabValue || defaultTab) === 'songs' ? true : undefined}>
          <Card data-tour="spotify-search">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Song Requests</CardTitle>
                  <CardDescription>Songs you'd like to hear during the reception</CardDescription>
                </div>
                <Button size="sm" onClick={() => vs.setAdditionalSongs([...vs.additionalSongs, { song: '', artist: '', notes: '' }])}>
                  <Plus className="h-4 w-4 mr-2" />Add Song
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {vs.additionalSongs.map((song, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-2">
                    <SpotifySearch compact={true} initialSong={song.song || ''} initialArtist={song.artist || ''} onSelect={(track) => { const newSongs = [...vs.additionalSongs]; newSongs[index] = {...song, song: track.name, artist: track.artist}; vs.setAdditionalSongs(newSongs); }} />
                    <Input placeholder="Notes (optional)" value={song.notes || ''} onChange={(e) => { const newSongs = [...vs.additionalSongs]; newSongs[index] = {...song, notes: e.target.value}; vs.setAdditionalSongs(newSongs); }} />
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => vs.setAdditionalSongs(vs.additionalSongs.filter((_, i) => i !== index))}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
              {vs.additionalSongs.length === 0 && <p className="text-center text-muted-foreground py-4">No additional songs yet. Click "Add Song" to get started!</p>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Grand Intro Tab */}
        <TabsContent value="intro" className="space-y-4" data-current-tab={(vs.activeTabValue || defaultTab) === 'intro' ? true : undefined}>
          <GrandIntroTab eventType={eventType} grandIntro={vs.grandIntro} setGrandIntro={vs.setGrandIntro} />
        </TabsContent>

        {/* Playlists Tab */}
        <TabsContent value="playlists" className="space-y-4" data-current-tab={(vs.activeTabValue || defaultTab) === 'playlists' ? true : undefined}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><Music className="h-5 w-5" />Music Playlists</CardTitle>
                  <CardDescription>Share your Spotify, Apple Music, or YouTube playlists</CardDescription>
                </div>
                <Button size="sm" onClick={() => vs.setPlaylistLinks([...vs.playlistLinks, { url: '', label: '' }])}>
                  <Plus className="h-4 w-4 mr-2" />Add Playlist
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {vs.playlistLinks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Music className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No playlists added yet</p>
                  <p className="text-sm">Click "Add Playlist" to share your music collection</p>
                </div>
              )}
              {vs.playlistLinks.map((playlist, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex gap-3 p-4 border rounded-lg bg-card border-primary/20 shadow-sm">
                    <div className="flex-1 space-y-3">
                      <div>
                        <Label className="text-xs">Playlist URL</Label>
                        <Input placeholder="https://open.spotify.com/playlist/... or Apple Music, YouTube" value={playlist.url || ''} onChange={(e) => { const newLinks = [...vs.playlistLinks]; newLinks[index] = {...playlist, url: e.target.value}; vs.setPlaylistLinks(newLinks); }} />
                      </div>
                      <div>
                        <Label className="text-xs">Label (optional)</Label>
                        <Input placeholder="e.g., 'Reception Dance Mix' or 'Dinner Background Music'" value={playlist.label || ''} onChange={(e) => { const newLinks = [...vs.playlistLinks]; newLinks[index] = {...playlist, label: e.target.value}; vs.setPlaylistLinks(newLinks); }} />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      {playlist.url && <Button variant="ghost" size="icon" asChild><a href={playlist.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a></Button>}
                      <Button variant="ghost" size="icon" onClick={() => vs.setPlaylistLinks(vs.playlistLinks.filter((_, i) => i !== index))}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <SpotifyPlaylistPreview
                    playlistUrl={playlist.url || ''}
                    onImportToCeremony={(tracks, targetTimeline) => {
                      vs.setPlaylistImportState({ tracks, targetTimeline });
                      if (vs.ceremonyEvents.length > 0) { vs.setShowOverwriteConfirm(true); } else { vs.handlePlaylistImport(tracks, targetTimeline, 'add'); }
                    }}
                    onImportToReception={(tracks, targetTimeline) => {
                      vs.setPlaylistImportState({ tracks, targetTimeline });
                      if (vs.receptionEvents.length > 0) { vs.setShowOverwriteConfirm(true); } else { vs.handlePlaylistImport(tracks, targetTimeline, 'add'); }
                    }}
                  />
                </div>
              ))}
              <div className="text-xs text-muted-foreground space-y-1 pt-2">
                <p>✅ Supported platforms: Spotify, Apple Music, YouTube Music, YouTube</p>
                <p>💡 Pro tip: Create separate playlists for different parts of your event (ceremony, cocktail hour, dinner, dancing)</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Toasts Tab */}
        {(eventType === 'wedding' || eventType === 'quince') && (
          <TabsContent value="toasts" className="space-y-4" data-current-tab={(vs.activeTabValue || defaultTab) === 'toasts' ? true : undefined}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Toasts</CardTitle>
                    <CardDescription>Who's speaking, when, and any special instructions for the DJ</CardDescription>
                  </div>
                  <Button size="sm" onClick={() => vs.setToasts([...vs.toasts, { id: crypto.randomUUID(), name: '', time: '', notes: '', song: '', artist: '' }])}>
                    <Plus className="h-4 w-4 mr-2" />Add Toast
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {vs.toasts.length === 0 && <p className="text-center text-muted-foreground py-6">No toasts added yet — click "Add Toast" to get started.</p>}
                {vs.toasts.map((toast_entry, index) => (
                  <div key={toast_entry.id} className="border rounded-lg p-4 space-y-3 bg-muted/20">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm font-medium text-muted-foreground">Toast #{index + 1}</span>
                      <Button variant="ghost" size="icon" className="ml-auto h-7 w-7" onClick={() => vs.setToasts(vs.toasts.filter((_, i) => i !== index))}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Speaker Name</Label>
                        <Input placeholder="e.g., Best Man" value={toast_entry.name} onChange={(e) => { const updated = [...vs.toasts]; updated[index] = { ...toast_entry, name: e.target.value }; vs.setToasts(updated); }} />
                      </div>
                      <div>
                        <Label className="text-xs">Preferred Time</Label>
                        <Input placeholder="e.g., After dinner" value={toast_entry.time} onChange={(e) => { const updated = [...vs.toasts]; updated[index] = { ...toast_entry, time: e.target.value }; vs.setToasts(updated); }} />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Notes / Instructions</Label>
                      <Textarea placeholder="Any notes for the DJ about this toast..." value={toast_entry.notes} onChange={(e) => { const updated = [...vs.toasts]; updated[index] = { ...toast_entry, notes: e.target.value }; vs.setToasts(updated); }} rows={2} />
                    </div>
                    <div>
                      <Label className="text-xs">Song to Play After Toast</Label>
                      <SpotifySearch compact={true} initialSong={toast_entry.song || ''} initialArtist={toast_entry.artist || ''} onSelect={(track) => { const updated = [...vs.toasts]; updated[index] = { ...toast_entry, song: track.name, artist: track.artist }; vs.setToasts(updated); }} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <VibeSheetActionBar
        saving={vs.saving}
        submittedAt={vs.vibeSheet?.submitted_at}
        onPrint={vs.handlePrint}
        onDownloadPDF={vs.handleDownloadPDF}
        onEmailShare={vs.handleEmailShare}
        onSave={vs.handleSave}
      />

      <FullPrintTemplate {...printTemplateProps} />
      <CurrentTabPrintTemplate {...printTemplateProps} />

      <ShareVibeSheetDialog
        open={vs.shareDialogOpen}
        onOpenChange={vs.setShareDialogOpen}
        vibeSheetData={{
          arrivalTime: vs.ceremony.arrival_time,
          ceremonyTime: vs.ceremony.ceremony_time,
          cocktailVibe: vs.ceremony.cocktail_hour?.vibe,
          ceremonyEvents: vs.ceremonyEvents,
          receptionEvents: vs.receptionEvents,
          favoriteStyles: vs.preferences.favorite_style,
          doNotPlay: vs.preferences.do_not_play,
          groupDances: [
            vs.groupDances.anniversary_dance && { song: 'Anniversary Dance', artist: '' },
            vs.groupDances.money_dance && { song: 'Money Dance', artist: '' },
          ].filter(Boolean),
          additionalSongs: vs.additionalSongs,
          grandIntro: vs.grandIntro.intro_style,
          introSong: vs.grandIntro.intro_song,
          introArtist: vs.grandIntro.intro_artist,
        }}
        coupleName={vs.wedding.couple_name}
        eventDate={parseLocalDate(vs.wedding.event_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        eventLabel={getEventLabel(vs.wedding.event_type)}
        coupleEmail={vs.user?.email}
        djEmail={vs.djEmail}
        venueEmail={vs.venueEmail}
        onGeneratePDF={vs.generatePDFAsBase64}
      />

      <OverwriteConfirmDialog
        open={vs.showOverwriteConfirm}
        onClose={() => { vs.setShowOverwriteConfirm(false); vs.setPlaylistImportState(null); }}
        onConfirm={(mode) => {
          if (vs.playlistImportState) {
            vs.handlePlaylistImport(vs.playlistImportState.tracks, vs.playlistImportState.targetTimeline, mode);
          }
        }}
        existingSongsCount={
          vs.playlistImportState?.targetTimeline === 'ceremony'
            ? vs.ceremonyEvents.filter(e => e.song && e.artist).length
            : vs.receptionEvents.filter(e => e.song && e.artist).length
        }
        importingSongsCount={vs.playlistImportState?.tracks.length || 0}
      />
    </div>
  );
};

export default VibeSheet;
