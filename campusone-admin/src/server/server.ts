import { createServer as createHttpServer } from 'node:http';
import type { Server } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type { App } from './app.ts';
import { userFromRequest } from './auth.ts';
import {
  HttpError,
  Router,
  clientIp,
  readJson,
  securityHeaders,
  sendJson,
  serveStatic,
} from './http.ts';
import type { Ctx } from './http.ts';
import { registerAuthRoutes } from './routes/auth.ts';
import { registerAdminRoutes } from './routes/admin.ts';
import { registerSrcRoutes } from './routes/src.ts';
import { registerMobileRoutes } from './routes/mobile.ts';
import { registerCampusFeatureRoutes } from './routes/campus_features.ts';
import { registerCommunityRoutes } from './routes/community.ts';
import { registerFileRoutes } from './routes/files.ts';

const here = dirname(fileURLToPath(import.meta.url));
export const PUBLIC_DIR = join(here, '..', '..', 'public');

const MAINTENANCE_EXEMPT = new Set(['/api/v1/config', '/api/v1/auth/login', '/api/auth/login']);

export function buildRouter(): Router {
  const router = new Router();
  registerAuthRoutes(router);
  registerAdminRoutes(router);
  registerSrcRoutes(router);
  registerMobileRoutes(router);
  registerCampusFeatureRoutes(router);
  registerCommunityRoutes(router);
  registerFileRoutes(router);
  router.get('/api/health', 'public', () => ({ ok: true }));
  return router;
}

export function createServer(app: App): Server {
  const router = buildRouter();
  const allowedOrigins = new Set(app.config.corsOrigins);

  return createHttpServer(async (req, res) => {
    securityHeaders(res);
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
    const origin = String(req.headers.origin ?? '');

    try {
      if (!url.pathname.startsWith('/api/')) {
        if (req.method !== 'GET' && req.method !== 'HEAD') throw new HttpError(405, 'Method not allowed.', 'method');
        if (await serveStatic(PUBLIC_DIR, url.pathname, res)) return;
        // Single-page app: unknown paths without a file extension get the shell.
        if (!/\.[a-z0-9]+$/i.test(url.pathname) && (await serveStatic(PUBLIC_DIR, '/', res))) return;
        throw new HttpError(404, 'Not found.', 'not_found');
      }

      // CORS: only for origins the operator listed.
      if (origin && allowedOrigins.has(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      }
      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      const matched = router.match(req.method ?? 'GET', url.pathname);
      if (matched === null) throw new HttpError(404, 'Unknown API endpoint.', 'not_found');
      if (matched === 'method') throw new HttpError(405, 'Method not allowed.', 'method');
      const { route, params } = matched;

      const { user, viaCookie } = userFromRequest(app, req);
      const access = route.access;
      if (access !== 'public') {
        if (!user) throw new HttpError(401, 'Sign in to continue.', 'unauthenticated');
        if (Array.isArray(access) && !access.includes(user.role)) {
          throw new HttpError(403, 'Your role cannot do this.', 'forbidden');
        }
      }

      // Cookie sessions are only accepted from our own pages (CSRF defence in depth; cookies are also SameSite=Lax).
      if (viaCookie && req.method !== 'GET' && req.method !== 'HEAD' && origin) {
        const sameHost = origin === `http://${req.headers.host}` || origin === `https://${req.headers.host}`;
        if (!sameHost && !allowedOrigins.has(origin)) throw new HttpError(403, 'Cross-site request blocked.', 'csrf');
      }

      if (
        app.maintenance &&
        url.pathname.startsWith('/api/v1/') &&
        !MAINTENANCE_EXEMPT.has(url.pathname) &&
        (!user || user.role === 'student')
      ) {
        throw new HttpError(503, 'CampusOne is down for maintenance. Try again soon.', 'maintenance');
      }

      const ctx: Ctx = {
        app,
        req,
        res,
        url,
        params,
        body: await readJson(req, url.pathname === '/api/src/materials/upload' || url.pathname === '/api/files/upload' ? 35 * 1024 * 1024 : undefined),
        user,
        viaCookie,
        ip: clientIp(req),
      };
      const result = await route.handler(ctx);
      if (!res.writableEnded) {
        if (result === undefined) {
          res.writeHead(204);
          res.end();
        } else {
          sendJson(res, 200, result);
        }
      }
    } catch (err) {
      if (res.writableEnded) return;
      if (err instanceof HttpError) {
        sendJson(res, err.status, { error: err.message, code: err.code });
      } else {
        console.error('Unhandled error:', err);
        sendJson(res, 500, { error: 'Something went wrong on the server.', code: 'server_error' });
      }
    }
  });
}
