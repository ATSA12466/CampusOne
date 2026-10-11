# CampusOne test report

## Phase 6M — secondary campus screens

**206 native tests**, clean lint/typecheck/build and **64 production AA/layout/44px captures** pass. All eight secondary directory/detail layouts run at 360/768/1280 light/dark; source-safe announcement saves/SRC requests reload correctly and actual licensed audio/video playback is deferred until intent. Each mobile/desktop light/dark screen was visually reviewed. No runtime package added. Backend contracts use native mocks, not deployment proof. [Phase 6M](PHASE6M_SECONDARY.md) records scope and boundaries. All scheduled Phase 6 frontend domains are migrated; polish and final verification continue. A fresh default-renderer Home pre-polish diagnostic measured **67 Performance /100 Accessibility**, so the performance gate is explicitly still open.

## Phase 6L — Tasks and Study tools

**198 native tests**, lint/typecheck/build and **42 production AA/layout/44px captures** pass. Private task CRUD/completion/edit/reload/deletion, real full-day Accra overdue semantics, study availability/time/duration/breaks/focus/manual context, owner-qualified save/delete and actual timed ICS bytes are verified. All mobile/desktop light/dark layouts reviewed; squeezed mobile task cards were fixed and rechecked. Deterministic planning is explicitly **not AI**; free text is context, not inferred scheduling. Native API tests are controlled fixtures, not deployed backend/security evidence. See [Phase 6L](PHASE6L_STUDY_TOOLS.md). Secondary screens, polish and fresh final route/performance verification continue automatically.

## Phase 6K — Social

**186 native tests**, lint/typecheck/optimized build and **46 production AA/layout/44px captures** pass. Community/Messages/Notifications cover 360/768/1280 light/dark and private post/reply/nested reply/concern/thread/photo/read-all/reload workflows. Guest gates, real second-tab deletion, denied-storage visit-only and corrupt-data recovery pass. Each screen’s mobile/desktop light/dark captures was manually reviewed. API notification and accepted workspace-role guards use native controlled fetch fixtures, not deployment evidence. No new runtime dependency or static image. See [Phase 6K](PHASE6K_SOCIAL.md). Studies/secondary screens and final fresh regression/performance follow automatically.

## Phase 6J — Profile

176 native tests, lint/typecheck/build and 22 clean 360/768/1280 light/dark AA/layout/44px profile captures pass. Name/programme/bio/preferences and required owned-photo crop/persistence/removal are verified; authority fields remain unchanged and API mode does not use local demo counts/preferences. Actual captures reviewed and square portrait/focus defects corrected. No runtime dependency added. Details and limits: [Phase 6J](PHASE6J_PROFILE.md). Work continues automatically to remaining screens and final gates.

## Phase 6D — Accommodation

Twelve fictional homes, **159 native tests**, clean lint/TS/build and **104 housing AA/layout/44px browser captures** pass. All 12 details plus directory/search/paging/Saved-reload run at 360/768/1280 in light/dark; gallery and validated device-only enquiry run at 360/1280. Actual mobile/desktop screens were inspected; duplicate supplied Type presentation was corrected and cover variety improved. Workspace HTTP tests are native fetch mocks, not real backend proof. [Full scope and reproduction](PHASE6D_ACCOMMODATION.md). Moving directly to Marketplace.

## Phase 6C — photo-first Discover (11 October 2026)

**Discover frontend hub implemented and verified; Accommodation is next.** Eight categories retain 45 canonical records, a balanced edit of 24, loaded-record search/category/mix/name/date/Saved and URL-backed six-record pages. Sparse covers are labelled illustrations; library/board links remain honest. Shared demo/API save contracts preserve Club/Event private workflows and executive reviews. No new runtime package or application image file; API evidence uses controlled fixtures, not a deployed secure backend.

| Check | Observed result |
| --- | --- |
| Lint / strict typecheck / optimized build | Passed; Next 16.4.0, 32 generated pages, final cached compile 2.1s / TS 5.9s |
| Native tests | **15 foundation +12 shell +18 Home +23 auth +24 Clubs +30 Events +28 Discover =150 passed**, zero failed/skipped |
| Discover AA/layout/44px | **176 captures:** 84 directory; 12 eight-type/shared-save workflows; 8 each privacy, denied-storage/photo fallback, SSR/code recovery, clock/visibility; 48 mocked API; no AA violations/overflow/small-target flags |
| Production layout coverage | Directory and save workflows: **360/768/1280 × light/dark**; other states and mocked API: **360/1280 × light/dark** |
| Route regression | **222 fresh cases**, 37 routes ×3 widths ×2 themes; **74 AA scans**, all clear; no route overflow/small-target flags |
| Shared browser regressions | Foundation/controls/upload/themes/prod-design-404; shell/search; Home/media/states/clock/delivery; auth session/tour; Clubs membership/executive; Events RSVP/save/cancel/decoded demo QR/actual ICS; proxy/health; **12 maintained positive workflow assertions**, no page exceptions |
| Static/dependency checks | Diff whitespace clean; TypeScript AST finds **zero `any` nodes** in app source; runtime audit **0**, full audit **9 development advisories** (5 high / 4 moderate) |
| Human visual inspection | Actual full hub and all eight category/result plus Saved/guest/failure panels at 360/1280 light/dark inspected; no new layout defects |
| Home Lighthouse | Retained historical default median **82 /100**, CPU-raster diagnostic **94 /100**; **default/physical-device Performance ≥90 stays OPEN**, no new Discover score claimed |

The eight-source snapshot measured 45,511 serialized bytes. Tests prove canonical IDs/destinations, all 45 unique listings over eight pages, bounded DTO/page/ID/duplicate validation, loaded-record sort/search/Saved scope, URL reload/back/forward, minute/visibility status, eight-type local persistence/idempotence, owner/source/role/abort/storage truth and restrictive path-only sign-in returns.

The 48-state API fixture proves partial source error/retry, 30-of-35 disclosure and failed/retried next-page retention, activity-error mutation disabling/no false Saved-empty, rejected-save rollback/input retention, pending duplicate-click single-flight, publisher-owned saves/reload without local bookmarks, canonical Event/Club removal, accommodation PUT/DELETE, legacy no-invented-fee/illustration, genuine-empty versus all-error and exact SSR cookie allowlisting. **Real backend authorization/CSRF/database/durability/uploads/mail remain unverified.** Its API-only dev server and mock fixture were stopped after tests. Source/native checks also reject wrong get IDs, invalid totals, duplicate pages and inconsistent empty-more results.

Shared workflow observations still record community/report persistence as false, missing required report-photo input and ignored study constraints; these remain later-domain work, not waived assertions. Club approvals, Event tickets/cancellation, task/bookmark/notification/SRC persistence and logout isolation pass. The broken query-bearing guest return link was fixed without broadening the auth redirect validator; the native API harness's loader-order and browser test's explicit Saved-selection setup were corrected, then complete suites rerun.

