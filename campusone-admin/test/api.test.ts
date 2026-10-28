import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';
import { ADMIN_EMAIL, ADMIN_PASSWORD, Client, boot, fakeFetch, world } from './helpers.ts';
import type { Running } from '../src/server/boot.ts';

const open: Running[] = [];
after(async () => {
  for (const r of open) await r.close();
});
const track = async <T extends { run: Running }>(w: Promise<T>): Promise<T> => {
  const x = await w;
  open.push(x.run);
  return x;
};

describe('sign-in and roles', () => {
  test('every feature in the connected Flutter app reaches a registered endpoint', async () => {
    const w = await track(world());
    const run = w.run;
    const anonymous = new Client(run.url);
    assert.equal((await anonymous.get('/api/health')).status, 200);
    assert.equal((await anonymous.get('/api/v1/config')).status, 200);

    const student = w.student;
    // This endpoint audit exercises the verified-student feature surface.
    w.run.app.db.run('UPDATE users SET student_email_verified=1 WHERE email=?', 'ama@test.local');
    const routes: Array<[string, string]> = [
      ['GET', '/api/v1/me'],
      ['PATCH', '/api/v1/me'],
      ['POST', '/api/v1/devices'],
      ['GET', '/api/v1/announcements'],
      ['GET', '/api/v1/search?q=course'],
      ['GET', '/api/v1/timetable'],
      ['GET', '/api/v1/exams'],
      ['GET', '/api/v1/class-reps'],
      ['GET', '/api/v1/materials'],
      ['POST', '/api/v1/materials'],
      ['GET', '/api/v1/listings?kind=market'],
      ['POST', '/api/v1/listings'],
      ['GET', '/api/v1/polls'],
      ['GET', '/api/v1/enquiries'],
      ['POST', '/api/v1/enquiries'],
      ['POST', '/api/v1/approvals'],
      ['POST', '/api/v1/ai/chat'],
      ['GET', '/api/me/store?collection=grades'],
      ['PUT', '/api/me/store'],
      ['DELETE', '/api/me/store?collection=grades&id=example'],
      ['GET', '/api/conversations'],
      ['POST', '/api/conversations'],
      ['GET', '/api/attendance/sessions'],
      ['POST', '/api/attendance/sessions'],
      ['POST', '/api/attendance/check-in'],
      ['GET', '/api/attendance/records'],
    ];

    for (const [method, path] of routes) {
      const response = await student.req(method, path, method === 'GET' ? undefined : {});
      assert.notEqual(response.status, 404, `${method} ${path} must be registered`);
      assert.notEqual(response.status, 405, `${method} ${path} must support this method`);
    }

    const listing = await student.post('/api/v1/listings', { title: 'Endpoint check listing' });
    assert.equal(listing.status, 200);
    assert.equal((await student.post(`/api/v1/listings/${listing.json.listing.id}/report`)).status, 200);

    const poll = await w.src.post('/api/src/polls', { question: 'Endpoint check?', options: ['Yes', 'No'] });
    assert.equal(poll.status, 200);
    assert.equal((await student.post(`/api/v1/polls/${poll.json.poll.id}/vote`, { option: 0 })).status, 200);

    const savedGrade = await student.put('/api/me/store', { collection: 'grades', item: { id: 'grade-1', course: 'COMP 101', credits: 3, points: 3.5 } });
    assert.equal(savedGrade.status, 200);
    assert.equal((await student.get('/api/me/store?collection=grades')).json.items[0].course, 'COMP 101');
    assert.equal((await student.get('/api/me/store?collection=bad')).status, 400);

    const friend = await w.mk('Student Friend', 'friend@test.local', 'student');
    const convo = await student.post('/api/conversations', { kind: 'direct', userId: (await w.run.app.db.get<{ id: string }>('SELECT id FROM users WHERE email = ?', 'friend@test.local'))!.id });
    assert.equal(convo.status, 200);
    assert.equal((await student.post(`/api/conversations/${convo.json.item.id}/messages`, { body: 'Hello' })).status, 200);
    assert.equal((await friend.get(`/api/conversations/${convo.json.item.id}/messages`)).json.items[0].body, 'Hello');
    assert.equal((await friend.post(`/api/conversations/${convo.json.item.id}/read`)).status, 200);

    const club = await w.admin.post('/api/admin/campus-content', { kind: 'club', title: 'Coding Society', category: 'Technology', description: 'Build together.', details: { meeting: 'Fridays', venue: 'Lab 2', accepting: true } });
    assert.equal(club.status, 200);
    assert.equal((await student.get('/api/clubs')).json.items[0].name, 'Coding Society');
    const membership = await student.post(`/api/clubs/${club.json.item.id}/membership`, { note: 'I would like to join.' });
    assert.equal(membership.json.item.status, 'pending');
    assert.equal((await w.src.patch(`/api/clubs/memberships/${membership.json.item.id}`, { status: 'active' })).status, 200);
    assert.equal((await student.get('/api/users/me/clubs')).json.items[0].clubName, 'Coding Society');

    const event = await w.admin.post('/api/admin/campus-content', { kind: 'event', title: 'Tech Forum', category: 'Talk', venue: 'Hall A', date: 'Friday 4 PM', details: { startsAt: '2026-11-01T16:00:00Z', endsAt: '2026-11-01T18:00:00Z', seats: 10 } });
    assert.equal(event.status, 200);
    const eventId = event.json.item.id;
    assert.equal((await student.get('/api/events')).json.items[0].title, 'Tech Forum');
    assert.equal((await student.post(`/api/events/${eventId}/rsvp`, { attending: true })).json.attending, true);
    assert.equal((await student.get(`/api/events/${eventId}/ticket`)).json.ticket.status, 'confirmed');

    const session = await w.admin.post('/api/attendance/sessions', { eventId, startsAt: new Date(Date.now() - 60_000).toISOString(), endsAt: new Date(Date.now() + 60_000).toISOString(), clubName: 'CampusOne', maxCheckins: 20 });
    assert.equal(session.status, 200);
    assert.equal((await w.admin.patch(`/api/attendance/sessions/${session.json.item.id}`, { status: 'active' })).status, 200);
    const code = await w.admin.get(`/api/attendance/sessions/${session.json.item.id}/code`);
    assert.equal((await student.post('/api/attendance/check-in', { code: code.json.code })).json.duplicate, false);
    assert.equal((await student.get('/api/attendance/records')).json.items.length, 1);
  });

  test('admin signs in on the web with a cookie and /me works', async () => {
    const run = await boot();
    open.push(run);
    const c = new Client(run.url);
    const r = await c.loginWeb(ADMIN_EMAIL, ADMIN_PASSWORD);
    assert.equal(r.status, 200);
    assert.equal(r.json.user.role, 'super_admin');
    assert.match(r.headers.get('set-cookie') ?? '', /HttpOnly/);
    assert.equal(r.json.token, undefined, 'web login must not return the token in the body');
    const me = await c.get('/api/auth/me');
    assert.equal(me.status, 200);
    assert.equal(me.json.user.email, ADMIN_EMAIL);
  });

  test('wrong password and unknown e-mail give the same answer', async () => {
    const run = await boot();
    open.push(run);
    const c = new Client(run.url);
    const a = await c.loginMobile(ADMIN_EMAIL, 'nope-nope-nope');
    const b = await c.loginMobile('nobody@test.local', 'nope-nope-nope');
    assert.equal(a.status, 401);
    assert.equal(b.status, 401);
    assert.equal(a.json.error, b.json.error);
  });

  test('sign-in is rate limited', async () => {
    const run = await boot();
    open.push(run);
    const c = new Client(run.url);
    let last = 0;
    for (let i = 0; i < 12; i++) last = (await c.loginMobile(ADMIN_EMAIL, 'wrong-wrong-1')).status;
    assert.equal(last, 429);
  });

  test('each console is limited to its roles', async () => {
    const w = await track(world());
    assert.equal((await w.student.get('/api/admin/overview')).status, 403);
    assert.equal((await w.student.get('/api/src/overview')).status, 403);
    assert.equal((await w.src.get('/api/admin/overview')).status, 403);
    assert.equal((await w.src.get('/api/admin/integrations')).status, 403);
    assert.equal((await w.src.get('/api/src/overview')).status, 200);
    assert.equal((await w.admin.get('/api/src/overview')).status, 200, 'super admin may oversee the SRC');
    assert.equal((await new Client(w.run.url).get('/api/admin/overview')).status, 401);
  });

  test('a suspended account is signed out at once', async () => {
    const w = await track(world());
    const users = (await w.admin.get('/api/admin/users')).json.users as any[];
    const ama = users.find((u) => u.email === 'ama@test.local');
    assert.equal((await w.student.get('/api/v1/me')).status, 200);
    assert.equal((await w.admin.patch(`/api/admin/users/${ama.id}`, { suspended: true })).status, 200);
    assert.equal((await w.student.get('/api/v1/me')).status, 401);
  });

  test('changing a password signs out old tokens', async () => {
    const w = await track(world());
    const old = w.student.token;
    const r = await w.student.post('/api/auth/change-password', { current: 'Another-Pass-123', next: 'Third-Password-9', client: 'mobile' });
    assert.equal(r.status, 200);
    const stale = new Client(w.run.url);
    stale.token = old;
    assert.equal((await stale.get('/api/v1/me')).status, 401);
    w.student.token = r.json.token;
    assert.equal((await w.student.get('/api/v1/me')).status, 200);
  });

  test('cross-site cookie requests are blocked', async () => {
    const run = await boot();
    open.push(run);
    const c = new Client(run.url);
    await c.loginWeb(ADMIN_EMAIL, ADMIN_PASSWORD);
    const bad = await c.req('PUT', '/api/admin/settings', { maintenance: true }, { Origin: 'https://evil.example' });
    assert.equal(bad.status, 403);
    const ok = await c.req('PUT', '/api/admin/settings', { maintenance: false }, { Origin: run.url });
    assert.equal(ok.status, 200);
  });
});

