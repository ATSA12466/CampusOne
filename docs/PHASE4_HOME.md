# Phase 4 — magazine Home

**Scope:** photo-led Home and its typed read/media/performance boundary. The foundation, all route URLs, grouped shell/search and executive approval panel are retained. Auth/onboarding and the remaining feature redesigns follow their agreed phases. This is a labelled prototype, not an official GCTU/SRC product or a verified live campus platform.

## Composition and behavior

1. Editorial welcome, campus date and desktop Add task link.
2. Active ads/video **first**. A sponsor needs an active Home campaign, matching ID and valid inclusive dates. A video needs a real approved source and text alternative. Unsupported/inactive entries are omitted; zero entries means **no carousel or reserved ad container**. The client clock expires already-rendered campaigns while the page stays open.
3. Large generated Clubs photo, scrimmed editorial copy, explicit fiction caption, real `/clubs` action and avatar stack.
4. Africa/Accra now/next class from actual supplied weekday/start/end values, joined to course titles; ongoing sessions take precedence, ended classes roll forward through the week. Empty/failed timetable states differ.
5. Device-only demo task list: overdue/today counts, safe date labels, completion, focused Undo, restored completion-button focus, persistent progress and honest storage failure. A toast loads only after an action; native fallback preserves feedback if its code cannot load.
6. Six horizontal snap photo shortcuts: Events, Academics, Opportunities, Accommodation, Marketplace and Discover. Every tile uses the central image registry and an existing destination.
7. Prominent LMS/SIP links: HTTPS, new tab, explicit accessible name, `noopener noreferrer`.
8. Earliest upcoming event and up to three open opportunities sorted by deadline. This is date-based curation, **not** a personalized recommendation engine. Expired/invalid dates are omitted.

Initial server composition remains useful without hydration: titles, photos, portal links and destinations are present. Interactive planner/carousel/video/retry actions need JavaScript. Below-fold recommendations use progressive content-visibility, not removal from the document.

## Architecture and contracts

- Route: `src/app/(student)/home/page.tsx`; per-request headers/clock, development-only fixtures.
- Server composition: `src/features/home/index.tsx`; split feature components are roughly 30–135 lines.
- `HomeFeedService` / `HomeSnapshot`: `src/types/home.ts`.
- `createHomeFeedService`: `src/services/home/home.service.ts`; seven concurrent catalog reads (`featured`, `clubs`, `events`, `opportunities`, `campaigns`, `timetable`, `courses`), 30-record bounds, eight-second deadlines, explicit unavailable/truncated sources, abort propagation and no silent API-to-demo fallback.
- Proposed `featured` collection: `GET /api/home/featured`; typed/Zod-validated placement metadata, required meaningful thumbnail alt, approved media sources and local destinations. A publisher thumbnail outside the static registry is mapped without claiming its license.
- Pure date/campaign/schedule/task helpers: `src/lib/home/`; strict calendar/leap-day checks, non-mutating sorts and safe malformed persisted dates.
- Client clock: one minute-resolution provider with immediate/visibility refresh; it does not fetch personalized data or authorize changes.
- Local seeds: `demoAppStateService.initial()` clones the same existing tasks/memberships/notifications/SRC requests, without loading every compatibility reader to initialize the shell.
- Adapter deadlines require cooperative AbortSignal handling (the supplied fetch/demo adapters cooperate); an arbitrary uncooperative implementation is not certified.
- API calls resolve the trusted server backend (port 4000), never an incoming Host. Home forwards **only** exact cookies named in server-only `API_SESSION_COOKIE_NAMES` (empty forwards none); values never enter client props, URLs or logs. GETs are no-store.

The list bound matters: Home is a preview, and a truncated timetable cannot claim to include every session. View full pages for more. Backend status changes need a fresh feed; an open page is not a real-time campus subscription. Task/auth actions remain demo-local even in API mode. Backend endpoints/auth/DTO compatibility are unverified.

## Video, not a pretend player

The second demo placement opens a lazy module and **actual** native WebM playback. No media/caption bytes or player module are requested on initial Home. Metadata is requested after intent, playback is manual, there is no autoplay, and close unmounts the player. It supplies native controls, an English visual-description track, a persistent transcript, load error and real retry.

A failed JavaScript chunk offers save-changes + reload guidance; an import-cache rejection is not disguised as successful same-page retry. Escape cancels an in-flight import, and late delivery cannot open the cancelled dialog. Dialog keyboard trapping and return focus use the shared kit. Cmd/Ctrl+K does not open a second shell overlay over a feature dialog or appearance menu. Chromium's own video-control shadow UI can consume Escape before dispatching it to the application; the keyboard-reachable Close control and Escape from dialog-owned controls are checked. Real-device/fullscreen/Safari/Firefox behavior remains manual follow-up.

