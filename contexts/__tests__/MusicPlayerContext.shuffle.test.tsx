import React, { ReactNode } from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import axios from 'axios';
import { MusicPlayerProvider, useMusicPlayer, MusicPlayerSong } from '../MusicPlayerContext';
import { FilterContext, FilterCriteria } from '../FilterContext';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock song data
const mockSong1: MusicPlayerSong = { id: 1, title: 'Song 1', artist: 'Artist 1', audioUrl: 'url1', uploaded_by: 1, audio_url: 'url1' };
const mockSong2: MusicPlayerSong = { id: 2, title: 'Song 2', artist: 'Artist 2', audioUrl: 'url2', uploaded_by: 1, audio_url: 'url2' };
const mockSong3: MusicPlayerSong = { id: 3, title: 'Song 3', artist: 'Artist 3', audioUrl: 'url3', uploaded_by: 1, audio_url: 'url3' };
const mockPlaylistSongs = [mockSong1, mockSong2];
const mockFilteredSongs = [mockSong2, mockSong3];
const mockAllSongs = [mockSong1, mockSong2, mockSong3];

interface MockFilterProviderProps {
  children: ReactNode;
  activePlaylistId?: string | null;
  filters?: FilterCriteria;
}

const MockFilterProvider: React.FC<MockFilterProviderProps> = ({
  children,
  activePlaylistId = null,
  filters = {},
}) => {
  return (
    <FilterContext.Provider
      value={{
        filters,
        setFilters: jest.fn(),
        activePlaylistId,
        setActivePlaylistId: jest.fn(),
      }}
    >
      {children}
    </FilterContext.Provider>
  );
};

const renderMusicPlayerHook = (
  initialFilters?: { activePlaylistId?: string | null; filters?: FilterCriteria }
) => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MockFilterProvider
      activePlaylistId={initialFilters?.activePlaylistId}
      filters={initialFilters?.filters}
    >
      <MusicPlayerProvider>{children}</MusicPlayerProvider>
    </MockFilterProvider>
  );
  return renderHook(() => useMusicPlayer(), { wrapper });
};

