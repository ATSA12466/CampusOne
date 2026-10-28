import { get, post, patch, del } from './api.js';
import { h, toast, stamp, plural, pill, emptyState, segmented, busy, confirmDialog, formDialog } from './ui.js';

const head = (title, sub, ...actions) =>
  h('div', { class: 'page-head' }, h('div', {}, h('h1', {}, title), sub ? h('p', { class: 'sub' }, sub) : null), h('div', { class: 'toolbar', style: 'margin:0' }, actions));
const btn = (label, cls, fn) => { const b = h('button', { class: `btn sm ${cls}`, type: 'button' }, label); b.addEventListener('click', () => fn(b)); return b; };
const table = (cols, rows) => h('div', { class: 'table-wrap' }, h('table', { class: 't' }, h('thead', {}, h('tr', {}, cols.map((c) => h('th', {}, c)))), h('tbody', {}, rows)));
const CH = { inApp: 'In-app', push: 'Push', email: 'E-mail', sms: 'SMS' };

// --------------------------------------------------------------- overview

export async function overview({ user }) {
  const o = await get('/api/src/overview');
  const stat = (n, l, href) => h('a', { href, style: 'text-decoration:none;color:inherit' }, h('div', { class: 'num', style: 'font-size:2.3rem;font-weight:800;line-height:1' }, n), h('div', { class: 'muted small', style: 'margin-top:4px' }, l));
  return h('div', {},
    head('SRC Office', `Welcome, ${user.name.split(' ')[0]}. Here is what needs attention today.`),
    h('div', { class: 'headline' },
      stat(o.openEnquiries, 'open enquiries', '#/students'),
      stat(o.pendingMaterials, 'materials to review', '#/academics'),
      stat(o.pendingApprovals, 'club and event requests', '#/approvals'),
      stat(o.examsScheduled, 'exam slots scheduled', '#/academics')),
    h('div', { class: 'cols' },
      h('section', { class: 'panel' }, h('div', { class: 'panel-head' }, h('h2', {}, 'Open polls'), h('a', { class: 'btn ghost sm', href: '#/students' }, 'Manage')),
        o.openPolls.length ? h('div', { class: 'rows' }, o.openPolls.map((p) => h('div', { class: 'row' }, h('div', { class: 'grow' }, h('div', { class: 'title' }, p.question), h('div', { class: 'desc' }, plural(p.total, 'vote')))))) : emptyState('No open polls')),
      h('section', { class: 'panel' }, h('div', { class: 'panel-head' }, h('h2', {}, 'Announcement channels'), h('a', { class: 'btn ghost sm', href: '#/announce' }, 'Announce')),
        h('div', { class: 'rows' }, Object.entries(o.channels).map(([c, on]) => h('div', { class: 'row' }, h('div', { class: 'grow' }, CH[c]), pill(on ? 'Ready' : 'Not connected', on ? 'ok' : 'neutral')))))));
}

// -------------------------------------------------------------- academics

let acTab = 'lecture';

