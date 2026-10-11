# CampusOne design system

Foundation Phase 2, extended through Phase 6A · 11 October 2026 · Package: `campusone-web` · Product: **CampusOne**

A photo-centered, campus-magazine foundation for GCTU student life: editorial character without making everyday work harder. This is a frontend prototype, not an official campus service. The grouped shell, magazine Home and photo-led auth/onboarding and Clubs directory/details are implemented; remaining domain redesigns follow in the agreed phase order.

## 1. Principles and source of truth

1. **People first.** Photos lead discovery; facts and actions remain clear. No photograph implies verified membership, attendance or institutional endorsement.
2. **Useful, not ornamental.** Give a student a next action, a next class, or a community to find. Avoid decorative dashboards with invented “live” numbers.
3. **One vocabulary.** Semantic tokens, consistent 4 px spacing, a small type hierarchy, and reusable states.
4. **Light and dark are peers.** A preference can be light, dark or system; components do not contain alternate hardcoded palettes.
5. **Demo honesty.** Local state, generated imagery, simulated upload failures and demo role changes are explicitly labelled.

| Concern | Source |
| --- | --- |
| Semantic colours, spacing, typography, motion and radii | `src/app/globals.css` |
| Shared focus, card, scrim, field, motion and reduced-motion rules | `src/app/styles/foundation.css` |
| Typed token references and pre-paint bootstrap | `src/config/theme.ts`, `src/types/theme.ts` |
| Theme state and controls | `src/components/theme/` |
| Static image URLs, logo slot and image-source policy | `src/config/images.ts` |
| Image/crop/result contracts | `src/types/media.ts` |
| UI primitives / composition helpers | `src/components/ui/`, `src/components/media/`, `src/components/shared/` |
| Per-route titles and social descriptions | `src/config/metadata.ts` |
| Public service boundary / typed contracts | `src/services/index.ts`, `src/types/service-contracts.ts` |
| Development-only working examples | `/design`, `src/features/design/` |

Read the existing file before extending it. Keep feature UI in `features/<name>/{components,hooks,validation}`. Keep shared entity types in `src/types`. Prefer small files (roughly 150 lines or less), explicit APIs and leaf imports.

## 2. Identity and the official artwork slot

The existing navy, royal, gold and teal palette is the starting point. Royal and status roles were adjusted for readable text and controls; this is **not a claim that an official GCTU/SRC brand manual has been verified**.

`BrandMark` is a typography-led wordmark and an explicitly labelled empty SRC artwork slot. It is not a fabricated council emblem. `srcLogo` is currently `null`.

When the official SRC file is supplied:

- place the authorized asset under `public/` or on an approved HTTPS host;
- set `srcLogo` in `src/config/images.ts` to a `CampusMedia` object;
- include meaningful alt, dimensions, provenance and the permission/source note;
- preserve its proportions with `fit="contain"` — never redraw, recolour or substitute an invented logo;
- recheck light, dark and inverse/nav usage at small and large sizes.

## 3. Semantic tokens

Raw colour values exist in the CSS token definitions, not component markup. `theme.colors` contains typed CSS-variable references, not a second palette. Tailwind maps the roles through `@theme inline`.

### Core roles

| Role | Light | Dark | Typical use |
| --- | --- | --- | --- |
| `background` | `#F6F5F2` | `#0B1523` | Warm paper / deep canvas |
| `surface` | `#FFFFFF` | `#142132` | Cards and controls |
| `surface-raised` | `#FFFFFF` | `#1B2A3D` | Dialogs, menus, toasts |
| `surface-muted` | `#ECEFEE` | `#203045` | Segments, quiet blocks |
| `surface-inset` | `#E5E9EC` | `#0F1C2C` | Media/skeleton/progress beds |
| `foreground` | `#102339` | `#F0F4FA` | Primary copy |
| `muted-foreground` | `#526174` | `#B2BFD0` | Supporting copy; still readable |
| `border` | `#DCE2E5` | `#35455A` | Decorative separation |
| `control-border` | `#7C8B99` | `#7D90AA` | Visible input/choice boundaries |
| `brand` | `#2254D5` | `#98B7FF` | Primary action / selected state |
| `on-brand` | White | Deep navy | Copy on primary actions |
| `accent` / `on-accent` | Gold / dark brown | Same | Warm editorial emphasis |
| `success`, `warning`, `danger` | Deep semantic colours | Lighter semantic colours | Status with icon/text, never colour alone |
| `focus` | Royal | Pale blue | Visible keyboard outline |

