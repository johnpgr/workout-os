import {
  useEffect,
  useState,
  type PropsWithChildren,
} from "react"
import { AuthContext, type AuthContextValue } from "@/lib/auth-context-store"
import { scheduleSync } from "@/lib/sync"
import { supabase } from "@/lib/supabase"

function getEmailRedirectUrl() {
  if (typeof window === "undefined") {
    return undefined
  }

  const basePath = import.meta.env.BASE_URL || "/"
  const normalizedBasePath = basePath.endsWith("/") ? basePath : `${basePath}/`
  return `${window.location.origin}${normalizedBasePath}auth/callback`
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthContextValue["user"]>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadInitialSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!isMounted) {
        return
      }

      setUser(session?.user ?? null)
      setIsLoading(false)

      if (session?.user) {
        scheduleSync("auth")
      }
    }

    void loadInitialSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setIsLoading(false)

      if (session?.user) {
        scheduleSync("auth")
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const contextValue: AuthContextValue = {
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    signInWithMagicLink: async (email: string) => {
      const redirectTo = getEmailRedirectUrl()

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo,
        },
      })

      if (error) {
        throw error
      }
    },
    signOut: async () => {
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw error
      }
    },
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}
