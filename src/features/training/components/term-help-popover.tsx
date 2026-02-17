import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  TRAINING_TERM_COPY,
  type TrainingTermKey,
} from "@/features/training/term-glossary"

interface TermHelpPopoverProps {
  term: TrainingTermKey
  autoOpen?: boolean
}

export function TermHelpPopover({
  term,
  autoOpen = false,
}: TermHelpPopoverProps) {
  const [open, setOpen] = useState(false)
  const hasAutoOpenedRef = useRef(false)
  const termCopy = TRAINING_TERM_COPY[term]

  useEffect(() => {
    if (!autoOpen || hasAutoOpenedRef.current) {
      return
    }

    hasAutoOpenedRef.current = true
    setOpen(true)
  }, [autoOpen])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="icon-xs"
            className="size-5 rounded-full border-border text-[10px]"
            aria-label={`Explicar ${termCopy.label}`}
          />
        }
      >
        ?
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72">
        <PopoverHeader>
          <PopoverTitle>{termCopy.label}</PopoverTitle>
          <PopoverDescription>{termCopy.short}</PopoverDescription>
        </PopoverHeader>
        <a
          href={termCopy.wikiUrl}
          className="text-xs text-primary underline underline-offset-2"
          target="_blank"
          rel="noreferrer noopener"
          onClick={() => setOpen(false)}
        >
          Saiba mais
        </a>
      </PopoverContent>
    </Popover>
  )
}
