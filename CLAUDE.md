# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Clínica Universitaria UTC — a thesis project (proyecto de tesis universitaria). A clinic management
system with four roles (`paciente`, `practicante`, `admin`, `master`), split across two clinical areas
(`nutricion`, `fisioterapia`). React/TypeScript frontend + a separate Express/PostgreSQL backend
(`utc-api/`). Originally scaffolded from a Figma Make template (see `ATTRIBUTIONS.md`); has since
diverged heavily from that scaffold (real JWT auth, real Postgres schema, MVC backend).

## Commands

Run from the repo root unless noted.

```bash
npm run dev            # starts BOTH backend (utc-api, port 3001) and frontend (Vite, port 5173) via concurrently
npm run dev:frontend    # Vite only
npm run dev:backend     # cd utc-api && npm run dev (node --watch index.js; auto-frees the port first)
npm run build           # vite build (frontend only — there is no backend build step, it's plain Node)
npx tsc --noEmit        # typecheck the frontend; there is currently NO lint script and NO test runner configured
```

Backend (`utc-api/`) requires a `.env` (see `utc-api/.env.example`) with Postgres (Render) credentials,
`JWT_SECRET`/`JWT_REFRESH_SECRET`/`JWT_ACCESS_TTL`, Resend/email credentials, and `CORS_ORIGINS`. There
is no seed/migrate command beyond manually running the SQL in `utc-api/migrations/` against the DB.

There is no automated test suite. Verification in this repo is done by running the app for real
(`curl`/Playwright against the live backend+DB, or `npx tsc --noEmit` for type safety) — see
"Verification conventions" below.

## Architecture

### Two independent processes, one repo
- `src/` — React 18 + TypeScript + Vite frontend (`@` aliases to `src/`).
- `utc-api/` — Express + `pg` (raw SQL, no ORM) backend, MVC-organized: `routes/` → `controllers/` →
  `middleware/`, plus `services/` for email and scheduled jobs. Its own `package.json`/`node_modules`.
- `npm run dev` at the root runs both concurrently. They talk over HTTP; the frontend never imports
  backend code or touches the DB directly.

### Backend structure (`utc-api/`)
- `index.js` is a thin bootstrap: global middleware (`cors`, `express.json`), mounts each `routes/*.js`
  under `/api`, exposes `/api/health`. All business logic lives in `controllers/`.
- `db.js` exports a single shared `pg.Pool` — always `require('../db')`, never instantiate a second Pool.
- `middleware/authMiddleware.js` is the security core:
  - `verifyToken`/`requireAuth` — verifies the JWT `Authorization: Bearer` access token. **Has a
    legacy fallback** that trusts an unsigned `email` request header if no Bearer token is present —
    this exists only for any remaining unmigrated call sites and should not be extended; new code
    should always go through the JWT path.
  - `requireRole(['admin','master', ...])` — role allowlist.
  - `requireSameArea` — for admin-scoped routes keyed by `:id`, confirms the target user's `area`
    matches the requesting admin's `area` (master bypasses).
  - `canModifyAppointment` — per-row ownership check for `citas`: master = any, admin = same `area`
    as the cita's `tipo`, paciente = only their own `paciente_id`, practicante = never (403).
  - Also issues tokens: `signAccessToken` (JWT, short TTL), `generateRefreshToken` (opaque random
    token, **stored hashed** via `hashToken` = SHA-256, never the raw token) — see
    `migrations/001_refresh_tokens.sql` for the `refresh_tokens` table.
- Real Postgres table names (do not confuse with the stale Supabase-era docs — see "Stale docs" below):
  `usuarios`, `citas`, `historiales_nutricion`, `historiales_fisioterapia`, `historiales_medicos`,
  `notas_evolucion`, `notas_universitarias`, `metricas`, `correos_especiales`, `refresh_tokens`,
  `logs_sistema`. (`practicantes_autorizados` was dropped in migration 007 — fully removed.)
- The actual UI path for activating/deactivating a practicante goes through
  `usuariosAPI.updateStatus` → `usuariosController.updateStatus`, which updates `usuarios.status`.
  `practicantesController` only exposes `getAll` and `create`; there is no `updateStatus` there.
- `primer_inicio` flow: new practicante accounts get a temp password `UTC<matricula>` (bcrypt-hashed)
  and `primer_inicio = true`. Login detects the flag and returns `{ requiereCambioPassword: true }`
  *without* issuing tokens; the frontend redirects to `/cambiar-password-inicial`, which re-verifies
  the temp password server-side (`POST /api/auth/cambiar-password-inicial`) before issuing a real
  session. `primer_inicio` defaults to `false` at the DB level — only deliberately provisioned accounts
  should ever have it `true`.

