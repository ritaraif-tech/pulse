import { bodyAreaLabel } from "./body-areas"
import { dateRange, shiftISODate } from "./dates"
import { measurementTypeById } from "./measurement-types"
import type { DailyLog, Habit, Measurement, PulseData } from "./types"

export type Streak = { current: number; longest: number }

/**
 * Consecutive-day streaks over a set of ISO dates. The current streak is still
 * alive if the last day was yesterday, so it doesn't reset before you check in.
 */
export function streak(dates: Iterable<string>, today: string): Streak {
  const set = new Set(dates)
  if (set.size === 0) return { current: 0, longest: 0 }

  let current = 0
  let cursor = set.has(today) ? today : shiftISODate(today, -1)
  while (set.has(cursor)) {
    current++
    cursor = shiftISODate(cursor, -1)
  }

  let longest = 0
  let run = 0
  let prev: string | null = null
  for (const date of [...set].sort()) {
    run = prev !== null && shiftISODate(prev, 1) === date ? run + 1 : 1
    longest = Math.max(longest, run)
    prev = date
  }
  return { current, longest }
}

export const checkInStreak = (logs: Record<string, DailyLog>, today: string) =>
  streak(Object.keys(logs), today)

export const habitStreak = (
  logs: Record<string, DailyLog>,
  habitId: string,
  today: string
) =>
  streak(
    Object.values(logs)
      .filter((l) => l.completedHabitIds.includes(habitId))
      .map((l) => l.date),
    today
  )

/** Share (0–1) of days in the window, since the habit was created, on which it was done */
export function habitCompletionRate(
  logs: Record<string, DailyLog>,
  habit: Habit,
  end: string,
  days: number
): number {
  const window = dateRange(end, days).filter((d) => d >= habit.createdAt)
  if (window.length === 0) return 0
  const done = window.filter((d) =>
    logs[d]?.completedHabitIds.includes(habit.id)
  ).length
  return done / window.length
}

export type LogMetric = "mood" | "energy" | "sleepHours" | "sleepQuality"

export function average(values: number[]): number | null {
  if (values.length === 0) return null
  return values.reduce((a, b) => a + b, 0) / values.length
}

export function averageMetric(
  logs: Record<string, DailyLog>,
  metric: LogMetric,
  dates: string[]
): number | null {
  return average(dates.flatMap((d) => (logs[d] ? [logs[d][metric]] : [])))
}

/** Average of a metric over the last `days` days and over the period before it */
export function comparePeriods(
  logs: Record<string, DailyLog>,
  metric: LogMetric,
  end: string,
  days: number
) {
  const currentDates = dateRange(end, days)
  const previousDates = dateRange(shiftISODate(end, -days), days)
  const current = averageMetric(logs, metric, currentDates)
  const previous = averageMetric(logs, metric, previousDates)
  return {
    current,
    previous,
    delta: current !== null && previous !== null ? current - previous : null,
  }
}

/** Share (0–1) of active habits completed on a given day */
export function dailyHabitCompletion(
  log: DailyLog | undefined,
  habits: Habit[]
): number | null {
  const active = habits.filter((h) => !h.archived)
  if (!log || active.length === 0) return null
  const done = active.filter((h) => log.completedHabitIds.includes(h.id)).length
  return done / active.length
}

export const measurementsOfType = (measurements: Measurement[], type: string) =>
  measurements
    .filter((m) => m.type === type)
    .sort((a, b) => a.date.localeCompare(b.date))

/** Change between the latest reading and the latest one at least `days` older */
export function measurementDelta(
  measurements: Measurement[],
  type: string,
  days: number
) {
  const series = measurementsOfType(measurements, type)
  const latest = series.at(-1)
  if (!latest) return null
  const cutoff = shiftISODate(latest.date, -days)
  const baseline = series.filter((m) => m.date <= cutoff).at(-1)
  if (!baseline) return null
  return { latest, baseline, delta: latest.value - baseline.value }
}

export type InsightCategory = "sleep" | "habits" | "body" | "measurements" | "general"
export type InsightTone = "positive" | "negative" | "neutral"

export type Insight = {
  id: string
  category: InsightCategory
  tone: InsightTone
  title: string
  description: string
}

const MIN_LOGS = 7
const MIN_GROUP = 3
const fmt = (n: number) => n.toFixed(1)

