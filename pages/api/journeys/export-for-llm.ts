import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';
import axios from 'axios';
import { BIBLE_BOOKS } from '@/lib/constants';

interface TimelineItem {
  type: 'season_start' | 'season_end' | 'song' | 'important_date';
  date: string;
  data: any;
}

interface BibleVerseRequest {
  translation: string;
  book: number;
  chapter: number;
  verses: number[];
}

interface ExportedJourneyData {
  journey: {
    title: string;
    subtitle: string | null;
    bio: string | null;
    creator: string;
    totalSongs: number;
    totalSeasons: number;
    createdAt: string;
    notebookLmUrl: string | null;
  };
  timeline: Array<{
    date: string;
    type: string;
    content: any;
  }>;
  bibleVerses: {
    [reference: string]: string;
  };
}

const BOOK_ABBREVIATIONS: { [key: string]: string } = {
  'gen': 'Genesis',
  'ex': 'Exodus',
  'exo': 'Exodus',
  'exod': 'Exodus',
  'lev': 'Leviticus',
  'num': 'Numbers',
  'deut': 'Deuteronomy',
  'dt': 'Deuteronomy',
  'josh': 'Joshua',
  'judg': 'Judges',
  'jdg': 'Judges',
  'ru': 'Ruth',
  '1sam': '1 Samuel',
  '1 sam': '1 Samuel',
  '1sa': '1 Samuel',
  '2sam': '2 Samuel',
  '2 sam': '2 Samuel',
  '2sa': '2 Samuel',
  '1kgs': '1 Kings',
  '1 kgs': '1 Kings',
  '1ki': '1 Kings',
  '1 kings': '1 Kings',
  '2kgs': '2 Kings',
  '2 kgs': '2 Kings',
  '2ki': '2 Kings',
  '2 kings': '2 Kings',
  '1chr': '1 Chronicles',
  '1 chr': '1 Chronicles',
  '1 chron': '1 Chronicles',
  '1 chronicles': '1 Chronicles',
  '2chr': '2 Chronicles',
  '2 chr': '2 Chronicles',
  '2 chron': '2 Chronicles',
  '2 chronicles': '2 Chronicles',
  'ezr': 'Ezra',
  'neh': 'Nehemiah',
  'est': 'Esther',
  'esth': 'Esther',
  'ps': 'Psalms',
  'psa': 'Psalms',
  'psalm': 'Psalms',
  'prov': 'Proverbs',
  'pr': 'Proverbs',
  'eccl': 'Ecclesiastes',
  'ecc': 'Ecclesiastes',
  'song': 'Song of Solomon',
  'ss': 'Song of Solomon',
  'sos': 'Song of Solomon',
  'isa': 'Isaiah',
  'is': 'Isaiah',
  'jer': 'Jeremiah',
  'lam': 'Lamentations',
  'ezek': 'Ezekiel',
  'eze': 'Ezekiel',
  'dan': 'Daniel',
  'dn': 'Daniel',
  'hos': 'Hosea',
  'jo': 'Joel',
  'am': 'Amos',
  'ob': 'Obadiah',
  'obad': 'Obadiah',
  'jon': 'Jonah',
  'mic': 'Micah',
  'na': 'Nahum',
  'nah': 'Nahum',
  'hab': 'Habakkuk',
  'zeph': 'Zephaniah',
  'zep': 'Zephaniah',
  'hag': 'Haggai',
  'zech': 'Zechariah',
  'zec': 'Zechariah',
  'mal': 'Malachi',
  'mt': 'Matthew',
  'matt': 'Matthew',
  'mk': 'Mark',
  'lk': 'Luke',
  'jn': 'John',
  'joh': 'John',
  'ac': 'Acts',
  'rom': 'Romans',
  'ro': 'Romans',
  '1cor': '1 Corinthians',
  '1 cor': '1 Corinthians',
  '1co': '1 Corinthians',
  '1 corinthians': '1 Corinthians',
  '2cor': '2 Corinthians',
  '2 cor': '2 Corinthians',
  '2co': '2 Corinthians',
  '2 corinthians': '2 Corinthians',
  'gal': 'Galatians',
  'eph': 'Ephesians',
  'phil': 'Philippians',
  'php': 'Philippians',
  'col': 'Colossians',
  '1thess': '1 Thessalonians',
  '1 thess': '1 Thessalonians',
  '1th': '1 Thessalonians',
  '1 thessalonians': '1 Thessalonians',
  '2thess': '2 Thessalonians',
  '2 thess': '2 Thessalonians',
  '2th': '2 Thessalonians',
  '2 thessalonians': '2 Thessalonians',
  '1tim': '1 Timothy',
  '1 tim': '1 Timothy',
  '1ti': '1 Timothy',
  '1 timothy': '1 Timothy',
  '2tim': '2 Timothy',
  '2 tim': '2 Timothy',
  '2ti': '2 Timothy',
  '2 timothy': '2 Timothy',
  'tit': 'Titus',
  'phm': 'Philemon',
  'phlm': 'Philemon',
  'heb': 'Hebrews',
  'jas': 'James',
  'jam': 'James',
  '1pet': '1 Peter',
  '1 pet': '1 Peter',
  '1pe': '1 Peter',
  '1 peter': '1 Peter',
  '2pet': '2 Peter',
  '2 pet': '2 Peter',
  '2pe': '2 Peter',
  '2 peter': '2 Peter',
  '1jn': '1 John',
  '1 jn': '1 John',
  '1jo': '1 John',
  '1 john': '1 John',
  '2jn': '2 John',
  '2 jn': '2 John',
  '2jo': '2 John',
  '2 john': '2 John',
  '3jn': '3 John',
  '3 jn': '3 John',
  '3jo': '3 John',
  '3 john': '3 John',
  'jud': 'Jude',
  'rev': 'Revelation',
  'rv': 'Revelation',
};

