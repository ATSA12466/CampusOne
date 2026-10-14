// Structural audit of the Flutter app. Runs without the Flutter SDK: it parses
// the Dart sources as text and asserts the cross-file contracts a compiler
// would otherwise catch (imports, endpoint registry, repo surfaces, app IDs).
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, normalize } from "node:path";
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
const sources = new Map(files.map((f) => [f, readFileSync(f, "utf8")]));

// Strip // comments, /* */ comments and '...'/"..." literals (with escapes)
// so delimiter counting only sees code structure.
function stripCode(src) {
  let out = "";
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === "/" && src[i + 1] === "/") {
      const end = src.indexOf("\n", i);
      i = end < 0 ? src.length : end;
    } else if (c === "/" && src[i + 1] === "*") {
      const end = src.indexOf("*/", i + 2);
      i = end < 0 ? src.length : end + 2;
    } else if (c === "'" || c === '"') {
      const quote = c;
      i += 1;
      while (i < src.length) {
        if (src[i] === "\\") {
          i += 2;
          continue;
        }
        if (src[i] === quote) {
          i += 1;
          break;
        }
        if (src[i] === "\n") break;
        i += 1;
      }
      out += '""';
    } else {
      out += c;
      i += 1;
    }
  }
  return out;
}

test("Dart inventory is intact", () => {
  assert.ok(files.length >= 40, `expected the full app, found ${files.length} files`);
  for (const required of [
    "lib/main.dart",
    "lib/src/app/app_shell.dart",
    "lib/src/core/api/api_client.dart",
    "lib/src/core/api/api_paths.dart",
    "lib/src/core/auth/auth_session.dart",
  ]) {
    assert.ok(existsSync(join(mobile, required)), `missing ${required}`);
  }
});

test("relative Dart imports resolve", () => {
  const missing = [];
  for (const [file, src] of sources) {
    for (const match of src.matchAll(/^import '(\.[^']+)'/gm)) {
      const target = normalize(join(dirname(file), match[1]));
      if (!existsSync(target)) missing.push(`${file}: ${match[1]}`);
    }
  }
  assert.deepEqual(missing, []);
});

test("ApiPaths references resolve with matching arity", () => {
  const registry = readFileSync(join(lib, "src/core/api/api_paths.dart"), "utf8");
  const defined = new Set([
    ...[...registry.matchAll(/static (?:const|String) (\w+)/g)].map((m) => m[1]),
  ]);
  const arity = new Map(
    [...registry.matchAll(/static String (\w+)\(([^)]*)\)/g)].map((m) => [
      m[1],
      m[2].split(",").filter((p) => p.trim()).length,
    ]),
  );
  const errors = [];
  for (const [file, src] of sources) {
    for (const match of src.matchAll(/ApiPaths\.(\w+)(\(([^)]*)\))?/g)) {
      const [, name, call, args] = match;
      if (!defined.has(name)) {
        errors.push(`${file}: unknown ApiPaths.${name}`);
        continue;
      }
      if (call && arity.has(name)) {
        const actual = args.split(",").filter((a) => a.trim()).length;
        if (actual !== arity.get(name)) {
          errors.push(`${file}: ApiPaths.${name} arity ${actual} != ${arity.get(name)}`);
        }
      }
    }
  }
  assert.deepEqual(errors, []);
});

test("Dart delimiters balance", () => {
  const errors = [];
  for (const [file, src] of sources) {
    const code = stripCode(src);
    for (const [open, close] of [["{", "}"], ["(", ")"], ["[", "]"]]) {
      const a = code.split(open).length;
      const b = code.split(close).length;
      if (a !== b) errors.push(`${file}: unbalanced ${open}${close}`);
    }
  }
  assert.deepEqual(errors, []);
});

