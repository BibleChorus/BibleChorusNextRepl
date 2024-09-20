import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import s3Client from '@/lib/s3';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { id } = req.query;

  const trx = await db.transaction();

  try {
    // Fetch the song data
    const song = await trx('songs').where('id', id).first();
    if (!song) {
      await trx.rollback();
      return res.status(404).json({ message: 'Song not found' });
    }

    // Delete song art from S3
    if (song.song_art_url) {
      const fileKey = song.song_art_url.split('/').pop();
      const deleteCommand = new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: fileKey,
      });
      await s3Client.send(deleteCommand);
    }

    // Delete audio file from S3
    if (song.audio_url) {
      const audioFileKey = song.audio_url.split('/').pop();
      const deleteAudioCommand = new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: audioFileKey,
      });
      await s3Client.send(deleteAudioCommand);
    }

    // Fetch associated verses
    const songVerses = await trx('song_verses').where('song_id', id);

    // Update progress_map
    for (const verse of songVerses) {
      const bibleVerse = await trx('bible_verses').where('id', verse.verse_id).first();
      await trx('progress_map')
        .where({ book: bibleVerse.book, chapter: bibleVerse.chapter })
        .update({
          verse_count: db.raw('verse_count - 1'),
          song_count: db.raw('song_count - 1'),
          [song.lyrics_scripture_adherence === 'The lyrics follow the scripture word-for-word' ? 'word_for_word_count' :
            song.lyrics_scripture_adherence === 'The lyrics closely follow the scripture passage' ? 'close_paraphrase_count' :
            'creative_inspiration_count']: db.raw('?? - 1', [`progress_map.${song.lyrics_scripture_adherence === 'The lyrics follow the scripture word-for-word' ? 'word_for_word_count' :
            song.lyrics_scripture_adherence === 'The lyrics closely follow the scripture passage' ? 'close_paraphrase_count' :
            'creative_inspiration_count'}`]),
          [song.ai_used_for_lyrics ? 'ai_lyrics_count' : 'human_created_count']: db.raw('?? - 1', [`progress_map.${song.ai_used_for_lyrics ? 'ai_lyrics_count' : 'human_created_count'}`]),
          [song.music_ai_generated ? 'ai_music_count' : 'human_created_count']: db.raw('?? - 1', [`progress_map.${song.music_ai_generated ? 'ai_music_count' : 'human_created_count'}`]),
          [song.is_continuous_passage ? 'continuous_passage_count' : 'non_continuous_passage_count']: db.raw('?? - 1', [`progress_map.${song.is_continuous_passage ? 'continuous_passage_count' : 'non_continuous_passage_count'}`]),
          genre_counts: db.raw(`jsonb_set(
            genre_counts::jsonb,
            '{${song.genre}}',
            (COALESCE((genre_counts->>'${song.genre}')::int, 1) - 1)::text::jsonb
          )`),
          translation_counts: db.raw(`jsonb_set(
            translation_counts::jsonb,
            '{${song.bible_translation_used}}',
            (COALESCE((translation_counts->>'${song.bible_translation_used}')::int, 1) - 1)::text::jsonb
          )`),
        });
    }

    // Delete song_verses entries
    await trx('song_verses').where('song_id', id).delete();

    // Delete the song
    await trx('songs').where('id', id).delete();

    await trx.commit();
    res.status(200).json({ message: 'Song deleted successfully' });
  } catch (error) {
    await trx.rollback();
    console.error('Error deleting song:', error);
    res.status(500).json({ message: 'Error deleting song', error: error.message });
  }
}