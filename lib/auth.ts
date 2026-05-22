import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const SESSION_COOKIE = 'dlg_session';
const SESSION_DURATION = 60 * 60 * 8; // 8 hours

function getSecret(): Uint8Array {
  const pwd = process.env.DAILYCOFFEE_ADMIN_PASSWORD;
  if (!pwd) throw new Error('DAILYCOFFEE_ADMIN_PASSWORD is not set');
  return new TextEncoder().encode(pwd);
}

export async function createSessionToken(clientSlug: string, campaignSlug: string): Promise<string> {
  return new SignJWT({ role: 'admin', clientSlug, campaignSlug })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(getSecret());
}

export async function verifySessionToken(token: string) {
  const { payload } = await jwtVerify(token, getSecret());
  return payload as { role: string; clientSlug: string; campaignSlug: string };
}

export async function getSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

export function sessionCookieOptions(token: string) {
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: SESSION_DURATION,
    path: '/',
  };
}

export function clearSessionCookie() {
  return { name: SESSION_COOKIE, value: '', maxAge: 0, path: '/' };
}

export async function verifyRequestSession(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}