### Frontend structure (`src/app/`)
- `App.tsx` → `AuthProvider` (`contexts/AuthContext.tsx`) → `RouterProvider` (`routes.tsx`).
- `routes.tsx`'s `DashboardRouter` is the single place that maps `(rol, area)` → which dashboard
  component renders at `/dashboard`. There are 6 role/area-specific dashboards in `pages/` (not one
  generic dashboard): `MasterAdminDashboard`, `NutritionAdminDashboard`, `PhysiotherapyAdminDashboard`,
  `NutritionPractitionerDashboard`, `PhysiotherapyPractitionerDashboard`, `PatientDashboard`. Shared
  behavior between these is intentionally duplicated per-file rather than abstracted into one
  parameterized dashboard — when changing one (e.g. a UI tweak that should apply "to all panels"),
  expect to repeat the edit across all six.
- `lib/api/` is the **single** HTTP boundary — no component calls `fetch()` directly.
  - `client.ts`: holds the in-memory access token, persists the refresh token in `localStorage`
    (`utc_refresh_token`), and `apiFetch`/`apiFetchJson` transparently retry once after a silent
    `/auth/refresh` on a 401. `bootstrapSession()` is called once on app mount to exchange a stored
    refresh token for a fresh session.
  - One `*API.ts` file per backend resource (`authAPI`, `usuariosAPI`, `citasAPI`, `historialesAPI`,
    `notasAPI`, `practicantesAPI`, `recomendacionesAPI`, `metricasAPI`), all re-exported from
    `lib/api/index.ts`. Add new endpoints here, not as ad-hoc fetches in components.
- `contexts/AuthContext.tsx`: `login()` rejects the promise with `{ requiereCambioPassword: true, email }`
  (not a thrown error) when the backend signals first-login — callers must check for that shape in
  their `.catch`/`try` rather than treating every rejection as a login failure.
- `lib/citasHelpers.ts`: shared cita-status rules (`esFechaPasada`, `esCitaBloqueada`,
  `getEstadoBadgeClasses`) used by the dashboards to color-code and lock past/completed citas. The
  backend re-enforces the same past/completed block in `citasController.js` (`update`/`asignar`) as a
  defense-in-depth backstop — keep both in sync if this rule changes.
- Day/Month appointment filtering is a shared 3-component pattern, not duplicated logic:
  `components/DateFilterPicker.tsx` (single-day picker), `components/MonthFilterPicker.tsx` (month
  navigator), `components/ViewModeToggle.tsx` (Día/Mes switch) — each takes a `theme: 'blue' | 'orange'`
  prop to match nutrición vs. fisioterapia branding.

### Styling conventions
- Tailwind CSS v4 (`@tailwindcss/vite`, no `tailwind.config` needed for spacing). The spacing scale is
  **dynamic**: any numeric value, including decimals (`h-8.75`, `px-4.5`), resolves to
  `calc(var(--spacing) * N)` with `--spacing` = 4px — no arbitrary-value bracket syntax required. This
  is used throughout for fine pixel-level sizing tweaks.
- `components/ui/*` are shadcn-style primitives (`Button`, `Card`, `Select`, `Tabs`, etc.) built on
  `class-variance-authority` + the `cn()` helper (`tailwind-merge`). Adjust shared sizing in
  `ui/button.tsx`'s `buttonVariants` rather than overriding per-call-site when the change is global.
- Color identity (blue = master/fisioterapia-adjacent chrome, orange = nutrición) and overall layout
  shape are treated as fixed brand decisions — visual tweaks in this repo tend to be narrow
  spacing/sizing adjustments, not restyles.

### Stale docs (do not treat as current architecture)
`docs/VARIABLES_ENTORNO.md`, `docs/INSTRUCCIONES_PROYECTO_UTC.md`, `docs/GUIA_USO_SUPABASE.md`, and
`docs/README_BASE_DATOS.md` describe an earlier Supabase-backed design (different table/column names,
`localStorage`-based data, RLS policies) that predates the current direct Postgres+Express backend and
no longer matches the code. `docs/CAMBIOS_REALIZADOS_2026-06-21.md` and `docs/AUDITORIA_INTEGRAL_2026.md`
are accurate and current — they document the actual security/JWT/MVC migration. When in doubt about
which doc reflects reality, trust the code (`utc-api/controllers/`, `db.js`) over the older docs; per
standing instruction, don't delete the stale docs even when confirmed outdated.

## Verification conventions

- No test runner is configured. "Done" means: `npx tsc --noEmit` is clean (or shows only the existing
  pre-existing error baseline — check before/after a change), and for behavior changes, the change was
  actually exercised against the running backend/DB (`curl`, or a disposable Playwright script), not
  just read over.
- If writing a throwaway Playwright/Node verification script, put it in a scratch directory (e.g.
  `.qa-tmp/`) with **its own minimal `package.json`** before running `npm install` there — `npm install`
  walks up to the nearest `package.json` if the scratch dir doesn't have one, and will silently pollute
  the root project's `package.json`/`package-lock.json`.
- Don't skip hooks or restructure unrelated code to make a verification pass; investigate root causes
  (e.g. a stale Vite dev server, a CSS stacking-context issue) rather than working around them.
