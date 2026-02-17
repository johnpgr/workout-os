/* eslint-disable react/only-export-components */
import { lazy, Suspense, type ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router"
import { SyncRuntimeBridge } from "@/components/sync-runtime-bridge"
import { AuthProvider } from "@/lib/auth-context"
import type { Route } from "./+types/root"
import "@/index.css"

const queryClient = new QueryClient()
const ReactQueryDevtools = import.meta.env.DEV
  ? lazy(async () => {
      const module = await import("@tanstack/react-query-devtools")
      return { default: module.ReactQueryDevtools }
    })
  : null

export const meta: Route.MetaFunction = () => [{ title: "Workout OS" }]
export const links: Route.LinksFunction = () => [
  { rel: "icon", type: "image/svg+xml", href: "/vite.svg" },
]

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SyncRuntimeBridge />
        <Outlet />
      </AuthProvider>
      {ReactQueryDevtools ? (
        <Suspense fallback={null}>
          <ReactQueryDevtools initialIsOpen={false} buttonPosition="top-right" />
        </Suspense>
      ) : null}
    </QueryClientProvider>
  )
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!"
  let details = "An unexpected error occurred."
  let stack: string | undefined

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error"
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details
  } else if (import.meta.env.DEV && error instanceof Error) {
    details = error.message
    stack = error.stack
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl items-center px-4 py-8">
      <section className="w-full space-y-2">
        <h1 className="text-lg font-semibold">{message}</h1>
        <p className="text-sm text-muted-foreground">{details}</p>
        {stack ? (
          <pre className="w-full overflow-x-auto rounded border border-border p-4 text-xs">
            <code>{stack}</code>
          </pre>
        ) : null}
      </section>
    </main>
  )
}
