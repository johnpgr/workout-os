import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TYPE_LABELS, WEEKDAY_LABELS, WEEK_PATTERNS } from "@/features/training/constants"
import { formatDateBR, formatISOToBR, getCalendarTypeClasses, toISODateString } from "@/features/training/helpers"
import type { WeekMode, WeekSummary } from "@/features/training/types"
import type { Temporal } from "@/lib/temporal"
import type { SessionLog } from "@/lib/training-types"

interface WeeklyLogsCardProps {
  mode: WeekMode
  weekValue: string
  weekDates: Temporal.PlainDate[]
  selectedDate: string
  selectedLogs: SessionLog[]
  summary: WeekSummary
  logsByDate: Map<string, SessionLog[]>
  onWeekValueChange: (value: string) => void
  onModeChange: (value: WeekMode) => void
  onSelectedDateChange: (value: string) => void
  onDeleteLog: (id: number | undefined) => Promise<void>
}

export function WeeklyLogsCard({
  mode,
  weekValue,
  weekDates,
  selectedDate,
  selectedLogs,
  summary,
  logsByDate,
  onWeekValueChange,
  onModeChange,
  onSelectedDateChange,
  onDeleteLog,
}: WeeklyLogsCardProps) {
  return (
    <Card className="bg-card text-foreground ring-border">
      <CardHeader>
        <CardTitle className="text-2xl">Calendário Semanal + Logs</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Registre reps, peso, duração e observações. Tudo fica salvo localmente via IndexedDB.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="min-w-48 space-y-1.5">
            <label className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Semana</label>
            <Input
              type="week"
              value={weekValue}
              onChange={(event) => onWeekValueChange(event.target.value)}
              className="border-border bg-background text-foreground"
            />
          </div>
          <div className="min-w-56 space-y-1.5">
            <label className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Modelo da Semana</label>
            <Select value={mode} onValueChange={(value) => onModeChange(value as WeekMode)}>
              <SelectTrigger className="w-full border-border bg-background text-foreground">
                <SelectValue placeholder="Selecione o modelo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6">PPL 6x / semana</SelectItem>
                <SelectItem value="3">PPL 3x / semana</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 lg:grid-cols-7">
          {weekDates.map((day, index) => {
            const dayISO = toISODateString(day)
            const dayLogs = logsByDate.get(dayISO) ?? []
            const totalMinutes = dayLogs.reduce((minutes, log) => minutes + Number(log.durationMin || 0), 0)
            const planType = WEEK_PATTERNS[mode][index]

            return (
              <button
                key={dayISO}
                type="button"
                onClick={() => onSelectedDateChange(dayISO)}
                className={[
                  "rounded-xl border border-border bg-card p-3 text-left outline-none transition hover:-translate-y-0.5 hover:border-ring/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
                  getCalendarTypeClasses(planType),
                  selectedDate === dayISO ? "border-ring" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">{WEEKDAY_LABELS[index]}</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{formatDateBR(day)}</p>
                <p className="mt-1 text-xs text-muted-foreground">Planejado: {TYPE_LABELS[planType]}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {dayLogs.length ? `${dayLogs.length} log(s) · ${totalMinutes} min` : "Sem registros"}
                </p>
              </button>
            )
          })}
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <Card className="bg-card text-foreground ring-border">
            <CardContent className="space-y-1 py-4">
              <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Sessões</p>
              <p className="text-2xl font-bold">{summary.totalSessions}</p>
            </CardContent>
          </Card>
          <Card className="bg-card text-foreground ring-border">
            <CardContent className="space-y-1 py-4">
              <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Minutos Totais</p>
              <p className="text-2xl font-bold">{summary.totalMinutes}</p>
            </CardContent>
          </Card>
          <Card className="bg-card text-foreground ring-border">
            <CardContent className="space-y-1 py-4">
              <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Push / Pull / Legs</p>
              <p className="text-2xl font-bold">
                {summary.totalPush} / {summary.totalPull} / {summary.totalLegs}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card text-foreground ring-border">
          <CardContent className="py-4">
            {!selectedLogs.length ? (
              <p className="text-sm text-muted-foreground">
                Sem registros em {selectedDate ? formatISOToBR(selectedDate) : "-"}. Use os formulários abaixo para
                salvar treinos.
              </p>
            ) : (
              <div className="space-y-3">
                {selectedLogs.map((log) => (
                  <article key={log.id ?? log.createdAt} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <strong className="text-foreground">{log.workoutLabel || TYPE_LABELS[log.workoutType] || "Treino"}</strong>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{log.durationMin} min</span>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            void onDeleteLog(log.id)
                          }}
                        >
                          Excluir
                        </Button>
                      </div>
                    </div>
                    {log.notes ? <p className="mt-2 text-sm text-muted-foreground">{log.notes}</p> : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(log.exercises.length
                        ? log.exercises
                        : [{ name: "Sem exercícios detalhados", sets: 0, reps: 0, weight: 0 }]
                      ).map((exercise) => {
                        const parts = []
                        if (exercise.sets) parts.push(`${exercise.sets}s`)
                        if (exercise.reps) parts.push(`${exercise.reps}r`)
                        if (exercise.weight) parts.push(`${exercise.weight}kg`)

                        return (
                          <Badge
                            key={`${log.createdAt}-${exercise.name}-${parts.join("-")}`}
                            variant="outline"
                            className="border-border text-foreground"
                          >
                            {exercise.name}
                            {parts.length ? ` (${parts.join(" / ")})` : ""}
                          </Badge>
                        )
                      })}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  )
}
