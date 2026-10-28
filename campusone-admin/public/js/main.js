import { get, post, setUnauthenticatedHandler } from './api.js';
import { h, clear, toast, formDialog } from './ui.js';

const app = document.getElementById('app');
let user = null;

const PLATFORM = [
  ['#/', 'Dashboard', 'switchboard'],
  ['#/integrations', 'Integrations'],
  ['#/listings', 'Listings', 'listings'],
  ['#/campus-content', 'Campus content'],
  ['#/community-reports', 'Community reports', 'communityReports'],
  ['#/people', 'People'],
  ['#/system', 'System'],
  ['#/branding', 'App branding'],
];
const STUDENT_AFFAIRS = [
  ['#/src', 'Overview'],
  ['#/academics', 'School', 'materials'],
  ['#/announce', 'Announce'],
  ['#/students', 'Students', 'enquiries'],
  ['#/approvals', 'Approvals', 'approvals'],
];

const adminViews = () => import('./views-admin.js');
const srcViews = () => import('./views-src.js');

const ROUTES = [
  { re: /^\/$/, roles: ['super_admin'], title: 'Super Admin dashboard', load: async () => (await adminViews()).switchboard },
  { re: /^\/integrations$/, roles: ['super_admin'], title: 'Integrations', load: async () => (await adminViews()).integrations },
  { re: /^\/integrations\/([a-z]+)$/, roles: ['super_admin'], title: 'Integration', load: async () => (await adminViews()).integrationDetail },
  { re: /^\/listings$/, roles: ['super_admin'], title: 'Listings', load: async () => (await adminViews()).listings },
  { re: /^\/campus-content$/, roles: ['super_admin'], title: 'Campus content', load: async () => (await adminViews()).campusContent },
  { re: /^\/community-reports$/, roles: ['super_admin', 'src_admin'], title: 'Community reports', load: async () => (await adminViews()).communityReports },
  { re: /^\/people$/, roles: ['super_admin'], title: 'People', load: async () => (await adminViews()).people },
  { re: /^\/system$/, roles: ['super_admin'], title: 'System', load: async () => (await adminViews()).system },
  { re: /^\/branding$/, roles: ['super_admin'], title: 'App branding', load: async () => (await adminViews()).branding },
  { re: /^\/src$/, roles: ['super_admin', 'src_admin'], title: 'SRC Office', load: async () => (await srcViews()).overview },
  { re: /^\/academics$/, roles: ['super_admin', 'src_admin'], title: 'School', load: async () => (await srcViews()).academics },
  { re: /^\/announce$/, roles: ['super_admin', 'src_admin'], title: 'Announce', load: async () => (await srcViews()).announce },
  { re: /^\/students$/, roles: ['super_admin', 'src_admin'], title: 'Students', load: async () => (await srcViews()).students },
  { re: /^\/approvals$/, roles: ['super_admin', 'src_admin'], title: 'Approvals', load: async () => (await srcViews()).approvals },
];

// ------------------------------------------------------------------ login

function brand() {
  return h('div', { class: 'brand' },
    h('div', { class: 'brand-mark', 'aria-hidden': 'true' }, 'C1'),
    h('div', {}, h('div', { class: 'brand-name' }, 'CampusOne'), h('div', { class: 'brand-sub' }, 'Admin')));
}

function showLogin(notice = '') {
  user = null;
  const error = h('div', { class: 'banner bad', role: 'alert', hidden: !notice }, notice);
  const email = h('input', { id: 'email', type: 'email', autocomplete: 'username', required: true });
  const pass = h('input', { id: 'password', type: 'password', autocomplete: 'current-password', required: true });
  const submit = h('button', { class: 'btn', type: 'submit', style: 'width:100%' }, 'Sign in');
  const form = h('form', { novalidate: true },
    error,
    h('div', { class: 'field' }, h('label', { for: 'email' }, 'E-mail'), email),
    h('div', { class: 'field' }, h('label', { for: 'password' }, 'Password'), pass),
    submit);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    error.hidden = true;
    submit.disabled = true;
    try {
      const res = await post('/api/auth/login', { email: email.value, password: pass.value });
      if (res.user.role === 'student') {
        await post('/api/auth/logout');
        throw new Error('This app is for SRC and platform admins. Students use the CampusOne mobile app.');
      }
      user = res.user;
      await start();
    } catch (err) {
      error.textContent = err.message;
      error.hidden = false;
      pass.value = '';
      pass.focus();
    } finally {
      submit.disabled = false;
    }
  });
  clear(app).append(h('main', { class: 'login' }, h('div', { class: 'login-card' },
    brand(),
    h('h1', {}, 'Sign in'),
    h('p', { class: 'muted', style: 'margin-bottom:18px' }, 'SRC and platform admins only.'),
    form)));
  document.title = 'Sign in · CampusOne admin';
  email.focus();
}

setUnauthenticatedHandler(() => { if (user) showLogin('Your session ended. Sign in again.'); });

// -------------------------------------------------------------- password

