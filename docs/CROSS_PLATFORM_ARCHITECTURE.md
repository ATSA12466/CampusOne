# CampusOne cross-platform architecture (decision)

Date: 2026-10-14. Branch: `arena/7684bcd9-campusone`.

## Decision

- **Store apps stay native with the existing Flutter project** (`mobile/`).
  It talks to the hosted Next.js backend over HTTPS and is the only client
  that ships to Google Play / the App Store.
- **The responsive Next.js web app is the source of truth** for student
  screens, workflows, copy, and visual identity. Flutter mirrors the
  prioritized student flows; it does not fork behavior.
- **Capacitor was evaluated and rejected as the store packager** for this
  repo (details below). It is not added as a dependency.
- **One durable backend for release:** the hosted Next.js API over HTTPS.
  The file-backed JSON store (`src/server/store.ts`) is dev/test-only and
  must be replaced by the Postgres adapter before any production release.
  Demo mode stays local-only and clearly labelled; it never claims to sync.

## Why not Capacitor?

1. This Next.js app depends on server features: server components/SSR, API
   routes, `src/proxy.ts` middleware, same-origin `/api` with cookie
   sessions, and server-side file persistence. Static export (`output:
   "export"`) disables SSR, middleware, and API routes, so the recommended
   Capacitor store path (bundled static assets) would break auth, API
   behavior, and server features. The project explicitly forbids that.
2. The alternative, Capacitor `server.url` pointing at the hosted site,
   makes the binary a remote-website wrapper: Capacitor documents it as
   development-only, it fails closed when the server is unreachable, and it
   is the classic trigger for Apple Guideline 4.2 (minimum functionality)
   and Play “minimum functionality / spam” rejections. Both stores require
   app-like native value beyond a mobile website (native navigation, device
   integrations, push, offline handling).
3. Splitting the app into a static-export frontend + separate API host is a
   valid long-term option, but it is a large refactor (auth/cookies,
   uploads, middleware, persistence) with no evidence it improves review
   odds over the existing native Flutter app. Revisit only if product
   direction changes.

## Why Flutter is retained

- Already API-native: Bearer auth + secure storage, QR check-in with
  server-validated rotating codes, tickets, attendance, messaging, saves,
  notifications feed, exec/admin flows — no website-wrapper risk.
- No dev-machine dependency in release: backend URL is baked in with
  `--dart-define=CAMPUSONE_API_URL=https://…`, and release builds now
  refuse non-HTTPS backends (see `ApiClient.setBaseUrl`).
- Flutter is **not** retired. If it ever is, keep `mobile/` in the repo
  until the replacement builds and every flow in
  `docs/CROSS_PLATFORM_PARITY.md` marked native-required is verified on the
  replacement; then remove it in one reviewed commit, revoking no shared
  backend behavior.

## Modes (explicit)

| Mode | Web | Mobile | Backend | Data |
| --- | --- | --- | --- | --- |
| Demo / UI test | `NEXT_PUBLIC_DATA_SOURCE=demo` (default) | N/A (Flutter has no demo mode) | None | Device-local only, labelled “demo” |
| API test | `NEXT_PUBLIC_DATA_SOURCE=api` + `API_PROXY_TARGET` | `--dart-define` or Server setting → LAN/emulator URL | Local Next.js (`npm run dev`, `npm run db:seed`) | File JSON store, seeded demo accounts |
| Release | Hosted Next.js over HTTPS | Store build, baked HTTPS URL | Hosted Next.js + Postgres adapter (**blocked**) | Durable server storage |

Secrets, signing keys, and credentials are never baked into clients. All
hosted traffic is HTTPS.

## Native integrations (status)

- QR scanning: native (`mobile_scanner`), camera permission declared with
  usage strings; denial/timeout states handled in-app.
- Notifications: in-app server feed today (honest default). Firebase push
  is guarded no-op without config; FCM sender + project remain blocked.
- Deep links: `campusone://` custom scheme + screen router for events and
  clubs (`DeepLinkHandler`; unverified without SDK/devices; HTTPS App
  Links / Universal Links need the production domain).
- Session storage: Bearer token in secure storage; transient network
  failures no longer wipe the session — only 401s (and malformed user
  payloads) do, with a retry affordance on the sign-in screen.
- Offline: typed `ApiException` states (offline/timeout/HTTP) with retry
  affordances; full offline queue remains a roadmap item.

## What this unlocks next

Backend before stores: production host + HTTPS, Postgres adapter replacing
the file store, `CAMPUSONE_QR_SECRET`, secrets management, privacy/retention
policy, account deletion, then signing, listings, and review assets (see
`docs/STORE_RELEASE_CHECKLIST.md` and `docs/CROSS_PLATFORM_PARITY.md`).
