import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';
import { BIBLE_BOOKS } from '@/lib/constants';

// {{ edit_1 }}
// Add interface for query parameters
interface SongsQuery {
  lyricsAdherence?: string | string[];
  isContinuous?: string;
  aiMusic?: string;
  genres?: string | string[];
  aiUsedForLyrics?: string;
  musicModelUsed?: string;
  title?: string;
  artist?: string;
  bibleTranslation?: string;
  bibleBooks?: string | string[];
  bibleChapters?: string | string[];
  bibleVerses?: string | string[];
  page?: string;
  limit?: string;
  search?: string;
  playlist_id?: string | string[];
  showLikedSongs?: string;
  showBestMusically?: string;
  showBestLyrically?: string;
  showBestOverall?: string;
  userId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  showMySongs?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // {{ edit_2 }}
      // Destructure with type SongsQuery
      const {
        lyricsAdherence,
        isContinuous,
        aiMusic,
        genres,
        aiUsedForLyrics,
        musicModelUsed,
        title,
        artist,
        bibleTranslation,
        bibleBooks,
        bibleChapters,
        bibleVerses,
        page = '1',
        limit = '20',
        search,
        playlist_id,
        showLikedSongs,
        showBestMusically,
        showBestLyrically,
        showBestOverall,
        userId,
        sortBy = 'mostRecent',
        sortOrder = 'desc',
        showMySongs,
      }: SongsQuery = req.query;

      // Adjust limit and offset for infinite scroll
      const limitNum = parseInt(limit as string, 10) || 20;
      const pageNum = parseInt(page as string, 10) || 1;
      
      // Calculate offset using the original limitNum for correct pagination
      const offset = (pageNum - 1) * limitNum;
      
      // Add a safety limit to prevent extremely large queries, but allow special cases
      const maxSafeLimit = 10000;
      
      // For very large limits (like fetchAllSongs for shuffle), we need to handle differently
      // If the limit is extremely large and page is 1, it's likely a "fetch all" request
      const isFetchAllRequest = limitNum > maxSafeLimit && pageNum === 1;
      
      let actualLimit: number;
      let actualOffset: number;
      
      if (isFetchAllRequest) {
        // For fetch-all requests, we'll return all available records up to a reasonable maximum
        // This is primarily for shuffle functionality
        actualLimit = Math.min(limitNum, 50000); // Higher limit for fetch-all
        actualOffset = 0; // Always start from beginning for fetch-all
      } else {
        // For normal pagination, enforce the safety limit
        actualLimit = Math.min(limitNum, maxSafeLimit);
        actualOffset = offset;
      }

      // Start building the query with optimized aggregations
      let query = db('songs')
        .select(
          'songs.id',
          'songs.title',
          'users.username',
          'songs.uploaded_by',
          'songs.genres',
          'songs.created_at',
          'songs.audio_url',
          'songs.song_art_url',
          'songs.bible_translation_used',
          'songs.lyrics_scripture_adherence',
          'songs.is_continuous_passage',
          'songs.ai_used_for_lyrics',
          'songs.music_ai_generated',
          'songs.music_model_used',
          'songs.duration',
          'songs.play_count',
          'songs.lyrics',
          // Include these columns conditionally
          ...(sortBy === 'firstBibleVerse'
            ? [
                'first_verse.first_book',
                'first_verse.first_chapter',
                'first_verse.first_verse_number',
              ]
            : []),
          // Optimized aggregations using LEFT JOINs
          db.raw('COALESCE(vote_counts.best_musically_votes, 0) AS best_musically_votes'),
          db.raw('COALESCE(vote_counts.best_lyrically_votes, 0) AS best_lyrically_votes'),
          db.raw('COALESCE(vote_counts.best_overall_votes, 0) AS best_overall_votes'),
          db.raw('COALESCE(like_counts.like_count, 0) AS like_count'),
        )
        .join('users', 'songs.uploaded_by', 'users.id')
        // LEFT JOIN for vote counts aggregation
        .leftJoin(
          db('votes')
            .select('song_id')
            .select(db.raw(`SUM(CASE WHEN vote_type = 'Best Musically' THEN vote_value ELSE 0 END) AS best_musically_votes`))
            .select(db.raw(`SUM(CASE WHEN vote_type = 'Best Lyrically' THEN vote_value ELSE 0 END) AS best_lyrically_votes`))
            .select(db.raw(`SUM(CASE WHEN vote_type = 'Best Overall' THEN vote_value ELSE 0 END) AS best_overall_votes`))
            .groupBy('song_id')
            .as('vote_counts'),
          'songs.id',
          'vote_counts.song_id'
        )
        // LEFT JOIN for like counts aggregation
        .leftJoin(
          db('likes')
            .select('likeable_id')
            .count('* as like_count')
            .where('likeable_type', 'song')
            .groupBy('likeable_id')
            .as('like_counts'),
          'songs.id',
          'like_counts.likeable_id'
        );

