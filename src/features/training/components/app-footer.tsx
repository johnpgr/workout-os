import { BarbellIcon, WarningIcon } from "@phosphor-icons/react"

export function AppFooter() {
  return (
    <footer className="space-y-1 pb-4 text-center text-sm text-muted-foreground">
      <p className="flex items-center justify-center gap-2">
        <BarbellIcon className="size-4" aria-hidden="true" />
        <span>Plano criado para retorno gradual após pausa de 2 semanas | Adaptável conforme evolução individual</span>
      </p>
      <p className="flex items-center justify-center gap-2 text-xs">
        <WarningIcon className="size-4" aria-hidden="true" />
        <span>Consulte um profissional de educação física para ajustes personalizados.</span>
      </p>
    </footer>
  )
}
