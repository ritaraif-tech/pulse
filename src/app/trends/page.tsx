import type { Metadata } from "next"

import { TrendsView } from "@/components/views/trends-view"

export const metadata: Metadata = { title: "Trends · Pulse" }

export default function Page() {
  return <TrendsView />
}
