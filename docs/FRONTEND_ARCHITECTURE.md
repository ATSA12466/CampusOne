# FRONTEND_ARCHITECTURE

## 1) Architecture overview
CampusOne uses a feature-first architecture where routes compose feature modules and avoid embedding business logic in page files.

## 2) Responsibility layers
- `src/app/`
  - Route groups: `(public)`, `(auth)`, `(student)`
  - Contains page entry files, layouts, and route boundaries (`loading`, `error`, `not-found`)
- `src/features/<feature>/`
  - Feature UI composition and feature-specific logic
  - Optional internal folders: `components/`, `hooks/`, `validation/`, `types/`
- `src/components/ui/`
  - Shared design-system primitives only
- `src/components/shared/`
  - Shared page patterns (header, empty state, search)
- `src/components/layout|navigation/`
  - Shell and navigation orchestration
- `src/data/demo/`
  - Domain-organized synthetic data
- `src/services/demo/`
  - Feature data adapters over demo datasets
- `src/services/api/`
  - Backend-ready API utility
- `src/services/auth/`
  - Authentication abstraction
- `src/stores/`
  - Persisted client state slices
- `src/types/`
  - Shared cross-feature models

## 3) Example feature structure
```text
src/features/tasks/
├── components/
│   ├── task-form-card.tsx
│   ├── task-list.tsx
│   └── task-stats.tsx
├── hooks/
│   └── use-task-filter.ts
├── validation/
│   └── task.schema.ts
└── index.tsx
```

## 4) Route composition rule
Route files should import feature entrypoints:
- `src/app/(student)/tasks/page.tsx` -> `features/tasks`
- `src/app/(student)/clubs/page.tsx` -> `features/clubs`
- `src/app/(student)/src-office/page.tsx` -> `features/src-office`

## 5) How to work with this architecture
### Find a feature
1. Start at `src/app/(student)/<route>/page.tsx`
2. Open referenced `src/features/<feature>/index.tsx`

### Modify UI for a feature
- Prefer editing feature-local components in `src/features/<feature>/components`
- Keep shared patterns in `src/components/shared`

### Change a data model
- Shared entity: `src/types/*`
- Feature-only type: colocate inside `src/features/<feature>/types`

### Update service behavior
- Demo mode: `src/services/demo/<domain>/*.service.ts`
- Backend mode: add/extend `src/services/api/<domain>.service.ts`

### Add a new route
1. Add `src/app/(student)/new-route/page.tsx`
2. Create `src/features/new-feature/index.tsx`
3. Add navigation entry in `src/components/navigation/nav-config.ts`

### Add a new feature module
1. Create `src/features/<feature>`
2. Split into subcomponents/hooks/validation when complexity justifies it
3. Avoid placing full implementation in route file

### Debug a broken interaction
1. Route -> feature entrypoint
2. Feature component event handlers
3. Zustand state updates (`src/stores`)
4. Service adapter responses (`src/services/demo` / `src/services/api`)

### Prepare feature for PHP API integration
1. Keep UI contract intact
2. Replace demo service calls with typed API service
3. Preserve fallback demo states during migration

## 6) Refactoring completed in audit
- Tasks split into smaller components + filtering hook
- Clubs split into card + executive panel with search/filter
- SRC Office moved from hardcoded inline data to typed service-backed panels and validated form
- Home carousel split and enhanced with swipe + indicators
- Student shell improved with mobile “More” drawer and grouped navigation
