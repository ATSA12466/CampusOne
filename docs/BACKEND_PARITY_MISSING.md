# What the CampusOne backend branch is missing (client-contract parity audit)

**Question answered:** *what does our frontend expect that the `backend` branch does not provide?*

| | |
|---|---|
| Branch under review | `backend` @ `6fd56ec` (unrelated history, inspected read-only via `FETCH_HEAD`) |
| Reference implementation (real, working) | this branch — `src/app/api/**` (65 route files) |
| Clients that consume it | Flutter app `mobile/lib/**` (primary mobile client) + Next web app `src/app/(student)/**` |
| Method | Every backend path and payload the clients require was enumerated from client source code, then compared path-by-path and shape-by-shape against the PHP branch source. Static review only — no PHP/PG runtime exists in this sandbox, so nothing here was executed against the PHP code. |

---

## 1. Headline

The Flutter client needs **≈75 distinct paths (≈95 method+path combinations)**.

The `backend` branch serves **7 of those path names**, and **every one of the 7 is unusable** — 2 fail the first-run gate / login, 4 return the wrong envelope so the UI silently renders *empty*, 1 is a partial write path whose follow-up call does not exist.

**0 of ≈75 client paths work.** Worse than missing endpoints: 4 of the collisions fail *silently*, which is exactly the "misleading empty state" failure mode the project rules forbid.

---

## 2. The five contract rules the client enforces

These are not preferences — each is literally a parser in client code that a backend must satisfy.

| # | Rule | Where the client enforces it | PHP branch behaviour |
|---|---|---|---|
| R1 | `GET /api/health` → `{"ok": true}` | `mobile/lib/src/app/server_gate.dart:40-43` (`probe.get('/api/health')`; `health['ok'] != true` → *"That address is not a CampusOne server."*) | returns `{"status":"ok","time":…}` — **no `ok` field** → the app refuses the server on first run |
| R2 | Session endpoints are `/api/auth/token`: `POST` (sign-in) → `{token, user}`, `GET` (restore) → `{user}`, `DELETE` (sign-out) | `auth_session.dart:48, 75-82, 135` | PHP has `POST /auth/login` → `{accessToken, refreshToken, user}`; no `GET`/`DELETE /auth/token` at all |
| R3 | User object = `{id, email, name, role, roles[], permissions[], programme, level, verifiedStudent, avatar}` | `mobile/lib/src/core/auth/user.dart:26-36`; drives `isExecutive`, `isAdminRole`, every permission-gated widget | PHP login/`me` return `{id, email, role}` only — `roles[]`/`permissions[]` absent ⇒ all executive/admin UI silently hidden; no server-side permission data exists to gate on |
| R4 | List responses = `{items: [...], total, page, pageSize}`; item responses = the bare object | `mobile/lib/src/core/api/paged.dart:13-16`, `catalog_repository.dart:12-36` | PHP returns `{data: [...]}` / `{data: {...}}` ⇒ `root['items']` is `undefined` ⇒ **`items: []`, no error, empty screen** |
| R5 | Errors = `{"error": "<human sentence>"}` (+ optional `code`) | `api_client.dart:133-140` — the string is shown to the user verbatim | PHP returns machine codes (`{"error":"INVALID_CREDENTIALS"}`) ⇒ raw codes in user-facing banners |

---

## 3. Path-by-path gap table

Legend: ✅ served correctly · 🟡 path exists, contract wrong (silent-empty risk) · ❌ absent.

### 3.1 Boot, session, identity — 9 paths

