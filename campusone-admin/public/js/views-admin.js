import { get, post, put, patch, del } from './api.js';
import { h, toast, stamp, plural, pill, emptyState, switchControl, segmented, busy, confirmDialog, formDialog, infoDialog, mediaField } from './ui.js';

const STATUS = {
  live: ['live', 'Live', 'ok'],
  disabled: ['off', 'Switched off', 'neutral'],
  not_configured: ['setup', 'Needs setup', 'warn'],
};
const lamp = (status) => h('span', { class: `lamp ${STATUS[status][0]}`, role: 'img', 'aria-label': STATUS[status][1] });
const head = (title, sub, ...actions) =>
  h('div', { class: 'page-head' }, h('div', {}, h('h1', {}, title), sub ? h('p', { class: 'sub' }, sub) : null), h('div', { class: 'toolbar', style: 'margin:0' }, actions));

// ------------------------------------------------------------ switchboard

export async function switchboard({ rerender }) {
  const o = await get('/api/admin/overview');
  const wait = [];
  for (const i of o.integrations) if (i.status === 'not_configured') wait.push([`Connect ${i.title}`, `#/integrations/${i.id}`]);
  if (o.pendingListings) wait.push([`${plural(o.pendingListings, 'listing')} awaiting review`, '#/listings']);
  if (o.reportedListings) wait.push([`${plural(o.reportedListings, 'listing')} reported by students`, '#/listings']);

  const maint = h('div', { class: `maint ${o.maintenance ? 'on' : ''}` },
    h('div', { style: 'flex:1' },
      h('div', { class: 'title', style: 'font-weight:700' }, o.maintenance ? 'Maintenance mode is ON' : 'The mobile app is open'),
      h('div', { class: 'muted small' }, o.maintenance ? 'Students see a maintenance message. Admins can still sign in.' : 'Switch on to pause the student app while you make changes.')),
    switchControl({
      checked: o.maintenance, danger: true, label: 'Maintenance mode',
      onChange: async (next) => {
        if (next && !(await confirmDialog({ title: 'Pause the student app?', message: 'Students will be blocked until you switch this off.', confirm: 'Turn on maintenance', danger: true }))) return false;
        try { await put('/api/admin/settings', { maintenance: next }); toast(next ? 'Maintenance mode on.' : 'App reopened.'); rerender(); return true; } catch (e) { toast(e.message, 'bad'); return false; }
      },
    }));

  const modules = h('section', { class: 'panel' },
    h('div', { class: 'panel-head' }, h('h2', {}, 'Modules'), h('span', { class: 'muted small' }, 'Changes reach the app on its next refresh')),
    h('div', { class: 'rows' }, o.flags.map((f) => h('div', { class: 'row' },
      h('div', { class: 'grow' }, h('div', { class: 'title' }, f.label), h('div', { class: 'desc' }, f.description)),
      switchControl({ checked: f.enabled, label: f.label, onChange: async (next) => {
        try { await put(`/api/admin/flags/${f.key}`, { enabled: next }); toast(`${f.label} ${next ? 'on' : 'off'}.`); return true; } catch (e) { toast(e.message, 'bad'); return false; }
      } })))));

  const integ = h('section', { class: 'panel' },
    h('div', { class: 'panel-head' }, h('h2', {}, 'Integrations'), h('a', { class: 'btn ghost sm', href: '#/integrations' }, 'Open all')),
    h('div', { class: 'rows' }, o.integrations.map((i) => h('div', { class: 'row' },
      lamp(i.status),
      h('div', { class: 'grow' }, h('div', { class: 'title' }, i.title), h('div', { class: 'desc' }, `${i.category} · ${STATUS[i.status][1]}`)),
      h('a', { class: 'btn ghost sm', href: `#/integrations/${i.id}` }, i.status === 'not_configured' ? 'Set up' : 'Manage')))));

  const waiting = h('section', { class: 'panel' },
    h('div', { class: 'panel-head' }, h('h2', {}, 'Waiting for you')),
    wait.length
      ? h('div', { class: 'rows' }, wait.map(([t, href]) => h('div', { class: 'row' }, h('div', { class: 'grow' }, t), h('a', { class: 'btn ghost sm', href }, 'Open'))))
      : emptyState('Nothing waiting', 'Everything is connected and reviewed.'));

  const recent = h('section', { class: 'panel' },
    h('div', { class: 'panel-head' }, h('h2', {}, 'Recent activity'), h('a', { class: 'btn ghost sm', href: '#/system' }, 'Full log')),
    o.recent.length
      ? h('div', { class: 'rows' }, o.recent.map((r) => h('div', { class: 'row' }, h('div', { class: 'grow' }, h('div', {}, r.action), h('div', { class: 'desc' }, `${r.actor} · ${stamp(r.at)}`)))))
      : emptyState('No activity yet'));

  return h('div', {},
    head('Super Admin dashboard', 'App setup, campus content and platform controls in one place.'),
    h('div', { class: 'headline' },
      h('div', {}, h('div', { class: 'num' }, `${o.live}/${o.integrations.length}`), h('div', { class: 'lbl' }, 'integrations live')),
      h('div', {}, h('div', { class: 'num' }, o.students), h('div', { class: 'lbl' }, 'students')),
      h('div', {}, h('div', { class: 'num' }, o.users - o.students), h('div', { class: 'lbl' }, 'admins'))),
    maint,
    h('div', { class: 'cols' }, h('div', { class: 'stack' }, integ, waiting), h('div', { class: 'stack' }, modules, recent)));
}

