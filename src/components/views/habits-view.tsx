"use client"

import { useState } from "react"
import { ListChecks, MoreHorizontal, Plus, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/page-header"
import { StoreGate } from "@/components/store-gate"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { habitCompletionRate, habitStreak } from "@/lib/analytics"
import { today } from "@/lib/dates"
import { actions } from "@/lib/store"
import { habitCategories, suggestedHabits } from "@/lib/suggested-habits"
import type { Habit, PulseData } from "@/lib/types"

export function HabitsView() {
  return <StoreGate>{(data) => <Habits data={data} />}</StoreGate>
}

function Habits({ data }: { data: PulseData }) {
  const [showArchived, setShowArchived] = useState(false)
  const [editing, setEditing] = useState<Habit | "new" | null>(null)
  const date = today()
  const habits = data.habits.filter((h) => showArchived || !h.archived)

  function addSuggested() {
    const existing = new Set(data.habits.map((h) => h.name.toLowerCase()))
    const toAdd = suggestedHabits.filter((h) => !existing.has(h.name.toLowerCase()))
    actions.addHabits(toAdd)
    toast.success(`Added ${toAdd.length} suggested habits`)
  }

  return (
    <>
      <PageHeader
        title="Habits"
        description="The daily habits you want to build. Tick them off in your check-in."
      >
        {data.habits.length > 0 && (
          <Button onClick={() => setEditing("new")}>
            <Plus />
            Add habit
          </Button>
        )}
      </PageHeader>

      {data.habits.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ListChecks />
            </EmptyMedia>
            <EmptyTitle>No habits yet</EmptyTitle>
            <EmptyDescription>
              Start with a set of longevity habits backed by research, or add your own.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="flex-row justify-center">
            <Button onClick={addSuggested}>
              <Sparkles />
              Add suggested habits
            </Button>
            <Button variant="outline" onClick={() => setEditing("new")}>
              <Plus />
              Add your own
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <Card>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="show-archived"
                checked={showArchived}
                onCheckedChange={setShowArchived}
              />
              <Label htmlFor="show-archived">Show archived</Label>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Habit</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Streak</TableHead>
                  <TableHead>Longest</TableHead>
                  <TableHead className="w-48">Last 30 days</TableHead>
                  <TableHead className="w-12">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {habits.map((habit) => {
                  const s = habitStreak(data.logs, habit.id, date)
                  const rate = Math.round(habitCompletionRate(data.logs, habit, date, 30) * 100)
                  return (
                    <TableRow key={habit.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {habit.name}
                          {habit.archived && <Badge variant="outline">Archived</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{habit.category}</Badge>
                      </TableCell>
                      <TableCell>{s.current} days</TableCell>
                      <TableCell>{s.longest} days</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Progress value={rate} className="flex-1" aria-label="Completion" />
                          <span className="w-10 text-right tabular-nums">{rate}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${habit.name}`} />
                            }
                          >
                            <MoreHorizontal />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditing(habit)}>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                actions.archiveHabit(habit.id, !habit.archived)
                                toast.success(habit.archived ? "Habit restored" : "Habit archived")
                              }}
                            >
                              {habit.archived ? "Restore" : "Archive"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <HabitDialog
        key={editing === null ? "closed" : editing === "new" ? "new" : editing.id}
        habit={editing}
        onClose={() => setEditing(null)}
      />
    </>
  )
}

function HabitDialog({
  habit,
  onClose,
}: {
  habit: Habit | "new" | null
  onClose: () => void
}) {
  const existing = habit && habit !== "new" ? habit : null
  const [name, setName] = useState(existing?.name ?? "")
  const [category, setCategory] = useState(existing?.category ?? habitCategories[0])
  const [error, setError] = useState<string | null>(null)

  function save(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError("Give the habit a name")
      return
    }
    if (existing) {
      actions.updateHabit(existing.id, { name: trimmed, category })
      toast.success("Habit updated")
    } else {
      actions.addHabit({ name: trimmed, category })
      toast.success("Habit added")
    }
    onClose()
  }

  return (
    <Dialog open={habit !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <form onSubmit={save} className="flex flex-col gap-6">
          <DialogHeader>
            <DialogTitle>{existing ? "Edit habit" : "Add habit"}</DialogTitle>
            <DialogDescription>
              Keep it small and specific so it&apos;s easy to tick off each day.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field data-invalid={!!error}>
              <FieldLabel htmlFor="habit-name">Name</FieldLabel>
              <Input
                id="habit-name"
                value={name}
                aria-invalid={!!error}
                onChange={(e) => {
                  setName(e.target.value)
                  setError(null)
                }}
                placeholder="e.g. 10 minutes of stretching"
              />
              {error && <FieldError>{error}</FieldError>}
            </Field>
            <Field>
              <FieldLabel htmlFor="habit-category">Category</FieldLabel>
              <Select value={category} onValueChange={(v) => v && setCategory(v)}>
                <SelectTrigger id="habit-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {habitCategories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
          <DialogFooter showCloseButton>
            <Button type="submit">{existing ? "Save" : "Add habit"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
