import { createSign } from 'node:crypto';
import type { App } from '../app.ts';
import { isConfigured, load, runtimeConfig } from './service.ts';
import { defById } from './catalog.ts';
import { sendSmtp } from './smtp.ts';

/** Thrown with a message that is safe to show an admin (never contains keys). */
export class ProviderError extends Error {}

const TIMEOUT_MS = 15000;
const DEFAULT_COUNTRY_CODE = process.env.DEFAULT_COUNTRY_CODE ?? '233';

function redact(text: string, cfg: Record<string, string>): string {
  let out = text;
  for (const v of Object.values(cfg)) if (v && v.length >= 6) out = out.split(v).join('•••');
  return out.slice(0, 300);
}

async function call(app: App, cfg: Record<string, string>, url: string, init: RequestInit): Promise<{ status: number; text: string; json: any }> {
  let res: Response;
  try {
    res = await app.fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (e) {
    throw new ProviderError(`Could not reach the provider: ${redact(e instanceof Error ? e.message : String(e), cfg)}`);
  }
  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { status: res.status, text, json };
}

const form = (o: Record<string, string>): string => new URLSearchParams(o).toString();
const basic = (u: string, p: string): string => `Basic ${Buffer.from(`${u}:${p}`).toString('base64')}`;

/** 024 123 4567 -> 233241234567 (digits only, international). */
export function normalizePhone(raw: string): string {
  let d = raw.replace(/[^\d+]/g, '');
  if (d.startsWith('+')) return d.slice(1);
  if (d.startsWith('00')) return d.slice(2);
  if (d.startsWith('0')) d = DEFAULT_COUNTRY_CODE + d.slice(1);
  return d;
}

function requireConfigured(app: App, id: string): Record<string, string> {
  const def = defById(id)!;
  if (!isConfigured(def, load(app, id))) throw new ProviderError(`${def.title} is not set up yet.`);
  return runtimeConfig(app, id);
}

// ---------------------------------------------------------------- e-mail

export async function sendEmail(app: App, to: string, subject: string, text: string): Promise<void> {
  const cfg = requireConfigured(app, 'email');
  const fromEmail = cfg.from_email!;
  const fromName = cfg.from_name || 'CampusOne';
  const from = `${fromName} <${fromEmail}>`;

  switch (cfg.provider) {
    case 'SMTP': {
      if (!cfg.smtp_host) throw new ProviderError('Enter the SMTP host.');
      try {
        await sendSmtp(
          { host: cfg.smtp_host, port: Number(cfg.smtp_port || 587), user: cfg.username || undefined, pass: cfg.password || undefined, fromEmail, fromName },
          to,
          subject,
          text,
        );
      } catch (e) {
        throw new ProviderError(redact(e instanceof Error ? e.message : String(e), cfg));
      }
      return;
    }
    case 'Resend': {
      const r = await call(app, cfg, 'https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${cfg.password}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to: [to], subject, text }),
      });
      if (r.status >= 300) throw new ProviderError(`Resend refused the message (${r.status}): ${redact(r.json?.message ?? r.text, cfg)}`);
      return;
    }
    case 'SendGrid': {
      const r = await call(app, cfg, 'https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: { Authorization: `Bearer ${cfg.password}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: fromEmail, name: fromName },
          subject,
          content: [{ type: 'text/plain', value: text }],
        }),
      });
      if (r.status >= 300) throw new ProviderError(`SendGrid refused the message (${r.status}): ${redact(r.text, cfg)}`);
      return;
    }
    case 'Mailgun': {
      if (!cfg.smtp_host) throw new ProviderError('For Mailgun, enter your sending domain in the SMTP host field.');
      const r = await call(app, cfg, `https://api.mailgun.net/v3/${encodeURIComponent(cfg.smtp_host)}/messages`, {
        method: 'POST',
        headers: { Authorization: basic('api', cfg.password!), 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form({ from, to, subject, text }),
      });
      if (r.status >= 300) throw new ProviderError(`Mailgun refused the message (${r.status}): ${redact(r.json?.message ?? r.text, cfg)}`);
      return;
    }
    default:
      throw new ProviderError(`E-mail provider "${cfg.provider}" is not supported.`);
  }
}

// ------------------------------------------------------------------- SMS

