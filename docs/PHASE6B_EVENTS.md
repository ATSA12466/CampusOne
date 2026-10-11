# Phase 6B — photo-first Events

11 October 2026 · `campusone-web` · **Events frontend subphase complete; Discover is next. Not all of Phase 6.**

The magazine direction now covers `/events` and `/events/[id]`: sixteen fictional listings, six interests, real six-card pagination, rich photo stories and useful planning actions. The existing URLs, Manrope/Fraunces typography, semantic light/dark/system themes and pending authorized SRC-artwork slot remain intact. The original records are preserved:

| ID | Original title | Date | Venue | Category | Seats / registered |
| --- | --- | --- | --- | --- | --- |
| `e1` | Innovation Night | 2026-10-16 | Main Auditorium | Showcase | 300 / 120 |
| `e2` | Data Science Career Talk | 2026-10-20 | Seminar Hall A | Career | 180 / 86 |

## Experience and honest boundaries

- Photo discovery composes accent/case-insensitive search, interest, date window, soon/name/popularity/price sorting, free-only, All / My RSVPs / Saved views. Search includes descriptions, venue, organizer and highlights: “innovation” also finds the fictional Innovation Lab, not just Innovation Night. All dates give **6 / 6 / 4** pages; at the October 11 verification clock, upcoming/today gives **6 / 6 / 3**. Fixed October fixtures age normally; the app does not invent fresh dates to seem live.
- Details have a generated cover, explicit provenance, valid definition-list facts, programme/highlights, timed agenda, fictional hosts, access caveats and gallery/lightbox. Desktop-sticky/mobile-fixed actions clear navigation, with enough end padding to reach the final gallery controls. No venue-access claim is verified campus information.
- RSVP requires explicit source-aware acknowledgment. Save/remove, RSVP/remove, cancellation confirmation and reload persistence work locally. Idempotent desired-state RSVP replaces UI toggling, while `registrations: string[]` and the old store toggle remain compatible. Repeated requests never add a duplicate RSVP or bookmark.
- Full, booking-closed, cancelled, past and invalid-schedule states cannot create a new RSVP. Existing RSVPs can be removed even after closure/end. A minute/visibility clock updates countdown/status; the demo service re-reads the catalog, actual current time and current owner after awaits before writing. Crossing the deadline while the consent dialog is open rejects the submission without adding a plan.
- Legacy date-only DTOs stay useful without made-up time, fee, programme or gallery. They show “Time/Price not supplied,” no precise countdown and an all-day calendar export. Multi-day rich listings expose the end date and agenda dates, not a misleading same-day time range.
- Save/RSVP/ticket state is source/ID/email/role-qualified. Aborts and live-owner/sequence checks suppress late UI success after identity changes. Demo account changes/logout clear private plans/bookmarks; cross-tab logout unmounts the ticket QR, and guest state survives reload.
- Denied storage reports visit-only **only after verifying the requested memory state**. An already-correct in-memory action checks persisted state rather than claiming durable success. Unrelated mutation failures still throw. Catalog, activity, action, image and ticket-code failures are distinct and honest; API errors never become demo successes.
- Keyboard controls use associated validation errors, first-invalid checkbox focus, named/trapped dialogs, Escape and return focus. A disconnected/disabled RSVP trigger falls back to the focusable action panel or directory result heading, not the document body.

**All demo events, people, programmes, venues, fees, photos and attendance counts are fictional. No real seat, university registration, payment or admission credential is created.** API publisher ownership/capacity/admission remains a backend responsibility; these frontend checks do not prove secure real operation. Stopping a pending API wait cannot undo a request already accepted by the server; reopen the listing to check.

## Tickets and actual calendar export

`qrcode.react` **4.2.0 was already installed**. Its QR bundle is not fetched by browsing, saving or RSVPing: ticket intent loads the dialog/library. No new application runtime dependency was added. Missing ticket code has a recoverable dialog; a failed ticket API response has Retry and no locally synthesized credential. Revoked/wrong-event tickets never render a QR.

The local payload is exactly `CAMPUSONE_DEMO_NOT_VALID_FOR_ENTRY|<encoded event ID>` and the preview says **DEMO ONLY · NOT VALID FOR ENTRY**. It encodes no name/email/student identifier. Six light/dark/mobile/tablet/desktop workflow captures were raster-decoded with audit-only `jsqr` to confirm the actual QR content. API mode renders only the validated publisher payload; ticket data is component memory, not persisted app state. The controlled API fixture's payload is itself explicitly a mock/non-entry token.

