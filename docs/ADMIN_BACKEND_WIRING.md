# Admin dashboards ↔ backend wiring

Verified **2026-10-15** on branch `arena/7684bcd9-campusone`. Scope: the nine web
Super Admin dashboards under `/admin` and the API routes they call. The Flutter
app is student-only, so nothing in `mobile/**` is part of this deliverable
(see `docs/CROSS_PLATFORM_PARITY.md`).

## 1. What "connected" means here

Every dashboard screen loads data from, and writes data to, the Next route
handlers under `src/app/api/admin/**`, which persist through `src/server/store.ts`.
No screen renders fixture data, and no screen shows an empty or success state
that the store does not back. The checks below prove that by reading every
change back out of the API after making it through the UI.

| Dashboard | Screen | Endpoints used | Verbs |
| --- | --- | --- | --- |
| Overview | `/admin` | `/api/admin/overview` | GET |
| Users | `/admin/users` | `/api/admin/users?q=`, `/api/admin/users/{id}` | GET, PATCH |
| Roles & grants | `/admin/roles` | `/api/admin/grants`, `/api/admin/grants/{id}` | GET, POST, PATCH |
| Content | `/admin/content` | `/api/admin/materials`, `/api/admin/materials/{id}` | GET, POST, PATCH, DELETE |
| Moderation | `/admin/moderation` | `/api/admin/reports`, `/api/admin/reports/{id}` | GET, PATCH |
| Accommodation | `/admin/accommodation` | `/api/admin/listings`, `/api/admin/listings/{id}` | GET, PATCH |
| Audit log | `/admin/audit` | `/api/admin/audit?page=&pageSize=30&q=` | GET |
| Settings | `/admin/settings` | `/api/admin/settings` | GET, PATCH |
| Branding | `/admin/branding` | `/api/admin/branding`, `/api/admin/branding/assets` | GET, PUT, POST |

Shared client plumbing lives in `src/features/admin/api.ts`
(`adminFetch`, `useObject`, `useCollection`, `AdminApiError`); the dashboards are
`src/features/platform-admin/*.tsx`, mounted from `src/app/(admin)/admin/**` and
gated by `src/app/(admin)/layout.tsx` plus `src/features/admin/components/locked-state.tsx`.

A static sweep of every `/api/…` string literal under `src/` confirms **all 32
distinct referenced paths, including all 14 admin paths, resolve to a real route
file** — there are no calls into endpoints that do not exist.

## 2. Commands

Both checks need a running server and seeded demo accounts:

```bash
npm run db:seed                                   # creates .data/campusone.json + demo logins
npm run dev                                       # or: npm run build && npm run start
npm run audit:admin                               # API-level contract + RBAC check
AUDIT_BASE_URL=http://localhost:3000 npm run audit:admin-ui   # browser-level check
AUDIT_BASE_URL=http://localhost:3000 npm run audit:brand      # crest on every brand surface
```

`npm run audit:admin` (`scripts/admin-live-check.mjs`) needs nothing but Node: it
signs in over HTTP and exercises each endpoint with the exact verbs and bodies the
dashboards use, then asserts the RBAC boundary.

`npm run audit:admin-ui` (`scripts/admin-ui-check.mjs`) drives the real dashboards
in headless Chromium and performs genuine edits through the UI. It uses the
isolated audit tooling described in `docs/DESIGN_AUDIT.md`:

```bash
npm install --prefix .cache/design-audit/tooling \
  --no-package-lock --no-save --no-audit --no-fund \
  playwright@1.64.0 @sparticuz/chromium@153.0.0 @axe-core/playwright@4.13.0
```

Both scripts clean up after themselves: created materials and listings are
deleted or rejected, triaged reports and edited settings are restored, and consumed
grants are revoked. Re-running against the same store is safe.

## 3. Results — 2026-10-15

