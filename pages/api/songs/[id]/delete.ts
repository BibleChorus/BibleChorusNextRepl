import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import s3Client from '@/lib/s3';

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
    }

    // Delete audio file from S3
    if (song.audio_url) {
      const audioFileKey = song.audio_url.split('/').pop();
      const deleteAudioCommand = new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: audioFileKey,
      });
      await s3Client.send(deleteAudioCommand);
    }

    // Fetch associated verses
    const songVerses = await trx('song_verses')
      .join('bible_verses', 'song_verses.verse_id', 'bible_verses.id')
      .where('song_verses.song_id', id)
      .select('bible_verses.book', 'bible_verses.chapter', 'bible_verses.verse');

    type VerseGroup = {
      book: string;
      chapter: number;
      verses: Set<number>;
    };

    const versesByChapter = songVerses.reduce((acc, verse) => {
      const key = `${verse.book}-${verse.chapter}`;
      if (!acc[key]) {
        acc[key] = { book: verse.book, chapter: verse.chapter, verses: new Set([verse.verse]) };
      } else {
        acc[key].verses.add(verse.verse);
      }
      return acc;
    }, {} as Record<string, VerseGroup>);

    // Update progress_map
    for (const { book, chapter, verses } of Object.values(versesByChapter) as VerseGroup[]) {
      const progressMap = await trx('progress_map')
        .where({ book, chapter })
        .first();

      if (progressMap) {
        const updateData: any = {
          total_verses_covered_count: db.raw('GREATEST(0, ?? - ?)', ['total_verses_covered_count', verses.size]),
          song_ids: db.raw('array_remove(progress_map.song_ids, ?)', [id]),
        };

        // Only include fields in the update if they exist in the song object
        if (song.lyrics_scripture_adherence) {
          updateData[song.lyrics_scripture_adherence === 'The lyrics follow the scripture word-for-word' ? 'word_for_word_verse_count' :
            song.lyrics_scripture_adherence === 'The lyrics closely follow the scripture passage' ? 'close_paraphrase_verse_count' :
            'creative_inspiration_verse_count'] = db.raw('GREATEST(0, ?? - ?)', [
              `progress_map.${song.lyrics_scripture_adherence === 'The lyrics follow the scripture word-for-word' ? 'word_for_word_verse_count' :
              song.lyrics_scripture_adherence === 'The lyrics closely follow the scripture passage' ? 'close_paraphrase_verse_count' :
              'creative_inspiration_verse_count'}`,
              verses.size
            ]);
        }

        if ('ai_used_for_lyrics' in song) {
          updateData[song.ai_used_for_lyrics ? 'ai_lyrics_verse_count' : 'human_created_verse_count'] = db.raw('GREATEST(0, ?? - ?)', [
            `progress_map.${song.ai_used_for_lyrics ? 'ai_lyrics_verse_count' : 'human_created_verse_count'}`,
            verses.size
          ]);
        }

        if ('music_ai_generated' in song) {
          updateData[song.music_ai_generated ? 'ai_music_verse_count' : 'human_created_verse_count'] = db.raw('GREATEST(0, ?? - ?)', [
            `progress_map.${song.music_ai_generated ? 'ai_music_verse_count' : 'human_created_verse_count'}`,
            verses.size
          ]);
        }

        if ('is_continuous_passage' in song) {
          updateData[song.is_continuous_passage ? 'continuous_passage_verse_count' : 'non_continuous_passage_verse_count'] = db.raw('GREATEST(0, ?? - ?)', [
            `progress_map.${song.is_continuous_passage ? 'continuous_passage_verse_count' : 'non_continuous_passage_verse_count'}`,
            verses.size
          ]);
        }

        if (song.genre) {
          updateData.genre_verse_counts = db.raw(`
            jsonb_set(
              COALESCE(progress_map.genre_verse_counts::jsonb, '{}'::jsonb),
              '{${song.genre}}',
              to_jsonb(GREATEST(0, (COALESCE((progress_map.genre_verse_counts->>'${song.genre}')::int, 0) - ?)))
            )
          `, [verses.size]);
        }

        if (song.bible_translation_used) {
          updateData.translation_verse_counts = db.raw(`
            jsonb_set(
              COALESCE(progress_map.translation_verse_counts::jsonb, '{}'::jsonb),
              '{${song.bible_translation_used}}',
              to_jsonb(GREATEST(0, (COALESCE((progress_map.translation_verse_counts->>'${song.bible_translation_used}')::int, 0) - ?)))
            )
          `, [verses.size]);
        }

        // Only perform the update if there are fields to update
        if (Object.keys(updateData).length > 0) {
          console.log('Executing update query');
          console.log('Update data:', updateData);
          try {
            const updateQuery = trx('progress_map')
              .where({ book, chapter })
              .update(updateData)
              .toString();
            console.log('Update query:', updateQuery);
            await trx.raw(updateQuery);
            console.log('Update query executed successfully');
          } catch (error) {
            console.error('Error executing update query:', error);
            throw error;
          }
        } else {
          console.log('No fields to update');
        }
      }
    }

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