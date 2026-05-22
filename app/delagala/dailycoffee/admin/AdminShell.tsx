'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const NAV = [
  { href: '/delagala/dailycoffee/admin',           label: 'Dashboard',   icon: '📊' },
  { href: '/delagala/dailycoffee/admin/coupons',   label: 'Cupones',     icon: '🎟️' },
  { href: '/delagala/dailycoffee/admin/bars',       label: 'Bares',       icon: '☕' },
  { href: '/delagala/dailycoffee/admin/analytics',  label: 'Analítica',   icon: '📈' },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch('/api/admin/delagala/dailycoffee/logout', { method: 'POST' });
    router.push('/delagala/dailycoffee/admin/login');
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* Sidebar */}
      <aside style={{ width: 220, background: '#1a1a1a', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid #333' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, background: '#D4A017', borderRadius: 8, fontSize: '1.1rem', fontWeight: 900, color: '#fff', marginBottom: '.4rem' }}>D</div>
          <div style={{ fontSize: '.85rem', letterSpacing: '3px', color: '#fff', fontWeight: 800 }}>DELAGALA</div>
          <div style={{ fontSize: '.6rem', color: '#888', letterSpacing: '1px' }}>Daily Coffee · Admin</div>
        </div>
        <nav style={{ flex: 1, padding: '.75rem 0' }}>
          {NAV.map(n => {
            const active = pathname === n.href || (n.href !== '/delagala/dailycoffee/admin' && pathname.startsWith(n.href));
            return (
              <Link key={n.href} href={n.href} style={{
                display: 'flex', alignItems: 'center', gap: '.75rem',
                padding: '.65rem 1.25rem', color: active ? '#D4A017' : '#aaa',
                textDecoration: 'none', fontSize: '.875rem',
                borderLeft: active ? '3px solid #D4A017' : '3px solid transparent',
                background: active ? '#2a2a2a' : 'transparent',
                transition: 'all .15s',
              }}>
                <span>{n.icon}</span><span>{n.label}</span>
              </Link>
            );
          })}
        </nav>
        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid #333' }}>
          <Link href="/delagala/dailycoffee" target="_blank"
            style={{ display: 'block', fontSize: '.75rem', color: '#D4A017', textDecoration: 'none', marginBottom: '.75rem' }}>
            🔗 Ver landing pública
          </Link>
          <button onClick={logout}
            style={{ width: '100%', padding: '.45rem', background: 'transparent', border: '1px solid #444', color: '#aaa', borderRadius: 6, fontSize: '.75rem', cursor: 'pointer' }}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, background: '#f5f5f5', overflow: 'auto' }}>
        {children}
      </div>
    </div>
  );
}
