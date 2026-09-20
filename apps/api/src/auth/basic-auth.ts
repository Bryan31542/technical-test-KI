import { timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';

export function credentialsConfigured(
  user?: string,
  passwordHash?: string,
): user is string {
  return Boolean(user?.trim() && normalizePasswordHash(passwordHash));
}

export function normalizePasswordHash(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim().replace(/^['"]|['"]$/g, '');
  if (!trimmed) {
    return undefined;
  }

  if (trimmed.startsWith('$2')) {
    return trimmed;
  }

  try {
    const decoded = Buffer.from(trimmed, 'base64').toString('utf8').trim();
    if (decoded.startsWith('$2')) {
      return decoded;
    }
  } catch {
    return undefined;
  }

  return undefined;
}

export async function authorizeBasicHeader(
  header: string | undefined,
  user: string,
  passwordHash: string,
): Promise<boolean> {
  const hash = normalizePasswordHash(passwordHash);
  if (!hash) {
    return false;
  }

  const parsed = parseBasicHeader(header);
  if (!parsed) {
    return false;
  }

  const userMatches = safeEqual(parsed.user, user);
  const passwordMatches = await bcrypt.compare(parsed.password, hash);
  return userMatches && passwordMatches;
}

export function parseBasicHeader(
  header: string | undefined,
): { user: string; password: string } | null {
  if (!header) {
    return null;
  }

  const [scheme, encoded] = header.split(' ');
  if (scheme !== 'Basic' || !encoded) {
    return null;
  }

  let decoded: string;
  try {
    decoded = Buffer.from(encoded, 'base64').toString('utf8');
  } catch {
    return null;
  }

  const separator = decoded.indexOf(':');
  if (separator < 0) {
    return null;
  }

  return {
    user: decoded.slice(0, separator),
    password: decoded.slice(separator + 1),
  };
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}
