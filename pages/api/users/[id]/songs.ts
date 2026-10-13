import { withApiAuth } from '@/lib/server-auth';
import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';
import submitSong from '@/pages/api/submit-song';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  switch (req.method) {
    case 'GET':
      try {
        const songs = await db('songs')
          .select('id', 'title', 'artist', /* Remove 'genre', */ 'genres', 'created_at')
          .where('uploaded_by', id)
          .orderBy('created_at', 'desc');
        res.status(200).json(songs);
      } catch (error) {
        res.status(500).json({ message: 'Error fetching user songs', error });
      }
      break;

    case 'POST': {
      // Keep this historical route usable without maintaining a second, weaker
      // submission pipeline or writing the removed `genre` column.
      const { genre, ...body } = req.body;
      req.body = {
        ...body,
        genres: Array.isArray(body.genres) ? body.genres : typeof genre === 'string' && genre.trim() ? [genre.trim()] : [],
      };
      const json = res.json.bind(res);
      const status = res.status.bind(res);
      res.status = code => status(code === 200 ? 201 : code);
      res.json = data => json(data?.songId ? { id: data.songId } : data);
      try {
        await submitSong(req, res);
      } finally {
        res.json = json;
        res.status = status;
      }
      break;
    }

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export default withApiAuth(handler, { methods: ['POST'], owner: 'users', identityFields: ['uploaded_by'] });