Evidence: ignored `.cache/phase6/discover/{browser-final,api-browser,routes,regressions,review}`, `build.log`, `native-all.log`, runtime/full audit JSON. Binary retention is not guaranteed. Versioned reproduction: `test:discover`, `phase6-discover-audit.mjs`, `phase6-discover-api-snapshot.mjs`, `phase6-discover-api-audit.mjs` and [Phase 6C scope/API instructions](PHASE6C_DISCOVER.md). Next is **Accommodation → Marketplace → Opportunities → Lost & Found → Academics → Timetable/Calendar → Profile → remaining**; broader backend/device/performance gates remain open.

---


## Phase 6B — photo-first Events (11 October 2026; historical handoff)

**Events frontend subphase implemented and verified; Discover is next.** Sixteen fictional events have photo discovery/details, composed filters/sort/views/pagination, source-aware RSVP/save/cancel, truthful count/deadline/status gates, lazy explicit non-entry demo QR and actual timed/all-day ICS. Original `e1`/`e2` records/URLs and registrations compatibility remain. No new direct runtime dependency; API tests are mocked contracts, not secure deployment or real admission.

| Check | Result |
| --- | --- |
| Lint / strict typecheck / optimized build | Passed; Next 16.4.0, 32 generated pages, Events dynamic; final cached compile 4.1s / TS 7.2s |
| Native tests | **15 foundation +12 shell +18 Home +23 auth +24 Clubs +30 Events =122 passed**, zero failed |
| Events AA/layout/44px | **244 captures:** directory 30; all 16 details ×360/768/1280 ×light/dark 96; RSVP/save/cancel/ticket/ICS/gallery 36; clock/deadline 16; privacy 8; denied-storage/photo fallback 8; code failures 2; mocked API 48; zero rule violations/overflow/small-target flags |
| Actual exports | Six demo workflow QR raster decodes match `CAMPUSONE_DEMO_NOT_VALID_FOR_ENTRY|e1`; real timed/demo/API/all-day `.ics` downloads and object-URL revocation pass; revoked/wrong-event/API failures never synthesize a QR |
| Shared regressions | Foundation/theme/dialog/upload/publishing; shell/search/sidebar/delivery; Home/media/clock/errors/delivery; auth session/tour/executive/cross-tab; Clubs membership/executive; proxy/health pass |
| Maintained baseline workflows | **12 positive assertions**, first-visit `/onboarding` and cleared guest/role/bookmarks pass; new Event/Club acknowledgment and async decision waits retain strong store-persistence assertions |
| Full route regression | **222 cases /74 AA analyses**, zero layout/AA/44px flags; production `/design` 404; prior streamed not-found behavior preserved |
| Media / dependencies | Three fictional generated 1200×675 registered WebPs, **319,998 bytes**, all <150 KB; runtime audit **0**, full **9 development advisories (5 high /4 moderate /0 critical)** |

Thirty Events native tests cover exact original record preservation, photos/budgets, six-record pages/uniqueness/clamping, composed search/category/free/date/sort/My/Saved, deterministic non-mutating selectors, legacy/multi-day time truth, minute/deadline/status/capacity/API count behavior, bounded/invalid DTOs/IDs/consent, real local idempotence/persistence/storage/abort/owner races, HTTP/schema/authority omission and wrong-ticket errors, and RFC5545 CRLF/escaping/75-octet UTF-8 folding/date rollover. Already-correct memory is not assumed durably saved when storage is denied.

The 35-record API browser fixture verifies catalog error → server retry, 30-of-35 disclosure and failed/retried load-more with record retention; activity-error mutation disabling; failed acknowledgment retention and exactly one PUT despite duplicate submit; fixture-backed save/RSVP/reload/counts (**121, not double-added 122**) without local API event state; actual publisher payload/error/revoked/wrong-event; timed/all-day calendar download, multi-day agenda/end dates; full/closed/cancelled/past; exact SSR cookie allowlisting, and stopping an accepted DELETE with its acknowledgment held: no rollback promise or false cancellation-success toast, and the fresh listing reflects the backend result. **Real backend/secure authorization/CSRF/database/uploads/mail/payment/entry gate remain unverified.** Its verification dev server and mock fixture were stopped after tests.

All sixteen routes have 360/768/1280 light/dark capture/geometry checks. Manual 360/1280 light/dark review covers each header/story/footer panel plus representative directory/consent/ticket/API screens. Proper fact-list grouping replaced invalid nested markup; removed/disabled trigger focus falls back to the named action panel/result heading. No accessibility rule was disabled. Full-page fixed-overlay screenshots compose viewport-anchored overlays; content outside the active viewport is not an uncovered active dialog. The complete 196-capture production suite, 48-capture API suite and 222-route regression were rerun against the final source after multi-day/ID hardening and cancellation wording changes. Fixed single-day demo labels are unchanged.

Evidence: `.cache/phase6/events/{browser-final,api-browser-final,routes,regressions,review}`, `build-final.log`, `native-all-final.log`, runtime/full audit JSON (ignored; binary retention not guaranteed). Versioned reproduction: `test:events`, `phase6-events-audit.mjs`, `phase6-events-api-snapshot.mjs`, `phase6-events-api-audit.mjs`; see [Phase 6B](PHASE6B_EVENTS.md). Audit-only `jsqr@1.4.0` is not an application dependency.

**Remaining acceptance is explicit:** no new Home Lighthouse measurement in this subphase. Retained default scores 83/82/75 (median **82**), software diagnostic 95/94/94 (median **94**), Accessibility **100**. Default/real-device ≥90 is still open; diagnostics are not substituted. Community/report persistence, required report photo and study constraints remain false in the maintained workflow observations; timetable/calendar/GPA and later domains are not completed by Event ICS. Safari/Firefox/physical-device/IME/full screen-reader traversal and real backend/security are still open.

---


## Phase 6A — photo-first Clubs (11 October 2026)

**Clubs frontend subphase implemented and verified; Events is next.** Sixteen fictional communities now have photo discovery/details, composed filters/sort/views, real six-per-page pagination, local request/withdraw/leave/reapply/save and preserved executive reviews. API integration remains proposed and mocked, not secure/deployed real enrollment. No new direct runtime dependency.

| Check | Result |
| --- | --- |
| Lint / strict typecheck / production build | Passed; Next 16.4.0, 32 generated pages, Clubs server routes dynamic; final cached compile 6.4s / TS 6.4s |
| Native tests | **15 foundation + 12 shell + 18 Home + 23 auth + 24 Clubs = 92 passed**, zero failed |
| Clubs AA/layout/44px | **203 captures**: directory 30, all 16 details at 360/768/1280 both themes 96, membership/save/gallery 24, executive 12, privacy 8, storage/fallback 8, code outage 1, isolated mocked API 24; zero violations/overflow/small-target flags |
| Shared browser regressions | Foundation/showcase/dialog/theme/touch/upload/legacy publishing; shell/search/delivery/sidebar; Home/media/clock/feedback/delivery; auth session/executive/cross-tab; same-origin proxy/health passed |
| Full shared-route regression | **222 cases / 74 AA analyses**, zero AA/overflow/44px flags; production `/design` 404; existing streamed not-found behavior retained |
| Dependency audit | Runtime **0**; full **9 development advisories: 5 high / 4 moderate / 0 critical** |
| New media | Five fictional generated 1200×675 activity WebPs, **526,288 bytes** total, central meaningful alt/provenance/blurs; no official people/photo/logo claims |

