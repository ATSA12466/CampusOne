# CampusOne store release checklist

Status: **not submitted**. The apps build and run; nothing below has been
uploaded, signed with release credentials, or published, and no store listing
exists. Do not claim otherwise.

## 0. Owner decisions required (blocking)

- [ ] Production backend host + HTTPS (e.g. `https://api.campusone.example`).
      The Next app serves both web and the mobile API; mobile release builds
      only accept `https://` URLs.
- [ ] `DATABASE_URL` for production. Without it `/api/health` returns 503 and
      the mobile server gate + Test button honestly refuse the backend.
- [ ] Apple Developer + Google Play accounts, app names, bundle ownership.
- [ ] Privacy policy URL + terms URL (required by both stores).
- [ ] Support contact email/URL for listings.
- [ ] Crest/artwork files (none are in the repo; placeholders must not ship as
      the launcher icon — see below).

## 1. Backend before apps

- [ ] Deploy Next with `NEXT_PUBLIC_DATA_SOURCE=api`, `DATABASE_URL`, session
      secrets, and seeded production data (`npm run db:seed` is dev-oriented —
      review before running against prod).
- [ ] Verify `GET https://<host>/api/health` returns `{ "ok": true }`.
- [ ] Decide the file-store story: server persistence is file-backed JSON
      (`CAMPUSONE_DATA_DIR` / `.data/campusone.json`) unless Postgres/Drizzle
      is wired up. Single-instance file storage does not scale horizontally.
- [ ] Set `CAMPUSONE_API_URL=https://<host>` as the mobile build default
      (`--dart-define=CAMPUSONE_API_URL=...`); the in-app Server setting and
      first-run gate remain as overrides.

## 2. Mobile build config

- [ ] Bump `mobile/pubspec.yaml` version (+ build number) and mirror it in
      `push_service.dart` `appVersion` (currently `0.1.0`).
- [ ] Android: create the release keystore, `android/key.properties` (never
      commit), verify `applicationId com.campusone.app`, `flutter build appbundle`.
- [ ] iOS: signing team, `flutter build ipa`, verify `campusone://` scheme and
      camera/photo-library usage strings in `Info.plist`.
- [ ] Replace `assets/icon-1024.png` + launcher icons with final artwork; keep
      supplied crest art intact (no recoloring).
- [ ] Run on a physical Android phone + iPhone over LTE (no dev machine, no
      LAN): cold start → gate (if no baked URL) → sign in → Events → Scan →
      Messages → offline airplane-mode relaunch → saved-session retry.

## 3. Push notifications (optional for v1, required for the hype)

- [ ] Add a Firebase project: `google-services.json` (Android) +
      `GoogleService-Info.plist` (iOS). Both are git-ignored; they stay on
      workstations/CI secrets.
- [ ] Configure the server sender that delivers to registered device tokens
      (`POST /api/devices` already stores them). Today nothing sends pushes:
      the app must not advertise them, and currently does not.
- [ ] APNs key (iOS) + FCM channel defaults (Android 13+ permission prompt is
      already declared).

## 4. Store listings (both)

- [ ] Title, short + full description truthful to the parity doc: student app
      for clubs/events/attendance; admin console is web-only; push only if §3
      ships.
- [ ] Screenshots per form factor (phone; tablet if claimed) + feature graphic
      (Play).
- [ ] Content rating questionnaire (user-generated content: marketplace,
      community, messages → moderation story must be real).
- [ ] Data-safety / privacy-nutrition answers must match reality: Bearer
      tokens in secure storage, photos uploaded by users, camera used only for
      QR check-in, approximate location never collected.
- [ ] Reviewer demo account + reachable staging backend, or a video if backend
      access is restricted.

## 5. Pre-submission verification (this repo)

- [ ] `npm run test` (native suites) green.
- [ ] `npm run test:release` green.
- [ ] `npm run typecheck` + `npm run lint` green.
- [ ] `npm run build` (Next production build) green.
- [ ] `node --test scripts/mobile/mobile-structure.test.mjs` green (20 tests:
      refresh, HTTPS gate, session retry, deep links, scan errors, health
      honesty, theme, …).
- [ ] `flutter analyze` + `flutter test` green on a workstation with Flutter
      ≥3.24 (Dart ≥3.5) — cannot run in this sandbox; required before any
      release branch cut.

## 6. Explicit non-goals for v1

- Publishing/signing/uploading anything without owner authorization.
- LAN/`10.0.2.2`/dev-server-dependent store builds (blocked by code: release
      `setBaseUrl` rejects non-`https`).
- Universal links (`https://<host>/events/...`): path parsing is ready in
      `DeepLinkHandler`; needs `assetlinks.json` + `apple-app-site-association`
      on the production host (owner domain required).
- Wear/watch; offline-first data entry. (Tablets: shell uses a side rail +
  capped content on ≥600dp; pushed detail screens still stretch — verify on a
  real tablet before claiming tablet support in listings.)
