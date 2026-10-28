# CampusOne Flutter app

The app now reads student content from the CampusOne admin server. The Super Admin and SRC dashboards publish the timetable, exams, announcements, resources, listings, polls, class representatives and requests shown by the mobile app.

## Run the app

Start the `campusone-admin` server first and keep its SQLite data directory persistent. On a local Android emulator:

```sh
flutter pub get
flutter run --dart-define=CAMPUSONE_API_URL=http://10.0.2.2:3000
```

For a physical phone, use a server address reachable from that phone. Release builds require a public `https://` URL. If no URL is supplied at build time, the app asks for the backend URL and checks `/api/health` before continuing.

## Admin-managed presentation

Super Admins can edit the app name, logo URL, accent colours, splash and onboarding copy, image URLs, and maintenance message under **App branding**. Images must be publicly reachable HTTPS URLs. Saving onboarding content changes its revision so the app presents the updated onboarding on the next launch. The Android/iOS launcher icon and operating-system launch screen are packaged with the app and require a new build to change.

The bundled stock/demo photos have been removed. The Flutter app has no offline demo login or sample student content; it requires a live admin backend and displays empty states until admins publish campus data.
