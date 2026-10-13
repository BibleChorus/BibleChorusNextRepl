import type { Knex } from 'knex';

const ARRAY_COLUMNS = [
  'all_song_ids', 'ai_lyrics_song_ids', 'human_lyrics_song_ids',
  'ai_music_song_ids', 'human_music_song_ids', 'continuous_passage_song_ids',
  'non_continuous_passage_song_ids', 'word_for_word_song_ids',
  'close_paraphrase_song_ids', 'creative_inspiration_song_ids',
  'somewhat_connected_song_ids', 'no_connection_song_ids',
];
const JSON_COLUMNS = ['translation_song_ids', 'genre_song_ids'];

/** Keep the coverage cache consistent with the canonical song_verses relation. */
export async function syncSongScripture(trx: Knex.Transaction, songId: number, previousVerseIds: number[] = []) {
  const verseIds: number[] = await trx('song_verses').where({ song_id: songId }).pluck('verse_id');
  const affectedIds = [...new Set([...previousVerseIds, ...verseIds])];
  if (!affectedIds.length) return;
  const remove: Record<string, any> = {};
  for (const column of ARRAY_COLUMNS) remove[column] = trx.raw('array_remove(COALESCE(??, ARRAY[]::integer[]), ?)', [column, songId]);
  for (const column of JSON_COLUMNS) {
    remove[column] = trx.raw(`
      COALESCE((SELECT jsonb_object_agg(entry.key,
        COALESCE((SELECT jsonb_agg(item.value) FROM jsonb_array_elements(entry.value) item
          WHERE item.value <> to_jsonb(?::integer)), '[]'::jsonb))
        FROM jsonb_each(COALESCE(??, '{}'::jsonb)) entry), '{}'::jsonb)
    `, [songId, column]);
  }
  await trx('bible_verses').whereIn('id', affectedIds).update(remove);
  const song = await trx('songs').where({ id: songId }).first();
  if (!song || !verseIds.length) return;
  const append: Record<string, any> = {};
  const categories = [
    'all_song_ids', song.ai_used_for_lyrics ? 'ai_lyrics_song_ids' : 'human_lyrics_song_ids',
    song.music_ai_generated ? 'ai_music_song_ids' : 'human_music_song_ids',
    song.is_continuous_passage ? 'continuous_passage_song_ids' : 'non_continuous_passage_song_ids',
    `${song.lyrics_scripture_adherence}_song_ids`,
  ];
  for (const column of categories) {
    if (ARRAY_COLUMNS.includes(column)) append[column] = trx.raw('array_append(COALESCE(??, ARRAY[]::integer[]), ?)', [column, songId]);
  }
  await trx('bible_verses').whereIn('id', verseIds).update(append);
  const pairs: [string, string][] = (Array.isArray(song.genres) ? song.genres : []).map((genre: string) => ['genre_song_ids', genre]);
  if (song.bible_translation_used) pairs.push(['translation_song_ids', song.bible_translation_used]);
  for (const [column, value] of pairs) {
    await trx('bible_verses').whereIn('id', verseIds).update({
      [column]: trx.raw("jsonb_set(COALESCE(??, '{}'::jsonb), ARRAY[?::text], COALESCE(??->?::text, '[]'::jsonb) || ?::jsonb)", [column, value, column, value, JSON.stringify([songId])]),
    });
  }
}
