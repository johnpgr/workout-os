import type { ElementType } from "react"
import type {
  IntensificationTechnique,
  SplitType,
  WorkoutType,
} from "@/lib/training-types"

export type MuscleGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves"

export type PrimaryMuscle =
  | "lats"
  | "mid-back"
  | "lower-back"
  | "rear-delts"
  | "front-delts"
  | "side-delts"
  | "traps"
  | "pecs"
  | "upper-pecs"
  | "triceps-long-head"
  | "triceps-lateral-head"
  | "biceps-long-head"
  | "biceps-short-head"
  | "forearms"
  | "quads-rectus-femoris"
  | "quads-vastus"
  | "hamstrings-biceps-femoris"
  | "hamstrings-semitendinosus"
  | "glutes-maximus"
  | "glutes-medius"
  | "calves-gastrocnemius"
  | "calves-soleus"

export type PlannedType = WorkoutType | "rest"
export type WeekMode = "ppl-6" | "ppl-3" | "upper-lower-4"
export type ThemePreference = "light" | "dark" | "system"

export interface ExercisePlan {
  exerciseId?: string | null
  name: string
  detail: string
  type: "COMPOSTO" | "ISOLAMENTO"
  muscleGroup: MuscleGroup
  primaryMuscle?: PrimaryMuscle | null
  youtubeUrl?: string | null
  setsReps: string
  defaultSets: number
  rest: string
  notes: string
}

export interface ExerciseCatalogItem {
  id: string
  name: string
  detail: string
  muscleGroup: MuscleGroup
  primaryMuscle: PrimaryMuscle | null
  youtubeUrl: string | null
  isActive: boolean
  sortOrder: number
}

export interface WorkoutPlan {
  splitType: SplitType
  type: WorkoutType
  label: string
  title: string
  icon: ElementType
  badge: string
  focus: "strength" | "hypertrophy"
  duration: string
  exercises: ExercisePlan[]
}

export interface SplitConfig {
  type: SplitType
  label: string
  weekModes: WeekMode[]
  workouts: WorkoutPlan[]
}

export interface TipItem {
  title: string
  icon: ElementType
  items: string[]
}

export interface SetLogInput {
  weight: string
  reps: string
  rpe: string
  technique: IntensificationTechnique | ""
}

export interface ExerciseInput {
  exerciseId: string | null
  exerciseName: string
  videoUrl: string
  sets: SetLogInput[]
}

export type FormStatus =
  | {
      kind: "success" | "error"
      message: string
    }
  | null

export interface WeekSummary {
  totalSessions: number
  totalMinutes: number
  byWorkoutType: Partial<Record<WorkoutType, number>>
}
