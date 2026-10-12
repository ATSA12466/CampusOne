# CampusOne mobile app (Flutter)

One codebase for Android and iOS. It talks to the same Next.js backend and
production database as the web app (`docs/MOBILE_API.md` is the contract);
there is no separate mobile database.

## Run it

Prerequisites: Flutter 3.24+ (`flutter doctor` clean), Android Studio or Xcode.

```sh
cd mobile
flutter pub get

# Android emulator (10.0.2.2 reaches the host's localhost:3000):
flutter run

# iOS simulator / physical device / LAN backend:
flutter run --dart-define=CAMPUSONE_API_URL=http://<lan-ip>:3000
```

The backend URL can also be changed at runtime: More → Server. Switching
servers signs the user out. Release builds should bake the production URL in
with `--dart-define=CAMPUSONE_API_URL=https://…` (see `docs/MOBILE_RELEASE.md`).

Useful accounts on a seeded dev backend (`npm run db:seed` in the repo root):

| Role | Email | Password |
| --- | --- | --- |
| Student | ama.student@gctu.edu.gh | CampusOne-Student-01 |
| Club president | kwame.executive@gctu.edu.gh | CampusOne-Exec-01 |
| SRC admin | efua.src@gctu.edu.gh | CampusOne-SRC-01 |
| Super admin | yaw.admin@campusone.app | CampusOne-Super-01 |

## Map

- `lib/main.dart` — bootstrap (backend URL → session restore → push init).
- `lib/src/core` — API client, endpoint registry (`api_paths.dart`), session,
  theme, shared states, push wiring.
- `lib/src/features` — one folder per area (`*_repository.dart` + screens):
  auth, home, clubs, events, attendance (scan/history/exec sessions/live QR),
  badges, messages, notifications, catalog (announcements/accommodation/
  materials/SRC office), executives (manage hub), admin (reports/users),
  profile, settings (server), more.
- `lib/src/app/app_shell.dart` — bottom-tab shell.

## Notes

- Push notifications degrade gracefully: without Firebase config files the
  app uses the server notification feed and never crashes (`push_service.dart`).
- Camera permission is declared on both platforms for QR check-in only.
- App ID on both platforms is currently `com.campusone.app` — replace with
  the client's real reverse-domain ID before any store submission.
- If the platform folders ever get out of sync with a newer Flutter, they
  can be regenerated with `flutter create --platforms=android,ios .` — but
  that wipes the custom manifest/plist/icons, so prefer upgrading in place.
