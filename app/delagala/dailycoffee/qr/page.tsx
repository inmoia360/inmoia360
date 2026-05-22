'use client';

const LANDING_URL = 'https://inmoia360.vercel.app/delagala/dailycoffee#registro';
const QR_URL = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=16&color=0A0A0A&bgcolor=FFFFFF&data=${encodeURIComponent(LANDING_URL)}`;

const Y = '#F5C842';
const YD = '#E5B520';
const INK = '#0A0A0A';

export default function QRPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,800;0,900;1,800&family=Montserrat:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f5f5f5; font-family: 'Montserrat', sans-serif; }
        @media print {
          body { background: #fff; }
          .no-print { display: none !important; }
          .card { box-shadow: none !important; border: 2px solid #0A0A0A !important; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#f5f5f5' }}>
        <div className="card" style={{ width: 400, background: '#fff', padding: '40px 36px 32px', textAlign: 'center', border: `2px solid ${INK}`, boxShadow: `8px 8px 0 ${Y}` }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 24 }}>
            <svg width="42" height="42" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <text x="1" y="42" fontFamily="Montserrat,Arial Black,sans-serif" fontWeight="900" fontSize="46" fill={Y}>D</text>
              <g transform="translate(30,1)">
                <polygon points="9,0 18,8 0,8" fill={Y} />
                <rect x="3" y="8" width="12" height="9" fill={Y} />
              </g>
            </svg>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: 3, textTransform: 'uppercase', lineHeight: 1.1 }}>DELAGALA</div>
              <div style={{ fontWeight: 500, fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: '#6B6B6B' }}>Consultoría Inmobiliaria</div>
            </div>
          </div>

          {/* Badge */}
          <div style={{ background: Y, padding: '6px 16px', display: 'inline-block', marginBottom: 16, fontWeight: 700, fontSize: 11, letterSpacing: '0.28em', textTransform: 'uppercase' }}>
            ★ Invitación
          </div>

          {/* Headline */}
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: 42, lineHeight: 1, letterSpacing: '-0.02em', marginBottom: 12 }}>
            Un café,<br /><span style={{ fontStyle: 'italic' }}>gratis.</span>
          </h1>
          <p style={{ fontSize: 13, color: '#2A2A2A', lineHeight: 1.6, marginBottom: 24 }}>
            Escanea el código, regístrate en 30 segundos<br />
            y recibe tu código por <strong>WhatsApp</strong>.
          </p>

          {/* QR Code */}
          <div style={{ border: `4px solid ${INK}`, display: 'inline-block', padding: 4, marginBottom: 24, background: '#fff' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={QR_URL} alt="QR Daily Coffee DELAGALA" width={210} height={210} style={{ display: 'block' }} />
          </div>

          {/* Steps */}
          <div style={{ display: 'flex', borderTop: `1px solid ${INK}`, borderBottom: `1px solid ${INK}`, padding: '14px 0', marginBottom: 20 }}>
            {[
              { n: '1', t: 'Escanea', d: 'Con la cámara del móvil' },
              { n: '2', t: 'Regístrate', d: 'Nombre y WhatsApp' },
              { n: '3', t: 'Disfruta', d: 'Café por cortesía' },
            ].map((s, i) => (
              <div key={s.n} style={{ flex: 1, textAlign: 'center', borderRight: i < 2 ? `1px solid #E5E5E0` : 'none', padding: '0 8px' }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: 30, lineHeight: 1, fontStyle: 'italic' }}>{s.n}</div>
                <div style={{ fontWeight: 700, fontSize: 10, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{s.t}</div>
                <div style={{ fontSize: 9.5, color: '#6B6B6B', marginTop: 2 }}>{s.d}</div>
              </div>
            ))}
          </div>

          {/* URL */}
          <div style={{ fontSize: 10, color: '#6B6B6B', letterSpacing: '0.08em', marginBottom: 20 }}>
            {LANDING_URL}
          </div>

          {/* Footer */}
          <div style={{ borderTop: `2px solid ${INK}`, paddingTop: 14 }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 800, fontSize: 15, fontStyle: 'italic' }}>
              <span style={{ color: YD }}>Delagala</span> Daily
            </div>
            <div style={{ fontSize: 9, color: '#6B6B6B', marginTop: 4, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              idelagala.com · 662 128 409 · Getxo
            </div>
          </div>
        </div>
      </div>

      {/* Print button */}
      <button
        className="no-print"
        onClick={() => window.print()}
        style={{ position: 'fixed', bottom: 24, right: 24, background: INK, color: '#fff', border: 'none', padding: '14px 28px', fontFamily: 'Montserrat,sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer', letterSpacing: '0.12em', textTransform: 'uppercase', boxShadow: `4px 4px 0 ${Y}` }}
      >
        🖨️ Imprimir
      </button>
    </>
  );
}
