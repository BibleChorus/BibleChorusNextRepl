import { Playlist } from "@/types";
import { ArrowUpRight, Music2 } from "lucide-react";
import Image from "next/image";

interface PlaylistCardProps {
  playlist: Playlist;
  onClick: () => void;
  gradientIndex: number;
}

const coverColors = [
  "bg-primary/10",
  "bg-secondary",
  "bg-amber-500/10",
  "bg-emerald-500/10",
];

export default function PlaylistCard({
  playlist,
  onClick,
  gradientIndex,
}: PlaylistCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 rounded-2xl"
      aria-label={`Open ${playlist.name}`}
    >
      <div
        className={`relative aspect-square overflow-hidden rounded-2xl border border-border ${coverColors[gradientIndex % coverColors.length]}`}
      >
        {playlist.cover_art_url ? (
          <Image
            src={playlist.cover_art_url}
            alt=""
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-primary">
            <Music2 className="h-12 w-12 opacity-70" />
            <span className="px-4 text-center font-serif text-xl">
              {playlist.name}
            </span>
          </div>
        )}
        <span className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-background/95 text-foreground shadow-sm transition-transform group-hover:-translate-y-1">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>
      <div className="px-1 pt-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug group-hover:text-primary">
          {playlist.name}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {playlist.song_count ?? 0}{" "}
          {(playlist.song_count ?? 0) === 1 ? "song" : "songs"}
        </p>
        {playlist.description && (
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {playlist.description}
          </p>
        )}
      </div>
    </button>
  );
}
