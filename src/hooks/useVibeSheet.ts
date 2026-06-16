import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useClientEvent } from "@/hooks/useClientEvent";
import { logAction } from "@/lib/activityLogger";
import { toast } from "sonner";
import { useKeyboardShortcutsContext } from "@/contexts/KeyboardShortcutsContext";
import { CeremonyTimelineEvent, DEFAULT_EVENTS as DEFAULT_CEREMONY_EVENTS } from "@/components/CeremonyTimeline";
import { TimelineEvent, DEFAULT_EVENTS } from "@/components/ReceptionTimeline";
import { QuinceTimelineEvent, DEFAULT_QUINCE_CEREMONY_EVENTS, DEFAULT_QUINCE_RECEPTION_EVENTS } from "@/components/QuinceTimeline";
import { AgendaItem, DEFAULT_AGENDA_ITEMS } from "@/components/EventAgenda";
import { Announcement } from "@/components/AnnouncementsSection";
import { buildVibeSheetPDF, generatePDFAsBase64 as genPDFBase64, VibeSheetPDFData } from "@/lib/vibeSheetPdf";
import { normalizeEventType, getVibeSheetTabs } from "@/lib/eventUtils";
import type { Json } from "@/integrations/supabase/types";

// ── Typed interfaces for vibe_sheets JSON columns ──

export interface CeremonyDetails {
  arrival_time: string;
  ceremony_time: string;
  cocktail_hour: { music_info: string; vibe?: string; playlist_url?: string };
  // Legacy fields used during migration from old format
  parents_grandparents_processional?: { song?: string; artist?: string };
  groom_entrance?: { song?: string; artist?: string };
  bridal_party_processional?: { song?: string; artist?: string };
  bride_entrance?: { song?: string; artist?: string };
  recessional?: { song?: string; artist?: string };
}

 
export interface MusicPreferences {
  dislikes?: string[] | string;
  favorite_style?: string;
  favorite_examples?: { song?: string; artist?: string }[];
  second_favorite_style?: string;
  second_favorite_examples?: { song?: string; artist?: string }[];
  other_styles?: string[] | string;
  [key: string]: any;
}

 
export interface GroupDances {
  [key: string]: any;
}

 
export interface GrandIntroEntry {
  [key: string]: any;
}

export interface PlaylistLink {
  url: string;
  label?: string;
  name?: string;
}

export interface AdditionalSong {
  song: string;
  artist: string;
  notes?: string;
}

export interface SpotifyTrack {
  name: string;
  artist: string;
}

export interface ToastEntry {
  id: string;
  name: string;
  time: string;
  notes: string;
  song?: string;
  artist?: string;
}

