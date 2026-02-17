import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DatePicker } from "@/components/ui/date-picker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  TECHNIQUE_LABELS,
  TYPE_LABELS,
  WEEK_MODE_LABELS,
} from "@/features/training/constants"
import {
  formatDateBR,
  formatISOToBR,
  getCalendarTypeClasses,
  getISOWeekInputValue,
  toISODateString,
} from "@/features/training/helpers"
import type { PlannedType, WeekMode, WeekSummary } from "@/features/training/types"
import type { Temporal } from "@/lib/temporal"
import type { SessionWithSets } from "@/lib/training-types"

interface WeeklyLogsCardProps {
  mode: WeekMode
  availableModes: WeekMode[]
  dayPlanOptions: PlannedType[]
  originalWeekPattern: PlannedType[]
  effectiveWeekPattern: PlannedType[]
  weekDates: Temporal.PlainDate[]
  selectedDate: string
  selectedLogs: SessionWithSets[]
  summary: WeekSummary
  logsByDate: Map<string, SessionWithSets[]>
  isLogsLoading: boolean
  logsErrorMessage: string | null
  isDeletingLog: boolean
  isSavingRoutine: boolean
  onWeekValueChange: (value: string) => void
  onModeChange: (value: WeekMode) => void
  onSelectedDateChange: (value: string) => void
  onDayPlanChange: (dayIndex: number, plannedType: PlannedType) => Promise<void>
  onDeleteLog: (id: string) => Promise<void>
}

const WEEKDAY_LABELS_WORKOUT = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
  "Domingo",
]

function formatWeekRangeLabel(weekDates: Temporal.PlainDate[]): string | undefined {
  const weekStart = weekDates[0]
  const weekEnd = weekDates[6]

  if (!weekStart || !weekEnd) {
    return undefined
  }

  const formatOptions: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }

  return `${weekStart.toLocaleString("pt-BR", formatOptions)} até ${weekEnd.toLocaleString("pt-BR", formatOptions)}`
}

