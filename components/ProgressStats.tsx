"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { VERSE_COUNTS } from "@/lib/constants"

interface Stats {
  totalVersesCovered: number
  percentageCovered: number
}

export function ProgressStats() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      const response = await fetch("/api/progress/stats")
      const data = await response.json()
      setStats(data)
    }
    fetchStats()
  }, [])

  if (!stats) {
    return <div>Loading...</div>
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      <Card className="p-4">
        <h3 className="text-lg font-medium">Total Verses Covered</h3>
        <p className="text-3xl font-bold">{stats.totalVersesCovered}</p>
      </Card>
      <Card className="p-4">
        <h3 className="text-lg font-medium">Bible Coverage Percentage</h3>
        <p className="text-3xl font-bold">{stats.percentageCovered.toFixed(2)}%</p>
      </Card>
    </div>
  )
}