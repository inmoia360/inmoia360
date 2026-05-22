'use client';

import { useEffect, useState, useCallback } from 'react';
import type { Bar } from '@/lib/types';

type BarWithCount = Bar & { coupon_count: number };

export default function BarsPage() {
  const [bars, setBars] = useState<BarWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ slug: '', name: '', address: '', city: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/delagala/dailycoffee/bars');
    const data = await res.json();
    setBars(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleActive(id: number, is_active: boolean) {
    await fetch(`/api/admin/delagala/dailycoffee/bars/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !is_active }),
    });
    load();
  }

  async function createBar(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setSaving(true);
    const res = await fetch('/api/admin/delagala/dailycoffee/bars', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) { setShowForm(false); setForm({ slug: '', name: '', address: '', city: '' }); load(); }
    else { const d = await res.json(); setError(d.error ?? 'Error al crear'); }
  }

  return (
    <div>
      <div style={{ ...S.topbar, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={S.topbarTitle}>Bares participantes</h2>
        <button style={S.btnPrimary} onClick={() => setShowForm(v => !v)}>
          {showForm ? 'Cancelar' : '+ Añadir bar'}
        </button>
      </div>
      <div style={S.content}>
        {showForm && (
          <div style={{ background: '#fff', borderRadius: 12, padding: '1.5rem', border: '1px solid #e8e8e8', marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '.95rem' }}>Nuevo bar</h3>
            {error && <div style={S.errorBox}>{error}</div>}
            <form onSubmit={createBar} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
              {[
                { key: 'slug', label: 'Slug (único, sin espacios) *', placeholder: 'bar-nombre-ciudad' },
                { key: 'name', label: 'Nombre *', placeholder: 'Cafetería Ejemplo' },
                { key: 'address', label: 'Dirección', placeholder: 'Calle Mayor 1' },
                { key: 'city', label: 'Ciudad', placeholder: 'Getxo' },
              ].map(f => (
                <div key={f.key}>
                  <label style={S.label}>{f.label}</label>
                  <input style={S.input} placeholder={f.placeholder}
                    value={form[f.key as keyof typeof form]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                </div>
              ))}
              <div style={{ gridColumn: '1 / -1' }}>
                <button type="submit" disabled={saving} style={{ ...S.btnPrimary, opacity: saving ? .6 : 1 }}>
                  {saving ? 'Guardando…' : 'Crear bar'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div style={S.tableWrap}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#aaa' }}>Cargando…</div>
          ) : (
            <table style={S.table}>
              <thead>
                <tr>{['Nombre', 'Dirección', 'Ciudad', 'Cupones', 'Estado', 'Acción'].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {bars.map(b => (
                  <tr key={b.id} style={{ borderBottom: '1px solid #f0f0f0', opacity: b.is_active ? 1 : .5 }}>
                    <td style={S.td}><strong>{b.name}</strong><br /><span style={{ fontSize: '.72rem', color: '#aaa' }}>{b.slug}</span></td>
                    <td style={S.td}>{b.address ?? '—'}</td>
                    <td style={S.td}>{b.city ?? '—'}</td>
                    <td style={S.td}><strong>{b.coupon_count}</strong></td>
                    <td style={S.td}>
                      <span style={{ background: b.is_active ? '#dcfce7' : '#f3f4f6', color: b.is_active ? '#16a34a' : '#9ca3af', padding: '.2rem .6rem', borderRadius: 20, fontSize: '.7rem', fontWeight: 600 }}>
                        {b.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={S.td}>
                      <button
                        onClick={() => toggleActive(b.id, b.is_active)}
                        style={{ border: '1.5px solid #e0e0e0', borderRadius: 6, padding: '.3rem .7rem', fontSize: '.8rem', cursor: 'pointer', background: '#fff' }}
                      >
                        {b.is_active ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
  btnPrimary: { padding: '.55rem 1.1rem', background: '#D4A017', color: '#fff', border: 'none', borderRadius: 8, fontSize: '.875rem', fontWeight: 600, cursor: 'pointer' },
  tableWrap: { background: '#fff', borderRadius: 12, border: '1px solid #e8e8e8', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '.85rem' },
  th: { background: '#fafafa', padding: '.65rem 1rem', textAlign: 'left', fontSize: '.7rem', textTransform: 'uppercase', letterSpacing: '.5px', color: '#888' },
  td: { padding: '.7rem 1rem' },
  label: { display: 'block', fontSize: '.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '.3rem', color: '#444' },
  input: { width: '100%', border: '1.5px solid #e0e0e0', borderRadius: 8, padding: '.6rem .85rem', fontSize: '.875rem', outline: 'none', boxSizing: 'border-box' },
  errorBox: { background: '#fee', border: '1px solid #fcc', borderRadius: 8, padding: '.6rem 1rem', color: '#c00', fontSize: '.85rem', marginBottom: '1rem' },
};
