import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowSquareOutIcon, ClockCountdownIcon } from "@phosphor-icons/react"
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
  type Control,
} from "react-hook-form"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DatePicker } from "@/components/ui/date-picker"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { normalizeExerciseName } from "@/features/training/exercise-catalog"
import { SetRowInput } from "@/features/training/components/set-row-input"
import { WORKOUT_TERMS_HELP_SEEN_KEY } from "@/features/training/constants"
import {
  createWorkoutFormDefaultValues,
  type WorkoutFormValues,
  workoutFormSchema,
} from "@/features/training/form-schema"
import { formatISOToBR } from "@/features/training/helpers"
import {
  useExerciseCatalogQuery,
  useLastSessionQuery,
} from "@/features/training/queries"
import { rpeToRir } from "@/features/training/rpe-utils"
import type {
  ExerciseCatalogItem,
  ExercisePlan,
  FormStatus,
  WorkoutPlan,
} from "@/features/training/types"
import type { SaveSessionInput, SessionWithSets } from "@/lib/training-db"
import { parseDate } from "@/lib/temporal"
import type { SplitType } from "@/lib/training-types"

interface WorkoutsSectionProps {
  defaultDate: string
  splitType: SplitType
  workout: WorkoutPlan | null
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
  exerciseIndex: number
  autoOpenRpeHelp: boolean
}

const NO_EXERCISE_VALUE = "__none__"

