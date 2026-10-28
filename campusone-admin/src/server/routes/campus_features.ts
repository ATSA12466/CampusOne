import type { App } from '../app.ts';
import type { Router } from '../http.ts';
import { badRequest, HttpError, notFound } from '../http.ts';
import { randomId } from '../crypto.ts';
import { now } from '../db.ts';
import type { UserRow } from '../db.ts';
import { oneOf, str } from '../validate.ts';

interface ContentRow {
  id: string;
  kind: 'club' | 'event';
  title: string;
  category: string;
  description: string;
  venue: string;
  date_text: string;
  details_json: string;
  status: 'draft' | 'published';
  created_at: string;
}

function details(row: ContentRow): Record<string, unknown> {
  try { return JSON.parse(row.details_json) as Record<string, unknown>; }
  catch { return {}; }
}

function contentJson(app: App, row: ContentRow): Record<string, unknown> {
  const d = details(row);
  if (row.kind === 'club') {
    const memberCount = app.db.get<{ total: number }>("SELECT COUNT(*) AS total FROM club_memberships WHERE club_id = ? AND status = 'active'", row.id)?.total ?? 0;
    return { id: row.id, name: row.title, category: row.category, description: row.description, details: { ...d, memberCount } };
  }
  const registered = app.db.get<{ total: number }>('SELECT COUNT(*) AS total FROM event_rsvps WHERE event_id = ?', row.id)?.total ?? 0;
  return { id: row.id, title: row.title, venue: row.venue, date: row.date_text, category: row.category, seats: Number(d.seats ?? 0), registered, details: { ...d, status: row.status === 'published' ? 'scheduled' : 'draft' } };
}

function findContent(app: App, kind: 'club' | 'event', id: string, published = true): ContentRow {
  const row = app.db.get<ContentRow>(`SELECT * FROM campus_content WHERE kind = ? AND id = ?${published ? " AND status = 'published'" : ''}`, kind, id);
  if (!row) throw notFound(kind === 'club' ? 'Club not found.' : 'Event not found.');
  return row;
}

function listContent(app: App, kind: 'club' | 'event', url: URL): ContentRow[] {
  const search = (url.searchParams.get('search') ?? '').trim().toLowerCase();
  const category = (url.searchParams.get('category') ?? 'all').toLowerCase();
  const rows = app.db.all<ContentRow>("SELECT * FROM campus_content WHERE kind = ? AND status = 'published' ORDER BY created_at DESC", kind);
  return rows.filter((row) => {
    const text = `${row.title} ${row.description} ${row.category}`.toLowerCase();
    return (!search || text.includes(search)) && (category === 'all' || row.category.toLowerCase() === category);
  });
}