function normalizeBookName(bookName: string): string {
  let normalized = bookName.trim().toLowerCase();
  normalized = normalized.replace(/\.$/, '');
  
  if (BOOK_ABBREVIATIONS[normalized]) {
    return BOOK_ABBREVIATIONS[normalized];
  }
  
  const withoutSpaces = normalized.replace(/\s+/g, '');
  if (BOOK_ABBREVIATIONS[withoutSpaces]) {
    return BOOK_ABBREVIATIONS[withoutSpaces];
  }
  
  const exactMatch = BIBLE_BOOKS.find(
    book => book.toLowerCase() === normalized
  );
  if (exactMatch) {
    return exactMatch;
  }
  
  const partialMatch = BIBLE_BOOKS.find(
    book => book.toLowerCase().startsWith(normalized) || normalized.startsWith(book.toLowerCase())
  );
  if (partialMatch) {
    return partialMatch;
  }
  
  console.warn(`Unknown Bible book: "${bookName}"`);
  return bookName;
}

function getBookNumber(bookName: string): number {
  const normalizedName = normalizeBookName(bookName);
  const index = BIBLE_BOOKS.findIndex(
    book => book.toLowerCase() === normalizedName.toLowerCase()
  );
  return index + 1;
}

function parseScriptureReference(reference: string): { book: string; chapter: number; verse: number }[] {
  const verses: { book: string; chapter: number; verse: number }[] = [];
  
  if (!reference) return verses;

  const segments = reference.split(/\s*;\s*/);
  
  let lastBook = '';
  let lastChapter = 0;
  
  for (const segment of segments) {
    if (!segment.trim()) continue;
    
    const fullMatch = segment.match(/^(.+?)\s+(\d+):(.+)$/);
    if (fullMatch) {
      const [, book, chapter, versesPart] = fullMatch;
      lastBook = book.trim().replace(/\.$/, '');
      lastChapter = parseInt(chapter);
      
      parseVersesPart(versesPart, lastBook, lastChapter, verses);
      continue;
    }
    
    const chapterVerseMatch = segment.match(/^(\d+):(.+)$/);
    if (chapterVerseMatch && lastBook) {
      const [, chapter, versesPart] = chapterVerseMatch;
      lastChapter = parseInt(chapter);
      
      parseVersesPart(versesPart, lastBook, lastChapter, verses);
      continue;
    }
    
    const verseOnlyMatch = segment.match(/^(\d+(?:\s*[-,]\s*\d+)*)$/);
    if (verseOnlyMatch && lastBook && lastChapter) {
      parseVersesPart(verseOnlyMatch[1], lastBook, lastChapter, verses);
      continue;
    }
    
    const simpleMatch = segment.match(/^(.+?)\s+(\d+)$/);
    if (simpleMatch) {
      const [, book, chapter] = simpleMatch;
      lastBook = book.trim().replace(/\.$/, '');
      lastChapter = parseInt(chapter);
      continue;
    }
  }

  return verses;
}

