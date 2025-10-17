import { NextApiRequest, NextApiResponse } from 'next'
import db from '@/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { id } = req.query
  const { bible_translation_used, is_continuous_passage, bible_verses } = req.body

  try {
    // Start a transaction
    await db.transaction(async (trx) => {
      // Update the song's Bible information
      await trx('songs')
        .where('id', id)
        .update({
          bible_translation_used,
          is_continuous_passage,
        })

      // Delete existing song_verses entries for this song
      await trx('song_verses').where('song_id', id).del()

      // Insert new song_verses entries
      const verseEntries = await Promise.all(bible_verses.map(async (verse: string) => {
        const trimmedVerse = verse.trim()
        const lastSpaceIndex = trimmedVerse.lastIndexOf(' ')

        if (lastSpaceIndex === -1) {
          throw new Error(`Invalid verse format: ${verse}`)
        }

        const book = trimmedVerse.slice(0, lastSpaceIndex)
        const chapterVerse = trimmedVerse.slice(lastSpaceIndex + 1)
        const [chapter, verseNumber] = chapterVerse.split(':')
        const parsedChapter = parseInt(chapter, 10)
        const parsedVerseNumber = parseInt(verseNumber, 10)

        if (Number.isNaN(parsedChapter) || Number.isNaN(parsedVerseNumber)) {
          throw new Error(`Invalid chapter or verse number: ${verse}`)
        }

        const verseId = await trx('bible_verses')
          .where({
            book,
            chapter: parsedChapter,
            verse: parsedVerseNumber
          })
          .select('id')
          .first()

        if (!verseId) {
          throw new Error(`Bible verse not found: ${verse}`)
        }

        return {
          song_id: id,
          verse_id: verseId.id
        }
      }))

      await trx('song_verses').insert(verseEntries)
    })

    // Fetch updated Bible verses
    const updatedVerses = await db('song_verses')
      .join('bible_verses', 'song_verses.verse_id', 'bible_verses.id')
      .where('song_verses.song_id', id)
      .select('bible_verses.book', 'bible_verses.chapter', 'bible_verses.verse', 'bible_verses.KJV_text')

    res.status(200).json({ message: 'Bible information updated successfully', bible_verses: updatedVerses })
  } catch (error) {
    console.error('Error updating Bible information:', error)
    res.status(500).json({ message: 'Error updating Bible information', error: error.message })
  }
}
