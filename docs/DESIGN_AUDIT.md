# CampusOne — Phase 1 Design & Engineering Audit

> **Historical baseline audit.** Its initial gaps/phase boundaries are preserved as evidence, not current unfinished-work claims. The ordered frontend upgrade through polish/final verification is now complete; consult [FINAL_HANDOFF.md](FINAL_HANDOFF.md), [FEATURE_INVENTORY.md](FEATURE_INVENTORY.md) and the current test-report header. External backend/device/artwork gates remain explicit.

- **Audited:** 10 October 2026 (UTC)
- **Baseline:** `56de21e270e6c3db679f26013c65bff75a720332`
- **Working branch:** `arena/aa6b22f8-campusone`
- **Scope:** Phase 1 only: source inspection, reproducible browser baseline, workflow checks, upgrade priorities, and minimal fixes needed to run verification. The premium redesign is **not implemented yet**.

## 1. Executive assessment

CampusOne has a useful feature-first structure and several working local workflows, but its visual experience is still a text-and-card prototype. A successful upgrade needs a shared media, theme, accessibility, and service foundation before individual screens are redesigned.

### Verified baseline

| Area | Evidence | Assessment |
| --- | --- | --- |
| Stack | Next.js 16.2.6, React 19.2.6, strict TypeScript 5.9.3, Tailwind 4.1.17; Zustand, RHF/Zod, Lucide, CVA, Drizzle/pg, QRCodeSVG | Keep the stack; no wholesale rewrite needed. |
| Routes | 36 page files: 28 screen URLs, seven detail patterns, and the `/` redirect; also `/api/health` and shared state boundaries | Preserve every existing URL. |
| Feature structure | 25 `features/*/index.tsx` entrypoints, 21–85 lines each; auth is a separate components/validation module | Preserve the folder pattern and useful extracted components. Small files alone do not mean features are complete. |
| Client boundaries | 20 of 25 feature entrypoints are client components; the entire shell is client-rendered | Move static composition/data reads to server boundaries; keep interactive islands small. |
| Photos | Eight local SVG files with **identical SHA-256 hashes**; no photography | Assets do not distinguish features or communicate campus life. |
| Image rendering | No `next/image` import and no `<img>` in any baseline screen; Home uses a decorative CSS background | There is no aspect-ratio, loading, optimization, alt-text, or fallback image system. |
| UI kit | Six primitives: Button, Card, Input, Select, Textarea, Badge; only Button uses CVA | Shared accessible behavior and variants need expansion. |
| Theme | One light-only CSS token block, one card shadow/radius; widespread `bg-white` / `text-slate-*` utilities | Semantic surfaces, dark mode, scales, and consistent motion are absent. |
| Type | Inter is configured, but `--font-inter` is **not mapped to Tailwind's `--font-sans`** | Browser computed font is the default system stack, not Inter. |
| Demo depth | Most feeds contain two items; resources have three; featured content has six | Insufficient variety to validate visual feeds, filters, pagination, and recommendations. |
| API | Env override exists, but default is `http://localhost:8000/api`; no service interfaces or `.env.example` | Wrong port for the requested platform; browser-localhost default breaks remote previews. |
| Metadata/PWA | One root title/description; template package name; no per-route metadata, Open Graph, manifest, app icons, offline shell | Missing product identity and distribution polish. |

### Highest-value priorities

1. **P0 — Verification blockers:** remove build-time dependence on Google Fonts and database configuration. Both were fixed in this phase; see §9.
2. **P1 — Foundation:** semantic light/dark tokens, properly wired display/text fonts, `CampusImage`, reusable media cards, accessible form/control/dialog primitives, and typed service contracts.
3. **P1 — Shell and Home:** grouped navigation, an accessible More sheet, command search, top active-ad placement, Clubs hero, photo quick actions, LMS/SIP access, and accurate Today data.
4. **P1 — Flagship feeds/details:** Clubs → Events → Discover → Accommodation → Marketplace → Opportunities → Lost & Found → Academics.
5. **P2 — Remaining workflow depth:** timetable/calendar, identity/settings, social features, SRC/participation, study assistant, media, management, and advertising.
6. **P2 — Final quality:** card-shaped loading states, mutation failure recovery, responsive/keyboard QA, image/data budgets, metadata, and safe PWA enhancements.

Priorities describe impact, not permission to skip the user's implementation order. Existing accessibility and workflow defects below remain explicit work for their corresponding phases.

## 2. Audit method and measured baseline

### Source coverage

Read all route entrypoints and all seven detail implementations; all 25 feature entries and their components/hooks/validation; CSS, root/student layouts, navigation and shared UI; all domain types, demo data/services, persisted stores, API config/client, database health handling, package/configuration files, and existing docs.

Existing documents describe previous prototype work. They are useful context, **not evidence that the requested premium functionality exists**. For example, “select a conversation” is currently non-interactive, and “Week view” is a list of cards rather than a calendar.

### Browser and workflow coverage

- Production build served on `0.0.0.0:3000`; requests using a preview-style host were accepted.
- Playwright 1.64.0 and Chromium 153.0.8010.0; web-security and mixed-content bypass flags were removed from the sandbox-compatible browser launch.
- **216 full-page screenshots:** 35 feature/detail screens plus the shared 404 screen × 360/768/1280 px × light/dark OS preferences. Height: 900 px.
- All valid screen navigations returned HTTP 200, remained at the intended URL, and produced **zero page exceptions**.
- Screenshots for every screen at 360 and 1280 px were visually reviewed, with additional state screenshots for the mobile menu, event ticket, and fourth onboarding step.
- No document-level horizontal overflow at the sampled sizes. This does **not** mean the layouts are correct: five intended multi-column layouts collapse to one column; see §3.
- Light/dark screenshot files were byte-identical for **all 36 screens at 360 and 1280 px**. Theme backgrounds stayed `rgb(245, 247, 251)` at every size. Dark mode is absent, not successfully tested as a feature.
- `/` resolves to `/home`. All seven missing detail IDs show “Page not found”; these streamed Next.js responses returned HTTP 200 after headers were sent. The unmatched URL returned HTTP 404. The harness checks both the missing-detail UI and Next.js streaming status behavior rather than treating a streamed 200 as a crash.
- Separate interaction checks exercised onboarding, mobile navigation, task CRUD, RSVP/QR tickets, club requests/executive approval, bookmarks, read notifications, SRC validation/submission, community/report persistence, study-plan constraints, and sign-out state.

