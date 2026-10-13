import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  findSongIndex,
  nextSongIndex,
  shuffleWithCurrent,
} from "@/lib/music-queue";

export interface MusicPlayerSong {
  id: number;
  title: string;
  artist?: string;
  audioUrl: string;
  audio_url: string;
  coverArtUrl?: string;
  duration?: number;
  lyrics?: string;
  bible_verses?: { book: string; chapter: number; verse: number }[];
  bible_translation_used?: string;
  uploaded_by: number;
}
type RepeatMode = "none" | "one" | "all";
interface QueueEntry {
  id: number;
  key: symbol;
  song: MusicPlayerSong;
}
interface MusicPlayerContextType {
  currentSong: MusicPlayerSong | null;
  currentIndex: number;
  isPlaying: boolean;
  playSong: (
    song: MusicPlayerSong,
    queue?: MusicPlayerSong[],
    queueIndex?: number,
  ) => void;
  pause: () => void;
  resume: () => void;
  next: () => void;
  previous: () => void;
  toggleShuffle: () => Promise<void>;
  toggleRepeat: () => void;
  isShuffling: boolean;
  repeatMode: RepeatMode;
  queue: MusicPlayerSong[];
  audioElement: HTMLAudioElement | null;
  isMinimized: boolean;
  setIsMinimized: React.Dispatch<React.SetStateAction<boolean>>;
  updateQueue: (songs: MusicPlayerSong[]) => void;
  registerShuffleLoader: (
    loader: () => Promise<MusicPlayerSong[]>,
  ) => () => void;
}
const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(
  undefined,
);

