"use client"

import { useSyncExternalStore } from "react"

import { today } from "./dates"
import {
  emptyData,
  pulseDataSchema,
  type BodyChange,
  type DailyLog,
  type Habit,
  type Measurement,
  type Profile,
  type PulseData,
} from "./types"

// All persistence goes through this module, so it is the seam for adding a
// backend later: swap the read/write functions and keep the actions.

const STORAGE_KEY = "pulse:v1"

let cache: PulseData | null = null
const listeners = new Set<() => void>()

function read(): PulseData {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyData()
    const parsed = pulseDataSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : emptyData()
  } catch {
    return emptyData()
  }
}

function write(next: PulseData) {
  cache = next
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  listeners.forEach((l) => l())
}

function update(fn: (data: PulseData) => PulseData) {
  write(fn(getSnapshot()))
}

function getSnapshot(): PulseData {
  if (cache === null) cache = read()
  return cache
}

function getServerSnapshot(): PulseData | null {
  return null
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return
    cache = read()
    listener()
  }
  window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", onStorage)
  }
}

/** Current data, or null during server render / before hydration */
export function usePulseData(): PulseData | null {
  return useSyncExternalStore<PulseData | null>(
    subscribe,
    getSnapshot,
    getServerSnapshot
  )
}

const newId = () => crypto.randomUUID()

export const actions = {
  upsertLog(log: DailyLog) {
    update((d) => ({ ...d, logs: { ...d.logs, [log.date]: log } }))
  },

  addHabit(habit: Pick<Habit, "name" | "category">) {
    const created: Habit = {
      ...habit,
      id: newId(),
      archived: false,
      createdAt: today(),
    }
    update((d) => ({ ...d, habits: [...d.habits, created] }))
    return created
  },

  addHabits(habits: Pick<Habit, "name" | "category">[]) {
    const created = habits.map<Habit>((h) => ({
      ...h,
      id: newId(),
      archived: false,
      createdAt: today(),
    }))
    update((d) => ({ ...d, habits: [...d.habits, ...created] }))
  },

  updateHabit(id: string, patch: Partial<Omit<Habit, "id">>) {
    update((d) => ({
      ...d,
      habits: d.habits.map((h) => (h.id === id ? { ...h, ...patch } : h)),
    }))
  },

  archiveHabit(id: string, archived = true) {
    actions.updateHabit(id, { archived })
  },

  addMeasurement(m: Omit<Measurement, "id">) {
    update((d) => ({
      ...d,
      measurements: [...d.measurements, { ...m, id: newId() }],
    }))
  },

  deleteMeasurement(id: string) {
    update((d) => ({
      ...d,
      measurements: d.measurements.filter((m) => m.id !== id),
    }))
  },

  addBodyChange(b: Omit<BodyChange, "id">) {
    update((d) => ({
      ...d,
      bodyChanges: [...d.bodyChanges, { ...b, id: newId() }],
    }))
  },

  deleteBodyChange(id: string) {
    update((d) => ({
      ...d,
      bodyChanges: d.bodyChanges.filter((b) => b.id !== id),
    }))
  },

  updateProfile(patch: Partial<Profile>) {
    update((d) => ({ ...d, profile: { ...d.profile, ...patch } }))
  },

  exportData(): string {
    return JSON.stringify(getSnapshot(), null, 2)
  },

  /** Replaces all data; returns an error message if the file is invalid */
  importData(json: string): string | null {
    let raw: unknown
    try {
      raw = JSON.parse(json)
    } catch {
      return "That file isn't valid JSON."
    }
    const parsed = pulseDataSchema.safeParse(raw)
    if (!parsed.success) return "That file isn't a Pulse export."
    write(parsed.data)
    return null
  },

  resetData() {
    write(emptyData())
  },
}