export async function sendSms(app: App, toRaw: string, message: string): Promise<void> {
  const cfg = requireConfigured(app, 'sms');
  const to = normalizePhone(toRaw);
  if (!/^\d{9,15}$/.test(to)) throw new ProviderError(`"${toRaw}" is not a valid phone number.`);
  const sender = cfg.sender_id!;
  const key = cfg.api_key!;

  switch (cfg.provider) {
    case 'Arkesel': {
      const r = await call(app, cfg, 'https://sms.arkesel.com/api/v2/sms/send', {
        method: 'POST',
        headers: { 'api-key': key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender, message, recipients: [to] }),
      });
      if (r.status >= 300 || (r.json && r.json.status && r.json.status !== 'success')) {
        throw new ProviderError(`Arkesel refused the SMS (${r.status}): ${redact(r.json?.message ?? r.text, cfg)}`);
      }
      return;
    }
    case 'mNotify': {
      const r = await call(app, cfg, `https://api.mnotify.com/api/sms/quick?key=${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient: [to], sender, message, is_schedule: false, schedule_date: '' }),
      });
      if (r.status >= 300 || (r.json && r.json.status && r.json.status !== 'success')) {
        throw new ProviderError(`mNotify refused the SMS (${r.status}): ${redact(r.json?.message ?? r.text, cfg)}`);
      }
      return;
    }
    case 'Hubtel': {
      const qs = form({ clientid: cfg.client_id ?? '', clientsecret: key, from: sender, to, content: message });
      const r = await call(app, cfg, `https://smsc.hubtel.com/v1/messages/send?${qs}`, { method: 'GET' });
      const bad = r.status >= 300 || (r.json && typeof r.json.Status === 'number' && r.json.Status !== 0);
      if (bad) throw new ProviderError(`Hubtel refused the SMS (${r.status}): ${redact(r.json?.Message ?? r.text, cfg)}`);
      return;
    }
    case 'Twilio': {
      const sid = cfg.client_id ?? '';
      const r = await call(app, cfg, `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`, {
        method: 'POST',
        headers: { Authorization: basic(sid, key), 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form({ To: `+${to}`, From: sender, Body: message }),
      });
      if (r.status >= 300) throw new ProviderError(`Twilio refused the SMS (${r.status}): ${redact(r.json?.message ?? r.text, cfg)}`);
      return;
    }
    case "Africa's Talking": {
      const r = await call(app, cfg, 'https://api.africastalking.com/version1/messaging', {
        method: 'POST',
        headers: { apiKey: key, Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form({ username: cfg.client_id ?? '', to: `+${to}`, message, from: sender }),
      });
      const status = r.json?.SMSMessageData?.Recipients?.[0]?.status;
      if (r.status >= 300 || (status && status !== 'Success')) {
        throw new ProviderError(`Africa's Talking refused the SMS (${r.status}): ${redact(String(status ?? r.text), cfg)}`);
      }
      return;
    }
    default:
      throw new ProviderError(`SMS provider "${cfg.provider}" is not supported.`);
  }
}

// -------------------------------------------------------------------- AI

export async function aiComplete(app: App, prompt: string, system?: string): Promise<string> {
  const cfg = requireConfigured(app, 'ai');
  const key = cfg.api_key!;
  const model = cfg.model!;

  if (cfg.provider === 'Anthropic (Claude)') {
    const r = await call(app, cfg, 'https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, max_tokens: 1024, ...(system ? { system } : {}), messages: [{ role: 'user', content: prompt }] }),
    });
    if (r.status >= 300) throw new ProviderError(`The AI provider refused the request (${r.status}): ${redact(r.json?.error?.message ?? r.text, cfg)}`);
    const text = r.json?.content?.find((c: any) => c.type === 'text')?.text;
    if (typeof text !== 'string') throw new ProviderError('The AI provider returned an unexpected answer.');
    return text;
  }

  if (cfg.provider === 'Google Gemini') {
    const r = await call(app, cfg, `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
      }),
    });
    if (r.status >= 300) throw new ProviderError(`The AI provider refused the request (${r.status}): ${redact(r.json?.error?.message ?? r.text, cfg)}`);
    const text = r.json?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== 'string') throw new ProviderError('The AI provider returned an unexpected answer.');
    return text;
  }

  // OpenAI and OpenAI-compatible servers.
  const base = cfg.provider === 'OpenAI' ? 'https://api.openai.com/v1' : (cfg.base_url ?? '').replace(/\/+$/, '');
  if (!base) throw new ProviderError('Enter the base URL for your custom AI provider.');
  const r = await call(app, cfg, `${base}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [...(system ? [{ role: 'system', content: system }] : []), { role: 'user', content: prompt }],
    }),
  });
  if (r.status >= 300) throw new ProviderError(`The AI provider refused the request (${r.status}): ${redact(r.json?.error?.message ?? r.text, cfg)}`);
  const text = r.json?.choices?.[0]?.message?.content;
  if (typeof text !== 'string') throw new ProviderError('The AI provider returned an unexpected answer.');
  return text;
}

