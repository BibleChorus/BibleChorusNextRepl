import { NextApiRequest, NextApiResponse } from 'next';
import db from '../../db';
import { Knex } from 'knex';
import { refreshProgressMaterializedView } from '@/lib/db-utils';

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
    music_origin,
    bible_translation_used,
    lyrics_scripture_adherence,
    is_continuous_passage,
    lyrics,
    lyric_ai_prompt,
    music_ai_prompt,
    music_model_used,
    song_art_url,
    bible_verses,
    duration,
    is_journey_song,
    journey_date,
    journey_song_origin,
  } = req.body;

  console.log('Received request body:', req.body);

  const cdnUrl = process.env.CDN_URL || '';
  const fullAudioUrl = audio_url ? `${cdnUrl}${audio_url}` : null;
  const fullSongArtUrl = song_art_url ? `${cdnUrl}${song_art_url}` : null;

  const validAdherenceOptions = ['word_for_word', 'close_paraphrase', 'creative_inspiration', 'somewhat_connected', 'no_connection'];
  const adherenceMapping: Record<string, string> = {
    'The lyrics follow the scripture word-for-word': 'word_for_word',
    'The lyrics closely follow the scripture passage': 'close_paraphrase',
    'The lyrics are creatively inspired by the scripture passage': 'creative_inspiration'
  };

  let mappedAdherence = lyrics_scripture_adherence;
  if (adherenceMapping[lyrics_scripture_adherence]) {
    mappedAdherence = adherenceMapping[lyrics_scripture_adherence];
    console.log(`Mapped lyrics_scripture_adherence from "${lyrics_scripture_adherence}" to "${mappedAdherence}"`);
  }

  const isNoScriptureConnection = mappedAdherence === 'no_connection';
  const isLooseScriptureConnection = mappedAdherence === 'somewhat_connected' || isNoScriptureConnection;
  const isJourneyOnlySong = is_journey_song === true && isLooseScriptureConnection;
  const requiresBibleVerses = !isNoScriptureConnection && !isJourneyOnlySong;

  const missingFields: string[] = [];
  if (!title) missingFields.push('title');
  if (!fullAudioUrl) missingFields.push('audio_url');
  if (!uploaded_by) missingFields.push('uploaded_by');
  if (!lyrics) missingFields.push('lyrics');
  if (duration === undefined || duration === null) missingFields.push('duration');

  if (requiresBibleVerses) {
    if (!bible_translation_used) missingFields.push('bible_translation_used');
    if (!lyrics_scripture_adherence) missingFields.push('lyrics_scripture_adherence');
    if (!bible_verses) missingFields.push('bible_verses');
  }

  const genres = Array.isArray(req.body.genres) ? req.body.genres : [];
  if (genres.length === 0) {
    missingFields.push('genres');
  }

  if (missingFields.length > 0) {
    console.log('Missing required fields:', missingFields);
    return res.status(400).json({ message: 'Missing required fields', missingFields });
  }

  const durationInSeconds = Math.round(Number(duration));
  if (isNaN(durationInSeconds) || durationInSeconds <= 0) {
    console.log('Invalid duration value:', duration);
    return res.status(400).json({ message: 'Invalid duration value' });
  }

  if (mappedAdherence && !validAdherenceOptions.includes(mappedAdherence)) {
    console.log('Invalid lyrics_scripture_adherence:', lyrics_scripture_adherence);
    return res.status(400).json({ 
      message: 'Invalid lyrics_scripture_adherence value', 
      receivedValue: lyrics_scripture_adherence,
      mappedValue: mappedAdherence,
      validOptions: validAdherenceOptions 
    });
  }

  const validMusicOrigins = ['human', 'ai', 'ai_cover_of_human'];
  const finalMusicOrigin = music_origin || (music_ai_generated ? 'ai' : 'human');
  if (!validMusicOrigins.includes(finalMusicOrigin)) {
    console.log('Invalid music_origin:', music_origin);
    return res.status(400).json({ 
      message: 'Invalid music_origin value', 
      receivedValue: music_origin,
      validOptions: validMusicOrigins 
    });
  }

  const validJourneyOrigins = ['prior_recording', 'journal_entry', 'dream', 'testimony', 'life_milestone', 'prophetic_word', 'other'];
  if (journey_song_origin && !validJourneyOrigins.includes(journey_song_origin)) {
    console.log('Invalid journey_song_origin:', journey_song_origin);
    return res.status(400).json({ 
      message: 'Invalid journey_song_origin value', 
      receivedValue: journey_song_origin,
      validOptions: validJourneyOrigins 
    });
  }

  const trx = await db.transaction();
  let songId: { id: number } | undefined;

  try {
    const finalMusicAiGenerated = finalMusicOrigin === 'ai' || finalMusicOrigin === 'ai_cover_of_human';

    const [insertedSong] = await trx('songs').insert({
      title,
      artist: artist || null,
      audio_url: fullAudioUrl,
      uploaded_by,
      ai_used_for_lyrics: ai_used_for_lyrics || false,
      music_ai_generated: finalMusicAiGenerated,
      music_origin: finalMusicOrigin,
      bible_translation_used: bible_translation_used || null,
      genres,
      lyrics_scripture_adherence: mappedAdherence || 'no_connection',
      is_continuous_passage: is_continuous_passage || false,
      lyrics,
      lyric_ai_prompt: lyric_ai_prompt || null,
      music_ai_prompt: music_ai_prompt || null,
      music_model_used: music_model_used || null,
      song_art_url: fullSongArtUrl,
      duration: durationInSeconds,
      is_journey_song: is_journey_song || false,
      journey_date: journey_date ? new Date(journey_date) : null,
      journey_song_origin: journey_song_origin || null,
    }).returning('id');

    if (!insertedSong || typeof insertedSong.id !== 'number') {
      throw new Error('Failed to insert song or invalid song ID');
    }

    const songId = insertedSong.id;
    console.log('Inserted song ID:', songId);

    if (requiresBibleVerses && bible_verses) {
      const verseReferences = bible_verses.split(',').map((v: string) => v.trim());
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

      await updateBibleVerses(trx, songId, {
        ...req.body,
        music_ai_generated: finalMusicAiGenerated,
        lyrics_scripture_adherence: mappedAdherence,
      });
    }

    await trx.commit();
    
    if (requiresBibleVerses) {
      await refreshProgressMaterializedView();
    }
    
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
        query: bible_verses ? trx('bible_verses')
          .whereRaw(`CONCAT(book, ' ', chapter, ':', verse) IN (${bible_verses.split(',').map(() => '?').join(',')})`, bible_verses.split(',').map((v: string) => v.trim()))
          .select('id', 'book', 'chapter', 'verse')
          .toString() : null,
        songId: songId
      });
    } else {
      res.status(500).json({ message: 'Error submitting song', error: 'An unknown error occurred' });
    }
  }
}

