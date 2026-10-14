import type { Metadata } from "next"

import { MeasurementsView } from "@/components/views/measurements-view"

export const metadata: Metadata = { title: "Measurements · Pulse" }

export default function Page() {
  return <MeasurementsView />
}
