import type { Metadata } from "next"

import { CheckInView } from "@/components/views/check-in-view"

export const metadata: Metadata = { title: "Check-in · Pulse" }

export default function Page() {
  return <CheckInView />
}
