import { ClockCountdownIcon } from "@phosphor-icons/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { WORKOUTS } from "@/features/training/constants"
import type { ExerciseInputRow, WorkoutFormsState, WorkoutPlan } from "@/features/training/types"
import type { WorkoutType } from "@/lib/training-types"

interface WorkoutsSectionProps {
  forms: WorkoutFormsState
  onUpdateFormField: (workoutType: WorkoutType, field: "date" | "duration" | "notes", value: string) => void
  onUpdateExerciseField: (
    workoutType: WorkoutType,
    rowIndex: number,
    field: keyof ExerciseInputRow,
    value: string
  ) => void
  onSaveLog: (workout: WorkoutPlan) => Promise<void>
  onClearForm: (workoutType: WorkoutType) => void
}

export function WorkoutsSection({
  forms,
  onUpdateFormField,
  onUpdateExerciseField,
  onSaveLog,
  onClearForm,
}: WorkoutsSectionProps) {
  return (
    <section className="space-y-6">
      {WORKOUTS.map((workout) => {
        const form = forms[workout.type]
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
                  <div className="space-y-4 border-t border-border p-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Data</label>
                        <Input
                          type="date"
                          value={form.date}
                          onChange={(event) => onUpdateFormField(workout.type, "date", event.target.value)}
                          className="border-border bg-background text-foreground"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
                          Duração (min)
                        </label>
                        <Input
                          type="number"
                          min={1}
                          step={1}
                          value={form.duration}
                          onChange={(event) => onUpdateFormField(workout.type, "duration", event.target.value)}
                          placeholder="Ex: 82"
                          className="border-border bg-background text-foreground"
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
                          Observações
                        </label>
                        <Textarea
                          value={form.notes}
                          onChange={(event) => onUpdateFormField(workout.type, "notes", event.target.value)}
                          placeholder="Como foi o treino, técnica, fadiga, dor, etc."
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
                                  value={form.rows[rowIndex].sets}
                                  onChange={(event) =>
                                    onUpdateExerciseField(workout.type, rowIndex, "sets", event.target.value)
                                  }
                                  placeholder="sets"
                                  className="h-8 border-border bg-background text-foreground"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <Input
                                  type="number"
                                  min={0}
                                  step={1}
                                  value={form.rows[rowIndex].reps}
                                  onChange={(event) =>
                                    onUpdateExerciseField(workout.type, rowIndex, "reps", event.target.value)
                                  }
                                  placeholder="reps"
                                  className="h-8 border-border bg-background text-foreground"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <Input
                                  type="number"
                                  min={0}
                                  step={0.5}
                                  value={form.rows[rowIndex].weight}
                                  onChange={(event) =>
                                    onUpdateExerciseField(workout.type, rowIndex, "weight", event.target.value)
                                  }
                                  placeholder="kg"
                                  className="h-8 border-border bg-background text-foreground"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        onClick={() => {
                          void onSaveLog(workout)
                        }}
                      >
                        Salvar no IndexedDB
                      </Button>
                      <Button variant="outline" onClick={() => onClearForm(workout.type)}>
                        Limpar Campos
                      </Button>
                      {form.status ? (
                        <span
                          className={form.status.kind === "error" ? "text-sm text-destructive" : "text-sm text-primary"}
                        >
                          {form.status.message}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </details>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </section>
  )
}
