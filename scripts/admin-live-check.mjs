/**
 * Live admin-dashboard wiring check.
 *
 * Exercises every endpoint the web admin dashboards call, against a running
 * CampusOne server, with the exact verbs and bodies those dashboards send, and
 * asserts both the HTTP status and the response keys the dashboards read.
 * Also asserts the RBAC boundary: a plain student must not reach admin data.
 *
 * Usage:
 *   node scripts/seed-server.mjs                # once, to create demo accounts
 *   npm run dev                                 # or: npm run start
 *   node scripts/admin-live-check.mjs           # defaults to http://localhost:3000
 *   CAMPUSONE_BASE_URL=http://localhost:3001 node scripts/admin-live-check.mjs
 */
const BASE = (process.env.CAMPUSONE_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const ACCOUNTS = {
  // Seed accounts (local development only) - see src/server/seed.ts.
  admin: { email: "yaw.admin@campusone.app", password: "CampusOne-Super-01" },
  src: { email: "efua.src@gctu.edu.gh", password: "CampusOne-SRC-01" },
  student: { email: "ama.student@gctu.edu.gh", password: "CampusOne-Student-01" },
};

let passed = 0;
const failures = [];

function check(name, condition, detail) {
  if (condition) {
    passed += 1;
    console.log(`  ok   ${name}`);
  } else {
    failures.push(`${name}${detail ? ` -> ${detail}` : ""}`);
    console.log(`  FAIL ${name}${detail ? ` -> ${detail}` : ""}`);
  }
}

async function call(path, { method = "GET", body, cookie, headers } = {}) {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });
  let json = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }
  return { status: response.status, json, cookie: (response.headers.get("set-cookie") ?? "").split(";")[0] };
}

async function signIn(account) {
  const result = await call("/api/auth/sign-in", { method: "POST", body: account });
  if (result.status !== 200) throw new Error(`sign-in failed for ${account.email} (${result.status})`);
  return result.cookie;
}

function keys(value) {
  return value && typeof value === "object" ? Object.keys(value).sort().join(",") : String(value);
}

function has(value, ...paths) {
  for (const path of paths) {
    let cursor = value;
    let ok = true;
    for (const part of path.split(".")) {
      if (cursor === null || typeof cursor !== "object" || !(part in cursor)) {
        ok = false;
        break;
      }
      cursor = cursor[part];
    }
    if (!ok) return { ok: false, missing: path };
  }
  return { ok: true };
}

async function reachable() {
  try {
    const response = await fetch(`${BASE}/api/admin/overview`, { redirect: "manual" });
    return [200, 307, 401].includes(response.status);
  } catch {
    return false;
  }
}

if (!(await reachable())) {
  console.error(
    `CampusOne is not answering on ${BASE}. Start it first:\n` +
      `  npm run dev   # then re-run: CAMPUSONE_BASE_URL=http://localhost:3001 node scripts/admin-live-check.mjs`,
  );
  process.exit(2);
}

console.log(`Live admin wiring check against ${BASE}\n`);

const admin = await signIn(ACCOUNTS.admin);
const student = await signIn(ACCOUNTS.student);

console.log("Overview (/admin)");
{
  const r = await call("/api/admin/overview", { cookie: admin });
  check("GET /api/admin/overview -> 200", r.status === 200, `got ${r.status}`);
  check(
    "counts + health match the dashboard contract",
    has(
      r.json,
      "counts.users",
      "counts.suspended",
      "counts.pendingListings",
      "counts.openReports",
      "counts.materials",
      "counts.pendingClubs",
      "counts.openRequests",
      "health.store",
      "health.sessions",
      "health.auditEntries",
      "health.database",
    ).ok,
    keys(r.json),
  );
  check("health database state is honest", typeof r.json?.health?.database === "string", keys(r.json?.health));
}

