import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  addRecommendationIfMissing,
  getCachedExerciseCatalog,
  getAllSessionsWithSets,
  getLastSessionByWorkoutType,
  getRecommendations,
  getRecentSessionsByWorkoutType,
  getSessionsByDateRange,
  replaceExerciseCatalogCache,
  getSetting,
  saveSessionWithSets,
  setSetting,
  softDeleteSession,
  updateRecommendationStatus,
  type SaveSessionInput,
} from "@/lib/training-db"
import type {
  AppSettingKey,
  RecommendationStatus,
  SplitType,
  WorkoutType,
} from "@/lib/training-types"
import type { ExerciseCatalogItem } from "@/features/training/types"
import {
  toCatalogCacheEntry,
  toCatalogItem,
} from "@/features/training/exercise-catalog"
import { buildProgressionSuggestion } from "@/features/training/rpe-utils"
import { scheduleSync } from "@/lib/sync"
import { supabase } from "@/lib/supabase"

const SESSIONS_QUERY_KEY = ["training-sessions"] as const
const SETTINGS_QUERY_KEY = ["app-settings"] as const
const RECOMMENDATIONS_QUERY_KEY = ["recommendations"] as const
const EXERCISE_CATALOG_QUERY_KEY = ["exercise-catalog"] as const

export function useWeekSessionsQuery(startDateISO: string | undefined, endDateISO: string | undefined) {
  return useQuery({
    queryKey: [...SESSIONS_QUERY_KEY, "week", startDateISO, endDateISO],
    enabled: Boolean(startDateISO && endDateISO),
    queryFn: async () => {
      if (!startDateISO || !endDateISO) {
        return []
      }

      return getSessionsByDateRange(startDateISO, endDateISO)
    },
  })
}

export function useAllSessionsQuery() {
  return useQuery({
    queryKey: [...SESSIONS_QUERY_KEY, "all"],
    queryFn: getAllSessionsWithSets,
  })
}

export function useLastSessionQuery(workoutType: WorkoutType, splitType: SplitType) {
  return useQuery({
    queryKey: [...SESSIONS_QUERY_KEY, "last", splitType, workoutType],
    queryFn: async () => getLastSessionByWorkoutType(workoutType, splitType),
  })
}

export function useExerciseCatalogQuery() {
  return useQuery({
    queryKey: EXERCISE_CATALOG_QUERY_KEY,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<ExerciseCatalogItem[]> => {
      const cachedRows = await getCachedExerciseCatalog()
      const cachedItems = cachedRows
        .map((item) => toCatalogItem(item))
        .filter((item): item is ExerciseCatalogItem => item !== null && item.isActive)

      const { data, error } = await supabase
        .from("exercise_catalog")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true })

      if (error || !data) {
        return cachedItems
      }

      const cacheRows = data.map((row) => toCatalogCacheEntry(row))
      await replaceExerciseCatalogCache(cacheRows)

      return cacheRows
        .map((item) => toCatalogItem(item))
        .filter((item): item is ExerciseCatalogItem => item !== null && item.isActive)
    },
  })
}

export function useAddSessionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: SaveSessionInput) => saveSessionWithSets(payload),
    onSuccess: async (_, variables) => {
      const recentSessions = await getRecentSessionsByWorkoutType(
        variables.session.workoutType,
        variables.session.splitType,
        2
      )

      const suggestion = buildProgressionSuggestion(recentSessions)
      if (suggestion) {
        await addRecommendationIfMissing(suggestion)
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: RECOMMENDATIONS_QUERY_KEY }),
      ])
      scheduleSync("mutation")
    },
  })
}

export function useDeleteSessionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (sessionId: string) => {
      await softDeleteSession(sessionId)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY })
      scheduleSync("mutation")
    },
  })
}

export function useAppSettingQuery(key: AppSettingKey) {
  return useQuery({
    queryKey: [...SETTINGS_QUERY_KEY, key],
    queryFn: async () => getSetting(key),
  })
}

export function useSetAppSettingMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: { key: AppSettingKey; value: string }) => {
      await setSetting(payload.key, payload.value)
    },
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [...SETTINGS_QUERY_KEY, variables.key] }),
        queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY }),
      ])
      scheduleSync("mutation")
    },
  })
}

export function useRecommendationsQuery(status: RecommendationStatus | "all" = "pending") {
  return useQuery({
    queryKey: [...RECOMMENDATIONS_QUERY_KEY, status],
    queryFn: async () => getRecommendations(status === "all" ? undefined : status),
  })
}

export function useRecommendationStatusMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: { id: string; status: RecommendationStatus }) => {
      await updateRecommendationStatus(payload.id, payload.status)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: RECOMMENDATIONS_QUERY_KEY })
      scheduleSync("mutation")
    },
  })
}
