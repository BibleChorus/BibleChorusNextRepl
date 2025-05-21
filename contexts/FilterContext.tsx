import React, { createContext, useState, useContext, ReactNode } from 'react';

// Define the shape of your filter criteria based on pages/api/songs/index.ts
export interface FilterCriteria {
  lyricsAdherence?: string | string[]; // Can be single or multiple (though API seems to take string or string[])
  isContinuous?: 'true' | 'false' | 'all';
  aiMusic?: 'true' | 'false' | 'all';
  genres?: string[]; // Assuming genres are multi-select
  aiUsedForLyrics?: 'true' | 'false' | 'all';
  musicModelUsed?: string;
  title?: string; // For searching by title
  artist?: string; // For searching by artist
  bibleTranslation?: string;
  bibleBooks?: string[]; // Assuming bibleBooks are multi-select
  bibleChapters?: string[]; // Format: "Book:Chapter" e.g. ["Genesis:1", "Exodus:3"]
  bibleVerses?: string[]; // Format: "Book:Chapter:Verse" e.g. ["Genesis:1:1", "Exodus:3:14"]
  search?: string; // General search query
  // Fields like showLikedSongs, showMySongs are often user-specific toggles rather than general filters
  // sortBy and sortOrder are for sorting, not typically part of "filters" for fetching a song list for shuffle context
}

interface FilterContextType {
  filters: FilterCriteria;
  setFilters: (newFilters: FilterCriteria) => void;
  activePlaylistId: string | null;
  setActivePlaylistId: (playlistId: string | null) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [filters, setFilters] = useState<FilterCriteria>({});
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);

  const handleSetFilters = (newFilters: FilterCriteria) => {
    setFilters(newFilters); // Overwrite with new filters as per example
    // If new filters are being applied (not just clearing), clear activePlaylistId.
    // This ensures that if a user applies a filter, the shuffle context switches from playlist to filter.
    if (Object.keys(newFilters).length > 0) {
        setActivePlaylistId(null);
    }
  };

  const handleSetActivePlaylistId = (playlistId: string | null) => {
    setActivePlaylistId(playlistId);
    // If a playlist is set, clear filters.
    // This ensures that if a user plays a playlist, the shuffle context switches from filter to playlist.
    if (playlistId) {
        setFilters({});
    }
  };

  return (
    <FilterContext.Provider value={{ filters, setFilters: handleSetFilters, activePlaylistId, setActivePlaylistId: handleSetActivePlaylistId }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = (): FilterContextType => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
};
