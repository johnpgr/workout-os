import { CaretRightIcon, WarningIcon } from "@phosphor-icons/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { INFO_CARDS, RETURN_GUIDANCE } from "@/features/training/constants"

export function TrainingOverview() {
  return (
    <>
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

      <Card className="border-l-4 border-l-border">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <WarningIcon className="size-5" weight="fill" aria-hidden="true" />
            <span>Orientações Pós-Retorno</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {RETURN_GUIDANCE.map((item) => (
              <li key={item} className="flex gap-2">
                <CaretRightIcon className="mt-0.5 size-3.5 shrink-0" weight="bold" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </>
  )
}
