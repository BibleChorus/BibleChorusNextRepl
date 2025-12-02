export interface JourneyProfile {
  id: number;
  user_id: number;
  title: string;
  subtitle: string | null;
  bio: string | null;
  cover_image_url: string | null;
  notebook_lm_url: string | null;
  is_public: boolean;
  show_song_dates: boolean;
  show_play_counts: boolean;
  layout_style: 'timeline' | 'grid' | 'cards';
  likes_count: number;
  created_at: string;
  updated_at: string;
}

export interface PublicJourneyListItem {
  id: number;
  title: string;
  subtitle: string | null;
  cover_image_url: string | null;
  likes_count: number;
  song_count: number;
  username: string;
  profile_image_url: string | null;
  created_at: string;
}

export interface Season {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  year: number | null;
  cover_image_url: string | null;
  display_order: number;
  is_visible: boolean;
  reflection: string | null;
  scripture_reference: string | null;
  theme_color?: string;
  created_at: string;
  updated_at: string;
  songs?: SeasonSong[];
  important_dates?: ImportantDate[];
}

export interface SeasonSong {
  id: number;
  season_id: number;
  song_id: number;
  display_order: number;
  personal_note: string | null;
  significance: string | null;
  added_date: string | null;
  source_url: string | null;
  created_at: string;
  song?: {
    id: number;
    title: string;
    artist: string;
    audio_url: string;
    song_art_url: string | null;
    duration: number;
    play_count?: number;
    created_at?: string;
    journey_date?: string;
    is_journey_song?: boolean;
    journey_song_origin?: 'prior_recording' | 'journal_entry' | 'dream' | 'testimony' | 'life_milestone' | 'prophetic_word' | 'other';
    genres: string[];
    lyrics?: string;
    bible_translation_used?: string;
    bible_verses?: Array<{ book: string; chapter: number; verse: number }>;
    music_origin?: 'human' | 'ai' | 'ai_cover_of_human';
    ai_used_for_lyrics?: boolean;
  };
}

export interface ImportantDate {
  id: number;
  season_id: number;
  title: string;
  description: string | null;
  event_date: string;
  photo_url: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateImportantDateRequest {
  title: string;
  description?: string;
  event_date: string;
  photo_url?: string;
}

export interface UpdateImportantDateRequest {
  title?: string;
  description?: string;
  event_date?: string;
  photo_url?: string;
}

export interface JourneyWithSeasons extends JourneyProfile {
  username: string;
  profile_image_url: string | null;
  seasons: Season[];
}

export interface CreateSeasonRequest {
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  year?: number;
  cover_image_url?: string;
  reflection?: string;
  scripture_reference?: string;
}

export interface UpdateSeasonRequest extends Partial<CreateSeasonRequest> {
  display_order?: number;
  is_visible?: boolean;
}

export interface AddSeasonSongRequest {
  song_id: number;
  personal_note?: string;
  significance?: string;
  added_date?: string;
  source_url?: string;
}

export interface UpdateJourneyProfileRequest {
  title?: string;
  subtitle?: string;
  bio?: string;
  cover_image_url?: string;
  notebook_lm_url?: string;
  is_public?: boolean;
  show_song_dates?: boolean;
  show_play_counts?: boolean;
  layout_style?: 'timeline' | 'grid' | 'cards';
}
