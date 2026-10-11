# API integration guide

Phase 2 established a typed, swappable **read** boundary; Phase 3 consumes it for global search; Phase 4 uses it for server-composed Home; Phase 5 adds a separate lazy typed cookie-auth boundary; Phases 6A/6B add owner-aware Clubs/Events read/activity/action contracts; Phase 6C composes eight bounded Discover sources with canonical shared saves. There is no supplied/verified CampusOne API, secure authentication or upload server in this repository. The endpoint paths and envelopes below are proposed contracts, not a claim that a PHP or other backend implements them.

## 1. Environment and preview safety

```bash
npm run env:example
# Copy the resulting ignored .env.example to ignored .env.local and edit locally.
```

The versioned, credential-free source is `config/env.example`. The generator will not overwrite an existing `.env.example`. **No `.env*` file is committed.**

| Variable | Default / purpose |
| --- | --- |
| `NEXT_PUBLIC_DATA_SOURCE` | `demo`; `api` selects typed catalog/auth/Clubs/Events/Discover adapters |
| `NEXT_PUBLIC_API_BASE_URL` | `/api`; browser-facing request prefix |
| `API_PROXY_TARGET` | `http://127.0.0.1:4000`; server-only API origin, without a trailing `/api` |
| `API_SESSION_COOKIE_NAMES` | Empty; server-only comma-separated exact backend session-cookie names; empty forwards no cookies |
| `NEXT_PUBLIC_APP_URL` | Unset; set your real deployment origin for absolute social-preview images |
| `NEXT_PUBLIC_IMAGE_HOSTS` | Empty; exact comma-separated licensed/owned HTTPS image hosts |
| `DATABASE_URL` | Optional server secret for the existing PostgreSQL health integration |

A user's browser is not the sandbox/server. Never configure browser-localhost as the public API base in a remote preview. Requests use `/api/...`; Next's fallback rewrite forwards them to platform port **4000**. `apiClient` explicitly rejects browser loopback bases. Absolute HTTPS API URLs are supported when a real backend requires them, but that deployment must handle CORS, credentials and CSRF correctly.

Server-side relative API calls resolve to `API_PROXY_TARGET` plus the configured `/api` prefix. A custom relative prefix requires a corresponding Next rewrite. Rebuild/restart when changing public environment values or image remote patterns.

The fallback rewrite does not override local route handlers. `/api/health` still checks the existing database integration: HTTP **503**, `{ "ok": false }` when no database is configured, and **500** for a configured connection failure. A frontend build does not require the database. A temporary port-4000 fixture verifies proxy routing/cookie forwarding; it does not verify real API/DB connectivity.

## 2. Public boundary and the compatibility limitation

UI and state seeds import `@/services`, not demo datasets or concrete adapters.

```ts
import { campusService } from "@/services";

const firstPage = await campusService.list("clubs", {
  search: "code",
  category: "all",
  page: 1,
  pageSize: 18,
  sort: "title",
});
const club = await campusService.get("clubs", "club-1"); // Club | null
```

`CatalogService`, `CollectionMap`, `ListQuery`, `Page<T>` and `ServiceOptions` live in `src/types/service-contracts.ts`. Catalog/API implementations load only when called, keeping unused API schemas out of the initial client path.

**Important:** current synchronous exports such as `engagementService`, `academicsService` and domain state adapters are compatibility readers and **remain demo-only**; `authService` now separately selects demo/proposed cookie API. Setting API mode does not silently convert all legacy workflows to live behaviour. The `/design` and Home server compositions use the async boundary; the agreed feature phases will migrate their pages/clients one at a time. No automatic demo fallback occurs after a live request fails.

### Global search (Phase 3)

```ts
import { searchService } from "@/services";

const controller = new AbortController();
const response = await searchService.search({
  query: "Code",
  scope: "clubs",             // all / destinations / one catalog category
  limit: 18,                  // integer 1–30
  signal: controller.signal,
});
// response: { items, unavailable, hasMore }
```

