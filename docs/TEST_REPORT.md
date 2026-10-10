# CampusOne test report

## Phase 3 — shell, navigation and global search (10 October 2026)

**Implemented and verified:** grouped/collapsible desktop navigation, four mobile tabs + More, refined header/brand slot, Cmd/Ctrl+K search, typed catalog search and focus/persistence/delivery behaviour. This milestone does not claim the later Home/auth/feature redesigns or live integrations are complete.

### Source and native checks

| Check | Result |
| --- | --- |
| `npm run lint` | Passed |
| `npm run typecheck` | Passed, strict TS |
| `npm run build` | Passed; Next 16.2.6 / 32 generated static pages; latest compile 14.5s, TypeScript 9.0s |
| `npm run test:foundation` | 15/15 passed; previous media/API/theme contracts preserved |
| `npm run test:shell` | 12/12 passed; no added runtime/test dependency |
| Existing routes / official artwork | URLs preserved; SRC logo still a labelled pending slot |

New native coverage proves all **24** static student routes occur once across **five** groups; four unique mobile destinations; bounded parent/detail active matching; sidebar prepaint defaults/compact/private storage; trimmed query/scope/limit validation; non-mutating accent-normalized ranking; empty/short suggestions without content calls; all seven source-to-detail mappings; six-per-source bounds; headers/signals; partial/all-source failures and recovery; URL-encoded IDs; pre/mid-flight aborts; labelled preview fixtures.

### Responsive/visual regression

- **222 route cases**: 37 screen/guard/not-found paths × 360/768/1280 × light/dark.
- **74 route axe cases** at 360 in both themes: **zero final WCAG 2 A/AA + 2.1 AA violations**.
- **Zero page-width overflow or final visible offscreen-content flags**; no browser exceptions. All 37 screens reviewed visually at 360 and 1280 in both themes using eight review sheets, with individual shell/search captures and tablet metrics.
- Initial element-bound probes counted the onboarding card's clipped decorative circle, even though document width remained correct. Its decorative icon/circle are now explicitly hidden from assistive technology; **six targeted onboarding recaptures** verified the corrected semantic/metric result. Initial evidence is retained, not silently deleted.
- Root redirect and the seven missing-detail patterns retain the documented Next streamed-not-found behaviour. Production `/design` is strict 404, and all destination URLs remain intact.

### Shell/search browser checks

`scripts/phase3-audit.mjs` passed against production 3001 and the dev-only showcase on 3000. It produces **31 visual/axe captures**: 24 responsive shell states, six controlled search loading/failure states and one panel-code delivery failure. All captures have zero axe violations, page-width overflow and small hit-target flags.

**Six responsive shell cases:** 360/768/1280 × light/dark. Every destination is reachable from the desktop rail or More. Parent activation on a club detail; compact/expanded layout; Cmd **and** Ctrl shortcuts; initial input focus; arrow/wrap selection; Enter-to-detail navigation; clear/scope/empty states; Tab focus trapping; Escape and shortcut toggle/return; main focus after actual route navigation all passed.

**Sidebar:** compact preference survives reload, synchronizes across tabs, clears to the default on a storage-clear event and remains usable with denied sidebar storage. With hydration chunks blocked, the stored compact layout is already **88px** wide and content offset before hydration.

**Delivery:** neither search UI, More UI nor development search-fixture chunks appear in initial Home script requests. Requested panels load on intent; closing while the code download is held cannot cause a late dialog opening. Menu-to-search switching leaves **one** dialog, focuses the combobox and returns to the header on close. A controlled failed code download recovers via **Reload page**, with explicit save-changes wording; a cached import rejection was not misrepresented as a successful in-page retry. Cancelling loading/failure feedback returns focus.

**Data failure/cancellation:** controlled `/design` error and partial-result fixtures recover on **Try again** in both themes. The slow fixture deliberately ignores abort so the UI's stale-reply guard is tested independently: a late Code response cannot replace newer Innovation results. Loading blocks Enter, and closing in-flight work does not reopen the dialog. These are fixtures, **not real API proof**.