Coverage exercises pagination uniqueness/clamping/filter resets, legacy categories, accent search/objectives/venues and sorts; request acknowledgment/400-character note/first-invalid focus; trap/Escape/return focus, gallery keys and clickable overlay saves; actual persisted local request/save/withdraw/leave/reapply/Approve/Reject; student/executive/guest and changed-profile isolation; stale old-owner action after an intentionally delayed catalogue read; denied storage only reporting visit-only when memory changed; failed image geometry and held action-code outage without a fabricated mutation.

The API browser runner uses an isolated current-source `api` dev snapshot and a controlled port-4000 fixture. Four 360/1280 light/dark runs prove error→server refresh→catalog recovery, honest 30-of-35 loaded-record disclosure/load-more, activity error disabling writes, preserved failed form, single-flight POST, fixture-backed reload/save/request/withdraw/review, legacy missing-field and closed-request states, and exact SSR cookie allowlisting. **Real backend/database/auth/role/CSRF/security/mail/upload integration remains unverified.** The verification fixture/server are shut down afterward. API mutation acknowledgments are validated; no client role/user ID/consent is treated as authority.

All detail and directory variants were captured with Playwright; manual 360/1280 light/dark review covers all sixteen header/gallery panels and representative workflow sheets. An initial invalid nested definition-list structure was fixed rather than suppressed. The save overlay gets explicit stacking. The old auth session test now targets the review panel and waits for the asynchronous decision before the same persisted-approval assertion. Source/data leaves are split around 150 lines; generated API audit copies are ignored by lint/typecheck.

Evidence: `.cache/phase6/clubs/{browser-final,browser-details,api-browser-final,routes,regressions,review}` (ignored and not guaranteed to persist). Versioned reproduction: `npm run test:clubs`, `scripts/phase6-clubs-audit.mjs`, `scripts/phase6-clubs-api-audit.mjs`; see [Phase 6A](PHASE6A_CLUBS.md) for the complete handoff.

**Performance gate remains open:** no new Home Lighthouse benchmark is claimed in this Clubs subphase. Retained Phase 5 results below are default 83/82/75 (median 82) and disclosed software diagnostic 95/94/94 (median 94), Accessibility 100 throughout. Diagnostic scores do not replace the default/real-device ≥90 requirement. Safari/Firefox/physical-device/IME/full screen-reader checks and remaining ordered domain migrations are still open.

---

## Phase 5 — photo-led auth and onboarding (11 October 2026)

**Frontend milestone implemented and verified.** Local registration now uses submitted identity, first visit reliably reaches the five-step introduction, profile drafts/progress return safely, optional crop/avatar preparation is visit-only, and sign-out isolates private demo data across tabs. This is not secure real authentication or a claim that later domain redesigns are complete. The default-renderer Home Performance ≥90 gate remains open.

### Source, build, security and native checks

| Check | Result |
| --- | --- |
| `npm run lint` / `npm run typecheck` | Passed; strict TS, no `any` or UI dataset imports introduced |
| `npm run build` | Passed; Next **16.4.0**, final cached compile 0.97s / TS 3.2s / 32 generated pages; auth/intro use validated per-request options |
| Native foundation / shell / Home / auth | **15 + 12 + 18 + 23 = 68 passed**, zero failed |
| Dependencies | Upgraded existing Next/eslint-config-next 16.4.0 and PostCSS 8.5.29; no new direct runtime library |
| `npm audit --omit=dev` | **0 vulnerabilities** |
| Full `npm audit` | **9: 0 critical, 5 high, 4 moderate**, in the development toolchain; not concealed or “fixed” by a forced framework downgrade |
| URLs / theme / SRC / assets | Preserved; semantic light/dark/system, licensed font pairing and centralized existing generated imagery; official artwork still pending |

The 23 auth native tests exercise normalized email/Unicode name/password/confirmation/preview acknowledgment boundaries; preferences, roles/profile/storage migrations and secret/blob/data-field omission; safe student-only return paths including malformed/double-encoded/external/auth-loop rejection; memory fallback; submitted demo registration ID/name; reset/cancellation/failure/retry; cloned role-preserving personalization; mocked API credentials/no-store/port-4000/role omission, validated sessions/401/invalid/offline/HTTP/reset/logout outcomes; actual store private clearing, executive preservation, remember/API persistence; and returning local sign-in versus new same-email registration identity.

Generated Next declarations were inspected: the 16.4 build adds the generated root-params type reference, not a committed `.next` artifact. Source/profile modules remain small; the interest picker was separated from profile setup. Secrets, `.env*`, dependencies, screenshots/build/caches stay out of Git.

### Production auth browser and visual verification

`scripts/phase5-audit.mjs` passes all **forms / tour / photo / session / states / delivery** groups against the latest production build (3001), with explicit development-only failures/slow fixtures on 3000. Final evidence is ignored under `.cache/phase5/latest/`; source runners and this report are versioned.

- **105 AA/layout/44px captures:** 36 form/validation/recovery, 36 intro/profile, 24 photo dialog/error/crop/prepared states, 6 feedback/storage states and 3 delivery/no-hydration states. Each capture has zero WCAG 2 A/AA + 2.1 AA violations, root/visible overflow or sub-44px target flags; normal browser cases have no page exceptions.
- **360/768/1280 × light/dark:** password reveal/hide, correct invalid-field focus, safe `/clubs` return, recovery explicitly saying no email, actual Esi Owusu registration identity, mismatch rejection, optional skip returning to `/profile`, no stored password/blob. Required-field test locators account for visible required stars; path-based URL predicates avoid falsely matching a `next=/clubs` query before navigation.
- **All five steps/six combinations:** origin return, Back/Continue/skip, heading focus, reload/resume, valid draft retention, actual name/programme/level/interests/portrait personalization, finish and Settings replay. Programme options remain illustrative and interests are not recommendation inputs.
- **Photo/six combinations:** named trap/Escape/return focus, invalid MIME rejection, real native crop/compression, selected local blob avatar through client navigation, omission from storage, disappearance on reload. This is not a server upload. Foundation separately checks pixel bounds, output encoding/metadata and object-URL cleanup.
- **Session/executive:** role switch preserves the seeded pending request and bookmark; approval survives reload. A second management tab loses elevated responsibilities on logout; user/role, six private arrays, preferences and photo clear. Guest survives reload, remember-disabled identity is not persisted, anonymous reload clears its activity, and external storage clearing signs out the other demo tab. API cookie revocation/cross-tab security remains unverified.
- **Feedback/storage:** each form's development fail-once path retains inputs and resubmission recovers. A 3500ms request disables duplicate submission and cancels without a session mutation. Denied storage still completes/skips the intro with a memory-only notice. Corrupt auth JSON clears the account with recovery guidance; an automatic guest cleanup initially erased that guidance and was corrected. Production ignores fixture queries and unsafe destinations.
- **Delivery:** photo-editor code absent before intent; Escape cancels held code and late delivery does not open a dialog. Persistent editor chunk failure has explicit reload guidance and real recovery. Sign-in's photo remains SSR-visible with hydration blocked.
- Manual **360/1280 light/dark** visual review covers the three auth forms, five intro screens and editor/crop states through four current overview sheets, plus individual story/editor inspection. Tablet geometry/AA checks run too. Full-page screenshots of fixed overlays can include content outside the shielded viewport; this is screenshot composition, not an uncovered active dialog.
- Initial width/axe checks missed a real photo-above-copy stacking defect. Absolute/full-frame media utilities and inherited story-content min-height fix it; native image/copy-bound assertions cover all six normal form layouts. No axe rule or target requirement was disabled to make it pass.