// ----------------------------------------------------------- integrations

export async function integrations() {
  const { integrations: list } = await get('/api/admin/integrations');
  const cats = [...new Set(list.map((i) => i.category))];
  return h('div', {},
    head('Integrations', 'Connect every outside service here. Secrets are encrypted and never shown again after saving.'),
    h('div', { class: 'stack' }, cats.map((c) => h('section', { class: 'panel' },
      h('div', { class: 'panel-head' }, h('h2', {}, c)),
      h('div', { class: 'rows' }, list.filter((i) => i.category === c).map((i) => h('div', { class: 'row' },
        lamp(i.status),
        h('div', { class: 'grow' }, h('div', { class: 'title' }, i.title), h('div', { class: 'desc' }, i.description)),
        pill(STATUS[i.status][1], STATUS[i.status][2]),
        h('a', { class: 'btn ghost sm', href: `#/integrations/${i.id}` }, i.status === 'not_configured' ? 'Set up' : 'Manage'))))))));
}

export async function integrationDetail({ params }) {
  const { integration: it } = await get(`/api/admin/integrations/${params[0]}`);
  const inputs = {};
  const form = h('form', { novalidate: true });
  for (const f of it.fields) {
    const id = `fld-${f.key}`;
    const val = it.values[f.key] ?? '';
    let input;
    let label = f.label + (f.required ? ' *' : '');
    if (f.type === 'dropdown') input = h('select', { id }, f.options.map((o) => h('option', { value: o, selected: o === val }, o)));
    else if (f.type === 'toggle') input = h('input', { id, type: 'checkbox', checked: val === 'true' });
    else if (f.type === 'secret') {
      const isSet = it.secretSet.includes(f.key);
      input = f.rows
        ? h('textarea', { id, rows: f.rows, placeholder: isSet ? 'Saved. Paste a new value to replace it.' : '', autocomplete: 'off', spellcheck: 'false' })
        : h('input', { id, type: 'password', placeholder: isSet ? 'Saved. Type a new value to replace it.' : '', autocomplete: 'new-password' });
    } else input = h('input', { id, type: f.type === 'number' ? 'number' : f.type === 'email' ? 'email' : f.type === 'url' ? 'url' : 'text', value: val, placeholder: f.hint || '', autocomplete: 'off' });
    inputs[f.key] = [f, input];
    if (f.type === 'toggle') form.append(h('div', { class: 'field' }, h('label', { for: id, class: 'chip', style: 'justify-self:start' }, input, f.label)));
    else form.append(h('div', { class: 'field' }, h('label', { for: id }, label), input,
      f.type === 'secret' && it.secretSet.includes(f.key) ? h('span', { class: 'hint' }, 'A value is saved. Leave blank to keep it.') : f.hint && f.type !== 'text' && f.type !== 'email' && f.type !== 'url' ? h('span', { class: 'hint' }, f.hint) : null));
  }
  const enabled = h('input', { id: 'enabled', type: 'checkbox', checked: it.enabled });
  const result = h('div', { class: 'banner', hidden: true, role: 'status' });
  const toIn = h('input', { id: 'testto', type: it.id === 'email' ? 'email' : 'text', placeholder: it.id === 'email' ? 'you@example.com' : '024 000 0000' });
  const needsTo = it.id === 'email' || it.id === 'sms';

  const collect = () => {
    const values = {};
    for (const [key, [f, el]] of Object.entries(inputs)) values[key] = f.type === 'toggle' ? String(el.checked) : el.value.trim();
    return values;
  };
  const save = async (btn) => {
    const r = await busy(btn, () => put(`/api/admin/integrations/${it.id}`, { values: collect(), enabled: enabled.checked }));
    if (r) toast(`${it.title} saved.`);
    return r;
  };
  const saveBtn = h('button', { class: 'btn', type: 'button' }, 'Save');
  saveBtn.addEventListener('click', async () => { if (await save(saveBtn)) location.hash = '#/integrations'; });
  const testBtn = h('button', { class: 'btn ghost', type: 'button' }, 'Save & test');
  testBtn.addEventListener('click', async () => {
    result.hidden = true;
    if (!(await save(testBtn))) return;
    const r = await busy(testBtn, () => post(`/api/admin/integrations/${it.id}/test`, { to: toIn.value.trim() }));
    if (!r) return;
    result.className = `banner ${r.ok ? 'ok' : 'bad'}`;
    result.textContent = r.message;
    result.hidden = false;
  });
  const removeBtn = h('button', { class: 'btn ghost danger', type: 'button' }, 'Remove credentials');
  removeBtn.addEventListener('click', async () => {
    if (!(await confirmDialog({ title: `Remove ${it.title} credentials?`, message: 'The saved keys are erased and the service stops working until you set it up again.', confirm: 'Remove', danger: true }))) return;
    if (await busy(removeBtn, () => del(`/api/admin/integrations/${it.id}`))) { toast('Credentials removed.'); location.hash = '#/integrations'; }
  });

  const [, label, tone] = STATUS[it.status];
  return h('div', {},
    h('p', { class: 'small', style: 'margin-bottom:10px' }, h('a', { href: '#/integrations' }, '← All integrations')),
    head(it.title, it.description, pill(label, tone)),
    h('div', { class: 'cols' },
      h('section', { class: 'panel' }, h('div', { class: 'panel-head' }, h('h2', {}, 'Connection')), h('div', { class: 'panel-body' }, form)),
      h('div', { class: 'stack' },
        h('section', { class: 'panel' }, h('div', { class: 'panel-head' }, h('h2', {}, 'Status')), h('div', { class: 'panel-body' },
          h('div', { class: 'field' }, h('label', { for: 'enabled', class: 'chip', style: 'justify-self:start' }, enabled, 'Enabled for the app')),
          it.updatedAt ? h('p', { class: 'muted small', style: 'margin-bottom:12px' }, `Last saved ${stamp(it.updatedAt)} by ${it.updatedBy}.`) : null,
          needsTo ? h('div', { class: 'field' }, h('label', { for: 'testto' }, it.id === 'email' ? 'Send test to' : 'Send test to (phone)'), toIn) : null,
          result,
          h('div', { class: 'toolbar', style: 'margin:0' }, saveBtn, testBtn, it.secretSet.length ? removeBtn : null))))));
}

