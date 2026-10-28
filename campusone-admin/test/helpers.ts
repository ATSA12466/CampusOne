import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadConfig } from '../src/server/config.ts';
import type { Config } from '../src/server/config.ts';
import { start } from '../src/server/boot.ts';
import type { Running } from '../src/server/boot.ts';
import type { FetchFn } from '../src/server/app.ts';

export const ADMIN_EMAIL = 'root@test.local';
export const ADMIN_PASSWORD = 'Admin-Test-Pass-1';

export interface Call {
  url: string;
  init: RequestInit;
  body: string;
}

/** A fake outside world: records every provider request and answers with `reply`. */
export function fakeFetch(reply: (url: string, init: RequestInit) => { status?: number; json?: unknown; text?: string }): { fetch: FetchFn; calls: Call[] } {
  const calls: Call[] = [];
  const fetchFn: FetchFn = async (url, init = {}) => {
    calls.push({ url, init, body: typeof init.body === 'string' ? init.body : '' });
    const r = reply(url, init);
    const text = r.text ?? JSON.stringify(r.json ?? {});
    return new Response(text, { status: r.status ?? 200, headers: { 'Content-Type': 'application/json' } });
  };
  return { fetch: fetchFn, calls };
}

export async function boot(over: Partial<Config> = {}, fetchFn?: FetchFn): Promise<Running> {
  const dir = mkdtempSync(join(tmpdir(), 'campusone-test-'));
  const config = loadConfig({}, {
    dataDir: dir,
    secret: 'test-secret-test-secret-test-secret-1234',
    port: 0,
    adminEmail: ADMIN_EMAIL,
    adminPassword: ADMIN_PASSWORD,
    seedDemo: false,
    allowLiveSending: false,
    cookieSecure: false,
    ...over,
  });
  return start(config, { memory: true, fetch: fetchFn });
}

export interface Res {
  status: number;
  json: any;
  headers: Headers;
}

export class Client {
  readonly url: string;
  token = '';
  cookie = '';
  constructor(url: string) {
    this.url = url;
  }

  async req(method: string, path: string, body?: unknown, extra: Record<string, string> = {}): Promise<Res> {
    const headers: Record<string, string> = { ...extra };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (this.token) headers.Authorization = `Bearer ${this.token}`;
    else if (this.cookie) headers.Cookie = this.cookie;
    const res = await fetch(this.url + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    const text = await res.text();
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = text;
    }
    return { status: res.status, json, headers: res.headers };
  }

  get(p: string): Promise<Res> { return this.req('GET', p); }
  post(p: string, b: unknown = {}): Promise<Res> { return this.req('POST', p, b); }
  put(p: string, b: unknown = {}): Promise<Res> { return this.req('PUT', p, b); }
  patch(p: string, b: unknown = {}): Promise<Res> { return this.req('PATCH', p, b); }
  delete(p: string): Promise<Res> { return this.req('DELETE', p); }

  /** Mobile-style login: keeps a bearer token. */
  async loginMobile(email: string, password: string): Promise<Res> {
    this.token = '';
    const r = await this.req('POST', '/api/v1/auth/login', { email, password });
    if (r.status === 200) this.token = r.json.token;
    return r;
  }

  /** Browser-style login: keeps the session cookie. */
  async loginWeb(email: string, password: string): Promise<Res> {
    this.token = '';
    const r = await this.req('POST', '/api/auth/login', { email, password });
    const set = r.headers.get('set-cookie');
    if (r.status === 200 && set) this.cookie = set.split(';')[0]!;
    return r;
  }
}

/** Boots a server plus clients for super admin, SRC admin and one student. */
export async function world(over: Partial<Config> = {}, fetchFn?: FetchFn) {
  const run = await boot(over, fetchFn);
  const admin = new Client(run.url);
  await admin.loginMobile(ADMIN_EMAIL, ADMIN_PASSWORD);

  const mk = async (name: string, email: string, role: string, level = 'Level 200', phone = '') => {
    const inv = await admin.post('/api/admin/users/invite', { name, email, role });
    const c = new Client(run.url);
    // Invited users get a one-time password; set a known one.
    const first = await c.loginMobile(email, inv.json.tempPassword);
    if (first.status !== 200) throw new Error(`login failed for ${email}: ${JSON.stringify(first.json)}`);
    await c.post('/api/auth/change-password', { current: inv.json.tempPassword, next: 'Another-Pass-123', client: 'mobile' }).then((r) => {
      if (r.json?.token) c.token = r.json.token;
    });
    if (role === 'student') await c.patch('/api/v1/me', { level, phone });
    return c;
  };

  const src = await mk('Efua SRC', 'src@test.local', 'src_admin');
  const student = await mk('Ama Student', 'ama@test.local', 'student', 'Level 200', '0240000001');
  return { run, admin, src, student, mk };
}