### Shared regression and original gaps

- **222 production route cases:** 37 preserved routes/guard/not-found paths × three widths × two themes, expected HTTP/title/rendering with no page exceptions. **74 route AA analyses**, zero violations/overflow/tap flags. All 37 screens were visually reviewed at 360/1280 light/dark through eight current-build overview sheets, with the separate auth/editor review and 768 checks. Seven invalid details still render shared not-found with streamed HTTP 200; root redirects to Home and production `/design` is strict 404.
- **Foundation:** six development showcase layouts/sections, focus/dialog/sheet/gallery/swipe/menu/toast/tabs, native uploader validation/retry/crop/metadata cleanup, reduced motion, light/dark/system/reload/cross-tab/private theme, Manrope GH₵ glyph and dark prepaint without hydration pass. Publishing's detail context now seeds completed intro; otherwise the correctly working first-visit guard measures onboarding, not the requested accommodation detail.
- **Shell/search:** all six main layouts and completed delivery/sidebar/search-state groups pass, retaining **31 captures**, Ctrl/Cmd keyboard navigation/scope/clear/empty, trap/return, deferred code/cancel, one-overlay switching, failed-code recovery and compact prepaint/reload/cross-tab/private storage. Next 16.4 retries failed chunks; the failure fixture now blocks consistently until explicit reload instead of aborting only one request and mistaking runtime recovery for a missing error.
- **Home:** all five Home/media/states/clock/delivery groups were rerun during this phase, retaining 38 AA captures; actual manual video playback/retry, active/no-active placements, tasks/undo, portal attributes, real clock boundaries, storage and lazy-code states remain functional.
- **Preserved workflows:** all 12 positive task/onboarding/menu/RSVP/club approval/bookmark/notification/SRC flags pass with no page exceptions. **First visit `/onboarding` and sign-out user=null / role=student / bookmarks=0 are now explicitly asserted**, closing those Phase 1 gaps. Default seeded memberships still leave no fresh join for Ama; the workflow fixture clears only that seed before creating an actual request.
- Port-4000 controlled proxy/cookie fixture passes; missing-DB `/api/health` stays honest **503 / `{ "ok": false }`**. This does not test a live backend.
- Domain gaps remain: community and lost/found submissions are visit-only; lost/found lacks required photo; study constraints are not honored; richer photo feeds/details/12–30-item catalogs and calendar/ICS/GPA/profile depth remain Phase 6. These are not hidden behind auth completion.

### Production Home Lighthouse — current, renderer and scenario disclosed

Lighthouse **13.5.0**, Chromium **153.0.8010.0**, 360×800 / DPR 1, standard simulated mobile RTT **150ms**, throughput **1638.4kbps**, CPU slowdown **4×**. Sequential fresh browsers, dev stopped, zero audit errors; no route/feature/asset or throttle was removed.

The now-correct first-visit guard changes the measurement setup: each browser completes the **actual tour UI**, waits for Home, clears HTTP cache, retains only the local profile/tour preferences, then measures returning Home with `disableStorageReset`. The runner asserts final `/home`; it never publishes an onboarding score as a Home score. This is a returning-visitor HTTP-cache-cleared scenario, not a claim of a never-before-run JS engine or a live authenticated backend.

| Run (UTC, 11 Oct) | Renderer | Performance | Accessibility | FCP | LCP | TBT | CLS |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 07:48:45 | Default SwiftShader | 83 | 100 | 0.9s | 3.3s | 411ms | 0 |
| 07:49:21 | Explicit CPU raster | 95 | 100 | 0.9s | 2.8s | 115ms | 0 |
| 07:49:35 | Default SwiftShader | 82 | 100 | 0.9s | 3.3s | 422ms | 0 |
| 07:49:50 | Explicit CPU raster | 94 | 100 | 0.9s | 2.8s | 166ms | 0 |
| 07:50:05 | Default SwiftShader | 75 | 100 | 1.0s | 3.3s | 705ms | 0 |
| 07:50:20 | Explicit CPU raster | 94 | 100 | 0.9s | 2.8s | 147ms | 0 |

**Medians:** default **82 Performance**, LCP **3.3s**, TBT **422ms**; CPU raster **94**, LCP **2.8s**, TBT **147ms**. Accessibility **100** and CLS **0** throughout. The diagnostic removes ANGLE/SwiftShader flags and adds `--disable-gpu`; app/throttling/scenario stay the same. Default/real-device Performance ≥90 is still open; the diagnostic result is not substituted for it.

Initial transfer in this returning-Home scenario is approximately **325,887B**, with **12 scripts / 191,345B**. Framework/build and tour-retention harness differ from Phase 4's fresh-storage measurements, so no isolated auth/refactor or byte-reduction causal claim is made. Historical scores remain below with their original setup.

### Reproduction and remaining verification

Run native lint/typecheck/build and `test:foundation`, `test:shell`, `test:home`, `test:auth`; install the isolated pinned browser tooling documented in README. Start development 3000 and production 3001. Run `phase5-audit.mjs`, existing `phase2/3/4` runners, `design-audit.mjs` and the controlled proxy fixture. For Lighthouse stop dev, set `AUDIT_BASE_URL=http://127.0.0.1:3001` and a unique ignored output directory; run default and `AUDIT_RENDERER=software` sequentially three times each. The updated runner handles the intro and asserts Home.

Native/API tests use mocked fetch; no real sessions, authorization, CSRF/reset-mail/backend uploads/DB or MFA/verification are certified. Safari/Firefox/physical-device, screen-reader/IME/native fullscreen checks remain open. Nine development advisories remain. The optional local avatar is not durable media storage. See [Phase 5 contracts/privacy/replacement](PHASE5_AUTH_ONBOARDING.md), [API guide](API_INTEGRATION_GUIDE.md) and [design system](DESIGN_SYSTEM.md).

## Phase 4 — magazine Home (11 October 2026)