// --------------------------------------------------------------- listings

const KINDS = [['hostel', 'Hostels'], ['market', 'Marketplace'], ['promo', 'Promotions'], ['opportunity', 'Jobs']];
const LSTATUS = { pending: ['Pending', 'warn'], approved: ['Live', 'ok'], featured: ['Featured', 'info'], rejected: ['Rejected', 'bad'] };
let listKind = 'hostel';

export async function listings({ rerender, refreshBadges }) {
  const { listings: rows } = await get(`/api/admin/listings?kind=${listKind}`);
  const act = async (btn, id, status) => { if (await busy(btn, () => patch(`/api/admin/listings/${id}`, { status }))) { await rerender(); refreshBadges(); } };
  const btn = (label, cls, fn) => { const b = h('button', { class: `btn sm ${cls}`, type: 'button' }, label); b.addEventListener('click', () => fn(b)); return b; };

  const add = async () => {
    const label = KINDS.find((k) => k[0] === listKind)[1];
    const v = await formDialog({
      title: `Add to ${label}`, submit: 'Publish',
      fields: [
        { name: 'title', label: 'Title', required: true, max: 120 },
        { name: 'subtitle', label: 'Details', type: 'textarea', max: 300, rows: 3 },
        { name: 'owner', label: 'Owner or company', max: 100 },
        { name: 'price', label: 'Price or pay', max: 60 },
      ],
    });
    if (!v) return;
    try { await post('/api/admin/listings', { kind: listKind, ...v }); toast('Published.'); rerender(); } catch (e) { toast(e.message, 'bad'); }
  };

  const table = rows.length
    ? h('div', { class: 'table-wrap' }, h('table', { class: 't' },
      h('thead', {}, h('tr', {}, ['Listing', 'Owner', 'Price', 'Status', ''].map((x) => h('th', {}, x)))),
      h('tbody', {}, rows.map((r) => h('tr', {},
        h('td', {}, h('div', { class: 'cell-title' }, r.title), h('div', { class: 'cell-sub' }, r.subtitle)),
        h('td', {}, r.owner),
        h('td', { class: 'nowrap' }, r.price),
        h('td', {}, pill(LSTATUS[r.status][0], LSTATUS[r.status][1]), r.reports ? [' ', pill(`${plural(r.reports, 'report')}`, 'bad')] : null),
        h('td', {}, h('div', { class: 'actions' },
          r.status !== 'approved' && r.status !== 'featured' ? btn('Approve', '', (b) => act(b, r.id, 'approved')) : null,
          r.status === 'approved' ? btn('Feature', 'ghost', (b) => act(b, r.id, 'featured')) : null,
          r.status === 'featured' ? btn('Unfeature', 'ghost', (b) => act(b, r.id, 'approved')) : null,
          r.status !== 'rejected' ? btn('Reject', 'ghost', (b) => act(b, r.id, 'rejected')) : null,
          btn('Remove', 'ghost danger', async (b) => {
            if (!(await confirmDialog({ title: 'Remove listing?', message: `"${r.title}" will be deleted for everyone.`, confirm: 'Remove', danger: true }))) return;
            if (await busy(b, () => del(`/api/admin/listings/${r.id}`))) { toast('Removed.'); rerender(); refreshBadges(); }
          }))))))))
    : emptyState('Nothing here yet', 'Add one, or wait for student submissions.');

  return h('div', {},
    head('Listings', 'Hostels, marketplace, promotions and jobs. Students only see approved items.', h('button', { class: 'btn', type: 'button', onclick: add }, 'Add listing')),
    h('div', { class: 'toolbar' }, segmented(KINDS, listKind, (k) => { listKind = k; rerender(); })),
    h('section', { class: 'panel' }, table));
}

