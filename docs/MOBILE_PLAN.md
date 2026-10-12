# CampusOne Mobile Plan — Flutter (Android + iOS) on the shared backend

## 1. Repository audit (2026-10-12)

### Web platform (keep as-is, Next.js 16 App Router)

- Student app: 24+ routes under `src/app/(student)` — home, clubs, events, discover,
  accommodation, marketplace, opportunities, lost & found, academics, calendar/timetable,
  profile, community, messages, notifications, tasks, announcements, SRC office, media,
  participation, freshers, management.
- SRC dashboard: `src/app/(src)/src/*` — overview, clubs, appointments, content,
  requests, reports.
- Super Admin: `src/app/(admin)/admin/*` — overview, users, roles, branding, content,
  housing, moderation, audit, settings.
- Data layer: `NEXT_PUBLIC_DATA_SOURCE=demo` (local fixtures) or `api` (same-origin
  `/api/*`, validated with Zod). Demo fixtures are honestly labelled fictional; the
  generic catalog route (`src/app/api/[...rest]/route.ts`) serves fixtures plus
  validated server overlays (approved clubs, published campus events, announcements,
  verified listings, published materials).

### Backend (real, shared, file-backed in dev)

| Area | Server module | HTTP routes | Mobile-ready? |
| --- | --- | --- | --- |
| Auth (register/sign-in/sign-out/session) | `src/server/auth.ts` | `/api/auth/*` | Cookie-only → **needs Bearer** |
| RBAC (23 permissions, scoped club grants) | `src/server/permissions.ts` | via guards | Yes (server-enforced) |
| SRC registry (clubs, nominations, appointments, announcements, requests, profiles) | `src/server/registry.ts` | `/api/src/*` | Yes |
| Admin (users, roles, branding, listings, materials, reports, audit, settings) | `src/server/admin.ts` | `/api/admin/*` | Yes |
| Campus (memberships, saves, RSVPs, events, officers, resources, analytics) | `src/server/campus.ts` | **none yet** | **Needs routes** |
| Attendance / QR / badges | — | — | **To implement** |
| Messaging | demo fixtures only | — | **To implement (poll-based)** |
| Notifications | demo fixtures only | — | **To implement (server feed)** |
| Push devices | — | — | **Register endpoint + docs; FCM sending is external** |
| Persistence | `src/server/store.ts` FileStore (atomic JSON, mtime invalidation) | — | Dev/small deploy; Postgres adapter still required for production |

- Sessions: `c1s_` opaque tokens, sha256-hashed at rest, 14-day TTL, HttpOnly cookie.
- Crypto helpers (`hmacSign`/`hmacVerify` with `timingSafeEqual`) already exist.
- No secrets are embedded in client code; QR design below keeps it that way.

### Gaps this plan closes

1. Bearer-token auth for native clients (same sessions table, same RBAC).
2. Attendance backend: exec-created sessions, rotating HMAC QR, validated check-in,
   duplicates/expiry/revocation/eligibility, auditable corrections.
3. Badge engine: definitions + rule evaluation on check-in, awards, history.
4. HTTP routes over the existing campus domain (memberships, RSVPs, saves, tickets,
   exec management).
5. REST messaging (poll-based; realtime explicitly out of scope).
6. Server notification feed written by real actions (decisions, awards, messages).
7. Device registration for the documented push architecture.
8. Flutter app (`mobile/`) for Android + iOS using only these documented APIs.

### Framework decision

**Flutter** for the dedicated mobile apps (one codebase, Android + iOS, same Dart
business-logic layer, native camera for QR via `mobile_scanner`). No audit finding
against it: the backend is plain JSON over HTTPS with token auth, which Flutter
consumes cleanly. No business logic is duplicated: validation, permissions, badge
rules and QR verification stay server-side; the app renders server state.

## 2. API contracts (see `docs/MOBILE_API.md`)

- Base URL: production origin (`https://…`) or LAN dev (`http://<ip>:3000`).
- Auth: `Authorization: Bearer <token>` from `POST /api/auth/token`; cookies keep
  working for web. `401` = sign in again, `403` = lacks permission, `409` = duplicate,
  `410` = expired/revoked, `422/400` = validation.
- QR payload: `C1A1.<sessionId>.<slot>.<mac>` (no PII; 60-second rotating slots).
- Errors: `{ error: string }` JSON everywhere; list responses `{ items, total }`.

## 3. Flutter app scope (`mobile/`)

Priority order (each screen works only against real endpoints):

1. Auth (sign in/register/verify status/sign out), secure token storage.
2. Home dashboard (profile, upcoming RSVPs, unread counts, recent announcements).
3. Clubs (catalog browse + request/withdraw/leave/reapply; exec: review members).
4. Events (catalog browse + RSVP/cancel/save + ticket view with booking ref).
5. Attendance (student: scan QR → result; history; exec: create session, show live QR,
   view check-ins, revoke, correct records).
6. Badges (my badges + definitions + participation history).
7. Messages (conversations, send, polling + pull-to-refresh).
8. Notifications (server feed, read/unread).
9. Announcements, SRC office, accommodation browse (+verification status), materials
   browse, profile & settings, About/honesty disclosure.
10. Push: FCM wiring with manifest/Info.plist + token upload; sending requires the
    external Firebase project (documented, not claimed).

Out of scope for this iteration: offline write queue, realtime sockets, payments,
uploads from mobile, full PWA parity screens (marketplace/lost-found posting stay
web/demo-backed and are not re-implemented against fake endpoints).

## 4. Backend work (this repo, `src/server/*` + `src/app/api/*`)

1. `parseBearerToken` + Bearer-aware guards; `POST/DELETE /api/auth/token`.
2. `src/server/attendance.ts` + `/api/attendance/*` (sessions, live code, check-in,
   records, corrections).
3. `src/server/badges.ts` (+ seeded definitions) + `/api/badges`, `/api/participation`.
4. `src/server/notify.ts` + `/api/notifications`.
5. `src/server/messages.ts` + `/api/conversations/*`.
6. `src/server/devices.ts` + `/api/devices`.
7. Club/event action routes over `campus.ts` + exec manage routes.
8. Native suites: `scripts/server/attendance.test.mjs`, `badges` (inside attendance),
   `messaging.test.mjs`, Bearer parsing tests; live curl verification incl. RBAC.

## 5. Verification & release

- `npm test` (all native suites), `npm run typecheck`, `npm run build`.
- Structural Flutter audit (`scripts/mobile-audit.mjs`): pubspec validity, required
  files, referenced API paths exist, no embedded secrets, icon inventory.
- Android: project builds with Flutter SDK + Android SDK (not installable in this
  sandbox — outbound hosts exclude SDK hosting); release signing documented.
- iOS: project prepared (bundle id, permissions, icons); building requires macOS +
  Xcode + Apple signing (documented in `docs/MOBILE_RELEASE.md`).

## 6. Remaining production work (not achievable in this environment)

- Postgres adapter replacing FileStore (same repository functions).
- Hosted HTTPS origin + `CAMPUSONE_QR_SECRET` env + Firebase project for push.
- Play Console / App Store Connect listings, review, rollout (human approval).
