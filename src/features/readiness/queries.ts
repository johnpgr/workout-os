import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  getLatestReadinessLog,
  getReadinessLogsByDateRange,
  saveReadinessLog,
  type SaveReadinessInput,
} from "@/lib/training-db"
import { scheduleSync } from "@/lib/sync"

const READINESS_QUERY_KEY = ["readiness"] as const

export function useLatestReadinessQuery() {
  return useQuery({
    queryKey: [...READINESS_QUERY_KEY, "latest"],
    queryFn: getLatestReadinessLog,
  })
}

export function useReadinessRangeQuery(startDateISO: string, endDateISO: string) {
  return useQuery({
    queryKey: [...READINESS_QUERY_KEY, "range", startDateISO, endDateISO],
    queryFn: async () => getReadinessLogsByDateRange(startDateISO, endDateISO),
  })
}

export function useSaveReadinessMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: SaveReadinessInput) => saveReadinessLog(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: READINESS_QUERY_KEY })
      scheduleSync("mutation")
    },
  })
}
