# CampusOne Web

CampusOne is a modular, feature-based Next.js frontend for student productivity, participation, representation, and opportunities.

## Current status
Functional **frontend prototype** with role-aware local demo workflows. The photo-first premium upgrade is in progress: **Phase 1 (audit) is complete**, not the redesign.

See [the design audit](docs/DESIGN_AUDIT.md) for the screen-by-screen findings, measured browser/Lighthouse baseline, implementation order, and remaining work. Authentication, messaging, AI, payments, and official ticket verification are not production services.

## Tech stack
- Next.js 16 (App Router)
- React 19 + TypeScript (strict)
- Tailwind CSS v4
- Zustand (persisted demo state)
- React Hook Form + Zod
- Lucide React
- Drizzle ORM/PostgreSQL baseline (health route + platform bootstrap)

## Key commands
```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm run build
npm run start
```

## Environment and reproducible builds
- Demo frontend builds do not require a running API or a `DATABASE_URL`.
- `/api/health` checks the existing PostgreSQL integration. Without `DATABASE_URL`, it truthfully returns HTTP 503 with `{ "ok": false }`; it does not report a healthy database.
- `NEXT_PUBLIC_API_BASE_URL` overrides the future backend client base. The legacy `:8000` localhost fallback is an audited issue; the upcoming service-foundation work will document the platform's `:4000` API and a preview-safe same-origin proxy. Do not use a browser-localhost URL in deployed/remote previews.
- The baseline font is bundled with its license via `next/font/local`, so builds do not fetch Google Fonts. See [font provenance](src/app/fonts/README.md).
- Responsive screenshot, workflow, axe, and Lighthouse audit instructions are in [DESIGN_AUDIT.md](docs/DESIGN_AUDIT.md#local-evidence-and-reproducibility). Audit tooling and generated output are isolated in ignored `.cache/` storage, not app dependencies.

## Folder map
- `src/app/` route entrypoints and route-level boundaries
- `src/features/` domain modules (home, tasks, clubs, src-office, etc.)
- `src/components/` shared UI/layout/navigation building blocks
- `src/data/demo/` synthetic domain datasets
- `src/services/demo/` demo adapters used by features
- `src/services/api/` backend-ready API client
- `src/services/auth/` auth abstraction layer
- `src/stores/` persisted app/session state slices
- `src/types/` shared entity models
- `docs/` architecture, inventory, API, design and test reports

## Demo honesty
Features depending on backend services (secure auth, real-time messaging, verified ticketing, payment, official record authority, AI generation) are clearly marked as demo behavior.
