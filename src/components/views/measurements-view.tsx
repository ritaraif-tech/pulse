"use client"

import { useState } from "react"
import { Plus, Ruler, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { DatePicker } from "@/components/date-picker"
import { MetricLineChart } from "@/components/metric-line-chart"
import type { ChartConfig } from "@/components/ui/chart"
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
import { Button } from "@/components/ui/button"
import {
  Card,
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
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { measurementsOfType } from "@/lib/analytics"
import { formatDate, formatShortDate, today } from "@/lib/dates"
import {
  measurementTypeById,
  measurementTypes,
  type MeasurementType,
} from "@/lib/measurement-types"
import { actions } from "@/lib/store"
import type { PulseData, Units } from "@/lib/types"

const typeItems = measurementTypes.map((t) => ({ value: t.id, label: t.label }))

const formatValue = (value: number, value2?: number) =>
  value2 !== undefined ? `${value}/${value2}` : String(value)

export function MeasurementsView() {
  return <StoreGate>{(data) => <Measurements data={data} />}</StoreGate>
}

function Measurements({ data }: { data: PulseData }) {
  const units = data.profile.units
  const loggedTypes = measurementTypes.filter((t) =>
    data.measurements.some((m) => m.type === t.id)
  )
  const [selected, setSelected] = useState<string | null>(null)
  const current =
    loggedTypes.find((t) => t.id === selected) ?? loggedTypes[0] ?? null

  return (
    <>
      <PageHeader
        title="Measurements"
        description="Body and health markers that matter for longevity."
      >
        {loggedTypes.length > 0 && (
          <AddMeasurementDialog units={units} defaultType={current?.id} onAdded={setSelected} />
        )}
      </PageHeader>

      {!current ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Ruler />
            </EmptyMedia>
            <EmptyTitle>No measurements yet</EmptyTitle>
            <EmptyDescription>
              Log weight, blood pressure, resting heart rate, HRV, VO₂max and more to see how they change over time.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <AddMeasurementDialog units={units} onAdded={setSelected} />
          </EmptyContent>
        </Empty>
      ) : (
        <MeasurementHistory
          data={data}
          type={current}
          loggedTypes={loggedTypes}
          onTypeChange={setSelected}
        />
      )}
    </>
  )
}

function MeasurementHistory({
  data,
  type,
  loggedTypes,
  onTypeChange,
}: {
  data: PulseData
  type: MeasurementType
  loggedTypes: MeasurementType[]
  onTypeChange: (id: string) => void
}) {
  const unit = type.unit[data.profile.units]
  const series = measurementsOfType(data.measurements, type.id)
  const chartData = series.map((m) => ({
    label: formatShortDate(m.date),
    value: m.value,
    value2: m.value2 ?? null,
  }))
  const config: ChartConfig = type.secondLabel
    ? {
        value: { label: "Systolic", color: "var(--chart-1)" },
        value2: { label: type.secondLabel, color: "var(--chart-2)" },
      }
    : { value: { label: type.label, color: "var(--chart-1)" } }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{type.label}</CardTitle>
        <CardDescription>
          {series.length} {series.length === 1 ? "reading" : "readings"} in {unit}.{" "}
          {type.lowerIsBetter ? "Lower is better." : "Higher is better."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <Select
          items={loggedTypes.map((t) => ({ value: t.id, label: t.label }))}
          value={type.id}
          onValueChange={(v) => v && onTypeChange(v)}
        >
          <SelectTrigger className="w-56" aria-label="Measurement">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {loggedTypes.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {series.length > 1 && <MetricLineChart data={chartData} config={config} />}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Value ({unit})</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="w-12">
                <span className="sr-only">Delete</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...series].reverse().map((m) => (
              <TableRow key={m.id}>
                <TableCell>{formatDate(m.date)}</TableCell>
                <TableCell className="tabular-nums">
                  {formatValue(m.value, m.value2)}
                </TableCell>
                <TableCell className="whitespace-normal">{m.notes}</TableCell>
                <TableCell>
                  <AlertDialog>
                    <AlertDialogTrigger
                      render={<Button variant="ghost" size="icon-sm" aria-label="Delete reading" />}
                    >
                      <Trash2 />
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this reading?</AlertDialogTitle>
                        <AlertDialogDescription>
                          {type.label} {formatValue(m.value, m.value2)} {unit} on {formatDate(m.date)}. This can&apos;t be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          variant="destructive"
                          onClick={() => {
                            actions.deleteMeasurement(m.id)
                            toast.success("Reading deleted")
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
  )
}

function AddMeasurementDialog({
  units,
  defaultType,
  onAdded,
}: {
  units: Units
  defaultType?: string
  onAdded: (type: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState(defaultType ?? measurementTypes[0].id)
  const [date, setDate] = useState(today)
  const [value, setValue] = useState("")
  const [value2, setValue2] = useState("")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState<string | null>(null)
  const def = measurementTypeById(type)!

  function reset() {
    setType(defaultType ?? measurementTypes[0].id)
    setDate(today())
    setValue("")
    setValue2("")
    setNotes("")
    setError(null)
  }

  function save(e: React.FormEvent) {
    e.preventDefault()
    const v = Number(value)
    const v2 = Number(value2)
    if (value === "" || Number.isNaN(v)) return setError("Enter a value")
    if (def.secondLabel && (value2 === "" || Number.isNaN(v2)))
      return setError(`Enter the ${def.secondLabel.toLowerCase()} value`)
    actions.addMeasurement({
      type,
      date,
      value: v,
      value2: def.secondLabel ? v2 : undefined,
      notes: notes.trim(),
    })
    toast.success(`${def.label} logged`)
    onAdded(type)
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
        Add measurement
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={save} className="flex flex-col gap-6">
          <DialogHeader>
            <DialogTitle>Add measurement</DialogTitle>
            <DialogDescription>Values are in {units} units. You can change this in Settings.</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="m-type">Measurement</FieldLabel>
              <Select items={typeItems} value={type} onValueChange={(v) => v && setType(v)}>
                <SelectTrigger id="m-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {measurementTypes.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="m-date">Date</FieldLabel>
              <DatePicker id="m-date" value={date} onChange={setDate} max={today()} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field data-invalid={!!error && !value}>
                <FieldLabel htmlFor="m-value">
                  {def.secondLabel ? "Systolic" : "Value"} ({def.unit[units]})
                </FieldLabel>
                <Input
                  id="m-value"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  value={value}
                  onChange={(e) => {
                    setValue(e.target.value)
                    setError(null)
                  }}
                />
              </Field>
              {def.secondLabel && (
                <Field>
                  <FieldLabel htmlFor="m-value2">
                    {def.secondLabel} ({def.unit[units]})
                  </FieldLabel>
                  <Input
                    id="m-value2"
                    type="number"
                    inputMode="decimal"
                    step="any"
                    value={value2}
                    onChange={(e) => {
                      setValue2(e.target.value)
                      setError(null)
                    }}
                  />
                </Field>
              )}
            </div>
            {error && <FieldError>{error}</FieldError>}
            <Field>
              <FieldLabel htmlFor="m-notes">Notes</FieldLabel>
              <Textarea id="m-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
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