`SearchService`, `SearchQuery`, `SearchResult` and `SearchResponse` live in `src/types/search.ts`. Query text is trimmed and bounded to 100 characters; the default scope is `all`. Empty/one-character inputs offer destination shortcuts without catalog calls. Two-character content searches fan out to clubs, events, opportunities, accommodation, marketplace, resources and announcements (or only the selected category), with **six records per source**. Ranking prefers exact/prefix/title matches; the dialog returns at most 18 by default and points to full feature pages for more.

The implementation composes existing `campusService.list` contracts rather than inventing a deployed `/search` endpoint. API mode therefore uses the proposed collection endpoints, same-origin credentials, query validation and response schemas already documented here. Signals and caller headers pass through unchanged. Detail links use the existing frontend URLs and encode entity IDs.

A failed source is listed in `unavailable`; other results and local page shortcuts remain usable. Do not turn deliberate aborts into source failures or silently substitute demo data. All-source failure and retry are covered by controlled tests; live search/API compatibility remains **unverified**. The UI debounces 225ms, cancels superseded/closed searches, blocks Enter during loading and ignores stale completions.

A future backend-wide search adapter can replace `SearchService` without changing feature controls, but must validate its returned response and preserve cancellation/partial-error semantics. Define the backend's actual authentication, search permissions, ranking and pagination before adding that endpoint. The `/design` preview service deliberately simulates failures/slow replies and is not a production API fallback.

### Home feed (Phase 4)

```ts
import { homeFeedService } from "@/services";
const snapshot = await homeFeedService.snapshot({ headers: selectedSessionHeaders });
// featured, clubs, events, opportunities, campaigns, timetable, courses,
// now (server ISO clock), unavailable, truncated
```

`HomeFeedService` / `HomeSnapshot` live in `src/types/home.ts`. Seven independent catalog list calls run concurrently, **pageSize 30**, with eight-second abortable deadlines. Caller cancellation rejects; a source deadline/network/validation failure records `unavailable`. Upstream `hasMore` records `truncated`, including a warning that a bounded timetable may not contain every session. Collection failures never substitute demo entries. API GETs use `cache: "no-store"`; only the adapter, not private results, is reused.

The new eighteenth collection is `featured`, proposed **`GET /api/home/featured`** with the normal list envelope. `FeaturedContentItem` requires ID/title/description/type, approved `thumbnail`, meaningful `thumbnailAlt` (12–300 chars), local destination and boolean `active`. Video can supply approved `mediaSource` / `captionsSource`, transcript, creator, duration and CTA. A sponsored placement references `campaignId`. Only active Home campaigns inside valid inclusive start/end dates are rendered; playable, described active videos follow. Unsupported/inactive items create no slot. Campaign expiry is rechecked by the client campus clock; changed backend status still requires a fresh feed.

Event/campaign/deadline responses must use valid ISO calendar dates (`YYYY-MM-DD`), not timestamps or impossible dates. Detail IDs are encoded. For uploaded/publisher thumbnails not in the static registry, Home maps the approved URL and supplied alt to media metadata without inventing a license. Private/signed media, content authorization and source licensing remain backend responsibilities.

Timetable/course previews can come from the API, but the existing task planner is **device-only demo state**, not an API mutation or official LMS/timetable synchronization. Recommendations are sorted by date/deadline, not claimed personalized. Development-only `?home-preview=empty|inactive|partial|offline|recover|truncated` fixtures are visibly labelled and ignored by production. They do not validate a real backend.

## 3. Proposed list/detail contract

Resource paths are centralized in `src/config/api-endpoints.ts`. Collections currently include featured (`/home/featured`), clubs, events, opportunities, accommodation, marketplace, resources, courses, posts, conversations, notifications, media, announcements, timetable, representatives, projects, campaigns and lost/found.

```http
GET /api/clubs?search=code&category=all&sort=title&page=1&pageSize=18
GET /api/clubs/club-1
```

An empty list returns the following envelope (not an unvalidated array):

