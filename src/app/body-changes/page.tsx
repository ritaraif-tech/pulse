import type { Metadata } from "next"

import { BodyChangesView } from "@/components/views/body-changes-view"

export const metadata: Metadata = { title: "Body changes · Pulse" }

export default function Page() {
  return <BodyChangesView />
}
