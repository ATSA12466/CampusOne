# FEATURE_INVENTORY

> Phase 5: the photo-led auth forms and five-step introduction now create/use actual submitted local profile details, restore progress/drafts and safe return paths, prepare optional visit-only avatars, and isolate demo sign-out across tabs. The magazine Home, shared foundation and grouped shell/search are retained. API auth is a typed proposed cookie boundary, not secure deployed authentication. Remaining domain modules below still inventory the preserved demo; Phase 6 upgrades their photos, feed depth, details and workflows.


## Implemented modules (functional frontend)
- Shell: five grouped sections / 24 preserved destinations; persistent desktop collapse; four mobile tabs + More; route focus; refined pending-logo/portrait/header placement
- Global search: Cmd/Ctrl+K, keyboard results, scopes, clear/loading/empty/error/retry, cancellation and partial-source handling through the typed catalog
- Onboarding: five photo stories, optional skip/back/continue, progress/resume/replay, validated name/programme/level/interests, preserved drafts, safe destination and optional locally cropped visit-only photo
- Authentication: photo-led sign-in/register/recovery, Zod/RHF validation/error focus, password reveal/hide, remembered local profile choice, submitted registration identity, loading/cancel/error/resubmit, clearly demo-only role switch and lazy proposed cookie API adapter
- Home: conditional active sponsor/video-first feed, generated Clubs hero, six native snap photo destinations, official HTTPS LMS/SIP links, Accra now/next class, overdue/today tasks, completion/undo/progress, chronological event/deadline recommendations, honest partial/empty/retry states
- Deferred UI: player and native media bytes on Play, header appearance menu on first click, Radix toast stack on first message with a native failure fallback
- Discover: cross-domain search with category filter
- Academics: resource listing/filtering/bookmarking/detail view/download state
- AI Study Assistant: demo planning interface with explicit demo output labeling
- Tasks: add/edit/delete/complete/reopen/filter/search/stats
- Calendar and Timetable: schedule views with demo class/event composition
- Clubs: discovery, filtering, membership request workflow
- Participation: membership status + recognition view
- SRC Office: representatives, projects, validated request submission + status preview
- Announcements: searchable feed, pinned badges, detail pages, bookmarking
- Events: discovery, registration toggles, detail pages, demo QR ticket preview
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
