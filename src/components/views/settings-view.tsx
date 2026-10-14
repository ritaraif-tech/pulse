"use client"

import { useRef, useState } from "react"
import { Download, Upload } from "lucide-react"
import { useTheme } from "next-themes"
import { toast } from "sonner"

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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ageFrom, today } from "@/lib/dates"
import { actions } from "@/lib/store"
import type { Profile, PulseData, Units } from "@/lib/types"

export function SettingsView() {
  return <StoreGate>{(data) => <Settings data={data} />}</StoreGate>
}

function Settings({ data }: { data: PulseData }) {
  return (
    <>
      <PageHeader title="Settings" description="Your profile, display and data." />
      <div className="flex max-w-2xl flex-col gap-6">
        <ProfileCard key={JSON.stringify(data.profile)} profile={data.profile} />
        <AppearanceCard />
        <DataCard />
      </div>
    </>
  )
}

function ProfileCard({ profile }: { profile: Profile }) {
  const [name, setName] = useState(profile.name)
  const [birthDate, setBirthDate] = useState(profile.birthDate ?? "")
  const [units, setUnits] = useState<Units>(profile.units)
  const age = ageFrom(birthDate || null)

  function save(e: React.FormEvent) {
    e.preventDefault()
    actions.updateProfile({ name: name.trim(), birthDate: birthDate || null, units })
    toast.success("Profile saved")
  }

  return (
    <Card>
      <form onSubmit={save} className="flex flex-col gap-6">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Stored only in this browser.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="birthDate">Birth date</FieldLabel>
              <Input
                id="birthDate"
                type="date"
                max={today()}
                className="w-fit"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
              {age !== null && <FieldDescription>You&apos;re {age}.</FieldDescription>}
            </Field>
            <Field>
              <FieldLabel htmlFor="units">Units</FieldLabel>
              <ToggleGroup
                id="units"
                variant="outline"
                value={[units]}
                onValueChange={(v) => v[0] && setUnits(v[0] as Units)}
              >
                <ToggleGroupItem value="metric">Metric</ToggleGroupItem>
                <ToggleGroupItem value="imperial">Imperial</ToggleGroupItem>
              </ToggleGroup>
              <FieldDescription>
                Used for new measurements. Existing readings aren&apos;t converted.
              </FieldDescription>
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter>
          <Button type="submit">Save profile</Button>
        </CardFooter>
      </form>
    </Card>
  )
}

function AppearanceCard() {
  const { theme, setTheme } = useTheme()
  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
      </CardHeader>
      <CardContent>
        <Field>
          <FieldLabel htmlFor="theme">Theme</FieldLabel>
          <ToggleGroup
            id="theme"
            variant="outline"
            value={theme ? [theme] : []}
            onValueChange={(v) => v[0] && setTheme(v[0])}
          >
            <ToggleGroupItem value="light">Light</ToggleGroupItem>
            <ToggleGroupItem value="dark">Dark</ToggleGroupItem>
            <ToggleGroupItem value="system">System</ToggleGroupItem>
          </ToggleGroup>
        </Field>
      </CardContent>
    </Card>
  )
}

function DataCard() {
  const fileInput = useRef<HTMLInputElement>(null)
  const [confirmClear, setConfirmClear] = useState(false)

  function exportData() {
    const blob = new Blob([actions.exportData()], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `pulse-export-${today()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function importData(file: File) {
    const error = actions.importData(await file.text())
    if (error) toast.error(error)
    else toast.success("Data imported")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your data</CardTitle>
        <CardDescription>
          Everything is saved in this browser only. Export a backup regularly, or to move to another device.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={exportData}>
          <Download />
          Export JSON
        </Button>
        <Button variant="outline" onClick={() => fileInput.current?.click()}>
          <Upload />
          Import JSON
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) importData(file)
            e.target.value = ""
          }}
        />
      </CardContent>
      <CardFooter>
        <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
          <AlertDialogTrigger render={<Button variant="destructive" />}>
            Clear all data
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear all data?</AlertDialogTitle>
              <AlertDialogDescription>
                This deletes your profile, habits, check-ins, measurements and body changes from this browser. Export a backup first if you might want them back.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={() => {
                  actions.resetData()
                  setConfirmClear(false)
                  toast.success("All data cleared")
                }}
              >
                Clear everything
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  )
}