// --------------------------------------------------------- campus directory

let campusKind = 'club';
const CAMPUS_KINDS = [['club', 'Clubs'], ['event', 'Events']];

export async function campusContent({ rerender }) {
  const { items } = await get(`/api/admin/campus-content?kind=${campusKind}`);
  const act = async (btn, id, status) => {
    if (await busy(btn, () => patch(`/api/admin/campus-content/${id}`, { status }))) {
      toast(status === 'published' ? 'Published to the app.' : 'Moved to drafts.');
      rerender();
    }
  };
  const add = async () => {
    const fields = [
      { name: 'title', label: campusKind === 'club' ? 'Club name' : 'Event title', required: true, max: 160 },
      { name: 'category', label: 'Category', max: 80 },
      { name: 'description', label: 'Description', type: 'textarea', rows: 4, max: 4000 },
      ...(campusKind === 'event' ? [
        { name: 'venue', label: 'Venue', max: 200 },
        { name: 'date', label: 'Date and time', max: 100 },
        { name: 'organizer', label: 'Organizer', max: 120 },
        { name: 'startsAt', label: 'Start time (ISO format)', max: 40 },
        { name: 'endsAt', label: 'End time (ISO format)', max: 40 },
        { name: 'seats', label: 'Capacity (0 = unlimited)', type: 'number' },
        { name: 'cover', label: 'Cover image', type: 'media', accept: 'image/*', max: 1000 },
      ] : [
        { name: 'meeting', label: 'Meeting schedule', max: 200 },
        { name: 'venue', label: 'Meeting venue', max: 200 },
        { name: 'tagline', label: 'Short tagline', max: 180 },
        { name: 'cover', label: 'Cover image', type: 'media', accept: 'image/*', max: 1000 },
      ]),
    ];
    const values = await formDialog({ title: `Add ${campusKind}`, submit: 'Publish', fields });
    if (!values) return;
    const { organizer, startsAt, endsAt, seats, meeting, tagline, cover, ...item } = values;
    const details = campusKind === 'event'
      ? { organizer, startsAt, endsAt, seats: Number(seats || 0), cover, tagline: item.title }
      : { meeting, tagline, accepting: true, cover };
    try {
      await post('/api/admin/campus-content', { kind: campusKind, ...item, details });
      toast(`${campusKind === 'club' ? 'Club' : 'Event'} published to the mobile app.`);
      rerender();
    } catch (e) { toast(e.message, 'bad'); }
  };
  const rows = items.length
    ? h('div', { class: 'rows' }, items.map((item) => h('div', { class: 'row' },
      h('div', { class: 'grow' }, h('div', { class: 'title' }, item.name || item.title), h('div', { class: 'desc' }, [item.category, item.venue, item.date].filter(Boolean).join(' · '))),
      pill(item.status === 'published' ? 'Published' : 'Draft', item.status === 'published' ? 'ok' : 'neutral'),
      item.status === 'published'
        ? h('button', { class: 'btn ghost sm', type: 'button', onclick: (e) => act(e.currentTarget, item.id, 'draft') }, 'Unpublish')
        : h('button', { class: 'btn sm', type: 'button', onclick: (e) => act(e.currentTarget, item.id, 'published') }, 'Publish'))))
    : emptyState(`No ${campusKind === 'club' ? 'clubs' : 'events'} yet`, 'Add an item here and it will appear in the student app.');
  return h('div', {},
    head('Campus content', 'Publish clubs and events shown in the student app.', h('button', { class: 'btn', type: 'button', onclick: add }, `Add ${campusKind}`)),
    h('div', { class: 'toolbar' }, segmented(CAMPUS_KINDS, campusKind, (kind) => { campusKind = kind; rerender(); })),
    h('section', { class: 'panel' }, rows));
}

