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
  const formatNumber = (num: number) => num.toLocaleString();
  const formatPercentage = (num: number) => (num || 0).toFixed(2);

  return (
    <div className="grid grid-cols-1 gap-4">
      <Card className="p-4">
        <h3 className="text-lg font-medium">Entire Bible Coverage</h3>
        <p className="text-3xl font-bold">{formatPercentage(bibleTotal?.filtered_bible_percentage)}%</p>
        <p className="text-sm text-muted-foreground">
          {formatNumber(bibleTotal?.filtered_bible_verses_covered)} / {formatNumber(bibleTotal?.bible_total_verses)} verses
        </p>
        <p className="text-xs text-muted-foreground">
          Overall: {formatPercentage(bibleTotal?.bible_percentage)}% ({formatNumber(bibleTotal?.bible_verses_covered)} verses)
        </p>
      </Card>
      <Card className="p-4">
        <h3 className="text-lg font-medium">Old Testament Coverage</h3>
        <p className="text-3xl font-bold">{formatPercentage(oldTestament?.filtered_testament_percentage)}%</p>
        <p className="text-sm text-muted-foreground">
          {formatNumber(oldTestament?.filtered_testament_verses_covered)} / {formatNumber(oldTestament?.testament_total_verses)} verses
        </p>
        <p className="text-xs text-muted-foreground">
          Overall: {formatPercentage(oldTestament?.testament_percentage)}% ({formatNumber(oldTestament?.testament_verses_covered)} verses)
        </p>
      </Card>
      <Card className="p-4">
        <h3 className="text-lg font-medium">New Testament Coverage</h3>
        <p className="text-3xl font-bold">{formatPercentage(newTestament?.filtered_testament_percentage)}%</p>
        <p className="text-sm text-muted-foreground">
          {formatNumber(newTestament?.filtered_testament_verses_covered)} / {formatNumber(newTestament?.testament_total_verses)} verses
        </p>
        <p className="text-xs text-muted-foreground">
          Overall: {formatPercentage(newTestament?.testament_percentage)}% ({formatNumber(newTestament?.testament_verses_covered)} verses)
        </p>
      </Card>
    </div>
  )
}