import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { INFO_CARDS } from "@/features/training/constants"

export function TrainingOverview() {
  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {INFO_CARDS.map((item) => (
        <Card key={item.label} className="bg-card text-foreground ring-border">
          <CardHeader className="space-y-2 pb-3">
            <CardDescription className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              {item.label}
            </CardDescription>
            <CardTitle className="text-xl text-foreground">{item.value}</CardTitle>
          </CardHeader>
        </Card>
      ))}
    </section>
  )
}