### Accessibility baseline

Axe 4.13.0 checks against WCAG 2 A/AA and WCAG 2.1 AA on every 360 px light-mode baseline screen found violations on **13 of 36 screens**:

| Rule | Screens affected | Nodes flagged | Examples |
| --- | ---: | ---: | --- |
| `select-name` | 8 | 10 | Academics, Clubs, Discover, Lost & Found, Sign-in, SRC Office, Study Assistant, Tasks |
| `label` | 5 | 9 | Sign-in, Register, Forgot Password, Study Assistant, Tasks |
| `color-contrast` | 3 | 3 | Home's date, Advertising's secondary copy, Onboarding's Skip action |

The fourth onboarding step separately flagged two contrast failures. Visible form labels frequently have no `htmlFor`/input `id` relationship. Search placeholders sometimes satisfy an automated accessible-name check, but are not a substitute for persistent labels. Passing an axe scan does not establish full accessibility: focus management, dialog naming, touch targets, meaningful imagery, and interaction semantics need manual checks too.

### Home Lighthouse baseline

One successful Lighthouse 13.5.0 run on the production `/home`, 360 × 800 mobile emulation with Lighthouse's default mobile throttling, recorded at **04:28 UTC**:

| Metric | Result | Requested target |
| --- | ---: | --- |
| Performance | **95** | ≥ 90 |
| Accessibility | **92** | ≥ 95 — not met |
| First contentful paint | 0.9 s | Track regression |
| Largest contentful paint | 2.9 s | Improve toward ≤ 2.5 s |
| Total blocking time | 60 ms | Track regression |
| Cumulative layout shift | 0 | Preserve |
| Total transfer | 385 KiB | Re-budget when photos are introduced |

Lighthouse's failed Home accessibility audits were color contrast and target size (10 × 10 px carousel indicators). It estimated 121 KiB of unused JavaScript. These are lab results for a very small, almost image-free demo, not a guarantee for low-end phones or future photo feeds. Re-run after every major Home change. An initial single-process browser run could not collect a filmstrip and had **no performance score**; the successful multi-process rerun above had no audit errors. Do not interpret an unscored run as zero or as a pass.

### Local evidence and reproducibility

Generated screenshots, metrics, interaction observations, and Lighthouse HTML/JSON are under `.cache/design-audit/results/` and deliberately excluded from Git and persisted deliverable snapshots. Recreate them with the tracked scripts:

```bash
npm ci
npm run lint
npm run typecheck
npm run build
npm run start -- --hostname 0.0.0.0 --port 3000
```

In another terminal, install isolated **audit-only** tools (not app dependencies) and run:

```bash
npm install --prefix .cache/design-audit/tooling \
  --no-package-lock --no-save --no-audit --no-fund \
  playwright@1.64.0 @sparticuz/chromium@153.0.0 \
  @axe-core/playwright@4.13.0 lighthouse@13.5.0
node scripts/design-audit.mjs
node scripts/audit/interactions.mjs
node scripts/audit/lighthouse.mjs
```

Run the three audit commands sequentially for reliable performance measurement. `AUDIT_BASE_URL`, `AUDIT_OUTPUT_DIR`, and `AUDIT_TOOLING_DIR` override defaults; `AUDIT_WIDTHS` and `AUDIT_SCHEMES` narrow screenshot runs; `AUDIT_CHROME_PORT` changes the Lighthouse debugging port. The browser helper unpacks npm-bundled Chromium libraries for this Linux sandbox without a separate browser-CDN download. These audit scripts are baseline probes, not yet the redesigned app's final regression suite. Keep their selectors/contracts current as screens evolve.

The browser audit blocks external media requests. It does not validate third-party audio playback, real authentication, email delivery, production API transport, payments, ticket admission, or database availability.

## 3. Cross-cutting design and shell weaknesses

### Brand, type, color, and layout

- The supplied navy/royal blue/gold/teal palette is a starting point, not independently verified official GCTU artwork. No SRC logo exists in the repository. **Do not invent a substitute emblem.** Reserve `BrandMark` for the supplied SRC asset; clearly label its temporary placeholder.
  - **Update (2026-10-15):** the council supplied the crest (`SRCLogo.png`, transparent) and an app-icon rendering (`campusone_app_icon.png`). Both masters stay at the repository root and are only scaled by `node scripts/brand-icons.mjs`; `srcLogo` now serves `/brand/src-crest-512.png` and the placeholder slot is gone.
- There is no typed theme contract, surface hierarchy, overlay/scrim token, display/text pairing, or defined spacing/elevation/motion scale. Badge colors and default white cards bypass the current custom tokens.
- Inter's variable is configured but not consumed by `font-sans`. The bundled baseline font fix intentionally does not redesign this mapping; Phase 2 must wire both fonts explicitly.
- Unlayered global `a { color: inherit }` can override Tailwind-layer link colors. Put base defaults in the correct CSS layer so semantic link variants remain effective.
- Invalid arbitrary grid classes (`md:grid-cols-[1fr,220px]`, `lg:grid-cols-[300px,1fr]`) compile to comma-separated, invalid CSS values. Browser computed templates at 1280 px were a single `976px` column on **Academics, Clubs, Discover, Tasks, and Messages**. Use space-separated templates, represented with underscores in Tailwind arbitrary values.
- Many detail pages occupy one short white card and leave most of the viewport empty. The card shadow is large relative to otherwise low-detail content; hierarchy comes from boxes rather than photography or type.
- Onboarding's header is cramped at 360 px (Sign in and Skip wrap awkwardly). The student header displays long programme/name text without a deliberate compact mobile identity variant.

### Navigation

