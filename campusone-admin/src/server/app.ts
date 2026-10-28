import type { Config } from './config.ts';
import { Db, now } from './db.ts';
import { Vault } from './crypto.ts';

export type FetchFn = (input: string, init?: RequestInit) => Promise<Response>;

/** Everything a request handler needs. Created once; tests build their own. */
export class App {
  readonly config: Config;
  readonly db: Db;
  readonly vault: Vault;
  /** Replaceable so tests can fake provider APIs. */
  fetch: FetchFn;
  private readonly hits = new Map<string, number[]>();
  private readonly background = new Set<Promise<unknown>>();

  constructor(config: Config, db: Db, fetchFn?: FetchFn) {
    this.config = config;
    this.db = db;
    this.vault = new Vault(config.secret);
    this.fetch = fetchFn ?? ((input, init) => fetch(input, init));
  }

  /** Run work after the response is sent (bulk sending). Errors are logged, never thrown. */
  track(work: Promise<unknown>): void {
    const p = work.catch((e) => console.error('Background task failed:', e)).finally(() => this.background.delete(p));
    this.background.add(p);
  }

  /** Resolves when all background work has finished (used by tests and shutdown). */
  async idle(): Promise<void> {
    while (this.background.size) await Promise.all([...this.background]);
  }

  audit(actor: string, action: string): void {
    this.db.run('INSERT INTO audit (at, actor, action) VALUES (?, ?, ?)', now(), actor, action);
    // Keep the table from growing forever.
    this.db.run('DELETE FROM audit WHERE id <= (SELECT MAX(id) FROM audit) - 5000');
  }

  /** Returns false when the caller is over the limit. */
  allow(key: string, max: number, windowMs: number): boolean {
    const t = Date.now();
    const list = (this.hits.get(key) ?? []).filter((x) => t - x < windowMs);
    if (list.length >= max) {
      this.hits.set(key, list);
      return false;
    }
    list.push(t);
    this.hits.set(key, list);
    if (this.hits.size > 5000) {
      for (const [k, v] of this.hits) if (v.every((x) => t - x >= windowMs)) this.hits.delete(k);
    }
    return true;
  }

  setting(key: string, fallback = ''): string {
    return this.db.get<{ value: string }>('SELECT value FROM settings WHERE key = ?', key)?.value ?? fallback;
  }

  setSetting(key: string, value: string): void {
    this.db.run(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      key,
      value,
    );
  }

  get maintenance(): boolean {
    return this.setting('maintenance', 'false') === 'true';
  }
}