Use `bg-surface text-foreground`, `text-muted-foreground`, `border-control-border`, `bg-brand text-on-brand`, and the `*-soft` status beds. Do not apply a foreground token to a photo or a navigation rail: use the separate `on-photo` and `nav-*` contracts.

The navigation and photo roles are invariant navy/white. This keeps white on-image text from turning dark when the app switches themes. Low decorative border contrast is intentional; interactive field boundaries use the separate control role.

### Scales

- Spacing: **4, 8, 12, 16, 24, 32, 48, 64 px**. Tailwind's base spacing references `--space-1`; typed references are in `theme.spacing`.
- Control radius: **14 px**; card: **20 px**; media: **24 px**. Use `rounded-control`, `rounded-card`, `rounded-media`.
- Raw radii are `--r-*`, and raw shadows are `--elevation-*`. They deliberately do not reuse Tailwind's mapped variable names, avoiding self-referencing CSS variables.
- Elevation: `shadow-low`, `shadow-raised`, `shadow-overlay`; favour borders and surfaces over large floating shadows.
- Motion: **150 / 200 / 250 ms**, `cubic-bezier(0.16, 1, 0.3, 1)`. Tailwind's default transition timing also points to this scale.
- Skeleton pulse is a slow loading affordance, not a micro-interaction. Reduced-motion rules suppress animations/transitions, transforms and smooth scrolling.

## 4. Typography: editorial + everyday

**Fraunces** for display and editorial headings, **Manrope** for body, labels, navigation and numbers. Fraunces gives CampusOne a recognizable magazine voice; Manrope keeps forms and campus facts calm and efficient.

Both are variable, SIL Open Font License 1.1 assets from Fontsource 5.3.0, bundled through `next/font/local`. No build or browser fetches Google Fonts.

| Asset | Bytes | Delivery |
| --- | ---: | --- |
| Fraunces Latin, weights 100–900 | 36,620 | Preloaded display family |
| Manrope Latin, weights 200–800 | 24,836 | Preloaded text family |
| Manrope extended Latin | 15,120 | Separate fallback family, not preloaded |
| **Total** | **76,576** | About 60 KiB preloaded, 14.8 KiB on demand |

The extended family includes the cedi and extended Latin glyphs used by `GH₵` and names such as Dzidzɔ. Generated Arial fallbacks are disabled for Manrope so they do not intercept those glyphs. Fraunces has a metric-adjusted Times fallback. Font sources and full licenses: [font README](../src/app/fonts/README.md).

| Hierarchy | Scale | Guidance |
| --- | --- | --- |
| Display | Fluid 44–84 px | Editorial entry point; use sparingly |
| Title | Fluid 32–52 px | Hero/story title |
| Page/section heading | 24–36 px | Clear structure, not competing headlines |
| Body | 16 px | Comfortable line height; form fields avoid mobile auto-zoom |
| Label | 14 px | Semibold when naming a control |
| Metadata | 12 px | Secondary facts with sufficient contrast |

Use tabular numerals for money, statistics and timers. Currency is `GH₵`. Do not shrink important copy to fit; wrap names and titles deliberately.

## 5. Light, dark and system

`ThemeProvider` uses a small external store rather than another persisted state library. The trusted inline bootstrap applies `data-theme`, `data-theme-preference` and native `color-scheme` **before paint**.

- Preference key: `campusone-theme` (`light`, `dark`, `system`).
- System mode responds to subsequent device-scheme changes.
- Explicit choices persist across reloads and synchronize across tabs.
- Denied/private-mode storage falls back to a document-local choice without breaking theme controls.
- `ThemeSwitcher` has full segmented and compact dropdown presentations; Settings includes the full control.
- Theme overrides in the showcase's two surface studies are scoped examples, not a second application preference.

Do not add `dark:bg-*` copies of the palette or read local storage in individual feature renders. Use semantic roles and `useTheme` only when behaviour actually depends on the preference. A deployment with strict CSP must authorize the bootstrap with its nonce/hash strategy; the current prototype does not implement an authentication/CSP platform.

## 6. The photo system

### Registry and provenance

All static image/stand-in URLs live in `src/config/images.ts`. Existing demo adapters now reference that registry. API and upload URLs should arrive as typed `CampusMedia`, not be hardcoded into UI files.

