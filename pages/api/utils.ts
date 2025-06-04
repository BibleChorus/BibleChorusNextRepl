import db from '@/db';

export async function getVerseIds(references: string[]): Promise<number[]> {
  const ids: number[] = [];
  for (const ref of references) {
    const [book, rest] = ref.split(' ');
    const [chapter, verse] = rest.split(':');
    const row = await db('bible_verses')
      .where({ book, chapter: Number(chapter), verse: Number(verse) })
      .first('id');
    if (row) ids.push(row.id);
  }
  return ids;
}