      // Handle user-specific filters
      if (userId) {
        if (showMySongs === 'true') {
          query = query.where('songs.uploaded_by', Number(userId)); // Convert to number
        }
        query = query.whereIn('songs.id', function () {
          this.select('s.id')
            .from('songs as s');

          if (showLikedSongs) {
            this.join('likes', function () {
              this.on('likes.likeable_id', '=', 's.id')
                .andOn('likes.likeable_type', '=', db.raw('?', ['song']))
                .andOn('likes.user_id', '=', db.raw('?', [userId]));
            });
          }

          if (showBestMusically || showBestLyrically || showBestOverall) {
            this.join('votes', function () {
              this.on('votes.song_id', '=', 's.id')
                .andOn('votes.user_id', '=', db.raw('?', [userId]));
            });

            if (showBestMusically) {
              this.orWhere(function () {
                this.where('votes.vote_type', 'Best Musically')
                  .andWhere('votes.vote_value', 1);
              });
            }

            if (showBestLyrically) {
              this.orWhere(function () {
                this.where('votes.vote_type', 'Best Lyrically')
                  .andWhere('votes.vote_value', 1);
              });
            }

            if (showBestOverall) {
              this.orWhere(function () {
                this.where('votes.vote_type', 'Best Overall')
                  .andWhere('votes.vote_value', 1);
              });
            }
          }
        });
      }

      // If a playlist_id is provided, join with the playlist_songs table
      if (playlist_id) {
        query = query
          .join('playlist_songs', 'songs.id', 'playlist_songs.song_id')
          .where('playlist_songs.playlist_id', playlist_id);
      }

      // Apply filters
      if (lyricsAdherence) {
        const adherenceValues = Array.isArray(lyricsAdherence) ? lyricsAdherence : [lyricsAdherence];
        query = query.whereIn('songs.lyrics_scripture_adherence', adherenceValues);
      }

      if (isContinuous && isContinuous !== 'all') {
        query = query.where('songs.is_continuous_passage', isContinuous === 'true');
      }

      if (aiMusic && aiMusic !== 'all') {
        query = query.where('songs.music_ai_generated', aiMusic === 'true');
      }

      if (genres) {
        const genresValues = Array.isArray(genres) ? genres : [genres];
        query = query.whereRaw('genres && ?', [genresValues]);
      }

      if (aiUsedForLyrics && aiUsedForLyrics !== 'all') {
        query = query.where('songs.ai_used_for_lyrics', aiUsedForLyrics === 'true');
      }

      if (musicModelUsed) {
        query = query.where('songs.music_model_used', musicModelUsed);
      }

      if (bibleTranslation) {
        query = query.where('songs.bible_translation_used', bibleTranslation);
      }

      // Flag to determine if Bible filters are applied
      const bibleFiltersApplied = bibleVerses || bibleChapters || bibleBooks;

      if (bibleFiltersApplied) {
        // Join with song_verses and bible_verses if any Bible filters are applied
        query = query
          .join('song_verses', 'songs.id', 'song_verses.song_id')
          .join('bible_verses', 'song_verses.verse_id', 'bible_verses.id');

        // Apply filters in order of specificity
        if (bibleVerses) {
          // If Bible verses are specified, filter by verses (overrides books and chapters)
          const bibleVersesValues = Array.isArray(bibleVerses) ? bibleVerses : [bibleVerses];
          query = query.whereRaw(`CONCAT(bible_verses.book, ' ', bible_verses.chapter, ':', bible_verses.verse) IN (${bibleVersesValues.map(() => '?').join(',')})`, bibleVersesValues);
        } else if (bibleChapters) {
          // If Bible chapters are specified, filter by chapters (overrides books)
          const bibleChaptersValues = Array.isArray(bibleChapters) ? bibleChapters : [bibleChapters];
          const bookChapterPairs = bibleChaptersValues.map((bookChapter) => {
            const [book, chapter] = bookChapter.split(':');
            return { book, chapter };
          });
          query = query.where((builder) => {
            bookChapterPairs.forEach(({ book, chapter }) => {
              builder.orWhere((qb) => {
                qb.where('bible_verses.book', book).andWhere('bible_verses.chapter', chapter);
              });
            });
          });
        } else if (bibleBooks) {
          // Filter by Bible books
          const bibleBooksValues = Array.isArray(bibleBooks) ? bibleBooks : [bibleBooks];
          query = query.whereIn('bible_verses.book', bibleBooksValues);
        }

        // Prevent duplicate songs due to joins
        query = query.distinct('songs.id');
      }

