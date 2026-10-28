import type { Router } from '../http.ts';
import { HttpError, sessionCookie } from '../http.ts';
import { issueToken, login, publicUser } from '../auth.ts';
import { hashPassword, verifyPassword } from '../crypto.ts';
import type { UserRow } from '../db.ts';
import { password } from '../validate.ts';

export function registerAuthRoutes(r: Router): void {
  r.post('/api/auth/login', 'public', (ctx) => {
    const client = ctx.body.client === 'mobile' ? 'mobile' : 'web';
    const { user, token, ttl } = login(ctx.app, ctx.body.email, ctx.body.password, ctx.ip, client);
    if (client === 'web') {
      ctx.res.setHeader('Set-Cookie', sessionCookie(token, ttl, ctx.app.config.cookieSecure));
      return { user: publicUser(user, ctx.app) };
    }
    return { user: publicUser(user, ctx.app), token };
  });

  r.post('/api/auth/logout', 'public', (ctx) => {
    ctx.res.setHeader('Set-Cookie', sessionCookie('', 0, ctx.app.config.cookieSecure));
    return { ok: true };
  });

  r.get('/api/auth/me', 'user', (ctx) => ({ user: publicUser(ctx.user!, ctx.app) }));

  r.post('/api/auth/change-password', 'user', (ctx) => {
    const user = ctx.user!;
    const current = typeof ctx.body.current === 'string' ? ctx.body.current : '';
    if (!verifyPassword(current, user.password_hash)) throw new HttpError(400, 'Your current password is wrong.', 'bad_credentials');
    const next = password(ctx.body, 'next', user.role === 'student' ? 8 : 10);
    if (next === current) throw new HttpError(400, 'Choose a password you have not used just now.', 'bad_request');
    ctx.app.db.run('UPDATE users SET password_hash = ?, must_change_password = 0, invited = 0 WHERE id = ?', hashPassword(next), user.id);
    const fresh = ctx.app.db.get<UserRow>('SELECT * FROM users WHERE id = ?', user.id)!;
    const client = ctx.body.client === 'mobile' ? 'mobile' : 'web';
    const { token, ttl } = issueToken(ctx.app, fresh, client);
    ctx.app.audit(user.email, 'Changed own password');
    if (client === 'web') {
      ctx.res.setHeader('Set-Cookie', sessionCookie(token, ttl, ctx.app.config.cookieSecure));
      return { ok: true };
    }
    return { ok: true, token };
  });
}
