import React, { useEffect, useMemo, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '@/lib/utils';

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
    <div className="w-full space-y-2">
      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>Upload Progress</span>
        <span>{progress}% Complete</span>
      </div>
      <ProgressPrimitive.Root className="relative h-4 w-full overflow-hidden rounded-full bg-secondary">
        <ProgressPrimitive.Indicator
          className={cn('h-full w-full flex-1 transition-all duration-500 ease-in-out',
            progress === 100 ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-primary')}
          style={{ transform: `translateX(-${100 - progress}%)` }}
        />
      </ProgressPrimitive.Root>
    </div>
  );
};

export default PdfUploadProgressBar;
