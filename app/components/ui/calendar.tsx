import * as React from "react"
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react"

import { Button, buttonVariants } from "@/components/ui/button"
import { Temporal, compareDate, isSameDate } from "@/lib/temporal"
import { cn } from "@/lib/utils"

type CalendarMode = "single" | "range" | "multiple"

type CalendarRange = {
  from?: Temporal.PlainDate
  to?: Temporal.PlainDate
}

type CalendarSelectionByMode = {
  single: Temporal.PlainDate | undefined
  range: CalendarRange | undefined
  multiple: Temporal.PlainDate[] | undefined
}

type CalendarSelection =
  | Temporal.PlainDate
  | CalendarRange
  | Temporal.PlainDate[]

type CalendarProps<TMode extends CalendarMode = "single"> = {
  mode?: TMode
  selected?: CalendarSelectionByMode[TMode]
  onSelect?: (value: CalendarSelectionByMode[TMode]) => void
  month?: Temporal.PlainDate
  onMonthChange?: (month: Temporal.PlainDate) => void
  locale?: string
  className?: string
}

const WEEKDAY_BASE = Temporal.PlainDate.from("2023-01-01")

function getWeekdayLabels(locale: string) {
  return Array.from({ length: 7 }, (_, index) =>
    WEEKDAY_BASE.add({ days: index }).toLocaleString(locale, {
      weekday: "short",
    })
  )
}

function isRangeSelection(
  value: CalendarSelection | undefined
): value is CalendarRange {
  return (
    !!value &&
    !Array.isArray(value) &&
    !(value instanceof Temporal.PlainDate) &&
    ("from" in value || "to" in value)
  )
}

function getMonthFromSelection(
  mode: CalendarMode,
  selected: CalendarSelection | undefined
) {
  if (!selected) return undefined

  if (mode === "single" && selected instanceof Temporal.PlainDate) {
    return selected
  }

  if (mode === "multiple" && Array.isArray(selected) && selected.length > 0) {
    return selected[0]
  }

  if (mode === "range" && isRangeSelection(selected)) {
    return selected.from ?? selected.to
  }

  return undefined
}

function normalizeRange(range: CalendarRange | undefined) {
  if (!range?.from || !range.to) return range
  if (compareDate(range.from, range.to) === 1) {
    return { from: range.to, to: range.from }
  }
  return range
}