- Desktop: 13 flat primary links plus three workspace links; fixed 256 px, not collapsible; no controlled scroll for shorter windows. Marketplace, Timetable, Announcements, Media, Study Assistant, Settings, Lost & Found, and Advertising are not present in the shell's navigation.
- Mobile: four tabs plus More already exist, but they are text-only, about 34 px high, have no unread indicators or safe-area inset, and do not use `aria-current`.
- The More drawer uses an unnamed hand-rolled `role="dialog"`. Verified: focus remains outside when opened and **Escape does not close it**. No focus trap, focus return, background inertness, or body-scroll lock.
- No global Ctrl/Cmd+K search, skip link, desktop grouping, or accessible account menu. Discover is the only cross-domain search and contains no visual discovery curation.
- Preserve URL matching for detail descendants when restructuring the navigation.

### Images and media

- URLs are repeated across three data files, with no `src/config/images.ts`; all eight stand-ins are byte-identical “CampusOne / Student feature preview” graphics.
- Club `cover` and media `thumbnail` fields are never rendered. Other content models do not contain photo/gallery/portrait data at all.
- There is no reusable image component, meaningful photo alternative text, ratio preset, focal point, skeleton, blur-up state, failure fallback, responsive `sizes`, gallery/lightbox, avatar fallback, or upload/crop/compression flow.
- The one featured background has a hardcoded gradient. Its current generic artwork is not a test that future imagery will maintain AA overlay contrast.
- Resource download links are `example.com` placeholders. One alleged podcast hotlinks a SoundHelix sample song; the repository has no source/usage credit record for that media. Replace with permitted local/generated demo media or an honest unavailable state before promising playback/downloads.

### Interaction, states, and accessibility

- Button sizes are 36/40/44 px; default inputs/selects are 40 px. Most controls fail the requested **44 px** minimum. Carousel dots are 10 px; the Home baseline has 16 visible interactive targets with at least one dimension below 44 px.
- Many navigation links wrap actual `<button>` elements. Use a single semantic anchor with button styling for navigation; reserve buttons for actions.
- Carousel tab semantics do not implement a complete roving-tabindex/tab-panel relationship. Add accessible carousel labeling, indicators with full-size hit areas, pointer cancellation, and keyboard behavior without hijacking focused child controls.
- There is a visible focus outline, but no unified focus/invalid/disabled field state, described validation errors, live toast region, or reduced-motion override. Motion currently relies on Tailwind defaults, not the required shared scale.
- Only root `loading.tsx` and `error.tsx` exist. Loading is text, not a feed skeleton. There are no domain-level loading/error/retry states, upload progress, action-failure rollback, or offline messages.
- Empty states are plain text boxes and often absent entirely. Few have an action; none has a media/illustration treatment.
- No route transition enhancement, refresh interaction, or shared pagination/infinite-list pattern. Progressive enhancement must remain optional and must respect reduced motion.

## 4. Screen-by-screen audit

Paths below map to `src/features/<feature>/index.tsx` except the auth components. Each screen inherits the shared theme/media/navigation weaknesses above; those are not repeated exhaustively.

### Home, auth, and onboarding

| Screen | Working baseline to retain | Weaknesses / required upgrade |
| --- | --- | --- |
| `/home` | Modular featured carousel; inactive featured items return no carousel; persisted task/user reads | Welcome appears **before** advertising. Featured `active` flags are unrelated to campaign dates/status; no reliable top-ad contract. Quick actions are icon/text boxes, no large Clubs tile or snap row; LMS/SIP absent. “Due today” actually takes the first three incomplete tasks without checking dates; no next class. Recommendations ignore programme/level/clubs and link to the generic list, not each item. No streak/progress or visual recommendation feeds. |
| `/sign-in` | RHF/Zod validation, demo role switch, persisted demo sign-in | Plain centered form, no photo or SRC identity; unassociated labels and unnamed role select; no password visibility/autocomplete polish, server-error state, or production authentication. Role choice must remain explicitly demo-only. |
| `/register` | Name/email/password/confirmation schema; route back to sign-in | Does not create an account or save entered identity; submitted values are discarded. Password validation errors are not all shown. No programme/level data, photo treatment, labeled inputs, or multi-stage feedback. |
| `/forgot-password` | Email schema and explicit demo confirmation | No actual reset transport; confirmation isn't announced accessibly. Missing associated email label, photo treatment, pending/retry state, and clear return-flow emphasis. |
| `/onboarding` | Five steps, Back/Continue/Skip, completion persistence when explicitly used | Gradient/icon cards instead of campus photography; cramped mobile header; fourth gold step has poor white-text contrast; progress has no progressbar semantics. Fresh browser `/home` **stayed at Home**, contrary to the intended onboarding guard. `onRehydrateStorage` references the store variable during its synchronous initialization, a hydration-order risk; repair and test the guard rather than assuming it works. |

### Priority feature feeds

