# CampusOne Web

`campusone-web` — a GCTU student-app frontend moving toward a photo-first campus magazine and social super-app.

**Current milestone: Phase 6B photo-first Events.** Sixteen fictional events now have photo discovery/details, composed search/category/date/sort/All/My RSVPs/Saved views, real six-per-page pagination, explicit RSVP/cancel/save, countdown/status gates, intent-loaded demo QR and actual `.ics` downloads. Clubs and its executive reviews, Home, auth/intro and the grouped shell remain intact; **Discover is next**. Typed cookie APIs are tested with controlled fixtures, **not a connected secure backend**. Retained Home Lighthouse medians are **94 Performance / 100 Accessibility** with disclosed CPU raster and **82 / 100** with the default sandbox renderer; portable/default-renderer Performance ≥90 remains open.

This is an explicitly labelled **demo/prototype**, not an official GCTU/SRC service. Generated photographs depict fictional people/a campus. The official SRC artwork is still pending; `BrandMark` keeps a clean labelled slot rather than inventing a logo. Real auth, uploads, messaging, payments, AI and authoritative campus data are not connected.

## Run locally or in Arena

Requires Node **22.15+** for the native foundation tests; development/build use the existing Next.js 16.4.0 / React 19 stack.

```bash
npm ci
npm run env:example                  # Creates ignored .env.example, never overwrites
# Optional: copy .env.example to ignored .env.local and configure locally
npm run dev -- --hostname 0.0.0.0 --port 3000
```

Open `/home` for the magazine Home or **`/design`** for the eight-section working foundation catalog: tokens/type, media, controls, overlays, data, feedback and local crop/compression. `/design` is development-only and returns HTTP 404 in production.

```bash
npm run lint
npm run typecheck
npm run test:foundation
npm run test:shell
npm run test:home
npm run test:auth
npm run test:clubs
npm run test:events
npm run build
npm run start -- --hostname 0.0.0.0 --port 3001
```

No remote font service or database is needed for build/demo operation. Full local font licenses and provenance are in `src/app/fonts/`.

## Configuration without committed secrets

The versioned safe template is **`config/env.example`**. `npm run env:example` generates the conventional `.env.example` locally. All `.env*` files stay ignored and out of Git.

- `NEXT_PUBLIC_DATA_SOURCE=demo` — default for the new typed catalog.
- `NEXT_PUBLIC_API_BASE_URL=/api` — same-origin browser requests.
- `API_PROXY_TARGET=http://127.0.0.1:4000` — server-only platform API origin.
- `API_SESSION_COOKIE_NAMES` — server-only exact cookie-name allowlist for Home, Clubs and Events; empty forwards none. Never configure cookie values here.
- `NEXT_PUBLIC_APP_URL` — optional real deployment origin for social-preview photos.
- `NEXT_PUBLIC_IMAGE_HOSTS` — optional exact approved HTTPS image hosts; empty by default.
- `DATABASE_URL` — optional server-only PostgreSQL connection for the existing health endpoint.

The preview user's browser is not the sandbox: do not put localhost in the browser API base. Next proxies `/api` to port **4000** without shadowing `/api/health`. Health returns `{ "ok": false }` / HTTP 503 when no database is configured. A controlled proxy fixture is tested; actual API and database connectivity remain unverified.

**API-mode limitation:** `campusService.list/get`, `authService`, `clubActionService` and `eventActionService` select typed lazy demo/API adapters. Auth cookie endpoints are proposed/unverified; existing synchronous compatibility readers and domain mutations remain local until their scheduled feature migrations. Enabling API mode does not magically make the legacy app live. See the integration guide before changing the mode.

## Architecture and assets

- `src/features/<name>/{components,hooks,validation}` — feature-folder architecture retained.
- `src/components/{ui,media,shared,theme}` — reusable semantic foundation.
- `src/types` — shared strict contracts; Zod validates external data/forms.
- `src/services` — public service boundary; UI never imports demo datasets directly.
- `src/config/images.ts` — one static photo registry, alt/provenance/focal points, approved-source policy and SRC slot.
- `src/app/globals.css` + `src/config/theme.ts` — light/dark semantic tokens and typed references.
- `src/config/metadata.ts` — preserved route URLs with titles, descriptions and Open Graph.
- `src/config/navigation.ts` — grouped destinations, mobile tabs and bounded active-route matching.
- `src/features/search/` + `searchService` — cancellable/debounced, typed global search; no direct fixture imports.
- `src/features/events/` + `eventCatalogService` / `eventActionService` — server-read photo discovery/details, owner-safe RSVP/save/ticket, honest legacy dates/counts and native ICS.
- `src/features/clubs/` + `clubCatalogService` / `clubActionService` — server-read photo directory/details, validated owner-aware local/API interactions and preserved reviews.
- `src/features/{auth,onboarding}/` + `authService` — photo forms/tour, source-aware session restoration, sanitized persistence and optional local photo preparation.

