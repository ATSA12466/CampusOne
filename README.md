# CampusOne Web

`campusone-web` — a GCTU student-app frontend moving toward a photo-first campus magazine and social super-app.

**Current milestone: requested frontend upgrade complete through polish and final verification.** All ordered feature migrations through 6M and Phase 7 are implemented and pushed. Current release hardening verifies **221 native passes** (the original final snapshot records 210), **732 canonical views**, **1,439 supplemental AA/layout captures** and per-route metadata/source-artifact checks. Home meets the requested local production Lighthouse targets: **92/92/90 Performance, 100 Accessibility**, latest median **92**. Read the [final handoff](docs/FINAL_HANDOFF.md) and [compact evidence](docs/audits/final-summary.json). Secure backend integrations, authorized SRC artwork, five high development-toolchain reports from one unpatched lint dependency chain and physical-device/full assistive-technology release gates remain explicit, not falsely closed.

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
npm test # All 15 native suites / 233 tests in isolated processes
npm run test:foundation
npm run test:shell
npm run test:home
npm run test:auth
npm run test:clubs
npm run test:events
npm run test:discover
npm run test:life
npm run test:profile
npm run test:social
npm run test:study
npm run test:secondary
npm run test:polish
npm run build
npm run start -- --hostname 0.0.0.0 --port 3001
```

No remote font service or database is needed for build/demo operation. Full local font licenses and provenance are in `src/app/fonts/`.

## Configuration without committed secrets

The versioned safe template is **`config/env.example`**. `npm run env:example` generates the conventional `.env.example` locally. All `.env*` files stay ignored and out of Git.

- `NEXT_PUBLIC_DATA_SOURCE=demo` — default for the new typed catalog.
- `NEXT_PUBLIC_API_BASE_URL=/api` — same-origin browser requests.
- `API_PROXY_TARGET=http://127.0.0.1:4000` — server-only platform API origin.
- `API_SESSION_COOKIE_NAMES` — server-only exact cookie-name allowlist for bounded server feed/detail reads; empty forwards none. Never configure cookie values here.
- `NEXT_PUBLIC_APP_URL` — optional real deployment origin for social-preview photos.
- `NEXT_PUBLIC_IMAGE_HOSTS` — optional exact approved HTTPS image hosts; empty by default.
- `DATABASE_URL` — optional server-only PostgreSQL connection for the existing health endpoint.

The preview user's browser is not the sandbox: do not put localhost in the browser API base. Next proxies `/api` to port **4000** without shadowing `/api/health`. Health returns `{ "ok": false }` / HTTP 503 when no database is configured. A controlled proxy fixture is tested; actual API and database connectivity remain unverified.

**API-mode boundary:** modern feeds/actions use lazy typed catalog/auth/Clubs/Events/Discover/workspace/profile/photo/task/study/notification/campus adapters. Synchronous compatibility readers remain demo-only for fixture/state initialization, not an API fallback. The migrations are implemented, but the proposed endpoints, authentication, authorization, CSRF, storage and transport are **not supplied/deployment-verified**. Enabling API mode does not make an unconnected backend live; consult the integration guide.

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
- `src/features/discover/` + `discoverCatalogService` / `discoverActionService` — bounded eight-source photo hub, URL-backed loaded-record directory and canonical owner-safe shared saves.
- `src/features/events/` + `eventCatalogService` / `eventActionService` — server-read photo discovery/details, owner-safe RSVP/save/ticket, honest legacy dates/counts and native ICS.
- `src/features/clubs/` + `clubCatalogService` / `clubActionService` — server-read photo directory/details, validated owner-aware local/API interactions and preserved reviews.
- `src/features/{auth,onboarding}/` + `authService` — photo forms/tour, source-aware session restoration, sanitized persistence and optional local photo preparation.

Static photos are registered with meaningful alt/provenance/fallback and labelled as fictional generated scenes or placeholders. A local **554,058-byte MDN CC0 WebM** and **39,868-byte CC0 sound-effect MP3** provide real deferred playback; neither is GCTU footage/audio. Attribution/full CC0 text is in `public/media/demo/`. Use generated, licensed/royalty-free or explicitly authorized media only. The shared native crop/compression kit prepares bounded owned photos; private demo persistence is not a secure server-upload claim. Full local Fraunces/Manrope licenses are bundled; no remote font service is needed.

