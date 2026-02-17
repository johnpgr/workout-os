import Dexie, { type Table } from "dexie"
import { v7 as uuidv7 } from "uuid"
import { Temporal } from "@/lib/temporal"
import type {
  AppSetting,
  AppSettingKey,
  ExerciseSetLog,
  ReadinessLog,
  Recommendation,
  RecommendationKind,
  RecommendationStatus,
  SessionWithSets,
  SplitType,
  SyncMetadata,
  SyncStateRecord,
  TrainingSession,
  WeightLog,
  WorkoutType,
} from "@/lib/training-types"

export type {
  AppSetting,
  ExerciseSetLog,
  ReadinessLog,
  Recommendation,
  RecommendationKind,
  RecommendationStatus,
  SessionWithSets,
  SplitType,
  SyncStateRecord,
  TrainingSession,
  WeightLog,
  WorkoutType,
} from "@/lib/training-types"

export interface SaveSessionInput {
  session: Omit<TrainingSession, "id" | "createdAt" | "updatedAt" | "deletedAt" | "version">
  sets: Array<{
    exerciseId: string | null
    exerciseName: string
    exerciseOrder: number
    setOrder: number
    weightKg: number
    reps: number
    rpe: number | null
    rir: number | null
    technique: ExerciseSetLog["technique"]
  }>
}

export interface SaveReadinessInput {
  date: string
  sleepHours: number
  sleepQuality: number
  stress: number
  pain: number
  readinessScore: number
  notes: string
}

export interface SaveWeightInput {
  date: string
  weightKg: number
  notes: string
}

export interface CreateRecommendationInput {
  date: string
  splitType: SplitType | null
  workoutType: WorkoutType | null
  kind: RecommendationKind
  status?: RecommendationStatus
  message: string
  reason: string
}

export interface DirtySnapshot {
  sessions: TrainingSession[]
  exerciseSets: ExerciseSetLog[]
  readinessLogs: ReadinessLog[]
  weightLogs: WeightLog[]
  recommendations: Recommendation[]
  appSettings: AppSetting[]
}

export interface PulledChangesPayload {
  sessions?: TrainingSession[]
  exerciseSets?: ExerciseSetLog[]
  readinessLogs?: ReadinessLog[]
  weightLogs?: WeightLog[]
  recommendations?: Recommendation[]
  appSettings?: AppSetting[]
  serverTime?: string
}

export interface SyncedIdsByTable {
  sessions?: string[]
  exerciseSets?: string[]
  readinessLogs?: string[]
  weightLogs?: string[]
  recommendations?: string[]
  appSettings?: string[]
}

export interface ExerciseCatalogCacheEntry {
  id: string
  name: string
  detail: string
  muscleGroup: string
  primaryMuscle: string | null
  youtubeUrl: string | null
  isActive: boolean
  sortOrder: number
  updatedAt: string
}

class TrainingLogsDatabase extends Dexie {
  sessions!: Table<TrainingSession, string>
  exerciseSets!: Table<ExerciseSetLog, string>
  readinessLogs!: Table<ReadinessLog, string>
  weightLogs!: Table<WeightLog, string>
  appSettings!: Table<AppSetting, string>
  recommendations!: Table<Recommendation, string>
  syncState!: Table<SyncStateRecord, string>
  exerciseCatalogCache!: Table<ExerciseCatalogCacheEntry, string>

  constructor() {
    super("treinos-training")

    this.version(1).stores({
      sessions: "&id, date, splitType, workoutType, updatedAt, deletedAt, isDirty",
      exercise_sets: "&id, sessionId, date, splitType, workoutType, exerciseName, updatedAt, deletedAt, isDirty",
      readiness_logs: "&id, date, updatedAt, deletedAt, isDirty",
      weight_logs: "&id, date, updatedAt, deletedAt, isDirty",
      app_settings: "&id, &key, updatedAt, isDirty",
      recommendations: "&id, date, status, kind, workoutType, updatedAt, deletedAt, isDirty",
      sync_state: "&key, updatedAt",
    })
    this.version(2).stores({
      sessions: "&id, date, splitType, workoutType, updatedAt, deletedAt, isDirty",
      exercise_sets: "&id, sessionId, date, splitType, workoutType, exerciseId, exerciseName, updatedAt, deletedAt, isDirty",
      readiness_logs: "&id, date, updatedAt, deletedAt, isDirty",
      weight_logs: "&id, date, updatedAt, deletedAt, isDirty",
      app_settings: "&id, &key, updatedAt, isDirty",
      recommendations: "&id, date, status, kind, workoutType, updatedAt, deletedAt, isDirty",
      sync_state: "&key, updatedAt",
      exercise_catalog_cache: "&id, muscleGroup, primaryMuscle, isActive, sortOrder, updatedAt",
    })

    this.sessions = this.table("sessions")
    this.exerciseSets = this.table("exercise_sets")
    this.readinessLogs = this.table("readiness_logs")
    this.weightLogs = this.table("weight_logs")
    this.appSettings = this.table("app_settings")
    this.recommendations = this.table("recommendations")
    this.syncState = this.table("sync_state")
    this.exerciseCatalogCache = this.table("exercise_catalog_cache")
  }
}

