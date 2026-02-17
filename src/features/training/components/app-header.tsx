import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ThemePreference } from "@/features/training/types"

interface AppHeaderProps {
  themePreference: ThemePreference
  onThemePreferenceChange: (value: ThemePreference) => void
}

export function AppHeader({ themePreference, onThemePreferenceChange }: AppHeaderProps) {
  return (
    <header className="space-y-3 text-center">
      <div className="flex justify-end">
        <div className="w-44">
          <Select value={themePreference} onValueChange={(value) => onThemePreferenceChange(value as ThemePreference)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Tema" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">Tema: Sistema</SelectItem>
              <SelectItem value="light">Tema: Claro</SelectItem>
              <SelectItem value="dark">Tema: Escuro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <h1 className="text-4xl font-black tracking-tight sm:text-6xl">Plano de Treino PPL</h1>
      <p className="text-sm text-muted-foreground sm:text-base">Retorno pós-pausa de 2 semanas</p>
    </header>
  )
}
