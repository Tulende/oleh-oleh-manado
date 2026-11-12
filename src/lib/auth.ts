const PASSWORD_ITERATIONS = 120_000;
const SESSION_COOKIE = 'sentra_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const encoder = new TextEncoder();

export type SessionUser = {
  id: string;
  name: string;
  role: string;
};

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecode(value: string): Uint8Array {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function derivePassword(password: string, salt: Uint8Array, iterations: number) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    key,
    256,
  ));
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePassword(password, salt, PASSWORD_ITERATIONS);
  return `pbkdf2$${PASSWORD_ITERATIONS}$${base64UrlEncode(salt)}$${base64UrlEncode(hash)}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [algorithm, iterationText, saltText, hashText] = storedHash.split('$');
  const iterations = Number(iterationText);
  if (algorithm !== 'pbkdf2' || !Number.isInteger(iterations) || iterations < 1 || !saltText || !hashText) {
    return false;
  }

  const expected = base64UrlDecode(hashText);
  const actual = await derivePassword(password, base64UrlDecode(saltText), iterations);
  if (actual.length !== expected.length) return false;

  let difference = 0;
  for (let index = 0; index < actual.length; index += 1) difference |= actual[index] ^ expected[index];
  return difference === 0;
}

function getSessionSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error('AUTH_SECRET must be configured with at least 32 characters.');
  return secret;
}

export function assertAuthConfigured() {
  getSessionSecret();
}

async function sign(value: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(getSessionSecret()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value)));
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  const payload = base64UrlEncode(encoder.encode(JSON.stringify({
    ...user,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  })));
  return `${payload}.${base64UrlEncode(await sign(payload))}`;
}

export async function readSessionToken(token?: string | null): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const [payload, signature, extra] = token.split('.');
    if (!payload || !signature || extra) return null;
    const expected = await sign(payload);
    const actual = base64UrlDecode(signature);
    if (actual.length !== expected.length) return null;
    let difference = 0;
    for (let index = 0; index < actual.length; index += 1) difference |= actual[index] ^ expected[index];
    if (difference !== 0) return null;

    const session = JSON.parse(new TextDecoder().decode(base64UrlDecode(payload)));
    if (typeof session.id !== 'string' || typeof session.name !== 'string' || typeof session.role !== 'string' || session.exp <= Date.now() / 1000) return null;
    return { id: session.id, name: session.name, role: session.role };
  } catch {
    return null;
  }
}

export function getSessionCookie(request: Request): string | null {
  const cookies = request.headers.get('cookie')?.split(';') ?? [];
  const cookie = cookies.find((part) => part.trim().startsWith(`${SESSION_COOKIE}=`));
  if (!cookie) return null;
  try {
    return decodeURIComponent(cookie.trim().slice(SESSION_COOKIE.length + 1));
  } catch {
    return null;
  }
}

export async function getRequestSession(request: Request) {
  return readSessionToken(getSessionCookie(request));
}

export function sessionCookie(token: string) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly${secure}; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}`;
}

export function expiredSessionCookie() {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${SESSION_COOKIE}=; Path=/; HttpOnly${secure}; SameSite=Lax; Max-Age=0`;
}