/** Typed overlay for the vibe_sheets row, replacing Json with actual shapes */
interface VibeSheetRow {
  id: string;
  wedding_id: string;
  ceremony_details: CeremonyDetails | null;
  ceremony: unknown;
  ceremony_timeline_events: CeremonyTimelineEvent[] | null;
  reception_timeline_events: TimelineEvent[] | null;
  quince_ceremony_events: QuinceTimelineEvent[] | null;
  quince_reception_events: QuinceTimelineEvent[] | null;
  agenda_items: AgendaItem[] | null;
  announcements: Announcement[] | null;
  preferences: MusicPreferences | null;
  group_dances: GroupDances | null;
  additional_songs: AdditionalSong[] | null;
  grand_intro: GrandIntroEntry | null;
  song_requests: string | null;
  playlist_links: PlaylistLink[] | null;
  toasts: ToastEntry[] | null;
  dj_email: string | null;
  venue_email: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

const DEFAULT_CEREMONY: CeremonyDetails = {
  arrival_time: '',
  ceremony_time: '',
  cocktail_hour: { music_info: '' },
};

export const useVibeSheet = () => {
  const { event: wedding, loading: eventLoading, user } = useClientEvent<{
    id: string;
    couple_name: string;
    event_date: string;
    venue: string;
    event_type: string;
    contact_email: string;
    primary_contact_name: string | null;
  }>('id, couple_name, event_date, venue, event_type, contact_email, primary_contact_name');
  const [vibeSheetLoading, setVibeSheetLoading] = useState(true);
  const loading = eventLoading || vibeSheetLoading;
  const [saving, setSaving] = useState(false);
  const [vibeSheet, setVibeSheet] = useState<VibeSheetRow | null>(null);
  const { registerShortcuts, unregisterShortcuts } = useKeyboardShortcutsContext();

  // Form state — typed
  const [ceremony, setCeremony] = useState<CeremonyDetails>({ ...DEFAULT_CEREMONY });
  const [ceremonyEvents, setCeremonyEvents] = useState<CeremonyTimelineEvent[]>([]);
  const [receptionEvents, setReceptionEvents] = useState<TimelineEvent[]>([]);
  const [quinceCeremonyEvents, setQuinceCeremonyEvents] = useState<QuinceTimelineEvent[]>([]);
  const [quinceReceptionEvents, setQuinceReceptionEvents] = useState<QuinceTimelineEvent[]>([]);
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [preferences, setPreferences] = useState<MusicPreferences>({});
  const [groupDances, setGroupDances] = useState<GroupDances>({});
  const [additionalSongs, setAdditionalSongs] = useState<AdditionalSong[]>([]);
  const [grandIntro, setGrandIntro] = useState<GrandIntroEntry>({});
  const [songRequests, setSongRequests] = useState<string>('');
  const [playlistLinks, setPlaylistLinks] = useState<PlaylistLink[]>([]);
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const [djEmail, setDjEmail] = useState<string>('');
  const [venueEmail, setVenueEmail] = useState<string>('');
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [tabsExpanded, setTabsExpanded] = useState(true);
  const [activeTabValue, setActiveTabValue] = useState<string>('');
  const [playlistImportState, setPlaylistImportState] = useState<{ tracks: SpotifyTrack[]; targetTimeline: 'ceremony' | 'reception'; } | null>(null);
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);

  // Auto-save refs
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasLoadedRef = useRef(false);