const db = new TrainingLogsDatabase()

function nowISO(): string {
  return Temporal.Now.instant().toString()
}

function createId(): string {
  return uuidv7()
}

function createSyncMeta(overrides?: Partial<SyncMetadata>): SyncMetadata {
  const timestamp = nowISO()
  return {
    id: createId(),
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
    version: 1,
    serverUpdatedAt: null,
    isDirty: true,
    lastSyncedAt: null,
    ...overrides,
  }
}

function touchVersion<T extends SyncMetadata>(record: T): T {
  return {
    ...record,
    updatedAt: nowISO(),
    version: record.version + 1,
    isDirty: true,
  }
}

function sortSessionsDescending(a: TrainingSession, b: TrainingSession): number {
  if (a.date !== b.date) {
    return a.date < b.date ? 1 : -1
  }
  return b.updatedAt.localeCompare(a.updatedAt)
}

function sortSets(a: ExerciseSetLog, b: ExerciseSetLog): number {
  if (a.exerciseOrder !== b.exerciseOrder) {
    return a.exerciseOrder - b.exerciseOrder
  }
  return a.setOrder - b.setOrder
}

function compareServerAuthority(local: SyncMetadata | undefined, incoming: SyncMetadata): number {
  if (!local) {
    return -1
  }

  const localServer = local.serverUpdatedAt ?? local.updatedAt
  const incomingServer = incoming.serverUpdatedAt ?? incoming.updatedAt

  if (incomingServer > localServer) {
    return -1
  }

  if (incomingServer < localServer) {
    return 1
  }

  if (incoming.version > local.version) {
    return -1
  }

  if (incoming.version < local.version) {
    return 1
  }

  if (incoming.updatedAt > local.updatedAt) {
    return -1
  }

  if (incoming.updatedAt < local.updatedAt) {
    return 1
  }

  return 0
}

async function getSetsBySessionIds(sessionIds: string[]): Promise<Map<string, ExerciseSetLog[]>> {
  if (!sessionIds.length) {
    return new Map()
  }

  const sets = await db.exerciseSets
    .where("sessionId")
    .anyOf(sessionIds)
    .filter((set) => set.deletedAt === null)
    .toArray()

  const grouped = new Map<string, ExerciseSetLog[]>()
  for (const set of sets.sort(sortSets)) {
    const current = grouped.get(set.sessionId) ?? []
    current.push(set)
    grouped.set(set.sessionId, current)
  }

  return grouped
}

async function markTableRowsSynced<T extends SyncMetadata>(table: Table<T, string>, ids: string[], serverTime: string, ownerUserId?: string) {
  if (!ids.length) {
    return
  }

  const rows = await table.where("id").anyOf(ids).toArray()
  if (!rows.length) {
    return
  }

  await table.bulkPut(
    rows.map((row) => ({
      ...row,
      isDirty: false,
      lastSyncedAt: serverTime,
      serverUpdatedAt: serverTime,
      ownerUserId: ownerUserId ?? row.ownerUserId,
    }))
  )
}

async function mergeTableRows<T extends SyncMetadata>(table: Table<T, string>, rows: T[], serverTime: string) {
  for (const incoming of rows) {
    const normalizedIncoming = {
      ...incoming,
      serverUpdatedAt: incoming.serverUpdatedAt ?? serverTime,
      isDirty: false,
      lastSyncedAt: serverTime,
    }

    const current = await table.get(incoming.id)
    const comparison = compareServerAuthority(current, normalizedIncoming)

    if (comparison <= 0) {
      await table.put(normalizedIncoming)
    }
  }
}