export async function academics({ rerender, refreshBadges }) {
  const tabs = segmented([['lecture', 'Lectures'], ['exam', 'Exams'], ['materials', 'Materials']], acTab, (t) => { acTab = t; rerender(); });
  let body;
  let action = null;

  if (acTab === 'materials') {
    const { materials } = await get('/api/src/materials');
    const mark = async (b, id, status) => { if (await busy(b, () => patch(`/api/src/materials/${id}`, { status }))) { await rerender(); refreshBadges(); } };
    const tone = { pending: 'warn', approved: 'ok', rejected: 'bad' };
    const uploadButton = h('button', { class: 'btn', type: 'button' }, 'Upload course file');
    const fileInput = h('input', { type: 'file', accept: 'image/*,video/*,audio/*,.pdf,.doc,.docx,.ppt,.pptx,.txt', hidden: true });
    uploadButton.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      if (file.size > 25 * 1024 * 1024) { toast('Choose a file no larger than 25 MB.', 'bad'); fileInput.value = ''; return; }
      const details = await formDialog({ title: 'Publish course file', intro: file.name, submit: 'Upload and publish', fields: [
        { name: 'course', label: 'Course code or name', required: true, max: 80 },
        { name: 'title', label: 'Title', required: true, max: 150, value: file.name.replace(/\.[^.]+$/, '') },
        { name: 'type', label: 'Resource type', type: 'select', required: true, value: 'Other', options: [['Slides','Slides'],['Notes','Notes'],['Past questions','Past questions'],['Other','Other']] },
      ] });
      if (!details) { fileInput.value = ''; return; }
      uploadButton.disabled = true; uploadButton.textContent = 'Uploading…';
      try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        let binary = '';
        for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
        await post('/api/src/materials/upload', { ...details, fileName: file.name, mimeType: file.type, data: btoa(binary) });
        toast('File published to course materials.'); await rerender();
      } catch (error) { toast(error.message || 'Upload failed.', 'bad'); }
      finally { uploadButton.disabled = false; uploadButton.textContent = 'Upload course file'; fileInput.value = ''; }
    });
    action = h('div', { class: 'toolbar' }, uploadButton, fileInput);
    body = materials.length ? table(['Material', 'Course', 'From', 'Status', ''], materials.map((m) => h('tr', {},
      h('td', {}, h('div', { class: 'cell-title' }, m.title), h('div', { class: 'cell-sub' }, m.type)),
      h('td', {}, m.course), h('td', {}, m.uploader), h('td', {}, pill(m.status[0].toUpperCase() + m.status.slice(1), tone[m.status])),
      h('td', {}, h('div', { class: 'actions' },
        m.url ? h('a', { class: 'btn ghost sm', href: m.url, target: '_blank', rel: 'noopener' }, 'Open file') : null,
        m.status !== 'approved' ? btn('Approve', '', (b) => mark(b, m.id, 'approved')) : null,
        m.status !== 'rejected' ? btn('Reject', 'ghost', (b) => mark(b, m.id, 'rejected')) : null))))) : emptyState('No materials yet', 'Student uploads from the app land here for review.');
  } else {
    const isExam = acTab === 'exam';
    const { slots } = await get(`/api/src/slots?exam=${isExam ? 1 : 0}`);
    action = h('button', { class: 'btn', type: 'button', onclick: async () => {
      const v = await formDialog({
        title: isExam ? 'Add exam' : 'Add lecture', submit: 'Add',
        fields: [
          { name: 'course', label: 'Course', required: true, max: 120 },
          { name: 'when', label: isExam ? 'Date' : 'Day', required: true, max: 40, placeholder: isExam ? '12 Dec 2026' : 'Monday' },
          { name: 'time', label: 'Time', required: true, max: 40, placeholder: '8:00 – 10:00' },
          { name: 'venue', label: 'Venue', required: true, max: 80 },
          { name: 'level', label: 'Level', required: true, max: 40, placeholder: 'Level 300' },
        ],
      });
      if (!v) return;
      try { await post('/api/src/slots', { ...v, isExam }); toast('Added.'); rerender(); refreshBadges(); } catch (e) { toast(e.message, 'bad'); }
    } }, isExam ? 'Add exam' : 'Add lecture');
    body = slots.length ? table([isExam ? 'Date' : 'Day', 'Course', 'Time', 'Venue', 'Level', ''], slots.map((s) => h('tr', {},
      h('td', { class: 'nowrap' }, s.when), h('td', { class: 'cell-title' }, s.course), h('td', { class: 'nowrap' }, s.time), h('td', {}, s.venue), h('td', {}, s.level),
      h('td', {}, h('div', { class: 'actions' }, btn('Remove', 'ghost danger', async (b) => {
        if (!(await confirmDialog({ title: 'Remove slot?', message: `${s.course} will disappear from students' timetables.`, confirm: 'Remove', danger: true }))) return;
        if (await busy(b, () => del(`/api/src/slots/${s.id}`))) { toast('Removed.'); rerender(); }
      })))))) : emptyState(isExam ? 'No exams scheduled' : 'No lectures scheduled');
  }
  return h('div', {}, head('Academics', 'Timetables, exam schedule and student-shared materials.', action), h('div', { class: 'toolbar' }, tabs), h('section', { class: 'panel' }, body));
}

// --------------------------------------------------------------- announce

