import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import s3Client from '@/lib/s3';
import type { Knex } from 'knex';
import { refreshProgressMaterializedView } from '@/lib/db-utils';
import { requireUser, withApiAuth } from '@/lib/server-auth';
import { assertUnreferencedFile, ownedStorageKey } from '@/lib/storage-keys';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') return res.status(405).json({ message: 'Method not allowed' });
  const user = await requireUser(req, res);
  const id = Number(req.query.id);
  // Storage cannot participate in a PostgreSQL rollback. Commit the authorized
  // database change first; preserve all files if it fails, and retain shared files.
  const song = await db.transaction(async trx => {
    const record = await trx('songs').where({ id, uploaded_by: user.id }).forUpdate().first();
    if (!record) return null;
    await updateBibleVerses(trx, id, record);
    await trx('song_verses').where({ song_id: id }).delete();
    await trx('songs').where({ id, uploaded_by: user.id }).delete();
    return record;
  });
  if (!song) return res.status(404).json({ message: 'Song not found' });
  await refreshProgressMaterializedView();
  for (const value of [song.song_art_url, song.audio_url].filter(Boolean)) {
    try {
      const key = ownedStorageKey(value, user.id);
      await assertUnreferencedFile(key);
      await s3Client.send(new DeleteObjectCommand({ Bucket: process.env.AWS_S3_BUCKET_NAME, Key: key }));
    } catch (error) {
      // A retained object is preferable to lost files or a misleading deletion failure.
      console.error('Song deleted; retaining a referenced or unavailable storage object:', error);
    }
  }
  return res.status(200).json({ message: 'Song deleted successfully' });
}

async function updateBibleVerses(trx: Knex.Transaction, songId: number, songData: any) {
  const verseIds = await trx('song_verses')
    .where('song_id', songId)
    .pluck('verse_id');

  // Update this line to use 'genres' instead of 'genre' and ensure it's an array
  const genres = songData.genres || [];

  const adherenceColumn = `${songData.lyrics_scripture_adherence}_song_ids`;
  const validAdherenceColumns = ['word_for_word_song_ids', 'close_paraphrase_song_ids', 'creative_inspiration_song_ids', 'somewhat_connected_song_ids', 'no_connection_song_ids'];

  for (const verseId of verseIds) {
    const updateObj: any = {
      all_song_ids: trx.raw('array_remove(all_song_ids, ?)', [songId]),
      ai_lyrics_song_ids: songData.ai_used_for_lyrics
        ? trx.raw('array_remove(ai_lyrics_song_ids, ?)', [songId])
        : trx.raw('ai_lyrics_song_ids'),
      human_lyrics_song_ids: !songData.ai_used_for_lyrics
        ? trx.raw('array_remove(human_lyrics_song_ids, ?)', [songId])
        : trx.raw('human_lyrics_song_ids'),
      ai_music_song_ids: songData.music_ai_generated
        ? trx.raw('array_remove(ai_music_song_ids, ?)', [songId])
        : trx.raw('ai_music_song_ids'),
      human_music_song_ids: !songData.music_ai_generated
        ? trx.raw('array_remove(human_music_song_ids, ?)', [songId])
        : trx.raw('human_music_song_ids'),
      continuous_passage_song_ids: songData.is_continuous_passage
        ? trx.raw('array_remove(continuous_passage_song_ids, ?)', [songId])
        : trx.raw('continuous_passage_song_ids'),
      non_continuous_passage_song_ids: !songData.is_continuous_passage
        ? trx.raw('array_remove(non_continuous_passage_song_ids, ?)', [songId])
        : trx.raw('non_continuous_passage_song_ids'),

    };

    if (validAdherenceColumns.includes(adherenceColumn)) {
      updateObj[adherenceColumn] = trx.raw(`array_remove(${adherenceColumn}, ?)`, [songId]);
    }

    // Update translation_song_ids
    await trx('bible_verses')
      .where('id', verseId)
      .update({
        ...updateObj,
        translation_song_ids: trx.raw(
          `
          jsonb_set(
            COALESCE(translation_song_ids, '{}'::jsonb),
            ?,  -- Path to key
            (
              SELECT COALESCE(
                jsonb_agg(value) FILTER (WHERE value::text::integer != ?),
                '[]'::jsonb
              )
              FROM jsonb_array_elements(COALESCE(translation_song_ids->?::text, '[]'::jsonb))
            )
          )
        `,
          [
            `{${songData.bible_translation_used}}`,
            songId,
            songData.bible_translation_used,
          ]
        ),
      });

    // Update genre_song_ids for each genre
    for (const genre of genres) {
      await trx('bible_verses')
        .where('id', verseId)
        .update({
          genre_song_ids: trx.raw(
            `
            jsonb_set(
              COALESCE(genre_song_ids, '{}'::jsonb),
              ?,  -- Path to key
              (
                SELECT COALESCE(
                  jsonb_agg(value) FILTER (WHERE value::text::integer != ?),
                  '[]'::jsonb
                )
                FROM jsonb_array_elements(COALESCE(genre_song_ids->?::text, '[]'::jsonb))
              )
            )
          `,
            [`{${genre}}`, songId, genre]
          ),
        });
    }
  }
}

export default withApiAuth(handler, { methods: ['DELETE'], owner: 'songs' });
