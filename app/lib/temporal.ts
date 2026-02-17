import { Temporal } from "@js-temporal/polyfill"

export function getCurrentDate(): Temporal.PlainDate {
  return Temporal.Now.plainDateISO()
}

export function parseDate(dateString: string): Temporal.PlainDate {
  return Temporal.PlainDate.from(dateString)
}

export function formatDateLong(date: Temporal.PlainDate): string {
  return date.toLocaleString("pt-BR", { dateStyle: "long" })
}

export function formatDateShort(date: Temporal.PlainDate): string {
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export function formatDateDayMonth(date: Temporal.PlainDate): string {
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  })
}

export function getWeekDates(date: Temporal.PlainDate): Temporal.PlainDate[] {
  const dayOfWeek = date.dayOfWeek // 1=Monday, 7=Sunday
  const monday = date.subtract({ days: dayOfWeek - 1 })

  return Array.from({ length: 7 }, (_, index) => monday.add({ days: index }))
}

export function getWeekInputValue(date: Temporal.PlainDate): string {
  return `${date.yearOfWeek}-W${String(date.weekOfYear).padStart(2, "0")}`
}

export function getWeekDatesFromInput(weekValue: string): Temporal.PlainDate[] {
  const [yearText, weekText] = weekValue.split("-W")
  const year = Number(yearText)
  const week = Number(weekText)

  if (!Number.isInteger(year) || !Number.isInteger(week) || week < 1 || week > 53) {
    return []
  }

  const jan4 = Temporal.PlainDate.from({ year, month: 1, day: 4 })
  const monday = jan4.subtract({ days: jan4.dayOfWeek - 1 }).add({ days: (week - 1) * 7 })

  return Array.from({ length: 7 }, (_, index) => monday.add({ days: index }))
}

export function compareDate(
  date1: Temporal.PlainDate,
  date2: Temporal.PlainDate
): Temporal.ComparisonResult {
  return Temporal.PlainDate.compare(date1, date2)
}

export function isSameDate(
  date1: Temporal.PlainDate,
  date2: Temporal.PlainDate
): boolean {
  return compareDate(date1, date2) === 0
}

export const Duration = Temporal.Duration
export { Temporal }