`CampusMedia` provides `src`, meaningful `alt`, optional known dimensions, blur data, focal point, and provenance (`placeholder`, `generated`, `licensed`, `upload`). It can carry a source/permission note. Do not guess dimensions or claim a license for an unknown image.

Current assets:

- `campusLife`: generated fictional campus-life scene, 1376 × 768, **142,842 bytes**;
- `studentAma`: a 240 × 240 crop from the same generated scene, **9,072 bytes**;
- `studentKojo`: another 240 × 240 crop, **14,320 bytes**;
- Phase 2 generated WebP assets: **166,234 bytes**;
- eight original SVG stand-ins retained for later replacement;
- one intentional unavailable-image entry for error testing (its dimensions describe the intended demonstration frame, not an existing file).

The scene and people are **fictional AI-generated demonstration imagery**, not real GCTU photographs, students or club members. The hero and showcase identify this visibly; portrait alts identify the fiction. The SVGs have a visible Placeholder label. No copyrighted stock photo was hotlinked. The original generation/large intermediates are not committed.

### `CampusImage`

Wraps `next/image`; source policy, frame shape, loading and fallback behaviour are shared.

| Preset | Ratio | Suggested use |
| --- | --- | --- |
| `square` | 1:1 | Avatar/compact media |
| `portrait` | 4:5 | Featured photo tiles |
| `tall` | 3:4 | People / longer portrait treatment |
| `video` | 16:9 | Listing/event media, galleries |
| `panorama` | 21:9 | Campus story/hero |

- `fit="cover"` by default, `contain` for artwork/full-frame media.
- Focal points use 0–100 percentages and preserve a subject across crops.
- `sizes` communicates the **actual layout width**, not automatically `100vw`.
- `priority` maps to Next 16's preload API; only an actual above-fold image should be prioritized.
- Pre-blurred tiny raster LQIPs when supplied; a quiet skeleton otherwise. The image itself is SSR-visible immediately, not hidden until a client onLoad. Native data-image placeholders avoid full-size SVG Gaussian filters.
- `quality` is bounded to 60 or 75 (Next allowlist): Home leads use 60; default remains 75. WebP is the fast-encoding default, with AVIF still configured. Photo tiles declare their actual 160px layout width.
- Missing, disallowed or failed sources become a branded gradient/icon fallback, retaining a meaningful accessible description and the frame ratio.
- Blob upload previews are unoptimized, remain on this device, and must be revoked by their owner.
- Local paths and upload blobs are allowed. Remote sources require an exact approved HTTPS hostname; credentials, nonstandard ports, unsafe paths and arbitrary data URLs are rejected.
- `NEXT_PUBLIC_IMAGE_HOSTS` is used by both the component guard and Next's image remote patterns. Default: no remote hosts.

```tsx
import { CampusImage } from "@/components/media/campus-image";
import { images } from "@/config/images";

<CampusImage
  image={images.campusLife}
  aspect="portrait"
  sizes="(max-width: 767px) 90vw, 400px"
  className="rounded-media"
/>
```

Do not return to CSS `background-image` for meaningful photographs. Decorative imagery may use `alt=""`; meaningful media must not.

### Compositions

- **MediaCard**: photo, editorial title, facts and a separately reachable action; uses a stretched link without nested interactive controls.
- **PhotoTile**: 4:5/16:9 photo-led destination, scrim, optional decorative icon and clear title.
- **HeroBanner**: responsive story banner, hierarchy and action slot. White copy is restricted to the safely scrimmed region; desktop preserves a clearer right-hand photo area.
- **Avatar / AvatarStack**: actual image when supplied, branded initials otherwise; predictable sizes and overflow count.
- **Gallery**: native touch/snap carousel, reachable arrows/dots, modal lightbox, arrow-key browse, Escape and return to the clicked photo.

On-photo copy uses white plus a navy scrim. The weakest text-region scrim is 72% navy, with stronger coverage beneath titles; even a light photograph retains readable contrast. Do not place text in the unscreened desktop edge or lighten that scrim without measuring contrast.

### Replacing stand-ins

1. Obtain a generated, licensed/royalty-free or explicitly authorized file. Keep source/permission information.
2. Export an appropriately sized WebP/AVIF/JPEG; avoid committing original camera-sized source binaries.
3. Change the registry entry, not every card. Set true dimensions, meaningful alt, focal point and provenance.
4. Add a very small blur preview if appropriate. Never put a full image in a data URL.
5. For a CDN, configure its exact host in both runtime/build environment and restart/rebuild.
6. Inspect square, portrait and panorama crops in both themes at 360, 768 and 1280 px. Check faces, captions, loading and missing-image behaviour.

