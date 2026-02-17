import { useEffect, useRef, useState } from "react"
import { useOutletContext } from "react-router"
import { WeeklyLogsCard } from "@/features/training/components/weekly-logs-card"
import { WorkoutsSection } from "@/features/training/components/workouts-section"
import {
  getISOWeekInputValue,
  getWeekDates,
  parseISODate,
  toISODateString,
} from "@/features/training/helpers"
import {
  useAddSessionMutation,
  useDeleteSessionMutation,
  useWeekSessionsQuery,
} from "@/features/training/queries"
import { getSplitConfig } from "@/features/training/splits/split-registry"
import type { WeekMode, WeekSummary } from "@/features/training/types"
import { getCurrentDate } from "@/lib/temporal"
import type { SaveSessionInput, SessionWithSets } from "@/lib/training-db"
import type { AppLayoutContextValue } from "@/layouts/app-layout"

export function WorkoutPage() {
  const { splitType } = useOutletContext<AppLayoutContextValue>()

  const splitConfig = getSplitConfig(splitType)
  const defaultMode = splitConfig.weekModes[0]
  const todayISO = toISODateString(getCurrentDate())

  const [weekValue, setWeekValue] = useState<string>(() =>
    getISOWeekInputValue(getCurrentDate())
  )
  const [mode, setMode] = useState<WeekMode>(defaultMode)
  const [selectedDate, setSelectedDate] = useState<string>(todayISO)

  const preferredDateRef = useRef<string | undefined>(undefined)

  const effectiveMode = splitConfig.weekModes.includes(mode) ? mode : defaultMode

  const weekDates = getWeekDates(weekValue)
  const weekDateISOValues = weekDates.map((day) => toISODateString(day))
  const weekStartISO = weekDateISOValues[0]
  const weekEndISO = weekDateISOValues[6]

  const weekSessionsQuery = useWeekSessionsQuery(weekStartISO, weekEndISO)
  const addSessionMutation = useAddSessionMutation()
  const deleteSessionMutation = useDeleteSessionMutation()

  const weekLogs = weekSessionsQuery.data ?? []

  const logsByDate = new Map<string, SessionWithSets[]>()
  for (const logEntry of weekLogs) {
    if (!logsByDate.has(logEntry.session.date)) {
      logsByDate.set(logEntry.session.date, [])
    }
    logsByDate.get(logEntry.session.date)?.push(logEntry)
  }

  const selectedLogs = weekLogs
    .filter((entry) => entry.session.date === selectedDate)
    .sort((a, b) => b.session.updatedAt.localeCompare(a.session.updatedAt))

  const summary = weekLogs.reduce<WeekSummary>(
    (accumulator, entry) => {
      accumulator.totalSessions += 1
      accumulator.totalMinutes += Number(entry.session.durationMin || 0)
      const type = entry.session.workoutType
      accumulator.byWorkoutType[type] = (accumulator.byWorkoutType[type] ?? 0) + 1
      return accumulator
    },
    {
      totalSessions: 0,
      totalMinutes: 0,
      byWorkoutType: {},
    }
  )

  useEffect(() => {
    const currentWeekDates = getWeekDates(weekValue).map((day) => toISODateString(day))

    if (!currentWeekDates.length) {
      return
    }

    setSelectedDate((current) => {
      const preferred = preferredDateRef.current
      preferredDateRef.current = undefined

      if (preferred && currentWeekDates.includes(preferred)) {
        return preferred
      }

      if (currentWeekDates.includes(current)) {
        return current
      }

      return currentWeekDates[0] ?? ""
    })
  }, [weekValue])

  async function handleSaveSession(payload: SaveSessionInput) {
    await addSessionMutation.mutateAsync(payload)

    preferredDateRef.current = payload.session.date
    const parsedDate = parseISODate(payload.session.date)
    const savedWeek = parsedDate ? getISOWeekInputValue(parsedDate) : weekValue

    if (savedWeek !== weekValue) {
      setWeekValue(savedWeek)
      return
    }

    setSelectedDate(payload.session.date)
  }

  async function handleDeleteSession(id: string) {
    if (!window.confirm("Excluir esta sessão?")) {
      return
    }

    try {
      await deleteSessionMutation.mutateAsync(id)
    } catch (error) {
      console.error(error)
      window.alert("Não foi possível excluir a sessão.")
    }
  }

  const logsErrorMessage = weekSessionsQuery.error
    ? "Não foi possível carregar os registros desta semana."
    : null

  return (
    <section className="space-y-6">
      <WeeklyLogsCard
        mode={effectiveMode}
        availableModes={splitConfig.weekModes}
        weekValue={weekValue}
        weekDates={weekDates}
        selectedDate={selectedDate}
        selectedLogs={selectedLogs}
        summary={summary}
        logsByDate={logsByDate}
        isLogsLoading={weekSessionsQuery.isPending}
        logsErrorMessage={logsErrorMessage}
        isDeletingLog={deleteSessionMutation.isPending}
        onWeekValueChange={setWeekValue}
        onModeChange={setMode}
        onSelectedDateChange={setSelectedDate}
        onDeleteLog={handleDeleteSession}
      />

      <WorkoutsSection
        defaultDate={selectedDate || todayISO}
        splitType={splitType}
        workouts={splitConfig.workouts}
        isSaving={addSessionMutation.isPending}
        onSaveSession={handleSaveSession}
      />
    </section>
  )
}