  const loadVibeSheetData = useCallback(async () => {
    if (!wedding) return;

    try {
      const { data: vibeData } = await supabase
        .from('vibe_sheets')
        .select('*')
        .eq('wedding_id', wedding.id)
        .maybeSingle();

      if (vibeData) {
        // Cast once — all subsequent access is typed
        const vs = vibeData as unknown as VibeSheetRow;
        setVibeSheet(vs);

        // Load ceremony data with migration from old format
        const ceremonyDetails: CeremonyDetails = vs.ceremony_details || (vs.ceremony as CeremonyDetails | undefined) || { ...DEFAULT_CEREMONY };

        if (Array.isArray(vs.ceremony_timeline_events) && vs.ceremony_timeline_events.length > 0) {
          setCeremonyEvents(vs.ceremony_timeline_events);
        } else if (ceremonyDetails.parents_grandparents_processional || ceremonyDetails.groom_entrance) {
          const migratedEvents: CeremonyTimelineEvent[] = [];
          let order = 1;
          if (ceremonyDetails.parents_grandparents_processional?.song) {
            migratedEvents.push({ id: crypto.randomUUID(), order: order++, event_name: 'Parents/Grandparents Processional', song: ceremonyDetails.parents_grandparents_processional.song, artist: ceremonyDetails.parents_grandparents_processional.artist });
          }
          if (ceremonyDetails.groom_entrance?.song) {
            migratedEvents.push({ id: crypto.randomUUID(), order: order++, event_name: "Groom's Entrance", song: ceremonyDetails.groom_entrance.song, artist: ceremonyDetails.groom_entrance.artist });
          }
          if (ceremonyDetails.bridal_party_processional?.song) {
            migratedEvents.push({ id: crypto.randomUUID(), order: order++, event_name: 'Bridal Party Processional', song: ceremonyDetails.bridal_party_processional.song, artist: ceremonyDetails.bridal_party_processional.artist });
          }
          if (ceremonyDetails.bride_entrance?.song) {
            migratedEvents.push({ id: crypto.randomUUID(), order: order++, event_name: "Bride's Entrance", song: ceremonyDetails.bride_entrance.song, artist: ceremonyDetails.bride_entrance.artist });
          }
          if (ceremonyDetails.recessional?.song) {
            migratedEvents.push({ id: crypto.randomUUID(), order: order++, event_name: 'Recessional', song: ceremonyDetails.recessional.song, artist: ceremonyDetails.recessional.artist });
          }
          setCeremonyEvents(migratedEvents.length > 0 ? migratedEvents : DEFAULT_CEREMONY_EVENTS);
        } else {
          setCeremonyEvents(DEFAULT_CEREMONY_EVENTS);
        }

        const cocktailHour = ceremonyDetails.cocktail_hour || { music_info: '' };
        let musicInfo = cocktailHour.music_info || '';
        if (!musicInfo && (cocktailHour.vibe || cocktailHour.playlist_url)) {
          musicInfo = [cocktailHour.vibe, cocktailHour.playlist_url].filter(Boolean).join(' - ');
        }
        setCeremony({ arrival_time: ceremonyDetails.arrival_time || '', ceremony_time: ceremonyDetails.ceremony_time || '', cocktail_hour: { music_info: musicInfo } });

        let loadedEvents: TimelineEvent[] = Array.isArray(vs.reception_timeline_events) ? vs.reception_timeline_events : DEFAULT_EVENTS;
        const hasToast = loadedEvents.some(e => e.event_name === 'Toast');
        if (!hasToast && loadedEvents.length > 0) {
          const dinnerIndex = loadedEvents.findIndex(e => e.event_name === 'Dinner');
          const insertAfter = dinnerIndex >= 0 ? dinnerIndex : 3;
          const toastEvent: TimelineEvent = { id: crypto.randomUUID(), order: insertAfter + 2, time: '', event_name: 'Toast', song: '', artist: '' };
          const before = loadedEvents.slice(0, insertAfter + 1);
          const after = loadedEvents.slice(insertAfter + 1);
          loadedEvents = [...before, toastEvent, ...after.map((e, i) => ({ ...e, order: insertAfter + 2 + i + 1 }))];
          supabase.from('vibe_sheets').update({ reception_timeline_events: loadedEvents as unknown as Json }).eq('id', vs.id).then(({ error }) => { if (error) console.error('Failed to persist Toast migration:', error); });
        }
        setReceptionEvents(loadedEvents);

        setQuinceCeremonyEvents(Array.isArray(vs.quince_ceremony_events) ? vs.quince_ceremony_events : DEFAULT_QUINCE_CEREMONY_EVENTS);
        setQuinceReceptionEvents(Array.isArray(vs.quince_reception_events) ? vs.quince_reception_events : DEFAULT_QUINCE_RECEPTION_EVENTS);
        setAgendaItems(Array.isArray(vs.agenda_items) ? vs.agenda_items : DEFAULT_AGENDA_ITEMS);
        setAnnouncements(Array.isArray(vs.announcements) ? vs.announcements : []);
        // Normalize preferences — old saves may have stored array fields as JSON strings
        const rawPrefs = (vs.preferences as MusicPreferences) || {};
        const parseIfJsonString = (val: unknown): unknown => {
          if (typeof val !== 'string') return val;
          try { const p = JSON.parse(val); return Array.isArray(p) ? p : val; } catch { return val; }
        };
        setPreferences({
          ...rawPrefs,
          dislikes: parseIfJsonString(rawPrefs.dislikes ?? rawPrefs.do_not_play) as MusicPreferences['dislikes'],
          other_styles: parseIfJsonString(rawPrefs.other_styles) as MusicPreferences['other_styles'],
        });
        setGroupDances((vs.group_dances as GroupDances) || {});
        setAdditionalSongs(Array.isArray(vs.additional_songs) ? vs.additional_songs : []);
        setGrandIntro((vs.grand_intro as GrandIntroEntry) || {});
        setSongRequests(vs.song_requests || '');
        setPlaylistLinks(Array.isArray(vs.playlist_links) ? vs.playlist_links : []);
        setToasts(Array.isArray(vs.toasts) ? vs.toasts : []);

        const savedDjEmail = vs.dj_email || '';
        setDjEmail(savedDjEmail);
        setVenueEmail(vs.venue_email || '');

        if (!savedDjEmail) {
          const { data: assignmentData } = await supabase
            .from('event_dj_assignments')
            .select('dj_user_id, profiles!event_dj_assignments_dj_user_id_fkey(email)')
            .eq('event_id', wedding.id)
            .in('status', ['confirmed', 'assigned', 'pending'])
            .limit(1)
            .maybeSingle();
          const profiles = assignmentData?.profiles as { email?: string } | { email?: string }[] | null;
          const profileEmail = Array.isArray(profiles) ? profiles[0]?.email : profiles?.email;
          if (profileEmail) setDjEmail(profileEmail);
        }
      }
    } catch (error) {
      console.error('Error loading vibe sheet:', error);
      toast.error('Failed to load vibe sheet');
    } finally {
      setVibeSheetLoading(false);
    }
  }, [wedding]);

