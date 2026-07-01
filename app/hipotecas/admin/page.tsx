'use client';
import { useState, useEffect, useCallback } from 'react';

const INK = '#0F172A';
const ACCENT = '#2563EB';

type Calc = {
  mode?: string;
  amount?: number; years?: number; rate?: number; monthly?: number;
  netIncome?: number; otherDebts?: number; maxLoan?: number;
} | null;

type Lead = {
  id: number;
  brand: 'delagala' | 'blanca';
  service: string | null;
  lead_name: string;
  lead_phone: string;
  lead_email: string | null;
  message: string | null;
  calc: Calc;
  source_url: string | null;
  consent_privacy: boolean;
  consent_marketing: boolean;
  status: string;
  created_at: string;
};

type Stats = {
  total: number; delagala: number; blanca: number;
  this_month: number; this_week: number; today: number; pending: number;
};

const STATUS: Record<string, { label: string; bg: string; fg: string }> = {
  new:       { label: 'Nuevo',      bg: '#DBEAFE', fg: '#1D4ED8' },
  contacted: { label: 'Contactado', bg: '#FEF9C3', fg: '#92400E' },
  qualified: { label: 'Cualificado', bg: '#E0E7FF', fg: '#4338CA' },
  won:       { label: 'Ganado',     bg: '#DCFCE7', fg: '#166534' },
  lost:      { label: 'Perdido',    bg: '#FEE2E2', fg: '#B91C1C' },
};

const BRAND_LABEL: Record<string, string> = { delagala: 'DELAGALA', blanca: 'Hipoteca Justa' };

function calcSummary(c: Calc): string {
  if (!c) return '—';
  if (c.mode === 'cuota') return `${fmt(c.amount)} · ${c.years}a · ~${fmt(c.monthly)}/mes`;
  if (c.mode === 'capacidad') return `Cap. ~${fmt(c.maxLoan)} (${fmt(c.netIncome)}/mes)`;
  return '—';
}
function fmt(n?: number): string {
  if (n == null) return '—';
  return new Intl.NumberFormat('es-ES').format(n) + '€';
}