### Preserved workflows and backend boundary

A production legacy interaction rerun passed onboarding persistence; More/menu focus/return; task CRUD/completion persistence; RSVP ticket persistence/cancel; **club-executive approval persistence**; bookmarks; notification reads; SRC validation/submission persistence. No browser exceptions. Known baseline gaps (community/report persistence, required lost/found photo, study constraints, sign-out isolation and initial onboarding guard) are unchanged and remain scheduled domain/auth work; see the Phase 2 notes below.

`/api/health` remains **503 / `{ "ok": false }`** without a database. New search composes the typed/swappable catalog and preserves partial failures/cancellation. Live API/database compatibility, secure authentication and authoritative campus data are still **unverified**.

### Latest production Home performance

Default mobile Lighthouse 13.5 / Chromium 153, 360 × 800, simulated network/CPU multiplier 4, sequential idle production runs, zero audit errors:

| Run (UTC, 10 Oct) | Performance | Accessibility | FCP | LCP | TBT | CLS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Initial Phase 3 — 22:37:22 | 67 | 100 | 0.8 s | 3.2 s | 1480 ms | 0 |
| Final build — 22:49:55 | 66 | 100 | 0.8 s | 3.2 s | 1840 ms | 0 |
| **Latest repeat — 22:50:07** | **68** | **100** | **0.8 s** | **3.2 s** | **1440 ms** | **0** |

Latest speed index **1.8s**. Initial Home transfer is **335,457 bytes / 22 requests**: scripts 247,241 / 16; fonts 62,056 / 2; CSS 11,053 / 1; document 12,143 / 1; images 2,964 / 2. This is **11,103 bytes more than the latest Phase 2 build**, reflecting the larger destination/header surface and demo portrait. Deferred overlays are proven, but neither a smaller overall delivery nor an improved Lighthouse score is claimed.

**Performance ≥90 remains OPEN**; Accessibility ≥95 is met by these measurements. Phase 4 must address initial Home composition/hydration and deliberate media delivery, then remeasure. Do not change throttling, omit low runs or substitute historical scores to claim acceptance.

### Reproduce and evidence

```bash
npm run lint && npm run typecheck
npm run test:foundation && npm run test:shell
npm run build
# Start dev on 0.0.0.0:3000 and this production build on 0.0.0.0:3001
node scripts/phase3-audit.mjs
AUDIT_BASE_URL=http://127.0.0.1:3001 \
  AUDIT_OUTPUT_DIR=.cache/phase3/routes node scripts/design-audit.mjs
AUDIT_BASE_URL=http://127.0.0.1:3001 \
  AUDIT_OUTPUT_DIR=.cache/phase3/legacy-regression node scripts/audit/interactions.mjs
AUDIT_BASE_URL=http://127.0.0.1:3001 \
  AUDIT_OUTPUT_DIR=.cache/phase3/performance node scripts/audit/lighthouse.mjs
```

Ignored evidence: `.cache/phase3/{routes,onboarding-final,review,final-shell,legacy-regression,performance*}`. Source runners/reports are versioned; cached screenshots/binaries may not persist in another workspace. Safari/Firefox, screen-reader/physical-device and live service/security verification remain open. No heavy package, animation library, binary dataset, `.env*`, cache or build output was added to Git.

---

## Phase 2 — foundation verification (10 October 2026)

**Implementation:** semantic design/media/UI/service foundation is implemented; existing URLs and demo workflows are preserved. **Performance acceptance remains open:** the latest Phase 2 measured Home score was 74, below the ≥90 target. Accessibility measured 100, above ≥95. These are not claims that later product phases are complete.

### Build and source checks

