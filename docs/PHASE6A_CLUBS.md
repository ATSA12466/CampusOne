# Phase 6A — photo-first Clubs

11 October 2026 · `campusone-web` · **Frontend subphase; Events is next, not completed.**

The established magazine direction now covers `/clubs` and `/clubs/[id]`. URLs, the Manrope/Fraunces pairing, semantic light/dark/system themes, shared shell and pending authorized SRC artwork slot remain intact. Sixteen fictional Ghanaian-campus communities replace the two-entry directory. `club-1` Code Collective, `club-2` Debate Assembly and the approved `m1` / pending `m2` membership seeds remain compatible. Their original `technology` / `public-speaking` category identifiers stay queryable; a pure label adapter presents seven readable interest groups.

## Experience and boundaries

- A large generated campus-community story leads the directory. Six photo cards per page create **three real pages: 6 / 6 / 4**, with keyboard-operable pagination and result-heading focus. Search trims/folds case/accents and finds names, descriptions, objectives, meetup/venue text and interest labels. Interest, featured/name/member sorting, All / My / Saved views compose and reset pagination correctly.
- Details have a cover story, meaningful photo alt, objectives/highlights, meetup/venue, illustrative GH₵ semester fee or free-to-join label, member count, welcome crew, gallery/lightbox and desktop-sticky/mobile-fixed membership controls. Facts are proper definition lists. Membership controls clear mobile navigation; bottom padding lets the final gallery controls scroll above fixed actions.
- Local requests accept an optional ≤400-character introduction plus explicit demo acknowledgment, with associated Zod/RHF errors and first-invalid-field focus. Request, withdraw, leave, declined-request reapply, save/remove, and executive Approve/Reject work and survive reload where device storage allows it. Reapply reuses the declined record; duplicate writes are guarded.
- The executive review panel is preserved and source-aware. Same-student demo role changes preserve requests/decisions; **a demo role switch is not authorization**. Changed account/source and logout clear private activity. Client dialogs/action state are owner-qualified; demo actions recheck current owner/email/source/role and abort immediately before a mutation after asynchronous work.
- Denied device storage can leave the change in visit memory. The service reports `persisted: false` **only if the requested memory change actually occurred**; unrelated failures still throw. The toast says visit-only, not durable success. Guests browse but cannot request/save; sign-in retains the existing safe-return flow.
- Catalog and activity errors are separate, retryable and never replaced with demo successes in API mode. Unknown catalog totals are not presented as zero. A deterministic server-result hash replaces stale client initial state after `router.refresh()`. API load-more merges/deduplicates records and explicitly states that filters/search cover loaded records until the rest arrive.
- Gallery supports arrow keys, named controls, trap/Escape and return focus. A failed image preserves its reserved frame and meaningful accessible fallback. A failed intent-loaded action chunk does not fabricate a mutation and gives reconnect/save/reload guidance.

All groups, people, counts, locations, fees and activity scenes in demo mode are fictional. No request reaches a real club, no official enrollment is recorded and no payment is taken. Interest selection is not claimed personalized recommendation logic. Demo member counts are illustrative catalog values, not incremented enrollment totals.

## Media and shipped-cost decisions

Five generated 1200 × 675 WebPs are local and registered centrally in `src/config/images.ts`; lightweight raster blurs live in `club-image-blurs.ts`. These are **fictional scenes, not actual GCTU people/photos**. No copyrighted hotlinking, official artwork invention or new runtime dependency was introduced.

| Asset | Illustrative subject | Bytes |
| --- | --- | ---: |
| `club-makers.webp` | Students building a small robotics project | 98,790 |
| `club-debate.webp` | Students practicing a seminar-room debate | 70,968 |
| `club-arts.webp` | Students sharing a creative workshop | 118,096 |
| `club-sport.webp` | Students playing on a recreation court | 91,224 |
| `club-service.webp` | Students tending a community garden | 147,210 |
| **Total** | Five source images, reused rather than duplicated | **526,288** |

Conversion uses Sharp WebP quality 73 (garden quality 65), effort 5. `CampusImage` negotiates responsive Next images, fixed ratios/focal points, quality 60 card requests, blur, lazy loading and fallback; only the lead story is priority-loaded. Raw generation PNGs/screenshots are ignored, not shipped. The old Debate SVG registry slot is now `clubDebatePlaceholder`; its public URL is unchanged.

Standalone membership seeds are separated from the rich club catalog so the initial persisted-app seed reader does not import sixteen full club profiles merely to initialize local state. Feature/data leaves are split around 150 lines; strict TS and installed RHF/Zod/Radix/native primitives suffice. Audit-only source copies are excluded from lint/typecheck, like other ignored generated artifacts.

## Replacement contracts

- `src/types/clubs.ts`: optional rich `ClubDetails`, catalog/filter/activity/mutation contracts and `ClubActionService`; `ClubMembership` adds optional applicant name/introduction/date and bookmarks add `club`.
- `clubCatalogService`: typed async list/get over `campusService`, 30-record requested pages and caller-aware eight-second deadlines. Optional rich details preserve old DTOs; gallery/leader sources, counts, fees and arrays are validated. API image URLs must be approved local/HTTPS sources, not transient blobs.
- `clubActionService`: lazy source selection; UI imports the public service, never fixtures. API reads/writes are validated, credentialed, same-origin `/api` → server port **4000**, no-store and caller-aware ten-second deadlines. SSR forwards only exact configured session-cookie names; headers are never client props.

