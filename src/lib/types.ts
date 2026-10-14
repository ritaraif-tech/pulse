import { z } from "zod"

export const unitsSchema = z.enum(["metric", "imperial"])
export type Units = z.infer<typeof unitsSchema>

const rating = z.number().int().min(1).max(5)
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

export const profileSchema = z.object({
  name: z.string(),
  birthDate: isoDate.nullable(),
  units: unitsSchema,
})
export type Profile = z.infer<typeof profileSchema>

export const habitSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  category: z.string(),
  archived: z.boolean(),
  createdAt: isoDate,
})
export type Habit = z.infer<typeof habitSchema>

export const dailyLogSchema = z.object({
  date: isoDate,
  mood: rating,
  energy: rating,
  sleepHours: z.number().min(0).max(24),
  sleepQuality: rating,
  completedHabitIds: z.array(z.string()),
  notes: z.string(),
})
export type DailyLog = z.infer<typeof dailyLogSchema>

export const measurementSchema = z.object({
  id: z.string(),
  date: isoDate,
  type: z.string(),
  value: z.number(),
  value2: z.number().optional(),
  notes: z.string(),
})
export type Measurement = z.infer<typeof measurementSchema>

export const bodyChangeSchema = z.object({
  id: z.string(),
  date: isoDate,
  area: z.string(),
  severity: rating,
  description: z.string(),
})
export type BodyChange = z.infer<typeof bodyChangeSchema>

export const pulseDataSchema = z.object({
  version: z.literal(1),
  profile: profileSchema,
  habits: z.array(habitSchema),
  logs: z.record(isoDate, dailyLogSchema),
  measurements: z.array(measurementSchema),
  bodyChanges: z.array(bodyChangeSchema),
})
export type PulseData = z.infer<typeof pulseDataSchema>

export const emptyData = (): PulseData => ({
  version: 1,
  profile: { name: "", birthDate: null, units: "metric" },
  habits: [],
  logs: {},
  measurements: [],
  bodyChanges: [],
})
