"use client"

import { useState } from "react"
import { Minus, PersonStanding, Plus, Trash2, TrendingDown, TrendingUp } from "lucide-react"
import { toast } from "sonner"

import { DatePicker } from "@/components/date-picker"
import { PageHeader } from "@/components/page-header"
import { StoreGate } from "@/components/store-gate"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { bodyAreaLabel, bodyAreas } from "@/lib/body-areas"
import { formatDate, today } from "@/lib/dates"
import { actions } from "@/lib/store"
import type { BodyChange, PulseData } from "@/lib/types"

const severityLabels = ["", "Barely noticeable", "Mild", "Moderate", "Significant", "Severe"]
const areaItems = bodyAreas.map((a) => ({ value: a.id, label: a.label }))

export function BodyChangesView() {
  return <StoreGate>{(data) => <BodyChanges data={data} />}</StoreGate>
}

function BodyChanges({ data }: { data: PulseData }) {
  const entries = [...data.bodyChanges].sort(
    (a, b) => b.date.localeCompare(a.date)
  )
  const byArea = new Map<string, BodyChange[]>()
  for (const entry of [...entries].reverse()) {
    byArea.set(entry.area, [...(byArea.get(entry.area) ?? []), entry])
  }

  return (
    <>
      <PageHeader
        title="Body changes"
        description="Note age-related changes as you notice them, so you can spot what's shifting."
      >
        {entries.length > 0 && <AddBodyChangeDialog />}
      </PageHeader>

      {entries.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <PersonStanding />
            </EmptyMedia>
            <EmptyTitle>No body changes logged</EmptyTitle>
            <EmptyDescription>
              Stiff joints, changes in skin, vision, sleep or recovery: log them with a severity to track how they develop.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <AddBodyChangeDialog />
          </EmptyContent>
        </Empty>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...byArea].map(([area, list]) => {
              const first = list[0]
              const latest = list.at(-1)!
              const diff = latest.severity - first.severity
              return (
                <Card key={area} size="sm">
                  <CardHeader>
                    <CardDescription>{bodyAreaLabel(area)}</CardDescription>
                    <CardTitle>
                      {latest.severity}/5 · {severityLabels[latest.severity]}
                    </CardTitle>
                    <CardAction>
                      {list.length < 2 ? (
                        <Badge variant="outline">1 entry</Badge>
                      ) : diff > 0 ? (
                        <Badge variant="destructive">
                          <TrendingUp />
                          Worse
                        </Badge>
                      ) : diff < 0 ? (
                        <Badge variant="secondary">
                          <TrendingDown />
                          Better
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <Minus />
                          Stable
                        </Badge>
                      )}
                    </CardAction>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      Last noted {formatDate(latest.date)}
                    </CardDescription>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Log</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Area</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-12">
                      <span className="sr-only">Delete</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{formatDate(entry.date)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{bodyAreaLabel(entry.area)}</Badge>
                      </TableCell>
                      <TableCell>{entry.severity}/5</TableCell>
                      <TableCell className="whitespace-normal">{entry.description}</TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger
                            render={<Button variant="ghost" size="icon-sm" aria-label="Delete entry" />}
                          >
                            <Trash2 />
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
                              <AlertDialogDescription>
                                {bodyAreaLabel(entry.area)} on {formatDate(entry.date)}. This can&apos;t be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                variant="destructive"
                                onClick={() => {
                                  actions.deleteBodyChange(entry.id)
                                  toast.success("Entry deleted")
                                }}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </>
  )
}

function AddBodyChangeDialog() {
  const [open, setOpen] = useState(false)
  const [area, setArea] = useState(bodyAreas[0].id)
  const [date, setDate] = useState(today)
  const [severity, setSeverity] = useState(2)
  const [description, setDescription] = useState("")
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setArea(bodyAreas[0].id)
    setDate(today())
    setSeverity(2)
    setDescription("")
    setError(null)
  }

  function save(e: React.FormEvent) {
    e.preventDefault()
    if (!description.trim()) return setError("Describe what you noticed")
    actions.addBodyChange({ area, date, severity, description: description.trim() })
    toast.success("Body change logged")
    setOpen(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) reset()
        setOpen(next)
      }}
    >
      <DialogTrigger render={<Button />}>
        <Plus />
        Log a change
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={save} className="flex flex-col gap-6">
          <DialogHeader>
            <DialogTitle>Log a body change</DialogTitle>
            <DialogDescription>
              Log the same area again later to see whether it&apos;s improving or getting worse.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="bc-area">Area</FieldLabel>
              <Select items={areaItems} value={area} onValueChange={(v) => v && setArea(v)}>
                <SelectTrigger id="bc-area">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {bodyAreas.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="bc-date">Date</FieldLabel>
              <DatePicker id="bc-date" value={date} onChange={setDate} max={today()} />
            </Field>
            <Field>
              <FieldLabel htmlFor="bc-severity">Severity</FieldLabel>
              <Slider
                id="bc-severity"
                min={1}
                max={5}
                step={1}
                value={severity}
                onValueChange={(v) => setSeverity(Array.isArray(v) ? v[0] : v)}
              />
              <FieldDescription>
                {severity}/5 · {severityLabels[severity]}
              </FieldDescription>
            </Field>
            <Field data-invalid={!!error}>
              <FieldLabel htmlFor="bc-description">What did you notice?</FieldLabel>
              <Textarea
                id="bc-description"
                value={description}
                aria-invalid={!!error}
                onChange={(e) => {
                  setDescription(e.target.value)
                  setError(null)
                }}
                placeholder="e.g. Knees stiff when getting up in the morning"
              />
              {error && <FieldError>{error}</FieldError>}
            </Field>
          </FieldGroup>
          <DialogFooter showCloseButton>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
