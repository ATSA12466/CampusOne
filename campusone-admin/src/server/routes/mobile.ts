import type { App } from '../app.ts';
import type { Router } from '../http.ts';
import { HttpError, badRequest, notFound } from '../http.ts';
import { audienceMatches } from '../integrations/dispatch.ts';
import { aiFeatureOn, isLive, runtimeConfig } from '../integrations/service.ts';
import { aiComplete, ProviderError } from '../integrations/providers.ts';
import { sendEmail } from '../integrations/providers.ts';
import { createHash, randomInt, timingSafeEqual } from 'node:crypto';
import { issueToken, login, publicUser } from '../auth.ts';
import { hashPassword, randomId } from '../crypto.ts';
import { now } from '../db.ts';
import type { UserRow } from '../db.ts';
import { announcementJson, listingJson, materialJson, pollJson, slotJson, enquiryJson } from '../mappers.ts';
import type { AnnouncementRow, EnquiryRow, ListingRow, MaterialRow, PollRow, SlotRow } from '../mappers.ts';
import { email, limitParam, oneOf, password, str } from '../validate.ts';
import { votesFor } from './src.ts';

/**
 * The API the Flutter app calls. Everything here reads what the admins set:
 * module switches, maintenance mode, announcements, timetables, moderated
 * listings and the AI module. See docs/MOBILE_API.md.
 */
const KIND_FLAG: Record<string, string> = { hostel: 'hostels', market: 'market', opportunity: 'jobs' };

function flagOn(ctx: { app: App }, key: string): boolean {
  return ctx.app.db.get<{ enabled: number }>('SELECT enabled FROM flags WHERE key = ?', key)?.enabled === 1;
}