// ------------------------------------------------------- community moderation

export async function communityReports({ rerender }) {
  const { items } = await get('/api/admin/reports');
  const act = async (btn, item, status, hide = false) => {
    if (await busy(btn, () => patch(`/api/admin/reports/${item.id}`, { status, hide }))) {
      toast(status === 'dismissed' ? 'Report dismissed.' : (hide ? 'Post removed from the community feed.' : 'Report marked reviewed.'));
      rerender();
    }
  };
  const rows = items.length ? h('div', { class: 'rows' }, items.map((item) => h('div', { class: 'row' },
    h('div', { class: 'grow' }, h('div', { class: 'title' }, `${item.target_type}: ${item.reason}`), h('div', { class: 'desc' }, `${item.reporter || 'Student'} · ${item.detail || item.target_id} · ${stamp(item.created_at)}`)),
    pill(item.status, item.status === 'pending' ? 'warn' : 'neutral'),
    item.status === 'pending' ? h('button', { class: 'btn ghost sm', type: 'button', onclick: (e) => act(e.currentTarget, item, 'dismissed') }, 'Dismiss') : null,
    item.status === 'pending' && item.target_type === 'post' ? h('button', { class: 'btn sm', type: 'button', onclick: (e) => act(e.currentTarget, item, 'reviewed', true) }, 'Hide post') : null,
  ))) : emptyState('No community reports', 'Reports submitted by students will appear here.');
  return h('div', {}, head('Community reports', 'Review student reports and remove posts that break campus rules.'), h('section', { class: 'panel' }, rows));
}

