# CampusOne mobile — build & release guide

Status: the Flutter app is **complete and structurally verified**; no store
build has been produced yet because this environment has no Flutter, Android
SDK, Xcode, or macOS. Nothing here has been submitted to Google Play or the
App Store.

## 1. What is already done

- Full app in `mobile/` (84 Dart files): auth, home, clubs, events + RSVP
  tickets, QR check-in scan, attendance history, exec sessions + live rotating
  QR + corrections, badges, messages, notifications, announcements,
  accommodation, materials, SRC office, manage hub, admin reports, profile,
  server switch.
- Backend contract frozen in `docs/MOBILE_API.md`, including
  `GET /api/users/me/clubs` (manage hub).
- Android platform folder, iOS platform folder, launcher icons on both,
  camera permission declarations, guarded push wiring.
- Structural suite: `npm run test:mobile` (20 checks, no SDK needed).
  Requires Flutter ≥3.24 / Dart ≥3.5 for `flutter` commands (`app_links`).

## 2. Backend before release

1. Host the Next.js app over HTTPS (web + mobile share it).
2. Set production env: `CAMPUSONE_QR_SECRET` (long random, never changes
   without invalidating live QRs), session/DB secrets per repo docs.
3. Bake the backend URL into release builds:
   `--dart-define=CAMPUSONE_API_URL=https://<prod-host>`.

## 3. Android (Play) — any machine with Flutter + Android SDK

1. `cd mobile && flutter pub get`.
2. Replace the placeholder app ID `com.campusone.app` with the client's ID:
   `android/app/build.gradle` (`namespace`, `applicationId`) and the
   `MainActivity.kt` package path.
3. Create the upload keystore **on the release workstation** (never commit):
   `keytool -genkeypair -alias campusone -keyalg RSA -keysize 2048
   -validity 10000 -keystore ~/campusone-upload.jks`.
4. Create `android/key.properties` (gitignored):
   `storeFile`, `storePassword`, `keyAlias`, `keyPassword`.
5. `flutter build appbundle --release
   --dart-define=CAMPUSONE_API_URL=https://<prod-host>`.
6. Upload `build/app/outputs/bundle/release/app-release.aab` to the Play
   Console (closed testing first). Data-safety form: camera (QR scan),
   account details, approximate location only if the backend ever asks —
   today it does not collect location.

## 4. iOS (App Store) — requires a Mac with Xcode

1. On the Mac: install Flutter + CocoaPods, then
   `cd mobile && flutter pub get` (regenerates `ios/Flutter/Generated.xcconfig`;
   `flutter build ipa` runs `pod install` automatically).
2. In Xcode (`ios/Runner.xcworkspace`): set the development team, the real
   bundle ID (replace `com.campusone.app` everywhere), and the app version.
3. `flutter build ipa --release
   --dart-define=CAMPUSONE_API_URL=https://<prod-host>`.
4. Deliver with Transporter/Xcode to App Store Connect, then TestFlight.
   Privacy questionnaire mirrors Play: camera (QR check-in), account data.
   The camera usage string lives in `ios/Runner/Info.plist`.

## 5. Push notifications (optional, phase 2)

The app works today without Firebase (in-app feed). To enable push:

1. Create the Firebase project, add the Android + iOS apps.
2. Drop `google-services.json` into `android/app/` and
   `GoogleService-Info.plist` into `ios/Runner/` (both gitignored).
3. Rebuild; the app uploads device tokens to `POST /api/devices` on sign-in.
4. Server-side: a sender that reads stored device tokens is still needed —
   the backend currently stores tokens but does not send to FCM.

## 6. Human / account checklist

- [ ] Google Play developer account ($25) + app listing (name, icon, feature
      graphic, screenshots, privacy policy URL, data-safety form).
- [ ] Apple Developer Program membership ($99/yr) + App Store listing
      (screenshots, privacy policy URL, age rating, review notes with a demo
      account — use the seeded roles above on staging).
- [ ] Real reverse-domain app ID owned by the client on both stores.
- [ ] Production backend host + HTTPS + `CAMPUSONE_QR_SECRET`.
- [ ] Keystore (Android) and signing certificates (iOS) backed up outside git.
- [ ] Firebase project (only if push is wanted for v1).
- [ ] Store review waiting time: typically days (Apple) to days/weeks (Play
      for new accounts).

## 7. Exact next steps (in order)

1. Provision production hosting; deploy web; set secrets.
2. On a dev machine: `flutter run` against staging, smoke-test the priority
   workflows (RSVP → ticket → scan → badge; exec session → live QR;
   membership approve/reject).
3. `flutter analyze` + fix any lints from the newer SDK.
4. Replace `com.campusone.app`, set version/build numbers.
5. Android: keystore → `flutter build appbundle` → Play closed testing.
6. Mac: team/signing → `flutter build ipa` → TestFlight.
7. Beta period → store listings → production rollout.
8. Phase 2: FCM sender, offline queue, biometric app lock (see MOBILE_PLAN).
