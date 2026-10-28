import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHash,
} from 'node:crypto';

export const randomId = (bytes = 9): string => randomBytes(bytes).toString('base64url');

/** Readable one-time password, e.g. "k7Qm-92xP-Lw4d". */
export function randomPassword(): string {
  const alphabet = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(12);
  let out = '';
  for (let i = 0; i < 12; i++) {
    out += alphabet[bytes[i]! % alphabet.length];
    if (i === 3 || i === 7) out += '-';
  }
  return out;
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const salt = Buffer.from(parts[1]!, 'base64');
  const expected = Buffer.from(parts[2]!, 'base64');
  const actual = scryptSync(password, salt, expected.length, { N: 16384, r: 8, p: 1 });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export class Vault {
  private readonly signKey: Buffer;
  private readonly encKey: Buffer;

  constructor(secret: string) {
    this.signKey = createHash('sha256').update(`sign:${secret}`).digest();
    this.encKey = createHash('sha256').update(`enc:${secret}`).digest();
  }

  /** AES-256-GCM. Output: v1.iv.tag.ciphertext (base64url). */
  encrypt(plain: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.encKey, iv);
    const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return ['v1', iv.toString('base64url'), tag.toString('base64url'), data.toString('base64url')].join('.');
  }

  decrypt(blob: string): string {
    const [v, iv, tag, data] = blob.split('.');
    if (v !== 'v1' || !iv || !tag || !data) throw new Error('Unreadable secret blob');
    const decipher = createDecipheriv('aes-256-gcm', this.encKey, Buffer.from(iv, 'base64url'));
    decipher.setAuthTag(Buffer.from(tag, 'base64url'));
    return Buffer.concat([decipher.update(Buffer.from(data, 'base64url')), decipher.final()]).toString('utf8');
  }

  signToken(payload: Record<string, unknown>, ttlSeconds: number): string {
    const body = { ...payload, exp: Math.floor(Date.now() / 1000) + ttlSeconds };
    const encoded = Buffer.from(JSON.stringify(body)).toString('base64url');
    const sig = createHmac('sha256', this.signKey).update(encoded).digest('base64url');
    return `${encoded}.${sig}`;
  }

  verifyToken(token: string): Record<string, unknown> | null {
    const [encoded, sig] = token.split('.');
    if (!encoded || !sig) return null;
    const expected = createHmac('sha256', this.signKey).update(encoded).digest();
    const given = Buffer.from(sig, 'base64url');
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
    try {
      const body = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as Record<string, unknown>;
      if (typeof body.exp !== 'number' || body.exp < Math.floor(Date.now() / 1000)) return null;
      return body;
    } catch {
      return null;
    }
  }
}