**Home implementation and functional checks passed. Performance is environment-conditional, not an unqualified completed gate:** the final three explicit CPU-raster Lighthouse runs score 92/91/91 (median **91**), but default sandbox SwiftShader runs score 60/63/63 (median **63**). Accessibility is **100** in all six. Default-renderer/real-device performance ≥90 remains open. No auth/domain redesign or real backend is claimed.

### Final source / native checks

| Check | Result |
| --- | --- |
| `npm run lint` / `npm run typecheck` | Passed; strict TS, no `any` introduced |
| `npm run build` | Passed; Next 16.2.6, compile 20.3s / TS 14.1s / 32 static pages; `/home` intentionally per-request |
| Foundation / shell / Home native tests | **15 + 12 + 18 = 45 passed**, zero failed |
| Runtime dependency / route / SRC policy | No runtime package added, URLs unchanged, official artwork still pending |
| Source contracts | 18 validated demo collections; 7-source Home composition and exact cookie allowlist |

The 18 Home native tests cover campus/leap/calendar dates; safe malformed persisted task dates; now/next boundaries, overlap/week rollover, real weekday/time ordering and non-mutating sorts; overdue/today/done tasks; seven concurrent bounded reads, partial/all-source failure/recovery, caller cancellation and cooperative deadlines; exact session-cookie filtering; valid/invalid/expired/future/wrong-placement campaign suppression; described playable videos; sorted upcoming events/deadlines; rejected unsafe media/destinations/impossible API dates; explicit bounded development fixtures; and deep-cloned seed equivalence for executive memberships, notifications, tasks and SRC requests.

### Home browser / visual checks

`scripts/phase4-audit.mjs` passed all **home / media / states / clock / delivery** groups against the same final production build (3001), plus explicitly development-only fixtures (3000).

- **38 responsive/feedback captures**: 18 Home/carousel/task states, 7 player/error states, 8 feed/storage/SSR states and 5 intent-delivery/failure states. All checked WCAG 2 A/AA + 2.1 AA captures have **zero axe violations, horizontal root overflow and sub-44px target flags**.
- Home **360/768/1280 × light/dark**: active ads before Clubs; real carousel keyboard arrows/current/disabled boundaries; all six photo destinations; native snap scrolling without root overflow; official HTTPS portal target/rel/name attributes; task completion/progress/Undo and restored focus; reload persistence. Below-fold recommendation focus causes paint/scroll and is unobscured in all six cases despite progressive content-visibility.
- Media **all six**: no initial video/caption requests, no autoplay, real 960×540 ~5.059s metadata, actual `play()`/unpaused state, captions/transcript, keyboard trap, application-owned Escape, close unmount and return focus. Cmd/Ctrl+K cannot stack a shell search over the preview. Blocking the WebM produces a real failure; unblocking + **Retry video** restores playable metadata.
- A native video-control shadow UI can consume Escape without dispatching DOM key events. The test focuses the keyboard-reachable application Close control before Escape; it does **not** claim to override OS/native fullscreen controls. Safari/Firefox/physical-device playback remain unverified.
- Empty/inactive placements leave **no carousel or advertising container**. Partial/offline feeds retain independent actions; a fault-once feed refreshes through **Try again**; truncation is visible. Production ignores fixture queries. Denied task storage yields honest “for this visit” feedback. With hydration scripts blocked, lead images are already SSR-visible.
- Held player code delivery can be cancelled; late delivery cannot open a closed preview. Player, appearance-control and Radix toast chunks are absent from initial Home requests. The first appearance click opens its named menu, real Dark selection works and focus returns. Failed player code recovers through reload; failed toast code retains dismissible native feedback; failed theme code is visibly explained.
- The initial menu-label assertion exposed Radix's automatic trigger `aria-labelledby` taking precedence over `aria-label`; visible-label association now explicitly overrides it. Modal dropdown background hiding also produced `aria-hidden-focus`; the conventional menu is now nonmodal, without hiding a focusable page. Final open-menu AA checks pass. No audit rule was disabled.
- Manual current-build visual review covered all six Home layouts (including lower content/tablet), all six players, and representative feed/media/code-error/menu feedback. Full-page images of fixed overlays include unblurred below-viewport content by screenshot mechanics; that is not a claim that the modal viewport is unshielded.

### Preserved foundation, shell and executive workflows

- **222 production route cases**: 37 preserved screen/guard/not-found paths × 360/768/1280 × light/dark; HTTP/title rendering and zero browser exceptions. All final document widths equal the viewport, with no visible overflow or small target flags. **74** route AA analyses at 360 in both themes: zero violations. The 37 screens were visually reviewed at 360/1280 light/dark through eight current-build overview sheets, with individual Home/player/lower-content inspection and 768 metrics.
- `phase3-audit`: **31** shell/search/delivery captures, zero AA/overflow/target flags; all 24 destinations, compact/cross-tab/prepaint storage, Ctrl and Cmd shortcuts, arrow/Enter navigation, scope/clear/empty, trap/return/main-route focus, cancellation, guarded switching and source/code-error recovery passed.
- `phase2-audit`: six dev foundation layouts plus dialogs/sheets/gallery/native swipe, dropdown/toast/tabs/controls, reduced motion, upload errors/retry/crop/compression/EXIF/object URL cleanup, appearance persistence/system/cross-tab/private storage, GH₵ Manrope glyph and dark first paint without hydration all passed. Production `/design` remains strict HTTP 404.
- The preserved-workflow rerun explicitly asserts **12 positive flags**, including **club-executive request approval and persistence**, task CRUD/completion, onboarding, More focus, RSVP ticket/cancel, bookmarks, notification reads and SRC validation/submission. No browser exceptions.
- Known legacy gaps remain honestly recorded: first visit bypasses onboarding; default membership seeds leave no fresh join; community and lost/found submissions do not persist; lost/found still lacks required photo; study constraints are incomplete; demo sign-out retains role/bookmarks. These remain auth/domain phases, not silently marked fixed.
- Seven invalid details render “Page not found” but retain streamed HTTP **200**. Root still redirects to `/home`. The port-4000 **fixture**, not a live backend, passed same-origin proxy/cookie forwarding; local health remains **503 / `{ "ok": false }`** without a DB.

### Production Lighthouse — measured, renderer disclosed

Lighthouse **13.5.0**, Chromium **153.0.8010.0**, mobile **360×800**, device scale 1; standard simulated RTT **150ms**, throughput **1638.4kbps**, CPU slowdown **4×**. Sequential fresh browser runs against production, dev stopped, zero audit errors. No route/assets/features or CPU/network throttle were disabled to obtain scores.

| Final run (UTC, 11 Oct) | Renderer | Performance | Accessibility | FCP | LCP | TBT | CLS |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 05:04:50 | Default SwiftShader | 60 | 100 | 0.9s | 3.5s | 3340ms | 0 |
| 05:05:32 | Default SwiftShader | 63 | 100 | 1.0s | 3.6s | 1890ms | 0 |
| 05:06:00 | Default SwiftShader | 63 | 100 | 0.9s | 3.4s | 2130ms | 0 |
| 05:05:04 | Explicit CPU raster | 92 | 100 | 0.9s | 3.3s | 80ms | 0 |
| 05:05:46 | Explicit CPU raster | 91 | 100 | 0.9s | 3.2s | 140ms | 0 |
| 05:06:14 | Explicit CPU raster | 91 | 100 | 0.9s | 3.2s | 160ms | 0 |