// Regression net for the exact members screens call. Each entry names the
// defining file plus a member that must exist as a method, getter, field or
// constructor parameter.
const memberContracts = {
  "src/core/auth/auth_session.dart": ["signIn(", "register(", "signOut(", "setBaseUrl(", "restore("],
  "src/core/auth/user.dart": ["isExecutive", "isAdminRole", "roleLabel("],
  "src/core/api/api_client.dart": ["setBaseUrl(", "get(", "post(", "patch(", "put(", "delete("],
  "src/core/widgets/states.dart": ["AsyncView", "LoadingView", "EmptyView", "ErrorView", "StatusChip", "showAppMessage("],
  "src/features/catalog/catalog_repository.dart": [
    "clubs(", "club(", "events(", "event(", "announcements(", "accommodation(",
    "materials(", "representatives(", "projects(",
  ],
  "src/features/clubs/clubs_repository.dart": [
    "mine(", "requestMembership(", "leave(", "review(", "saved(", "setSaved(", "members(",
  ],
  "src/features/events/events_repository.dart": ["setRsvp(", "ticket(", "saved(", "setSaved("],
  "src/features/attendance/attendance_repository.dart": [
    "sessionsForEvent(", "createSession(", "setStatus(", "liveCode(", "checkIn(",
    "myRecords(", "correctRecord(",
  ],
  "src/features/badges/badges_repository.dart": ["mine("],
  "src/features/messages/messages_repository.dart": [
    "conversations(", "thread(", "send(", "markRead(", "lastMessagePreview(", "unreadCount",
  ],
  "src/features/notifications/notifications_repository.dart": ["feed(", "list(", "markRead(", "iconData"],
  "src/features/admin/admin_repository.dart": ["reports(", "users("],
  "src/core/store/personal_store.dart": ["PersonalStoreRepository", "list(", "put(", "remove(", "newRecordId("],
  "src/core/store/saves_repository.dart": ["SavedItem", "SavesRepository", "list(", "setSaved(", "isSaved(", "listingRef("],
  "src/core/search/search_repository.dart": ["SearchHit", "SearchRepository", "search(", "scopes"],
  "src/features/listings/listings_repository.dart": [
    "ListingItem", "PhotoRecord", "ListingEnquiry", "ListingsRepository",
    "list(", "detail(", "myPhotoRecords(", "savePhotoRecord(", "removePhotoRecord(",
    "sendEnquiry(", "myEnquiries(",
  ],
  "src/features/tasks/tasks_repository.dart": ["TaskItem", "TasksRepository", "list(", "save(", "remove("],
  "src/features/schedule/schedule_repository.dart": [
    "ClassSession", "PersonalPlan", "ScheduleRepository", "catalogSessions(",
    "myClasses(", "saveClass(", "removeClass(", "myPlans(", "savePlan(", "removePlan(",
  ],
  "src/features/community/community_repository.dart": [
    "FeedPost", "PostReply", "CommunityRepository", "publicPosts(", "myPosts(",
    "publish(", "removePost(", "replies(", "addReply(", "setReacted(", "addConcern(", "reportPost(",
  ],
  "src/features/academics/academic_tools_repository.dart": [
    "GradeEntry", "StudyNote", "AcademicToolsRepository", "grades(", "saveGrade(",
    "removeGrade(", "notes(", "saveNote(", "removeNote(", "weightedGpa(",
  ],
};

// Free JSON/model helpers every repository relies on. An undefined helper is
// a compile break no screen test would catch, so pin the surface here.
const helperContracts = {
  "src/core/auth/auth_session.dart": [
    "asMap(", "asList(", "asString(", "asInt(", "asDouble(", "prettyDate(", "prettyDateTime(",
  ],
  "src/core/store/personal_store.dart": ["newRecordId("],
};