  const handleSave = useCallback(async (submit = false, silent = false) => {
    if (!wedding) return;
    if (!silent) setSaving(true);
    try {
      const data = {
        wedding_id: wedding.id,
        ceremony_details: ceremony as unknown as Json,
        ceremony_timeline_events: ceremonyEvents as unknown as Json,
        reception_timeline_events: receptionEvents as unknown as Json,
        quince_ceremony_events: quinceCeremonyEvents as unknown as Json,
        quince_reception_events: quinceReceptionEvents as unknown as Json,
        agenda_items: agendaItems as unknown as Json,
        announcements: announcements as unknown as Json,
        preferences: preferences as unknown as Json,
        group_dances: groupDances as unknown as Json,
        additional_songs: additionalSongs as unknown as Json,
        grand_intro: grandIntro as unknown as Json,
        song_requests: songRequests,
        playlist_links: playlistLinks as unknown as Json,
        toasts: toasts as unknown as Json,
        dj_email: djEmail,
        venue_email: venueEmail,
        ...(submit && { submitted_at: new Date().toISOString() })
      };

      if (vibeSheet) {
        const { error } = await supabase.from('vibe_sheets').update(data).eq('id', vibeSheet.id);
        if (error) throw error;
      } else {
        const { data: inserted, error } = await supabase.from('vibe_sheets').insert([data]).select().maybeSingle();
        if (error) throw error;
        // Immediately update local state so the next auto-save uses the UPDATE path
        // instead of INSERT, preventing duplicate-key constraint violations.
        if (inserted) setVibeSheet(inserted as unknown as VibeSheetRow);
      }

      if (!silent) {
        await loadVibeSheetData();
        toast.success(submit ? "Vibe sheet submitted!" : "Progress saved!");
        if (submit) {
          supabase.functions.invoke('notify-vibe-sheet-submitted', {
            body: { wedding_id: wedding.id }
          }).catch(() => {/* non-critical — don't block the UI */});
        }
        if (user) {
          const action = submit ? "submitted vibe sheet" : "saved vibe sheet";
          await logAction(wedding.id, action, user.id, user.email || "Unknown", "Vibe Sheet");
        }
      }
    } catch (error) {
      console.error('Error saving vibe sheet:', error);
      toast.error('Failed to save vibe sheet');
    } finally {
      if (!silent) setSaving(false);
    }
  }, [wedding, vibeSheet, ceremony, ceremonyEvents, receptionEvents, quinceCeremonyEvents, quinceReceptionEvents, agendaItems, announcements, preferences, groupDances, additionalSongs, grandIntro, songRequests, playlistLinks, toasts, djEmail, venueEmail, user, loadVibeSheetData]);

  // Ref so the auto-save effect always calls the latest handleSave without
  // being listed as a dependency (avoids stale-closure INSERT loops).
  const handleSaveRef = useRef(handleSave);
  useEffect(() => {
    handleSaveRef.current = handleSave;
  }, [handleSave]);