      // Apply search filter
      if (search) {
        query = query.whereRaw(
          `songs.search_vector @@ websearch_to_tsquery('english', ?)`,
          [search]
        );
      }

      // Include LATERAL join for firstBibleVerse sorting
      if (sortBy === 'firstBibleVerse') {
        query = query.leftJoin(
          db.raw(`LATERAL (
            SELECT
              "bible_verses"."book" AS "first_book",
              "bible_verses"."chapter" AS "first_chapter",
              "bible_verses"."verse" AS "first_verse_number"
            FROM "song_verses"
            JOIN "bible_verses" ON "song_verses"."verse_id" = "bible_verses"."id"
            WHERE "song_verses"."song_id" = "songs"."id"
            ORDER BY
              array_position(ARRAY[${BIBLE_BOOKS.map(() => '?').join(',')}], "bible_verses"."book") ASC,
              "bible_verses"."chapter" ASC,
              "bible_verses"."verse" ASC
            LIMIT 1
          ) AS "first_verse"`, BIBLE_BOOKS),
          function () {
            this.on(db.raw('TRUE'));
          }
        );
      }

      // Apply sorting
      switch (sortBy) {
        case 'playCount':
          query = query.orderBy('songs.play_count', sortOrder);
          break;
        case 'likes':
          query = query.orderBy('like_count', sortOrder);
          break;
        case 'voteBestMusically':
          query = query.orderBy('best_musically_votes', sortOrder);
          break;
        case 'voteBestLyrically':
          query = query.orderBy('best_lyrically_votes', sortOrder);
          break;
        case 'voteBestOverall':
          query = query.orderBy('best_overall_votes', sortOrder);
          break;
        case 'firstBibleVerse':
          query = query.orderByRaw(
            `array_position(ARRAY[${BIBLE_BOOKS.map(() => '?').join(',')}], "first_verse"."first_book") ${sortOrder}`,
            BIBLE_BOOKS
          );
          query = query.orderBy([
            { column: 'first_verse.first_chapter', order: sortOrder },
            { column: 'first_verse.first_verse_number', order: sortOrder },
          ]);
          break;
        default:
          query = query.orderBy('songs.created_at', sortOrder);
      }

      // Apply pagination
      const songsQuery = query.clone().offset(actualOffset).limit(actualLimit);
      const songs = await songsQuery;

      // Clone the existing query for total count
      const totalQuery = query
        .clone()
        .clearSelect()
        .clearOrder()
        .countDistinct('songs.id as total');

      const totalResult = await totalQuery.first();
      const total = totalResult ? Number(totalResult.total) : 0;

      // Fetch Bible verses for each song
      const songIds = songs.map((song) => song.id);

      const verses = await db('song_verses')
        .join('bible_verses', 'song_verses.verse_id', 'bible_verses.id')
        .whereIn('song_verses.song_id', songIds)
        .select(
          'song_verses.song_id',
          'bible_verses.book',
          'bible_verses.chapter',
          'bible_verses.verse'
        )
        .orderBy(['bible_verses.book', 'bible_verses.chapter', 'bible_verses.verse']);

      // Attach verses to songs
      const versesBySongId = verses.reduce((acc, verse) => {
        if (!acc[verse.song_id]) {
          acc[verse.song_id] = [];
        }
        acc[verse.song_id].push({
          book: verse.book,
          chapter: verse.chapter,
          verse: verse.verse,
        });
        return acc;
      }, {} as Record<number, { book: string; chapter: number; verse: number }[]>);

      songs.forEach((song) => {
        song.bible_verses = versesBySongId[song.id] || [];
      });

      res.status(200).json({ songs: songs || [], total });
    } catch (error) {
      // {{ edit_4 }}
      // Remove console.error and use error.message for response
      res.status(500).json({ message: 'Error fetching songs', error: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
