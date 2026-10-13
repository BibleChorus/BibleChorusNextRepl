import React from "react";
import { cn } from "@/lib/utils";

interface JourneySplitPanelProps {
  music: React.ReactNode;
  context?: React.ReactNode;
  className?: string;
}

/** Keeps a song and its story together; the context slot also accommodates future source media. */
export function JourneySplitPanel({
  music,
  context,
  className,
}: JourneySplitPanelProps) {
  return (
    <div
      className={cn(
        "grid min-w-0",
        context && "xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]",
        className,
      )}
    >
      <div className="min-w-0 p-5 sm:p-6">{music}</div>
      {context && (
        <div className="min-w-0 border-t border-border bg-muted/30 p-5 sm:p-6 xl:border-l xl:border-t-0">
          {context}
        </div>
      )}
    </div>
  );
}
