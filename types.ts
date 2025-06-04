export interface Playlist {
  id: number;
  name: string;
  description?: string;
  is_public: boolean;
  is_auto: boolean;
  tags: string[];
  cover_art_url?: string;
  user_id: number;
  creator_username?: string;
}

export interface Song {
  id: number;
  title: string;
  artist?: string;
  audio_url: string;
  uploaded_by: number;
  username: string;
  genres: string[];
  created_at: string;
  song_art_url?: string;
  bible_translation_used?: string;
  lyrics_scripture_adherence?: string;
  is_continuous_passage?: boolean;
  bible_verses?: { book: string; chapter: number; verse: number }[];
  duration: number; // Duration of the song in seconds
  lyrics?: string; // Full lyrics of the song
  lyric_ai_prompt?: string; // AI prompt used for generating lyrics (if applicable)
  music_ai_prompt?: string; // AI prompt used for generating music (if applicable)
  music_model_used?: string; // AI model used for music generation (if applicable)
  ai_used_for_lyrics?: boolean; // Indicates if AI was used to generate lyrics
  music_ai_generated?: boolean; // Indicates if AI was used to generate music
  play_count?: number; // Number of times the song has been played
  is_new?: boolean; // Indicates if the song is unread by relevant users
  comments_count?: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
  profile_image_url?: string;
  is_admin: boolean;
  is_moderator: boolean;
  region?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  name?: string;
  email_verified: boolean;
  last_login?: string;
  bio?: string;
  website?: string;
  preferences?: any; // Consider creating a more specific type for preferences
}

export interface Topic {
  id: number;
  title: string;
  content: string;
  user_id: number;
  username: string;
  created_at: string;
  song_id?: number;
  comments?: Comment[];
  category?: string;
  category_id?: number;
  profile_image_url?: string;
}

export interface Comment {
  id: number;
  content: string;
  user_id: number;
  username: string;
  topic_id: number;
  created_at: string;
  parent_comment_id?: number;
}

export interface SongComment {
  id: number;
  comment: string;
  user_id: number;
  username: string;
  song_id: number;
  parent_comment_id?: number;
  created_at: string;
  // Add any other fields as needed
}

export interface Teaching {
  id: number;
  title: string;
  slug: string;
  description?: string;
  pdf_url: string;
  pdf_text?: string;
  based_on_type: 'theme' | 'passage';
  reference?: string;
  ai_generated: boolean;
  ai_prompt?: string;
  ai_model_used?: string;
  tags?: string[];
  language?: string;
  uploaded_by?: number;
  view_count?: number;
  rating_total?: number;
  rating_count?: number;
  created_at: string;
  updated_at: string;
}

export interface TeachingComment {
  id: number;
  teaching_id: number;
  user_id: number;
  username: string;
  comment: string;
  likes?: number;
  parent_comment_id?: number;
  is_edited?: boolean;
  sentiment?: string;
  contains_scripture_reference?: boolean;
  is_approved?: boolean;
  is_pinned?: boolean;
  created_at: string;
  updated_at: string;
}

export interface ForumCategory {
  id: number;
  name: string;
  description?: string;
  parent_category_id?: number;
}