function ExerciseSetRows({
  control,
  exerciseIndex,
  autoOpenRpeHelp,
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
          control={control}
          onRemove={() => setsFieldArray.remove(setIndex)}
          canRemove={setsFieldArray.fields.length > 1}
          autoOpenRpeHelp={autoOpenRpeHelp && setIndex === 0}
        />
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={() =>
          setsFieldArray.append({ weight: "", reps: "", rpe: "", technique: "" })
        }
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

function parseISODate(value: string) {
  try {
    return parseDate(value)
  } catch {
    return undefined
  }
}

function getSessionSummaryText(session: SessionWithSets): string {
  const totalSets = session.sets.length
  const volumeLoad = session.sets.reduce(
    (total, set) => total + set.weightKg * set.reps,
    0,
  )
  return `${formatISOToBR(session.session.date)} · ${totalSets} séries · ${Math.round(volumeLoad)} kg de carga`
}

function getCatalogById(catalog: ExerciseCatalogItem[]): Map<string, ExerciseCatalogItem> {
  return new Map(catalog.map((exercise) => [exercise.id, exercise]))
}

function getCatalogByName(
  catalog: ExerciseCatalogItem[],
): Map<string, ExerciseCatalogItem> {
  return new Map(
    catalog.map((exercise) => [normalizeExerciseName(exercise.name), exercise]),
  )
}

function resolveExerciseFromCatalog(
  templateExercise: ExercisePlan,
  catalogById: Map<string, ExerciseCatalogItem>,
  catalogByName: Map<string, ExerciseCatalogItem>,
): { exerciseId: string | null; exerciseName: string; videoUrl: string } {
  const byId = templateExercise.exerciseId
    ? catalogById.get(templateExercise.exerciseId)
    : undefined
  if (byId) {
    return {
      exerciseId: byId.id,
      exerciseName: byId.name,
      videoUrl: byId.youtubeUrl ?? "",
    }
  }

  const byName = catalogByName.get(normalizeExerciseName(templateExercise.name))
  if (byName) {
    return {
      exerciseId: byName.id,
      exerciseName: byName.name,
      videoUrl: byName.youtubeUrl ?? "",
    }
  }

  return {
    exerciseId: null,
    exerciseName: templateExercise.name,
    videoUrl: templateExercise.youtubeUrl ?? "",
  }
}

function getAlternativesForExercise(
  templateExercise: ExercisePlan,
  catalog: ExerciseCatalogItem[],
): ExerciseCatalogItem[] {
  const byGroup = catalog.filter(
    (exercise) =>
      exercise.isActive && exercise.muscleGroup === templateExercise.muscleGroup,
  )

  if (!templateExercise.primaryMuscle) {
    return byGroup
  }

  const byPrimary = byGroup.filter(
    (exercise) => exercise.primaryMuscle === templateExercise.primaryMuscle,
  )

  return byPrimary.length ? byPrimary : byGroup
}

function WorkoutCardForm({
  defaultDate,
  splitType,
  isSaving,
  workout,
  onSaveSession,
}: WorkoutCardFormProps) {
  const [status, setStatus] = useState<FormStatus>(null)
  const [shouldAutoOpenRpeHelp, setShouldAutoOpenRpeHelp] = useState(false)

  const exerciseCatalogQuery = useExerciseCatalogQuery()
  const exerciseCatalog = exerciseCatalogQuery.data ?? []
  const canSwapExercises = exerciseCatalog.length > 0
  const catalogById = getCatalogById(exerciseCatalog)
  const catalogByName = getCatalogByName(exerciseCatalog)

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const hasSeenHelp = window.localStorage.getItem(WORKOUT_TERMS_HELP_SEEN_KEY)
    if (hasSeenHelp) {
      return
    }

    window.localStorage.setItem(WORKOUT_TERMS_HELP_SEEN_KEY, "1")
    setShouldAutoOpenRpeHelp(true)
  }, [])

  const form = useForm<WorkoutFormValues>({
    resolver: zodResolver(workoutFormSchema),
    defaultValues: createWorkoutFormDefaultValues(defaultDate, workout),
    mode: "onSubmit",
  })

  const { control, setValue, handleSubmit, reset, formState } = form

  const exerciseValues = useWatch({
    control,
    name: "exercises",
  })

  useEffect(() => {
    if (!canSwapExercises) {
      return
    }

    const currentExercises = form.getValues("exercises")
    let shouldUpdate = false

    const nextExercises = currentExercises.map((exercise) => {
      if (exercise.exerciseId) {
        return exercise
      }

      const byName = catalogByName.get(normalizeExerciseName(exercise.exerciseName))
      if (!byName) {
        return exercise
      }

      shouldUpdate = true
      return {
        ...exercise,
        exerciseId: byName.id,
        exerciseName: byName.name,
        videoUrl: byName.youtubeUrl ?? "",
      }
    })

    if (!shouldUpdate) {
      return
    }

    setValue("exercises", nextExercises, {
      shouldDirty: false,
      shouldTouch: false,
    })
  }, [canSwapExercises, catalogByName, form, setValue])

  const lastSessionQuery = useLastSessionQuery(workout.type, splitType)
  const lastSession = lastSessionQuery.data

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
            exerciseId: exercise.exerciseId,
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
          exerciseId: exercise.exerciseId,
          exerciseName: exercise.exerciseName,
          videoUrl: exercise.videoUrl,
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

    const exercises: WorkoutFormValues["exercises"] = workout.exercises.map(
      (exercise, exerciseIndex) => {
        const defaultExercise = resolveExerciseFromCatalog(
          exercise,
          catalogById,
          catalogByName,
        )

        const setsForOrder = lastSession.sets
          .filter((set) => set.exerciseOrder === exerciseIndex)
          .sort((a, b) => a.setOrder - b.setOrder)

        const firstSet = setsForOrder[0]

        let selectedExercise = defaultExercise

        if (firstSet?.exerciseId && catalogById.has(firstSet.exerciseId)) {
          const fromCatalog = catalogById.get(firstSet.exerciseId)
          if (fromCatalog) {
            selectedExercise = {
              exerciseId: fromCatalog.id,
              exerciseName: fromCatalog.name,
              videoUrl: fromCatalog.youtubeUrl ?? "",
            }
          }
        } else if (firstSet?.exerciseName) {
          const fromName = catalogByName.get(
            normalizeExerciseName(firstSet.exerciseName),
          )
          if (fromName) {
            selectedExercise = {
              exerciseId: fromName.id,
              exerciseName: fromName.name,
              videoUrl: fromName.youtubeUrl ?? "",
            }
          } else {
            selectedExercise = {
              exerciseId: null,
              exerciseName: firstSet.exerciseName,
              videoUrl: "",
            }
          }
        }

        if (!setsForOrder.length) {
          return {
            ...selectedExercise,
            sets: [{ weight: "", reps: "", rpe: "", technique: "" }],
          }
        }

        return {
          ...selectedExercise,
          sets: setsForOrder.map((set) => ({
            weight: set.weightKg ? String(set.weightKg) : "",
            reps: set.reps ? String(set.reps) : "",
            rpe: set.rpe ? String(set.rpe) : "",
            technique: (set.technique ?? "") as WorkoutFormValues["exercises"][number]["sets"][number]["technique"],
          })),
        }
      },
    )

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
            <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
              Última sessão
            </p>
            <p className="text-sm text-foreground">{summaryText}</p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={handleCopyFromLastSession}
            >
              Copiar da última sessão
            </Button>
          </div>
        ) : null}

        {!canSwapExercises ? (
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
            Catálogo de exercícios indisponível no momento. O treino continua com
            os exercícios da rotina.
          </div>
        ) : null}

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <div className="grid gap-3 md:grid-cols-2">
              <Controller
                name="date"
                control={control}
                render={({ field, fieldState }) => (
                  <Field className="space-y-1.5" data-invalid={fieldState.invalid}>
                    <FieldLabel
                      className="text-xs uppercase tracking-[0.08em] text-muted-foreground"
                      htmlFor={`${workout.type}-${field.name}`}
                    >
                      Data
                    </FieldLabel>
                    <DatePicker
                      id={`${workout.type}-${field.name}`}
                      value={parseISODate(field.value)}
                      onChange={(date) => field.onChange(date.toString())}
                      buttonClassName="h-11 border-border bg-background text-foreground"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="duration"
                control={control}
                render={({ field, fieldState }) => (
                  <Field className="space-y-1.5" data-invalid={fieldState.invalid}>
                    <FieldLabel
                      className="text-xs uppercase tracking-[0.08em] text-muted-foreground"
                      htmlFor={`${workout.type}-${field.name}`}
                    >
                      Duração (min)
                    </FieldLabel>
                    <Input
                      {...field}
                      id={`${workout.type}-${field.name}`}
                      type="number"
                      min={1}
                      step={1}
                      placeholder="Ex: 82"
                      className="h-11 border-border bg-background text-foreground"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>

            <Controller
              name="notes"
              control={control}
              render={({ field, fieldState }) => (
                <Field className="space-y-1.5" data-invalid={fieldState.invalid}>
                  <FieldLabel
                    className="text-xs uppercase tracking-[0.08em] text-muted-foreground"
                    htmlFor={`${workout.type}-${field.name}`}
                  >
                    Observações
                  </FieldLabel>
                  <Textarea
                    {...field}
                    id={`${workout.type}-${field.name}`}
                    placeholder="Técnica, dor, sensação de fadiga, etc."
                    className="min-h-20 border-border bg-background text-foreground"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>

          <div className="space-y-4">
            {workout.exercises.map((exerciseTemplate, exerciseIndex) => {
              const fieldPath = `exercises.${exerciseIndex}.exerciseId` as const
              const exerciseValue = exerciseValues?.[exerciseIndex]
              const options = getAlternativesForExercise(
                exerciseTemplate,
                exerciseCatalog,
              )

              return (
                <section
                  key={`${exerciseTemplate.name}-${exerciseIndex}`}
                  className="rounded-lg border border-border p-3"
                >
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="space-y-1">
                      <p className="font-semibold">{exerciseValue?.exerciseName ?? exerciseTemplate.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {exerciseValue?.videoUrl
                          ? "Inclui vídeo de execução"
                          : exerciseTemplate.detail}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Badge variant="outline">{exerciseTemplate.setsReps}</Badge>
                      {exerciseValue?.videoUrl ? (
                        <a
                          href={exerciseValue.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Ver execução de ${exerciseValue.exerciseName}`}
                          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary hover:underline focus-visible:text-primary focus-visible:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        >
                          Ver execução
                          <ArrowSquareOutIcon className="size-4" aria-hidden="true" />
                        </a>
                      ) : null}
                    </div>
                  </div>

                  <div className="mb-3">
                    <Controller
                      name={fieldPath}
                      control={control}
                      render={({ field }) => (
                        <Field className="space-y-1.5">
                          <FieldLabel className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
                            Exercício
                          </FieldLabel>
                          <Select
                            value={field.value ?? NO_EXERCISE_VALUE}
                            onValueChange={(nextValue) => {
                              if (!nextValue || nextValue === NO_EXERCISE_VALUE) {
                                return
                              }

                              const selected = catalogById.get(nextValue)
                              if (!selected) {
                                return
                              }

                              setValue(fieldPath, selected.id, { shouldDirty: true })
                              setValue(
                                `exercises.${exerciseIndex}.exerciseName`,
                                selected.name,
                                { shouldDirty: true },
                              )
                              setValue(
                                `exercises.${exerciseIndex}.videoUrl`,
                                selected.youtubeUrl ?? "",
                                { shouldDirty: true },
                              )
                            }}
                            disabled={!canSwapExercises || !options.length}
                          >
                            <SelectTrigger className="h-11 w-full border-border bg-background text-foreground">
                              <SelectValue
                                placeholder={
                                  canSwapExercises
                                    ? "Selecionar exercício"
                                    : "Catálogo indisponível"
                                }
                              >
                                {exerciseValue?.exerciseName ?? "Selecionar exercício"}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {!options.length ? (
                                <SelectItem value={NO_EXERCISE_VALUE} disabled>
                                  Sem alternativas
                                </SelectItem>
                              ) : (
                                options.map((option) => (
                                  <SelectItem key={option.id} value={option.id}>
                                    {option.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </Field>
                      )}
                    />
                  </div>

                  <ExerciseSetRows
                    control={control}
                    exerciseIndex={exerciseIndex}
                    autoOpenRpeHelp={shouldAutoOpenRpeHelp && exerciseIndex === 0}
                  />
                </section>
              )
            })}
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
              <span
                className={
                  status.kind === "error"
                    ? "text-sm text-destructive"
                    : "text-sm text-primary"
                }
              >
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
  workout,
  isSaving,
  onSaveSession,
}: WorkoutsSectionProps) {
  if (!workout) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Descanso planejado</CardTitle>
          <CardDescription>
            O dia selecionado está definido como descanso. Ajuste o plano da
            semana para registrar um treino neste dia.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Você ainda pode consultar os registros na tabela semanal acima.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <section className="space-y-6">
      <WorkoutCardForm
        key={`${workout.type}-${defaultDate}`}
        defaultDate={defaultDate}
        splitType={splitType}
        isSaving={isSaving}
        workout={workout}
        onSaveSession={onSaveSession}
      />
    </section>
  )
}