The calendar button creates a real downloadable `.ics` Blob and revokes its object URL. `lib/events/calendar.ts` emits RFC5545-style CRLF, UTC rich start/end instants, stable source-qualified local UIDs, escaped text and **75-octet UTF-8 folding without splitting codepoints**. Date-only exports have `VALUE=DATE` and an exclusive next-day end, including year/leap-day rollover. Demo summaries/disclaimers are explicit and tentative; cancellation maps to `CANCELLED`; unknown legacy confirmation remains tentative. Calendar export is not live sync, RSVP proof or a complete timetable/calendar-domain redesign.

## Media and shipped-size decisions

Three local generated scenes are centrally registered with meaningful alt, provenance, focal points, 1200 × 675 dimensions and tiny raster blurs in `src/config/event-image-blurs.ts`:

| Asset | Fictional subject | Bytes |
| --- | --- | ---: |
| `event-showcase.webp` | Students sharing a robotics project outdoors | 109,308 |
| `event-music.webp` | Courtyard acoustic music/open mic | 84,634 |
| `event-social.webp` | Friends sharing a board game | 126,056 |
| **Total** | Reused alongside existing registered scenes | **319,998** |

Sharp WebP quality 70 / effort 5; every source is below 150,000 bytes. `CampusImage` uses responsive Next images, reserved ratios, blur, lazy cards/gallery and meaningful failure frames; the lead story uses priority/quality 60. Card requests use the shared default quality 75. Originals, screenshots and generated build output stay ignored. Across all completed phases there are 16 generated WebP sources totaling **1,472,858 bytes**, separate from the licensed CC0 sample poster/video. No copyrighted hotlinking or invented official artwork.

## Replacement contracts and architecture

- `src/types/events.ts` and optional `EventItem.details` preserve the original seven required fields. Runtime schemas bound strings/arrays/fees/capacity, approved local/HTTPS media (no transient blobs), valid instants, duration ≤7 days, in-event agenda entries, booking deadline and matching Accra start date. Catalog IDs must be supported by the existing detail-route contract.
- `eventCatalogService`: public typed list/get/read over `campusService`, 30-record requested upstream pages, caller-aware **8-second** deadline. Server list/detail composition and request-cached metadata use the exact session-cookie allowlist; cookies are never serialized to client props. Upstream page errors remain errors; client load-more merges/deduplicates records and discloses the loaded-record search/sort limit.
- `eventActionService`: source-lazy activity/RSVP/save/ticket; API uses runtime-validated JSON, cookies, no-store and caller-aware **10-second** deadlines. Client UI imports public services, never fixtures. Demo actions recheck current source/ID/email/role/abort and verify actual memory/persistence outcomes.
- `useEventDirectory`, `useEventActivity`, `useEventMutations`, `useEventTicket` keep interaction state small and owner-qualified. Pure selection/time/media/calendar logic is in `lib/events`. Feature/data/service leaves stay around 150 lines. The Home clock contract is preserved as an alias of the shared `CampusClockProvider`; no Home redesign or performance claim is attached to this extraction.

| Proposed endpoint (browser `/api` prefix) | Request | Response |
| --- | --- | --- |
| `GET /events?page=…&pageSize=30` | Catalog query / optional backend session | Existing `{ items, total, page, pageSize }` envelope |
| `GET /events/{id}` | Encoded catalog ID | `EventItem` or 404 |
| `GET /events/activity` | Backend cookie session | `{ goingIds, savedIds, attendance?: [{ eventId, registered }] }` |
| `PUT /events/{id}/rsvp` | Backend session; desired-going state | `{ ok: true }` |
| `DELETE /events/{id}/rsvp` | Backend session; desired-not-going state | `{ ok: true }` |
| `PUT` / `DELETE /events/{id}/saved` | Backend session; desired saved state | `{ ok: true }` |
| `GET /events/{id}/ticket` | Backend session / owned RSVP | `{ eventId, reference, payload, status: "valid" | "revoked" }` |

No client ID, role or consent is sent as authority. API attendance is the publisher's authoritative count when present; otherwise the supplied catalog count is used. **The client never blindly adds one to API counts**. Demo counts add only the current local plan and are clamped to capacity. Ticket event IDs must match the requested event; payloads are ≤1024 characters / 1400 UTF-8 bytes for bounded QR rendering.

A real backend must derive identity, enforce ownership/permissions and CSRF, atomically enforce capacity/time/status, make PUT/DELETE idempotent, protect private ticket payloads, revoke cancelled tickets, return current activity/counts and authorize media/schedules. **No real backend, durable database, payment, ticket-validation gate or security deployment is certified here.**

## Verified evidence and reproduction

