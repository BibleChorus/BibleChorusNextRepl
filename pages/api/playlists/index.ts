import { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../lib/db'; // Corrected import path

// Update: Use process.env.CDN_URL for server-side environment variables
const CDN_URL = process.env.CDN_URL || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  if (method === 'GET') {
    // Handle GET requests
    try {
      // Fetch public playlists from the database
      const playlists = await db('playlists')
        .select(
          'playlists.*',
          db.raw('COUNT(likes.id) as like_count')
        )
        .leftJoin('likes', function () {
          this.on('playlists.id', '=', 'likes.likeable_id')
              .andOn('likes.likeable_type', '=', db.raw('?', ['playlist']));
        })
        .where('playlists.is_public', true)
        .groupBy('playlists.id')
        .orderBy('like_count', 'desc');

      // Send the playlists as JSON
      res.status(200).json({ playlists });
    } catch (error) {
      console.error('Error fetching playlists:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  } else if (method === 'POST') {
    // Handle POST requests (create a new playlist)
    const {
      name,
      description,
      is_public,
      cover_art_url,
      song_ids,
      user_id, // Get user_id from request body
    } = req.body;

    if (!user_id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      // Prepend CDN_URL to cover_art_url if it's not already included
      const fullCoverArtUrl = cover_art_url && !cover_art_url.startsWith(CDN_URL)
        ? `${CDN_URL}${cover_art_url}`
        : cover_art_url;

      // Insert the new playlist and get the returned id
      const [playlist] = await db('playlists')
        .insert({
          name,
          description,
          is_public,
          cover_art_url: fullCoverArtUrl,
          user_id,
          created_at: new Date(),
          last_updated: new Date(),
        })
        .returning('id');

      const playlistId = playlist.id;

      // Insert into user_playlist_library with is_creator = true
      await db('user_playlist_library').insert({
        user_id,
        playlist_id: playlistId,
        is_creator: true,
        added_at: new Date(),
        is_favorite: false, // Set default values as needed
      });

      if (song_ids && song_ids.length > 0) {
        const playlistSongs = song_ids.map((song_id: number, index: number) => ({
          playlist_id: playlistId,
          song_id,
          position: index + 1,
          added_by: user_id,
          added_at: new Date(),
        }));
        await db.batchInsert('playlist_songs', playlistSongs);
      }

      res.status(201).json({ id: playlistId });
    } catch (error) {
      console.error('Error creating playlist:', error);
      res.status(500).json({ message: 'Error creating playlist', error });
    }
  } else {
    // Return 405 for other methods
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${method} Not Allowed`);
  }
}
