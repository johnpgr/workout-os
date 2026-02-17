import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { TermHelpPopover } from "@/features/training/components/term-help-popover"
import { TECHNIQUE_LABELS, RPE_OPTIONS } from "@/features/training/constants"
import type { WorkoutFormValues } from "@/features/training/form-schema"
import { CaretDownIcon } from "@phosphor-icons/react"
import type { Control } from "react-hook-form"
import { useController } from "react-hook-form"

const NO_TECHNIQUE_VALUE = "__none__"

interface SetRowInputProps {
  exerciseIndex: number
  setIndex: number
  control: Control<WorkoutFormValues>
  onRemove: () => void
  canRemove: boolean
  autoOpenRpeHelp?: boolean
}

export function SetRowInput({
  exerciseIndex,
  setIndex,
  control,
  onRemove,
  canRemove,
  autoOpenRpeHelp = false,
}: SetRowInputProps) {
  const weightFieldName = `exercises.${exerciseIndex}.sets.${setIndex}.weight` as const
  const repsFieldName = `exercises.${exerciseIndex}.sets.${setIndex}.reps` as const
  const rpeFieldName = `exercises.${exerciseIndex}.sets.${setIndex}.rpe` as const
  const techniqueFieldName = `exercises.${exerciseIndex}.sets.${setIndex}.technique` as const
  const weightField = useController({
    control,
    name: weightFieldName,
  })
  const repsField = useController({
    control,
    name: repsFieldName,
  })
  const rpeField = useController({
    control,
    name: rpeFieldName,
  })
  const techniqueField = useController({
    control,
    name: techniqueFieldName,
  })
  const selectedRpe = rpeField.field.value || ""
  const selectedTechnique = techniqueField.field.value || ""
  const selectedTechniqueLabel = selectedTechnique ? TECHNIQUE_LABELS[selectedTechnique] : "Sem técnica"

  return (
    <div className="space-y-2 rounded-md border border-border p-2">
      <div className="grid gap-2 md:grid-cols-4">
        <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
          Peso (kg)
        </p>
        <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
          Repetições
        </p>
        <p className="flex items-center gap-1 text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
          <span>RPE</span>
          <TermHelpPopover term="rpe" autoOpen={autoOpenRpeHelp} />
          <TermHelpPopover term="rir" />
        </p>
        <p className="flex items-center gap-1 text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
          <span>Técnica</span>
          <TermHelpPopover term="technique" />
        </p>
      </div>

      <div className="grid gap-2 md:grid-cols-4">
        <Input
          type="number"
          min={0}
          step={0.5}
          className="h-11"
          placeholder="Peso (kg)"
          {...weightField.field}
          value={weightField.field.value || ""}
        />
        <Input
          type="number"
          min={0}
          step={1}
          className="h-11"
          placeholder="Repetições"
          {...repsField.field}
          value={repsField.field.value || ""}
        />

        <Input
          type="number"
          min={6}
          max={10}
          step={0.5}
          className="h-11"
          placeholder="RPE"
          {...rpeField.field}
          value={selectedRpe}
        />

        <DropdownMenu>
          <DropdownMenuTrigger render={<Button type="button" variant="outline" className="h-11 w-full justify-between" />}>
            <span className="truncate">{selectedTechniqueLabel}</span>
            <CaretDownIcon className="size-4 text-muted-foreground" aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent sideOffset={6} className="w-[var(--anchor-width)]">
            <DropdownMenuRadioGroup
              value={selectedTechnique || NO_TECHNIQUE_VALUE}
              onValueChange={(value) => {
                techniqueField.field.onChange(
                  value === NO_TECHNIQUE_VALUE
                    ? ""
                    : (value as WorkoutFormValues["exercises"][number]["sets"][number]["technique"])
                )
              }}
            >
              <DropdownMenuRadioItem value={NO_TECHNIQUE_VALUE}>Sem técnica</DropdownMenuRadioItem>
              {Object.entries(TECHNIQUE_LABELS).map(([key, value]) => (
                <DropdownMenuRadioItem key={key} value={key}>
                  {value}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {RPE_OPTIONS.map((option) => (
          <Button
            key={`${exerciseIndex}-${setIndex}-${option}`}
            type="button"
            size="sm"
            variant={selectedRpe === String(option) ? "default" : "outline"}
            className="h-11 min-w-11"
            onClick={() => rpeField.field.onChange(String(option))}
          >
            {option}
          </Button>
        ))}

        <Button
          type="button"
          size="sm"
          variant="destructive"
          onClick={onRemove}
          disabled={!canRemove}
          className="h-11"
        >
          Remover série
        </Button>
      </div>
    </div>
  )
}
