# CampusOne — final frontend handoff

> **Follow-up:** [release hardening](RELEASE_HARDENING.md) adds fresh-install CI, safer DB CLI configuration and 11 release tests (**221 total**), reducing development audit reports **9 → 5** with runtime still zero. Earlier measurement/summary counts below are preserved as the original frontend completion evidence.

## Completion and scope

The requested photo-first CampusOne **frontend upgrade is complete through polish and final verification**. All ordered domain migrations through Phase 6M and Phase 7 polish are on `arena/aa6b22f8-campusone`. Existing URLs, canonical record IDs, membership/RSVP persistence and the club executive Approve/Reject panel are preserved.

This is an explicitly labelled **demo/application frontend**, not an official GCTU/SRC deployment. Typed replacement contracts and controlled fixtures are not proof of a secure, connected backend.

- Domain/secondary milestone: `08822d9` — photo-led secondary screens and source-safe campus actions.
- Polish milestone: `889f6b9` — private planner/source feedback hardening and bounded feature modules.
- Final verification documentation/tooling is the following milestone on the same branch; no other branch or force push is used.

## What is delivered

- **Design system:** semantic light/dark/system and reduced motion; local `next/font` **Fraunces + Manrope** rather than an Inter/system-only final design; centralized media/alt/focal/aspect/blur/fallback policy; existing Radix/native accessible controls. No new runtime animation/crop library.
- **Magazine shell/Home:** grouped and collapsible navigation, mobile tabs + More, command search, conditional sponsor/video-first placement, photo-led Clubs hero, snap shortcuts, official HTTPS LMS/SIP destinations, Accra class preview, private task completion/Undo/progress and dated recommendations.
- **Auth/onboarding:** photo-led forms, Zod/RHF validation and focus, safe returns, five-step resume/skip/replay, actual submitted local identity, optional visit photo and source-aware logout/private clearing.
- **Rich feature feeds/details:** Clubs, Events, Discover, Accommodation, Marketplace, Opportunities, Lost & Found, Academics, timetable/calendar, Profile and all secondary campus screens. Main directories have 12–16 fictional records and six-item pages; Discover's edit is 24 and all current loaded demo records are **96**.
- **Practical workflows:** preserved executive review; source-qualified shared saves; RSVP/cancel and explicitly non-entry demo tickets; real timed/all-day ICS; weighted GPA and note CRUD; owned required-photo listing/report create/crop/edit/close/delete; private stories/reactions/nested replies/concern drafts, conversation history/photos, notification read state, editable profile preferences and task/study history.
- **Honest media/study/SRC:** real deferred CC0 sample audio/video, captions/transcript and explicit unavailable recordings; structured deterministic study drafting, not AI; bounded private SRC requests, not fake delivery to the office. Participation is membership/plans, not fabricated attendance/awards. Management/Advertising are supplied views, not fake privileged consoles.
- **Typed services:** lazy catalog/auth/domain/workspace/task/notification/campus adapters, source/account/email/role/hydration/abort guards, bounded runtime validation and no API-mode demo fallback. Same-origin browser `/api` proxies to the server-only platform port **4000**.

## Final verification

| Gate | Observed result |
| --- | --- |
| Lint / strict typecheck / production build | Passed; Next 16.4.0, React 19.2.6, 29 generated pages |
| Native contracts/workflows | **210 passed**, zero failed, across 13 suites |
| All canonical route/details | **732 views**: 122 paths × 360/768/1280 × light/dark |
| Route accessibility | **244 mobile WCAG A/AA + 2.1 AA analyses**, zero violations |
| Route geometry/touch | Zero root/visible overflow and sub-44px target flags across all 732 views |
| Additional workflow verification | **1,439 AA/layout captures**, zero defects, including the maintained 18-capture cross-feature journey |
| Manual visual review | All **37 route templates × four 360/1280 theme states** through 20 current overview sheets; additional entity variants and tablet layouts have automated coverage |
| Metadata / demo indexing | Titles, descriptions, Open Graph and demo `noindex` validated for all **122** paths |
| Source audit | **507 TS/TSX files**; zero `any` type nodes, direct UI fixture imports or literal component palettes; no forbidden environment/build/dependency artifacts versioned |
| Health / production showcase | `/api/health` is expected 503 `{ok:false}` without DB; `/design` is 404 in production |
| Dependencies | Production audit **0**; full audit **9 development advisories** (5 high, 4 moderate, 0 critical) |

Foundation/showcase/theme/touch/dialog/crop/publishing, shell/search/delivery, Home/media/clock/storage/error/delivery and all auth groups were rerun. Domain verification covers all detail records, filter/pagination/save reload, guest/owner changes, preserved executive approval, real media playback, required prepared photos, calendar/GPA/notes, private social/thread/read-state, structured study controls and real ICS downloads. Browser exceptions are checked in normal workflow runs.

The cross-feature journey now uses the current UI rather than obsolete baseline selectors. It exercises first-visit tour, keyboard menu return, task CRUD and structured planning/ICS, RSVP/cancel/ticket, executive approval, canonical opportunity save, SRC validation/reload, required-photo report, photo stories/replies/private messages/read state and clearing six app collections plus the owned workspace on sign-out.

