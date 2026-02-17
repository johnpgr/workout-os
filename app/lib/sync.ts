import { useEffect, useState } from "react"
import { Temporal } from "@/lib/temporal"
import type { Database } from "@/types/database"
import {
  applyPulledChanges,
  getDirtyRowCount,
  getDirtySnapshot,
  getSyncState,
  markRowsSynced,
  setSyncState,
  type DirtySnapshot,
  type PulledChangesPayload,
  type SyncedIdsByTable,
} from "@/lib/training-db"
import { supabase } from "@/lib/supabase"

const SYNC_CURSOR_KEY = "cursor"
const SYNC_LAST_SYNC_AT_KEY = "last_sync_at"
const SYNC_LAST_ERROR_KEY = "last_error"
const SYNC_RETRY_COUNT_KEY = "retry_count"
const SYNC_NEXT_RETRY_AT_KEY = "next_retry_at"

const ADAPTIVE_INTERVALS = [60_000, 300_000, 900_000]
const RETRY_STEPS = [1_000, 2_000, 4_000, 8_000, 15_000, 30_000, 60_000, 120_000, 300_000]
const MIN_SYNC_GAP_MS = 10_000

type SyncPushPayload = Database["public"]["Functions"]["sync_push"]["Args"]["payload"]

interface SyncStatus {
  isSyncing: boolean
  isOnline: boolean
  lastSyncAt: string | null
  syncError: string | null
  pendingChanges: number
  storageChecked: boolean
  storagePersisted: boolean | null
  isIOS: boolean
}

interface PullAppliedEvent {
  type: "pull-applied"
  changedRows: number
}

type SyncEvent = PullAppliedEvent

type SyncTrigger = "startup" | "mutation" | "online" | "visibility" | "auth" | "manual" | "adaptive" | "retry"

const syncStatusListeners = new Set<(status: SyncStatus) => void>()
const syncEventListeners = new Set<(event: SyncEvent) => void>()

let status: SyncStatus = {
  isSyncing: false,
  isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
  lastSyncAt: null,
  syncError: null,
  pendingChanges: 0,
  storageChecked: false,
  storagePersisted: null,
  isIOS: false,
}

let inFlightSync: Promise<void> | null = null
let scheduledSyncTimer: ReturnType<typeof setTimeout> | null = null
let adaptiveTimer: ReturnType<typeof setTimeout> | null = null
let runtimeStarted = false
let adaptiveIntervalIndex = 0
let lastSyncStartTs = 0

function nowISO(): string {
  return Temporal.Now.instant().toString()
}

function detectIOS(): boolean {
  if (typeof navigator === "undefined") {
    return false
  }

  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

function updateStatus(patch: Partial<SyncStatus>) {
  status = {
    ...status,
    ...patch,
  }

  for (const listener of syncStatusListeners) {
    listener(status)
  }
}

function emitSyncEvent(event: SyncEvent) {
  for (const listener of syncEventListeners) {
    listener(event)
  }
}

function clearTimer(timer: ReturnType<typeof setTimeout> | null) {
  if (timer) {
    clearTimeout(timer)
  }
}

function countDirtyRows(snapshot: DirtySnapshot): number {
  return (
    snapshot.sessions.length +
    snapshot.exerciseSets.length +
    snapshot.readinessLogs.length +
    snapshot.weightLogs.length +
    snapshot.recommendations.length +
    snapshot.appSettings.length
  )
}

function normalizeSyncedIds(rawSyncedIds: unknown, snapshot: DirtySnapshot): SyncedIdsByTable {
  const fallback: SyncedIdsByTable = {
    sessions: snapshot.sessions.map((row) => row.id),
    exerciseSets: snapshot.exerciseSets.map((row) => row.id),
    readinessLogs: snapshot.readinessLogs.map((row) => row.id),
    weightLogs: snapshot.weightLogs.map((row) => row.id),
    recommendations: snapshot.recommendations.map((row) => row.id),
    appSettings: snapshot.appSettings.map((row) => row.id),
  }

  if (!rawSyncedIds || typeof rawSyncedIds !== "object") {
    return fallback
  }

  const syncedIds = rawSyncedIds as Record<string, unknown>

  const readIds = (camel: string, snake: string, fallbackIds: string[]): string[] => {
    const value = syncedIds[camel] ?? syncedIds[snake]
    if (!Array.isArray(value)) {
      return fallbackIds
    }

    return value.filter((item): item is string => typeof item === "string")
  }

  return {
    sessions: readIds("sessions", "sessions", fallback.sessions ?? []),
    exerciseSets: readIds("exerciseSets", "exercise_sets", fallback.exerciseSets ?? []),
    readinessLogs: readIds("readinessLogs", "readiness_logs", fallback.readinessLogs ?? []),
    weightLogs: readIds("weightLogs", "weight_logs", fallback.weightLogs ?? []),
    recommendations: readIds("recommendations", "recommendations", fallback.recommendations ?? []),
    appSettings: readIds("appSettings", "app_settings", fallback.appSettings ?? []),
  }
}

function parsePullPayload(rawData: unknown): PulledChangesPayload {
  const data = rawData && typeof rawData === "object" ? (rawData as Record<string, unknown>) : {}

  const readArray = <T,>(camel: string, snake: string): T[] => {
    const value = data[camel] ?? data[snake]
    return Array.isArray(value) ? (value as T[]) : []
  }

  const serverTime = typeof data.server_time === "string" ? data.server_time : nowISO()

  return {
    sessions: readArray("sessions", "sessions"),
    exerciseSets: readArray("exerciseSets", "exercise_sets"),
    readinessLogs: readArray("readinessLogs", "readiness_logs"),
    weightLogs: readArray("weightLogs", "weight_logs"),
    recommendations: readArray("recommendations", "recommendations"),
    appSettings: readArray("appSettings", "app_settings"),
    serverTime,
  }
}

async function refreshPendingChanges() {
  const pendingChanges = await getDirtyRowCount()
  updateStatus({ pendingChanges })
  return pendingChanges
}

async function getRetryCount(): Promise<number> {
  const rawValue = await getSyncState(SYNC_RETRY_COUNT_KEY)
  const parsed = Number(rawValue)
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0
  }
  return Math.floor(parsed)
}