## 7. Upload, crop and compression

`ImageUploader` requires an `onComplete(ProcessedImage)` callback. It prepares a photo; that callback decides whether to hold it locally or call a real upload adapter. The showcase never uploads a file or stores it in local storage.

- JPEG/PNG/WebP only, nonempty and at most **12 MiB** input; SVG/GIF/HEIC are rejected with guidance.
- Decoding checks the 40-megapixel ceiling and reports corrupt/unsupported images in friendly language.
- Square, 4:5 and 16:9 shapes; labelled horizontal/vertical focus and zoom sliders, keyboard accessible.
- Shared pure geometry drives crop bounds; native ImageBitmap/canvas re-encoding avoids a heavy crop/compression dependency.
- Output: JPEG, no upscaling, longest edge at most **1600 px**, at most **512 KiB**. Quality/downscaling has a bounded retry loop; unusually small inputs are not promised to shrink further.
- PNG transparency is flattened onto white. Re-encoding removes EXIF/location metadata; it does **not** anonymize visual clues in the picture.
- Local preview, reset/remove/replace, optional `onRemove` notification for consumer-owned results, preparing progress, callback error/retry, and asynchronous version guards.
- Preview URLs are released on replacement/removal/unmount. Generated output preview URLs belong to the callback's consumer.

The dev showcase includes a **Simulate a callback failure** switch, making error/retry testable without inventing a live backend.

```tsx
<ImageUploader
  onComplete={async (prepared) => {
    // Connect a real, validated upload service here when its contract is supplied.
    // Send prepared.file with FormData; do not manually set its Content-Type.
    // Store the returned photo ID/URL, never the File or blob URL in Zustand.
  }}
/>
```

Client checks are convenience, not a security boundary. A real server must inspect bytes, constrain dimensions/size, authorize ownership, sanitize metadata, validate storage URLs and protect private media. Upload progress/cancellation/retention policy must be wired to that server contract, not faked by the local preparation indicator.

## 8. Component inventory and contracts

The six original primitive exports remain compatible. CVA centralizes visual variants; Radix handles appropriate focus/keyboard/overlay semantics. No animation library was added.

| Primitive | Important contract |
| --- | --- |
| Button | `primary`, `secondary`, `ghost`, `danger`, `gold`, `overlay`; 44 px minimum / 48 px large; default `type="button"`; `asChild` for a single link/control |
| Card, Badge | Surface/elevation/padding and semantic tones, with readable status copy |
| Input, Select, Textarea, Field | Native controls; 16 px inputs, named labels, hint/error IDs, invalid/disabled states |
| Avatar, AvatarStack | Image/initials fallback, meaningful identity, overflow count |
| Tabs | Underline or pill; labelled tablist, arrow-key navigation and associated panels |
| Dialog, Sheet | Required title; optional description; focus trap, Escape, close target, optional controlled return-focus ref |
| Dropdown | Keyboard menu, disabled/destructive and checked items, inherited portal theme |
| Tooltip | Optional context, never the only way to understand an action |
| Toast | Bounded queue, polite/urgent announcement semantics, dismiss and swipe; provider installed at root |
| Skeleton | Text, circle and media-card shapes; reduced-motion aware |
| Checkbox, Switch, RadioGroup | Proper names, choice state, generous targets and contextual descriptions |
| Progress, Stepper | Named progress; bounded percentage; current/completed step state |
| Carousel | Native CSS snap/touch, keyboard arrows, explicit controls and live count; no autoplay |
| Chip, FilterBar, SegmentedControl | Pressed/choice state, named grouping and reachable controls |
| Pagination, InfiniteList | Bounded visible page candidates and explicit load more; no automatic endless fetch |
| Rating | Accessible read-only value or radio-like editable choice |
| StatTile, Timeline | Clear labels, secondary facts and status words |
| CalendarCell | Accra-time date label, selected/today state and activity summary |
| EmptyState, ErrorState, LoadingFeed | Illustrated/decorative affordance, next action, friendly retry and content-shaped skeleton |

### Form pattern

`Field` renders the label and descriptions; its native child must receive the corresponding IDs and invalid/required attributes. React Hook Form + Zod owns validation, not the input primitive.

