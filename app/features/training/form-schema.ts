import { z } from "zod"
import { parseISODate } from "@/features/training/helpers"
import type { WorkoutPlan } from "@/features/training/types"

const numericStringSchema = z
  .string()
  .trim()
  .refine((value) => value === "" || Number.isFinite(Number(value)), "Informe um número válido.")

const setSchema = z.object({
  weight: numericStringSchema,
  reps: numericStringSchema,
  rpe: numericStringSchema.refine((value) => {
    if (value === "") {
      return true
    }

    const numeric = Number(value)
    return Number.isFinite(numeric) && numeric >= 6 && numeric <= 10
  }, "RPE deve estar entre 6 e 10."),
  technique: z.enum(["", "dropset", "rest-pause", "superset", "myo-reps"]),
})

export const workoutFormSchema = z.object({
  date: z
    .string()
    .min(1, "Informe a data do treino.")
    .refine((value) => parseISODate(value) !== null, "Informe uma data válida."),
  duration: z
    .string()
    .trim()
    .min(1, "Informe a duração da sessão em minutos.")
    .refine((value) => Number.isFinite(Number(value)) && Number(value) > 0, "Informe a duração da sessão em minutos."),
  notes: z.string(),
  exercises: z.array(
    z.object({
      exerciseName: z.string().min(1),
      sets: z.array(setSchema).min(1, "Adicione pelo menos uma série."),
    })
  ),
})

export type WorkoutFormValues = z.infer<typeof workoutFormSchema>

export function createWorkoutFormDefaultValues(defaultDate: string, workout: WorkoutPlan): WorkoutFormValues {
  return {
    date: defaultDate,
    duration: "",
    notes: "",
    exercises: workout.exercises.map((exercise) => ({
      exerciseName: exercise.name,
      sets: Array.from({ length: exercise.defaultSets }, () => ({
        weight: "",
        reps: "",
        rpe: "",
        technique: "",
      })),
    })),
  }
}
