"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { usePulseData } from "@/lib/store"
import type { PulseData } from "@/lib/types"

/**
 * Data lives in localStorage, so the static HTML renders a skeleton and the
 * real view mounts after hydration. This avoids hydration mismatches.
 */
export function StoreGate({
  children,
}: {
  children: (data: PulseData) => React.ReactNode
}) {
  const data = usePulseData()
  if (data === null) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }
  return children(data)
}
