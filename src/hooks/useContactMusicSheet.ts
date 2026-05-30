import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MusicSheetWithDetails } from '@/types/musicSheet';

/**
 * Loads the couple's music sheet for display in Coordination/Vendor surfaces.
 *
 * Source of truth: `vibe_sheets` (written by the Vibe Planner couple app).
 * The input id is an `event_notification_history.id`. We resolve it to the
 * matching `weddings.id` via:
 *   1) event_notification_history.wedding_id (if backfilled), else
 *   2) match on couple_name + event_date in public.weddings.
 *
 * Result is normalized into the existing MusicSheetWithDetails shape so the
 * current UI works unchanged. Falls back to legacy `music_sheets` if no
 * vibe_sheet exists for the wedding.
 */

interface VibeSheetRow {
  id: string;
  wedding_id: string;
  ceremony_details: any;
  ceremony_timeline_events: any;
  reception_timeline_events: any;
  preferences: any;
  group_dances: any;
  additional_songs: any;
  grand_intro: any;
  song_requests: string | null;
  playlist_links: any;
  toasts: any;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

const findTimelineSong = (events: any, names: string[]): string | undefined => {
  if (!Array.isArray(events)) return undefined;
  const target = names.map(n => n.toLowerCase());
  const match = events.find((e: any) => {
    const name = (e?.event_name || e?.label || '').toString().toLowerCase();
    return target.some(t => name.includes(t));
  });
  if (!match) return undefined;
  const song = match.song?.toString().trim();
  const artist = match.artist?.toString().trim();
  if (!song && !artist) return undefined;
  return [song, artist].filter(Boolean).join(' — ');
};

const normalizeVibeSheet = (vs: VibeSheetRow): MusicSheetWithDetails => {
  const ceremonyEvents = vs.ceremony_timeline_events;
  const receptionEvents = vs.reception_timeline_events;

  // Ceremony songs (legacy single-field display)
  const processional = findTimelineSong(ceremonyEvents, ['processional', 'parents', 'bridal party']);
  const brideEntrance = findTimelineSong(ceremonyEvents, ['bride', 'entrance']);
  const recessional = findTimelineSong(ceremonyEvents, ['recessional']);

  // Reception highlights
  const grandEntrance = findTimelineSong(receptionEvents, ['grand entrance', 'grand intro', 'introduction']);
  const firstDance = findTimelineSong(receptionEvents, ['first dance']);
  const lastDance = findTimelineSong(receptionEvents, ['last dance']);

  // Preferences → must_plays / do_not_plays + style preferences
  const prefs = vs.preferences || {};
  const dislikesRaw = prefs.dislikes;
  const do_not_plays: string[] = Array.isArray(dislikesRaw)
    ? dislikesRaw.filter(Boolean)
    : typeof dislikesRaw === 'string' && dislikesRaw.trim()
    ? dislikesRaw.split(/\n|,/).map((s: string) => s.trim()).filter(Boolean)
    : [];

  const must_plays: string[] = Array.isArray(prefs.must_plays)
    ? prefs.must_plays.filter(Boolean)
    : Array.isArray(prefs.favorite_examples)
    ? prefs.favorite_examples
        .map((e: any) => [e?.song, e?.artist].filter(Boolean).join(' — '))
        .filter(Boolean)
    : [];

  // Music preferences mapped from style preferences + must/do-not
  const music_preferences: any[] = [];
  if (prefs.favorite_style) {
    music_preferences.push({
      id: `style-1-${vs.id}`,
      music_sheet_id: vs.id,
      type: 'style_preference' as const,
      style_name: prefs.favorite_style,
      created_at: vs.created_at,
    });
  }
  if (prefs.second_favorite_style) {
    music_preferences.push({
      id: `style-2-${vs.id}`,
      music_sheet_id: vs.id,
      type: 'style_preference' as const,
      style_name: prefs.second_favorite_style,
      created_at: vs.created_at,
    });
  }
  must_plays.forEach((song, i) => {
    music_preferences.push({
      id: `must-${i}-${vs.id}`,
      music_sheet_id: vs.id,
      type: 'must_play' as const,
      song_name: song,
      created_at: vs.created_at,
    });
  });
  do_not_plays.forEach((song, i) => {
    music_preferences.push({
      id: `dnp-${i}-${vs.id}`,
      music_sheet_id: vs.id,
      type: 'do_not_play' as const,
      song_name: song,
      created_at: vs.created_at,
    });
  });

  // Extra songs from additional_songs
  const additional = Array.isArray(vs.additional_songs) ? vs.additional_songs : [];
  const extra_songs = additional.map((s: any, i: number) => ({
    id: `extra-${i}-${vs.id}`,
    music_sheet_id: vs.id,
    song_name: s?.song || s?.song_name,
    artist_name: s?.artist || s?.artist_name,
    note: s?.notes || s?.note,
    position: i,
    created_at: vs.created_at,
  }));

  // Group dances
  const gd = vs.group_dances || {};
  const group_dances: any[] = [];
  if (Array.isArray(gd)) {
    gd.forEach((d: any, i: number) => {
      const name = typeof d === 'string' ? d : d?.dance_name || d?.name;
      if (name) {
        group_dances.push({
          id: `gd-${i}-${vs.id}`,
          music_sheet_id: vs.id,
          dance_name: name,
          approved: d?.approved ?? true,
          created_at: vs.created_at,
        });
      }
    });
  } else if (typeof gd === 'object') {
    Object.entries(gd).forEach(([name, val]: [string, any], i) => {
      if (val) {
        group_dances.push({
          id: `gd-${i}-${vs.id}`,
          music_sheet_id: vs.id,
          dance_name: name.replace(/_/g, ' '),
          approved: true,
          created_at: vs.created_at,
        });
      }
    });
  }

  // Grand entrance lineup from grand_intro
  const gi = vs.grand_intro || {};
  const grand_entrance_list: any[] = [];
  if (Array.isArray(gi)) {
    gi.forEach((p: any, i: number) => {
      grand_entrance_list.push({
        id: `gel-${i}-${vs.id}`,
        music_sheet_id: vs.id,
        name: p?.name,
        role: p?.role,
        pairing: p?.pairing,
        position: i,
        created_at: vs.created_at,
      });
    });
  } else if (gi && typeof gi === 'object' && Array.isArray(gi.entries)) {
    gi.entries.forEach((p: any, i: number) => {
      grand_entrance_list.push({
        id: `gel-${i}-${vs.id}`,
        music_sheet_id: vs.id,
        name: p?.name,
        role: p?.role,
        pairing: p?.pairing,
        position: i,
        created_at: vs.created_at,
      });
    });
  }

  return {
    id: vs.id,
    wedding_id: vs.wedding_id,
    processional,
    bride_entrance: brideEntrance,
    recessional,
    grand_entrance: grandEntrance,
    first_dance: firstDance,
    last_dance: lastDance,
    must_plays,
    do_not_plays,
    notes: vs.song_requests || undefined,
    created_at: vs.created_at,
    updated_at: vs.updated_at,
    extra_songs,
    music_preferences,
    group_dances,
    grand_entrance_list,
    // Pass through raw vibe sheet so consumers can render full sections
    ...({
      reception_timeline_events: vs.reception_timeline_events,
      submitted_at: vs.submitted_at,
      _raw: vs,
    } as any),
  };
};

const resolveWeddingId = async (eventOrWeddingId: string): Promise<string | null> => {
  // 1) The Vibe Planner writes vibe_sheets keyed on event_notification_history.id.
  //    Try this first — it's the canonical source going forward.
  const { data: vsDirect } = await supabase
    .from('vibe_sheets')
    .select('wedding_id')
    .eq('wedding_id', eventOrWeddingId)
    .limit(1)
    .maybeSingle();
  if (vsDirect?.wedding_id) return vsDirect.wedding_id;

  // 2) Treat the id as event_notification_history.id and check linked wedding_id
  const { data: enh } = await supabase
    .from('event_notification_history')
    .select('id, wedding_id, couple_name, event_date')
    .eq('id', eventOrWeddingId)
    .maybeSingle();

  if (enh?.wedding_id) return enh.wedding_id;

  // 3) Maybe the caller already passed a weddings.id
  const { data: w } = await supabase
    .from('weddings')
    .select('id')
    .eq('id', eventOrWeddingId)
    .maybeSingle();
  if (w?.id) return w.id;

  // 4) Last-resort fallback: match weddings by couple_name + event_date
  if (enh?.couple_name && enh?.event_date) {
    const { data: weddings } = await supabase
      .from('weddings')
      .select('id, couple_names, wedding_date')
      .eq('wedding_date', enh.event_date)
      .limit(20);
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 &]+/g, '').trim();
    const target = norm(enh.couple_name);
    const match = (weddings || []).find(w => {
      const cn = norm(w.couple_names || '');
      return cn === target || cn.startsWith(target) || target.startsWith(cn);
    });
    if (match) return match.id;
  }

  return null;
};

