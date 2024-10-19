import React, { useMemo, useEffect, useRef } from 'react';
import { useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

interface UploadProgressBarProps {
  onProgressChange: (progress: number) => void;
}

const steps = [
  { name: "AI Info", fields: ["ai_used_for_lyrics", "music_ai_generated", "lyric_ai_prompt", "music_model_used", "music_ai_prompt"] },
  { name: "Song Info", fields: ["title", "genres", "lyrics"] }, // Changed 'genre' to 'genres'
  { name: "Bible Info", fields: ["bible_translation_used", "lyrics_scripture_adherence", "is_continuous_passage", "bible_books", "bible_verses"] },
  { name: "Upload", fields: ["audio_url", "song_art_url"] }
];

const UploadProgressBar: React.FC<UploadProgressBarProps> = ({ onProgressChange }) => {
  const { watch } = useFormContext();
  const watchedFields = watch();
  const prevProgressRef = useRef<number>(0);

  const { progress, missingFields } = useMemo(() => {
    let totalFields = 0;
    let filledFields = 0;
    const missing: string[] = [];

    steps.forEach(step => {
      step.fields.forEach(field => {
        if (field === "lyric_ai_prompt" && !watchedFields.ai_used_for_lyrics) return;
        if ((field === "music_model_used" || field === "music_ai_prompt") && !watchedFields.music_ai_generated) return;
        
        totalFields++;
        if (field === "genres") {
          // Check if genres array is not empty
          if (Array.isArray(watchedFields[field]) && watchedFields[field].length > 0) {
            filledFields++;
          } else {
            missing.push(field);
          }
        } else if (watchedFields[field] !== undefined && watchedFields[field] !== "") {
          filledFields++;
        } else {
          missing.push(field);
        }
      });
    });

    const calculatedProgress = Math.round((filledFields / totalFields) * 100);

    return { progress: calculatedProgress, missingFields: missing };
  }, [watchedFields]);

  useEffect(() => {
    if (progress !== prevProgressRef.current) {
      onProgressChange(progress);
      prevProgressRef.current = progress;
    }
  }, [progress, onProgressChange]);

  const formatFieldName = (field: string): string => {
    const specialCases: { [key: string]: string } = {
      "ai_used_for_lyrics": "AI for Lyrics",
      "music_ai_generated": "AI Generated Music",
      "lyric_ai_prompt": "Lyric AI Prompt",
      "music_model_used": "Music AI Model",
      "music_ai_prompt": "Music AI Prompt",
      "bible_translation_used": "Bible Translation",
      "lyrics_scripture_adherence": "Scripture Adherence",
      "is_continuous_passage": "Continuous Passage",
      "bible_books": "Bible Books",
      "bible_verses": "Bible Verses",
      "audio_url": "Audio File",
      "song_art_url": "Song Artwork"
    };

    return specialCases[field] || field.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>Upload Progress</span>
        <span>{progress}% Complete</span>
      </div>
      <HoverCard>
        <HoverCardTrigger asChild>
          <div className="cursor-pointer">
            <ProgressPrimitive.Root
              className="relative h-4 w-full overflow-hidden rounded-full bg-secondary"
            >
              <ProgressPrimitive.Indicator
                className={cn(
                  "h-full w-full flex-1 transition-all duration-500 ease-in-out",
                  progress === 100
                    ? "bg-gradient-to-r from-purple-500 to-pink-500"
                    : "bg-primary"
                )}
                style={{ transform: `translateX(-${100 - progress}%)` }}
              />
            </ProgressPrimitive.Root>
          </div>
        </HoverCardTrigger>
        <HoverCardContent className="w-80">
          {missingFields.length > 0 ? (
            <>
              <h3 className="font-semibold mb-2">Almost there! Just a few more steps:</h3>
              <ul className="list-disc pl-5">
                {missingFields.map((field, index) => (
                  <li key={index} className="text-sm">{formatFieldName(field)}</li>
                ))}
              </ul>
              <p className="mt-2 text-sm text-gray-600">Fill these in to complete your upload!</p>
            </>
          ) : (
            // Escaped apostrophe in the following line
            <p className="text-green-600 font-semibold">Great job! All required fields are filled. You&apos;re ready to submit!</p>
          )}
        </HoverCardContent>
      </HoverCard>
    </div>
  );
};

export default UploadProgressBar;
