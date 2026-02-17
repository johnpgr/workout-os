import { useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useSaveReadinessMutation } from "@/features/readiness/queries"
import { calculateReadinessScore } from "@/features/readiness/types"
import { getCurrentDate } from "@/lib/temporal"
import { addRecommendationIfMissing } from "@/lib/training-db"

const SCALE_OPTIONS = [1, 2, 3, 4, 5]

interface ScaleButtonsProps {
  label: string
  value: number
  onChange: (value: number) => void
}

function ScaleButtons({ label, value, onChange }: ScaleButtonsProps) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">
        {SCALE_OPTIONS.map((option) => (
          <Button
            key={`${label}-${option}`}
            type="button"
            size="sm"
            variant={value === option ? "default" : "outline"}
            className="h-11 min-w-11"
            onClick={() => onChange(option)}
          >
            {option}
          </Button>
        ))}
      </div>
    </div>
  )
}

export function ReadinessForm() {
  const mutation = useSaveReadinessMutation()

  const [date, setDate] = useState(getCurrentDate().toString())
  const [sleepHours, setSleepHours] = useState("7")
  const [sleepQuality, setSleepQuality] = useState(3)
  const [stress, setStress] = useState(3)
  const [pain, setPain] = useState(2)
  const [notes, setNotes] = useState("")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const parsedSleepHours = Number(sleepHours)
    if (!Number.isFinite(parsedSleepHours) || parsedSleepHours <= 0) {
      return
    }

    const readinessScore = calculateReadinessScore({
      sleepHours: parsedSleepHours,
      sleepQuality,
      stress,
      pain,
    })

    await mutation.mutateAsync({
      date,
      sleepHours: parsedSleepHours,
      sleepQuality,
      stress,
      pain,
      readinessScore,
      notes: notes.trim(),
    })

    if (readinessScore < 50) {
      await addRecommendationIfMissing({
        date,
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
        <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-[0.08em] text-muted-foreground" htmlFor="readiness-date">
                Data
              </label>
              <Input id="readiness-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </div>

            <div className="space-y-1">
              <label className="text-xs uppercase tracking-[0.08em] text-muted-foreground" htmlFor="readiness-sleep-hours">
                Horas de sono
              </label>
              <Input
                id="readiness-sleep-hours"
                type="number"
                min={0}
                max={12}
                step={0.5}
                value={sleepHours}
                onChange={(event) => setSleepHours(event.target.value)}
              />
            </div>
          </div>

          <ScaleButtons label="Qualidade do sono" value={sleepQuality} onChange={setSleepQuality} />
          <ScaleButtons label="Estresse" value={stress} onChange={setStress} />
          <ScaleButtons label="Dor articular" value={pain} onChange={setPain} />

          <div className="space-y-1">
            <label className="text-xs uppercase tracking-[0.08em] text-muted-foreground" htmlFor="readiness-notes">
              Observações
            </label>
            <Textarea
              id="readiness-notes"
              className="min-h-20"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Sono picado, viagem, fadiga, etc."
            />
          </div>

          <Button type="submit" disabled={mutation.isPending}>
            Salvar prontidão
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
