import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAllSessionsQuery } from "@/features/training/queries"
import { shouldSuggestDeload } from "@/features/readiness/types"
import { addRecommendationIfMissing } from "@/lib/training-db"

export function DeloadDetector() {
  const sessionsQuery = useAllSessionsQuery()

  const shouldDeload = useMemo(() => {
    return shouldSuggestDeload(sessionsQuery.data ?? [])
  }, [sessionsQuery.data])

  async function handleCreateSuggestion() {
    if (!shouldDeload) {
      return
    }

    const sessions = sessionsQuery.data ?? []
    const latestSession = sessions[0]

    if (!latestSession) {
      return
    }

    await addRecommendationIfMissing({
      date: latestSession.session.date,
      splitType: latestSession.session.splitType,
      workoutType: latestSession.session.workoutType,
      kind: "consider-deload",
      message: "Queda de volume nas últimas semanas. Considere iniciar deload reativo.",
      reason: "Volume load médio caiu >10% por 2 blocos consecutivos.",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Detector de Deload</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {shouldDeload
            ? "Padrão de fadiga detectado nas últimas sessões."
            : "Nenhum sinal forte de deload no momento."}
        </p>

        {shouldDeload ? (
          <Button type="button" variant="outline" onClick={() => void handleCreateSuggestion()}>
            Gerar recomendação de deload
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}
