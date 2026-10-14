import { describe, expect, it } from "vitest"

import {
  checkInStreak,
  comparePeriods,
  generateInsights,
  habitCompletionRate,
  habitStreak,
  measurementDelta,
  streak,
} from "./analytics"
import { dateRange } from "./dates"
import { emptyData, type DailyLog, type Habit, type PulseData } from "./types"

const TODAY = "2026-10-14"

const log = (date: string, patch: Partial<DailyLog> = {}): DailyLog => ({
  date,
  mood: 3,
  energy: 3,
  sleepHours: 7,
  sleepQuality: 3,
  completedHabitIds: [],
  notes: "",
  ...patch,
})

const logsFrom = (entries: DailyLog[]) =>
  Object.fromEntries(entries.map((l) => [l.date, l]))

const habit: Habit = {
  id: "h1",
  name: "Walk",
  category: "Movement",
  archived: false,
  createdAt: "2026-10-01",
}

describe("streak", () => {
  it("is zero with no dates", () => {
    expect(streak([], TODAY)).toEqual({ current: 0, longest: 0 })
  })

  it("counts consecutive days ending today", () => {
    expect(streak(["2026-10-12", "2026-10-13", "2026-10-14"], TODAY)).toEqual({
      current: 3,
      longest: 3,
    })
  })

  it("stays alive when the last day was yesterday", () => {
    expect(streak(["2026-10-12", "2026-10-13"], TODAY).current).toBe(2)
  })

  it("breaks across a gap and keeps the longest run", () => {
    const dates = ["2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04", "2026-10-13", "2026-10-14"]
    expect(streak(dates, TODAY)).toEqual({ current: 2, longest: 4 })
  })

  it("is zero when the last day was two days ago", () => {
    expect(streak(["2026-10-11", "2026-10-12"], TODAY).current).toBe(0)
  })

  it("handles month boundaries", () => {
    expect(streak(["2026-09-30", "2026-10-01"], "2026-10-01").current).toBe(2)
  })
})

describe("checkInStreak / habitStreak", () => {
  const logs = logsFrom([
    log("2026-10-12", { completedHabitIds: ["h1"] }),
    log("2026-10-13"),
    log("2026-10-14", { completedHabitIds: ["h1"] }),
  ])

  it("uses every logged day for check-ins", () => {
    expect(checkInStreak(logs, TODAY)).toEqual({ current: 3, longest: 3 })
  })

  it("only counts days the habit was done", () => {
    expect(habitStreak(logs, "h1", TODAY)).toEqual({ current: 1, longest: 1 })
  })
})

describe("habitCompletionRate", () => {
  it("only counts days since the habit was created", () => {
    const logs = logsFrom(
      dateRange("2026-10-14", 4).map((d, i) =>
        log(d, { completedHabitIds: i % 2 === 0 ? ["h1"] : [] })
      )
    )
    const recent = { ...habit, createdAt: "2026-10-11" }
    // 4 days in window, done on 2 of them
    expect(habitCompletionRate(logs, recent, TODAY, 30)).toBe(0.5)
  })

  it("is zero for a habit created after the window", () => {
    expect(habitCompletionRate({}, { ...habit, createdAt: "2026-11-01" }, TODAY, 7)).toBe(0)
  })
})

describe("comparePeriods", () => {
  it("compares the last N days with the N before", () => {
    const logs = logsFrom([
      log("2026-10-14", { sleepHours: 8 }),
      log("2026-10-13", { sleepHours: 8 }),
      log("2026-10-06", { sleepHours: 6 }),
    ])
    expect(comparePeriods(logs, "sleepHours", TODAY, 7)).toEqual({
      current: 8,
      previous: 6,
      delta: 2,
    })
  })

  it("returns null delta without a previous period", () => {
    const logs = logsFrom([log("2026-10-14")])
    expect(comparePeriods(logs, "mood", TODAY, 7).delta).toBeNull()
  })
})

describe("measurementDelta", () => {
  it("compares the latest reading with one at least N days older", () => {
    const m = (date: string, value: number) => ({ id: date, date, type: "weight", value, notes: "" })
    const result = measurementDelta([m("2026-07-01", 80), m("2026-09-01", 78), m("2026-10-14", 76)], "weight", 30)
    expect(result?.baseline.value).toBe(78)
    expect(result?.delta).toBe(-2)
  })
})

describe("generateInsights", () => {
  const withLogs = (logs: DailyLog[], patch: Partial<PulseData> = {}): PulseData => ({
    ...emptyData(),
    habits: [habit],
    logs: logsFrom(logs),
    ...patch,
  })

  it("gives nothing for an empty account", () => {
    expect(generateInsights(emptyData(), TODAY)).toEqual([])
  })

  it("nudges when today has no check-in", () => {
    const ids = generateInsights(withLogs([log("2026-10-13")]), TODAY).map((i) => i.id)
    expect(ids).toContain("nudge-checkin")
  })

  it("needs at least 7 logs before correlations", () => {
    const logs = dateRange(TODAY, 6).map((d, i) => log(d, { sleepHours: i < 3 ? 8 : 5, energy: i < 3 ? 5 : 2 }))
    const ids = generateInsights(withLogs(logs), TODAY).map((i) => i.id)
    expect(ids).not.toContain("sleep-energy")
  })

  it("finds higher energy after 7+ hours of sleep", () => {
    const logs = dateRange(TODAY, 8).map((d, i) =>
      log(d, { sleepHours: i % 2 ? 8 : 5, energy: i % 2 ? 5 : 2 })
    )
    const insight = generateInsights(withLogs(logs), TODAY).find((i) => i.id === "sleep-energy")
    expect(insight?.tone).toBe("positive")
  })

  it("finds better mood on habit days", () => {
    const logs = dateRange(TODAY, 8).map((d, i) =>
      log(d, { completedHabitIds: i % 2 ? ["h1"] : [], mood: i % 2 ? 5 : 2 })
    )
    const insight = generateInsights(withLogs(logs), TODAY).find((i) => i.id === "habit-h1-mood")
    expect(insight?.tone).toBe("positive")
  })

  it("celebrates a 7-day streak", () => {
    const logs = dateRange(TODAY, 7).map((d) => log(d))
    const ids = generateInsights(withLogs(logs), TODAY).map((i) => i.id)
    expect(ids).toContain("streak-milestone")
  })

  it("respects lower-is-better for measurements", () => {
    const m = (date: string, value: number) => ({ id: date, date, type: "weight", value, notes: "" })
    const data = withLogs([], { measurements: [m("2026-09-01", 80), m("2026-10-14", 78)] })
    expect(generateInsights(data, TODAY).find((i) => i.id === "measurement-weight")?.tone).toBe("positive")
  })

  it("flags body areas getting worse", () => {
    const b = (date: string, severity: number) => ({ id: date, date, area: "joints", severity, description: "" })
    const data = withLogs([], { bodyChanges: [b("2026-09-01", 2), b("2026-10-01", 4)] })
    expect(generateInsights(data, TODAY).find((i) => i.id === "body-joints")?.tone).toBe("negative")
  })
})
