import type { SessionWithSets } from "@/lib/training-types"

export function calculateE1RM(weightKg: number, reps: number): number {
  if (!Number.isFinite(weightKg) || !Number.isFinite(reps) || reps <= 0 || reps >= 37) {
    return 0
  }

  return Number((weightKg * (36 / (37 - reps))).toFixed(2))
}

export function getBestE1RMForExercise(sessions: SessionWithSets[], exerciseName: string): Array<{ date: string; e1rm: number }> {
  return sessions
    .map((session) => {
      const e1rms = session.sets
        .filter((set) => set.exerciseName === exerciseName && set.weightKg > 0 && set.reps > 0)
        .map((set) => calculateE1RM(set.weightKg, set.reps))
        .filter((value) => value > 0)

      if (!e1rms.length) {
        return null
      }

      return {
        date: session.session.date,
        e1rm: Math.max(...e1rms),
      }
    })
    .filter((entry): entry is { date: string; e1rm: number } => entry !== null)
    .sort((a, b) => a.date.localeCompare(b.date))
}
