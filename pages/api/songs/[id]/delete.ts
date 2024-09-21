import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import s3Client from '@/lib/s3';

interface VerseGroup {
  book: string;
  chapter: number;
  verses: Set<number>;
}

interface UpdateData {
  total_verses_covered_count: any;
  song_ids: any;
  covered_verses: any;
  last_updated: any;
  word_for_word_verse_count?: any;
  word_for_word_verses?: any;
  close_paraphrase_verse_count?: any;
  close_paraphrase_verses?: any;
  creative_inspiration_verse_count?: any;
  creative_inspiration_verses?: any;
  ai_lyrics_verse_count?: any;
  ai_lyrics_verses?: any;
  human_created_verse_count?: any;
  human_created_verses?: any;
  ai_music_verse_count?: any;
  ai_music_verses?: any;
  continuous_passage_verse_count?: any;
  continuous_passage_verses?: any;
  non_continuous_passage_verse_count?: any;
  non_continuous_passage_verses?: any;
  genre_verse_counts?: any;
  genre_verses?: any;
  translation_verse_counts?: any;
  translation_verses?: any;
}

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

    // Fetch associated verses
    const songVerses = await trx('song_verses')
      .join('bible_verses', 'song_verses.verse_id', 'bible_verses.id')
      .where('song_verses.song_id', id)
      .select('bible_verses.id', 'bible_verses.book', 'bible_verses.chapter', 'bible_verses.verse');

    // Group verses by book and chapter
    const versesByChapter: Record<string, VerseGroup> = songVerses.reduce((acc, verse) => {
      const key = `${verse.book}-${verse.chapter}`;
      if (!acc[key]) {
        acc[key] = { book: verse.book, chapter: verse.chapter, verses: new Set([verse.verse]) };
      } else {
        acc[key].verses.add(verse.verse);
      }
      return acc;
    }, {} as Record<string, VerseGroup>);

    // Updated progress_map update logic
    for (const update of Object.values(versesByChapter)) {
      const versesToRemove = Array.from(update.verses);

      const updateData: UpdateData = {
        total_verses_covered_count: db.raw('(SELECT COUNT(*) FROM unnest(covered_verses) AS v WHERE v != ALL(?::int[]))', [versesToRemove]),
        song_ids: db.raw('array_remove(song_ids, ?)', [id]),
        covered_verses: db.raw('array_remove(covered_verses, ?)', versesToRemove),
        last_updated: trx.fn.now(),
      };

      // Update specific verse categories based on song criteria
      if (song.lyrics_scripture_adherence === 'The lyrics follow the scripture word-for-word') {
        updateData.word_for_word_verse_count = db.raw('(SELECT COUNT(*) FROM unnest(word_for_word_verses) AS v WHERE v != ALL(?::int[]))', [versesToRemove]);
        updateData.word_for_word_verses = db.raw('array_remove(word_for_word_verses, ?)', versesToRemove);
      } else if (song.lyrics_scripture_adherence === 'The lyrics closely follow the scripture passage') {
        updateData.close_paraphrase_verse_count = db.raw('(SELECT COUNT(*) FROM unnest(close_paraphrase_verses) AS v WHERE v != ALL(?::int[]))', [versesToRemove]);
        updateData.close_paraphrase_verses = db.raw('array_remove(close_paraphrase_verses, ?)', versesToRemove);
      } else if (song.lyrics_scripture_adherence === 'Creative inspiration') {
        updateData.creative_inspiration_verse_count = db.raw('(SELECT COUNT(*) FROM unnest(creative_inspiration_verses) AS v WHERE v != ALL(?::int[]))', [versesToRemove]);
        updateData.creative_inspiration_verses = db.raw('array_remove(creative_inspiration_verses, ?)', versesToRemove);
      }

      if (song.ai_used_for_lyrics) {
        updateData.ai_lyrics_verse_count = db.raw('(SELECT COUNT(*) FROM unnest(ai_lyrics_verses) AS v WHERE v != ALL(?::int[]))', [versesToRemove]);
        updateData.ai_lyrics_verses = db.raw('array_remove(ai_lyrics_verses, ?)', versesToRemove);
      }

      if (song.music_ai_generated) {
        updateData.ai_music_verse_count = db.raw('(SELECT COUNT(*) FROM unnest(ai_music_verses) AS v WHERE v != ALL(?::int[]))', [versesToRemove]);
        updateData.ai_music_verses = db.raw('array_remove(ai_music_verses, ?)', versesToRemove);
      }

      if (!song.ai_used_for_lyrics && !song.music_ai_generated) {
        updateData.human_created_verse_count = db.raw('(SELECT COUNT(*) FROM unnest(human_created_verses) AS v WHERE v != ALL(?::int[]))', [versesToRemove]);
        updateData.human_created_verses = db.raw('array_remove(human_created_verses, ?)', versesToRemove);
      }

      if (song.is_continuous_passage) {
        updateData.continuous_passage_verse_count = db.raw('(SELECT COUNT(*) FROM unnest(continuous_passage_verses) AS v WHERE v != ALL(?::int[]))', [versesToRemove]);
        updateData.continuous_passage_verses = db.raw('array_remove(continuous_passage_verses, ?)', versesToRemove);
      } else {
        updateData.non_continuous_passage_verse_count = db.raw('(SELECT COUNT(*) FROM unnest(non_continuous_passage_verses) AS v WHERE v != ALL(?::int[]))', [versesToRemove]);
        updateData.non_continuous_passage_verses = db.raw('array_remove(non_continuous_passage_verses, ?)', versesToRemove);
      }

      updateData.genre_verses = db.raw(`
        jsonb_set(
          genre_verses,
          ?::text[],
          coalesce(
            (SELECT jsonb_agg(value)
             FROM jsonb_array_elements(coalesce(genre_verses->>?::text, '[]')::jsonb) AS t(value)
             WHERE value::text NOT IN (SELECT jsonb_array_elements_text(?::jsonb))),
            '[]'::jsonb
          )
        )
      `, [`{${song.genre}}`, song.genre, JSON.stringify(versesToRemove)]);

      updateData.genre_verse_counts = db.raw(`
        jsonb_set(
          genre_verse_counts,
          ?::text[],
          to_jsonb(
            (SELECT count(*)
             FROM jsonb_array_elements(coalesce(genre_verses->>?::text, '[]')::jsonb) AS t(value)
             WHERE value::text NOT IN (SELECT jsonb_array_elements_text(?::jsonb)))
          )
        )
      `, [`{${song.genre}}`, song.genre, JSON.stringify(versesToRemove)]);

      updateData.translation_verses = db.raw(`
        jsonb_set(
          translation_verses,
          ?::text[],
          coalesce(
            (SELECT jsonb_agg(value)
             FROM jsonb_array_elements(coalesce(translation_verses->>?::text, '[]')::jsonb) AS t(value)
             WHERE value::text NOT IN (SELECT jsonb_array_elements_text(?::jsonb))),
            '[]'::jsonb
          )
        )
      `, [`{${song.bible_translation_used}}`, song.bible_translation_used, JSON.stringify(versesToRemove)]);

      updateData.translation_verse_counts = db.raw(`
        jsonb_set(
          translation_verse_counts,
          ?::text[],
          to_jsonb(
            (SELECT count(*)
             FROM jsonb_array_elements(coalesce(translation_verses->>?::text, '[]')::jsonb) AS t(value)
             WHERE value::text NOT IN (SELECT jsonb_array_elements_text(?::jsonb)))
          )
        )
      `, [`{${song.bible_translation_used}}`, song.bible_translation_used, JSON.stringify(versesToRemove)]);

      await trx('progress_map')
        .where({ book: update.book, chapter: update.chapter })
        .update(updateData);
    }

    // Delete song_verses entries
    await trx('song_verses').where('song_id', id).delete();

    // Delete the song
    await trx('songs').where('id', id).delete();

    await trx.commit();
    res.status(200).json({ message: 'Song deleted successfully' });
  } catch (error: any) {
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

// Helper function to get total verses in a chapter
async function getTotalVersesInChapter(trx, book: string, chapter: number): Promise<number> {
  const result = await trx('bible_verses')
    .where({ book, chapter })
    .count('* as total')
    .first();
  return result ? parseInt(result.total, 10) : 0;
}