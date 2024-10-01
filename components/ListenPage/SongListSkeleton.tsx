import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function SongListSkeleton() {
  return (
    <div className="space-y-2 sm:space-y-4">
      {Array.from({ length: 10 }).map((_, index) => (
        <div
          key={index}
          className="flex items-stretch p-2 sm:p-3 bg-white dark:bg-gray-800 rounded-lg shadow relative overflow-hidden"
        >
          {/* Skeleton for image */}
          <Skeleton className="w-12 h-12 sm:w-16 sm:h-16 mr-3 sm:mr-4" />

          {/* Skeleton for text content */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <Skeleton className="h-4 w-1/2 mb-2" />
            <Skeleton className="h-3 w-1/3" />
            <div className="mt-1 sm:mt-2 flex flex-wrap gap-1">
              {Array.from({ length: 3 }).map((_, idx) => (
                <Skeleton key={idx} className="h-4 w-12 rounded" />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}