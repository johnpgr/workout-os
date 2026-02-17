import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { ClockCountdownIcon } from "@phosphor-icons/react"
import { useFieldArray, useForm, type Control, type UseFormRegister, type UseFormSetValue, type UseFormWatch } from "react-hook-form"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { SetRowInput } from "@/features/training/components/set-row-input"
import {
  createWorkoutFormDefaultValues,
  type WorkoutFormValues,
  workoutFormSchema,
} from "@/features/training/form-schema"
import { formatISOToBR } from "@/features/training/helpers"
import { useLastSessionQuery } from "@/features/training/queries"
import { rpeToRir } from "@/features/training/rpe-utils"
import type { FormStatus, WorkoutPlan } from "@/features/training/types"
import type {
  SaveSessionInput,
  SessionWithSets,
} from "@/lib/training-db"
import type { SplitType } from "@/lib/training-types"

interface WorkoutsSectionProps {
  defaultDate: string
  splitType: SplitType
  workouts: WorkoutPlan[]
  isSaving: boolean
  onSaveSession: (payload: SaveSessionInput) => Promise<void>
}

interface WorkoutCardFormProps {
  defaultDate: string
  splitType: SplitType
  isSaving: boolean
  workout: WorkoutPlan
  onSaveSession: (payload: SaveSessionInput) => Promise<void>
}

interface ExerciseSetRowsProps {
  control: Control<WorkoutFormValues>
  register: UseFormRegister<WorkoutFormValues>
  setValue: UseFormSetValue<WorkoutFormValues>
  watch: UseFormWatch<WorkoutFormValues>
  exerciseIndex: number
}

