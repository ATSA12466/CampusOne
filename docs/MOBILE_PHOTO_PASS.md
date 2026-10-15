# Flutter photo-parity pass — what changed and what is verified

Goal: make the Flutter app compose the same pictures in the same places as the
web student app, screen by screen, without inventing campus photography or
duplicating image code in every screen.

## 1. New shared media layer

`mobile/lib/src/core/media/` (barrel: `media.dart`)

| File | Mirrors | Responsibility |
|---|---|---|
| `campus_media.dart` | `src/types/media.ts` | `CampusMedia` + provenance (`placeholder` / `generated` / `licensed` / `upload`), focal point, alt text, resilient parsing of string-or-object payloads |
| `media_resolver.dart` | `src/config/image-policy.ts` | Decides what may load: relative same-server paths yes, `//host` no, `../` no, control chars no, absolute URLs must be https, credential-free, port-free and on an allow-listed host; `data:image/*` handled separately |
| `media_hosts.dart` | `NEXT_PUBLIC_IMAGE_HOSTS` | Default allow-list + `--dart-define=CAMPUSONE_IMAGE_HOSTS=…` extension, plus generated stand-ins |
| `campus_image.dart` | `src/components/media/campus-image.tsx` | Framed photo: aspect box (`square…panorama`), skeleton while loading, brand-gradient "Photo coming soon" stand-in on failure, "Placeholder" chip, reduced-motion aware, `data:` photos decoded in-memory with a bounded cache |
| `photo_scrim.dart` | `foundation.css` scrim utilities | Photo scrim (top-down) and hero scrim (left-right at ≥600dp), brand gradient `#0B2545 → #003399` |
| `media_blocks.dart` | `hero-banner`, `photo-tile`, `media-card`, `gallery`, `avatar` | `HeroBanner`, `PhotoTile`, `MediaCard` (+`MediaFact`), `GalleryStrip`, `CampusAvatar`, `EyebrowBadge` |
| `demo_images.dart` | `src/config/images.ts` | All 20 bundled images with the web's exact sources, alt text and provenance, plus `byCategory` / `forCategory()` artwork selection |

Theme tokens now match the web radii (controls 14, cards 20, media 24, pills)
and use the web dark-mode brand tint.

## 2. Screens made photo-led

* **Home** — rebuilt in the web's order: welcome header (greeting + Accra date) →
  "On the campus radar" featured carousel → clubs hero ("Find your people.",
  fictional-faces credit) → native QR check-in banner → "A little plan. A good
  day." (next class + task progress, which the parity audit had listed as
  missing) → photo shortcut strip (same six shortcuts, titles, descriptions and
  artwork as `src/config/home.ts`) → upcoming events → announcements → explore
  chips.
* **Clubs / Events directories** — `MediaCard` list items with cover art and
  facts (members, meeting, venue / when, venue, seats, price), category artwork
  fallback.
* **Club detail** — panorama cover, tagline, highlights, story, leads with
  avatars, photo gallery strip.
* **Event detail** — panorama cover, highlights, programme, hosts & speakers,
  gallery strip.
* **Directory domains** (marketplace, accommodation, opportunities, resources,
  media, lost & found, courses, campaigns) — `MediaCard` rows with per-domain
  artwork; detail pages get a panorama cover and a gallery when one exists.
* **Announcements, Search/Discover, Saved, Community, Profile, More** — photo
  rows, collection artwork, post photos (including `data:` uploads), avatar
  header, and a photo hub on More.
* **Data models** — `Club`, `EventItem`, `Announcement`, `ListingItem`,
  `MaterialItem`, `Representative`, `SrcProject` and `FeaturedItem` now parse the
  cover/gallery/avatar fields the API already returns.

## 3. Verification actually run

```bash
node scripts/mobile-tests.mjs      # 28 structural + 15 media assertions, all pass
node scripts/run-native-tests.mjs  # all 16 isolated native suites pass
```

`scripts/mobile/mobile-media.test.mjs` (new) asserts:

1. every referenced demo file exists under `public/images/demo/`;
2. the app's artwork mirrors `src/config/images.ts` with no invented files;
3. every definition declares provenance + alt text;
4. the resolver keeps its traversal / protocol-relative / scheme / host guards;
5. `data:` photos are decoded, not fetched;
6. the stand-in frame, skeleton, placeholder chip and reduced-motion paths exist,
   and generated hero imagery stays labelled;
7. image loading is centralised (only the media layer, onboarding and the photo
   editor may build raw image widgets);
