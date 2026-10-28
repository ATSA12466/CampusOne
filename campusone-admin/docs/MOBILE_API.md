# CampusOne mobile API (`/api/v1`)

This is how the Flutter app is controlled by the admin web app. Everything the Super Admin or SRC changes is read from here.

- Base URL: your deployed admin app, e.g. `https://admin.campusone.example`.
- Format: JSON in, JSON out. Send `Content-Type: application/json`.
- Auth: `Authorization: Bearer <token>` from login or register. Mobile tokens last 30 days and stop working when the password changes or the account is suspended.
- Errors: HTTP status plus `{ "error": "human readable message", "code": "machine_code" }`. Show `error` to the student.
- Codes worth handling: `maintenance` (503), `rate_limited` (429), `registration_closed` (403), `module_off` (403), `ai_cap` (429), `conflict` (409).

## Start-up check (call before anything else, no auth)

`GET /api/v1/config`

```json
{
  "maintenance": false,
  "branding": {
    "revision": "1",
    "appName": "CampusOne",
    "logoImageUrl": "",
    "primaryColor": "#25206A",
    "accentColor": "#F4B52A",
    "tagline": "Your campus. All in one place.",
    "splashTitle": "Your campus, connected.",
    "splashSubtitle": "Campus life in one place.",
    "splashImageUrl": "",
    "onboardingTitle": "Get more from campus life.",
    "onboardingText": "Find campus updates, learning resources and student services.",
    "onboardingImageUrl": "",
    "onboardingButtonText": "Get started"
  },
  "registrationOpen": true,
  "minAppVersion": "1.2.0",
  "flags": { "hostels": true, "market": true, "jobs": true, "attendance": true, "community": true, "ai": false },
  "ai": { "available": false, "studyAssistant": false, "quiz": false, "timetableScan": false, "examScan": false },
  "serverTime": "2026-10-22T09:00:00.000Z"
}
```

What the app should do:

1. `maintenance: true` → show a "back soon" screen. All other student endpoints answer 503 `maintenance` (config and login still work).
2. `minAppVersion` higher than the installed version → ask the student to update.
3. Hide a module's tab when its flag is `false`.
4. Show AI features only when the matching `ai.*` value is `true`. The AI key never reaches the phone; the app calls `/api/v1/ai/chat`.
5. Hide the sign-up button when `registrationOpen` is `false`.

## Accounts

| Method | Path | Body | Notes |
| --- | --- | --- | --- |
| POST | `/auth/login` | `email`, `password` | Returns `{ user, token }`. Admins can sign in here too, but should use the web app. |
| POST | `/auth/register` | `name`, `email`, `password` (8+), optional `phone`, `level`, `programme` | Returns `{ user, token }`. |
| GET | `/me` | | Current user. |
| PATCH | `/me` | `name`, `phone`, `level`, `programme` | |
| POST | `/auth/student-verification/start` | | Sends a 6-digit code to the signed-in student's `@live.gctu.edu.gh` account. Code expires in 10 minutes; maximum 3 sends per hour. |
| POST | `/auth/student-verification/verify` | `code` | Confirms the code. Five incorrect attempts require a new code. `/me` then returns `verifiedStudent: true`. |
| POST | `/devices` | `token` (FCM), `platform` | Register after login so push works. |

Timetable, exams, class representatives, course materials, attendance, the study assistant, and academic personal records (grades, notes, tasks, plans, flashcards and quiz review) require `verifiedStudent: true`. The server enforces this for direct API calls as well as the Flutter UI. Admin and SRC staff accounts bypass student verification. The email provider must be configured in Admin Integrations for code delivery.

## Content the admins control (all need a token)

| Method | Path | What it returns or does |
| --- | --- | --- |
| GET | `/announcements` | SRC announcements for this student's level, pinned first. |
| GET | `/timetable` | Lecture slots set by the SRC. |
| GET | `/exams` | Exam slots set by the SRC. |
| GET | `/class-reps` | SRC-maintained class representative directory. |
| GET / POST | `/materials` | Approved shared materials. POST sends one for SRC review (`course`, `title`, `type` = Slides, Notes, Past questions or Other, `url`). |
| GET | `/listings?kind=hostel\|market\|opportunity\|promo` | Approved listings only. Featured first. |
| POST | `/listings` | Student marketplace submission (`title`, details, price). Lands as pending for the Super Admin. Hostels, jobs and promotions are added by the Super Admin only. |
| POST | `/listings/:id/report` | Flags a listing for review. |
| GET | `/polls` | Polls with `votes`, `total` and `myVote`. |
| POST | `/polls/:id/vote` | `{ "option": 0 }`. One vote per student. |
| GET / POST | `/enquiries` | The student's own enquiries and the SRC's replies. POST `{ subject, body }`. |
| POST | `/approvals` | Club or event request for SRC review. |
| POST | `/ai/chat` | `{ "message": "..." }` → `{ reply }`. 403 `module_off` when AI is off, 429 on limits. |

## Connected Flutter features

The current Flutter entry point is `lib/src/app/connected_app.dart`. In addition to the routes above, its **More** screen now opens Clubs, Events, Attendance, Messages, Grades, Study notes and Tasks. These screens use the endpoints below.

The admin web app owns content management: Super Admin endpoints live under `/api/admin/*`, and SRC endpoints live under `/api/src/*`. Those web-console routes are separate from student mobile routes. Some remaining legacy modules such as the community feed, saved items, marketplace records and notifications are still not reachable from the current entry point; they are not yet connected to this backend.