console.log("\nUsers (/admin/users)");
let userId = null;
{
  const search = await call("/api/admin/users?q=ama", { cookie: admin });
  check("GET /api/admin/users?q= -> 200", search.status === 200, `got ${search.status}`);
  check("search returns { items }", Array.isArray(search.json?.items), keys(search.json));
  check(
    "query filter narrows the list",
    (search.json?.items ?? []).every((u) => JSON.stringify(u).toLowerCase().includes("ama")),
    `${search.json?.items?.length} rows`,
  );
  const first = search.json?.items?.[0];
  check(
    "row carries the AdminUser fields the table renders",
    has(first, "id", "email", "name", "roles", "programme", "level", "status", "verifiedStudent", "createdAt").ok,
    keys(first),
  );
  check("credentials are never returned", Boolean(first) && !("passwordHash" in first) && !("password" in first), keys(first));
  userId = first?.id ?? null;
  if (userId) {
    const before = first.verifiedStudent;
    const patch = await call(`/api/admin/users/${userId}`, {
      method: "PATCH",
      cookie: admin,
      body: { status: "active", verifiedStudent: !before, roles: first.roles },
    });
    check("PATCH /api/admin/users/{id} -> 200 { item }", patch.status === 200 && patch.json?.item?.id === userId, `got ${patch.status} ${keys(patch.json)}`);
    check("role + verification edits persist", patch.json?.item?.verifiedStudent === !before && Array.isArray(patch.json?.item?.roles), keys(patch.json?.item));
    await call(`/api/admin/users/${userId}`, { method: "PATCH", cookie: admin, body: { verifiedStudent: before } });
    const invalid = await call(`/api/admin/users/${userId}`, { method: "PATCH", cookie: admin, body: { status: "nonsense" } });
    check("invalid status is rejected", invalid.status === 400, `got ${invalid.status}`);
    const noRoles = await call(`/api/admin/users/${userId}`, { method: "PATCH", cookie: admin, body: { roles: [] } });
    check("an account cannot be left with no roles", noRoles.status === 400, `got ${noRoles.status}`);
  }
}

console.log("\nRoles & grants (/admin/roles)");
{
  const list = await call("/api/admin/grants", { cookie: admin });
  check("GET /api/admin/grants -> 200 { items }", list.status === 200 && Array.isArray(list.json?.items), `got ${list.status} ${keys(list.json)}`);
  check("grant rows carry scope + permission", has(list.json?.items?.[0], "id", "userId", "permission", "scopeType").ok, keys(list.json?.items?.[0]));

  const users = await call("/api/admin/users?q=efua", { cookie: admin });
  const target = users.json?.items?.[0];
  const created = await call("/api/admin/grants", {
    method: "POST",
    cookie: admin,
    body: { userId: target?.id, permission: "community.moderate", scopeType: "global", scopeId: null, expiresAt: null },
  });
  check("POST /api/admin/grants -> 201 { item }", created.status === 201 && Boolean(created.json?.item?.id), `got ${created.status} ${keys(created.json)}`);
  const grantId = created.json?.item?.id;
  if (grantId) {
    const revoke = await call(`/api/admin/grants/${grantId}`, { method: "PATCH", cookie: admin });
    check("PATCH /api/admin/grants/{id} revokes -> { ok: true }", revoke.status === 200 && revoke.json?.ok === true, `got ${revoke.status} ${keys(revoke.json)}`);
    const again = await call(`/api/admin/grants/${grantId}`, { method: "PATCH", cookie: admin });
    check("revoking twice is a clean 404", again.status === 404, `got ${again.status}`);
    const bad = await call("/api/admin/grants", {
      method: "POST",
      cookie: admin,
      body: { userId: target?.id, permission: "not.a.permission", scopeType: "global", scopeId: null, expiresAt: null },
    });
    check("unknown permission is rejected", bad.status === 400, `got ${bad.status}`);
  }
}

