# CampusOne Web

`campusone-web` — a GCTU student-app frontend moving toward a photo-first campus magazine and social super-app.

**Current milestone: Phase 3 shell + global search.** The Phase 2 theme/font/media/UI foundation is retained. Five grouped navigation sections cover all 24 student destinations; desktop navigation collapses with a persistent preference, and mobile has four tabs plus More. Cmd/Ctrl+K opens lazy-loaded, keyboard-accessible search across pages and seven typed catalog collections. Home, auth and feature redesigns follow in the agreed order.

This is an explicitly labelled **demo/prototype**, not an official GCTU/SRC service. Generated photographs depict fictional people/a campus. The official SRC artwork is still pending; `BrandMark` keeps a clean labelled slot rather than inventing a logo. Real auth, uploads, messaging, payments, AI and authoritative campus data are not connected.

## Run locally or in Arena

Requires Node **22.15+** for the native foundation tests; development/build use the existing Next.js 16 / React 19 stack.

```bash
npm ci
npm run env:example                  # Creates ignored .env.example, never overwrites
# Optional: copy .env.example to ignored .env.local and configure locally
npm run dev -- --hostname 0.0.0.0 --port 3000
```

Open `/home` for the compatible app or **`/design`** for the eight-section working foundation catalog: tokens/type, media, controls, overlays, data, feedback and local crop/compression. `/design` is development-only and returns HTTP 404 in production.

```bash
npm run lint
npm run typecheck
npm run test:foundation
npm run test:shell
npm run build
npm run start -- --hostname 0.0.0.0 --port 3001
```

No remote font service or database is needed for build/demo operation. Full local font licenses and provenance are in `src/app/fonts/`.

## Configuration without committed secrets

The versioned safe template is **`config/env.example`**. `npm run env:example` generates the conventional `.env.example` locally. All `.env*` files stay ignored and out of Git.

- `NEXT_PUBLIC_DATA_SOURCE=demo` — default for the new typed catalog.
- `NEXT_PUBLIC_API_BASE_URL=/api` — same-origin browser requests.
- `API_PROXY_TARGET=http://127.0.0.1:4000` — server-only platform API origin.
- `NEXT_PUBLIC_APP_URL` — optional real deployment origin for social-preview photos.
- `NEXT_PUBLIC_IMAGE_HOSTS` — optional exact approved HTTPS image hosts; empty by default.
- `DATABASE_URL` — optional server-only PostgreSQL connection for the existing health endpoint.

The preview user's browser is not the sandbox: do not put localhost in the browser API base. Next proxies `/api` to port **4000** without shadowing `/api/health`. Health returns `{ "ok": false }` / HTTP 503 when no database is configured. A controlled proxy fixture is tested; actual API and database connectivity remain unverified.

**API-mode limitation:** `campusService.list/get` selects a typed async demo/API adapter. Existing synchronous compatibility readers and demo mutations/auth remain local until their scheduled feature migrations. Enabling API mode does not magically make the legacy app live. See the integration guide before changing the mode.

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

Three generated WebP assets total **166,234 bytes**. Existing local SVG stand-ins remain clearly labelled for later replacement. Use generated, licensed/royalty-free or explicitly authorized media only; do not hotlink copyrighted campus photos. The uploader prepares JPEG/PNG/WebP locally, with crop/preview/error/retry and bounded output; it does not claim a real upload without a service callback.

## Verification and docs

- [Design audit / Phase 1 baseline](docs/DESIGN_AUDIT.md)
- [Design system: tokens, components, photos and replacement rules](docs/DESIGN_SYSTEM.md)
- [API integration: typed contracts, port 4000, cookies and compatibility](docs/API_INTEGRATION_GUIDE.md)
- [Frontend architecture](docs/FRONTEND_ARCHITECTURE.md)
- [Feature inventory](docs/FEATURE_INVENTORY.md)
- [Latest tests, screenshots, Lighthouse and remaining work](docs/TEST_REPORT.md)

Browser tooling is deliberately not an application dependency:

```bash
npm install --prefix .cache/design-audit/tooling --no-audit --no-fund \
  playwright@1.64.0 @sparticuz/chromium@153.0.0 \
  @axe-core/playwright@4.13.0 lighthouse@13.5.0
node scripts/phase2-audit.mjs              # Foundation; running dev 3000 + production 3001
node scripts/phase3-audit.mjs              # Shell, search, persistence and delivery checks
node scripts/phase2/proxy.mjs              # Temporary port-4000 fixture
AUDIT_BASE_URL=http://127.0.0.1:3001 \
  AUDIT_OUTPUT_DIR=.cache/phase3/routes node scripts/design-audit.mjs
```

Latest verification: lint/typecheck/build, **27 native tests**, **222 responsive route cases** plus targeted recaptures, and **31 shell/search/feedback captures** passed. Latest production Home Lighthouse: **68 Performance / 100 Accessibility**. Performance ≥90 remains open; lazy closed-overlay delivery is proven, not a claim of a measured speed improvement.

Snapshots/traces/build output/node_modules/test images stay ignored. The source runners and human-readable reports are committed; cached binary evidence may not persist between workspaces. Run audits again for later phases. Lighthouse targets are Home Performance ≥90 / Accessibility ≥95; only measured production scores are reported.

## Next in the agreed sequence

Phase 3 is implemented and verified. Phase 4: magazine Home with ads/video-first ordering, a big Clubs hero, photo quick tiles, institutional links and real next-class/task recommendations. Auth/onboarding and feature-by-feature photo/detail/data/workflow upgrades follow; the existing club-executive request panel is preserved.
