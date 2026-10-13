import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Repeat1,
  Shuffle,
  ListMusic,
  Maximize2,
  Minimize2,
  BookOpenText,
} from "lucide-react";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useSidebar } from "@/contexts/SidebarContext";
import { useRouter } from "next/router";
import LyricsBibleComparisonDialog from "@/components/ListenPage/LyricsBibleComparisonDialog";
import { SongOptionsMenu } from "@/components/SongOptionsMenu";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import type { Song } from "@/types";

function timeLabel(time: number) {
  const safe = Number.isFinite(time) ? Math.max(0, time) : 0;
  return `${Math.floor(safe / 60)}:${String(Math.floor(safe % 60)).padStart(2, "0")}`;
}
export default function FloatingMusicPlayer() {
  const {
    currentSong,
    currentIndex,
    isPlaying,
    pause,
    resume,
    next,
    previous,
    toggleShuffle,
    toggleRepeat,
    isShuffling,
    repeatMode,
    queue,
    playSong,
    audioElement,
    isMinimized,
    setIsMinimized,
  } = useMusicPlayer();
  const { isOpen } = useSidebar();
  const router = useRouter();
  const [progress, setProgress] = useState({ time: 0, duration: 0 });
  const [queueOpen, setQueueOpen] = useState(false);
  const [lyricsOpen, setLyricsOpen] = useState(false);
  useEffect(() => {
    if (!audioElement) return;
    const update = () =>
      setProgress({
        time: audioElement.currentTime || 0,
        duration: Number.isFinite(audioElement.duration)
          ? audioElement.duration
          : 0,
      });
    update();
    audioElement.addEventListener("timeupdate", update);
    audioElement.addEventListener("loadedmetadata", update);
    audioElement.addEventListener("emptied", update);
    return () => {
      audioElement.removeEventListener("timeupdate", update);
      audioElement.removeEventListener("loadedmetadata", update);
      audioElement.removeEventListener("emptied", update);
    };
  }, [audioElement, currentSong?.id]);
  if (!currentSong) return null;
  const optionsSong: Song = {
    username: "",
    genres: [],
    created_at: "",
    duration: 0,
    ai_used_for_lyrics: false,
    music_ai_generated: false,
    ...currentSong,
    artist: currentSong.artist || "",
    song_art_url: currentSong.coverArtUrl,
  };
  const left =
    router.pathname === "/login" ? "" : isOpen ? "lg:left-64" : "lg:left-20";
  return (
    <>
      <section
        aria-label="Music player"
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 shadow-[0_-8px_30px_rgba(0,0,0,.06)] backdrop-blur-xl",
          left,
        )}
      >
        <div className="mx-auto max-w-[1500px] px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 sm:px-6">
          <div className="flex items-center gap-4">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                <Image
                  src={mediaUrl(currentSong.coverArtUrl, "/default-cover.jpg")}
                  fill
                  sizes="48px"
                  className="object-cover"
                  alt=""
                />
              </div>
              <div className="min-w-0">
                <Link
                  href={`/Songs/${currentSong.id}`}
                  className="block truncate text-sm font-semibold hover:text-primary"
                >
                  {currentSong.title}
                </Link>
                {currentSong.uploaded_by > 0 ? (
                  <Link
                    href={`/profile?id=${currentSong.uploaded_by}`}
                    className="block truncate text-xs text-muted-foreground hover:text-primary"
                  >
                    {currentSong.artist}
                  </Link>
                ) : (
                  <p className="truncate text-xs text-muted-foreground">
                    {currentSong.artist}
                  </p>
                )}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                className={cn(
                  "icon-button hidden sm:inline-flex",
                  isShuffling && "bg-primary/10 text-primary",
                )}
                onClick={toggleShuffle}
                title="Shuffle"
                aria-label="Shuffle"
                aria-pressed={isShuffling}
              >
                <Shuffle className="h-4 w-4" />
              </button>
              <button
                className="icon-button hidden sm:inline-flex"
                onClick={previous}
                aria-label="Previous song"
              >
                <SkipBack className="h-5 w-5" />
              </button>
              <button
                className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={isPlaying ? pause : resume}
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </button>
              <button
                className="icon-button"
                onClick={next}
                aria-label="Next song"
              >
                <SkipForward className="h-5 w-5" />
              </button>
              <button
                className={cn(
                  "icon-button hidden sm:inline-flex",
                  repeatMode !== "none" && "bg-primary/10 text-primary",
                )}
                onClick={toggleRepeat}
                title={`Repeat: ${repeatMode}`}
                aria-label={`Repeat: ${repeatMode}`}
                aria-pressed={repeatMode !== "none"}
              >
                {repeatMode === "one" ? (
                  <Repeat1 className="h-4 w-4" />
                ) : (
                  <Repeat className="h-4 w-4" />
                )}
              </button>
            </div>
            <div className="hidden shrink-0 items-center gap-1 md:flex">
              <button
                className="icon-button"
                onClick={() => setQueueOpen(true)}
                title="Up next"
                aria-label="Open playback queue"
              >
                <ListMusic className="h-5 w-5" />
              </button>
              <button
                className="icon-button"
                onClick={() => setLyricsOpen(true)}
                title="Lyrics & scripture"
                aria-label="Compare lyrics and scripture"
              >
                <BookOpenText className="h-5 w-5" />
              </button>
              <SongOptionsMenu song={optionsSong} />
            </div>
            <button
              className="icon-button"
              onClick={() => setIsMinimized(!isMinimized)}
              aria-label={isMinimized ? "Expand player" : "Minimize player"}
            >
              {isMinimized ? (
                <Maximize2 className="h-4 w-4" />
              ) : (
                <Minimize2 className="h-4 w-4" />
              )}
            </button>
          </div>
          <div
            className={cn(
              "mt-2 flex items-center gap-3 text-[10px] tabular-nums text-muted-foreground",
              isMinimized && "hidden",
            )}
          >
            <span>{timeLabel(progress.time)}</span>
            <input
              type="range"
              aria-label="Seek playback position"
              min={0}
              max={progress.duration || 0}
              step="0.1"
              value={Math.min(progress.time, progress.duration)}
              disabled={!progress.duration}
              onChange={(event) => {
                if (audioElement)
                  audioElement.currentTime = Number(event.target.value);
              }}
              className="h-4 min-w-0 flex-1 cursor-pointer"
            />
            <span>{timeLabel(progress.duration)}</span>
          </div>
          {!isMinimized && (
            <div className="mt-1 flex justify-center gap-1 md:hidden">
              <button
                className="icon-button"
                onClick={previous}
                aria-label="Previous song"
              >
                <SkipBack className="h-4 w-4" />
              </button>
              <button
                className={cn("icon-button", isShuffling && "text-primary")}
                onClick={toggleShuffle}
                aria-label="Shuffle"
                aria-pressed={isShuffling}
              >
                <Shuffle className="h-4 w-4" />
              </button>
              <button
                className={cn(
                  "icon-button",
                  repeatMode !== "none" && "text-primary",
                )}
                onClick={toggleRepeat}
                aria-label={`Repeat: ${repeatMode}`}
              >
                {repeatMode === "one" ? (
                  <Repeat1 className="h-4 w-4" />
                ) : (
                  <Repeat className="h-4 w-4" />
                )}
              </button>
              <button
                className="icon-button"
                onClick={() => setQueueOpen(true)}
                aria-label="Open playback queue"
              >
                <ListMusic className="h-4 w-4" />
              </button>
              <button
                className="icon-button"
                onClick={() => setLyricsOpen(true)}
                aria-label="Compare lyrics and scripture"
              >
                <BookOpenText className="h-4 w-4" />
              </button>
              <SongOptionsMenu song={optionsSong} />
            </div>
          )}
        </div>
      </section>
      <Dialog open={queueOpen} onOpenChange={setQueueOpen}>
        <DialogContent className="max-w-lg">
          <DialogTitle className="font-serif text-2xl">Up next</DialogTitle>
          <DialogDescription>
            {queue.length} songs in your listening queue.
          </DialogDescription>
          <div className="max-h-[55vh] space-y-1 overflow-y-auto">
            {queue.map((song, index) => (
              <button
                key={`${song.id}-${index}`}
                onClick={() => playSong(song, undefined, index)}
                aria-current={index === currentIndex ? "true" : undefined}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg p-3 text-left hover:bg-muted",
                  index === currentIndex && "bg-primary/10 text-primary",
                )}
              >
                <span className="w-5 text-xs text-muted-foreground">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{song.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {song.artist}
                  </p>
                </div>
                <Play className="h-4 w-4 shrink-0" />
              </button>
            ))}
            {!queue.length && (
              <p className="py-6 text-sm text-muted-foreground">
                Choose another song to keep listening.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <LyricsBibleComparisonDialog
        isOpen={lyricsOpen}
        onClose={() => setLyricsOpen(false)}
        song={currentSong}
      />
    </>
  );
}
