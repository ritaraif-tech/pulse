import { addDays, differenceInYears, format, parseISO } from "date-fns"

/** Local calendar date as yyyy-MM-dd */
export const toISODate = (date: Date) => format(date, "yyyy-MM-dd")

export const today = () => toISODate(new Date())

export const fromISODate = (iso: string) => parseISO(iso)

export const shiftISODate = (iso: string, days: number) =>
  toISODate(addDays(parseISO(iso), days))

/** The `count` dates ending at `end` (inclusive), oldest first */
export const dateRange = (end: string, count: number) =>
  Array.from({ length: count }, (_, i) => shiftISODate(end, i - count + 1))

export const formatDate = (iso: string) => format(parseISO(iso), "d MMM yyyy")

export const formatShortDate = (iso: string) => format(parseISO(iso), "d MMM")

export const ageFrom = (birthDate: string | null, on = new Date()) =>
  birthDate ? differenceInYears(on, parseISO(birthDate)) : null
