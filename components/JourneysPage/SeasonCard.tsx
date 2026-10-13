"use client";

import React, { useState } from "react";
import Image from "next/image";
import { BookOpen, Calendar, ChevronDown, Music } from "lucide-react";
import { Season } from "@/types/journey";
import { Button } from "@/components/ui/button";
import { JourneySong } from "./JourneySong";
import { JourneyImportantDate } from "./JourneyImportantDate";
import { ScriptureVerseDialog } from "./ScriptureVerseDialog";
import { formatJourneyDate, journeyMediaUrl } from "./journey-utils";
import { cn } from "@/lib/utils";

interface SeasonCardProps {
  season: Season;
  showPlayCounts?: boolean;
  showDates?: boolean;
  alignment?: "left" | "right";
}

export const SeasonCard: React.FC<SeasonCardProps> = ({
  season,
  showPlayCounts = false,
  showDates = true,
}) => {
  const [expanded, setExpanded] = useState(true);
  const [showScripture, setShowScripture] = useState(false);
  const cover = journeyMediaUrl(season.cover_image_url);
  return (
    <article className="surface-card overflow-hidden">
      {cover && (
        <div className="relative aspect-[16/7]">
          <Image
            src={cover}
            alt={season.title}
            fill
            sizes="(max-width: 1024px) 90vw, 50vw"
            className="object-cover"
          />
        </div>
      )}
      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-3xl">{season.title}</h2>
            <p className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {formatJourneyDate(season.start_date, "MMM yyyy")} –{" "}
                {season.end_date
                  ? formatJourneyDate(season.end_date, "MMM yyyy")
                  : "Present"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Music className="h-3.5 w-3.5" />
                {season.songs?.length || 0} songs
              </span>
            </p>
          </div>
          {Boolean(season.songs?.length || season.important_dates?.length) && (
            <Button
              size="icon"
              variant="ghost"
              aria-label={`${expanded ? "Collapse" : "Expand"} ${season.title}`}
              aria-expanded={expanded}
              aria-controls={`season-card-content-${season.id}`}
              onClick={() => setExpanded((previous) => !previous)}
            >
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  expanded && "rotate-180",
                )}
              />
            </Button>
          )}
        </div>
        {season.description && (
          <p className="mt-5 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {season.description}
          </p>
        )}
        {season.scripture_reference && (
          <Button
            variant="ghost"
            className="mt-4 h-auto p-0 text-primary hover:bg-transparent"
            onClick={() => setShowScripture(true)}
          >
            <BookOpen className="mr-2 h-4 w-4" />
            {season.scripture_reference}
          </Button>
        )}
        {season.reflection && (
          <blockquote className="mt-5 border-l-2 border-primary/25 pl-5 font-serif text-xl italic leading-relaxed">
            {season.reflection}
          </blockquote>
        )}
        {expanded && (
          <div
            id={`season-card-content-${season.id}`}
            className="mt-6 space-y-4 border-t border-border pt-6"
          >
            {season.important_dates?.map((date) => (
              <JourneyImportantDate key={date.id} importantDate={date} />
            ))}
            {season.songs?.map((song, index) => (
              <JourneySong
                key={song.id}
                seasonSong={song}
                showDate={showDates}
                showPlayCount={showPlayCounts}
                themeColor={season.theme_color}
                trackNumber={index + 1}
                allJourneySongs={season.songs}
              />
            ))}
          </div>
        )}
        {season.scripture_reference && (
          <ScriptureVerseDialog
            isOpen={showScripture}
            onClose={() => setShowScripture(false)}
            scriptureReference={season.scripture_reference}
          />
        )}
      </div>
    </article>
  );
};