**Medians:** default Performance **63**, LCP **3.5s**, TBT **2134ms**; explicit CPU raster Performance **91**, LCP **3.2s**, TBT **139ms**. Accessibility **100** and CLS **0** throughout. CPU-raster runs remove ANGLE/SwiftShader flags and add `--disable-gpu`; everything else is unchanged. An obsolete forced-compositor launch flag was removed earlier for both paths. The much lower default-renderer results remain visible; a diagnostic passing result does not establish a portable score or waive the open default-renderer gate.

Final initial transfer is approximately **381,510B / 29 nonzero transfers**; **14 scripts / 211,181B**. Phase 4 initial was **450,458B** with Performance 53; intermediate default scores 57/56 and CPU diagnostics 86/88/87 are retained in cache. Final transfer is ~15% lower than the initial build. The lean seed service has equivalence/isolation coverage, but **no measured initial-JS reduction** is established (the previous diagnostic was 211,151B). Do not attribute the scoring improvement to it alone, or infer a proven isolated content-visibility benefit from single historical runs.

New runtime dependencies: **none**. Source/scripts and these summaries are committed; screenshots/HTML/JSON/traces/tool dependencies stay ignored under `.cache/phase4/`. Tooling/evidence may not persist across environments; reproduce with the documented runners. Real API/auth/DB/uploads, official portal availability, screen-reader/IME/fullscreen/physical-device and Safari/Firefox checks remain open.


## Phase 3 — shell, navigation and global search (10 October 2026)

**Implemented and verified:** grouped/collapsible desktop navigation, four mobile tabs + More, refined header/brand slot, Cmd/Ctrl+K search, typed catalog search and focus/persistence/delivery behaviour. This milestone does not claim the later Home/auth/feature redesigns or live integrations are complete.

### Source and native checks

| Check | Result |
| --- | --- |
| `npm run lint` | Passed |
| `npm run typecheck` | Passed, strict TS |
| `npm run build` | Passed; Next 16.2.6 / 32 generated static pages; latest compile 14.5s, TypeScript 9.0s |
| `npm run test:foundation` | 15/15 passed; previous media/API/theme contracts preserved |
| `npm run test:shell` | 12/12 passed; no added runtime/test dependency |
| Existing routes / official artwork | URLs preserved; SRC logo still a labelled pending slot |

New native coverage proves all **24** static student routes occur once across **five** groups; four unique mobile destinations; bounded parent/detail active matching; sidebar prepaint defaults/compact/private storage; trimmed query/scope/limit validation; non-mutating accent-normalized ranking; empty/short suggestions without content calls; all seven source-to-detail mappings; six-per-source bounds; headers/signals; partial/all-source failures and recovery; URL-encoded IDs; pre/mid-flight aborts; labelled preview fixtures.

### Responsive/visual regression

- **222 route cases**: 37 screen/guard/not-found paths × 360/768/1280 × light/dark.
- **74 route axe cases** at 360 in both themes: **zero final WCAG 2 A/AA + 2.1 AA violations**.
- **Zero page-width overflow or final visible offscreen-content flags**; no browser exceptions. All 37 screens reviewed visually at 360 and 1280 in both themes using eight review sheets, with individual shell/search captures and tablet metrics.
- Initial element-bound probes counted the onboarding card's clipped decorative circle, even though document width remained correct. Its decorative icon/circle are now explicitly hidden from assistive technology; **six targeted onboarding recaptures** verified the corrected semantic/metric result. Initial evidence is retained, not silently deleted.
- Root redirect and the seven missing-detail patterns retain the documented Next streamed-not-found behaviour. Production `/design` is strict 404, and all destination URLs remain intact.

### Shell/search browser checks

`scripts/phase3-audit.mjs` passed against production 3001 and the dev-only showcase on 3000. It produces **31 visual/axe captures**: 24 responsive shell states, six controlled search loading/failure states and one panel-code delivery failure. All captures have zero axe violations, page-width overflow and small hit-target flags.

**Six responsive shell cases:** 360/768/1280 × light/dark. Every destination is reachable from the desktop rail or More. Parent activation on a club detail; compact/expanded layout; Cmd **and** Ctrl shortcuts; initial input focus; arrow/wrap selection; Enter-to-detail navigation; clear/scope/empty states; Tab focus trapping; Escape and shortcut toggle/return; main focus after actual route navigation all passed.

**Sidebar:** compact preference survives reload, synchronizes across tabs, clears to the default on a storage-clear event and remains usable with denied sidebar storage. With hydration chunks blocked, the stored compact layout is already **88px** wide and content offset before hydration.

**Delivery:** neither search UI, More UI nor development search-fixture chunks appear in initial Home script requests. Requested panels load on intent; closing while the code download is held cannot cause a late dialog opening. Menu-to-search switching leaves **one** dialog, focuses the combobox and returns to the header on close. A controlled failed code download recovers via **Reload page**, with explicit save-changes wording; a cached import rejection was not misrepresented as a successful in-page retry. Cancelling loading/failure feedback returns focus.

**Data failure/cancellation:** controlled `/design` error and partial-result fixtures recover on **Try again** in both themes. The slow fixture deliberately ignores abort so the UI's stale-reply guard is tested independently: a late Code response cannot replace newer Innovation results. Loading blocks Enter, and closing in-flight work does not reopen the dialog. These are fixtures, **not real API proof**.

### Preserved workflows and backend boundary

A production legacy interaction rerun passed onboarding persistence; More/menu focus/return; task CRUD/completion persistence; RSVP ticket persistence/cancel; **club-executive approval persistence**; bookmarks; notification reads; SRC validation/submission persistence. No browser exceptions. Known baseline gaps (community/report persistence, required lost/found photo, study constraints, sign-out isolation and initial onboarding guard) are unchanged and remain scheduled domain/auth work; see the Phase 2 notes below.

`/api/health` remains **503 / `{ "ok": false }`** without a database. New search composes the typed/swappable catalog and preserves partial failures/cancellation. Live API/database compatibility, secure authentication and authoritative campus data are still **unverified**.

### Latest production Home performance

Default mobile Lighthouse 13.5 / Chromium 153, 360 × 800, simulated network/CPU multiplier 4, sequential idle production runs, zero audit errors:

| Run (UTC, 10 Oct) | Performance | Accessibility | FCP | LCP | TBT | CLS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Initial Phase 3 — 22:37:22 | 67 | 100 | 0.8 s | 3.2 s | 1480 ms | 0 |
| Final build — 22:49:55 | 66 | 100 | 0.8 s | 3.2 s | 1840 ms | 0 |
| **Latest repeat — 22:50:07** | **68** | **100** | **0.8 s** | **3.2 s** | **1440 ms** | **0** |

