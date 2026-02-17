import { useEffect, useState } from "react"
import { Outlet } from "react-router"
import { AppFooter } from "@/features/training/components/app-footer"
import { AppHeader } from "@/features/training/components/app-header"
import { BottomNav } from "@/features/training/components/bottom-nav"
import { THEME_STORAGE_KEY } from "@/features/training/constants"
import { getInitialThemePreference } from "@/features/training/helpers"
import {
  useAppSettingQuery,
  useSetAppSettingMutation,
} from "@/features/training/queries"
import type { ThemePreference } from "@/features/training/types"
import type { SplitType } from "@/lib/training-types"

export interface AppLayoutContextValue {
  splitType: SplitType
  setSplitType: (splitType: SplitType) => Promise<void>
}

export function AppLayout() {
  const activeSplitQuery = useAppSettingQuery("active-split")
  const setSettingMutation = useSetAppSettingMutation()

  const [themePreference, setThemePreference] = useState<ThemePreference>(
    getInitialThemePreference,
  )

  const splitType: SplitType =
    activeSplitQuery.data?.value === "upper-lower" ? "upper-lower" : "ppl"

  useEffect(() => {
    if (!activeSplitQuery.isPending && !activeSplitQuery.data) {
      void setSettingMutation.mutateAsync({ key: "active-split", value: "ppl" })
    }
  }, [activeSplitQuery.data, activeSplitQuery.isPending, setSettingMutation])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")

    const applyTheme = (preference: ThemePreference) => {
      const effectiveTheme =
        preference === "system"
          ? mediaQuery.matches
            ? "dark"
            : "light"
          : preference

      document.documentElement.classList.toggle(
        "dark",
        effectiveTheme === "dark",
      )
      document.documentElement.style.colorScheme = effectiveTheme
    }

    applyTheme(themePreference)
    window.localStorage.setItem(THEME_STORAGE_KEY, themePreference)

    if (themePreference !== "system") {
      return
    }

    const onSystemThemeChange = () => applyTheme("system")
    mediaQuery.addEventListener("change", onSystemThemeChange)

    return () => {
      mediaQuery.removeEventListener("change", onSystemThemeChange)
    }
  }, [themePreference])

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 md:gap-8">
        <AppHeader
          splitType={splitType}
          themePreference={themePreference}
          onThemePreferenceChange={(value) => {
            setThemePreference(value)
            void setSettingMutation.mutateAsync({
              key: "theme-preference",
              value,
            })
          }}
        />

        <Outlet
          context={{
            splitType,
            setSplitType: async (nextSplitType: SplitType) => {
              await setSettingMutation.mutateAsync({
                key: "active-split",
                value: nextSplitType,
              })
            },
          }}
        />

        <AppFooter />
      </div>
      <BottomNav />
    </main>
  )
}

export default AppLayout
