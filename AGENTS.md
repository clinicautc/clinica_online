# Repository Guidelines

## Project Structure & Module Organization

This repository contains the UTC clinical-management application. The React/Vite frontend lives in `src/`: route-level screens are in `src/app/pages/`, shared UI in `src/app/components/`, data and form logic in `src/app/hooks/` and `src/app/lib/`, and global styles in `src/styles/`. Static images and icons belong in `public/`.

The Express API is isolated in `utc-api/`. Keep HTTP endpoints in `routes/`, request handling in `controllers/`, reusable domain logic in `services/`, and authentication in `middleware/`. Database schema changes are ordered SQL files in `utc-api/migrations/`. Supporting project and database documentation is in `docs/`.

## Build, Test, and Development Commands

- `npm install` installs frontend dependencies; run `npm install` in `utc-api/` separately for API dependencies.
- `npm run dev` starts the frontend and API together.
- `npm run dev:frontend` starts Vite only; `npm run dev:backend` starts the API with file watching.
- `npm run build` creates the production frontend bundle in `dist/`.
- `npx tsc --noEmit` performs the available TypeScript type check. No automated test runner is currently configured.

## Coding Style & Naming Conventions

Use TypeScript/TSX for frontend code and ES module JavaScript for the API. Follow the existing four-space indentation, single quotes, and semicolon style. Name React components and pages in PascalCase (for example, `PatientDashboard.tsx`), hooks with a `use` prefix (`useBodyMarkers.ts`), and utility modules in camelCase. Keep route, controller, and service names aligned by feature, such as `citasRoutes.js` and `citasController.js`.

## Testing Guidelines

Before submitting frontend changes, run `npx tsc --noEmit` and `npm run build`. Manually exercise the affected workflow with `npm run dev`, including API calls when a screen depends on them. For new backend behavior, validate the relevant endpoint locally and add focused tests when a test framework is introduced.

## Commit & Pull Request Guidelines

Recent commits use short, imperative Spanish summaries, such as `ajustes formulario Nutricion` and `Responsividad para mobiles`. Keep commits narrowly scoped and describe the affected feature. Pull requests should state the user-visible change, list verification performed, link related issues when available, and include screenshots for UI or responsive-layout changes. Do not commit `.env.local` or other credentials; document required configuration in `docs/` instead.
