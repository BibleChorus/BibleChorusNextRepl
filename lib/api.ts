import { Playlist } from '../types';

// Function to fetch playlists from the API
export async function fetchPlaylists(): Promise<{
  autoPlaylists: Playlist[];
  newTestamentPlaylists: Playlist[];
  oldTestamentPlaylists: Playlist[];
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
  const autoPlaylists = playlists.filter((p) => p.is_auto);
  const newTestamentPlaylists = playlists.filter((p) => p.tags && p.tags.includes('New Testament'));
  const oldTestamentPlaylists = playlists.filter((p) => p.tags && p.tags.includes('Old Testament'));
  const userPlaylists = playlists.filter((p) => !p.is_auto);

  return {
    autoPlaylists,
    newTestamentPlaylists,
    oldTestamentPlaylists,
    userPlaylists,
  };
}
