import { badRequest } from './http.ts';

type Body = Record<string, unknown>;

export function str(body: Body, key: string, label: string, opts: { max?: number; required?: boolean } = {}): string {
  const raw = body[key];
  const v = typeof raw === 'string' ? raw.trim() : '';
  const required = opts.required ?? true;
  if (required && !v) throw badRequest(`${label} is required.`);
  if (v.length > (opts.max ?? 200)) throw badRequest(`${label} is too long (max ${opts.max ?? 200} characters).`);
  return v;
}

export function oneOf<T extends string>(body: Body, key: string, label: string, values: readonly T[]): T {
  const v = body[key];
  if (typeof v !== 'string' || !values.includes(v as T)) throw badRequest(`${label} must be one of: ${values.join(', ')}.`);
  return v as T;
}

export function bool(body: Body, key: string, label: string): boolean {
  const v = body[key];
  if (typeof v !== 'boolean') throw badRequest(`${label} must be true or false.`);
  return v;
}

export function email(body: Body, key: string, label = 'E-mail'): string {
  const v = str(body, key, label, { max: 160 }).toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) throw badRequest(`${label} is not a valid e-mail address.`);
  return v;
}

export function password(body: Body, key: string, minLength: number): string {
  const v = typeof body[key] === 'string' ? (body[key] as string) : '';
  if (v.length < minLength) throw badRequest(`Password must be at least ${minLength} characters.`);
  if (v.length > 200) throw badRequest('Password is too long.');
  return v;
}

export function limitParam(url: URL, fallback: number, max: number): number {
  const n = Number(url.searchParams.get('limit') ?? fallback);
  return Number.isInteger(n) && n > 0 ? Math.min(n, max) : fallback;
}
