"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartLine } from "lucide-react"
import Link from "next/link"

import { MetricLineChart } from "@/components/metric-line-chart"
import { PageHeader } from "@/components/page-header"
import { StoreGate } from "@/components/store-gate"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  comparePeriods,
  dailyHabitCompletion,
  habitCompletionRate,
} from "@/lib/analytics"
import { dateRange, formatShortDate, today } from "@/lib/dates"
import type { PulseData } from "@/lib/types"

const periods = [7, 30, 90]

const moodConfig = {
  mood: { label: "Mood", color: "var(--chart-1)" },
  energy: { label: "Energy", color: "var(--chart-2)" },
}
const sleepHoursConfig = {
  sleepHours: { label: "Hours", color: "var(--chart-3)" },
}
const sleepQualityConfig = {
  sleepQuality: { label: "Quality", color: "var(--chart-4)" },
}
const habitConfig = {
  completion: { label: "Habits done (%)", color: "var(--chart-5)" },
}

export function TrendsView() {
  return <StoreGate>{(data) => <Trends data={data} />}</StoreGate>
}

function Trends({ data }: { data: PulseData }) {
  const hasLogs = Object.keys(data.logs).length > 0
  return (
    <>
      <PageHeader title="Trends" description="How your mood, energy, sleep and habits move over time." />
      {!hasLogs ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ChartLine />
            </EmptyMedia>
            <EmptyTitle>No trends yet</EmptyTitle>
            <EmptyDescription>Trends appear once you&apos;ve done a few daily check-ins.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button nativeButton={false} render={<Link href="/check-in" />}>Do a check-in</Button>
          </EmptyContent>
        </Empty>
      ) : (
        <Tabs defaultValue="30">
          <TabsList>
            {periods.map((p) => (
              <TabsTrigger key={p} value={String(p)}>
                {p} days
              </TabsTrigger>
            ))}
          </TabsList>
          {periods.map((p) => (
            <TabsContent key={p} value={String(p)}>
              <Period data={data} days={p} />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </>
  )
}

function Period({ data, days }: { data: PulseData; days: number }) {
  const end = today()
  const dates = dateRange(end, days)
  const rows = dates.map((d) => {
    const log = data.logs[d]
    const completion = dailyHabitCompletion(log, data.habits)
    return {
      label: formatShortDate(d),
      mood: log?.mood ?? null,
      energy: log?.energy ?? null,
      sleepHours: log?.sleepHours ?? null,
      sleepQuality: log?.sleepQuality ?? null,
      completion: completion === null ? null : Math.round(completion * 100),
    }
  })
  const checkIns = dates.filter((d) => data.logs[d]).length
  const avg = (metric: "mood" | "energy" | "sleepHours" | "sleepQuality") => {
    const { current } = comparePeriods(data.logs, metric, end, days)
    return current === null ? "–" : current.toFixed(1)
  }
  const activeHabits = data.habits.filter((h) => !h.archived)

  return (
    <div className="grid gap-4 pt-2 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Mood &amp; energy</CardTitle>
          <CardDescription>
            Average mood {avg("mood")}, energy {avg("energy")} · {checkIns} of {days} days logged
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MetricLineChart data={rows} config={moodConfig} domain={[1, 5]} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sleep hours</CardTitle>
          <CardDescription>Average {avg("sleepHours")} h a night</CardDescription>
        </CardHeader>
        <CardContent>
          <MetricLineChart data={rows} config={sleepHoursConfig} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sleep quality</CardTitle>
          <CardDescription>Average {avg("sleepQuality")} out of 5</CardDescription>
        </CardHeader>
        <CardContent>
          <MetricLineChart data={rows} config={sleepQualityConfig} domain={[1, 5]} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daily habit completion</CardTitle>
          <CardDescription>Share of your active habits done each day</CardDescription>
        </CardHeader>
        <CardContent>
          {activeHabits.length === 0 ? (
            <CardDescription>Add habits to see completion here.</CardDescription>
          ) : (
            <ChartContainer config={habitConfig} className="h-56 w-full">
              <BarChart data={rows} margin={{ left: 4, right: 12, top: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
                <YAxis tickLine={false} axisLine={false} width={32} domain={[0, 100]} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="completion" fill="var(--color-completion)" radius={4} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {activeHabits.length > 0 && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Per habit</CardTitle>
            <CardDescription>Completion over the last {days} days</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {activeHabits.map((habit) => {
              const rate = Math.round(habitCompletionRate(data.logs, habit, end, days) * 100)
              return (
                <div key={habit.id} className="grid grid-cols-3 items-center gap-4">
                  <span className="text-sm">{habit.name}</span>
                  <Progress value={rate} className="col-span-2" aria-label={`${habit.name} completion`}>
                    <span className="ml-auto text-sm tabular-nums">{rate}%</span>
                  </Progress>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