  useEffect(() => { if (wedding) loadVibeSheetData(); }, [wedding, loadVibeSheetData]);

  // Keyboard shortcuts
  useEffect(() => {
    const shortcuts = [
      { key: 's', ctrlKey: true, metaKey: true, description: 'Save draft', category: 'forms' as const, action: () => { if (!saving) handleSave(false); } },
      { key: 'Enter', ctrlKey: true, metaKey: true, description: 'Save & Submit', category: 'forms' as const, action: () => { if (!saving) handleSave(true); } },
    ];
    registerShortcuts(shortcuts);
    return () => { unregisterShortcuts(shortcuts); };
  }, [saving, registerShortcuts, unregisterShortcuts, handleSave]);

  // Mark loaded
  useEffect(() => {
    if (!loading && wedding) {
      const t = setTimeout(() => { hasLoadedRef.current = true; }, 500);
      return () => clearTimeout(t);
    }
  }, [loading, wedding]);

  // Auto-save
  useEffect(() => {
    if (!hasLoadedRef.current || loading || !wedding) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(async () => { await handleSaveRef.current(false, true); }, 3000);
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
  }, [ceremony, ceremonyEvents, receptionEvents, quinceCeremonyEvents, quinceReceptionEvents, agendaItems, announcements, preferences, groupDances, additionalSongs, grandIntro, songRequests, playlistLinks, djEmail, venueEmail, toasts]);

  const handlePrint = useCallback((scope: 'full' | 'current' = 'full') => {
    if (scope === 'current') {
      const el = document.getElementById('pdf-template-current');
      if (el) {
        el.style.cssText = 'display: block; position: fixed; left: 0; top: 0; width: 210mm; background: white; z-index: 99999;';
        document.body.setAttribute('data-print-scope', 'current');
        window.print();
        setTimeout(() => {
          el.style.cssText = 'display: none; position: absolute; left: 0; top: 0; width: 210mm; background: white;';
          document.body.removeAttribute('data-print-scope');
        }, 1000);
      }
    } else {
      document.body.setAttribute('data-print-scope', 'full');
      window.print();
      setTimeout(() => document.body.removeAttribute('data-print-scope'), 1000);
    }
  }, []);

  const getPDFData = useCallback((): VibeSheetPDFData => {
    const eventType = normalizeEventType(wedding?.event_type);
    const tabs = getVibeSheetTabs(wedding?.event_type);
    const defaultTab = tabs[0]?.id || 'ceremony';
    return {
      wedding, eventType, activeTab: activeTabValue || defaultTab,
      ceremony, ceremonyEvents, receptionEvents, quinceReceptionEvents,
      agendaItems, announcements, preferences, groupDances, additionalSongs,
      songRequests, playlistLinks, toasts, grandIntro,
    };
  }, [wedding, activeTabValue, ceremony, ceremonyEvents, receptionEvents, quinceReceptionEvents, agendaItems, announcements, preferences, groupDances, additionalSongs, songRequests, playlistLinks, toasts, grandIntro]);

  const handleDownloadPDF = useCallback((scope: 'full' | 'current' = 'full') => {
    try {
      toast.info('Generating PDF...');
      const doc = buildVibeSheetPDF(getPDFData(), scope);
      const suffix = scope === 'current' ? `_${activeTabValue || 'current'}` : '';
      doc.save(`${(wedding?.couple_name || 'VibeSheet').replace(/[^a-z0-9]/gi, '_')}_VibeSheet${suffix}.pdf`);
      toast.success('PDF downloaded!');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF');
    }
  }, [getPDFData, activeTabValue, wedding]);

  const generatePDFAsBase64 = useCallback(async (): Promise<string> => {
    return genPDFBase64(getPDFData());
  }, [getPDFData]);

  const handleEmailShare = useCallback(() => { setShareDialogOpen(true); }, []);

