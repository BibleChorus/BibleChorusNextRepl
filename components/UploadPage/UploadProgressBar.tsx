import React, { useMemo, useEffect, useRef } from 'react';
import { useFormContext } from "react-hook-form";
import { useTheme } from 'next-themes';
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { motion } from 'framer-motion';

interface UploadProgressBarProps {
  onProgressChange: (progress: number) => void;
}

const steps = [
  { name: "AI Info", fields: ["ai_used_for_lyrics", "music_ai_generated", "lyric_ai_prompt", "music_model_used", "music_ai_prompt"] },
  { name: "Song Info", fields: ["title", "genres", "lyrics"] },
  { name: "Bible Info", fields: ["bible_translation_used", "lyrics_scripture_adherence", "is_continuous_passage", "bible_books", "bible_verses"] },
  { name: "Upload", fields: ["audio_url", "song_art_url"] }
];

const UploadProgressBar: React.FC<UploadProgressBarProps> = ({ onProgressChange }) => {
  const { watch } = useFormContext();
  const watchedFields = watch();
  const prevProgressRef = useRef<number>(0);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const theme = {
    bg: isDark ? '#050505' : '#f8f5f0',
    bgCard: isDark ? '#0a0a0a' : '#ffffff',
    text: isDark ? '#e5e5e5' : '#161616',
    textSecondary: isDark ? '#a0a0a0' : '#4a4a4a',
    accent: isDark ? '#d4af37' : '#bfa130',
    border: isDark ? 'rgba(212, 175, 55, 0.15)' : 'rgba(191, 161, 48, 0.2)',
    progressBg: isDark ? 'rgba(212, 175, 55, 0.1)' : 'rgba(191, 161, 48, 0.15)',
  };

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
    <div className="w-full space-y-3">
      <div 
        className="flex justify-between text-xs tracking-[0.1em] uppercase"
        style={{ color: theme.textSecondary, fontFamily: "'Manrope', sans-serif" }}
      >
        <span>Upload Progress</span>
        <span style={{ color: progress === 100 ? theme.accent : theme.textSecondary }}>
          {progress}% Complete
        </span>
      </div>
      <HoverCard>
        <HoverCardTrigger asChild>
          <div className="cursor-pointer">
            <ProgressPrimitive.Root
              className="relative h-1 w-full overflow-hidden"
              style={{ backgroundColor: theme.progressBg }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <ProgressPrimitive.Indicator
                  className="h-full w-full flex-1"
                  style={{ 
                    backgroundColor: theme.accent,
                    boxShadow: progress === 100 ? `0 0 12px ${theme.accent}` : 'none',
                  }}
                />
              </motion.div>
            </ProgressPrimitive.Root>
          </div>
        </HoverCardTrigger>
        <HoverCardContent 
          className="w-80 rounded-none p-4"
          style={{ 
            backgroundColor: theme.bgCard,
            border: `1px solid ${theme.border}`,
            fontFamily: "'Manrope', sans-serif"
          }}
        >
          {missingFields.length > 0 ? (
            <>
              <h3 
                className="text-sm tracking-wide mb-3"
                style={{ fontFamily: "'Italiana', serif", color: theme.text }}
              >
                Almost there! Just a few more steps:
              </h3>
              <ul className="space-y-1.5">
                {missingFields.map((field, index) => (
                  <li 
                    key={index} 
                    className="text-xs flex items-center gap-2"
                    style={{ color: theme.textSecondary }}
                  >
                    <span 
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: theme.accent }}
                    />
                    {formatFieldName(field)}
                  </li>
                ))}
              </ul>
              <p 
                className="mt-3 text-xs"
                style={{ color: theme.textSecondary }}
              >
                Fill these in to complete your upload!
              </p>
            </>
          ) : (
            <p 
              className="text-sm"
              style={{ color: theme.accent }}
            >
              Great job! All required fields are filled. You&apos;re ready to submit!
            </p>
          )}
        </HoverCardContent>
      </HoverCard>
    </div>
  );
};

export default UploadProgressBar;
