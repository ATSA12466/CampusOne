# Phase 6C — photo-first Discover

Frontend milestone verified on **11 October 2026**. Discover is now a balanced campus magazine hub, not a fabricated recommendation engine. **Accommodation is the next domain.** Later domains, production backend/security and Home's default-renderer/real-device Performance ≥90 gate remain open.

## Scope and design decisions

- Preserved `/discover` and all eight existing destinations: Clubs, Events, Study resources, Opportunities, Campus living, Marketplace, Media and Lost & found.
- Photo hero, three linked starting-point collections, compact URL-backed controls, six-card pages, source disclosure and accessible loading/empty/error/retry/save feedback. Existing Fraunces / Source Sans 3 fonts, semantic light/dark tokens and reduced-motion rules are reused.
- **Campus edit:** deterministic round-robin mix of up to 24 current records. **Browse all:** all loaded records. **Saved:** the current owner's saved, loaded records. Search or a category filter extends beyond the edit to the loaded catalog. These are not popularity/personalization rankings or guarantees about unloaded records.
- The actual demo snapshot is **45 canonical records**: 16 Clubs, 16 Events, 3 resources and 2 each of opportunities, accommodation, marketplace, media and lost-found. Browse all reaches all 45 in eight six-record pages, with three on the last page. Snapshot serialization measured **45,511 bytes**; no new fixture records or image files were added to the app.
- Title sort is deterministic; supplied date sort uses actual event/deadline/publication dates, leaves undated records last and does not invent dates for sparse records. The edit omits ended/cancelled events and passed deadlines. All/Saved retain records with truthful status. A shared SSR-seeded minute/visibility clock updates statuses without hydration drift.
- Existing Club/Event covers are reused with generated-photo disclosures. Sparse-domain covers say **“Category illustration · not this listing”**, never pretend to show the listed property/product/report/recording. Media opens `/media`, not a nonexistent player; reports open `/lost-and-found`, not invented detail URLs. Publisher-supplied allowed media may replace a media-library illustration.
- Guest sign-in returns to `/discover`; the established **path-only** redirect validator is not widened to accept filter queries. Filters can then be selected normally. The broken query-bearing prototype sign-in link was corrected, and browser/native tests retain the restrictive redirect policy.

## Composition and service boundary

`src/app/(student)/discover/page.tsx` performs a bounded server read, forwards only exact configured session-cookie names and supplies serializable normalized data plus its initial clock. `loading.tsx` uses the shared skeleton vocabulary. A result hash replaces stale initial client state on genuine server refresh.

- `src/types/discover.ts`: category-qualified references, normalized items/facts/destinations, section/snapshot/catalog/activity/action contracts.
- `src/config/discover.ts`: categories, legacy bookmark mapping, edit 24 / UI page 6 / upstream page 30 defaults.
- `src/services/discover/`: eight typed mappers/sources, bounded concurrent composition and lazy demo/API actions. UI calls public services, not datasets.
- `src/lib/discover/`: pure deterministic mix/filter/sort/page/status and canonical bookmark projections.
- `src/features/discover/{components,hooks,validation}`: URL, public catalog, owner-qualified private activity and single-flight saves. UI leaves are approximately 150 lines or less (largest 151).
- `src/app/styles/discover.css`: scoped hero treatment using existing semantic variables. Photos remain centralized in `src/config/images.ts` and rendered by `CampusImage`.

Each initial source reads one **30-record** upstream page with an **8-second** caller-aware deadline. Errors are section-qualified, never replaced by demo data in API mode. Healthy sections remain browsable when another source fails. Totals, page identities, bounds, duplicates, empty-more inconsistencies and get-ID mismatches are validated. Load more retains earlier records, deduplicates appended IDs and offers a genuine retry of the failed page. Search/sort/Saved explicitly cover **loaded records only**.

External normalized items have bounded titles/descriptions/facts/IDs/ranks, valid optional dates, root-relative supported destinations and allowed cover sources. Unsafe/dot-path/control-character IDs and malformed reference categories fail validation. External activity is bounded to 500 validated references.

## URL and saves

`q`, `category`, `view`, `sort`, `page` round-trip through the bounded feature Zod schema. Query typing uses native `replaceState`; meaningful filter/page changes use `pushState`; `popstate` restores the view. The page does not fetch a server route for every keystroke. Malformed values receive safe defaults, query is capped at 120 characters and page at 100,000 before actual result clamping.

Demo saves reuse the existing `campusone-app` bookmark records, including Club/Event saves. Added accommodation/lost-found bookmark types and an explicit desired-state `setBookmark` leave the legacy toggle/membership/registration/executive APIs intact. Already-correct save operations retain existing record identity/order. The demo adapter rechecks source, account/email, role and abort state before writing, reads catalog IDs rather than trusting UI input and verifies changed memory when storage throws. Verified memory-only saves say **visit-only**; unrelated mutation failure is not misreported as a successful save.

Private API activity remains owned component memory, not local demo bookmarks. Pending saves are optimistic but disabled/single-flight; rejected requests roll back while keeping the filter inputs. Abort/sequence/live-owner guards prevent late feedback from crossing profile/source/role/logout boundaries. Closing or interrupting a request cannot undo a write the backend already accepted; refresh Saved items reads the publisher state again.

## Proposed API replacement

