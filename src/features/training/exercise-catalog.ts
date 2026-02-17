import type { ExerciseCatalogCacheEntry } from "@/lib/training-db"
import type {
  ExerciseCatalogItem,
  MuscleGroup,
  PrimaryMuscle,
} from "@/features/training/types"
import type { Database } from "@/types/database"

const MUSCLE_GROUP_VALUES: MuscleGroup[] = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "quads",
  "hamstrings",
  "glutes",
  "calves",
]

const PRIMARY_MUSCLE_VALUES: PrimaryMuscle[] = [
  "lats",
  "mid-back",
  "lower-back",
  "rear-delts",
  "front-delts",
  "side-delts",
  "traps",
  "pecs",
  "upper-pecs",
  "triceps-long-head",
  "triceps-lateral-head",
  "biceps-long-head",
  "biceps-short-head",
  "forearms",
  "quads-rectus-femoris",
  "quads-vastus",
  "hamstrings-biceps-femoris",
  "hamstrings-semitendinosus",
  "glutes-maximus",
  "glutes-medius",
  "calves-gastrocnemius",
  "calves-soleus",
]

const MUSCLE_GROUP_SET = new Set<string>(MUSCLE_GROUP_VALUES)
const PRIMARY_MUSCLE_SET = new Set<string>(PRIMARY_MUSCLE_VALUES)

export const PRIMARY_MUSCLE_LABELS: Record<PrimaryMuscle, string> = {
  lats: "Dorsal",
  "mid-back": "Costas médias",
  "lower-back": "Lombar",
  "rear-delts": "Deltoide posterior",
  "front-delts": "Deltoide anterior",
  "side-delts": "Deltoide lateral",
  traps: "Trapézio",
  pecs: "Peitoral",
  "upper-pecs": "Peitoral superior",
  "triceps-long-head": "Tríceps (cabeça longa)",
  "triceps-lateral-head": "Tríceps (cabeça lateral)",
  "biceps-long-head": "Bíceps (cabeça longa)",
  "biceps-short-head": "Bíceps (cabeça curta)",
  forearms: "Antebraço",
  "quads-rectus-femoris": "Reto femoral",
  "quads-vastus": "Vasto lateral/medial",
  "hamstrings-biceps-femoris": "Bíceps femoral",
  "hamstrings-semitendinosus": "Semitendíneo",
  "glutes-maximus": "Glúteo máximo",
  "glutes-medius": "Glúteo médio",
  "calves-gastrocnemius": "Gastrocnêmio",
  "calves-soleus": "Sóleo",
}

export function isMuscleGroup(value: string): value is MuscleGroup {
  return MUSCLE_GROUP_SET.has(value)
}

export function isPrimaryMuscle(value: string | null): value is PrimaryMuscle {
  return Boolean(value && PRIMARY_MUSCLE_SET.has(value))
}

export function toCatalogCacheEntry(
  row: Database["public"]["Tables"]["exercise_catalog"]["Row"],
): ExerciseCatalogCacheEntry {
  return {
    id: row.id,
    name: row.name,
    detail: row.detail,
    muscleGroup: row.muscle_group,
    primaryMuscle: row.primary_muscle,
    youtubeUrl: row.youtube_url,
    isActive: row.is_active,
    sortOrder: row.sort_order,
    updatedAt: row.updated_at,
  }
}

export function toCatalogItem(
  row: ExerciseCatalogCacheEntry,
): ExerciseCatalogItem | null {
  if (!isMuscleGroup(row.muscleGroup)) {
    return null
  }

  return {
    id: row.id,
    name: row.name,
    detail: row.detail,
    muscleGroup: row.muscleGroup,
    primaryMuscle: isPrimaryMuscle(row.primaryMuscle) ? row.primaryMuscle : null,
    youtubeUrl: row.youtubeUrl,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
  }
}

export function normalizeExerciseName(value: string): string {
  return value.trim().toLocaleLowerCase("pt-BR")
}
