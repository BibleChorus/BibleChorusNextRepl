import React from 'react';
import PlaylistCard from './PlaylistCard';
import { Playlist } from '../types';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import useEmblaCarousel from 'embla-carousel-react';
import AutoPlay from 'embla-carousel-autoplay';

interface PlaylistSectionProps {
  title: string;
  playlists: Playlist[];
  onPlaylistClick: (playlistId: number) => void;
}

const PlaylistSection: React.FC<PlaylistSectionProps> = ({ title, playlists, onPlaylistClick }) => {
  const [emblaRef] = useEmblaCarousel({ loop: true, align: 'start' }, [AutoPlay()]);

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <Carousel
        ref={emblaRef}
        className="w-full"
        opts={{
          align: 'start',
          loop: true,
        }}
      >
        <CarouselContent>
          {playlists.map((playlist, index) => (
            <CarouselItem key={playlist.id} className="md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
              <PlaylistCard
                playlist={playlist}
                onClick={() => onPlaylistClick(playlist.id)}
                gradientIndex={index}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
};

export default PlaylistSection;