async function updateBibleVerses(trx: Knex.Transaction, songId: number, songData: any) {
  const verseIds = await trx('song_verses')
    .where('song_id', songId)
    .pluck('verse_id');

  const genres = songData.genres;
  const adherence = songData.lyrics_scripture_adherence;
  const adherenceColumn = `${adherence}_song_ids`;

  const validAdherenceColumns = [
    'word_for_word_song_ids',
    'close_paraphrase_song_ids', 
    'creative_inspiration_song_ids',
    'somewhat_connected_song_ids',
    'no_connection_song_ids'
  ];

  for (const verseId of verseIds) {
    const updateObj: any = {
      all_song_ids: trx.raw('array_append(all_song_ids, ?)', [songId]),
      ai_lyrics_song_ids: songData.ai_used_for_lyrics ? trx.raw('array_append(ai_lyrics_song_ids, ?)', [songId]) : trx.raw('ai_lyrics_song_ids'),
      human_lyrics_song_ids: !songData.ai_used_for_lyrics ? trx.raw('array_append(human_lyrics_song_ids, ?)', [songId]) : trx.raw('human_lyrics_song_ids'),
      ai_music_song_ids: songData.music_ai_generated ? trx.raw('array_append(ai_music_song_ids, ?)', [songId]) : trx.raw('ai_music_song_ids'),
      human_music_song_ids: !songData.music_ai_generated ? trx.raw('array_append(human_music_song_ids, ?)', [songId]) : trx.raw('human_music_song_ids'),
      continuous_passage_song_ids: songData.is_continuous_passage ? trx.raw('array_append(continuous_passage_song_ids, ?)', [songId]) : trx.raw('continuous_passage_song_ids'),
      non_continuous_passage_song_ids: !songData.is_continuous_passage ? trx.raw('array_append(non_continuous_passage_song_ids, ?)', [songId]) : trx.raw('non_continuous_passage_song_ids'),
      translation_song_ids: trx.raw(`
        jsonb_set(
          COALESCE(translation_song_ids, '{}'::jsonb),
          ARRAY[?],
          COALESCE(translation_song_ids->?, '[]'::jsonb) || ?::jsonb
        )
      `, [songData.bible_translation_used, songData.bible_translation_used, JSON.stringify([songId])])
    };

    if (validAdherenceColumns.includes(adherenceColumn)) {
      updateObj[adherenceColumn] = trx.raw(`array_append(${adherenceColumn}, ?)`, [songId]);
    }

    await trx('bible_verses')
      .where('id', verseId)
      .update(updateObj);

    for (const genre of genres) {
      await trx('bible_verses')
        .where('id', verseId)
        .update({
          genre_song_ids: trx.raw(`
            jsonb_set(
              COALESCE(genre_song_ids, '{}'::jsonb),
              ARRAY[?],
              COALESCE(genre_song_ids->?, '[]'::jsonb) || ?::jsonb
            )
          `, [genre, genre, JSON.stringify([songId])])
        });
    }
  }
}
