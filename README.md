# CampusOne Web

CampusOne is a modular, feature-based Next.js frontend for student productivity, participation, representation, and opportunities.

## Current status
Functional **frontend prototype** with role-aware demo workflows and strong backend integration boundaries. Ready for PHP API integration phase.

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
npm exec tsc -- --noEmit --pretty false
npm run build
npm run start
```

## Environment
- `NEXT_PUBLIC_API_BASE_URL` – future PHP API base URL
- Existing DB env values remain for project/platform health checks

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
