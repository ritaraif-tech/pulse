"use client"

import Link from "next/link"
import { CalendarCheck, Flame, HeartPulse, Sparkles } from "lucide-react"

import { InsightCard } from "@/components/insight-card"
import { MetricLineChart } from "@/components/metric-line-chart"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { StoreGate } from "@/components/store-gate"
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  checkInStreak,
  comparePeriods,
  generateInsights,
  measurementsOfType,
} from "@/lib/analytics"
import { dateRange, formatDate, formatShortDate, today } from "@/lib/dates"
import { measurementTypes } from "@/lib/measurement-types"
import type { PulseData } from "@/lib/types"

const chartConfig = {
  mood: { label: "Mood", color: "var(--chart-1)" },
  energy: { label: "Energy", color: "var(--chart-2)" },
}

export function DashboardView() {
  return <StoreGate>{(data) => <Dashboard data={data} />}</StoreGate>
}

const isEmpty = (data: PulseData) =>
  Object.keys(data.logs).length === 0 &&
  data.habits.length === 0 &&
  data.measurements.length === 0 &&
  data.bodyChanges.length === 0

function Dashboard({ data }: { data: PulseData }) {
  const name = data.profile.name.trim()
  const greeting = name ? `Hi, ${name}` : "Dashboard"

  if (isEmpty(data)) {
    return (
      <>
        <PageHeader title={greeting} />
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HeartPulse />
            </EmptyMedia>
            <EmptyTitle>Welcome to Pulse</EmptyTitle>
            <EmptyDescription>
              Track the daily habits, sleep, mood and energy that shape how you age. Start with your first check-in.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="flex-row justify-center">
            <Button nativeButton={false} render={<Link href="/check-in" />}>
              <CalendarCheck />
              Do your first check-in
            </Button>
            <Button variant="outline" nativeButton={false} render={<Link href="/habits" />}>
              <Sparkles />
              Set up habits
            </Button>
          </EmptyContent>
        </Empty>
      </>
    )
  }

  const date = today()
  const todayLog = data.logs[date]
  const streak = checkInStreak(data.logs, date)
  const mood = comparePeriods(data.logs, "mood", date, 7)
  const energy = comparePeriods(data.logs, "energy", date, 7)
  const sleep = comparePeriods(data.logs, "sleepHours", date, 7)
  const activeHabits = data.habits.filter((h) => !h.archived)
  const doneToday = activeHabits.filter((h) => todayLog?.completedHabitIds.includes(h.id)).length
  const insights = generateInsights(data, date).slice(0, 3)
  const chartRows = dateRange(date, 14).map((d) => ({
    label: formatShortDate(d),
    mood: data.logs[d]?.mood ?? null,
    energy: data.logs[d]?.energy ?? null,
  }))
  const latestMeasurements = measurementTypes.flatMap((type) => {
    const latest = measurementsOfType(data.measurements, type.id).at(-1)
    return latest ? [{ type, latest }] : []
  })
  const fmt = (n: number | null, unit = "") => (n === null ? "–" : `${n.toFixed(1)}${unit}`)

  return (
    <>
      <PageHeader title={greeting} description={formatDate(date)} />

      {todayLog ? (
        <Alert>
          <CalendarCheck />
          <AlertTitle>You&apos;ve checked in today</AlertTitle>
          <AlertDescription>Nice work. You can still update it if something changes.</AlertDescription>
          <AlertAction>
            <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/check-in" />}>
              Edit
            </Button>
          </AlertAction>
        </Alert>
      ) : (
        <Alert>
          <CalendarCheck />
          <AlertTitle>No check-in yet today</AlertTitle>
          <AlertDescription>It takes under a minute and keeps your streak going.</AlertDescription>
          <AlertAction>
            <Button size="sm" nativeButton={false} render={<Link href="/check-in" />}>
              Check in
            </Button>
          </AlertAction>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Check-in streak"
          value={`${streak.current} ${streak.current === 1 ? "day" : "days"}`}
          footer={
            <CardDescription className="flex items-center gap-1">
              <Flame className="size-4" />
              Longest {streak.longest} days
            </CardDescription>
          }
        />
        <StatCard
          label="Mood · 7-day avg"
          value={fmt(mood.current)}
          delta={mood.delta}
          footer={<CardDescription>vs previous 7 days</CardDescription>}
        />
        <StatCard
          label="Energy · 7-day avg"
          value={fmt(energy.current)}
          delta={energy.delta}
          footer={<CardDescription>vs previous 7 days</CardDescription>}
        />
        <StatCard
          label="Sleep · 7-day avg"
          value={fmt(sleep.current, " h")}
          delta={sleep.delta}
          deltaUnit=" h"
          footer={<CardDescription>vs previous 7 days</CardDescription>}
        />
        <StatCard
          label="Habits today"
          value={activeHabits.length ? `${doneToday} / ${activeHabits.length}` : "–"}
        >
          <CardContent>
            {activeHabits.length ? (
              <Progress value={(doneToday / activeHabits.length) * 100} aria-label="Habits done today" />
            ) : (
              <CardDescription>
                <Link href="/habits">Add habits</Link>
              </CardDescription>
            )}
          </CardContent>
        </StatCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Last 14 days</CardTitle>
            <CardDescription>Mood and energy from your check-ins</CardDescription>
            <CardAction>
              <Button size="sm" variant="ghost" nativeButton={false} render={<Link href="/trends" />}>
                All trends
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <MetricLineChart data={chartRows} config={chartConfig} domain={[1, 5]} />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Insights</CardTitle>
              <CardDescription>
                {insights.length ? "What your data is telling you" : "Insights appear after a week of check-ins."}
              </CardDescription>
              <CardAction>
                <Button size="sm" variant="ghost" nativeButton={false} render={<Link href="/insights" />}>
                  All insights
                </Button>
              </CardAction>
            </CardHeader>
            {insights.length > 0 && (
              <CardContent className="flex flex-col gap-3">
                {insights.map((insight) => (
                  <InsightCard key={insight.id} insight={insight} />
                ))}
              </CardContent>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Latest measurements</CardTitle>
              <CardAction>
                <Button size="sm" variant="ghost" nativeButton={false} render={<Link href="/measurements" />}>
                  {latestMeasurements.length ? "View all" : "Add"}
                </Button>
              </CardAction>
              {latestMeasurements.length === 0 && (
                <CardDescription>No measurements logged yet.</CardDescription>
              )}
            </CardHeader>
            {latestMeasurements.length > 0 && (
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Measurement</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {latestMeasurements.map(({ type, latest }) => (
                      <TableRow key={type.id}>
                        <TableCell>{type.label}</TableCell>
                        <TableCell className="tabular-nums">
                          {latest.value2 !== undefined ? `${latest.value}/${latest.value2}` : latest.value}{" "}
                          {type.unit[data.profile.units]}
                        </TableCell>
                        <TableCell>{formatDate(latest.date)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </>
  )
}
