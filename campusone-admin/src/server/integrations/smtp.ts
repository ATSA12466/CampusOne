import net from 'node:net';
import tls from 'node:tls';
import type { Socket } from 'node:net';

export interface SmtpOptions {
  host: string;
  port: number;
  user?: string;
  pass?: string;
  fromEmail: string;
  fromName?: string;
  timeoutMs?: number;
  /** Test hook: skip certificate checks. Never set in production code paths. */
  insecureTls?: boolean;
}

const clean = (s: string): string => s.replace(/[\r\n]+/g, ' ').trim();
const b64 = (s: string): string => Buffer.from(s, 'utf8').toString('base64');
const encodeHeader = (s: string): string => (/^[\x20-\x7e]*$/.test(s) ? s : `=?UTF-8?B?${b64(s)}?=`);

interface Reader {
  reply(): Promise<{ code: number; text: string }>;
}

function reader(sock: Socket): Reader {
  let buf = '';
  const lines: string[] = [];
  let wake: (() => void) | null = null;
  let failure: Error | null = null;
  sock.on('data', (d: Buffer) => {
    buf += d.toString('utf8');
    let i: number;
    while ((i = buf.indexOf('\r\n')) >= 0) {
      lines.push(buf.slice(0, i));
      buf = buf.slice(i + 2);
    }
    wake?.();
  });
  sock.on('error', (e) => {
    failure = e;
    wake?.();
  });
  sock.on('close', () => {
    failure ??= new Error('The mail server closed the connection.');
    wake?.();
  });
  const next = async (): Promise<string> => {
    while (lines.length === 0) {
      if (failure) throw failure;
      await new Promise<void>((r) => {
        wake = r;
      });
      wake = null;
    }
    return lines.shift()!;
  };
  return {
    async reply() {
      const all: string[] = [];
      for (;;) {
        const line = await next();
        all.push(line);
        if (/^\d{3}( |$)/.test(line)) return { code: Number(line.slice(0, 3)), text: all.join('\n') };
        if (!/^\d{3}-/.test(line)) return { code: 0, text: all.join('\n') };
      }
    },
  };
}

function buildMessage(opts: SmtpOptions, to: string, subject: string, text: string): string {
  const from = opts.fromName ? `${encodeHeader(clean(opts.fromName))} <${clean(opts.fromEmail)}>` : clean(opts.fromEmail);
  const body = Buffer.from(text, 'utf8').toString('base64').replace(/(.{76})/g, '$1\r\n');
  const domain = clean(opts.fromEmail).split('@')[1] ?? 'localhost';
  return [
    `From: ${from}`,
    `To: ${clean(to)}`,
    `Subject: ${encodeHeader(clean(subject))}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${Date.now().toString(36)}.${Math.random().toString(36).slice(2)}@${domain}>`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: base64',
    '',
    body,
  ].join('\r\n');
}

/** Minimal SMTP client: implicit TLS on 465, STARTTLS when offered, AUTH PLAIN/LOGIN. */
export async function sendSmtp(opts: SmtpOptions, to: string, subject: string, text: string): Promise<void> {
  const timeout = opts.timeoutMs ?? 15000;
  let sock: Socket = await new Promise<Socket>((resolve, reject) => {
    const s =
      opts.port === 465
        ? tls.connect({ host: opts.host, port: opts.port, servername: opts.host, rejectUnauthorized: !opts.insecureTls })
        : net.connect({ host: opts.host, port: opts.port });
    s.setTimeout(timeout, () => s.destroy(new Error('The mail server took too long to answer.')));
    s.once(opts.port === 465 ? 'secureConnect' : 'connect', () => resolve(s));
    s.once('error', reject);
  });
  let rd = reader(sock);

  const send = (line: string): void => {
    sock.write(`${line}\r\n`);
  };
  const expect = async (codes: number[], what: string): Promise<string> => {
    const r = await rd.reply();
    if (!codes.includes(r.code)) throw new Error(`Mail server refused ${what}: ${r.text.split('\n').pop()}`);
    return r.text;
  };

  try {
    await expect([220], 'the connection');
    send('EHLO campusone');
    let caps = await expect([250], 'EHLO');

    if (opts.port !== 465 && /STARTTLS/i.test(caps)) {
      send('STARTTLS');
      await expect([220], 'STARTTLS');
      sock.removeAllListeners('data');
      sock = tls.connect({ socket: sock, servername: opts.host, rejectUnauthorized: !opts.insecureTls });
      sock.setTimeout(timeout, () => sock.destroy(new Error('The mail server took too long to answer.')));
      await new Promise<void>((resolve, reject) => {
        sock.once('secureConnect', () => resolve());
        sock.once('error', reject);
      });
      rd = reader(sock);
      send('EHLO campusone');
      caps = await expect([250], 'EHLO after STARTTLS');
    }

    if (opts.user && opts.pass) {
      if (!/AUTH/i.test(caps)) throw new Error('This mail server does not offer sign-in, but a username is set.');
      if (/AUTH[^\n]*PLAIN/i.test(caps)) {
        send(`AUTH PLAIN ${b64(`\0${opts.user}\0${opts.pass}`)}`);
        await expect([235], 'the username or password');
      } else {
        send('AUTH LOGIN');
        await expect([334], 'AUTH LOGIN');
        send(b64(opts.user));
        await expect([334], 'the username');
        send(b64(opts.pass));
        await expect([235], 'the password');
      }
    }

    send(`MAIL FROM:<${clean(opts.fromEmail)}>`);
    await expect([250], 'the sender address');
    send(`RCPT TO:<${clean(to)}>`);
    await expect([250, 251], 'the recipient address');
    send('DATA');
    await expect([354], 'DATA');
    const message = buildMessage(opts, to, subject, text).replace(/^\./gm, '..');
    sock.write(`${message}\r\n.\r\n`);
    await expect([250], 'the message');
    send('QUIT');
    await expect([221], 'QUIT');
  } finally {
    sock.destroy();
  }
}