```json
{
  "items": [],
  "page": 1,
  "pageSize": 18,
  "total": 0
}
```

The client computes `hasMore`. Page size is bounded to 1–30. Search/category length, sort and page parameters are validated. Abort signals and request headers are not serialized into the query string. A detail returns its entity directly; a 404 becomes `null`. Other failures remain errors, not invented empty/demo data.

Current schemas preserve the existing entity shapes in `src/types`; they do not invent the future backend model. DTO adaptation belongs in `services/api`, not component render logic. As richer photos/profiles/locations arrive, extend the central entity schemas and map their media to `CampusMedia` before feature consumers change.

## 4. Validated requests and error states

`src/services/api/client.ts` takes a Zod response schema, not `fetch(...).json() as T`:

```ts
import { z } from "zod";
import { apiClient } from "@/services/api/client";

const response = await apiClient("/example", {
  schema: z.object({ ok: z.boolean() }),
  signal: new AbortController().signal,
  headers: { "X-Request-Context": "student-web" },
});
```

- `Accept: application/json`, caller headers preserved, credentials included by default.
- JSON bodies get a content type when one was not supplied. FormData keeps the browser's multipart boundary; never set its content type manually.
- Path validation rejects protocol-relative paths, encoded traversal, malformed paths and unsafe characters.
- HTTP errors expose a friendly message/status. Upstream HTML, SQL errors, tokens and stack traces are not shown to students.
- Offline/network errors have status 0 / code `NETWORK`; malformed JSON or entity envelopes have code `VALIDATION` / status 502.
- Abort errors remain aborted, including cancellation while reading the response. Do not show a failure toast for a deliberate cancellation.
- Empty 204 responses require a schema that actually accepts an empty result.

Use content-shaped loading, `EmptyState` for a valid empty list, and `ErrorState` with a real retry callback for failures. A real write flow should preserve the draft, show submission state, roll back failed optimistic changes and toast success only after its server result is validated.

## 5. Cookies, authentication and authorization

Browser credentials use the same-origin proxy, but server fetch **does not automatically forward** an incoming user's session. In an authenticated Server Component, forward the session deliberately:

```ts
import { headers } from "next/headers";
import { campusService } from "@/services";
import { sessionHeaders } from "@/services/api/session-headers";

const requestHeaders = await headers();
const names = (process.env.API_SESSION_COOKIE_NAMES ?? "").split(",");
const clubs = await campusService.list("clubs", {
  headers: sessionHeaders(requestHeaders.get("cookie"), names),
});
```

Set the real session-cookie names agreed with the backend; the default empty allowlist forwards none. Only exact names survive, not analytics/role/other cookies. Do not forward every incoming header or put session values in URLs, component props, logs or public environment variables. Server data caching/revalidation must be scoped correctly for authenticated resources; define it with the real backend instead of caching private feeds globally.

Production needs a real session/auth lifecycle, secure host-appropriate cookies, CSRF handling, role authorization **on the server**, rate limits and privacy controls. The demo role switch/Zustand state is not authentication or an authorization boundary. A visible management/executive panel does not confer official authority. Phase 5 implements local sign-out/account isolation and a proposed cookie-auth adapter; actual server lifecycle/security is still unverified.

## 6. Media and uploads

Static demo URLs stay in `src/config/images.ts`. API media should include meaningful alt, known dimensions, source/provenance and an approved HTTPS URL. Do not label arbitrary remote content as licensed. CDN permissions, signed URL expiry and private-access rules belong to the backend/storage design.

`ImageUploader` delivers a locally cropped/compressed `ProcessedImage`. It has no invented upload endpoint. When the real contract exists:

1. POST `prepared.file` as FormData through a typed upload service.
2. Validate the returned photo ID, URL, dimensions and ownership information with Zod.
3. Connect actual upload progress, abort/retry and error handling to the service.
4. Store only the returned small metadata/reference in persisted state; never binary images or blob URLs.
5. Validate file bytes/type, size/pixels, metadata and authorization again on the server.
6. Enforce retention/report/privacy rules for lost/found, marketplace, housing and profile photos.

