import { useEffect, useRef, useState } from "react"

import { AppFooter } from "@/features/training/components/app-footer"
import { AppHeader } from "@/features/training/components/app-header"
import { TipsSection } from "@/features/training/components/tips-section"
import { TrainingOverview } from "@/features/training/components/training-overview"
import { WeeklyLogsCard } from "@/features/training/components/weekly-logs-card"
import { WorkoutsSection } from "@/features/training/components/workouts-section"
import { THEME_STORAGE_KEY } from "@/features/training/constants"
import {
  createInitialForms,
  getISOWeekInputValue,
  getInitialThemePreference,
  getWeekDates,
  parseISODate,
  resetRows,
  toISODateString,
} from "@/features/training/helpers"
import type {
  ExerciseInputRow,
  FormStatus,
  ThemePreference,
  WeekMode,
  WorkoutFormsState,
  WorkoutPlan,
} from "@/features/training/types"
import { Temporal, getCurrentDate } from "@/lib/temporal"
import {
  type SessionExerciseLog,
  type SessionLog,
  type WorkoutType,
} from "@/lib/training-types"

function App() {
  const todayISO = toISODateString(getCurrentDate())

  const [weekValue, setWeekValue] = useState<string>(() =>
    getISOWeekInputValue(getCurrentDate())
  )
  const [mode, setMode] = useState<WeekMode>("6")
  const [weekLogs, setWeekLogs] = useState<SessionLog[]>([])
  const [selectedDate, setSelectedDate] = useState<string>(todayISO)
  const [forms, setForms] = useState<WorkoutFormsState>(() =>
    createInitialForms(todayISO)
  )
  const [refreshVersion, setRefreshVersion] = useState(0)
  const [themePreference, setThemePreference] =
    useState<ThemePreference>(getInitialThemePreference)

  const preferredDateRef = useRef<string | undefined>(undefined)

  const weekDates = getWeekDates(weekValue)

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
    const currentWeekDates = getWeekDates(weekValue)
    const currentWeekDateISOValues = currentWeekDates.map((day) => toISODateString(day))

    if (!currentWeekDateISOValues.length) {
      return
    }

    let cancelled = false

    const start = currentWeekDateISOValues[0]
    const end = currentWeekDateISOValues[6]

    void (async () => {
      try {
        const { getLogsByDateRange } = await import("@/lib/training-db")
        const logs = await getLogsByDateRange(start, end)
        if (cancelled) {
          return
        }

        setWeekLogs(logs)
        setSelectedDate((current) => {
          const preferred = preferredDateRef.current
          preferredDateRef.current = undefined

          if (preferred && currentWeekDateISOValues.includes(preferred)) {
            return preferred
          }

          if (currentWeekDateISOValues.includes(current)) {
            return current
          }

          return currentWeekDateISOValues[0] ?? ""
        })
      } catch (error) {
        if (!cancelled) {
          console.error(error)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [refreshVersion, weekValue])

  function setFormStatus(workoutType: WorkoutType, status: FormStatus) {
    setForms((previous) => ({
      ...previous,
      [workoutType]: {
        ...previous[workoutType],
        status,
      },
    }))
  }

  function updateFormField(
    workoutType: WorkoutType,
    field: "date" | "duration" | "notes",
    value: string
  ) {
    setForms((previous) => ({
      ...previous,
      [workoutType]: {
        ...previous[workoutType],
        [field]: value,
      },
    }))
  }

  function updateExerciseField(
    workoutType: WorkoutType,
    rowIndex: number,
    field: keyof ExerciseInputRow,
    value: string
  ) {
    setForms((previous) => {
      const nextRows = previous[workoutType].rows.map((row, index) => {
        if (index !== rowIndex) {
          return row
        }

        return {
          ...row,
          [field]: value,
        }
      })

      return {
        ...previous,
        [workoutType]: {
          ...previous[workoutType],
          rows: nextRows,
        },
      }
    })
  }

  async function handleSaveLog(workout: WorkoutPlan) {
    const form = forms[workout.type]
    const durationMin = Number(form.duration)

    if (!form.date) {
      setFormStatus(workout.type, {
        kind: "error",
        message: "Informe a data do treino.",
      })
      return
    }

    if (!Number.isFinite(durationMin) || durationMin <= 0) {
      setFormStatus(workout.type, {
        kind: "error",
        message: "Informe a duração da sessão em minutos.",
      })
      return
    }

    const exercises: SessionExerciseLog[] = form.rows
      .map((row, index) => {
        const sets = Number(row.sets || 0)
        const reps = Number(row.reps || 0)
        const weight = Number(row.weight || 0)

        return {
          name: workout.exercises[index].name,
          sets,
          reps,
          weight,
        }
      })
      .filter((entry) => entry.sets > 0 || entry.reps > 0 || entry.weight > 0)

    const payload: Omit<SessionLog, "id"> = {
      workoutType: workout.type,
      workoutLabel: workout.label,
      date: form.date,
      durationMin,
      notes: form.notes.trim(),
      exercises,
      createdAt: Temporal.Now.instant().toString(),
    }

    try {
      const { addLog } = await import("@/lib/training-db")
      await addLog(payload)

      setForms((previous) => ({
        ...previous,
        [workout.type]: {
          ...previous[workout.type],
          duration: "",
          notes: "",
          rows: resetRows(previous[workout.type].rows.length),
          status: {
            kind: "success",
            message: "Treino salvo com sucesso no IndexedDB.",
          },
        },
      }))

      preferredDateRef.current = form.date
      const parsedDate = parseISODate(form.date)
      const savedWeek = parsedDate ? getISOWeekInputValue(parsedDate) : weekValue
      if (savedWeek !== weekValue) {
        setWeekValue(savedWeek)
      } else {
        setRefreshVersion((previous) => previous + 1)
      }
    } catch (error) {
      console.error(error)
      setFormStatus(workout.type, {
        kind: "error",
        message: "Não foi possível salvar no IndexedDB.",
      })
    }
  }

  function handleClearForm(workoutType: WorkoutType) {
    setForms((previous) => ({
      ...previous,
      [workoutType]: {
        ...previous[workoutType],
        duration: "",
        notes: "",
        rows: resetRows(previous[workoutType].rows.length),
        status: { kind: "success", message: "Campos limpos." },
      },
    }))
  }

  async function handleDeleteLog(id: number | undefined) {
    if (id == null) {
      return
    }

    if (!window.confirm("Excluir este log?")) {
      return
    }

    try {
      const { deleteLog } = await import("@/lib/training-db")
      await deleteLog(id)
      setRefreshVersion((previous) => previous + 1)
    } catch (error) {
      console.error(error)
      window.alert("Não foi possível excluir o log.")
    }
  }

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
          onWeekValueChange={setWeekValue}
          onModeChange={setMode}
          onSelectedDateChange={setSelectedDate}
          onDeleteLog={handleDeleteLog}
        />

        <WorkoutsSection
          forms={forms}
          onUpdateFormField={updateFormField}
          onUpdateExerciseField={updateExerciseField}
          onSaveLog={handleSaveLog}
          onClearForm={handleClearForm}
        />

        <TipsSection />

        <AppFooter />
      </div>
    </main>
  )
}

export default App