describe('people', () => {
  test('the last active super admin cannot be removed, and nobody edits themselves', async () => {
    const w = await track(world());
    const users = (await w.admin.get('/api/admin/users')).json.users as any[];
    const root = users.find((u) => u.email === ADMIN_EMAIL);
    assert.equal((await w.admin.patch(`/api/admin/users/${root.id}`, { role: 'student' })).status, 400);
    assert.equal((await w.admin.patch(`/api/admin/users/${root.id}`, { suspended: true })).status, 400);

    // A second super admin can demote the first; the last one is then protected.
    const second = await w.mk('Second Admin', 'second@test.local', 'super_admin');
    assert.equal((await second.patch(`/api/admin/users/${root.id}`, { role: 'src_admin' })).status, 200);
    const sec = (await second.get('/api/admin/users')).json.users.find((u: any) => u.email === 'second@test.local');
    assert.equal((await second.patch(`/api/admin/users/${sec.id}`, { role: 'student' })).status, 400);
  });

  test('invite creates a one-time password that must be changed', async () => {
    const w = await track(world());
    const inv = await w.admin.post('/api/admin/users/invite', { name: 'New Rep', email: 'rep@test.local', role: 'src_admin' });
    assert.equal(inv.status, 200);
    assert.ok(inv.json.tempPassword.length >= 12);
    assert.equal(inv.json.user.mustChangePassword, true);
    assert.equal(inv.json.emailed, false);
    const dup = await w.admin.post('/api/admin/users/invite', { name: 'Again', email: 'REP@test.local', role: 'student' });
    assert.equal(dup.status, 409);
  });
});