async function setRetryCount(value: number) {
  await setSyncState(SYNC_RETRY_COUNT_KEY, String(value))
}

function getBackoffDelay(retryCount: number): number {
  return RETRY_STEPS[Math.min(retryCount, RETRY_STEPS.length - 1)] ?? RETRY_STEPS[RETRY_STEPS.length - 1] ?? 60_000
}

function scheduleAdaptiveSync() {
  clearTimer(adaptiveTimer)

  if (typeof document === "undefined" || document.visibilityState !== "visible") {
    return
  }

  const delay = ADAPTIVE_INTERVALS[Math.min(adaptiveIntervalIndex, ADAPTIVE_INTERVALS.length - 1)] ?? ADAPTIVE_INTERVALS[0]
  adaptiveTimer = setTimeout(() => {
    void syncNow("adaptive")
  }, delay)
}

function scheduleRetrySync(delayMs: number) {
  clearTimer(scheduledSyncTimer)
  scheduledSyncTimer = setTimeout(() => {
    void syncNow("retry")
  }, delayMs)
}

export function subscribeSyncEvents(listener: (event: SyncEvent) => void) {
  syncEventListeners.add(listener)

  return () => {
    syncEventListeners.delete(listener)
  }
}

export function subscribeSyncStatus(listener: (nextStatus: SyncStatus) => void) {
  syncStatusListeners.add(listener)
  listener(status)

  return () => {
    syncStatusListeners.delete(listener)
  }
}

export function getSyncStatusSnapshot(): SyncStatus {
  return status
}

export async function checkStoragePersistence() {
  const isIOS = detectIOS()

  if (typeof navigator === "undefined" || !navigator.storage) {
    updateStatus({ storageChecked: true, storagePersisted: null, isIOS })
    return { storageChecked: true, storagePersisted: null, isIOS }
  }

  let persisted = false

  if (typeof navigator.storage.persisted === "function") {
    persisted = await navigator.storage.persisted()
  }

  if (!persisted && typeof navigator.storage.persist === "function") {
    persisted = await navigator.storage.persist()
  }

  updateStatus({
    storageChecked: true,
    storagePersisted: persisted,
    isIOS,
  })

  return {
    storageChecked: true,
    storagePersisted: persisted,
    isIOS,
  }
}

export async function pushToCloud() {
  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user

  if (!user) {
    return { pushedRows: 0 }
  }

  const snapshot = await getDirtySnapshot()
  const pendingRows = countDirtyRows(snapshot)

  if (pendingRows === 0) {
    return { pushedRows: 0 }
  }

  const { data, error } = await supabase.rpc("sync_push", {
    payload: snapshot as unknown as SyncPushPayload,
  })

  if (error) {
    throw error
  }

  const response = data && typeof data === "object" ? (data as Record<string, unknown>) : {}
  const serverTime = typeof response.server_time === "string" ? response.server_time : nowISO()
  const syncedIds = normalizeSyncedIds(response.synced_ids, snapshot)

  await markRowsSynced(syncedIds, serverTime, user.id)

  return {
    pushedRows: pendingRows,
    serverTime,
  }
}

export async function pullFromCloud() {
  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user

  if (!user) {
    return { pulledRows: 0 }
  }

  const cursor = (await getSyncState(SYNC_CURSOR_KEY)) ?? "1970-01-01T00:00:00.000Z"

  const { data, error } = await supabase.rpc("sync_pull", {
    since_server_time: cursor,
  })

  if (error) {
    throw error
  }

  const payload = parsePullPayload(data)

  const pulledRows =
    (payload.sessions?.length ?? 0) +
    (payload.exerciseSets?.length ?? 0) +
    (payload.readinessLogs?.length ?? 0) +
    (payload.weightLogs?.length ?? 0) +
    (payload.recommendations?.length ?? 0) +
    (payload.appSettings?.length ?? 0)

  if (pulledRows > 0) {
    await applyPulledChanges(payload)
    emitSyncEvent({ type: "pull-applied", changedRows: pulledRows })
  }

  const serverTime = payload.serverTime ?? nowISO()
  await setSyncState(SYNC_CURSOR_KEY, serverTime)

  return {
    pulledRows,
    serverTime,
  }
}

