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
  song_count?: number;
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
  upvotes: number;
  downvotes: number;
  score: number;
  userVote?: number; // -1, 0, or 1 for the current user's vote
  preview?: string; // Short preview snippet of the topic content
  replies_count?: number; // Number of replies/discussions under the topic
}

export interface Comment {
  id: number;
  content: string;
  user_id: number;
  username: string;
  topic_id: number;
  created_at: string;
  parent_comment_id?: number;
  upvotes: number;
  downvotes: number;
  score: number;
  userVote?: number; // -1, 0, or 1 for the current user's vote
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

export interface ForumCategory {
  id: number;
  name: string;
  description?: string;
  parent_category_id?: number;
}

export interface Pdf {
  id: number;
  title: string;
  author?: string;
  file_url: string;
  image_url?: string;
  notebook_lm_url?: string;
  summary?: string;
  uploaded_by: number;
  ai_assisted: boolean;
  is_bible_book: boolean;
  themes: string[];
  description?: string;
  is_public: boolean;
  created_at: string;
}

export interface PdfComment {
  id: number;
  pdf_id: number;
  user_id: number;
  username?: string;
  comment: string;
  page_number?: number;
  parent_comment_id?: number;
  created_at: string;
  updated_at: string;
  is_pinned: boolean;
  is_approved: boolean;
  is_edited: boolean;
}

export interface PdfNote {
  id: number;
  pdf_id: number;
  user_id: number;
  note: string;
  page_number?: number;
  created_at: string;
  updated_at: string;
}

export interface PdfRating {
  id: number;
  pdf_id: number;
  user_id: number;
  quality: number;
  theology: number;
  helpfulness: number;
}

