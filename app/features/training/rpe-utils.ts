import type { Recommendation } from "@/lib/training-types"
import type { SessionWithSets } from "@/lib/training-types"

export function rpeToRir(rpe: number): number {
  return Math.max(0, Math.round((10 - rpe) * 10) / 10)
}

function getAverageRpe(session: SessionWithSets): number | null {
  const rpeValues = session.sets
    .map((set) => set.rpe)
    .filter((rpe): rpe is number => typeof rpe === "number" && Number.isFinite(rpe))

  if (!rpeValues.length) {
    return null
  }

  return rpeValues.reduce((sum, value) => sum + value, 0) / rpeValues.length
}

function getVolumeLoad(session: SessionWithSets): number {
  return session.sets.reduce((total, set) => total + set.weightKg * set.reps, 0)
}

export function buildProgressionSuggestion(sessions: SessionWithSets[]): Omit<Recommendation, "id" | "createdAt" | "updatedAt" | "deletedAt" | "version"> | null {
  if (sessions.length < 2) {
    return null
  }

  const [latest, previous] = sessions
  const currentLoad = getVolumeLoad(latest)
  const previousLoad = getVolumeLoad(previous)

  if (previousLoad <= 0 || currentLoad <= 0) {
    return null
  }

  const ratio = currentLoad / previousLoad
  const avgRpe = getAverageRpe(latest)

  if (ratio >= 1.03 && (avgRpe === null || avgRpe <= 8.5)) {
    return {
      date: latest.session.date,
      splitType: latest.session.splitType,
      workoutType: latest.session.workoutType,
      kind: "increase-load",
      status: "pending",
      message: "Desempenho consistente. Considere subir 2,5kg no principal da próxima sessão.",
      reason: "Carga de volume subiu >= 3% com esforço controlado.",
    }
  }

  if (ratio <= 0.9 && avgRpe !== null && avgRpe >= 9) {
    return {
      date: latest.session.date,
      splitType: latest.session.splitType,
      workoutType: latest.session.workoutType,
      kind: "reduce-intensity",
      status: "pending",
      message: "Queda de performance com alto esforço. Mantenha carga ou reduza 5-10%.",
      reason: "Carga de volume caiu > 10% com RPE médio alto.",
    }
  }

  return null
}
