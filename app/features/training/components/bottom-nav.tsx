import { BarbellIcon, ChartBarIcon, GearIcon, HouseIcon } from "@phosphor-icons/react"
import { NavLink } from "react-router"

function linkClassName(isActive: boolean): string {
  return isActive
    ? "flex flex-col items-center gap-1 text-primary"
    : "flex flex-col items-center gap-1 text-muted-foreground"
}

export function BottomNav() {
  return (
    <nav className="fixed right-0 bottom-0 left-0 z-50 border-t border-border bg-background/95 px-4 py-2 backdrop-blur md:hidden">
      <ul className="mx-auto grid max-w-lg grid-cols-4">
        <li>
          <NavLink to="/" className={({ isActive }) => linkClassName(isActive)} end>
            <HouseIcon className="size-5" />
            <span className="text-[11px]">Início</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/workout" className={({ isActive }) => linkClassName(isActive)}>
            <BarbellIcon className="size-5" />
            <span className="text-[11px]">Treino</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/progress" className={({ isActive }) => linkClassName(isActive)}>
            <ChartBarIcon className="size-5" />
            <span className="text-[11px]">Progresso</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/settings" className={({ isActive }) => linkClassName(isActive)}>
            <GearIcon className="size-5" />
            <span className="text-[11px]">Ajustes</span>
          </NavLink>
        </li>
      </ul>
    </nav>
  )
}
