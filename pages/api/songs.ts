import { NextApiRequest, NextApiResponse } from 'next';
import db from '../../db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      try {
        const songs = await db('songs').select('*');
        res.status(200).json(songs);
      } catch (error) {
        res.status(500).json({ message: 'Error fetching songs', error });
      }
      break;

    case 'POST':
      try {
        const {
          title,
          artist,
          audio_url,
          uploaded_by,
          ai_used_for_lyrics,
          music_ai_generated,
          bible_translation_used,
          genre,
          lyrics_scripture_adherence,
          is_continuous_passage,
          lyrics,
          lyric_ai_prompt,
          music_ai_prompt,
          music_model_used,
          song_art_url
        } = req.body;

        const [id] = await db('songs').insert({
          title,
          artist,
          audio_url,
          uploaded_by,
          ai_used_for_lyrics,
          music_ai_generated,
          bible_translation_used,
          genre,
          lyrics_scripture_adherence,
          is_continuous_passage,
          lyrics,
          lyric_ai_prompt,
          music_ai_prompt,
          music_model_used,
          song_art_url
        }).returning('id');

        res.status(201).json({ id });
      } catch (error) {
        res.status(500).json({ message: 'Error creating song', error });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}