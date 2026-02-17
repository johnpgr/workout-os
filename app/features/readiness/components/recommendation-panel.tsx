import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  useRecommendationStatusMutation,
  useRecommendationsQuery,
} from "@/features/training/queries"

export function RecommendationPanel() {
  const recommendationsQuery = useRecommendationsQuery("pending")
  const recommendationMutation = useRecommendationStatusMutation()

  async function handleDecision(id: string, status: "accepted" | "ignored") {
    await recommendationMutation.mutateAsync({ id, status })
  }

  const recommendations = recommendationsQuery.data ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recomendações assistidas</CardTitle>
      </CardHeader>
      <CardContent>
        {!recommendations.length ? (
          <p className="text-sm text-muted-foreground">Sem recomendações pendentes.</p>
        ) : (
          <div className="space-y-3">
            {recommendations.map((recommendation) => (
              <article key={recommendation.id} className="rounded-lg border border-border p-3">
                <p className="font-semibold">{recommendation.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">{recommendation.reason}</p>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    disabled={recommendationMutation.isPending}
                    onClick={() => void handleDecision(recommendation.id, "accepted")}
                  >
                    Aceitar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={recommendationMutation.isPending}
                    onClick={() => void handleDecision(recommendation.id, "ignored")}
                  >
                    Ignorar
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