describe('MusicPlayerContext Shuffle Functionality', () => {
  beforeEach(() => {
    mockedAxios.get.mockReset();
    // Ensure a default mock for any unexpected calls, though specific tests will override.
    mockedAxios.get.mockResolvedValue({ data: { songs: [] } }); 
  });

  test('should fetch and shuffle songs from an active playlist', async () => {
    const playlistId = 'playlist123';
    mockedAxios.get.mockResolvedValueOnce({ data: { songs: mockPlaylistSongs } });

    const { result, waitForNextUpdate } = renderMusicPlayerHook({ activePlaylistId: playlistId });

    await act(async () => {
      result.current.toggleShuffle();
      await waitForNextUpdate(); // Wait for state updates after fetch
    });

    expect(mockedAxios.get).toHaveBeenCalledWith(`/api/songs?playlist_id=${playlistId}&limit=10000`);
    expect(result.current.isShuffling).toBe(true);
    expect(result.current.queue).toEqual(mockPlaylistSongs);
  });

  test('should fetch and shuffle songs based on active filters', async () => {
    const filters: FilterCriteria = { genres: ['Rock'], search: 'test' };
    // URLSearchParams correctly stringifies arrays with multiple entries for the same key
    const expectedQuery = new URLSearchParams({ ...filters, limit: '10000' } as Record<string, string | string[]>).toString();
    mockedAxios.get.mockResolvedValueOnce({ data: { songs: mockFilteredSongs } });

    const { result, waitForNextUpdate } = renderMusicPlayerHook({ filters });

    await act(async () => {
      result.current.toggleShuffle();
      await waitForNextUpdate();
    });
    
    expect(mockedAxios.get).toHaveBeenCalledWith(`/api/songs?${expectedQuery}`);
    expect(result.current.isShuffling).toBe(true);
    expect(result.current.queue).toEqual(mockFilteredSongs);
  });

  test('should fetch and shuffle all songs if no playlist or filters are active', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { songs: mockAllSongs } });
    const { result, waitForNextUpdate } = renderMusicPlayerHook();

    await act(async () => {
      result.current.toggleShuffle();
      await waitForNextUpdate();
    });

    expect(mockedAxios.get).toHaveBeenCalledWith('/api/songs?limit=10000');
    expect(result.current.isShuffling).toBe(true);
    expect(result.current.queue).toEqual(mockAllSongs);
  });

  test('toggling shuffle off should keep the current queue and set isShuffling to false', async () => {
    const playlistId = 'playlist123';
    mockedAxios.get.mockResolvedValueOnce({ data: { songs: mockPlaylistSongs } });
    const { result, waitForNextUpdate } = renderMusicPlayerHook({ activePlaylistId: playlistId });

    // Turn shuffle on
    await act(async () => {
      result.current.toggleShuffle();
      await waitForNextUpdate();
    });

    expect(result.current.isShuffling).toBe(true);
    expect(result.current.queue).toEqual(mockPlaylistSongs);

    // Turn shuffle off
    await act(async () => {
      result.current.toggleShuffle();
      // No waitForNextUpdate needed if it's a synchronous state change only
    });

    expect(result.current.isShuffling).toBe(false);
    expect(result.current.queue).toEqual(mockPlaylistSongs); // Queue should remain
    expect(mockedAxios.get).toHaveBeenCalledTimes(1); // No new API call

    // Test sequential playback
    act(() => {
      // Ensure a song is "playing" to test 'next'
      // playSong will set currentSong and currentIndex
      if (result.current.queue.length > 0) {
        result.current.playSong(result.current.queue[0], result.current.queue);
      }
    });
    
    // Assuming mockPlaylistSongs has at least 2 songs [mockSong1, mockSong2]
    expect(result.current.currentSong?.id).toBe(mockSong1.id);
    act(() => {
      result.current.next();
    });
    expect(result.current.currentSong?.id).toBe(mockSong2.id); 
  });
  
  test('shuffle should maintain current song if it exists in the new shuffled list', async () => {
    const playlistId = 'playlistWithCurrentSong';
    const songsForPlaylist = [mockSong1, mockSong2, mockSong3]; // mockSong2 is current
    mockedAxios.get.mockResolvedValueOnce({ data: { songs: songsForPlaylist } });

    const { result, waitForNextUpdate } = renderMusicPlayerHook({ activePlaylistId: playlistId });

    // Set an initial current song
    act(() => {
      result.current.playSong(mockSong2, [mockSong2]); // Minimal initial queue
    });
    
    expect(result.current.currentSong?.id).toBe(mockSong2.id);

    await act(async () => {
      result.current.toggleShuffle();
      await waitForNextUpdate();
    });

    expect(result.current.isShuffling).toBe(true);
    expect(result.current.queue).toEqual(songsForPlaylist);
    expect(result.current.currentSong?.id).toBe(mockSong2.id);
    // Check if currentIndex points to mockSong2 in the new queue
    expect(result.current.queue[result.current.currentIndex]?.id).toBe(mockSong2.id);
  });

  test('shuffle should play the first song of the new list if current song is not in it', async () => {
    const playlistId = 'playlistWithoutCurrentSong';
    const songsForPlaylist = [mockSong1, mockSong3]; // Does not include mockSong2
    mockedAxios.get.mockResolvedValueOnce({ data: { songs: songsForPlaylist } });

    const { result, waitForNextUpdate } = renderMusicPlayerHook({ activePlaylistId: playlistId });

    // Set an initial current song that won't be in the fetched list
    act(() => {
      result.current.playSong(mockSong2, [mockSong2]); 
    });
    expect(result.current.currentSong?.id).toBe(mockSong2.id);

    await act(async () => {
      result.current.toggleShuffle();
      await waitForNextUpdate();
    });
    
    expect(result.current.isShuffling).toBe(true);
    expect(result.current.queue).toEqual(songsForPlaylist);
    expect(result.current.currentSong?.id).toBe(songsForPlaylist[0].id); // Should be the first song
    expect(result.current.currentIndex).toBe(0);
  });

  test('playSong with playlistIdContext should update activePlaylistId in FilterContext', async () => {
    // This test verifies the interaction between playSong and FilterContext
    // For this, we need to spy on setActivePlaylistId from our MockFilterProvider
    const mockSetActivePlaylistId = jest.fn();
    const playlistIdToSet = 'newPlaylistCtx';

    const wrapper = ({ children }: { children: ReactNode }) => (
      <FilterContext.Provider
        value={{
          filters: {},
          setFilters: jest.fn(),
          activePlaylistId: null,
          setActivePlaylistId: mockSetActivePlaylistId, // Use the spy
        }}
      >
        <MusicPlayerProvider>{children}</MusicPlayerProvider>
      </FilterContext.Provider>
    );
    const { result } = renderHook(() => useMusicPlayer(), { wrapper });

    act(() => {
      result.current.playSong(mockSong1, [mockSong1, mockSong2], playlistIdToSet);
    });

    expect(mockSetActivePlaylistId).toHaveBeenCalledWith(playlistIdToSet);
  });

  test('should handle API error when fetching songs for shuffle', async () => {
    const playlistId = 'playlistErrorCase';
    mockedAxios.get.mockRejectedValueOnce(new Error('Network Error'));

    const { result, waitForNextUpdate } = renderMusicPlayerHook({ activePlaylistId: playlistId });

    // Set an initial queue to see if it gets cleared or preserved based on error handling
    act(() => {
      result.current.playSong(mockSong1, [mockSong1, mockSong2]);
    });
    const initialQueue = result.current.queue;

    await act(async () => {
      result.current.toggleShuffle();
      // Wait for potential state updates if error handling logic sets state
      // If toggleShuffle immediately returns or doesn't update state on error, 
      // this might not be strictly necessary but good for robustness.
      // await waitForNextUpdate(); // This might time out if no state update occurs on error path for queue
    });
    
    expect(mockedAxios.get).toHaveBeenCalledWith(`/api/songs?playlist_id=${playlistId}&limit=10000`);
    expect(result.current.isShuffling).toBe(true); // isShuffling state should still toggle
    // The current toggleShuffle implementation, upon fetch error, results in an empty songsForShuffle list.
    // Then it sets queue to [], currentSong to null, currentIndex to 0.
    expect(result.current.queue).toEqual([]); 
    expect(result.current.currentSong).toBeNull();
    expect(result.current.currentIndex).toBe(0);
  });
});
