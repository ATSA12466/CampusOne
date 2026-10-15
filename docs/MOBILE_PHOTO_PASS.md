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
node scripts/mobile-tests.mjs      # 28 structural + 12 media assertions, all pass
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
10. home keeps the web composition order, shortcut copy and artwork.

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
* Not yet photo-led: messages/threads, notifications, tasks, timetable/calendar,
  attendance, badges, SRC forms, study assistant, exec/admin tools. They are the
  next screens in the pass (they are list/utility surfaces with little or no
  imagery on the web either).
