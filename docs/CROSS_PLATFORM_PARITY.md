# CampusOne cross-platform parity

Source of truth is the student web app (`src/app/(student)`). The Flutter app
(`mobile/`) mirrors student workflows; the desktop-oriented platform-admin
console intentionally stays web-only.

Legend: ✅ full · ◐ partial · ❌ missing · 🖥️ web-only by design

## Student surfaces

| Web route | Mobile screen(s) | Status | Notes |
|---|---|---|---|
| `/home` | `home/home_screen.dart` | ✅ | Feed-driven home, guest + signed-in |
| `/discover` | `discover/discover_screen.dart` | ✅ | Global search + saved filter |
| `/clubs`, `/clubs/[id]` | `clubs/clubs_screen.dart`, `club_detail_screen.dart`, `club_manage_screen.dart` | ✅ | Deep link: `campusone://clubs/<id>` |
| `/events`, `/events/[id]` | `events/events_screen.dart`, `event_detail_screen.dart` | ✅ | Deep link: `campusone://events/<id>` |
| `/calendar` | `schedule/calendar_screen.dart` | ✅ | |
| `/timetable` | `schedule/timetable_screen.dart` | ✅ | |
| `/tasks` | `tasks/tasks_screen.dart` | ✅ | |
| `/messages` | `messages/conversations_screen.dart`, `thread_screen.dart` | ✅ | Polling thread, no sockets on either client |
| `/notifications` | `notifications/notifications_screen.dart` | ✅ | Server feed; push is a future enhancement (see below) |
| `/profile` | `profile/profile_screen.dart` | ✅ | Guest card, attendance/badges shortcuts, sign out |
| `/settings` | More → Appearance + Server | ◐ | Theme parity done; web also has onboarding-replay + session info cards |
| `/marketplace` | `listings/marketplace_screen.dart` + `listing_detail_screen.dart` | ✅ | Photo upload via `AppPhotos` |
| `/lost-and-found` | `listings/lostfound_screen.dart` | ✅ | |
| `/media` | `listings/media_screen.dart` | ✅ | |
| `/opportunities` | `listings/opportunities_screen.dart` | ✅ | |
| `/advertising` | `listings/campaigns_screen.dart` | ✅ | |
| `/accommodation` | `catalog/accommodation_screen.dart` | ✅ | Browse; posting is web-only |
| `/announcements` | `catalog/announcements_screen.dart` | ✅ | |
| `/community` | `community/community_screen.dart` | ✅ | |
| `/src-office` | `catalog/src_office_screen.dart`, `src_forms/src_request_screen.dart` | ✅ | Browse + request filing |
| `/study-assistant` | `study/study_assistant_screen.dart` | ✅ | Same backend endpoint |
| `/academics` (+ resources) | `academics/gpa_screen.dart`, `study_notes_screen.dart`, `catalog/materials_screen.dart` | ✅ | GPA, notes, materials |
| `/management` | `executives/executives_screen.dart`, `manage_hub_screen.dart`, `admin/admin_reports_screen.dart` | ◐ | Role-gated like web; club/event ops covered, budget detail lighter |
| `/participation` | `attendance/*` (scan, history, live QR, exec sessions), `badges/*`, `impact/my_impact_screen.dart` | ✅ | Native camera scan + gallery fallback |
| `/freshers` | — | ❌ | Web-only for now; closest mobile overlap is Discover/Community |
| `/onboarding` (public) | `onboarding/welcome_screen.dart` | ✅ | First-run slides, shown once |
| `/sign-in`, `/register`, `/forgot-password` | `auth/*` | ✅ | + saved-session retry after offline launch |

## Deliberately web-only

| Surface | Reason |
|---|---|
| `/admin/*` (users, roles, content, moderation, audit, branding, settings, accommodation) | Desktop moderation console; needs bulk tables, rich editors, audit exports. Mobile keeps the `Reports & admin` summary for admins. |
| Accommodation posting | Landlord flow with heavy forms; mobile is browse-only. |

## Native-only capabilities (no web equivalent)

- QR check-in via camera (`Scan` tab) + gallery-image fallback.
- `campusone://events/<id>` and `campusone://clubs/<id>` deep links (Android intent-filter + iOS URL scheme declared; `DeepLinkHandler` routes to detail screens).
- First-run server gate + saved-session retry (release builds require `https://`).
- Push-notification plumbing: guarded no-op until a Firebase project is added (see release checklist). No UI claims push exists.

## Known parity gaps (ordered)

1. Freshers guide has no mobile screen.
2. Web settings extras (onboarding replay, session details) have no mobile equivalent.
3. Management/budget depth is lighter on mobile.
4. No tablet-specific layouts yet (phones + responsive web cover the matrix; large-screen Flutter layouts are future work).
