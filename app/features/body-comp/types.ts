import type { WeightLog } from "@/lib/training-types"

export function calculateMovingAverage(logs: WeightLog[], windowSize = 7): Array<{ date: string; average: number }> {
  if (!logs.length) {
    return []
  }

  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date))

  return sorted.map((log, index) => {
    const start = Math.max(0, index - windowSize + 1)
    const window = sorted.slice(start, index + 1)
    const average = window.reduce((sum, item) => sum + item.weightKg, 0) / window.length

    return {
      date: log.date,
      average: Number(average.toFixed(2)),
    }
  })
}
