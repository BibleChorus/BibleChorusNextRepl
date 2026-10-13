import { format, isValid, parseISO } from "date-fns";
import { SeasonSong } from "@/types/journey";

/** Date-only journey fields represent a calendar day, not a UTC instant. */
export function journeyDate(value?: string | null): Date | null {
  if (!value) return null;
  const date = parseISO(value.split("T")[0].split(" ")[0]);
  return isValid(date) ? date : null;
}

export function formatJourneyDate(
  value?: string | null,
  pattern = "MMMM d, yyyy",
): string {
  const date = journeyDate(value);
  return date ? format(date, pattern) : "";
}

export function journeyMediaUrl(path?: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const base = process.env.NEXT_PUBLIC_CDN_URL?.replace(/\/$/, "") || "";
  return `${base}/${path.replace(/^\//, "")}`;
}

export function formatDuration(seconds?: number): string {
  if (!seconds || !Number.isFinite(seconds) || seconds < 0) return "—";
  const total = Math.floor(seconds);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

export function journeyPlayerSong(song: NonNullable<SeasonSong["song"]>) {
  return {
    id: song.id,
    title: song.title,
    artist: song.artist,
    audioUrl: song.audio_url,
    audio_url: song.audio_url,
    coverArtUrl: journeyMediaUrl(song.song_art_url) || undefined,
    duration: song.duration,
    uploaded_by: 0,
    lyrics: song.lyrics,
    bible_verses: song.bible_verses,
    bible_translation_used: song.bible_translation_used,
  };
}

export function humanizeOrigin(value: string): string {
  const labels: Record<string, string> = {
    prior_recording: "Previously written song",
    journal_entry: "Journal entry",
    prophetic_word: "Prayer or prophetic utterance",
    dream_vision: "Dream or vision",
    ai_cover_of_human: "AI cover of a human song",
    ai: "AI generated",
    human: "Human composed",
  };
  return (
    labels[value] ||
    value.replace(/_/g, " ").replace(/^\w/, (letter) => letter.toUpperCase())
  );
}

export function safeExternalUrl(value?: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}
