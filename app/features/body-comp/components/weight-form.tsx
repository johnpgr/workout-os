import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DatePicker } from "@/components/ui/date-picker"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useSaveWeightMutation } from "@/features/body-comp/queries"
import { getCurrentDate, parseDate } from "@/lib/temporal"

function isValidISODate(value: string): boolean {
  try {
    parseDate(value)
    return true
  } catch {
    return false
  }
}

const weightFormSchema = z.object({
  date: z
    .string()
    .min(1, "Informe a data da pesagem.")
    .refine((value) => isValidISODate(value), "Informe uma data válida."),
  weightKg: z
    .string()
    .trim()
    .refine((value) => Number.isFinite(Number(value)) && Number(value) > 0, "Informe um peso válido."),
  notes: z.string(),
})

type WeightFormValues = z.infer<typeof weightFormSchema>

export function WeightForm() {
  const saveWeightMutation = useSaveWeightMutation()
  const form = useForm<WeightFormValues>({
    resolver: zodResolver(weightFormSchema),
    defaultValues: {
      date: getCurrentDate().toString(),
      weightKg: "",
      notes: "",
    },
    mode: "onSubmit",
  })

  const { control, handleSubmit, reset, formState } = form

  async function onSubmit(values: WeightFormValues) {
    const parsedWeight = Number(values.weightKg)
    await saveWeightMutation.mutateAsync({
      date: values.date,
      weightKg: parsedWeight,
      notes: values.notes.trim(),
    })

    reset({
      ...values,
      weightKg: "",
      notes: "",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Peso diário</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup className="grid gap-3 md:grid-cols-2">
            <Controller
              control={control}
              name="date"
              render={({ field, fieldState }) => (
                <Field className="space-y-1" data-invalid={fieldState.invalid}>
                  <FieldLabel className="text-xs uppercase tracking-[0.08em] text-muted-foreground" htmlFor={`weight-${field.name}`}>
                    Data
                  </FieldLabel>
                  <DatePicker
                    id={`weight-${field.name}`}
                    value={isValidISODate(field.value) ? parseDate(field.value) : undefined}
                    onChange={(date) => field.onChange(date.toString())}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              control={control}
              name="weightKg"
              render={({ field, fieldState }) => (
                <Field className="space-y-1" data-invalid={fieldState.invalid}>
                  <FieldLabel className="text-xs uppercase tracking-[0.08em] text-muted-foreground" htmlFor={`weight-${field.name}`}>
                    Peso (kg)
                  </FieldLabel>
                  <Input
                    id={`weight-${field.name}`}
                    type="number"
                    step={0.1}
                    min={0}
                    {...field}
                    aria-invalid={fieldState.invalid}
                    placeholder="Ex: 76.4"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              control={control}
              name="notes"
              render={({ field, fieldState }) => (
                <Field className="space-y-1 md:col-span-2" data-invalid={fieldState.invalid}>
                  <FieldLabel className="text-xs uppercase tracking-[0.08em] text-muted-foreground" htmlFor={`weight-${field.name}`}>
                    Observações
                  </FieldLabel>
                  <Textarea
                    id={`weight-${field.name}`}
                    {...field}
                    placeholder="Retenção, refeição tardia, etc."
                    className="min-h-20"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>

          <div>
            <Button type="submit" disabled={saveWeightMutation.isPending || formState.isSubmitting}>
              Salvar peso
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
