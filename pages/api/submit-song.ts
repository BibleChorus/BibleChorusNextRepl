import { NextApiRequest, NextApiResponse } from 'next';
import db from '../../db';
import { Knex } from 'knex';

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

  console.log('Received request body:', req.body);

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
    console.log('Missing required fields:', missingFields);
    return res.status(400).json({ message: 'Missing required fields', missingFields });
  }

  // Validate lyrics_scripture_adherence
  const validAdherenceOptions = ['word_for_word', 'close_paraphrase', 'creative_inspiration'];
  const adherenceMapping = {
    'The lyrics follow the scripture word-for-word': 'word_for_word',
    'The lyrics closely follow the scripture passage': 'close_paraphrase',
    'The lyrics are creatively inspired by the scripture passage': 'creative_inspiration'
  };

  let mappedAdherence = lyrics_scripture_adherence;
  if (adherenceMapping[lyrics_scripture_adherence]) {
    mappedAdherence = adherenceMapping[lyrics_scripture_adherence];
    console.log(`Mapped lyrics_scripture_adherence from "${lyrics_scripture_adherence}" to "${mappedAdherence}"`);
  }

  if (!validAdherenceOptions.includes(mappedAdherence)) {
    console.log('Invalid lyrics_scripture_adherence:', lyrics_scripture_adherence);
    return res.status(400).json({ 
      message: 'Invalid lyrics_scripture_adherence value', 
      receivedValue: lyrics_scripture_adherence,
      mappedValue: mappedAdherence,
      validOptions: validAdherenceOptions 
    });
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
      lyrics_scripture_adherence: mappedAdherence,
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

    // Update bible_verses table
    await updateBibleVerses(trx, songId, {
      ai_used_for_lyrics,
      music_ai_generated,
      is_continuous_passage,
      lyrics_scripture_adherence,
      genre,
      bible_translation_used
    });

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

async function updateBibleVerses(trx: Knex.Transaction, songId: number, songData: {
  ai_used_for_lyrics: boolean,
  music_ai_generated: boolean,
  is_continuous_passage: boolean,
  lyrics_scripture_adherence: string,
  genre: string,
  bible_translation_used: string
}) {
  const verseIds = await trx('song_verses')
    .where('song_id', songId)
    .pluck('verse_id');

  for (const verseId of verseIds) {
    await trx('bible_verses')
      .where('id', verseId)
      .update({
        all_song_ids: trx.raw('array_append(all_song_ids, ?)', [songId]),
        ai_lyrics_song_ids: songData.ai_used_for_lyrics ? trx.raw('array_append(ai_lyrics_song_ids, ?)', [songId]) : trx.raw('ai_lyrics_song_ids'),
        human_lyrics_song_ids: !songData.ai_used_for_lyrics ? trx.raw('array_append(human_lyrics_song_ids, ?)', [songId]) : trx.raw('human_lyrics_song_ids'),
        ai_music_song_ids: songData.music_ai_generated ? trx.raw('array_append(ai_music_song_ids, ?)', [songId]) : trx.raw('ai_music_song_ids'),
        human_music_song_ids: !songData.music_ai_generated ? trx.raw('array_append(human_music_song_ids, ?)', [songId]) : trx.raw('human_music_song_ids'),
        continuous_passage_song_ids: songData.is_continuous_passage ? trx.raw('array_append(continuous_passage_song_ids, ?)', [songId]) : trx.raw('continuous_passage_song_ids'),
        non_continuous_passage_song_ids: !songData.is_continuous_passage ? trx.raw('array_append(non_continuous_passage_song_ids, ?)', [songId]) : trx.raw('non_continuous_passage_song_ids'),
        [`${songData.lyrics_scripture_adherence}_song_ids`]: trx.raw(`array_append(${songData.lyrics_scripture_adherence}_song_ids, ?)`, [songId]),
        genre_song_ids: trx.raw('jsonb_set(COALESCE(genre_song_ids, \'{}\'), ?, ?)', [
          `{${songData.genre}}`,
          trx.raw(`COALESCE(genre_song_ids->?, '[]')::jsonb || ?::jsonb`, [songData.genre, JSON.stringify([songId])])
        ]),
        translation_song_ids: trx.raw('jsonb_set(COALESCE(translation_song_ids, \'{}\'), ?, ?)', [
          `{${songData.bible_translation_used}}`,
          trx.raw(`COALESCE(translation_song_ids->?, '[]')::jsonb || ?::jsonb`, [songData.bible_translation_used, JSON.stringify([songId])])
        ])
      });
  }
}