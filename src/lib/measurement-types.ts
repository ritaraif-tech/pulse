import type { Units } from "./types"

export type MeasurementType = {
  id: string
  label: string
  unit: Record<Units, string>
  lowerIsBetter: boolean
  /** Second value, e.g. diastolic for blood pressure */
  secondLabel?: string
}

export const measurementTypes: MeasurementType[] = [
  { id: "weight", label: "Weight", unit: { metric: "kg", imperial: "lb" }, lowerIsBetter: true },
  { id: "waist", label: "Waist", unit: { metric: "cm", imperial: "in" }, lowerIsBetter: true },
  { id: "body-fat", label: "Body fat", unit: { metric: "%", imperial: "%" }, lowerIsBetter: true },
  {
    id: "blood-pressure",
    label: "Blood pressure",
    unit: { metric: "mmHg", imperial: "mmHg" },
    lowerIsBetter: true,
    secondLabel: "Diastolic",
  },
  { id: "resting-hr", label: "Resting heart rate", unit: { metric: "bpm", imperial: "bpm" }, lowerIsBetter: true },
  { id: "hrv", label: "HRV", unit: { metric: "ms", imperial: "ms" }, lowerIsBetter: false },
  {
    id: "fasting-glucose",
    label: "Fasting glucose",
    unit: { metric: "mmol/L", imperial: "mg/dL" },
    lowerIsBetter: true,
  },
  { id: "vo2max", label: "VO₂max", unit: { metric: "ml/kg/min", imperial: "ml/kg/min" }, lowerIsBetter: false },
  { id: "grip-strength", label: "Grip strength", unit: { metric: "kg", imperial: "lb" }, lowerIsBetter: false },
]

export const measurementTypeById = (id: string) =>
  measurementTypes.find((t) => t.id === id)