### Licensed sample

- Source: [MDN CC0 flower.webm](https://github.com/mdn/interactive-examples/blob/main/live-examples/media/cc0-videos/flower.webm).
- License: [MDN CC0 1.0 Universal](https://github.com/mdn/interactive-examples/blob/main/LICENSE), copied in full to `public/media/demo/CC0-LICENSE.txt`.
- Local clip: **554,058 bytes**, **960×540**, measured **~5.059s**.
- Extracted poster: **20,018 bytes**; registry provenance is `licensed`.
- Local `.vtt` and a text alternative describe the silent visual scene.

This flower sample is **not GCTU campus footage** and is labelled accordingly. Replace it only with licensed/authorized footage and matching captions/transcript/creator/duration; never claim an unsupported player or attach fake campus provenance.

## Fictional photo assets

| Registry key | Actual dimensions | Persistent WebP bytes |
| --- | --- | ---: |
| `clubsHero` | 1376×768 | 141,886 |
| `studyCorner` | 1000×558 | 58,336 |
| `innovationNight` | 1000×558 | 76,564 |
| `campusLiving` | 1000×558 | 105,576 |
| `campusMarket` | 1000×558 | 77,976 |

These five independent AI-generated scenes are fictional. They do not depict actual GCTU students, a real campus event or an actual listed residence. Static URLs, alt, dimensions, focal points and source notes remain centralized in `src/config/images.ts`; tiny pre-blurred previews live in `image-blurs.ts`. Generated raw/intermediate files stay ignored. The official SRC artwork was not fabricated.

## Official portal sources

- LMS: [GCTU ICDE course-materials FAQ](https://icde.gctu.edu.gh/faqs/how-do-i-access-course-materials-and-resources-in-a-distance-learning-course/) directs students to `https://lms.gctu.edu.gh/` (2024 publication).
- SIP: [GCTU course-registration procedure](https://site.gctu.edu.gh/course-registration-procedure) directs registration through `sip.gctu.edu.gh` (2021 publication); Home uses `https://sip.gctu.edu.gh/`.

These are official-source URL choices, not claims that today's portal login, certificates, availability or course data were tested. No password is collected or portal embedded in CampusOne. The older `sip.gtuc.edu.gh` domain was not used.

## Performance decisions and honest measurement

No runtime package was added. Initial reads/large layout stay server-composed; closed player/menu/toast code is intent-loaded. Route links avoid eager off-route prefetch. Images are SSR-visible immediately; tiny raster LQIPs avoid full-size SVG filters. Home's lead image is high-priority, the Clubs photo is prioritized when it becomes the first photo, thumbnails declare their real width, and Home leads use allowlisted quality 60 (default 75 elsewhere). WebP is the fast-encoding default; AVIF remains configured.

The audit keeps Lighthouse's default simulated mobile network and 4× CPU throttle, 360×800, Chromium 153. A legacy forced-compositor flag was removed. The default sandbox SwiftShader renderer and an explicit `AUDIT_RENDERER=software` CPU-raster diagnostic are reported separately; higher diagnostic scores do not erase lower default runs. The three final explicit CPU-raster runs score **92/91/91 (median 91)** with **100 Accessibility**; default sandbox runs score **60/63/63 (median 63)**. Portable/default-renderer Performance **≥90 remains open**. Exact current scores, transfer sizes and repeat measurements are in [TEST_REPORT.md](TEST_REPORT.md).

## Reproduce checks

```bash
npm run lint && npm run typecheck
npm run test:foundation && npm run test:shell && npm run test:home
npm run build
# Start development 3000 and production 3001, both on 0.0.0.0
node scripts/phase4-audit.mjs
node scripts/phase3-audit.mjs
node scripts/phase2-audit.mjs
node scripts/phase2/proxy.mjs
AUDIT_BASE_URL=http://127.0.0.1:3001 node scripts/design-audit.mjs
AUDIT_BASE_URL=http://127.0.0.1:3001 node scripts/audit/lighthouse.mjs
# Explicit diagnostic, not an undisclosed replacement for the default renderer:
AUDIT_RENDERER=software AUDIT_BASE_URL=http://127.0.0.1:3001 \
  node scripts/audit/lighthouse.mjs
```

Development-only Home URLs accept `?home-preview=empty|inactive|partial|offline|recover|truncated`; `recover&run=<unique-label>` faults once then refreshes through the same boundary. The banner identifies the fixture. Production ignores it; no production data switch or unverified API fallback was introduced. Audit files stay under ignored `.cache/`; source runners and these reports are committed.
