'use client';
import { useState, useEffect, useCallback } from 'react';

const Y = '#F5C842';
const INK = '#0A0A0A';

type Coupon = { id: number; lead_name: string; lead_phone: string; coupon_code: string; status: string; created_at: string; bar_name: string | null };
type Bar = { id: number; name: string; slug: string; staff_whatsapp: string | null; coupon_limit: number; is_active: boolean; used_this_month: number };
type Stats = { total: number; this_month: number; this_week: number; today: number };

export default function AdminPage() {
  const [pwd, setPwd] = useState('');
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState('');
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [bars, setBars] = useState<Bar[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [tab, setTab] = useState<'dashboard' | 'registros' | 'bares'>('dashboard');
  const [saving, setSaving] = useState(false);
  const [newBar, setNewBar] = useState({ name: '', staff_whatsapp: '', coupon_limit: '50' });
  const [addingBar, setAddingBar] = useState(false);

  const load = useCallback(async (password: string) => {
    const res = await fetch('/api/delagala/dailycoffee/admin/data', {
      headers: { 'x-admin-password': password },
    });
    if (res.status === 401) { setError('Contraseña incorrecta'); return false; }
    const data = await res.json();
    setCoupons(data.coupons);
    setBars(data.bars);
    setStats(data.stats);
    return true;
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const ok = await load(pwd);
    if (ok) setAuthed(true);
  }

  async function updateBar(bar: Bar, changes: Partial<Bar>) {
    setSaving(true);
    try {
      const res = await fetch('/api/delagala/dailycoffee/admin/data', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': pwd },
        body: JSON.stringify({ bar_id: bar.id, ...changes }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert('Error al guardar: ' + (err.error ?? res.status));
        return;
      }
      await load(pwd);
    } catch (e) {
      alert('Error de conexión al guardar');
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  async function createBar(e: React.FormEvent) {
    e.preventDefault();
    if (!newBar.name.trim()) return;
    setAddingBar(true);
    try {
      const res = await fetch('/api/delagala/dailycoffee/admin/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': pwd },
        body: JSON.stringify({ name: newBar.name, staff_whatsapp: newBar.staff_whatsapp || null, coupon_limit: Number(newBar.coupon_limit) }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert('Error al crear bar: ' + (err.error ?? res.status));
        return;
      }
      setNewBar({ name: '', staff_whatsapp: '', coupon_limit: '50' });
      await load(pwd);
    } catch (e) {
      alert('Error de conexión');
    } finally {
      setAddingBar(false);
    }
  }

  useEffect(() => {
    if (authed) {
      const iv = setInterval(() => load(pwd), 30000);
      return () => clearInterval(iv);
    }
  }, [authed, pwd, load]);

  if (!authed) return (
    <div style={{ minHeight: '100vh', background: INK, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Montserrat,sans-serif' }}>
      <div style={{ background: '#fff', padding: '40px 36px', width: 340, borderTop: `4px solid ${Y}` }}>
        <div style={{ fontWeight: 900, fontSize: 13, letterSpacing: '0.28em', textTransform: 'uppercase', marginBottom: 6 }}>DELAGALA</div>
        <div style={{ fontWeight: 500, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#888', marginBottom: 28 }}>Panel de administración</div>
        <form onSubmit={handleLogin}>
          <input
            type="password"
            placeholder="Contraseña"
            value={pwd}
            onChange={e => setPwd(e.target.value)}
            style={{ width: '100%', padding: '14px 12px', border: '1.5px solid #ddd', fontSize: 15, marginBottom: 12, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }}
            autoFocus
          />
          {error && <div style={{ color: '#B91C1C', fontSize: 12, marginBottom: 10 }}>{error}</div>}
          <button type="submit" style={{ width: '100%', padding: '14px', background: INK, color: '#fff', border: 'none', fontFamily: 'inherit', fontWeight: 700, fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', cursor: 'pointer' }}>
            Entrar
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F0', fontFamily: 'Montserrat,sans-serif' }}>
      {/* Header */}
      <div style={{ background: INK, padding: '16px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: Y, fontWeight: 900, fontSize: 14, letterSpacing: '0.28em', textTransform: 'uppercase' }}>DELAGALA</span>
          <span style={{ color: '#666', fontSize: 11 }}>·</span>
          <span style={{ color: '#aaa', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Admin · Daily Coffee</span>
        </div>
        <button onClick={() => { setAuthed(false); setPwd(''); }} style={{ background: 'none', border: '1px solid #444', color: '#aaa', padding: '6px 14px', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit' }}>
          Salir
        </button>
      </div>

      {/* Tabs */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E5E5E0', padding: '0 28px', display: 'flex', gap: 0 }}>
        {(['dashboard', 'registros', 'bares'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '14px 20px', fontFamily: 'inherit', fontWeight: tab === t ? 700 : 500, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', border: 'none', borderBottom: tab === t ? `3px solid ${INK}` : '3px solid transparent', background: 'none', cursor: 'pointer', color: tab === t ? INK : '#888' }}>
            {t === 'dashboard' ? '📊 Dashboard' : t === 'registros' ? '📋 Registros' : '🍺 Bares'}
          </button>
        ))}
      </div>

      <div style={{ padding: '28px', maxWidth: 1100, margin: '0 auto' }}>

        {/* DASHBOARD */}
        {tab === 'dashboard' && stats && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
              {[
                { label: 'Total registros', value: stats.total },
                { label: 'Este mes', value: stats.this_month },
                { label: 'Esta semana', value: stats.this_week },
                { label: 'Hoy', value: stats.today },
              ].map(s => (
                <div key={s.label} style={{ background: '#fff', padding: '20px 22px', borderTop: `3px solid ${Y}` }}>
                  <div style={{ fontSize: 32, fontWeight: 900, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#888', marginTop: 6 }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {bars.filter(b => b.is_active).map(b => (
                <div key={b.id} style={{ background: '#fff', padding: '20px 22px', borderLeft: `4px solid ${Y}` }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>{b.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{ height: 8, background: '#E5E5E0', flex: 1, borderRadius: 2 }}>
                      <div style={{ height: 8, background: b.used_this_month >= b.coupon_limit ? '#EF4444' : Y, width: `${Math.min(100, (b.used_this_month / b.coupon_limit) * 100)}%`, borderRadius: 2 }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>{b.used_this_month} / {b.coupon_limit}</span>
                  </div>
                  <div style={{ fontSize: 10, color: '#888', letterSpacing: '0.1em' }}>Cafés servidos este mes</div>
                  {b.staff_whatsapp && <div style={{ fontSize: 10, color: '#888', marginTop: 6 }}>📱 Camarera: {b.staff_whatsapp}</div>}
                </div>
              ))}
            </div>
          </>
        )}

        {/* REGISTROS */}
        {tab === 'registros' && (
          <div style={{ background: '#fff', overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${INK}` }}>
                  {['#', 'Nombre', 'WhatsApp', 'Código', 'Bar', 'Fecha', 'Estado'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#888', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {coupons.map((c, i) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #F0F0EC', background: i % 2 === 0 ? '#fff' : '#FAFAF7' }}>
                    <td style={{ padding: '10px 14px', color: '#aaa' }}>{c.id}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 600 }}>{c.lead_name}</td>
                    <td style={{ padding: '10px 14px', fontFamily: 'monospace' }}>{c.lead_phone}</td>
                    <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 700, color: INK }}>{c.coupon_code}</td>
                    <td style={{ padding: '10px 14px' }}>{c.bar_name ?? '—'}</td>
                    <td style={{ padding: '10px 14px', color: '#666', whiteSpace: 'nowrap' }}>{new Date(c.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ background: c.status === 'generated' ? '#FEF9EC' : '#F0FDF4', color: c.status === 'generated' ? '#92400E' : '#166534', padding: '2px 8px', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* BARES */}
        {tab === 'bares' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Añadir nuevo bar */}
            <form onSubmit={createBar} style={{ background: '#fff', padding: '22px 24px', borderLeft: `4px solid ${Y}`, display: 'flex', alignItems: 'flex-end', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ flex: '0 0 160px' }}>
                <div style={{ fontWeight: 700, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#888', marginBottom: 12 }}>+ Nuevo bar</div>
                <label style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#888', display: 'block', marginBottom: 4 }}>Nombre</label>
                <input value={newBar.name} onChange={e => setNewBar(p => ({ ...p, name: e.target.value }))} placeholder="Nombre del bar" required style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #ddd', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }} />
              </div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <label style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#888', display: 'block', marginBottom: 4 }}>WhatsApp camarera</label>
                <input value={newBar.staff_whatsapp} onChange={e => setNewBar(p => ({ ...p, staff_whatsapp: e.target.value }))} placeholder="6XXXXXXXX" style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #ddd', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }} />
              </div>
              <div style={{ flex: '0 0 100px' }}>
                <label style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#888', display: 'block', marginBottom: 4 }}>Límite/mes</label>
                <input value={newBar.coupon_limit} onChange={e => setNewBar(p => ({ ...p, coupon_limit: e.target.value }))} type="number" min="1" max="500" style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #ddd', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }} />
              </div>
              <button type="submit" disabled={addingBar} style={{ padding: '9px 20px', background: Y, color: INK, border: 'none', fontFamily: 'inherit', fontWeight: 800, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer', opacity: addingBar ? 0.5 : 1 }}>
                {addingBar ? '...' : 'Añadir'}
              </button>
            </form>

            {/* Bares existentes */}
            {bars.map(b => (
              <BarCard key={b.id} bar={b} onSave={changes => updateBar(b, changes)} saving={saving} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

function BarCard({ bar, onSave, saving }: { bar: Bar; onSave: (c: Partial<Bar>) => void; saving: boolean }) {
  const [name, setName] = useState(bar.name);
  const [phone, setPhone] = useState(bar.staff_whatsapp ?? '');
  const [limit, setLimit] = useState(String(bar.coupon_limit));

  return (
    <div style={{ background: '#fff', padding: '22px 24px', borderLeft: `4px solid ${bar.is_active ? '#F5C842' : '#ddd'}`, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
      <div style={{ flex: '0 0 160px' }}>
        <label style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#888', display: 'block', marginBottom: 4 }}>Nombre del bar</label>
        <input value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #ddd', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }} />
        <div style={{ fontSize: 10, color: '#aaa', marginTop: 4 }}>{bar.used_this_month} / {bar.coupon_limit} este mes</div>
      </div>
      <div style={{ flex: 1, minWidth: 160 }}>
        <label style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#888', display: 'block', marginBottom: 4 }}>WhatsApp camarera</label>
        <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="6XXXXXXXX" style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #ddd', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }} />
      </div>
      <div style={{ flex: '0 0 100px' }}>
        <label style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#888', display: 'block', marginBottom: 4 }}>Límite/mes</label>
        <input value={limit} onChange={e => setLimit(e.target.value)} type="number" min="1" max="500" style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #ddd', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }} />
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={() => onSave({ name, staff_whatsapp: phone || null, coupon_limit: Number(limit) })} disabled={saving} style={{ padding: '9px 18px', background: '#0A0A0A', color: '#fff', border: 'none', fontFamily: 'inherit', fontWeight: 700, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', cursor: 'pointer', opacity: saving ? 0.5 : 1 }}>
          Guardar
        </button>
        <button onClick={() => onSave({ is_active: !bar.is_active })} disabled={saving} style={{ padding: '9px 14px', background: bar.is_active ? '#FEF2F2' : '#F0FDF4', color: bar.is_active ? '#B91C1C' : '#166534', border: `1px solid ${bar.is_active ? '#FCA5A5' : '#86EFAC'}`, fontFamily: 'inherit', fontWeight: 700, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', opacity: saving ? 0.5 : 1 }}>
          {bar.is_active ? 'Desactivar' : 'Activar'}
        </button>
      </div>
    </div>
  );
}
