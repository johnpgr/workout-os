import { NavLink } from "react-router"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ThemePreference } from "@/features/training/types"
import type { SplitType } from "@/lib/training-types"

interface AppHeaderProps {
  splitType: SplitType
  themePreference: ThemePreference
  onThemePreferenceChange: (value: ThemePreference) => void
}

function navClassName(isActive: boolean): string {
  return isActive
    ? "rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
    : "rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
}

export function AppHeader({ splitType, themePreference, onThemePreferenceChange }: AppHeaderProps) {
  return (
    <header className="space-y-3 text-center">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded-md border border-border px-2 py-1 text-xs uppercase tracking-[0.08em]">
            Split ativo: {splitType === "ppl" ? "PPL" : "Upper/Lower"}
          </span>
        </div>

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

      <h1 className="text-3xl font-black tracking-tight sm:text-5xl">Workout OS v1</h1>

      <nav className="mx-auto flex max-w-xl flex-wrap items-center justify-center gap-2">
        <NavLink to="/" className={({ isActive }) => navClassName(isActive)} end>
          Dashboard
        </NavLink>
        <NavLink to="/workout" className={({ isActive }) => navClassName(isActive)}>
          Workout
        </NavLink>
        <NavLink to="/progress" className={({ isActive }) => navClassName(isActive)}>
          Progress
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => navClassName(isActive)}>
          Settings
        </NavLink>
      </nav>
    </header>
  )
}
