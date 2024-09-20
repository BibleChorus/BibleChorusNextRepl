import { NextApiRequest, NextApiResponse } from 'next';
import db from '../../db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

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
    bible_verses,
  } = req.body;

  // Get the CDN URL from environment variables
  const cdnUrl = process.env.CDN_URL || '';

  // Prepend CDN URL to audio_url and song_art_url
  const fullAudioUrl = audio_url ? `${cdnUrl}${audio_url}` : null;
  const fullSongArtUrl = song_art_url ? `${cdnUrl}${song_art_url}` : null;

  // Validate required fields
  const missingFields: string[] = [];
  if (!title) missingFields.push('title');
  if (!fullAudioUrl) missingFields.push('audio_url');
  if (!uploaded_by) missingFields.push('uploaded_by');
  if (!bible_translation_used) missingFields.push('bible_translation_used');
  if (!genre) missingFields.push('genre');
  if (!lyrics_scripture_adherence) missingFields.push('lyrics_scripture_adherence');
  if (!lyrics) missingFields.push('lyrics');
  if (!bible_verses) missingFields.push('bible_verses');

  if (missingFields.length > 0) {
    return res.status(400).json({ message: 'Missing required fields', missingFields });
  }

  const trx = await db.transaction();
  let songId: { id: number } | undefined;

  try {
    // Insert into songs table
    const [insertedSong] = await trx('songs').insert({
      title,
      artist: artist || null,
      audio_url: fullAudioUrl,
      uploaded_by,
      ai_used_for_lyrics: ai_used_for_lyrics || false,
      music_ai_generated: music_ai_generated || false,
      bible_translation_used,
      genre,
      lyrics_scripture_adherence,
      is_continuous_passage: is_continuous_passage || false,
      lyrics,
      lyric_ai_prompt: lyric_ai_prompt || null,
      music_ai_prompt: music_ai_prompt || null,
      music_model_used: music_model_used || null,
      song_art_url: fullSongArtUrl,
    }).returning('id');

    if (!insertedSong || typeof insertedSong.id !== 'number') {
      throw new Error('Failed to insert song or invalid song ID');
    }

    const songId = insertedSong.id;

    console.log('Inserted song ID:', songId);

    // Query the bible_verses table and insert into song_verses table
    const verseReferences = bible_verses.split(',').map(v => v.trim());
    console.log('Verse references:', verseReferences);

    console.log('Knex query:', trx('bible_verses')
      .whereRaw(`CONCAT(book, ' ', chapter, ':', verse) IN (${verseReferences.map(() => '?').join(',')})`, verseReferences)
      .select('id', 'book', 'chapter', 'verse').toString());

    const verseData = await trx('bible_verses')
      .whereRaw(`CONCAT(book, ' ', chapter, ':', verse) IN (${verseReferences.map(() => '?').join(',')})`, verseReferences)
      .select('id', 'book', 'chapter', 'verse');

    console.log('Verse data:', verseData);

    if (verseData.length === 0) {
      console.log('No matching verses found. Attempting individual queries...');
      for (const verseRef of verseReferences) {
        const [book, chapterVerse] = verseRef.split(' ');
        const [chapter, verse] = chapterVerse.split(':');
        const result = await trx('bible_verses')
          .where({ book, chapter, verse })
          .first();
        console.log(`Query for ${verseRef}:`, result);
      }
      throw new Error('No matching Bible verses found');
    }

    await trx('song_verses').insert(
      verseData.map(verse => ({ 
        song_id: songId,
        verse_id: verse.id 
      }))
    );

    // Update progress_map table
    type ProgressUpdate = {
      book: string;
      chapter: number;
      verses: Set<number>;
    };

    const progressUpdates = verseData.reduce((acc, { book, chapter, verse }) => {
      const key = `${book}-${chapter}`;
      if (!acc[key]) {
        acc[key] = { book, chapter, verses: new Set([verse]) };
      } else {
        acc[key].verses.add(verse);
      }
      return acc;
    }, {} as Record<string, ProgressUpdate>);

    for (const update of Object.values(progressUpdates) as ProgressUpdate[]) {
      const uniqueVerseCount = update.verses.size;
      
      await trx('progress_map')
        .insert({
          book: update.book,
          chapter: update.chapter,
          total_verses_in_chapter: await getTotalVersesInChapter(trx, update.book, update.chapter),
          total_verses_covered_count: uniqueVerseCount,
          song_ids: [songId],
          testament: ['Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy'].includes(update.book) ? 'Old' : 'New',
          [lyrics_scripture_adherence === 'The lyrics follow the scripture word-for-word' ? 'word_for_word_verse_count' :
            lyrics_scripture_adherence === 'The lyrics closely follow the scripture passage' ? 'close_paraphrase_verse_count' :
            'creative_inspiration_verse_count']: uniqueVerseCount,
          [ai_used_for_lyrics ? 'ai_lyrics_verse_count' : 'human_created_verse_count']: uniqueVerseCount,
          [music_ai_generated ? 'ai_music_verse_count' : 'human_created_verse_count']: uniqueVerseCount,
          [is_continuous_passage ? 'continuous_passage_verse_count' : 'non_continuous_passage_verse_count']: uniqueVerseCount,
          genre_verse_counts: JSON.stringify({ [genre]: uniqueVerseCount }),
          translation_verse_counts: JSON.stringify({ [bible_translation_used]: uniqueVerseCount }),
          last_updated: trx.fn.now(),
        })
        .onConflict(['book', 'chapter'])
        .merge((existing) => {
          const newTotalVersesCovered = db.raw(`
            LEAST(
              ??,
              ?? + (
                SELECT COUNT(DISTINCT v.verse)
                FROM UNNEST(?::int[]) AS v(verse)
                WHERE v.verse NOT IN (
                  SELECT unnest(string_to_array(COALESCE(??, ''), ',')::int[])
                )
              )
            )
          `, [
            'total_verses_in_chapter',
            'total_verses_covered_count',
            Array.from(update.verses),
            'covered_verses'
          ]);

          return {
            total_verses_covered_count: newTotalVersesCovered,
            song_ids: db.raw('array_append(progress_map.song_ids, ?)', [songId]),
            covered_verses: db.raw(`
              ARRAY(
                SELECT DISTINCT unnest(
                  array_cat(
                    string_to_array(COALESCE(??, ''), ',')::int[],
                    ?::int[]
                  )
                )::text
              )::text[]
            `, ['covered_verses', Array.from(update.verses)]),
            [lyrics_scripture_adherence === 'The lyrics follow the scripture word-for-word' ? 'word_for_word_verse_count' :
              lyrics_scripture_adherence === 'The lyrics closely follow the scripture passage' ? 'close_paraphrase_verse_count' :
              'creative_inspiration_verse_count']: db.raw('?? + ?', [
                `progress_map.${lyrics_scripture_adherence === 'The lyrics follow the scripture word-for-word' ? 'word_for_word_verse_count' :
                lyrics_scripture_adherence === 'The lyrics closely follow the scripture passage' ? 'close_paraphrase_verse_count' :
                'creative_inspiration_verse_count'}`,
                newTotalVersesCovered
              ]),
            [ai_used_for_lyrics ? 'ai_lyrics_verse_count' : 'human_created_verse_count']: db.raw('?? + ?', [
              `progress_map.${ai_used_for_lyrics ? 'ai_lyrics_verse_count' : 'human_created_verse_count'}`,
              newTotalVersesCovered
            ]),
            [music_ai_generated ? 'ai_music_verse_count' : 'human_created_verse_count']: db.raw('?? + ?', [
              `progress_map.${music_ai_generated ? 'ai_music_verse_count' : 'human_created_verse_count'}`,
              newTotalVersesCovered
            ]),
            [is_continuous_passage ? 'continuous_passage_verse_count' : 'non_continuous_passage_verse_count']: db.raw('?? + ?', [
              `progress_map.${is_continuous_passage ? 'continuous_passage_verse_count' : 'non_continuous_passage_verse_count'}`,
              newTotalVersesCovered
            ]),
            genre_verse_counts: db.raw(`
              jsonb_set(
                COALESCE(progress_map.genre_verse_counts, '{}')::jsonb,
                '{${genre}}',
                to_jsonb(COALESCE((progress_map.genre_verse_counts->>'${genre}')::int, 0) + ?)
              )
            `, [uniqueVerseCount]),
            translation_verse_counts: db.raw(`
              jsonb_set(
                COALESCE(progress_map.translation_verse_counts, '{}')::jsonb,
                '{${bible_translation_used}}',
                to_jsonb(COALESCE((progress_map.translation_verse_counts->>'${bible_translation_used}')::int, 0) + ?)
              )
            `, [uniqueVerseCount]),
            last_updated: trx.fn.now(),
          };
        });
    }

    await trx.commit();
    res.status(200).json({ message: 'Song submitted successfully', songId: songId });
  } catch (error) {
    await trx.rollback();
    console.error('Error submitting song:', error);
    if (error instanceof Error) {
      res.status(500).json({ 
        message: 'Error submitting song', 
        error: error.message, 
        stack: error.stack,
        verseReferences: bible_verses,
        query: trx('bible_verses')
          .whereRaw(`CONCAT(book, ' ', chapter, ':', verse) IN (${bible_verses.split(',').map(() => '?').join(',')})`, bible_verses.split(',').map(v => v.trim()))
          .select('id', 'book', 'chapter', 'verse')
          .toString(),
        songId: songId // This will be undefined if insertion failed
      });
    } else {
      res.status(500).json({ message: 'Error submitting song', error: 'An unknown error occurred' });
    }
  }
}

// Helper function to get total verses in a chapter
async function getTotalVersesInChapter(trx, book, chapter) {
  const result = await trx('bible_verses')
    .where({ book, chapter })
    .count('* as total')
    .first();
  return result ? result.total : 0;
}