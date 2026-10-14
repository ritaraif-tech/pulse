"use client"

import Link from "next/link"
import { Lightbulb } from "lucide-react"

import { InsightCard } from "@/components/insight-card"
import { PageHeader } from "@/components/page-header"
import { StoreGate } from "@/components/store-gate"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  generateInsights,
  insightCategoryLabels,
  type InsightCategory,
} from "@/lib/analytics"
import { today } from "@/lib/dates"
import type { PulseData } from "@/lib/types"

const order: InsightCategory[] = ["general", "sleep", "habits", "measurements", "body"]

export function InsightsView() {
  return <StoreGate>{(data) => <Insights data={data} />}</StoreGate>
}

function Insights({ data }: { data: PulseData }) {
  const insights = generateInsights(data, today())
  const logCount = Object.keys(data.logs).length

  return (
    <>
      <PageHeader
        title="Insights"
        description="Patterns found in your own data. They get sharper the more you log."
      />
      {insights.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Lightbulb />
            </EmptyMedia>
            <EmptyTitle>Not enough data yet</EmptyTitle>
            <EmptyDescription>
              {logCount < 7
                ? `Insights about sleep, mood and habits appear after 7 check-ins. You have ${logCount}.`
                : "Keep logging. Insights appear as patterns emerge."}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button nativeButton={false} render={<Link href="/check-in" />}>
              Do a check-in
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        order.map((category) => {
          const group = insights.filter((i) => i.category === category)
          if (group.length === 0) return null
          return (
            <section key={category} className="flex flex-col gap-3">
              <h2 className="text-lg font-medium">{insightCategoryLabels[category]}</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {group.map((insight) => (
                  <InsightCard key={insight.id} insight={insight} />
                ))}
              </div>
            </section>
          )
        })
      )}
    </>
  )
}
