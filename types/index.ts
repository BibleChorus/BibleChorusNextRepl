// TypeScript interface for a Playlist object
export interface Playlist {
  id: number;
  name: string;
  user_id: number;
  is_public: boolean;
  created_at: string;
  cover_art_url: string | null;
  description: string | null;
  last_updated: string;
  tags: string[];
  collaborative: boolean;
  last_played_at: string | null;
  is_auto: boolean;
  auto_criteria: any;
}
