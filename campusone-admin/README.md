# CampusOne Admin

One web app with two consoles that control the CampusOne mobile app.

- **Super Admin**: integrations (e-mail, SMS, push, AI, storage, payments, sign-in), hostels, marketplace, promotions, jobs, people and roles, module switches, maintenance mode, audit log, and mobile app branding/onboarding content.
- **SRC**: timetables, exams, materials, announcements, enquiries, polls, class reps, club and event approvals.

It has its own database (SQLite) and a public `/api/v1` that the Flutter app calls. See `docs/MOBILE_API.md`.

## Run it

Needs **Node 22.18 or newer**. There are no dependencies to install.

```bash
cp .env.example .env      # set APP_SECRET and ADMIN_EMAIL
node --env-file=.env --disable-warning=ExperimentalWarning src/server/main.ts
# or: npm start
```

On the first run the super admin is created and its password is **printed once** in the terminal. Sign in at http://localhost:3000 and you will be asked to choose your own password.

The server starts with empty student content; publish real content from the SRC and Super Admin dashboards.

Docker: `docker build -t campusone-admin .` then run with a volume on `/data` and `APP_SECRET` set.

## Safety defaults

- `ALLOW_LIVE_SENDING=false`: announcements and invites are dry runs. Nothing is sent by e-mail, SMS or push until you set it to `true`. Test each integration first.
- Integration secrets are encrypted with `APP_SECRET` and never sent back to the browser. Changing `APP_SECRET` makes saved secrets unreadable, so keep it safe.
- In production `APP_SECRET` is required, set `COOKIE_SECURE=true` behind HTTPS, and set `TRUST_PROXY=true` behind a proxy.
- Role and suspension are checked on every request, so changes apply at once.
- Student accounts cannot use the web app.

## Develop

```bash
npm test         # 39 API and core tests
npm run typecheck  # needs: npm install (typescript, @types/node)
```

Structure: `src/server` (API, database, integrations), `public` (the web app, plain ES modules), `test`.

To add an integration, add an entry to `src/server/integrations/catalog.ts`; the form and validation come from it. Sending code lives in `providers.ts`.

## Known limits

- Provider request formats (Hubtel, mNotify, Arkesel, Twilio, Africa's Talking, Resend, SendGrid, Mailgun, SMTP, FCM, AI providers) follow each provider's documentation but have **not** been tested against live accounts. Use "Save & test" for each one before turning on live sending.
- File uploads are stored on the server under `DATA_DIR/uploads` (up to 25 MB per file). Configure persistent disk storage for deployed servers; the cloud storage provider integration is not wired into uploads yet.
- One server process with SQLite. Fine for a campus; move to Postgres if you outgrow it.
