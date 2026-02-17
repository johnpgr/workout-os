import { use, useEffect, useMemo, useRef, useState } from "react"
import { flushSync } from "react-dom"
import { useOutletContext } from "react-router"
import { useReactToPrint } from "react-to-print"
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

type BackupSnapshot = Awaited<ReturnType<typeof getBackupSnapshot>>

interface TrainingReportData {
  generatedAt: string
  totalSessions: number
  totalSets: number
  totalReadiness: number
  totalWeightEntries: number
  recentSessions: {
    date: string
    splitType: string
    workoutLabel: string
    durationMin: number
    setCount: number
  }[]
}

function createTrainingReportData(
  snapshot: BackupSnapshot,
): TrainingReportData {
  const totalSets = snapshot.sessions.reduce(
    (sum, session) => sum + session.sets.length,
    0,
  )

  return {
    generatedAt: new Date().toLocaleString(),
    totalSessions: snapshot.sessions.length,
    totalSets,
    totalReadiness: snapshot.readinessLogs.length,
    totalWeightEntries: snapshot.weightLogs.length,
    recentSessions: snapshot.sessions.slice(0, 12).map((entry) => ({
      date: entry.session.date,
      splitType: entry.session.splitType,
      workoutLabel: entry.session.workoutLabel,
      durationMin: entry.session.durationMin,
      setCount: entry.sets.length,
    })),
  }
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
  const [reportData, setReportData] = useState<TrainingReportData | null>(null)
  const printReportRef = useRef<HTMLDivElement>(null)

  const splitLabel = useMemo(() => getSplitConfig(splitType).label, [splitType])
  const printReport = useReactToPrint({
    contentRef: printReportRef,
    documentTitle: `training-report-${new Date().toISOString().slice(0, 10)}`,
  })

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

    flushSync(() => {
      setReportData(createTrainingReportData(snapshot))
    })
    printReport()
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

      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          left: "-10000px",
          top: 0,
          width: "210mm",
          background: "#fff",
        }}
      >
        <div
          ref={printReportRef}
          style={{
            padding: "24px",
            color: "#111",
            fontFamily: "Arial, sans-serif",
          }}
        >
          <h1 style={{ marginBottom: "6px" }}>Training App Report</h1>
          <p style={{ color: "#555", marginTop: 0 }}>
            Generated at {reportData?.generatedAt ?? "-"}
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "12px",
              margin: "18px 0",
            }}
          >
            <div
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "12px",
              }}
            >
              <strong>Total sessions</strong>
              <div>{reportData?.totalSessions ?? 0}</div>
            </div>
            <div
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "12px",
              }}
            >
              <strong>Total set logs</strong>
              <div>{reportData?.totalSets ?? 0}</div>
            </div>
            <div
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "12px",
              }}
            >
              <strong>Readiness check-ins</strong>
              <div>{reportData?.totalReadiness ?? 0}</div>
            </div>
            <div
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "12px",
              }}
            >
              <strong>Weight entries</strong>
              <div>{reportData?.totalWeightEntries ?? 0}</div>
            </div>
          </div>

          <h2>Recent Sessions</h2>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: "16px",
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    border: "1px solid #ddd",
                    padding: "8px",
                    textAlign: "left",
                    background: "#f8f8f8",
                  }}
                >
                  Date
                </th>
                <th
                  style={{
                    border: "1px solid #ddd",
                    padding: "8px",
                    textAlign: "left",
                    background: "#f8f8f8",
                  }}
                >
                  Split
                </th>
                <th
                  style={{
                    border: "1px solid #ddd",
                    padding: "8px",
                    textAlign: "left",
                    background: "#f8f8f8",
                  }}
                >
                  Workout
                </th>
                <th
                  style={{
                    border: "1px solid #ddd",
                    padding: "8px",
                    textAlign: "left",
                    background: "#f8f8f8",
                  }}
                >
                  Duration
                </th>
                <th
                  style={{
                    border: "1px solid #ddd",
                    padding: "8px",
                    textAlign: "left",
                    background: "#f8f8f8",
                  }}
                >
                  Sets
                </th>
              </tr>
            </thead>
            <tbody>
              {(reportData?.recentSessions ?? []).map((entry, index) => (
                <tr key={`${entry.date}-${entry.workoutLabel}-${index}`}>
                  <td
                    style={{
                      border: "1px solid #ddd",
                      padding: "8px",
                      textAlign: "left",
                    }}
                  >
                    {entry.date}
                  </td>
                  <td
                    style={{
                      border: "1px solid #ddd",
                      padding: "8px",
                      textAlign: "left",
                    }}
                  >
                    {entry.splitType}
                  </td>
                  <td
                    style={{
                      border: "1px solid #ddd",
                      padding: "8px",
                      textAlign: "left",
                    }}
                  >
                    {entry.workoutLabel}
                  </td>
                  <td
                    style={{
                      border: "1px solid #ddd",
                      padding: "8px",
                      textAlign: "left",
                    }}
                  >
                    {entry.durationMin} min
                  </td>
                  <td
                    style={{
                      border: "1px solid #ddd",
                      padding: "8px",
                      textAlign: "left",
                    }}
                  >
                    {entry.setCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
