import { CheckIcon } from "@phosphor-icons/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TIPS } from "@/features/training/constants"

export function TipsSection() {
  return (
    <section className="grid gap-4 md:grid-cols-2">
      {TIPS.map((tip) => (
        <Card key={tip.title} className="bg-card text-foreground ring-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <tip.icon className="size-5" weight="duotone" aria-hidden="true" />
              <span>{tip.title}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {tip.items.map((item) => (
                <li key={item} className="flex gap-2">
                  <CheckIcon className="mt-0.5 size-3.5 shrink-0 text-primary" weight="bold" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </section>
  )
}