export async function syncNow(_trigger: SyncTrigger = "manual", force = false): Promise<void> {
  if (inFlightSync) {
    return inFlightSync
  }

  const nowTs = Date.now()
  if (!force && nowTs - lastSyncStartTs < MIN_SYNC_GAP_MS) {
    const retryDelay = Math.max(250, MIN_SYNC_GAP_MS - (nowTs - lastSyncStartTs))
    scheduleRetrySync(retryDelay)
    return
  }

  const run = async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      updateStatus({ isOnline: false })
      return
    }

    const { data: authData } = await supabase.auth.getUser()
    if (!authData.user) {
      updateStatus({ syncError: null })
      return
    }

    lastSyncStartTs = Date.now()
    updateStatus({
      isSyncing: true,
      isOnline: true,
      syncError: null,
    })

    try {
      const pushResult = await pushToCloud()
      const pullResult = await pullFromCloud()
      const pendingChanges = await refreshPendingChanges()
      const lastSyncAt = pullResult.serverTime ?? pushResult.serverTime ?? nowISO()

      await Promise.all([
        setSyncState(SYNC_LAST_SYNC_AT_KEY, lastSyncAt),
        setSyncState(SYNC_LAST_ERROR_KEY, ""),
        setSyncState(SYNC_NEXT_RETRY_AT_KEY, ""),
        setRetryCount(0),
      ])

      updateStatus({
        lastSyncAt,
        syncError: null,
        pendingChanges,
      })

      if (pendingChanges > 0 || pullResult.pulledRows > 0) {
        adaptiveIntervalIndex = 0
      } else {
        adaptiveIntervalIndex = Math.min(adaptiveIntervalIndex + 1, ADAPTIVE_INTERVALS.length - 1)
      }

      scheduleAdaptiveSync()
    } catch (error) {
      const retryCount = (await getRetryCount()) + 1
      await setRetryCount(retryCount)

      const retryDelay = getBackoffDelay(retryCount)
      const nextRetryAt = Temporal.Now.instant().add({ milliseconds: retryDelay }).toString()
      const message = error instanceof Error ? error.message : "Falha na sincronização"

      await Promise.all([
        setSyncState(SYNC_LAST_ERROR_KEY, message),
        setSyncState(SYNC_NEXT_RETRY_AT_KEY, nextRetryAt),
      ])

      updateStatus({
        syncError: message,
      })

      scheduleRetrySync(retryDelay)
    } finally {
      const lastSyncAt = await getSyncState(SYNC_LAST_SYNC_AT_KEY)
      const syncError = await getSyncState(SYNC_LAST_ERROR_KEY)
      const pendingChanges = await refreshPendingChanges()

      updateStatus({
        isSyncing: false,
        lastSyncAt,
        syncError: syncError || null,
        pendingChanges,
      })
    }
  }

  inFlightSync = run().finally(() => {
    inFlightSync = null
  })

  return inFlightSync
}

export function scheduleSync(trigger: SyncTrigger = "manual") {
  clearTimer(scheduledSyncTimer)

  const delayMs = trigger === "mutation" ? 5_000 : 500

  scheduledSyncTimer = setTimeout(() => {
    void syncNow(trigger)
  }, delayMs)
}

export function startSyncRuntime() {
  if (runtimeStarted || typeof window === "undefined") {
    return () => undefined
  }

  runtimeStarted = true

  const onOnline = () => {
    updateStatus({ isOnline: true })
    scheduleSync("online")
  }

  const onOffline = () => {
    updateStatus({ isOnline: false })
  }

  const onVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      scheduleSync("visibility")
      scheduleAdaptiveSync()
      return
    }

    clearTimer(adaptiveTimer)
  }

  window.addEventListener("online", onOnline)
  window.addEventListener("offline", onOffline)
  document.addEventListener("visibilitychange", onVisibilityChange)

  void checkStoragePersistence()
  void refreshPendingChanges()
  scheduleSync("startup")

  return () => {
    runtimeStarted = false
    clearTimer(adaptiveTimer)
    clearTimer(scheduledSyncTimer)

    window.removeEventListener("online", onOnline)
    window.removeEventListener("offline", onOffline)
    document.removeEventListener("visibilitychange", onVisibilityChange)
  }
}

export function useSyncStatus() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() => getSyncStatusSnapshot())

  useEffect(() => {
    return subscribeSyncStatus(setSyncStatus)
  }, [])

  return {
    ...syncStatus,
    syncNow: () => syncNow("manual", true),
  }
}