function ExerciseSetRows({
  control,
  register,
  setValue,
  watch,
  exerciseIndex,
}: ExerciseSetRowsProps) {
  const setArrayName = `exercises.${exerciseIndex}.sets` as const

  const setsFieldArray = useFieldArray({
    control,
    name: setArrayName,
  })

  return (
    <div className="space-y-2">
      {setsFieldArray.fields.map((setField, setIndex) => (
        <SetRowInput
          key={setField.id}
          exerciseIndex={exerciseIndex}
          setIndex={setIndex}
          register={register}
          selectedRpe={watch(`exercises.${exerciseIndex}.sets.${setIndex}.rpe`) || ""}
          onRpePick={(value) =>
            setValue(`exercises.${exerciseIndex}.sets.${setIndex}.rpe`, String(value), {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: true,
            })
          }
          onRemove={() => setsFieldArray.remove(setIndex)}
          canRemove={setsFieldArray.fields.length > 1}
        />
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={() => setsFieldArray.append({ weight: "", reps: "", rpe: "", technique: "" })}
      >
        Adicionar série
      </Button>
    </div>
  )
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

function getSessionSummaryText(session: SessionWithSets): string {
  const totalSets = session.sets.length
  const volumeLoad = session.sets.reduce((total, set) => total + set.weightKg * set.reps, 0)
  return `${formatISOToBR(session.session.date)} · ${totalSets} séries · ${Math.round(volumeLoad)} kg de carga`
}

function WorkoutCardForm({
  defaultDate,
  splitType,
  isSaving,
  workout,
  onSaveSession,
}: WorkoutCardFormProps) {
  const [status, setStatus] = useState<FormStatus>(null)

  const form = useForm<WorkoutFormValues>({
    resolver: zodResolver(workoutFormSchema),
    defaultValues: createWorkoutFormDefaultValues(defaultDate, workout),
    mode: "onSubmit",
  })

  const { register, control, watch, setValue, handleSubmit, reset, formState } = form

  const lastSessionQuery = useLastSessionQuery(workout.type, splitType)
  const lastSession = lastSessionQuery.data

  useEffect(() => {
    reset(createWorkoutFormDefaultValues(defaultDate, workout))
  }, [defaultDate, workout, reset])

  const summaryText = lastSession ? getSessionSummaryText(lastSession) : null

  async function onSubmit(values: WorkoutFormValues) {
    const sets = values.exercises.flatMap((exercise, exerciseIndex) => {
      return exercise.sets
        .map((set, setIndex) => {
          const weight = parseNonNegativeNumber(set.weight)
          const reps = parseNonNegativeNumber(set.reps)

          if (weight <= 0 || reps <= 0) {
            return null
          }

          const rpe = set.rpe.trim() ? parseNonNegativeNumber(set.rpe) : null

          return {
            exerciseName: exercise.exerciseName,
            exerciseOrder: exerciseIndex,
            setOrder: setIndex,
            weightKg: weight,
            reps,
            rpe,
            rir: rpe === null ? null : rpeToRir(rpe),
            technique: set.technique || null,
          }
        })
        .filter((entry) => entry !== null)
    })

    const payload: SaveSessionInput = {
      session: {
        date: values.date,
        splitType,
        workoutType: workout.type,
        workoutLabel: workout.label,
        durationMin: Number(values.duration),
        notes: values.notes.trim(),
      },
      sets,
    }

    try {
      await onSaveSession(payload)
      setStatus({ kind: "success", message: "Sessão salva com sucesso." })
      reset({
        ...values,
        duration: "",
        notes: "",
        exercises: values.exercises.map((exercise) => ({
          exerciseName: exercise.exerciseName,
          sets: exercise.sets.map(() => ({
            weight: "",
            reps: "",
            rpe: "",
            technique: "",
          })),
        })),
      })
    } catch (error) {
      console.error(error)
      setStatus({ kind: "error", message: "Não foi possível salvar a sessão." })
    }
  }

  function handleCopyFromLastSession() {
    if (!lastSession) {
      return
    }

    const exercises: WorkoutFormValues["exercises"] = workout.exercises.map((exercise) => {
      const matchingSets = lastSession.sets
        .filter((set) => set.exerciseName === exercise.name)
        .sort((a, b) => a.setOrder - b.setOrder)

      if (!matchingSets.length) {
        return {
          exerciseName: exercise.name,
          sets: [{ weight: "", reps: "", rpe: "", technique: "" }],
        }
      }

      return {
        exerciseName: exercise.name,
        sets: matchingSets.map((set) => ({
          weight: set.weightKg ? String(set.weightKg) : "",
          reps: set.reps ? String(set.reps) : "",
          rpe: set.rpe ? String(set.rpe) : "",
          technique: (set.technique ?? "") as WorkoutFormValues["exercises"][number]["sets"][number]["technique"],
        })),
      }
    })

    setValue("date", defaultDate)
    setValue("duration", String(lastSession.session.durationMin || ""))
    setValue("notes", lastSession.session.notes ?? "")
    setValue("exercises", exercises)
    setStatus({ kind: "success", message: "Valores copiados da última sessão." })
  }

  const WorkoutIcon = workout.icon

  return (
    <Card className="overflow-hidden border-t-2">
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

      <CardContent className="space-y-4 px-4 pt-4">
        {summaryText ? (
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Última sessão</p>
            <p className="text-sm text-foreground">{summaryText}</p>
            <Button type="button" size="sm" variant="outline" className="mt-2" onClick={handleCopyFromLastSession}>
              Copiar da última sessão
            </Button>
          </div>
        ) : null}

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            void handleSubmit(onSubmit)(event)
          }}
        >
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-[0.08em] text-muted-foreground" htmlFor={`${workout.type}-date`}>
                Data
              </label>
              <Input
                id={`${workout.type}-date`}
                type="date"
                {...register("date")}
                className="h-11 border-border bg-background text-foreground"
              />
              {formState.errors.date?.message ? (
                <p className="text-xs text-destructive">{formState.errors.date.message}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <label
                className="text-xs uppercase tracking-[0.08em] text-muted-foreground"
                htmlFor={`${workout.type}-duration`}
              >
                Duração (min)
              </label>
              <Input
                id={`${workout.type}-duration`}
                type="number"
                min={1}
                step={1}
                placeholder="Ex: 82"
                {...register("duration")}
                className="h-11 border-border bg-background text-foreground"
              />
              {formState.errors.duration?.message ? (
                <p className="text-xs text-destructive">{formState.errors.duration.message}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-[0.08em] text-muted-foreground" htmlFor={`${workout.type}-notes`}>
              Observações
            </label>
            <Textarea
              id={`${workout.type}-notes`}
              placeholder="Técnica, dor, sensação de fadiga, etc."
              {...register("notes")}
              className="min-h-20 border-border bg-background text-foreground"
            />
          </div>

          <div className="space-y-4">
            {workout.exercises.map((exercise, exerciseIndex) => (
              <section key={exercise.name} className="rounded-lg border border-border p-3">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">{exercise.name}</p>
                    <p className="text-xs text-muted-foreground">{exercise.detail}</p>
                  </div>
                  <Badge variant="outline">{exercise.setsReps}</Badge>
                </div>

                <ExerciseSetRows
                  control={control}
                  register={register}
                  setValue={setValue}
                  watch={watch}
                  exerciseIndex={exerciseIndex}
                />
              </section>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" disabled={isSaving || formState.isSubmitting}>
              Salvar sessão
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset(createWorkoutFormDefaultValues(defaultDate, workout))
                setStatus({ kind: "success", message: "Campos limpos." })
              }}
            >
              Limpar campos
            </Button>
            {status ? (
              <span className={status.kind === "error" ? "text-sm text-destructive" : "text-sm text-primary"}>
                {status.message}
              </span>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export function WorkoutsSection({
  defaultDate,
  splitType,
  workouts,
  isSaving,
  onSaveSession,
}: WorkoutsSectionProps) {
  return (
    <section className="space-y-6">
      {workouts.map((workout) => (
        <WorkoutCardForm
          key={workout.type}
          defaultDate={defaultDate}
          splitType={splitType}
          isSaving={isSaving}
          workout={workout}
          onSaveSession={onSaveSession}
        />
      ))}
    </section>
  )
}
