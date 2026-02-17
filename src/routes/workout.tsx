import { createFileRoute } from "@tanstack/react-router"
import { AppLayout } from "src/layouts/app-layout"
import { createContext, use, useState, type ReactNode } from "react"
import { WeeklyLogsCard } from "@/features/training/components/weekly-logs-card"
import { WorkoutsSection } from "@/features/training/components/workouts-section"
import { WEEK_PATTERNS } from "@/features/training/constants"
import {
  getISOWeekInputValue,
  getWeekDates,
  parseISODate,
  toISODateString,
} from "@/features/training/helpers"
import {
  useAddSessionMutation,
  useAppSettingQuery,
  useDeleteSessionMutation,
  useSetAppSettingMutation,
  useWeekSessionsQuery,
} from "@/features/training/queries"
import { getSplitConfig } from "@/features/training/splits/split-registry"
import type {
  PlannedType,
  WeekMode,
  WeekSummary,
  WorkoutPlan,
} from "@/features/training/types"
import {
  getEffectiveWeekPattern,
  getUpdatedWeekPatternSettingValue,
  WEEK_ROUTINE_TEMPLATE_SETTING_KEY,
} from "@/features/training/week-routine"
import { getCurrentDate } from "@/lib/temporal"
import type { SaveSessionInput, SessionWithSets } from "@/lib/training-db"
import type { SplitType } from "@/lib/training-types"
import { AppLayoutContext } from "src/layouts/app-layout/context"

export const Route = createFileRoute("/workout")({
  ssr: false,
  component: WorkoutRoute,
})

function WorkoutRoute() {
  return (
    <AppLayout>
      <WorkoutRouteProvider>
        <section className="space-y-6">
          <WorkoutRouteLogsSection />
          <WorkoutRouteFormsSection />
        </section>
      </WorkoutRouteProvider>
    </AppLayout>
  )
}

interface WorkoutRouteContext {
  splitType: SplitType
  availableModes: ReturnType<typeof getSplitConfig>["weekModes"]
  dayPlanOptions: PlannedType[]
  effectiveMode: WeekMode
  originalWeekPattern: PlannedType[]
  effectiveWeekPattern: PlannedType[]
  selectedWorkout: WorkoutPlan | null
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
  isSavingRoutine: boolean
  setWeekValue: (value: string) => void
  setMode: (mode: WeekMode) => void
  setSelectedDate: (date: string) => void
  setDayPlan: (dayIndex: number, plannedType: PlannedType) => Promise<void>
  saveSession: (payload: SaveSessionInput) => Promise<void>
  deleteSession: (id: string) => Promise<void>
}

const WorkoutRouteContext = createContext<WorkoutRouteContext>(
  {} as WorkoutRouteContext,
)

