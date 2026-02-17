import { parseDate } from "@/lib/temporal"
import type { SessionWithSets } from "@/lib/training-types"
import type { MuscleGroup } from "@/features/training/types"

const TARGET_MIN = 10
const TARGET_MAX = 20

const EXERCISE_TO_MUSCLE_GROUP: Record<string, MuscleGroup> = {
  "Supino Reto (Barra)": "chest",
  "Supino Inclinado (Halteres)": "chest",
  "Remada Curvada": "back",
  "Remada Sentada": "back",
  "Barra Fixa": "back",
  "Puxada Frontal": "back",
  "Desenvolvimento Militar": "shoulders",
  "Elevação Lateral": "shoulders",
  Facepull: "shoulders",
  "Rosca Direta": "biceps",
  "Tríceps Corda": "triceps",
  "Tríceps Paralelas": "triceps",
  "Agachamento Livre": "quads",
  "Agachamento Frontal": "quads",
  "Leg Press": "quads",
  "Levantamento Terra Romeno": "hamstrings",
  "Stiff com Halteres": "hamstrings",
  "Mesa Flexora": "hamstrings",
  "Afundo Caminhando": "glutes",
  "Panturrilha em Pé": "calves",
}

export function getVolumeBandStatus(setCount: number): "low" | "target" | "high" {
  if (setCount < TARGET_MIN) {
    return "low"
  }

  if (setCount <= TARGET_MAX) {
    return "target"
  }

  return "high"
}

function resolveMuscleGroup(exerciseName: string): MuscleGroup {
  if (EXERCISE_TO_MUSCLE_GROUP[exerciseName]) {
    return EXERCISE_TO_MUSCLE_GROUP[exerciseName]
  }

  const normalized = exerciseName.toLowerCase()

  if (normalized.includes("supino") || normalized.includes("crossover")) return "chest"
  if (normalized.includes("remada") || normalized.includes("puxada") || normalized.includes("barra")) return "back"
  if (normalized.includes("ombro") || normalized.includes("elevação") || normalized.includes("facepull")) return "shoulders"
  if (normalized.includes("rosca")) return "biceps"
  if (normalized.includes("tríceps") || normalized.includes("triceps")) return "triceps"
  if (normalized.includes("agach") || normalized.includes("leg press") || normalized.includes("extensora")) return "quads"
  if (normalized.includes("romeno") || normalized.includes("stiff") || normalized.includes("flexora")) return "hamstrings"
  if (normalized.includes("afundo") || normalized.includes("glúte") || normalized.includes("glute")) return "glutes"
  return "calves"
}

function getIsoWeekKey(dateISO: string): string {
  const date = parseDate(dateISO)
  const week = String(date.weekOfYear).padStart(2, "0")
  return `${date.yearOfWeek}-W${week}`
}

export function calculateVolumeByMuscle(sessions: SessionWithSets[]): Array<{
  muscleGroup: MuscleGroup
  sets: number
  status: "low" | "target" | "high"
}> {
  const totals = new Map<MuscleGroup, number>()

  for (const session of sessions) {
    for (const set of session.sets) {
      if (set.deletedAt !== null || set.reps <= 0) {
        continue
      }

      const muscle = resolveMuscleGroup(set.exerciseName)
      totals.set(muscle, (totals.get(muscle) ?? 0) + 1)
    }
  }

  return [...totals.entries()]
    .map(([muscleGroup, sets]) => ({
      muscleGroup,
      sets,
      status: getVolumeBandStatus(sets),
    }))
    .sort((a, b) => a.muscleGroup.localeCompare(b.muscleGroup))
}

export function calculateWeeklyVolumeLoadTrend(sessions: SessionWithSets[]): Array<{
  week: string
  volumeLoad: number
}> {
  const totals = new Map<string, number>()

  for (const session of sessions) {
    const weekKey = getIsoWeekKey(session.session.date)
    const load = session.sets.reduce((sum, set) => sum + set.weightKg * set.reps, 0)
    totals.set(weekKey, (totals.get(weekKey) ?? 0) + load)
  }

  return [...totals.entries()]
    .map(([week, volumeLoad]) => ({ week, volumeLoad: Number(volumeLoad.toFixed(2)) }))
    .sort((a, b) => a.week.localeCompare(b.week))
}
