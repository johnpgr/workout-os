import {
  createContext,
  use,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
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
import type { AppLayoutContextValue } from "@/routes/app-layout"

interface WorkoutPageContextValue {
  splitType: AppLayoutContextValue["splitType"]
  workouts: ReturnType<typeof getSplitConfig>["workouts"]
  availableModes: ReturnType<typeof getSplitConfig>["weekModes"]
  effectiveMode: WeekMode
  todayISO: string
  weekDates: ReturnType<typeof getWeekDates>
  selectedDate: string
  selectedLogs: SessionWithSets[]
  summary: WeekSummary
  logsByDate: Map<string, SessionWithSets[]>
  isLogsLoading: boolean
  logsErrorMessage: string | null
  isSavingSession: boolean
  isDeletingLog: boolean
  setWeekValue: (value: string) => void
  setMode: (mode: WeekMode) => void
  setSelectedDate: (date: string) => void
  saveSession: (payload: SaveSessionInput) => Promise<void>
  deleteSession: (id: string) => Promise<void>
}

const WorkoutPageContext = createContext<WorkoutPageContextValue>({} as WorkoutPageContextValue)

function WorkoutPageProvider({ children }: { children: ReactNode }) {
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
      accumulator.byWorkoutType[type] =
        (accumulator.byWorkoutType[type] ?? 0) + 1
      return accumulator
    },
    {
      totalSessions: 0,
      totalMinutes: 0,
      byWorkoutType: {},
    }
  )

  useEffect(() => {
    const currentWeekDates = getWeekDates(weekValue).map((day) =>
      toISODateString(day)
    )

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

  async function saveSession(payload: SaveSessionInput) {
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

  async function deleteSession(id: string) {
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

  const value: WorkoutPageContextValue = {
    splitType,
    workouts: splitConfig.workouts,
    availableModes: splitConfig.weekModes,
    effectiveMode,
    todayISO,
    weekDates,
    selectedDate,
    selectedLogs,
    summary,
    logsByDate,
    isLogsLoading: weekSessionsQuery.isPending,
    logsErrorMessage,
    isSavingSession: addSessionMutation.isPending,
    isDeletingLog: deleteSessionMutation.isPending,
    setWeekValue,
    setMode,
    setSelectedDate,
    saveSession,
    deleteSession,
  }

  return (
    <WorkoutPageContext.Provider value={value}>
      {children}
    </WorkoutPageContext.Provider>
  )
}

function WorkoutPageLogsSection() {
  const {
    effectiveMode,
    availableModes,
    weekDates,
    selectedDate,
    selectedLogs,
    summary,
    logsByDate,
    isLogsLoading,
    logsErrorMessage,
    isDeletingLog,
    setWeekValue,
    setMode,
    setSelectedDate,
    deleteSession,
  } = use(WorkoutPageContext)

  return (
    <WeeklyLogsCard
      mode={effectiveMode}
      availableModes={availableModes}
      weekDates={weekDates}
      selectedDate={selectedDate}
      selectedLogs={selectedLogs}
      summary={summary}
      logsByDate={logsByDate}
      isLogsLoading={isLogsLoading}
      logsErrorMessage={logsErrorMessage}
      isDeletingLog={isDeletingLog}
      onWeekValueChange={setWeekValue}
      onModeChange={setMode}
      onSelectedDateChange={setSelectedDate}
      onDeleteLog={deleteSession}
    />
  )
}

function WorkoutPageFormsSection() {
  const {
    selectedDate,
    todayISO,
    splitType,
    workouts,
    isSavingSession,
    saveSession,
  } = use(WorkoutPageContext)

  return (
    <WorkoutsSection
      defaultDate={selectedDate || todayISO}
      splitType={splitType}
      workouts={workouts}
      isSaving={isSavingSession}
      onSaveSession={saveSession}
    />
  )
}

export function WorkoutPage() {
  return (
    <WorkoutPageProvider>
      <section className="space-y-6">
        <WorkoutPageLogsSection />
        <WorkoutPageFormsSection />
      </section>
    </WorkoutPageProvider>
  )
}

export default WorkoutPage