- Lint, strict typecheck and Next **16.4.0** production build pass (32 generated pages; Events routes dynamic). Final cached compile **4.1s**, TS **7.2s**.
- **122 native tests** pass: 15 foundation +12 shell +18 Home +23 auth +24 Clubs +**30 Events**. Coverage includes composition/paging/sorts/date windows, legacy and multi-day labels, counts/deadline boundaries, media budgets, consent, invalid DTOs/IDs, actual persistence/idempotence/abort/owner races and UTF-8/escape/calendar rollover.
- **244 Events WCAG A/AA +2.1 AA/layout/44px captures:** directory 30; all 16 details ×360/768/1280 ×light/dark 96; RSVP/save/cancel/ticket/ICS/gallery 36; clock/deadline 16; privacy 8; denied-storage/photo fallback 8; code outages 2; isolated mocked API **48** at 360/1280 in both themes. Zero recorded rule violations, visible/root overflow, small-target flags or normal page exceptions. No rule was disabled.
- The mock API verifies 30-of-35 disclosure/load-more/error retention, catalog/activity/RSVP retry, single-flight PUT, acknowledgment retention, source-only persistence, counts staying **121 rather than 122** after reload, publisher ticket/error/revocation/wrong-event, timed and legacy all-day ICS, multi-day dates, full/closed/cancelled/past actions, exact SSR cookie allowlisting and an accepted DELETE whose acknowledgment is held: Stop waiting makes no rollback/success promise, and reopening reflects the publisher cancellation. This is frontend/proxy proof, not a deployed backend.
- Both final-source production (196 captures) and isolated API (48 captures) suites were rerun after multi-day/ID hardening and cancellation wording changes.
- Shared foundation/theme/dialog/upload/publishing, shell/search/delivery/sidebar, Home/media/clock/errors/delivery, auth session/tour/executive/cross-tab, Clubs membership/executive and port-4000 proxy/health regressions pass. The maintained original workflow runner now uses explicit Event/Club acknowledgment and async confirmations; its **12 positive workflow assertions**, first-visit and sign-out assertions pass without weakening persistence checks. It still records the unimplemented community/lost-found persistence/photo and study-constraint gaps.
- Fresh full route regression: **222 cases /74 AA analyses**, all layout/tap/AA assertions clean. Production `/design` remains 404 and prior streamed invalid-detail not-found behavior is retained.
- Manual 360/1280 light/dark review covers all 16 header/story/footer panels plus directory and representative consent/ticket/API screens, including all four pending-cancellation captures; tablet captures/geometry run too. Full-page fixed-overlay screenshots compose viewport-bound overlays: content outside the active viewport is not an uncovered dialog.
- Runtime audit **0 vulnerabilities**; full toolchain **9 development advisories (5 high /4 moderate /0 critical)**. No forced downgrade.

Evidence (ignored; binary retention not guaranteed): `.cache/phase6/events/{browser-final,api-browser-final,routes,regressions,review}`, `build-final.log`, `native-all-final.log`, dependency audit JSON. Versioned runners:

```bash
npm run lint && npm run typecheck && npm run test:events && npm run build
# Production 3001; optionally select AUDIT_GROUPS=directory,details,workflow,clock,privacy,resilience,delivery
AUDIT_BASE_URL=http://127.0.0.1:3001 node scripts/phase6-events-audit.mjs
# With the isolated browser tooling installed (including jsqr@1.4.0):
node scripts/phase6-events-api-snapshot.mjs
# In a separate process; do not share the demo preview's .next/dev lock:
cd .cache/phase6/events/api-app
NEXT_PUBLIC_DATA_SOURCE=api NEXT_PUBLIC_API_BASE_URL=/api \
  API_PROXY_TARGET=http://127.0.0.1:4000 API_SESSION_COOKIE_NAMES=campus_session \
  npm run dev -- --hostname 0.0.0.0 --port 3002
# From repository root while 3002 runs; owns/shuts down its mock API on 4000:
node scripts/phase6-events-api-audit.mjs
```

The snapshot helper copies only eligible source, excludes `.env*`/`.git`/generated artifacts and links installed dependencies; snapshots are excluded from lint/TS/Git. Do not run a second port-4000 fixture concurrently. Stop verification servers after tests. See README and the API guide for complete setup.

## Still open / next

**Discover → Accommodation → Marketplace → Opportunities → Lost & Found → Academics → Timetable/Calendar → Profile → remaining**, then polish/final verification. Community/report persistence, required report photo and study constraints remain open; Event `.ics` does not close the entire calendar/GPA requirement. Safari/Firefox/physical-device/IME/full screen-reader traversal and real backend/security/uploads remain unverified.

The retained Home default-renderer Lighthouse median is **82 Performance /100 Accessibility**, disclosed software diagnostic **94 /100**. **Default/real-device Performance ≥90 remains open**; no new Events-phase Home benchmark is claimed, and the diagnostic is not an acceptance substitute.
