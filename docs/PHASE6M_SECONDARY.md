# Phase 6M — remaining campus screens

Frontend milestone, 11 October 2026. All scheduled Phase 6 domains now have photo-led experiences; **polish and final verification follow without another approval pause**. Real authorization, transport, moderation, billing, database and official SRC artwork are not supplied by this milestone.

## Scope

- **Announcements:** 12 bounded fictional updates, original `a1`/`a2` URLs preserved, category/search/pinned-first sorting, six-record pagination, canonical owner-safe saves and rich server-read detail stories. Explicit generated category covers, not actual announcement photographs.
- **SRC Office:** server-composed representatives/projects, independently visible source error/retry/load-more, associated/bounded Zod request form and source-owned private request status. Demo requests persist on this device and never claim to reach a university office; API submits only title/category/description, never local role/owner/status authority. The existing executive panel remains intact.
- **Media:** typed server catalog, search/format/pages, shared Discover saves, clear missing-file truth for existing `md1`/`md2`. Two actual deferred local MDN CC0 samples provide native video/captions/transcript and audio controls. Playback is user-initiated, not autoplay; opening a new sample removes the previous player. The 39,868-byte audio is a labelled sound-effect test, not a fabricated student podcast. Source/license notes are committed under `public/media/demo/`.
- **Participation:** source-owned Club/Event activity and current-profile gates, genuine membership states and RSVP plans. Removed fabricated “Attendance Verified” and contributor awards; an RSVP is not attendance proof.
- **Management:** useful existing-workspace links for each typed role, explicit demo/authorization boundary, guest gate. No false publishing/triage/attendance controls.
- **Advertising:** typed read/error/retry, photo-led supplied placements and dates, no invented impressions/payment/live-publishing success.
- **Settings:** photo-led appearance/privacy/profile links, system/light/dark, OS reduced-motion explanation, preserved tour replay and asynchronous source-safe sign-out with honest storage/server warnings.

## Services and safety

`campusActionService` is a lazy typed demo/API boundary for `GET /campus/activity` → `{savedAnnouncementIds,requests}`, desired `PUT`/`DELETE /announcements/{encodedId}/saved` → `{ok:true}`, and `POST /src-office/requests` → `{ok:true}`. API requests are credentialed/no-store/caller-aware, bounded at ten seconds and checked against live account/source/role before exposing the response. A stopped request cannot undo a backend write already accepted.

Demo actions preserve the canonical app-store bookmark/request arrays and executive state, validate real catalog IDs, use desired-state saves and verify memory when persistence throws. Only verified in-memory changes receive visit-only feedback. Private activity never substitutes local demo records in API mode. Normalized/bounded schema rejects unsafe IDs, duplicates and malformed status/date/input.

`useCampusFeed` separates six-record UI pages from 30-record source reads, retains loaded records on next-page failure, deduplicates and retries the failed page. Public source reads are bounded at eight seconds. All source/filter/save messages disclose loaded-record scope. Approved native playback paths are local `/media` or explicitly approved HTTPS hosts, never JavaScript/traversal/loopback/unapproved sources.

## Verification

- Lint, strict typecheck, optimized production build: passed. No runtime dependency added.
- **206 native tests**: maintained 198 plus 8 secondary contract/persistence/guard/playback tests. HTTP tests are controlled fetch fixtures, not deployment proof.
- **64 production AA/layout/44px captures**: eight directory/detail screens ×360/768/1280 ×light/dark, plus save/reload, request validation/persistence and actual deferred audio/video at 360/1280 in both themes. No AA/overflow/small-target flags or page exceptions.
- Actual full mobile/desktop light/dark captures for each screen visually reviewed. The browser counter was scoped to `main` rather than desktop sidebar headings; no accessibility rule was suppressed.
- Reproduction: `npm run test:secondary`; `node scripts/phase6-secondary-audit.mjs` with production 3001. Ignored evidence: `.cache/final/secondary`, `.cache/final/review`; cached binaries may not persist.

Home performance is **not declared solved**. A fresh default-renderer diagnostic measured Performance 67 / Accessibility 100 before polish; trace-led optimization and final repeat measurements follow. Historical renderer-disclosed scores remain history, not a substitute for the gate. Physical-device/Safari/Firefox/full screen-reader and deployed backend checks remain external limitations.
