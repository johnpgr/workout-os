import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { scheduleSync } from "@/lib/sync"

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function resolveAuthCallback() {
      try {
        const url = new URL(window.location.href)
        const code = url.searchParams.get("code")

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) {
            throw error
          }
        }

        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session?.user) {
          throw new Error("Nenhuma sessão autenticada foi encontrada após o callback.")
        }

        scheduleSync("auth")

        if (!cancelled) {
          navigate("/settings", { replace: true })
        }
      } catch (error) {
        if (cancelled) {
          return
        }

        setErrorMessage(error instanceof Error ? error.message : "Falha ao concluir a autenticação")
      }
    }

    void resolveAuthCallback()

    return () => {
      cancelled = true
    }
  }, [navigate])

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl items-center px-4 py-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">Concluindo acesso...</CardTitle>
        </CardHeader>
        <CardContent>
          {errorMessage ? (
            <p className="text-sm text-destructive">{errorMessage}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Aguarde enquanto finalizamos a autenticação.</p>
          )}
        </CardContent>
      </Card>
    </main>
  )
}

export default AuthCallbackPage
