'use client';
import { useState } from 'react';

const ESTABLECIMIENTO = 'Centro Dietético Las Arenas';
const RAZON_SOCIAL = 'ICA HOME S.L.';
const CIF = 'B10641546';
const DIRECCION = 'Calle Las Mercedes 17, 48930 Getxo';
const EMAIL = 'info@idelagala.com';

export default function HerbolisteriaLanding() {
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<{ coupon_code: string; already_claimed?: boolean } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) { alert('Necesitamos que aceptes participar para enviarte tu bolsa de té.'); return; }
    if (!nombre.trim() || !telefono.trim()) { alert('Rellena tu nombre y tu WhatsApp.'); return; }
    setState('loading');
    setErrorMsg('');
    try {
      const res = await fetch('/api/delagala/dailycoffee/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_name: nombre.trim(),
          lead_phone: telefono.trim(),
          source_url: window.location.href,
          bar_name: ESTABLECIMIENTO,
          consent_marketing: false,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErrorMsg(data.error ?? 'Error al procesar'); setState('error'); return; }
      setResult(data);
      setState('success');
    } catch {
      setErrorMsg('Error de conexión. Inténtalo de nuevo.');
      setState('error');
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700;1,900&family=Montserrat:wght@400;500;600;700;800;900&family=Libre+Baskerville:ital@0;1&display=swap');
        :root{--ink:#0A0A0A;--gold:#F5C842;--gold-dk:#C9A227;--green:#4B7A52;--green-dk:#2F5436;--cream:#FAF7F2;--warm:#EEF1E9;--mid:#8a8372;}
        *{box-sizing:border-box;margin:0;padding:0;}
        html{-webkit-text-size-adjust:100%;}
        body{background:var(--cream);font-family:'Montserrat',sans-serif;color:var(--ink);line-height:1.5;}
        .page{min-height:100svh;display:flex;flex-direction:column;align-items:center;padding:24px 18px 40px;}
        .card{width:100%;max-width:440px;background:#fff;border:2px solid var(--ink);border-top:12px solid var(--green);padding:26px 24px 30px;}
        .logo{text-align:center;border-bottom:1px solid #e7e2d6;padding-bottom:16px;margin-bottom:20px;}
        .logo .name{font-weight:900;font-size:22px;letter-spacing:7px;color:var(--gold-dk);}
        .logo .sub{font-size:10px;letter-spacing:4px;color:var(--mid);text-transform:uppercase;margin-top:3px;}
        .eyebrow{display:inline-block;background:var(--green);color:#fff;font-weight:800;font-size:12px;letter-spacing:2px;text-transform:uppercase;padding:7px 14px;}
        .lead{font-size:30px;margin-top:6px;}
        h1{font-family:'Playfair Display',serif;font-weight:900;font-size:40px;line-height:1.0;margin:14px 0 8px;}
        h1 .g{color:var(--green-dk);font-style:italic;}
        .deck{font-family:'Libre Baskerville',serif;font-style:italic;font-size:16px;color:#45433d;margin-bottom:20px;}
        .deck b{font-weight:700;font-style:normal;}
        label{display:block;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#5a5750;margin:14px 0 6px;}
        input[type=text],input[type=tel]{width:100%;border:2px solid var(--ink);background:var(--warm);padding:14px 14px;font-size:17px;font-family:inherit;}
        input::placeholder{color:#a9a496;}
        .chk{display:flex;gap:10px;align-items:flex-start;margin:18px 0 20px;font-size:13px;color:#45433d;line-height:1.4;}
        .chk input{margin-top:3px;width:20px;height:20px;flex-shrink:0;accent-color:var(--green);}
        .chk a{color:var(--green-dk);}
        button{width:100%;background:var(--gold);color:var(--ink);border:2px solid var(--ink);padding:16px;font-weight:900;font-size:18px;letter-spacing:1px;text-transform:uppercase;cursor:pointer;}
        button:disabled{opacity:.6;cursor:not-allowed;}
        .ok{text-align:center;}
        .ok .big{font-size:46px;margin-bottom:6px;}
        .ok .code{font-family:'Playfair Display',serif;font-weight:900;font-size:34px;letter-spacing:2px;background:var(--warm);border:2px dashed var(--green-dk);padding:14px;margin:14px 0;}
        .ok p{font-size:15px;color:#45433d;line-height:1.5;}
        .err{color:#b3261e;font-size:14px;margin-top:12px;text-align:center;}
        .foot{max-width:440px;margin-top:18px;font-size:11px;color:var(--mid);text-align:center;line-height:1.5;}
        .foot b{color:#6b6b6b;}
      `}</style>
      <div className="page">
        <div className="card">
          <div className="logo">
            <div className="name">DELAGALA</div>
            <div className="sub">Consultoría Inmobiliaria · Getxo</div>
          </div>

          {state !== 'success' ? (
            <>
              <span className="eyebrow">Salud &amp; Bienestar · Regalo</span>
              <div className="lead">🍵🌿</div>
              <h1>Tu <span className="g">bolsa de té</span>, gratis</h1>
              <div className="deck">Suscríbete en 30 segundos y recoge tu té en <b>{ESTABLECIMIENTO}</b>. Te llega el código por WhatsApp al instante.</div>

              <form onSubmit={handleSubmit}>
                <label>Tu nombre</label>
                <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="María García" />
                <label>Tu WhatsApp <span style={{ color: '#4B7A52' }}>· aquí recibes el código</span></label>
                <input type="tel" value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="+34 600 000 000" />
                <div className="chk">
                  <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />
                  <span>Acepto participar. Autorizo a {RAZON_SOCIAL} (CIF {CIF}) a usar mis datos para enviarme por WhatsApp el <b>código de mi bolsa de té</b> y el <b>Delagala Daily</b>. <a href="/delagala/privacidad" target="_blank">Política de privacidad</a>.</span>
                </div>
                <button type="submit" disabled={state === 'loading'}>
                  {state === 'loading' ? 'Enviando…' : 'Quiero mi bolsa de té 🍵'}
                </button>
                {state === 'error' && <div className="err">{errorMsg}</div>}
              </form>
            </>
          ) : (
            <div className="ok">
              <div className="big">🍵</div>
              <h1 style={{ fontSize: 30 }}>{result?.already_claimed ? '¡Ya estabas suscrito!' : '¡Listo!'}</h1>
              <p>{result?.already_claimed ? 'Este es tu código:' : 'Tu código de bolsa de té:'}</p>
              <div className="code">{result?.coupon_code}</div>
              <p>Te lo hemos enviado también por <b>WhatsApp</b>. Enséñaselo en <b>{ESTABLECIMIENTO}</b> y recoge tu té. 🌿</p>
            </div>
          )}
        </div>
        <div className="foot">
          <b>{ESTABLECIMIENTO}</b> · {DIRECCION}<br />
          {RAZON_SOCIAL} · CIF {CIF} · {EMAIL}
        </div>
      </div>
    </>
  );
}
