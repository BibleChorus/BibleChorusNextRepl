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
  artist: string;
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
  // Add any other fields as needed
}

export interface User {
  id: number;
  username: string;
  email: string;
  profile_image_url?: string;
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
}

export interface Comment {
  id: number;
  content: string;
  user_id: number;
  username: string;
  topic_id: number;
  created_at: string;
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