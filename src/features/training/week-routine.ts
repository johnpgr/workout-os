import { WEEK_PATTERNS } from "@/features/training/constants"
import type { PlannedType, WeekMode } from "@/features/training/types"
import type { AppSettingKey, SplitType } from "@/lib/training-types"

export const WEEK_ROUTINE_TEMPLATE_SETTING_KEY: AppSettingKey =
  "week-routine-template-v1"

type WeekRoutineTemplateStore = Record<string, PlannedType[]>

interface WeekPatternParams {
  splitType: SplitType
  mode: WeekMode
  settingValue: string | null | undefined
  allowedTypes: PlannedType[]
}

interface UpdatedSettingValueParams extends WeekPatternParams {
  dayIndex: number
  nextType: PlannedType
}

function isValidStoreKey(value: string): boolean {
  return Boolean(value.includes(":"))
}

function isAllowedPlannedType(
  value: unknown,
  allowedTypes: PlannedType[],
): value is PlannedType {
  return typeof value === "string" && allowedTypes.includes(value as PlannedType)
}

function parseWeekRoutineTemplateStore(
  rawValue: string | null | undefined,
): WeekRoutineTemplateStore {
  if (!rawValue) {
    return {}
  }

  try {
    const parsed = JSON.parse(rawValue) as Record<string, unknown>
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {}
    }

    const store: WeekRoutineTemplateStore = {}
    for (const [key, value] of Object.entries(parsed)) {
      if (!isValidStoreKey(key) || !Array.isArray(value)) {
        continue
      }

      store[key] = value as PlannedType[]
    }

    return store
  } catch {
    return {}
  }
}

function getStoreKey(splitType: SplitType, mode: WeekMode): string {
  return `${splitType}:${mode}`
}

function getFallbackPattern(mode: WeekMode): PlannedType[] {
  return [...WEEK_PATTERNS[mode]]
}

function normalizePattern(
  input: unknown,
  allowedTypes: PlannedType[],
  fallback: PlannedType[],
): PlannedType[] {
  if (!Array.isArray(input) || input.length !== 7) {
    return fallback
  }

  if (input.some((value) => !isAllowedPlannedType(value, allowedTypes))) {
    return fallback
  }

  return [...(input as PlannedType[])]
}

export function getEffectiveWeekPattern({
  splitType,
  mode,
  settingValue,
  allowedTypes,
}: WeekPatternParams): PlannedType[] {
  const fallback = getFallbackPattern(mode)
  const store = parseWeekRoutineTemplateStore(settingValue)
  const storeKey = getStoreKey(splitType, mode)
  return normalizePattern(store[storeKey], allowedTypes, fallback)
}

export function getUpdatedWeekPatternSettingValue({
  splitType,
  mode,
  settingValue,
  allowedTypes,
  dayIndex,
  nextType,
}: UpdatedSettingValueParams): string {
  const fallback = getFallbackPattern(mode)
  const store = parseWeekRoutineTemplateStore(settingValue)
  const storeKey = getStoreKey(splitType, mode)
  const currentPattern = normalizePattern(store[storeKey], allowedTypes, fallback)

  if (dayIndex < 0 || dayIndex > 6 || !allowedTypes.includes(nextType)) {
    store[storeKey] = currentPattern
    return JSON.stringify(store)
  }

  const updatedPattern = [...currentPattern]
  updatedPattern[dayIndex] = nextType
  store[storeKey] = updatedPattern
  return JSON.stringify(store)
}
