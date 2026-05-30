export interface ExtraSong {
  id: string;
  music_sheet_id: string;
  song_name?: string;
  artist_name?: string;
  note?: string;
  position?: number;
  created_at: string;
}

export interface MusicPreference {
  id: string;
  music_sheet_id: string;
  type: 'must_play' | 'do_not_play' | 'style_preference';
  style_name?: string;
  song_name?: string;
  artist_name?: string;
  created_at: string;
}

export interface GroupDance {
  id: string;
  music_sheet_id: string;
  dance_name?: string;
  approved: boolean;
  created_at: string;
}

export interface GrandEntranceItem {
  id: string;
  music_sheet_id: string;
  name?: string;
  role?: string;
  pairing?: string;
  position?: number;
  created_at: string;
}

export interface MusicSheet {
  id: string;
  wedding_id: string;
  processional?: string;
  bride_entrance?: string;
  recessional?: string;
  grand_entrance?: string;
  first_dance?: string;
  last_dance?: string;
  must_plays?: string[];
  do_not_plays?: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MusicSheetWithDetails extends MusicSheet {
  extra_songs?: ExtraSong[];
  music_preferences?: MusicPreference[];
  group_dances?: GroupDance[];
  grand_entrance_list?: GrandEntranceItem[];
}
