# Frontend architecture

## Product and phase boundary

CampusOne (`campusone-web`) is a Next.js 16 App Router / React 19 student-app frontend. Phase 1 audited the baseline. Phase 2 establishes semantic light/dark themes, local fonts, media/UI primitives, development showcase, route metadata and a typed read-service boundary. Phase 3 adds the grouped/collapsible shell, mobile tabs + More and global search. Phase 4 adds the server-composed magazine Home with a bounded typed feed, actual deferred video and device-only planner. Later phases replace auth/feature experiences in the agreed order; this is not a finished live campus platform.

## Directory map

```text
src/
  app/                      # Route composition, metadata, boundaries, fonts/CSS
    (student)/              # Existing URL group + shared student shell
    design/                 # Development-only component/media examples
    api/health/             # Existing optional PostgreSQL health probe
  proxy.ts                  # Narrow pre-stream production /design 404 guard
  features/<name>/
    components/             # Small feature compositions
    hooks/                  # Feature interaction state
    validation/             # Zod form schemas
    index.tsx               # Feature entry point
  components/
    ui/                     # CVA + native/Radix primitives
    media/                  # CampusImage, cards/hero/gallery/uploader + scoped hooks
    shared/                 # Brand, page header, loading/empty/error/404 states
    theme/                  # Pre-paint bootstrap + external store/controls
    layout/, navigation/    # Persistent grouped shell + lazy overlay entry points
  config/                   # App/env, theme, image registry, metadata, API paths
  types/                    # Shared entities, media/UI/theme/service contracts
  services/
    index.ts                # Public boundary + lazy async catalog/search/Home
    home/                   # Concurrent bounded snapshot assembly
    demo/                   # Deterministic/read-only typed fixtures + compatibility
    api/                    # Validated requests and provisional backend adapter
    auth/                   # Explicit local demo authentication
    validation/             # Runtime entity/page/query schemas
  data/demo/                # Fixture storage; UI never imports it directly
  stores/                   # Zustand auth/app demo state; small serializable data
  hooks/                    # Shell overlay and sidebar external-store hooks
  lib/media/                # Pure crop geometry + native canvas compression
  lib/search/               # Pure search normalization and ranking
  lib/home/                 # Active/date selectors and Accra now/next/tasks
```

## Server/client boundaries

Prefer Server Components for initial entity reads, metadata and page composition. Pass serializable DTOs into the smallest interactive client subtree. Do not send schemas, request headers, Files or browser APIs through server/client props.

The `/design` feature illustrates this separation: the server reads catalog data and composes sections; interactive controls, overlays, gallery and uploader are separate small client modules. Existing feature entries remain largely client components for compatibility. Their scheduled phases will migrate reads/layouts rather than performing a risky app-wide async rewrite in the foundation phase.

Navigation and Home/composed discovery links disable automatic off-route prefetch: the baseline eager policy fetched untouched route schemas on initial Home. Future intent-based prefetch should respect device/network constraints. Use leaf imports for client components where practical. No animation or image-processing library was introduced: CSS transitions/snap, ImageBitmap, canvas and existing Next/sharp handle those jobs. Radix is used for appropriate focus, choice, menu, tooltip and overlay semantics.

## Home composition and deferred UI

`(student)/home/page.tsx` is per-request: server headers establish a fresh clock/feed and only explicitly allowlisted session cookies reach the trusted API adapter. `HomeFeature` concurrently reads seven collections through `homeFeedService`; no private request header becomes a client prop. API catalog GETs use `cache: "no-store"`, each Home read has an eight-second deadline, and failed/truncated sections remain explicit rather than falling back to demos.

The server composes placement slides, Clubs hero, photo destinations, institutional links and date-sorted recommendations. Small client islands own the native snap carousel, minute-resolution Accra clock, persisted demo tasks/undo/progress and retry. A failed source does not remove the independent shortcuts. An empty active placement list creates no carousel or reserved advertising container. Recommendations use progressive `content-visibility` below the fold while remaining in the document and keyboard reachable.

The player is imported only after Play; native WebM bytes/captions are absent from initial Home. Playback is manual, errors have a real retry, the transcript remains available and closing unmounts the video. Cmd/Ctrl+K does not open a second shell overlay over a feature dialog or appearance menu. Chromium native-control shadow UI can consume Escape internally; the application's Close control is reachable by keyboard and Escape works from dialog-owned controls.

The header's `AppearanceTrigger` intent-loads the existing menu/control module; the first click opens it. First-paint/system theme resolution remains eager. `ToastProvider` keeps a lean queue/context and imports Radix `ToastStack` only for a message; failed code delivery retains a dismissible native status/alert instead of dropping feedback. `demoAppStateService.initial()` clones just the four persisted-state seeds, without making shell initialization depend on every compatibility catalog reader. Existing executive membership/task data and store actions are unchanged.

See [Phase 4 Home](PHASE4_HOME.md) for the collection, media and development-fixture contracts. The homepage is not a claim of live personal data, official timetables or personalized AI recommendations.

## Shell and search boundaries

`config/navigation.ts` composes typed campus/student groups from `config/navigation/`. All 24 static student routes have exactly one destination; desktop, More and route shortcuts consume that same source. Four mobile destinations plus More keep the tab bar legible. Active matching respects a route-segment boundary and includes detail URLs.

