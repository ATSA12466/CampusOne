import { createServer } from "node:http";
import { demoCatalog } from "../../../src/services/demo/catalog.service.ts";
import { demoAuthService } from "../../../src/services/auth/demo-auth.service.ts";
import { engagementService } from "../../../src/services/demo/engagement/engagement.service.ts";
import { apiEndpoints } from "../../../src/config/api-endpoints.ts";
import { discoverKey } from "../../../src/lib/discover/directory.ts";
export async function startDiscoverFixture() {
  const collections = [
      "clubs",
      "events",
      "resources",
      "opportunities",
      "accommodation",
      "marketplace",
      "media",
      "lostFound",
    ],
    rows = {};
  for (const collection of collections)
    rows[collection] = (
      await demoCatalog.list(collection, { pageSize: 30 })
    ).items;
  const base = rows.events.find((item) => item.id === "e1");
  rows.events.push(
    ...Array.from({ length: 19 }, (_, n) => ({
      ...structuredClone(base),
      id: `e${n + 17}`,
      title: `Mock API event ${n + 17}`,
      details: { ...structuredClone(base.details), rank: n + 17 },
    })),
  );
  delete rows.events.find((item) => item.id === "e35").details;
  const initial = {
      modes: {},
      pageTwoError: false,
      activityMode: "ok",
      mutationMode: "ok",
      holdMutations: false,
      saved: [],
      user: demoAuthService.initialUser(),
    },
    state = structuredClone(initial),
    hits = [],
    pending = new Set();
  const releaseWrites = () => {
    for (const release of pending) release();
    pending.clear();
  };
  const reset = () => {
    releaseWrites();
    Object.assign(state, structuredClone(initial));
    hits.length = 0;
  };
  const setSaved = (ref, goal) => {
    state.saved = state.saved.filter(
      (item) => discoverKey(item) !== discoverKey(ref),
    );
    if (goal) state.saved.push(ref);
  };
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://127.0.0.1:4000"),
        path = url.pathname;
      let body = "";
      for await (const chunk of req) body += chunk;
      hits.push({
        path,
        search: url.search,
        method: req.method,
        cookie: req.headers.cookie,
        fetchSite: req.headers["sec-fetch-site"],
        body: body ? JSON.parse(body) : null,
      });
      const send = (value, status = 200) => {
        res.writeHead(status, {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        });
        res.end(JSON.stringify(value));
      };
      if (path === "/api/auth/session") return send({ user: state.user });
      if (path === "/api/auth/sign-out") {
        state.user = null;
        return send({ ok: true });
      }
      if (path === "/api/discover/activity") {
        if (state.activityMode === "error") return send({}, 503);
        return send(
          state.activityMode === "invalid"
            ? { saved: [{ category: "unknown", id: "bad" }] }
            : { saved: state.saved },
        );
      }
      if (path === "/api/events/activity")
        return send({
          goingIds: [],
          savedIds: state.saved
            .filter((item) => item.category === "events")
            .map((item) => item.id),
        });
      if (path === "/api/clubs/activity")
        return send({
          memberships: engagementService.listMemberships(),
          savedIds: state.saved
            .filter((item) => item.category === "clubs")
            .map((item) => item.id),
        });
      const action = path.match(/^\/api\/discover\/([^/]+)\/([^/]+)\/saved$/),
        legacy = path.match(/^\/api\/(events|clubs)\/([^/]+)\/saved$/);
      if (action || legacy) {
        if (state.mutationMode === "error") return send({}, 503);
        const ref = {
          category: (action ?? legacy)[1],
          id: decodeURIComponent((action ?? legacy)[2]),
        };
        if (!["PUT", "DELETE"].includes(req.method)) return send({}, 405);
        setSaved(ref, req.method === "PUT");
        if (state.holdMutations)
          await new Promise((resolve) => pending.add(resolve));
        return send({ ok: true });
      }
      for (const collection of collections) {
        const route = `/api${apiEndpoints[collection]}`;
        if (path === route) {
          const mode = state.modes[collection] ?? "ok",
            page = Number(url.searchParams.get("page") ?? 1);
          if (
            mode === "error" ||
            (collection === "events" && page === 2 && state.pageTwoError)
          )
            return send({}, 503);
          if (mode === "invalid")
            return send({ items: "not-array", page, pageSize: 30, total: 35 });
          const data = mode === "empty" ? [] : rows[collection];
          return send({
            items: data.slice((page - 1) * 30, page * 30),
            total: data.length,
            page,
            pageSize: 30,
          });
        }
        if (path.startsWith(`${route}/`)) {
          const id = decodeURIComponent(path.slice(route.length + 1)),
            item = rows[collection].find((item) => item.id === id);
          return send(item ?? {}, item ? 200 : 404);
        }
      }
      return send({}, 404);
    } catch {
      if (!res.headersSent) res.writeHead(500);
      res.end("{}");
    }
  });
  await new Promise((resolve) => server.listen(4000, "0.0.0.0", resolve));
  return { server, rows, state, hits, reset, releaseWrites };
}