const loadLegacyMusicSheet = async (weddingId: string): Promise<MusicSheetWithDetails | null> => {
  const { data: musicSheet } = await supabase
    .from('music_sheets')
    .select('*')
    .eq('wedding_id', weddingId)
    .maybeSingle();
  if (!musicSheet) return null;

  const [
    { data: extraSongs },
    { data: musicPreferences },
    { data: groupDances },
    { data: grandEntranceList },
  ] = await Promise.all([
    supabase.from('extra_songs').select('*').eq('music_sheet_id', musicSheet.id).order('position', { ascending: true }).limit(500),
    supabase.from('music_preferences').select('*').eq('music_sheet_id', musicSheet.id).order('created_at', { ascending: false }).limit(500),
    supabase.from('group_dances').select('*').eq('music_sheet_id', musicSheet.id).order('created_at', { ascending: false }).limit(500),
    supabase.from('grand_entrance_list').select('*').eq('music_sheet_id', musicSheet.id).order('position', { ascending: true }).limit(500),
  ]);

  return {
    ...(musicSheet as any),
    extra_songs: extraSongs || [],
    music_preferences: (musicPreferences || []).map((pref: any) => ({
      ...pref,
      type: pref.type as 'must_play' | 'do_not_play' | 'style_preference',
    })),
    group_dances: groupDances || [],
    grand_entrance_list: grandEntranceList || [],
  };
};

export const useContactMusicSheet = (eventOrWeddingId?: string) => {
  return useQuery({
    queryKey: ['contact-music-sheet', eventOrWeddingId],
    queryFn: async () => {
      if (!eventOrWeddingId) return null;

      const weddingId = await resolveWeddingId(eventOrWeddingId);
      if (!weddingId) return null;

      // Primary source: vibe_sheets (couple-submitted via Vibe Planner)
      const { data: vibeSheet } = await supabase
        .from('vibe_sheets')
        .select('*')
        .eq('wedding_id', weddingId)
        .maybeSingle();

      if (vibeSheet) return normalizeVibeSheet(vibeSheet as unknown as VibeSheetRow);

      // Legacy fallback
      return await loadLegacyMusicSheet(weddingId);
    },
    enabled: !!eventOrWeddingId,
    staleTime: 5 * 60 * 1000,
  });
};