| Client path (methods) | PHP branch | Verdict |
|---|---|---|
| `GET /api/health` | `GET /health` (`api/routes.php:22`) | 🟡 violates R1 → server rejected outright |
| `POST /api/auth/token` (sign-in) | `POST /auth/login` | ❌ different path *and* different response (`accessToken` vs `token`) |
| `GET /api/auth/token` (restore saved session) | — | ❌ absent (this is the call every app launch makes) |
| `DELETE /api/auth/token` (sign-out) | `POST /auth/logout` | ❌ different path/method |
| `POST /api/auth/register` | `POST /auth/register` | 🟡 path matches; body `{name, email, password, programme, level}` is truncated to email+password (no such columns), and the client then calls `POST /auth/token`, which does not exist |
| `POST /api/auth/password-reset` | — | ❌ absent |
| `GET /api/users/me` | `GET /users/{id}` | ❌ no `/me`; no authenticated self-read (`me()` is at `/auth/me`) |
| `PATCH /api/users/me` (edit name/programme/level) | — | ❌ absent — no update path for *any* user |
| `GET /api/users/me/clubs` (my clubs + manage rights + pending requests) | — | ❌ absent |
| `GET /api/me/store`, `PUT`, `DELETE` | — | ❌ absent — **single most load-bearing missing endpoint** (§4.2) |
| `GET /api/saves`, `PUT /api/saves` | — | ❌ absent — saved clubs/events/listings/posts |
| `GET /api/branding/public` | — | ❌ absent — theme/branding bootstrap |

### 3.2 Catalog collections — 16 collections × (list + item) = 32 paths

| Collection | Client path base | PHP branch |
|---|---|---|
| clubs | `/api/clubs[/{id}]` | 🟡 list+item exist, envelope + fields wrong (§4.1) |
| events | `/api/events[/{id}]` | 🟡 list+item exist, envelope + fields wrong |
| announcements | `/api/announcements[/{id}]` | 🟡 list exists (`{data:[…]}`), no item route |
| featured | `/api/home/featured` | ❌ absent |
| opportunities | `/api/opportunities` | ❌ absent |
| accommodation | `/api/accommodation` | ❌ absent |
| marketplace | `/api/marketplace` | ❌ absent |
| resources (notes/materials) | `/api/resources` | ❌ absent |
| courses | `/api/courses` | ❌ absent |
| posts | `/api/community/posts` | ❌ absent |
| media | `/api/media` | ❌ absent |
| timetable | `/api/timetable` | ❌ absent (`timetable_entries` table exists, no endpoint, wrong shape) |
| representatives | `/api/src-office/representatives` | ❌ absent |
| projects | `/api/src-office/projects` | ❌ absent |
| campaigns | `/api/advertising` | ❌ absent |
| lostFound | `/api/lost-found` | ❌ absent |

That is **1 of 16 collection list endpoints usable and 0 of 16 item endpoints usable.**

### 3.3 Membership, RSVP, tickets — 6 paths

| Client path (methods) | PHP branch | Verdict |
|---|---|---|
| `POST` / `DELETE /api/clubs/{id}/membership` | `POST /clubs/{id}/join` | ❌ path + semantics differ (no leave, no status/review lifecycle, body-supplied `user_id`) |
| `PATCH /api/clubs/memberships/{id}` (approve/reject) | — | ❌ absent |
| `GET` / `PUT /api/clubs/{id}/saved` | — | ❌ absent |
| `POST` / `DELETE /api/events/{id}/rsvp` | `POST /events/{id}/register` | ❌ path + semantics differ (`{"attending": true}` vs raw insert; no cancel) |
| `GET` / `PUT /api/events/{id}/saved` | — | ❌ absent |
| `GET /api/events/{id}/ticket` (ticket + reference + status) | — | ❌ absent |

### 3.4 Attendance — 6 paths

`GET|POST /api/attendance/sessions`, `GET|PATCH /api/attendance/sessions/{id}`, `GET /api/attendance/sessions/{id}/code`, `POST /api/attendance/check-in`, `GET /api/attendance/records`, `PATCH /api/attendance/records/{id}` — **all 6 absent**. No attendance table, no code lifecycle, no per-session ownership, no records/badges join. (The known claimed-`clubId` authorisation gap on our own server is separate and unrelated.)

### 3.5 Badges, participation, messaging, notifications — 8 paths

`GET /api/badges`, `GET /api/badges/definitions`, `GET /api/participation`, `GET|POST /api/conversations`, `GET|POST /api/conversations/{id}/messages`, `POST /api/conversations/{id}/read`, `GET|PATCH /api/notifications`, `POST|GET|DELETE /api/devices` — **all absent**. No badges/participation tables, no conversations/messages tables, no notifications table, no device-registration table. The app's Messages, Notifications and Participation screens have no data source whatsoever.