export function generateInsights(data: PulseData, today: string): Insight[] {
  const insights: Insight[] = []
  const logs = Object.values(data.logs)

  // Nudges
  if (logs.length > 0 && !data.logs[today]) {
    insights.push({
      id: "nudge-checkin",
      category: "general",
      tone: "neutral",
      title: "No check-in yet today",
      description: "A quick check-in keeps your streak going.",
    })
  }
  const lastMeasurement = [...data.measurements]
    .sort((a, b) => a.date.localeCompare(b.date))
    .at(-1)
  if (lastMeasurement && lastMeasurement.date < shiftISODate(today, -30)) {
    insights.push({
      id: "nudge-measurement",
      category: "measurements",
      tone: "neutral",
      title: "Time for a new measurement",
      description: "You haven't logged a measurement in over 30 days.",
    })
  }

  // Streak milestones
  const { current } = checkInStreak(data.logs, today)
  const milestone = [100, 60, 30, 14, 7].find((m) => current >= m)
  if (milestone) {
    insights.push({
      id: "streak-milestone",
      category: "general",
      tone: "positive",
      title: `${current}-day check-in streak`,
      description: `You've passed the ${milestone}-day mark. Consistency is what moves the needle.`,
    })
  }

  if (logs.length >= MIN_LOGS) {
    // Sleep vs mood and energy
    const rested = logs.filter((l) => l.sleepHours >= 7)
    const short = logs.filter((l) => l.sleepHours < 7)
    if (rested.length >= MIN_GROUP && short.length >= MIN_GROUP) {
      for (const metric of ["energy", "mood"] as const) {
        const a = average(rested.map((l) => l[metric]))!
        const b = average(short.map((l) => l[metric]))!
        if (Math.abs(a - b) >= 0.3) {
          insights.push({
            id: `sleep-${metric}`,
            category: "sleep",
            tone: a > b ? "positive" : "negative",
            title: `${metric === "energy" ? "Energy" : "Mood"} is ${a > b ? "higher" : "lower"} after 7+ hours of sleep`,
            description: `Average ${metric} ${fmt(a)} on nights with 7+ hours vs ${fmt(b)} on shorter nights.`,
          })
        }
      }
    }

    // Sleep trend: last 7 days vs the 7 before
    const sleepTrend = comparePeriods(data.logs, "sleepHours", today, 7)
    if (sleepTrend.delta !== null && Math.abs(sleepTrend.delta) >= 0.25) {
      const up = sleepTrend.delta > 0
      insights.push({
        id: "sleep-trend",
        category: "sleep",
        tone: up ? "positive" : "negative",
        title: `Sleep is trending ${up ? "up" : "down"}`,
        description: `${fmt(sleepTrend.current!)} h a night this week vs ${fmt(sleepTrend.previous!)} h the week before.`,
      })
    }

    // Habit days vs non-habit days
    for (const habit of data.habits.filter((h) => !h.archived)) {
      const tracked = logs.filter((l) => l.date >= habit.createdAt)
      const done = tracked.filter((l) => l.completedHabitIds.includes(habit.id))
      const skipped = tracked.filter((l) => !l.completedHabitIds.includes(habit.id))
      if (done.length < MIN_GROUP || skipped.length < MIN_GROUP) continue
      for (const metric of ["mood", "energy"] as const) {
        const a = average(done.map((l) => l[metric]))!
        const b = average(skipped.map((l) => l[metric]))!
        if (Math.abs(a - b) < 0.5) continue
        insights.push({
          id: `habit-${habit.id}-${metric}`,
          category: "habits",
          tone: a > b ? "positive" : "negative",
          title: `${metric === "energy" ? "Energy" : "Mood"} is ${a > b ? "higher" : "lower"} on "${habit.name}" days`,
          description: `Average ${metric} ${fmt(a)} on days you did it vs ${fmt(b)} on days you didn't.`,
        })
      }
    }
  }

  // Measurement changes over 30 and 90 days
  const types = new Set(data.measurements.map((m) => m.type))
  for (const type of types) {
    const def = measurementTypeById(type)
    if (!def) continue
    for (const days of [90, 30]) {
      const change = measurementDelta(data.measurements, type, days)
      if (!change || change.delta === 0) continue
      const better = change.delta < 0 === def.lowerIsBetter
      const unit = def.unit[data.profile.units]
      insights.push({
        id: `measurement-${type}`,
        category: "measurements",
        tone: better ? "positive" : "negative",
        title: `${def.label} ${change.delta > 0 ? "up" : "down"} ${fmt(Math.abs(change.delta))} ${unit}`,
        description: `Over roughly ${days} days: from ${change.baseline.value} to ${change.latest.value} ${unit}.`,
      })
      break
    }
  }

  // Body-change areas trending worse
  const byArea = new Map<string, typeof data.bodyChanges>()
  for (const b of [...data.bodyChanges].sort((a, b) => a.date.localeCompare(b.date))) {
    byArea.set(b.area, [...(byArea.get(b.area) ?? []), b])
  }
  for (const [area, entries] of byArea) {
    if (entries.length < 2) continue
    const first = entries[0]
    const last = entries.at(-1)!
    if (last.severity === first.severity) continue
    const worse = last.severity > first.severity
    insights.push({
      id: `body-${area}`,
      category: "body",
      tone: worse ? "negative" : "positive",
      title: `${bodyAreaLabel(area)} ${worse ? "getting worse" : "improving"}`,
      description: `Severity went from ${first.severity} to ${last.severity} across ${entries.length} entries.`,
    })
  }

  return insights
}

export const insightCategoryLabels: Record<InsightCategory, string> = {
  general: "General",
  sleep: "Sleep",
  habits: "Habits",
  body: "Body changes",
  measurements: "Measurements",
}
