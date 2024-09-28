import type { NextApiRequest, NextApiResponse } from "next"
import db from "@/db"

interface BibleTotal {
  bible_verses_covered: number;
  filtered_bible_verses_covered: number;
  bible_total_verses: number;
  bible_percentage?: number;
  filtered_bible_percentage?: number;
}

interface Testament {
  books: any[];
  testament_verses_covered: number;
  testament_total_verses: number;
  filtered_testament_verses_covered: number;
  testament_percentage?: number;
  filtered_testament_percentage?: number;
}

interface GroupedData {
  [key: string]: Testament;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { lyricsAdherence, isContinuous, aiMusic } = req.query

  let query = db("progress_materialized_view")
    .select(
      "book",
      "testament",
      "total_verses",
      "verses_covered"
    )

  // Initialize the filtered verses column
  let filteredVersesColumn = "verses_covered"

  // Apply filters
  if (lyricsAdherence && lyricsAdherence !== "all") {
    filteredVersesColumn = `${lyricsAdherence}_verses`
  }

  if (isContinuous && isContinuous !== "all") {
    const continuousColumn = isContinuous === "true" ? "continuous_passage_verses" : "non_continuous_passage_verses"
    filteredVersesColumn = `LEAST(${filteredVersesColumn}, ${continuousColumn})`
  }

  if (aiMusic && aiMusic !== "all") {
    const aiMusicColumn = aiMusic === "true" ? "ai_music_verses" : "human_music_verses"
    filteredVersesColumn = `LEAST(${filteredVersesColumn}, ${aiMusicColumn})`
  }

  // Update the query to use the correct verses column
  query = query
    .select(db.raw(`${filteredVersesColumn} as filtered_verses_covered`))
    .select(db.raw(`(${filteredVersesColumn} * 100.0 / total_verses) as filtered_book_percentage`))

  try {
    const data = await query

    // Group the results by testament
    const groupedData: GroupedData = data.reduce((acc: GroupedData, item: any) => {
      if (!acc[item.testament]) {
        acc[item.testament] = {
          books: [],
          testament_verses_covered: 0,
          testament_total_verses: 0,
          filtered_testament_verses_covered: 0,
        }
      }
      acc[item.testament].books.push({
        book: item.book,
        verses_covered: parseInt(item.verses_covered),
        filtered_verses_covered: parseInt(item.filtered_verses_covered),
        total_verses: item.total_verses,
        book_percentage: (item.verses_covered / item.total_verses) * 100,
        filtered_book_percentage: parseFloat(item.filtered_book_percentage)
      })
      acc[item.testament].testament_verses_covered += parseInt(item.verses_covered)
      acc[item.testament].testament_total_verses += item.total_verses
      acc[item.testament].filtered_testament_verses_covered += parseInt(item.filtered_verses_covered)
      return acc
    }, {})

    // Calculate percentages for testaments and Bible
    Object.values(groupedData).forEach((testament: Testament) => {
      testament.testament_percentage = (testament.testament_verses_covered / testament.testament_total_verses) * 100
      testament.filtered_testament_percentage = (testament.filtered_testament_verses_covered / testament.testament_total_verses) * 100
    })

    const bibleTotal: BibleTotal = {
      bible_verses_covered: Object.values(groupedData).reduce((sum: number, testament: Testament) => sum + testament.testament_verses_covered, 0),
      filtered_bible_verses_covered: Object.values(groupedData).reduce((sum: number, testament: Testament) => sum + testament.filtered_testament_verses_covered, 0),
      bible_total_verses: Object.values(groupedData).reduce((sum: number, testament: Testament) => sum + testament.testament_total_verses, 0)
    }

    bibleTotal.bible_percentage = (bibleTotal.bible_verses_covered / bibleTotal.bible_total_verses) * 100
    bibleTotal.filtered_bible_percentage = (bibleTotal.filtered_bible_verses_covered / bibleTotal.bible_total_verses) * 100

    res.status(200).json({ ...groupedData, bibleTotal })
  } catch (error) {
    console.error("Error fetching progress data:", error)
    res.status(500).json({ error: "Internal Server Error" })
  }
}