```tsx
<Field id="title" label="Request title" error={errors.title?.message} required>
  <Input
    id="title"
    required
    aria-invalid={!!errors.title}
    aria-describedby={errors.title ? "title-error" : undefined}
    {...register("title")}
  />
</Field>
```

Do not nest a Button inside a Link. Use `<Button asChild><Link ... /></Button>`. Add visible underlines to text-block links: colour difference alone is not sufficient in dark mode.

## 9. Accessibility and responsive behaviour

- One main landmark, structured headings, named navigation and forms. Student loading/not-found boundaries avoid adding another main inside the shell.
- A visible-on-focus skip link, clear focus outlines and logical tab order.
- At least 44 px hit targets; a smaller icon does not mean a smaller button.
- Body and status text pairs are tested at 4.5:1; control boundaries/focus at 3:1 against relevant surfaces.
- ARIA describes state; it does not replace visible wording. Decorative icons are hidden from assistive technology.
- Touch/native scroll remains available. No carousel autoplay or audio autoplay.
- Mobile: one-column flows, horizontal *contained* snap/choice strips when useful. Tablet: avoid squeezing two complex panes into unusable columns. Desktop: 2–3-column content with a readable maximum width.
- Fix the root page, not just a screenshot: no page-width overflow at 360/768/1280. Intentional internal carousel/strip overflow is not a page-layout defect.

The latest Phase 3 production Home measurement is Performance 68 / Accessibility 100: the performance ≥90 target remains open, not a completed acceptance claim. See the test report for run history and the next optimization work.

Automated axe results are not an accessibility certification. The phase report separates browser checks, measured Lighthouse results and remaining manual/assistive-technology work.

### Shell and search (Phase 3)

- One destination source: `config/navigation.ts`, with small typed campus/student group files. Five labelled groups / 24 destinations cover the existing student routes, including the demo campus tools. Detail URLs retain their parent active state.
- Desktop ≥1024px: 17rem expanded / 5.5rem compact rail. The accessible collapse toggle, prepaint width and document/storage-event preference keep layout consistent on reload, across tabs and when storage is denied. Compact mode preserves labelled 44px links and internal scrolling.
- Mobile/tablet: Home, Discover, Tasks, Community plus More. More contains all 24 links and appearance controls in a focus-trapped, scrollable sheet; no destination is hidden from mobile users.
- Header: pending official SRC slot + wordmark on smaller screens; destination context on desktop; a labelled search trigger, theme access, unread notification count and profile avatar. Ama's demo portrait is the existing fictional generated registry asset, not a verified person's photograph.
- Cmd/Ctrl+K opens/toggles global search. The combobox uses arrow keys/Enter, visible selected results, clear and category controls, live count/loading feedback, a valid empty state and real data retry. Escape returns focus; actual route changes focus main without stealing the scroll position.
- Query debounce 225ms; prior work is aborted and stale replies ignored. No persistent search history. Pages work without content requests for short/empty input; content searches use seven typed service collections.
- Closed More/search code is deferred until first use, then stays mounted while closed for focus cleanup. Only one overlay is active. Loading can be cancelled without a late-open surprise. A failed code download offers an explicit **Reload page** (save any changes first); data failures retry without a reload.
- `/design`'s navigation section includes controlled error/partial/slow search previews. These are labelled development fixtures, not live-backend proof; production `/design` and subpaths remain strict 404s.

The 222-route regression plus 31 targeted shell/search/feedback captures found no final axe violations or page-width overflow. Every screen was visually reviewed at 360/1280 in both themes; tablet metrics and shell screenshots were also checked. Accessibility automation does not replace a screen-reader/device review.

## 10. Services, metadata and deployment

UI imports the public `@/services` boundary, never `@/data/demo`. `campusService` is the new asynchronous typed catalog for list/detail consumers; old synchronous exports remain explicitly demo-only until their feature migrations. API/catalog implementations load on demand so legacy Home does not eagerly download unused API schemas.