// ------------------------------------------------------------------ push

let tokenCache: { key: string; token: string; exp: number } | null = null;

async function firebaseToken(app: App, cfg: Record<string, string>): Promise<string> {
  let account: { client_email?: string; private_key?: string; token_uri?: string };
  try {
    account = JSON.parse(cfg.service_account ?? '');
  } catch {
    throw new ProviderError('The service account is not valid JSON. Paste the whole key file.');
  }
  if (!account.client_email || !account.private_key) throw new ProviderError('The service account JSON is missing client_email or private_key.');
  const cacheKey = `${account.client_email}:${cfg.project_id}`;
  if (tokenCache && tokenCache.key === cacheKey && tokenCache.exp > Date.now() + 60_000) return tokenCache.token;

  const tokenUri = account.token_uri ?? 'https://oauth2.googleapis.com/token';
  const iat = Math.floor(Date.now() / 1000);
  const enc = (o: unknown): string => Buffer.from(JSON.stringify(o)).toString('base64url');
  const unsigned = `${enc({ alg: 'RS256', typ: 'JWT' })}.${enc({
    iss: account.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: tokenUri,
    iat,
    exp: iat + 3600,
  })}`;
  let signature: string;
  try {
    signature = createSign('RSA-SHA256').update(unsigned).sign(account.private_key, 'base64url');
  } catch {
    throw new ProviderError('The private key in the service account could not be read.');
  }
  const r = await call(app, cfg, tokenUri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${signature}` }),
  });
  if (r.status >= 300 || !r.json?.access_token) throw new ProviderError(`Firebase sign-in failed (${r.status}): ${redact(r.json?.error_description ?? r.text, cfg)}`);
  tokenCache = { key: cacheKey, token: r.json.access_token, exp: Date.now() + Number(r.json.expires_in ?? 3000) * 1000 };
  return tokenCache.token;
}

export async function pushAuthCheck(app: App): Promise<string> {
  const cfg = requireConfigured(app, 'push');
  await firebaseToken(app, cfg);
  return `Signed in to Firebase project "${cfg.project_id}".`;
}

export async function sendPush(app: App, topic: string, title: string, body: string): Promise<void> {
  const cfg = requireConfigured(app, 'push');
  if (!/^[a-zA-Z0-9-_.~%]+$/.test(topic)) throw new ProviderError('Invalid push topic.');
  const token = await firebaseToken(app, cfg);
  const r = await call(app, cfg, `https://fcm.googleapis.com/v1/projects/${encodeURIComponent(cfg.project_id!)}/messages:send`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: { topic, notification: { title, body } } }),
  });
  if (r.status >= 300) throw new ProviderError(`Firebase refused the notification (${r.status}): ${redact(r.json?.error?.message ?? r.text, cfg)}`);
}

// ------------------------------------------------------------------ test

export async function testIntegration(app: App, id: string, input: Record<string, unknown>): Promise<{ ok: boolean; message: string }> {
  const def = defById(id);
  if (!def) return { ok: false, message: 'Unknown integration.' };
  if (!isConfigured(def, load(app, id))) return { ok: false, message: 'Save every required field first, then test.' };
  try {
    if (id === 'email') {
      const to = typeof input.to === 'string' ? input.to.trim() : '';
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) return { ok: false, message: 'Enter an e-mail address to send the test to.' };
      await sendEmail(app, to, 'CampusOne test message', 'This is a test from the CampusOne admin app. E-mail is working.');
      return { ok: true, message: `Test e-mail sent to ${to}. Check the inbox (and spam).` };
    }
    if (id === 'sms') {
      const to = typeof input.to === 'string' ? input.to.trim() : '';
      if (!to) return { ok: false, message: 'Enter a phone number to send the test to.' };
      await sendSms(app, to, 'CampusOne test: SMS is working.');
      return { ok: true, message: `Test SMS sent to ${to}.` };
    }
    if (id === 'ai') {
      const answer = await aiComplete(app, 'Reply with the single word: ready');
      return { ok: true, message: `The model answered: "${answer.trim().slice(0, 80)}".` };
    }
    if (id === 'push') return { ok: true, message: await pushAuthCheck(app) };
    return { ok: true, message: `${def.title} settings are complete. This service has no live test yet.` };
  } catch (e) {
    if (e instanceof ProviderError) return { ok: false, message: e.message };
    throw e;
  }
}

