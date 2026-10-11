# FEATURE_INVENTORY

> Phase 6C: photo-first Discover joins the completed Clubs/Events frontend subphases. Eight categories, a balanced 24-record edit, all 45 canonical loaded listings, URL-backed filters/pages and owner-safe shared saves are implemented and verified. Sparse covers are labelled illustrations, existing destinations and Club/Event private workflows remain intact. Typed APIs use controlled fixtures, not a deployed secure backend. Accommodation is next; remaining domains and the Home performance gate are not complete.


## Implemented modules (functional frontend)
- Shell: five grouped sections / 24 preserved destinations; persistent desktop collapse; four mobile tabs + More; route focus; refined pending-logo/portrait/header placement
- Global search: Cmd/Ctrl+K, keyboard results, scopes, clear/loading/empty/error/retry, cancellation and partial-source handling through the typed catalog
- Onboarding: five photo stories, optional skip/back/continue, progress/resume/replay, validated name/programme/level/interests, preserved drafts, safe destination and optional locally cropped visit-only photo
- Authentication: photo-led sign-in/register/recovery, Zod/RHF validation/error focus, password reveal/hide, remembered local profile choice, submitted registration identity, loading/cancel/error/resubmit, clearly demo-only role switch and lazy proposed cookie API adapter
- Home: conditional active sponsor/video-first feed, generated Clubs hero, six native snap photo destinations, official HTTPS LMS/SIP links, Accra now/next class, overdue/today tasks, completion/undo/progress, chronological event/deadline recommendations, honest partial/empty/retry states
- Deferred UI: player and native media bytes on Play, header appearance menu on first click, Radix toast stack on first message with a native failure fallback
- Discover: eight-source photo hub; balanced edit 24/all 45/Saved; URL-backed search/category/mix/name/supplied-date sorts; six-per-page pagination; partial/retry/load-more; canonical eight-type saves and explicit sparse-cover/library/board truth
- Academics: resource listing/filtering/bookmarking/detail view/download state
- AI Study Assistant: demo planning interface with explicit demo output labeling
- Tasks: add/edit/delete/complete/reopen/filter/search/stats
- Calendar and Timetable: schedule views with demo class/event composition
- Clubs: 16 fictional photo communities; seven interests; search/sort/All/My/Saved; real 6-per-page pagination; rich facts/story/crew/gallery; request/withdraw/leave/reapply/save; persistent demo executive Approve/Reject; bounded lazy API replacement and honest errors/storage behavior
- Participation: membership status + recognition view
- SRC Office: representatives, projects, validated request submission + status preview
- Announcements: searchable feed, pinned badges, detail pages, bookmarking
- Events: 16 fictional photo listings/details; six interests; search/date/free/sort/All/My RSVPs/Saved; six-per-page pagination; source-aware RSVP/cancel/save; full/closed/cancelled/past/countdown states; lazy explicit non-entry demo QR; publisher-only API tickets and actual timed/all-day ICS export
- Community: post creation, reactions, report affordance
- Messages: conversation list + detail placeholder state
- Notifications: read/unread state and destination navigation
- Opportunities: search, details, bookmarking
- Marketplace: listing/detail + demo enquiry
- Lost and Found: report submission and listing feed
- Accommodation: listing/detail + demo enquiry
- Media: playable audio where source exists + bookmarks
- Profile: role/programme summary + participation/task indicators
- Settings: onboarding replay + async sign-out, local user/role/private-activity/photo clearing and explicit unconfirmed-server/storage warnings
- Advertising: campaign visibility/status
- Management: role-aware responsibility display

## Demo-only workflows (explicit in UI)
- Local demo sign-in/profile creation (not credential verification); secure authentication/session enforcement remains unconnected
- AI model-backed generation
- Real-time messaging transport
- Official SRC request processing lifecycle
- Payment/checkout operations
- Verified QR gate entry processing
- Official institutional timetable synchronization
- Production-grade moderation and audit trails

## Partial or simplified implementations
- Calendar grid interactions are simplified
- Threaded comments/replies are simplified
- Attendance recording is represented at status level, not full session editor

## Phase 4 boundaries

- The 18th typed collection, `featured`, and Home API paths are proposed, not a deployed backend.
- Home reads seven sources concurrently with 30-record bounds/deadlines; missing sources never silently become demo data.
- Planner/domain actions remain explicitly local demo state, even in API mode; Phase 5 adds a separate typed cookie auth adapter, whose backend remains unverified. Dates/campaign expiry use Africa/Accra; invalid dates are rejected/skipped safely.
- New pictures are fictional generated scenes; the five-second flower clip/poster/captions are a labelled local CC0 sample, not GCTU footage. LMS/SIP URLs come from official sources; current portal reachability was not verified.
- Performance ≥90 remains open; exact results and renderer diagnostics are in the test report. The executive approval panel and persistence remain preserved.

## Phase 5 boundaries and next work

