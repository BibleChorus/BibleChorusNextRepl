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

  // Updated progress_map update logic
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
    const existingRecord = await trx('progress_map')
      .where({ book: update.book, chapter: update.chapter })
      .first();

    const newVerses = Array.from(update.verses);
    const existingVerses = existingRecord?.covered_verses || [];
    const allVerses = Array.from(new Set([...existingVerses, ...newVerses]));
    const newlyAddedVerses = newVerses.filter(v => !existingVerses.includes(v));

    const updateData: any = {
      book: update.book,
      chapter: update.chapter,
      total_verses_in_chapter: await getTotalVersesInChapter(trx, update.book, update.chapter),
      total_verses_covered_count: allVerses.length,
      song_ids: existingRecord 
        ? db.raw('array_append(COALESCE(??, ARRAY[]::integer[]), ?)', ['song_ids', songId]) 
        : [songId],
      covered_verses: allVerses,
      last_updated: trx.fn.now(),
    };

    if (lyrics_scripture_adherence === 'The lyrics follow the scripture word-for-word') {
      updateData.word_for_word_verses = db.raw('array_cat(COALESCE(??, ARRAY[]::integer[]), ?)', ['word_for_word_verses', newlyAddedVerses]);
      updateData.word_for_word_verse_count = db.raw('array_length(COALESCE(??, ARRAY[]::integer[]), 1)', ['word_for_word_verses']);
    } else if (lyrics_scripture_adherence === 'The lyrics closely follow the scripture passage') {
      updateData.close_paraphrase_verses = db.raw('array_cat(COALESCE(??, ARRAY[]::integer[]), ?)', ['close_paraphrase_verses', newlyAddedVerses]);
      updateData.close_paraphrase_verse_count = db.raw('array_length(COALESCE(??, ARRAY[]::integer[]), 1)', ['close_paraphrase_verses']);
    } else if (lyrics_scripture_adherence === 'Creative inspiration') {
      updateData.creative_inspiration_verses = db.raw('array_cat(COALESCE(??, ARRAY[]::integer[]), ?)', ['creative_inspiration_verses', newlyAddedVerses]);
      updateData.creative_inspiration_verse_count = db.raw('array_length(COALESCE(??, ARRAY[]::integer[]), 1)', ['creative_inspiration_verses']);
    }

    if (ai_used_for_lyrics) {
      updateData.ai_lyrics_verses = db.raw('array_cat(COALESCE(??, ARRAY[]::integer[]), ?)', ['ai_lyrics_verses', newlyAddedVerses]);
      updateData.ai_lyrics_verse_count = db.raw('array_length(COALESCE(??, ARRAY[]::integer[]), 1)', ['ai_lyrics_verses']);
    }

    if (music_ai_generated) {
      updateData.ai_music_verses = db.raw('array_cat(COALESCE(??, ARRAY[]::integer[]), ?)', ['ai_music_verses', newlyAddedVerses]);
      updateData.ai_music_verse_count = db.raw('array_length(COALESCE(??, ARRAY[]::integer[]), 1)', ['ai_music_verses']);
    }

    if (!ai_used_for_lyrics && !music_ai_generated) {
      updateData.human_created_verses = db.raw('array_cat(COALESCE(??, ARRAY[]::integer[]), ?)', ['human_created_verses', newlyAddedVerses]);
      updateData.human_created_verse_count = db.raw('array_length(COALESCE(??, ARRAY[]::integer[]), 1)', ['human_created_verses']);
    }

    if (is_continuous_passage) {
      updateData.continuous_passage_verses = db.raw('array_cat(COALESCE(??, ARRAY[]::integer[]), ?)', ['continuous_passage_verses', newlyAddedVerses]);
      updateData.continuous_passage_verse_count = db.raw('array_length(COALESCE(??, ARRAY[]::integer[]), 1)', ['continuous_passage_verses']);
    } else {
      updateData.non_continuous_passage_verses = db.raw('array_cat(COALESCE(??, ARRAY[]::integer[]), ?)', ['non_continuous_passage_verses', newlyAddedVerses]);
      updateData.non_continuous_passage_verse_count = db.raw('array_length(COALESCE(??, ARRAY[]::integer[]), 1)', ['non_continuous_passage_verses']);
    }

    updateData.genre_verses = db.raw(`
      jsonb_set(
        COALESCE(??, '{}'),
        '{${genre}}',
        to_jsonb(array_cat(COALESCE((??->>'${genre}')::int[], ARRAY[]::integer[]), ?::int[]))
      )
    `, ['genre_verses', 'genre_verses', newlyAddedVerses]);

    updateData.genre_verse_counts = db.raw(`
      jsonb_set(
        COALESCE(??, '{}'),
        '{${genre}}',
        to_jsonb(array_length(COALESCE((??->>'${genre}')::int[], ARRAY[]::integer[]), 1))
      )
    `, ['genre_verses', 'genre_verses']);

    updateData.translation_verses = db.raw(`
      jsonb_set(
        COALESCE(??, '{}'),
        '{${bible_translation_used}}',
        to_jsonb(array_cat(COALESCE((??->>'${bible_translation_used}')::int[], ARRAY[]::integer[]), ?::int[]))
      )
    `, ['translation_verses', 'translation_verses', newlyAddedVerses]);

    updateData.translation_verse_counts = db.raw(`
      jsonb_set(
        COALESCE(??, '{}'),
        '{${bible_translation_used}}',
        to_jsonb(array_length(COALESCE((??->>'${bible_translation_used}')::int[], ARRAY[]::integer[]), 1))
      )
    `, ['translation_verses', 'translation_verses']);

    if (existingRecord) {
      await trx('progress_map')
        .where({ book: update.book, chapter: update.chapter })
        .update(updateData);
    } else {
      await trx('progress_map').insert(updateData);
    }
  }

  await trx.commit();
  res.status(200).json({ message: 'Song submitted successfully', songId: songId });
}
// Helper function to get total verses in a chapter
async function getTotalVersesInChapter(trx, book, chapter) {
  const result = await trx('bible_verses')
    .where({ book, chapter })
    .count('* as total')
    .first();
  return result ? result.total : 0;
}