// ----------------------------------------------------------------- people

const ROLE_LABEL = { student: 'Student', src_admin: 'SRC admin', super_admin: 'Super admin' };
let peopleQuery = '';

function showTemp(title, who, temp, emailed) {
  return infoDialog({
    title,
    copy: temp,
    body: h('div', {},
      h('p', { style: 'margin-bottom:10px' }, `Give this one-time password to ${who}. It is shown only now and they must change it at first sign-in.`),
      h('div', { class: 'secret-box' }, temp),
      emailed ? h('p', { class: 'small muted', style: 'margin-top:10px' }, 'A copy was also e-mailed to them.') : null),
  });
}

export async function people({ user, rerender }) {
  const { users } = await get(`/api/admin/users?q=${encodeURIComponent(peopleQuery)}`);
  const search = h('input', { type: 'search', class: 'grow', placeholder: 'Search name or e-mail', value: peopleQuery, 'aria-label': 'Search people' });
  let timer;
  search.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(() => { peopleQuery = search.value; rerender().then(() => document.querySelector('input[type=search]')?.focus()); }, 350); });

  const invite = async () => {
    const v = await formDialog({
      title: 'Invite an admin', intro: 'They get a one-time password and must choose their own at first sign-in.', submit: 'Create account',
      fields: [
        { name: 'name', label: 'Full name', required: true, max: 100 },
        { name: 'email', label: 'E-mail', type: 'email', required: true },
        { name: 'role', label: 'Role', type: 'select', value: 'src_admin', options: [['src_admin', 'SRC admin'], ['super_admin', 'Super admin']] },
      ],
    });
    if (!v) return;
    try {
      const r = await post('/api/admin/users/invite', v);
      await showTemp('Account created', v.name, r.tempPassword, r.emailed);
      rerender();
    } catch (e) { toast(e.message, 'bad'); }
  };

  const btn = (label, cls, fn) => { const b = h('button', { class: `btn sm ${cls}`, type: 'button' }, label); b.addEventListener('click', () => fn(b)); return b; };

  const rows = users.map((u) => {
    const me = u.id === user.id;
    return h('tr', {},
      h('td', {}, h('div', { class: 'cell-title' }, u.name, me ? ' (you)' : ''), h('div', { class: 'cell-sub' }, u.email)),
      h('td', {}, pill(ROLE_LABEL[u.role], u.role === 'student' ? 'neutral' : 'info'), u.suspended ? [' ', pill('Suspended', 'bad')] : null),
      h('td', { class: 'nowrap' }, stamp(u.createdAt)),
      h('td', {}, h('div', { class: 'actions' }, me ? null : [
        btn('Role', 'ghost', async () => {
          const v = await formDialog({ title: `Role for ${u.name}`, submit: 'Change role', fields: [{ name: 'role', label: 'Role', type: 'select', value: u.role, options: Object.entries(ROLE_LABEL) }] });
          if (!v || v.role === u.role) return;
          if (!(await confirmDialog({ title: 'Change role?', message: `${u.name} will become ${ROLE_LABEL[v.role]} immediately.`, confirm: 'Change role' }))) return;
          try { await patch(`/api/admin/users/${u.id}`, { role: v.role }); toast('Role changed.'); rerender(); } catch (e) { toast(e.message, 'bad'); }
        }),
        btn(u.suspended ? 'Reinstate' : 'Suspend', u.suspended ? '' : 'ghost danger', async (b) => {
          if (!u.suspended && !(await confirmDialog({ title: 'Suspend account?', message: `${u.name} is signed out of everything and cannot sign in until reinstated.`, confirm: 'Suspend', danger: true }))) return;
          if (await busy(b, () => patch(`/api/admin/users/${u.id}`, { suspended: !u.suspended }))) { toast(u.suspended ? 'Reinstated.' : 'Suspended.'); rerender(); }
        }),
        btn('Reset password', 'ghost', async (b) => {
          if (!(await confirmDialog({ title: 'Reset password?', message: `${u.name}'s current password stops working and a one-time password is created.`, confirm: 'Reset' }))) return;
          const r = await busy(b, () => post(`/api/admin/users/${u.id}/reset-password`));
          if (r) await showTemp('Password reset', u.name, r.tempPassword, false);
        })])));
  });

  return h('div', {},
    head('People', 'Students and admins. Role and suspension take effect immediately.', h('button', { class: 'btn', type: 'button', onclick: invite }, 'Invite admin')),
    h('div', { class: 'toolbar' }, search),
    h('section', { class: 'panel' }, rows.length
      ? h('div', { class: 'table-wrap' }, h('table', { class: 't' }, h('thead', {}, h('tr', {}, ['Person', 'Role', 'Joined', ''].map((x) => h('th', {}, x)))), h('tbody', {}, rows)))
      : emptyState('No one found', peopleQuery ? 'Try a different search.' : 'Students appear here after they sign up in the app.')));
}

