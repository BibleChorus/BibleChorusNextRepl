'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Search, Music, Plus, Check, Loader2 } from 'lucide-react';
import { FaExternalLinkAlt } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'sonner';
import Image from 'next/image';
import { format, parseISO } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

interface Song {
  id: number;
  title: string;
  artist: string;
  audio_url: string;
  song_art_url: string | null;
  duration: number;
  genres: string[];
  created_at: string;
}

interface SongSelectorProps {
  seasonId: number;
  onSongAdded: () => void;
  onClose: () => void;
}

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || '';

export const SongSelector: React.FC<SongSelectorProps> = ({
  seasonId,
  onSongAdded,
  onClose,
}) => {
  const { getAuthToken } = useAuth();
  const [songs, setSongs] = useState<Song[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [personalNote, setPersonalNote] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const fetchSongs = async () => {
      setIsLoading(true);
      try {
        const token = await getAuthToken();
        const response = await axios.get('/api/journeys/user-songs', {
          params: {
            search: searchQuery || undefined,
            exclude_season: seasonId,
          },
          headers: { Authorization: `Bearer ${token}` },
        });
        setSongs(response.data);
      } catch (error) {
        console.error('Error fetching songs:', error);
        toast.error('Failed to load songs');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSongs();
  }, [searchQuery, seasonId, getAuthToken]);

  const handleAddSong = async () => {
    if (!selectedSong) return;

    setIsAdding(true);
    try {
      const token = await getAuthToken();
      await axios.post(`/api/journeys/seasons/${seasonId}/songs`, {
        song_id: selectedSong.id,
        personal_note: personalNote || undefined,
        source_url: sourceUrl || undefined,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(`"${selectedSong.title}" added to season`);
      onSongAdded();
    } catch (error: any) {
      console.error('Error adding song:', error);
      toast.error(error.response?.data?.error || 'Failed to add song');
    } finally {
      setIsAdding(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (selectedSong) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-6"
      >
        <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl">
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700 flex-shrink-0">
            {selectedSong.song_art_url ? (
              <Image
                src={`${CDN_URL}${selectedSong.song_art_url}`}
                alt={selectedSong.title}
                width={64}
                height={64}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music className="w-6 h-6 text-slate-400" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 truncate">
              {selectedSong.title}
            </h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
              {selectedSong.artist}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {format(parseISO(selectedSong.created_at), 'MMM d, yyyy')} · {formatDuration(selectedSong.duration)}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Personal Note (optional)
          </label>
          <Textarea
            value={personalNote}
            onChange={(e) => setPersonalNote(e.target.value)}
            placeholder="Add a personal note about this song in this season..."
            className="bg-white dark:bg-slate-800 min-h-[100px]"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            This note will appear below the song on your journey page
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="source-url" className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <FaExternalLinkAlt className="w-3 h-3" />
            Source Hyperlink (optional)
          </Label>
          <Input
            id="source-url"
            type="url"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://example.com/song-origin"
            className="bg-white dark:bg-slate-800"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Link to the source of origination for this song (e.g., YouTube, Spotify, original post)
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setSelectedSong(null)}>
            Back
          </Button>
          <Button
            onClick={handleAddSong}
            disabled={isAdding}
            className="bg-gradient-to-r from-indigo-500 to-purple-500"
          >
            {isAdding ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add to Season
              </>
            )}
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search your songs..."
          className="pl-10 bg-white dark:bg-slate-800"
        />
      </div>

      <ScrollArea className="flex-1 -mx-6 px-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : songs.length > 0 ? (
          <div className="space-y-2 pr-2">
            {songs.map((song) => (
              <motion.button
                key={song.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setSelectedSong(song)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors text-left"
              >
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700 flex-shrink-0">
                  {song.song_art_url ? (
                    <Image
                      src={`${CDN_URL}${song.song_art_url}`}
                      alt={song.title}
                      width={48}
                      height={48}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="w-5 h-5 text-slate-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-slate-800 dark:text-slate-200 truncate">
                    {song.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {song.artist}
                  </p>
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500 text-right flex-shrink-0">
                  <div>{format(parseISO(song.created_at), 'MMM yyyy')}</div>
                  <div>{formatDuration(song.duration)}</div>
                </div>
                <Plus className="w-4 h-4 text-slate-400 flex-shrink-0" />
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Music className="w-12 h-12 mx-auto mb-4 text-slate-400 opacity-50" />
            <p className="text-slate-500 dark:text-slate-400">
              {searchQuery ? 'No songs match your search' : 'No songs available to add'}
            </p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
              {searchQuery ? 'Try a different search term' : 'Upload some songs first!'}
            </p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