| Screen | Working baseline to retain | Weaknesses / required upgrade |
| --- | --- | --- |
| `/clubs` | Search/category filter, persisted pending/approved/rejected status, existing executive review panel | Two text cards; covers unused; no members/avatars/meetup facts, featured club, sorting, saved clubs, or empty search state. Both demo clubs already have memberships, so the normal demo starts with **zero Join buttons**. No leave/cancel/retry flow. Executive requests lack applicant identity and club-scoped permissions. Preserve and extend the panel. |
| `/events` | Registration/cancellation persistence and honest demo QR ticket | Two text cards; no search/filter/sort, photographs, countdown, saved events, calendar export, event-ended/sold-out states, or detail-page RSVP. Displayed registration counts don't update with local RSVP. QR preview represents only the first selected registration, not an event-scoped ticket view. |
| `/discover` | Cross-domain search/category filtering and basic no-results state | Search only matches titles. All results are uniform text cards; no image/category exploration, popularity/recommendations, price/date facts, sort, saved filter, or pagination. Invalid desktop grid for search/filter controls. |
| `/accommodation` | Two list/detail destinations and in-session enquiry feedback | No photographs/gallery, location coordinates/map placeholder, room/occupancy/availability facts, agent avatar, contact/report flow, saving, search/price/amenity filters, or sorting. “Enquiry saved” is just local selection, not a saved request. |
| `/marketplace` | Two listings with price labels, detail links, in-session enquiry feedback | Digital-only text listings, no item photos/condition/gallery/seller information. No search/category/price/saved filters, sort, posting form, contact/report flow, or persistent enquiry. Prices are strings (`GHS`), unsuitable for numeric filtering; format structured GHS amounts as `GH₵`. |
| `/opportunities` | Title search and persisted bookmarks | Two text cards; no provider image, programme/level eligibility, location/type/deadline filters, sort, saved-only feed, expiry/closing-soon state, detail-page action, or no-results CTA. Branded names in demo data must not imply actual partnerships. |
| `/lost-and-found` | In-session lost/found report submission | Two text rows; **no photo input or required-photo validation**. Reports disappear on reload; location is forced to “Not specified.” No category/location/date filters, photo grid, claim/contact/report flow, validation schema, or distinct “I found this / I lost this” guidance. Avoid publishing legible student-ID personal details in demo imagery. |
| `/academics` | Resource title/course filters, bookmarks, resource detail routes, empty search state | Three resources and three courses; no course-cover cards, lecturer portraits, audio type, resource previews, semester/progress/GPA widget, sort/type/saved filters, or file-size facts. `downloadable` claims point to placeholder URLs. Invalid desktop search/filter grid. |
| `/timetable` | Typed sessions via service; basic empty state and small overflow-contained table | Three weekly sessions only. No real week/day navigation, course colors, lecturer photo, current/next lesson, scheduling conflict state, add-to-calendar, or edit flow. Empty-state copy suggests adding a session but provides no action. A timetable can remain schedule-first; it should not become an unrelated decorative photo feed. |
| `/calendar` | Reads class sessions and events through services | “Week view” is five cards, not a date/time calendar. Tasks and generated study sessions aren't included despite the description. No day/week switch, date navigation, today/now indicator, keyboard-accessible cells, event detail action, or calendar export. |
| `/profile` | Persisted identity and task/membership summary | Single text card, no cover/avatar/edit form/upload, saved collection, progress, or club imagery. Approved membership count is **not scoped to the current user**, unlike Participation. No bio/privacy or empty signed-out treatment. |

### Remaining feature screens

| Screen | Working baseline to retain | Weaknesses / required upgrade |
| --- | --- | --- |
| `/tasks` | RHF/Zod CRUD, complete/reopen, title search, status filter, persisted state, extracted components | No grouping/sorting, completion progress/streak, undo/confirmation, or clearly labeled fields. A date-only deadline is parsed at midnight, so a task due **today** is already marked overdue during that day. Invalid desktop search/filter grid. Keep this utility screen task-first; contextual course/club imagery can support it rather than obstruct actions. |
| `/study-assistant` | Explicitly labeled demo response generation | Form-to-textarea, not chat; only subject changes the response. Duration/constraints are ignored (verified with “90 minutes / Sundays only”). No chat history, suggested prompts, saved notes, study streak, pending response/retry, or service boundary for response generation. |
| `/community` | In-session posting and incrementing likes | No avatars/photo attachments, day grouping, search/feed filters, thread UI, or persistence. Likes can increase repeatedly; comments and Report buttons have no handlers. Add validated composer and toggled reactions with optimistic service mutations. |
| `/messages` | Two service-supplied conversation previews and an empty-state pattern | List entries aren't selectable links/buttons. Detail pane never opens; no messages/composer, avatars, unread state, day grouping, attachments, search, or demo send action. Intended two-pane desktop grid is invalid. Real transport must remain honestly labeled as unavailable until integrated. |
| `/notifications` | Persisted read toggle and destination links | Two text cards; no dates/avatars/thumbnails, grouped days, filters, unread tab/count in shell, mark-all-read, or empty state. `NotificationItem` has no timestamp, preventing real grouping. |
| `/src-office` | Service-backed representatives/projects and RHF/Zod request submission; persisted request status | Representatives have no portraits/contact paths; projects have no imagery, progress, or detail timeline. SRC crest now rendered (supplied artwork); no attachment flow, request filters, status history, or accessible notification on submission. Request category select has no accessible name. |
| `/announcements` | Search, pin badge, detail destinations, persisted save | Two text cards; pinned content isn't explicitly sorted first. No branded issuer/avatar/cover/attachments, category/saved/sort filters, richer details, no-results state, or timestamp treatment. Official-looking presentation must keep sample notices clearly marked demo. |
| `/participation` | User-scoped membership statuses and explicit demo recognition disclaimer | No club covers/member avatars, event participation timeline, earned progress, certificate/action flow, filtering, or empty CTA. Recognition badges are static and unrelated to activity. |
| `/settings` | Onboarding replay and sign-out navigation | No light/dark/system preference, notification switches, privacy controls, account editing, or accessible destructive confirmation. Sign-out nulls `user` but preserves the previous role and all local app data/bookmarks; account state needs deliberate isolation/reset policy. |
| `/media` | Bookmarking; audio control when a source exists | Thumbnail fields unused; two text cards. Hotlinked audio is not the promised podcast content; video action is only explanatory text. No search/type/creator filters, poster-led player, transcript/unavailable UI, audio history, or source/credit governance. |
| `/advertising` | One typed campaign with status/date display and honest demo copy | Read-only list; no creative preview, validation/editing/scheduling, active-date logic, role gating, metrics, or connection to Home's featured items. Build an honest demo manager, not a payment/ad-delivery claim. |
| `/management` | Role-aware scope copy and production authorization disclaimer | Only a role label and bullet list; not an operational dashboard. No team portraits, requests/membership/activity queues, filters, usable actions, status tiles, or role-scoped service contract. Frontend visibility is not authorization. |

### All existing detail screens

Each detail route currently handles an unknown ID through `notFound()`, but business presentation is embedded directly in the page file rather than a feature-local detail composition.

| Route pattern | Baseline contents | Required immersive composition |
| --- | --- | --- |
| `/clubs/[id]` | Name/category, description/objectives, note telling user to return to the list for membership | Cover hero, member/avatar stack, executives, next meetups, sticky Join/Leave/Save action and membership state. |
| `/events/[id]` | Title/date/venue/capacity and demo disclaimer | Hero/gallery, countdown, organizer/attendees, venue/map placeholder, sticky RSVP/Save, event-specific QR ticket and calendar export. |
| `/marketplace/[id]` | Title/category/price/description and payment disclaimer | Item gallery/lightbox, structured price/condition, seller portrait, location/map placeholder, sticky Contact/Save and Report. |
| `/accommodation/[id]` | Title/location/price and amenity bullets | Hostel/room gallery, occupancy/availability, amenities, agent portrait, map placeholder, sticky Contact/Save and Report. |
| `/opportunities/[id]` | Title/provider/category, summary/deadline | Provider/context hero, eligibility/requirements, deadline state, trusted application destination, sticky Save/Apply or Contact. |
| `/academics/resources/[id]` | Title/course/type/upload date and download-or-unavailable notice | Cover/preview hero, lecturer/uploader portrait, PDF/video/audio presentation, accessible preview state, sticky Save/Download/Open. Never present a fake file as a successful download. |
| `/announcements/[id]` | Title/date/category and short body | SRC/issuer branding, relevant photo/attachment hero when appropriate, readable editorial body, issuer avatar, save/share actions. |