| Check | Result |
| --- | --- |
| `npm run lint` | Pass |
| `npm run typecheck` | Pass |
| `npm run build` | Pass; Next 16.2.6, 32 static pages, existing dynamic details/health plus narrowly matched proxy |
| `npm run test:foundation` | **15 / 15 pass**, Node 22.22.3 |
| Raw palettes / direct fixture imports in app/component/feature TSX | None found by source scan |
| Largest feature / foundation UI modules | 149 / 141 lines; split compositions/hooks retained |
| Environment artifacts | `.env*` ignored; staged-tree inspection performed before phase commit |

Final source build: 10.7 s compilation, 8.0 s TypeScript, 893 ms static generation. Build timings are local observations, not deployment guarantees.

### Unit coverage

Native Node tests exercise:

- crop centering/zoom/clamping, **625** focal/aspect/zoom combinations, invalid/non-finite geometry;
- MIME/empty/oversized/non-file validation, real local registry assets/alt/provenance and bundled licenses;
- all **17** preserved demo collections against runtime schemas;
- cloned search/category/sort/pagination/missing-detail/abort behaviour;
- browser-relative API URLs, SSR port 4000, literal/encoded traversal guards and browser loopback rejection;
- typed JSON/204/FormData requests, preserved headers/credentials, HTTP/offline/invalid-envelope/abort handling;
- proposed API list/detail contract using **mock fetch**, not a live backend;
- pre-paint preference/bootstrap including denied storage;
- semantic text pairs ≥4.5:1; control/focus pairs ≥3:1; environment ignore policy.

The native loader is for pure TypeScript, not React/TSX rendering. UI checks run against the actual Next browser build.

### Responsive route regression

- **37 screens × 3 widths × 2 themes = 222 screenshots**: 35 preserved app screens, production `/design` guard, and an unknown-route 404.
- Widths **360, 768, 1280**, light/dark; explicit expected HTTP status and browser-exception assertions.
- **Zero page-width overflow, zero browser exceptions** across the matrix.
- WCAG 2 A/AA + 2.1 AA axe at **360 px in both themes**: 74 route/theme cases. One initial dark-register `link-in-text-block` failure was fixed with an underline; targeted reruns replace that stale result. **Final combined violations: zero.**
- Auth links were expanded to 44 px targets, missing password feedback and error descriptions added, and the hidden/focused skip link's target corrected.
- Updated auth/housing/market/Home screens were recaptured in all six variants (**48** additional captures); final Home/header/prefetch changes were recaptured again (**6**).
- Visual review: all 37 screens at 360 and 1280 in both themes via eight review sheets; individual loaded-photo showcase, mobile controls, desktop overlays/data and tablet media inspected. No observed layout blocker remained. Fixed header/mobile-bar appearances in full-document/element captures were checked as capture positioning, not mistaken for an actual sticky-bar bug; showcase section crops hide the header only during capture.
- `/` still redirects to `/home`. Seven invalid details show the shared “Page not found” state; Next streaming still produces HTTP 200 for these late detail failures. This known response-status limitation is recorded, not hidden.

Artifacts: ignored `.cache/phase2/routes`, `updated-routes`, `final-home`, `review`. The combined review JSON records the latest targeted replacements. Cached binaries may not persist; rerun the committed harness for fresh evidence.

### Hydrated foundation browser checks

`node scripts/phase2-audit.mjs` completed successfully:

| Check | Observed result |
| --- | --- |
| `/design` at all 6 width/theme combinations | HTTP 200, confirmed hydration, photos loaded, fallback resolved, axe 0, no overflow/exceptions |
| Dialog | Focus trap, labelled content, axe 0, Escape and focus return |
| Sheet | Focus trap, Escape and focus return |
| Dropdown / toast | Save action, displayed/dismissed notification |
| Tabs / choices | Arrow navigation, checkbox/switch/radio state |
| Pagination / explicit load more | Last-page and appended item states |
| Gallery | Arrow browsing, lightbox trap/Escape/return to clicked photo |
| Mobile gallery | **Native touch swipe**, snapped to second photo |
| Reduced motion | Skeleton animation reduced to 0.00001 s |
| Theme | Reload persistence, cross-tab sync, system changes, denied-storage fallback |
| First paint | With hydration scripts blocked and OS light, stored dark produced dark canvas + native dark controls on first paint |
| Fonts | Chromium platform-font query confirmed custom **Manrope** for the cedi-bearing price (no Arial/system glyph fallback); extended face loaded |
| Metadata | Populated detail title/suffix, description, Open Graph title/description verified in DOM |
| Production showcase guard | **HTTP 404**; nested subpath also checked manually |

