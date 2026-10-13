import { Playlist } from "@/types";
import PlaylistCard from "./PlaylistCard";

interface PlaylistSectionProps {
  title: string;
  playlists: Playlist[];
  onPlaylistClick: (playlistId: number) => void;
}

export default function PlaylistSection({
  title,
  playlists,
  onPlaylistClick,
}: PlaylistSectionProps) {
  return (
    <section className="w-full">
      {title && <h2 className="mb-6 text-2xl font-semibold">{title}</h2>}
      <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {playlists.map((playlist, index) => (
          <PlaylistCard
            key={playlist.id}
            playlist={playlist}
            onClick={() => onPlaylistClick(playlist.id)}
            gradientIndex={index}
          />
        ))}
      </div>
    </section>
  );
}