describe('integrations', () => {
  const sms = { provider: 'Arkesel', client_id: '', api_key: 'sk-live-super-secret-key', sender_id: 'CampusOne' };

  test('secrets are never returned, never stored in the clear, and blank keeps them', async () => {
    const w = await track(world());
    const put = await w.admin.put('/api/admin/integrations/sms', { values: sms, enabled: true });
    assert.equal(put.status, 200);
    assert.equal(put.json.integration.status, 'live');
    assert.deepEqual(put.json.integration.secretSet, ['api_key']);
    assert.ok(!JSON.stringify(put.json).includes('sk-live-super-secret-key'));

    const list = await w.admin.get('/api/admin/integrations');
    assert.ok(!JSON.stringify(list.json).includes('sk-live-super-secret-key'));

    const raw = w.run.app.db.get<{ values_json: string; secrets_enc: string }>('SELECT * FROM integrations WHERE id = ?', 'sms')!;
    assert.ok(!raw.values_json.includes('sk-live'));
    assert.ok(!raw.secrets_enc.includes('sk-live'));
    assert.match(raw.secrets_enc, /^v1\./);

    const again = await w.admin.put('/api/admin/integrations/sms', { values: { ...sms, api_key: '', sender_id: 'NewName' }, enabled: true });
    assert.equal(again.json.integration.values.sender_id, 'NewName');
    assert.deepEqual(again.json.integration.secretSet, ['api_key']);
  });

  test('cannot switch on with a required field missing, and bad values are explained', async () => {
    const w = await track(world());
    const miss = await w.admin.put('/api/admin/integrations/sms', { values: { provider: 'Arkesel', sender_id: 'X' }, enabled: true });
    assert.equal(miss.status, 400);
    assert.match(miss.json.error, /required field/i);
    const bad = await w.admin.put('/api/admin/integrations/email', { values: { provider: 'SMTP', from_email: 'not-an-email', password: 'x' }, enabled: false });
    assert.equal(bad.status, 400);
    assert.match(bad.json.error, /e-mail/i);
    const prov = await w.admin.put('/api/admin/integrations/sms', { values: { ...sms, provider: 'Pigeon' }, enabled: false });
    assert.equal(prov.status, 400);
  });

  test('test sends one SMS through the provider and never echoes the key', async () => {
    const fx = fakeFetch(() => ({ json: { status: 'success' } }));
    const w = await track(world({}, fx.fetch));
    await w.admin.put('/api/admin/integrations/sms', { values: sms, enabled: false });
    const t = await w.admin.post('/api/admin/integrations/sms/test', { to: '024 123 4567' });
    assert.equal(t.json.ok, true);
    assert.equal(fx.calls.length, 1);
    assert.equal(fx.calls[0]!.url, 'https://sms.arkesel.com/api/v2/sms/send');
    assert.equal((fx.calls[0]!.init.headers as Record<string, string>)['api-key'], 'sk-live-super-secret-key');
    assert.deepEqual(JSON.parse(fx.calls[0]!.body).recipients, ['233241234567']);
  });

  test('provider errors reach the admin with the key blanked out', async () => {
    const fx = fakeFetch(() => ({ status: 401, json: { message: 'bad key sk-live-super-secret-key' } }));
    const w = await track(world({}, fx.fetch));
    await w.admin.put('/api/admin/integrations/sms', { values: sms, enabled: false });
    const t = await w.admin.post('/api/admin/integrations/sms/test', { to: '0241234567' });
    assert.equal(t.json.ok, false);
    assert.ok(!t.json.message.includes('sk-live-super-secret-key'));
    assert.match(t.json.message, /refused/);
  });

  test('request shapes for the other providers', async () => {
    const fx = fakeFetch(() => ({ json: { status: 'success', Status: 0, SMSMessageData: { Recipients: [{ status: 'Success' }] } } }));
    const w = await track(world({}, fx.fetch));
    const cases: Array<[string, string, RegExp]> = [
      ['mNotify', 'https://api.mnotify.com/api/sms/quick?key=', /recipient/],
      ['Hubtel', 'https://smsc.hubtel.com/v1/messages/send?', /clientsecret=/],
      ['Twilio', 'https://api.twilio.com/2010-04-01/Accounts/AC123/Messages.json', /To=%2B233241234567/],
      ["Africa's Talking", 'https://api.africastalking.com/version1/messaging', /username=AC123/],
    ];
    for (const [provider, urlStart, bodyRe] of cases) {
      fx.calls.length = 0;
      await w.admin.put('/api/admin/integrations/sms', { values: { provider, client_id: 'AC123', api_key: 'abcdef-token', sender_id: 'CampusOne' }, enabled: false });
      const t = await w.admin.post('/api/admin/integrations/sms/test', { to: '0241234567' });
      assert.equal(t.json.ok, true, `${provider}: ${t.json.message}`);
      assert.ok(fx.calls[0]!.url.startsWith(urlStart), `${provider} url ${fx.calls[0]!.url}`);
      assert.match(fx.calls[0]!.body + fx.calls[0]!.url, bodyRe, provider);
    }
  });

  test('e-mail providers build the right requests', async () => {
    const fx = fakeFetch(() => ({ status: 200, json: { id: 'x' } }));
    const w = await track(world({}, fx.fetch));
    for (const [provider, urlStart] of [
      ['Resend', 'https://api.resend.com/emails'],
      ['SendGrid', 'https://api.sendgrid.com/v3/mail/send'],
      ['Mailgun', 'https://api.mailgun.net/v3/mg.example.com/messages'],
    ] as const) {
      fx.calls.length = 0;
      await w.admin.put('/api/admin/integrations/email', { values: { provider, smtp_host: 'mg.example.com', password: 'key-abcdef', from_email: 'no-reply@example.com', from_name: 'CampusOne' }, enabled: false });
      const t = await w.admin.post('/api/admin/integrations/email/test', { to: 'me@example.com' });
      assert.equal(t.json.ok, true, `${provider}: ${t.json.message}`);
      assert.equal(fx.calls[0]!.url, urlStart);
      assert.match(String((fx.calls[0]!.init.headers as Record<string, string>).Authorization), provider === 'Mailgun' ? /^Basic / : /^Bearer key-abcdef/);
    }
  });

  test('AI test calls the chosen provider', async () => {
    const fx = fakeFetch((url) => (url.includes('anthropic') ? { json: { content: [{ type: 'text', text: 'ready' }] } } : { json: { choices: [{ message: { content: 'ready' } }] } }));
    const w = await track(world({}, fx.fetch));
    await w.admin.put('/api/admin/integrations/ai', { values: { provider: 'Anthropic (Claude)', api_key: 'sk-ant-xyz-123', model: 'some-model' }, enabled: false });
    const t = await w.admin.post('/api/admin/integrations/ai/test', {});
    assert.equal(t.json.ok, true);
    assert.equal(fx.calls[0]!.url, 'https://api.anthropic.com/v1/messages');
    assert.equal(JSON.parse(fx.calls[0]!.body).model, 'some-model');
    await w.admin.put('/api/admin/integrations/ai', { values: { provider: 'Custom (OpenAI-compatible)', base_url: 'https://llm.example.com/v1/', model: 'm' }, enabled: false });
    await w.admin.post('/api/admin/integrations/ai/test', {});
    assert.equal(fx.calls[1]!.url, 'https://llm.example.com/v1/chat/completions');
  });

  test('removing an integration forgets its credentials', async () => {
    const w = await track(world());
    await w.admin.put('/api/admin/integrations/sms', { values: sms, enabled: true });
    assert.equal((await w.admin.delete('/api/admin/integrations/sms')).status, 200);
    const v = (await w.admin.get('/api/admin/integrations/sms')).json.integration;
    assert.equal(v.status, 'not_configured');
    assert.deepEqual(v.secretSet, []);
  });
});