### Root and shared boundaries

- `/`: preserve the redirect to `/home`; explicit onboarding completion and signed-out behavior need regression tests.
- `/api/health`: a database health endpoint, **not the student backend client**. It now builds without a database and truthfully returns `{ "ok": false }` with HTTP 503 when unconfigured. No live database was available for a successful DB health check.
- `loading.tsx`: replace centered text with final-layout skeletons; add route/feature boundaries where data actually suspends.
- `error.tsx`: retain Retry, add branded explanatory visuals, non-technical copy and navigation; separately handle service errors rather than relying on the root boundary.
- `not-found.tsx`: retain recovery link, use shared themed brand/illustration and useful campus destinations. No invented SRC emblem.

## 5. Data, contracts, and backend replaceability

### Demo inventory

| Dataset file | Current entities | Missing media/behavioral fields |
| --- | --- | --- |
| `academics/resources.ts` | 3 courses; 3 resources | Covers, portraits, programme/level/semester, resource size/type/preview, progress/credits |
| `engagement/clubs.ts` | 2 clubs; 2 memberships; 2 announcements; 2 events; 2 opportunities; 1 campaign | Club galleries/member counts/executives; event time/end/price/media/organizer; opportunity eligibility; campaign creative linkage |
| `housing/life.ts` | 2 marketplace listings; 2 lost/found reports; 2 accommodations | Photos/gallery, structured prices, contacts/avatars, coordinates, categories/availability/condition |
| `community/social.ts` | 2 posts; 2 conversations; 2 notifications | Author/recipient identity, avatars, attachments, message bodies, timestamps, unread/reaction state |
| `productivity/tasks.ts` | 2 tasks; 3 sessions | Course linkage, structured schedule dates, lecturer identity, consistent day-boundary handling |
| `engagement/src-office.ts` | 2 representatives; 3 projects; 1 request | Portraits/covers, contact paths, progress/status history, attachments |
| `media/items.ts` | 2 media items | Verified local sources, captions/transcripts, categories/credits; existing thumbnail is unused |
| `home/featured.ts` | 6 active featured entries | Campaign/time targeting, actual media source, central image reference, personalised selection |
| `core/user.ts` | 1 IT/Level 300 student | Avatar/cover, bio, preferences, programme/level variants |

Expand each **feed** to 12–30 varied items (usually 18–24), not every singleton configuration or status enum. Seed Ghanaian names, GCTU-relevant programmes/levels and campus places; keep places, partnerships, listings, and notices explicitly demo unless verified. Use deterministic IDs and dates; avoid random output during rendering. Include sold-out/expired/saved/missing-image states so the visual system is tested beyond the happy path.

### Existing architectural strengths

- Feature components and detail pages read domain arrays through `services/demo/*`, rather than directly importing demo data.
- Shared entity types already live in `src/types`; TypeScript is strict.
- Tasks, clubs, Home carousel, SRC panels, and form validation have useful decomposition to retain.
- Authentication, QR, AI, ad operations, and representation copy frequently identifies demo behavior honestly.

### Boundaries to repair before feature expansion

1. Services are synchronous objects with inferred array-return types, no explicit contract, async loading/errors, pagination, or mutation methods. Components also import the **demo implementation** directly. A real network adapter cannot satisfy the same synchronous UI contract without changing screens.
2. `app-store.ts` and `auth-store.ts` import demo seeds directly, bypassing the service boundary. Store actions are the actual mutation implementation, so replacing read services would still leave mutations disconnected from the API.
3. Define domain service/query/page/result and media/user types in `src/types`; expose a public `src/services` facade selecting demo/API adapters. Both should implement the same async contracts. Components call that facade; demo services may use a lightweight, versioned local repository for persistence.
4. Add scoped, typed get-by-ID and mutations (save, join/leave, RSVP, report/contact, uploads, requests, profile/preferences), rather than finding entities from whole list responses in every detail page.
5. Keep Zustand for session/UI/cache concerns with typed state, migrations and account isolation. Do not persist methods, secrets, or large image blobs; decide a capped local upload/demo-storage policy. Current persistence has no explicit data migration strategy.
6. `apiClient<T>` only casts JSON to `T`; it doesn't validate responses, normalize URLs, handle empty responses, multipart uploads, auth strategy, or retry/cancellation semantics. Preserve its swappable transport role and add typed/Zod response boundaries without coupling UI to backend DTOs.
7. `NEXT_PUBLIC_API_BASE_URL` is already configurable but has an unsafe/wrong fallback. Prefer a same-origin browser base (`/api`) and a **server-side** proxy target to the platform API on `:4000`. Protect the local health route from proxy collisions. Document endpoint-prefix assumptions and a safe deployment URL/override; never ship a browser-facing `localhost` fallback.
8. Add a sanitized `.env.example` setup template and update API docs in the integration work; never commit actual environment files, secrets, database URLs, build output, or dependencies. The precise backend endpoint/auth/upload contracts are not verified by this frontend audit.

## 6. Proposed design foundation and sensible defaults

These are recommendations for Phase 2, **not claims of implementation**.

### Identity and typography

