'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

type Coupon = { id: number; lead_name: string; lead_phone: string; coupon_code: string; status: string; created_at: string; location_name: string | null };
type Loc = { id: number; name: string; city: string | null; coupon_limit: number; is_active: boolean; used_this_month: number };
type Stats = { total: number; this_month: number; this_week: number; today: number };

const GOLD = '#E0A52C';
const INK = '#21404F';

export default function BreadAdmin() {
  const router = useRouter();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [locations, setLocations] = useState<Loc[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/dailybread/data');
    if (res.status === 401) { router.push('/delagala/dailybread/admin/login'); return; }
    const d = await res.json();
    setCoupons(d.coupons ?? []); setLocations(d.locations ?? []); setStats(d.stats ?? null);
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  async function del(id: number, name: string) {
    if (!confirm(`¿Borrar el registro de "${name}"?`)) return;
    await fetch(`/api/admin/dailybread/data?id=${id}`, { method: 'DELETE' });
    load();
  }

  async function logout() {
    await fetch('/api/admin/dailybread/logout', { method: 'POST' });
    router.push('/delagala/dailybread/admin/login');
  }

  const fmt = (s: string) => new Date(s).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  const card = { background: '#fff', borderRadius: 12, padding: '1rem 1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,.08)' } as const;

  return (
    <main style={{ minHeight: '100vh', background: '#f3f4f4', fontFamily: "'Segoe UI', system-ui, sans-serif", color: INK }}>
      <header style={{ background: INK, color: '#fff', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontWeight: 800, letterSpacing: 3 }}>DELAGALA</div>
          <div style={{ fontSize: '.7rem', color: GOLD, letterSpacing: 2 }}>PAN · ADMIN (Zapore)</div>
        </div>
        <div style={{ display: 'flex', gap: '.75rem' }}>
          <a href="/delagala/dailybread" target="_blank" style={{ color: GOLD, fontSize: '.8rem', alignSelf: 'center', textDecoration: 'none' }}>🔗 Ver landing</a>
          <button onClick={logout} style={{ background: 'transparent', border: '1px solid #ffffff55', color: '#fff', borderRadius: 6, padding: '.4rem .8rem', cursor: 'pointer', fontSize: '.8rem' }}>Cerrar sesión</button>
        </div>
      </header>

      <div style={{ padding: '1.5rem', maxWidth: 1000, margin: '0 auto' }}>
        {loading ? <p>Cargando…</p> : (
          <>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
              {[['Total', stats?.total], ['Este mes', stats?.this_month], ['Esta semana', stats?.this_week], ['Hoy', stats?.today]].map(([l, v]) => (
                <div key={l as string} style={card}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: GOLD }}>{v ?? 0}</div>
                  <div style={{ fontSize: '.75rem', textTransform: 'uppercase', letterSpacing: 1, color: '#789' }}>{l}</div>
                </div>
              ))}
            </div>

            {/* Locations */}
            {locations.map(l => (
              <div key={l.id} style={{ ...card, marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><strong>🥖 {l.name}</strong> <span style={{ color: '#789', fontSize: '.85rem' }}>· {l.city}</span></div>
                <div style={{ fontSize: '.85rem', color: '#789' }}>Este mes: <strong style={{ color: INK }}>{l.used_this_month} / {l.coupon_limit}</strong></div>
              </div>
            ))}

            {/* Coupons table */}
            <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '.9rem 1.25rem', borderBottom: '1px solid #eee', fontWeight: 700 }}>Registros ({coupons.length})</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.85rem' }}>
                  <thead>
                    <tr style={{ background: '#fafafa', textAlign: 'left', color: '#789' }}>
                      <th style={{ padding: '.6rem 1rem' }}>Nombre</th>
                      <th style={{ padding: '.6rem 1rem' }}>WhatsApp</th>
                      <th style={{ padding: '.6rem 1rem' }}>Código</th>
                      <th style={{ padding: '.6rem 1rem' }}>Fecha</th>
                      <th style={{ padding: '.6rem 1rem' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {coupons.length === 0 && <tr><td colSpan={5} style={{ padding: '1.5rem', textAlign: 'center', color: '#789' }}>Sin registros todavía</td></tr>}
                    {coupons.map(c => (
                      <tr key={c.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '.6rem 1rem', fontWeight: 600 }}>{c.lead_name}</td>
                        <td style={{ padding: '.6rem 1rem' }}>{c.lead_phone}</td>
                        <td style={{ padding: '.6rem 1rem', fontFamily: 'monospace' }}>{c.coupon_code}</td>
                        <td style={{ padding: '.6rem 1rem', color: '#789' }}>{fmt(c.created_at)}</td>
                        <td style={{ padding: '.6rem 1rem', textAlign: 'right' }}>
                          <button onClick={() => del(c.id, c.lead_name)} style={{ background: '#fee', border: '1px solid #fcc', color: '#c00', borderRadius: 6, padding: '.3rem .6rem', cursor: 'pointer', fontSize: '.8rem' }}>🗑️ Borrar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
