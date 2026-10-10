# API integration guide

Phase 2 establishes a typed, swappable **read** boundary. There is no supplied/verified CampusOne API, secure authentication or upload server in this repository. The endpoint paths and envelopes below are proposed contracts, not a claim that a PHP or other backend implements them.

## 1. Environment and preview safety

```bash
npm run env:example
# Copy the resulting ignored .env.example to ignored .env.local and edit locally.
```

The versioned, credential-free source is `config/env.example`. The generator will not overwrite an existing `.env.example`. **No `.env*` file is committed.**

| Variable | Default / purpose |
| --- | --- |
| `NEXT_PUBLIC_DATA_SOURCE` | `demo`; `api` selects the new async catalog implementation |
| `NEXT_PUBLIC_API_BASE_URL` | `/api`; browser-facing request prefix |
| `API_PROXY_TARGET` | `http://127.0.0.1:4000`; server-only API origin, without a trailing `/api` |
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

`CatalogService`, `CollectionMap`, `ListQuery`, `Page<T>` and `ServiceOptions` live in `src/types/service-contracts.ts`. Catalog/API implementations load only when called, keeping unused API schemas out of legacy Home's initial client path.

**Important:** current synchronous exports such as `engagementService`, `academicsService` and the local auth/state adapters are compatibility readers and **remain demo-only**. Setting API mode does not silently convert all legacy workflows to live behaviour. The new `/design` server composition uses the async boundary; the agreed feature phases will migrate their pages/clients one at a time. No automatic demo fallback occurs after a live request fails.

## 3. Proposed list/detail contract

Resource paths are centralized in `src/config/api-endpoints.ts`. Collections currently include clubs, events, opportunities, accommodation, marketplace, resources, courses, posts, conversations, notifications, media, announcements, timetable, representatives, projects, campaigns and lost/found.

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

const requestHeaders = await headers();
const clubs = await campusService.list("clubs", {
  headers: { Cookie: requestHeaders.get("cookie") ?? "" },
});
```

Do not forward every incoming header or put session values in URLs, component props, logs or public environment variables. Server data caching/revalidation must be scoped correctly for authenticated resources; define it with the real backend instead of caching private feeds globally.

Production needs a real session/auth lifecycle, secure host-appropriate cookies, CSRF handling, role authorization **on the server**, rate limits and privacy controls. The demo role switch/Zustand state is not authentication or an authorization boundary. A visible management/executive panel does not confer official authority. Sign-out isolation and profile/security flows remain scheduled feature work.

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