describe('SRC announcements follow the integrations', () => {
  const announce = { title: 'Fees update', body: 'Deadline moved.', audience: 'Level 200', channels: ['inApp', 'sms', 'email'], pinned: false };

  test('channels that are not connected are reported and skipped', async () => {
    const w = await track(world());
    const r = await w.src.post('/api/src/announcements', announce);
    assert.equal(r.status, 200);
    assert.deepEqual(r.json.skipped, ['email', 'sms']);
    assert.deepEqual(r.json.announcement.channels, ['inApp']);
    const ch = (await w.src.get('/api/src/channels')).json.channels;
    assert.deepEqual(ch, { inApp: true, push: false, email: false, sms: false });
  });

  test('a connected channel goes out as a dry run until live sending is allowed', async () => {
    const fx = fakeFetch(() => ({ json: { status: 'success' } }));
    const w = await track(world({}, fx.fetch));
    await w.admin.put('/api/admin/integrations/sms', { values: { provider: 'Arkesel', api_key: 'sk-abcdef-1', sender_id: 'CampusOne' }, enabled: true });
    const r = await w.src.post('/api/src/announcements', announce);
    assert.deepEqual(r.json.skipped, ['email']);
    assert.equal(r.json.dryRun, true);
    await w.run.app.idle();
    const row = w.run.app.db.get<{ dispatch_json: string }>('SELECT dispatch_json FROM announcements WHERE id = ?', r.json.announcement.id)!;
    const d = JSON.parse(row.dispatch_json);
    assert.equal(d.sms.mode, 'dry_run');
    assert.equal(d.sms.recipients, 1);
    assert.equal(fx.calls.length, 0, 'a dry run must send nothing');
  });

  test('with live sending on, the SMS really goes to the matching students', async () => {
    const fx = fakeFetch(() => ({ json: { status: 'success' } }));
    const w = await track(world({ allowLiveSending: true }, fx.fetch));
    await w.admin.put('/api/admin/integrations/sms', { values: { provider: 'Arkesel', api_key: 'sk-abcdef-1', sender_id: 'CampusOne' }, enabled: true });
    const r = await w.src.post('/api/src/announcements', { ...announce, channels: ['sms'] });
    await w.run.app.idle();
    assert.equal(fx.calls.length, 1);
    assert.deepEqual(JSON.parse(fx.calls[0]!.body).recipients, ['233240000001']);
    const d = JSON.parse(w.run.app.db.get<{ dispatch_json: string }>('SELECT dispatch_json FROM announcements WHERE id = ?', r.json.announcement.id)!.dispatch_json);
    assert.equal(d.sms.sent, 1);
    assert.equal(d.sms.failed, 0);
  });

  test('students only see announcements meant for them', async () => {
    const w = await track(world());
    await w.src.post('/api/src/announcements', { ...announce, audience: 'Level 400', channels: ['inApp'] });
    await w.src.post('/api/src/announcements', { ...announce, title: 'For L200', audience: 'Level 200', channels: ['inApp'] });
    const titles = ((await w.student.get('/api/v1/announcements')).json.announcements as any[]).map((a) => a.title);
    assert.deepEqual(titles, ['For L200']);
  });

  test('input is validated', async () => {
    const w = await track(world());
    assert.equal((await w.src.post('/api/src/announcements', { ...announce, title: '' })).status, 400);
    assert.equal((await w.src.post('/api/src/announcements', { ...announce, audience: 'Everyone' })).status, 400);
    assert.equal((await w.src.post('/api/src/announcements', { ...announce, channels: ['fax'] })).status, 400);
  });
});