export async function announce({ rerender }) {
  const [{ channels, audiences }, { announcements }] = await Promise.all([get('/api/src/channels'), get('/api/src/announcements')]);
  const title = h('input', { id: 'a-title', type: 'text', maxlength: 120 });
  const bodyEl = h('textarea', { id: 'a-body', rows: 5, maxlength: 2000 });
  const aud = h('select', { id: 'a-aud' }, audiences.map((a) => h('option', { value: a }, a)));
  const pinned = h('input', { type: 'checkbox' });
  const chips = {};
  const chipRow = h('div', { class: 'chips' }, Object.keys(CH).filter((c) => c !== 'inApp').map((c) => {
    const input = h('input', { type: 'checkbox', disabled: !channels[c] });
    chips[c] = input;
    return h('label', { class: 'chip', title: channels[c] ? '' : 'Connect this in Super Admin → Integrations' }, input, CH[c], channels[c] ? null : h('span', { class: 'muted small' }, 'not connected'));
  }));
  const send = h('button', { class: 'btn', type: 'button' }, 'Publish');
  send.addEventListener('click', async () => {
    if (!title.value.trim() || !bodyEl.value.trim()) { toast('Add a title and a message.', 'bad'); return; }
    const picked = Object.keys(chips).filter((c) => chips[c].checked);
    if (!(await confirmDialog({ title: 'Publish announcement?', message: `It goes to ${aud.value} in the app${picked.length ? ` and by ${picked.map((c) => CH[c]).join(', ')}` : ''}. This cannot be recalled.`, confirm: 'Publish' }))) return;
    const r = await busy(send, () => post('/api/src/announcements', { title: title.value.trim(), body: bodyEl.value.trim(), audience: aud.value, channels: picked, pinned: pinned.checked }));
    if (!r) return;
    toast(r.dryRun ? 'Published in the app. Outside channels ran as a dry run (live sending is off).' : r.skipped.length ? `Published. Skipped (not connected): ${r.skipped.map((c) => CH[c]).join(', ')}.` : 'Published.');
    rerender();
  });

  const dispatchText = (d) => Object.entries(d).map(([c, x]) => `${CH[c] || c}: ${x.mode === 'dry_run' ? `dry run, ${plural(x.recipients, 'recipient')}` : `${x.sent} sent${x.failed ? `, ${x.failed} failed` : ''}`}`).join(' · ');

  return h('div', {},
    head('Announce', 'Reach students in the app, and by push, e-mail or SMS once those are connected.'),
    h('div', { class: 'cols' },
      h('section', { class: 'panel' }, h('div', { class: 'panel-head' }, h('h2', {}, 'New announcement')), h('div', { class: 'panel-body' },
        h('div', { class: 'field' }, h('label', { for: 'a-title' }, 'Title'), title),
        h('div', { class: 'field' }, h('label', { for: 'a-body' }, 'Message'), bodyEl),
        h('div', { class: 'field' }, h('label', { for: 'a-aud' }, 'Audience'), aud),
        h('div', { class: 'field' }, h('span', { class: 'label' }, 'Also send by'), chipRow, h('span', { class: 'hint' }, 'It always appears in the app.')),
        h('div', { class: 'field' }, h('label', { class: 'chip', style: 'justify-self:start' }, pinned, 'Pin to the top')),
        send)),
      h('section', { class: 'panel' }, h('div', { class: 'panel-head' }, h('h2', {}, 'History')),
        announcements.length ? h('div', { class: 'rows' }, announcements.map((a) => h('div', { class: 'row', style: 'align-items:flex-start' },
          h('div', { class: 'grow' }, h('div', { class: 'title' }, a.title, a.pinned ? [' ', pill('Pinned', 'info')] : null), h('div', { class: 'desc' }, `${a.audience} · ${stamp(a.createdAt)}`),
            Object.keys(a.dispatch).length ? h('div', { class: 'desc' }, dispatchText(a.dispatch)) : null),
          btn(a.pinned ? 'Unpin' : 'Pin', 'ghost', async (b) => { if (await busy(b, () => patch(`/api/src/announcements/${a.id}`, { pinned: !a.pinned }))) rerender(); }),
          btn('Delete', 'ghost danger', async (b) => {
            if (!(await confirmDialog({ title: 'Delete announcement?', message: `"${a.title}" is removed from the app. Messages already sent cannot be recalled.`, confirm: 'Delete', danger: true }))) return;
            if (await busy(b, () => del(`/api/src/announcements/${a.id}`))) rerender();
          })))) : emptyState('No announcements yet'))));
}

