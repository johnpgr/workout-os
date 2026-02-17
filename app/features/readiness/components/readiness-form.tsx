import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DatePicker } from "@/components/ui/date-picker"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useSaveReadinessMutation } from "@/features/readiness/queries"
import { calculateReadinessScore } from "@/features/readiness/types"
import { getCurrentDate, parseDate } from "@/lib/temporal"
import { addRecommendationIfMissing } from "@/lib/training-db"

const SCALE_OPTIONS = [1, 2, 3, 4, 5]

function isValidISODate(value: string): boolean {
  try {
    parseDate(value)
    return true
  } catch {
    return false
  }
}

const readinessFormSchema = z.object({
  date: z
    .string()
    .min(1, "Informe a data da prontidão.")
    .refine((value) => isValidISODate(value), "Informe uma data válida."),
  sleepHours: z
    .string()
    .trim()
    .refine((value) => Number.isFinite(Number(value)) && Number(value) >= 0.5 && Number(value) <= 12, "Informe de 0.5 a 12 horas de sono."),
  sleepQuality: z.number().int().min(1).max(5),
  stress: z.number().int().min(1).max(5),
  pain: z.number().int().min(1).max(5),
  notes: z.string(),
})

type ReadinessFormValues = z.infer<typeof readinessFormSchema>

interface ScaleButtonsProps {
  label: string
  value: number
  onChange: (value: number) => void
  errorMessage?: string
}

function ScaleButtons({ label, value, onChange, errorMessage }: ScaleButtonsProps) {
  return (
    <Field className="space-y-1" data-invalid={Boolean(errorMessage)}>
      <FieldLabel className="text-xs uppercase tracking-[0.08em] text-muted-foreground">{label}</FieldLabel>
      <div className="flex flex-wrap gap-2">
        {SCALE_OPTIONS.map((option) => (
          <Button
            key={`${label}-${option}`}
            type="button"
            size="sm"
            variant={value === option ? "default" : "outline"}
            className="h-11 min-w-11"
            onClick={() => onChange(option)}
            aria-invalid={Boolean(errorMessage)}
          >
            {option}
          </Button>
        ))}
      </div>
      <FieldError>{errorMessage}</FieldError>
    </Field>
  )
}

export function ReadinessForm() {
  const mutation = useSaveReadinessMutation()
  const form = useForm<ReadinessFormValues>({
    resolver: zodResolver(readinessFormSchema),
    defaultValues: {
      date: getCurrentDate().toString(),
      sleepHours: "7",
      sleepQuality: 3,
      stress: 3,
      pain: 2,
      notes: "",
    },
    mode: "onSubmit",
  })

  const { control, handleSubmit, formState } = form

  async function onSubmit(values: ReadinessFormValues) {
    const parsedSleepHours = Number(values.sleepHours)
    const readinessScore = calculateReadinessScore({
      sleepHours: parsedSleepHours,
      sleepQuality: values.sleepQuality,
      stress: values.stress,
      pain: values.pain,
    })

    await mutation.mutateAsync({
      date: values.date,
      sleepHours: parsedSleepHours,
      sleepQuality: values.sleepQuality,
      stress: values.stress,
      pain: values.pain,
      readinessScore,
      notes: values.notes.trim(),
    })

    if (readinessScore < 50) {
      await addRecommendationIfMissing({
        date: values.date,
        splitType: null,
        workoutType: null,
        kind: "reduce-intensity",
        message: "Prontidão baixa hoje. Considere reduzir intensidade em 5-10%.",
        reason: "Pontuação de prontidão < 50.",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Registro de Prontidão</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <div className="grid gap-3 md:grid-cols-2">
              <Controller
                control={control}
                name="date"
                render={({ field, fieldState }) => (
                  <Field className="space-y-1" data-invalid={fieldState.invalid}>
                    <FieldLabel className="text-xs uppercase tracking-[0.08em] text-muted-foreground" htmlFor={`readiness-${field.name}`}>
                      Data
                    </FieldLabel>
                    <DatePicker
                      id={`readiness-${field.name}`}
                      value={isValidISODate(field.value) ? parseDate(field.value) : undefined}
                      onChange={(date) => field.onChange(date.toString())}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                control={control}
                name="sleepHours"
                render={({ field, fieldState }) => (
                  <Field className="space-y-1" data-invalid={fieldState.invalid}>
                    <FieldLabel className="text-xs uppercase tracking-[0.08em] text-muted-foreground" htmlFor={`readiness-${field.name}`}>
                      Horas de sono
                    </FieldLabel>
                    <Input
                      {...field}
                      id={`readiness-${field.name}`}
                      type="number"
                      min={0.5}
                      max={12}
                      step={0.5}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>

            <Controller
              control={control}
              name="sleepQuality"
              render={({ field, fieldState }) => (
                <ScaleButtons
                  label="Qualidade do sono"
                  value={field.value}
                  onChange={field.onChange}
                  errorMessage={fieldState.error?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="stress"
              render={({ field, fieldState }) => (
                <ScaleButtons
                  label="Estresse"
                  value={field.value}
                  onChange={field.onChange}
                  errorMessage={fieldState.error?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="pain"
              render={({ field, fieldState }) => (
                <ScaleButtons
                  label="Dor articular"
                  value={field.value}
                  onChange={field.onChange}
                  errorMessage={fieldState.error?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="notes"
              render={({ field, fieldState }) => (
                <Field className="space-y-1" data-invalid={fieldState.invalid}>
                  <FieldLabel className="text-xs uppercase tracking-[0.08em] text-muted-foreground" htmlFor={`readiness-${field.name}`}>
                    Observações
                  </FieldLabel>
                  <Textarea
                    {...field}
                    id={`readiness-${field.name}`}
                    className="min-h-20"
                    placeholder="Sono picado, viagem, fadiga, etc."
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>

          <Button type="submit" disabled={mutation.isPending || formState.isSubmitting}>
            Salvar prontidão
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
