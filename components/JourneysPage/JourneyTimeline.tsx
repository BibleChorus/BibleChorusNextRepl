"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { BookOpen, Calendar, EyeOff, Music, Quote } from "lucide-react";
import {
  Season,
  JourneyWithSeasons,
  SeasonSong,
  ImportantDate,
} from "@/types/journey";
import { JourneySong } from "./JourneySong";
import { JourneyImportantDate } from "./JourneyImportantDate";
import { ScriptureVerseDialog } from "./ScriptureVerseDialog";
import { Button } from "@/components/ui/button";
import {
  formatJourneyDate,
  journeyDate,
  journeyMediaUrl,
} from "./journey-utils";
import { cn } from "@/lib/utils";

type TimelineItem =
  | { type: "song"; data: SeasonSong; date: number }
  | { type: "important_date"; data: ImportantDate; date: number };

interface JourneyTimelineProps {
  journey: JourneyWithSeasons;
  isPreview?: boolean;
}

const seasonColors: Record<string, string> = {
  indigo: "#6366f1",
  purple: "#a855f7",
  pink: "#ec4899",
  amber: "#d97706",
  emerald: "#059669",
  cyan: "#0891b2",
};

function SeasonSection({
  season,
  index,
  journey,
  songs,
  isPreview,
}: {
  season: Season;
  index: number;
  journey: JourneyWithSeasons;
  songs: SeasonSong[];
  isPreview?: boolean;
}) {
  const [showScripture, setShowScripture] = useState(false);
  const cover = journeyMediaUrl(season.cover_image_url);
  const start = formatJourneyDate(season.start_date, "MMM yyyy");
  const end = season.end_date
    ? formatJourneyDate(season.end_date, "MMM yyyy")
    : "Present";
  const isTimeline = journey.layout_style === "timeline";
  const items = useMemo(() => {
    const merged: TimelineItem[] = [
      ...(season.songs || []).map((song): TimelineItem => ({
        type: "song",
        data: song,
        date:
          journeyDate(
            song.song?.journey_date || song.song?.created_at || song.added_date,
          )?.getTime() || 0,
      })),
      ...(season.important_dates || []).map((date): TimelineItem => ({
        type: "important_date",
        data: date,
        date: journeyDate(date.event_date)?.getTime() || 0,
      })),
    ];
    return merged.sort(
      (a, b) =>
        a.date - b.date ||
        (a.type === b.type
          ? a.data.display_order - b.data.display_order
          : a.type === "important_date"
            ? -1
            : 1),
    );
  }, [season.songs, season.important_dates]);
  let track = 0;

  return (
    <section
      id={`season-${season.id}`}
      aria-labelledby={`season-title-${season.id}`}
      className={cn("scroll-mt-32", !isTimeline && "surface-card p-5 sm:p-7")}
    >
      <div
        className={cn(
          "grid gap-6",
          isTimeline && "lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10",
        )}
      >
        <div
          className={cn(
            "min-w-0",
            isTimeline && "lg:sticky lg:top-32 lg:self-start",
          )}
        >
          <div className="mb-4 flex items-center gap-2">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
              Season {String(index + 1).padStart(2, "0")}
            </span>
            {isPreview && !season.is_visible && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <EyeOff className="h-3 w-3" />
                Hidden
              </span>
            )}
          </div>
          <h2
            id={`season-title-${season.id}`}
            className="font-serif text-3xl leading-tight sm:text-4xl"
          >
            {season.title}
          </h2>
          <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            {start}
            {start && end ? " – " : ""}
            {end}
          </p>
          {season.description && (
            <p className="mt-5 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {season.description}
            </p>
          )}
          {season.scripture_reference && (
            <Button
              size="sm"
              variant="ghost"
              className="mt-4 h-auto justify-start whitespace-normal p-0 text-left text-primary hover:bg-transparent"
              onClick={() => setShowScripture(true)}
            >
              <BookOpen className="mr-2 h-4 w-4 shrink-0" />
              {season.scripture_reference}
            </Button>
          )}
          {cover && (
            <div className="relative mt-6 aspect-[4/3] overflow-hidden rounded-2xl border border-border">
              <Image
                src={cover}
                alt={season.title}
                fill
                sizes="(max-width: 1024px) 90vw, 240px"
                className="object-cover"
              />
            </div>
          )}
          <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
            <Music className="h-3.5 w-3.5" />
            {season.songs?.length || 0}{" "}
            {season.songs?.length === 1 ? "song" : "songs"}
            {Boolean(season.important_dates?.length) &&
              ` · ${season.important_dates!.length} ${season.important_dates!.length === 1 ? "moment" : "moments"}`}
          </p>
        </div>
        <div
          className="min-w-0 space-y-4"
          style={
            season.theme_color && seasonColors[season.theme_color]
              ? {
                  borderTop: `2px solid ${seasonColors[season.theme_color]}`,
                  paddingTop: "1rem",
                }
              : undefined
          }
        >
          {season.reflection && (
            <blockquote className="rounded-2xl border border-border bg-muted/40 px-5 py-5 sm:px-7">
              <Quote className="mb-3 h-5 w-5 text-primary/60" />
              <p className="whitespace-pre-wrap font-serif text-xl italic leading-relaxed sm:text-2xl">
                {season.reflection}
              </p>
            </blockquote>
          )}
          {items.length ? (
            items.map((item) => {
              if (item.type === "important_date")
                return (
                  <JourneyImportantDate
                    key={`date-${item.data.id}`}
                    importantDate={item.data}
                  />
                );
              track += 1;
              return (
                <JourneySong
                  key={`song-${item.data.id}`}
                  seasonSong={item.data}
                  trackNumber={track}
                  showDate={journey.show_song_dates}
                  showPlayCount={journey.show_play_counts}
                  themeColor={season.theme_color}
                  allJourneySongs={songs}
                />
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center">
              <Music className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Songs for this season are coming soon.
              </p>
            </div>
          )}
        </div>
      </div>
      {season.scripture_reference && (
        <ScriptureVerseDialog
          isOpen={showScripture}
          onClose={() => setShowScripture(false)}
          scriptureReference={season.scripture_reference}
        />
      )}
    </section>
  );
}

export const JourneyTimeline: React.FC<JourneyTimelineProps> = ({
  journey,
  isPreview,
}) => {
  const seasons = useMemo(
    () =>
      [...journey.seasons].sort(
        (a, b) =>
          (journeyDate(a.start_date)?.getTime() || 0) -
          (journeyDate(b.start_date)?.getTime() || 0),
      ),
    [journey.seasons],
  );
  const songs = useMemo(
    () => seasons.flatMap((season) => season.songs || []),
    [seasons],
  );
  return (
    <div className="space-y-12 sm:space-y-16">
      <div
        className={cn(
          "grid gap-12 sm:gap-16",
          journey.layout_style === "grid" && "2xl:grid-cols-2 2xl:gap-8",
        )}
      >
        {seasons.map((season, index) => (
          <SeasonSection
            key={season.id}
            season={season}
            index={index}
            journey={journey}
            songs={songs}
            isPreview={isPreview}
          />
        ))}
      </div>
      <div className="flex items-center gap-5 py-6 text-center">
        <span className="h-px flex-1 bg-border" />
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          The journey continues
        </p>
        <span className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
};
