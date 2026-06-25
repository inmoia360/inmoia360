'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

type Coupon = { id: number; lead_name: string; lead_phone: string; coupon_code: string; status: string; created_at: string; location_name: string | null; consent_marketing?: boolean };
type Loc = { id: number; name: string; city: string | null; coupon_limit: number; is_active: boolean; used_this_month: number };
type Stats = { total: number; this_month: number; this_week: number; today: number };
type Msg = { id: number; wa_from: string; wa_name: string | null; direction: string; body: string; created_at: string };

const GOLD = '#E0A52C';
const INK = '#21404F';

const TABS = {
  pan: { label: '🥖 Pan', endpoint: '/api/admin/dailybread/data', landing: '/delagala/dailybread' },
  cafe: { label: '☕ Café', endpoint: '/api/admin/dailycoffee/data', landing: '/delagala/dailycoffee' },
  mensajes: { label: '💬 Respuestas', endpoint: '/api/admin/messages/data', landing: '' },
} as const;
type TabKey = keyof typeof TABS;

export default function UnifiedAdmin() {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>('pan');
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [locations, setLocations] = useState<Loc[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [nName, setNName] = useState('');
  const [nCity, setNCity] = useState('');
  const [nWa, setNWa] = useState('');
  const [nLimit, setNLimit] = useState('50');
  const [adding, setAdding] = useState(false);
  const [casting, setCasting] = useState(false);
  const [castMsg, setCastMsg] = useState('');
  // Filtros
  const [fLoc, setFLoc] = useState('');
  const [fFrom, setFFrom] = useState('');
  const [fTo, setFTo] = useState('');
  const [fSeg, setFSeg] = useState<'' | 'b' | 'a'>(''); // '' todos · 'b' acepta marketing · 'a' solo promo

  const load = useCallback(async (t: TabKey) => {
    setLoading(true);
    const res = await fetch(TABS[t].endpoint);
    if (res.status === 401) { router.push('/delagala/dailybread/admin/login'); return; }
    const d = await res.json();
    if (t === 'mensajes') {
      setMessages(d.messages ?? []);
    } else {
      setCoupons(d.coupons ?? []); setLocations(d.locations ?? []); setStats(d.stats ?? null);
    }
    setLoading(false);
  }, [router]);

  useEffect(() => { load(tab); setFLoc(''); setFFrom(''); setFTo(''); setFSeg(''); }, [tab, load]);

  const filtered = coupons.filter(c => {
    if (fLoc && (c.location_name ?? '') !== fLoc) return false;
    if (fSeg === 'b' && !c.consent_marketing) return false;
    if (fSeg === 'a' && c.consent_marketing) return false;
    const day = (c.created_at ?? '').slice(0, 10);
    if (fFrom && day < fFrom) return false;
    if (fTo && day > fTo) return false;
    return true;
  });
  const segB = coupons.filter(c => c.consent_marketing).length;

  // Agrupar mensajes en conversaciones por número (messages viene en orden desc)
  const convos: { from: string; name: string | null; msgs: Msg[] }[] = [];
  {
    const idx = new Map<string, number>();
    for (const m of messages) {
      if (!idx.has(m.wa_from)) { idx.set(m.wa_from, convos.length); convos.push({ from: m.wa_from, name: null, msgs: [] }); }
      const cv = convos[idx.get(m.wa_from)!];
      cv.msgs.push(m);
      if (!cv.name && m.wa_name) cv.name = m.wa_name;
    }
    for (const cv of convos) cv.msgs.reverse(); // asc dentro de cada conversación
  }

  async function del(id: number, name: string) {
    if (!confirm(`¿Borrar el registro de "${name}"?`)) return;
    await fetch(`${TABS[tab].endpoint}?id=${id}`, { method: 'DELETE' });
    load(tab);
  }

  async function addLocation() {
    if (!nName.trim()) { alert('Pon el nombre del establecimiento.'); return; }
    setAdding(true);
    const res = await fetch(TABS[tab].endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: nName.trim(), city: nCity.trim(), staff_whatsapp: nWa.trim(), coupon_limit: Number(nLimit) || 50 }),
    });
    setAdding(false);
    if (res.ok) { setNName(''); setNCity(''); setNWa(''); setNLimit('50'); load(tab); }
    else { const d = await res.json(); alert(d.error ?? 'Error al dar de alta'); }
  }

  async function delLocation(id: number, name: string) {
    if (!confirm(`¿Borrar el establecimiento "${name}"?\n\nLos registros que tuviera quedarán sin local asignado (no se borran).`)) return;
    await fetch(`${TABS[tab].endpoint}?kind=location&id=${id}`, { method: 'DELETE' });
    load(tab);
  }

  async function sendReply(to: string, body: string): Promise<boolean> {
    const res = await fetch('/api/admin/messages/send', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, body }),
    });
    if (res.ok) { await load('mensajes'); return true; }
    const d = await res.json().catch(() => ({}));
    alert(d.error ?? 'Error al enviar');
    return false;
  }

  async function broadcastDaily() {
    const quien = tab === 'pan' ? 'Pan (Zapore)' : 'Café';
    if (!confirm(`Vas a ENVIAR el Delagala Daily por WhatsApp a TODOS los registrados de ${quien}.\n\nSe manda a todos (aceptaron el Daily al registrarse). ¿Continuar?`)) return;
    setCasting(true); setCastMsg('Enviando…');
    let offset = 0, sent = 0, failed = 0, total = 0;
    try {
      // bucle por tandas hasta terminar
      for (let i = 0; i < 100; i++) {
        const res = await fetch(`/api/admin/broadcast?campaign=${tab}&offset=${offset}`, { method: 'POST' });
        if (!res.ok) { const e = await res.json().catch(() => ({})); alert(e.error ?? 'Error al enviar'); break; }
        const d = await res.json();
        sent += d.sent; failed += d.failed; total = d.total; offset = d.nextOffset;
        setCastMsg(`Enviando… ${Math.min(offset, total)}/${total}`);
        if (d.done || d.processed === 0) break;
      }
      alert(`Envío terminado 📰\n\nEnviados: ${sent}\nFallidos: ${failed}\nTotal registrados: ${total}`);
    } finally { setCasting(false); setCastMsg(''); }
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
          <div style={{ fontSize: '.7rem', color: GOLD, letterSpacing: 2 }}>PANEL · ADMIN</div>
        </div>
        <div style={{ display: 'flex', gap: '.75rem' }}>
          <a href={TABS[tab].landing} target="_blank" style={{ color: GOLD, fontSize: '.8rem', alignSelf: 'center', textDecoration: 'none' }}>🔗 Ver landing</a>
          <button onClick={logout} style={{ background: 'transparent', border: '1px solid #ffffff55', color: '#fff', borderRadius: 6, padding: '.4rem .8rem', cursor: 'pointer', fontSize: '.8rem' }}>Cerrar sesión</button>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7e7', padding: '0 1.5rem', display: 'flex', gap: '.5rem' }}>
        {(Object.keys(TABS) as TabKey[]).map(k => (
          <button key={k} onClick={() => setTab(k)} style={{
            padding: '.9rem 1.2rem', border: 'none', background: 'transparent', cursor: 'pointer',
            fontSize: '.95rem', fontWeight: 700,
            color: tab === k ? INK : '#9aa7ad',
            borderBottom: tab === k ? `3px solid ${GOLD}` : '3px solid transparent',
          }}>{TABS[k].label}</button>
        ))}
      </div>

      <div style={{ padding: '1.5rem', maxWidth: 1000, margin: '0 auto' }}>
        {loading ? <p>Cargando…</p> : tab === 'mensajes' ? (
          <div>
            <div style={{ marginBottom: '.75rem', fontWeight: 700 }}>💬 Conversaciones ({convos.length})</div>
            {convos.length === 0 && <div style={{ ...card, padding: '1.75rem', textAlign: 'center', color: '#789' }}>Sin mensajes todavía.<br /><span style={{ fontSize: '.85rem' }}>Cuando un lead responda por WhatsApp, aparecerá aquí y podrás contestarle.</span></div>}
            {convos.map(cv => <Conversation key={cv.from} from={cv.from} name={cv.name} msgs={cv.msgs} onReply={sendReply} />)}
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
              {[['Total', stats?.total], ['Este mes', stats?.this_month], ['Esta semana', stats?.this_week], ['Hoy', stats?.today]].map(([l, v]) => (
                <div key={l as string} style={card}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: GOLD }}>{v ?? 0}</div>
                  <div style={{ fontSize: '.75rem', textTransform: 'uppercase', letterSpacing: 1, color: '#789' }}>{l}</div>
                </div>
              ))}
            </div>

            <div style={{ ...card, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', borderLeft: `4px solid ${GOLD}` }}>
              <div>
                <strong>📰 Enviar el Delagala Daily</strong>
                <div style={{ fontSize: '.8rem', color: '#789' }}>Manda el periódico por WhatsApp a TODOS los registrados de {tab === 'pan' ? 'Pan' : 'Café'}.</div>
              </div>
              <button onClick={broadcastDaily} disabled={casting} style={{ background: casting ? '#ccc' : INK, color: '#fff', border: 'none', borderRadius: 8, padding: '.7rem 1.2rem', fontWeight: 700, cursor: casting ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                {casting ? (castMsg || 'Enviando…') : '📰 Enviar a todos'}
              </button>
            </div>

            {locations.map(l => (
              <div key={l.id} style={{ ...card, marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><strong>{tab === 'pan' ? '🥖' : '☕'} {l.name}</strong> <span style={{ color: '#789', fontSize: '.85rem' }}>· {l.city}</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ fontSize: '.85rem', color: '#789' }}>Este mes: <strong style={{ color: INK }}>{l.used_this_month} / {l.coupon_limit}</strong></div>
                  <button onClick={() => delLocation(l.id, l.name)} title="Borrar establecimiento" style={{ background: '#fee', border: '1px solid #fcc', color: '#c00', borderRadius: 6, padding: '.3rem .6rem', cursor: 'pointer', fontSize: '.8rem' }}>🗑️</button>
                </div>
              </div>
            ))}

            {/* Alta de establecimiento */}
            <div style={{ ...card, marginBottom: '1.5rem' }}>
              <div style={{ fontWeight: 700, marginBottom: '.75rem' }}>➕ Dar de alta un {tab === 'pan' ? 'establecimiento (panadería/quesería)' : 'bar'}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr .6fr auto', gap: '.6rem', alignItems: 'end' }}>
                <Field label="Nombre *" value={nName} onChange={setNName} placeholder={tab === 'pan' ? 'Panadería X' : 'Bar X'} />
                <Field label="Ciudad" value={nCity} onChange={setNCity} placeholder="Getxo" />
                <Field label="WhatsApp del local (avisos)" value={nWa} onChange={setNWa} placeholder="34600000000" />
                <Field label="Límite/mes" value={nLimit} onChange={setNLimit} placeholder="50" />
                <button onClick={addLocation} disabled={adding} style={{ background: adding ? '#ccc' : GOLD, color: '#fff', border: 'none', borderRadius: 8, padding: '.6rem 1rem', fontWeight: 700, cursor: adding ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                  {adding ? 'Guardando…' : 'Dar de alta'}
                </button>
              </div>
              <div style={{ fontSize: '.72rem', color: '#9aa7ad', marginTop: '.5rem' }}>El WhatsApp del local es opcional; si lo pones, recibirá un aviso por cada código generado.</div>
            </div>

            <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '.9rem 1.25rem', borderBottom: '1px solid #eee', display: 'flex', flexWrap: 'wrap', gap: '.75rem', alignItems: 'end' }}>
                <div style={{ marginRight: 'auto' }}>
                  <span style={{ fontWeight: 700 }}>Registros ({filtered.length}{filtered.length !== coupons.length ? ` de ${coupons.length}` : ''})</span>
                  <span style={{ fontSize: '.75rem', color: '#15803d', marginLeft: '.6rem', fontWeight: 600 }}>· 🟢 {segB} aceptan marketing</span>
                </div>
                <label style={{ fontSize: '.7rem', color: '#789' }}>Establecimiento<br />
                  <select value={fLoc} onChange={e => setFLoc(e.target.value)} style={{ marginTop: 2, padding: '.4rem .5rem', border: '1.5px solid #d8dede', borderRadius: 6, fontSize: '.85rem' }}>
                    <option value="">Todos</option>
                    {locations.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                  </select>
                </label>
                <label style={{ fontSize: '.7rem', color: '#789' }}>Segmento<br />
                  <select value={fSeg} onChange={e => setFSeg(e.target.value as '' | 'b' | 'a')} style={{ marginTop: 2, padding: '.4rem .5rem', border: '1.5px solid #d8dede', borderRadius: 6, fontSize: '.85rem' }}>
                    <option value="">Todos</option>
                    <option value="b">🟢 Acepta marketing</option>
                    <option value="a">🟡 Solo promo</option>
                  </select>
                </label>
                <label style={{ fontSize: '.7rem', color: '#789' }}>Desde<br />
                  <input type="date" value={fFrom} onChange={e => setFFrom(e.target.value)} style={{ marginTop: 2, padding: '.4rem .5rem', border: '1.5px solid #d8dede', borderRadius: 6, fontSize: '.85rem' }} />
                </label>
                <label style={{ fontSize: '.7rem', color: '#789' }}>Hasta<br />
                  <input type="date" value={fTo} onChange={e => setFTo(e.target.value)} style={{ marginTop: 2, padding: '.4rem .5rem', border: '1.5px solid #d8dede', borderRadius: 6, fontSize: '.85rem' }} />
                </label>
                {(fLoc || fFrom || fTo || fSeg) && (
                  <button onClick={() => { setFLoc(''); setFFrom(''); setFTo(''); setFSeg(''); }} style={{ padding: '.45rem .8rem', border: '1px solid #d8dede', background: '#fff', borderRadius: 6, cursor: 'pointer', fontSize: '.8rem' }}>Limpiar</button>
                )}
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.85rem' }}>
                  <thead>
                    <tr style={{ background: '#fafafa', textAlign: 'left', color: '#789' }}>
                      <th style={{ padding: '.6rem 1rem' }}>Nombre</th>
                      <th style={{ padding: '.6rem 1rem' }}>WhatsApp</th>
                      <th style={{ padding: '.6rem 1rem' }}>Código</th>
                      <th style={{ padding: '.6rem 1rem' }}>Segmento</th>
                      <th style={{ padding: '.6rem 1rem' }}>Local</th>
                      <th style={{ padding: '.6rem 1rem' }}>Fecha</th>
                      <th style={{ padding: '.6rem 1rem' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 && <tr><td colSpan={7} style={{ padding: '1.5rem', textAlign: 'center', color: '#789' }}>Sin registros para este filtro</td></tr>}
                    {filtered.map(c => (
                      <tr key={c.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '.6rem 1rem', fontWeight: 600 }}>{c.lead_name}</td>
                        <td style={{ padding: '.6rem 1rem' }}>{c.lead_phone}</td>
                        <td style={{ padding: '.6rem 1rem', fontFamily: 'monospace' }}>{c.coupon_code}</td>
                        <td style={{ padding: '.6rem 1rem' }}>
                          {c.consent_marketing
                            ? <span title="Aceptó recibir información inmobiliaria" style={{ background: '#dcfce7', color: '#15803d', borderRadius: 20, padding: '.15rem .55rem', fontSize: '.72rem', fontWeight: 700, whiteSpace: 'nowrap' }}>🟢 Marketing</span>
                            : <span title="Solo aceptó la promoción (no enviar oferta comercial)" style={{ background: '#fef9c3', color: '#a16207', borderRadius: 20, padding: '.15rem .55rem', fontSize: '.72rem', fontWeight: 700, whiteSpace: 'nowrap' }}>🟡 Solo promo</span>}
                        </td>
                        <td style={{ padding: '.6rem 1rem', color: '#789' }}>{c.location_name ?? '—'}</td>
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

function Conversation({ from, name, msgs, onReply }: { from: string; name: string | null; msgs: Msg[]; onReply: (to: string, body: string) => Promise<boolean> }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const fmt = (s: string) => new Date(s).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

  async function send() {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    const ok = await onReply(from, body);
    setSending(false);
    if (ok) setText('');
  }

  return (
    <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,.08)', marginBottom: '1rem', overflow: 'hidden' }}>
      <div style={{ background: INK, color: '#fff', padding: '.7rem 1rem' }}>
        <div style={{ fontWeight: 700 }}>{name || from}</div>
        {name && <div style={{ fontSize: '.75rem', color: GOLD }}>{from}</div>}
      </div>
      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '.5rem', maxHeight: 340, overflowY: 'auto', background: '#f7f9f9' }}>
        {msgs.map(m => {
          const out = m.direction === 'out';
          return (
            <div key={m.id} style={{ alignSelf: out ? 'flex-end' : 'flex-start', maxWidth: '78%' }}>
              <div style={{
                background: out ? '#dcf8c6' : '#fff', border: '1px solid ' + (out ? '#c5e8a8' : '#e5e7e7'),
                borderRadius: 10, padding: '.5rem .7rem', fontSize: '.9rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}>{m.body}</div>
              <div style={{ fontSize: '.65rem', color: '#9aa7ad', textAlign: out ? 'right' : 'left', marginTop: 2 }}>{fmt(m.created_at)}</div>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: '.5rem', padding: '.75rem 1rem', borderTop: '1px solid #eee' }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Escribe una respuesta…"
          style={{ flex: 1, border: '1.5px solid #d8dede', borderRadius: 8, padding: '.55rem .7rem', fontSize: '.9rem', outline: 'none' }}
        />
        <button onClick={send} disabled={sending || !text.trim()} style={{ background: sending || !text.trim() ? '#ccc' : GOLD, color: '#fff', border: 'none', borderRadius: 8, padding: '.55rem 1rem', fontWeight: 700, cursor: sending || !text.trim() ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
          {sending ? 'Enviando…' : 'Enviar'}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ display: 'block', fontSize: '.68rem', color: '#789', marginBottom: '.25rem', textTransform: 'uppercase', letterSpacing: '.5px' }}>{label}</span>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', border: '1.5px solid #d8dede', borderRadius: 8, padding: '.5rem .6rem', fontSize: '.9rem', boxSizing: 'border-box', outline: 'none' }} />
    </label>
  );
}
