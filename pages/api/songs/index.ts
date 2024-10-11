import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
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
      } = req.query;

      // Adjust limit and offset for infinite scroll
      const limitNum = parseInt(limit as string, 10) || 20;
      const pageNum = parseInt(page as string, 10) || 1;
      const offset = (pageNum - 1) * limitNum;

      // Start building the query
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
          'songs.duration', // Add this line
          'songs.play_count' // Add this line if not already present
        )
        .join('users', 'songs.uploaded_by', 'users.id');

      // Handle user-specific filters
      if (userId && (showLikedSongs || showBestMusically || showBestLyrically || showBestOverall)) {
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

      // Before applying filters or pagination, compute aggregate fields
      query = query
        .leftJoin('likes', function () {
          this.on('likes.likeable_id', '=', 'songs.id')
            .andOn('likes.likeable_type', '=', db.raw('?', ['song']));
        })
        .leftJoin('votes as votes_musically', function () {
          this.on('votes_musically.song_id', '=', 'songs.id')
            .andOn('votes_musically.vote_type', '=', db.raw('?', ['Best Musically']));
        })
        .leftJoin('votes as votes_lyrically', function () {
          this.on('votes_lyrically.song_id', '=', 'songs.id')
            .andOn('votes_lyrically.vote_type', '=', db.raw('?', ['Best Lyrically']));
        })
        .leftJoin('votes as votes_overall', function () {
          this.on('votes_overall.song_id', '=', 'songs.id')
            .andOn('votes_overall.vote_type', '=', db.raw('?', ['Best Overall']));
        })
        .countDistinct('likes.id as like_count')
        .sum('votes_musically.vote_value as best_musically_votes')
        .sum('votes_lyrically.vote_value as best_lyrically_votes')
        .sum('votes_overall.vote_value as best_overall_votes')
        .groupBy('songs.id', 'users.id', 'users.username');  // Add 'users.id' and 'users.username' here

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
          query = query
            .leftJoin('song_verses', 'songs.id', 'song_verses.song_id')
            .leftJoin('bible_verses', 'song_verses.verse_id', 'bible_verses.id')
            .orderBy([
              { column: 'bible_verses.book', order: sortOrder },
              { column: 'bible_verses.chapter', order: sortOrder },
              { column: 'bible_verses.verse', order: sortOrder },
            ]);
          break;
        default:
          query = query.orderBy('songs.created_at', sortOrder);
      }

      // After applying all filters, select songs
      const songsQuery = query.clone().offset(offset).limit(limitNum);
      const songs = await songsQuery;

      // Get the total count without pagination
      const totalQuery = query.clone().clearSelect().countDistinct('songs.id as total');
      const totalResult = await totalQuery.first();
      const total = totalResult ? Number(totalResult.total) : 0;

      // Fetch Bible verses for each song
      const songIds = songs.map(song => song.id);

      const verses = await db('song_verses')
        .join('bible_verses', 'song_verses.verse_id', 'bible_verses.id')
        .whereIn('song_verses.song_id', songIds)
        .select('song_verses.song_id', 'bible_verses.book', 'bible_verses.chapter', 'bible_verses.verse')
        .orderBy(['bible_verses.book', 'bible_verses.chapter', 'bible_verses.verse']);

      // Attach verses to songs
      const versesBySongId = verses.reduce((acc, verse) => {
        if (!acc[verse.song_id]) {
          acc[verse.song_id] = [];
        }
        acc[verse.song_id].push({ book: verse.book, chapter: verse.chapter, verse: verse.verse });
        return acc;
      }, {});

      songs.forEach(song => {
        song.bible_verses = versesBySongId[song.id] || [];
      });

      res.status(200).json({ songs: songs || [], total });
    } catch (error) {
      console.error('Error fetching songs:', error);
      res.status(500).json({ message: 'Error fetching songs', error: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}