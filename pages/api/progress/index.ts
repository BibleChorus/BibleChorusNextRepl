import type { NextApiRequest, NextApiResponse } from "next"
import db from "@/db"

interface BookData {
  book: string;
  testament: string;
  total_verses: number;
  verses_covered: number;
  filtered_verses_covered: number;
  book_percentage: number;
  filtered_book_percentage: number;
}

interface TestamentData {
  books: BookData[];
  testament_total_verses: number;
  testament_verses_covered: number;
  filtered_testament_verses_covered: number;
  testament_percentage: number;
  filtered_testament_percentage: number;
}

interface BibleTotal {
  bible_total_verses: number;
  bible_verses_covered: number;
  filtered_bible_verses_covered: number;
  bible_percentage: number;
  filtered_bible_percentage: number;
}

interface ProgressData {
  [key: string]: TestamentData | BibleTotal;
  "Old Testament": TestamentData;
  "New Testament": TestamentData;
  bibleTotal: BibleTotal;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { lyricsAdherence, isContinuous, aiMusic } = req.query;

  // Define allowed adherence values
  const allowedAdherences = ['word_for_word', 'close_paraphrase', 'creative_inspiration'];

  // Parse and validate lyricsAdherence
  let adherenceValues: string[] = [];
  if (lyricsAdherence && lyricsAdherence !== "all") {
    if (Array.isArray(lyricsAdherence)) {
      adherenceValues = lyricsAdherence as string[];
    } else {
      adherenceValues = (lyricsAdherence as string).split(',');
    }
    adherenceValues = adherenceValues.filter(value => allowedAdherences.includes(value));
  } else {
    adherenceValues = allowedAdherences;
  }

  // Build query to get distinct verses per book
  try {
    // Step 1: Get total verses per book
    const totalVersesData = await db('bible_verses')
      .select('book')
      .count('* as total_verses')
      .groupBy('book');

    // Step 2: Get verses covered by any song
    const versesCoveredData = await db('bible_verses')
      .select('bible_verses.book')
      .countDistinct('bible_verses.id as verses_covered')
      .innerJoin('song_verses', 'bible_verses.id', 'song_verses.verse_id')
      .groupBy('bible_verses.book');

    // Step 3: Get verses covered by filtered songs
    let filteredVersesQuery = db('bible_verses')
      .select('bible_verses.book')
      .countDistinct('bible_verses.id as filtered_verses_covered')
      .innerJoin('song_verses', 'bible_verses.id', 'song_verses.verse_id')
      .innerJoin('songs', 'songs.id', 'song_verses.song_id')
      .groupBy('bible_verses.book');

    // Apply filters to the query
    if (adherenceValues.length > 0) {
      filteredVersesQuery = filteredVersesQuery.whereIn('songs.lyrics_scripture_adherence', adherenceValues);
    }

    if (isContinuous && isContinuous !== "all") {
      filteredVersesQuery = filteredVersesQuery.where('songs.is_continuous_passage', isContinuous === "true");
    }

    if (aiMusic && aiMusic !== "all") {
      filteredVersesQuery = filteredVersesQuery.where('songs.music_ai_generated', aiMusic === "true");
    }

    // Execute the filtered verses query
    const filteredVersesData = await filteredVersesQuery;

    // Merge data into a single structure
    const mergedData: Record<string, BookData> = {};
    totalVersesData.forEach((item: { book: string; total_verses: string | number }) => {
      mergedData[item.book] = {
        book: item.book,
        testament: '', // We'll fill this in later
        total_verses: Number(item.total_verses),
        verses_covered: 0,
        filtered_verses_covered: 0,
        book_percentage: 0,
        filtered_book_percentage: 0,
      };
    });

    versesCoveredData.forEach((item: { book: string; verses_covered: string | number }) => {
      if (mergedData[item.book]) {
        mergedData[item.book].verses_covered = Number(item.verses_covered);
      }
    });

    filteredVersesData.forEach((item: { book: string; filtered_verses_covered: string | number }) => {
      if (mergedData[item.book]) {
        mergedData[item.book].filtered_verses_covered = Number(item.filtered_verses_covered);
      }
    });

    // Attach testament information
    const bookInfo = require('@/lib/constants').BIBLE_BOOK_INFO;
    bookInfo.forEach((info: { book: string; testament: string }) => {
      if (mergedData[info.book]) {
        mergedData[info.book].testament = info.testament;
      }
    });

    // Calculate percentages and group by testament
    const groupedData: ProgressData = {
      "Old Testament": {
        books: [],
        testament_total_verses: 0,
        testament_verses_covered: 0,
        filtered_testament_verses_covered: 0,
        testament_percentage: 0,
        filtered_testament_percentage: 0,
      },
      "New Testament": {
        books: [],
        testament_total_verses: 0,
        testament_verses_covered: 0,
        filtered_testament_verses_covered: 0,
        testament_percentage: 0,
        filtered_testament_percentage: 0,
      },
      bibleTotal: {
        bible_total_verses: 0,
        bible_verses_covered: 0,
        filtered_bible_verses_covered: 0,
        bible_percentage: 0,
        filtered_bible_percentage: 0,
      },
    };

    Object.values(mergedData).forEach((bookData) => {
      // Calculate percentages
      bookData.book_percentage = (bookData.verses_covered / bookData.total_verses) * 100;
      bookData.filtered_book_percentage = (bookData.filtered_verses_covered / bookData.total_verses) * 100;

      const testamentKey = bookData.testament as "Old Testament" | "New Testament";
      const testamentData = groupedData[testamentKey];

      if (testamentData && 'books' in testamentData) {
        testamentData.books.push(bookData);
        testamentData.testament_total_verses += bookData.total_verses;
        testamentData.testament_verses_covered += bookData.verses_covered;
        testamentData.filtered_testament_verses_covered += bookData.filtered_verses_covered;
      }
    });

    // Calculate testament percentages
    (Object.keys(groupedData) as Array<keyof ProgressData>).forEach((key) => {
      const testamentData = groupedData[key];
      if (key !== 'bibleTotal' && 'testament_total_verses' in testamentData) {
        testamentData.testament_percentage = (testamentData.testament_verses_covered / testamentData.testament_total_verses) * 100;
        testamentData.filtered_testament_percentage = (testamentData.filtered_testament_verses_covered / testamentData.testament_total_verses) * 100;
      }
    });

    // Calculate bible total
    const oldTestament = groupedData["Old Testament"] as TestamentData;
    const newTestament = groupedData["New Testament"] as TestamentData;
    groupedData.bibleTotal.bible_total_verses = oldTestament.testament_total_verses + newTestament.testament_total_verses;
    groupedData.bibleTotal.bible_verses_covered = oldTestament.testament_verses_covered + newTestament.testament_verses_covered;
    groupedData.bibleTotal.filtered_bible_verses_covered = oldTestament.filtered_testament_verses_covered + newTestament.filtered_testament_verses_covered;
    groupedData.bibleTotal.bible_percentage = (groupedData.bibleTotal.bible_verses_covered / groupedData.bibleTotal.bible_total_verses) * 100;
    groupedData.bibleTotal.filtered_bible_percentage = (groupedData.bibleTotal.filtered_bible_verses_covered / groupedData.bibleTotal.bible_total_verses) * 100;

    // Send the response
    res.status(200).json(groupedData);

  } catch (error) {
    console.error("Error fetching progress data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}