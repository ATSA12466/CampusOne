# CampusOne student-web → Flutter parity matrix

Source of truth: `src/app/(student)/` (web). Target: `mobile/` (Android + iOS).
Audited 2026-10-14 against the actual route files, feature components, API
routes, and Flutter screens — not names alone.

Legend: ✅ full · ◐ partial · ❌ missing · 🖥️ web-only by design · 📱 mobile-only

**Photo parity pass (2026-10-15).** Flutter now renders the same artwork as the
web in the same places: a shared media layer (`mobile/lib/src/core/media/`)
mirrors `src/components/media/*` (aspect frames, hero scrim, photo tiles, media
cards, placeholder chip, loading skeleton, reduced-motion handling), and the
bundled demo set mirrors `src/config/images.ts` file-for-file and alt-for-alt.
Home follows the web composition order (welcome → campus-radar carousel → clubs
hero → today's plan → photo shortcuts → official GCTU portals → recommendations).
Directories, detail pages, discovery, saved items, community and profile are
picture-led. Screens no longer build their own image widgets —
`scripts/mobile/mobile-media.test.mjs` enforces that, along with artwork
existence, provenance labels and the source policy (relative paths only, no
traversal, https + allow-list for absolute URLs, `data:` photos decoded
in-memory).

Every student screen now opens on a picture: 28 screens use the shared
`PhotoScaffold` band (web eyebrow, title and description, unchanged wording),
and the sign-in, register and reset screens carry the web's own photo stories
(`src/config/auth.ts` → `AuthStoryPanel`, same images, copy and generated-scene
caption). The welcome tour is picture-led too, with each slide's demo scene
labelled.

**Photo-opening pass (2026-10-15, second part).** Every student screen now opens
with the same picture band the web opens routes with: `PhotoScaffold` /
`PhotoPageHeader` in the media layer render a 232px photo band, eyebrow, display
title, description and, for generated artwork, the "Generated demo imagery"
line. 28 screens carry it — notifications, tasks, timetable, calendar, messages,
attendance, badges, study assistant, freshers, enquiries, executives, manage
hub, impact, GPA, study notes, SRC requests, clubs, events, discover, community,
accommodation, announcements, materials, SRC office, profile, more and the
shared catalog list (marketplace, opportunities, lost & found, media, courses,
campaigns). The wording is not invented: the media audit reads the eyebrows,
titles and descriptions out of the web `MagazineHeader` props and the
clubs/events/discover directory heroes and fails if a Dart screen differs.
Home also now renders the two official GCTU portals (`https://lms.gctu.edu.gh/`,
`https://sip.gctu.edu.gh/`) with the web's labels and descriptions, opening
externally.

Data-path note: web defaults to **demo fixtures** (`NEXT_PUBLIC_DATA_SOURCE=demo`);
web API mode targets a separate port-4000 platform API (unverified). Flutter
talks to this repo's same-origin Bearer-token API (`/api/*`, `docs/MOBILE_API.md`).
Local/demo state is **never** presented as cross-client sync.

## Route-by-route matrix

| # | Web route | Web interactions (verified) | Flutter screen(s) | Status | Gap / blocker |
|---|---|---|---|---|---|
| 1 | `/home` | Magazine home: welcome, photo shortcuts, today overview, next class, task panel, featured carousel, recommendations | `home/home_screen.dart` | ✅ | Same order as the web (welcome → featured carousel → clubs hero → today overview with the next class + open tasks → photo shortcuts → recommendations), plus mobile-first check-in and stats cards. Web-only: the dev `?home-preview=` fixture modes that fake empty/offline states. |
| 2 | `/discover` | Global search over 8 sources, category filter, saved view, per-item save | `discover/discover_screen.dart` | ✅ | Search + saved filter + detail navigation + save (via detail screens). |
| 3 | `/clubs` | Directory + search; membership review panel for execs | `clubs/clubs_screen.dart` | ✅ | Search + category chips ✓ (asserted in `scripts/mobile/mobile-structure.test.mjs`); exec review lives in club detail → Manage. |
| 4 | `/clubs/[id]` | Request membership (+note), withdraw, save, exec review panel | `clubs/club_detail_screen.dart`, `club_manage_screen.dart` | ✅ | Request/withdraw/save/Manage (roster + approve/reject) all wired. |
| 5 | `/events` | Directory + search, category chips, time filter (upcoming/week/month/past/all), sort, saved toggle | `events/events_screen.dart` | ✅ | Search, category chips, time window (Upcoming/This week/Past/All) and sort (Soon/Newest/Title) ✓; saving happens on the detail screens. |
| 6 | `/events/[id]` | RSVP / cancel, save, ticket view, add-to-calendar (ICS) | `events/event_detail_screen.dart` | ✅ | RSVP/cancel/save/ticket + device-calendar handoff (`add_2_calendar`, no permission needed). Needs on-device verification (no devices in sandbox). |
| 7 | `/calendar` | Month agenda: classes + public events + personal plans | `schedule/calendar_screen.dart` | ✅ | Same three sources merged. |
| 8 | `/timetable` | Class sessions, add/edit/remove (workspace) | `schedule/timetable_screen.dart` | ✅ | Full CRUD to `sessions` collection. |
| 9 | `/tasks` | Task CRUD, done toggle | `tasks/tasks_screen.dart` | ✅ | Full CRUD + toggle. |
| 10 | `/messages` | Inbox, thread, composer; **start-conversation is demo-local only** ("not a real contact") | `messages/conversations_screen.dart`, `thread_screen.dart` | ◐ | Inbox/thread/composer + polling ✓. No start-new UI: **blocked, no user-lookup API** (`POST /api/conversations` needs a `userId` the client cannot resolve). Web has no real equivalent either. |
| 11 | `/notifications` | Feed, per-item read, mark-all-read, unread filter | `notifications/notifications_screen.dart` | ✅ | Feed + tap-to-read + mark-all-read ✓. Unread is shown per row and in the badge count. |
| 12 | `/profile` | Profile card + editor: name, programme, level, bio, interests, visibility | `profile/profile_screen.dart`, `edit_profile_screen.dart` | ✅ | Editor saves account record + `profile` store row, mirroring web fields. |
| 13 | `/settings` | Appearance, onboarding replay, session/sign-out, data-backend card | More → Appearance + Server + Replay tour; Profile → sign-out | ✅ | Appearance, server URL, replay-welcome, sign-out all present. |
| 14 | `/marketplace`, `/marketplace/[id]` | Browse, photo-record posting, detail + save + enquiry | `listings/marketplace_screen.dart` + `listing_detail_screen.dart` | ✅ | Post (photo record), save, enquiry all wired. |
| 15 | `/lost-and-found` | Reports + filters + save + report-note | `listings/lostfound_screen.dart` + detail | ✅ | Browse, save, report-note via enquiry dialog. |
| 16 | `/media` | Browse + playback (CC0 samples) | `listings/media_screen.dart` + detail | ✅ | Browse, save, play-sample (external open). |
| 17 | `/opportunities`, `/opportunities/[id]` | Browse, detail + save, apply link | `listings/opportunities_screen.dart` + detail | ✅ | Save + record-application + provider-page link. |
| 18 | `/advertising` | Read-only placements (no publishing/billing) | `listings/campaigns_screen.dart` | ✅ | Browse + detail. |
| 19 | `/accommodation`, `/accommodation/[id]` | Browse, detail + save + enquiry (generic listings UI; no student posting flow) | `catalog/accommodation_screen.dart` + detail | ✅ | Same: browse, save, enquiry. |
| 20 | `/announcements`, `/announcements/[id]` | Browse + search + saved view + save | `catalog/announcements_screen.dart` + detail | ✅ | Search + saved-only view; saves use the dedicated `announcement` kind. |
| 21 | `/community` | Feed, composer, replies, reactions, report, remove own | `community/community_screen.dart` | ✅ | Composer, replies, reactions, report, remove all wired. |
| 22 | `/src-office` | SRC info + request form (title/category/description) + my requests | `catalog/src_office_screen.dart`, `src_forms/src_request_screen.dart` | ✅ | Browse, file request, list mine. |
| 23 | `/study-assistant` | **Study planner**: availability form → generated week plan → save to `studyPlans` (+ materials search) | `study/study_assistant_screen.dart` | ✅ | Planner form + preview + save/delete mirror web; client math verified identical to `src/lib/study/planner.ts`; misleading AI prompts replaced with honest topic search. |
| 24 | `/academics`, `/academics/resources/[id]` | GPA calculator, study notes CRUD, materials browse + detail | `academics/gpa_screen.dart`, `study_notes_screen.dart`, `catalog/materials_screen.dart` + detail | ✅ | GPA (+account-saved grades, exceeds web), notes CRUD, materials + detail. |
| 25 | `/management` | **Role-based link hub only** (links to tasks/participation/clubs/events/…). No budget console. | `executives/*`, `manage_hub_screen.dart`, `admin/admin_reports_screen.dart` | ✅ | Meets/exceeds: role-gated exec tools, manage hub, membership review, reports. (Earlier "budget" note was wrong — web has none.) |
| 26 | `/participation` | Membership decisions + RSVP plans (explicitly not official attendance) | `attendance/*`, `badges/*`, `impact/my_impact_screen.dart` | ✅ | Memberships (manage hub), RSVPs (ticket = plan), history, badges, impact. |
| 27 | `/freshers` | Checklist (4 steps, local), club-group browser, 3 next-step cards (community/events/accommodation) | `freshers/freshers_screen.dart` | ✅ | Checklist persisted in prefs (web keeps it in state); interest filter + clubs + next steps mirror web. |
| 28 | `/onboarding` (public) | First-run tour | `onboarding/welcome_screen.dart` | ✅ | Shown once; replay coming via settings row. |
| 29 | `/sign-in`, `/register`, `/forgot-password` | Auth forms (+ demo role picker, web-only) | `auth/*` | ✅ | Real API auth + saved-session retry, and the web's photo stories (`src/config/auth.ts`) now open each form — same images, eyebrow, title, description and generated-scene caption. |
| 30 | `/src/*` student slices | Request workspace links → src-office | via src-office screens | ✅ | Covered by #22. |

## Deliberately web-only

| Surface | Reason |
|---|---|
| `/admin/*` (users, roles, content, moderation, audit, branding, settings, accommodation) + `/src/*` dashboards | Desktop moderation consoles; bulk tables, rich editors, audit exports. Mobile keeps role-gated `Reports & admin` summary. |
| Demo role picker on web auth | Web demo artifact; mobile uses real accounts only. |
| Demo-local conversation starter | Explicitly fake on web ("not a real contact"); mobile omits rather than fakes. Real start needs a user-lookup API (blocker). |

## Native-only capabilities (no web equivalent)

- QR check-in via camera (`Scan` tab) + gallery-image fallback.
- `campusone://` deep links for clubs/events (+ listing domains next).
- First-run server gate + saved-session retry (release builds require `https://`).
- Push plumbing: guarded no-op until a Firebase project is added. No UI claims push exists.

## Verified this audit (no action needed)

- No `setState` callback returns a `Future` anywhere (`setState(() async` / arrow-async / await-in-block all absent; Events uses the fixed pattern).
- Clubs reachable for signed-in users (More → Clubs); all tab/More destinations resolve.
- Camera denial view + gallery fallback present; health probes require `{ok:true}`.
- Role gating: exec/admin screens gated by `isExecutive`/`isAdminRole` + server RBAC; students get no elevated actions.
- No token/credential logging; Bearer token in secure storage only.
- Duplicate-submission guards (`_busy`) on all mutation screens sampled.

## Known issues fixed / to fix (from brief)

- [x] setState-Future patterns: audited clean (see above).
- [x] **API timeout**: `ApiClient` now applies a 20s `.timeout()` to all five verbs.
- [x] Freshers screen (row 27).
- [x] Profile editor (row 12).
- [x] Study planner + honesty copy (row 23).
- [x] Directory filters: events category/time/sort, clubs category, announcements search/saved (rows 3/5/20).
- [x] Notifications mark-all-read (row 11).
- [x] Replay-welcome row (row 13).
- [x] Deep links for listing domains (announcements/marketplace/opportunities/accommodation/resources/media).
- [x] Event add-to-calendar via device calendar plugin (row 6; needs device verification).
- [x] Tablet shell: `NavigationRail` + capped content on ≥600dp; pushed detail screens still stretch (verify on a real tablet).
- [x] Save-kind normalization: announcements save under the `announcement` kind.
- [ ] Start-new-conversation UI: **blocked, no user-lookup API** (row 10). Web's starter is demo-local; nothing real to mirror.
- [x] Home composition: `TodayOverviewCard` shows the next class (any of the next 7 days, Accra time) and the open/done task count with a tasks link, matching the web's today panel; the remaining magazine extras are picture carousels sized for a wide screen (row 1).
