import { useEffect, useRef, useState } from "react"

import { AppFooter } from "@/features/training/components/app-footer"
import { AppHeader } from "@/features/training/components/app-header"
import { TipsSection } from "@/features/training/components/tips-section"
import { TrainingOverview } from "@/features/training/components/training-overview"
import { WeeklyLogsCard } from "@/features/training/components/weekly-logs-card"
import { WorkoutsSection } from "@/features/training/components/workouts-section"
import { THEME_STORAGE_KEY } from "@/features/training/constants"
import {
  getISOWeekInputValue,
  getInitialThemePreference,
  getWeekDates,
  parseISODate,
  toISODateString,
} from "@/features/training/helpers"
import {
  useAddLogMutation,
  useDeleteLogMutation,
  useWeekLogsQuery,
} from "@/features/training/queries"
import type { ThemePreference, WeekMode } from "@/features/training/types"
import { getCurrentDate } from "@/lib/temporal"
import type { SessionLog } from "@/lib/training-types"

function App() {
  const todayISO = toISODateString(getCurrentDate())

  const [weekValue, setWeekValue] = useState<string>(() =>
    getISOWeekInputValue(getCurrentDate())
  )
  const [mode, setMode] = useState<WeekMode>("6")
  const [selectedDate, setSelectedDate] = useState<string>(todayISO)
  const [themePreference, setThemePreference] =
    useState<ThemePreference>(getInitialThemePreference)

  const preferredDateRef = useRef<string | undefined>(undefined)

  const weekDates = getWeekDates(weekValue)
  const weekDateISOValues = weekDates.map((day) => toISODateString(day))
  const weekStartISO = weekDateISOValues[0]
  const weekEndISO = weekDateISOValues[6]

  const weekLogsQuery = useWeekLogsQuery(weekStartISO, weekEndISO)
  const addLogMutation = useAddLogMutation()
  const deleteLogMutation = useDeleteLogMutation()

  const weekLogs = weekLogsQuery.data ?? []

  const logsByDate = (() => {
    const grouped = new Map<string, SessionLog[]>()
    for (const log of weekLogs) {
      if (!grouped.has(log.date)) {
        grouped.set(log.date, [])
      }
      grouped.get(log.date)?.push(log)
    }
    return grouped
  })()

  const selectedLogs = weekLogs
    .filter((log) => log.date === selectedDate)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))

  const summary = weekLogs.reduce(
    (accumulator, log) => {
      accumulator.totalSessions += 1
      accumulator.totalMinutes += Number(log.durationMin || 0)

      if (log.workoutType === "push") accumulator.totalPush += 1
      if (log.workoutType === "pull") accumulator.totalPull += 1
      if (log.workoutType === "leg") accumulator.totalLegs += 1

      return accumulator
    },
    {
      totalSessions: 0,
      totalMinutes: 0,
      totalPush: 0,
      totalPull: 0,
      totalLegs: 0,
    }
  )

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")

    const applyTheme = (preference: ThemePreference) => {
      const effectiveTheme =
        preference === "system"
          ? mediaQuery.matches
            ? "dark"
            : "light"
          : preference

      document.documentElement.classList.toggle("dark", effectiveTheme === "dark")
      document.documentElement.style.colorScheme = effectiveTheme
    }

    applyTheme(themePreference)
    window.localStorage.setItem(THEME_STORAGE_KEY, themePreference)

    if (themePreference !== "system") {
      return
    }

    const onSystemThemeChange = () => {
      applyTheme("system")
    }

    mediaQuery.addEventListener("change", onSystemThemeChange)

    return () => {
      mediaQuery.removeEventListener("change", onSystemThemeChange)
    }
  }, [themePreference])

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

  async function handleSaveLog(payload: Omit<SessionLog, "id">) {
    await addLogMutation.mutateAsync(payload)

    preferredDateRef.current = payload.date
    const parsedDate = parseISODate(payload.date)
    const savedWeek = parsedDate ? getISOWeekInputValue(parsedDate) : weekValue

    if (savedWeek !== weekValue) {
      setWeekValue(savedWeek)
      return
    }

    setSelectedDate(payload.date)
  }

  async function handleDeleteLog(id: number | undefined) {
    if (id == null) {
      return
    }

    if (!window.confirm("Excluir este log?")) {
      return
    }

    try {
      await deleteLogMutation.mutateAsync(id)
    } catch (error) {
      console.error(error)
      window.alert("Não foi possível excluir o log.")
    }
  }

  const logsErrorMessage = weekLogsQuery.error
    ? "Não foi possível carregar os registros desta semana."
    : null

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <AppHeader
          themePreference={themePreference}
          onThemePreferenceChange={setThemePreference}
        />

        <TrainingOverview />

        <WeeklyLogsCard
          mode={mode}
          weekValue={weekValue}
          weekDates={weekDates}
          selectedDate={selectedDate}
          selectedLogs={selectedLogs}
          summary={summary}
          logsByDate={logsByDate}
          isLogsLoading={weekLogsQuery.isPending}
          logsErrorMessage={logsErrorMessage}
          isDeletingLog={deleteLogMutation.isPending}
          onWeekValueChange={setWeekValue}
          onModeChange={setMode}
          onSelectedDateChange={setSelectedDate}
          onDeleteLog={handleDeleteLog}
        />

        <WorkoutsSection
          defaultDate={selectedDate || todayISO}
          isSaving={addLogMutation.isPending}
          onSaveLog={handleSaveLog}
        />

        <TipsSection />

        <AppFooter />
      </div>
    </main>
  )
}

export default App
