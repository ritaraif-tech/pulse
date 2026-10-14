import type { Metadata } from "next"

import { HabitsView } from "@/components/views/habits-view"

export const metadata: Metadata = { title: "Habits · Pulse" }

export default function Page() {
  return <HabitsView />
}