A parallel Home media screenshot timed out at 30 seconds. Remaining Home groups passed on the unchanged build when rerun alone; the incomplete attempt is not counted as a pass. Auth expectations were updated for semantic save/guest labels and real SPA navigation before testing remember-disabled reload clearing. Discover checks derive the expanded catalogue counts and assert exact course-search IDs rather than assuming the original 45 records/one matching resource.

### Home Lighthouse — production, default renderer

Latest post-polish confirmation: three sequential **isolated default SwiftShader / Chrome 153** mobile production measurements against application commit `889f6b9`:

| Run | Performance | Accessibility | FCP | LCP | TBT | CLS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | **92** | **100** | 0.92 s | 3.37 s | 37 ms | 0 |
| 2 | **92** | **100** | 0.93 s | 3.31 s | 45 ms | 0 |
| 3 | **90** | **100** | 0.93 s | 3.50 s | 106 ms | 0 |

**Latest median Performance 92; Accessibility 100 throughout.** This satisfies the requested local lab targets (Performance ≥90 / Accessibility ≥95).

Scenario: returning `/home` after completing the actual tour; HTTP cache cleared, local profile/tour preferences retained; 360×800 mobile emulation, Lighthouse default simulated throttling. No software-raster alternate is substituted. There are no audit errors. Physical-device performance is **not** established by this sandbox result.

The preceding isolated 91/92/91 set (median 91), historical default median 82 / software-raster diagnostic median 94 and later default 67 then isolated 91 are retained, not erased. The reason for the low-run variance is not established; possible contention is not asserted as proven. No dedicated Home performance optimization is claimed between those diagnostics. Both three-run sets, exact timestamps and benchmark indices are in [the compact summary](audits/final-summary.json).

## Reproduction

```bash
npm ci
npm run lint
npm run typecheck
# Run each native suite; Node 22.15+ is required by the native TS runner:
for suite in foundation shell home auth clubs events discover life profile social study secondary polish; do
  npm run "test:$suite" || exit 1
done
npm run build
npm run start -- --hostname 0.0.0.0 --port 3001
```

Browser tooling is intentionally isolated in ignored `.cache/design-audit/tooling` (setup in README). Keep a development server on 0.0.0.0:3000 for explicit development fixture checks. Production checks use 3001:

```bash
AUDIT_BASE_URL=http://127.0.0.1:3001 AUDIT_ALL_ENTITIES=1 \
  AUDIT_OUTPUT_DIR=.cache/final/routes node scripts/design-audit.mjs
node scripts/phase8-source-audit.mjs
AUDIT_BASE_URL=http://127.0.0.1:3001 AUDIT_ALL_ENTITIES=1 node scripts/phase8-metadata-audit.mjs
AUDIT_BASE_URL=http://127.0.0.1:3001 node scripts/audit/interactions.mjs
# Run Lighthouse alone, sequentially, without builds/other browser audits:
AUDIT_BASE_URL=http://127.0.0.1:3001 node scripts/audit/lighthouse.mjs
# Admin dashboards against the backend (see docs/ADMIN_BACKEND_WIRING.md):
npm run audit:admin
AUDIT_BASE_URL=http://127.0.0.1:3001 npm run audit:admin-ui
npm audit --omit=dev
npm audit  # Known nine development advisories; nonzero is not concealed
```

Domain-specific runners and exact source contracts are linked in the [inventory](FEATURE_INVENTORY.md), [architecture](FRONTEND_ARCHITECTURE.md), [design system](DESIGN_SYSTEM.md), [API guide](API_INTEGRATION_GUIDE.md) and [test report](TEST_REPORT.md). Versioned compact results survive without committing large screenshots, traces, build output, dependencies, environment files or private test images. `.cache` evidence is ignored and may need regeneration.

## External release checklist — still unverified

Before representing CampusOne as live or official, supply and verify:

1. Real authentication/session/authorization/club scope/CSRF, database/transactional durability, rate limits, audit logs, email verification/MFA/reset/logout revocation and real deployment configuration.
2. Approved image/media rights and the **authorized SRC artwork**. The current clean slot is deliberate, not an invented logo.
3. Upload storage/scanning/quotas/retention and privacy/publication rules; browser-owned photos are not proof of secure server uploads.
4. Realtime/message delivery/moderation, AI inference, payment/enrollment/ticket-entry authority and institutional timetable/grade synchronization where those capabilities are required.
5. Physical Android/iOS, Safari/Firefox, IME and full screen-reader/manual assistive-technology testing. Automated AA and keyboard tests are valuable but do not replace these gates.
6. Development-toolchain advisory resolution with supported upstream updates. No risky forced framework downgrade was applied to make the audit appear green.

PWA/offline write caching was optional and is not installed; no offline server-acceptance claim is made. Official portal destinations are sourced and their link semantics tested, not a claim of current portal availability. Frontend cancellation stops waiting and cannot undo a server mutation already accepted.
