import { use, useEffect, useMemo, useState } from "react"
import { useOutletContext } from "react-router"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { checkStoragePersistence, useSyncStatus } from "@/lib/sync"
import { getSplitConfig } from "@/features/training/splits/split-registry"
import { getAllSessionsWithSets, getBackupSnapshot } from "@/lib/training-db"
import type { SplitType } from "@/lib/training-types"
import type { AppLayoutContextValue } from "@/layouts/app-layout"
import { AuthContext } from "@/lib/auth-context-store"

function downloadTextFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export function SettingsPage() {
  const { splitType, setSplitType } = useOutletContext<AppLayoutContextValue>()
  const { user, isAuthenticated, isLoading, signInWithMagicLink, signOut } =
    use(AuthContext)
  const {
    lastSyncAt,
    syncError,
    pendingChanges,
    isSyncing,
    storageChecked,
    storagePersisted,
    isIOS,
    syncNow,
  } = useSyncStatus()

  const [email, setEmail] = useState("")
  const [authStatus, setAuthStatus] = useState<string | null>(null)

  const splitLabel = useMemo(() => getSplitConfig(splitType).label, [splitType])

  useEffect(() => {
    void checkStoragePersistence()
  }, [])

  async function handleSignInWithMagicLink() {
    if (!email.trim()) {
      setAuthStatus("Enter an email to receive the magic link.")
      return
    }

    try {
      await signInWithMagicLink(email.trim())
      setAuthStatus("Magic link sent. Check your inbox.")
    } catch (error) {
      setAuthStatus(
        error instanceof Error ? error.message : "Failed to send magic link.",
      )
    }
  }

  async function handleSignOut() {
    try {
      await signOut()
      setAuthStatus("Signed out.")
    } catch (error) {
      setAuthStatus(
        error instanceof Error ? error.message : "Failed to sign out.",
      )
    }
  }

  async function handleExportJson() {
    const snapshot = await getBackupSnapshot()
    downloadTextFile(
      `training-backup-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(snapshot, null, 2),
      "application/json",
    )
  }

  async function handleExportCsv() {
    const sessions = await getAllSessionsWithSets()

    const rows = [
      [
        "date",
        "splitType",
        "workoutType",
        "workoutLabel",
        "durationMin",
        "exerciseName",
        "setOrder",
        "weightKg",
        "reps",
        "rpe",
        "rir",
        "technique",
      ],
    ]

    for (const sessionEntry of sessions) {
      for (const set of sessionEntry.sets) {
        rows.push([
          sessionEntry.session.date,
          sessionEntry.session.splitType,
          sessionEntry.session.workoutType,
          sessionEntry.session.workoutLabel,
          String(sessionEntry.session.durationMin),
          set.exerciseName,
          String(set.setOrder + 1),
          String(set.weightKg),
          String(set.reps),
          set.rpe === null ? "" : String(set.rpe),
          set.rir === null ? "" : String(set.rir),
          set.technique ?? "",
        ])
      }
    }

    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(","),
      )
      .join("\n")

    downloadTextFile(
      `training-sets-${new Date().toISOString().slice(0, 10)}.csv`,
      csv,
      "text/csv;charset=utf-8",
    )
  }

  async function handleExportPdf() {
    const snapshot = await getBackupSnapshot()

    const totalSessions = snapshot.sessions.length
    const totalSets = snapshot.sessions.reduce(
      (sum, session) => sum + session.sets.length,
      0,
    )
    const totalReadiness = snapshot.readinessLogs.length
    const totalWeightEntries = snapshot.weightLogs.length

    const popup = window.open("", "_blank", "width=1000,height=800")
    if (!popup) {
      return
    }

    popup.document.write(`
      <html>
        <head>
          <title>Training Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
            h1 { margin-bottom: 6px; }
            .muted { color: #555; margin-top: 0; }
            .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin: 18px 0; }
            .card { border: 1px solid #ddd; border-radius: 8px; padding: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f8f8f8; }
          </style>
        </head>
        <body>
          <h1>Training App Report</h1>
          <p class="muted">Generated at ${new Date().toLocaleString()}</p>

          <div class="grid">
            <div class="card"><strong>Total sessions</strong><div>${totalSessions}</div></div>
            <div class="card"><strong>Total set logs</strong><div>${totalSets}</div></div>
            <div class="card"><strong>Readiness check-ins</strong><div>${totalReadiness}</div></div>
            <div class="card"><strong>Weight entries</strong><div>${totalWeightEntries}</div></div>
          </div>

          <h2>Recent Sessions</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Split</th>
                <th>Workout</th>
                <th>Duration</th>
                <th>Sets</th>
              </tr>
            </thead>
            <tbody>
              ${snapshot.sessions
                .slice(0, 12)
                .map(
                  (entry) => `
                    <tr>
                      <td>${entry.session.date}</td>
                      <td>${entry.session.splitType}</td>
                      <td>${entry.session.workoutLabel}</td>
                      <td>${entry.session.durationMin} min</td>
                      <td>${entry.sets.length}</td>
                    </tr>
                  `,
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `)

    popup.document.close()
    popup.focus()
    popup.print()
  }

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading session...</p>
          ) : isAuthenticated ? (
            <>
              <p className="text-sm text-muted-foreground">
                Signed in as{" "}
                <span className="font-medium text-foreground">
                  {user?.email ?? "user"}
                </span>
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleSignOut()}
              >
                Sign out
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                You are in local guest mode.
              </p>
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
                <Button
                  type="button"
                  onClick={() => void handleSignInWithMagicLink()}
                >
                  Send magic link
                </Button>
              </div>
            </>
          )}

          {authStatus ? (
            <p className="text-sm text-muted-foreground">{authStatus}</p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sync</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Saved on device:{" "}
            {pendingChanges > 0 ? "Yes (pending cloud sync)" : "Yes"}
          </p>
          <p className="text-sm text-muted-foreground">
            Synced to cloud:{" "}
            {isAuthenticated ? "Enabled" : "Disabled (not signed in)"}
          </p>
          <p className="text-sm text-muted-foreground">
            Last sync:{" "}
            {lastSyncAt ? new Date(lastSyncAt).toLocaleString() : "Never"}
          </p>
          {syncError ? (
            <p className="text-sm text-destructive">Last error: {syncError}</p>
          ) : null}

          <Button
            type="button"
            variant="outline"
            disabled={!isAuthenticated || isSyncing}
            onClick={() => void syncNow()}
          >
            {isSyncing ? "Syncing..." : "Sync now"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Split ativo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Atual: {splitLabel}</p>

          <Select
            value={splitType}
            onValueChange={(value) => void setSplitType(value as SplitType)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione o split" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ppl">Push / Pull / Legs</SelectItem>
              <SelectItem value="upper-lower">Upper / Lower</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Exportação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button type="button" onClick={() => void handleExportJson()}>
            Exportar JSON
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleExportCsv()}
          >
            Exportar CSV
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleExportPdf()}
          >
            Exportar PDF
          </Button>
        </CardContent>
      </Card>

      {storageChecked && isIOS && storagePersisted === false ? (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">iOS storage notice</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Offline data is best-effort on iOS Safari without persistent
              storage. Install this app on your home screen for more reliable
              offline retention.
            </p>
          </CardContent>
        </Card>
      ) : null}
    </section>
  )
}
