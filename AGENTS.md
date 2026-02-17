# Repository Guidelines

## Project Structure & Module Organization
- `app/` holds app code. Entrypoints: `app/root.tsx`, `app/routes.ts`.
- `app/features/` is organized by domain (`training`, `progress`, `body-comp`, `readiness`) with local `components/`, `queries.ts`, and types/helpers.
- `app/components/ui/` stores reusable UI primitives; `app/pages/` and `app/layouts/` hold route-level composition.
- `app/lib/` contains shared infrastructure (Supabase client, sync, temporal/date helpers, auth context).
- `supabase/migrations/` contains SQL migrations; `public/` holds static assets; `docs/` has product/domain notes; `dist/` is build output.

## Build, Test, and Development Commands
- `pnpm install`: install dependencies.
- `pnpm dev`: run Vite dev server.
- `pnpm typecheck`: run TypeScript checks (`tsc -b`).
- `pnpm build`: type-check (`tsc -b`) and produce production bundle in `dist/`.
- `pnpm preview`: serve the production build locally.
- `pnpm lint` / `pnpm lint:fix`: run/fix lint rules via `oxlint`.
- `pnpm format` / `pnpm format:check`: format/check code via `oxfmt`.

## Coding Style & Naming Conventions
- Language stack: TypeScript + React 19.
- Formatting is enforced by `oxfmt` (`printWidth: 80`, `semi: false`); lint rules are in `.oxlintrc.json`.
- Prefer small feature modules and colocate domain logic with the feature.
- Use kebab-case for filenames (for example, `readiness-card.tsx`, `volume-utils.ts`).
- Keep route components in `app/pages/` and shared primitives in `app/components/ui/`.

## Architecture Overview
- The app boots in `app/root.tsx`, wires providers (React Query/auth), and renders route-driven pages via `app/routes.ts`.
- Feature modules in `app/features/*` own UI, query logic, and types for each domain; pages compose these modules.
- Persistence is split: local-first session/log data in IndexedDB helpers (`app/lib/training-db.ts`) and cloud sync/auth via Supabase (`app/lib/supabase.ts`, `app/lib/sync.ts`).
- SQL schema, RLS, and sync RPC changes must be versioned only through `supabase/migrations/`.

## Testing Guidelines
- No automated test runner is configured yet in `package.json`.
- Minimum quality gate for every change: `pnpm typecheck`, `pnpm lint`, `pnpm build`, and a smoke test in `pnpm dev`.
- If you add tests, colocate as `*.test.ts`/`*.test.tsx` near the feature and include the corresponding script changes in the same PR.

## Commit & Pull Request Guidelines
- Follow Conventional Commit style (`feat:`, `refactor:`, `fix:`), optional scope (`feat(settings): ...`).
- Keep commit messages imperative and concise; separate refactors from behavior changes.
- PRs should include: summary, linked issue (if any), UI screenshots, and migration notes for `supabase/migrations/` changes.

## Security & Configuration Tips
- Create `.env` from `.env.example` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Do not commit secrets, local env files, or generated artifacts.
