import { useRef, useState } from "react"
import { CaretDownIcon } from "@phosphor-icons/react"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { Temporal } from "@/lib/temporal"
import { cn } from "@/lib/utils"

interface DatePickerProps {
  id?: string
  value?: Temporal.PlainDate
  label?: string
  onChange: (value: Temporal.PlainDate) => void
  locale?: string
  placeholder?: string
  className?: string
  buttonClassName?: string
}

function formatDateLabel(date: Temporal.PlainDate, locale: string) {
  return date.toLocaleString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export function DatePicker({
  id,
  value,
  label,
  onChange,
  locale = "pt-BR",
  placeholder = "Selecione uma data",
  className,
  buttonClassName,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const blockNextTriggerOpenRef = useRef(false)

  const handleOpenChange: NonNullable<PopoverPrimitive.Root.Props["onOpenChange"]> = (
    nextOpen,
    eventDetails
  ) => {
    if (!nextOpen) {
      const eventTarget = eventDetails.event?.target
      const pressedOwnTrigger =
        eventDetails.reason === "outside-press" &&
        eventDetails.trigger instanceof Element &&
        eventTarget instanceof Node &&
        eventDetails.trigger.contains(eventTarget)

      blockNextTriggerOpenRef.current = pressedOwnTrigger
      setOpen(false)
      return
    }

    const shouldBlockReopen =
      blockNextTriggerOpenRef.current && eventDetails.reason === "trigger-press"

    if (shouldBlockReopen) {
      blockNextTriggerOpenRef.current = false
      return
    }

    blockNextTriggerOpenRef.current = false
    setOpen(true)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            className={cn("w-full justify-between gap-2", buttonClassName)}
          >
            <span className="truncate">
              {label ?? (value ? formatDateLabel(value, locale) : placeholder)}
            </span>
            <CaretDownIcon className="size-4" />
          </Button>
        }
      />
      <PopoverContent align="start" className={cn("w-auto p-0", className)}>
        <Calendar
          key={value?.toString() ?? "no-date-selected"}
          mode="single"
          selected={value}
          onSelect={(selectedDate) => {
            if (!selectedDate) return
            onChange(selectedDate)
            setOpen(false)
          }}
          locale={locale}
        />
      </PopoverContent>
    </Popover>
  )
}
