# Phase 7 — bounded modules and source-safe polish

The frontend polish milestone is implemented. This is a demo/application-frontend completion, not certification of a live university platform.

## Changes

- Split listing directory state, Lost & Found controls, participation records and campus-action durability into small feature/service leaves. Listings now has a 147-line composition root; Participation has a 21-line root. Lost & Found remains approximately 150 lines. Existing URLs and the club executive review panel are unchanged.
- Home's private planner now uses the same lazy, typed `taskService` as Tasks rather than directly toggling the demo store. Source/account/email/role/hydration and abort checks qualify reads and writes. Guest/loading/error states do not present an empty task list as a successful read; errors have a retry. Demo completion, Undo, progress, focus and verified visit-only feedback remain.
- Home's Undo record is owner-qualified, so it cannot expose or restore a previous profile's task after an account/role/source change. The composition, task panel and completion hook are separate small modules.
- Task PUT verifies the entire desired record, not merely an existing ID. DELETE confirms absence. An unrelated failed mutation cannot become a false successful “saved for this visit” notice.
- Announcements and Media distinguish unavailable sources from genuine empty results; Saved announcements distinguish a private activity failure. Lost & Found waits for Saved activity before showing an empty collection. Unhydrated/guest club activity no longer projects private memberships/bookmarks.
- Canonical Discover bookmark projection has explicit input/output types. The application AST has zero `any` type nodes. A native regression checks actual directive prologues, including parenthesized/misplaced client-boundary mistakes, rather than relying on lint alone.
- Auth session regression uses the current resource save and guest-workspace labels. Remember-disabled activity is exercised through real SPA navigation: a new document correctly ends the visit-only session, so the test must not attempt an authenticated write after `page.goto`.

## Verification

- `npm run lint`, `npm run typecheck` and the optimized production build pass (29 generated pages).
- **210 native tests** pass: foundation 15, shell 12, Home 18, auth 23, Clubs 24, Events 30, Discover 28, life 21, Profile 5, Social 10, Study 12, secondary 8, polish 4.
- Current Home groups pass: six responsive/theme layouts and completion/Undo/persistence; deferred real media; development error/storage states; clock; held/failed code delivery and feedback. Auth forms/tour/photo/session/states/delivery pass, including preserved executive approvals, guest persistence, visit-only clearing and cross-tab logout.
- All current domain browser groups pass: Clubs, Events, expanded Discover, Accommodation/Marketplace/Opportunities/resources, twelve Lost & Found sheets, weighted GPA/note CRUD, calendar/timetable/ICS, required cropped listing/report photos, Profile, Social, Study and secondary screens. These are frontend/demo checks, not deployed backend evidence.
- The all-canonical route run captured **732 views** (122 routes/detail records × 360/768/1280 × light/dark): zero root/visible overflow or sub-44px target flags; all **244 mobile AA analyses** have zero violations. Final handoff reconciles these with the manual template review.
- Three isolated default **SwiftShader** production Lighthouse runs measured **91 / 92 / 91 Performance, 100 Accessibility**, median **91**, with no audit errors. The actual tour was completed before measuring returning Home; HTTP cache was cleared and local profile/tour preferences retained. This meets the requested local lab targets, not a physical-device performance guarantee. Historical lower/default and software-raster diagnostics are retained in the final report.

A parallel Home media screenshot hit the 30-second capture timeout. The unchanged build's remaining Home groups were rerun in isolation and passed; the interrupted attempt is not counted as a completed pass. Native/browser runners and a compact final summary are versioned; large screenshots/traces stay in ignored `.cache` directories.

## External release gates

Real backend authentication/authorization/CSRF, database/durability, email/MFA/reset verification, upload scanning/storage, real-time transport, AI, payment/enrollment/entry and official timetable synchronization remain unverified. Authorized SRC artwork is still required. Physical-device, Safari/Firefox, IME and full screen-reader checks remain external gates. The full dependency audit retains nine development-toolchain advisories (five high/four moderate); production dependency audit is zero. No forced framework downgrade or new runtime dependency was introduced.