8. every record-bearing screen has a photo surface;
9. models parse the cover/gallery fields the API sends;
10. home keeps the web composition order, shortcut copy and artwork;
11. every student screen opens with the magazine photo band
    (`PhotoScaffold`/`HeroBanner`/`PhotoPage`);
12. screen headers reuse the web's own copy — the audit reads the eye brows,
    titles and descriptions straight out of the web `MagazineHeader` props (and
    the clubs/events/discover directory heroes) and fails if a Dart screen does
    not carry the same wording;
13. home offers the same two official GCTU portals as the web, with the same
    labels, descriptions and https targets.

## 3a. Photo-opening pass (2026-10-15)

Every student route on the web opens with a picture: `MagazineHeader` on most
screens, a feature directory hero on clubs/events/discover, and the
`listingConfig` header on the catalog domains. The app now mirrors that.

* New shared primitives in `mobile/lib/src/core/media/media_blocks.dart`:
  `PhotoPage`, `PhotoPageHeader` (232px photo band, eyebrow, display title,
  description, generated-imagery line) and `PhotoScaffold` (app bar + floating
  action button + photo band above the screen's own body, which keeps scrolling
  and refreshing exactly as before).
* 28 screens now open with the band and the web's wording: home portals,
  notifications, tasks, timetable, calendar, messages, attendance history,
  badges, study assistant, freshers, enquiries, executives, manage hub, impact,
  GPA, study notes, SRC requests, clubs, events, discover, community,
  accommodation, announcements, materials, SRC office, profile, more and the
  shared catalog list (marketplace, opportunities, lost & found, media,
  courses, campaigns inherit it through `DomainListScreen`).
* Badges is the one screen without a web counterpart of its own (the web folds
  it into /participation), so it reuses that eyebrow with its own honest line:
  "Every badge is tied to a verified ticket check-in, so nothing here is claimed
  on your behalf." The Server screen likewise keeps mobile-only wording, because
  pointing the app at a backend has no web equivalent.
* Screens with no band on purpose: the message thread, QR scanner and live
  check-in, session detail, executive management sheets and the student report
  screen. They are utility surfaces where the corresponding web screen has no
  header photo either.
* The auth and welcome screens are photo-led too, but with the web's own
  pictures rather than the band: `AuthStoryPanel` carries `src/config/auth.ts`
  (story image, eyebrow, title, description, "Generated demo scene" caption) on
  sign-in, register and reset, and each welcome-tour slide shows a labelled demo
  scene.
* The brand mark is the council's crest (see the brand-icons note below), with
  no tile or frame drawn around it on either client.

## 4. Not verified here (honest limits)

* **No Flutter SDK in this sandbox** — `flutter analyze`, `flutter test` and any
  build were **not** run; the audits above are source-level, not compilation.
  Run `flutter pub get && flutter analyze && flutter test` on a machine with the
  SDK before trusting the pass.
* No device/emulator run, so scrolling, tablet breakpoints and photo loading over
  a real network are unverified on hardware.
* The bundled artwork is AI-generated demo material; nothing here claims GCTU
  photography. Records without a photo intentionally show collection artwork
  labelled as demo imagery.
* The photo band is fixed above each screen's own scrolling content rather than
  scrolling away with it (the web hero scrolls with the page). On a short phone
  the band costs ~232px of list height. Worth revisiting once a device run is
  possible.
* Header copy is asserted against the web source strings, not against a
  rendered screenshot, so line wrapping and type scale on the band are
  unverified until `flutter analyze`/device runs happen.
* Still without a band by design (see §3a), and the next surfaces for the pass:
  the message thread header, QR/live check-in screens, and the photo record
  editor.

## 5. Brand artwork (2026-10-15)

The council supplied `SRCLogo.png` (crest, transparent) and
`campusone_app_icon.png` (crest on the CampusOne gradient). Both masters stay at
the repository root untouched; `node scripts/brand-icons.mjs` scales them into
the Android legacy icons (48/72/96/144/192), the Android adaptive foregrounds
(108/162/216/324/432 with the crest inside the safe zone over `#0B2545`), the
full iOS icon set, `mobile/assets/{icon-1024,src-crest}.png` and
`public/brand/{favicon-32,apple-touch-icon-180,app-icon-512,src-crest-512}.png`.

`BrandMark` (web) and `CampusBrandMark`/`CrestMark` (app,
`mobile/lib/src/core/brand/brand_mark.dart`) are the only places that load the
artwork, and neither draws a tile, border or background behind it. Sizes are
asserted on every platform, so a bad regeneration fails the suite rather than
shipping a wrong icon.
