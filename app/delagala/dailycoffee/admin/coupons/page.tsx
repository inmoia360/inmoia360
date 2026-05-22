'use client';

import { useEffect, useState, useCallback } from 'react';
import type { CoffeeCoupon, CouponStatus } from '@/lib/types';

const STATUS_LABELS: Record<CouponStatus, string> = {
  generated: 'Generado', claimed: 'Reclamado', redeemed: 'Canjeado', expired: 'Expirado', cancelled: 'Cancelado',
};
const STATUS_COLORS: Record<CouponStatus, string> = {
  generated: '#2563eb', claimed: '#d97706', redeemed: '#16a34a', expired: '#9ca3af', cancelled: '#ef4444',
};

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<CoffeeCoupon[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page) });
    if (statusFilter) p.set('status', statusFilter);
    if (search) p.set('search', search);
    const res = await fetch(`/api/admin/delagala/dailycoffee/coupons?${p}`);
    const data = await res.json();
    setCoupons(data.coupons ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [page, statusFilter, search]);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(id: number, status: CouponStatus) {
    setUpdating(id);
    await fetch(`/api/admin/delagala/dailycoffee/coupons/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setUpdating(null);
    load();
  }

  return (
    <div>
      <div style={S.topbar}>
        <h2 style={S.topbarTitle}>Cupones <span style={{ fontSize: '.85rem', color: '#888', fontWeight: 400 }}>({total} total)</span></h2>
      </div>
      <div style={S.content}>
        <div style={S.filters}>
          <input style={S.filterInput} placeholder="Buscar nombre, email, código…" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }} />
          <select style={S.filterSelect} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">Todos los estados</option>
            {(Object.keys(STATUS_LABELS) as CouponStatus[]).map(s => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>

        <div style={S.tableWrap}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#aaa' }}>Cargando…</div>
          ) : (
            <table style={S.table}>
              <thead>
                <tr>{['Nombre', 'Email', 'Teléfono', 'Código', 'Bar', 'Estado', 'Fecha', 'Acción'].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {coupons.length === 0 && (
                  <tr><td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#aaa' }}>Sin resultados</td></tr>
                )}
                {coupons.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={S.td}><strong>{c.lead_name}</strong></td>
                    <td style={S.td}>{c.lead_email}</td>
                    <td style={S.td}>{c.lead_phone}</td>
                    <td style={{ ...S.td, fontFamily: 'monospace', fontWeight: 700, letterSpacing: 2 }}>{c.coupon_code}</td>
                    <td style={S.td}>{c.bar_name ?? '—'}</td>
                    <td style={S.td}>
                      <span style={{ background: `${STATUS_COLORS[c.status]}20`, color: STATUS_COLORS[c.status], padding: '.2rem .55rem', borderRadius: 20, fontSize: '.7rem', fontWeight: 600 }}>
                        {STATUS_LABELS[c.status]}
                      </span>
                    </td>
                    <td style={{ ...S.td, color: '#888', whiteSpace: 'nowrap' }}>
                      {new Date(c.created_at).toLocaleDateString('es-ES')}
                    </td>
                    <td style={S.td}>
                      {c.status !== 'redeemed' && c.status !== 'cancelled' && (
                        <select
                          value={c.status}
                          disabled={updating === c.id}
                          onChange={e => updateStatus(c.id, e.target.value as CouponStatus)}
                          style={{ border: '1.5px solid #e0e0e0', borderRadius: 6, padding: '.3rem .5rem', fontSize: '.8rem', cursor: 'pointer' }}
                        >
                          <option value="generated">Generado</option>
                          <option value="claimed">Reclamado</option>
                          <option value="redeemed">Canjear ✓</option>
                          <option value="expired">Expirado</option>
                          <option value="cancelled">Cancelar</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {total > 50 && (
            <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', justifyContent: 'flex-end', padding: '1rem 1.5rem', borderTop: '1px solid #f0f0f0', fontSize: '.85rem' }}>
              <span style={{ color: '#888' }}>Pág {page} de {Math.ceil(total / 50)}</span>
              <button style={S.pagBtn} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Ant</button>
              <button style={S.pagBtn} disabled={page >= Math.ceil(total / 50)} onClick={() => setPage(p => p + 1)}>Sig →</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  topbar: { background: '#fff', borderBottom: '1px solid #e8e8e8', padding: '1rem 2rem', position: 'sticky', top: 0, zIndex: 10 },
  topbarTitle: { fontSize: '1.1rem', fontWeight: 700, margin: 0 },
  content: { padding: '2rem' },
  filters: { background: '#fff', borderRadius: 12, padding: '1rem 1.5rem', border: '1px solid #e8e8e8', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' },
  filterInput: { flex: 1, minWidth: 200, border: '1.5px solid #e0e0e0', borderRadius: 8, padding: '.5rem .85rem', fontSize: '.875rem', outline: 'none' },
  filterSelect: { border: '1.5px solid #e0e0e0', borderRadius: 8, padding: '.5rem .85rem', fontSize: '.875rem', outline: 'none' },
  tableWrap: { background: '#fff', borderRadius: 12, border: '1px solid #e8e8e8', overflow: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '.85rem' },
  th: { background: '#fafafa', padding: '.65rem 1rem', textAlign: 'left', fontSize: '.7rem', textTransform: 'uppercase', letterSpacing: '.5px', color: '#888', whiteSpace: 'nowrap' },
  td: { padding: '.7rem 1rem' },
  pagBtn: { padding: '.4rem .8rem', border: '1.5px solid #e0e0e0', background: '#fff', borderRadius: 6, cursor: 'pointer', fontSize: '.8rem' },
};
