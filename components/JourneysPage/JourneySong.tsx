"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  BookOpen,
  ExternalLink,
  Music,
  Pause,
  Play,
  Headphones,
} from "lucide-react";
import { SeasonSong } from "@/types/journey";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import LyricsBibleComparisonDialog from "@/components/ListenPage/LyricsBibleComparisonDialog";
import { JourneySplitPanel } from "./JourneySplitPanel";
import {
  formatDuration,
  formatJourneyDate,
  humanizeOrigin,
  journeyMediaUrl,
  journeyPlayerSong,
  safeExternalUrl,
} from "./journey-utils";
import { cn } from "@/lib/utils";

interface JourneySongProps {
  seasonSong: SeasonSong;
  showPlayCount?: boolean;
  showDate?: boolean;
  themeColor?: string;
  trackNumber?: number;
  allJourneySongs?: SeasonSong[];
}

export const JourneySong: React.FC<JourneySongProps> = ({
  seasonSong,
  showPlayCount = false,
  showDate = true,
  trackNumber = 1,
  allJourneySongs = [],
}) => {
  const { playSong, currentSong, isPlaying, pause, resume } = useMusicPlayer();
  const [showLyrics, setShowLyrics] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const [showArt, setShowArt] = useState(false);
  const song = seasonSong.song;
  if (!song) return null;

  const art = journeyMediaUrl(song.song_art_url);
  const source = safeExternalUrl(seasonSong.source_url);
  const active = currentSong?.id === song.id;
  const playing = active && isPlaying;
  const hasLyrics = Boolean(song.lyrics?.trim() || song.bible_verses?.length);
  const hasContext = Boolean(
    seasonSong.personal_note?.trim() ||
    seasonSong.significance?.trim() ||
    song.journey_song_origin ||
    source,
  );
  const date = formatJourneyDate(song.journey_date || song.created_at);

  const handlePlay = () => {
    if (active) {
      if (isPlaying) pause();
      else resume();
      return;
    }
    const queue = allJourneySongs.flatMap((item) =>
      item.song ? [journeyPlayerSong(item.song)] : [],
    );
    playSong(journeyPlayerSong(song), queue.length ? queue : undefined);
  };

  return (
    <article
      className={cn(
        "surface-card overflow-hidden transition-colors",
        active && "border-primary/45 ring-1 ring-primary/10",
      )}
    >
      <JourneySplitPanel
        music={
          <div className="space-y-5">
            <div className="flex gap-4">
              {art ? (
                <button
                  onClick={() => setShowArt(true)}
                  className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`View artwork for ${song.title}`}
                >
                  <Image
                    src={art}
                    alt={song.title}
                    fill
                    sizes="80px"
                    className="object-cover transition-transform duration-500 hover:scale-105"
                  />
                </button>
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-border bg-primary/10 text-primary">
                  <Music className="h-7 w-7" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-mono tabular-nums">
                    {String(trackNumber).padStart(2, "0")}
                  </span>
                  <span>·</span>
                  <span>{formatDuration(song.duration)}</span>
                  {active && (
                    <span className="ml-auto text-primary">
                      {playing ? "Playing" : "Paused"}
                    </span>
                  )}
                </div>
                <h3
                  className={cn(
                    "text-lg font-semibold leading-snug",
                    active && "text-primary",
                  )}
                >
                  {song.title}
                </h3>
                {song.artist && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {song.artist}
                  </p>
                )}
                {showDate && date && (
                  <p className="mt-2 text-xs text-muted-foreground">{date}</p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                onClick={handlePlay}
                variant={playing ? "secondary" : "default"}
                aria-label={`${playing ? "Pause" : "Play"} ${song.title}`}
              >
                {playing ? (
                  <Pause className="mr-2 h-3.5 w-3.5" />
                ) : (
                  <Play className="mr-2 h-3.5 w-3.5" />
                )}
                {playing ? "Pause" : "Listen"}
              </Button>
              {hasLyrics && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowLyrics(true)}
                >
                  <BookOpen className="mr-2 h-3.5 w-3.5" />
                  Lyrics & scripture
                </Button>
              )}
              {showPlayCount && song.play_count !== undefined && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Headphones className="h-3.5 w-3.5" />
                  {Number(song.play_count).toLocaleString()} plays
                </span>
              )}
            </div>
            {(song.music_origin || song.ai_used_for_lyrics !== undefined) && (
              <div className="flex flex-wrap gap-x-3 gap-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
                {song.music_origin && (
                  <span>Music: {humanizeOrigin(song.music_origin)}</span>
                )}
                {song.ai_used_for_lyrics !== undefined && (
                  <span>
                    Lyrics:{" "}
                    {song.ai_used_for_lyrics ? "AI written" : "Human written"}
                  </span>
                )}
              </div>
            )}
          </div>
        }
        context={
          hasContext ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                  Behind the song
                </p>
                {source && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-primary"
                    onClick={() => setShowSource(true)}
                  >
                    View source
                    <ExternalLink className="ml-1.5 h-3 w-3" />
                  </Button>
                )}
              </div>
              {song.journey_song_origin && (
                <p className="text-xs font-medium text-muted-foreground">
                  {humanizeOrigin(song.journey_song_origin)}
                </p>
              )}
              {seasonSong.personal_note?.trim() && (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">
                  {seasonSong.personal_note}
                </p>
              )}
              {seasonSong.significance?.trim() && (
                <div className="border-l-2 border-primary/25 pl-3">
                  <p className="whitespace-pre-wrap text-sm italic leading-relaxed text-muted-foreground">
                    {seasonSong.significance}
                  </p>
                </div>
              )}
            </div>
          ) : undefined
        }
      />
      {showLyrics && (
        <LyricsBibleComparisonDialog
          isOpen={showLyrics}
          onClose={() => setShowLyrics(false)}
          song={song}
        />
      )}
      <Dialog open={showSource} onOpenChange={setShowSource}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Original source</DialogTitle>
            <DialogDescription>
              This link was provided by the journey creator.
            </DialogDescription>
          </DialogHeader>
          <p className="break-all rounded-xl border border-border bg-muted p-4 text-sm text-muted-foreground">
            {seasonSong.source_url}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowSource(false)}>
              Cancel
            </Button>
            {source && (
              <Button asChild>
                <a
                  href={source}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowSource(false)}
                >
                  Open source
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={showArt} onOpenChange={setShowArt}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-auto">
          <DialogHeader>
            <DialogTitle>{song.title}</DialogTitle>
            <DialogDescription>
              {song.artist || "Song artwork"}
            </DialogDescription>
          </DialogHeader>
          {art && (
            <div className="relative aspect-square w-full">
              <Image
                src={art}
                alt={song.title}
                fill
                sizes="(max-width: 768px) 90vw, 600px"
                className="object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </article>
  );
};
