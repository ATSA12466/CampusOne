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
};

test("repository and model surfaces match screen usage", () => {
  const errors = [];
  for (const [rel, members] of Object.entries(memberContracts)) {
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
  assert.deepEqual(errors, []);
});

test("endpoint registry maps to backend routes", () => {
  const registry = readFileSync(join(lib, "src/core/api/api_paths.dart"), "utf8");
  const templates = [
    ...[...registry.matchAll(/static const \w+ = '([^']+)'/g)].map((m) => m[1]),
    ...[...registry.matchAll(/=>\s*'([^']+)'/g)].map((m) => m[1]),
  ];
  assert.ok(templates.length >= 20, "endpoint registry looks truncated");

  const apiDir = join(root, "src/app/api");
  function resolves(template) {
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