`config/sidebar.ts` supplies a trusted constant prepaint script. `useSidebarPreference` uses `useSyncExternalStore` for document-local state, reload/storage-event synchronization and private-storage fallback. `app/styles/shell.css` owns 17rem expanded / 5.5rem compact widths at the 1024px breakpoint. Collapsing never removes accessible link names or access to lower destinations; the rail scrolls internally.

`StudentShell` owns route-change main focus and `useShellOverlays` owns one menu/search intent. Menu and search modules are imported only when requested, then remain mounted while closed so Radix can clean up and return focus. Loading can be cancelled before a chunk finishes; a late import must not reopen the panel. Menu-to-search keyboard switching cannot leave two dialogs open. Failed chunk delivery offers **Reload page** with a save-changes warning: a cached module rejection cannot truthfully be repaired by pretending an in-page import retry succeeded.

`features/search/{components,hooks,validation}` calls the public `searchService`. Query/scope/retry changes abort prior work; late replies are ignored even from an uncooperative source. The 225ms debounce and schema bound requests. Service creation and catalog adapters stay lazy. Search results are mapped from validated catalog entities and local destination configuration, never UI dataset imports.

The development `/design` navigation section supplies explicit error/partial/slow fixtures through a public preview service. These fixtures are absent from initial Home delivery and do not certify the real backend. Search terms are kept in component memory, not localStorage.

## Data boundaries

- All UI and initial store seeds use `@/services`.
- `campusService.list/get` is asynchronous and selects demo/API from app config; unused adapter/schema code loads only when a consumer calls it.
- The generic typed collection map contains 18 entity collections, including the proposed `featured` placement collection.
- Demo list results are cloned; search/category/sort/pagination/abort are predictable.
- API response/query schemas validate the boundary. HTTP/offline/invalid-envelope/abort are distinct outcomes.
- Legacy synchronous exports remain demo-only. API mode is **not** a promise that all old UI now uses a real server.
- Mutations, auth, uploads, real-time/AI and authoritative academic data require actual backend contracts and future feature integration.

Small serializable local state is suitable for a labelled demo. Do not persist image files, blob URLs, private tokens or pretend client role changes are authorization. Legacy sign-out/persistence limitations remain documented in the test report/audit and are scheduled auth/feature work.

## Design and media boundaries

Semantic raw values exist only in central CSS; typed references live in `config/theme.ts`. Components use role utilities, not literal palettes. The inline bootstrap resolves appearance before paint; the root provider synchronizes the same preference across reloads/tabs/device changes.

All static photo URLs are centralized in `config/images.ts`. `CampusImage` owns aspect/fit/focal/sizes/loading/source policy/fallback. Meaningful media uses `next/image`, not CSS backgrounds. `CampusMedia` also records alt/provenance and optional source notes. Generated photos depict fictional people/a campus, and existing SVG stand-ins are labelled.

Uploader validation/crop/compression is independent of transport. The hook protects asynchronous replacement/unmount work; native geometry/encoding has a small unit-testable core. An upload callback must call a real service and validate its result when available. Both source and consumer-owned output URLs need cleanup.

## Routing, metadata and boundaries

Existing URLs are unchanged. A central metadata map supplies static titles/descriptions and seven entity-detail generators; a root template supplies the CampusOne suffix. Set a real app origin for absolute social images; private/demo content is noindex by default.

Root/student loading and not-found boundaries share the kit. Student boundaries do not nest another main inside the shell. Root error offers a friendly retry, not exception details. Next streaming can emit HTTP 200 before a detail calls `notFound()`; the audit records that behaviour honestly. The dev showcase needs a strict production 404, so its proxy guard runs before streaming and is narrowly matched to `/design` and subpaths.

## Environment, health and preview

Public API base `/api` → server-only proxy target `http://127.0.0.1:4000`. The browser never needs sandbox localhost; a configured loopback public base is rejected. Existing local `/api/health` takes priority over the fallback proxy and returns 503 without a DB. Real API/DB connectivity is unverified.

Development binds to `0.0.0.0`; Next accepts localhost, 127.0.0.1 and Arena's `*.e2b.app` preview origins. No iframe-blocking headers were introduced. Environment files are ignored; `config/env.example` plus a no-overwrite generator document configuration without committing `.env*`.

## Verification and dependency policy

Native Node tests cover pure TypeScript geometry, contracts, adapters, theme/bootstrap/contrast, navigation coverage, search ranking/failure/cancellation and ignore rules. Isolated Playwright/Chromium/axe/Lighthouse tooling is outside app dependencies. Route and showcase browser harnesses capture hydrated screens and exercise actual controls. Measure Lighthouse sequentially against production, not a dev build. Keep generated screenshots/binaries in ignored cache paths.

Use the installed Next/React/TypeScript/Tailwind/Zustand/RHF/Zod/Lucide/CVA stack. Before adding a dependency, justify its shipped bundle cost and why native/installed capabilities are insufficient. Keep modules small, strict and explicit; there is no need for `any`, a duplicate design palette, arbitrary photo hosts or direct UI fixture imports.

See [design system](DESIGN_SYSTEM.md), [API integration guide](API_INTEGRATION_GUIDE.md), [audit](DESIGN_AUDIT.md) and [test report](TEST_REPORT.md) for contracts, observed limitations and the latest measured evidence.
