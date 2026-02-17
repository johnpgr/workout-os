export type WorkoutType = "push" | "pull" | "leg"

export interface SessionExerciseLog {
  name: string
  sets: number
  reps: number
  weight: number
}

export interface SessionLog {
  id?: number
  workoutType: WorkoutType
  workoutLabel: string
  date: string
  durationMin: number
  notes: string
  exercises: SessionExerciseLog[]
  createdAt: string
}
