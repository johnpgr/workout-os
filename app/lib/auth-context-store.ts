import { createContext } from "react"
import type { User } from "@supabase/supabase-js"

export interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  signInWithMagicLink: (email: string) => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue>({} as AuthContextValue)