test("repository and model surfaces match screen usage", () => {
  const errors = [];
  for (const contracts of [memberContracts, helperContracts]) {
    for (const [rel, members] of Object.entries(contracts)) {
      const src = readFileSync(join(lib, rel), "utf8");
      for (const member of members) {
        const bare = member.replace(/\($/, "");
        const found =
          src.includes(member) ||
          src.includes(`get ${bare}`) ||
          src.includes(`this.${bare}`);
        if (!found) errors.push(`${rel}: missing member ${member}`);
      }
    }
  }
  assert.deepEqual(errors, []);
});

test("student feature screens exist and are reachable", () => {
  const screens = [
    "lib/src/features/tasks/tasks_screen.dart",
    "lib/src/features/schedule/timetable_screen.dart",
    "lib/src/features/schedule/calendar_screen.dart",
    "lib/src/features/community/community_screen.dart",
    "lib/src/features/listings/listing_detail_screen.dart",
    "lib/src/features/listings/marketplace_screen.dart",
    "lib/src/features/listings/opportunities_screen.dart",
    "lib/src/features/listings/lostfound_screen.dart",
    "lib/src/features/listings/media_screen.dart",
    "lib/src/features/listings/campaigns_screen.dart",
    "lib/src/features/listings/courses_screen.dart",
    "lib/src/features/listings/photo_record_editor.dart",
    "lib/src/features/discover/discover_screen.dart",
    "lib/src/features/saved/saved_screen.dart",
    "lib/src/features/enquiries/enquiries_screen.dart",
    "lib/src/features/impact/my_impact_screen.dart",
    "lib/src/features/academics/gpa_screen.dart",
    "lib/src/features/academics/study_notes_screen.dart",
    "lib/src/features/study/study_assistant_screen.dart",
    "lib/src/features/src_forms/src_request_screen.dart",
    "lib/src/features/auth/forgot_password_screen.dart",
  ];
  const missing = screens.filter((rel) => !existsSync(join(mobile, rel)));
  assert.deepEqual(missing, []);
  const more = readFileSync(join(lib, "src/features/more/more_screen.dart"), "utf8");
  for (const screen of [
    "TasksScreen", "TimetableScreen", "CalendarScreen", "CommunityScreen",
    "MarketplaceScreen", "OpportunitiesScreen", "LostFoundScreen", "MediaScreen",
    "CampaignsScreen", "CoursesScreen", "DiscoverScreen", "SavedScreen",
    "EnquiriesScreen", "MyImpactScreen", "GpaScreen", "StudyNotesScreen",
    "StudyAssistantScreen", "SrcRequestScreen",
  ]) {
    assert.ok(more.includes(screen), `More screen does not link ${screen}`);
  }
  const signIn = readFileSync(join(lib, "src/features/auth/sign_in_screen.dart"), "utf8");
  assert.ok(signIn.includes("ForgotPasswordScreen"), "sign-in does not link password reset");
});

test("pull-to-refresh awaits reload completion", () => {
  const errors = [];
  for (const [file, src] of sources) {
    if (/onRefresh:\s*\(\)\s*async\s*=>\s*_reload\(\)/.test(src)) {
      errors.push(`${file}: pass _reload directly so the indicator waits for the load`);
    }
    for (const match of src.matchAll(/^\s*(void|Future<void>)\s+_reload\s*\(/gm)) {
      if (match[1] === "void") {
        errors.push(`${file}: _reload must return Future<void> for RefreshIndicator`);
      }
    }
  }
  assert.deepEqual(errors, []);
});

test("catalog base paths mirror the web endpoint map", () => {
  const web = readFileSync(join(root, "src/config/api-endpoints.ts"), "utf8");
  const expected = new Map(
    [...web.matchAll(/(\w+):\s*"([^"]+)"/g)]
      .filter((m) => !["import", "export", "satisfies"].includes(m[1]))
      .map((m) => [m[1], `/api${m[2]}`]),
  );
  assert.ok(expected.size >= 10, "web endpoint map looks truncated");
  const registry = readFileSync(join(lib, "src/core/api/api_paths.dart"), "utf8");
  const block = registry.match(/catalogBases = \{([\s\S]*?)\};/)?.[1] ?? "";
  const actual = new Map(
    [...block.matchAll(/'(\w+)':\s*'([^']+)'/g)].map((m) => [m[1], m[2]]),
  );
  const errors = [];
  // Every web collection the catalog UI can request must resolve to the same
  // base path; a naive /api/<collection> guess 404s for prefixed collections.
  for (const skip of ["conversations", "notifications"]) expected.delete(skip);
  for (const [collection, base] of expected) {
    if (actual.get(collection) !== base) {
      errors.push(`${collection}: mobile=${actual.get(collection)} web=${base}`);
    }
  }
  assert.deepEqual(errors, []);
});

test("endpoint registry maps to backend routes", () => {
  const registry = readFileSync(join(lib, "src/core/api/api_paths.dart"), "utf8");
  const templates = [
    ...[...registry.matchAll(/static const \w+ = '([^']+)'/g)].map((m) => m[1]),
    ...[...registry.matchAll(/=>\s*'([^']+)'/g)].map((m) => m[1]),
    // catalogBases map values: every collection base must resolve server-side.
    ...[...registry.matchAll(/'\w+':\s*'(\/api[^']+)'/g)].map((m) => m[1]),
  ];
  assert.ok(templates.length >= 20, "endpoint registry looks truncated");

  const apiDir = join(root, "src/app/api");
  const endpoints = readFileSync(join(root, "src/config/api-endpoints.ts"), "utf8");
  const endpointBases = new Set(
    [...endpoints.matchAll(/\w+:\s*"([^"]+)"/g)].map((m) => `/api${m[1]}`),
  );
  function resolves(template) {
    // Template accessors built on catalog() resolve through catalogBases,
    // which the mirror test pins to the web endpoint map.
    if (template.includes("${")) {
      return existsSync(join(apiDir, "[...rest]", "route.ts"));
    }
    // The [...rest] catch-all resolves any apiEndpoints base (including
    // prefixed paths like /api/community/posts) via resolveCollection.
    if (endpointBases.has(template)) {
      return existsSync(join(apiDir, "[...rest]", "route.ts"));
    }
    // Fully generic catalog accessors resolve through the catch-all route.
    if (/^\/api\/\$[A-Za-z_]+\//.test(template)) {
      return existsSync(join(apiDir, "[...rest]", "route.ts"));
    }
    const withSegs = template.replace(/\$[A-Za-z_]+/g, "__SEG__").replace(/^\/api\//, "");
    const parts = withSegs.split("/");
    // Walk the route tree; [param] and [...rest] match any segment, and a
    // registry variable matches any concrete directory at its level.
    let dirs = [apiDir];
    for (const part of parts) {
      const next = [];
      for (const dir of dirs) {
        if (!existsSync(dir)) continue;
        for (const entry of readdirSync(dir)) {
          if (entry === "route.ts") continue;
          const full = join(dir, entry);
          if (part === "__SEG__") {
            try {
              if (statSync(full).isDirectory()) next.push(full);
            } catch {
              // Ignore unreadable entries.
            }
          } else if (entry === part || entry.startsWith("[")) {
            next.push(full);
          }
        }
      }
      dirs = [...new Set(next)];
      if (!dirs.length) return false;
    }
    if (dirs.some((dir) => existsSync(join(dir, "route.ts")))) return true;
    // Fall back to the [...rest] catalog collections for /api/<collection>[/<id>].
    if (parts.length <= 2 && parts[0] !== "__SEG__") {
      const rest = readFileSync(join(apiDir, "[...rest]", "route.ts"), "utf8");
      return rest.includes(`${parts[0]}:`);
    }
    return false;
  }

  const missing = templates.filter((t) => !resolves(t));
  assert.deepEqual(missing, []);
});

test("Android and iOS app identifiers agree", () => {
  const gradle = readFileSync(join(mobile, "android/app/build.gradle"), "utf8");
  const appId = gradle.match(/applicationId = "([^"]+)"/)?.[1];
  const namespace = gradle.match(/namespace = "([^"]+)"/)?.[1];
  const pbxproj = readFileSync(join(mobile, "ios/Runner.xcodeproj/project.pbxproj"), "utf8");
  const bundleIds = [...new Set([...pbxproj.matchAll(/PRODUCT_BUNDLE_IDENTIFIER = ([^;]+);/g)].map((m) => m[1]))];
  assert.ok(appId, "applicationId missing");
  assert.equal(namespace, appId);
  assert.deepEqual(bundleIds, [appId]);
});

test("camera permission is declared on both platforms", () => {
  const manifest = readFileSync(
    join(mobile, "android/app/src/main/AndroidManifest.xml"),
    "utf8",
  );
  assert.ok(manifest.includes("android.permission.CAMERA"));
  const plist = readFileSync(join(mobile, "ios/Runner/Info.plist"), "utf8");
  assert.ok(plist.includes("NSCameraUsageDescription"));
});

test("Xcode project references resolve", () => {
  const pbxproj = readFileSync(join(mobile, "ios/Runner.xcodeproj/project.pbxproj"), "utf8");
  const defs = [...pbxproj.matchAll(/^\t\t([0-9A-F]{24}) \/\*.*?\*\/ = \{/gm)].map((m) => m[1]);
  assert.ok(defs.length >= 20, "pbxproj looks truncated");
  assert.equal(new Set(defs).size, defs.length, "duplicate object IDs");
  const defined = new Set(defs);
  const refs = [...pbxproj.matchAll(/\b([0-9A-F]{24})\b/g)].map((m) => m[1]);
  const dangling = [...new Set(refs.filter((r) => !defined.has(r)))];
  assert.deepEqual(dangling, []);
});

test("no secrets or workstation files are committed", () => {
  for (const rel of [
    "android/app/google-services.json",
    "ios/Runner/GoogleService-Info.plist",
    "android/key.properties",
  ]) {
    assert.ok(!existsSync(join(mobile, rel)), `${rel} must stay on workstations`);
  }
  const gitignore = readFileSync(join(mobile, ".gitignore"), "utf8");
  for (const entry of ["google-services.json", "GoogleService-Info.plist", "key.properties"]) {
    assert.ok(gitignore.includes(entry), `.gitignore must cover ${entry}`);
  }
});

test("release builds enforce an https backend", () => {
  const client = readFileSync(join(lib, "src/core/api/api_client.dart"), "utf8");
  assert.ok(
    client.includes("kReleaseMode") && /setBaseUrl[\s\S]{0,600}require an https/.test(client),
    "setBaseUrl must reject non-https URLs in release builds",
  );
  const gate = join(lib, "src/app/server_gate.dart");
  assert.ok(existsSync(gate), "server gate must exist for release first-run setup");
  const gateSrc = readFileSync(gate, "utf8");
  assert.ok(gateSrc.includes("kReleaseMode"), "server gate must enforce https in release");
  const main = readFileSync(join(lib, "main.dart"), "utf8");
  assert.ok(main.includes("ServerGateApp"), "main.dart must route failures through the server gate");
  assert.ok(
    /kReleaseMode[\s\S]{0,400}setBaseUrl/.test(main),
    "bootstrap must re-validate the default URL against the release https policy",
  );
});

test("session restore keeps the token except on 401 and offers a retry", () => {
  const session = readFileSync(join(lib, "src/core/auth/auth_session.dart"), "utf8");
  assert.ok(
    session.includes("get restoreError"),
    "AuthSession must expose why a restore failed",
  );
  assert.ok(
    /on ApiException catch \(error\)[\s\S]{0,400}error\.status == 401/.test(session),
    "restore must only clear the token on 401",
  );
  const signIn = readFileSync(join(lib, "src/features/auth/sign_in_screen.dart"), "utf8");
  assert.ok(
    signIn.includes("restoreError") && signIn.includes("Retry saved session"),
    "sign-in must offer to retry a kept session after a failed restore",
  );
});

test("clubs stay reachable for signed-in users", () => {
  const more = readFileSync(join(lib, "src/features/more/more_screen.dart"), "utf8");
  assert.ok(
    more.includes("ClubsScreen"),
    "More must link Clubs (signed-in tabs drop the Clubs tab)",
  );
});

test("deep links are declared on both platforms and route to details", () => {
  const pubspec = readFileSync(join(mobile, "pubspec.yaml"), "utf8");
  assert.ok(pubspec.includes("app_links:"), "pubspec must depend on app_links");
  const manifest = readFileSync(
    join(mobile, "android/app/src/main/AndroidManifest.xml"),
    "utf8",
  );
  assert.ok(
    manifest.includes('android:scheme="campusone"'),
    "Android must declare the campusone:// scheme",
  );
  const plist = readFileSync(join(mobile, "ios/Runner/Info.plist"), "utf8");
  assert.ok(plist.includes("CFBundleURLSchemes"), "iOS must declare URL schemes");
  assert.ok(plist.includes("<string>campusone</string>"), "iOS must declare the campusone:// scheme");
  const handler = readFileSync(join(lib, "src/app/deep_links.dart"), "utf8");
  for (const token of ["uriLinkStream", "getInitialLink", "EventDetailScreen", "ClubDetailScreen"]) {
    assert.ok(handler.includes(token), `deep link handler must use ${token}`);
  }
  const main = readFileSync(join(lib, "main.dart"), "utf8");
  assert.ok(main.includes("DeepLinkHandler"), "main.dart must install the deep link handler");
});

test("scan screen handles camera denial and gallery fallback", () => {
  const scan = readFileSync(join(lib, "src/features/attendance/scan_screen.dart"), "utf8");
  assert.ok(scan.includes("errorBuilder"), "scan must render camera errors");
  assert.ok(
    scan.includes("MobileScannerErrorCode.permissionDenied"),
    "scan must explain camera denial",
  );
  assert.ok(scan.includes("analyzeImage"), "scan must read codes from gallery images");
  assert.ok(scan.includes("Choose from gallery"), "scan must offer the gallery button");
});

test("server probes verify the CampusOne health payload", () => {
  for (const file of [
    "src/app/server_gate.dart",
    "src/features/settings/server_settings_screen.dart",
  ]) {
    const src = readFileSync(join(lib, file), "utf8");
    assert.ok(
      src.includes("/api/health") && /health\[.ok.\]\s*!?==?\s*true/.test(src),
      `${file} must require { ok: true } before trusting a server`,
    );
  }
});

test("appearance can be changed from More", () => {
  const more = readFileSync(join(lib, "src/features/more/more_screen.dart"), "utf8");
  assert.ok(more.includes("ThemeScope.of(context)"), "More must read the theme prefs");
  assert.ok(more.includes("setMode("), "More must offer a theme switcher");
});
