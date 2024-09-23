import type { NextApiRequest, NextApiResponse } from "next"
import db from "@/db"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { lyricsAdherence, isContinuous, usesAI } = req.query

  // Build the query based on filters
  let query = db("progress_materialized_view").select("*")

  if (lyricsAdherence && lyricsAdherence !== "all") {
    query.where("lyrics_scripture_adherence", lyricsAdherence)
  }

  if (isContinuous && isContinuous !== "all") {
    query.where("is_continuous_passage", isContinuous === "true")
  }

  if (usesAI && usesAI !== "all") {
    query.where("ai_used_for_lyrics", usesAI === "true")
  }

  const data = await query

  res.status(200).json(data)
}