- Demo passwords are made-up preview input, never persisted; role changes are not authorization. API identity/role is restored only from the proposed cookie session endpoint.
- Intro/profile preferences are local, illustrative and not yet recommendation inputs. Prepared photo files/blob URLs are omitted from persistence; no official profile write or server upload is claimed.
- Logout/source/owner changes clear six private collections; a same-student role switch retains executive approvals. Remember-disabled profiles remain visit-only. Cross-tab demo logout/external storage clearing, denied storage and corrupt auth JSON are checked.
- First visit now reaches the tour. Explicit logout no longer restores Ama or retains executive role/bookmarks on reload. Default missing storage still preserves the seeded Ama preview for compatibility.
- Native coverage: 68 tests. Auth browser evidence: 105 AA captures. Full-route regression: 222 cases / 74 route AA checks. Runtime audit 0; 9 development advisories remain. Current renderer-disclosed Home medians: default 82 / CPU raster 94, both Accessibility 100; portable ≥90 stays open.
- Phase 6: expanded photo-first Clubs/Events/details, 12–30-item feeds and ordered domain migrations. Community/lost-found persistence, required report photo, study constraints, calendar/ICS/GPA and richer profile/domain actions are not marked complete by this milestone.

## Phase 6A boundaries and next work

- Clubs is the first completed domain subphase, not all of Phase 6. Membership fees/counts/people/venues/photos are fictional; no real enrollment or payment. Legacy IDs/categories/m1/m2 and executive approvals persist.
- API catalog/activity/mutations use validated source-aware adapters; backend identity/club scope/CSRF/database/security remain unverified. Other legacy domains remain local in API mode until their migrations.
- 92 native tests, 203 Clubs AA/layout captures and fresh 222 route cases / 74 AA checks pass; shared foundation/shell/Home/auth-session/proxy regressions pass. Runtime audit 0; development advisories 9. No new direct runtime dependency.
- Five new registered generated photos total 526,288 bytes. Neither scene nor member number is actual GCTU evidence. Required attachment/real uploads remain later-phase/backend work.
- Retained Home Lighthouse default median 82 / software diagnostic 94, Accessibility 100; no new benchmark claimed here. Default/real-device ≥90 remains open.
- Historical Phase 6A handoff: Events followed Clubs. Events and Discover are now complete; the current next domain is Accommodation (see Phase 6C below). See [Phase 6A](PHASE6A_CLUBS.md).


## Phase 6B boundaries and next work

- Events is complete as a frontend subphase, not a real enrollment/payment/admission platform. `e1`/`e2` original fields/URLs, app registrations and executive approvals are retained. Fixtures are explicitly fictional and their October 2026 dates age truthfully.
- Optional rich DTOs validate time/date/agenda/media/capacity/price and supported IDs. Legacy data does not acquire invented times/fees; multi-day ranges show dates. API counts are publisher values, never blindly incremented. API credentials are never synthesized locally; revoked/wrong-event tickets have no QR.
- RSVP consent, single-flight/idempotent desired states, cancellation, owner/abort guards, correct focus, persistence/verified visit-only and cross-tab ticket logout are checked. ICS is an actual UTF-8-folded download, not live sync or completion of the later timetable/calendar/GPA domain.
- **122 native tests, 244 Events AA/layout captures, 222 current shared route cases / 74 AA checks** pass. Shared foundation/shell/Home/auth session/tour/Clubs executive and 12 positive workflow assertions pass; original community/report persistence/photo and study-constraint gaps remain recorded. Runtime audit 0; development advisories 9. No new runtime package; audit-only QR decoder is isolated.
- Three registered fictional 1200×675 photos total 319,998 bytes. Full media provenance and proposed API contracts are in [Phase 6B](PHASE6B_EVENTS.md).
- No new Home Lighthouse result is claimed: default median 82, CPU diagnostic 94, Accessibility 100. Default/real-device ≥90 remains open. Historical Phase 6B handoff: Discover followed Events; the current next domain is Accommodation → Marketplace → Opportunities → Lost & Found → Academics → Timetable/Calendar → Profile → remaining.

## Phase 6C boundaries and next work

- Discover is complete as a frontend hub, not an authoritative recommendation, property/product photograph or full media/reporting service. All 45 canonical records retain their existing IDs/destinations; no fake detail/player URLs were added. The edit is a deterministic balanced mix, not popularity or personalization. Search and Saved cover loaded records only.
- Eight bounded typed sources provide partial/error/initial-or-next-page retry without API-mode demo fallback. URL query uses replaceState; meaningful filter/page changes use pushState; deep links/reload/back/forward pass.
- Shared demo saves use existing Club/Event bookmarks plus the added accommodation/lost-found types. API saves stay publisher-owned and the fixture proves canonical Club/Event cross-feature removal, rollback/single-flight and no local API bookmarks. These are proposed backend contracts, not authorization/CSRF/database proof.
- **150 native tests, 176 Discover AA/layout/44px captures, 222 fresh shared route cases / 74 AA scans** pass. Foundation/shell/Home/auth, Club membership/executive, Event RSVP/ticket/ICS, proxy/health and 12 maintained positive workflow regressions pass. Runtime audit 0; development advisories 9; no runtime package/image file added.
- Actual 360/1280 light/dark hub and all eight category/Saved/guest/error panels were visually inspected; 768 has automated coverage. Full scope/contract/reproduction are in [Phase 6C](PHASE6C_DISCOVER.md).
- Home default median 82, CPU diagnostic 94 and Accessibility 100 are retained historical scores, not a new benchmark or a waived ≥90 gate. Next: **Accommodation → Marketplace → Opportunities → Lost & Found → Academics → Timetable/Calendar → Profile → remaining**. Community/report persistence, required report photo, study constraints, broader calendar/GPA and real backend/security remain open.