// ----------------------------------------------------------------- system

export async function system() {
  const [s, a] = await Promise.all([get('/api/admin/settings'), get('/api/admin/audit?limit=100')]);
  const ver = h('input', { type: 'text', id: 'minver', value: s.minAppVersion, placeholder: 'e.g. 1.2.0', style: 'max-width:160px' });
  const saveVer = h('button', { class: 'btn sm', type: 'button' }, 'Save');
  saveVer.addEventListener('click', async () => { if (await busy(saveVer, () => put('/api/admin/settings', { minAppVersion: ver.value.trim() }))) toast('Saved.'); });

  return h('div', {},
    head('System', 'Sign-up, app versions and the audit trail.'),
    h('div', { class: 'stack' },
      h('section', { class: 'panel' }, h('div', { class: 'rows' },
        h('div', { class: 'row' }, h('div', { class: 'grow' }, h('div', { class: 'title' }, 'Student sign-up'), h('div', { class: 'desc' }, 'When off, new students cannot create accounts in the app.')),
          switchControl({ checked: s.registrationOpen, label: 'Student sign-up', onChange: async (n) => { try { await put('/api/admin/settings', { registrationOpen: n }); toast(n ? 'Sign-up open.' : 'Sign-up closed.'); return true; } catch (e) { toast(e.message, 'bad'); return false; } } })),
        h('div', { class: 'row' }, h('div', { class: 'grow' }, h('label', { class: 'title', for: 'minver' }, 'Minimum app version'), h('div', { class: 'desc' }, 'The app can ask older versions to update. Leave blank for no minimum.')), ver, saveVer),
        h('div', { class: 'row' }, h('div', { class: 'grow' }, h('div', { class: 'title' }, 'Live sending'), h('div', { class: 'desc' }, s.liveSending ? 'E-mail, SMS and push messages are really sent.' : 'Dry run: announcements count recipients but send nothing. Set ALLOW_LIVE_SENDING=true on the server to go live.')),
          pill(s.liveSending ? 'On' : 'Dry run', s.liveSending ? 'ok' : 'warn')))),
      h('section', { class: 'panel' },
        h('div', { class: 'panel-head' }, h('h2', {}, 'Audit log'), h('span', { class: 'muted small' }, 'Latest 100 actions')),
        a.entries.length
          ? h('div', { class: 'table-wrap' }, h('table', { class: 't' }, h('thead', {}, h('tr', {}, ['When', 'Who', 'Action'].map((x) => h('th', {}, x)))),
            h('tbody', {}, a.entries.map((e) => h('tr', {}, h('td', { class: 'nowrap' }, stamp(e.at)), h('td', {}, e.actor), h('td', {}, e.action))))))
          : emptyState('No activity yet'))));
}

