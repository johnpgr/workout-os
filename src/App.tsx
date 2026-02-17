import { useEffect, useMemo, useRef, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

type WorkoutType = "push" | "pull" | "leg"
type PlannedType = WorkoutType | "rest"
type WeekMode = "6" | "3"

type FormStatus =
  | {
      kind: "success" | "error"
      message: string
    }
  | null

interface ExercisePlan {
  name: string
  detail: string
  type: "COMPOSTO" | "ISOLAMENTO"
  setsReps: string
  rest: string
  notes: string
}

interface WorkoutPlan {
  type: WorkoutType
  label: string
  title: string
  emoji: string
  badge: string
  duration: string
  exercises: ExercisePlan[]
}

interface SessionExerciseLog {
  name: string
  sets: number
  reps: number
  weight: number
}

interface SessionLog {
  id?: number
  workoutType: WorkoutType
  workoutLabel: string
  date: string
  durationMin: number
  notes: string
  exercises: SessionExerciseLog[]
  createdAt: string
}

interface ExerciseInputRow {
  sets: string
  reps: string
  weight: string
}

interface WorkoutFormState {
  date: string
  duration: string
  notes: string
  rows: ExerciseInputRow[]
  status: FormStatus
}

type WorkoutFormsState = Record<WorkoutType, WorkoutFormState>

const DB_NAME = "ppl-training-logs"
const DB_VERSION = 1
const STORE_NAME = "session_logs"

const WEEKDAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"]

const TYPE_LABELS: Record<PlannedType, string> = {
  push: "Push",
  pull: "Pull",
  leg: "Legs",
  rest: "Descanso",
}

const WEEK_PATTERNS: Record<WeekMode, PlannedType[]> = {
  "6": ["push", "pull", "leg", "push", "pull", "leg", "rest"],
  "3": ["push", "rest", "pull", "rest", "leg", "rest", "rest"],
}

const INFO_CARDS = [
  { label: "Formato", value: "Push / Pull / Legs" },
  { label: "Duração por Sessão", value: "75-90 minutos" },
  { label: "Frequência Semanal", value: "6x (PPL x2) ou 3x" },
  { label: "Nível", value: "Intermediário/Avançado" },
]

const RETURN_GUIDANCE = [
  "Primeira semana: reduza a carga em 20-30% do que você usava antes da pausa.",
  "Segunda semana: aumente gradualmente para 80-90% da carga anterior.",
  "Terceira semana: retome 100% e continue a progressão normal.",
  "Priorize a técnica correta sobre carga pesada no retorno.",
  "Não force treinar com dor; adapte ou substitua exercícios se necessário.",
  "Hidratação e sono são essenciais para recuperação muscular.",
]

const WORKOUTS: WorkoutPlan[] = [
  {
    type: "push",
    label: "Push",
    title: "Dia 1: PUSH",
    emoji: "💪",
    badge: "PEITO / OMBRO / TRÍCEPS",
    duration: "80-90 min",
    exercises: [
      {
        name: "Supino Reto (Barra)",
        detail: "Peito completo",
        type: "COMPOSTO",
        setsReps: "4 × 6-8",
        rest: "2-3 min",
        notes: "Movimento principal. Controle na descida, explosão na subida.",
      },
      {
        name: "Supino Inclinado (Halteres)",
        detail: "Peito superior",
        type: "COMPOSTO",
        setsReps: "3 × 8-10",
        rest: "90 seg",
        notes: "Inclinação 30-45°. Amplitude completa, cotovelos a 45°.",
      },
      {
        name: "Desenvolvimento Militar (Barra)",
        detail: "Ombro completo",
        type: "COMPOSTO",
        setsReps: "4 × 6-8",
        rest: "2 min",
        notes: "Pode ser sentado ou em pé. Core ativado, sem hiperextensão lombar.",
      },
      {
        name: "Elevação Lateral (Halteres)",
        detail: "Deltoide lateral",
        type: "ISOLAMENTO",
        setsReps: "3 × 10-12",
        rest: "60 seg",
        notes: "Leve inclinação frontal. Cotovelos levemente flexionados.",
      },
      {
        name: "Crossover ou Crucifixo Inclinado",
        detail: "Peito superior (finalizador)",
        type: "ISOLAMENTO",
        setsReps: "3 × 12-15",
        rest: "60 seg",
        notes: "Foco na contração. Tensão constante, não usar inércia.",
      },
      {
        name: "Tríceps Testa (Barra EZ)",
        detail: "Tríceps (cabeça longa)",
        type: "ISOLAMENTO",
        setsReps: "3 × 10-12",
        rest: "90 seg",
        notes: "Cotovelos fixos. Descer até a testa/topo da cabeça.",
      },
      {
        name: "Tríceps Corda (Polia Alta)",
        detail: "Tríceps (cabeça lateral)",
        type: "ISOLAMENTO",
        setsReps: "3 × 12-15",
        rest: "60 seg",
        notes: "Abrir a corda no final. Cotovelos colados ao corpo.",
      },
    ],
  },
  {
    type: "pull",
    label: "Pull",
    title: "Dia 2: PULL",
    emoji: "🔙",
    badge: "COSTAS / BÍCEPS / POSTERIOR",
    duration: "80-90 min",
    exercises: [
      {
        name: "Barra Fixa (Pegada Pronada)",
        detail: "Dorsal + redondo maior",
        type: "COMPOSTO",
        setsReps: "4 × 6-10",
        rest: "2-3 min",
        notes: "Use auxílio elástico se necessário. Descer até extensão completa.",
      },
      {
        name: "Remada Curvada (Barra)",
        detail: "Costas completa (espessura)",
        type: "COMPOSTO",
        setsReps: "4 × 8-10",
        rest: "2 min",
        notes: "Pegada supinada ou pronada. Puxar até abdômen inferior.",
      },
      {
        name: "Puxada Frontal (Polia)",
        detail: "Dorsal (largura)",
        type: "COMPOSTO",
        setsReps: "3 × 10-12",
        rest: "90 seg",
        notes: "Pegada aberta, puxar até o peito. Costas arqueadas.",
      },
      {
        name: "Remada Sentada (Polia)",
        detail: "Meio das costas",
        type: "COMPOSTO",
        setsReps: "3 × 10-12",
        rest: "90 seg",
        notes: "Puxar até abdômen, cotovelos para trás. Retrair escápulas.",
      },
      {
        name: "Pullover (Haltere ou Polia)",
        detail: "Dorsal + serrátil",
        type: "ISOLAMENTO",
        setsReps: "3 × 12-15",
        rest: "60 seg",
        notes: "Alongamento máximo, contração no final. Braços semi-flexionados.",
      },
      {
        name: "Rosca Direta (Barra)",
        detail: "Bíceps completo",
        type: "ISOLAMENTO",
        setsReps: "3 × 8-10",
        rest: "90 seg",
        notes: "Cotovelos fixos. Evitar balanço do corpo.",
      },
      {
        name: "Rosca Martelo (Halteres)",
        detail: "Braquial + braquiorradial",
        type: "ISOLAMENTO",
        setsReps: "3 × 10-12",
        rest: "60 seg",
        notes: "Pegada neutra (palmas frente a frente). Alternado ou simultâneo.",
      },
      {
        name: "Facepull (Polia)",
        detail: "Deltoide posterior + trapézio",
        type: "ISOLAMENTO",
        setsReps: "3 × 15-20",
        rest: "60 seg",
        notes: "Puxar até o rosto, cotovelos altos. Importante para saúde do ombro.",
      },
    ],
  },
  {
    type: "leg",
    label: "Legs",
    title: "Dia 3: LEGS",
    emoji: "🦵",
    badge: "QUADRÍCEPS / POSTERIOR / GLÚTEOS",
    duration: "75-90 min",
    exercises: [
      {
        name: "Agachamento Livre (Barra)",
        detail: "Pernas completo",
        type: "COMPOSTO",
        setsReps: "4 × 6-8",
        rest: "3-4 min",
        notes: "Rei dos exercícios. Descer até paralelo ou abaixo. Core ativado.",
      },
      {
        name: "Leg Press 45°",
        detail: "Quadríceps + glúteos",
        type: "COMPOSTO",
        setsReps: "3 × 10-12",
        rest: "2 min",
        notes: "Amplitude completa, joelhos alinhados com pés. Não travar joelhos.",
      },
      {
        name: "Stiff (Barra ou Halteres)",
        detail: "Posterior + glúteos",
        type: "COMPOSTO",
        setsReps: "4 × 8-10",
        rest: "2 min",
        notes: "Costas retas, quadril para trás. Sentir alongamento nos posteriores.",
      },
      {
        name: "Avanço (Halteres ou Barra)",
        detail: "Quadríceps + glúteos (unilateral)",
        type: "COMPOSTO",
        setsReps: "3 × 10-12",
        rest: "90 seg",
        notes: "Alternado ou por perna. Joelho não ultrapassa ponta do pé.",
      },
      {
        name: "Cadeira Extensora",
        detail: "Quadríceps (isolado)",
        type: "ISOLAMENTO",
        setsReps: "3 × 12-15",
        rest: "60 seg",
        notes: "Contração máxima no topo. Descer controlado.",
      },
      {
        name: "Mesa Flexora",
        detail: "Posterior (isolado)",
        type: "ISOLAMENTO",
        setsReps: "3 × 12-15",
        rest: "60 seg",
        notes: "Quadril colado no banco. Puxar até 90° ou mais.",
      },
      {
        name: "Panturrilha em Pé (Smith ou Máquina)",
        detail: "Gastrocnêmio",
        type: "ISOLAMENTO",
        setsReps: "4 × 12-15",
        rest: "60 seg",
        notes: "Amplitude completa. Subir na ponta, descer até alongar.",
      },
      {
        name: "Panturrilha Sentado",
        detail: "Sóleo",
        type: "ISOLAMENTO",
        setsReps: "3 × 15-20",
        rest: "45 seg",
        notes: "Complementa a panturrilha em pé. Volume alto.",
      },
    ],
  },
]

const TIPS = [
  {
    title: "🔄 Progressão de Carga",
    items: [
      "Aumente 2,5-5kg quando completar todas as séries no topo da faixa de reps.",
      "Para halteres pequenos, aumente 1-2kg por vez.",
      "Se não conseguir manter as reps, mantenha a carga e foque na técnica.",
      "Registre seus treinos para acompanhar evolução.",
    ],
  },
  {
    title: "⏰ Frequência Semanal",
    items: [
      "Opção 1 (6x/semana): Push → Pull → Legs → Push → Pull → Legs → Rest.",
      "Opção 2 (3x/semana): Push → Rest → Pull → Rest → Legs → Rest → Rest.",
      "Escolha baseado na sua recuperação e disponibilidade de tempo.",
      "Mínimo de 1 dia de descanso completo por semana.",
    ],
  },
  {
    title: "🍽️ Nutrição & Recuperação",
    items: [
      "Proteína: 1,8-2,2g por kg de peso corporal.",
      "Consuma carboidratos suficientes para sustentar os treinos.",
      "Hidratação: mínimo de 2-3L de água por dia.",
      "Sono: 7-9 horas para recuperação muscular ideal.",
      "Suplementação básica: whey e creatina (5g/dia).",
    ],
  },
  {
    title: "📝 Técnica & Segurança",
    items: [
      "Aquecimento: 5-10 min de cardio leve + séries específicas.",
      "Priorize amplitude completa de movimento.",
      "Controle a fase excêntrica (negativa) em todas as repetições.",
      "Respiração: expire na contração, inspire na extensão.",
      "Alongamento leve pós-treino por 5-10 min.",
    ],
  },
]

const WORKOUT_STYLES: Record<WorkoutType, { border: string; badge: string }> = {
  push: {
    border: "border-t-4 border-t-rose-400",
    badge: "bg-rose-400/15 text-rose-200 border border-rose-300/30",
  },
  pull: {
    border: "border-t-4 border-t-teal-400",
    badge: "bg-teal-400/15 text-teal-100 border border-teal-300/30",
  },
  leg: {
    border: "border-t-4 border-t-amber-300",
    badge: "bg-amber-300/15 text-amber-100 border border-amber-200/40",
  },
}

let dbPromise: Promise<IDBDatabase> | null = null

async function getDatabase(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, {
            keyPath: "id",
            autoIncrement: true,
          })
          store.createIndex("by_date", "date", { unique: false })
          store.createIndex("by_workout_type", "workoutType", { unique: false })
          store.createIndex("by_created_at", "createdAt", { unique: false })
        }
      }

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error ?? new Error("Não foi possível abrir o IndexedDB."))
    })
  }

  return dbPromise
}