function Calendar<TMode extends CalendarMode = "single">({
  mode = "single" as TMode,
  selected,
  onSelect,
  month,
  onMonthChange,
  locale = "pt-BR",
  className,
}: CalendarProps<TMode>) {
  const resolvedMode = mode as CalendarMode
  const selection = selected as CalendarSelection | undefined
  const today = Temporal.Now.plainDateISO()

  // Internal navigation state (only used when `month` prop is not controlled)
  const [navigatedMonth, setNavigatedMonth] =
    React.useState<Temporal.PlainDate>(() => {
      const derivedMonth = getMonthFromSelection(resolvedMode, selection)
      return (derivedMonth ?? today).with({ day: 1 })
    })

  // If controlled via `month` prop, use that; otherwise use internal navigation state
  const displayMonth = (month ?? navigatedMonth).with({ day: 1 })
  const weekDays = getWeekdayLabels(locale)
  const monthLabel = displayMonth.toLocaleString(locale, {
    month: "long",
    year: "numeric",
  })
  const dayButtonClassName = cn(
    buttonVariants({ variant: "ghost", size: "icon" }),
    "w-full h-auto aspect-square rounded-md text-sm font-normal transition-colors",
    "hover:bg-muted hover:text-foreground",
    "data-[outside=true]:text-muted-foreground/60",
    "data-[today=true]:border data-[today=true]:border-primary/50",
    "data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground data-[selected=true]:hover:bg-primary/90",
    "data-[range-middle=true]:bg-muted data-[range-middle=true]:text-foreground",
    "data-[range-start=true]:bg-primary data-[range-end=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:text-primary-foreground"
  )

  const firstDay = displayMonth.with({ day: 1 })
  const offset = firstDay.dayOfWeek % 7
  const gridStart = firstDay.subtract({ days: offset })
  // Always render 5 rows (35 days) - includes prev/next month days as needed
  const calendarDays = Array.from({ length: 35 }, (_, index) =>
    gridStart.add({ days: index })
  )

  const rangeSelection =
    resolvedMode === "range" && isRangeSelection(selection)
      ? normalizeRange(selection)
      : undefined
  const multipleSelection =
    resolvedMode === "multiple" && Array.isArray(selection) ? selection : []
  const multipleSelectionKeys = new Set(
    multipleSelection.map((item) => item.toString())
  )
  const singleSelection =
    resolvedMode === "single" && selection instanceof Temporal.PlainDate
      ? selection
      : undefined

  const changeMonth = (nextMonth: Temporal.PlainDate) => {
    const normalizedMonth = nextMonth.with({ day: 1 })
    if (!month) {
      setNavigatedMonth(normalizedMonth)
    }
    onMonthChange?.(normalizedMonth)
  }

  const handleSelect = (date: Temporal.PlainDate) => {
    if (resolvedMode === "single") {
      onSelect?.(date as CalendarSelectionByMode[TMode])
    }

    if (resolvedMode === "multiple") {
      const alreadySelected = multipleSelectionKeys.has(date.toString())
      const nextSelection = alreadySelected
        ? multipleSelection.filter((item) => !isSameDate(item, date))
        : [...multipleSelection, date]
      onSelect?.(nextSelection as CalendarSelectionByMode[TMode])
    }

    if (resolvedMode === "range") {
      const currentRange = isRangeSelection(selection) ? selection : {}
      const from = currentRange.from
      const to = currentRange.to
      let nextRange: CalendarRange

      if (!from || (from && to)) {
        nextRange = { from: date }
      } else if (compareDate(date, from) === -1) {
        nextRange = { from: date, to: from }
      } else {
        nextRange = { from, to: date }
      }

      onSelect?.(nextRange as CalendarSelectionByMode[TMode])
    }

    if (date.month !== displayMonth.month || date.year !== displayMonth.year) {
      changeMonth(date)
    }
  }

  return (
    <div data-slot="calendar" className={cn("p-2 bg-background", className)}>
      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => changeMonth(displayMonth.subtract({ months: 1 }))}
          aria-label="Mês anterior"
        >
          <CaretLeftIcon className="size-4" />
        </Button>
        <div className="flex-1 text-center text-sm font-medium">{monthLabel}</div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => changeMonth(displayMonth.add({ months: 1 }))}
          aria-label="Próximo mês"
        >
          <CaretRightIcon className="size-4" />
        </Button>
      </div>

      <div className="mt-3 grid grid-cols-7 text-[0.8rem] text-muted-foreground">
        {weekDays.map((dayLabel, index) => (
          <div
            key={`${dayLabel}-${index}`}
            className="flex h-8 items-center justify-center select-none"
          >
            {dayLabel}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {calendarDays.map((date) => {
          const isOutside =
            date.month !== displayMonth.month || date.year !== displayMonth.year
          const isToday = isSameDate(date, today)

          let isSelected = false
          let isRangeStart = false
          let isRangeEnd = false
          let isRangeMiddle = false

          if (resolvedMode === "single" && singleSelection) {
            isSelected = isSameDate(date, singleSelection)
          }

          if (resolvedMode === "multiple") {
            isSelected = multipleSelectionKeys.has(date.toString())
          }

          if (resolvedMode === "range" && rangeSelection?.from) {
            const start = rangeSelection.from
            const end = rangeSelection.to
            isRangeStart = isSameDate(date, start)
            isRangeEnd = !!end && isSameDate(date, end)

            if (end) {
              const isWithinRange =
                compareDate(date, start) >= 0 && compareDate(date, end) <= 0
              isRangeMiddle = isWithinRange && !isRangeStart && !isRangeEnd
              isSelected = isWithinRange
            } else {
              isSelected = isRangeStart
            }
          }

          return (
            <button
              key={date.toString()}
              type="button"
              className={dayButtonClassName}
              data-outside={isOutside || undefined}
              data-today={isToday || undefined}
              data-selected={isSelected || undefined}
              data-range-start={isRangeStart || undefined}
              data-range-end={isRangeEnd || undefined}
              data-range-middle={isRangeMiddle || undefined}
              aria-label={date.toLocaleString(locale, {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              aria-selected={isSelected}
              onClick={() => handleSelect(date)}
            >
              {date.day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export { Calendar }