// --------------------------------------------------------------- students

let stTab = 'enquiries';
let repUserQuery = '';

export async function students({ rerender, refreshBadges }) {
  const tabs = segmented([['enquiries', 'Enquiries'], ['polls', 'Polls'], ['reps', 'Class reps']], stTab, (t) => { stTab = t; rerender(); });
  let body;
  let action = null;

  if (stTab === 'enquiries') {
    const { enquiries } = await get('/api/src/enquiries');
    body = enquiries.length ? h('div', { class: 'rows' }, enquiries.map((e) => h('div', { class: 'row', style: 'align-items:flex-start' },
      h('div', { class: 'grow' },
        h('div', { class: 'title' }, e.subject, ' ', pill(e.resolved ? 'Answered' : 'Open', e.resolved ? 'ok' : 'warn')),
        h('div', { class: 'desc' }, `${e.student} · ${stamp(e.createdAt)}`),
        h('p', { style: 'margin-top:6px;white-space:pre-wrap' }, e.body),
        e.reply ? h('p', { class: 'banner', style: 'margin:8px 0 0;white-space:pre-wrap' }, h('b', {}, 'Your reply: '), e.reply) : null),
      e.resolved
        ? btn('Reopen', 'ghost', async (b) => { if (await busy(b, () => post(`/api/src/enquiries/${e.id}/reopen`))) { await rerender(); refreshBadges(); } })
        : btn('Reply', '', async () => {
          const v = await formDialog({ title: `Reply to ${e.student}`, intro: e.subject, submit: 'Send reply', fields: [{ name: 'reply', label: 'Reply', type: 'textarea', required: true, max: 2000 }] });
          if (!v) return;
          try { await post(`/api/src/enquiries/${e.id}/reply`, v); toast('Reply sent.'); await rerender(); refreshBadges(); } catch (er) { toast(er.message, 'bad'); }
        })))) : emptyState('No enquiries', 'Questions students send from the app show up here.');
  } else if (stTab === 'polls') {
    const { polls } = await get('/api/src/polls');
    action = h('button', { class: 'btn', type: 'button', onclick: async () => {
      const v = await formDialog({
        title: 'New poll', submit: 'Open poll',
        fields: [
          { name: 'question', label: 'Question', required: true, max: 200 },
          { name: 'options', label: 'Options', type: 'textarea', required: true, rows: 5, hint: 'One option per line, 2 to 8.' },
        ],
      });
      if (!v) return;
      try { await post('/api/src/polls', { question: v.question, options: v.options.split('\n') }); toast('Poll is open.'); rerender(); } catch (e) { toast(e.message, 'bad'); }
    } }, 'New poll');
    body = polls.length ? h('div', { class: 'rows' }, polls.map((p) => h('div', { class: 'row', style: 'align-items:flex-start' },
      h('div', { class: 'grow' },
        h('div', { class: 'title' }, p.question, ' ', pill(p.open ? 'Open' : 'Closed', p.open ? 'ok' : 'neutral')),
        h('div', { class: 'desc', style: 'margin-bottom:8px' }, `${plural(p.total, 'vote')} · ${stamp(p.createdAt)}`),
        p.options.map((o, i) => {
          const pct = p.total ? Math.round((p.votes[i] / p.total) * 100) : 0;
          return h('div', { style: 'margin:6px 0' }, h('div', { class: 'small', style: 'display:flex;justify-content:space-between;gap:10px' }, h('span', {}, o), h('span', { class: 'muted' }, `${p.votes[i]} · ${pct}%`)), h('div', { class: 'bar', role: 'img', 'aria-label': `${o}: ${pct}%` }, h('span', { style: `width:${pct}%` })));
        })),
      p.open ? btn('Close', 'ghost', async (b) => {
        if (!(await confirmDialog({ title: 'Close poll?', message: 'Students can no longer vote. Results stay visible.', confirm: 'Close poll' }))) return;
        if (await busy(b, () => post(`/api/src/polls/${p.id}/close`))) rerender();
      }) : null))) : emptyState('No polls yet');
  } else {
    const { classReps } = await get('/api/src/class-reps');
    const { users } = await get(`/api/src/users?q=${encodeURIComponent(repUserQuery)}&limit=200`);
    const userSearch = h('input', { class: 'grow', type: 'search', value: repUserQuery, placeholder: 'Search student accounts by name, e-mail, programme or level', 'aria-label': 'Search student accounts' });
    let searchTimer;
    userSearch.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => { repUserQuery = userSearch.value.trim(); rerender().then(() => document.querySelector('input[aria-label="Search student accounts"]')?.focus()); }, 300);
    });
    action = h('button', { class: 'btn', type: 'button', onclick: async () => {
      const v = await formDialog({
        title: 'Assign course representative', intro: 'Choose an active student account, then set the course, group and academic session.', submit: 'Assign',
        fields: [
          { name: 'userId', label: 'App user', type: 'select', required: true, options: [['', 'Choose an app user'], ...users.map((u) => [u.id, `${u.name} · ${u.email} · ${u.programme || 'No programme'} · ${u.level || 'No level'}`])] },
          { name: 'course', label: 'Course code or name', required: true, max: 120, placeholder: 'BIT 264' },
          { name: 'group', label: 'Group', required: true, max: 80, placeholder: 'Group A' },
          { name: 'session', label: 'Academic session', required: true, max: 40, placeholder: '2026/2027' },
        ],
      });
      if (!v) return;
      try { await post('/api/src/class-reps', v); toast('Course representative assigned.'); rerender(); } catch (e) { toast(e.message, 'bad'); }
    } }, 'Assign course rep');
    const repRows = classReps.length ? table(['Student', 'Programme / level', 'Course', 'Group', 'Session', 'Phone', ''], classReps.map((r) => h('tr', {},
      h('td', { class: 'cell-title' }, r.name), h('td', {}, [r.programme, r.level].filter(Boolean).join(' · ')), h('td', {}, r.course), h('td', {}, r.group || '—'), h('td', {}, r.session || '—'), h('td', { class: 'nowrap' }, r.phone),
      h('td', {}, h('div', { class: 'actions' }, btn('Remove', 'ghost danger', async (b) => {
        if (!(await confirmDialog({ title: 'Remove course rep?', message: `${r.name} will be removed from ${r.course}.`, confirm: 'Remove', danger: true }))) return;
        if (await busy(b, () => del(`/api/src/class-reps/${r.id}`))) rerender();
      })))))) : emptyState('No course reps yet', 'Choose an active student account, then assign the course, group and session.');
    body = h('div', {}, h('div', { class: 'toolbar' }, userSearch, h('span', { class: 'muted small' }, `${users.length} matching app users`)), repRows);
  }
  return h('div', {}, head('Students', 'Enquiries, polls and class representatives.', action), h('div', { class: 'toolbar' }, tabs), h('section', { class: 'panel' }, body));
}