export default function HipotecasAdminPage() {
  const [pwd, setPwd] = useState('');
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [filter, setFilter] = useState<'all' | 'delagala' | 'blanca'>('all');

  const load = useCallback(async (password: string) => {
    const res = await fetch('/api/hipotecas/admin', { headers: { 'x-admin-password': password } });
    if (res.status === 401) { setError('Contraseña incorrecta'); return false; }
    const data = await res.json();
    setLeads(data.leads);
    setStats(data.stats);
    return true;
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const ok = await load(pwd);
    if (ok) setAuthed(true);
  }

  async function setStatus(lead: Lead, status: string) {
    setLeads(ls => ls.map(l => (l.id === lead.id ? { ...l, status } : l)));
    const res = await fetch('/api/hipotecas/admin', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': pwd },
      body: JSON.stringify({ id: lead.id, status }),
    });
    if (!res.ok) { alert('Error al guardar estado'); await load(pwd); }
    else await load(pwd);
  }

  async function remove(lead: Lead) {
    if (!confirm(`¿Borrar el lead de ${lead.lead_name}? No se puede deshacer.`)) return;
    const res = await fetch('/api/hipotecas/admin', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': pwd },
      body: JSON.stringify({ id: lead.id }),
    });
    if (!res.ok) { alert('Error al borrar'); return; }
    await load(pwd);
  }

  useEffect(() => {
    if (authed) {
      const iv = setInterval(() => load(pwd), 30000);
      return () => clearInterval(iv);
    }
  }, [authed, pwd, load]);

  const shown = leads.filter(l => filter === 'all' || l.brand === filter);

  if (!authed) return (
    <div style={{ minHeight: '100vh', background: INK, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Segoe UI',system-ui,sans-serif" }}>
      <div style={{ background: '#fff', padding: '40px 36px', width: 340, borderRadius: 14, borderTop: `4px solid ${ACCENT}` }}>
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>🏠 Hipotecas · Admin</div>
        <div style={{ fontWeight: 500, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: 26 }}>Panel de leads</div>
        <form onSubmit={handleLogin}>
          <input type="password" placeholder="Contraseña" value={pwd} onChange={e => setPwd(e.target.value)} autoFocus
            style={{ width: '100%', padding: '13px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 15, marginBottom: 12, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }} />
          {error && <div style={{ color: '#B91C1C', fontSize: 12, marginBottom: 10 }}>{error}</div>}
          <button type="submit" style={{ width: '100%', padding: 13, background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'inherit', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Entrar</button>
        </form>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#F1F5F9', fontFamily: "'Segoe UI',system-ui,sans-serif", color: INK }}>
      {/* Header */}
      <div style={{ background: INK, padding: '16px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>🏠 Hipotecas</span>
          <span style={{ color: '#475569', fontSize: 12 }}>·</span>
          <span style={{ color: '#94A3B8', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Panel de leads</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <a href="/delagala/hipotecas" target="_blank" style={{ color: '#60A5FA', fontSize: 11, textDecoration: 'none', alignSelf: 'center' }}>🔗 DELAGALA</a>
          <a href="/hipotecas" target="_blank" style={{ color: '#60A5FA', fontSize: 11, textDecoration: 'none', alignSelf: 'center' }}>🔗 Marca blanca</a>
          <button onClick={() => { setAuthed(false); setPwd(''); }} style={{ background: 'none', border: '1px solid #334155', color: '#94A3B8', padding: '6px 14px', borderRadius: 6, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit' }}>Salir</button>
        </div>
      </div>

      <div style={{ padding: 28, maxWidth: 1200, margin: '0 auto' }}>
        {/* Stats */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 24 }}>
            {[
              { label: 'Total leads', value: stats.total },
              { label: 'Sin atender', value: stats.pending, hot: true },
              { label: 'Hoy', value: stats.today },
              { label: 'Esta semana', value: stats.this_week },
              { label: 'Este mes', value: stats.this_month },
            ].map(s => (
              <div key={s.label} style={{ background: '#fff', padding: '18px 20px', borderRadius: 12, borderTop: `3px solid ${s.hot && s.value > 0 ? '#EF4444' : ACCENT}` }}>
                <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1, color: s.hot && s.value > 0 ? '#EF4444' : INK }}>{s.value}</div>
                <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#94A3B8', marginTop: 6 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Brand filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {([
            { k: 'all', label: `Todas (${stats?.total ?? 0})` },
            { k: 'delagala', label: `DELAGALA (${stats?.delagala ?? 0})` },
            { k: 'blanca', label: `Hipoteca Justa (${stats?.blanca ?? 0})` },
          ] as const).map(f => (
            <button key={f.k} onClick={() => setFilter(f.k)}
              style={{ padding: '8px 16px', borderRadius: 999, border: `1.5px solid ${filter === f.k ? ACCENT : '#CBD5E1'}`, background: filter === f.k ? ACCENT : '#fff', color: filter === f.k ? '#fff' : '#475569', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: '#fff', borderRadius: 12, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${INK}` }}>
                {['#', 'Fecha', 'Marca', 'Nombre', 'Contacto', 'Interés', 'Simulación', 'Consent.', 'Estado', ''].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#94A3B8', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 && (
                <tr><td colSpan={10} style={{ padding: '40px 14px', textAlign: 'center', color: '#94A3B8' }}>Aún no hay leads{filter !== 'all' ? ' para esta marca' : ''}.</td></tr>
              )}
              {shown.map((l, i) => (
                <tr key={l.id} style={{ borderBottom: '1px solid #F1F5F9', background: i % 2 === 0 ? '#fff' : '#F8FAFC' }}>
                  <td style={{ padding: '10px 14px', color: '#CBD5E1' }}>{l.id}</td>
                  <td style={{ padding: '10px 14px', color: '#64748B', whiteSpace: 'nowrap' }}>{new Date(l.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: l.brand === 'delagala' ? '#FEF3C7' : '#DBEAFE', color: l.brand === 'delagala' ? '#92400E' : '#1D4ED8', whiteSpace: 'nowrap' }}>{BRAND_LABEL[l.brand]}</span>
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: 600 }}>
                    {l.lead_name}
                    {l.message && <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 400, maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={l.message}>💬 {l.message}</div>}
                  </td>
                  <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                    <a href={`https://wa.me/${l.lead_phone}`} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'monospace', color: ACCENT, textDecoration: 'none' }}>{l.lead_phone}</a>
                    {l.lead_email && <div style={{ fontSize: 11, color: '#64748B' }}>{l.lead_email}</div>}
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 12 }}>{l.service ?? '—'}</td>
                  <td style={{ padding: '10px 14px', fontSize: 11, color: '#475569', whiteSpace: 'nowrap' }}>{calcSummary(l.calc)}</td>
                  <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }} title={l.consent_marketing ? 'Acepta marketing' : 'Solo su solicitud'}>
                    {l.consent_marketing ? '🟢' : '🟡'}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <select value={l.status} onChange={e => setStatus(l, e.target.value)}
                      style={{ border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', background: (STATUS[l.status] ?? STATUS.new).bg, color: (STATUS[l.status] ?? STATUS.new).fg }}>
                      {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <button onClick={() => remove(l)} title="Borrar" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, opacity: 0.5 }}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 12 }}>Se actualiza solo cada 30 s. 🟢 acepta marketing · 🟡 solo su solicitud. El teléfono abre WhatsApp.</p>
      </div>
    </div>
  );
}