export function MusicPlayerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queue, setQueue] = useState<MusicPlayerSong[]>([]);
  const [currentSong, setCurrentSong] = useState<MusicPlayerSong | null>(null);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(
    null,
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("none");
  const [isMinimized, setIsMinimized] = useState(false);
  const originalQueue = useRef<QueueEntry[]>([]);
  const queueRef = useRef<QueueEntry[]>([]);
  const currentEntry = useRef<symbol | null>(null);
  const currentRef = useRef<MusicPlayerSong | null>(null);
  const indexRef = useRef(-1);
  const playingRef = useRef(false);
  const shufflingRef = useRef(false);
  const repeatRef = useRef<RepeatMode>("none");
  const shuffleLoader = useRef<(() => Promise<MusicPlayerSong[]>) | null>(null);
  const shuffleLoading = useRef(false);
  const queueRevision = useRef(0);
  const countedSong = useRef<number | null>(null);
  const playAttempt = useRef(0);

  const setPlayback = useCallback((playing: boolean) => {
    playingRef.current = playing;
    setIsPlaying(playing);
  }, []);
  const selectIndex = useCallback((index: number) => {
    indexRef.current = index;
    setCurrentIndex(index);
  }, []);
  const entriesForSongs = useCallback((songs: MusicPlayerSong[]) => {
    const selected = findSongIndex(songs, currentRef.current);
    return songs.map((song, index): QueueEntry => ({
      id: song.id,
      song,
      key:
        index === selected && currentEntry.current
          ? currentEntry.current
          : Symbol("queue-entry"),
    }));
  }, []);
  const replaceQueue = useCallback(
    (entries: QueueEntry[], selectedIndex?: number) => {
      queueRef.current = entries;
      setQueue(entries.map((entry) => entry.song));
      selectIndex(
        selectedIndex ??
          entries.findIndex((entry) => entry.key === currentEntry.current),
      );
    },
    [selectIndex],
  );

  const resume = useCallback(() => {
    if (!audioElement?.src || !currentRef.current) return;
    const attempt = ++playAttempt.current;
    audioElement.play().catch((error) => {
      if (attempt !== playAttempt.current) return;
      setPlayback(false);
      if (error?.name !== "AbortError")
        toast.error(
          "This song couldn’t play. Try again or choose another song.",
        );
    });
  }, [audioElement, setPlayback]);
  const pause = useCallback(() => {
    playAttempt.current++;
    audioElement?.pause();
    setPlayback(false);
  }, [audioElement, setPlayback]);
  const startSong = useCallback(
    (song: MusicPlayerSong, play: boolean, index: number) => {
      currentRef.current = song;
      currentEntry.current = queueRef.current[index]?.key || null;
      setCurrentSong(song);
      selectIndex(index);
      countedSong.current = null;
      if (!audioElement) return;
      playAttempt.current++;
      setPlayback(false);
      audioElement.src = song.audioUrl || song.audio_url;
      audioElement.currentTime = 0;
      if (play) resume();
      else audioElement.pause();
    },
    [audioElement, resume, selectIndex, setPlayback],
  );
  const playSong = useCallback(
    (
      song: MusicPlayerSong,
      newQueue?: MusicPlayerSong[],
      queueIndex?: number,
    ) => {
      let entries = newQueue
        ? entriesForSongs(newQueue)
        : [...queueRef.current];
      const songs = entries.map((entry) => entry.song);
      const hint = queueIndex ?? (newQueue ? -1 : indexRef.current);
      let index = findSongIndex(songs, song, hint);
      if (index < 0) {
        const entry = { id: song.id, song, key: Symbol("queue-entry") };
        if (newQueue) {
          entries.unshift(entry);
          index = 0;
        } else {
          entries.push(entry);
          index = entries.length - 1;
          originalQueue.current = [...originalQueue.current, entry];
        }
      }
      if (newQueue) {
        queueRevision.current++;
        originalQueue.current = [...entries];
        if (shufflingRef.current) {
          entries = shuffleWithCurrent(entries, entries[index], index);
          index = 0;
        }
      }
      replaceQueue(entries, index);
      startSong(song, true, index);
    },
    [entriesForSongs, replaceQueue, startSong],
  );
  const next = useCallback(() => {
    const index = nextSongIndex(
      queueRef.current.length,
      indexRef.current,
      1,
      repeatRef.current === "all",
    );
    if (index !== null)
      startSong(queueRef.current[index].song, playingRef.current, index);
    else pause();
  }, [startSong, pause]);
  const previous = useCallback(() => {
    if (audioElement && audioElement.currentTime > 3) {
      audioElement.currentTime = 0;
      return;
    }
    const index = nextSongIndex(
      queueRef.current.length,
      indexRef.current,
      -1,
      repeatRef.current === "all",
    );
    if (index !== null)
      startSong(queueRef.current[index].song, playingRef.current, index);
    else if (audioElement) audioElement.currentTime = 0;
  }, [audioElement, startSong]);
  const updateQueue = useCallback(
    (songs: MusicPlayerSong[]) => {
      queueRevision.current++;
      const entries = entriesForSongs(songs);
      originalQueue.current = [...entries];
      const selected =
        entries.find((entry) => entry.key === currentEntry.current) || null;
      replaceQueue(
        shufflingRef.current ? shuffleWithCurrent(entries, selected) : entries,
      );
    },
    [entriesForSongs, replaceQueue],
  );
  const registerShuffleLoader = useCallback(
    (loader: () => Promise<MusicPlayerSong[]>) => {
      shuffleLoader.current = loader;
      return () => {
        if (shuffleLoader.current === loader) shuffleLoader.current = null;
      };
    },
    [],
  );
  const toggleShuffle = useCallback(async () => {
    if (shuffleLoading.current) return;
    if (shufflingRef.current) {
      replaceQueue([...originalQueue.current]);
      shufflingRef.current = false;
      setIsShuffling(false);
      return;
    }
    shuffleLoading.current = true;
    const revision = queueRevision.current;
    const loader = shuffleLoader.current;
    try {
      let entries = [...queueRef.current];
      if (loader) {
        try {
          const songs = await loader();
          if (
            queueRevision.current !== revision ||
            shuffleLoader.current !== loader
          )
            return;
          entries = entriesForSongs(songs);
        } catch {
          if (
            queueRevision.current !== revision ||
            shuffleLoader.current !== loader
          )
            return;
          toast.info("Shuffling the songs already in your queue.");
        }
      }
      const current = currentRef.current;
      let selected =
        entries.find((entry) => entry.key === currentEntry.current) || null;
      if (current && !selected) {
        selected = {
          id: current.id,
          song: current,
          key: currentEntry.current || Symbol("queue-entry"),
        };
        entries.unshift(selected);
        currentEntry.current = selected.key;
      }
      originalQueue.current = [...entries];
      replaceQueue(shuffleWithCurrent(entries, selected));
      shufflingRef.current = true;
      setIsShuffling(true);
    } finally {
      shuffleLoading.current = false;
    }
  }, [entriesForSongs, replaceQueue]);
  const toggleRepeat = useCallback(() => {
    const nextMode =
      repeatRef.current === "none"
        ? "all"
        : repeatRef.current === "all"
          ? "one"
          : "none";
    repeatRef.current = nextMode;
    setRepeatMode(nextMode);
  }, []);

  useEffect(() => {
    if (!audioElement) return;
    const onPlay = () => setPlayback(true);
    const onPause = () => setPlayback(false);
    const onEnded = () => {
      if (repeatRef.current === "one") {
        countedSong.current = null;
        audioElement.currentTime = 0;
        resume();
        return;
      }
      const index = nextSongIndex(
        queueRef.current.length,
        indexRef.current,
        1,
        repeatRef.current === "all",
      );
      if (index !== null) startSong(queueRef.current[index].song, true, index);
      else {
        playAttempt.current++;
        setPlayback(false);
      }
    };
    const onProgress = () => {
      const song = currentRef.current;
      const duration =
        Number.isFinite(audioElement.duration) && audioElement.duration > 0
          ? audioElement.duration
          : song?.duration;
      if (
        !song ||
        !duration ||
        duration <= 0 ||
        countedSong.current === song.id ||
        audioElement.currentTime / duration < 0.3
      )
        return;
      countedSong.current = song.id;
      axios.post(`/api/songs/${song.id}/increment-play-count`).catch(() => {
        /* Analytics must never interrupt music. */
      });
    };
    const onError = () => {
      playAttempt.current++;
      setPlayback(false);
      toast.error("This song couldn’t play. Try again or choose another song.");
    };
    audioElement.addEventListener("play", onPlay);
    audioElement.addEventListener("pause", onPause);
    audioElement.addEventListener("ended", onEnded);
    audioElement.addEventListener("timeupdate", onProgress);
    audioElement.addEventListener("error", onError);
    return () => {
      audioElement.removeEventListener("play", onPlay);
      audioElement.removeEventListener("pause", onPause);
      audioElement.removeEventListener("ended", onEnded);
      audioElement.removeEventListener("timeupdate", onProgress);
      audioElement.removeEventListener("error", onError);
    };
  }, [audioElement, resume, startSong, setPlayback]);
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.mediaSession) return;
    const session = navigator.mediaSession;
    if (currentSong && typeof MediaMetadata !== "undefined") {
      try {
        session.metadata = new MediaMetadata({
          title: currentSong.title,
          artist: currentSong.artist,
          artwork: [{ src: currentSong.coverArtUrl || "/default-cover.jpg" }],
        });
      } catch {
        /* Unsupported artwork must not interrupt playback. */
      }
    }
    const handlers = {
      play: resume,
      pause,
      nexttrack: next,
      previoustrack: previous,
    };
    for (const [action, handler] of Object.entries(handlers)) {
      try {
        session.setActionHandler(
          action as MediaSessionAction,
          currentSong ? handler : null,
        );
      } catch {
        /* Browsers support different sets of media controls. */
      }
    }
    return () => {
      for (const action of Object.keys(handlers)) {
        try {
          session.setActionHandler(action as MediaSessionAction, null);
        } catch {
          /* An unsupported action has no handler to clear. */
        }
      }
    };
  }, [currentSong, resume, pause, next, previous]);
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.mediaSession)
      navigator.mediaSession.playbackState = currentSong
        ? isPlaying
          ? "playing"
          : "paused"
        : "none";
  }, [currentSong, isPlaying]);
  useEffect(
    () => () => {
      if (!audioElement) return;
      playAttempt.current++;
      audioElement.pause();
      audioElement.removeAttribute("src");
      audioElement.load();
      if (typeof navigator !== "undefined" && navigator.mediaSession) {
        navigator.mediaSession.metadata = null;
        navigator.mediaSession.playbackState = "none";
      }
    },
    [audioElement],
  );

  const value = useMemo(
    () => ({
      currentSong,
      currentIndex,
      isPlaying,
      playSong,
      pause,
      resume,
      next,
      previous,
      toggleShuffle,
      toggleRepeat,
      isShuffling,
      repeatMode,
      queue,
      audioElement,
      isMinimized,
      setIsMinimized,
      updateQueue,
      registerShuffleLoader,
    }),
    [
      currentSong,
      currentIndex,
      isPlaying,
      playSong,
      pause,
      resume,
      next,
      previous,
      toggleShuffle,
      toggleRepeat,
      isShuffling,
      repeatMode,
      queue,
      audioElement,
      isMinimized,
      updateQueue,
      registerShuffleLoader,
    ],
  );
  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
      <audio ref={setAudioElement} preload="metadata" />
    </MusicPlayerContext.Provider>
  );
}
export function useMusicPlayer() {
  const context = useContext(MusicPlayerContext);
  if (!context)
    throw new Error("useMusicPlayer must be used within a MusicPlayerProvider");
  return context;
}