The local showcase's “Photo ready” and callback-failure simulation are **not** backend upload confirmations. Re-encoding strips EXIF, not visual clues in a picture.

## 7. Replacing a demo adapter

1. Agree the real path/auth/DTO/pagination/media contract with the backend.
2. Update `api-endpoints.ts` and runtime schemas; add mapping functions in the API service if field names differ.
3. Keep the typed `CatalogService` consumer contract stable.
4. Migrate a route's initial read to a Server Component where appropriate; pass serializable entity data to the smallest interactive feature subtree.
5. For client refresh/filtering, call the public service with an AbortSignal; do not import `data/demo`.
6. Introduce the domain's typed write service only when its backend contract exists. Until then label local demo actions explicitly.
7. Check loading/empty/error/retry, missing detail/media, keyboard operation, light/dark and 360/768/1280 layouts. Run lint, typecheck, tests and build.

Needed before full integration: final authentication and permissions, private attachment storage, notifications/real-time delivery, authoritative academic/timetable data, event ticket verification, payment authority, and server-side AI contracts. These remain unverified integrations, not hidden fake services.

## 8. Authentication and onboarding replacement (Phase 5)

`AuthService` in `src/types/auth.ts` has a source, typed sign-in/register/reset/session/sign-out methods and caller abort options. UI calls the public lazy `authService`, never a dataset. Default demo sign-in accepts valid made-up input; registration actually uses submitted name/email with a new local student ID. Neither verifies a password. Demo recovery explicitly sends no email.

The API adapter uses the existing credentialed client, `cache: "no-store"` and a 10-second deadline combined with caller cancellation. Browser `/api` stays same-origin; server resolution uses platform 4000. Proposed contracts:

| Method/path after `/api` | Body | Validated outcome |
| --- | --- | --- |
| `POST /auth/sign-in` | `{ email, password }` | `{ user: UserProfile }` + backend session cookie |
| `POST /auth/register` | `{ name, email, password }` | `{ user: UserProfile }` + backend session cookie |
| `POST /auth/password-reset` | `{ email }` | `{ accepted: true }`; request accepted, not mailbox delivery |
| `GET /auth/session` | None; cookie credentials | `{ user: UserProfile \| null }`; HTTP 401 means signed-out |
| `POST /auth/sign-out` | None; cookie credentials | HTTP 204 or `{ ok: true }` |

`UserProfile` requires bounded id/name/email, a known backend role, programme/level strings and an optional approved avatar URL. Role/confirmation/preview acknowledgment are not included in API request bodies. API profile/role is never restored as authentication from localStorage. Session null/failure clears local account activity; no demo is substituted. A demo role switch or a visible executive panel is not official authorization.

All endpoint/envelope examples are **proposals**, tested with mocked fetch and not a live auth backend. Establish hashing, verification/MFA, secure production cookies/TLS, server permissions, CSRF/Origin policy, throttling, uniqueness, reset token lifecycle and email delivery first. If verification is required before a session exists, extend the typed registration outcome/UI. Supply the backend's agreed CSRF handshake/header rather than claiming the current transport solves it. Browser-accessible bearer/session tokens must not enter persisted state.

Logout clears local user/role, six private activity arrays, preferences and prepared photo even if the API action fails. The UI explicitly warns when server sign-out is unconfirmed and asks the user to retry on a shared device. Cross-tab logout/account synchronization is verified for **demo mode only**; cookie revocation and API cross-tab behavior need real integration tests. If device storage refuses clearing, the visit is cleared but older saved data may return when access recovers; this limitation is displayed.

The five-step introduction stores local progress/preferences; it is not an authorization gate. In demo mode personalization clones identity and preserves the role; in API mode it does not call an unimplemented profile-update endpoint. Interests do not yet affect feeds. The optional locally prepared avatar is an owned visit-only blob URL, revoked on replacement/logout and omitted from persistence. Add a server-validated private upload/profile-write service before making a durability claim.