- Keep the supplied navy/royal blue/gold/teal family, but use semantic roles (`surface`, `surface-raised`, `surface-muted`, `overlay`, `brand`, `accent`, `success`, `warning`, `danger`, `text`, `text-muted`, `border`, `focus`, `on-brand`). Derive light/dark values in one CSS source and expose token names through a typed theme file; components never own hex colors.
- Proposed type pair: **Fraunces display + Manrope text**. Fraunces adds the campus-magazine/editorial character; Manrope offers clear, modern interface copy and numbers. Bundle licensed, subset variable fonts through `next/font/local`, wire Tailwind tokens, and test Ghanaian names, `GH₵`, numerals, and long course titles. Keep font payload modest; no Google Fonts network dependency.
- Set an explicit type scale and 16 px mobile form inputs, consistent radius/elevation/spacing scales, and 150–250 ms ease-out motion. Disable non-essential transitions under reduced motion. Keep decoration subordinate to legibility.
- A supplied SRC logo replaces one `BrandMark` slot throughout shell/auth/onboarding/official surfaces; no new logo design or pretend official seal.

### Image system first

- Static stand-in/photo URLs belong only in `src/config/images.ts`, with typed keys plus meaningful alt, dimensions/focal point, blur data and placeholder/generated/licensed provenance. Demo entities reference those keys. Dynamic uploaded/API photos are data, not hardcoded component URLs.
- `CampusImage`: Next Image, 1:1 / 4:5 / 3:4 / 16:9 / 21:9 presets, object-fit/position, stable intrinsic geometry, correct `sizes`, lazy loading by default, only true LCP imagery preloaded, blur-up + skeleton, and gradient/icon fallback for missing/failed URLs. Do not use decorative alt text for meaningful item/people photos.
- Build MediaCard, PhotoTile, HeroBanner, Avatar/AvatarStack and Gallery on that contract. Put facts/actions on a legible information strip; use a shared tested dark scrim behind overlay text. Gallery includes swipe/indicators and a keyboard-operable headless lightbox.
- ImageUploader needs preview, keyboard-accessible crop controls, image type/size/dimension validation, client compression, revoked blob URLs, progress/retry, and storage-policy limits. Re-encoding should remove accidental location metadata; Lost & Found forms must require a photo.
- Initial delivery targets: responsive local WebP/AVIF photography, roughly ≤ 200 KiB for a card source and ≤ 250 KiB for the initial hero where quality permits. Serve smaller variants on 360 px devices; treat these as budgets to measure, not quality-independent promises.
- Start with the existing stand-ins as requested and label them clearly. Source later imagery locally from generated or appropriately licensed sources with a provenance/credit record. Generated Ghanaian campus-life scenes must not be described as verified photographs of the actual GCTU campus or real officials.

### Accessible component library

Expand `src/components/ui` with CVA variants and shared semantic tokens. Use Radix/headless accessible primitives for Dialog/Sheet, Dropdown, Tabs and Tooltip; use CSS for simple motion unless an animation library is justified.

Required catalogue: Avatar, Tabs, Dialog/Sheet, Dropdown, Tooltip, Toast, Skeleton, Switch, Checkbox, Radio, Progress, Stepper, Carousel, Chip/FilterBar, SegmentedControl, Pagination/InfiniteList, Rating, Stat tile, Timeline, Calendar cells, and all media/upload primitives above.

A dev-only `/design` route must exercise light and dark, keyboard/focus, disabled/invalid/loading/empty/error, missing/failed images, long text and narrow widths. A catalogue alone does not prove that feature screens adopt the system.

### Navigation and Home hierarchy

- Desktop groups: Home/Discover; Campus Life (Clubs, Events, Community, Participation); Academics (courses/resources, Tasks, Timetable, Calendar, Study Assistant); Services (housing, marketplace, lost/found, opportunities, SRC, notices/media); account/workspace and role-relevant management. Keep every existing URL reachable without turning the primary rail into another flat list.
- Mobile: four clear icon+label tabs plus an accessible More sheet; 44 px targets, safe-area padding and current/unread state. Use the same route configuration for desktop/mobile and command search.
- Home order: **active ad/featured media at the very top**, then personalised greeting/Today, a large Clubs photo tile and horizontal snap row of photo actions, prominent **GCTU LMS + SIP** links, programme/level/club-aware feeds, and task/study progress. When no active placement exists, no heading, dots, margin, or reserved ad space remains.
- Verify first-party LMS/SIP destinations before activation and centralise them in configuration; no guessed institutional URLs or copied credentials. Ads need date/status rules and explicit demo/sponsored labeling.
- Utility screens (settings, timetable, task editing) should remain efficient and readable; contextual portraits/covers support the flow rather than forcing arbitrary decorative photos into every control.

## 7. Implementation roadmap and verification gates

| Phase | Deliverables | Exit gate |
| --- | --- | --- |
| **1 — Audit (this phase)** | This screen-by-screen report; baseline scripts/screenshots/workflow observations; minimal build fixes | Lint/typecheck/build pass; reproducible browser and Lighthouse baseline; clear commit. |
| **2 — Design foundation** | Semantic theme/scales, licensed font pair, dark/light/system behavior, BrandMark slot, image registry/system, expanded CVA/headless kit and dev-only `/design`; package identity; start typed service contracts and env documentation | Showcase works at 360/768/1280 in both themes; image/error/upload states and keyboard controls verified; existing routes still build. |
| **3 — Shell** | Grouped/collapsible desktop sidebar, icon-led mobile tabs + proper More sheet, account/avatar/unread state, Ctrl/Cmd+K search, navigation access to every route | Focus trap/Escape/return and skip link tested; no preview host/origin rejection; 44 px controls; active detail matching. |
| **4 — Home** | Top active-placement behavior, large Clubs tile, snapping photo actions, verified LMS/SIP links, accurate Today/recommendations/progress | Test active/no-active ads without reserved space; real date filtering; low-end mobile image/JS budget; polished light/dark screenshots. |
| **5 — Auth + onboarding** | Photo-led sign-in/register/forgot-password and onboarding, validated accessible fields, reliable hydration/guard/persistence and honest demo outcomes | Invalid/valid/pending/error flow, keyboard, first visit/finish/replay, signed-out state and narrow header verified. |
| **6 — Feature depth** | Clubs → Events → Discover → Accommodation → Marketplace → Opportunities → Lost & Found → Academics → Timetable/Calendar → Profile → remaining screens, following §4 | Each feed 12–30 varied items, visual information strips, filtering/sorting/saves, useful details/forms, service-backed persistence, required-photo reports and relevant action bars; preserve all URLs. Use small subphase commits where needed. |
| **7 — Polish** | Route skeletons/error/empty/retry, toasts/optimistic rollback, a11y and responsive corrections, optional transitions/refresh, metadata/PWA/performance pass | AA contrast in both themes, reduced motion, no small tap targets, offline/error tests, licensed local media; no private auth/data caching in an optional service worker. |
| **8 — Final verification** | Full route/state regression, Home Lighthouse, flagship screenshot review, completed `docs/DESIGN_SYSTEM.md` and API/photo replacement guide | Lint/typecheck/build green; Home ≥ 90 performance / ≥ 95 accessibility; Home/Clubs/Events/detail visibly premium; dark mode and missing-media behavior across every route. |