export async function saveSessionWithSets(input: SaveSessionInput): Promise<string> {
  const meta = createSyncMeta()

  const session: TrainingSession = {
    ...meta,
    date: input.session.date,
    splitType: input.session.splitType,
    workoutType: input.session.workoutType,
    workoutLabel: input.session.workoutLabel,
    durationMin: input.session.durationMin,
    notes: input.session.notes,
  }

  const setRecords: ExerciseSetLog[] = input.sets.map((set) => ({
    ...createSyncMeta(),
    sessionId: session.id,
    date: session.date,
    splitType: session.splitType,
    workoutType: session.workoutType,
    exerciseId: set.exerciseId,
    exerciseName: set.exerciseName,
    exerciseOrder: set.exerciseOrder,
    setOrder: set.setOrder,
    weightKg: set.weightKg,
    reps: set.reps,
    rpe: set.rpe,
    rir: set.rir,
    technique: set.technique,
  }))

  await db.transaction("rw", db.sessions, db.exerciseSets, async () => {
    await db.sessions.add(session)
    if (setRecords.length) {
      await db.exerciseSets.bulkAdd(setRecords)
    }
  })

  return session.id
}

export async function getSessionsByDateRange(startDateISO: string, endDateISO: string): Promise<SessionWithSets[]> {
  const sessions = await db.sessions
    .where("date")
    .between(startDateISO, endDateISO, true, true)
    .filter((session) => session.deletedAt === null)
    .toArray()

  sessions.sort(sortSessionsDescending)

  const setsBySession = await getSetsBySessionIds(sessions.map((session) => session.id))

  return sessions.map((session) => ({
    session,
    sets: setsBySession.get(session.id) ?? [],
  }))
}

export async function getAllSessionsWithSets(): Promise<SessionWithSets[]> {
  const sessions = await db.sessions.filter((session) => session.deletedAt === null).toArray()
  sessions.sort(sortSessionsDescending)

  const setsBySession = await getSetsBySessionIds(sessions.map((session) => session.id))

  return sessions.map((session) => ({
    session,
    sets: setsBySession.get(session.id) ?? [],
  }))
}

export async function getLastSessionByWorkoutType(
  workoutType: WorkoutType,
  splitType: SplitType
): Promise<SessionWithSets | null> {
  const sessions = await db.sessions
    .where("workoutType")
    .equals(workoutType)
    .filter((session) => session.splitType === splitType && session.deletedAt === null)
    .toArray()

  sessions.sort(sortSessionsDescending)
  const latest = sessions[0]

  if (!latest) {
    return null
  }

  const sets = await db.exerciseSets
    .where("sessionId")
    .equals(latest.id)
    .filter((set) => set.deletedAt === null)
    .toArray()

  return { session: latest, sets: sets.sort(sortSets) }
}

export async function getRecentSessionsByWorkoutType(
  workoutType: WorkoutType,
  splitType: SplitType,
  limit = 3
): Promise<SessionWithSets[]> {
  const sessions = await db.sessions
    .where("workoutType")
    .equals(workoutType)
    .filter((session) => session.splitType === splitType && session.deletedAt === null)
    .toArray()

  sessions.sort(sortSessionsDescending)
  const selected = sessions.slice(0, limit)
  const setsBySession = await getSetsBySessionIds(selected.map((session) => session.id))

  return selected.map((session) => ({
    session,
    sets: setsBySession.get(session.id) ?? [],
  }))
}

export async function softDeleteSession(sessionId: string): Promise<void> {
  await db.transaction("rw", db.sessions, db.exerciseSets, async () => {
    const session = await db.sessions.get(sessionId)

    if (!session || session.deletedAt !== null) {
      return
    }

    const deletedTimestamp = nowISO()
    await db.sessions.put({
      ...touchVersion(session),
      deletedAt: deletedTimestamp,
    })

    const sets = await db.exerciseSets.where("sessionId").equals(sessionId).filter((set) => set.deletedAt === null).toArray()
    if (!sets.length) {
      return
    }

    await db.exerciseSets.bulkPut(
      sets.map((set) => ({
        ...touchVersion(set),
        deletedAt: deletedTimestamp,
      }))
    )
  })
}