console.log("\nContent / materials (/admin/content)");
{
  const list = await call("/api/admin/materials", { cookie: admin });
  check("GET /api/admin/materials -> 200 { items }", list.status === 200 && Array.isArray(list.json?.items), `got ${list.status} ${keys(list.json)}`);

  // Exactly the shape content.tsx submits.
  const draft = {
    title: "Live check resource",
    course: "CS 201",
    kind: "note",
    description: "Created by scripts/admin-live-check.mjs",
    fileUrl: "https://example.org/live-check.pdf",
    status: "draft",
  };
  const created = await call("/api/admin/materials", { method: "POST", cookie: admin, body: draft });
  check("POST /api/admin/materials -> 201 { item }", created.status === 201 && Boolean(created.json?.item?.id), `got ${created.status} ${keys(created.json)}`);
  const id = created.json?.item?.id;
  if (id) {
    const patched = await call(`/api/admin/materials/${id}`, { method: "PATCH", cookie: admin, body: { ...draft, title: "Live check resource v2", status: "published" } });
    check("PATCH /api/admin/materials/{id} -> 200 { item }", patched.status === 200 && patched.json?.item?.title?.endsWith("v2"), `got ${patched.status} ${keys(patched.json)}`);
    const published = await call("/api/admin/materials?status=published", { cookie: admin });
    check("published filter picks the new material up", (published.json?.items ?? []).some((m) => m.id === id), `${published.json?.items?.length} rows`);
    const removed = await call(`/api/admin/materials/${id}`, { method: "DELETE", cookie: admin });
    check("DELETE /api/admin/materials/{id} -> { ok: true }", removed.status === 200 && removed.json?.ok === true, `got ${removed.status} ${keys(removed.json)}`);
  }
  const invalid = await call("/api/admin/materials", { method: "POST", cookie: admin, body: { title: "x" } });
  check("invalid material is rejected", invalid.status === 400, `got ${invalid.status}`);
  const shortTitle = await call("/api/admin/materials", { method: "POST", cookie: admin, body: { ...draft, title: "abc" } });
  check("too-short title is rejected with a message", shortTitle.status === 400 && typeof shortTitle.json?.error === "string", `got ${shortTitle.status}`);
}

console.log("\nModeration (/admin/moderation)");
{
  const list = await call("/api/admin/reports", { cookie: admin });
  check("GET /api/admin/reports -> 200 { items }", list.status === 200 && Array.isArray(list.json?.items), `got ${list.status} ${keys(list.json)}`);
  const open = await call("/api/admin/reports?status=open", { cookie: admin });
  check("status filter accepts the dashboard's value", open.status === 200, `got ${open.status}`);
  const target = list.json?.items?.[0];
  if (target) {
    check("report rows carry the triage fields the editor binds", has(target, "id", "status", "assignee", "resolution", "targetType", "reason").ok, keys(target));
    // Exactly the shape moderation.tsx submits.
    const triaged = await call(`/api/admin/reports/${target.id}`, {
      method: "PATCH",
      cookie: admin,
      body: { status: "actioned", assignee: "Yaw Boateng", resolution: "Checked by live wiring script." },
    });
    check("PATCH /api/admin/reports/{id} triages -> 200 { item }", triaged.status === 200 && triaged.json?.item?.status === "actioned", `got ${triaged.status} ${keys(triaged.json)}`);
    await call(`/api/admin/reports/${target.id}`, { method: "PATCH", cookie: admin, body: { status: target.status, assignee: target.assignee, resolution: target.resolution } });
    const bad = await call(`/api/admin/reports/${target.id}`, { method: "PATCH", cookie: admin, body: { status: "resolved" } });
    check("a status outside the enum is rejected", bad.status === 400, `got ${bad.status}`);
  } else {
    check("moderation queue has rows to triage", false, "no reports seeded");
  }
}

