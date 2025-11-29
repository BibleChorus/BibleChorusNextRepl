import React, { useEffect, useMemo, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTheme } from 'next-themes';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { motion } from 'framer-motion';

interface Props {
  onProgressChange: (progress: number) => void;
}

const steps = [
  { name: 'Info', fields: ['title', 'themes', 'pdf_url', 'image_url'] },
];

const PdfUploadProgressBar: React.FC<Props> = ({ onProgressChange }) => {
  const { watch } = useFormContext();
  const watchedFields = watch();
  const prevRef = useRef(0);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const theme = {
    text: isDark ? '#e5e5e5' : '#161616',
    textSecondary: isDark ? '#a0a0a0' : '#4a4a4a',
    accent: isDark ? '#d4af37' : '#bfa130',
    progressBg: isDark ? 'rgba(212, 175, 55, 0.1)' : 'rgba(191, 161, 48, 0.15)',
  };

  const progress = useMemo(() => {
    let total = 0;
    let filled = 0;

    steps.forEach(step => {
      step.fields.forEach(field => {
        total++;
        if (Array.isArray(watchedFields[field])) {
          if (watchedFields[field].length > 0) filled++; 
        } else if (watchedFields[field]) {
          filled++; 
        }
      });
    });

    return Math.round((filled / total) * 100);
  }, [watchedFields]);

  useEffect(() => {
    if (progress !== prevRef.current) {
      onProgressChange(progress);
      prevRef.current = progress;
    }
  }, [progress, onProgressChange]);

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
  );
};

export default PdfUploadProgressBar;
