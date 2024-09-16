import React, { useEffect, useState } from 'react';
import { useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";
import * as ProgressPrimitive from "@radix-ui/react-progress";

const steps = [
  { name: "AI Info", fields: ["ai_used_for_lyrics", "music_ai_generated", "lyric_ai_prompt", "music_model_used", "music_ai_prompt"] },
  { name: "Song Info", fields: ["title", "genre", "lyrics"] },
  { name: "Bible Info", fields: ["bible_translation_used", "lyrics_scripture_adherence", "is_continuous_passage", "bible_books", "bible_verses"] },
  { name: "Upload", fields: ["audio_url", "song_art_url"] }
];

const UploadProgressBar: React.FC = () => {
  const { watch } = useFormContext();
  const watchedFields = watch();
  const [progress, setProgress] = useState(0);

  const calculateProgress = () => {
    let totalFields = 0;
    let filledFields = 0;

    steps.forEach(step => {
      step.fields.forEach(field => {
        if (field === "lyric_ai_prompt" && !watchedFields.ai_used_for_lyrics) return;
        if ((field === "music_model_used" || field === "music_ai_prompt") && !watchedFields.music_ai_generated) return;
        
        totalFields++;
        if (watchedFields[field] !== undefined && watchedFields[field] !== "") {
          filledFields++;
        }
      });
    });

    return Math.round((filledFields / totalFields) * 100);
  };

  useEffect(() => {
    const newProgress = calculateProgress();
    setProgress(newProgress);
  }, [watchedFields]);

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>Upload Progress</span>
        <span>{progress}% Complete</span>
      </div>
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
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500">
        {steps.map((step, index) => (
          <span key={index} className={progress >= ((index + 1) / steps.length) * 100 ? "text-primary" : ""}>
            {step.name}
          </span>
        ))}
      </div>
    </div>
  );
};

export default UploadProgressBar;