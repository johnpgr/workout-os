import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { SessionLog } from "@/lib/training-types"

const TRAINING_LOGS_QUERY_KEY = ["training-logs"] as const

export function useWeekLogsQuery(startDateISO: string | undefined, endDateISO: string | undefined) {
  return useQuery({
    queryKey: [...TRAINING_LOGS_QUERY_KEY, startDateISO, endDateISO],
    enabled: Boolean(startDateISO && endDateISO),
    queryFn: async () => {
      if (!startDateISO || !endDateISO) {
        return []
      }

      const { getLogsByDateRange } = await import("@/lib/training-db")
      return getLogsByDateRange(startDateISO, endDateISO)
    },
  })
}

export function useAddLogMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: Omit<SessionLog, "id">) => {
      const { addLog } = await import("@/lib/training-db")
      return addLog(payload)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: TRAINING_LOGS_QUERY_KEY })
    },
  })
}

export function useDeleteLogMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const { deleteLog } = await import("@/lib/training-db")
      await deleteLog(id)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: TRAINING_LOGS_QUERY_KEY })
    },
  })
}
