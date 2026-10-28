import type { App } from '../app.ts';
import type { Role } from '../db.ts';
import { ROLES, now } from '../db.ts';
import type { UserRow } from '../db.ts';
import type { Router } from '../http.ts';
import { HttpError, badRequest, notFound } from '../http.ts';
import { publicUser } from '../auth.ts';
import { hashPassword, randomId, randomPassword } from '../crypto.ts';
import { listingJson } from '../mappers.ts';
import type { ListingRow } from '../mappers.ts';
import { defById } from '../integrations/catalog.ts';
import { clear, isLive, setEnabled, save, view, viewAll } from '../integrations/service.ts';
import { sendEmail, testIntegration } from '../integrations/providers.ts';
import { bool, email, limitParam, oneOf, str } from '../validate.ts';

const SA: Role[] = ['super_admin'];
const LISTING_KINDS = ['hostel', 'market', 'opportunity', 'promo'] as const;
const LISTING_STATUS = ['pending', 'approved', 'rejected', 'featured'] as const;

export function registerAdminRoutes(r: Router): void {
  // ---------------------------------------------------------------- overview
  r.get('/api/admin/overview', SA, (ctx) => {
    const db = ctx.app.db;
    const integrations = viewAll(ctx.app);
    return {
      integrations: integrations.map((i) => ({ id: i.id, title: i.title, category: i.category, status: i.status })),
      live: integrations.filter((i) => i.status === 'live').length,
      pendingListings: db.get<{ n: number }>("SELECT COUNT(*) n FROM listings WHERE status = 'pending'")!.n,
      reportedListings: db.get<{ n: number }>('SELECT COUNT(*) n FROM listings WHERE reports > 0')!.n,
      users: db.get<{ n: number }>('SELECT COUNT(*) n FROM users')!.n,
      students: db.get<{ n: number }>("SELECT COUNT(*) n FROM users WHERE role = 'student'")!.n,
      flags: db.all<{ key: string; label: string; description: string; enabled: number }>('SELECT * FROM flags ORDER BY rowid').map((f) => ({ ...f, enabled: !!f.enabled })),
      maintenance: ctx.app.maintenance,
      recent: db.all<{ at: string; actor: string; action: string }>('SELECT at, actor, action FROM audit ORDER BY id DESC LIMIT 8'),
    };
  });

  // ------------------------------------------------------------ integrations
  r.get('/api/admin/integrations', SA, (ctx) => ({ integrations: viewAll(ctx.app) }));

  r.get('/api/admin/integrations/:id', SA, (ctx) => {
    const def = defById(ctx.params.id!);
    if (!def) throw notFound('Unknown integration.');
    return { integration: view(ctx.app, def) };
  });

  r.put('/api/admin/integrations/:id', SA, (ctx) => {
    const def = defById(ctx.params.id!);
    if (!def) throw notFound('Unknown integration.');
    const values = ctx.body.values;
    if (values === null || typeof values !== 'object' || Array.isArray(values)) throw badRequest('Send the field values as an object.');
    const enabled = bool(ctx.body, 'enabled', 'Enabled');
    return { integration: save(ctx.app, def, values as Record<string, unknown>, enabled, ctx.user!.email) };
  });

  r.patch('/api/admin/integrations/:id/enabled', SA, (ctx) => {
    const def = defById(ctx.params.id!);
    if (!def) throw notFound('Unknown integration.');
    return { integration: setEnabled(ctx.app, def, bool(ctx.body, 'enabled', 'Enabled'), ctx.user!.email) };
  });

  r.delete('/api/admin/integrations/:id', SA, (ctx) => {
    const def = defById(ctx.params.id!);
    if (!def) throw notFound('Unknown integration.');
    clear(ctx.app, def, ctx.user!.email);
    return { ok: true };
  });

  r.post('/api/admin/integrations/:id/test', SA, async (ctx) => {
    if (!defById(ctx.params.id!)) throw notFound('Unknown integration.');
    if (!ctx.app.allow(`test:${ctx.user!.id}`, 10, 60_000)) throw new HttpError(429, 'Too many tests. Wait a minute.', 'rate_limited');
    const result = await testIntegration(ctx.app, ctx.params.id!, ctx.body);
    ctx.app.audit(ctx.user!.email, `Tested integration "${defById(ctx.params.id!)!.title}": ${result.ok ? 'passed' : 'failed'}`);
    return result;
  });

  // ---------------------------------------------------------------- listings
  r.get('/api/admin/listings', SA, (ctx) => {
    const kind = ctx.url.searchParams.get('kind');
    const rows = kind
      ? ctx.app.db.all<ListingRow>('SELECT * FROM listings WHERE kind = ? ORDER BY created_at DESC', kind)
      : ctx.app.db.all<ListingRow>('SELECT * FROM listings ORDER BY created_at DESC');
    return { listings: rows.map(listingJson) };
  });

  r.post('/api/admin/listings', SA, (ctx) => {
    const kind = oneOf(ctx.body, 'kind', 'Type', LISTING_KINDS);
    const id = randomId();
    ctx.app.db.run(
      `INSERT INTO listings (id, kind, title, subtitle, owner, price, status, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, 'approved', ?, ?)`,
      id, kind,
      str(ctx.body, 'title', 'Title', { max: 120 }),
      str(ctx.body, 'subtitle', 'Details', { max: 300, required: false }),
      str(ctx.body, 'owner', 'Owner', { max: 100, required: false }) || 'CampusOne admin',
      str(ctx.body, 'price', 'Price', { max: 60, required: false }),
      ctx.user!.email, now(),
    );
    ctx.app.audit(ctx.user!.email, `Added ${kind} "${str(ctx.body, 'title', 'Title')}"`);
    return { listing: listingJson(ctx.app.db.get<ListingRow>('SELECT * FROM listings WHERE id = ?', id)!) };
  });

  r.patch('/api/admin/listings/:id', SA, (ctx) => {
    const row = ctx.app.db.get<ListingRow>('SELECT * FROM listings WHERE id = ?', ctx.params.id!);
    if (!row) throw notFound('Listing not found.');
    const status = oneOf(ctx.body, 'status', 'Status', LISTING_STATUS);
    ctx.app.db.run('UPDATE listings SET status = ?, reports = CASE WHEN ? = ? THEN 0 ELSE reports END WHERE id = ?', status, status, 'approved', row.id);
    ctx.app.audit(ctx.user!.email, `Marked ${row.kind} "${row.title}" as ${status}`);
    return { listing: listingJson(ctx.app.db.get<ListingRow>('SELECT * FROM listings WHERE id = ?', row.id)!) };
  });

  r.delete('/api/admin/listings/:id', SA, (ctx) => {
    const row = ctx.app.db.get<ListingRow>('SELECT * FROM listings WHERE id = ?', ctx.params.id!);
    if (!row) throw notFound('Listing not found.');
    ctx.app.db.run('DELETE FROM listings WHERE id = ?', row.id);
    ctx.app.audit(ctx.user!.email, `Removed ${row.kind} "${row.title}"`);
    return { ok: true };
  });

  // ------------------------------------------------------------------ people
  r.get('/api/admin/users', SA, (ctx) => {
    const q = (ctx.url.searchParams.get('q') ?? '').trim().toLowerCase();
    const limit = limitParam(ctx.url, 100, 500);
    const rows = q
      ? ctx.app.db.all<UserRow>('SELECT * FROM users WHERE lower(name) LIKE ? OR lower(email) LIKE ? ORDER BY created_at DESC LIMIT ?', `%${q}%`, `%${q}%`, limit)
      : ctx.app.db.all<UserRow>('SELECT * FROM users ORDER BY created_at DESC LIMIT ?', limit);
    return { users: rows.map(publicUser) };
  });

  r.post('/api/admin/users/invite', SA, async (ctx) => {
    const name = str(ctx.body, 'name', 'Name', { max: 100 });
    const address = email(ctx.body, 'email');
    const role = oneOf(ctx.body, 'role', 'Role', ROLES);
    if (ctx.app.db.get('SELECT 1 FROM users WHERE email = ?', address)) throw new HttpError(409, 'An account with that e-mail already exists.', 'conflict');
    const temp = randomPassword();
    const id = randomId();
    ctx.app.db.run(
      `INSERT INTO users (id, name, email, password_hash, role, invited, must_change_password, created_at) VALUES (?, ?, ?, ?, ?, 1, 1, ?)`,
      id, name, address, hashPassword(temp), role, now(),
    );
    ctx.app.audit(ctx.user!.email, `Invited ${address} as ${role}`);

    let emailed = false;
    if (ctx.app.config.allowLiveSending && isLive(ctx.app, 'email')) {
      try {
        await sendEmail(ctx.app, address, 'Your CampusOne admin account', `Hello ${name},\n\nAn account was created for you on CampusOne.\n\nE-mail: ${address}\nTemporary password: ${temp}\n\nSign in and change the password right away.`);
        emailed = true;
      } catch {
        emailed = false;
      }
    }
    // The temporary password is shown once, here. It is not stored anywhere in readable form.
    return { user: publicUser(ctx.app.db.get<UserRow>('SELECT * FROM users WHERE id = ?', id)!, ctx.app), tempPassword: temp, emailed };
  });

  const activeSuperAdmins = (app: App, excludingId: string): number =>
    app.db.get<{ n: number }>("SELECT COUNT(*) n FROM users WHERE role = 'super_admin' AND suspended = 0 AND id != ?", excludingId)!.n;

  r.patch('/api/admin/users/:id', SA, (ctx) => {
    const target = ctx.app.db.get<UserRow>('SELECT * FROM users WHERE id = ?', ctx.params.id!);
    if (!target) throw notFound('Account not found.');
    const self = target.id === ctx.user!.id;
    const nextRole = ctx.body.role === undefined ? target.role : oneOf(ctx.body, 'role', 'Role', ROLES);
    const nextSuspended = ctx.body.suspended === undefined ? !!target.suspended : bool(ctx.body, 'suspended', 'Suspended');

    if (self && (nextRole !== target.role || nextSuspended)) throw new HttpError(400, 'You cannot change your own role or suspend yourself.', 'bad_request');
    const losesSuper = target.role === 'super_admin' && (nextRole !== 'super_admin' || nextSuspended);
    if (losesSuper && activeSuperAdmins(ctx.app, target.id) === 0) throw new HttpError(400, 'At least one active super admin must remain.', 'bad_request');

    ctx.app.db.run('UPDATE users SET role = ?, suspended = ? WHERE id = ?', nextRole, nextSuspended ? 1 : 0, target.id);
    if (nextRole !== target.role) ctx.app.audit(ctx.user!.email, `Changed ${target.email} from ${target.role} to ${nextRole}`);
    if (nextSuspended !== !!target.suspended) ctx.app.audit(ctx.user!.email, `${nextSuspended ? 'Suspended' : 'Reinstated'} ${target.email}`);
    return { user: publicUser(ctx.app.db.get<UserRow>('SELECT * FROM users WHERE id = ?', target.id)!, ctx.app) };
  });

  r.post('/api/admin/users/:id/reset-password', SA, (ctx) => {
    const target = ctx.app.db.get<UserRow>('SELECT * FROM users WHERE id = ?', ctx.params.id!);
    if (!target) throw notFound('Account not found.');
    const temp = randomPassword();
    ctx.app.db.run('UPDATE users SET password_hash = ?, must_change_password = 1 WHERE id = ?', hashPassword(temp), target.id);
    ctx.app.audit(ctx.user!.email, `Reset password for ${target.email}`);
    return { tempPassword: temp };
  });

  // ------------------------------------------------------------------ system
  r.get('/api/admin/flags', SA, (ctx) => ({
    flags: ctx.app.db.all<{ key: string; label: string; description: string; enabled: number }>('SELECT * FROM flags ORDER BY rowid').map((f) => ({ ...f, enabled: !!f.enabled })),
  }));

  r.put('/api/admin/flags/:key', SA, (ctx) => {
    const flag = ctx.app.db.get<{ key: string; label: string }>('SELECT key, label FROM flags WHERE key = ?', ctx.params.key!);
    if (!flag) throw notFound('Unknown module.');
    const enabled = bool(ctx.body, 'enabled', 'Enabled');
    ctx.app.db.run('UPDATE flags SET enabled = ? WHERE key = ?', enabled ? 1 : 0, flag.key);
    ctx.app.audit(ctx.user!.email, `${enabled ? 'Enabled' : 'Disabled'} module "${flag.label}"`);
    return { ok: true };
  });

  r.get('/api/admin/settings', SA, (ctx) => ({
    maintenance: ctx.app.maintenance,
    registrationOpen: ctx.app.setting('registration_open', 'true') === 'true',
    minAppVersion: ctx.app.setting('min_app_version', ''),
    liveSending: ctx.app.config.allowLiveSending,
  }));

  r.put('/api/admin/settings', SA, (ctx) => {
    const b = ctx.body;
    if (b.maintenance !== undefined) {
      const v = bool(b, 'maintenance', 'Maintenance mode');
      ctx.app.setSetting('maintenance', String(v));
      ctx.app.audit(ctx.user!.email, `Maintenance mode ${v ? 'ON' : 'OFF'}`);
    }
    if (b.registrationOpen !== undefined) {
      const v = bool(b, 'registrationOpen', 'Registration');
      ctx.app.setSetting('registration_open', String(v));
      ctx.app.audit(ctx.user!.email, `Student sign-up ${v ? 'opened' : 'closed'}`);
    }
    if (b.minAppVersion !== undefined) {
      const v = str(b, 'minAppVersion', 'Minimum app version', { max: 20, required: false });
      if (v && !/^\d+(\.\d+){0,2}$/.test(v)) throw badRequest('Minimum app version looks like 1.2.0.');
      ctx.app.setSetting('min_app_version', v);
      ctx.app.audit(ctx.user!.email, `Minimum app version set to ${v || 'none'}`);
    }
    return { ok: true };
  });

  const BRAND_FIELDS: Record<string, [string, string, number]> = {
    appName: ['brand_app_name', 'App name', 60],
    logoImageUrl: ['brand_logo_image_url', 'Logo image URL', 500],
    primaryColor: ['brand_primary_color', 'Primary colour', 7],
    accentColor: ['brand_accent_color', 'Accent colour', 7],
    tagline: ['brand_tagline', 'Tagline', 160],
    splashTitle: ['brand_splash_title', 'Splash title', 120],
    splashSubtitle: ['brand_splash_subtitle', 'Splash subtitle', 240],
    splashImageUrl: ['brand_splash_image_url', 'Splash image URL', 500],
    onboardingTitle: ['brand_onboarding_title', 'Onboarding title', 120],
    onboardingText: ['brand_onboarding_text', 'Onboarding text', 500],
    onboardingImageUrl: ['brand_onboarding_image_url', 'Onboarding image URL', 500],
    onboardingButtonText: ['brand_onboarding_button', 'Onboarding button', 60],
    maintenanceText: ['brand_maintenance_text', 'Maintenance message', 300],
  };

  r.get('/api/admin/branding', SA, (ctx) => {
    const defaults: Record<string, string> = {
      revision: ctx.app.setting('brand_revision', '1'),
      appName: 'CampusOne', tagline: 'Your campus. All in one place.',
      logoImageUrl: '', primaryColor: '#25206A', accentColor: '#F4B52A',
      splashTitle: 'Your campus, connected.', splashSubtitle: 'Campus life in one place.',
      splashImageUrl: '', onboardingTitle: 'Get more from campus life.',
      onboardingText: 'Find campus updates, learning resources and student services.',
      onboardingImageUrl: '', onboardingButtonText: 'Get started',
      maintenanceText: 'CampusOne is being updated. Please check again shortly.',
    };
    const branding: Record<string, string> = {};
    for (const [key, [setting]] of Object.entries(BRAND_FIELDS)) branding[key] = ctx.app.setting(setting, defaults[key]!);
    return { branding };
  });

  r.put('/api/admin/branding', SA, (ctx) => {
    for (const [key, [setting, label, max]] of Object.entries(BRAND_FIELDS)) {
      if (ctx.body[key] === undefined) continue;
      const value = str(ctx.body, key, label, { max, required: false });
      if ((key === 'primaryColor' || key === 'accentColor') && value && !/^#[0-9a-fA-F]{6}$/.test(value)) {
        throw badRequest(`${label} must be a hex color such as #25206A.`);
      }
      if (key.endsWith('ImageUrl') && value) {
        if (value.startsWith('/api/files/')) {
          const fileId = value.slice('/api/files/'.length);
          const asset = ctx.app.db.get<{ mime_type: string }>('SELECT mime_type FROM uploaded_files WHERE id=?', fileId);
          if (!asset || !asset.mime_type.startsWith('image/')) throw badRequest(`${label} must be an uploaded image.`);
          ctx.app.setSetting(setting, value);
          continue;
        }
        let url: URL;
        try { url = new URL(value); } catch { throw badRequest(`${label} must be a full https:// URL.`); }
        if (url.protocol !== 'https:') throw badRequest(`${label} must use https://.`);
      }
      ctx.app.setSetting(setting, value);
    }
    const revision = Number(ctx.app.setting('brand_revision', '1')) + 1;
    ctx.app.setSetting('brand_revision', String(revision));
    ctx.app.audit(ctx.user!.email, 'Updated app branding and onboarding content');
    return { ok: true };
  });

  r.get('/api/admin/audit', SA, (ctx) => ({
    entries: ctx.app.db.all<{ at: string; actor: string; action: string }>('SELECT at, actor, action FROM audit ORDER BY id DESC LIMIT ?', limitParam(ctx.url, 100, 500)),
  }));

}
