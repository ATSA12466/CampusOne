// Media-layer audit for the Flutter app (no Flutter SDK required).
//
// The picture-first rewrite is only honest if the app can load the artwork it
// references, if stand-ins are labelled, and if every data-bearing screen goes
// through the shared media widgets instead of hand-rolling its own image code.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const mobile = join(root, "mobile");
const lib = join(mobile, "lib");

function dartFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...dartFiles(full));
    else if (entry.endsWith(".dart")) out.push(full);
  }
  return out.sort();
}

const files = dartFiles(lib);
const read = (file) => readFileSync(file, "utf8");
const relative = (file) => file.slice(root.length);
const find = (suffix) => files.find((file) => relative(file).endsWith(suffix));

test("every demo image the app references exists on the server", () => {
  const source = read(join(lib, "src/core/media/demo_images.dart"));
  const refs = [...source.matchAll(/src: '\/(images\/[^']+)'/g)].map((m) => m[1]);
  assert.ok(refs.length >= 19, `expected the full demo set, found ${refs.length}`);
  // `intentionally-unavailable.webp` is a deliberate dangling reference (it is
  // what proves the stand-in frame works) and exists on neither client.
  const missing = refs.filter(
    (ref) =>
      !ref.includes("intentionally-unavailable") &&
      !existsSync(join(root, "public", ref)),
  );
  assert.deepEqual(missing, [], `missing artwork: ${missing.join(", ")}`);
});

test("demo artwork mirrors the web catalogue exactly", () => {
  const web = read(join(root, "src/config/images.ts"));
  const webSrcs = new Set(
    [...web.matchAll(/src: "(\/images\/demo\/[^"]+)"/g)].map((m) => m[1]),
  );
  const app = read(join(lib, "src/core/media/demo_images.dart"));
  const appSrcs = [...app.matchAll(/src: '(\/images\/demo\/[^']+)'/g)].map((m) => m[1]);
  assert.ok(appSrcs.length >= 19);
  const unknown = appSrcs.filter((src) => !webSrcs.has(src));
  assert.deepEqual(unknown, [], `app references artwork the web does not define: ${unknown}`);
  // The placeholder key is intentionally unused in the app's curated set.
  const unused = [...webSrcs].filter((src) => !appSrcs.includes(src));
  assert.ok(
    unused.every((src) => src.includes("intentionally-unavailable")),
    `web artwork not mirrored in the app: ${unused.join(", ")}`,
  );
});

