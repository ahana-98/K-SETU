// Node-only password hashing (scrypt). Never used in edge middleware.
import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(":");
    if (!salt || !hash) return false;
    const check = scryptSync(password, salt, 64);
    const expected = Buffer.from(hash, "hex");
    return check.length === expected.length && timingSafeEqual(check, expected);
  } catch {
    return false;
  }
}