export function registerCampusFeatureRoutes(r: Router): void {
  const requireVerifiedStudent = (ctx: { user: UserRow | null }) => {
    if (ctx.user?.role === 'student' && !ctx.user.student_email_verified) {
      throw new HttpError(403, 'Verify your GCTU student email to use academic features.', 'student_verification_required');
    }
  };
  const superAdmin = ['super_admin'] as const;
  const contentKinds = ['club', 'event'] as const;
  const requireAttendance = (app: App): void => {
    if (app.db.get<{ enabled: number }>('SELECT enabled FROM flags WHERE key = ?', 'attendance')?.enabled !== 1) throw new HttpError(403, 'Attendance is switched off right now.', 'module_off');
  };

  // Admin-managed records feed the existing Flutter clubs and events pages.
  r.get('/api/admin/campus-content', superAdmin, (ctx) => {
    const kind = oneOf({ kind: ctx.url.searchParams.get('kind') }, 'kind', 'Content type', contentKinds);
    return { items: ctx.app.db.all<ContentRow>('SELECT * FROM campus_content WHERE kind = ? ORDER BY created_at DESC', kind).map((row) => ({ ...contentJson(ctx.app, row), kind: row.kind, status: row.status, createdAt: row.created_at })) };
  });
  r.post('/api/admin/campus-content', superAdmin, (ctx) => {
    const kind = oneOf(ctx.body, 'kind', 'Content type', contentKinds);
    const title = str(ctx.body, 'title', kind === 'club' ? 'Club name' : 'Event title', { max: 160 });
    const category = str(ctx.body, 'category', 'Category', { max: 80, required: false });
    const description = str(ctx.body, 'description', 'Description', { max: 4000, required: false });
    const venue = str(ctx.body, 'venue', 'Venue', { max: 200, required: false });
    const date = str(ctx.body, 'date', 'Date', { max: 100, required: false });
    const detailsJson = ctx.body.details && typeof ctx.body.details === 'object' && !Array.isArray(ctx.body.details) ? JSON.stringify(ctx.body.details) : '{}';
    const id = randomId();
    ctx.app.db.run('INSERT INTO campus_content (id, kind, title, category, description, venue, date_text, details_json, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, \'published\', ?)', id, kind, title, category, description, venue, date, detailsJson, now());
    ctx.app.audit(ctx.user!.email, `Published ${kind} "${title}"`);
    const row = findContent(ctx.app, kind, id, false);
    return { item: { ...contentJson(ctx.app, row), kind, status: row.status, createdAt: row.created_at } };
  });
  r.patch('/api/admin/campus-content/:id', superAdmin, (ctx) => {
    const status = oneOf(ctx.body, 'status', 'Status', ['draft', 'published'] as const);
    const row = ctx.app.db.get<ContentRow>('SELECT * FROM campus_content WHERE id = ?', ctx.params.id!);
    if (!row) throw notFound('Campus item not found.');
    ctx.app.db.run('UPDATE campus_content SET status = ? WHERE id = ?', status, row.id);
    ctx.app.audit(ctx.user!.email, `Changed ${row.kind} "${row.title}" status to ${status}`);
    return { ok: true };
  });
  r.delete('/api/admin/campus-content/:id', superAdmin, (ctx) => {
    const result = ctx.app.db.run('DELETE FROM campus_content WHERE id = ?', ctx.params.id!);
    if (!result.changes) throw notFound('Campus item not found.');
    return { ok: true };
  });

  for (const kind of contentKinds) {
    const path = kind === 'club' ? '/api/clubs' : '/api/events';
    r.get(path, 'user', (ctx) => {
      const all = listContent(ctx.app, kind, ctx.url);
      const page = Math.max(1, Number(ctx.url.searchParams.get('page') ?? 1) || 1);
      const pageSize = Math.min(100, Math.max(1, Number(ctx.url.searchParams.get('pageSize') ?? 30) || 30));
      return { items: all.slice((page - 1) * pageSize, page * pageSize).map((row) => contentJson(ctx.app, row)), total: all.length, page, pageSize };
    });
    r.get(`${path}/:id`, 'user', (ctx) => contentJson(ctx.app, findContent(ctx.app, kind, ctx.params.id!)));
  }

  r.get('/api/users/me/clubs', 'user', (ctx) => {
    const rows = ctx.app.db.all<{ club_id: string; status: string; pending_requests: number; kind: 'club'; title: string; category: string; description: string; venue: string; date_text: string; details_json: string; created_at: string }>(
      `SELECT c.id AS club_id, m.status, (SELECT COUNT(*) FROM club_memberships q WHERE q.club_id = c.id AND q.status = 'pending') AS pending_requests, c.* FROM club_memberships m JOIN campus_content c ON c.id = m.club_id WHERE m.user_id = ? AND c.kind = 'club' ORDER BY m.requested_at DESC`, ctx.user!.id,
    );
    return { items: rows.map((row) => ({ clubId: row.club_id, clubName: row.title, category: row.category, status: row.status, managed: false, pendingRequests: row.pending_requests })) };
  });
  r.post('/api/clubs/:id/membership', 'user', (ctx) => {
    const club = findContent(ctx.app, 'club', ctx.params.id!);
    const d = details(club);
    if (d.accepting === false) throw badRequest('This club is not accepting members right now.');
    const note = str(ctx.body, 'note', 'Note', { max: 500, required: false });
    const id = randomId();
    ctx.app.db.run("INSERT INTO club_memberships (id, club_id, user_id, status, note, requested_at) VALUES (?, ?, ?, 'pending', ?, ?) ON CONFLICT(club_id, user_id) DO UPDATE SET status = 'pending', note = excluded.note, requested_at = excluded.requested_at", id, club.id, ctx.user!.id, note, now());
    const item = ctx.app.db.get<{ id: string; club_id: string; user_id: string; status: string; note: string; requested_at: string }>('SELECT * FROM club_memberships WHERE club_id = ? AND user_id = ?', club.id, ctx.user!.id)!;
    return { item: { id: item.id, clubId: item.club_id, userId: item.user_id, status: item.status, applicantName: ctx.user!.name, note: item.note, requestedAt: item.requested_at } };
  });
  r.delete('/api/clubs/:id/membership', 'user', (ctx) => {
    ctx.app.db.run('DELETE FROM club_memberships WHERE club_id = ? AND user_id = ?', ctx.params.id!, ctx.user!.id);
    return { ok: true };
  });
  r.patch('/api/clubs/memberships/:id', ['src_admin', 'super_admin'], (ctx) => {
    const status = oneOf(ctx.body, 'status', 'Membership status', ['active', 'rejected'] as const);
    const changed = ctx.app.db.run('UPDATE club_memberships SET status = ? WHERE id = ?', status, ctx.params.id!);
    if (!changed.changes) throw notFound('Membership request not found.');
    const item = ctx.app.db.get<{ id: string; club_id: string; user_id: string; status: string; note: string; requested_at: string; name: string }>('SELECT m.*, u.name FROM club_memberships m JOIN users u ON u.id = m.user_id WHERE m.id = ?', ctx.params.id!)!;
    return { item: { id: item.id, clubId: item.club_id, userId: item.user_id, status: item.status, applicantName: item.name, note: item.note, requestedAt: item.requested_at } };
  });
  r.get('/api/clubs/:id/saved', 'user', (ctx) => ({ saved: !!ctx.app.db.get('SELECT 1 FROM saved_content WHERE user_id = ? AND kind = \'club\' AND item_id = ?', ctx.user!.id, ctx.params.id!) }));
  r.put('/api/clubs/:id/saved', 'user', (ctx) => {
    findContent(ctx.app, 'club', ctx.params.id!);
    if (ctx.body.saved === true) ctx.app.db.run('INSERT OR IGNORE INTO saved_content (user_id, kind, item_id, created_at) VALUES (?, \'club\', ?, ?)', ctx.user!.id, ctx.params.id!, now());
    else ctx.app.db.run('DELETE FROM saved_content WHERE user_id = ? AND kind = \'club\' AND item_id = ?', ctx.user!.id, ctx.params.id!);
    return { saved: ctx.body.saved === true };
  });
  r.get('/api/manage/clubs/:clubId/members', ['src_admin', 'super_admin'], (ctx) => ({ items: ctx.app.db.all<{ id: string; club_id: string; user_id: string; status: string; note: string; requested_at: string; name: string }>('SELECT m.*, u.name FROM club_memberships m JOIN users u ON u.id = m.user_id WHERE m.club_id = ? ORDER BY m.requested_at DESC', ctx.params.clubId!).map((m) => ({ id: m.id, clubId: m.club_id, userId: m.user_id, status: m.status, applicantName: m.name, note: m.note, requestedAt: m.requested_at })) }));

  r.post('/api/events/:id/rsvp', 'user', (ctx) => {
    const event = findContent(ctx.app, 'event', ctx.params.id!);
    const d = details(event);
    const seats = Number(d.seats ?? 0);
    const registered = ctx.app.db.get<{ total: number }>('SELECT COUNT(*) AS total FROM event_rsvps WHERE event_id = ?', event.id)?.total ?? 0;
    if (seats > 0 && registered >= seats && !ctx.app.db.get('SELECT 1 FROM event_rsvps WHERE event_id = ? AND user_id = ?', event.id, ctx.user!.id)) throw badRequest('This event is full.');
    const id = randomId();
    ctx.app.db.run('INSERT OR IGNORE INTO event_rsvps (id, event_id, user_id, created_at) VALUES (?, ?, ?, ?)', id, event.id, ctx.user!.id, now());
    const rsvp = ctx.app.db.get<{ id: string }>('SELECT id FROM event_rsvps WHERE event_id = ? AND user_id = ?', event.id, ctx.user!.id)!;
    return { attending: true, rsvp: { id: rsvp.id } };
  });
  r.delete('/api/events/:id/rsvp', 'user', (ctx) => {
    ctx.app.db.run('DELETE FROM event_rsvps WHERE event_id = ? AND user_id = ?', ctx.params.id!, ctx.user!.id);
    return { attending: false };
  });
  r.get('/api/events/:id/ticket', 'user', (ctx) => {
    const event = findContent(ctx.app, 'event', ctx.params.id!);
    const rsvp = ctx.app.db.get<{ id: string; created_at: string }>('SELECT id, created_at FROM event_rsvps WHERE event_id = ? AND user_id = ?', event.id, ctx.user!.id);
    if (!rsvp) throw notFound('RSVP to this event to get a ticket.');
    return { ticket: { reference: `C1-${rsvp.id.slice(0, 8).toUpperCase()}`, name: ctx.user!.name, event: event.title, status: 'confirmed', issuedAt: rsvp.created_at } };
  });
  r.get('/api/events/:id/saved', 'user', (ctx) => ({ saved: !!ctx.app.db.get('SELECT 1 FROM saved_content WHERE user_id = ? AND kind = \'event\' AND item_id = ?', ctx.user!.id, ctx.params.id!) }));
  r.put('/api/events/:id/saved', 'user', (ctx) => {
    findContent(ctx.app, 'event', ctx.params.id!);
    if (ctx.body.saved === true) ctx.app.db.run('INSERT OR IGNORE INTO saved_content (user_id, kind, item_id, created_at) VALUES (?, \'event\', ?, ?)', ctx.user!.id, ctx.params.id!, now());
    else ctx.app.db.run('DELETE FROM saved_content WHERE user_id = ? AND kind = \'event\' AND item_id = ?', ctx.user!.id, ctx.params.id!);
    return { saved: ctx.body.saved === true };
  });

  // ------------------------------------------------------------ attendance
  const staff = ['src_admin', 'super_admin'] as const;
  const sessionRow = (app: App, id: string) => {
    const row = app.db.get<{ id: string; event_id: string; club_id: string; club_name: string; status: string; starts_at: string; ends_at: string; require_membership: number; max_checkins: number; code: string; created_by: string }>('SELECT * FROM attendance_sessions WHERE id = ?', id);
    if (!row) throw notFound('Attendance session not found.');
    const event = app.db.get<ContentRow>("SELECT * FROM campus_content WHERE id = ? AND kind = 'event'", row.event_id);
    const total = app.db.get<{ total: number }>("SELECT COUNT(*) AS total FROM attendance_records WHERE session_id = ? AND status = 'present'", id)?.total ?? 0;
    return { id: row.id, eventId: row.event_id, eventTitle: event?.title ?? 'Campus event', clubId: row.club_id, clubName: row.club_name, status: row.status, startsAt: row.starts_at, endsAt: row.ends_at, requireMembership: !!row.require_membership, maxCheckins: row.max_checkins, checkinCount: total, code: row.code, createdBy: row.created_by };
  };
  const recordJson = (app: App, row: { id: string; session_id: string; event_id: string; user_id: string; status: string; method: string; checked_in_at: string; name?: string }): Record<string, unknown> => {
    const event = app.db.get<ContentRow>("SELECT * FROM campus_content WHERE id = ? AND kind = 'event'", row.event_id);
    const session = app.db.get<{ club_name: string }>('SELECT club_name FROM attendance_sessions WHERE id = ?', row.session_id);
    return { id: row.id, sessionId: row.session_id, eventId: row.event_id, eventTitle: event?.title ?? 'Campus event', clubName: session?.club_name ?? '', status: row.status, method: row.method, checkedInAt: row.checked_in_at, userName: row.name ?? '' };
  };
  r.get('/api/attendance/sessions', 'user', (ctx) => {
    requireVerifiedStudent(ctx);
    requireAttendance(ctx.app);
    const eventId = ctx.url.searchParams.get('eventId');
    const rows = eventId
      ? ctx.app.db.all<{ id: string }>('SELECT id FROM attendance_sessions WHERE event_id = ? ORDER BY starts_at DESC', eventId)
      : ctx.app.db.all<{ id: string }>('SELECT id FROM attendance_sessions ORDER BY starts_at DESC LIMIT 100');
    return { items: rows.map(({ id }) => sessionRow(ctx.app, id)) };
  });
  r.post('/api/attendance/sessions', staff, (ctx) => {
    requireAttendance(ctx.app);
    const eventId = str(ctx.body, 'eventId', 'Event', { max: 100 });
    const event = findContent(ctx.app, 'event', eventId);
    const startsAt = str(ctx.body, 'startsAt', 'Start time', { max: 40 });
    const endsAt = str(ctx.body, 'endsAt', 'End time', { max: 40 });
    const start = Date.parse(startsAt), end = Date.parse(endsAt);
    if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) throw badRequest('Enter valid start and end times.');
    const maxCheckins = typeof ctx.body.maxCheckins === 'number' && Number.isInteger(ctx.body.maxCheckins) ? Math.max(0, Math.min(50000, ctx.body.maxCheckins)) : 0;
    const id = randomId();
    ctx.app.db.run('INSERT INTO attendance_sessions (id, event_id, club_id, club_name, starts_at, ends_at, require_membership, max_checkins, code, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', id, event.id, str(ctx.body, 'clubId', 'Club ID', { max: 100, required: false }), str(ctx.body, 'clubName', 'Club name', { max: 120, required: false }), startsAt, endsAt, ctx.body.requireMembership === true ? 1 : 0, maxCheckins, randomId().toUpperCase(), ctx.user!.id, now());
    return { item: sessionRow(ctx.app, id) };
  });
  r.patch('/api/attendance/sessions/:id', staff, (ctx) => {
    requireAttendance(ctx.app);
    const status = oneOf(ctx.body, 'status', 'Session status', ['scheduled', 'active', 'ended'] as const);
    ctx.app.db.run('UPDATE attendance_sessions SET status = ? WHERE id = ?', status, ctx.params.id!);
    return { item: sessionRow(ctx.app, ctx.params.id!) };
  });
  r.get('/api/attendance/sessions/:id/code', staff, (ctx) => {
    requireAttendance(ctx.app);
    const session = sessionRow(ctx.app, ctx.params.id!);
    if (session.status !== 'active') throw badRequest('Start the attendance session before showing its QR code.');
    return { code: session.code, sessionId: session.id, slotEndsAt: session.endsAt };
  });
  r.get('/api/attendance/sessions/:id', 'user', (ctx) => {
    requireVerifiedStudent(ctx);
    requireAttendance(ctx.app);
    const session = sessionRow(ctx.app, ctx.params.id!);
    if (ctx.user!.role === 'student' && session.createdBy !== ctx.user!.id) return { item: { ...session, code: undefined }, checkins: [] };
    const rows = ctx.app.db.all<{ id: string; session_id: string; event_id: string; user_id: string; status: string; method: string; checked_in_at: string; name: string }>('SELECT a.*, u.name FROM attendance_records a JOIN users u ON u.id = a.user_id WHERE a.session_id = ? ORDER BY a.checked_in_at DESC', ctx.params.id!);
    return { item: { ...session, code: undefined }, checkins: rows.map((row) => recordJson(ctx.app, row)) };
  });
  r.post('/api/attendance/check-in', 'user', (ctx) => {
    requireVerifiedStudent(ctx);
    requireAttendance(ctx.app);
    const code = str(ctx.body, 'code', 'Attendance code', { max: 120 });
    const raw = ctx.app.db.get<{ id: string; event_id: string; club_id: string; status: string; starts_at: string; ends_at: string; max_checkins: number; require_membership: number }>('SELECT id, event_id, club_id, status, starts_at, ends_at, max_checkins, require_membership FROM attendance_sessions WHERE code = ?', code);
    if (!raw || raw.status !== 'active') throw notFound('That attendance code is not active.');
    const time = Date.now();
    if (time < Date.parse(raw.starts_at) || time > Date.parse(raw.ends_at)) throw badRequest('This attendance session is outside its check-in time.');
    if (raw.require_membership && !ctx.app.db.get("SELECT 1 FROM club_memberships WHERE club_id = ? AND user_id = ? AND status = 'active'", raw.club_id, ctx.user!.id)) throw badRequest('Join the club before checking in.');
    const existing = ctx.app.db.get<{ id: string; session_id: string; event_id: string; user_id: string; status: string; method: string; checked_in_at: string }>('SELECT * FROM attendance_records WHERE session_id = ? AND user_id = ?', raw.id, ctx.user!.id);
    if (existing) return { record: recordJson(ctx.app, existing), duplicate: true, badges: [] };
    const count = ctx.app.db.get<{ total: number }>("SELECT COUNT(*) AS total FROM attendance_records WHERE session_id = ? AND status = 'present'", raw.id)?.total ?? 0;
    if (raw.max_checkins > 0 && count >= raw.max_checkins) throw badRequest('This session has reached its check-in limit.');
    const row = { id: randomId(), session_id: raw.id, event_id: raw.event_id, user_id: ctx.user!.id, status: 'present', method: 'qr', checked_in_at: now() };
    ctx.app.db.run('INSERT INTO attendance_records (id, session_id, event_id, user_id, status, method, checked_in_at) VALUES (?, ?, ?, ?, ?, ?, ?)', row.id, row.session_id, row.event_id, row.user_id, row.status, row.method, row.checked_in_at);
    return { record: recordJson(ctx.app, row), duplicate: false, badges: [] };
  });
  r.get('/api/attendance/records', 'user', (ctx) => {
    requireVerifiedStudent(ctx);
    requireAttendance(ctx.app);
    const rows = ctx.app.db.all<{ id: string; session_id: string; event_id: string; user_id: string; status: string; method: string; checked_in_at: string }>('SELECT * FROM attendance_records WHERE user_id = ? ORDER BY checked_in_at DESC LIMIT 500', ctx.user!.id);
    return { items: rows.map((row) => recordJson(ctx.app, row)) };
  });
  r.patch('/api/attendance/records/:id', staff, (ctx) => {
    requireAttendance(ctx.app);
    const status = oneOf(ctx.body, 'status', 'Attendance status', ['present', 'excused', 'removed'] as const);
    const reason = str(ctx.body, 'reason', 'Correction reason', { max: 500 });
    const changed = ctx.app.db.run('UPDATE attendance_records SET status = ?, correction_reason = ? WHERE id = ?', status, reason, ctx.params.id!);
    if (!changed.changes) throw notFound('Attendance record not found.');
    const row = ctx.app.db.get<{ id: string; session_id: string; event_id: string; user_id: string; status: string; method: string; checked_in_at: string }>('SELECT * FROM attendance_records WHERE id = ?', ctx.params.id!)!;
    ctx.app.audit(ctx.user!.email, `Corrected attendance record ${row.id}: ${status}`);
    return { item: recordJson(ctx.app, row) };
  });
}
