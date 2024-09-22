import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import s3Client from '@/lib/s3';
import { Knex } from 'knex';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { id } = req.query;
  console.log('Deleting song with ID:', id);

  const trx = await db.transaction();

  try {
    // Fetch the song data
    const song = await trx('songs').where('id', id).first();
    if (!song) {
      await trx.rollback();
      return res.status(404).json({ message: 'Song not found' });
    }
    console.log('Song data:', song);

    // Delete song art from S3
    if (song.song_art_url) {
      const fileKey = song.song_art_url.split('/').pop();
      const deleteCommand = new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: fileKey,
      });
      await s3Client.send(deleteCommand);
      console.log('Deleted song art from S3:', fileKey);
    }

    // Delete audio file from S3
    if (song.audio_url) {
      const audioFileKey = song.audio_url.split('/').pop();
      const deleteAudioCommand = new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: audioFileKey,
      });
      await s3Client.send(deleteAudioCommand);
      console.log('Deleted audio file from S3:', audioFileKey);
    }

    // Update bible_verses table
    await updateBibleVerses(trx, Number(id), song);

    // Delete song_verses entries
    await trx('song_verses').where('song_id', id).delete();

    // Delete the song
    await trx('songs').where('id', id).delete();

    await trx.commit();
    res.status(200).json({ message: 'Song deleted successfully' });
  } catch (error) {
    await trx.rollback();
    console.error('Error deleting song:', error);
    
    let errorMessage = 'Error deleting song';
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;
      console.error('Error stack:', error.stack);
    }

    if (error.code) {
      console.error('Error code:', error.code);
      errorMessage += ` (Code: ${error.code})`;
    }

    if (error.detail) {
      console.error('Error detail:', error.detail);
      errorMessage += ` - ${error.detail}`;
    }

    res.status(statusCode).json({ message: errorMessage, error: error.toString() });
  }
}

async function updateBibleVerses(trx: Knex.Transaction, songId: number, songData: any) {
  const verseIds = await trx('song_verses')
    .where('song_id', songId)
    .pluck('verse_id');

  const genres = songData.genre.split(',').map(g => g.trim());

  for (const verseId of verseIds) {
    const updateObj: any = {
      all_song_ids: trx.raw('array_remove(all_song_ids, ?)', [songId]),
      ai_lyrics_song_ids: songData.ai_used_for_lyrics ? trx.raw('array_remove(ai_lyrics_song_ids, ?)', [songId]) : trx.raw('ai_lyrics_song_ids'),
      human_lyrics_song_ids: !songData.ai_used_for_lyrics ? trx.raw('array_remove(human_lyrics_song_ids, ?)', [songId]) : trx.raw('human_lyrics_song_ids'),
      ai_music_song_ids: songData.music_ai_generated ? trx.raw('array_remove(ai_music_song_ids, ?)', [songId]) : trx.raw('ai_music_song_ids'),
      human_music_song_ids: !songData.music_ai_generated ? trx.raw('array_remove(human_music_song_ids, ?)', [songId]) : trx.raw('human_music_song_ids'),
      continuous_passage_song_ids: songData.is_continuous_passage ? trx.raw('array_remove(continuous_passage_song_ids, ?)', [songId]) : trx.raw('continuous_passage_song_ids'),
      non_continuous_passage_song_ids: !songData.is_continuous_passage ? trx.raw('array_remove(non_continuous_passage_song_ids, ?)', [songId]) : trx.raw('non_continuous_passage_song_ids'),
      [songData.lyrics_scripture_adherence + '_song_ids']: trx.raw(`array_remove(${songData.lyrics_scripture_adherence}_song_ids, ?)`, [songId]),
      translation_song_ids: trx.raw(`
        jsonb_set(
          COALESCE(translation_song_ids, '{}'::jsonb),
          ARRAY[?],
          (
            SELECT COALESCE(
              jsonb_agg(value) FILTER (WHERE value::text::integer != ?),
              '[]'::jsonb
            )
            FROM jsonb_array_elements(COALESCE(translation_song_ids->?, '[]'::jsonb))
          )
        )
      `, [songData.bible_translation_used, songId, songData.bible_translation_used])
    };

    // Handle genre_song_ids
    for (const genre of genres) {
      updateObj.genre_song_ids = trx.raw(`
        jsonb_set(
          COALESCE(genre_song_ids, '{}'::jsonb),
          ARRAY[?],
          (
            SELECT COALESCE(
              jsonb_agg(value) FILTER (WHERE value::text::integer != ?),
              '[]'::jsonb
            )
            FROM jsonb_array_elements(COALESCE(genre_song_ids->?, '[]'::jsonb))
          )
        )
      `, [genre, songId, genre]);
    }

    await trx('bible_verses')
      .where('id', verseId)
      .update(updateObj);
  }
}