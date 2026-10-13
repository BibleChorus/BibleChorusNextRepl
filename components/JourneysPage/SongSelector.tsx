"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Search, Music, Plus, Loader2 } from "lucide-react";
import { FaExternalLinkAlt } from "react-icons/fa";
import axios from "axios";
import { toast } from "sonner";
import Image from "next/image";
import {
  formatDuration,
  formatJourneyDate,
  journeyMediaUrl,
  safeExternalUrl,
} from "./journey-utils";
import { useAuth } from "@/contexts/AuthContext";

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

const getImageUrl = (path?: string | null) =>
  journeyMediaUrl(path) || "/biblechorus-icon.png";

export const SongSelector: React.FC<SongSelectorProps> = ({
  seasonId,
  onSongAdded,
  onClose,
}) => {
  const { getAuthToken } = useAuth();
  const [songs, setSongs] = useState<Song[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [personalNote, setPersonalNote] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    const fetchSongs = async () => {
      setIsLoading(true);
      try {
        const token = await getAuthToken();
        const response = await axios.get("/api/journeys/user-songs", {
          params: {
            search: searchQuery || undefined,
            exclude_season: seasonId,
          },
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        if (!cancelled) setSongs(response.data);
      } catch (error) {
        if (cancelled || axios.isCancel(error)) return;
        console.error("Error fetching songs:", error);
        toast.error("Failed to load songs");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    setIsLoading(true);
    const timer = window.setTimeout(
      () => void fetchSongs(),
      searchQuery ? 200 : 0,
    );
    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [searchQuery, seasonId, getAuthToken]);

  const handleAddSong = async () => {
    if (!selectedSong) return;
    if (sourceUrl.trim() && !safeExternalUrl(sourceUrl.trim())) {
      toast.error("Please enter a valid http:// or https:// source link");
      return;
    }

    setIsAdding(true);
    try {
      const token = await getAuthToken();
      await axios.post(
        `/api/journeys/seasons/${seasonId}/songs`,
        {
          song_id: selectedSong.id,
          personal_note: personalNote.trim() || undefined,
          source_url: sourceUrl.trim() || undefined,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      toast.success(`"${selectedSong.title}" added to season`);
      onSongAdded();
    } catch (error: any) {
      console.error("Error adding song:", error);
      toast.error(error.response?.data?.error || "Failed to add song");
    } finally {
      setIsAdding(false);
    }
  };

  if (selectedSong) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-6"
      >
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-2xl">
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted flex-shrink-0">
            {selectedSong.song_art_url ? (
              <Image
                src={getImageUrl(selectedSong.song_art_url)}
                alt={selectedSong.title}
                width={64}
                height={64}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-foreground truncate">
              {selectedSong.title}
            </h4>
            <p className="text-sm text-muted-foreground truncate">
              {selectedSong.artist}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatJourneyDate(selectedSong.created_at, "MMM d, yyyy")} ·{" "}
              {formatDuration(selectedSong.duration)}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="journey-song-note"
            className="text-sm font-medium text-foreground"
          >
            Personal Note (optional)
          </label>
          <Textarea
            id="journey-song-note"
            maxLength={2000}
            value={personalNote}
            onChange={(e) => setPersonalNote(e.target.value)}
            placeholder="Add a personal note about this song in this season..."
            className="bg-background min-h-[100px]"
          />
          <p className="text-xs text-muted-foreground">
            This note will appear below the song on your journey page
          </p>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="source-url"
            className="text-sm font-medium text-foreground flex items-center gap-2"
          >
            <FaExternalLinkAlt className="w-3 h-3" />
            Source Hyperlink (optional)
          </Label>
          <Input
            id="source-url"
            type="url"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://example.com/song-origin"
            className="bg-background"
          />
          <p className="text-xs text-muted-foreground">
            Link to the source of origination for this song (e.g., YouTube,
            Spotify, original post)
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setSelectedSong(null)}>
            Back
          </Button>
          <Button
            onClick={handleAddSong}
            disabled={isAdding}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
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
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search your songs"
          placeholder="Search your songs..."
          className="pl-10 bg-background"
        />
      </div>

      <ScrollArea className="flex-1 -mx-6 px-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors text-left"
              >
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {song.song_art_url ? (
                    <Image
                      src={getImageUrl(song.song_art_url)}
                      alt={song.title}
                      width={48}
                      height={48}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-foreground truncate">
                    {song.title}
                  </h4>
                  <p className="text-xs text-muted-foreground truncate">
                    {song.artist}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground text-right flex-shrink-0">
                  <div>{formatJourneyDate(song.created_at, "MMM yyyy")}</div>
                  <div>{formatDuration(song.duration)}</div>
                </div>
                <Plus className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Music className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              {searchQuery
                ? "No songs match your search"
                : "No songs available to add"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery
                ? "Try a different search term"
                : "Upload some songs first!"}
            </p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
