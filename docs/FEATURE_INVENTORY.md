# FEATURE_INVENTORY

> Phase 4: the shared theme/media/UI/service foundation and grouped shell/global search are in place. The magazine Home now consumes typed server reads, actual deferred video, photo shortcuts and local task completion/undo. The other feature descriptions below inventory the preserved demo, not a claim that photo-led feature redesigns or backend integrations are complete. See `TEST_REPORT.md` for observed workflow limitations; Auth/onboarding and remaining feature work follow the agreed phase sequence.


## Implemented modules (functional frontend)
- Shell: five grouped sections / 24 preserved destinations; persistent desktop collapse; four mobile tabs + More; route focus; refined pending-logo/portrait/header placement
- Global search: Cmd/Ctrl+K, keyboard results, scopes, clear/loading/empty/error/retry, cancellation and partial-source handling through the typed catalog
- Onboarding: step flow, skip/back/continue, progress, persistence, replay from settings
- Authentication UI: sign-in/register/forgot-password with validation and role demo switch
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
- Settings: onboarding replay + demo sign-out
- Advertising: campaign visibility/status
- Management: role-aware responsibility display

## Demo-only workflows (explicit in UI)
- Secure authentication/session enforcement
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
- Planner actions and auth remain explicitly local demo state, even in API mode. Dates/campaign expiry use Africa/Accra; invalid dates are rejected/skipped safely.
- New pictures are fictional generated scenes; the five-second flower clip/poster/captions are a labelled local CC0 sample, not GCTU footage. LMS/SIP URLs come from official sources; current portal reachability was not verified.
- Performance ≥90 remains open; exact results and renderer diagnostics are in the test report. The executive approval panel and persistence remain preserved.
