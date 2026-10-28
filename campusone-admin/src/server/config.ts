import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { join, resolve } from 'node:path';

export interface Config {
  port: number;
  dataDir: string;
  secret: string;
  adminEmail: string;
  adminPassword: string;
  seedDemo: boolean;
  allowLiveSending: boolean;
  cookieSecure: boolean;
  corsOrigins: string[];
  production: boolean;
}

const truthy = (v: string | undefined): boolean => v === 'true' || v === '1';

export function loadConfig(env: NodeJS.ProcessEnv = process.env, overrides: Partial<Config> = {}): Config {
  const production = env.NODE_ENV === 'production';
  const dataDir = resolve(overrides.dataDir ?? env.DATA_DIR ?? './data');
  mkdirSync(dataDir, { recursive: true });

  let secret = overrides.secret ?? env.APP_SECRET ?? '';
  if (!secret) {
    if (production) {
      throw new Error('APP_SECRET is required when NODE_ENV=production. See .env.example.');
    }
    // Development convenience: keep a generated secret next to the database.
    const file = join(dataDir, '.dev-secret');
    if (existsSync(file)) secret = readFileSync(file, 'utf8').trim();
    if (!secret) {
      secret = randomBytes(48).toString('base64url');
      writeFileSync(file, secret, { mode: 0o600 });
    }
  }
  if (secret.length < 24) throw new Error('APP_SECRET must be at least 24 characters.');

  return {
    port: overrides.port ?? Number(env.PORT ?? 3000),
    dataDir,
    secret,
    adminEmail: (overrides.adminEmail ?? env.ADMIN_EMAIL ?? 'admin@campusone.local').trim().toLowerCase(),
    adminPassword: overrides.adminPassword ?? env.ADMIN_PASSWORD ?? '',
    seedDemo: overrides.seedDemo ?? truthy(env.SEED_DEMO),
    allowLiveSending: overrides.allowLiveSending ?? truthy(env.ALLOW_LIVE_SENDING),
    cookieSecure: overrides.cookieSecure ?? (truthy(env.COOKIE_SECURE) || production),
    corsOrigins: overrides.corsOrigins ?? (env.CORS_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean),
    production,
  };
}