describe('the admin controls the mobile app', () => {
  test('module switches and maintenance mode reach the app', async () => {
    const w = await track(world());
    let cfg = (await new Client(w.run.url).get('/api/v1/config')).json;
    assert.equal(cfg.flags.hostels, true);
    assert.equal(cfg.maintenance, false);

    await w.admin.put('/api/admin/flags/hostels', { enabled: false });
    cfg = (await new Client(w.run.url).get('/api/v1/config')).json;
    assert.equal(cfg.flags.hostels, false);
    const off = await w.student.get('/api/v1/listings?kind=hostel');
    assert.equal(off.status, 403);
    assert.equal(off.json.code, 'module_off');

    await w.admin.put('/api/admin/settings', { maintenance: true });
    const m = await w.student.get('/api/v1/timetable');
    assert.equal(m.status, 503);
    assert.equal(m.json.code, 'maintenance');
    assert.equal((await new Client(w.run.url).get('/api/v1/config')).json.maintenance, true, 'config stays reachable');
    assert.equal((await w.admin.get('/api/v1/timetable')).status, 200, 'admins are not locked out');
    const again = await new Client(w.run.url).loginMobile('ama@test.local', 'Another-Pass-123');
    assert.equal(again.status, 200, 'students can still sign in');
  });

  test('listings reach students only after approval', async () => {
    const w = await track(world());
    const made = await w.student.post('/api/v1/listings', { title: 'Used laptop', subtitle: 'Works fine', price: 'GHS 1,500' });
    assert.equal(made.json.listing.status, 'pending');
    let seen = (await w.student.get('/api/v1/listings?kind=market')).json.listings as any[];
    assert.equal(seen.length, 0);
    await w.admin.patch(`/api/admin/listings/${made.json.listing.id}`, { status: 'approved' });
    seen = (await w.student.get('/api/v1/listings?kind=market')).json.listings;
    assert.equal(seen.length, 1);
    await w.student.post(`/api/v1/listings/${made.json.listing.id}/report`);
    assert.equal(((await w.admin.get('/api/admin/overview')).json).reportedListings, 1);
    await w.admin.patch(`/api/admin/listings/${made.json.listing.id}`, { status: 'rejected' });
    assert.equal(((await w.student.get('/api/v1/listings?kind=market')).json.listings as any[]).length, 0);
  });

  test('timetable and exams published by the SRC appear for that level only', async () => {
    const w = await track(world());
    w.run.app.db.run('UPDATE users SET student_email_verified=1 WHERE email=?', 'ama@test.local');
    const add = (isExam: boolean, level: string) => w.src.post('/api/src/slots', { isExam, course: 'BIT 264', when: isExam ? '17 Nov' : 'Mon', time: '8:00', venue: 'FF12', level });
    await add(false, 'Level 200');
    await add(false, 'Level 400');
    await add(true, 'Level 200');
    assert.equal(((await w.student.get('/api/v1/timetable')).json.slots as any[]).length, 1);
    assert.equal(((await w.student.get('/api/v1/exams')).json.slots as any[]).length, 1);
  });

  test('students submit materials, the SRC approves them, then everyone sees them', async () => {
    const w = await track(world());
    w.run.app.db.run('UPDATE users SET student_email_verified=1 WHERE email=?', 'ama@test.local');
    const up = await w.student.post('/api/v1/materials', { course: 'BIT 264', title: 'Past questions', type: 'Past questions' });
    assert.equal(up.status, 200);
    assert.equal(((await w.student.get('/api/v1/materials')).json.materials as any[]).length, 0);
    await w.src.patch(`/api/src/materials/${up.json.material.id}`, { status: 'approved' });
    assert.equal(((await w.student.get('/api/v1/materials?course=BIT%20264')).json.materials as any[]).length, 1);
  });

  test('enquiries: student asks, SRC replies, student reads the reply', async () => {
    const w = await track(world());
    const q = await w.student.post('/api/v1/enquiries', { subject: 'Result missing', body: 'Please check ACF 251.' });
    assert.equal(((await w.src.get('/api/src/overview')).json).openEnquiries, 1);
    await w.src.post(`/api/src/enquiries/${q.json.enquiry.id}/reply`, { reply: 'Fixed.' });
    const mine = (await w.student.get('/api/v1/enquiries')).json.enquiries as any[];
    assert.equal(mine[0].reply, 'Fixed.');
    assert.equal(mine[0].resolved, true);
    assert.equal(((await w.src.get('/api/src/overview')).json).openEnquiries, 0);
  });

  test('polls: one vote per student, results visible to the SRC', async () => {
    const w = await track(world());
    const p = await w.src.post('/api/src/polls', { question: 'Best day?', options: ['Mon', 'Wed', ' ', 'Fri'] });
    assert.deepEqual(p.json.poll.options, ['Mon', 'Wed', 'Fri']);
    const id = p.json.poll.id;
    assert.equal((await w.student.post(`/api/v1/polls/${id}/vote`, { option: 5 })).status, 400);
    assert.equal((await w.student.post(`/api/v1/polls/${id}/vote`, { option: 1 })).status, 200);
    assert.equal((await w.student.post(`/api/v1/polls/${id}/vote`, { option: 2 })).status, 409);
    const res = (await w.src.get('/api/src/polls')).json.polls[0];
    assert.deepEqual(res.votes, [0, 1, 0]);
    await w.src.post(`/api/src/polls/${id}/close`);
    assert.equal((await w.student.post(`/api/v1/polls/${id}/vote`, { option: 0 })).status, 409);
  });

  test('club and event requests reach the SRC approvals queue', async () => {
    const w = await track(world());
    await w.student.post('/api/v1/approvals', { kind: 'club', title: 'Chess Society' });
    const q = (await w.src.get('/api/src/approvals')).json.approvals as any[];
    assert.equal(q.length, 1);
    assert.equal(q[0].status, 'pending');
    await w.src.patch(`/api/src/approvals/${q[0].id}`, { status: 'approved' });
    assert.equal(((await w.src.get('/api/src/approvals')).json.approvals as any[])[0].status, 'approved');
  });

  test('sign-up can be closed by the Super Admin', async () => {
    const w = await track(world());
    const body = { name: 'New Student', email: 'new@test.local', password: 'Long-Enough-1', level: 'Level 100' };
    await w.admin.put('/api/admin/settings', { registrationOpen: false });
    assert.equal((await new Client(w.run.url).post('/api/v1/auth/register', body)).status, 403);
    await w.admin.put('/api/admin/settings', { registrationOpen: true });
    const ok = await new Client(w.run.url).post('/api/v1/auth/register', body);
    assert.equal(ok.status, 200);
    assert.equal(ok.json.user.role, 'student', 'sign-up can never create an admin');
    assert.equal((await new Client(w.run.url).post('/api/v1/auth/register', { ...body, role: 'super_admin' })).status, 409);
  });

  test('study assistant needs the module switch, the AI module and its feature toggle', async () => {
    const fx = fakeFetch(() => ({ json: { content: [{ type: 'text', text: 'Normalisation removes redundancy.' }] } }));
    const w = await track(world({}, fx.fetch));
    w.run.app.db.run('UPDATE users SET student_email_verified=1 WHERE email=?', 'ama@test.local');
    const ask = () => w.student.post('/api/v1/ai/chat', { message: 'What is normalisation?' });
    assert.equal((await ask()).status, 403);

    await w.admin.put('/api/admin/integrations/ai', { values: { provider: 'Anthropic (Claude)', api_key: 'sk-ant-abc-123', model: 'm', f_study_assistant: 'true', monthly_cap: '2' }, enabled: true });
    assert.equal((await ask()).status, 403, 'AI module is live but the AI tools switch is off');

    await w.admin.put('/api/admin/flags/ai', { enabled: true });
    const ok = await ask();
    assert.equal(ok.status, 200);
    assert.match(ok.json.reply, /redundancy/);
    const cfg = (await w.student.get('/api/v1/config')).json;
    assert.equal(cfg.ai.studyAssistant, true);
    assert.equal(cfg.ai.examScan, false);

    await ask();
    const capped = await ask();
    assert.equal(capped.status, 429);
    assert.equal(capped.json.code, 'ai_cap');
    assert.equal(fx.calls.length, 2);
  });
});

describe('audit trail', () => {
  test('admin actions are recorded with who did them', async () => {
    const w = await track(world());
    await w.admin.put('/api/admin/flags/market', { enabled: false });
    const log = (await w.admin.get('/api/admin/audit')).json.entries as any[];
    assert.ok(log.some((e) => e.actor === ADMIN_EMAIL && /Disabled module "Marketplace"/.test(e.action)));
  });
});
