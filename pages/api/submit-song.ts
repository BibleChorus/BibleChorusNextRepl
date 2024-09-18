import { NextApiRequest, NextApiResponse } from 'next'
import { knex } from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('submit-song API route called');
  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ message: 'Method not allowed' })
  }

  console.log('Received data:', req.body);

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
    song_art_url,
    bible_verses
  } = req.body

  try {
    console.log('Starting database transaction');
    const result = await knex.transaction(async (trx) => {
      // Insert into songs table
      const [songId] = await trx('songs').insert({
        title,
        artist,
        audio_url: audio_url.replace(process.env.AWS_S3_BUCKET_URL, process.env.CDN_URL),
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
        song_art_url: song_art_url.replace(process.env.AWS_S3_BUCKET_URL, process.env.CDN_URL)
      }).returning('id')

      // Insert into song_verses table
      const verseInserts = bible_verses.map((verse: string) => {
        const [book, chapterVerse] = verse.split(' ')
        const [chapter, verseNumber] = chapterVerse.split(':')
        return trx('bible_verses')
          .select('id')
          .where({ book, chapter, verse: verseNumber })
          .first()
          .then((result: { id: number }) => {
            return trx('song_verses').insert({
              song_id: songId,
              verse_id: result.id
            })
          })
      })
      await Promise.all(verseInserts)

      // Update progress_map
      const [book, chapter] = bible_verses[0].split(' ')
      await trx('progress_map')
        .where({ book, chapter })
        .increment('song_count', 1)
        .update({
          last_updated: knex.fn.now(),
          [`${lyrics_scripture_adherence.toLowerCase().replace(/ /g, '_')}_count`]: knex.raw('?? + 1', [`${lyrics_scripture_adherence.toLowerCase().replace(/ /g, '_')}_count`]),
          genre_counts: knex.raw(`jsonb_set(genre_counts, '{${genre}}', (COALESCE(genre_counts->>'${genre}', '0')::int + 1)::text::jsonb)`),
          translation_counts: knex.raw(`jsonb_set(translation_counts, '{${bible_translation_used}}', (COALESCE(translation_counts->>'${bible_translation_used}', '0')::int + 1)::text::jsonb)`),
          ai_lyrics_count: knex.raw(`CASE WHEN ? THEN ai_lyrics_count + 1 ELSE ai_lyrics_count END`, [ai_used_for_lyrics]),
          ai_music_count: knex.raw(`CASE WHEN ? THEN ai_music_count + 1 ELSE ai_music_count END`, [music_ai_generated]),
          human_created_count: knex.raw(`CASE WHEN ? OR ? THEN human_created_count ELSE human_created_count + 1 END`, [ai_used_for_lyrics, music_ai_generated]),
          continuous_passage_count: knex.raw(`CASE WHEN ? THEN continuous_passage_count + 1 ELSE continuous_passage_count END`, [is_continuous_passage]),
          non_continuous_passage_count: knex.raw(`CASE WHEN ? THEN non_continuous_passage_count ELSE non_continuous_passage_count + 1 END`, [is_continuous_passage])
        })

      return songId
    })
    console.log('Transaction completed successfully');

    res.status(200).json({ message: 'Song submitted successfully', songId: result })
  } catch (error) {
    console.error('Error submitting song:', error)
    res.status(500).json({ message: 'Error submitting song', error: error.message })
  }
}