The production guard needed a pre-stream proxy check: a page `notFound()` beneath a loading boundary rendered the correct 404 UI but sent status 200. The narrow proxy rewrite fixes that explicitly; it does not alter other route URLs.

### Native uploader checks

The browser—not a Node stand-in—decoded, cropped and encoded the test photos.

- Rejected SVG MIME, >12 MiB input, corrupt JPEG, and a **42-megapixel** PNG.
- Keyboard zoom change observed; focus 70/50 and zoom 1.8 produced **427 × 427 JPEG, 47,220 bytes**.
- Pixel-level independent crop comparison: mean absolute channel error **2.98 / 255**, below the 6 / 255 tolerance for fractional crop/JPEG resampling; this is stronger than a dimensions-only claim.
- A source JPEG containing synthetic EXIF Artist metadata produced **no EXIF** after encoding.
- A 3200 × 1800 input produced **1600 × 1600, 368,719 bytes**, within the 1600 px / 512 KiB ceilings.
- Simulated callback failure preserved the draft; retry succeeded after disabling the fixture.
- Remove cleared both source and consumer preview. **4 object URLs created / 4 revoked**, none active after removal/navigation.

These are local preparation/cleanup checks. They do not verify a remote upload, antivirus/storage authorization, server metadata stripping or upload cancellation. HEIC/GIF/SVG are intentionally unsupported; real server validation remains mandatory.

### Existing workflow regression

The final production interaction audit observed:

**Passing/preserved:** onboarding persistence; More/menu focus, Escape and return; task create/complete persistence + edit/delete; RSVP ticket persistence + cancellation; existing club-executive approval + persistence; bookmarks; notification read persistence; SRC validation/submission persistence. No browser exceptions.

**Known legacy gaps, not claimed fixed by Phase 2:** first visit goes directly to Home; the default joined/pending membership fixture has no fresh Join action; community/report submissions appear but do not survive reload; lost/found has no required photo yet; study output uses the subject but not all constraints; sign-out clears user but retains role/bookmarks. Photo-led auth and these domain/persistence/transport changes remain in their agreed phases. The executive request panel was not removed.

### Proxy / health / backend status

`node scripts/phase2/proxy.mjs` passed against a short-lived fixture bound to **0.0.0.0:4000**:

- browser-style same-origin `/api/proxy-proof` forwarded to `/api/proxy-proof` on port 4000;
- fixture cookie headers survived forwarding;
- local `/api/health` was not shadowed and remained `{ "ok": false }` / **503** without a DB.

**Real API/database connectivity, production authentication and backend DTO compatibility remain unverified.** Endpoint mappings are explicitly proposed. Legacy synchronous screens remain demo-only even when the new async catalog is configured for API mode.

## Production Home Lighthouse / dependency budget

Lighthouse **13.5.0**, Chromium **153**, mobile **360 × 800**, device scale 1, default simulated mobile network / CPU multiplier **4**; sequential production runs, no audit errors. Scores are local measurements and vary with the host.

