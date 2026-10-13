import { useEffect } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Progress } from "@/components/ui/progress";

const names: Record<string, string> = {
  title: "Song title",
  genres: "At least one genre",
  lyrics: "Lyrics",
  audio_url: "Audio upload",
  lyric_ai_prompt: "Lyric prompt",
  music_model_used: "Music model",
  music_ai_prompt: "Music prompt",
  lyrics_scripture_adherence: "Scripture connection",
  bible_translation_used: "Bible translation",
  bible_books: "Bible passage",
  bible_verses: "Bible verses",
};
export default function UploadProgressBar({
  onProgressChange,
}: {
  onProgressChange: (progress: number) => void;
}) {
  const { control } = useFormContext();
  const values = useWatch({ control });
  const fields = [
    "title",
    "genres",
    "lyrics",
    "audio_url",
    "lyrics_scripture_adherence",
  ];
  if (values.ai_used_for_lyrics) fields.push("lyric_ai_prompt");
  if (
    values.music_origin === "ai" ||
    values.music_origin === "ai_cover_of_human"
  )
    fields.push("music_model_used", "music_ai_prompt");
  if (
    values.lyrics_scripture_adherence &&
    values.lyrics_scripture_adherence !== "no_connection"
  )
    fields.push("bible_translation_used", "bible_books", "bible_verses");
  const missing = fields.filter((field) => {
    const value = values[field];
    return Array.isArray(value)
      ? value.length === 0
      : value === undefined || value === null || String(value).trim() === "";
  });
  const progress = Math.round(
    ((fields.length - missing.length) / fields.length) * 100,
  );
  useEffect(() => {
    onProgressChange(progress);
  }, [onProgressChange, progress]);
  return (
    <div className="surface-card space-y-3 p-5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">Your song is taking shape</span>
        <span className="tabular-nums text-primary">{progress}% ready</span>
      </div>
      <Progress
        value={progress}
        aria-label="Required song information completed"
        className="h-1.5"
      />
      <p className="text-xs leading-relaxed text-muted-foreground">
        {missing.length
          ? `Still needed: ${missing.map((field) => names[field]).join(", ")}.`
          : "Ready to share. Review your information, then submit your song."}
      </p>
    </div>
  );
}
