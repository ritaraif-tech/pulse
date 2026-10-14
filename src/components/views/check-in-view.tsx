"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { DatePicker } from "@/components/date-picker"
import { PageHeader } from "@/components/page-header"
import { RatingInput } from "@/components/rating-input"
import { StoreGate } from "@/components/store-gate"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { today } from "@/lib/dates"
import { actions } from "@/lib/store"
import type { DailyLog, PulseData } from "@/lib/types"

const rating = (label: string) =>
  z.number({ error: `Rate your ${label}` }).int().min(1).max(5)

const formSchema = z.object({
  mood: rating("mood"),
  energy: rating("energy"),
  sleepHours: z
    .number({ error: "Enter how many hours you slept" })
    .min(0, "Can't be negative")
    .max(24, "There are only 24 hours in a day"),
  sleepQuality: rating("sleep quality"),
  completedHabitIds: z.array(z.string()),
  notes: z.string(),
})

type FormValues = z.infer<typeof formSchema>

const blank: Partial<FormValues> = {
  mood: undefined,
  energy: undefined,
  sleepHours: undefined,
  sleepQuality: undefined,
  completedHabitIds: [],
  notes: "",
}

const toFormValues = (log: DailyLog | undefined): Partial<FormValues> =>
  log
    ? {
        mood: log.mood,
        energy: log.energy,
        sleepHours: log.sleepHours,
        sleepQuality: log.sleepQuality,
        completedHabitIds: log.completedHabitIds,
        notes: log.notes,
      }
    : blank

export function CheckInView() {
  return <StoreGate>{(data) => <CheckInForm data={data} />}</StoreGate>
}

function CheckInForm({ data }: { data: PulseData }) {
  const [date, setDate] = useState(today)
  const existing = data.logs[date]
  const habits = data.habits.filter(
    (h) => !h.archived || existing?.completedHabitIds.includes(h.id)
  )

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: toFormValues(existing),
  })

  // Load the saved check-in (or a blank form) whenever the date changes
  useEffect(() => {
    form.reset(toFormValues(data.logs[date]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date])

  function onSubmit(values: FormValues) {
    actions.upsertLog({ date, ...values })
    form.reset(values)
    toast.success(existing ? "Check-in updated" : "Check-in saved")
  }

  return (
    <>
      <PageHeader
        title="Daily check-in"
        description="How are you doing? Takes under a minute."
      />
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex max-w-2xl flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Day</CardTitle>
            <CardDescription>
              {existing
                ? "You've already checked in for this day. Saving will update it."
                : "Pick a past day to fill in a check-in you missed."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <DatePicker value={date} onChange={setDate} max={today()} />
            {existing && <Badge variant="secondary">Checked in</Badge>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How you feel</CardTitle>
            <CardDescription>1 is low, 5 is great.</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <RatingField form={form} name="mood" label="Mood" labels={["low", "great"]} />
              <RatingField form={form} name="energy" label="Energy" labels={["drained", "energised"]} />
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sleep</CardTitle>
            <CardDescription>Last night&apos;s sleep.</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Controller
                control={form.control}
                name="sleepHours"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="sleepHours">Hours slept</FieldLabel>
                    <Input
                      id="sleepHours"
                      type="number"
                      inputMode="decimal"
                      step={0.25}
                      min={0}
                      max={24}
                      className="max-w-32"
                      aria-invalid={fieldState.invalid}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? undefined : e.target.valueAsNumber
                        )
                      }
                      onBlur={field.onBlur}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              <RatingField
                form={form}
                name="sleepQuality"
                label="Sleep quality"
                labels={["restless", "deep"]}
              />
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Habits</CardTitle>
            <CardDescription>Tick off what you did today.</CardDescription>
          </CardHeader>
          <CardContent>
            {habits.length === 0 ? (
              <FieldDescription>
                You haven&apos;t added any habits yet.{" "}
                <Link href="/habits">Add habits</Link> to track them here.
              </FieldDescription>
            ) : (
              <Controller
                control={form.control}
                name="completedHabitIds"
                render={({ field }) => (
                  <FieldSet>
                    <FieldLegend className="sr-only">Completed habits</FieldLegend>
                    <FieldGroup className="gap-3">
                      {habits.map((habit) => (
                        <Field key={habit.id} orientation="horizontal">
                          <Checkbox
                            id={`habit-${habit.id}`}
                            checked={field.value.includes(habit.id)}
                            onCheckedChange={(checked) =>
                              field.onChange(
                                checked
                                  ? [...field.value, habit.id]
                                  : field.value.filter((id) => id !== habit.id)
                              )
                            }
                          />
                          <FieldLabel htmlFor={`habit-${habit.id}`}>
                            {habit.name}
                          </FieldLabel>
                        </Field>
                      ))}
                    </FieldGroup>
                  </FieldSet>
                )}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
            <CardDescription>Anything worth remembering about today.</CardDescription>
          </CardHeader>
          <CardContent>
            <Field>
              <FieldLabel htmlFor="notes" className="sr-only">
                Notes
              </FieldLabel>
              <Textarea id="notes" {...form.register("notes")} />
            </Field>
          </CardContent>
          <CardFooter>
            <Button type="submit">{existing ? "Update check-in" : "Save check-in"}</Button>
          </CardFooter>
        </Card>
      </form>
    </>
  )
}

function RatingField({
  form,
  name,
  label,
  labels,
}: {
  form: ReturnType<typeof useForm<FormValues>>
  name: "mood" | "energy" | "sleepQuality"
  label: string
  labels: [string, string]
}) {
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          <RatingInput id={name} value={field.value} onChange={field.onChange} labels={labels} />
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )
}