Run `npm run lint`, `npm run typecheck`, and `npm run build` **after every phase**, not only Phase 8. Verify all changed screens at 360 and 1280 px in both themes, include 768 px for breakpoint regressions, test keyboard and mutations, and commit each completed phase on the working branch. No generated `.next`, dependency trees, audit artifacts, or private environment files enter Git.

## 8. Decisions, dependencies, and risks

- **No blocking questions for Phase 1.** The missing SRC logo is a planned component slot, not grounds to invent an identity or pause the foundation. Official artwork/colors and live institutional URLs remain verification dependencies for final launch.
- Keep every current route, especially `/clubs/[id]`, `/events/[id]`, resource and listing details. Add routes only when justified; use redirects for any later unavoidable URL changes.
- Do not replace the existing club executive panel, task CRUD, SRC form, or event demo QR behavior with purely decorative redesigns.
- Maintain demo honesty while giving local actions meaningful results. Don't claim enquiries, secure auth, AI, payments or entry verification reached a real service.
- Persisted stale data is a migration risk when entity models gain media/identity fields. Version/reset/migrate deliberately and test old storage, missing fields, and switching accounts.
- Cheap-phone performance must be re-measured **after** photography is introduced. Lazy-load feeds, reserve geometry, avoid broad client boundaries, paginate, and do not preload every card.
- The environment permits npm/PyPI/GitHub access but not Google Fonts hosts. Bundle fonts and imagery locally with licenses. Browser automation is audit tooling only; no heavy runtime dependencies were added.
- Image attachment privacy and copyrighted media require explicit provenance/retention handling. Never include readable student-ID secrets or real contact details in synthetic demo content.
- PWA/offline is a progressive enhancement if time permits. A service worker must not indiscriminately cache personalised pages, auth responses or write requests; app icons should use the approved SRC identity when available.

## 9. Phase 1 changes and verification report

### Minimal changes made (not a redesign)

1. **Font build reliability:** root layout now uses `next/font/local` with the unmodified 48,256-byte Latin variable Inter font from `@fontsource-variable/inter@5.3.0`. Full SIL OFL 1.1 and provenance are in `src/app/fonts/`. Existing styling/variable naming is retained; the missing Tailwind mapping and new type pair are intentionally left for Phase 2.
2. **Database-independent frontend build:** `/api/health` checks configuration and imports the DB module inside its handler. A missing database returns HTTP 503/`ok: false` rather than throwing during Next's page-data collection. A failed configured query still returns HTTP 500. This does not fake DB readiness or remove the existing DB configuration requirement when actually used.
3. **Clean artifact handling:** `.gitignore` excludes `.cache/`, Playwright reports/results, and TypeScript incremental output. No environment file, dependency tree, generated Next output, or screenshot was added to Git.
4. **Reproducible audit tools:** tracked scripts cover route discovery, light/dark responsive screenshots, baseline axe checks, workflow probes, and an honest Lighthouse result; tools themselves are installed only in ignored local storage. Source files are all under 150 lines.
5. **Documentation:** this audit and README verification notes. Existing broad design/API docs will be updated with implemented contracts in the later phases, not prematurely rewritten to describe nonexistent features.

### Checks

| Check | Initial baseline | After build fixes / phase completion |
| --- | --- | --- |
| `npm ci` | Passed | Lockfile unchanged; no production dependency additions |
| `npm run lint` | Passed | Passed |
| `npm run typecheck` | Passed | Passed |
| `npm run build` | Failed: Google Fonts unreachable; after fixing font, failed: import-time `DATABASE_URL` requirement | Passed without database/API env configuration |
| Production route/screenshots | Not previously automated in this checkout | 216 variants, zero page exceptions, valid detail and shared not-found behavior |
| Local workflow probes | Not previously automated in this checkout | Working CRUD/save/RSVP/review/SRC persistence verified; gaps recorded in §4 |
| `/api/health` without configuration | Import-time failure | HTTP 503, `{ "ok": false }` — truthful degraded state |
| Home mobile Lighthouse | No current measurement | Performance 95; Accessibility 92 (remaining work, not target achieved) |

**Phase 1 conclusion:** the repo can now be verified reproducibly, its existing useful behavior is identified, and the premium upgrade has a concrete route-by-route backlog. Next is the shared design/image foundation, not isolated cosmetic changes to Home.

## 10. Audit resolution through Phase 5 (11 October 2026)

The route-by-route baseline above is retained as historical evidence, not silently rewritten to describe the redesign. Phases 2–5 resolve the following shared/frontend findings:

| Baseline finding | Implemented resolution / remaining scope |
| --- | --- |
| Flat/incomplete mobile navigation and static search | Phase 3: 24 grouped destinations, collapsible desktop rail, mobile tabs + More, keyboard typed global search with resilient source/code states. |
| Placeholder Home with no image hierarchy | Phase 4: active-only sponsor/video placements, large generated Clubs story, snap photo actions, verified-source HTTPS LMS/SIP links, bounded typed server feed, Accra now/next and task completion/undo/progress. |
| First visit bypassed introduction | Phase 5: explicit auth/tour hydration precedes the guard; first visit reaches the five-step photo intro and completion/skip return safely to the originating route. |
| Registration discarded submitted identity | Phase 5: validated name/email create a new local student ID; returning local sign-in preserves the saved profile, while a new registration uses new submitted details. This is not secure real authentication. |
| Sign-out retained role/bookmarks and stale private activity | Phase 5: user/elevated role, six activity arrays, preferences and photo clear; explicit guest survives reload, remember-disabled profiles are visit-only, and demo logout/external storage clearing sync across tabs. |
| No honest photo/avatar attachment workflow | Foundation/Phase 5: native local crop/compression/validation, intent-loaded editor, owned visit-only avatar/revocation and explicit no-upload/no-persistence notice. Required lost/found attachment and real server storage remain Phase 6/backend work. |
| Missing visual/accessibility/service foundation | Semantic light/dark/system tokens, locally licensed Manrope/Fraunces, registry/provenance/fallback image system, expanded accessible primitives and proposed typed read/auth boundaries. Official SRC artwork is still pending. |