function WorkoutRouteProvider({ children }: { children: ReactNode }) {
  const { splitType } = use(AppLayoutContext)

  const splitConfig = getSplitConfig(splitType)
  const defaultMode = splitConfig.weekModes[0]
  const todayISO = toISODateString(getCurrentDate())

  const [weekValue, setWeekValue] = useState<string>(() =>
    getISOWeekInputValue(getCurrentDate()),
  )
  const [mode, setMode] = useState<WeekMode>(defaultMode)
  const [selectedDate, setSelectedDate] = useState<string>(todayISO)

  const effectiveMode = splitConfig.weekModes.includes(mode)
    ? mode
    : defaultMode

  const weekDates = getWeekDates(weekValue)
  const weekDateISOValues = weekDates.map((day) => toISODateString(day))
  const weekStartISO = weekDateISOValues[0]
  const weekEndISO = weekDateISOValues[6]

  const weekSessionsQuery = useWeekSessionsQuery(weekStartISO, weekEndISO)
  const addSessionMutation = useAddSessionMutation()
  const deleteSessionMutation = useDeleteSessionMutation()
  const weekRoutineSettingQuery = useAppSettingQuery(
    WEEK_ROUTINE_TEMPLATE_SETTING_KEY,
  )
  const setAppSettingMutation = useSetAppSettingMutation()

  const weekLogs = weekSessionsQuery.data ?? []
  const dayPlanOptions: PlannedType[] = [
    ...splitConfig.workouts.map((workout) => workout.type),
    "rest",
  ]
  const originalWeekPattern = [...WEEK_PATTERNS[effectiveMode]]
  const effectiveWeekPattern = getEffectiveWeekPattern({
    splitType,
    mode: effectiveMode,
    settingValue: weekRoutineSettingQuery.data?.value,
    allowedTypes: dayPlanOptions,
  })
  const selectedDayIndex = weekDateISOValues.indexOf(selectedDate)
  const selectedPatternIndex = selectedDayIndex >= 0 ? selectedDayIndex : 0
  const selectedPlannedType =
    effectiveWeekPattern[selectedPatternIndex] ??
    originalWeekPattern[selectedPatternIndex] ??
    "rest"
  const selectedWorkout =
    selectedPlannedType === "rest"
      ? null
      : splitConfig.workouts.find((workout) => workout.type === selectedPlannedType) ??
        null

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
    },
  )

  function setWeekAndSelectedDate(
    nextWeekValue: string,
    preferredDate?: string,
  ) {
    const currentWeekDates = getWeekDates(nextWeekValue).map((day) =>
      toISODateString(day),
    )

    if (!currentWeekDates.length) {
      return
    }

    setWeekValue(nextWeekValue)
    setSelectedDate((current) => {
      if (preferredDate && currentWeekDates.includes(preferredDate)) {
        return preferredDate
      }

      if (currentWeekDates.includes(current)) {
        return current
      }

      return currentWeekDates[0] ?? ""
    })
  }

  async function saveSession(payload: SaveSessionInput) {
    await addSessionMutation.mutateAsync(payload)

    const parsedDate = parseISODate(payload.session.date)
    const savedWeek = parsedDate ? getISOWeekInputValue(parsedDate) : weekValue

    if (savedWeek !== weekValue) {
      setWeekAndSelectedDate(savedWeek, payload.session.date)
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

  async function setDayPlan(dayIndex: number, plannedType: PlannedType) {
    const nextSettingValue = getUpdatedWeekPatternSettingValue({
      splitType,
      mode: effectiveMode,
      settingValue: weekRoutineSettingQuery.data?.value,
      allowedTypes: dayPlanOptions,
      dayIndex,
      nextType: plannedType,
    })

    try {
      await setAppSettingMutation.mutateAsync({
        key: WEEK_ROUTINE_TEMPLATE_SETTING_KEY,
        value: nextSettingValue,
      })
    } catch (error) {
      console.error(error)
      window.alert("Não foi possível atualizar o plano da semana.")
    }
  }

  const logsErrorMessage = weekSessionsQuery.error
    ? "Não foi possível carregar os registros desta semana."
    : null

  const value: WorkoutRouteContext = {
    splitType,
    availableModes: splitConfig.weekModes,
    dayPlanOptions,
    effectiveMode,
    originalWeekPattern,
    effectiveWeekPattern,
    selectedWorkout,
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
    isSavingRoutine: setAppSettingMutation.isPending,
    setWeekValue: (nextWeekValue: string) => {
      setWeekAndSelectedDate(nextWeekValue)
    },
    setMode,
    setSelectedDate,
    setDayPlan,
    saveSession,
    deleteSession,
  }

  return (
    <WorkoutRouteContext.Provider value={value}>
      {children}
    </WorkoutRouteContext.Provider>
  )
}

function WorkoutRouteLogsSection() {
  const {
    effectiveMode,
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
    setWeekValue,
    setMode,
    setSelectedDate,
    setDayPlan,
    deleteSession,
  } = use(WorkoutRouteContext)

  return (
    <WeeklyLogsCard
      mode={effectiveMode}
      availableModes={availableModes}
      dayPlanOptions={dayPlanOptions}
      originalWeekPattern={originalWeekPattern}
      effectiveWeekPattern={effectiveWeekPattern}
      weekDates={weekDates}
      selectedDate={selectedDate}
      selectedLogs={selectedLogs}
      summary={summary}
      logsByDate={logsByDate}
      isLogsLoading={isLogsLoading}
      logsErrorMessage={logsErrorMessage}
      isDeletingLog={isDeletingLog}
      isSavingRoutine={isSavingRoutine}
      onWeekValueChange={setWeekValue}
      onModeChange={setMode}
      onSelectedDateChange={setSelectedDate}
      onDayPlanChange={setDayPlan}
      onDeleteLog={deleteSession}
    />
  )
}

function WorkoutRouteFormsSection() {
  const {
    selectedDate,
    todayISO,
    splitType,
    selectedWorkout,
    isSavingSession,
    saveSession,
  } = use(WorkoutRouteContext)

  return (
    <WorkoutsSection
      defaultDate={selectedDate || todayISO}
      splitType={splitType}
      workout={selectedWorkout}
      isSaving={isSavingSession}
      onSaveSession={saveSession}
    />
  )
}
