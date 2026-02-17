import type { SessionWithSets } from "@/lib/training-types"

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function calculateReadinessScore(input: {
  sleepHours: number
  sleepQuality: number
  stress: number
  pain: number
}): number {
  const sleepHoursNormalized = clamp((input.sleepHours / 8) * 100, 0, 100)
  const sleepQualityNormalized = clamp((input.sleepQuality / 5) * 100, 0, 100)
  const stressNormalized = clamp(((6 - input.stress) / 5) * 100, 0, 100)
  const painNormalized = clamp(((6 - input.pain) / 5) * 100, 0, 100)

  const weighted =
    sleepQualityNormalized * 0.3 +
    sleepHoursNormalized * 0.25 +
    stressNormalized * 0.25 +
    painNormalized * 0.2

  return Math.round(weighted)
}

function getSessionVolumeLoad(session: SessionWithSets): number {
  return session.sets.reduce((total, set) => total + set.weightKg * set.reps, 0)
}

export function shouldSuggestDeload(recentSessions: SessionWithSets[]): boolean {
  if (recentSessions.length < 4) {
    return false
  }

  const sorted = [...recentSessions].sort((a, b) => a.session.date.localeCompare(b.session.date))
  const lastTwo = sorted.slice(-2)
  const previousTwo = sorted.slice(-4, -2)

  const lastAverage = lastTwo.reduce((sum, session) => sum + getSessionVolumeLoad(session), 0) / lastTwo.length
  const previousAverage =
    previousTwo.reduce((sum, session) => sum + getSessionVolumeLoad(session), 0) / previousTwo.length

  if (previousAverage <= 0) {
    return false
  }

  return lastAverage <= previousAverage * 0.9
}

export function getReadinessColor(score: number): "green" | "yellow" | "red" {
  if (score > 70) {
    return "green"
  }

  if (score >= 50) {
    return "yellow"
  }

  return "red"
}