console.log("\nAccommodation / listings (/admin/accommodation)");
{
  // A student submits a listing; the admin queue must show it and the public
  // list must stay empty until it is approved.
  const submission = {
    title: "Live check room near campus",
    area: "Tesano",
    price: 950,
    period: "semester",
    beds: 1,
    description: "Submitted by scripts/admin-live-check.mjs to prove the review loop end to end.",
    contact: "live-check@gctu.edu.gh",
  };
  const submitted = await call("/api/listings", { method: "POST", cookie: student, body: submission });
  check("student POST /api/listings -> 201 pending", submitted.status === 201 && submitted.json?.item?.status === "pending", `got ${submitted.status} ${keys(submitted.json)}`);
  const listingId = submitted.json?.item?.id;

  const queue = await call("/api/admin/listings?status=pending", { cookie: admin });
  check("GET /api/admin/listings?status=pending -> 200 { items }", queue.status === 200 && Array.isArray(queue.json?.items), `got ${queue.status} ${keys(queue.json)}`);
  check("pending submission reaches the admin queue", (queue.json?.items ?? []).some((l) => l.id === listingId), `${queue.json?.items?.length} rows`);
  const publicBefore = await call("/api/listings");
  check("pending listing is not public yet", !(publicBefore.json?.items ?? []).some((l) => l.id === listingId), `${publicBefore.json?.items?.length} public rows`);

  if (listingId) {
    const row = (queue.json?.items ?? []).find((l) => l.id === listingId);
    check("queue rows carry title/area/price/contact for review", has(row, "title", "area", "price", "period", "contact", "submittedByName").ok, keys(row));
    const decided = await call(`/api/admin/listings/${listingId}`, {
      method: "PATCH",
      cookie: admin,
      body: { status: "approved", note: "Checked by live wiring script." },
    });
    check("PATCH /api/admin/listings/{id} approves -> 200 { item }", decided.status === 200 && decided.json?.item?.status === "approved", `got ${decided.status} ${keys(decided.json)}`);
    check("decision records who decided and when", Boolean(decided.json?.item?.decidedBy) && Boolean(decided.json?.item?.decidedAt), keys(decided.json?.item));
    const publicAfter = await call("/api/listings");
    check("approved listing becomes public", (publicAfter.json?.items ?? []).some((l) => l.id === listingId), `${publicAfter.json?.items?.length} public rows`);

    const bad = await call(`/api/admin/listings/${listingId}`, { method: "PATCH", cookie: admin, body: { status: "banana", note: "" } });
    check("a decision outside the enum is rejected", bad.status === 400, `got ${bad.status}`);

    // Reject it again to leave the store tidy, then confirm it leaves the public list.
    const rejected = await call(`/api/admin/listings/${listingId}`, { method: "PATCH", cookie: admin, body: { status: "rejected", note: "Live check cleanup." } });
    const publicFinal = await call("/api/listings");
    check("a rejected listing leaves the public list", rejected.status === 200 && !(publicFinal.json?.items ?? []).some((l) => l.id === listingId), `got ${rejected.status}`);
  }
}

console.log("\nAudit log (/admin/audit)");
{
  const page = await call("/api/admin/audit?page=1&pageSize=30", { cookie: admin });
  check("GET /api/admin/audit -> 200", page.status === 200, `got ${page.status}`);
  check("pagination envelope matches AuditPage", has(page.json, "items", "page", "pageSize", "total").ok && Array.isArray(page.json?.items), keys(page.json));
  check("pageSize is honoured", page.json?.pageSize === 30 && (page.json?.items?.length ?? 0) <= 30, `${page.json?.items?.length}/${page.json?.pageSize}`);
  const searched = await call("/api/admin/audit?page=1&pageSize=30&q=sign-in", { cookie: admin });
  check("search narrows the log", searched.status === 200 && (searched.json?.items ?? []).every((e) => JSON.stringify(e).toLowerCase().includes("sign-in")), `got ${searched.status}`);
  const entry = page.json?.items?.[0];
  check("entries expose action + target + time", has(entry, "id", "action", "targetType", "at").ok, keys(entry));
  check("the actions this run performed are logged", (page.json?.items ?? []).some((e) => e.action.startsWith("platform.") || e.action.startsWith("accommodation.")), "no platform/accommodation entries on page 1");
}

