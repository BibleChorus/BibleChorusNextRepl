import pdfParse from 'pdf-parse';

export async function pdfToText(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  return data.text;
}

export function extractBibleVerses(text: string): string[] {
  const versePatterns = [
    /\b((?:\d\s+)?[A-Za-z]+)\s+(\d+):(\d+(?:-\d+)?)\b/g,
    /\b(Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|Samuel|Kings|Chronicles|Ezra|Nehemiah|Esther|Job|Psalms?|Proverbs?|Ecclesiastes|Song|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|Corinthians|Galatians|Ephesians|Philippians|Colossians|Thessalonians|Timothy|Titus|Philemon|Hebrews|James|Peter|Jude|Revelation)\s+(\d+):(\d+(?:-\d+)?)\b/gi,
  ];
  const verses = new Set<string>();
  for (const pattern of versePatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      verses.add(`${match[1].trim()} ${match[2]}:${match[3]}`);
    }
  }
  return Array.from(verses);
}
