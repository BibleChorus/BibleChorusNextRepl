import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import PlaylistSection from '../components/PlaylistsPage/PlaylistSection';
import { fetchPlaylists } from './api/playlists/api';
import { Playlist } from '../types';
import { BIBLE_BOOKS } from '@/lib/constants';

const oldTestamentOrder = ['Old Testament', ...BIBLE_BOOKS.slice(0, 39)];
const newTestamentOrder = ['New Testament', ...BIBLE_BOOKS.slice(39)];

const sortPlaylists = (playlists: Playlist[], order: string[]) => {
  return playlists.sort((a, b) => {
    const indexA = order.indexOf(a.name);
    const indexB = order.indexOf(b.name);
    if (indexA === -1 && indexB === -1) {
      return a.name.localeCompare(b.name);
    }
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });
};

export default function PlaylistsPage() {
  const [playlistGroups, setPlaylistGroups] = useState<{ title: string; playlists: Playlist[] }[]>([]);
  const router = useRouter();

  useEffect(() => {
    const getPlaylists = async () => {
      try {
        const data = await fetchPlaylists();

        const oldTestamentPlaylists = sortPlaylists(data.oldTestamentPlaylists, oldTestamentOrder);
        const newTestamentPlaylists = sortPlaylists(data.newTestamentPlaylists, newTestamentOrder);

        const groups = [
          {
            title: 'Auto Playlists',
            playlists: data.autoPlaylists,
          },
          {
            title: 'Old Testament Songs',
            playlists: oldTestamentPlaylists,
          },
          {
            title: 'New Testament Songs',
            playlists: newTestamentPlaylists,
          },
          {
            title: 'User Playlists',
            playlists: data.userPlaylists,
          },
        ];

        setPlaylistGroups(groups);
      } catch (error) {
        console.error('Error fetching playlists:', error);
      }
    };

    getPlaylists();
  }, []);

  const handlePlaylistClick = (playlistId: number) => {
    router.push(`/playlists/${playlistId}`);
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-12 animate-fadeIn">
      {playlistGroups.map((group, index) => (
        <PlaylistSection
          key={index}
          title={group.title}
          playlists={group.playlists}
          onPlaylistClick={handlePlaylistClick}
        />
      ))}
    </div>
  );
}
