import { createServer } from "node:http";
import { setTimeout as delay } from "node:timers/promises";
import { demoCatalog } from "../../../src/services/demo/catalog.service.ts";
import { demoAuthService } from "../../../src/services/auth/demo-auth.service.ts";
export async function startEventFixture() {
  const original = (await demoCatalog.list("events", { pageSize: 30 })).items,
    base = original.find((e) => e.id === "e1");
  const events = [
    ...original,
    ...Array.from({ length: 19 }, (_, n) => ({
      ...structuredClone(base),
      id: `e${n + 17}`,
      title: `Mock API event ${n + 17}`,
      details: {
        ...structuredClone(base.details),
        rank: n + 17,
        ...(n === 16
          ? {
              endsAt: "2026-10-18T10:00:00Z",
              agenda: [
                {
                  title: "A second-day session",
                  description: "Mock programme, not an actual gathering.",
                  startsAt: "2026-10-17T14:00:00Z",
                },
              ],
            }
          : {}),
        ...(n === 18 ? { bookingClosesAt: "2026-10-10T12:00:00Z" } : {}),
      },
    })),
  ];
  const initial = {
      catalogMode: "ok",
      activityMode: "ok",
      mutationMode: "ok",
      ticketMode: "ok",
      mutationDelay: 0,
      holdMutationResponse: false,
      catalogDelay: 0,
      ticketDelay: 0,
      goingIds: [],
      savedIds: [],
    },
    state = structuredClone(initial),
    hits = [],
    user = demoAuthService.initialUser(),
    pendingResponses = new Set();
  const releaseMutationResponses = () => {
    for (const release of pendingResponses) release();
    pendingResponses.clear();
  };
  const reset = () => {
    releaseMutationResponses();
    Object.assign(state, structuredClone(initial));
    hits.length = 0;
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
        body: body ? JSON.parse(body) : null,
      });
      const send = (payload, status = 200) => {
        res.writeHead(status, {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        });
        res.end(JSON.stringify(payload));
      };
      const reported = (e) => ({
        ...structuredClone(e),
        registered: Math.min(
          e.seats,
          e.registered + (state.goingIds.includes(e.id) ? 1 : 0),
        ),
      });
      if (path === "/api/auth/session") return send({ user });
      if (path === "/api/events/activity") {
        if (state.activityMode === "error") return send({}, 503);
        return send({
          goingIds: state.goingIds,
          savedIds: state.savedIds,
          attendance: events.map((e) => ({
            eventId: e.id,
            registered: reported(e).registered,
          })),
        });
      }
      if (path === "/api/events") {
        if (state.catalogDelay) await delay(state.catalogDelay);
        if (state.catalogMode === "error") return send({}, 503);
        if (state.catalogMode === "invalid")
          return send({ items: "bad", page: 1, pageSize: 30, total: 35 });
        const page = Number(url.searchParams.get("page") ?? 1);
        return send({
          items: events.slice((page - 1) * 30, page * 30).map(reported),
          total: 35,
          page,
          pageSize: 30,
        });
      }
      const match = path.match(
        /^\/api\/events\/([^/]+)(?:\/(rsvp|saved|ticket))?$/,
      );
      if (!match) return send({}, 404);
      const id = decodeURIComponent(match[1]),
        event = events.find((e) => e.id === id);
      if (!event) return send({}, 404);
      if (!match[2]) {
        const row = reported(event);
        if (id === "e34") {
          const { details, ...legacy } = row;
          return send(legacy);
        }
        return send(row);
      }
      if (match[2] === "ticket") {
        if (state.ticketDelay) await delay(state.ticketDelay);
        if (state.ticketMode === "error") return send({}, 503);
        if (!state.goingIds.includes(id)) return send({}, 403);
        return send({
          eventId: state.ticketMode === "wrong-event" ? "e2" : id,
          reference: `MOCK-${id.toUpperCase()}`,
          payload: `MOCK_PUBLISHER_TOKEN_NOT_VALID_FOR_ENTRY:${id}`,
          status: state.ticketMode === "revoked" ? "revoked" : "valid",
        });
      }
      if (state.mutationDelay) await delay(state.mutationDelay);
      if (state.mutationMode === "error") return send({}, 503);
      if (match[2] === "rsvp" && req.method === "PUT") {
        if (
          reported(event).registered >= event.seats &&
          !state.goingIds.includes(id)
        )
          return send({}, 409);
        if (
          event.details.status === "cancelled" ||
          Date.parse(event.details.bookingClosesAt) <= Date.now()
        )
          return send({}, 409);
        state.goingIds = [...new Set([...state.goingIds, id])];
      } else if (match[2] === "rsvp" && req.method === "DELETE")
        state.goingIds = state.goingIds.filter((i) => i !== id);
      else if (match[2] === "saved")
        state.savedIds =
          req.method === "PUT"
            ? [...new Set([...state.savedIds, id])]
            : state.savedIds.filter((i) => i !== id);
      else return send({}, 405);
      if (state.holdMutationResponse)
        await new Promise((resolve) => pendingResponses.add(resolve));
      return send({ ok: true });
    } catch {
      res.writeHead(500);
      res.end("{}");
    }
  });
  await new Promise((resolve) => server.listen(4000, "0.0.0.0", resolve));
  return { state, hits, reset, server, releaseMutationResponses };
}
