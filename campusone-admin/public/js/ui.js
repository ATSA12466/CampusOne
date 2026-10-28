// Small DOM helpers. Text always goes in as text nodes, never as HTML.
import { post } from './api.js';

export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props || {})) {
    if (value === undefined || value === null || value === false) continue;
    if (key === 'class') el.className = value;
    else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key === 'dataset') Object.assign(el.dataset, value);
    else if (key === 'value') el.value = value;
    else if (key === 'checked' || key === 'disabled' || key === 'selected' || key === 'hidden') el[key] = !!value;
    else el.setAttribute(key, value === true ? '' : String(value));
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

/** Reusable same-origin uploader for image, video, audio and document fields. */
export function mediaField({ id, label, value = '', accept = 'image/*,video/*,audio/*,.pdf,.doc,.docx,.ppt,.pptx,.txt', max = 1000 }) {
  const input = h('input', { id, type: 'url', value, maxlength: max, placeholder: 'Paste a URL or upload a file' });
  const picker = h('input', { type: 'file', accept, hidden: true });
  const upload = h('button', { class: 'btn ghost sm', type: 'button' }, 'Choose file');
  upload.addEventListener('click', () => picker.click());
  picker.addEventListener('change', async () => {
    const file = picker.files?.[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) { toast('Choose a file no larger than 25 MB.', 'bad'); picker.value = ''; return; }
    upload.disabled = true;
    upload.textContent = 'Uploading…';
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      let binary = '';
      for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      const result = await post('/api/files/upload', { fileName: file.name, mimeType: file.type, data: btoa(binary) });
      input.value = result.file.url;
      toast('File uploaded. Save this form to publish it.');
    } catch (error) {
      toast(error.message || 'Upload failed.', 'bad');
    } finally {
      upload.disabled = false;
      upload.textContent = 'Choose file';
      picker.value = '';
    }
  });
  return {
    input,
    element: h('div', { class: 'field' }, h('label', { for: id }, label), h('div', { class: 'toolbar', style: 'margin:0' }, input, upload, picker)),
  };
}

export const clear = (el) => { el.replaceChildren(); return el; };

export function toast(message, kind = 'ok') {
  const box = document.getElementById('toasts');
  const t = h('div', { class: `toast ${kind === 'bad' ? 'bad' : ''}`, role: kind === 'bad' ? 'alert' : 'status' }, message);
  box.append(t);
  setTimeout(() => t.remove(), kind === 'bad' ? 7000 : 4000);
}

const STAMP = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
export function stamp(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : STAMP.format(d);
}

export const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export function pill(label, tone = 'neutral') {
  return h('span', { class: `pill ${tone}` }, label);
}

export function emptyState(title, hint) {
  return h('div', { class: 'empty' }, h('b', {}, title), hint ? h('span', {}, hint) : null);
}

export function switchControl({ checked, label, onChange, danger = false, disabled = false }) {
  const btn = h('button', {
    type: 'button',
    role: 'switch',
    class: `switch ${danger ? 'warn' : ''}`,
    'aria-checked': String(!!checked),
    'aria-label': label,
    disabled,
  });
  btn.addEventListener('click', async () => {
    if (btn.disabled) return;
    const next = btn.getAttribute('aria-checked') !== 'true';
    btn.disabled = true;
    try {
      const ok = await onChange(next);
      if (ok !== false) btn.setAttribute('aria-checked', String(next));
    } finally {
      btn.disabled = false;
    }
  });
  return btn;
}

export function segmented(options, current, onPick) {
  const wrap = h('div', { class: 'seg', role: 'group' });
  for (const [value, label] of options) {
    const b = h('button', { type: 'button', 'aria-pressed': String(value === current) }, label);
    b.addEventListener('click', () => onPick(value));
    wrap.append(b);
  }
  return wrap;
}

/** Runs an async action on a button: disables it, shows errors as toasts. */
export async function busy(button, fn) {
  if (button) button.disabled = true;
  try {
    return await fn();
  } catch (e) {
    toast(e.message || 'Something went wrong.', 'bad');
    return undefined;
  } finally {
    if (button) button.disabled = false;
  }
}

// ---------------------------------------------------------------- dialogs

function openDialog(build) {
  return new Promise((resolve) => {
    const dlg = h('dialog');
    const close = (value) => {
      dlg.close();
      dlg.remove();
      resolve(value);
    };
    dlg.addEventListener('cancel', (e) => {
      e.preventDefault();
      if (dlg.dataset.locked !== 'true') close(null);
    });
    build(dlg, close);
    document.body.append(dlg);
    dlg.showModal();
  });
}

