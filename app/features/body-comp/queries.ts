import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { getWeightLogs, saveWeightLog, type SaveWeightInput } from "@/lib/training-db"
import { scheduleSync } from "@/lib/sync"

const WEIGHT_QUERY_KEY = ["body-weight"] as const

export function useWeightLogsQuery() {
  return useQuery({
    queryKey: [...WEIGHT_QUERY_KEY, "all"],
    queryFn: getWeightLogs,
  })
}

export function useSaveWeightMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: SaveWeightInput) => saveWeightLog(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: WEIGHT_QUERY_KEY })
      scheduleSync("mutation")
    },
  })
}
