import type { IncomingMessage, ServerResponse } from 'node:http';
import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import type { App } from './app.ts';
import type { Role, UserRow } from './db.ts';

export class HttpError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, message: string, code = 'error') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const badRequest = (m: string): HttpError => new HttpError(400, m, 'bad_request');
export const notFound = (m = 'Not found'): HttpError => new HttpError(404, m, 'not_found');

export interface Ctx {
  app: App;
  req: IncomingMessage;
  res: ServerResponse;
  url: URL;
  params: Record<string, string>;
  body: Record<string, unknown>;
  user: UserRow | null;
  viaCookie: boolean;
  ip: string;
}

export type Handler = (ctx: Ctx) => unknown | Promise<unknown>;
/** 'public' = no login. 'user' = any signed-in user. Otherwise one of the listed roles. */
export type Access = 'public' | 'user' | Role[];

interface Route {
  method: string;
  regex: RegExp;
  keys: string[];
  access: Access;
  handler: Handler;
}

export class Router {
  private readonly routes: Route[] = [];

  add(method: string, pattern: string, access: Access, handler: Handler): void {
    const keys: string[] = [];
    const source = pattern.replace(/:([a-zA-Z]+)/g, (_m, k: string) => {
      keys.push(k);
      return '([^/]+)';
    });
    this.routes.push({ method, regex: new RegExp(`^${source}$`), keys, access, handler });
  }

  get(p: string, a: Access, h: Handler): void { this.add('GET', p, a, h); }
  post(p: string, a: Access, h: Handler): void { this.add('POST', p, a, h); }
  put(p: string, a: Access, h: Handler): void { this.add('PUT', p, a, h); }
  patch(p: string, a: Access, h: Handler): void { this.add('PATCH', p, a, h); }
  delete(p: string, a: Access, h: Handler): void { this.add('DELETE', p, a, h); }

  match(method: string, path: string): { route: Route; params: Record<string, string> } | 'method' | null {
    let pathMatched = false;
    for (const route of this.routes) {
      const m = route.regex.exec(path);
      if (!m) continue;
      pathMatched = true;
      if (route.method !== method) continue;
      const params: Record<string, string> = {};
      route.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1]!)));
      return { route, params };
    }
    return pathMatched ? 'method' : null;
  }
}

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

const CSP =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'";

export function securityHeaders(res: ServerResponse): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
}

export function sendJson(res: ServerResponse, status: number, data: unknown): void {
  const body = data === undefined ? '' : JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

export async function readJson(req: IncomingMessage, limit = 1_000_000): Promise<Record<string, unknown>> {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'DELETE') return {};
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > limit) throw new HttpError(413, 'Request body is too large.', 'too_large');
    chunks.push(chunk as Buffer);
  }
  if (size === 0) return {};
  const type = String(req.headers['content-type'] ?? '');
  if (!type.includes('application/json')) throw new HttpError(415, 'Send JSON with Content-Type: application/json.', 'bad_type');
  try {
    const parsed: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not an object');
    return parsed as Record<string, unknown>;
  } catch {
    throw badRequest('The request body is not valid JSON.');
  }
}

export function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (header ?? '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

export function sessionCookie(value: string, maxAgeSeconds: number, secure: boolean): string {
  return `co_session=${encodeURIComponent(value)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAgeSeconds}${secure ? '; Secure' : ''}`;
}

export async function serveStatic(publicDir: string, pathname: string, res: ServerResponse): Promise<boolean> {
  const rel = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const full = normalize(join(publicDir, rel));
  if (full !== publicDir && !full.startsWith(publicDir + sep)) return false;
  try {
    let file = full;
    let info = await stat(file);
    if (info.isDirectory()) {
      file = join(file, 'index.html');
      info = await stat(file);
    }
    const data = await readFile(file);
    const ext = extname(file);
    const etag = `"${createHash('sha1').update(data).digest('base64url')}"`;
    const headers: Record<string, string> = {
      'Content-Type': MIME[ext] ?? 'application/octet-stream',
      'Cache-Control': 'no-cache',
      ETag: etag,
    };
    if (ext === '.html') headers['Content-Security-Policy'] = CSP;
    res.writeHead(200, headers);
    res.end(data);
    return true;
  } catch {
    return false;
  }
}

export function clientIp(req: IncomingMessage): string {
  // Behind a proxy set TRUST_PROXY=true so the real address is used for rate limits.
  if (process.env.TRUST_PROXY === 'true') {
    const fwd = String(req.headers['x-forwarded-for'] ?? '').split(',')[0]?.trim();
    if (fwd) return fwd;
  }
  return req.socket.remoteAddress ?? 'unknown';
}
