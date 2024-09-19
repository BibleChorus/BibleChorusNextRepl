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

  // Validate required fields
  const missingFields: string[] = [];
  if (!title) missingFields.push('title');
  if (!audio_url) missingFields.push('audio_url');
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
      audio_url,
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
      song_art_url: song_art_url || null,
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
      count: number;
    };

    const progressUpdates = verseData.reduce((acc, { book, chapter }) => {
      const key = `${book}-${chapter}`;
      if (!acc[key]) {
        acc[key] = { book, chapter, count: 1 };
      } else {
        acc[key].count++;
      }
      return acc as Record<string, ProgressUpdate>;
    }, {} as Record<string, ProgressUpdate>);

    for (const update of Object.values(progressUpdates) as ProgressUpdate[]) {
      await trx('progress_map')
        .insert({
          book: update.book,
          chapter: update.chapter,
          verse_count: update.count,
          song_count: 1,
          testament: ['Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy'].includes(update.book) ? 'Old' : 'New',
          [lyrics_scripture_adherence === 'The lyrics follow the scripture word-for-word' ? 'word_for_word_count' :
            lyrics_scripture_adherence === 'The lyrics closely follow the scripture passage' ? 'close_paraphrase_count' :
            'creative_inspiration_count']: 1,
          [ai_used_for_lyrics ? 'ai_lyrics_count' : 'human_created_count']: 1,
          [music_ai_generated ? 'ai_music_count' : 'human_created_count']: 1,
          [is_continuous_passage ? 'continuous_passage_count' : 'non_continuous_passage_count']: 1,
          genre_counts: JSON.stringify({ [genre]: 1 }),
          translation_counts: JSON.stringify({ [bible_translation_used]: 1 }),
        })
        .onConflict(['book', 'chapter'])
        .merge({
          verse_count: db.raw('?? + ?', ['progress_map.verse_count', update.count]),
          song_count: db.raw('?? + 1', ['progress_map.song_count']),
          [lyrics_scripture_adherence === 'The lyrics follow the scripture word-for-word' ? 'word_for_word_count' :
            lyrics_scripture_adherence === 'The lyrics closely follow the scripture passage' ? 'close_paraphrase_count' :
            'creative_inspiration_count']: db.raw('?? + 1', [`progress_map.${lyrics_scripture_adherence === 'The lyrics follow the scripture word-for-word' ? 'word_for_word_count' :
            lyrics_scripture_adherence === 'The lyrics closely follow the scripture passage' ? 'close_paraphrase_count' :
            'creative_inspiration_count'}`]),
          [ai_used_for_lyrics ? 'ai_lyrics_count' : 'human_created_count']: db.raw('?? + 1', [`progress_map.${ai_used_for_lyrics ? 'ai_lyrics_count' : 'human_created_count'}`]),
          [music_ai_generated ? 'ai_music_count' : 'human_created_count']: db.raw('?? + 1', [`progress_map.${music_ai_generated ? 'ai_music_count' : 'human_created_count'}`]),
          [is_continuous_passage ? 'continuous_passage_count' : 'non_continuous_passage_count']: db.raw('?? + 1', [`progress_map.${is_continuous_passage ? 'continuous_passage_count' : 'non_continuous_passage_count'}`]),
          genre_counts: db.raw(`jsonb_set(
            COALESCE(progress_map.genre_counts, '{}')::jsonb,
            '{${genre}}',
            (COALESCE((progress_map.genre_counts->>'${genre}')::int, 0) + 1)::text::jsonb
          )`),
          translation_counts: db.raw(`jsonb_set(
            COALESCE(progress_map.translation_counts, '{}')::jsonb,
            '{${bible_translation_used}}',
            (COALESCE((progress_map.translation_counts->>'${bible_translation_used}')::int, 0) + 1)::text::jsonb
          )`),
        });
    }

    await trx.commit();
    res.status(200).json({ message: 'Song submitted successfully' });
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