// -------------------------------------------------------------- approvals

export async function approvals({ rerender, refreshBadges }) {
  const { approvals: list } = await get('/api/src/approvals');
  const tone = { pending: 'warn', approved: 'ok', rejected: 'bad' };
  const decide = async (b, a, status) => {
    if (status === 'rejected' && !(await confirmDialog({ title: 'Decline request?', message: `"${a.title}" will be declined.`, confirm: 'Decline', danger: true }))) return;
    if (await busy(b, () => patch(`/api/src/approvals/${a.id}`, { status }))) { toast(status === 'approved' ? 'Approved.' : 'Declined.'); await rerender(); refreshBadges(); }
  };
  return h('div', {}, head('Approvals', 'Clubs and events students want to run.'),
    h('section', { class: 'panel' }, list.length ? table(['Request', 'Type', 'From', 'Status', ''], list.map((a) => h('tr', {},
      h('td', {}, h('div', { class: 'cell-title' }, a.title), h('div', { class: 'cell-sub' }, stamp(a.createdAt))),
      h('td', {}, a.isEvent ? 'Event' : 'Club'), h('td', {}, a.requester),
      h('td', {}, pill(a.status[0].toUpperCase() + a.status.slice(1), tone[a.status])),
      h('td', {}, h('div', { class: 'actions' },
        a.status !== 'approved' ? btn('Approve', '', (b) => decide(b, a, 'approved')) : null,
        a.status !== 'rejected' ? btn('Decline', 'ghost danger', (b) => decide(b, a, 'rejected')) : null))))) : emptyState('No requests', 'Club and event requests from students show up here.')));
}