async function addLog(log: Omit<SessionLog, "id">): Promise<void> {
  const db = await getDatabase()

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    tx.objectStore(STORE_NAME).add(log)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error("Falha ao salvar log."))
  })
}

async function deleteLog(id: number): Promise<void> {
  const db = await getDatabase()

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    tx.objectStore(STORE_NAME).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error("Falha ao excluir log."))
  })
}

async function getLogsByDateRange(startDateISO: string, endDateISO: string): Promise<SessionLog[]> {
  const db = await getDatabase()

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly")
    const index = tx.objectStore(STORE_NAME).index("by_date")
    const range = IDBKeyRange.bound(startDateISO, endDateISO)
    const logs: SessionLog[] = []

    index.openCursor(range).onsuccess = (event) => {
      const target = event.target as IDBRequest<IDBCursorWithValue | null>
      const cursor = target.result
      if (cursor) {
        logs.push(cursor.value as SessionLog)
        cursor.continue()
      }
    }

    tx.oncomplete = () => {
      logs.sort((a, b) => {
        if (a.date !== b.date) {
          return a.date < b.date ? 1 : -1
        }
        return String(b.createdAt).localeCompare(String(a.createdAt))
      })
      resolve(logs)
    }
    tx.onerror = () => reject(tx.error ?? new Error("Falha ao carregar logs da semana."))
  })
}