export function WeeklyLogsCard({
  mode,
  availableModes,
  dayPlanOptions,
  originalWeekPattern,
  effectiveWeekPattern,
  weekDates,
  selectedDate,
  selectedLogs,
  summary,
  logsByDate,
  isLogsLoading,
  logsErrorMessage,
  isDeletingLog,
  isSavingRoutine,
  onWeekValueChange,
  onModeChange,
  onSelectedDateChange,
  onDayPlanChange,
  onDeleteLog,
}: WeeklyLogsCardProps) {
  const changedDayIndexes = weekDates
    .map((_, index) => index)
    .filter(
      (index) =>
        originalWeekPattern[index] !== undefined &&
        effectiveWeekPattern[index] !== undefined &&
        originalWeekPattern[index] !== effectiveWeekPattern[index],
    )
  const changedDaysLabel = changedDayIndexes
    .map((index) => {
      const original = originalWeekPattern[index]
      const current = effectiveWeekPattern[index]
      return `${WEEKDAY_LABELS_WORKOUT[index].toUpperCase()}: ${TYPE_LABELS[original]} -> ${TYPE_LABELS[current]}`
    })
    .join(" · ")

  return (
    <Card className="bg-card text-foreground ring-border">
      <CardHeader>
        <CardTitle className="text-2xl">Calendário + Registros</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Registro por série com peso, repetições, RPE e técnica.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="min-w-48 space-y-1.5">
            <label className="text-xs uppercase tracking-[0.08em] text-muted-foreground" htmlFor="week-picker">
              Semana
            </label>
            <DatePicker
              id="week-picker"
              value={weekDates[0]}
              label={formatWeekRangeLabel(weekDates)}
              onChange={(date) => onWeekValueChange(getISOWeekInputValue(date))}
              buttonClassName="border-border bg-background text-foreground"
            />
          </div>
          <div className="min-w-56 space-y-1.5">
            <label className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Modelo da semana</label>
            <Select value={mode} onValueChange={(value) => onModeChange(value as WeekMode)}>
              <SelectTrigger className="w-full border-border bg-background text-foreground">
                <SelectValue placeholder="Selecione o modelo">
                  {WEEK_MODE_LABELS[mode]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {availableModes.map((modeOption) => (
                  <SelectItem key={modeOption} value={modeOption}>
                    {WEEK_MODE_LABELS[modeOption]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {changedDayIndexes.length ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3">
            <p className="text-xs uppercase tracking-[0.08em] text-destructive">
              Dias modificados nesta rotina
            </p>
            <p className="mt-1 text-sm text-foreground">{changedDaysLabel}</p>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-2 lg:grid-cols-7">
          {weekDates.map((day, index) => {
            const dayISO = toISODateString(day)
            const dayLogs = logsByDate.get(dayISO) ?? []
            const totalMinutes = dayLogs.reduce((minutes, log) => minutes + Number(log.session.durationMin || 0), 0)
            const originalType = originalWeekPattern[index] ?? "rest"
            const planType = effectiveWeekPattern[index] ?? originalType
            const hasShift = originalType !== planType

            return (
              <div
                key={dayISO}
                className={[
                  "rounded-xl border border-border bg-card p-3",
                  getCalendarTypeClasses(planType),
                  hasShift ? "border-destructive/60 bg-destructive/5" : "",
                  selectedDate === dayISO ? "border-ring ring-1 ring-ring/30" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <button
                  type="button"
                  onClick={() => onSelectedDateChange(dayISO)}
                  className="w-full text-left outline-none transition hover:-translate-y-0.5 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/30"
                >
                  <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">{WEEKDAY_LABELS_WORKOUT[index]}</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">{formatDateBR(day)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Planejado: {TYPE_LABELS[planType]}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {dayLogs.length ? `${dayLogs.length} sessão(ões) · ${totalMinutes} min` : "Sem registros"}
                  </p>
                </button>

                <div className="mt-2 space-y-1.5">
                  <label className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                    Plano do dia
                  </label>
                  <Select
                    value={planType}
                    onValueChange={(value) => {
                      void onDayPlanChange(index, value as PlannedType)
                    }}
                  >
                    <SelectTrigger
                      className="h-9 w-full border-border bg-background text-foreground"
                      disabled={isSavingRoutine}
                    >
                      <SelectValue placeholder="Selecione o plano">
                        {TYPE_LABELS[planType]}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {dayPlanOptions.map((option) => (
                        <SelectItem key={`${dayISO}-${option}`} value={option}>
                          {TYPE_LABELS[option]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
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
              <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Tipos treinados</p>
              <p className="text-lg font-bold">{Object.keys(summary.byWorkoutType).length}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card text-foreground ring-border">
          <CardContent className="py-4">
            {isLogsLoading ? (
              <p className="text-sm text-muted-foreground">Carregando registros da semana...</p>
            ) : logsErrorMessage ? (
              <p className="text-sm text-destructive">{logsErrorMessage}</p>
            ) : !selectedLogs.length ? (
              <p className="text-sm text-muted-foreground">
                Sem registros em {selectedDate ? formatISOToBR(selectedDate) : "-"}. Use o formulário do dia para salvar.
              </p>
            ) : (
              <div className="space-y-3">
                {selectedLogs.map((logEntry) => {
                  const groupedSets = new Map<string, typeof logEntry.sets>()
                  for (const set of logEntry.sets) {
                    const current = groupedSets.get(set.exerciseName) ?? []
                    current.push(set)
                    groupedSets.set(set.exerciseName, current)
                  }

                  return (
                    <article key={logEntry.session.id} className="rounded-xl border border-border bg-card p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <strong className="text-foreground">{logEntry.session.workoutLabel || TYPE_LABELS[logEntry.session.workoutType]}</strong>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">{logEntry.session.durationMin} min</span>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={isDeletingLog}
                            onClick={() => {
                              void onDeleteLog(logEntry.session.id)
                            }}
                          >
                            Excluir
                          </Button>
                        </div>
                      </div>
                      {logEntry.session.notes ? <p className="mt-2 text-sm text-muted-foreground">{logEntry.session.notes}</p> : null}

                      <div className="mt-3 space-y-2">
                        {[...groupedSets.entries()].map(([exerciseName, exerciseSets]) => (
                          <div key={`${logEntry.session.id}-${exerciseName}`}>
                            <p className="text-sm font-medium">{exerciseName}</p>
                            <div className="mt-1 flex flex-wrap gap-2">
                              {exerciseSets.map((set) => (
                                <Badge
                                  key={set.id}
                                  variant="outline"
                                  className="border-border text-foreground"
                                >
                                  {set.weightKg}kg × {set.reps}
                                  {set.rpe ? ` @RPE${set.rpe}` : ""}
                                  {set.technique ? ` · ${TECHNIQUE_LABELS[set.technique]}` : ""}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  )
}
