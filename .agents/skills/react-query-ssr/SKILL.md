---
name: react-query-ssr
description: Implement TanStack React Query server-side rendering with prefetching, dehydration, hydration, and cache-safe error handling. Use when building or reviewing SSR/SSG routes in Next.js App Router (or React SSR) that should preload query data on the server, avoid duplicate client fetches, and correctly distinguish not-found from transport/server failures.
---

# React Query SSR

Implement SSR in this order to keep behavior reliable and cache-friendly.

## React Compiler Memoization Policy

If React Compiler is enabled in the project, avoid adding manual memoization
(`useMemo`, `useCallback`, `memo`) for routine render optimization. Only add
manual memoization when correctness or a measured bottleneck requires it.

## Workflow
1. Define a shared query module with `queryKey`, `queryFn`, and cache policy (`staleTime`, optionally `gcTime`).
2. Reuse the same query options on server and client to prevent hydration misses.
3. Choose the correct server primitive:
- Use `fetchQuery` when server logic depends on returned data or should fail loudly.
- Use `prefetchQuery` when warming cache best-effort and ignoring errors is acceptable.
- Use `ensureQueryData` when returning cached data if present and only fetching when missing.
4. Dehydrate the same `QueryClient` used for prefetch/fetch and wrap output in `HydrationBoundary`.
5. Use `useQuery` on the client with the same `queryKey` and compatible options.
6. Map API semantics explicitly (`null`/404 vs transport error) before deciding `notFound()`.

## Server Pattern
Use this baseline in a Next.js App Router server component:

```tsx
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query"
import { notFound } from "next/navigation"

import { pageQueryOptions } from "@/lib/page/query"

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const queryClient = new QueryClient()

  const page = await queryClient.fetchQuery(pageQueryOptions(slug))
  if (!page) {
    notFound()
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PageClient slug={slug} />
    </HydrationBoundary>
  )
}
```

## Client Pattern
Consume preloaded data with the same query options:

```tsx
"use client"

import { useQuery } from "@tanstack/react-query"

import { pageQueryOptions } from "@/lib/page/query"

export function PageClient({ slug }: { slug: string }) {
  const { data, error, isPending } = useQuery({
    ...pageQueryOptions(slug),
    retry: false,
  })

  // Render loading/error/success states.
}
```

## Query Design Rules
- Keep query keys deterministic and scoped: include route params and auth scope where relevant.
- Keep `queryFn` side-effect free and return typed data or explicit `null` for not-found cases.
- Keep error classes/status metadata when the UI must branch on unauthorized vs generic failures.
- Keep `staleTime` non-zero for SSR routes that should avoid immediate refetch on mount.
- Keep server-only fetchers isolated from browser-only APIs.

## App Router Notes
- Reuse a request-scoped fetch function via `cache(...)` when metadata and page render request the same resource in one request.
- Override `queryFn` in `fetchQuery` with the cached fetcher only when deduping those server calls is required.
- Keep `HydrationBoundary` close to the subtree that consumes the queries to reduce payload size.

## Verification Checklist
- Confirm server and client use identical query keys.
- Confirm dehydrated state is generated from the same `QueryClient` that fetched data.
- Confirm 404 semantics are based on domain result (`null`/status 404), not generic fetch failures.
- Confirm no immediate duplicate request appears on first client render unless intentionally stale.

## References
- For complete Next.js App Router templates, read `references/next-app-router.md`.
- For failure-mode mapping and fixes, read `references/troubleshooting.md`.