The eight pre-Clubs generated WebPs total **626,572 bytes**; five additional fictional club-activity WebPs total **526,288 bytes**; three Events scenes add **319,998 bytes** (16 generated sources, **1,472,858 bytes** combined). All are registered with meaningful alt/provenance/fallback; a separate CC0 poster is **20,018 bytes**. The five-second **554,058-byte** local MDN CC0 WebM is not GCTU footage and is never requested on initial Home. Source/license notes live in `public/media/demo/README.md`. Existing local SVG stand-ins remain clearly labelled for later replacement. Use generated, licensed/royalty-free or explicitly authorized media only; do not hotlink copyrighted campus photos. The uploader prepares JPEG/PNG/WebP locally, with crop/preview/error/retry and bounded output; it does not claim a real upload without a service callback.

## Verification and docs

- [Design audit / Phase 1 baseline](docs/DESIGN_AUDIT.md)
- [Design system: tokens, components, photos and replacement rules](docs/DESIGN_SYSTEM.md)
- [API integration: typed contracts, port 4000, cookies and compatibility](docs/API_INTEGRATION_GUIDE.md)
- [Phase 4 Home composition, media and portal sources](docs/PHASE4_HOME.md)
- [Phase 5 auth, onboarding, privacy and API replacement](docs/PHASE5_AUTH_ONBOARDING.md)
- [Phase 6A Clubs, photos, workflows and API replacement](docs/PHASE6A_CLUBS.md)
- [Phase 6B Events, RSVP/tickets/calendar and API replacement](docs/PHASE6B_EVENTS.md)
- [Frontend architecture](docs/FRONTEND_ARCHITECTURE.md)
- [Feature inventory](docs/FEATURE_INVENTORY.md)
- [Latest tests, screenshots, Lighthouse and remaining work](docs/TEST_REPORT.md)

Browser tooling is deliberately not an application dependency:

```bash
npm install --prefix .cache/design-audit/tooling --no-audit --no-fund \
  playwright@1.64.0 @sparticuz/chromium@153.0.0 \
  @axe-core/playwright@4.13.0 lighthouse@13.5.0 jsqr@1.4.0
node scripts/phase2-audit.mjs              # Foundation; running dev 3000 + production 3001
node scripts/phase3-audit.mjs              # Shell, search, persistence and delivery checks
node scripts/phase4-audit.mjs              # Home, actual media, clock, failure/retry and delivery
node scripts/phase5-audit.mjs              # Forms, tour, local photo, session, feedback and delivery
AUDIT_BASE_URL=http://127.0.0.1:3001 node scripts/phase6-clubs-audit.mjs
# API-only isolated-source dev 3002; the runner supplies/shuts down mock API 4000:
node scripts/phase6-clubs-api-audit.mjs
AUDIT_BASE_URL=http://127.0.0.1:3001 node scripts/phase6-events-audit.mjs
# Prepare isolated source before starting API-mode 3002 (see Phase 6B setup):
node scripts/phase6-events-api-snapshot.mjs
# Once API-mode 3002 is running; owns/shuts down its mock API 4000:
node scripts/phase6-events-api-audit.mjs
node scripts/phase2/proxy.mjs              # Temporary port-4000 fixture
AUDIT_BASE_URL=http://127.0.0.1:3001 \
  AUDIT_OUTPUT_DIR=.cache/phase6/events/routes node scripts/design-audit.mjs
```

Current verification and exact Lighthouse measurements are recorded in [TEST_REPORT.md](docs/TEST_REPORT.md). **122 native tests** pass (15 foundation, 12 shell, 18 Home, 23 auth, 24 Clubs, 30 Events). Events has **244 AA/layout/44px captures**, including all 16 detail routes at 360/768/1280 in both themes and 48 mocked-API states. Current shared regressions, 12 maintained positive workflow assertions and fresh **222 route cases / 74 AA checks** pass. Clubs' 203 captures and Phase 5's 105 auth/tour/editor captures remain historical evidence; Clubs membership/executive and auth session/tour regressions were rerun. Home's retained medians are **94/100** (CPU raster) and **82/100** (default renderer), not a new Events-phase benchmark. The performance gate is not waived. Runtime-only audit: **0 vulnerabilities**; full audit: **9 development advisories** (5 high, 4 moderate).

Snapshots/traces/build output/node_modules/test images stay ignored. The source runners and human-readable reports are committed; cached binary evidence may not persist between workspaces. Run audits again for later phases. Lighthouse targets are Home Performance ≥90 / Accessibility ≥95; only measured production scores are reported.

## Next in the agreed sequence

Phases 1–5 and Phase 6A Clubs / 6B Events frontend milestones are implemented; the Lighthouse performance acceptance gate remains open. **Remaining Phase 6: Discover → Accommodation → Marketplace → Opportunities → Lost & Found → Academics → Timetable/Calendar → Profile → remaining screens**, with small verified subphase commits. The existing club-executive request panel and approval persistence remain preserved. Polish and final verification follow; live backend/security integrations are still unconnected.
