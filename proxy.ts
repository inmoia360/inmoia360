import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SESSION_COOKIE = 'dlg_session';

function getSecret(): Uint8Array {
  const pwd = process.env.DAILYCOFFEE_ADMIN_PASSWORD || 'changeme-set-env-var';
  return new TextEncoder().encode(pwd);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isCoffeeAdmin = pathname.startsWith('/delagala/dailycoffee/admin') &&
    !pathname.startsWith('/delagala/dailycoffee/admin/login');
  const isBreadAdmin = pathname.startsWith('/delagala/dailybread/admin') &&
    !pathname.startsWith('/delagala/dailybread/admin/login');
  const isAdminPage = isCoffeeAdmin || isBreadAdmin;
  const isAdminApi = pathname.startsWith('/api/admin/') &&
    !pathname.endsWith('/login') &&
    !pathname.endsWith('/logout');

  if (!isAdminPage && !isAdminApi) return NextResponse.next();

  const loginPath = isBreadAdmin ? '/delagala/dailybread/admin/login' : '/delagala/dailycoffee/admin/login';

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    if (isAdminApi) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const loginUrl = new URL(loginPath, request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    await jwtVerify(token, getSecret());
    return NextResponse.next();
  } catch {
    if (isAdminApi) return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    const loginUrl = new URL(loginPath, request.url);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    '/delagala/dailycoffee/admin/:path*',
    '/delagala/dailybread/admin/:path*',
    '/api/admin/:path*',
  ],
};
