"use client"

import * as React from "react"
import { Label, Pie, PieChart, Sector } from "recharts"
import { PieSectorDataItem } from "recharts/types/polar/Pie"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface PieChartCardProps {
  title: string
  description: string
  data: {
    name: string
    value: number
    fill: string
  }[]
  totalVerses: number
}

const chartConfig: ChartConfig = {
  covered: {
    label: "Covered",
    color: "hsl(var(--chart-purple))",
  },
  uncovered: {
    label: "Uncovered",
    color: "hsl(var(--chart-uncovered))",
  },
}

export function PieChartCard({ title, description, data, totalVerses }: PieChartCardProps) {
  const id = `pie-${title.toLowerCase().replace(/\s/g, '-')}`

  const updatedData = data.map(item => ({
    ...item,
    fill: item.name === "uncovered" ? "hsl(var(--chart-uncovered))" : item.fill
  }))

  return (
    <div data-chart={id} className="flex flex-col">
      <ChartStyle id={id} config={chartConfig} />
      <div className="text-center mb-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex justify-center">
        <ChartContainer
          id={id}
          config={chartConfig}
          className="w-full max-w-[150px] aspect-square"
        >
          <PieChart>
            <ChartTooltip
              content={<ChartTooltipContent nameKey="name" labelKey="value" />}
            />
            <Pie
              data={updatedData}
              dataKey="value"
              nameKey="name"
              innerRadius={40}
              outerRadius={60}
              paddingAngle={2}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    const coveredVerses = data.find(item => item.name === "covered")?.value || 0
                    const percentage = ((coveredVerses / totalVerses) * 100).toFixed(2)
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-xl font-bold"
                        >
                          {percentage}%
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 16}
                          className="fill-muted-foreground text-[10px]"
                        >
                          Covered
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </div>
    </div>
  )
}