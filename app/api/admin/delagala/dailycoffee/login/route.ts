import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken, sessionCookieOptions } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const { password } = await request.json().catch(() => ({}));
  const adminPassword = process.env.DAILYCOFFEE_ADMIN_PASSWORD;

  if (!adminPassword) {
    return NextResponse.json({ error: 'Server misconfigured: DAILYCOFFEE_ADMIN_PASSWORD not set' }, { status: 500 });
  }
  if (!password || password !== adminPassword) {
    // Constant-time comparison not strictly needed since this isn't a hash, but adds clarity
    return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
  }

  const token = await createSessionToken('delagala', 'dailycoffee');
  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookieOptions(token));
  return response;
}