Detailed demo/default-guest migration, return-path rules, privacy and browser verification are in [Phase 5](PHASE5_AUTH_ONBOARDING.md).

## Phase 6A — Clubs read/activity/action replacement

`clubCatalogService` consumes the existing `GET /clubs` list envelope and `GET /clubs/{id}` entity contract with eight-second caller-aware read deadlines. Clubs SSR/metadata forwards only `API_SESSION_COOKIE_NAMES` via the shared exact-name allowlist. The rich `details` object is optional for existing DTO compatibility; if supplied, meeting/venue/fee/count/founded/accepting/rank/story/highlights/leaders/gallery are validated and bounded. Cover/gallery/leader image sources must pass the approved-source policy; transient blobs are not API media. Old demo `technology` and `public-speaking` identifiers remain queryable; display labels group interests without changing those identifiers.

The client calls **`clubActionService`**, not Zustand/fixtures directly. It lazy-loads `ClubActionService`'s demo/API adapter from `NEXT_PUBLIC_DATA_SOURCE`. API activity uses `{ memberships, savedIds }`; memberships have ID/club ID/user ID/status and optional bounded applicant name/note/ISO date. The backend must return only permitted personal/executive scopes. Client filtering is not authorization.

| Proposed route (browser `/api` prefix) | Method/body | Response |
| --- | --- | --- |
| `/clubs/activity` | GET | `{ memberships: ClubMembership[], savedIds: string[] }` |
| `/clubs/{encodedId}/membership` | POST `{ note }` / DELETE | `{ ok: true }` |
| `/clubs/memberships/{encodedId}` | PATCH `{ status: "approved" \| "rejected" }` | `{ ok: true }` |
| `/clubs/{encodedId}/saved` | PUT / DELETE | `{ ok: true }` |

All actions are credentialed/no-store, caller-cancelable and bounded at ten seconds. They omit client identity/role/acknowledgment as authority; API failures never invoke local demo fallback. Success reloads validated activity rather than manufacturing an enrollment count. Frontend duplicate/cancellation guards cannot replace transactional/idempotent writes or undo an already-accepted server write. Real identity/ownership/executive scope, CSRF, database, counts, licensing/private media and notifications must be implemented by the backend.

The directory shows six local results per page. API reads initially request 30; while upstream pages remain, filters/search explicitly cover only loaded records and a retryable load-more action merges/deduplicates the next page. Missing rich details show facts as not supplied, not invented demo venue/fees. Activity errors disable membership/save actions until retry. A changed server catalog result deterministically remounts client initial state on refresh.

Default demo changes are device-local. Account/source changes/logout isolate activity; same-student role changes deliberately preserve the executive workflow. Denied local storage reports visit-only only after verifying that memory changed. No real club receives a demo request, no fee is collected and no official enrollment/security claim is made.

See [Phase 6A Clubs](PHASE6A_CLUBS.md) for media budgets and **24 native / 203 AA-layout captures**, including controlled cookie/no-store/encoding/failure/single-flight/proxy checks. The API browser fixture is an implementation test double, **not a connected or certified production backend**.


## Phase 6B — Events read/activity/RSVP/ticket replacement

Use public `eventCatalogService` / `eventActionService`; UI imports no fixtures. Existing `/events` and detail routes use per-request async reads, 30-record upstream pages, 8-second catalog bounds and the exact SSR session-cookie allowlist. `EventItem` preserves the seven base fields; optional rich `details` adds approved cover/alt, tagline/description, Accra UTC instants/booking deadline, price/organizer/status, highlights/agenda/hosts/access/gallery. Validations enforce integer capacity/count relationships, bounded arrays/text/fees/media, supported catalog IDs, date/start consistency, ≤7-day duration and in-event agenda. Legacy responses retain unknown time/price and produce all-day, not fabricated timed ICS.