| Build/run | UTC time on 10 Oct | Performance | Accessibility | LCP | TBT | CLS |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Phase 1 historical result | 04:28:29 | 95 | 92 | 2.9 s | 60 ms | 0 |
| Phase 2 initial | 21:29:48 | 60 | 100 | 3.8 s | 2200 ms | 0 |
| Phase 2: off-route prefetch disabled | 21:33:39 | 69 | 100 | 3.1 s | 1280 ms | 0 |
| Phase 2 isolated trace diagnostic | 21:35:48 | 66 | 100 | 3.0 s | 2350 ms | 0 |
| **Phase 2 latest: opaque header** | **21:38:34** | **74** | **100** | **3.0 s** | **920 ms** | **0** |
| Archived Phase 1 replay, same current tooling/host | 21:43:15 | 79 | 92 | 2.6 s | 740 ms | 0 |

The archived replay used the exact Phase 1 commit in an ignored scratch directory with the same Next/React installation and runner. No branch was switched, and the temporary server/source copy was removed. It demonstrates that the historical 95 is not a current guarantee; it **does not excuse or satisfy** the missing ≥90 target.

Latest Phase 2 FCP **0.8 s**, speed index **1.5 s**. Home transfer:

| Type | Requests | Bytes |
| --- | ---: | ---: |
| Scripts | 15 | 241,121 |
| Fonts | 2 | 62,056 |
| CSS | 1 | 10,526 |
| Document | 1 | 9,622 |
| Image | 1 | 1,029 |
| **Total** | **20** | **324,354 (316.8 KiB)** |

Initial Phase 2 transfer was 475,335 bytes / 51 requests. Disabling automatic off-route prefetch removed **25 untouched-route fetches**, the unused ~85 KiB Zod chunk and other prefetched code: **150,981 fewer bytes (147.4 KiB)** and **31 fewer requests** overall. Async API/catalog adapters are lazy. The header also no longer requires a backdrop blur.

Added runtime libraries: 11 focused Radix primitive packages (+48 transitive packages) for dialog/sheet/menu/choice/tooltip/toast/avatar semantics; no animation or crop/compression library. Their justification is tested focus/keyboard/ARIA behaviour, not package count. Unused dev-showcase/widget/API code must remain outside initial Home delivery. The font pair's preloaded asset bytes are 61,456; the extended 15,120-byte face is demand-loaded. Generated WebPs total 166,234 bytes and do not load on the legacy Home's initial slide.

**Open performance work:** ≥90 is not met. The trace includes substantial unattributable wall-time tasks (one diagnostic task had 513.5 ms wall duration but only 0.145 ms thread time), plus normal framework/hydration work. This is a diagnostic observation, not proof of a host-only cause. Phase 3 should minimize closed-overlay/root client costs; Phase 4 must move initial Home composition/reads server-side, keep image sizes/preloads deliberate and remeasure representative low-end/mobile hardware. Do not trade correctness/accessibility or manipulate throttling to claim success.

Artifacts: ignored `.cache/phase2/performance*`, `baseline-replay`, `results/foundation-browser.json`, `final-regression/interactions.json`. Production report JSON/HTML and optional traces are reproducible with `scripts/audit/lighthouse.mjs` (`AUDIT_SAVE_TRACE=1`). Raw reports are not committed.

## Reproduction and limitations

See README/design-system commands for the isolated browser-tool installation and dev/production servers. Route runner supports `AUDIT_ROUTES` for comma-separated targeted reruns plus width/theme filters. Production `/design` is an expected 404; set `AUDIT_DESIGN_DEV=1` only when intentionally checking the dev matrix.

Automated checks do not certify screen-reader usability, all browsers, real students/data, live uploads, security/RBAC, service authority or low-end physical-device performance. Additional Safari/Firefox/device and assistive-technology work follows with the product flows. Magazine Home, photo auth/onboarding, expanded feeds and feature/detail redesigns remain scheduled; PWA/offline behaviour is not yet implemented.

## Phase 1 reference

The preserved Phase 1 baseline is commit `4b3d913` and [DESIGN_AUDIT.md](DESIGN_AUDIT.md). Its findings and historical scores remain audit history, not current assertions. Phase 2 does not rewrite those results or claim deeper feature work has already happened.