## Verification and docs

- [Design audit / Phase 1 baseline](docs/DESIGN_AUDIT.md)
- [Design system: tokens, components, photos and replacement rules](docs/DESIGN_SYSTEM.md)
- [API integration: typed contracts, port 4000, cookies and compatibility](docs/API_INTEGRATION_GUIDE.md)
- [Phase 4 Home composition, media and portal sources](docs/PHASE4_HOME.md)
- [Phase 5 auth, onboarding, privacy and API replacement](docs/PHASE5_AUTH_ONBOARDING.md)
- [Phase 6A Clubs, photos, workflows and API replacement](docs/PHASE6A_CLUBS.md)
- [Phase 6B Events, RSVP/tickets/calendar and API replacement](docs/PHASE6B_EVENTS.md)
- [Phase 6C Discover, loaded-record scope, shared saves and API replacement](docs/PHASE6C_DISCOVER.md)
- [Phase 6D Accommodation](docs/PHASE6D_ACCOMMODATION.md) · [6E Marketplace](docs/PHASE6E_MARKETPLACE.md) · [6F Opportunities](docs/PHASE6F_OPPORTUNITIES.md)
- [Phase 6G Lost & Found](docs/PHASE6G_LOST_FOUND.md) · [6H Academics](docs/PHASE6H_ACADEMICS.md) · [6I Schedule](docs/PHASE6I_SCHEDULE.md) · [6J Profile](docs/PHASE6J_PROFILE.md)
- [Phase 6K Social](docs/PHASE6K_SOCIAL.md) · [Phase 6L Tasks/Study tools](docs/PHASE6L_STUDY_TOOLS.md)
- [Phase 6M Secondary screens](docs/PHASE6M_SECONDARY.md) · [Phase 7 Polish](docs/PHASE7_POLISH.md)
- [Final frontend handoff](docs/FINAL_HANDOFF.md) · [Compact verification summary](docs/audits/final-summary.json)
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
AUDIT_BASE_URL=http://127.0.0.1:3001 node scripts/phase6-discover-audit.mjs
# Prepare ignored API-mode source; start 3002 using the Phase 6C instructions:
node scripts/phase6-discover-api-snapshot.mjs
node scripts/phase6-discover-api-audit.mjs
node scripts/phase6-profile-audit.mjs
node scripts/phase6-social-audit.mjs
node scripts/phase6-study-audit.mjs
node scripts/phase2/proxy.mjs              # Temporary port-4000 fixture
AUDIT_BASE_URL=http://127.0.0.1:3001 \
  AUDIT_OUTPUT_DIR=.cache/phase6/events/routes node scripts/design-audit.mjs
```

Current verification and exact Lighthouse measurements are in [TEST_REPORT.md](docs/TEST_REPORT.md) and [FINAL_HANDOFF.md](docs/FINAL_HANDOFF.md). The source runners and compact summary are committed; large cached screenshots/traces may not persist. Real backend, official authority and physical-device proofs are not substituted by frontend fixtures.

```bash
# All seven detail families/all current canonical IDs, not just one sample:
AUDIT_BASE_URL=http://127.0.0.1:3001 AUDIT_ALL_ENTITIES=1 node scripts/design-audit.mjs
node scripts/phase8-source-audit.mjs
AUDIT_ALL_ENTITIES=1 node scripts/phase8-metadata-audit.mjs
node scripts/audit/interactions.mjs # Maintained current cross-feature journey
node scripts/phase6-secondary-audit.mjs
# Run performance in isolation, sequentially; production only:
AUDIT_BASE_URL=http://127.0.0.1:3001 node scripts/audit/lighthouse.mjs
```

## Handoff / external release work

The agreed frontend sequence is complete, including polish and final verification. The club-executive approval/persistence panel remains intact. Supply the authorized SRC artwork and real API/security/upload/transport integrations before an official deployment; complete physical-device, Safari/Firefox, IME and full screen-reader validation. Runtime dependency audit is zero; the current full audit retains five high development-chain reports from the unpatched braces advisory; none are concealed as a clean audit. See the final checklist rather than treating demo role selection or fixtures as authorization.