| Proposed path after the `/api` prefix | Request | Validated response |
| --- | --- | --- |
| `GET /events` / `GET /events/{id}` | Existing paged catalog / encoded ID | Existing Page envelope / EventItem / 404 |
| `GET /events/activity` | Backend cookie session | `{ goingIds: string[], savedIds: string[], attendance?: { eventId: string, registered: number }[] }` |
| `PUT` / `DELETE /events/{id}/rsvp` | Session; desired going/not-going | `{ ok: true }` |
| `PUT` / `DELETE /events/{id}/saved` | Session; desired saved/not-saved | `{ ok: true }` |
| `GET /events/{id}/ticket` | Session / owned RSVP | `{ eventId, reference, payload, status: "valid" | "revoked" }` |

Activity/ticket/mutations use caller-aware 10-second bounds, credentials, no-store and runtime validation. PUT/DELETE must be idempotent. Client acknowledgment is form consent, never authorization; no client identity/role is supplied as authority. API count reports already include publisher attendance—**never client +1**; absent optional attendance keeps the supplied catalog count. Demo count increments are clearly local/fictional and clamped. Fresh activity is read after accepted actions; owner/source/ID/email/role/sequence/abort guards prevent stale UI state crossing accounts.

Ticket event ID must match the requested event; QR payload is bounded to 1024 characters / 1400 UTF-8 bytes. Only a validated publisher payload renders in API mode; failures/revocation/wrong event have no locally invented credential. Ticket data is not app-persisted. Demo payload/reference/visible warning are explicitly **NOT VALID FOR ENTRY** and contain no personal identifiers. The existing QR bundle loads on ticket intent, not discovery or RSVP; failed code has reconnect/save/reload recovery. Calendar export is a real escaped/folded UTF-8 CRLF `.ics` with UTC rich instants or exclusive next-day all-day dates, source-qualified local UID and honest demo/tentative/cancelled status; it is not live sync or admission proof.

The real backend must derive identity, protect payload/ownership, enforce permissions/CSRF/capacity/time/cancellation atomically, revoke tickets and return current counts/activity. Client cancellation only stops waiting; it cannot undo an accepted server write. Source switching, real secure auth/database/payments/uploads/entry validation are not certified by a frontend build.

**Mocked verification, not deployment:** `phase6-events-api-snapshot.mjs` creates an ignored source-only API-mode copy; start it on 0.0.0.0:3002 with `/api` → server 4000 and exact fixture cookie name. `phase6-events-api-audit.mjs` owns/shuts down its controlled 35-record port-4000 fixture, and tests 48 states across 360/1280 light/dark: retry/load-more/failure retention, consent/single-flight PUT, publisher counts/reload/save without local API persistence, publisher ticket/error/revoked/wrong-event, actual timed/all-day ICS, multi-day dates, closed/full/cancelled/past, exact SSR cookies, and an accepted cancellation with a held response: Stop waiting cannot undo that write, produces no false success, and reopen reads the publisher result. Do not run concurrent 4000 fixtures. Full setup, media provenance and boundaries are in [Phase 6B](PHASE6B_EVENTS.md).

## Phase 6C — Discover sources/activity/canonical saves

`discoverCatalogService` composes the existing catalog paths for `clubs`, `events`, `resources`, `opportunities`, `accommodation`, `marketplace`, `media`, `lostFound`; reference/UI `lost-found` maps to raw collection `lostFound` and `/lost-found`. Each source is an 8-second caller-aware, 30-record bounded read, not a dedicated `/discover` feed endpoint. Normalization keeps optional legacy facts honest and validates page/ID/total/media/text/fact bounds. Partial source failure remains visible and retryable; a failed next page retains prior records. Search, sort and Saved are loaded-record scoped.

`discoverActionService` lazily chooses demo or credentialed no-store 10-second API actions: `GET /discover/activity` → `{saved:[{category,id}]}` (max 500 validated references), `PUT /discover/{category}/{encodedId}/saved` and `DELETE` at the same path → `{ok:true}`, no request body. The backend must infer authenticated owner, validate resource/category access and implement idempotent desired-state writes. **Club/Event saves are canonical shared records**, visible to their existing activity/action paths, not Discover-only duplicates. API activity/saves never write demo bookmarks to local persistence.

