import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type BibleVerse = { book: string; chapter: number; verse: number };

export function formatBibleVerses(verses: BibleVerse[]): string {
  if (!verses || verses.length === 0) return '';

  const groupedVerses = verses.reduce((acc, verse) => {
    const key = `${verse.book} ${verse.chapter}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(verse.verse);
    return acc;
  }, {} as Record<string, number[]>);

  const formattedVerses = Object.entries(groupedVerses).map(([key, verses]) => {
    const [book, chapter] = key.split(' ');
    const sortedVerses = verses.sort((a, b) => a - b);
    const ranges = sortedVerses.reduce((acc, verse, index, array) => {
      if (index === 0 || verse !== array[index - 1] + 1) {
        acc.push([verse]);
      } else {
        acc[acc.length - 1][1] = verse;
      }
      return acc;
    }, [] as [number, number?][]);

    const formattedRanges = ranges.map(range => range.length === 1 ? range[0] : `${range[0]}-${range[1]}`).join(',');
    return `${book} ${chapter}:${formattedRanges}`;
  });

  return formattedVerses.join('; ');
}

export function parsePostgresArray(pgArray: unknown): string[] {
  if (!pgArray) return [];
  if (Array.isArray(pgArray)) {
    return pgArray.map(String); // Ensure all elements are strings
  }
  if (typeof pgArray !== 'string') {
    return [];
  }
  return pgArray
    .slice(1, -1) // Remove the curly braces
    .split(',')
    .map((item) =>
      item
        .trim()
        .replace(/^"|"$/g, '')
        .replace(/\\"/g, '"')
    );
}