function getWeekDates(weekValue: string): Date[] {
  const [yearText, weekText] = weekValue.split("-W")
  const year = Number(yearText)
  const week = Number(weekText)

  if (!Number.isFinite(year) || !Number.isFinite(week)) {
    return []
  }

  const jan4 = new Date(Date.UTC(year, 0, 4))
  const jan4Day = jan4.getUTCDay() || 7
  const mondayUTC = new Date(jan4)
  mondayUTC.setUTCDate(jan4.getUTCDate() - jan4Day + 1 + (week - 1) * 7)

  const days: Date[] = []
  for (let index = 0; index < 7; index += 1) {
    const dayUTC = new Date(mondayUTC)
    dayUTC.setUTCDate(mondayUTC.getUTCDate() + index)
    days.push(new Date(dayUTC.getUTCFullYear(), dayUTC.getUTCMonth(), dayUTC.getUTCDate()))
  }

  return days
}

function getISOWeekInputValue(date: Date): string {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = tmp.getUTCDay() || 7
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum)

  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)

  return `${tmp.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`
}

function toISODateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function formatDateBR(date: Date): string {
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
}

function formatISOToBR(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number)
  return new Date(year, month - 1, day).toLocaleDateString("pt-BR")
}

function createInitialForms(defaultDate: string): WorkoutFormsState {
  return {
    push: {
      date: defaultDate,
      duration: "",
      notes: "",
      rows: WORKOUTS[0].exercises.map(() => ({ sets: "", reps: "", weight: "" })),
      status: null,
    },
    pull: {
      date: defaultDate,
      duration: "",
      notes: "",
      rows: WORKOUTS[1].exercises.map(() => ({ sets: "", reps: "", weight: "" })),
      status: null,
    },
    leg: {
      date: defaultDate,
      duration: "",
      notes: "",
      rows: WORKOUTS[2].exercises.map(() => ({ sets: "", reps: "", weight: "" })),
      status: null,
    },
  }
}

