import { createServer } from "node:http";
import { setTimeout as delay } from "node:timers/promises";
import { demoCatalog } from "../../../src/services/demo/catalog.service.ts";
import { demoAuthService } from "../../../src/services/auth/demo-auth.service.ts";
export async function startClubFixture() {
  const original = (await demoCatalog.list("clubs", { pageSize: 30 })).items;
  const clubs = [
    ...original,
    ...Array.from({ length: 19 }, (_, n) => ({
      ...structuredClone(original[0]),
      id: `club-${n + 17}`,
      name: `Mock API community ${n + 17}`,
      details: { ...structuredClone(original[0].details), rank: n + 17, accepting: n !== 18 },
    })),
  ];
  const initial = {
    catalogMode: "ok",
    activityMode: "ok",
    mutationMode: "ok",
    mutationDelay: 0,
    catalogDelay: 0,
    memberships: [
      { id: "m1", clubId: "club-1", userId: "user-1", status: "approved" },
      { id: "m2", clubId: "club-2", userId: "user-1", status: "pending" },
    ],
    savedIds: [],
  };
  const state = { ...structuredClone(initial) },
    hits = [],
    user = { ...demoAuthService.initialUser(), role: "club-executive" };
  const reset = () => {
    Object.assign(state, structuredClone(initial));
    hits.length = 0;
  };
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://127.0.0.1:4000"),
        path = url.pathname;
      let body = "";
      for await (const chunk of req) body += chunk;
      const input = body ? JSON.parse(body) : {};
      hits.push({
        path,
        search: url.search,
        method: req.method,
        cookie: req.headers.cookie,
        body: input,
      });
      const send = (payload, status = 200) => {
        res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" });
        res.end(JSON.stringify(payload));
      };
      if (path === "/api/auth/session") return send({ user });
      if (path === "/api/clubs/activity") {
        if (state.activityMode === "error") return send({}, 503);
        return send({ memberships: state.memberships, savedIds: state.savedIds });
      }
      if (path === "/api/clubs") {
        if (state.catalogDelay) await delay(state.catalogDelay);
        if (state.catalogMode === "error") return send({}, 503);
        if (state.catalogMode === "invalid")
          return send({ items: "invalid", total: 35, page: 1, pageSize: 30 });
        const page = Number(url.searchParams.get("page") ?? 1);
        return send({
          items: clubs.slice((page - 1) * 30, page * 30),
          total: 35,
          page,
          pageSize: 30,
        });
      }
      if (req.method !== "GET" && state.mutationDelay) await delay(state.mutationDelay);
      if (req.method !== "GET" && state.mutationMode === "error") return send({}, 503);
      let match = path.match(/^\/api\/clubs\/memberships\/([^/]+)$/);
      if (match && req.method === "PATCH") {
        const membership = state.memberships.find((m) => m.id === decodeURIComponent(match[1]));
        if (!membership) return send({}, 404);
        membership.status = input.status;
        return send({ ok: true });
      }
      match = path.match(/^\/api\/clubs\/([^/]+)\/(membership|saved)$/);
      if (match) {
        const id = decodeURIComponent(match[1]);
        if (match[2] === "saved") {
          state.savedIds =
            req.method === "PUT"
              ? [...new Set([...state.savedIds, id])]
              : state.savedIds.filter((s) => s !== id);
        } else if (req.method === "DELETE") {
          state.memberships = state.memberships.filter(
            (m) => m.clubId !== id || m.userId !== user.id,
          );
        } else if (req.method === "POST") {
          if (!state.memberships.some((m) => m.clubId === id && m.userId === user.id))
            state.memberships.push({
              id: `api-${id}`,
              clubId: id,
              userId: user.id,
              applicantName: user.name,
              note: input.note,
              status: "pending",
              requestedAt: "2026-10-11",
            });
        }
        return send({ ok: true });
      }
      match = path.match(/^\/api\/clubs\/([^/]+)$/);
      if (match && req.method === "GET") {
        const club = clubs.find((c) => c.id === decodeURIComponent(match[1]));
        if (!club) return send({}, 404);
        if (club.id === "club-34") {
          const { details, ...legacy } = club;
          return send(legacy);
        }
        return send(club);
      }
      return send({}, 404);
    } catch {
      res.writeHead(500);
      res.end("{}");
    }
  });
  await new Promise((resolve) => server.listen(4000, "0.0.0.0", resolve));
  return { state, hits, reset, server };
}