| Proposed endpoint (browser `/api` prefix) | Request | Response |
| --- | --- | --- |
| `GET /clubs/activity` | Backend cookie session | `{ memberships: ClubMembership[], savedIds: string[] }` |
| `POST /clubs/{id}/membership` | `{ note: string }` | `{ ok: true }` |
| `DELETE /clubs/{id}/membership` | Backend cookie session | `{ ok: true }` |
| `PATCH /clubs/memberships/{id}` | `{ status: "approved" \| "rejected" }` | `{ ok: true }` |
| `PUT /clubs/{id}/saved` | Backend cookie session | `{ ok: true }` |
| `DELETE /clubs/{id}/saved` | Backend cookie session | `{ ok: true }` |

IDs are URL-encoded. No client user ID, role or acknowledgment is sent as authority. A real backend must derive identity/club scope, enforce ownership/executive permissions and CSRF, manage atomic/idempotent writes, return fresh activity/counts, license/authorize media and protect private introductions. A client cancellation cannot guarantee rollback of a server write already accepted. **The endpoint implementation, security, durable database and real club workflow remain unverified.** The port-4000 browser fixture proves frontend/proxy/DTO behavior, not deployment.

## Verified evidence

- Lint, strict typecheck and optimized Next **16.4.0** build pass (32 generated pages; Clubs routes remain dynamic).
- Native tests: **92 total = 15 foundation + 12 shell + 18 Home + 23 auth + 24 Clubs**, zero failures. New coverage includes directory composition/pagination/sorting, registered-photo budgets, optional/invalid DTOs, notes/acknowledgment, legacy categories, mocked API failures/encoding/authority omission/abort, actual demo persistence/idempotence/reapply/roles, denied storage and a deliberately delayed old-owner action.
- **203 Clubs AA/layout/44px captures:** 30 directory states; 96 detail views (all 16 routes × 360/768/1280 × light/dark); 24 membership/save/gallery; 12 executive; 8 privacy; 8 storage/photo fallback; 1 action-code outage; 24 isolated mocked-API states at 360/1280 both themes. Zero rule violations, visible/root overflow, sub-44px flags or normal page exceptions. No rule or target requirement was disabled.
- API browser checks demonstrate catalog failure→server refresh→real records, loaded-record disclosure/load-more, activity error disabling mutations, retained failed-request input, single-flight POST, server-fixture save/request persistence, withdraw/review, legacy missing fields, closed requests and SSR cookie allowlisting. All four combinations use the same-origin Next proxy to the controlled fixture.
- Shared foundation, shell/search, Home/media/clock/error/delivery, auth-session/executive/cross-tab and proxy regressions pass. The older session runner now targets the named review panel and awaits the asynchronous decision before asserting persistence; it does not weaken the approval assertion.
- Fresh full shared-route regression: **222 cases / 74 AA analyses**, zero overflow/44px/AA flags. Production `/design` is 404; existing streamed invalid-detail/not-found behavior remains documented rather than mislabeled HTTP 404.
- Manual review covers the directory/details at 360/1280 both themes, all sixteen detail header/gallery overview panels and representative dialog/gallery/executive/API states. The initial card facts had invalid nested definition-list grouping; this was fixed, not suppressed. The detail save overlay has explicit stacking so it remains clickable.
- Runtime-only dependency audit: **0 vulnerabilities**. Full audit: **9 development advisories** (5 high, 4 moderate, 0 critical). No forced downgrade.

Source runners are versioned: `scripts/phase6-clubs-tests.mjs`, `phase6-clubs-audit.mjs`, `phase6-clubs-api-audit.mjs`. Evidence is ignored under `.cache/phase6/clubs/` (binary caches may not survive restoration). API verification uses an isolated current-source dev snapshot with `NEXT_PUBLIC_DATA_SOURCE=api` and a controlled port-4000 fixture; the fixture and verification server are shut down afterward.

```bash
npm run test:clubs
# With a production demo build listening on 3001:
AUDIT_BASE_URL=http://127.0.0.1:3001 node scripts/phase6-clubs-audit.mjs
# Separate API-mode dev checkout/snapshot, or stop the demo dev server first:
NEXT_PUBLIC_DATA_SOURCE=api API_SESSION_COOKIE_NAMES=campus_session \
  npm run dev -- --hostname 0.0.0.0 --port 3002
# In another terminal; keep 4000 free for the controlled fixture:
node scripts/phase6-clubs-api-audit.mjs
# Stop the API dev server after verification. Never deploy the test fixture.
```

The isolated-source snapshot avoids sharing a Next dev lock/public-env compilation with the demo server. Source must match the revision under test; dependency/cache directories should be symlinked/ignored, not added to Git.

Home Lighthouse is **not re-measured or claimed improved by this subphase**. Retained Phase 5 results: default **83/82/75, median 82**; explicitly disclosed software-raster diagnostic **95/94/94, median 94**; Accessibility 100 throughout. Default/real-device Performance ≥90 remains open. Safari/Firefox/physical devices/IME/full screen-reader traversal and real backend/security integrations remain open.

## Next

**Events**: photo discovery/detail feeds, RSVP states/countdown, demo QR ticket and ICS; then Discover → Accommodation → Marketplace → Opportunities → Lost & Found → Academics → Timetable/Calendar → Profile → remaining. Community/lost-found persistence, required report photo, study constraints and other later-phase gaps are not claimed fixed here. Final polish and whole-app acceptance follow the ordered feature migrations.
