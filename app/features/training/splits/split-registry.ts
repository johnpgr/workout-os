import type { SplitType } from "@/lib/training-types"
import type { SplitConfig } from "@/features/training/types"
import { PPL_SPLIT } from "@/features/training/splits/ppl-split"
import { UPPER_LOWER_SPLIT } from "@/features/training/splits/upper-lower-split"

export const SPLIT_REGISTRY: Record<SplitType, SplitConfig> = {
  ppl: PPL_SPLIT,
  "upper-lower": UPPER_LOWER_SPLIT,
}

export function getSplitConfig(splitType: SplitType): SplitConfig {
  return SPLIT_REGISTRY[splitType]
}

export function getWorkoutPlan(splitType: SplitType, workoutType: string) {
  const split = getSplitConfig(splitType)
  return split.workouts.find((workout) => workout.type === workoutType) ?? null
}