- Default mode: `NEXT_PUBLIC_DATA_SOURCE=demo`.
- Default browser base: `/api`, not browser-localhost.
- Next forwards unmatched API routes to server-only `API_PROXY_TARGET`, default `http://127.0.0.1:4000`.
- Existing `/api/health` stays a database-health route and is not shadowed by the proxy.
- Requests validate responses with Zod, preserve headers, carry abort signals/credentials, and report HTTP/offline/invalid-response errors without exposing upstream internals.
- Authenticated Server Components must forward the incoming session cookie deliberately; browser cookies are not automatically forwarded by server fetch.
- Existing route URLs are preserved. Route titles/descriptions/Open Graph are centralized; detail titles use the current typed service data.
- Configure a **real** `NEXT_PUBLIC_APP_URL` to enable absolute social-preview image URLs. No deployment hostname was invented. Student/demo pages default to noindex.

See [API integration guide](API_INTEGRATION_GUIDE.md) for proposed endpoint envelopes, switching/adapting a service, cookie/security requirements and the current compatibility limitation.

`.env*` files are never committed. `config/env.example` is the versioned safe template. Run `npm run env:example` to generate an ignored `.env.example`, then configure an ignored `.env.local`. The generator does not overwrite an existing file.

## 11. Showcase and verification

Run `npm run dev -- --hostname 0.0.0.0 --port 3000`, then open **`/design`**. Its eight sections expose the tokens, font pair, media shapes/compositions, interactive controls, navigation/overlays, progress/data, feedback states and upload pipeline.

Production deliberately returns **HTTP 404** for `/design` and its subpaths. The page guard is backed by a narrowly matched Next 16 proxy guard because `notFound()` behind a streaming loading boundary can otherwise send HTTP 200 first.

```bash
npm run lint
npm run typecheck
npm run test:foundation
npm run test:shell
npm run build
# In another shell, after the build:
npm run start -- --hostname 0.0.0.0 --port 3001
```

Browser tools are isolated from app dependencies in ignored `.cache/design-audit/tooling`:

```bash
npm install --prefix .cache/design-audit/tooling --no-audit --no-fund \
  playwright@1.64.0 @sparticuz/chromium@153.0.0 \
  @axe-core/playwright@4.13.0 lighthouse@13.5.0
node scripts/phase2-audit.mjs
node scripts/phase3-audit.mjs
node scripts/phase2/proxy.mjs
AUDIT_BASE_URL=http://127.0.0.1:3001 \
  AUDIT_OUTPUT_DIR=.cache/phase3/routes node scripts/design-audit.mjs
AUDIT_BASE_URL=http://127.0.0.1:3001 \
  AUDIT_OUTPUT_DIR=.cache/phase2/regression node scripts/audit/interactions.mjs
AUDIT_BASE_URL=http://127.0.0.1:3001 \
  AUDIT_OUTPUT_DIR=.cache/phase2/performance node scripts/audit/lighthouse.mjs
```

Foundation tests use Node 22.15+ native type stripping and built-in `node:test`; no application testing/crop/animation dependency was added. The proxy test is a temporary port-4000 fixture, **not proof of real API or database connectivity**. Keep screenshots, traces, large intermediates and test image binaries out of Git. Re-run Lighthouse sequentially against a production build; never claim a score that was not measured.

## 12. Phase boundary

Phase 2 supplies the reusable foundation and applies semantic themes to the legacy screens. It does not claim the whole product is now redesigned. Phase 3 implements the grouped/collapsible shell and global search; magazine Home is Phase 4; photo-led auth/onboarding is Phase 5; photo-rich feature/detail flows, expanded 12–30-item feeds, real calendar/ICS/GPA interactions and remaining feature work follow in Phase 6. Secure auth, uploads, real-time messaging, payments, AI and official academic authority remain unconnected integrations.

## Phase 4 magazine Home

Home applies the foundation without replacing the palette or inventing SRC artwork: an editorial greeting, conditional ads/video, large Clubs photo/scrim, 160px snap tiles, external portal cards, native task progress, and photo event/deadline cards. Manrope + Fraunces remain the distinctive next/font pairing. Native transitions, focus and reduced-motion rules are retained; no animation/media dependency was added.

Five new fictional generated scenes: `clubsHero` (1376×768, 141,886B), `studyCorner` (1000×558, 58,336B), `innovationNight` (1000×558, 76,564B), `campusLiving` (1000×558, 105,576B), `campusMarket` (1000×558, 77,976B). Together with Phase 2 assets, generated WebPs total **626,572B**. They are not real GCTU people, an actual event or a listed property. Registry alt/provenance/source notes and visible captions retain that distinction. Raw generation files stay ignored.