async function forcePasswordChange() {
  for (;;) {
    const v = await formDialog({
      title: 'Choose your own password',
      intro: 'You signed in with a one-time password. Pick a new one with at least 10 characters before you continue.',
      locked: true,
      cancelable: false,
      submit: 'Change password',
      fields: [
        { name: 'current', label: 'One-time password', type: 'password', required: true, autocomplete: 'current-password' },
        { name: 'next', label: 'New password', type: 'password', required: true, autocomplete: 'new-password' },
        { name: 'again', label: 'New password again', type: 'password', required: true, autocomplete: 'new-password' },
      ],
      validate: (x) => (x.next !== x.again ? 'The two new passwords do not match.' : x.next.length < 10 ? 'Use at least 10 characters.' : ''),
    });
    if (!v) continue;
    try {
      await post('/api/auth/change-password', { current: v.current, next: v.next });
      user.mustChangePassword = false;
      toast('Password changed.');
      return;
    } catch (e) {
      toast(e.message, 'bad');
    }
  }
}

// ------------------------------------------------------------------ shell

const badges = {};
let navEls = {};

export async function refreshBadges() {
  try {
    const src = await get('/api/src/overview');
    badges.enquiries = src.openEnquiries;
    badges.materials = src.pendingMaterials;
    badges.approvals = src.pendingApprovals;
    if (user.role === 'super_admin') badges.listings = (await get('/api/admin/overview')).pendingListings;
  } catch { /* badges are a nicety */ }
  for (const [key, el] of Object.entries(navEls)) {
    const n = badges[key] || 0;
    el.textContent = n > 99 ? '99+' : String(n);
    el.hidden = n === 0;
  }
}

function navGroup(title, items) {
  return h('nav', { class: 'nav-group', 'aria-label': title },
    h('div', { class: 'nav-title' }, title),
    items.map(([href, label, badgeKey]) => {
      const count = h('span', { class: 'count', hidden: true });
      if (badgeKey) navEls[badgeKey] = count;
      return h('a', { class: 'nav-link', href, dataset: { href } }, label, badgeKey ? count : null);
    }));
}

function buildShell() {
  navEls = {};
  const isSuper = user.role === 'super_admin';
  const side = h('aside', { class: 'side', id: 'side' },
    brand(),
    isSuper ? navGroup('Super Admin', PLATFORM) : null,
    navGroup('SRC Office', STUDENT_AFFAIRS),
    h('div', { class: 'side-foot' },
      h('div', { class: 'who' }, h('b', {}, user.name), h('span', {}, isSuper ? 'Super admin' : 'SRC admin')),
      h('button', { class: 'btn ghost sm', type: 'button', onclick: async () => {
        try { await post('/api/auth/logout'); } catch { /* signing out anyway */ }
        showLogin();
      } }, 'Sign out')));
  const scrim = h('div', { class: 'scrim', hidden: true });
  const closeDrawer = () => { side.classList.remove('open'); scrim.hidden = true; };
  scrim.addEventListener('click', closeDrawer);
  side.addEventListener('click', (e) => { if (e.target.closest('a')) closeDrawer(); });
  const topbar = h('header', { class: 'topbar' },
    h('button', { class: 'btn', type: 'button', 'aria-controls': 'side', 'aria-label': 'Open menu', onclick: () => { side.classList.add('open'); scrim.hidden = false; } }, 'Menu'),
    h('div', { class: 'brand-name' }, 'CampusOne admin'));
  const main = h('main', { class: 'main', id: 'main', tabindex: '-1' });
  clear(app).append(h('div', { class: 'shell' }, side, h('div', {}, topbar, main)), scrim);
  return main;
}

let mainEl = null;
let renderToken = 0;

async function render() {
  if (!user || !mainEl) return;
  const path = (location.hash.replace(/^#/, '') || '/').split('?')[0];
  const route = ROUTES.find((r) => r.re.test(path));
  const home = user.role === 'super_admin' ? '#/' : '#/src';
  if (!route) { location.replace(home); return; }
  if (!route.roles.includes(user.role)) { location.replace(home); return; }

  for (const a of document.querySelectorAll('.nav-link')) {
    const target = a.dataset.href.replace(/^#/, '');
    const on = target === path || (target !== '/' && path.startsWith(`${target}/`));
    if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  }
  document.title = `${route.title} · CampusOne admin`;
  const token = ++renderToken;
  clear(mainEl).append(h('div', { class: 'skeleton', 'aria-label': 'Loading' }));
  try {
    const view = await route.load();
    const params = route.re.exec(path).slice(1);
    const node = await view({ user, params, refreshBadges, rerender: render });
    if (token !== renderToken) return;
    clear(mainEl).append(node);
    mainEl.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  } catch (e) {
    if (token !== renderToken) return;
    clear(mainEl).append(h('div', { class: 'panel' }, h('div', { class: 'panel-body' },
      h('h2', {}, 'This page did not load'),
      h('p', { class: 'muted', style: 'margin:6px 0 14px' }, e.message || 'Unknown error.'),
      h('button', { class: 'btn', type: 'button', onclick: render }, 'Try again'))));
  }
  refreshBadges();
}

async function start() {
  mainEl = buildShell();
  if (user.mustChangePassword) await forcePasswordChange();
  if (!location.hash) location.replace(user.role === 'super_admin' ? '#/' : '#/src');
  await render();
}

window.addEventListener('hashchange', render);

(async () => {
  try {
    const me = await get('/api/auth/me');
    if (me.user.role === 'student') { await post('/api/auth/logout'); showLogin(); return; }
    user = me.user;
    await start();
  } catch {
    showLogin();
  }
})();
