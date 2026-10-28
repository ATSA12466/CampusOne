import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import { Vault, hashPassword, verifyPassword } from '../src/server/crypto.ts';
import { sendSmtp } from '../src/server/integrations/smtp.ts';
import { normalizePhone } from '../src/server/integrations/providers.ts';

describe('crypto', () => {
  const v = new Vault('a-long-enough-secret-for-tests-123456');

  test('passwords hash and verify', () => {
    const h = hashPassword('correct horse');
    assert.ok(verifyPassword('correct horse', h));
    assert.ok(!verifyPassword('wrong horse', h));
    assert.notEqual(h, hashPassword('correct horse'), 'salted');
  });

  test('secrets round-trip and tampering is detected', () => {
    const blob = v.encrypt('sk-secret');
    assert.ok(!blob.includes('sk-secret'));
    assert.equal(v.decrypt(blob), 'sk-secret');
    const parts = blob.split('.');
    parts[3] = Buffer.from('tampered').toString('base64url');
    assert.throws(() => v.decrypt(parts.join('.')));
    assert.throws(() => new Vault('another-secret-another-secret-12345').decrypt(blob));
  });

  test('tokens expire and cannot be forged', () => {
    const t = v.signToken({ sub: 'u1' }, 60);
    assert.equal(v.verifyToken(t)?.sub, 'u1');
    assert.equal(v.verifyToken(t.slice(0, -2) + 'xx'), null);
    assert.equal(v.verifyToken(v.signToken({ sub: 'u1' }, -5)), null);
    assert.equal(new Vault('another-secret-another-secret-12345').verifyToken(t), null);
  });
});

describe('phone numbers', () => {
  test('Ghana numbers become international digits', () => {
    assert.equal(normalizePhone('024 123 4567'), '233241234567');
    assert.equal(normalizePhone('+233 24 123 4567'), '233241234567');
    assert.equal(normalizePhone('00233241234567'), '233241234567');
  });
});

describe('SMTP client', () => {
  /** A tiny mail server that records what it receives. */
  function mockServer(): Promise<{ port: number; log: string[]; close(): void }> {
    const log: string[] = [];
    const server = net.createServer((sock) => {
      let inData = false;
      let buf = '';
      sock.write('220 mock ready\r\n');
      sock.on('data', (d) => {
        buf += d.toString('utf8');
        let i: number;
        while ((i = buf.indexOf('\r\n')) >= 0) {
          const line = buf.slice(0, i);
          buf = buf.slice(i + 2);
          log.push(line);
          if (inData) {
            if (line === '.') {
              inData = false;
              sock.write('250 queued\r\n');
            }
            continue;
          }
          if (line.startsWith('EHLO')) sock.write('250-mock\r\n250 AUTH PLAIN\r\n');
          else if (line.startsWith('AUTH PLAIN')) sock.write(Buffer.from(line.slice(11), 'base64').toString('utf8') === '\0me\0pw' ? '235 ok\r\n' : '535 no\r\n');
          else if (line.startsWith('MAIL FROM') || line.startsWith('RCPT TO')) sock.write('250 ok\r\n');
          else if (line === 'DATA') {
            inData = true;
            sock.write('354 go\r\n');
          } else if (line === 'QUIT') sock.end('221 bye\r\n');
        }
      });
    });
    return new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const port = (server.address() as net.AddressInfo).port;
        resolve({ port, log, close: () => server.close() });
      });
    });
  }

  test('delivers a message with sign-in', async () => {
    const m = await mockServer();
    await sendSmtp({ host: '127.0.0.1', port: m.port, user: 'me', pass: 'pw', fromEmail: 'no-reply@campus.test', fromName: 'CampusOne' }, 'ama@test.local', 'Hello Ama', 'Line one\n.starts with a dot');
    m.close();
    const text = m.log.join('\n');
    assert.match(text, /MAIL FROM:<no-reply@campus\.test>/);
    assert.match(text, /RCPT TO:<ama@test\.local>/);
    assert.match(text, /Subject: Hello Ama/);
    const body = m.log.slice(m.log.indexOf('')).join('');
    assert.match(Buffer.from(body.replace(/\.$/, ''), 'base64').toString('utf8'), /starts with a dot/);
  });

  test('a wrong password is reported, not swallowed', async () => {
    const m = await mockServer();
    await assert.rejects(sendSmtp({ host: '127.0.0.1', port: m.port, user: 'me', pass: 'WRONG', fromEmail: 'a@b.test' }, 'x@y.test', 's', 't'), /username or password/);
    m.close();
  });

  test('header injection is neutralised', async () => {
    const m = await mockServer();
    await sendSmtp({ host: '127.0.0.1', port: m.port, user: 'me', pass: 'pw', fromEmail: 'a@b.test' }, 'x@y.test', 'Hi\r\nBcc: evil@x.test', 'body');
    m.close();
    assert.ok(!m.log.some((l) => l.startsWith('Bcc:')));
  });
});
