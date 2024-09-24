"use client"

import { Card } from "@/components/ui/card"

interface ProgressStatsProps {
  bibleTotal: {
    bible_percentage: number;
    bible_verses_covered: number;
    bible_total_verses: number;
    filtered_bible_percentage: number;
    filtered_bible_verses_covered: number;
  };
  oldTestament: {
    testament_percentage: number;
    testament_verses_covered: number;
    testament_total_verses: number;
    filtered_testament_percentage: number;
    filtered_testament_verses_covered: number;
  };
  newTestament: {
    testament_percentage: number;
    testament_verses_covered: number;
    testament_total_verses: number;
    filtered_testament_percentage: number;
    filtered_testament_verses_covered: number;
  };
}

export function ProgressStats({ bibleTotal, oldTestament, newTestament }: ProgressStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4">
      <Card className="p-4">
        <h3 className="text-lg font-medium">Entire Bible Coverage</h3>
        <p className="text-3xl font-bold">{bibleTotal?.filtered_bible_percentage.toFixed(2)}%</p>
        <p className="text-sm text-muted-foreground">
          {bibleTotal?.filtered_bible_verses_covered} / {bibleTotal?.bible_total_verses} verses
        </p>
        <p className="text-xs text-muted-foreground">
          Overall: {bibleTotal?.bible_percentage.toFixed(2)}% ({bibleTotal?.bible_verses_covered} verses)
        </p>
      </Card>
      <Card className="p-4">
        <h3 className="text-lg font-medium">Old Testament Coverage</h3>
        <p className="text-3xl font-bold">{oldTestament?.filtered_testament_percentage.toFixed(2)}%</p>
        <p className="text-sm text-muted-foreground">
          {oldTestament?.filtered_testament_verses_covered} / {oldTestament?.testament_total_verses} verses
        </p>
        <p className="text-xs text-muted-foreground">
          Overall: {oldTestament?.testament_percentage.toFixed(2)}% ({oldTestament?.testament_verses_covered} verses)
        </p>
      </Card>
      <Card className="p-4">
        <h3 className="text-lg font-medium">New Testament Coverage</h3>
        <p className="text-3xl font-bold">{newTestament?.filtered_testament_percentage.toFixed(2)}%</p>
        <p className="text-sm text-muted-foreground">
          {newTestament?.filtered_testament_verses_covered} / {newTestament?.testament_total_verses} verses
        </p>
        <p className="text-xs text-muted-foreground">
          Overall: {newTestament?.testament_percentage.toFixed(2)}% ({newTestament?.testament_verses_covered} verses)
        </p>
      </Card>
    </div>
  )
}