export async function saveReadinessLog(input: SaveReadinessInput): Promise<string> {
  const currentByDate = await db.readinessLogs
    .where("date")
    .equals(input.date)
    .filter((log) => log.deletedAt === null)
    .first()

  if (currentByDate) {
    await db.readinessLogs.put({
      ...touchVersion(currentByDate),
      sleepHours: input.sleepHours,
      sleepQuality: input.sleepQuality,
      stress: input.stress,
      pain: input.pain,
      readinessScore: input.readinessScore,
      notes: input.notes,
    })

    return currentByDate.id
  }

  const record: ReadinessLog = {
    ...createSyncMeta(),
    date: input.date,
    sleepHours: input.sleepHours,
    sleepQuality: input.sleepQuality,
    stress: input.stress,
    pain: input.pain,
    readinessScore: input.readinessScore,
    notes: input.notes,
  }
  await db.readinessLogs.add(record)
  return record.id
}

export async function getLatestReadinessLog(): Promise<ReadinessLog | null> {
  const logs = await db.readinessLogs.filter((log) => log.deletedAt === null).toArray()
  logs.sort((a, b) => b.date.localeCompare(a.date))
  return logs[0] ?? null
}

export async function getReadinessLogsByDateRange(startDateISO: string, endDateISO: string): Promise<ReadinessLog[]> {
  const logs = await db.readinessLogs
    .where("date")
    .between(startDateISO, endDateISO, true, true)
    .filter((log) => log.deletedAt === null)
    .toArray()

  return logs.sort((a, b) => b.date.localeCompare(a.date))
}

export async function saveWeightLog(input: SaveWeightInput): Promise<string> {
  const currentByDate = await db.weightLogs
    .where("date")
    .equals(input.date)
    .filter((log) => log.deletedAt === null)
    .first()

  if (currentByDate) {
    await db.weightLogs.put({
      ...touchVersion(currentByDate),
      weightKg: input.weightKg,
      notes: input.notes,
    })
    return currentByDate.id
  }

  const record: WeightLog = {
    ...createSyncMeta(),
    date: input.date,
    weightKg: input.weightKg,
    notes: input.notes,
  }
  await db.weightLogs.add(record)
  return record.id
}

export async function getWeightLogs(): Promise<WeightLog[]> {
  const logs = await db.weightLogs.filter((log) => log.deletedAt === null).toArray()
  return logs.sort((a, b) => a.date.localeCompare(b.date))
}

export async function getAllReadinessLogs(): Promise<ReadinessLog[]> {
  const logs = await db.readinessLogs.filter((log) => log.deletedAt === null).toArray()
  return logs.sort((a, b) => a.date.localeCompare(b.date))
}

export async function getSetting(key: AppSettingKey): Promise<AppSetting | null> {
  const setting = await db.appSettings.where("key").equals(key).first()
  return setting?.deletedAt === null ? setting : null
}

export async function getAllSettings(): Promise<AppSetting[]> {
  return db.appSettings.filter((setting) => setting.deletedAt === null).toArray()
}

export async function setSetting(key: AppSettingKey, value: string): Promise<string> {
  const current = await db.appSettings.where("key").equals(key).first()

  if (current) {
    await db.appSettings.put({
      ...touchVersion(current),
      value,
      deletedAt: null,
    })
    return current.id
  }

  const setting: AppSetting = {
    ...createSyncMeta(),
    key,
    value,
  }
  await db.appSettings.add(setting)
  return setting.id
}

export async function addRecommendation(input: CreateRecommendationInput): Promise<string> {
  const recommendation: Recommendation = {
    ...createSyncMeta(),
    date: input.date,
    splitType: input.splitType,
    workoutType: input.workoutType,
    kind: input.kind,
    status: input.status ?? "pending",
    message: input.message,
    reason: input.reason,
  }
  await db.recommendations.add(recommendation)
  return recommendation.id
}

export async function addRecommendationIfMissing(input: CreateRecommendationInput): Promise<string | null> {
  const existing = await db.recommendations
    .where("date")
    .equals(input.date)
    .filter((recommendation) => {
      return (
        recommendation.deletedAt === null &&
        recommendation.status === "pending" &&
        recommendation.kind === input.kind &&
        recommendation.workoutType === input.workoutType &&
        recommendation.splitType === input.splitType
      )
    })
    .first()

  if (existing) {
    return null
  }

  return addRecommendation(input)
}

export async function updateRecommendationStatus(id: string, status: RecommendationStatus): Promise<void> {
  const recommendation = await db.recommendations.get(id)
  if (!recommendation || recommendation.deletedAt !== null) {
    return
  }

  await db.recommendations.put({
    ...touchVersion(recommendation),
    status,
  })
}