console.log("\nSettings (/admin/settings)");
{
  const bundle = await call("/api/admin/settings", { cookie: admin });
  check("GET /api/admin/settings -> 200 { settings, known }", bundle.status === 200 && Boolean(bundle.json?.settings) && Array.isArray(bundle.json?.known), `got ${bundle.status} ${keys(bundle.json)}`);
  const key = bundle.json?.known?.[0];
  const before = bundle.json?.settings?.[key];
  const saved = await call("/api/admin/settings", { method: "PATCH", cookie: admin, body: { key, value: "Live check value" } });
  check("PATCH /api/admin/settings -> { settings }", saved.status === 200 && saved.json?.settings?.[key] === "Live check value", `got ${saved.status} ${keys(saved.json)}`);
  await call("/api/admin/settings", { method: "PATCH", cookie: admin, body: { key, value: before ?? "" } });
  const bad = await call("/api/admin/settings", { method: "PATCH", cookie: admin, body: { key: "not.a.setting", value: "x" } });
  check("unknown setting key is rejected", bad.status === 400, `got ${bad.status}`);
}

console.log("\nBranding (/admin/branding)");
{
  const bundle = await call("/api/admin/branding", { cookie: admin });
  check("GET /api/admin/branding -> 200 { published, draft, versions }", bundle.status === 200 && has(bundle.json, "published", "draft", "versions").ok, `got ${bundle.status} ${keys(bundle.json)}`);
  check(
    "published branding carries the theme fields the editor binds",
    has(bundle.json?.published, "displayName", "colors.brand", "colors.brandInk", "colors.accent", "colors.cream").ok,
    keys(bundle.json?.published),
  );

  const originalName = bundle.json?.published?.displayName;
  const draft = { ...bundle.json?.draft, displayName: "CampusOne Live Check" };
  delete draft.id;
  delete draft.updatedAt;
  delete draft.updatedBy;
  const put = await call("/api/admin/branding", { method: "PUT", cookie: admin, body: draft });
  check("PUT /api/admin/branding saves a draft -> { draft }", put.status === 200 && put.json?.draft?.displayName === "CampusOne Live Check", `got ${put.status} ${keys(put.json)}`);
  const afterDraft = await call("/api/admin/branding", { cookie: admin });
  check("saving a draft does not publish it", afterDraft.json?.published?.displayName === originalName, `published=${afterDraft.json?.published?.displayName}`);

  const publish = await call("/api/admin/branding", { method: "POST", cookie: admin, body: { action: "publish" } });
  check("POST { action: publish } -> { published, version }", publish.status === 200 && has(publish.json, "published", "version").ok, `got ${publish.status} ${keys(publish.json)}`);
  const versionId = publish.json?.version?.id;
  if (versionId) {
    const edited = { ...draft, displayName: "CampusOne Rollback Target" };
    delete edited.id;
    delete edited.updatedAt;
    delete edited.updatedBy;
    await call("/api/admin/branding", { method: "PUT", cookie: admin, body: edited });
    await call("/api/admin/branding", { method: "POST", cookie: admin, body: { action: "publish" } });
    const rollback = await call("/api/admin/branding", { method: "POST", cookie: admin, body: { action: "rollback", versionId } });
    check("POST { action: rollback } restores a version", rollback.status === 200 && rollback.json?.published?.displayName === "CampusOne Live Check", `got ${rollback.status} ${keys(rollback.json)}`);
  }
  // Leave the platform as found.
  if (originalName) {
    const restore = { ...draft, displayName: originalName };
    delete restore.id;
    delete restore.updatedAt;
    delete restore.updatedBy;
    await call("/api/admin/branding", { method: "PUT", cookie: admin, body: restore });
    await call("/api/admin/branding", { method: "POST", cookie: admin, body: { action: "publish" } });
  }

  // Asset upload path used by branding.tsx (multipart, magic-byte sniffed).
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==",
    "base64",
  );
  const kinds = ["logoLight", "logoDark", "logoLogin", "appIcon", "favicon", "pwaIcon", "bannerDefault"];
  const form = new FormData();
  form.append("kind", "logoLight");
  form.append("file", new Blob([png], { type: "image/png" }), "live-check.png");
  const uploadResponse = await fetch(`${BASE}/api/admin/branding/assets`, { method: "POST", headers: { Cookie: admin }, body: form, redirect: "manual" });
  let uploadJson = null;
  try {
    uploadJson = await uploadResponse.json();
  } catch {
    uploadJson = null;
  }
  check("POST /api/admin/branding/assets uploads a PNG -> { item }", uploadResponse.status === 201 && has(uploadJson, "item.kind", "item.key", "item.url").ok, `got ${uploadResponse.status} ${keys(uploadJson)}`);
  const assetUrl = uploadJson?.item?.url;
  if (assetUrl) {
    const served = await fetch(`${BASE}${assetUrl}`, { redirect: "manual" });
    check("the uploaded asset is served back", served.status === 200, `got ${served.status} for ${assetUrl}`);
  }

  for (const kind of kinds) {
    const probe = new FormData();
    probe.append("kind", kind);
    probe.append("file", new Blob([png], { type: "image/png" }), "slot.png");
    const slot = await fetch(`${BASE}/api/admin/branding/assets`, { method: "POST", headers: { Cookie: admin }, body: probe, redirect: "manual" });
    check(`asset slot "${kind}" accepts an upload`, slot.status === 201, `got ${slot.status}`);
  }

  const mismatched = new FormData();
  mismatched.append("kind", "logoLight");
  mismatched.append("file", new Blob([Buffer.from("not an image at all")], { type: "image/png" }), "fake.png");
  const mismatchedResponse = await fetch(`${BASE}/api/admin/branding/assets`, { method: "POST", headers: { Cookie: admin }, body: mismatched, redirect: "manual" });
  check("a file whose bytes disagree with its type is rejected", mismatchedResponse.status === 400, `got ${mismatchedResponse.status}`);

  const evil = new FormData();
  evil.append("kind", "logoLight");
  evil.append("file", new Blob([Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"></svg>')], { type: "image/svg+xml" }), "bad.svg");
  const evilResponse = await fetch(`${BASE}/api/admin/branding/assets`, { method: "POST", headers: { Cookie: admin }, body: evil, redirect: "manual" });
  check("script-bearing SVG is rejected", evilResponse.status === 400, `got ${evilResponse.status}`);
}

console.log("\nRBAC boundary");
{
  const cases = [
    ["/api/admin/overview", "overview"],
    ["/api/admin/users", "users"],
    ["/api/admin/grants", "grants"],
    ["/api/admin/reports", "reports"],
    ["/api/admin/listings", "listings"],
    ["/api/admin/materials", "materials"],
    ["/api/admin/settings", "settings"],
    ["/api/admin/branding", "branding"],
    ["/api/admin/audit", "audit"],
  ];
  for (const [path, label] of cases) {
    const response = await call(path, { cookie: student });
    check(`student is refused /api/admin/${label} (403)`, response.status === 403, `got ${response.status}`);
  }
  const anonymous = await call("/api/admin/overview");
  check("anonymous is refused /api/admin/overview (401)", anonymous.status === 401, `got ${anonymous.status}`);

  // The same cookie plus a junk bearer token must not change anything.
  const mixed = await call("/api/admin/overview", { cookie: student, headers: { Authorization: "Bearer nope" } });
  check("a junk bearer token does not elevate", mixed.status === 401 || mixed.status === 403, `got ${mixed.status}`);

  const src = await signIn(ACCOUNTS.src);
  const srcSettings = await call("/api/admin/settings", { cookie: src });
  const srcUsers = await call("/api/admin/users", { cookie: src });
  check(
    "SRC admin (non-super) does not hold platform settings/users",
    srcSettings.status === 403 && srcUsers.status === 403,
    `settings ${srcSettings.status}, users ${srcUsers.status}`,
  );
}

console.log("\nAdmin pages");
for (const path of ["/admin", "/admin/users", "/admin/roles", "/admin/content", "/admin/moderation", "/admin/accommodation", "/admin/audit", "/admin/settings", "/admin/branding"]) {
  const response = await fetch(`${BASE}${path}`, { headers: { Cookie: admin }, redirect: "manual" });
  const body = await response.text();
  check(
    `page ${path} renders for an admin`,
    response.status === 200 && !body.includes("Application error"),
    `status ${response.status}${body.includes("Application error") ? " (server error in page)" : ""}`,
  );
}

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) {
  console.log("\nFailures:");
  for (const failure of failures) console.log(`  - ${failure}`);
  process.exit(1);
}
