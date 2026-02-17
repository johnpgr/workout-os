import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { startSyncRuntime, subscribeSyncEvents } from "@/lib/sync"

export function SyncRuntimeBridge() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const stopRuntime = startSyncRuntime()
    const unsubscribe = subscribeSyncEvents((event) => {
      if (event.type === "pull-applied" && event.changedRows > 0) {
        void queryClient.invalidateQueries()
      }
    })

    return () => {
      unsubscribe()
      stopRuntime()
    }
  }, [queryClient])

  return null
}
