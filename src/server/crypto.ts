// Node-safe cryptography helpers (no Next.js imports; usable from scripts).
import { createHash, createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

export function newId(prefix: string): string {
  return `${prefix}_${randomBytes(12).toString("hex")}`;
}

export function newToken(prefix = "c1"): string {
  return `${prefix}_${randomBytes(32).toString("hex")}`;
}

export function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function hmacSign(secret: string, payload: string): string {
  return createHmac("sha256", secret).update(payload, "utf8").digest("hex");
}

export function hmacVerify(secret: string, payload: string, signature: string): boolean {
  const expected = hmacSign(secret, payload);
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(signature, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

/** scrypt password hash in `scrypt$<n>$<saltHex>$<keyHex>` form. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const key = (await scryptAsync(password, salt, 64)) as Buffer;
  return `scrypt$32768$${salt}$${key.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "scrypt") return false;
  const [, cost, salt, keyHex] = parts;
  if (cost !== "32768") return false;
  const expected = Buffer.from(keyHex, "hex");
  if (expected.length !== 64) return false;
  const actual = (await scryptAsync(password, salt, 64)) as Buffer;
  return timingSafeEqual(actual, expected);
}
