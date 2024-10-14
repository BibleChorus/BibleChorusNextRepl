import { Playlist } from '../../../types';
import { BIBLE_BOOKS } from '@/lib/constants';

// Function to fetch playlists from the API
export async function fetchPlaylists(): Promise<{
  autoPlaylists: Playlist[];
  oldTestamentPlaylists: Playlist[];
  newTestamentPlaylists: Playlist[];
  userPlaylists: Playlist[];
}> {
  // Fetch data from the server-side API route
  const response = await fetch('/api/playlists');

  // Check if the response is OK
  if (!response.ok) {
    // Get the error message from the response
    const errorText = await response.text();
    throw new Error(`Error fetching playlists: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();

  // Extract playlists based on criteria
  const playlists = data.playlists as Playlist[];

  // Filter and categorize playlists
  const autoPlaylists = playlists.filter((p) => 
    p.is_auto && 
    p.name !== 'Old Testament' && 
    p.name !== 'New Testament' && 
    !BIBLE_BOOKS.includes(p.name)
  );
  const oldTestamentPlaylists = playlists.filter((p) => 
    p.name === 'Old Testament' || 
    (p.tags && p.tags.includes('Old Testament')) ||
    BIBLE_BOOKS.slice(0, 39).includes(p.name)
  );
  const newTestamentPlaylists = playlists.filter((p) => 
    p.name === 'New Testament' || 
    (p.tags && p.tags.includes('New Testament')) ||
    BIBLE_BOOKS.slice(39).includes(p.name)
  );
  const userPlaylists = playlists.filter((p) => 
    !p.is_auto && 
    p.name !== 'Old Testament' && 
    p.name !== 'New Testament' && 
    !BIBLE_BOOKS.includes(p.name)
  );

  return {
    autoPlaylists,
    oldTestamentPlaylists,
    newTestamentPlaylists,
    userPlaylists,
  };
}
