"use client"

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

export type ChartRow = { label: string } & Record<string, number | string | null>

export function MetricLineChart({
  data,
  config,
  domain,
  className = "h-56 w-full",
}: {
  data: ChartRow[]
  config: ChartConfig
  domain?: [number, number]
  className?: string
}) {
  const keys = Object.keys(config)
  return (
    <ChartContainer config={config} className={className}>
      <LineChart data={data} margin={{ left: 4, right: 12, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={32}
          domain={domain ?? ["auto", "auto"]}
          allowDecimals={false}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        {keys.length > 1 && <ChartLegend content={<ChartLegendContent />} />}
        {keys.map((key) => (
          <Line
            key={key}
            dataKey={key}
            type="monotone"
            stroke={`var(--color-${key})`}
            strokeWidth={2}
            dot={data.length < 20}
            connectNulls
          />
        ))}
      </LineChart>
    </ChartContainer>
  )
}
