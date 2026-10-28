import type { Role, UserRow } from '../db.ts';
import { now } from '../db.ts';
import type { Db } from '../db.ts';
import type { Router } from '../http.ts';
import { HttpError, badRequest, notFound } from '../http.ts';
import { randomId } from '../crypto.ts';
import { announcementJson, approvalJson, enquiryJson, materialJson, pollJson, repJson, slotJson } from '../mappers.ts';
import type { AnnouncementRow, ApprovalRow, EnquiryRow, MaterialRow, PollRow, RepRow, SlotRow } from '../mappers.ts';
import { AUDIENCES, CHANNELS, channelAvailability, dispatchAnnouncement } from '../integrations/dispatch.ts';
import type { ChannelId } from '../integrations/dispatch.ts';
import { bool, limitParam, oneOf, str } from '../validate.ts';

/** SRC admins, plus super admins for oversight. */
const SRC: Role[] = ['src_admin', 'super_admin'];

export function registerSrcRoutes(r: Router): void {
  r.get('/api/src/overview', SRC, (ctx) => {
    const db = ctx.app.db;
    const n = (sql: string): number => db.get<{ n: number }>(sql)!.n;
    return {
      openEnquiries: n('SELECT COUNT(*) n FROM enquiries WHERE resolved = 0'),
      pendingMaterials: n("SELECT COUNT(*) n FROM materials WHERE status = 'pending'"),
      pendingApprovals: n("SELECT COUNT(*) n FROM approvals WHERE status = 'pending'"),
      examsScheduled: n('SELECT COUNT(*) n FROM slots WHERE is_exam = 1'),
      channels: channelAvailability(ctx.app),
      openPolls: db.all<PollRow>('SELECT * FROM polls WHERE open = 1 ORDER BY created_at DESC').map((p) => pollJson(p, votesFor(ctx.app.db, p))),
    };
  });

  r.get('/api/src/channels', SRC, (ctx) => ({ channels: channelAvailability(ctx.app), audiences: AUDIENCES }));

  // ---------------------------------------------------------- timetable/exams
  r.get('/api/src/slots', SRC, (ctx) => {
    const exam = ctx.url.searchParams.get('exam');
    const rows =
      exam === null
        ? ctx.app.db.all<SlotRow>('SELECT * FROM slots ORDER BY rowid')
        : ctx.app.db.all<SlotRow>('SELECT * FROM slots WHERE is_exam = ? ORDER BY rowid', exam === '1' ? 1 : 0);
    return { slots: rows.map(slotJson) };
  });

  r.post('/api/src/slots', SRC, (ctx) => {
    const id = randomId();
    const isExam = bool(ctx.body, 'isExam', 'Type');
    const course = str(ctx.body, 'course', 'Course', { max: 120 });
    ctx.app.db.run(
      'INSERT INTO slots (id, is_exam, course, when_text, time_text, venue, level) VALUES (?, ?, ?, ?, ?, ?, ?)',
      id, isExam ? 1 : 0, course,
      str(ctx.body, 'when', isExam ? 'Date' : 'Day', { max: 40 }),
      str(ctx.body, 'time', 'Time', { max: 40 }),
      str(ctx.body, 'venue', 'Venue', { max: 80 }),
      str(ctx.body, 'level', 'Level', { max: 40 }),
    );
    ctx.app.audit(ctx.user!.email, `Added ${isExam ? 'exam' : 'lecture'} slot for ${course}`);
    return { slot: slotJson(ctx.app.db.get<SlotRow>('SELECT * FROM slots WHERE id = ?', id)!) };
  });

  r.delete('/api/src/slots/:id', SRC, (ctx) => {
    const row = ctx.app.db.get<SlotRow>('SELECT * FROM slots WHERE id = ?', ctx.params.id!);
    if (!row) throw notFound('Slot not found.');
    ctx.app.db.run('DELETE FROM slots WHERE id = ?', row.id);
    ctx.app.audit(ctx.user!.email, `Removed ${row.is_exam ? 'exam' : 'lecture'} slot for ${row.course}`);
    return { ok: true };
  });

  // --------------------------------------------------------------- materials
  r.get('/api/src/materials', SRC, (ctx) => ({
    materials: ctx.app.db.all<MaterialRow>('SELECT * FROM materials ORDER BY created_at DESC').map(materialJson),
  }));

  r.patch('/api/src/materials/:id', SRC, (ctx) => {
    const row = ctx.app.db.get<MaterialRow>('SELECT * FROM materials WHERE id = ?', ctx.params.id!);
    if (!row) throw notFound('Material not found.');
    const status = oneOf(ctx.body, 'status', 'Status', ['pending', 'approved', 'rejected'] as const);
    ctx.app.db.run('UPDATE materials SET status = ? WHERE id = ?', status, row.id);
    ctx.app.audit(ctx.user!.email, `Marked material "${row.title}" (${row.course}) as ${status}`);
    return { material: materialJson(ctx.app.db.get<MaterialRow>('SELECT * FROM materials WHERE id = ?', row.id)!) };
  });

  // ----------------------------------------------------------- announcements
  r.get('/api/src/announcements', SRC, (ctx) => ({
    announcements: ctx.app.db.all<AnnouncementRow>('SELECT * FROM announcements ORDER BY pinned DESC, created_at DESC LIMIT 100').map(announcementJson),
  }));

  r.post('/api/src/announcements', SRC, (ctx) => {
    const title = str(ctx.body, 'title', 'Title', { max: 120 });
    const body = str(ctx.body, 'body', 'Message', { max: 2000 });
    const audience = oneOf(ctx.body, 'audience', 'Audience', AUDIENCES as readonly string[]);
    const pinned = ctx.body.pinned === undefined ? false : bool(ctx.body, 'pinned', 'Pinned');
    const asked = ctx.body.channels;
    if (!Array.isArray(asked) || asked.some((c) => !CHANNELS.includes(c as ChannelId))) throw badRequest(`Channels must be a list of: ${CHANNELS.join(', ')}.`);

    // Only channels whose integration is live go out. The rest are reported back, not silently dropped.
    const available = channelAvailability(ctx.app);
    const wanted = new Set<ChannelId>(['inApp', ...(asked as ChannelId[])]);
    const sent = CHANNELS.filter((c) => wanted.has(c) && available[c]);
    const skipped = CHANNELS.filter((c) => wanted.has(c) && !available[c]);

    const id = randomId();
    ctx.app.db.run(
      'INSERT INTO announcements (id, title, body, audience, channels_json, pinned, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      id, title, body, audience, JSON.stringify(sent), pinned ? 1 : 0, ctx.user!.email, now(),
    );
    const recipients = ctx.app.db.all<{ id: string; role: Role; level: string }>("SELECT id, role, level FROM users WHERE role = 'student' AND suspended = 0");
    const targets = audience === 'Class reps' ? [] : recipients.filter((u) => audience === 'All students' || u.level === audience);
    const sentAt = now();
    for (const student of targets) ctx.app.db.run('INSERT INTO notifications (id,user_id,kind,title,body,created_at) VALUES (?,?,?,?,?,?)', randomId(), student.id, 'announcement', title, body, sentAt);
    ctx.app.audit(ctx.user!.email, `Published announcement "${title}" to ${audience}`);
    ctx.app.track(dispatchAnnouncement(ctx.app, id, title, body, audience, sent));
    return {
      announcement: announcementJson(ctx.app.db.get<AnnouncementRow>('SELECT * FROM announcements WHERE id = ?', id)!),
      skipped,
      dryRun: !ctx.app.config.allowLiveSending && sent.some((c) => c !== 'inApp'),
    };
  });

  r.patch('/api/src/announcements/:id', SRC, (ctx) => {
    const row = ctx.app.db.get<AnnouncementRow>('SELECT * FROM announcements WHERE id = ?', ctx.params.id!);
    if (!row) throw notFound('Announcement not found.');
    const pinned = bool(ctx.body, 'pinned', 'Pinned');
    ctx.app.db.run('UPDATE announcements SET pinned = ? WHERE id = ?', pinned ? 1 : 0, row.id);
    ctx.app.audit(ctx.user!.email, `${pinned ? 'Pinned' : 'Unpinned'} "${row.title}"`);
    return { ok: true };
  });

  r.delete('/api/src/announcements/:id', SRC, (ctx) => {
    const row = ctx.app.db.get<AnnouncementRow>('SELECT * FROM announcements WHERE id = ?', ctx.params.id!);
    if (!row) throw notFound('Announcement not found.');
    ctx.app.db.run('DELETE FROM announcements WHERE id = ?', row.id);
    ctx.app.audit(ctx.user!.email, `Deleted announcement "${row.title}"`);
    return { ok: true };
  });

  // -------------------------------------------------------------- class reps
  r.get('/api/src/users', SRC, (ctx) => {
    const q = (ctx.url.searchParams.get('q') ?? '').trim().toLowerCase();
    const limit = limitParam(ctx.url, 100, 500);
    const rows = ctx.app.db.all<UserRow>(
      `SELECT * FROM users WHERE role='student' AND suspended=0 AND student_email_verified=1${q ? ' AND (lower(name) LIKE ? OR lower(email) LIKE ? OR lower(programme) LIKE ? OR lower(level) LIKE ?)' : ''} ORDER BY name LIMIT ?`,
      ...(q ? [`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, limit] : [limit]),
    );
    return { users: rows.map((u) => ({ id:u.id, name:u.name, email:u.email, phone:u.phone, programme:u.programme, level:u.level })) };
  });

  r.get('/api/src/class-reps', SRC, (ctx) => ({ classReps: ctx.app.db.all<RepRow>('SELECT * FROM class_reps ORDER BY rowid').map(repJson) }));

  r.post('/api/src/class-reps', SRC, (ctx) => {
    const id = randomId();
    const userId = str(ctx.body, 'userId', 'Student account', { max: 100 });
    const student = ctx.app.db.get<UserRow>("SELECT * FROM users WHERE id=? AND role='student' AND suspended=0 AND student_email_verified=1", userId);
    if (!student) throw notFound('Choose an active student with a verified GCTU email.');
    const course = str(ctx.body, 'course', 'Course', { max: 120 });
    const group = str(ctx.body, 'group', 'Group', { max: 80 });
    const session = str(ctx.body, 'session', 'Academic session', { max: 40 });
    if (ctx.app.db.get('SELECT 1 FROM class_reps WHERE user_id=? AND course=? AND group_name=? AND session=?', userId, course, group, session)) throw new HttpError(409, 'That student is already a rep for this course, group and session.', 'conflict');
    ctx.app.db.run(
      'INSERT INTO class_reps (id,user_id,name,course,level,phone,programme,group_name,session) VALUES (?,?,?,?,?,?,?,?,?)',
      id, userId, student.name, course, student.level, student.phone, student.programme, group, session,
    );
    ctx.app.audit(ctx.user!.email, `Assigned ${student.name} as rep for ${course}, ${group}, ${session}`);
    return { classRep: repJson(ctx.app.db.get<RepRow>('SELECT * FROM class_reps WHERE id = ?', id)!) };
  });

  r.delete('/api/src/class-reps/:id', SRC, (ctx) => {
    const row = ctx.app.db.get<RepRow>('SELECT * FROM class_reps WHERE id = ?', ctx.params.id!);
    if (!row) throw notFound('Class rep not found.');
    ctx.app.db.run('DELETE FROM class_reps WHERE id = ?', row.id);
    ctx.app.audit(ctx.user!.email, `Removed class rep ${row.name}`);
    return { ok: true };
  });

  // --------------------------------------------------------------- enquiries
  r.get('/api/src/enquiries', SRC, (ctx) => ({
    enquiries: ctx.app.db.all<EnquiryRow>('SELECT * FROM enquiries ORDER BY resolved ASC, created_at DESC LIMIT 200').map(enquiryJson),
  }));

  r.post('/api/src/enquiries/:id/reply', SRC, (ctx) => {
    const row = ctx.app.db.get<EnquiryRow>('SELECT * FROM enquiries WHERE id = ?', ctx.params.id!);
    if (!row) throw notFound('Enquiry not found.');
    const reply = str(ctx.body, 'reply', 'Reply', { max: 2000 });
    ctx.app.db.run('UPDATE enquiries SET reply = ?, resolved = 1, replied_at = ? WHERE id = ?', reply, now(), row.id);
    ctx.app.audit(ctx.user!.email, `Replied to enquiry "${row.subject}"`);
    return { enquiry: enquiryJson(ctx.app.db.get<EnquiryRow>('SELECT * FROM enquiries WHERE id = ?', row.id)!) };
  });

  r.post('/api/src/enquiries/:id/reopen', SRC, (ctx) => {
    const row = ctx.app.db.get<EnquiryRow>('SELECT * FROM enquiries WHERE id = ?', ctx.params.id!);
    if (!row) throw notFound('Enquiry not found.');
    ctx.app.db.run('UPDATE enquiries SET resolved = 0 WHERE id = ?', row.id);
    ctx.app.audit(ctx.user!.email, `Re-opened enquiry "${row.subject}"`);
    return { ok: true };
  });

  // ------------------------------------------------------------------- polls
  r.get('/api/src/polls', SRC, (ctx) => ({
    polls: ctx.app.db.all<PollRow>('SELECT * FROM polls ORDER BY created_at DESC').map((p) => pollJson(p, votesFor(ctx.app.db, p))),
  }));

  r.post('/api/src/polls', SRC, (ctx) => {
    const question = str(ctx.body, 'question', 'Question', { max: 200 });
    const raw = ctx.body.options;
    if (!Array.isArray(raw)) throw badRequest('Options must be a list.');
    const options = raw.filter((o): o is string => typeof o === 'string').map((o) => o.trim()).filter(Boolean);
    if (options.length < 2 || options.length > 8) throw badRequest('Add between 2 and 8 options.');
    if (options.some((o) => o.length > 100)) throw badRequest('Each option must be 100 characters or fewer.');
    const id = randomId();
    ctx.app.db.run('INSERT INTO polls (id, question, options_json, open, created_at) VALUES (?, ?, ?, 1, ?)', id, question, JSON.stringify(options), now());
    ctx.app.audit(ctx.user!.email, `Created poll "${question}"`);
    const row = ctx.app.db.get<PollRow>('SELECT * FROM polls WHERE id = ?', id)!;
    return { poll: pollJson(row, votesFor(ctx.app.db, row)) };
  });

  r.post('/api/src/polls/:id/close', SRC, (ctx) => {
    const row = ctx.app.db.get<PollRow>('SELECT * FROM polls WHERE id = ?', ctx.params.id!);
    if (!row) throw notFound('Poll not found.');
    ctx.app.db.run('UPDATE polls SET open = 0 WHERE id = ?', row.id);
    ctx.app.audit(ctx.user!.email, `Closed poll "${row.question}"`);
    return { ok: true };
  });

  // --------------------------------------------------------------- approvals
  r.get('/api/src/approvals', SRC, (ctx) => ({
    approvals: ctx.app.db.all<ApprovalRow>("SELECT * FROM approvals ORDER BY (status = 'pending') DESC, created_at DESC").map(approvalJson),
  }));

  r.patch('/api/src/approvals/:id', SRC, (ctx) => {
    const row = ctx.app.db.get<ApprovalRow>('SELECT * FROM approvals WHERE id = ?', ctx.params.id!);
    if (!row) throw notFound('Request not found.');
    const status = oneOf(ctx.body, 'status', 'Status', ['approved', 'rejected'] as const);
    ctx.app.db.run('UPDATE approvals SET status = ? WHERE id = ?', status, row.id);
    ctx.app.audit(ctx.user!.email, `${status === 'approved' ? 'Approved' : 'Declined'} ${row.is_event ? 'event' : 'club'} "${row.title}"`);
    return { approval: approvalJson(ctx.app.db.get<ApprovalRow>('SELECT * FROM approvals WHERE id = ?', row.id)!) };
  });
}

export function votesFor(db: Db, poll: PollRow): number[] {
  const options = JSON.parse(poll.options_json) as string[];
  const counts = new Array<number>(options.length).fill(0);
  for (const v of db.all<{ option_index: number; n: number }>('SELECT option_index, COUNT(*) n FROM poll_votes WHERE poll_id = ? GROUP BY option_index', poll.id)) {
    if (v.option_index >= 0 && v.option_index < counts.length) counts[v.option_index] = v.n;
  }
  return counts;
}