Current verification: lint/strict TS/optimized Next 16.4.0 build; **68 native tests**; **105 auth AA/layout/tap captures**; shared foundation/shell/Home/video/legacy regressions including executive approval; and **222 route cases / 74 AA analyses** with zero overflow/44px flags. Visual auth review at 360/1280 in both themes caught and corrected a genuine photo/copy stacking defect that width checks missed. No accessibility rule was disabled.

Latest production returning-Home Lighthouse after the actual tour UI and HTTP-cache clearing: default scores **83/82/75, median 82**; disclosed CPU-raster diagnostics **95/94/94, median 94**; Accessibility **100** throughout. Performance ≥90 remains open on the default renderer/real hardware. Earlier Phase 4 scores (default median 63, CPU median 91) remain in the dated test report; changed framework/returning-visitor harness prevents attributing the difference to one optimization.

Runtime-only dependency audit: **0 vulnerabilities**. Full toolchain audit: **9** (5 high, 4 moderate, 0 critical); a force downgrade is not used as a false fix. Backend auth/CSRF/roles/reset mail/DB/upload integration, screen-reader/IME/Safari/Firefox/physical-device checks remain unverified. Community/lost-found persistence, required report photo, study constraints, expanded 12–30-item feeds and deeper photo-domain details remain Phase 6, followed by polish/final verification. Exact reproduction and limitations are in [TEST_REPORT.md](TEST_REPORT.md) and [Phase 5](PHASE5_AUTH_ONBOARDING.md).

## 11. Clubs subphase resolution (Phase 6A, 11 October 2026)

The two-entry/basic Clubs UI is replaced with sixteen fictional photo communities, seven interest groups, composed search/sort/All/My/Saved views, real 6-per-page pagination and rich story/facts/crew/gallery details. Membership request/withdraw/leave/reapply/save and preserved executive Approve/Reject survive reload where storage permits. Owner-qualified state/services prevent stale async actions or drafts crossing profiles; visit-only failures are reported honestly. Legacy IDs/categories/m1/m2 and routes remain compatible.

Typed bounded lazy catalog/activity/action adapters use the proposed same-origin port-4000 API with validation, selected SSR cookies and no failure-to-demo fallback. Native and controlled browser fixtures verify frontend behavior, not a deployed backend or real club enrollment. Five additional registered fictional activity WebPs total 526,288 bytes; no new runtime library.

Verification: lint/strict TS/optimized Next build; **92 native tests**; **203 Clubs AA/layout/44px captures**, all sixteen details at 360/768/1280 light/dark; shared foundation/shell/Home/auth-session/proxy regressions; fresh **222 route cases / 74 AA analyses**, all clean. The first fact-list grouping was invalid and fixed; save-overlay stacking and safe mobile sticky controls are checked. Full detail/directory and representative workflow states were visually reviewed at 360/1280 both themes. Runtime audit 0; full toolchain 9 advisories.

Retained Phase 5 Home Lighthouse medians (default 82 / CPU-raster 94, Accessibility 100) are not new Clubs-phase measurements. Default/real-device ≥90 remains open. Events and the later domain/persistence/attachment/study/calendar/profile backlog, plus backend/security/physical-device/screen-reader work, are not marked complete. See [Phase 6A](PHASE6A_CLUBS.md).


## 12. Events subphase resolution (Phase 6B, 11 October 2026)

The two-card/direct-toggle/eager-QR Events baseline is replaced by sixteen fictional photo listings/details and six interest groups. Composed search/category/date/free/sort/All/My RSVPs/Saved views, actual six-card pagination, richer programme/agenda/hosts/access/gallery and safe sticky actions are implemented. `e1`/`e2` original fields/URLs and registrations compatibility remain. Explicit consent/idempotent RSVP/cancel/save, deadline/capacity/cancelled/past handling, minute/visibility countdown, non-entry demo QR and real UTF-8-folded timed/all-day ICS work.

Public typed bounded source-lazy catalog/activity/actions/tickets preserve legacy missing facts and expose multi-day dates. Demo actions recheck time/catalog/owner after awaits; API counts are not blindly incremented, publisher credentials are not locally synthesized, and failed/revoked/wrong-event tickets have no QR. Owner-qualified UI/abort guards and cross-tab logout prevent old ticket/private-plan display. Visit-only is verified rather than a fabricated persistence success. Three additional generated local photos total 319,998 bytes; no new application runtime dependency.

Verification: lint/strict TS/Next 16.4 production build; **122 native tests**; **244 Events AA/layout/44px captures**, all 16 details at 360/768/1280 both themes; actual QR decode/ICS download; controlled API errors/retry/persistence/counts/ticket/legacy/multi-day/cookie boundaries; shared foundation/shell/Home/auth session/tour/Clubs executive/proxy regressions; current **222 route cases / 74 AA checks**. The original functional runner now uses explicit new Event/Club forms and async decisions; all 12 positive workflow, first-visit and sign-out assertions pass. The nested fact-list error was fixed, not suppressed; removed-trigger focus falls back safely.

Manual 360/1280 light/dark review covers all sixteen header/story/footer panels and representative directory/consent/ticket/API screens. Runtime audit 0; full toolchain 9 development advisories. API tests are controlled frontend/proxy fixtures, not live backend/security/database/entry proof. Retained Home median default 82 / software diagnostic 94, Accessibility 100, is not a new Events benchmark; default/real-device ≥90 remains open. Discover is next, followed by the remaining agreed domains; report/community persistence/photo, study constraints, calendar/GPA and real backend/device/screen-reader gaps remain explicit. See [Phase 6B](PHASE6B_EVENTS.md).
