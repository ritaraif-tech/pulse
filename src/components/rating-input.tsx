"use client"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

const ratings = [1, 2, 3, 4, 5]

export function RatingInput({
  value,
  onChange,
  labels,
  id,
}: {
  value: number | undefined
  onChange: (value: number) => void
  /** Accessible labels for 1 and 5 */
  labels: [string, string]
  id?: string
}) {
  return (
    <ToggleGroup
      id={id}
      variant="outline"
      value={value ? [String(value)] : []}
      onValueChange={(next) => {
        if (next[0]) onChange(Number(next[0]))
      }}
    >
      {ratings.map((r) => (
        <ToggleGroupItem
          key={r}
          value={String(r)}
          aria-label={r === 1 ? `1 (${labels[0]})` : r === 5 ? `5 (${labels[1]})` : String(r)}
        >
          {r}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