export function registerMobileRoutes(r: Router): void {
  const requireVerifiedStudent = (ctx: { user: UserRow | null }) => {
    if (ctx.user?.role === 'student' && !ctx.user.student_email_verified) {
      throw new HttpError(403, 'Verify your GCTU student email to use academic features.', 'student_verification_required');
    }
  };
  r.get('/api/v1/config', 'public', (ctx) => {
    const flags: Record<string, boolean> = {};
    for (const f of ctx.app.db.all<{ key: string; enabled: number }>('SELECT key, enabled FROM flags')) flags[f.key] = !!f.enabled;
    const aiLive = flags.ai === true && isLive(ctx.app, 'ai');
    return {
      maintenance: ctx.app.maintenance,
      branding: {
        revision: ctx.app.setting('brand_revision', '1'),
        appName: ctx.app.setting('brand_app_name', 'CampusOne'),
        logoImageUrl: ctx.app.setting('brand_logo_image_url', ''),
        primaryColor: ctx.app.setting('brand_primary_color', '#25206A'),
        accentColor: ctx.app.setting('brand_accent_color', '#F4B52A'),
        tagline: ctx.app.setting('brand_tagline', 'Your campus. All in one place.'),
        splashTitle: ctx.app.setting('brand_splash_title', 'Your campus, connected.'),
        splashSubtitle: ctx.app.setting('brand_splash_subtitle', 'Campus life in one place.'),
        splashImageUrl: ctx.app.setting('brand_splash_image_url', ''),
        onboardingTitle: ctx.app.setting('brand_onboarding_title', 'Get more from campus life.'),
        onboardingText: ctx.app.setting('brand_onboarding_text', 'Find campus updates, learning resources and student services.'),
        onboardingImageUrl: ctx.app.setting('brand_onboarding_image_url', ''),
        onboardingButtonText: ctx.app.setting('brand_onboarding_button', 'Get started'),
        maintenanceText: ctx.app.setting('brand_maintenance_text', 'CampusOne is being updated. Please check again shortly.'),
      },
      registrationOpen: ctx.app.setting('registration_open', 'true') === 'true',
      minAppVersion: ctx.app.setting('min_app_version', '') || null,
      flags,
      ai: {
        available: aiLive,
        studyAssistant: aiLive && aiFeatureOn(ctx.app, 'f_study_assistant'),
        quiz: aiLive && aiFeatureOn(ctx.app, 'f_quiz'),
        timetableScan: aiLive && aiFeatureOn(ctx.app, 'f_timetable_scan'),
        examScan: aiLive && aiFeatureOn(ctx.app, 'f_exam_scan'),
      },
      serverTime: now(),
    };
  });

  // ------------------------------------------------------------------- auth
  r.post('/api/v1/auth/login', 'public', (ctx) => {
    const { user, token } = login(ctx.app, ctx.body.email, ctx.body.password, ctx.ip, 'mobile');
    return { user: publicUser(user, ctx.app), token };
  });

  r.post('/api/v1/auth/register', 'public', (ctx) => {
    if (ctx.app.setting('registration_open', 'true') !== 'true') throw new HttpError(403, 'Sign-up is closed right now.', 'registration_closed');
    if (!ctx.app.allow(`register:${ctx.ip}`, 10, 60 * 60_000)) throw new HttpError(429, 'Too many sign-ups from this network. Try again later.', 'rate_limited');
    const address = email(ctx.body, 'email');
    const pass = password(ctx.body, 'password', 8);
    if (ctx.app.db.get('SELECT 1 FROM users WHERE email = ?', address)) throw new HttpError(409, 'An account with that e-mail already exists.', 'conflict');
    const id = randomId();
    ctx.app.db.run(
      `INSERT INTO users (id, name, email, phone, password_hash, role, level, programme, created_at) VALUES (?, ?, ?, ?, ?, 'student', ?, ?, ?)`,
      id, str(ctx.body, 'name', 'Name', { max: 100 }), address,
      str(ctx.body, 'phone', 'Phone', { max: 30, required: false }),
      hashPassword(pass),
      str(ctx.body, 'level', 'Level', { max: 40, required: false }),
      str(ctx.body, 'programme', 'Programme', { max: 100, required: false }),
      now(),
    );
    const user = ctx.app.db.get<UserRow>('SELECT * FROM users WHERE id = ?', id)!;
    return { user: publicUser(user, ctx.app), token: issueToken(ctx.app, user, 'mobile').token };
  });

  r.get('/api/v1/me', 'user', (ctx) => ({ user: publicUser(ctx.user!, ctx.app) }));

  r.post('/api/v1/auth/student-verification/start', 'user', async (ctx) => {
    const user = ctx.user!;
    if (user.role !== 'student') throw new HttpError(400, 'Student email verification is only for student accounts.', 'student_only');
    if (user.student_email_verified) return { verified: true };
    if (!user.email.toLowerCase().endsWith('@live.gctu.edu.gh')) {
      throw new HttpError(400, 'Your account email must end in @live.gctu.edu.gh. Sign in with your GCTU student email.', 'gctu_email_required');
    }
    if (!ctx.app.allow(`student-verification-send:${user.id}`, 3, 60 * 60_000)) throw new HttpError(429, 'Too many verification codes requested. Try again in an hour.', 'rate_limited');
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const codeHash = createHash('sha256').update(`${ctx.app.config.secret}:${user.id}:${code}`).digest('hex');
    ctx.app.db.run('INSERT INTO student_email_verifications (user_id,code_hash,expires_at,attempts,sent_at) VALUES (?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET code_hash=excluded.code_hash,expires_at=excluded.expires_at,attempts=0,sent_at=excluded.sent_at', user.id, codeHash, new Date(Date.now() + 10 * 60_000).toISOString(), 0, now());
    try {
      await sendEmail(ctx.app, user.email, 'Your CampusOne student verification code', `Your verification code is ${code}. It expires in 10 minutes. If you did not request it, ignore this message.`);
    } catch (e) {
      ctx.app.db.run('DELETE FROM student_email_verifications WHERE user_id=?', user.id);
      if (e instanceof ProviderError) throw new HttpError(503, 'Verification email could not be sent. Ask the administrator to check the email integration.', 'email_unavailable');
      throw e;
    }
    return { sent: true, expiresInSeconds: 600 };
  });

  r.post('/api/v1/auth/student-verification/verify', 'user', (ctx) => {
    const user = ctx.user!;
    if (user.role !== 'student') throw new HttpError(400, 'Student email verification is only for student accounts.', 'student_only');
    if (user.student_email_verified) return { verified: true, user: publicUser(user, ctx.app) };
    if (!user.email.toLowerCase().endsWith('@live.gctu.edu.gh')) throw new HttpError(400, 'Use an account ending in @live.gctu.edu.gh.', 'gctu_email_required');
    const code = typeof ctx.body.code === 'string' ? ctx.body.code.trim() : '';
    if (!/^\d{6}$/.test(code)) throw new HttpError(400, 'Enter the 6-digit code from your GCTU email.', 'invalid_code');
    const row = ctx.app.db.get<{ code_hash: string; expires_at: string; attempts: number }>('SELECT code_hash,expires_at,attempts FROM student_email_verifications WHERE user_id=?', user.id);
    if (!row || new Date(row.expires_at).getTime() <= Date.now()) {
      ctx.app.db.run('DELETE FROM student_email_verifications WHERE user_id=?', user.id);
      throw new HttpError(400, 'That code has expired. Request a new one.', 'code_expired');
    }
    if (row.attempts >= 5) throw new HttpError(429, 'Too many incorrect codes. Request a new code.', 'attempts_exceeded');
    const digest = createHash('sha256').update(`${ctx.app.config.secret}:${user.id}:${code}`).digest();
    const expected = Buffer.from(row.code_hash, 'hex');
    const matches = expected.length === digest.length && timingSafeEqual(expected, digest);
    if (!matches) {
      ctx.app.db.run('UPDATE student_email_verifications SET attempts=attempts+1 WHERE user_id=?', user.id);
      throw new HttpError(400, 'That verification code is incorrect.', 'invalid_code');
    }
    ctx.app.db.run('UPDATE users SET student_email_verified=1 WHERE id=?', user.id);
    ctx.app.db.run('DELETE FROM student_email_verifications WHERE user_id=?', user.id);
    ctx.app.audit(user.email, 'Verified GCTU student email');
    return { verified: true, user: publicUser(ctx.app.db.get<UserRow>('SELECT * FROM users WHERE id=?', user.id)!, ctx.app) };
  });

  r.patch('/api/v1/me', 'user', (ctx) => {
    const u = ctx.user!;
    const name = ctx.body.name === undefined ? u.name : str(ctx.body, 'name', 'Name', { max: 100 });
    const phone = ctx.body.phone === undefined ? u.phone : str(ctx.body, 'phone', 'Phone', { max: 30, required: false });
    const level = ctx.body.level === undefined ? u.level : str(ctx.body, 'level', 'Level', { max: 40, required: false });
    const programme = ctx.body.programme === undefined ? u.programme : str(ctx.body, 'programme', 'Programme', { max: 100, required: false });
    ctx.app.db.run('UPDATE users SET name = ?, phone = ?, level = ?, programme = ? WHERE id = ?', name, phone, level, programme, u.id);
    return { user: publicUser(ctx.app.db.get<UserRow>('SELECT * FROM users WHERE id = ?', u.id)!, ctx.app) };
  });

  // Personal records used by grades, notes, tasks, timetables and study tools.
  // Every row is scoped to the authenticated account, regardless of payload.
  const storeCollections = new Set([
    'grades', 'notes', 'tasks', 'sessions', 'plans', 'studyPlans',
    'flashcards', 'quizReview', 'profile', 'requests', 'communityPosts',
    'replies', 'reactions', 'concerns', 'hostelRecords', 'marketRecords',
    'opportunityRecords', 'lostFoundRecords', 'mediaRecords', 'enquiries',
  ]);
  const storeCollection = (value: string | null): string => {
    const collection = value?.trim() ?? '';
    if (!storeCollections.has(collection)) throw badRequest('Choose a supported personal collection.');
    return collection;
  };
  r.get('/api/me/store', 'user', (ctx) => {
    const requested = ctx.url.searchParams.get('collection') ?? '';
    const collections = requested.split(',').map((x) => storeCollection(x));
    if (collections.some((c) => ['grades','notes','tasks','sessions','plans','studyPlans','flashcards','quizReview'].includes(c))) requireVerifiedStudent(ctx);
    const rows = ctx.app.db.all<{ collection: string; item_json: string }>(
      `SELECT collection, item_json FROM personal_store WHERE user_id = ? AND collection IN (${collections.map(() => '?').join(',')}) ORDER BY updated_at DESC`,
      ctx.user!.id, ...collections,
    );
    if (collections.length === 1) return { items: rows.map((row) => JSON.parse(row.item_json)) };
    return { items: Object.fromEntries(collections.map((name) => [name, rows.filter((row) => row.collection === name).map((row) => JSON.parse(row.item_json))])) };
  });
  r.put('/api/me/store', 'user', (ctx) => {
    const collection = storeCollection(typeof ctx.body.collection === 'string' ? ctx.body.collection : null);
    if (['grades','notes','tasks','sessions','plans','studyPlans','flashcards','quizReview'].includes(collection)) requireVerifiedStudent(ctx);
    if (!ctx.body.item || typeof ctx.body.item !== 'object' || Array.isArray(ctx.body.item)) throw badRequest('The item must be a JSON object.');
    const item = ctx.body.item as Record<string, unknown>;
    const id = str(item, 'id', 'Item ID', { max: 120 });
    ctx.app.db.run(
      `INSERT INTO personal_store (user_id, collection, item_id, item_json, updated_at) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(user_id, collection, item_id) DO UPDATE SET item_json = excluded.item_json, updated_at = excluded.updated_at`,
      ctx.user!.id, collection, id, JSON.stringify(item), now(),
    );
    return { item };
  });
  r.delete('/api/me/store', 'user', (ctx) => {
    const collection = storeCollection(ctx.url.searchParams.get('collection'));
    if (['grades','notes','tasks','sessions','plans','studyPlans','flashcards','quizReview'].includes(collection)) requireVerifiedStudent(ctx);
    const id = ctx.url.searchParams.get('id')?.trim() ?? '';
    if (!id || id.length > 120) throw badRequest('Enter a valid item ID.');
    const result = ctx.app.db.run('DELETE FROM personal_store WHERE user_id = ? AND collection = ? AND item_id = ?', ctx.user!.id, collection, id);
    return { removed: result.changes > 0 };
  });

  r.post('/api/v1/devices', 'user', (ctx) => {
    const token = str(ctx.body, 'token', 'Device token', { max: 500 });
    ctx.app.db.run(
      'INSERT INTO devices (token, user_id, platform, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(token) DO UPDATE SET user_id = excluded.user_id, platform = excluded.platform, updated_at = excluded.updated_at',
      token, ctx.user!.id, str(ctx.body, 'platform', 'Platform', { max: 20, required: false }), now(),
    );
    return { ok: true };
  });

  // ------------------------------------------------------------ announcements
  r.get('/api/v1/announcements', 'user', (ctx) => {
    const rows = ctx.app.db.all<AnnouncementRow>('SELECT * FROM announcements ORDER BY pinned DESC, created_at DESC LIMIT 100');
    return {
      announcements: rows
        .filter((a) => audienceMatches(a.audience, ctx.user!) || ctx.user!.role !== 'student')
        .slice(0, 50)
        .map((a) => {
          const j = announcementJson(a);
          return { id: j.id, title: j.title, body: j.body, audience: j.audience, pinned: j.pinned, createdAt: j.createdAt };
        }),
    };
  });

  // Search the shared student-visible catalogue, rather than just the
  // currently open screen. Academic results are omitted until verification.
  r.get('/api/v1/search', 'user', (ctx) => {
    const query = (ctx.url.searchParams.get('q') ?? '').trim().toLowerCase().slice(0, 100);
    if (query.length < 2) return { items: [] };
    const terms = query.split(/\s+/).filter(Boolean);
    const items: Array<{ id: string; title: string; subtitle: string; snippet: string; section: string; score: number }> = [];
    const add = (item: Omit<(typeof items)[number], 'score'>, text: string) => {
      const haystack = text.toLowerCase();
      const matches = terms.filter((term) => haystack.includes(term)).length;
      if (matches === 0) return;
      const title = item.title.toLowerCase();
      const score = matches * 10 + (title.includes(query) ? 20 : 0) + (title.startsWith(query) ? 10 : 0);
      items.push({ ...item, score });
    };

    const announcements = ctx.app.db.all<{ id: string; title: string; body: string; audience: string }>('SELECT id,title,body,audience FROM announcements ORDER BY pinned DESC,created_at DESC LIMIT 300');
    for (const row of announcements) {
      if (ctx.user!.role === 'student' && !audienceMatches(row.audience, ctx.user!)) continue;
      add({ id: row.id, title: row.title, subtitle: 'SRC announcement', snippet: row.body, section: 'announcements' }, `${row.title} ${row.body}`);
    }

    const campus = ctx.app.db.all<{ id: string; kind: string; title: string; category: string; description: string; venue: string }>("SELECT id,kind,title,category,description,venue FROM campus_content WHERE status='published' ORDER BY created_at DESC LIMIT 300");
    for (const row of campus) add({ id: row.id, title: row.title, subtitle: `${row.kind} · ${row.category}`, snippet: `${row.description} ${row.venue}`, section: row.kind === 'club' ? 'clubs' : 'events' }, `${row.title} ${row.category} ${row.description} ${row.venue}`);

    const posts = ctx.app.db.all<{ id: string; body: string; topic: string }>("SELECT id,body,topic FROM community_posts WHERE status='published' ORDER BY created_at DESC LIMIT 300");
    for (const row of posts) add({ id: row.id, title: row.topic || 'Community post', subtitle: 'Community', snippet: row.body, section: 'community' }, `${row.topic} ${row.body}`);

    const kinds = ['hostel', 'market', 'opportunity', 'promo'] as const;
    for (const kind of kinds) {
      const flag = KIND_FLAG[kind];
      if (flag && !flagOn(ctx, flag)) continue;
      const rows = ctx.app.db.all<{ id: string; title: string; subtitle: string; owner: string; price: string }>("SELECT id,title,subtitle,owner,price FROM listings WHERE kind=? AND status IN ('approved','featured') ORDER BY created_at DESC LIMIT 300", kind);
      for (const row of rows) add({ id: row.id, title: row.title, subtitle: `${kind} · ${row.price}`, snippet: `${row.subtitle} ${row.owner}`, section: 'campus' }, `${row.title} ${row.subtitle} ${row.owner} ${row.price}`);
    }

    if (ctx.user!.role !== 'student' || ctx.user!.student_email_verified) {
      const materials = ctx.app.db.all<{ id: string; course: string; title: string; type: string }>("SELECT id,course,title,type FROM materials WHERE status='approved' ORDER BY created_at DESC LIMIT 300");
      for (const row of materials) add({ id: row.id, title: row.title, subtitle: `${row.course} · ${row.type}`, snippet: 'Course resource', section: 'learning' }, `${row.course} ${row.title} ${row.type}`);
      const slots = ctx.app.db.all<{ id: string; course: string; when_text: string; time_text: string; venue: string; is_exam: number; level: string }>('SELECT id,course,when_text,time_text,venue,is_exam,level FROM slots ORDER BY rowid LIMIT 500');
      for (const row of slots) add({ id: row.id, title: row.course, subtitle: row.is_exam ? 'Exam timetable' : 'Class timetable', snippet: `${row.when_text} ${row.time_text} ${row.venue} Level ${row.level}`, section: 'learning' }, `${row.course} ${row.when_text} ${row.time_text} ${row.venue} ${row.level}`);
    }

    items.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
    return { items: items.slice(0, 60).map(({ score: _score, ...item }) => item) };
  });

  // ------------------------------------------------------ timetable and exams
  const slotsFor = (ctx: { app: App; user: UserRow | null; url: URL }, exam: boolean) => {
    const level = ctx.url.searchParams.get('level') ?? ctx.user?.level ?? '';
    const rows = level
      ? ctx.app.db.all<SlotRow>('SELECT * FROM slots WHERE is_exam = ? AND level = ? ORDER BY rowid', exam ? 1 : 0, level)
      : ctx.app.db.all<SlotRow>('SELECT * FROM slots WHERE is_exam = ? ORDER BY rowid', exam ? 1 : 0);
    return rows.map(slotJson);
  };
  r.get('/api/v1/timetable', 'user', (ctx) => { requireVerifiedStudent(ctx); return { slots: slotsFor(ctx, false) }; });
  r.get('/api/v1/exams', 'user', (ctx) => { requireVerifiedStudent(ctx); return { slots: slotsFor(ctx, true) }; });

  r.get('/api/v1/class-reps', 'user', (ctx) => {
    requireVerifiedStudent(ctx);
    const level = ctx.url.searchParams.get('level');
    const rows = level
      ? ctx.app.db.all<{ id: string; name: string; course: string; programme: string; level: string; phone: string; group_name: string; session: string }>('SELECT * FROM class_reps WHERE level = ? ORDER BY course, group_name, name', level)
      : ctx.app.db.all<{ id: string; name: string; course: string; programme: string; level: string; phone: string; group_name: string; session: string }>('SELECT * FROM class_reps ORDER BY level, course, group_name, name');
    return { classReps: rows.map((r) => ({ id: r.id, name: r.name, course: r.course, programme: r.programme || '', level: r.level, group: r.group_name, session: r.session, phone: r.phone })) };
  });

  // --------------------------------------------------------------- materials
  r.get('/api/v1/materials', 'user', (ctx) => {
    requireVerifiedStudent(ctx);
    const course = ctx.url.searchParams.get('course');
    const rows = course
      ? ctx.app.db.all<MaterialRow>("SELECT * FROM materials WHERE status = 'approved' AND course = ? ORDER BY created_at DESC", course)
      : ctx.app.db.all<MaterialRow>("SELECT * FROM materials WHERE status = 'approved' ORDER BY created_at DESC LIMIT 200");
    return { materials: rows.map(materialJson) };
  });

  const resourceJson = (row: MaterialRow) => ({
    id: row.id, title: row.title, course: row.course, category: row.type,
    description: `${row.course} · ${row.type}`, author: row.uploader,
    url: row.url, source: row.url, details: { intro: `${row.course} · ${row.type}`, source: row.url },
  });
  r.get('/api/resources', 'user', (ctx) => {
    requireVerifiedStudent(ctx);
    const search = (ctx.url.searchParams.get('search') ?? '').trim().toLowerCase();
    const size = limitParam(ctx.url, 30, 100);
    const rows = ctx.app.db.all<MaterialRow>("SELECT * FROM materials WHERE status='approved' ORDER BY created_at DESC");
    const filtered = rows.filter((row) => !search || `${row.course} ${row.title} ${row.type} ${row.uploader}`.toLowerCase().includes(search));
    return { items: filtered.slice(0, size).map(resourceJson), total: filtered.length, page: 1, pageSize: size };
  });
  r.get('/api/resources/:id', 'user', (ctx) => {
    requireVerifiedStudent(ctx);
    const row = ctx.app.db.get<MaterialRow>("SELECT * FROM materials WHERE id=? AND status='approved'", ctx.params.id!);
    if (!row) throw notFound('Course resource not found.');
    return resourceJson(row);
  });

  r.post('/api/v1/materials', 'user', (ctx) => {
    requireVerifiedStudent(ctx);
    const id = randomId();
    ctx.app.db.run(
      `INSERT INTO materials (id, course, title, type, uploader, url, status, created_at) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
      id, str(ctx.body, 'course', 'Course', { max: 40 }), str(ctx.body, 'title', 'Title', { max: 150 }),
      oneOf(ctx.body, 'type', 'Type', ['Slides', 'Notes', 'Past questions', 'Other'] as const),
      ctx.user!.name, str(ctx.body, 'url', 'Link', { max: 500, required: false }), now(),
    );
    return { material: materialJson(ctx.app.db.get<MaterialRow>('SELECT * FROM materials WHERE id = ?', id)!) };
  });

  // ---------------------------------------------------------------- listings
  r.get('/api/v1/listings', 'user', (ctx) => {
    const kind = oneOf({ kind: ctx.url.searchParams.get('kind') ?? '' }, 'kind', 'Type', ['hostel', 'market', 'opportunity', 'promo'] as const);
    const flag = KIND_FLAG[kind];
    if (flag && !flagOn(ctx, flag)) throw new HttpError(403, 'This part of CampusOne is switched off right now.', 'module_off');
    const rows = ctx.app.db.all<ListingRow>(
      "SELECT * FROM listings WHERE kind = ? AND status IN ('approved','featured') ORDER BY (status = 'featured') DESC, created_at DESC LIMIT 200",
      kind,
    );
    return { listings: rows.map(listingJson) };
  });

  r.post('/api/v1/listings', 'user', (ctx) => {
    if (!flagOn(ctx, 'market')) throw new HttpError(403, 'The marketplace is switched off right now.', 'module_off');
    const id = randomId();
    ctx.app.db.run(
      `INSERT INTO listings (id, kind, title, subtitle, owner, price, status, created_by, created_at) VALUES (?, 'market', ?, ?, ?, ?, 'pending', ?, ?)`,
      id, str(ctx.body, 'title', 'Title', { max: 120 }), str(ctx.body, 'subtitle', 'Details', { max: 300, required: false }),
      ctx.user!.name, str(ctx.body, 'price', 'Price', { max: 60, required: false }), ctx.user!.email, now(),
    );
    return { listing: listingJson(ctx.app.db.get<ListingRow>('SELECT * FROM listings WHERE id = ?', id)!) };
  });

  r.post('/api/v1/listings/:id/report', 'user', (ctx) => {
    const row = ctx.app.db.get<ListingRow>('SELECT * FROM listings WHERE id = ?', ctx.params.id!);
    if (!row) throw notFound('Listing not found.');
    ctx.app.db.run('UPDATE listings SET reports = reports + 1 WHERE id = ?', row.id);
    return { ok: true };
  });

  // ------------------------------------------------------------------- polls
  r.get('/api/v1/polls', 'user', (ctx) => {
    const rows = ctx.app.db.all<PollRow>('SELECT * FROM polls WHERE open = 1 ORDER BY created_at DESC');
    return {
      polls: rows.map((p) => {
        const mine = ctx.app.db.get<{ option_index: number }>('SELECT option_index FROM poll_votes WHERE poll_id = ? AND user_id = ?', p.id, ctx.user!.id);
        return pollJson(p, votesFor(ctx.app.db, p), mine?.option_index ?? null);
      }),
    };
  });

  r.post('/api/v1/polls/:id/vote', 'user', (ctx) => {
    const poll = ctx.app.db.get<PollRow>('SELECT * FROM polls WHERE id = ?', ctx.params.id!);
    if (!poll) throw notFound('Poll not found.');
    if (!poll.open) throw new HttpError(409, 'This poll is closed.', 'closed');
    const options = JSON.parse(poll.options_json) as string[];
    const option = ctx.body.option;
    if (typeof option !== 'number' || !Number.isInteger(option) || option < 0 || option >= options.length) throw badRequest('Choose one of the poll options.');
    try {
      ctx.app.db.run('INSERT INTO poll_votes (poll_id, user_id, option_index) VALUES (?, ?, ?)', poll.id, ctx.user!.id, option);
    } catch {
      throw new HttpError(409, 'You already voted in this poll.', 'conflict');
    }
    return { poll: pollJson(poll, votesFor(ctx.app.db, poll), option) };
  });

  // --------------------------------------------------------------- enquiries
  r.get('/api/v1/enquiries', 'user', (ctx) => ({
    enquiries: ctx.app.db.all<EnquiryRow>('SELECT * FROM enquiries WHERE user_id = ? ORDER BY created_at DESC LIMIT 100', ctx.user!.id).map(enquiryJson),
  }));

  r.post('/api/v1/enquiries', 'user', (ctx) => {
    const id = randomId();
    ctx.app.db.run(
      'INSERT INTO enquiries (id, user_id, student, subject, body, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      id, ctx.user!.id, ctx.user!.name, str(ctx.body, 'subject', 'Subject', { max: 150 }), str(ctx.body, 'body', 'Message', { max: 2000 }), now(),
    );
    return { enquiry: enquiryJson(ctx.app.db.get<EnquiryRow>('SELECT * FROM enquiries WHERE id = ?', id)!) };
  });

  // --------------------------------------------------- club and event requests
  r.post('/api/v1/approvals', 'user', (ctx) => {
    const kind = oneOf(ctx.body, 'kind', 'Type', ['club', 'event'] as const);
    ctx.app.db.run(
      `INSERT INTO approvals (id, is_event, title, requester, status, created_at) VALUES (?, ?, ?, ?, 'pending', ?)`,
      randomId(), kind === 'event' ? 1 : 0, str(ctx.body, 'title', 'Name', { max: 120 }), ctx.user!.name, now(),
    );
    return { ok: true };
  });

  // --------------------------------------------------------------- messaging
  const isConversationMember = (ctx: { app: App; user: UserRow | null }, id: string): boolean =>
    !!ctx.app.db.get('SELECT 1 FROM conversation_members WHERE conversation_id = ? AND user_id = ?', id, ctx.user!.id);
  const conversationJson = (ctx: { app: App; user: UserRow | null }, id: string) => {
    const row = ctx.app.db.get<{ id: string; kind: string; title: string; club_id: string; created_at: string }>('SELECT * FROM conversations WHERE id = ?', id)!;
    const last = ctx.app.db.get<{ body: string; sender_id: string; created_at: string }>('SELECT body, sender_id, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 1', id);
    const sender = last ? ctx.app.db.get<{ name: string }>('SELECT name FROM users WHERE id = ?', last.sender_id)?.name ?? '' : '';
    const members = ctx.app.db.get<{ total: number }>('SELECT COUNT(*) AS total FROM conversation_members WHERE conversation_id = ?', id)?.total ?? 0;
    const membership = ctx.app.db.get<{ last_read_at: string }>('SELECT last_read_at FROM conversation_members WHERE conversation_id = ? AND user_id = ?', id, ctx.user!.id);
    const unread = ctx.app.db.get<{ total: number }>('SELECT COUNT(*) AS total FROM messages WHERE conversation_id = ? AND sender_id <> ? AND created_at > ?', id, ctx.user!.id, membership?.last_read_at ?? '')?.total ?? 0;
    return { id: row.id, kind: row.kind, title: row.title, clubId: row.club_id, updatedAt: last?.created_at ?? row.created_at, unread, members, lastMessage: last ? { body: last.body, senderName: sender } : null };
  };
  const requireConversationMember = (ctx: { app: App; user: UserRow | null }, id: string): void => {
    if (!isConversationMember(ctx, id)) throw notFound('Conversation not found.');
  };
  r.get('/api/conversations', 'user', (ctx) => {
    const rows = ctx.app.db.all<{ conversation_id: string }>('SELECT conversation_id FROM conversation_members WHERE user_id = ? ORDER BY joined_at DESC', ctx.user!.id);
    return { items: rows.map((row) => conversationJson(ctx, row.conversation_id)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) };
  });
  r.post('/api/conversations', 'user', (ctx) => {
    const kind = oneOf(ctx.body, 'kind', 'Conversation type', ['direct', 'group'] as const);
    let memberIds: string[];
    let title = '';
    if (kind === 'direct') {
      const other = str(ctx.body, 'userId', 'Student', { max: 100 });
      if (other === ctx.user!.id || !ctx.app.db.get('SELECT 1 FROM users WHERE id = ? AND role = \'student\' AND suspended = 0', other)) throw notFound('Student not found.');
      memberIds = [ctx.user!.id, other];
    } else {
      title = str(ctx.body, 'title', 'Group name', { max: 100 });
      const raw = ctx.body.memberIds;
      if (!Array.isArray(raw) || raw.length > 48 || raw.some((value) => typeof value !== 'string')) throw badRequest('Choose up to 48 group members.');
      memberIds = [...new Set([ctx.user!.id, ...(raw as string[])])];
      if (memberIds.some((id) => !ctx.app.db.get('SELECT 1 FROM users WHERE id = ? AND role = \'student\' AND suspended = 0', id))) throw badRequest('One or more group members are unavailable.');
    }
    const id = randomId();
    ctx.app.db.tx(() => {
      ctx.app.db.run('INSERT INTO conversations (id, kind, title, created_at) VALUES (?, ?, ?, ?)', id, kind, title, now());
      for (const userId of memberIds) ctx.app.db.run('INSERT INTO conversation_members (conversation_id, user_id, joined_at, last_read_at) VALUES (?, ?, ?, ?)', id, userId, now(), now());
    });
    return { item: conversationJson(ctx, id) };
  });
  r.get('/api/conversations/:id/messages', 'user', (ctx) => {
    requireConversationMember(ctx, ctx.params.id!);
    const items = ctx.app.db.all<{ id: string; sender_id: string; name: string; body: string; created_at: string }>(
      'SELECT m.id, m.sender_id, u.name, m.body, m.created_at FROM messages m JOIN users u ON u.id = m.sender_id WHERE m.conversation_id = ? ORDER BY m.created_at LIMIT 500', ctx.params.id!,
    ).map((row) => ({ id: row.id, senderId: row.sender_id, senderName: row.name, body: row.body, createdAt: row.created_at }));
    return { items };
  });
  r.post('/api/conversations/:id/messages', 'user', (ctx) => {
    requireConversationMember(ctx, ctx.params.id!);
    const body = str(ctx.body, 'body', 'Message', { max: 4000 });
    const item = { id: randomId(), conversationId: ctx.params.id!, senderId: ctx.user!.id, senderName: ctx.user!.name, body, createdAt: now() };
    ctx.app.db.run('INSERT INTO messages (id, conversation_id, sender_id, body, created_at) VALUES (?, ?, ?, ?, ?)', item.id, item.conversationId, item.senderId, item.body, item.createdAt);
    const members = ctx.app.db.all<{ user_id: string }>('SELECT user_id FROM conversation_members WHERE conversation_id = ? AND user_id <> ?', item.conversationId, item.senderId);
    for (const member of members) ctx.app.db.run('INSERT INTO notifications (id,user_id,kind,title,body,created_at) VALUES (?,?,?,?,?,?)', randomId(), member.user_id, 'message', `Message from ${item.senderName}`, item.body.slice(0, 180), item.createdAt);
    return { item };
  });
  r.post('/api/conversations/:id/read', 'user', (ctx) => {
    requireConversationMember(ctx, ctx.params.id!);
    ctx.app.db.run('UPDATE conversation_members SET last_read_at = ? WHERE conversation_id = ? AND user_id = ?', now(), ctx.params.id!, ctx.user!.id);
    return { ok: true };
  });

  // ---------------------------------------------------------------------- AI
  r.post('/api/v1/ai/chat', 'user', async (ctx) => {
    requireVerifiedStudent(ctx);
    if (!flagOn(ctx, 'ai') || !aiFeatureOn(ctx.app, 'f_study_assistant')) {
      throw new HttpError(403, 'The study assistant is not available right now.', 'module_off');
    }
    const message = str(ctx.body, 'message', 'Message', { max: 2000 });
    if (!ctx.app.allow(`ai:${ctx.user!.id}`, 15, 60_000)) throw new HttpError(429, 'Slow down a little and try again in a minute.', 'rate_limited');

    // Optional monthly cap set by the Super Admin (counts requests across all students).
    const month = now().slice(0, 7);
    const cap = Number(runtimeConfig(ctx.app, 'ai').monthly_cap || 0);
    const used = ctx.app.db.get<{ requests: number }>('SELECT requests FROM ai_usage WHERE month = ?', month)?.requests ?? 0;
    if (cap > 0 && used >= cap) throw new HttpError(429, 'The study assistant has reached its monthly limit.', 'ai_cap');

    try {
      const reply = await aiComplete(
        ctx.app,
        message,
        'You are CampusOne, a study assistant for university students in Ghana. Be accurate, concise and encouraging. If you are unsure, say so.',
      );
      ctx.app.db.run('INSERT INTO ai_usage (month, requests) VALUES (?, 1) ON CONFLICT(month) DO UPDATE SET requests = requests + 1', month);
      return { reply };
    } catch (e) {
      if (e instanceof ProviderError) throw new HttpError(502, 'The study assistant could not answer. Try again shortly.', 'ai_failed');
      throw e;
    }
  });
}
