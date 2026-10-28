import type { App } from '../app.ts';
import type { UserRow } from '../db.ts';
import { isLive } from './service.ts';
import { sendEmail, sendPush, sendSms } from './providers.ts';

export type ChannelId = 'inApp' | 'push' | 'email' | 'sms';
export const CHANNELS: ChannelId[] = ['inApp', 'push', 'email', 'sms'];
const INTEGRATION_FOR: Record<ChannelId, string | null> = { inApp: null, push: 'push', email: 'email', sms: 'sms' };
export const AUDIENCES = ['All students', 'Level 100', 'Level 200', 'Level 300', 'Level 400', 'Class reps'];

const MAX_RECIPIENTS = 2000;
const CONCURRENCY = 5;

export function channelAvailability(app: App): Record<ChannelId, boolean> {
  const out = {} as Record<ChannelId, boolean>;
  for (const c of CHANNELS) {
    const id = INTEGRATION_FOR[c];
    out[c] = id === null || isLive(app, id);
  }
  return out;
}

export function audienceMatches(audience: string, user: Pick<UserRow, 'level' | 'role'>): boolean {
  if (audience === 'All students') return true;
  if (audience.startsWith('Level ')) return user.level === audience;
  return false;
}

function topicFor(audience: string): string {
  if (audience === 'All students') return 'all';
  if (audience === 'Class reps') return 'class-reps';
  return audience.toLowerCase().replace(/\s+/g, '-');
}

interface Result {
  mode: 'sent' | 'dry_run';
  recipients: number;
  sent: number;
  failed: number;
  error?: string;
}

async function pool<T>(items: T[], work: (item: T) => Promise<void>): Promise<void> {
  let i = 0;
  const runners = Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
    while (i < items.length) {
      const item = items[i++]!;
      await work(item);
    }
  });
  await Promise.all(runners);
}

/**
 * Sends an announcement over the chosen channels and stores the outcome.
 * While ALLOW_LIVE_SENDING is false this is a dry run: recipients are counted, nothing is sent.
 */
export async function dispatchAnnouncement(app: App, id: string, title: string, body: string, audience: string, channels: ChannelId[]): Promise<void> {
  const results: Record<string, Result> = {};
  const live = app.config.allowLiveSending;

  const students = app.db.all<UserRow>("SELECT * FROM users WHERE role = 'student' AND suspended = 0");
  const targets = students.filter((u) => audienceMatches(audience, u));
  const reps = app.db.all<{ phone: string }>('SELECT phone FROM class_reps');

  for (const channel of channels) {
    if (channel === 'inApp') continue;
    try {
      if (channel === 'push') {
        const r: Result = { mode: live ? 'sent' : 'dry_run', recipients: 1, sent: 0, failed: 0 };
        if (live) {
          await sendPush(app, topicFor(audience), title, body.slice(0, 200));
          r.sent = 1;
        }
        results.push = r;
      } else if (channel === 'email') {
        const emails = (audience === 'Class reps' ? [] : targets.map((u) => u.email)).slice(0, MAX_RECIPIENTS);
        const r: Result = { mode: live ? 'sent' : 'dry_run', recipients: emails.length, sent: 0, failed: 0 };
        if (live) {
          await pool(emails, async (to) => {
            try {
              await sendEmail(app, to, title, body);
              r.sent++;
            } catch (e) {
              r.failed++;
              r.error ??= e instanceof Error ? e.message : String(e);
            }
          });
        }
        results.email = r;
      } else if (channel === 'sms') {
        const phones = (audience === 'Class reps' ? reps.map((x) => x.phone) : targets.map((u) => u.phone)).filter(Boolean).slice(0, MAX_RECIPIENTS);
        const r: Result = { mode: live ? 'sent' : 'dry_run', recipients: phones.length, sent: 0, failed: 0 };
        if (live) {
          await pool(phones, async (to) => {
            try {
              await sendSms(app, to, `${title}: ${body}`.slice(0, 300));
              r.sent++;
            } catch (e) {
              r.failed++;
              r.error ??= e instanceof Error ? e.message : String(e);
            }
          });
        }
        results.sms = r;
      }
    } catch (e) {
      results[channel] = { mode: 'sent', recipients: 0, sent: 0, failed: 1, error: e instanceof Error ? e.message : String(e) };
    }
  }
  app.db.run('UPDATE announcements SET dispatch_json = ? WHERE id = ?', JSON.stringify(results), id);
}