function resetRows(rowsLength: number): ExerciseInputRow[] {
  return Array.from({ length: rowsLength }, () => ({ sets: "", reps: "", weight: "" }))
}

function getCalendarTypeClasses(type: PlannedType): string {
  if (type === "push") return "ring-1 ring-rose-300/40"
  if (type === "pull") return "ring-1 ring-teal-300/40"
  if (type === "leg") return "ring-1 ring-amber-200/45"
  return "opacity-80"
}

function App() {
  const todayISO = toISODateString(new Date())

  const [weekValue, setWeekValue] = useState<string>(() => getISOWeekInputValue(new Date()))
  const [mode, setMode] = useState<WeekMode>("6")
  const [weekLogs, setWeekLogs] = useState<SessionLog[]>([])
  const [selectedDate, setSelectedDate] = useState<string>(todayISO)
  const [forms, setForms] = useState<WorkoutFormsState>(() => createInitialForms(todayISO))
  const [refreshVersion, setRefreshVersion] = useState(0)

  const preferredDateRef = useRef<string | undefined>(undefined)

  const weekDates = useMemo(() => getWeekDates(weekValue), [weekValue])
  const weekDateISOValues = useMemo(() => weekDates.map((day) => toISODateString(day)), [weekDates])

  const logsByDate = useMemo(() => {
    const grouped = new Map<string, SessionLog[]>()
    for (const log of weekLogs) {
      if (!grouped.has(log.date)) {
        grouped.set(log.date, [])
      }
      grouped.get(log.date)?.push(log)
    }
    return grouped
  }, [weekLogs])

  const selectedLogs = useMemo(() => {
    return weekLogs
      .filter((log) => log.date === selectedDate)
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
  }, [selectedDate, weekLogs])

  const summary = useMemo(() => {
    const totalSessions = weekLogs.length
    const totalMinutes = weekLogs.reduce((sum, log) => sum + Number(log.durationMin || 0), 0)
    const totalPush = weekLogs.filter((log) => log.workoutType === "push").length
    const totalPull = weekLogs.filter((log) => log.workoutType === "pull").length
    const totalLegs = weekLogs.filter((log) => log.workoutType === "leg").length

    return {
      totalSessions,
      totalMinutes,
      totalPush,
      totalPull,
      totalLegs,
    }
  }, [weekLogs])

  useEffect(() => {
    if (!weekDates.length) {
      return
    }

    let cancelled = false

    const start = toISODateString(weekDates[0])
    const end = toISODateString(weekDates[6])

    void (async () => {
      try {
        const logs = await getLogsByDateRange(start, end)
        if (cancelled) {
          return
        }

        setWeekLogs(logs)
        setSelectedDate((current) => {
          const preferred = preferredDateRef.current
          preferredDateRef.current = undefined

          if (preferred && weekDateISOValues.includes(preferred)) {
            return preferred
          }

          if (weekDateISOValues.includes(current)) {
            return current
          }

          return weekDateISOValues[0] ?? ""
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
  }, [refreshVersion, weekDateISOValues, weekDates])

  function setFormStatus(workoutType: WorkoutType, status: FormStatus) {
    setForms((previous) => ({
      ...previous,
      [workoutType]: {
        ...previous[workoutType],
        status,
      },
    }))
  }

  function updateFormField(workoutType: WorkoutType, field: "date" | "duration" | "notes", value: string) {
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
      setFormStatus(workout.type, { kind: "error", message: "Informe a data do treino." })
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
      createdAt: new Date().toISOString(),
    }

    try {
      await addLog(payload)

      setForms((previous) => ({
        ...previous,
        [workout.type]: {
          ...previous[workout.type],
          duration: "",
          notes: "",
          rows: resetRows(previous[workout.type].rows.length),
          status: { kind: "success", message: "Treino salvo com sucesso no IndexedDB." },
        },
      }))

      preferredDateRef.current = form.date
      const savedWeek = getISOWeekInputValue(new Date(`${form.date}T00:00:00`))
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
    if (!id) {
      return
    }

    if (!window.confirm("Excluir este log?")) {
      return
    }

    try {
      await deleteLog(id)
      setRefreshVersion((previous) => previous + 1)
    } catch (error) {
      console.error(error)
      window.alert("Não foi possível excluir o log.")
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#172033_0%,_#0a0e17_55%,_#070b12_100%)] px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="space-y-3 text-center">
          <h1 className="bg-gradient-to-r from-sky-300 via-cyan-200 to-violet-200 bg-clip-text text-4xl font-black text-transparent sm:text-6xl">
            Plano de Treino PPL
          </h1>
          <p className="text-sm text-slate-300 sm:text-base">Retorno pós-pausa de 2 semanas</p>
        </header>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {INFO_CARDS.map((item) => (
            <Card key={item.label} className="bg-slate-900/75 text-slate-100 ring-slate-700">
              <CardHeader className="space-y-2 pb-3">
                <CardDescription className="text-[11px] uppercase tracking-[0.12em] text-slate-400">
                  {item.label}
                </CardDescription>
                <CardTitle className="text-xl text-slate-100">{item.value}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </section>

        <Card className="border-amber-300/40 bg-amber-500/10 text-slate-100 ring-amber-300/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-amber-100">⚠️ Orientações Pós-Retorno</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-amber-50/90">
              {RETURN_GUIDANCE.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-[2px]">▸</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 text-slate-100 ring-slate-700">
          <CardHeader>
            <CardTitle className="text-2xl">Calendário Semanal + Logs</CardTitle>
            <CardDescription className="text-sm text-slate-300">
              Registre reps, peso, duração e observações. Tudo fica salvo localmente via IndexedDB.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="min-w-48 space-y-1.5">
                <label className="text-xs uppercase tracking-[0.08em] text-slate-400">Semana</label>
                <Input
                  type="week"
                  value={weekValue}
                  onChange={(event) => setWeekValue(event.target.value)}
                  className="border-slate-700 bg-slate-950/70 text-slate-100"
                />
              </div>
              <div className="min-w-56 space-y-1.5">
                <label className="text-xs uppercase tracking-[0.08em] text-slate-400">Modelo da Semana</label>
                <Select value={mode} onValueChange={(value) => setMode(value as WeekMode)}>
                  <SelectTrigger className="w-full border-slate-700 bg-slate-950/70 text-slate-100">
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
                const totalMinutes = dayLogs.reduce(
                  (minutes, log) => minutes + Number(log.durationMin || 0),
                  0
                )
                const planType = WEEK_PATTERNS[mode][index]

                return (
                  <button
                    key={dayISO}
                    type="button"
                    onClick={() => setSelectedDate(dayISO)}
                    className={[
                      "rounded-xl border border-slate-700 bg-slate-950/80 p-3 text-left transition hover:-translate-y-0.5 hover:border-sky-300/60",
                      getCalendarTypeClasses(planType),
                      selectedDate === dayISO ? "border-sky-300 ring-2 ring-sky-300/40" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <p className="text-[11px] uppercase tracking-[0.08em] text-slate-400">{WEEKDAY_LABELS[index]}</p>
                    <p className="mt-1 text-lg font-semibold text-slate-100">{formatDateBR(day)}</p>
                    <p className="mt-1 text-xs text-slate-300">Planejado: {TYPE_LABELS[planType]}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {dayLogs.length ? `${dayLogs.length} log(s) · ${totalMinutes} min` : "Sem registros"}
                    </p>
                  </button>
                )
              })}
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <Card className="bg-slate-950/80 text-slate-100 ring-slate-700">
                <CardContent className="space-y-1 py-4">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-slate-400">Sessões</p>
                  <p className="text-2xl font-bold">{summary.totalSessions}</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-950/80 text-slate-100 ring-slate-700">
                <CardContent className="space-y-1 py-4">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-slate-400">Minutos Totais</p>
                  <p className="text-2xl font-bold">{summary.totalMinutes}</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-950/80 text-slate-100 ring-slate-700">
                <CardContent className="space-y-1 py-4">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-slate-400">Push / Pull / Legs</p>
                  <p className="text-2xl font-bold">
                    {summary.totalPush} / {summary.totalPull} / {summary.totalLegs}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-slate-950/80 text-slate-100 ring-slate-700">
              <CardContent className="py-4">
                {!selectedLogs.length ? (
                  <p className="text-sm text-slate-300">
                    Sem registros em {selectedDate ? formatISOToBR(selectedDate) : "-"}. Use os formulários abaixo
                    para salvar treinos.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedLogs.map((log) => (
                      <article key={log.id ?? log.createdAt} className="rounded-xl border border-slate-700 bg-slate-900/90 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <strong className="text-slate-100">
                            {log.workoutLabel || TYPE_LABELS[log.workoutType] || "Treino"}
                          </strong>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-300">{log.durationMin} min</span>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                void handleDeleteLog(log.id)
                              }}
                            >
                              Excluir
                            </Button>
                          </div>
                        </div>
                        {log.notes ? <p className="mt-2 text-sm text-slate-300">{log.notes}</p> : null}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {(log.exercises.length ? log.exercises : [{ name: "Sem exercícios detalhados", sets: 0, reps: 0, weight: 0 }]).map(
                            (exercise) => {
                              const parts = []
                              if (exercise.sets) parts.push(`${exercise.sets}s`)
                              if (exercise.reps) parts.push(`${exercise.reps}r`)
                              if (exercise.weight) parts.push(`${exercise.weight}kg`)

                              return (
                                <Badge
                                  key={`${log.createdAt}-${exercise.name}-${parts.join("-")}`}
                                  variant="outline"
                                  className="border-slate-700 text-slate-200"
                                >
                                  {exercise.name}
                                  {parts.length ? ` (${parts.join(" / ")})` : ""}
                                </Badge>
                              )
                            }
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        <section className="space-y-6">
          {WORKOUTS.map((workout) => {
            const form = forms[workout.type]
            const styles = WORKOUT_STYLES[workout.type]

            return (
              <Card
                key={workout.type}
                className={`overflow-hidden bg-slate-900/80 text-slate-100 ring-slate-700 ${styles.border}`}
              >
                <CardHeader className="border-b border-slate-700 pb-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-2">
                      <CardTitle className="flex items-center gap-2 text-2xl">
                        <span>{workout.emoji}</span>
                        <span>{workout.title}</span>
                      </CardTitle>
                      <Badge className={styles.badge}>{workout.badge}</Badge>
                    </div>
                    <p className="text-sm text-slate-300">⏱ {workout.duration}</p>
                  </div>
                </CardHeader>

                <CardContent className="px-0">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-slate-800/85 text-xs uppercase tracking-[0.06em] text-slate-400">
                        <tr>
                          <th className="px-6 py-3">Exercício</th>
                          <th className="px-6 py-3">Séries × Reps</th>
                          <th className="px-6 py-3">Descanso</th>
                          <th className="px-6 py-3">Observações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {workout.exercises.map((exercise) => (
                          <tr key={exercise.name} className="border-t border-slate-700/70 hover:bg-slate-800/60">
                            <td className="space-y-1 px-6 py-4">
                              <p className="font-semibold text-slate-100">{exercise.name}</p>
                              <p className="text-xs text-slate-300">{exercise.detail}</p>
                              <Badge variant="outline" className="border-sky-300/40 text-[10px] text-sky-200">
                                {exercise.type}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 font-semibold text-slate-100">{exercise.setsReps}</td>
                            <td className="px-6 py-4 text-slate-300">{exercise.rest}</td>
                            <td className="px-6 py-4 text-slate-300">{exercise.notes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="border-t border-slate-700 bg-slate-950/35 p-5">
                    <details className="rounded-xl border border-slate-700 bg-slate-900/70">
                      <summary className="cursor-pointer px-4 py-3 font-semibold text-slate-100">
                        Registrar Sessão - {workout.label}
                      </summary>
                      <div className="space-y-4 border-t border-slate-700 p-4">
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-1.5">
                            <label className="text-xs uppercase tracking-[0.08em] text-slate-400">Data</label>
                            <Input
                              type="date"
                              value={form.date}
                              onChange={(event) =>
                                updateFormField(workout.type, "date", event.target.value)
                              }
                              className="border-slate-700 bg-slate-950/70 text-slate-100"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs uppercase tracking-[0.08em] text-slate-400">
                              Duração (min)
                            </label>
                            <Input
                              type="number"
                              min={1}
                              step={1}
                              value={form.duration}
                              onChange={(event) =>
                                updateFormField(workout.type, "duration", event.target.value)
                              }
                              placeholder="Ex: 82"
                              className="border-slate-700 bg-slate-950/70 text-slate-100"
                            />
                          </div>
                          <div className="space-y-1.5 md:col-span-2">
                            <label className="text-xs uppercase tracking-[0.08em] text-slate-400">
                              Observações
                            </label>
                            <Textarea
                              value={form.notes}
                              onChange={(event) =>
                                updateFormField(workout.type, "notes", event.target.value)
                              }
                              placeholder="Como foi o treino, técnica, fadiga, dor, etc."
                              className="min-h-24 border-slate-700 bg-slate-950/70 text-slate-100"
                            />
                          </div>
                        </div>

                        <div className="overflow-x-auto rounded-lg border border-slate-700">
                          <table className="min-w-full text-left text-sm">
                            <thead className="bg-slate-950/90 text-xs uppercase tracking-[0.06em] text-slate-400">
                              <tr>
                                <th className="px-3 py-2">Exercício</th>
                                <th className="px-3 py-2">Sets</th>
                                <th className="px-3 py-2">Reps</th>
                                <th className="px-3 py-2">Peso (kg)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {workout.exercises.map((exercise, rowIndex) => (
                                <tr key={exercise.name} className="border-t border-slate-700/70">
                                  <td className="px-3 py-2 text-xs text-slate-200 sm:text-sm">{exercise.name}</td>
                                  <td className="px-3 py-2">
                                    <Input
                                      type="number"
                                      min={0}
                                      step={1}
                                      value={form.rows[rowIndex].sets}
                                      onChange={(event) =>
                                        updateExerciseField(
                                          workout.type,
                                          rowIndex,
                                          "sets",
                                          event.target.value
                                        )
                                      }
                                      placeholder="sets"
                                      className="h-8 border-slate-700 bg-slate-950/70 text-slate-100"
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <Input
                                      type="number"
                                      min={0}
                                      step={1}
                                      value={form.rows[rowIndex].reps}
                                      onChange={(event) =>
                                        updateExerciseField(
                                          workout.type,
                                          rowIndex,
                                          "reps",
                                          event.target.value
                                        )
                                      }
                                      placeholder="reps"
                                      className="h-8 border-slate-700 bg-slate-950/70 text-slate-100"
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <Input
                                      type="number"
                                      min={0}
                                      step={0.5}
                                      value={form.rows[rowIndex].weight}
                                      onChange={(event) =>
                                        updateExerciseField(
                                          workout.type,
                                          rowIndex,
                                          "weight",
                                          event.target.value
                                        )
                                      }
                                      placeholder="kg"
                                      className="h-8 border-slate-700 bg-slate-950/70 text-slate-100"
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            onClick={() => {
                              void handleSaveLog(workout)
                            }}
                          >
                            Salvar no IndexedDB
                          </Button>
                          <Button variant="outline" onClick={() => handleClearForm(workout.type)}>
                            Limpar Campos
                          </Button>
                          {form.status ? (
                            <span
                              className={
                                form.status.kind === "error"
                                  ? "text-sm text-rose-300"
                                  : "text-sm text-emerald-300"
                              }
                            >
                              {form.status.message}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </details>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {TIPS.map((tip) => (
            <Card key={tip.title} className="bg-slate-900/80 text-slate-100 ring-slate-700">
              <CardHeader>
                <CardTitle className="text-lg text-sky-200">{tip.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-slate-300">
                  {tip.items.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-[2px] text-emerald-300">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </section>

        <footer className="space-y-1 pb-4 text-center text-sm text-slate-400">
          <p>
            💪 Plano criado para retorno gradual após pausa de 2 semanas | Adaptável conforme evolução
            individual
          </p>
          <p className="text-xs">
            ⚠️ Consulte um profissional de educação física para ajustes personalizados.
          </p>
        </footer>
      </div>
    </main>
  )
}

export default App
