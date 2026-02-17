export type SplitType = "ppl" | "upper-lower"

export type PplWorkoutType = "push" | "pull" | "leg"
export type UpperLowerWorkoutType = "upper-a" | "upper-b" | "lower-a" | "lower-b"
export type WorkoutType = PplWorkoutType | UpperLowerWorkoutType

export type IntensificationTechnique = "dropset" | "rest-pause" | "superset" | "myo-reps"

export type RecommendationKind = "increase-load" | "increase-reps" | "reduce-intensity" | "consider-deload"
export type RecommendationStatus = "pending" | "accepted" | "ignored"
export type AppSettingKey =
  | "active-split"
  | "theme-preference"
  | "week-routine-template-v1"

export interface SyncMetadata {
  id: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  version: number
  ownerUserId?: string
  serverUpdatedAt?: string | null
  isDirty?: boolean
  lastSyncedAt?: string | null
}

export interface TrainingSession extends SyncMetadata {
  date: string
  splitType: SplitType
  workoutType: WorkoutType
  workoutLabel: string
  durationMin: number
  notes: string
}

export interface ExerciseSetLog extends SyncMetadata {
  sessionId: string
  date: string
  splitType: SplitType
  workoutType: WorkoutType
  exerciseId: string | null
  exerciseName: string
  exerciseOrder: number
  setOrder: number
  weightKg: number
  reps: number
  rpe: number | null
  rir: number | null
  technique: IntensificationTechnique | null
}

export interface SessionWithSets {
  session: TrainingSession
  sets: ExerciseSetLog[]
}

export interface ReadinessLog extends SyncMetadata {
  date: string
  sleepHours: number
  sleepQuality: number
  stress: number
  pain: number
  readinessScore: number
  notes: string
}

export interface WeightLog extends SyncMetadata {
  date: string
  weightKg: number
  notes: string
}

export interface Recommendation extends SyncMetadata {
  date: string
  splitType: SplitType | null
  workoutType: WorkoutType | null
  kind: RecommendationKind
  status: RecommendationStatus
  message: string
  reason: string
}

export interface AppSetting extends SyncMetadata {
  key: AppSettingKey
  value: string
}

export interface SyncStateRecord {
  key: string
  value: string
  updatedAt: string
}
