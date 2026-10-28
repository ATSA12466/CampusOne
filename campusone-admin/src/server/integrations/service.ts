import type { App } from '../app.ts';
import { now } from '../db.ts';
import { CATALOG, defById } from './catalog.ts';
import type { FieldDef, IntegrationDef } from './catalog.ts';
import { badRequest } from '../http.ts';

interface Row {
  id: string;
  enabled: number;
  values_json: string;
  secrets_enc: string;
  updated_at: string;
  updated_by: string;
}

export interface Loaded {
  enabled: boolean;
  values: Record<string, string>;
  secrets: Record<string, string>;
  updatedAt: string;
  updatedBy: string;
}

export type Status = 'not_configured' | 'disabled' | 'live';

export function load(app: App, id: string): Loaded | null {
  const row = app.db.get<Row>('SELECT * FROM integrations WHERE id = ?', id);
  if (!row) return null;
  let secrets: Record<string, string> = {};
  if (row.secrets_enc) {
    try {
      secrets = JSON.parse(app.vault.decrypt(row.secrets_enc)) as Record<string, string>;
    } catch {
      // APP_SECRET changed or data damaged: treat the secrets as missing.
      secrets = {};
    }
  }
  return {
    enabled: !!row.enabled,
    values: JSON.parse(row.values_json) as Record<string, string>,
    secrets,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  };
}

const valueOf = (rec: Loaded | null, f: FieldDef): string => rec?.values[f.key] ?? f.default ?? '';

export function isConfigured(def: IntegrationDef, rec: Loaded | null): boolean {
  if (!rec) return false;
  for (const f of def.fields) {
    if (!f.required) continue;
    if (f.type === 'secret') {
      if (!rec.secrets[f.key]) return false;
    } else if (!valueOf(rec, f).trim()) {
      return false;
    }
  }
  return true;
}

export function statusOf(def: IntegrationDef, rec: Loaded | null): Status {
  if (!isConfigured(def, rec)) return 'not_configured';
  return rec!.enabled ? 'live' : 'disabled';
}

export function isLive(app: App, id: string): boolean {
  const def = defById(id);
  return !!def && statusOf(def, load(app, id)) === 'live';
}

/** Values for provider adapters: non-secret values (with defaults) merged with decrypted secrets. */
export function runtimeConfig(app: App, id: string): Record<string, string> {
  const def = defById(id);
  const rec = load(app, id);
  if (!def || !rec) return {};
  const out: Record<string, string> = {};
  for (const f of def.fields) out[f.key] = f.type === 'secret' ? (rec.secrets[f.key] ?? '') : valueOf(rec, f);
  return out;
}

/** What the admin UI may see. Secrets are never included, only whether each is set. */
export function view(app: App, def: IntegrationDef) {
  const rec = load(app, def.id);
  const values: Record<string, string> = {};
  for (const f of def.fields) if (f.type !== 'secret') values[f.key] = valueOf(rec, f);
  return {
    ...def,
    status: statusOf(def, rec),
    enabled: rec?.enabled ?? false,
    values,
    secretSet: def.fields.filter((f) => f.type === 'secret' && !!rec?.secrets[f.key]).map((f) => f.key),
    updatedAt: rec?.updatedAt ?? null,
    updatedBy: rec?.updatedBy ?? null,
  };
}

export const viewAll = (app: App) => CATALOG.map((d) => view(app, d));

function validateField(f: FieldDef, raw: string): string {
  const v = raw.trim();
  if (v.length > (f.rows ? 20000 : 500)) throw badRequest(`${f.label} is too long.`);
  if (!v) return '';
  switch (f.type) {
    case 'email':
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) throw badRequest(`${f.label} is not a valid e-mail address.`);
      break;
    case 'url': {
      let ok = false;
      try {
        const u = new URL(v);
        ok = u.protocol === 'https:' || u.protocol === 'http:';
      } catch {
        ok = false;
      }
      if (!ok) throw badRequest(`${f.label} must start with https://`);
      break;
    }
    case 'number':
      if (!/^\d{1,9}$/.test(v)) throw badRequest(`${f.label} must be a whole number.`);
      break;
    case 'dropdown':
      if (!f.options?.includes(v)) throw badRequest(`${f.label}: choose one of ${f.options?.join(', ')}.`);
      break;
    case 'toggle':
      if (v !== 'true' && v !== 'false') throw badRequest(`${f.label} must be on or off.`);
      break;
    default:
      break;
  }
  return v;
}

/**
 * Saves values. A blank secret keeps the stored one. Returns the new view.
 * `input` holds field values by key; unknown keys are ignored.
 */
export function save(app: App, def: IntegrationDef, input: Record<string, unknown>, enabled: boolean, actor: string) {
  const old = load(app, def.id);
  const values: Record<string, string> = {};
  const secrets: Record<string, string> = { ...(old?.secrets ?? {}) };

  for (const f of def.fields) {
    const given = input[f.key];
    const raw = typeof given === 'string' ? given : typeof given === 'number' ? String(given) : typeof given === 'boolean' ? String(given) : '';
    if (f.type === 'secret') {
      const v = validateField(f, raw);
      if (v) secrets[f.key] = v;
    } else {
      values[f.key] = validateField(f, given === undefined ? (old?.values[f.key] ?? f.default ?? '') : raw);
    }
  }

  const draft: Loaded = { enabled, values, secrets, updatedAt: now(), updatedBy: actor };
  if (enabled && !isConfigured(def, draft)) {
    throw badRequest('Fill in every required field before switching this on.');
  }
  app.db.run(
    `INSERT INTO integrations (id, enabled, values_json, secrets_enc, updated_at, updated_by)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET enabled = excluded.enabled, values_json = excluded.values_json,
       secrets_enc = excluded.secrets_enc, updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
    def.id,
    enabled ? 1 : 0,
    JSON.stringify(values),
    app.vault.encrypt(JSON.stringify(secrets)),
    draft.updatedAt,
    actor,
  );
  app.audit(actor, `${enabled ? 'Saved and enabled' : 'Saved (off)'} integration "${def.title}"`);
  return view(app, def);
}

export function setEnabled(app: App, def: IntegrationDef, enabled: boolean, actor: string) {
  const rec = load(app, def.id);
  if (!rec || !isConfigured(def, rec)) throw badRequest('Save the required fields first.');
  app.db.run('UPDATE integrations SET enabled = ?, updated_at = ?, updated_by = ? WHERE id = ?', enabled ? 1 : 0, now(), actor, def.id);
  app.audit(actor, `${enabled ? 'Enabled' : 'Disabled'} integration "${def.title}"`);
  return view(app, def);
}

export function clear(app: App, def: IntegrationDef, actor: string): void {
  app.db.run('DELETE FROM integrations WHERE id = ?', def.id);
  app.audit(actor, `Removed credentials for "${def.title}"`);
}

/** AI feature switch on and the AI module live. */
export function aiFeatureOn(app: App, featureKey: string): boolean {
  if (!isLive(app, 'ai')) return false;
  return runtimeConfig(app, 'ai')[featureKey] === 'true';
}