  const handlePlaylistImport = useCallback((tracks: SpotifyTrack[], targetTimeline: 'ceremony' | 'reception', mode: 'fill' | 'replace' | 'add') => {
    if (mode === 'replace') {
      if (targetTimeline === 'ceremony') {
        const newEvents = tracks.map((track, idx) => ({ id: crypto.randomUUID(), order: idx + 1, event_name: '', song: track.name, artist: track.artist }));
        setCeremonyEvents(newEvents);
      } else {
        const newEvents = tracks.map((track, idx) => ({ id: crypto.randomUUID(), order: idx + 1, time: '', event_name: '', song: track.name, artist: track.artist, has_slideshow: false }));
        setReceptionEvents(newEvents);
      }
      toast.success(`Replaced all events with ${tracks.length} songs from playlist`);
    } else if (mode === 'fill') {
      if (targetTimeline === 'ceremony') {
        const updatedEvents = [...ceremonyEvents];
        let trackIndex = 0;
        for (let i = 0; i < updatedEvents.length && trackIndex < tracks.length; i++) {
          if (!updatedEvents[i].song || !updatedEvents[i].artist) {
            updatedEvents[i] = { ...updatedEvents[i], song: tracks[trackIndex].name, artist: tracks[trackIndex].artist };
            trackIndex++;
          }
        }
        setCeremonyEvents(updatedEvents);
        toast.success(`Filled ${trackIndex} empty rows in Ceremony timeline`);
      } else {
        const updatedEvents = [...receptionEvents];
        let trackIndex = 0;
        for (let i = 0; i < updatedEvents.length && trackIndex < tracks.length; i++) {
          if (!updatedEvents[i].song || !updatedEvents[i].artist) {
            updatedEvents[i] = { ...updatedEvents[i], song: tracks[trackIndex].name, artist: tracks[trackIndex].artist };
            trackIndex++;
          }
        }
        setReceptionEvents(updatedEvents);
        toast.success(`Filled ${trackIndex} empty rows in Reception timeline`);
      }
    } else {
      if (targetTimeline === 'ceremony') {
        const newEvents = tracks.map((track, idx) => ({ id: crypto.randomUUID(), order: ceremonyEvents.length + idx + 1, event_name: '', song: track.name, artist: track.artist }));
        setCeremonyEvents(prev => [...prev, ...newEvents]);
      } else {
        const newEvents = tracks.map((track, idx) => ({ id: crypto.randomUUID(), order: receptionEvents.length + idx + 1, time: '', event_name: '', song: track.name, artist: track.artist, has_slideshow: false }));
        setReceptionEvents(prev => [...prev, ...newEvents]);
      }
      toast.success(`Added ${tracks.length} songs to ${targetTimeline === 'ceremony' ? 'Ceremony' : 'Reception'}`);
    }
    setPlaylistImportState(null);
    setShowOverwriteConfirm(false);
  }, [ceremonyEvents, receptionEvents]);

  return {
    loading, saving, wedding, vibeSheet, user,
    ceremony, setCeremony,
    ceremonyEvents, setCeremonyEvents,
    receptionEvents, setReceptionEvents,
    quinceCeremonyEvents, setQuinceCeremonyEvents,
    quinceReceptionEvents, setQuinceReceptionEvents,
    agendaItems, setAgendaItems,
    announcements, setAnnouncements,
    preferences, setPreferences,
    groupDances, setGroupDances,
    additionalSongs, setAdditionalSongs,
    grandIntro, setGrandIntro,
    songRequests, setSongRequests,
    playlistLinks, setPlaylistLinks,
    toasts, setToasts,
    djEmail, setDjEmail,
    venueEmail, setVenueEmail,
    shareDialogOpen, setShareDialogOpen,
    tabsExpanded, setTabsExpanded,
    activeTabValue, setActiveTabValue,
    playlistImportState, setPlaylistImportState,
    showOverwriteConfirm, setShowOverwriteConfirm,
    handleSave, handlePrint, handleDownloadPDF, handleEmailShare,
    generatePDFAsBase64, handlePlaylistImport,
  };
};
