import Dexie, { type Table } from "dexie"
import type { SessionLog } from "@/lib/training-types"

export type { SessionExerciseLog, SessionLog, WorkoutType } from "@/lib/training-types"

class TrainingLogsDatabase extends Dexie {
  sessionLogs!: Table<SessionLog, number>

  constructor() {
    super("ppl-training-logs")

    // v1 foi a estrutura original do app sem Dexie; v2 normaliza os índices usados pelo Dexie.
    this.version(2).stores({
      session_logs: "++id, date, workoutType, createdAt",
    })

    this.sessionLogs = this.table("session_logs")
  }
}

const db = new TrainingLogsDatabase()

export async function addLog(log: Omit<SessionLog, "id">): Promise<number> {
  return db.sessionLogs.add(log)
}

export async function deleteLog(id: number): Promise<void> {
  await db.sessionLogs.delete(id)
}

export async function getLogsByDateRange(startDateISO: string, endDateISO: string): Promise<SessionLog[]> {
  const logs = await db.sessionLogs.where("date").between(startDateISO, endDateISO, true, true).toArray()

  return logs.sort((a, b) => {
    if (a.date !== b.date) {
      return a.date < b.date ? 1 : -1
    }
    return String(b.createdAt).localeCompare(String(a.createdAt))
  })
}
