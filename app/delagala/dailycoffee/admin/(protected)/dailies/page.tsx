'use client';
import { useEffect, useState } from 'react';

type Daily = { slug: string; titulo: string; fecha: string };
type LaneInfo = { id: string; titulo: string; url: string; campañas: string };

export default function BibliotecaPage() {
  const [dailies, setDailies] = useState<Daily[]>([]);
  const [lanes, setLanes] = useState<LaneInfo[]>([]);
  const [active, setActive] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [msg, setMsg] = useState<string>('');

  async function load() {
    setLoading(true);
    const r = await fetch('/api/admin/delagala/dailycoffee/dailies');
    const d = await r.json();
    setDailies(d.dailies ?? []);
    setLanes(d.lanes ?? []);
    setActive(d.active ?? {});
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function setActiveSlug(lane: string, slug: string) {
    setSaving(lane); setMsg('');
    const r = await fetch('/api/admin/delagala/dailycoffee/dailies', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lane, slug }),
    });
    const d = await r.json();
    setSaving(null);
    if (!r.ok) { setMsg(d.error ?? 'Error al guardar'); return; }
    setActive(d.active ?? {});
    const t = dailies.find(x => x.slug === slug)?.titulo ?? slug;
    setMsg(`✓ ${lanes.find(l => l.id === lane)?.titulo}: ahora envía «${t}»`);
  }

  const card: React.CSSProperties = { border: '1.5px solid #0A0A0A', background: '#fff', padding: '18px 20px', marginBottom: 18 };
  const chip = (on: boolean): React.CSSProperties => ({
    display: 'inline-flex', flexDirection: 'column', gap: 2, textAlign: 'left',
    border: on ? '2px solid #2F5436' : '1.5px solid #cfc9ba',
    background: on ? '#EEF1E9' : '#fff', color: '#0A0A0A',
    padding: '9px 13px', margin: '4px 6px 4px 0', cursor: on ? 'default' : 'pointer', borderRadius: 2,
  });

  return (
    <div style={{ maxWidth: 820, fontFamily: 'Montserrat, system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, margin: '4px 0 2px' }}>📚 Biblioteca de Dailys</h1>
      <p style={{ color: '#55514a', fontSize: 14, marginBottom: 6 }}>
        Elige qué periódico entrega cada campaña. El botón «Leer el Daily» del WhatsApp pasa a abrir
        el que marques, <b>sin reimprimir carteles ni cambiar el QR</b>. El cambio tarda ~1 minuto.
      </p>
      {msg && <div style={{ background: '#FBF3D6', border: '1.5px solid #C9A227', padding: '8px 12px', fontSize: 14, marginBottom: 12 }}>{msg}</div>}

      {loading ? <p>Cargando…</p> : lanes.map(lane => {
        const act = active[lane.id];
        return (
          <div key={lane.id} style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 17 }}>{lane.titulo}</div>
                <div style={{ fontSize: 12, color: '#8a8372' }}>{lane.campañas} · sirve {lane.url}</div>
              </div>
              <a href={lane.url} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: '#2F5436', fontWeight: 700 }}>Ver el activo ↗</a>
            </div>
            <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap' }}>
              {dailies.map(d => {
                const on = d.slug === act;
                return (
                  <button key={d.slug} style={chip(on)} disabled={on || saving === lane.id}
                    onClick={() => setActiveSlug(lane.id, d.slug)}>
                    <span style={{ fontWeight: 800, fontSize: 13 }}>{on ? '✓ ' : ''}{d.titulo}</span>
                    <span style={{ fontSize: 11, color: '#8a8372' }}>{d.fecha}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
