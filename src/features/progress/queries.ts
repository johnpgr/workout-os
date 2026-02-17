import { useAllSessionsQuery } from "@/features/training/queries"
import { getBestE1RMForExercise } from "@/features/progress/e1rm-utils"
import {
  calculateVolumeByMuscle,
  calculateWeeklyVolumeLoadTrend,
} from "@/features/progress/volume-utils"

export function useProgressSessionsQuery() {
  return useAllSessionsQuery()
}

export function useE1RMProgressQuery(exerciseName: string) {
  const sessionsQuery = useAllSessionsQuery()

  const data = sessionsQuery.data
    ? getBestE1RMForExercise(sessionsQuery.data, exerciseName)
    : []

  return {
    ...sessionsQuery,
    data,
  }
}

export function useWeeklyVolumeQuery() {
  const sessionsQuery = useAllSessionsQuery()

  const byMuscle = sessionsQuery.data
    ? calculateVolumeByMuscle(sessionsQuery.data)
    : []

  const trend = sessionsQuery.data
    ? calculateWeeklyVolumeLoadTrend(sessionsQuery.data)
    : []

  return {
    ...sessionsQuery,
    byMuscle,
    trend,
  }
}
