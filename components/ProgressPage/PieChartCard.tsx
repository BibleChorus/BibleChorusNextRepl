"use client"

import * as React from "react"
import { Label, Pie, PieChart } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"

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

export function PieChartCard({ title, description, data, totalVerses }: PieChartCardProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const theme = {
    text: isDark ? '#e5e5e5' : '#161616',
    textSecondary: isDark ? '#a0a0a0' : '#4a4a4a',
    accent: isDark ? '#d4af37' : '#bfa130',
  }

  const id = `pie-${title.toLowerCase().replace(/\s/g, '-')}`

  const chartConfig: ChartConfig = {
    covered: {
      label: "Covered",
      color: theme.accent,
    },
    uncovered: {
      label: "Uncovered",
      color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    },
  }

  return (
    <div data-chart={id} className="flex flex-col h-full">
      <ChartStyle id={id} config={chartConfig} />
      <div className="text-center mb-4">
        <h3 
          className="text-lg font-bold mb-2"
          style={{ color: theme.accent, fontFamily: "'Italiana', serif" }}
        >
          {title}
        </h3>
        <p 
          className="text-sm"
          style={{ color: theme.textSecondary, fontFamily: "'Manrope', sans-serif" }}
        >
          {description}
        </p>
      </div>
      <div className="flex justify-center flex-grow">
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
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={40}
              outerRadius={60}
              paddingAngle={2}
              strokeWidth={0}
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
                          className="text-xl font-bold"
                          style={{ 
                            fill: theme.accent,
                            fontFamily: "'Italiana', serif",
                          }}
                        >
                          {percentage}%
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 16}
                          className="text-[10px]"
                          style={{ 
                            fill: theme.textSecondary,
                            fontFamily: "'Manrope', sans-serif",
                          }}
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
