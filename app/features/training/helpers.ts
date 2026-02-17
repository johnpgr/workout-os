import {
  formatDateDayMonth,
  formatDateShort,
  getWeekDatesFromInput,
  getWeekInputValue,
  parseDate,
  type Temporal,
} from "@/lib/temporal"
import { THEME_STORAGE_KEY } from "@/features/training/constants"
import type { PlannedType, ThemePreference } from "@/features/training/types"

export function getInitialThemePreference(): ThemePreference {
  if (typeof window === "undefined") {
    return "system"
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored
  }

  return "system"
}

export function getWeekDates(weekValue: string): Temporal.PlainDate[] {
  return getWeekDatesFromInput(weekValue)
}

export function getISOWeekInputValue(date: Temporal.PlainDate): string {
  return getWeekInputValue(date)
}

export function toISODateString(date: Temporal.PlainDate): string {
  return date.toString()
}

export function formatDateBR(date: Temporal.PlainDate): string {
  return formatDateDayMonth(date)
}

export function formatISOToBR(isoDate: string): string {
  const parsedDate = parseISODate(isoDate)
  return parsedDate ? formatDateShort(parsedDate) : isoDate
}

export function parseISODate(isoDate: string): Temporal.PlainDate | null {
  try {
    return parseDate(isoDate)
  } catch {
    return null
  }
}

export function getCalendarTypeClasses(type: PlannedType): string {
  if (type === "rest") {
    return "opacity-80"
  }

  if (type === "push" || type === "upper-a" || type === "upper-b") {
    return "border-l-4 border-l-blue-500"
  }

  if (type === "pull") {
    return "border-l-4 border-l-emerald-500"
  }

  if (type === "leg" || type === "lower-a" || type === "lower-b") {
    return "border-l-4 border-l-orange-500"
  }

  return ""
}
