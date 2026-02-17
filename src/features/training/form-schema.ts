import { z } from "zod"
import { parseISODate } from "@/features/training/helpers"

const numberInputSchema = z
  .string()
  .trim()
  .refine((value) => value === "" || Number.isFinite(Number(value)), "Informe um número válido.")

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
  rows: z.array(
    z.object({
      sets: numberInputSchema,
      reps: numberInputSchema,
      weight: numberInputSchema,
    })
  ),
})

export type WorkoutFormValues = z.infer<typeof workoutFormSchema>

export function createWorkoutFormDefaultValues(defaultDate: string, rowsLength: number): WorkoutFormValues {
  return {
    date: defaultDate,
    duration: "",
    notes: "",
    rows: Array.from({ length: rowsLength }, () => ({ sets: "", reps: "", weight: "" })),
  }
}
