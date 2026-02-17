import type { ElementType } from "react"
import type { WorkoutType } from "@/lib/training-types"

export type PlannedType = WorkoutType | "rest"
export type WeekMode = "6" | "3"
export type ThemePreference = "light" | "dark" | "system"

export interface ExercisePlan {
  name: string
  detail: string
  type: "COMPOSTO" | "ISOLAMENTO"
  setsReps: string
  rest: string
  notes: string
}

export interface WorkoutPlan {
  type: WorkoutType
  label: string
  title: string
  icon: ElementType
  badge: string
  duration: string
  exercises: ExercisePlan[]
}

export interface TipItem {
  title: string
  icon: ElementType
  items: string[]
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
  totalPush: number
  totalPull: number
  totalLegs: number
}