export async function getRecommendations(status?: RecommendationStatus): Promise<Recommendation[]> {
  const recommendations = status
    ? await db.recommendations.where("status").equals(status).filter((item) => item.deletedAt === null).toArray()
    : await db.recommendations.filter((item) => item.deletedAt === null).toArray()

  return recommendations.sort((a, b) => b.date.localeCompare(a.date))
}

export async function getDirtySnapshot(): Promise<DirtySnapshot> {
  const [sessions, exerciseSets, readinessLogs, weightLogs, recommendations, appSettings] = await Promise.all([
    db.sessions.filter((row) => row.isDirty === true).toArray(),
    db.exerciseSets.filter((row) => row.isDirty === true).toArray(),
    db.readinessLogs.filter((row) => row.isDirty === true).toArray(),
    db.weightLogs.filter((row) => row.isDirty === true).toArray(),
    db.recommendations.filter((row) => row.isDirty === true).toArray(),
    db.appSettings.filter((row) => row.isDirty === true).toArray(),
  ])

  return {
    sessions,
    exerciseSets,
    readinessLogs,
    weightLogs,
    recommendations,
    appSettings,
  }
}

export async function getDirtyRowCount(): Promise<number> {
  const snapshot = await getDirtySnapshot()
  return (
    snapshot.sessions.length +
    snapshot.exerciseSets.length +
    snapshot.readinessLogs.length +
    snapshot.weightLogs.length +
    snapshot.recommendations.length +
    snapshot.appSettings.length
  )
}

export async function markRowsSynced(idsByTable: SyncedIdsByTable, serverTime: string, ownerUserId?: string): Promise<void> {
  await db.transaction("rw", db.tables, async () => {
    await markTableRowsSynced(db.sessions, idsByTable.sessions ?? [], serverTime, ownerUserId)
    await markTableRowsSynced(db.exerciseSets, idsByTable.exerciseSets ?? [], serverTime, ownerUserId)
    await markTableRowsSynced(db.readinessLogs, idsByTable.readinessLogs ?? [], serverTime, ownerUserId)
    await markTableRowsSynced(db.weightLogs, idsByTable.weightLogs ?? [], serverTime, ownerUserId)
    await markTableRowsSynced(db.recommendations, idsByTable.recommendations ?? [], serverTime, ownerUserId)
    await markTableRowsSynced(db.appSettings, idsByTable.appSettings ?? [], serverTime, ownerUserId)
  })
}

export async function applyPulledChanges(payload: PulledChangesPayload): Promise<void> {
  const serverTime = payload.serverTime ?? nowISO()

  await db.transaction("rw", db.tables, async () => {
    await mergeTableRows(db.sessions, payload.sessions ?? [], serverTime)
    await mergeTableRows(db.exerciseSets, payload.exerciseSets ?? [], serverTime)
    await mergeTableRows(db.readinessLogs, payload.readinessLogs ?? [], serverTime)
    await mergeTableRows(db.weightLogs, payload.weightLogs ?? [], serverTime)
    await mergeTableRows(db.recommendations, payload.recommendations ?? [], serverTime)
    await mergeTableRows(db.appSettings, payload.appSettings ?? [], serverTime)
  })
}

export async function setSyncState(key: string, value: string): Promise<void> {
  await db.syncState.put({
    key,
    value,
    updatedAt: nowISO(),
  })
}

export async function getSyncState(key: string): Promise<string | null> {
  const state = await db.syncState.get(key)
  return state?.value ?? null
}

export async function getAllSyncState(): Promise<SyncStateRecord[]> {
  const rows = await db.syncState.toArray()
  return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function getBackupSnapshot() {
  const [sessions, readinessLogs, weightLogs, settings, recommendations] = await Promise.all([
    getAllSessionsWithSets(),
    getAllReadinessLogs(),
    getWeightLogs(),
    getAllSettings(),
    getRecommendations(),
  ])

  return {
    exportedAt: nowISO(),
    sessions,
    readinessLogs,
    weightLogs,
    settings,
    recommendations,
  }
}

export async function getCachedExerciseCatalog(): Promise<ExerciseCatalogCacheEntry[]> {
  const rows = await db.exerciseCatalogCache.toArray()
  return rows.sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder
    }

    return a.name.localeCompare(b.name)
  })
}

export async function replaceExerciseCatalogCache(
  rows: ExerciseCatalogCacheEntry[],
): Promise<void> {
  await db.transaction("rw", db.exerciseCatalogCache, async () => {
    await db.exerciseCatalogCache.clear()
    if (!rows.length) {
      return
    }

    await db.exerciseCatalogCache.bulkPut(rows)
  })
}
