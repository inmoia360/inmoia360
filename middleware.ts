import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SESSION_COOKIE = 'dlg_session';

function getSecret(): Uint8Array {
  const pwd = process.env.DAILYCOFFEE_ADMIN_PASSWORD || 'changeme-set-env-var';
  return new TextEncoder().encode(pwd);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminPage = pathname.startsWith('/delagala/dailycoffee/admin') &&
    !pathname.startsWith('/delagala/dailycoffee/admin/login');
  const isAdminApi = pathname.startsWith('/api/admin/');

  if (!isAdminPage && !isAdminApi) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    if (isAdminApi) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const loginUrl = new URL('/delagala/dailycoffee/admin/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    await jwtVerify(token, getSecret());
    return NextResponse.next();
  } catch {
    if (isAdminApi) return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    const loginUrl = new URL('/delagala/dailycoffee/admin/login', request.url);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    '/delagala/dailycoffee/admin/:path*',
    '/api/admin/:path*',
  ],
};