`mediaPause` is a **20,018B** still from the local MDN CC0 flower clip, not a generated campus film. The 960×540 / ~5.06s / 554,058B WebM, English visual-description track and text alternative are labelled as a licensed sample; attribution/full CC0 text live in `public/media/demo/`. No clip/caption bytes load before Play, and nothing autoplays.

The header appearance control opens its intent-loaded dropdown on the first click; dropdown content references its visible label (rather than the changing trigger name), and the menu is nonmodal so the underlying page is not aria-hidden with focusable descendants. Theme bootstrap/system/reload/cross-tab behavior stays eager and unchanged. The first toast loads the Radix renderer; code failure uses a native dismissible live status/alert. Task undo is persistent inline feedback with restored keyboard focus, not an action that disappears with the toast.

A native browser may reserve Escape for its video-control shadow UI. Keyboard users can reach the application Close button; Escape from dialog-owned controls closes the preview and restores the launch button. Fullscreen/OS-native media behavior and device-specific playback still need manual cross-browser validation.

See [Phase 4 Home](PHASE4_HOME.md) and the [test report](TEST_REPORT.md) for selection, data, visual checks and measured performance limits.

## Phase 5 photo-led forms and introduction

`AuthLayout`/`PhotoStory` reuse Manrope/Fraunces, semantic surfaces, brand actions, a dark media scrim and the real pending-logo slot. Existing generated `campusLife`, `studyCorner`, `clubsHero` and `innovationNight` registry stories are explicitly illustrative, never institutional evidence. No palette copy, component hex, new font/animation/image dependency or fabricated SRC mark was introduced.

At desktop the reserved photo frame sits beside readable fields; at narrow widths it precedes the form. Absolute full-size/aspect-auto image utilities and inherited content minimum height keep the photo and editorial copy together; native geometry assertions accompany screenshot review because overflow checks alone missed an early stacking defect. Five intro steps expose textual/visual progress, sensible Back/Continue/Skip actions and optional profile setup without pretending to verify enrollment.

Required fields have associated Zod/RHF errors and first-error focus. Password reveal/hide has an accessible changing action name. Pending actions disable duplicate submission and expose cancellation/status; failures retain inputs with resubmit or reconnect/save/reload guidance. Roles are a labelled local demo switch, absent in API mode. Recovery explicitly distinguishes no-email preview from request acceptance.

Portrait choices are labelled keyboard radio controls. The optional local photo editor is intent-loaded, trapped/named, Escape-closeable with return focus, and shares the foundation crop/compression/error primitives. Cancellation ignores late code delivery; failed code has truthful reload recovery. Output is an ephemeral visit avatar, not a server upload or durable attachment; files/blob/data URLs are not persisted.

Light/dark/system and reduced motion stay semantic. The production auth suite records **105 WCAG A/AA + 2.1 AA captures** with zero overflow/sub-44px flags at 360/768/1280; manual 360/1280 light/dark sheets and individual editor/story checks cover composition. All 222 preserved route variants / 74 route AA analyses also pass. See [Phase 5](PHASE5_AUTH_ONBOARDING.md) for privacy/API boundaries and [test report](TEST_REPORT.md) for honest performance/backend/device caveats.

## Phase 6A Clubs composition

The magazine direction extends to sixteen photo communities: a people-first hero, seven readable interest groups, six-card pages and a detail story/facts/crew/gallery hierarchy. `clubs.css` only uses semantic tokens and responsive geometry. Compact/full facts are valid definition lists; card bodies stretch their footer actions to a consistent row baseline. Cover/save overlays use explicit stacking. On mobile, membership controls sit above—not on—the persistent nav, and content has end padding for reachable gallery actions.

Five new fictional activity photos use centralized alt/provenance/dimensions/focal points and raster blur, 1200×675 WebP sources (526,288 bytes total), responsive Next images and quality-60 card requests. They are not actual GCTU photos; existing authorized SRC slot remains empty. Gallery/lightbox and RHF/Zod/Radix controls reuse the kit without a runtime library addition. Request consent/fee/member/approval copy distinguishes demo from a supplied API listing and never implies a real payment or enrollment.

Clubs' 203 AA/layout/44px captures include 360/768/1280 light/dark detail geometry, keyboard/focus/dialog/gallery behavior, honest empty/error/retry/visit-only states and controlled API failures. The initial nested definition-list violation was corrected without disabling rules; unknown catalog totals remain unavailable, not fake zero. See [Phase 6A](PHASE6A_CLUBS.md).
