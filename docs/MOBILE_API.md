# CampusOne Mobile API contract

Shared backend for the Android app, iOS app, student web app, SRC Dashboard and
Super Admin Dashboard. One database, one auth system, one permission model —
server-enforced in every route.

- Base URL: `https://<production-host>` or LAN dev `http://<pc-ip>:3000`.
- All paths below are relative to the base URL and start with `/api/`.
- JSON everywhere. Errors: `{ "error": string }` with HTTP status.
- Status conventions: `401` sign in again · `403` lacks permission · `404` unknown
  id · `409` conflict/duplicate/full · `410` expired or revoked · `429` slow down.

## Authentication

Native clients use opaque Bearer session tokens (same `sessions` table and 14-day
TTL as web cookies). Store the token in Keychain/Keystore, never in plain prefs.

| Method & path | Body | Response |
| --- | --- | --- |
| `POST /api/auth/token` | `{ email, password, deviceName? }` | `{ token, expiresAt, user }` |
| `GET /api/auth/token` | — (Bearer) | `{ user }` or `401` |
| `DELETE /api/auth/token` | — (Bearer) | `{ ok: true }` (revokes session) |
| `POST /api/auth/register` | `{ name, email, password, programme?, level? }` | web parity; mobile uses `/api/auth/token` after |
| `GET /api/users/me` | — (Bearer) | `{ user }` |
| `PATCH /api/users/me` | `{ name?, programme?, level? }` | `{ user }` |

`user`: `{ id, email, name, role, roles[], permissions[], programme, level,
avatar?, verifiedStudent }`. Send `Authorization: Bearer <token>` on every
authenticated call.

## Catalog (browse fixtures + validated server overlays)

`GET /api/<collection>?search=&category=&sort=title|newest&page=&pageSize=` →
`{ items, total, page, pageSize }`. `GET /api/<collection>/<id>` → item or `404`.

Collections used by mobile: `clubs`, `events`, `announcements`, `accommodation`
(listings incl. verification), `resources` (materials), `courses`,
`opportunities`, `timetable`, `media`, `marketplace`, plus the prefixed ones:
`posts` → `/api/community/posts`, `representatives` (SRC exec profiles) →
`/api/src-office/representatives`, `projects` → `/api/src-office/projects`,
`campaigns` → `/api/advertising`, `lostFound` → `/api/lost-found`, `featured` →
`/api/home/featured`. (`notifications` is a legacy demo feed — mobile uses
`/api/notifications` instead.)

## Clubs & memberships

| Method & path | Body | Response |
| --- | --- | --- |
| `POST /api/clubs/{id}/membership` | `{ note? }` | `201 { item }` (idempotent) |
| `DELETE /api/clubs/{id}/membership` | — | `{ removed }` |
| `GET /api/clubs/memberships/{mid}` | — | `{ item }` (own or club viewer) |
| `PATCH /api/clubs/memberships/{mid}` | `{ status: approved\|rejected }` | `{ item }` (club managers) |
| `GET /api/clubs/{id}/saved` | — | `{ saved }` |
| `PUT /api/clubs/{id}/saved` | `{ saved }` | `{ saved }` |
| `GET /api/users/me/clubs` | — (Bearer) | `{ items[] }` (own memberships + managed clubs) |

Membership: `{ id, clubId, userId, status, applicantName, note, requestedAt,
decidedBy, decidedAt }`. My-club item: `{ clubId, clubName, category, status,
managed, pendingRequests }` — `status` is the membership status, or
`"manager"` when the caller holds `club.members.manage` without a membership;
`pendingRequests` is nonzero only where `managed` is true.

## Personal store (account-synced workspace)

| Method & path | Body | Response |
| --- | --- | --- |
| `GET /api/me/store?collection=tasks` | — (Bearer) | `{ items[] }` |
| `GET /api/me/store?collection=tasks,plans` | — (Bearer) | `{ items: { tasks[], plans[] } }` |
| `PUT /api/me/store` | `{ collection, item }` | `{ item }` (`400` invalid, `409` collection full at 200) |
| `DELETE /api/me/store?collection=tasks&id=t1` | — (Bearer) | `{ removed }` |

Collections: `tasks` `sessions` `plans` `notes` `grades` `studyPlans`
`communityPosts` `replies` `reactions` `concerns` `marketPosts` `reports`
`enquiries` `profile`. Items are validated by the same zod schemas as web;
photos are `data:image/{jpeg,png,webp};base64,…` capped at 720KB. Rows are
always scoped to the caller (`userId` stamped server-side).

## Saved items (extended)

| Method & path | Body | Response |
| --- | --- | --- |
| `GET /api/saves` / `?kind=listing` | — (Bearer) | `{ items: [{ kind, entityId, createdAt }] }` |
| `PUT /api/saves` | `{ kind, entityId, saved }` | `{ saved }` |

Kinds: `club` `event` `listing` `media` `announcement` `post`. Listing
entityIds are composite `"domain:id"` (`marketplace:mk1`, `opportunities:o2`,
`accommodation:h3`, `resources:r4`, `lostFound:lf1`).

## Student submissions

| Method & path | Body | Response |
| --- | --- | --- |
| `POST /api/src/requests` | `{ title, category, description }` (`Academic support`/`Welfare`/`Infrastructure`) | `201 { item }` |
| `POST /api/src/nominations` | `{ clubId?, clubName, position, nomineeName, nomineeEmail?, nomineeUserId?, statement? }` | `201 { item }` |
| `POST /api/src/clubs` | `{ name, category, description, objectives[] }` | `201 { item }` |
| `POST /api/listings` | `{ title, area, price, period, beds?, description, contact }` | `201 { item }` (pending review) |
| `GET /api/listings` | — | `{ items[] }` (approved) |
| `POST /api/reports` | `{ targetType, targetId, reason, detail? }` | `201 { item }` |
| `POST /api/auth/password-reset` | `{ email }` | `{ accepted: true }` (request logged; no email is sent yet) |