| Check | Result |
| --- | --- |
| `npm run audit:admin` | **87 passed, 0 failed** |
| `npm run audit:admin-ui` | **55 passed, 0 failed** (self-seeds its fixtures) |
| `npm run audit:brand` | **21 passed, 0 failed** (see `docs/MOBILE_PHOTO_PASS.md` §5) |
| `npm run lint` / `npm run typecheck` | clean |
| `npm test` (native suites) | all 16 isolated suites pass |

The moderation section seeds its own report through `POST /api/reports` when a
freshly seeded store has nothing to triage, so the check is reproducible from a
clean clone instead of depending on leftover data.

What the browser run proves, per dashboard (reads back from the API after each
UI action):

- **Overview** — the Accounts, Housing queue, Open reports and Published
  materials figures on screen equal `GET /api/admin/overview`; the health panel
  states `Not configured — file store in use` because `DATABASE_URL` is unset, and
  says nothing stronger.
- **Users** — live accounts render (seeded student visible), search is
  server-side (`?q=`), flipping *Student verification* through the row editor
  persists, and the store refuses an account with an empty role list (`400`).
- **Roles** — creating a scoped grant through the form reaches the store and
  appears under *Active*; revoking through the row button records `revokedAt`,
  drops the active count, and lists the grant under *Revoked*.
- **Content** — a material created through the form is stored and listed; editing
  it to `published` persists; deleting removes it from the store and the list.
- **Moderation** — live reports render, a triage (`actioned` + owner +
  resolution) persists, and the report moves to the decided section.
- **Accommodation** — a student submission appears in the review queue, stays out
  of the public list while pending, becomes public only after *Verify & publish*,
  records who decided and when, and the Reject path works too.
- **Audit** — entries render, search is server-side and scoped, and the actions
  performed by the check itself are present in the log.
- **Settings** — inputs are bound to stored values, saving through the UI writes
  to the store and confirms on screen, and restoring the original value works.
- **Branding** — the editor loads the published record, uploading a logo saves
  the asset URL (`/api/brand/...`) onto the **draft**, publishing is *not*
  implicit, and the uploaded asset is served back.

Cross-cutting assertions in the same run: no uncaught page errors across the nine
dashboards, no `5xx` from any admin API call, and a student session sees the
*Restricted area* gate with no admin figures while the API answers `403` to the
same requests. `npm run audit:admin` additionally confirms anonymous callers get
`401`, a junk `Authorization: Bearer` token does not elevate a student cookie,
an SRC admin without platform permissions is refused `/api/admin/settings` and
`/api/admin/users`, asset uploads reject a file whose bytes disagree with its
declared type, and script-bearing SVGs are refused.

## 4. Notes and known limits

- **Destructive actions use the browser's native `confirm()`.** Revoke, delete,
  publish and rollback all prompt before acting (the checks assert the prompt
  appears). It is functional and safe, but it blocks the main thread, cannot be
  themed to the design system, and is disabled in some installed-PWA contexts.
  Replacing it with a themed confirmation dialog is a UI task, not a wiring gap.
- **Sign-out/expiry mid-session** is handled by the shared error path:
  `adminFetch` surfaces the API's message and the dashboards render
  `ErrorState`/`LockedState` rather than a stale empty list.
- **Store honesty.** `DATABASE_URL` is unset in this sandbox, so everything runs
  on the JSON file store (`src/server/store.ts`); `/api/health` correctly answers
  `503` and `/api/admin/overview` reports `database: "not-configured"`. Nothing
  in these checks should be read as PostgreSQL-backed verification.
- **Not covered by this pass:** visual/design review and the axe accessibility
  sweep of the admin screens (the design-audit harness covers student surfaces),
  Lighthouse runs for `/admin/**`, and the Postgres path once `DATABASE_URL` is
  configured. The browser checks were run against `next dev`; run them again
  against `next start` before release if you want production-mode evidence.
- **Branding asset URLs are top-level fields** on the branding record
  (`logoLight`, `logoDark`, `logoLogin`, `appIcon`, `favicon`, `pwaIcon`,
  `bannerDefault`) — not nested under an `assets` object. Server and dashboards
  agree on this; the asset kinds are `ASSET_KINDS` in `src/server/admin.ts`.