// --------------------------------------------------------------- app branding

export async function branding() {
  const { branding } = await get('/api/admin/branding');
  const fields = [
    ['appName', 'App name', 1], ['logoImageUrl', 'Logo image URL (HTTPS)', 1],
    ['primaryColor', 'GCTU blue (hex)', 1], ['accentColor', 'GCTU gold (hex)', 1], ['tagline', 'Tagline', 2],
    ['splashTitle', 'Splash title', 1], ['splashSubtitle', 'Splash subtitle', 2],
    ['splashImageUrl', 'Splash image URL (HTTPS)', 1],
    ['onboardingTitle', 'Onboarding title', 1], ['onboardingText', 'Onboarding text', 3],
    ['onboardingImageUrl', 'Onboarding image URL (HTTPS)', 1],
    ['onboardingButtonText', 'Onboarding button', 1],
    ['maintenanceText', 'Maintenance message', 2],
  ];
  const inputs = {};
  const form = h('form', { class: 'panel-body', novalidate: true });
  for (const [key, label, rows] of fields) {
    const id = `brand-${key}`;
    if (key.endsWith('ImageUrl')) {
      const field = mediaField({ id, label, value: branding[key] || '', accept: 'image/*', max: 500 });
      inputs[key] = field.input;
      form.append(field.element);
      continue;
    }
    const input = rows > 1
      ? h('textarea', { id, rows, maxlength: key === 'onboardingText' ? 500 : 300 }, branding[key] || '')
      : h('input', { id, type: 'text', value: branding[key] || '' });
    inputs[key] = input;
    form.append(h('div', { class: 'field' }, h('label', { for: id }, label), input));
  }
  const save = h('button', { class: 'btn', type: 'submit' }, 'Save app content');
  form.append(h('div', { class: 'toolbar', style: 'margin:0' }, save));
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(Object.entries(inputs).map(([key, input]) => [key, input.value.trim()]));
    if (await busy(save, () => put('/api/admin/branding', values))) toast('App branding saved. Students see the changes the next time the app refreshes.');
  });
  return h('div', {},
    head('App branding', 'Set the app content and GCTU blue and gold colours used throughout the student app.'),
    h('section', { class: 'panel' }, form),
    h('p', { class: 'muted small' }, 'Use an HTTPS link or upload an image. The native launcher icon and operating-system splash are part of the installed app and change only with a new app build.'));
}
