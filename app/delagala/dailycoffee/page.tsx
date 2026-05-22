'use client';

import { useState } from 'react';

const Y = '#F5C842';
const YD = '#E5B520';
const INK = '#0A0A0A';
const BG = '#FFFFFF';
const SOFT = '#FAF7ED';

function DelagalaLogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        {/* D letter */}
        <text x="1" y="42" fontFamily="'Montserrat',Arial Black,sans-serif" fontWeight="900" fontSize="46" fill={Y}>D</text>
        {/* House icon — top right */}
        <g transform="translate(30, 1)">
          <polygon points="9,0 18,8 0,8" fill={Y} />
          <rect x="3" y="8" width="12" height="9" fill={Y} />
        </g>
      </svg>
      <div>
        <div style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 800, fontSize: 15, letterSpacing: '3px', textTransform: 'uppercase', color: INK, lineHeight: 1.1 }}>DELAGALA</div>
        <div style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 500, fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', color: '#6B6B6B' }}>Consultoría Inmobiliaria</div>
      </div>
    </div>
  );
}

export default function DailyCoffeeLanding() {
  const [form, setForm] = useState({ lead_name: '', lead_phone: '', consent_promo: false, consent_marketing: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<{ coupon_id?: number; coupon_code: string; expires_at: string; already_claimed?: boolean } | null>(null);
  const [apiError, setApiError] = useState('');

  function validate() {
    const e: Record<string, string> = {};
    if (!form.lead_name.trim()) e.lead_name = 'Nombre obligatorio';
    if (!form.lead_phone.trim()) e.lead_phone = 'WhatsApp obligatorio';
    if (!form.consent_promo) e.consent_promo = 'Debes aceptar participar en la promoción';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length) { setErrors(v); return; }
    setErrors({});
    setState('loading');
    setApiError('');
    try {
      const res = await fetch('/api/delagala/dailycoffee/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_name: form.lead_name, lead_phone: form.lead_phone, source_url: window.location.href }),
      });
      const data = await res.json();
      if (!res.ok) { setApiError(data.error ?? 'Error al procesar'); setState('error'); return; }
      setResult(data);
      setState('success');
    } catch {
      setApiError('Error de conexión. Inténtalo de nuevo.');
      setState('error');
    }
  }

  function trackWa() {
    if (result?.coupon_id) {
      fetch('/api/delagala/dailycoffee/wa-open', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ coupon_id: result.coupon_id }) });
    }
  }

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        html{scroll-behavior:smooth;}
        body{background:${BG};font-family:'Montserrat',sans-serif;color:${INK};line-height:1.55;overflow-x:hidden;}
        .wrap{max-width:1180px;margin:0 auto;padding:0 32px;}
        @keyframes pulse{0%,100%{opacity:1;}50%{opacity:.35;}}
        @keyframes fadein{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:none;}}
        @media(max-width:880px){
          .news-grid{grid-template-columns:1fr!important;}
          .news-lead{padding-right:28px!important;border-right:none!important;padding-bottom:24px!important;}
          .news-side{padding-left:0!important;}
          .briefs-grid{grid-template-columns:1fr!important;gap:16px!important;}
          .sub-grid{grid-template-columns:1fr!important;gap:40px!important;}
          .steps{grid-template-columns:1fr!important;}
          .step{border-right:none!important;border-bottom:1px solid ${INK}!important;}
          .step:last-child{border-bottom:none!important;}
          .form-card{padding:28px 22px!important;box-shadow:8px 8px 0 ${Y}!important;}
        }
        @media(max-width:520px){
          .wrap{padding:0 20px!important;}
        }
      `}</style>

      {/* LOGO BAR */}
      <div style={{ background: BG, padding: '14px 0', borderBottom: `1px solid #E5E5E0` }}>
        <div className="wrap">
          <DelagalaLogo />
        </div>
      </div>

      {/* DATELINE */}
      <div style={{ background: INK, color: BG, padding: '10px 0', fontFamily: "'Montserrat',sans-serif", fontSize: 11, fontWeight: 500, letterSpacing: '.22em', textTransform: 'uppercase' }}>
        <div className="wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <span>
            <span style={{ color: Y, display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              <span style={{ width: 7, height: 7, background: Y, borderRadius: '50%', display: 'inline-block', animation: 'pulse 1.8s ease-in-out infinite' }} />
              En portada
            </span>
            <span style={{ display: 'inline-block', width: 5, height: 5, background: Y, margin: '0 8px', verticalAlign: 'middle' }} />
            Edición especial — Invitación
          </span>
          <span>Bizkaia · Margen Derecha</span>
        </div>
      </div>

      {/* MASTHEAD */}
      <div className="wrap">
        <header style={{ textAlign: 'center', padding: '38px 0 26px', borderBottom: `4px double ${INK}` }}>
          <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 11, letterSpacing: '.32em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 14 }}>
            <span style={{ display: 'inline-block', width: 24, height: 3, background: Y, verticalAlign: 'middle', margin: '0 10px 3px' }} />
            Un Periódico de DELAGALA Consultoría Inmobiliaria
            <span style={{ display: 'inline-block', width: 24, height: 3, background: Y, verticalAlign: 'middle', margin: '0 10px 3px' }} />
          </div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: 'clamp(56px,11vw,120px)', lineHeight: .9, letterSpacing: '-.025em', fontStyle: 'italic' }}>
            Delagala Daily
          </h1>
          <p style={{ marginTop: 14, fontFamily: "'Montserrat',sans-serif", fontSize: 14, color: '#2A2A2A', letterSpacing: '.04em' }}>
            El pulso del ladrillo en Bizkaia y la Margen Derecha — <span style={{ color: YD, fontWeight: 600 }}>análisis y datos del mercado, cada mañana</span>
          </p>
        </header>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, padding: '12px 0', fontFamily: "'Montserrat',sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: '.22em', textTransform: 'uppercase', borderBottom: `1px solid ${INK}` }}>
          <span>Vol. I <span style={{ color: YD, margin: '0 14px' }}>·</span> Nº 04 <span style={{ color: YD, margin: '0 14px' }}>·</span> Edición Trimestral</span>
          <span>Mayo 2026</span>
          <span>Getxo · Bilbao · Las Arenas · Algorta</span>
        </div>
      </div>

      {/* HERO */}
      <div className="wrap">
        <section style={{ padding: '64px 0 54px', textAlign: 'center', borderBottom: `1px solid ${INK}` }}>
          <span style={{ display: 'inline-block', fontFamily: "'Montserrat',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '.34em', textTransform: 'uppercase', background: Y, color: INK, padding: '7px 14px', marginBottom: 24 }}>
            ★ Invitación personal
          </span>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 'clamp(40px,6.5vw,78px)', lineHeight: 1, letterSpacing: '-.02em', maxWidth: '16ch', margin: '0 auto' }}>
            Un café{' '}
            <span style={{ fontStyle: 'italic', fontWeight: 500, background: `linear-gradient(180deg, transparent 62%, ${Y} 62%)`, padding: '0 4px' }}>de la inmobiliaria</span>
          </h2>
          <p style={{ margin: '24px auto 0', maxWidth: 560, fontSize: 17, lineHeight: 1.6, color: '#2A2A2A' }}>
            Te invitamos a un <strong>café por cortesía de DELAGALA</strong> y te enviamos el{' '}
            <strong>Delagala Daily por WhatsApp</strong>, con el análisis del mercado inmobiliario. Sin compromiso, sin reunión comercial.
          </p>
          <div style={{ marginTop: 34, display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="#registro" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 28px', fontFamily: "'Montserrat',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '.24em', textTransform: 'uppercase', textDecoration: 'none', background: INK, color: BG, boxShadow: `5px 5px 0 ${Y}` }}>
              Reservar mi café →
            </a>
            <a href="#portada" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 28px', fontFamily: "'Montserrat',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '.24em', textTransform: 'uppercase', textDecoration: 'none', background: 'transparent', color: INK, border: `1.5px solid ${INK}` }}>
              Ver qué contiene
            </a>
          </div>
        </section>
      </div>

      {/* EDITION PREVIEW */}
      <div className="wrap" id="portada">
        <section style={{ padding: '60px 0 40px', borderBottom: `1px solid ${INK}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 14, marginBottom: 32, paddingBottom: 14, borderBottom: `2px solid ${INK}` }}>
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 34, letterSpacing: '-.01em', fontStyle: 'italic' }}>En la edición de este mes</h3>
            <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: '.22em', textTransform: 'uppercase', color: '#6B6B6B' }}>
              <span style={{ background: Y, color: INK, padding: '3px 8px', marginRight: 8 }}>Anticipo</span>Solo una muestra
            </span>
          </div>

          <div className="news-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 0 }}>
            <article className="news-lead" style={{ background: SOFT, padding: '24px 32px 24px 28px', borderLeft: `5px solid ${Y}`, borderRight: `1px solid #E5E5E0` }}>
              <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 10, letterSpacing: '.3em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 10 }}>
                <span style={{ display: 'inline-block', width: 7, height: 7, background: Y, verticalAlign: 'middle', marginRight: 8 }} />
                Mercado · Vivienda · Bizkaia
              </div>
              <h4 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 32, lineHeight: 1.05, letterSpacing: '-.015em', marginBottom: 14 }}>
                Bilbao sigue al alza: la vivienda sube un 10,8% interanual en abril
              </h4>
              <p style={{ fontFamily: "'Playfair Display',serif", fontWeight: 400, fontStyle: 'italic', fontSize: 17, lineHeight: 1.4, color: '#2A2A2A', marginBottom: 16 }}>
                La presión sobre la capital empuja la demanda hacia Getxo, Leioa y Barakaldo. ¿Estamos ante un nuevo techo?
              </p>
              <div style={{ display: 'flex', gap: 0, margin: '14px 0', borderTop: `1px solid ${INK}`, borderBottom: `1px solid ${INK}`, padding: '10px 0' }}>
                {[{ n: '+10,8%', l: 'Venta abril', hl: true }, { n: '+5,8%', l: 'Alquiler' }, { n: '~3.721 €', l: '€/m² Bilbao' }].map(k => (
                  <div key={k.l} style={{ flex: 1, textAlign: 'center', borderRight: k.l !== '€/m² Bilbao' ? `1px solid ${INK}` : 'none', padding: '2px 6px' }}>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 800, fontSize: 22, lineHeight: 1, ...(k.hl ? { background: Y, padding: '2px 6px', display: 'inline-block' } : {}) }}>{k.n}</div>
                    <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 8, fontWeight: 600, letterSpacing: '.18em', textTransform: 'uppercase', color: '#6B6B6B', marginTop: 3 }}>{k.l}</div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: '#2A2A2A', fontFamily: "'Montserrat',sans-serif" }}>
                El precio de la vivienda en Bilbao se anotó en abril una subida del 10,8% interanual, consolidando la tendencia del +9% de marzo. El análisis completo, con seis códigos postales y la curva desde 2019, abre la edición impresa de este mes.
              </p>
              <div style={{ marginTop: 14, fontFamily: "'Montserrat',sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: '.2em', textTransform: 'uppercase', color: '#6B6B6B' }}>
                — Análisis de la redacción · Fuente: idealista/news + Fotocasa
              </div>
            </article>

            <div className="news-side" style={{ paddingLeft: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
              {[
                { cat: 'Inversión · Q1 2026', title: 'España rompe la baraja europea: 6.394 M€ invertidos en Q1, +45%', body: 'El segmento Living lidera con 2.386 M€ (+127%), arrastrado por el multifamily/BTR, que concentra el 90% de la inversión residencial. La eurozona, en cambio, cae un 26% de media.', pills: ['6.394 M€', '+45,4%'] },
                { cat: 'Normativa · BOE', title: 'Plan Estatal de Vivienda 2026-2030: 7.000 M€ para cinco años', body: 'El RD 326/2026, publicado en el BOE, despliega ayudas al alquiler, rehabilitación y compra de vivienda protegida. Incluye 12 novedades fiscales que cambian la cuenta de tu vivienda.', pills: ['7.000 M€'] },
              ].map(a => (
                <article key={a.cat} style={{ paddingBottom: 24, borderBottom: `1px solid #E5E5E0` }}>
                  <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 10, letterSpacing: '.3em', textTransform: 'uppercase', color: INK, marginBottom: 10, fontWeight: 700 }}>
                    <span style={{ display: 'inline-block', width: 7, height: 7, background: Y, verticalAlign: 'middle', marginRight: 8 }} />{a.cat}
                  </div>
                  <h4 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 22, lineHeight: 1.15, letterSpacing: '-.01em', marginBottom: 10 }}>{a.title}</h4>
                  <p style={{ fontSize: 14, lineHeight: 1.55, color: '#2A2A2A', fontFamily: "'Montserrat',sans-serif" }}>{a.body}</p>
                  <div style={{ marginTop: 12, display: 'flex', gap: 14, flexWrap: 'wrap', fontFamily: "'Montserrat',sans-serif", fontSize: 10, fontWeight: 500, letterSpacing: '.06em', color: '#6B6B6B', paddingTop: 8, borderTop: '1px dashed #6B6B6B' }}>
                    {a.pills.map(p => <span key={p}><span style={{ display: 'inline-block', background: Y, color: INK, padding: '2px 6px', fontWeight: 700, marginRight: 4 }}>{p}</span></span>)}
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* BRIEFS */}
          <div style={{ marginTop: 42, background: INK, color: BG, padding: '28px 32px' }}>
            <h5 style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 11, fontWeight: 800, letterSpacing: '.3em', textTransform: 'uppercase', color: Y, marginBottom: 18 }}>
              <span style={{ display: 'inline-block', width: 18, height: 2, background: Y, verticalAlign: 'middle', marginRight: 10 }} />
              Otros movimientos en esta edición
            </h5>
            <div className="briefs-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
              {[
                { tag: 'Tinsa · Precios', text: <>La vivienda <strong>se dispara un 15,4%</strong> en abril, la mayor subida desde 2006. Islas (+20,3%) y costa mediterránea (+16,7%) a la cabeza.</> },
                { tag: 'Euríbor · Hipotecas', text: <>El Euríbor se asienta en <strong>~2,85%</strong> y encarece la cuota mensual unos 60 € para una hipoteca media. Mixtas ganan peso como cobertura.</> },
                { tag: 'Margen Derecha · Obra nueva', text: <><strong>Los Tilos de Neguri</strong> (Acciona Inmobiliaria) reactiva la zona premium de Getxo con vivienda contemporánea de estética tradicional.</> },
              ].map(b => (
                <div key={b.tag} style={{ fontSize: 14, lineHeight: 1.5, color: '#D5D5D0', paddingLeft: 14, borderLeft: `2px solid ${Y}`, fontFamily: "'Montserrat',sans-serif" }}>
                  <span style={{ display: 'block', fontSize: 9, letterSpacing: '.28em', textTransform: 'uppercase', color: Y, fontWeight: 700, marginBottom: 5 }}>{b.tag}</span>
                  {b.text}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* SUBSCRIBE / FORM */}
      <section id="registro" style={{ background: INK, color: BG, padding: '80px 0 70px', position: 'relative', marginTop: 50 }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: Y }} />
        <div className="wrap">
          <div className="sub-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>

            {/* COPY */}
            <div>
              <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '.3em', textTransform: 'uppercase', color: Y, marginBottom: 18 }}>
                <span style={{ display: 'inline-block', width: 18, height: 2, background: Y, verticalAlign: 'middle', marginRight: 10 }} />
                Reserva tu invitación
              </div>
              <h3 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 'clamp(38px,5vw,60px)', lineHeight: 1, letterSpacing: '-.025em', marginBottom: 20 }}>
                El café, por nuestra cuenta.{' '}
                <span style={{ fontStyle: 'italic', color: Y }}>Y el Daily, en tu WhatsApp.</span>
              </h3>
              <p style={{ fontSize: 16, lineHeight: 1.65, color: '#D5D5D0', marginBottom: 14 }}>
                Al registrarte recibirás un <strong style={{ color: Y }}>código único</strong> por WhatsApp. Muéstralo en la barra del bar y te invitamos al café — y de paso te llega el <strong style={{ color: Y }}>Delagala Daily por WhatsApp</strong>, listo para leer cuando quieras.
              </p>
              <ul style={{ marginTop: 24, listStyle: 'none' }}>
                {[
                  <><strong>Café gratis</strong>, en el bar del establecimiento.</>,
                  <><strong>El Delagala Daily por WhatsApp</strong>, con el análisis del mercado inmobiliario de Bizkaia.</>,
                  <><strong>Sin compromiso comercial.</strong> No hay reunión obligatoria.</>,
                  <><strong>30 segundos</strong> para registrarte. No hay letra pequeña.</>,
                ].map((item, i) => (
                  <li key={i} style={{ padding: '12px 0', borderTop: '1px solid rgba(255,255,255,.12)', display: 'flex', gap: 14, alignItems: 'flex-start', fontSize: 15, ...(i === 3 ? { borderBottom: '1px solid rgba(255,255,255,.12)' } : {}) }}>
                    <span style={{ flexShrink: 0, width: 22, height: 22, background: Y, color: INK, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, fontFamily: "'Montserrat',sans-serif", marginTop: 1 }}>✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* FORM CARD */}
            <div className="form-card" style={{ background: BG, color: INK, padding: 40, position: 'relative', boxShadow: `14px 14px 0 ${Y}` }}>

              {state !== 'success' ? (
                <form onSubmit={handleSubmit} noValidate>
                  <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '.28em', textTransform: 'uppercase', background: Y, padding: '3px 8px', display: 'inline-block', marginBottom: 10 }}>
                    Activación · Café
                  </div>
                  <h4 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 32, letterSpacing: '-.015em', lineHeight: 1.05, fontStyle: 'italic', marginBottom: 6 }}>
                    Tu invitación
                  </h4>
                  <p style={{ fontSize: 13, color: '#6B6B6B', marginBottom: 22 }}>
                    Solo dos datos. Recibes tu código y el Delagala Daily por WhatsApp en menos de un minuto.
                  </p>

                  {state === 'error' && (
                    <div style={{ background: '#fee', border: '1px solid #fcc', borderRadius: 4, padding: '.6rem 1rem', color: '#c00', fontSize: '.85rem', marginBottom: '1rem' }}>{apiError}</div>
                  )}

                  {[
                    { id: 'lead_name', label: 'Nombre', type: 'text', ph: 'María García' },
                    { id: 'lead_phone', label: 'WhatsApp · aquí recibes el código y el periódico', type: 'tel', ph: '+34 600 00 00 00' },
                  ].map(f => (
                    <div key={f.id} style={{ marginBottom: 14 }}>
                      <label style={{ display: 'block', fontFamily: "'Montserrat',sans-serif", fontWeight: 600, fontSize: 9, letterSpacing: '.24em', textTransform: 'uppercase', color: '#2A2A2A', marginBottom: 5 }}>
                        {f.label}
                      </label>
                      <input
                        type={f.type}
                        placeholder={f.ph}
                        value={(form as unknown as Record<string,string>)[f.id]}
                        onChange={e => setForm(p => ({ ...p, [f.id]: e.target.value }))}
                        style={{ width: '100%', padding: '12px', background: SOFT, border: `1px solid ${INK}`, fontFamily: "'Montserrat',sans-serif", fontSize: 14, color: INK, outline: 'none' }}
                      />
                      {errors[f.id] && <div style={{ color: '#c00', fontSize: '.75rem', marginTop: '.2rem' }}>{errors[f.id]}</div>}
                    </div>
                  ))}

                  <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', margin: '18px 0 10px', fontSize: 12, lineHeight: 1.5, color: '#2A2A2A', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.consent_promo} onChange={e => setForm(p => ({ ...p, consent_promo: e.target.checked }))} style={{ marginTop: 3, flexShrink: 0, width: 16, height: 16, accentColor: YD }} />
                    <span>
                      <strong>Acepto participar en la promoción.</strong> Autorizo a ICA HOME S.L. a tratar mis datos para gestionar esta invitación y enviarme el código del café y el Delagala Daily por WhatsApp.{' '}
                      <a href="mailto:info@idelagala.com" style={{ color: YD, textDecoration: 'underline', fontWeight: 600 }}>info@idelagala.com</a>
                    </span>
                  </label>
                  {errors.consent_promo && <div style={{ color: '#c00', fontSize: '.75rem', marginBottom: '.5rem' }}>{errors.consent_promo}</div>}

                  <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', margin: '0 0 20px', fontSize: 12, lineHeight: 1.5, color: '#2A2A2A', cursor: 'pointer', background: SOFT, padding: 12, borderLeft: `3px solid ${Y}` }}>
                    <input type="checkbox" checked={form.consent_marketing} onChange={e => setForm(p => ({ ...p, consent_marketing: e.target.checked }))} style={{ marginTop: 3, flexShrink: 0, width: 16, height: 16, accentColor: YD }} />
                    <span>
                      <strong>Quiero recibir información inmobiliaria.</strong> Acepto que ICA HOME S.L. me envíe por WhatsApp comunicaciones sobre compraventa, alquiler e inversión.{' '}
                      <span style={{ display: 'inline-block', background: Y, color: INK, fontFamily: "'Montserrat',sans-serif", fontWeight: 700, fontSize: 8, letterSpacing: '.14em', textTransform: 'uppercase', padding: '2px 6px', marginLeft: 2 }}>Opcional</span>
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={state === 'loading'}
                    style={{ width: '100%', padding: 18, background: state === 'loading' ? '#ccc' : INK, color: BG, border: 'none', cursor: state === 'loading' ? 'not-allowed' : 'pointer', fontFamily: "'Montserrat',sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: '.26em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
                  >
                    {state === 'loading' ? 'Enviando…' : 'Reservar mi café →'}
                  </button>

                  <div style={{ marginTop: 16, fontFamily: "'Montserrat',sans-serif", fontSize: 9.5, lineHeight: 1.55, color: '#6B6B6B', padding: '12px 14px', background: SOFT, border: `1px solid #E5E5E0` }}>
                    <strong style={{ color: INK }}>Protección de datos.</strong> Responsable: ICA HOME S.L. · Calle Las Mercedes 17, 48930 Getxo. Finalidad: gestionar la promoción y, si lo autorizas, envío de comunicaciones comerciales. Base jurídica: tu consentimiento. Puedes ejercer tus derechos en <a href="mailto:info@idelagala.com" style={{ color: YD }}>info@idelagala.com</a>.
                  </div>
                </form>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0', animation: 'fadein .5s ease' }}>
                  <div style={{ width: 64, height: 64, background: Y, color: INK, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', fontSize: 34, fontWeight: 800 }}>✓</div>
                  <h4 style={{ fontFamily: "'Playfair Display',serif", fontSize: 32, marginBottom: 10, color: INK, fontStyle: 'italic' }}>
                    {result?.already_claimed ? 'Ya tienes un cupón activo' : '¡Listo! Tu café te espera.'}
                  </h4>
                  <p style={{ color: '#2A2A2A', fontSize: 14, lineHeight: 1.55 }}>
                    En unos segundos recibirás el código y el periódico en tu <strong>WhatsApp</strong>.
                  </p>
                  <div style={{ display: 'inline-block', margin: '18px 0 6px', padding: '14px 24px', background: INK, color: Y, fontFamily: "'Montserrat',sans-serif", fontSize: 22, fontWeight: 700, letterSpacing: '.2em' }}>
                    {result?.coupon_code}
                  </div>
                  <div style={{ display: 'block', fontFamily: "'Montserrat',sans-serif", fontSize: 9, fontWeight: 600, letterSpacing: '.28em', textTransform: 'uppercase', color: '#6B6B6B', marginBottom: 6 }}>
                    Tu código de café
                  </div>
                  {result?.expires_at && (
                    <p style={{ fontSize: 12, color: '#6B6B6B' }}>
                      Válido hasta el <strong>{new Date(result.expires_at).toLocaleDateString('es-ES')}</strong>
                    </p>
                  )}
                  <div style={{ marginTop: 16, background: '#f0faf4', border: '1.5px solid #25D366', borderRadius: 4, padding: '1rem', fontSize: '.85rem', lineHeight: 1.6, textAlign: 'center' }}>
                    💬 <strong>Revisa tu WhatsApp</strong> — te hemos enviado el código ahora mismo
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <div className="wrap">
        <section style={{ padding: '80px 0', textAlign: 'center' }}>
          <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '.3em', textTransform: 'uppercase', color: INK, marginBottom: 14 }}>
            <span style={{ display: 'inline-block', width: 18, height: 2, background: Y, verticalAlign: 'middle', marginRight: 10 }} />
            Cómo funciona
          </div>
          <h3 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 'clamp(34px,4.5vw,56px)', letterSpacing: '-.02em', lineHeight: 1.02, maxWidth: '18ch', margin: '0 auto 50px' }}>
            Tres pasos.{' '}
            <span style={{ fontStyle: 'italic', background: `linear-gradient(180deg, transparent 62%, ${Y} 62%)`, padding: '0 4px' }}>Sin trampas.</span>
          </h3>
          <div className="steps" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0, borderTop: `1px solid ${INK}`, borderBottom: `1px solid ${INK}` }}>
            {[
              { n: '01', title: 'Te registras aquí', body: 'Rellenas el formulario en menos de un minuto. Recibes por WhatsApp tu código de café y el Delagala Daily.' },
              { n: '02', title: 'Muestras el código', body: 'Enseñas el código en la barra del bar. DELAGALA invita — sin pagar nada, sin cita previa.' },
              { n: '03', title: 'Café y periódico', body: 'Disfrutas tu café y recibes el Delagala Daily por WhatsApp, con el análisis del mercado inmobiliario.' },
            ].map((s, i) => (
              <div key={s.n} className="step" style={{ padding: '36px 28px', textAlign: 'left', borderRight: i < 2 ? `1px solid ${INK}` : 'none', position: 'relative' }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: 80, lineHeight: .9, fontStyle: 'italic', marginBottom: 14, position: 'relative', display: 'inline-block' }}>
                  <span style={{ position: 'relative', zIndex: 1 }}>{s.n}</span>
                  <span style={{ position: 'absolute', bottom: 8, left: -4, right: -4, height: 14, background: Y, zIndex: 0 }} />
                </div>
                <h4 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 24, letterSpacing: '-.01em', marginBottom: 10 }}>{s.title}</h4>
                <p style={{ fontSize: 14, color: '#2A2A2A', lineHeight: 1.55 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* FOOTER */}
      <footer style={{ borderTop: `4px double ${INK}`, padding: '42px 0 32px' }}>
        <div className="wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 800, fontSize: 26, letterSpacing: '.01em', fontStyle: 'italic' }}>
            <span style={{ color: YD }}>Delagala</span> Daily
          </div>
          <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 10, fontWeight: 500, letterSpacing: '.18em', textTransform: 'uppercase', color: '#6B6B6B', textAlign: 'right', lineHeight: 1.7 }}>
            © 2026 DELAGALA Consultoría Inmobiliaria · <a href="https://www.idelagala.com" style={{ color: '#6B6B6B', textDecoration: 'none' }}>idelagala.com</a><br />
            Calle Las Mercedes 17, 48930 Getxo · 662 128 409 · info@idelagala.com
          </div>
        </div>
      </footer>
    </>
  );
}
