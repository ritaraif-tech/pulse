"use client"

import { useState } from "react"
import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { formatDate, fromISODate, toISODate } from "@/lib/dates"

export function DatePicker({
  value,
  onChange,
  max,
  id,
}: {
  value: string
  onChange: (iso: string) => void
  /** Latest selectable date (ISO) */
  max?: string
  id?: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<Button id={id} variant="outline" className="justify-start" />}
      >
        <CalendarIcon />
        {formatDate(value)}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={fromISODate(value)}
          defaultMonth={fromISODate(value)}
          disabled={max ? { after: fromISODate(max) } : undefined}
          onSelect={(date) => {
            if (!date) return
            onChange(toISODate(date))
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
