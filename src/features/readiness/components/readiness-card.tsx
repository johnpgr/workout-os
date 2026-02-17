import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLatestReadinessQuery } from "@/features/readiness/queries"
import { getReadinessColor } from "@/features/readiness/types"

function scoreClass(score: number): string {
  const color = getReadinessColor(score)

  if (color === "green") return "text-emerald-500"
  if (color === "yellow") return "text-amber-500"
  return "text-destructive"
}

export function ReadinessCard() {
  const readinessQuery = useLatestReadinessQuery()
  const latest = readinessQuery.data

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Prontidão atual</CardTitle>
      </CardHeader>
      <CardContent>
        {!latest ? (
          <p className="text-sm text-muted-foreground">Sem registro de prontidão.</p>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Data: {latest.date}</p>
            <p className={`text-3xl font-bold ${scoreClass(latest.readinessScore)}`}>{latest.readinessScore}</p>
            <p className="text-sm text-muted-foreground">
              Sono {latest.sleepHours}h · Qualidade {latest.sleepQuality}/5 · Estresse {latest.stress}/5 · Dor {latest.pain}/5
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