Same-origin `/api` proxy → server port 4000, exact SSR `API_SESSION_COOKIE_NAMES`, caller cancellation and no-store follow the existing API boundary. Guest/owner/source/email/role/abort guards are frontend defense, not authorization/CSRF/database proof; an interrupted request may already have been accepted by the backend.

The isolated snapshot + browser fixture verifies 48 360/1280 light/dark states: partial retry, >30 paging/failed-next-page retention, activity failure versus false empty, optimistic rollback/single-flight, publisher reload without local bookmarks, canonical Club/Event saves, accommodation PUT/DELETE, sparse legacy facts, true empty versus complete source error and cookie allowlisting. It owns/shuts down its 4000 mock; do not run concurrent fixtures. Full setup/limits are in [Phase 6C](PHASE6C_DISCOVER.md). No deployed backend verification is claimed.

## Phase 6J — private profile preferences

Profile preferences use the existing publisher-owned workspace contract: GET `/workspace/profile`, PUT/DELETE `/workspace/profile/profile`. Strict fields exclude account ID/email/role edits; image bytes are bounded owned JPEG/PNG/WebP prepared locally. Demo name/programme/level personalization preserves the authenticated account and role. API preferences are not official identity writes or a public-profile publication. Profile/owner/source/role/abort guards and no-store/credentials apply; storage denial is visit-only. A connected backend must enforce resource ownership, CSRF, media scanning/quota and real upload/public-sharing policies. [Phase 6J](PHASE6J_PROFILE.md) records mocked verification and exact remaining boundaries.

## Phase 6K — Social private records and notification state

Community posts/replies/reactions/concerns and Messages history/conversations use the owner-scoped `/workspace/{collection}` GET + PUT/DELETE contract, not a real broadcast or realtime delivery API. Public catalog posts optionally add typed topic/cover metadata. Notifications use credentialed/no-store `PUT /notifications/read` `{ids}` → `{ok:true}`, max 200 IDs, ten-second/caller-aware bounds. Destinations are restricted by the existing student path-only policy; guests/API identities do not receive demo unread badges. Account/source/role guards prevent stale frontend completion, but cannot undo accepted server writes. The backend must supply authorization/CSRF, ownership, upload/moderation/realtime/retention controls. [Phase 6K](PHASE6K_SOCIAL.md) contains precise schema/persistence limits and controlled verification; no real messaging/moderation/deployment claim is made.

## Phase 6L — private tasks and study drafts

The lazy `taskService` proposes credentialed/no-store GET `/tasks` → bounded unique `TaskItem[]`, PUT/DELETE `/tasks/{id}` → `{ok:true}`; demo retains canonical Home task state and verifies durable writes. Caller/owner/source/role guards do not replace backend authorization/CSRF or undo accepted writes. Study generation is a local deterministic engine, **not an AI endpoint**. Its saved `studyPlans` use the existing validated-array workspace GET and PUT/DELETE contract. Structured controls determine sessions; manual notes are not parsed. [Phase 6L](PHASE6L_STUDY_TOOLS.md) documents precise bounds and controlled native API/browser/ICS evidence.

## Phase 6M — campus activity, SRC and secondary reads

Announcements/SRC/projects/representatives/campaigns/Media now consume bounded typed catalog APIs rather than synchronous demo-only UI readers. `GET /campus/activity` returns bounded unique `{savedAnnouncementIds,requests}`. `PUT`/`DELETE /announcements/{encodedId}/saved` and `POST /src-office/requests` accept desired state/request input and return `{ok:true}`. The request body excludes role, user ID and processing status; the backend owns authorization/status. Demo saves reuse canonical bookmarks; private requests preserve the current-owner store. Native mocks verify verbs/body/owner changes/no fallback, not real backend or durable storage. Media rejects unsafe playback sources and never fabricates unavailable recordings. See [Phase 6M](PHASE6M_SECONDARY.md).