Latest speed index **1.8s**. Initial Home transfer is **335,457 bytes / 22 requests**: scripts 247,241 / 16; fonts 62,056 / 2; CSS 11,053 / 1; document 12,143 / 1; images 2,964 / 2. This is **11,103 bytes more than the latest Phase 2 build**, reflecting the larger destination/header surface and demo portrait. Deferred overlays are proven, but neither a smaller overall delivery nor an improved Lighthouse score is claimed.

**Performance ≥90 remains OPEN**; Accessibility ≥95 is met by these measurements. Phase 4 must address initial Home composition/hydration and deliberate media delivery, then remeasure. Do not change throttling, omit low runs or substitute historical scores to claim acceptance.

### Reproduce and evidence

```bash
npm run lint && npm run typecheck
npm run test:foundation && npm run test:shell
npm run build
# Start dev on 0.0.0.0:3000 and this production build on 0.0.0.0:3001
node scripts/phase3-audit.mjs
AUDIT_BASE_URL=http://127.0.0.1:3001 \
  AUDIT_OUTPUT_DIR=.cache/phase3/routes node scripts/design-audit.mjs
AUDIT_BASE_URL=http://127.0.0.1:3001 \
  AUDIT_OUTPUT_DIR=.cache/phase3/legacy-regression node scripts/audit/interactions.mjs
AUDIT_BASE_URL=http://127.0.0.1:3001 \
  AUDIT_OUTPUT_DIR=.cache/phase3/performance node scripts/audit/lighthouse.mjs
```

Ignored evidence: `.cache/phase3/{routes,onboarding-final,review,final-shell,legacy-regression,performance*}`. Source runners/reports are versioned; cached screenshots/binaries may not persist in another workspace. Safari/Firefox, screen-reader/physical-device and live service/security verification remain open. No heavy package, animation library, binary dataset, `.env*`, cache or build output was added to Git.

---

## Phase 2 — foundation verification (10 October 2026)

**Implementation:** semantic design/media/UI/service foundation is implemented; existing URLs and demo workflows are preserved. **Performance acceptance remains open:** the latest Phase 2 measured Home score was 74, below the ≥90 target. Accessibility measured 100, above ≥95. These are not claims that later product phases are complete.

### Build and source checks

| Check | Result |
| --- | --- |
| `npm run lint` | Pass |
| `npm run typecheck` | Pass |
| `npm run build` | Pass; Next 16.2.6, 32 static pages, existing dynamic details/health plus narrowly matched proxy |
| `npm run test:foundation` | **15 / 15 pass**, Node 22.22.3 |
| Raw palettes / direct fixture imports in app/component/feature TSX | None found by source scan |
| Largest feature / foundation UI modules | 149 / 141 lines; split compositions/hooks retained |
| Environment artifacts | `.env*` ignored; staged-tree inspection performed before phase commit |

Final source build: 10.7 s compilation, 8.0 s TypeScript, 893 ms static generation. Build timings are local observations, not deployment guarantees.

### Unit coverage

Native Node tests exercise:

- crop centering/zoom/clamping, **625** focal/aspect/zoom combinations, invalid/non-finite geometry;
- MIME/empty/oversized/non-file validation, real local registry assets/alt/provenance and bundled licenses;
- all **17** preserved demo collections against runtime schemas;
- cloned search/category/sort/pagination/missing-detail/abort behaviour;
- browser-relative API URLs, SSR port 4000, literal/encoded traversal guards and browser loopback rejection;
- typed JSON/204/FormData requests, preserved headers/credentials, HTTP/offline/invalid-envelope/abort handling;
- proposed API list/detail contract using **mock fetch**, not a live backend;
- pre-paint preference/bootstrap including denied storage;
- semantic text pairs ≥4.5:1; control/focus pairs ≥3:1; environment ignore policy.

The native loader is for pure TypeScript, not React/TSX rendering. UI checks run against the actual Next browser build.

### Responsive route regression

- **37 screens × 3 widths × 2 themes = 222 screenshots**: 35 preserved app screens, production `/design` guard, and an unknown-route 404.
- Widths **360, 768, 1280**, light/dark; explicit expected HTTP status and browser-exception assertions.
- **Zero page-width overflow, zero browser exceptions** across the matrix.
- WCAG 2 A/AA + 2.1 AA axe at **360 px in both themes**: 74 route/theme cases. One initial dark-register `link-in-text-block` failure was fixed with an underline; targeted reruns replace that stale result. **Final combined violations: zero.**
- Auth links were expanded to 44 px targets, missing password feedback and error descriptions added, and the hidden/focused skip link's target corrected.
- Updated auth/housing/market/Home screens were recaptured in all six variants (**48** additional captures); final Home/header/prefetch changes were recaptured again (**6**).
- Visual review: all 37 screens at 360 and 1280 in both themes via eight review sheets; individual loaded-photo showcase, mobile controls, desktop overlays/data and tablet media inspected. No observed layout blocker remained. Fixed header/mobile-bar appearances in full-document/element captures were checked as capture positioning, not mistaken for an actual sticky-bar bug; showcase section crops hide the header only during capture.
- `/` still redirects to `/home`. Seven invalid details show the shared “Page not found” state; Next streaming still produces HTTP 200 for these late detail failures. This known response-status limitation is recorded, not hidden.

Artifacts: ignored `.cache/phase2/routes`, `updated-routes`, `final-home`, `review`. The combined review JSON records the latest targeted replacements. Cached binaries may not persist; rerun the committed harness for fresh evidence.

### Hydrated foundation browser checks

`node scripts/phase2-audit.mjs` completed successfully:

| Check | Observed result |
| --- | --- |
| `/design` at all 6 width/theme combinations | HTTP 200, confirmed hydration, photos loaded, fallback resolved, axe 0, no overflow/exceptions |
| Dialog | Focus trap, labelled content, axe 0, Escape and focus return |
| Sheet | Focus trap, Escape and focus return |
| Dropdown / toast | Save action, displayed/dismissed notification |
| Tabs / choices | Arrow navigation, checkbox/switch/radio state |
| Pagination / explicit load more | Last-page and appended item states |
| Gallery | Arrow browsing, lightbox trap/Escape/return to clicked photo |
| Mobile gallery | **Native touch swipe**, snapped to second photo |
| Reduced motion | Skeleton animation reduced to 0.00001 s |
| Theme | Reload persistence, cross-tab sync, system changes, denied-storage fallback |
| First paint | With hydration scripts blocked and OS light, stored dark produced dark canvas + native dark controls on first paint |
| Fonts | Chromium platform-font query confirmed custom **Manrope** for the cedi-bearing price (no Arial/system glyph fallback); extended face loaded |
| Metadata | Populated detail title/suffix, description, Open Graph title/description verified in DOM |
| Production showcase guard | **HTTP 404**; nested subpath also checked manually |

The production guard needed a pre-stream proxy check: a page `notFound()` beneath a loading boundary rendered the correct 404 UI but sent status 200. The narrow proxy rewrite fixes that explicitly; it does not alter other route URLs.