### 3.6 SRC office, submissions, club management — 14 paths

| Client path | PHP branch |
|---|---|
| `GET|POST /api/src/requests`, `PATCH /api/src/requests/{id}` | ❌ absent |
| `GET|POST /api/src/nominations`, `PATCH /api/src/nominations/{id}` | ❌ absent |
| `GET /api/src/clubs` | ❌ absent |
| `POST /api/listings` (marketplace/accommodation/lost-found submit) | ❌ absent |
| `POST /api/reports` (moderation reports) | ❌ absent |
| `/api/manage/clubs/{clubId}/{members|events|officers|resources|analytics}[/{id}]` | ❌ absent — the entire club-executive management surface (partner/officer/resource edits, analytics) has no backend |

---

## 4. Data-model gaps (paths are not enough — the shapes are wrong too)

### 4.1 The two collections that "exist" cannot render the client UI

`Club` requires `details.{memberCount, accepting, meeting, venue, tagline, highlights[], leaders[], gallery[], story[]}` (`src/types/engagement.ts:4-12`, `mobile/.../catalog_repository.dart:93-110`).
PHP `clubs` table columns: `id, name, category, description, cover, objectives` — **no `details` at all**, no member count, no meeting/venue, no media, no leaders.

`EventItem` requires `seats`, `registered` **plus** `details.{cover, tagline, description[], startsAt, endsAt, bookingClosesAt, timeZone, price, organizer, status, rank, agenda[], speakers[], accessibility[]}`. PHP `events` has `title, description, venue, date, category, seats, registered` and nothing nested — no agenda, speakers, price, status, timezone, or accessibility metadata.

`Announcement` requires `pinned: bool` and `publishedAt` timestamp. PHP has `published_at DATE` and **no `pinned` column**.

### 4.2 Endpoints the client needs that have no table at all

`/api/me/store` is the account-synced personal store backing **10 collections** the app already uses: `tasks, notes, grades, plans, sessions, replies, reactions, enquiries, concerns` (`mobile/lib/src/core/store/personal_store.dart`, mirrored on our server by `src/server/me-store.ts`). PHP has `tasks` and `timetable_entries` tables that:

* have **no endpoint** (`tasks`/`timetable_entries` appear in the migration only), and
* have the **wrong shape anyway** — the client's `TaskItem` is `{id, title, description, dueDate, priority, category, completed}` and is stored *inside* `/api/me/store` with a client-generated `c1…` id; PHP's table is a top-level row set with `SERIAL` ids, `status` instead of `completed`, and no `category`-free `kind` parameter. `ClassSession` likewise uses `{id, day, course, start, end, venue}` inside the store, not the migration's `owner_id/start_time/end_time` columns.

Also entirely table-less: accommodation, marketplace, lost-found, opportunities, resources/notes, courses, community posts, media, representatives, projects, campaigns, conversations, messages, notifications, badges, participation, saves, branding, devices, listings, reports, SRC requests/nominations, club officers/resources/analytics.

### 4.3 Identity model mismatch

| | Client expects | PHP branch |
|---|---|---|
| User id | string, e.g. `user-1` (`src/data/demo/core/user.ts:5`; `AppUser.id` is `String`) | `users.id SERIAL` (integer) |
| Cross-table FKs | text ids matching `club-1`, `event-1` seed ids | `club_memberships.user_id INTEGER`, `club_id TEXT` → mixed types, and every memberships/registrations row the API returns carries an integer user id the client cannot match to anything |
| User profile fields | name, programme, level, verifiedStudent, avatar, roles[], permissions[] | none of these columns exist |
| Auth transport | `Authorization: Bearer <token>` (matches) | ✅ bearer + HS256 JWT verify is implemented correctly (`api/helpers.php`), including `hash_equals` and `exp` |

---

## 5. Ranked list of what to fix first

