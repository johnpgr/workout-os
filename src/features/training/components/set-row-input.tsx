import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TECHNIQUE_LABELS, RPE_OPTIONS } from "@/features/training/constants"
import type { WorkoutFormValues } from "@/features/training/form-schema"
import type { UseFormRegister } from "react-hook-form"

interface SetRowInputProps {
  exerciseIndex: number
  setIndex: number
  register: UseFormRegister<WorkoutFormValues>
  selectedRpe: string
  onRpePick: (value: number) => void
  onRemove: () => void
  canRemove: boolean
}

export function SetRowInput({
  exerciseIndex,
  setIndex,
  register,
  selectedRpe,
  onRpePick,
  onRemove,
  canRemove,
}: SetRowInputProps) {
  return (
    <div className="space-y-2 rounded-md border border-border p-2">
      <div className="grid gap-2 md:grid-cols-4">
        <Input
          type="number"
          min={0}
          step={0.5}
          className="h-11"
          placeholder="Peso (kg)"
          {...register(`exercises.${exerciseIndex}.sets.${setIndex}.weight`)}
        />
        <Input
          type="number"
          min={0}
          step={1}
          className="h-11"
          placeholder="Repetições"
          {...register(`exercises.${exerciseIndex}.sets.${setIndex}.reps`)}
        />

        <Input
          type="number"
          min={6}
          max={10}
          step={0.5}
          className="h-11"
          placeholder="RPE"
          {...register(`exercises.${exerciseIndex}.sets.${setIndex}.rpe`)}
        />

        <select
          className="h-11 rounded-md border border-border bg-background px-3 text-sm"
          {...register(`exercises.${exerciseIndex}.sets.${setIndex}.technique`)}
        >
          <option value="">Sem técnica</option>
          {Object.entries(TECHNIQUE_LABELS).map(([key, value]) => (
            <option key={key} value={key}>
              {value}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {RPE_OPTIONS.map((option) => (
          <Button
            key={`${exerciseIndex}-${setIndex}-${option}`}
            type="button"
            size="sm"
            variant={selectedRpe === String(option) ? "default" : "outline"}
            className="h-11 min-w-11"
            onClick={() => onRpePick(option)}
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