### Native uploader checks

The browser—not a Node stand-in—decoded, cropped and encoded the test photos.

- Rejected SVG MIME, >12 MiB input, corrupt JPEG, and a **42-megapixel** PNG.
- Keyboard zoom change observed; focus 70/50 and zoom 1.8 produced **427 × 427 JPEG, 47,220 bytes**.
- Pixel-level independent crop comparison: mean absolute channel error **2.98 / 255**, below the 6 / 255 tolerance for fractional crop/JPEG resampling; this is stronger than a dimensions-only claim.
- A source JPEG containing synthetic EXIF Artist metadata produced **no EXIF** after encoding.
- A 3200 × 1800 input produced **1600 × 1600, 368,719 bytes**, within the 1600 px / 512 KiB ceilings.
- Simulated callback failure preserved the draft; retry succeeded after disabling the fixture.
- Remove cleared both source and consumer preview. **4 object URLs created / 4 revoked**, none active after removal/navigation.

These are local preparation/cleanup checks. They do not verify a remote upload, antivirus/storage authorization, server metadata stripping or upload cancellation. HEIC/GIF/SVG are intentionally unsupported; real server validation remains mandatory.

### Existing workflow regression

The final production interaction audit observed:

**Passing/preserved:** onboarding persistence; More/menu focus, Escape and return; task create/complete persistence + edit/delete; RSVP ticket persistence + cancellation; existing club-executive approval + persistence; bookmarks; notification read persistence; SRC validation/submission persistence. No browser exceptions.

**Known legacy gaps, not claimed fixed by Phase 2:** first visit goes directly to Home; the default joined/pending membership fixture has no fresh Join action; community/report submissions appear but do not survive reload; lost/found has no required photo yet; study output uses the subject but not all constraints; sign-out clears user but retains role/bookmarks. Photo-led auth and these domain/persistence/transport changes remain in their agreed phases. The executive request panel was not removed.

### Proxy / health / backend status

`node scripts/phase2/proxy.mjs` passed against a short-lived fixture bound to **0.0.0.0:4000**:

- browser-style same-origin `/api/proxy-proof` forwarded to `/api/proxy-proof` on port 4000;
- fixture cookie headers survived forwarding;
- local `/api/health` was not shadowed and remained `{ "ok": false }` / **503** without a DB.

**Real API/database connectivity, production authentication and backend DTO compatibility remain unverified.** Endpoint mappings are explicitly proposed. Legacy synchronous screens remain demo-only even when the new async catalog is configured for API mode.

## Production Home Lighthouse / dependency budget

Lighthouse **13.5.0**, Chromium **153**, mobile **360 × 800**, device scale 1, default simulated mobile network / CPU multiplier **4**; sequential production runs, no audit errors. Scores are local measurements and vary with the host.

| Build/run | UTC time on 10 Oct | Performance | Accessibility | LCP | TBT | CLS |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Phase 1 historical result | 04:28:29 | 95 | 92 | 2.9 s | 60 ms | 0 |
| Phase 2 initial | 21:29:48 | 60 | 100 | 3.8 s | 2200 ms | 0 |
| Phase 2: off-route prefetch disabled | 21:33:39 | 69 | 100 | 3.1 s | 1280 ms | 0 |
| Phase 2 isolated trace diagnostic | 21:35:48 | 66 | 100 | 3.0 s | 2350 ms | 0 |
| **Phase 2 latest: opaque header** | **21:38:34** | **74** | **100** | **3.0 s** | **920 ms** | **0** |
| Archived Phase 1 replay, same current tooling/host | 21:43:15 | 79 | 92 | 2.6 s | 740 ms | 0 |

The archived replay used the exact Phase 1 commit in an ignored scratch directory with the same Next/React installation and runner. No branch was switched, and the temporary server/source copy was removed. It demonstrates that the historical 95 is not a current guarantee; it **does not excuse or satisfy** the missing ≥90 target.

Latest Phase 2 FCP **0.8 s**, speed index **1.5 s**. Home transfer:

| Type | Requests | Bytes |
| --- | ---: | ---: |
| Scripts | 15 | 241,121 |
| Fonts | 2 | 62,056 |
| CSS | 1 | 10,526 |
| Document | 1 | 9,622 |
| Image | 1 | 1,029 |
| **Total** | **20** | **324,354 (316.8 KiB)** |

Initial Phase 2 transfer was 475,335 bytes / 51 requests. Disabling automatic off-route prefetch removed **25 untouched-route fetches**, the unused ~85 KiB Zod chunk and other prefetched code: **150,981 fewer bytes (147.4 KiB)** and **31 fewer requests** overall. Async API/catalog adapters are lazy. The header also no longer requires a backdrop blur.

Added runtime libraries: 11 focused Radix primitive packages (+48 transitive packages) for dialog/sheet/menu/choice/tooltip/toast/avatar semantics; no animation or crop/compression library. Their justification is tested focus/keyboard/ARIA behaviour, not package count. Unused dev-showcase/widget/API code must remain outside initial Home delivery. The font pair's preloaded asset bytes are 61,456; the extended 15,120-byte face is demand-loaded. Generated WebPs total 166,234 bytes and do not load on the legacy Home's initial slide.

**Open performance work:** ≥90 is not met. The trace includes substantial unattributable wall-time tasks (one diagnostic task had 513.5 ms wall duration but only 0.145 ms thread time), plus normal framework/hydration work. This is a diagnostic observation, not proof of a host-only cause. Phase 3 should minimize closed-overlay/root client costs; Phase 4 must move initial Home composition/reads server-side, keep image sizes/preloads deliberate and remeasure representative low-end/mobile hardware. Do not trade correctness/accessibility or manipulate throttling to claim success.

Artifacts: ignored `.cache/phase2/performance*`, `baseline-replay`, `results/foundation-browser.json`, `final-regression/interactions.json`. Production report JSON/HTML and optional traces are reproducible with `scripts/audit/lighthouse.mjs` (`AUDIT_SAVE_TRACE=1`). Raw reports are not committed.

## Reproduction and limitations

See README/design-system commands for the isolated browser-tool installation and dev/production servers. Route runner supports `AUDIT_ROUTES` for comma-separated targeted reruns plus width/theme filters. Production `/design` is an expected 404; set `AUDIT_DESIGN_DEV=1` only when intentionally checking the dev matrix.

Automated checks do not certify screen-reader usability, all browsers, real students/data, live uploads, security/RBAC, service authority or low-end physical-device performance. Additional Safari/Firefox/device and assistive-technology work follows with the product flows. Magazine Home, photo auth/onboarding, expanded feeds and feature/detail redesigns remain scheduled; PWA/offline behaviour is not yet implemented.

## Phase 1 reference

The preserved Phase 1 baseline is commit `4b3d913` and [DESIGN_AUDIT.md](DESIGN_AUDIT.md). Its findings and historical scores remain audit history, not current assertions. Phase 2 does not rewrite those results or claim deeper feature work has already happened.