Public reads reuse the existing `{ items, total, page, pageSize }` catalog envelopes and optional-rich legacy DTOs:

| UI category | Catalog collection | Proposed source path |
| --- | --- | --- |
| `clubs` | `clubs` | `/clubs` |
| `events` | `events` | `/events` |
| `resources` | `resources` | `/resources` |
| `opportunities` | `opportunities` | `/opportunities` |
| `accommodation` | `accommodation` | `/accommodation` |
| `marketplace` | `marketplace` | `/marketplace` |
| `media` | `media` | `/media` |
| `lost-found` | `lostFound` | `/lost-found` |

Private actions use 10-second deadlines, credentials, no-store and caller cancellation:

```text
GET    /discover/activity
       { saved: [{ category: "events", id: "e1" }] }
PUT    /discover/{category}/{encodedId}/saved    -> { ok: true }
DELETE /discover/{category}/{encodedId}/saved    -> { ok: true }
```

The backend must own identity/authorization, validate canonical resource IDs and make desired-state saves idempotent. **Club/Event saves must be the same records** exposed by their existing activity/action endpoints, not separate Discover-only copies. Reference categories are UI names (`lost-found`, not `lostFound`). API browser requests use `/api`; Next proxies to server-only port **4000**. `API_SESSION_COOKIE_NAMES` forwards exact SSR names only, not unrelated cookies, roles from local storage or secret client props.

These are **proposed contracts**, not deployed API/security proof. The mock fixture demonstrates the same-origin browser/SSR and canonical cross-feature behavior, not a real backend's authorization, CSRF, database or durable storage.

## Verification and reproduction

- Lint, strict typecheck and production build passed; **32 generated pages**, no new runtime dependency, zero TypeScript `any` nodes in app source.
- **150 native tests:** 122 maintained tests plus **28 Discover** tests. Discovery covers all canonical DTOs, bounded/partial source reads, wrong pages/IDs/duplicates, composed selectors/URL/status/saved scope, legacy optional facts, HTTP verbs/encoding/deadlines/abort/errors, eight-type persistence and idempotence, canonical Club/Event saves, denied storage/unrelated failure, owner races/guest/logout and safe sign-in return policy.
- **128 Discover production-browser captures:** 84 directory (360/768/1280 × light/dark), 12 eight-type/shared-save workflows, 8 profile/cross-tab/guest, 8 denied-storage/photo fallback, 8 SSR/code delivery, 8 clock/visibility. All AA, overflow and 44px-target checks pass.
- **48 mocked API captures:** 360/1280 × light/dark, partial source retry, 30-of-35 bounded pages, failed/retried next-page retention, activity error not false Saved-empty, rollback, pending duplicate-click single-flight, reload/publisher-only state, canonical Event/Club removal, accommodation PUT/DELETE, legacy fee/illustration truth, genuine-empty versus all-error and exact SSR cookie forwarding. No local API bookmarks or demo catalog fallback.
- **222 shared route captures / 74 AA scans** passed. Fresh foundation, shell/search, Home/media/clock/delivery, auth session/tour, Club membership/executive, Event RSVP/save/cancel/decoded-QR/ICS, same-origin proxy/health and 12 maintained positive workflow regressions passed. Existing community/report persistence/photo and study-plan constraint gaps remain deliberately recorded.
- Manually inspected actual full hub captures plus all eight category/result panels, Saved/guest/failure panels at 360/1280 light/dark; automated matrices also cover 768. Image ratios, semantic surfaces, generated-cover labels, card geometry and mobile/desktop shell remained correct.
- Runtime-only dependency audit: **0 vulnerabilities**. Full audit: **9 development advisories** (5 high / 4 moderate); no new package. No new Home Lighthouse score is claimed; retained default median **82**, CPU diagnostic **94**, Accessibility **100** do not close the default/physical-device gate.

```bash
npm run test:discover
AUDIT_BASE_URL=http://127.0.0.1:3001 node scripts/phase6-discover-audit.mjs
# Optional AUDIT_GROUPS=directory,workflow,privacy,resilience,delivery,clock
node scripts/phase6-discover-api-snapshot.mjs
# In the returned ignored .cache/phase6/discover/api-app directory:
NEXT_PUBLIC_DATA_SOURCE=api NEXT_PUBLIC_API_BASE_URL=/api \
  API_PROXY_TARGET=http://127.0.0.1:4000 API_SESSION_COOKIE_NAMES=campus_session \
  npm run dev -- --hostname 0.0.0.0 --port 3002
# From the repository root, once API-mode 3002 is ready:
node scripts/phase6-discover-api-audit.mjs
```

The API snapshot copies eligible source files and links installed dependencies, excluding ignored outputs/secrets. The audit owns/shuts down its port-4000 mock; do not run other 4000 fixtures concurrently. Evidence is in ignored `.cache/phase6/discover/{browser-final,api-browser,routes,regressions,review}`, `native-all.log`, `build.log` and runtime/full audit JSON. Cached binary retention is not guaranteed; source runners and this report are committed.

Next: **Accommodation → Marketplace → Opportunities → Lost & Found → Academics → Timetable/Calendar → Profile → remaining**, then polish/final verification. Real housing contacts/maps/reporting/uploads, full media playback and Lost & Found report/photo persistence are not completed by this hub.
