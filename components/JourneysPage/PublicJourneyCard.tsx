import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Heart, Music } from "lucide-react";
import { PublicJourneyListItem } from "@/types/journey";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { journeyMediaUrl } from "./journey-utils";

export function PublicJourneyCard({
  journey,
  isLiking,
  onLike,
}: {
  journey: PublicJourneyListItem & { is_liked: boolean };
  isLiking: boolean;
  onLike: () => void;
}) {
  const cover = journeyMediaUrl(journey.cover_image_url);
  const avatar = journeyMediaUrl(journey.profile_image_url);
  return (
    <article className="surface-card group flex h-full flex-col overflow-hidden transition-shadow hover:shadow-md">
      <Link
        href={`/journeys/${encodeURIComponent(journey.username)}`}
        className="relative block aspect-[16/10] overflow-hidden bg-primary/10"
        aria-label={`Explore ${journey.title} by ${journey.username}`}
      >
        {cover ? (
          <Image
            src={cover}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="flex h-28 w-28 items-center justify-center rounded-full border border-primary/20 bg-background/50 text-primary">
              <Music className="h-10 w-10 stroke-[1]" />
            </div>
          </div>
        )}
        <span className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background/85 text-foreground backdrop-blur-sm">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="relative flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-muted text-[10px] text-primary">
            {avatar ? (
              <Image
                src={avatar}
                alt=""
                fill
                sizes="24px"
                className="object-cover"
              />
            ) : (
              journey.username.slice(0, 1).toUpperCase()
            )}
          </span>
          @{journey.username}
        </div>
        <Link
          href={`/journeys/${encodeURIComponent(journey.username)}`}
          className="mb-2 font-serif text-2xl leading-tight text-foreground transition-colors hover:text-primary"
        >
          {journey.title}
        </Link>
        {journey.subtitle && (
          <p className="mb-5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {journey.subtitle}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Music className="h-3.5 w-3.5" />
            {journey.song_count} {journey.song_count === 1 ? "song" : "songs"}
          </p>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 gap-1.5 px-2 text-xs text-muted-foreground",
              journey.is_liked && "text-primary",
            )}
            disabled={isLiking}
            onClick={onLike}
            aria-pressed={journey.is_liked}
            aria-label={`${journey.is_liked ? "Unlike" : "Like"} ${journey.title}`}
          >
            <Heart
              className={cn(
                "h-3.5 w-3.5",
                journey.is_liked && "fill-current",
                isLiking && "animate-pulse",
              )}
            />
            {journey.likes_count}
          </Button>
        </div>
      </div>
    </article>
  );
}