`test/api.test.ts` includes a route-coverage check for mobile endpoints and exercises personal storage, messaging, clubs, events and attendance. Run `npm test` from the admin project to verify it.

### Clubs and events

| Method | Path | What it returns or does |
| --- | --- | --- |
| GET | `/api/clubs`, `/api/clubs/:id` | Published clubs, with optional `search` and `category`. |
| GET | `/api/users/me/clubs` | The signed-in student's memberships. |
| POST / DELETE | `/api/clubs/:id/membership` | Request membership or leave a club. |
| PATCH | `/api/clubs/memberships/:id` | SRC review of a membership request (`active` or `rejected`). |
| GET / PUT | `/api/clubs/:id/saved` | Read or change the student's saved state. |
| GET | `/api/events`, `/api/events/:id` | Published events. |
| POST / DELETE | `/api/events/:id/rsvp` | RSVP or cancel. |
| GET | `/api/events/:id/ticket` | Ticket for the student's confirmed RSVP. |
| GET / PUT | `/api/events/:id/saved` | Read or change the student's saved state. |

Super Admin manages club and event records in **Campus content** (`/api/admin/campus-content`). New records are published to the app; admins can unpublish, republish or remove them.

### Attendance

| Method | Path | What it returns or does |
| --- | --- | --- |
| GET / POST | `/api/attendance/sessions` | List event sessions or create one (SRC/Super Admin). |
| PATCH | `/api/attendance/sessions/:id` | Set session state to `scheduled`, `active` or `ended`. |
| GET | `/api/attendance/sessions/:id/code` | Active QR check-in code for staff. |
| GET | `/api/attendance/sessions/:id` | Session details and (for staff) attendee list. |
| POST | `/api/attendance/check-in` | Student check-in with `{ "code": "..." }`. |
| GET | `/api/attendance/records` | The signed-in student's attendance history. |
| PATCH | `/api/attendance/records/:id` | Staff correction with status and reason. |

Attendance routes honor the admin's attendance module switch.

### Course materials and course representatives

SRC admins and Super Admins can search verified active student accounts with `GET /api/src/users?q=...&limit=200`. The response contains only account ID, name, e-mail, phone, programme and level. Assign a rep with `POST /api/src/class-reps` and `{ userId, course, group, session }`; the server links the assignment to that verified student account and derives their name, programme, level and phone. The app reads assignments from `GET /api/v1/class-reps`.

The SRC Materials tab supports direct uploads and publication with `POST /api/src/materials/upload`. It accepts base64 file content and material metadata. General uploaded assets use `POST /api/files/upload`; supported files include common images, audio/video, PDF, Word, PowerPoint and text, up to 25 MB. Uploads are kept under the server's `DATA_DIR/uploads` directory, so deployments need persistent disk storage. A file is downloadable only after it is linked from approved course material or published branding/campus content. `GET /api/files/:id` serves published files. The app lists and opens course resources through `GET /api/resources` and `GET /api/resources/:id`.

### Student-owned data and messages

`/api/me/store` supports GET by `collection`, PUT `{ collection, item }` and DELETE by `collection` + `id`. Its supported collections include tasks, grades, notes, study plans, personal timetable entries and saved study records. Each record is private to the signed-in user.

`/api/conversations` lists the user's threads and creates a direct thread (`kind`, `userId`) or group (`kind`, `title`, `memberIds`). `/api/conversations/:id/messages` lists or sends messages (`body`); `/api/conversations/:id/read` marks a thread read. Every thread and message is scoped to its members.

### Community, notifications and saved items

| Method | Path | What it returns or does |
| --- | --- | --- |
| GET / POST | `/api/community/posts` | Browse shared published posts (optional `search`), browse your own with `mine=true`, or publish `{ body, topic, photo? }`. |
| DELETE | `/api/community/posts/:id` | Delete your own post. |
| GET | `/api/community/replies` | Replies on published posts. |
| POST | `/api/community/posts/:id/replies` | Add a reply with `{ body }`; notifies the post author. |
| GET | `/api/community/reactions` | List this student's reacted post IDs. |
| PUT | `/api/community/posts/:id/reaction` | Set reaction state with `{ reacted: true/false }`. |
| POST | `/api/reports` | Report a post with `{ targetType, targetId, reason, detail? }`. |
| GET / PATCH | `/api/notifications` | List the signed-in student's notifications and mark `{ ids: [id] }` or `{ ids: "all" }` as read. Announcements, messages and community replies create notifications. |
| GET / PUT | `/api/saves` | List saved items (optional `kind`) or set `{ kind, entityId, saved }`. |

Super Admin reviews reports at **Community reports**. They can dismiss a report or hide the reported post from the feed.

The Flutter app does not load a `.env` file at runtime. Supply its server address at build time with `--dart-define=CAMPUSONE_API_URL=https://your-admin-host`. The admin server reads its ignored `.env` file through the `start` and `dev` scripts.

The Super Admin can edit these runtime branding fields under **App branding**. Image fields accept publicly reachable HTTPS URLs. The Flutter onboarding is shown again to users after the dashboard increments the branding revision. The operating-system launcher icon and native launch screen remain part of the installed binary and need a new app build to change.

Field names in responses match the admin web app's views. Open the web app, create an item, then call the endpoint with `curl` to see the exact JSON.