## Events, RSVP & tickets

| Method & path | Body | Response |
| --- | --- | --- |
| `POST /api/events/{id}/rsvp` | `{ attending }` | `{ attending, rsvp: { id, eventId, status } \| null }` (`409` when full) |
| `DELETE /api/events/{id}/rsvp` | — | `{ attending: false, rsvp: null }` |
| `GET /api/events/{id}/saved` | — | `{ saved }` |
| `PUT /api/events/{id}/saved` | `{ saved }` | `{ saved }` |
| `GET /api/events/{id}/ticket` | — | `{ ticket: { reference, name, event, status, issuedAt } }` (`404` without RSVP) |

## Attendance (QR, backend-validated)

QR payload: `C1A1.<sessionId>.<slot>.<mac>` — 60-second rotating HMAC-SHA256 slots,
no student PII. Scan result codes surface as `code` alongside `error`.

| Method & path | Body | Response |
| --- | --- | --- |
| `POST /api/attendance/sessions` | `{ eventId, startsAt, endsAt, clubId?, clubName?, requireMembership?, maxCheckins? }` | `201 { item }` (event managers) |
| `GET /api/attendance/sessions?eventId=` | — | `{ items }` (event managers) |
| `GET /api/attendance/sessions/{id}` | — | `{ item, checkins, present }` (managers) |
| `PATCH /api/attendance/sessions/{id}` | `{ status: closed\|revoked }` | `{ item }` (managers) |
| `GET /api/attendance/sessions/{id}/code` | — | `{ code, sessionId, slot, slotEndsAt }` (managers; re-poll per slot) |
| `POST /api/attendance/check-in` | `{ code }` | `{ record, session, duplicate, badges }` |
| `GET /api/attendance/records` | — | `{ items, total }` (own history) |
| `PATCH /api/attendance/records/{id}` | `{ status: present\|voided\|excused, reason }` | `{ item }` (managers; audited) |

Check-in failures: `invalid-code 400`, `not-started 409`, `expired/ended/revoked/
closed 410`, `not-eligible 403`, `event-full 409`. Duplicates return `200` with
`duplicate: true` and no new badge.

## Badges & participation

| Method & path | Response |
| --- | --- |
| `GET /api/badges/definitions` | `{ items: [{ id, name, description, icon, rule, threshold }] }` (public) |
| `GET /api/badges` | `{ items: [{ …, badge }] }` (own awards) |
| `GET /api/participation` | `{ records, badges }` (own history) |

Badge `icon` is a Material icon key (`verified`, `groups`, `explore`) the app maps
to `Icons.*`.

## Messaging (REST polling — no realtime sockets)

| Method & path | Body | Response |
| --- | --- | --- |
| `GET /api/conversations` | — | `{ items: [{ …, lastMessage, unread, members }] }` |
| `POST /api/conversations` | `{ kind: direct, userId }` \| `{ kind: group, title, memberIds[] }` \| `{ kind: club, clubId, title }` (club managers) | `201 { item }` |
| `GET /api/conversations/{id}/messages?limit=` | — | `{ items, total }` (members) |
| `POST /api/conversations/{id}/messages` | `{ body }` (≤2000 chars) | `201 { item }` (members) |
| `POST /api/conversations/{id}/read` | — | `{ ok: true }` |

Clients poll thread lists (~15s) and open threads (~5–10s) plus pull-to-refresh.

## Notifications & devices

| Method & path | Body | Response |
| --- | --- | --- |
| `GET /api/notifications?limit=` | — | `{ items, total, unread }` |
| `PATCH /api/notifications` | `{ ids: [...] \| "all" }` | `{ updated, unread }` |
| `GET /api/devices` | — | `{ items, total }` |
| `POST /api/devices` | `{ platform: android\|ios\|web, token, appVersion? }` | `201 { item }` (upsert by token) |
| `DELETE /api/devices?id=` | — | `{ ok: true }` |

Notification: `{ id, kind, title, body, link, readAt, createdAt }`. Push delivery
needs the external Firebase project; without it the feed is the notification
channel (see `docs/MOBILE_RELEASE.md`).

## Club management (executives)

All paths: `/api/manage/clubs/{id}/…`, scoped `club.*` grants (or registry-club
ownership); `club.members.manage` implies `club.members.view`.

| Method & path | Purpose |
| --- | --- |
| `GET members` | roster incl. pending requests |
| `GET/POST events` | list / publish (event fields per catalog contract) |
| `DELETE events/{eventId}` | cancel |
| `GET/POST officers`, `DELETE officers/{oid}` | appoint / end tenure |
| `GET/POST resources`, `DELETE resources/{rid}` | exec documents |
| `GET analytics` | `{ members, pending, growth[], eventsHosted, totalRsvps, rsvps[] }` |

## SRC & admin (dashboards; mobile uses read slices)

Full CRUD stays in the web dashboards. Mobile reads: `GET /api/src/overview`
(SRC roles), announcements via catalog, `GET /api/branding/public` (theme), SRC
profiles via catalog (`representatives`, `projects`). Bearer tokens carry the same
RBAC, so authorised phones can call any documented dashboard endpoint.