**P0 — nothing works at all (session cannot start)**
1. `GET /api/health` must return `{"ok": true}` — otherwise the app refuses the server at first run.
2. Rename/alias the auth surface to the client contract: `POST /api/auth/token` → `{token, expiresAt, user}`; `GET /api/auth/token` → `{user}`; `DELETE /api/auth/token`.
3. Fix the login SQL bug (`INTERVAL ':days days'` → `HY093`, every login 500s).
4. Return the full user object (R3) including `roles[]`/`permissions[]` — without it every permission-gated screen is dead and no authorisation can be enforced.
5. `GET`/`PATCH /api/users/me` (self-read is currently only `/auth/me`; there is no profile update path).

**P1 — the UI renders empty or wrong for the collections that "exist"**
6. Adopt the `{items, total, page, pageSize}` envelope for all list routes (or the client shows silent empty states — the worst possible failure).
7. Return bare item objects from item routes, not `{data: …}`.
8. Serve `details` for clubs and events (or the detail screens are blank).
9. Error bodies must carry human sentences in `error`.

**P2 — missing domains with no table**
10. `/api/me/store` (10 collections) — unblocks Tasks, Timetable personal classes, Notes, GPA, and several community flows in one endpoint.
11. `/api/saves` + club/event `saved` toggles.
12. Membership lifecycle with `status` (`pending|approved|rejected`) + `PATCH /api/clubs/memberships/{id}`.
13. RSVP (`POST/DELETE`, `{attending:true}`/`{"rsvp":{...}}`), tickets, and the remaining 13 catalog collections.

**P3 — whole product areas absent**
14. Messages (conversations/threads/read).
15. Notifications + devices.
16. Attendance (sessions, code, check-in, records) and badges/participation.
17. SRC office (requests, nominations, clubs, profiles, announcements, appointments, overview).
18. Club management (`/api/manage/clubs/{id}/…`), listings/reports submissions, branding.

**P4 — correctness/security items already reported** (they must land *with* the above, not after): no authorisation outside `me()`, body-supplied `user_id` impersonation on join/register, open announcement publish, invitation-token and email enumeration, committed admin credential, fail-open JWT secret, missing uniqueness constraints and duplicate-registration 500, CORS precedence bug.

---

## 6. How big is the gap?

Rough sizing against the reference implementation on this branch:

| Area | Reference on this branch | PHP branch | Missing work |
|---|---|---|---|
| Route files | 65 route modules, ~120 method+path combos | 5 controllers, 15 paths | ~60 route modules |
| Tables | engagement, academics, community, life, productivity, src, attendance, badges, saves, me-store, auth, branding | 10 tables (4 unreachable) | ~15-20 tables |
| Client-ready responses | 75 paths | 0 | full envelope + field work |
| Auth/authorisation | session + roles + permissions + guards | login scaffold, no authz | role/permission model + guards on every mutating route |

Realistically the `backend` branch is a **Phase-1 scaffold**, not a partial backend: it proves out password hashing, prepared statements and JWT verification, and its table/seed ids line up with the frontend's `club-1`/`event-1` vocabulary — but nothing the app does today can be served by it, and its two "working" paths (`clubs`, `events`) return a shape that makes the UI look *successfully empty*.

---

## 7. What this means for the project plan

Three honest options (the client contract is already fixed and battle-tested — the question is only which server satisfies it):

1. **Make this branch's Next server the backend** (`src/app/api/**`), and treat `backend` as a legacy scaffold. It already satisfies all five contract rules, is the code the web app uses today, and needs the known P0/P1 fixes rather than a rebuild.
2. **Port the contract onto the PHP scaffold** — keep PHP/Postgres, but implement §5 P0-P3 to the exact envelope and field rules above, dropping the Laravel stubs (they are non-runnable: no composer skeleton, `User` is not `JWTSubject`, migration drifts from the controllers).
3. **Reduce mobile scope to what the PHP scaffold can serve** — not recommended: after §4 that is *no screen at all*.

Recommendation: option 1, with the PHP branch kept as the data-model reference for the Postgres schema (its table ids, FK cascades and seed vocabulary are genuinely useful).

---

*Companion documents: the backend-branch review (security/correctness findings, docs-vs-reality) was delivered in session; the live contract probe `/tmp/probe-backend.mjs` (86/97 passing) validates the reference implementation on this branch, not the PHP branch.*
