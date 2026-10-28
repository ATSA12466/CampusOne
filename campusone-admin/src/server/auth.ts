import { createHash } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import type { App } from './app.ts';
import type { UserRow } from './db.ts';
import { verifyPassword } from './crypto.ts';
import { HttpError, parseCookies } from './http.ts';

const WEB_TTL = 12 * 60 * 60;
const MOBILE_TTL = 30 * 24 * 60 * 60;

/** Fingerprint of the current password, so changing it signs out old tokens. */
const pwStamp = (u: UserRow): string => createHash('sha256').update(u.password_hash).digest('base64url').slice(0, 12);

export function publicUser(u: UserRow, app?: App) {
  const isCourseRep = !!app?.db.get('SELECT 1 FROM class_reps WHERE user_id=? LIMIT 1', u.id);
  const isClubExecutive = !!app?.db.get('SELECT 1 FROM club_executives WHERE user_id=? LIMIT 1', u.id);
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    level: u.level,
    programme: u.programme,
    suspended: !!u.suspended,
    invited: !!u.invited,
    mustChangePassword: !!u.must_change_password,
    verifiedStudent: u.role !== 'student' || !!u.student_email_verified,
    roles: [...(isCourseRep ? ['course-rep'] : []), ...(isClubExecutive ? ['club-executive'] : [])],
    permissions: [...(isClubExecutive ? ['club.members.manage'] : [])],
  };
}

export function issueToken(app: App, u: UserRow, client: 'web' | 'mobile'): { token: string; ttl: number } {
  const ttl = client === 'mobile' ? MOBILE_TTL : WEB_TTL;
  return { token: app.vault.signToken({ sub: u.id, pv: pwStamp(u) }, ttl), ttl };
}

export function userFromToken(app: App, token: string): UserRow | null {
  const body = app.vault.verifyToken(token);
  if (!body || typeof body.sub !== 'string') return null;
  const user = app.db.get<UserRow>('SELECT * FROM users WHERE id = ?', body.sub);
  if (!user || user.suspended || body.pv !== pwStamp(user)) return null;
  return user;
}

export function userFromRequest(app: App, req: IncomingMessage): { user: UserRow | null; viaCookie: boolean } {
  const bearer = /^Bearer\s+(.+)$/i.exec(String(req.headers.authorization ?? ''));
  if (bearer) return { user: userFromToken(app, bearer[1]!.trim()), viaCookie: false };
  const cookie = parseCookies(req.headers.cookie).co_session;
  if (cookie) return { user: userFromToken(app, cookie), viaCookie: true };
  return { user: null, viaCookie: false };
}

export function login(app: App, emailRaw: unknown, password: unknown, ip: string, client: 'web' | 'mobile') {
  const email = typeof emailRaw === 'string' ? emailRaw.trim().toLowerCase() : '';
  if (!email || typeof password !== 'string' || !password) {
    throw new HttpError(400, 'Enter your e-mail and password.', 'bad_request');
  }
  if (!app.allow(`login:${ip}`, 30, 60_000) || !app.allow(`login:${email}`, 8, 60_000)) {
    throw new HttpError(429, 'Too many sign-in attempts. Wait a minute and try again.', 'rate_limited');
  }
  const user = app.db.get<UserRow>('SELECT * FROM users WHERE email = ?', email);
  // Always run a hash comparison so response time does not reveal whether the e-mail exists.
  const ok = user ? verifyPassword(password, user.password_hash) : verifyPassword(password, DUMMY_HASH);
  if (!user || !ok) throw new HttpError(401, 'E-mail or password is wrong.', 'bad_credentials');
  if (user.suspended) throw new HttpError(403, 'This account is suspended. Contact the SRC office.', 'suspended');
  return { user, ...issueToken(app, user, client) };
}

// scrypt hash of a random string; used only for constant-time failure paths.
const DUMMY_HASH =
  'scrypt$AAAAAAAAAAAAAAAAAAAAAA==$' + Buffer.alloc(64).toString('base64');