export function confirmDialog({ title, message, confirm = 'Confirm', danger = false }) {
  return openDialog((dlg, close) => {
    dlg.append(
      h('div', { class: 'dlg-head' }, h('h2', {}, title)),
      h('div', { class: 'dlg-body' }, h('p', {}, message)),
      h('div', { class: 'dlg-foot' },
        h('button', { class: 'btn ghost', type: 'button', onclick: () => close(false) }, 'Cancel'),
        h('button', { class: `btn ${danger ? 'danger' : ''}`, type: 'button', onclick: () => close(true), autofocus: true }, confirm)),
    );
  }).then((v) => v === true);
}

/**
 * fields: [{ name, label, type: text|email|password|number|textarea|select|checkbox, required, options: [[value,label]], hint, value }]
 * Resolves with an object of values, or null when cancelled.
 */
export function formDialog({ title, intro, fields, submit = 'Save', locked = false, cancelable = true, validate }) {
  return openDialog((dlg, close) => {
    if (locked) dlg.dataset.locked = 'true';
    const form = h('form', { novalidate: true });
    const inputs = {};
    const errorBox = h('div', { class: 'banner bad', hidden: true, role: 'alert' });
    for (const f of fields) {
      const id = `f-${f.name}`;
      let input;
      if (f.type === 'media') {
        const field = mediaField({ id, label: f.label + (f.required ? ' *' : ''), value: f.value ?? '', accept: f.accept, max: f.max });
        inputs[f.name] = field.input;
        form.append(field.element);
        continue;
      }
      if (f.type === 'textarea') input = h('textarea', { id, rows: f.rows || 4, maxlength: f.max }, f.value || '');
      else if (f.type === 'select') {
        input = h('select', { id }, f.options.map(([v, l]) => h('option', { value: v, selected: v === f.value }, l)));
      } else if (f.type === 'checkbox') input = h('input', { id, type: 'checkbox', checked: !!f.value });
      else input = h('input', { id, type: f.type || 'text', value: f.value ?? '', autocomplete: f.autocomplete || 'off', maxlength: f.max, placeholder: f.placeholder });
      inputs[f.name] = input;
      form.append(h('div', { class: 'field' },
        h('label', { for: id }, f.label + (f.required ? ' *' : '')),
        input,
        f.hint ? h('span', { class: 'hint' }, f.hint) : null));
    }
    const doSubmit = async () => {
      const values = {};
      for (const f of fields) {
        const el = inputs[f.name];
        const v = f.type === 'checkbox' ? el.checked : el.value.trim();
        if (f.required && (v === '' || v === false)) {
          errorBox.textContent = `${f.label} is required.`;
          errorBox.hidden = false;
          el.focus();
          return;
        }
        values[f.name] = f.type === 'number' && v !== '' ? Number(v) : v;
      }
      if (validate) {
        const problem = validate(values);
        if (problem) {
          errorBox.textContent = problem;
          errorBox.hidden = false;
          return;
        }
      }
      close(values);
    };
    form.addEventListener('submit', (e) => { e.preventDefault(); doSubmit(); });
    dlg.append(
      h('div', { class: 'dlg-head' }, h('h2', {}, title), intro ? h('p', { class: 'muted small' }, intro) : null),
      h('div', { class: 'dlg-body' }, errorBox, form),
      h('div', { class: 'dlg-foot' },
        cancelable ? h('button', { class: 'btn ghost', type: 'button', onclick: () => close(null) }, 'Cancel') : null,
        h('button', { class: 'btn', type: 'button', onclick: doSubmit }, submit)),
    );
    setTimeout(() => form.querySelector('input,select,textarea')?.focus(), 0);
  });
}

export function infoDialog({ title, body, copy }) {
  return openDialog((dlg, close) => {
    dlg.append(
      h('div', { class: 'dlg-head' }, h('h2', {}, title)),
      h('div', { class: 'dlg-body' }, body),
      h('div', { class: 'dlg-foot' },
        copy ? h('button', { class: 'btn ghost', type: 'button', onclick: async (e) => {
          try { await navigator.clipboard.writeText(copy); e.target.textContent = 'Copied'; } catch { e.target.textContent = 'Copy failed'; }
        } }, 'Copy') : null,
        h('button', { class: 'btn', type: 'button', onclick: () => close(true) }, 'Done')),
    );
  });
}
