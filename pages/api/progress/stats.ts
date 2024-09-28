import type { NextApiRequest, NextApiResponse } from "next"
import db from "@/db"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const [{ total_verses_covered }] = await db("progress_materialized_view")
    .sum("verses_covered as total_verses_covered")

  const totalVerses = 31102 // Total number of verses in the Bible
  const percentageCovered = (total_verses_covered / totalVerses) * 100

  res.status(200).json({
    totalVersesCovered: total_verses_covered,
    percentageCovered,
  })
}