function parseVersesPart(
  versesPart: string, 
  book: string, 
  chapter: number, 
  verses: { book: string; chapter: number; verse: number }[]
): void {
  const parts = versesPart.split(/\s*,\s*/);
  
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    
    const rangeMatch = trimmed.match(/^(\d+)\s*-\s*(\d+)$/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1]);
      const end = parseInt(rangeMatch[2]);
      for (let v = start; v <= end; v++) {
        if (!verses.some(existing => 
          existing.book === book && 
          existing.chapter === chapter && 
          existing.verse === v
        )) {
          verses.push({ book, chapter, verse: v });
        }
      }
      continue;
    }
    
    const singleMatch = trimmed.match(/^(\d+)$/);
    if (singleMatch) {
      const verse = parseInt(singleMatch[1]);
      if (!verses.some(existing => 
        existing.book === book && 
        existing.chapter === chapter && 
        existing.verse === verse
      )) {
        verses.push({ book, chapter, verse });
      }
    }
  }
}

async function fetchBibleVerses(versesToFetch: BibleVerseRequest[]): Promise<Map<string, string>> {
  const verseTexts = new Map<string, string>();
  
  if (versesToFetch.length === 0) return verseTexts;

  try {
    const response = await axios.post(
      'https://bolls.life/get-verses/',
      versesToFetch.map(v => ({
        translation: v.translation,
        book: v.book,
        chapter: v.chapter,
        verses: v.verses
      }))
    );

    for (let i = 0; i < versesToFetch.length; i++) {
      const request = versesToFetch[i];
      const bookName = BIBLE_BOOKS[request.book - 1];
      const versesData = response.data[i];
      
      if (Array.isArray(versesData)) {
        for (const verseData of versesData) {
          const reference = `${bookName} ${request.chapter}:${verseData.verse}`;
          verseTexts.set(reference, verseData.text);
        }
      }
    }
  } catch (error) {
    console.error('Error fetching Bible verses:', error);
  }

  return verseTexts;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username } = req.query;

  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    const user = await db('users').where({ username }).first();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const profile = await db('journey_profiles')
      .where({ user_id: user.id })
      .first();

    if (!profile) {
      return res.status(404).json({ error: 'Journey not found' });
    }

    if (!profile.is_public) {
      return res.status(403).json({ error: 'This journey is private' });
    }

    const seasons = await db('seasons')
      .where({ user_id: user.id, is_visible: true })
      .orderBy('display_order', 'asc');

    const timeline: TimelineItem[] = [];
    const allBibleVerses: { book: string; chapter: number; verse: number }[] = [];

    for (const season of seasons) {
      if (season.scripture_reference) {
        const parsedVerses = parseScriptureReference(season.scripture_reference);
        allBibleVerses.push(...parsedVerses);
      }

      timeline.push({
        type: 'season_start',
        date: season.start_date,
        data: {
          id: season.id,
          title: season.title,
          description: season.description,
          reflection: season.reflection,
          scriptureReference: season.scripture_reference,
          year: season.year,
        }
      });

      if (season.end_date) {
        timeline.push({
          type: 'season_end',
          date: season.end_date,
          data: {
            seasonId: season.id,
            seasonTitle: season.title,
          }
        });
      }

      const seasonSongs = await db('journey_season_songs')
        .join('songs', 'journey_season_songs.song_id', 'songs.id')
        .where({ 'journey_season_songs.season_id': season.id })
        .select(
          'journey_season_songs.*',
          'songs.id as song_id',
          'songs.title as song_title',
          'songs.artist',
          'songs.duration',
          'songs.lyrics',
          'songs.bible_translation_used',
          'songs.genres',
          'songs.is_journey_song',
          'songs.journey_song_origin',
          'songs.journey_date',
          'songs.music_origin',
          'songs.ai_used_for_lyrics',
          'songs.created_at as song_created_at'
        )
        .orderBy('journey_season_songs.display_order', 'asc');

      for (const song of seasonSongs) {
        const songDate = song.journey_date || song.added_date || song.song_created_at;
        
        const songVerses = await db('song_verses')
          .join('bible_verses', 'song_verses.verse_id', 'bible_verses.id')
          .where({ 'song_verses.song_id': song.song_id })
          .select('bible_verses.book', 'bible_verses.chapter', 'bible_verses.verse');
        
        const songBibleVerses = songVerses.map(v => ({
          book: v.book,
          chapter: v.chapter,
          verse: v.verse
        }));
        
        allBibleVerses.push(...songBibleVerses);

        timeline.push({
          type: 'song',
          date: songDate,
          data: {
            id: song.song_id,
            seasonId: season.id,
            seasonTitle: season.title,
            title: song.song_title,
            artist: song.artist,
            duration: song.duration,
            lyrics: song.lyrics,
            personalNote: song.personal_note,
            significance: song.significance,
            bibleTranslationUsed: song.bible_translation_used,
            bibleVerses: songBibleVerses,
            genres: song.genres,
            isJourneySong: song.is_journey_song,
            journeySongOrigin: song.journey_song_origin,
            musicOrigin: song.music_origin,
            aiUsedForLyrics: song.ai_used_for_lyrics,
          }
        });
      }

      const importantDates = await db('journey_season_important_dates')
        .where({ season_id: season.id })
        .orderBy('event_date', 'asc');

      for (const date of importantDates) {
        timeline.push({
          type: 'important_date',
          date: date.event_date,
          data: {
            id: date.id,
            seasonId: season.id,
            seasonTitle: season.title,
            title: date.title,
            description: date.description,
          }
        });
      }
    }

    timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const verseRequests: BibleVerseRequest[] = [];
    const verseGrouping = new Map<string, number[]>();

    for (const verse of allBibleVerses) {
      const bookNum = getBookNumber(verse.book);
      if (bookNum === 0) continue;
      
      const key = `${bookNum}-${verse.chapter}`;
      if (!verseGrouping.has(key)) {
        verseGrouping.set(key, []);
      }
      const verses = verseGrouping.get(key)!;
      if (!verses.includes(verse.verse)) {
        verses.push(verse.verse);
      }
    }

    for (const [key, verses] of verseGrouping) {
      const [book, chapter] = key.split('-').map(Number);
      verseRequests.push({
        translation: 'LSB',
        book,
        chapter,
        verses: verses.sort((a, b) => a - b),
      });
    }

    const verseTexts = await fetchBibleVerses(verseRequests);

    const bibleVersesObject: { [reference: string]: string } = {};
    verseTexts.forEach((text, reference) => {
      bibleVersesObject[reference] = text;
    });

    const totalSongs = timeline.filter(item => item.type === 'song').length;

    const exportData: ExportedJourneyData = {
      journey: {
        title: profile.title,
        subtitle: profile.subtitle,
        bio: profile.bio,
        creator: username,
        totalSongs,
        totalSeasons: seasons.length,
        createdAt: profile.created_at,
        notebookLmUrl: profile.notebook_lm_url || null,
      },
      timeline: timeline.map(item => ({
        date: item.date,
        type: item.type,
        content: item.data,
      })),
      bibleVerses: bibleVersesObject,
    };

    res.status(200).json(exportData);
  } catch (error) {
    console.error('Error exporting journey for LLM:', error);
    res.status(500).json({ error: 'Failed to export journey data' });
  }
}
