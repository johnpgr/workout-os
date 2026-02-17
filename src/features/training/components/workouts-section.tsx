import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { ClockCountdownIcon } from "@phosphor-icons/react"
import { useForm } from "react-hook-form"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { WORKOUTS } from "@/features/training/constants"
import {
  createWorkoutFormDefaultValues,
  type WorkoutFormValues,
  workoutFormSchema,
} from "@/features/training/form-schema"
import type { FormStatus, WorkoutPlan } from "@/features/training/types"
import { Temporal } from "@/lib/temporal"
import type { SessionExerciseLog, SessionLog } from "@/lib/training-types"

interface WorkoutsSectionProps {
  defaultDate: string
  isSaving: boolean
  onSaveLog: (payload: Omit<SessionLog, "id">) => Promise<void>
}

interface WorkoutCardFormProps {
  defaultDate: string
  isSaving: boolean
  workout: WorkoutPlan
  onSaveLog: (payload: Omit<SessionLog, "id">) => Promise<void>
}

function parseNonNegativeNumber(value: string): number {
  if (!value.trim()) {
    return 0
  }

  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0
  }

  return parsed
}

function WorkoutCardForm({
  defaultDate,
  isSaving,
  workout,
  onSaveLog,
}: WorkoutCardFormProps) {
  const [status, setStatus] = useState<FormStatus>(null)

  const form = useForm<WorkoutFormValues>({
    resolver: zodResolver(workoutFormSchema),
    defaultValues: createWorkoutFormDefaultValues(defaultDate, workout.exercises.length),
    mode: "onSubmit",
  })

  const { register, handleSubmit, reset, getValues, formState } = form

  const dateError = formState.errors.date?.message
  const durationError = formState.errors.duration?.message

  async function onSubmit(values: WorkoutFormValues) {
    const exercises: SessionExerciseLog[] = values.rows
      .map((row, index) => ({
        name: workout.exercises[index].name,
        sets: parseNonNegativeNumber(row.sets),
        reps: parseNonNegativeNumber(row.reps),
        weight: parseNonNegativeNumber(row.weight),
      }))
      .filter((entry) => entry.sets > 0 || entry.reps > 0 || entry.weight > 0)

    const payload: Omit<SessionLog, "id"> = {
      workoutType: workout.type,
      workoutLabel: workout.label,
      date: values.date,
      durationMin: Number(values.duration),
      notes: values.notes.trim(),
      exercises,
      createdAt: Temporal.Now.instant().toString(),
    }

    try {
      await onSaveLog(payload)

      setStatus({ kind: "success", message: "Treino salvo com sucesso no IndexedDB." })
      reset({
        date: values.date,
        duration: "",
        notes: "",
        rows: values.rows.map(() => ({ sets: "", reps: "", weight: "" })),
      })
    } catch (error) {
      console.error(error)
      setStatus({ kind: "error", message: "Não foi possível salvar no IndexedDB." })
    }
  }

  function handleClearForm() {
    const currentDate = getValues("date") || defaultDate
    reset(createWorkoutFormDefaultValues(currentDate, workout.exercises.length))
    setStatus({ kind: "success", message: "Campos limpos." })
  }

  const WorkoutIcon = workout.icon

  return (
    <Card key={workout.type} className="overflow-hidden border-t-2">
      <CardHeader className="border-b border-border pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <WorkoutIcon className="size-6" weight="duotone" aria-hidden="true" />
              <span>{workout.title}</span>
            </CardTitle>
            <Badge variant="secondary" className="uppercase tracking-[0.06em]">
              {workout.badge}
            </Badge>
          </div>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <ClockCountdownIcon className="size-4" aria-hidden="true" />
            <span>{workout.duration}</span>
          </p>
        </div>
      </CardHeader>

      <CardContent className="px-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-muted/60 text-xs uppercase tracking-[0.06em] text-muted-foreground">
              <tr>
                <th className="px-6 py-3">Exercício</th>
                <th className="px-6 py-3">Séries × Reps</th>
                <th className="px-6 py-3">Descanso</th>
                <th className="px-6 py-3">Observações</th>
              </tr>
            </thead>
            <tbody>
              {workout.exercises.map((exercise) => (
                <tr key={exercise.name} className="border-t border-border hover:bg-muted/40">
                  <td className="space-y-1 px-6 py-4">
                    <p className="font-semibold text-foreground">{exercise.name}</p>
                    <p className="text-xs text-muted-foreground">{exercise.detail}</p>
                    <Badge variant="outline" className="text-[10px]">
                      {exercise.type}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 font-semibold text-foreground">{exercise.setsReps}</td>
                  <td className="px-6 py-4 text-muted-foreground">{exercise.rest}</td>
                  <td className="px-6 py-4 text-muted-foreground">{exercise.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-border bg-muted/30 p-5">
          <details className="rounded-xl border border-border bg-card">
            <summary className="cursor-pointer px-4 py-3 font-semibold text-foreground">
              Registrar Sessão - {workout.label}
            </summary>
            <form
              className="space-y-4 border-t border-border p-4"
              onSubmit={(event) => {
                event.preventDefault()
                void handleSubmit(onSubmit)(event)
              }}
            >
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Data</label>
                  <Input
                    type="date"
                    {...register("date")}
                    className="border-border bg-background text-foreground"
                  />
                  {dateError ? <p className="text-xs text-destructive">{dateError}</p> : null}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Duração (min)</label>
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    placeholder="Ex: 82"
                    {...register("duration")}
                    className="border-border bg-background text-foreground"
                  />
                  {durationError ? <p className="text-xs text-destructive">{durationError}</p> : null}
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Observações</label>
                  <Textarea
                    placeholder="Como foi o treino, técnica, fadiga, dor, etc."
                    {...register("notes")}
                    className="min-h-24 border-border bg-background text-foreground"
                  />
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-muted/60 text-xs uppercase tracking-[0.06em] text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2">Exercício</th>
                      <th className="px-3 py-2">Sets</th>
                      <th className="px-3 py-2">Reps</th>
                      <th className="px-3 py-2">Peso (kg)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workout.exercises.map((exercise, rowIndex) => (
                      <tr key={exercise.name} className="border-t border-border">
                        <td className="px-3 py-2 text-xs text-foreground sm:text-sm">{exercise.name}</td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            min={0}
                            step={1}
                            placeholder="sets"
                            {...register(`rows.${rowIndex}.sets`)}
                            className="h-8 border-border bg-background text-foreground"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            min={0}
                            step={1}
                            placeholder="reps"
                            {...register(`rows.${rowIndex}.reps`)}
                            className="h-8 border-border bg-background text-foreground"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            min={0}
                            step={0.5}
                            placeholder="kg"
                            {...register(`rows.${rowIndex}.weight`)}
                            className="h-8 border-border bg-background text-foreground"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button type="submit" disabled={isSaving || formState.isSubmitting}>
                  Salvar no IndexedDB
                </Button>
                <Button type="button" variant="outline" onClick={handleClearForm}>
                  Limpar Campos
                </Button>
                {status ? (
                  <span className={status.kind === "error" ? "text-sm text-destructive" : "text-sm text-primary"}>
                    {status.message}
                  </span>
                ) : null}
              </div>
            </form>
          </details>
        </div>
      </CardContent>
    </Card>
  )
}

export function WorkoutsSection({
  defaultDate,
  isSaving,
  onSaveLog,
}: WorkoutsSectionProps) {
  return (
    <section className="space-y-6">
      {WORKOUTS.map((workout) => (
        <WorkoutCardForm
          key={workout.type}
          defaultDate={defaultDate}
          isSaving={isSaving}
          workout={workout}
          onSaveLog={onSaveLog}
        />
      ))}
    </section>
  )
}
