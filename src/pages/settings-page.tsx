import { use, useEffect, useRef, useState } from "react"
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

  const splitLabel = getSplitConfig(splitType).label
  const printReport = useReactToPrint({
    contentRef: printReportRef,
    documentTitle: `relatorio-treino-${new Date().toISOString().slice(0, 10)}`,
  })

  useEffect(() => {
    void checkStoragePersistence()
  }, [])

  async function handleSignInWithMagicLink() {
    if (!email.trim()) {
      setAuthStatus("Informe um e-mail para receber o link mágico.")
      return
    }

    try {
      await signInWithMagicLink(email.trim())
      setAuthStatus("Link mágico enviado. Verifique sua caixa de entrada.")
    } catch (error) {
      setAuthStatus(
        error instanceof Error ? error.message : "Não foi possível enviar o link mágico.",
      )
    }
  }

  async function handleSignOut() {
    try {
      await signOut()
      setAuthStatus("Sessão encerrada.")
    } catch (error) {
      setAuthStatus(
        error instanceof Error ? error.message : "Não foi possível sair.",
      )
    }
  }

  async function handleExportJson() {
    const snapshot = await getBackupSnapshot()
    downloadTextFile(
      `backup-treinos-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(snapshot, null, 2),
      "application/json",
    )
  }

  async function handleExportCsv() {
    const sessions = await getAllSessionsWithSets()

    const rows = [
      [
        "data",
        "tipoDivisao",
        "tipoTreino",
        "nomeTreino",
        "duracaoMin",
        "nomeExercicio",
        "ordemSerie",
        "pesoKg",
        "repeticoes",
        "rpe",
        "rir",
        "tecnica",
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
      `series-treino-${new Date().toISOString().slice(0, 10)}.csv`,
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
          <CardTitle className="text-lg">Conta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando sessão...</p>
          ) : isAuthenticated ? (
            <>
              <p className="text-sm text-muted-foreground">
                Conectado como{" "}
                <span className="font-medium text-foreground">
                  {user?.email ?? "usuário"}
                </span>
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleSignOut()}
              >
                Sair
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Você está no modo convidado local.
              </p>
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="voce@exemplo.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
                <Button
                  type="button"
                  onClick={() => void handleSignInWithMagicLink()}
                >
                  Enviar link mágico
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
          <CardTitle className="text-lg">Sincronização</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Salvo no dispositivo:{" "}
            {pendingChanges > 0 ? "Sim (sincronização em nuvem pendente)" : "Sim"}
          </p>
          <p className="text-sm text-muted-foreground">
            Sincronização em nuvem:{" "}
            {isAuthenticated ? "Ativada" : "Desativada (não autenticado)"}
          </p>
          <p className="text-sm text-muted-foreground">
            Última sincronização:{" "}
            {lastSyncAt ? new Date(lastSyncAt).toLocaleString() : "Nunca"}
          </p>
          {syncError ? (
            <p className="text-sm text-destructive">Último erro: {syncError}</p>
          ) : null}

          <Button
            type="button"
            variant="outline"
            disabled={!isAuthenticated || isSyncing}
            onClick={() => void syncNow()}
          >
            {isSyncing ? "Sincronizando..." : "Sincronizar agora"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Divisão ativa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Atual: {splitLabel}</p>

          <Select
            value={splitType}
            onValueChange={(value) => void setSplitType(value as SplitType)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione a divisão" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ppl">Empurrar / Puxar / Pernas</SelectItem>
              <SelectItem value="upper-lower">Superior / Inferior</SelectItem>
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
            <CardTitle className="text-lg">Aviso de armazenamento no iOS</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No Safari do iOS, os dados offline funcionam em modo de melhor
              esforço sem armazenamento persistente. Instale este app na tela
              inicial para retenção offline mais confiável.
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
          <h1 style={{ marginBottom: "6px" }}>Relatório do Aplicativo de Treino</h1>
          <p style={{ color: "#555", marginTop: 0 }}>
            Gerado em {reportData?.generatedAt ?? "-"}
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
              <strong>Total de sessões</strong>
              <div>{reportData?.totalSessions ?? 0}</div>
            </div>
            <div
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "12px",
              }}
            >
              <strong>Total de séries registradas</strong>
              <div>{reportData?.totalSets ?? 0}</div>
            </div>
            <div
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "12px",
              }}
            >
              <strong>Registros de prontidão</strong>
              <div>{reportData?.totalReadiness ?? 0}</div>
            </div>
            <div
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "12px",
              }}
            >
              <strong>Registros de peso</strong>
              <div>{reportData?.totalWeightEntries ?? 0}</div>
            </div>
          </div>

          <h2>Sessões recentes</h2>
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
                  Data
                </th>
                <th
                  style={{
                    border: "1px solid #ddd",
                    padding: "8px",
                    textAlign: "left",
                    background: "#f8f8f8",
                  }}
                >
                  Divisão
                </th>
                <th
                  style={{
                    border: "1px solid #ddd",
                    padding: "8px",
                    textAlign: "left",
                    background: "#f8f8f8",
                  }}
                >
                  Treino
                </th>
                <th
                  style={{
                    border: "1px solid #ddd",
                    padding: "8px",
                    textAlign: "left",
                    background: "#f8f8f8",
                  }}
                >
                  Duração
                </th>
                <th
                  style={{
                    border: "1px solid #ddd",
                    padding: "8px",
                    textAlign: "left",
                    background: "#f8f8f8",
                  }}
                >
                  Séries
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