test("every demo image declares provenance and alt text", () => {
  const source = read(join(lib, "src/core/media/demo_images.dart"));
  const blocks = source.split(/static const \w+ = CampusMedia\(/).slice(1);
  assert.ok(blocks.length >= 19, `found ${blocks.length} image definitions`);
  for (const block of blocks) {
    assert.match(block, /provenance: MediaProvenance\./, "missing provenance");
    assert.match(block, /alt:/, "missing alt text");
  }
});

test("media resolution policy rejects unsafe sources", () => {
  const source = read(join(lib, "src/core/media/media_resolver.dart"));
  // Guards that must exist in the resolver.
  for (const guard of [
    "_control.hasMatch(src)",
    "src.startsWith('//')",
    "_dotSegment.hasMatch(path)",
    "uri.scheme != 'https'",
    "uri.userInfo.isNotEmpty || uri.hasPort",
    "allowedHosts.contains(uri.host.toLowerCase())",
  ]) {
    assert.ok(source.includes(guard), `resolver is missing guard: ${guard}`);
  }
  assert.ok(
    source.includes("configuredImageHosts"),
    "resolver must use the built-time host allow-list",
  );
});

test("data-URI photos are decoded instead of fetched", () => {
  const source = read(join(lib, "src/core/media/campus_image.dart"));
  assert.ok(source.includes("isDataUri"), "campus image must detect data URIs");
  assert.ok(source.includes("base64Decode"), "data URIs must be base64-decoded");
});

test("photo frames keep loading, failure and provenance behaviour", () => {
  const source = read(join(lib, "src/core/media/campus_image.dart"));
  assert.ok(source.includes("Photo coming soon"), "missing stand-in frame");
  assert.ok(source.includes("_PulseSkeleton"), "missing loading skeleton");
  assert.ok(source.includes("disableAnimations"), "reduced motion must be honoured");
  assert.ok(source.includes("_PlaceholderChip"), "placeholder badge must survive");
  const hero = read(join(lib, "src/core/media/media_blocks.dart"));
  assert.ok(
    hero.includes("Generated demo imagery · not an actual campus photograph"),
    "generated hero imagery must be labelled",
  );
});

test("image loading is centralised in the media layer", () => {
  const allowed = new Set([
    "lib/src/core/media/campus_image.dart",
    "lib/src/features/onboarding/welcome_screen.dart",
    "lib/src/features/listings/photo_record_editor.dart",
  ]);
  const offenders = [];
  for (const file of files) {
    const rel = relative(file).replace("mobile/", "");
    if (allowed.has(rel)) continue;
    const source = read(file);
    if (/Image\.network\(|NetworkImage\(|Image\.asset\(/.test(source)) {
      offenders.push(rel);
    }
  }
  assert.deepEqual(
    offenders,
    [],
    `screens must use CampusImage instead of raw image widgets: ${offenders.join(", ")}`,
  );
});

test("every record-bearing screen shows pictures", () => {
  for (const screen of [
    "lib/src/features/home/home_screen.dart",
    "lib/src/features/clubs/clubs_screen.dart",
    "lib/src/features/clubs/club_detail_screen.dart",
    "lib/src/features/events/events_screen.dart",
    "lib/src/features/events/event_detail_screen.dart",
    "lib/src/features/catalog/announcements_screen.dart",
    "lib/src/features/catalog/accommodation_screen.dart",
    "lib/src/features/catalog/materials_screen.dart",
    "lib/src/features/listings/domain_list_screen.dart",
    "lib/src/features/listings/listing_detail_screen.dart",
    "lib/src/features/discover/discover_screen.dart",
    "lib/src/features/saved/saved_screen.dart",
    "lib/src/features/community/community_screen.dart",
    "lib/src/features/profile/profile_screen.dart",
    "lib/src/features/more/more_screen.dart",
    "lib/src/features/notifications/notifications_screen.dart",
    "lib/src/features/tasks/tasks_screen.dart",
    "lib/src/features/schedule/timetable_screen.dart",
    "lib/src/features/schedule/calendar_screen.dart",
    "lib/src/features/messages/conversations_screen.dart",
    "lib/src/features/attendance/attendance_history_screen.dart",
    "lib/src/features/badges/badges_screen.dart",
    "lib/src/features/study/study_assistant_screen.dart",
    "lib/src/features/freshers/freshers_screen.dart",
    "lib/src/features/enquiries/enquiries_screen.dart",
    "lib/src/features/executives/executives_screen.dart",
    "lib/src/features/executives/manage_hub_screen.dart",
    "lib/src/features/impact/my_impact_screen.dart",
    "lib/src/features/academics/gpa_screen.dart",
    "lib/src/features/academics/study_notes_screen.dart",
    "lib/src/features/src_forms/src_request_screen.dart",
    "lib/src/features/settings/server_settings_screen.dart",
  ]) {
    const file = join(mobile, screen);
    assert.ok(existsSync(file), `missing ${screen}`);
    const source = read(file);
    assert.match(
      source,
      /CampusImage|MediaCard|PhotoTile|HeroBanner|CampusAvatar|GalleryStrip|PhotoScaffold|PhotoPage|ClubsHeroCard|QuickActionsRow|EventFeatureCard|EventRow|AnnouncementRow|home_cards\.dart/,
      `${screen} has no photo surface`,
    );
    const delegates = screen.includes("home/home_screen.dart");
    if (!delegates) {
      assert.ok(
        source.includes("core/media/media.dart"),
        `${screen} must use the shared media layer`,
      );
    }
  }
  const homeCards = read(join(mobile, "lib/src/features/home/widgets/home_cards.dart"));
  assert.match(homeCards, /HeroBanner|PhotoTile|CampusImage|CampusImageFill/);
});

test("models parse the photos the API sends", () => {
  const catalog = read(join(lib, "src/features/catalog/catalog_repository.dart"));
  for (const field of ["details['cover']", "details['gallery']", "details['coverAlt']"]) {
    assert.ok(catalog.includes(field), `catalog must parse ${field}`);
  }
  const listings = read(join(lib, "src/features/listings/listings_repository.dart"));
  assert.ok(listings.includes("final CampusMedia? photo"), "listings need a lead photo");
  assert.ok(listings.includes("gallery"), "listings need a gallery");
});

test("home mirrors the web composition order", () => {
  const source = read(join(mobile, "lib/src/features/home/home_screen.dart"));
  const order = [
    "WelcomeHeader",
    "FeaturedCarousel",
    "ClubsHeroCard",
    "CheckInBanner",
    "TodayOverviewCard",
    "QuickActionsRow",
    "InstitutionalLinksCard",
    "EventFeatureCard",
    "AnnouncementRow",
  ];
  let cursor = -1;
  for (const widget of order) {
    const index = source.indexOf(widget);
    assert.ok(index > cursor, `home is out of order at ${widget}`);
    cursor = index;
  }
});

test("home shortcuts keep the web titles, descriptions and artwork", () => {
  const source = read(join(mobile, "lib/src/features/home/home_screen.dart"));
  const shortcuts = [
    ["'Events'", "'Be part of the moment'", "DemoImages.innovationNight"],
    ["'Learn'", "'A little head start'", "DemoImages.studyCorner"],
    ["'Opportunities'", "'Your next chapter'", "DemoImages.campusLife"],
    ["'Find a room'", "'Make yourself at home'", "DemoImages.campusLiving"],
    ["'Marketplace'", "'Good finds, closer'", "DemoImages.campusMarket"],
    ["'Discover'", "'Take a different turn'", "DemoImages.clubsHero"],
  ];
  for (const [title, description, image] of shortcuts) {
    for (const token of [title, description, image]) {
      assert.ok(source.includes(token), `home shortcut missing ${token}`);
    }
  }
});

test("clubs hero states its artwork is fictional", () => {
  const source = read(join(mobile, "lib/src/features/home/widgets/home_cards.dart"));
  assert.ok(source.includes("demo communities to explore"));
  assert.ok(source.includes("Generated imagery · fictional students"));
});

test("every student screen opens with the magazine photo band", () => {
  const screens = [
    "lib/src/features/notifications/notifications_screen.dart",
    "lib/src/features/tasks/tasks_screen.dart",
    "lib/src/features/schedule/timetable_screen.dart",
    "lib/src/features/schedule/calendar_screen.dart",
    "lib/src/features/messages/conversations_screen.dart",
    "lib/src/features/attendance/attendance_history_screen.dart",
    "lib/src/features/badges/badges_screen.dart",
    "lib/src/features/settings/server_settings_screen.dart",
    "lib/src/features/study/study_assistant_screen.dart",
    "lib/src/features/freshers/freshers_screen.dart",
    "lib/src/features/enquiries/enquiries_screen.dart",
    "lib/src/features/executives/executives_screen.dart",
    "lib/src/features/executives/manage_hub_screen.dart",
    "lib/src/features/impact/my_impact_screen.dart",
    "lib/src/features/academics/gpa_screen.dart",
    "lib/src/features/academics/study_notes_screen.dart",
    "lib/src/features/src_forms/src_request_screen.dart",
    "lib/src/features/clubs/clubs_screen.dart",
    "lib/src/features/events/events_screen.dart",
    "lib/src/features/discover/discover_screen.dart",
    "lib/src/features/community/community_screen.dart",
    "lib/src/features/catalog/accommodation_screen.dart",
    "lib/src/features/catalog/announcements_screen.dart",
    "lib/src/features/catalog/materials_screen.dart",
    "lib/src/features/catalog/src_office_screen.dart",
    "lib/src/features/profile/profile_screen.dart",
    "lib/src/features/more/more_screen.dart",
    "lib/src/features/listings/domain_list_screen.dart",
  ];
  for (const screen of screens) {
    const source = read(join(mobile, screen));
    assert.match(
      source,
      /PhotoScaffold\(|HeroBanner\(|PhotoPage\(/,
      `${screen} does not open with a photo band`,
    );
    const header = read(join(mobile, "lib/src/core/media/media_blocks.dart"));
    assert.ok(
      header.includes("class PhotoScaffold") &&
        header.includes("class PhotoPageHeader") &&
        header.includes("class PhotoPage"),
      "the shared photo page primitives are missing",
    );
  }
});

test("screen headers reuse the web's own copy", () => {
  const pairs = [
    ["src/features/notifications/index.tsx", "lib/src/features/notifications/notifications_screen.dart"],
    ["src/features/tasks/index.tsx", "lib/src/features/tasks/tasks_screen.dart"],
    ["src/features/timetable/index.tsx", "lib/src/features/schedule/timetable_screen.dart"],
    ["src/features/calendar/index.tsx", "lib/src/features/schedule/calendar_screen.dart"],
    ["src/features/messages/index.tsx", "lib/src/features/messages/conversations_screen.dart"],
    ["src/features/participation/index.tsx", "lib/src/features/attendance/attendance_history_screen.dart"],
    ["src/features/study-assistant/index.tsx", "lib/src/features/study/study_assistant_screen.dart"],
    ["src/features/freshers/index.tsx", "lib/src/features/freshers/freshers_screen.dart"],
    ["src/features/src-office/index.tsx", "lib/src/features/catalog/src_office_screen.dart"],
    ["src/features/community/index.tsx", "lib/src/features/community/community_screen.dart"],
    ["src/features/announcements/index.tsx", "lib/src/features/catalog/announcements_screen.dart"],
    ["src/features/profile/index.tsx", "lib/src/features/profile/profile_screen.dart"],
    ["src/features/management/index.tsx", "lib/src/features/executives/executives_screen.dart"],
  ];
  for (const [webPath, dartPath] of pairs) {
    const web = read(join(root, webPath));
    const dart = read(join(mobile, dartPath)).replaceAll("\\'", "'");
    const header = web.match(/<MagazineHeader[\s\S]*?\/>/);
    assert.ok(header, `${webPath} has no MagazineHeader to mirror`);
    const props = [...header[0].matchAll(/(?:eyebrow|title|description)="([^"]{4,})"/g)].map(
      (m) => m[1].replaceAll("&apos;", "'").replaceAll("&amp;", "&"),
    );
    assert.ok(props.length >= 3, `${webPath} header props not parsed`);
    for (const copy of props) {
      assert.ok(dart.includes(copy), `${dartPath} is missing the web copy: ${copy}`);
    }
  }
  // The directory heroes carry their copy in JSX text rather than props.
  const clubs = read(join(mobile, "lib/src/features/clubs/clubs_screen.dart")).replaceAll("\\'", "'");
  assert.ok(clubs.includes("Find your people."));
  assert.ok(clubs.includes("For the ideas you want to try. And the friends you haven't met yet."));
  const events = read(join(mobile, "lib/src/features/events/events_screen.dart")).replaceAll("\\'", "'");
  assert.ok(events.includes("Find your next good plan."));
  assert.ok(events.includes("For the ideas, the music and the people you haven't met yet."));
  const discover = read(join(mobile, "lib/src/features/discover/discover_screen.dart")).replaceAll("\\'", "'");
  assert.ok(discover.includes("A little curiosity goes a long way."));
  assert.ok(discover.includes("Your next community, good idea or useful find. Take a look around."));
  const domains = read(join(mobile, "lib/src/features/listings/domain_list_screen.dart")).replaceAll("\\'", "'");
  for (const copy of [
    "Good finds. New beginnings.",
    "Useful things, passed from one student to another.",
    "Your next door is open.",
    "A little help finding home.",
    "Listen. Look. Find a new perspective.",
    "Good ideas deserve a little space.",
  ]) {
    assert.ok(domains.includes(copy), `domain heroes are missing: ${copy}`);
  }
});

test("home offers the two official GCTU portals exactly as the web does", () => {
  const cards = read(join(mobile, "lib/src/features/home/widgets/home_cards.dart"));
  const home = read(join(mobile, "lib/src/features/home/home_screen.dart"));
  const web = read(join(root, "src/config/home.ts"));
  for (const token of ["https://lms.gctu.edu.gh/", "https://sip.gctu.edu.gh/"]) {
    assert.ok(web.includes(token), `web config lost ${token}`);
    assert.ok(cards.includes(token), `app is missing ${token}`);
  }
  for (const copy of ["GCTU LMS", "Course materials & assignments", "Student portal", "GCTU SIP · registration & results"]) {
    assert.ok(cards.includes(copy), `portal card is missing: ${copy}`);
  }
  assert.ok(home.includes("InstitutionalLinksCard"), "home does not render the portal card");
  assert.ok(home.includes("openExternalLink"), "portal links must open outside the app");
});
