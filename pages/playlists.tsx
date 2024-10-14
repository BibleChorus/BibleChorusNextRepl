import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
// Import the PlaylistSection component to display each group of playlists
import PlaylistSection from '../components/PlaylistSection';
// Import the function to fetch playlists from the API
import { fetchPlaylists } from '../lib/api';
// Import types for TypeScript
import { Playlist } from '../types';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import PlaylistCard from '../components/PlaylistCard';
import AutoplayPlugin from 'embla-carousel-autoplay';
import useEmblaCarousel from 'embla-carousel-react';
import { EmblaCarouselType } from 'embla-carousel';
import { BIBLE_BOOKS } from '@/lib/constants';

// Helper function to sort playlists
const sortPlaylists = (playlists: Playlist[], order: string[]) => {
  return playlists.sort((a, b) => {
    const indexA = order.indexOf(a.name);
    const indexB = order.indexOf(b.name);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });
};

// The main Playlists page component
export default function PlaylistsPage() {
  // State to hold all playlist groups
  const [playlistGroups, setPlaylistGroups] = useState<{ title: string; playlists: Playlist[] }[]>([]);
  // Next.js router for navigation
  const router = useRouter();

  // Fetch playlists from the server on component mount
  useEffect(() => {
    // Async function to fetch and organize playlists
    const getPlaylists = async () => {
      try {
        // Fetch playlists from the API
        const data = await fetchPlaylists();

        const oldTestamentBooks = BIBLE_BOOKS.slice(0, 39);
        const newTestamentBooks = BIBLE_BOOKS.slice(39);

        const oldTestamentPlaylists = sortPlaylists(
          data.oldTestamentPlaylists,
          ['Old Testament', ...oldTestamentBooks]
        );

        const newTestamentPlaylists = sortPlaylists(
          data.newTestamentPlaylists,
          ['New Testament', ...newTestamentBooks]
        );

        const groups = [
          {
            title: 'Auto Playlists',
            playlists: data.autoPlaylists,
          },
          {
            title: 'New Testament Songs',
            playlists: newTestamentPlaylists,
          },
          {
            title: 'Old Testament Songs',
            playlists: oldTestamentPlaylists,
          },
          {
            title: 'User Playlists',
            playlists: data.userPlaylists,
          },
        ];

        // Update the state with the organized playlist groups
        setPlaylistGroups(groups);
      } catch (error) {
        console.error('Error fetching playlists:', error);
      }
    };

    getPlaylists();
  }, []);

  const PlaylistCarousel = ({ playlists }: { playlists: Playlist[] }) => {
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' }, [AutoplayPlugin()]);

    const carouselRef = useCallback((node: HTMLElement | null) => {
      if (node !== null) {
        emblaRef(node);
      }
    }, [emblaRef]);

    useEffect(() => {
      if (emblaApi) {
        // You can add any additional configuration here
      }
    }, [emblaApi]);

    return (
      <Carousel ref={carouselRef} className="w-full">
        <CarouselContent>
          {playlists.map((playlist) => (
            <CarouselItem key={playlist.id} className="md:basis-1/2 lg:basis-1/3">
              <PlaylistCard
                playlist={playlist}
                onClick={() => router.push(`/listen?playlistId=${playlist.id}`)}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    );
  };

  // Render the page
  return (
    <div className="container mx-auto px-4 py-6 space-y-12">
      {/* Loop through each playlist group and render a PlaylistSection */}
      {playlistGroups.map((group, index) => (
        <div key={index} className="space-y-4">
          <h2 className="text-2xl font-bold">{group.title}</h2>
          <PlaylistCarousel playlists={group.playlists} />
        </div>
      ))}
    </div>
  );
}
