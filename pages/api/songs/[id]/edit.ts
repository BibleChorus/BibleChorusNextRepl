import { withApiAuth } from '@/lib/server-auth';
import { NextApiRequest, NextApiResponse } from 'next'
import db from '@/db'
import { z } from 'zod';
import { syncSongScripture } from '@/lib/song-scripture';
import { refreshProgressMaterializedView } from '@/lib/db-utils';

const updateSchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  artist: z.string().max(255).nullable().optional(),
  genres: z.array(z.string().max(100)).min(1).max(100).optional(),
  lyrics: z.string().max(200000).optional(),
  lyrics_scripture_adherence: z.enum(['word_for_word', 'close_paraphrase', 'creative_inspiration', 'somewhat_connected', 'no_connection']).optional(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (req.method === 'PUT') {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: 'Provide valid song details' });
    const { title, artist, genres, lyrics, lyrics_scripture_adherence } = parsed.data;

    try {
      const updateData: any = {}

      if (title !== undefined) updateData.title = title
      if (artist !== undefined) updateData.artist = artist
      if (genres !== undefined) updateData.genres = genres
      if (lyrics !== undefined) updateData.lyrics = lyrics
      if (lyrics_scripture_adherence !== undefined) updateData.lyrics_scripture_adherence = lyrics_scripture_adherence

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: 'No data provided for update' })
      }

      await db.transaction(async trx => {
        await trx('songs').where('id', id).update(updateData);
        await syncSongScripture(trx, Number(id));
      });
      await refreshProgressMaterializedView();
      res.status(200).json({ message: 'Song updated successfully' })
    } catch (error) {
      console.error('Error updating song:', error)
      res.status(500).json({ message: 'Error updating song', error: error.message })
    }
  } else {
    res.setHeader('Allow', ['PUT'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}

export default withApiAuth(handler, { methods: ['PUT'], owner: 'songs' });
